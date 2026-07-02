(() => {
  "use strict";

  /* ---------------- Storage helpers (sync settings, small) ---------------- */
  const store = {
    async get(defaults) {
      return new Promise((resolve) => {
        if (chrome?.storage?.sync) {
          chrome.storage.sync.get(defaults, (items) => resolve(items));
        } else {
          const out = { ...defaults };
          for (const k in defaults) {
            const v = localStorage.getItem("aurora:" + k);
            if (v !== null) out[k] = JSON.parse(v);
          }
          resolve(out);
        }
      });
    },
    async set(obj) {
      return new Promise((resolve) => {
        if (chrome?.storage?.sync) {
          chrome.storage.sync.set(obj, resolve);
        } else {
          for (const k in obj) localStorage.setItem("aurora:" + k, JSON.stringify(obj[k]));
          resolve();
        }
      });
    },
  };

  const cache = {
    async get(key) {
      return new Promise((resolve) => {
        if (chrome?.storage?.local) {
          chrome.storage.local.get([key], (r) => resolve(r[key] ?? null));
        } else {
          const v = localStorage.getItem("aurora-cache:" + key);
          resolve(v ? JSON.parse(v) : null);
        }
      });
    },
    async set(key, value) {
      return new Promise((resolve) => {
        if (chrome?.storage?.local) {
          chrome.storage.local.set({ [key]: value }, resolve);
        } else {
          localStorage.setItem("aurora-cache:" + key, JSON.stringify(value));
          resolve();
        }
      });
    },
  };

  const DEFAULTS = {
    name: "",
    unit: "c",
    clockFormat: "12",
    scrim: 35,
    quickLinksEnabled: true,
    quickLinks: [],
    accent: "sky",
  };

  const ACCENTS = {
    sky: { a: "#a9dcff", b: "#ffc182" },
    mint: { a: "#a4f0c7", b: "#ffe08a" },
    rose: { a: "#ffb3c6", b: "#ffdca8" },
    violet: { a: "#c7b3ff", b: "#8ee3ff" },
    ember: { a: "#ffb27a", b: "#ff8aa5" },
  };

  let settings = { ...DEFAULTS };
  let currentObjectUrl = null;

  /* ---------------- Elements ---------------- */
  const el = {
    bgImage: document.getElementById("bg-image"),
    bgVideo: document.getElementById("bg-video"),
    bgEmpty: document.getElementById("bg-empty"),
    emptyUploadBtn: document.getElementById("empty-upload-btn"),
    panelUploadBtn: document.getElementById("panel-upload-btn"),
    panelRemoveBtn: document.getElementById("panel-remove-btn"),
    fileInput: document.getElementById("file-input"),
    muteToggle: document.getElementById("mute-toggle"),
    iconSoundOn: document.getElementById("icon-sound-on"),
    iconSoundOff: document.getElementById("icon-sound-off"),
    dropIndicator: document.getElementById("drop-indicator"),
    greeting: document.getElementById("greeting-text"),
    dateLine: document.getElementById("date-line"),
    clockTime: document.getElementById("clock-time"),
    clockPeriod: document.getElementById("clock-period"),
    weatherBtn: document.getElementById("weather"),
    weatherIcon: document.getElementById("weather-icon"),
    weatherTemp: document.getElementById("weather-temp"),
    weatherPlace: document.getElementById("weather-place"),
    settingsToggle: document.getElementById("settings-toggle"),
    settingsPanel: document.getElementById("settings-panel"),
    nameInput: document.getElementById("name-input"),
    unitToggle: document.getElementById("unit-toggle"),
    clockToggle: document.getElementById("clock-toggle"),
    scrimSlider: document.getElementById("scrim-slider"),
    accentSwatches: document.getElementById("accent-swatches"),
    backdropMeta: document.getElementById("backdrop-meta"),
    quickLinks: document.getElementById("quick-links"),
    qlinksToggle: document.getElementById("qlinks-toggle"),
    qlinkModal: document.getElementById("qlink-modal-backdrop"),
    qlinkNameInput: document.getElementById("qlink-name-input"),
    qlinkUrlInput: document.getElementById("qlink-url-input"),
    qlinkSaveBtn: document.getElementById("qlink-save-btn"),
    qlinkCancelBtn: document.getElementById("qlink-cancel-btn"),
  };

  const menu = document.getElementById("qlink-menu");

let selectedLink = null;
let selectedElement = null;
let editingId = null;

  /* ---------------- Greeting + date ---------------- */
  function renderGreeting() {
    const hour = new Date().getHours();
    let phrase = "Good Evening,";
    if (hour < 5) phrase = "still up,";
    else if (hour < 12) phrase = "Good Morning,";
    else if (hour < 17) phrase = "Good Afternoon,";
    else if (hour < 21) phrase = "Good Evening,";
    else phrase = "Good Night,";

    const name = settings.name.trim();
    el.greeting.textContent = name ? `${phrase} ${name}` : phrase;

    el.dateLine.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  /* ---------------- Clock ---------------- */
  function renderClock() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");

    if (settings.clockFormat === "12") {
      const period = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      el.clockTime.textContent = `${h}:${m}`;
      el.clockPeriod.textContent = period;
    } else {
      el.clockTime.textContent = `${String(h).padStart(2, "0")}:${m}`;
      el.clockPeriod.textContent = "";
    }
  }

  /* ---------------- Ambient time-of-day gradient (signature element) --- */
  const AMBIENT_STOPS = [
    { hour: 0, css: "linear-gradient(160deg, #14122a 0%, transparent 55%), linear-gradient(340deg, #2c2350 0%, transparent 45%)" },
    { hour: 5, css: "linear-gradient(160deg, #3a2b57 0%, transparent 55%), linear-gradient(340deg, #ff8f6b 0%, transparent 45%)" },
    { hour: 9, css: "linear-gradient(160deg, #274b6b 0%, transparent 55%), linear-gradient(340deg, #ffd88a 0%, transparent 45%)" },
    { hour: 16, css: "linear-gradient(160deg, #2b2152 0%, transparent 55%), linear-gradient(340deg, #ffb06b 0%, transparent 45%)" },
    { hour: 19, css: "linear-gradient(160deg, #2a1a3d 0%, transparent 55%), linear-gradient(340deg, #ff7a6b 0%, transparent 45%)" },
    { hour: 22, css: "linear-gradient(160deg, #14122a 0%, transparent 55%), linear-gradient(340deg, #2c2350 0%, transparent 45%)" },
  ];

  function renderAmbient() {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    let stop = AMBIENT_STOPS[0];
    for (const s of AMBIENT_STOPS) if (hour >= s.hour) stop = s;
    document.getElementById("ambient-overlay").style.background = stop.css;
  }

  /* ---------------- Weather ---------------- */
  const WEATHER_ICON = (code) => {
    if (code === 0) return "☀";
    if ([1, 2].includes(code)) return "🌤";
    if (code === 3) return "☁";
    if ([45, 48].includes(code)) return "🌫";
    if ([51, 53, 55, 56, 57].includes(code)) return "🌦";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄";
    if ([95, 96, 99].includes(code)) return "⛈";
    return "·";
  };

  async function loadWeather(force = false) {
    const cacheKey = "weather:" + settings.unit;
    if (!force) {
      const cached = await cache.get(cacheKey);
      if (cached && Date.now() - cached.at < 30 * 60 * 1000) {
        paintWeather(cached.data);
        return;
      }
    }
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const unitParam = settings.unit === "f" ? "fahrenheit" : "celsius";
        try {
          const [wxRes, placeRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${unitParam}`
            ),
            fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            ).catch(() => null),
          ]);
          const wx = await wxRes.json();
          let place = "";
          if (placeRes && placeRes.ok) {
            const p = await placeRes.json();
            place = p.city || p.locality || p.principalSubdivision || "";
          }
          const data = {
            temp: Math.round(wx.current_weather.temperature),
            code: wx.current_weather.weathercode,
            unit: settings.unit,
            place,
          };
          await cache.set(cacheKey, { at: Date.now(), data });
          paintWeather(data);
        } catch (e) {
          console.warn("Aurora: weather fetch failed", e);
        }
      },
      () => {
        el.weatherBtn.classList.add("hidden");
      },
      { timeout: 8000 }
    );
  }

  function paintWeather(data) {
    el.weatherBtn.classList.remove("hidden");
    el.weatherIcon.textContent = WEATHER_ICON(data.code);
    el.weatherTemp.textContent = `${data.temp}°${data.unit.toUpperCase()}`;
    el.weatherPlace.textContent = data.place || "";
  }

  /* ---------------- Sound ---------------- */
  function updateMuteIcon() {
    const muted = el.bgVideo.muted;
    el.iconSoundOn.style.display = muted ? "none" : "block";
    el.iconSoundOff.style.display = muted ? "block" : "none";
    el.muteToggle.classList.toggle("unmuted", !muted);
    el.muteToggle.title = muted ? "Turn sound on" : "Turn sound off";
  }

  function toggleSound() {
    el.bgVideo.muted = !el.bgVideo.muted;
    // Browsers require a user gesture to allow unmuted playback,
    // this click is that gesture, so play() is safe to (re)call here.
    if (!el.bgVideo.muted) el.bgVideo.play().catch(() => {});
    updateMuteIcon();
  }

  /* ---------------- Backdrop rendering ---------------- */
  function setScrim(value) {
    document.documentElement.style.setProperty("--scrim-strength", value / 100);
  }

  function applyAccent(name) {
    const pair = ACCENTS[name] || ACCENTS.sky;
    document.documentElement.style.setProperty("--accent-a", pair.a);
    document.documentElement.style.setProperty("--accent-b", pair.b);
    if (el.accentSwatches) {
      [...el.accentSwatches.children].forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.accent === name);
      });
    }
  }

  async function paintBackdrop(record) {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }

    el.bgImage.classList.remove("visible");
    el.bgVideo.classList.remove("visible");
    el.bgVideo.pause();
    el.bgVideo.removeAttribute("src");

    if (!record) {
      el.bgEmpty.classList.remove("hidden");
      el.backdropMeta.textContent = "no file set";
      return;
    }

    el.bgEmpty.classList.add("hidden");
    currentObjectUrl = URL.createObjectURL(record.blob);

    if (record.type.startsWith("video/")) {
      el.bgVideo.muted = true;
      el.bgVideo.src = currentObjectUrl;
      el.bgVideo.classList.add("visible");
      el.muteToggle.classList.remove("hidden");
      updateMuteIcon();
    } else {
      el.bgImage.src = currentObjectUrl;
      el.bgImage.classList.add("visible");
      el.muteToggle.classList.add("hidden");
    }

    const sizeMb = (record.size / (1024 * 1024)).toFixed(1);
    el.backdropMeta.textContent = `${record.name || "file"} · ${sizeMb} MB`;
  }

  async function refreshBackdrop() {
    const record = await AuroraDB.getBackdrop();
    await paintBackdrop(record);
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/^image\/|^video\//.test(file.type)) {
      alert("Please choose an image, gif, or video file.");
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (file.type.startsWith("video/") && sizeMb > 300) {
      const ok = confirm(
        `This video is ${sizeMb.toFixed(0)} MB. It'll be stored on this device and decoded ` +
        `every time you open a new tab, which uses more battery and disk space than a photo. Continue?`
      );
      if (!ok) return;
    }
    await AuroraDB.saveBackdrop(file);
    await refreshBackdrop();
  }

  /* ---------------- Quick links ---------------- */
  function normalizeUrl(raw) {
    let url = raw.trim();
    if (!url) return null;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try {
      return new URL(url).href;
    } catch {
      return null;
    }
  }

  function faviconFor(url) {
    try {
      const host = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
    } catch {
      return "";
    }
  }

  function renderQuickLinks() {
    el.quickLinks.classList.toggle("hidden", !settings.quickLinksEnabled);
    el.quickLinks.innerHTML = "";

    settings.quickLinks.forEach((link) => {
      const wrap = document.createElement("div");
      wrap.className = "qlink";
wrap.addEventListener("contextmenu", (e) => {

    e.preventDefault();

    selectedLink = link;
    selectedElement = wrap;

    const x = Math.min(
        e.clientX,
        window.innerWidth - 190
    );

    const y = Math.min(
        e.clientY,
        window.innerHeight - 120
    );

    menu.style.left = x + "px";
    menu.style.top = y + "px";

    menu.classList.remove("hidden");
});
      

      const tile = document.createElement("a");
      tile.className = "qlink-tile";
      tile.href = link.url;
      tile.rel = "noopener";

      const img = document.createElement("img");
      img.src = faviconFor(link.url);
      img.alt = "";
      img.onerror = () => {
        tile.classList.add("fallback");
        tile.textContent = link.name.charAt(0).toUpperCase();
        img.remove();
      };
      tile.appendChild(img);

      const label = document.createElement("span");
      label.className = "qlink-label";
      label.textContent = link.name;

      wrap.append(tile, label);
      el.quickLinks.appendChild(wrap);

      
    });

    const addWrap = document.createElement("div");
    addWrap.className = "qlink";
    const addTile = document.createElement("button");
    addTile.className = "qlink-tile add";
    addTile.id = "qlink-add-tile";
    addTile.textContent = "+";
    addTile.addEventListener("click", openQlinkModal);
    const addLabel = document.createElement("span");
    addLabel.className = "qlink-label";
    addLabel.textContent = "add site";
    addWrap.append(addTile, addLabel);
    el.quickLinks.appendChild(addWrap);
  }

  function openQlinkModal(link = null) {
    editingId = null;

    if (link) {
        editingId = link.id;
        el.qlinkNameInput.value = link.name;
        el.qlinkUrlInput.value = link.url;
        document.getElementById("qlink-modal-title").textContent = "Edit Site";
        el.qlinkSaveBtn.textContent = "Update";
    } else {
        el.qlinkNameInput.value = "";
        el.qlinkUrlInput.value = "";
        document.getElementById("qlink-modal-title").textContent = "Add Site";
        el.qlinkSaveBtn.textContent = "Save";
    }

    el.qlinkModal.classList.remove("hidden");
    el.qlinkNameInput.focus();
  }

  function closeQlinkModal() {
    editingId = null;
    el.qlinkModal.classList.add("hidden");
  }

  async function saveQuickLink() {
    const name = el.qlinkNameInput.value.trim();
    const url = normalizeUrl(el.qlinkUrlInput.value);

    if (!name || !url) {
        alert("Give the site a name and a valid URL.");
        return;
    }

    if (editingId) {
        settings.quickLinks = settings.quickLinks.map(link => {
            if (link.id === editingId) {
                return {
                    ...link,
                    name,
                    url
                };
            }
            return link;
        });
    } else {
        settings.quickLinks.push({
            id: crypto.randomUUID(),
            name,
            url
        });
    }

    await store.set({
        quickLinks: settings.quickLinks
    });

    renderQuickLinks();
    closeQlinkModal();
  }

  async function removeQuickLink(id) {
    settings.quickLinks = settings.quickLinks.filter((l) => l.id !== id);
    await store.set({ quickLinks: settings.quickLinks });
    renderQuickLinks();
  }

  /* ---------------- Settings panel ---------------- */
  function togglePanel(force) {
    const open = force ?? !el.settingsPanel.classList.contains("open");
    el.settingsPanel.classList.toggle("open", open);
    el.settingsToggle.classList.toggle("open", open);
    el.settingsPanel.setAttribute("aria-hidden", String(!open));
  }

  function paintSegmented(container, activeValue, dataAttr) {
    [...container.children].forEach((btn) => {
      btn.classList.toggle("active", btn.dataset[dataAttr] === activeValue);
    });
  }

  /* ---------------- Wiring ---------------- */
  function wireEvents() {
    el.emptyUploadBtn.addEventListener("click", () => el.fileInput.click());
    el.panelUploadBtn.addEventListener("click", () => el.fileInput.click());
    el.fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

    el.panelRemoveBtn.addEventListener("click", async () => {
      await AuroraDB.clearBackdrop();
      await refreshBackdrop();
    });

    el.settingsToggle.addEventListener("click", () => togglePanel());

    document.addEventListener("click", (e) => {
      if (
        el.settingsPanel.classList.contains("open") &&
        !el.settingsPanel.contains(e.target) &&
        e.target !== el.settingsToggle &&
        !el.settingsToggle.contains(e.target)
      ) {
        togglePanel(false);
      }
    });

    el.nameInput.addEventListener("input", async (e) => {
      settings.name = e.target.value;
      renderGreeting();
      await store.set({ name: settings.name });
    });

    el.unitToggle.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-unit]");
      if (!btn) return;
      settings.unit = btn.dataset.unit;
      paintSegmented(el.unitToggle, settings.unit, "unit");
      await store.set({ unit: settings.unit });
      loadWeather(true);
    });

    el.clockToggle.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-format]");
      if (!btn) return;
      settings.clockFormat = btn.dataset.format;
      paintSegmented(el.clockToggle, settings.clockFormat, "format");
      await store.set({ clockFormat: settings.clockFormat });
      renderClock();
    });

    el.scrimSlider.addEventListener("input", async (e) => {
      settings.scrim = Number(e.target.value);
      setScrim(settings.scrim);
      await store.set({ scrim: settings.scrim });
    });

    el.accentSwatches.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-accent]");
      if (!btn) return;
      settings.accent = btn.dataset.accent;
      applyAccent(settings.accent);
      await store.set({ accent: settings.accent });
    });

    el.weatherBtn.addEventListener("click", () => loadWeather(true));
    el.muteToggle.addEventListener("click", toggleSound);

    el.qlinkSaveBtn.addEventListener("click", saveQuickLink);
    el.qlinkCancelBtn.addEventListener("click", closeQlinkModal);
    el.qlinkModal.addEventListener("click", (e) => {
      if (e.target === el.qlinkModal) closeQlinkModal();
    });
    el.qlinkUrlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveQuickLink();
    });

    el.qlinksToggle.addEventListener("change", async (e) => {
      settings.quickLinksEnabled = e.target.checked;
      renderQuickLinks();
      await store.set({ quickLinksEnabled: settings.quickLinksEnabled });
    });

    // Pause background video when the tab isn't visible — saves CPU/battery.
    document.addEventListener("visibilitychange", () => {
      if (!el.bgVideo.classList.contains("visible")) return;
      if (document.hidden) {
        el.bgVideo.pause();
      } else {
        el.bgVideo.play().catch(() => {});
      }
    });

    // Drag & drop anywhere on the page
    let dragDepth = 0;
    document.addEventListener("dragenter", (e) => {
      e.preventDefault();
      dragDepth++;
      document.body.classList.add("dragging");
    });
    document.addEventListener("dragover", (e) => e.preventDefault());
    document.addEventListener("dragleave", () => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) document.body.classList.remove("dragging");
    });
    document.addEventListener("drop", (e) => {
      e.preventDefault();
      dragDepth = 0;
      document.body.classList.remove("dragging");
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    });
    window.addEventListener("click", () => {
    menu.classList.add("hidden");
});
 document.getElementById("edit-link").addEventListener("click", () => {
    if (!selectedLink) return;
    menu.classList.add("hidden");
    openQlinkModal(selectedLink);
});
document.getElementById("delete-link").onclick = async () => {

    if (!selectedLink) return;

    await removeQuickLink(selectedLink.id);

    menu.classList.add("hidden");
};
  }

  /* ---------------- Init ---------------- */
  async function init() {
    settings = await store.get(DEFAULTS);

    el.nameInput.value = settings.name;
    paintSegmented(el.unitToggle, settings.unit, "unit");
    paintSegmented(el.clockToggle, settings.clockFormat, "format");
    el.scrimSlider.value = settings.scrim;
    setScrim(settings.scrim);
    applyAccent(settings.accent);
    el.qlinksToggle.checked = settings.quickLinksEnabled;
    renderQuickLinks();

    wireEvents();
    renderGreeting();
    renderClock();
    renderAmbient();
    await refreshBackdrop();
    loadWeather();

    setInterval(renderClock, 1000);
    setInterval(renderAmbient, 60 * 1000);
    setInterval(renderGreeting, 60 * 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
 
})();