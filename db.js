/* Minimal IndexedDB wrapper for storing the background media blob.
   chrome.storage has size limits that make it a poor fit for 4K
   video/gif files, so raw blobs live in IndexedDB instead. */

const AuroraDB = (() => {
  const DB_NAME = "aurora-newtab";
  const DB_VERSION = 1;
  const STORE = "backdrop";
  const KEY = "current";

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveBackdrop(file) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(
        {
          blob: file,
          type: file.type,
          name: file.name,
          size: file.size,
          savedAt: Date.now(),
        },
        KEY
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getBackdrop() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function clearBackdrop() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return { saveBackdrop, getBackdrop, clearBackdrop };
})();
