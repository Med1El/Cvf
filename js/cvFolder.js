import { setCv } from "./state.js";
import { setCurrentHandle } from "./fileAccess.js";

const DB_NAME = "cvf";
const STORE_NAME = "handles";
const HANDLE_KEY = "cvFolder";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Prompts the user to pick the folder holding their CV JSON files, then remembers
// the handle in IndexedDB so future launches can try to reuse it without re-prompting.
export async function pickCvFolder() {
  const handle = await window.showDirectoryPicker();
  await idbSet(HANDLE_KEY, handle);
  return handle;
}

// Tries to reuse the previously picked folder. Returns null if none was ever picked,
// or if the browser requires re-confirming permission (caller should fall back to
// pickCvFolder() in that case, since permission prompts must originate from a click).
export async function reuseCvFolder() {
  const handle = await idbGet(HANDLE_KEY);
  if (!handle) return null;
  const permission = await handle.queryPermission({ mode: "read" });
  if (permission === "granted") return handle;
  return null;
}

// Lists CV JSON files in the given folder, sorted by name.
export async function listCvFiles(folderHandle) {
  const names = [];
  for await (const [name, entry] of folderHandle.entries()) {
    if (entry.kind === "file" && name.endsWith(".json")) names.push(name);
  }
  return names.sort();
}

// Loads a CV JSON file by name from the folder into state, and makes it the active
// save target so a plain "Save" afterward writes back to this same file.
export async function loadCvFile(folderHandle, name) {
  const fileHandle = await folderHandle.getFileHandle(name);
  const file = await fileHandle.getFile();
  const data = JSON.parse(await file.text());
  setCurrentHandle(fileHandle);
  setCv(data);
}
