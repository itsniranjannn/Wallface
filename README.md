# Aurora — Personal New Tab

A quiet, personal new tab page for Chrome or Brave. Set your own photo, GIF,
or video (4K and beyond) as the backdrop, with a soft greeting, a clock, and
local weather layered on top.

## Install (Chrome or Brave, unpacked)

1. Unzip this folder somewhere permanent — don't delete it after installing,
   the browser reads the extension straight from these files.
2. Go to `chrome://extensions` (or `brave://extensions`).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped `newtab-extension` folder.
5. Open a new tab — you're in.

## Using it

- **First run:** click "choose a file" (or just drag a file onto the tab) to
  set your backdrop. Images, GIFs, and videos are all supported.
- **Settings:** the small gear in the bottom-right corner opens a panel to
  set your name, replace or remove the backdrop, switch °C/°F, switch
  12h/24h, and dim the backdrop for more contrast.
- **Weather:** the pill in the top-right asks for your location once (used
  only to fetch the forecast — nothing is stored remotely) and refreshes
  every 30 minutes. Click it any time to refresh manually.
- **Storage:** your backdrop file is kept in this browser's local IndexedDB
  storage, not uploaded anywhere. Large 4K videos are fine, but very large
  files take a moment to load on each new tab.

## Files

```
newtab-extension/
├── manifest.json      Chrome/Brave extension manifest (MV3)
├── newtab.html         New tab page markup
├── style.css       All styling
├── db.js             IndexedDB wrapper for the backdrop file
├── newtab.js         Greeting, clock, weather, settings logic
└── icons/               Toolbar/extensions-page icons
```

## Notes

- Works in both Chrome and Brave (same Chromium extension format).
- No external accounts, no analytics, no ads.
- Weather uses the free Open‑Meteo API; place-name lookup uses BigDataCloud's
  free reverse-geocoding endpoint. Both are called directly from your browser.

#### developer
Devloped by NIRANJAN