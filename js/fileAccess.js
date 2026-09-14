import { getCv, setCv, markClean } from "./state.js";
import { emptyCv } from "./schema.js";

let currentHandle = null;

const PICKER_OPTS = {
  types: [{ description: "CV JSON", accept: { "application/json": [".json"] } }],
};

// Opens a file via the native picker, parses it as CV JSON, and loads it into state.
// Errors (user cancel, invalid JSON) are caught here since this is a boundary with
// user-driven external input.
export async function openCv(onError) {
  try {
    const [handle] = await window.showOpenFilePicker(PICKER_OPTS);
    const file = await handle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    currentHandle = handle;
    setCv(data);
    return handle.name;
  } catch (err) {
    if (err.name !== "AbortError") onError?.(err.message);
    return null;
  }
}

// Saves to the currently open file handle if one exists, otherwise falls back to Save As.
export async function saveCv(onError) {
  if (!currentHandle) return saveCvAs(onError);
  try {
    const writable = await currentHandle.createWritable();
    await writable.write(JSON.stringify(getCv(), null, 2));
    await writable.close();
    markClean();
    return currentHandle.name;
  } catch (err) {
    if (err.name !== "AbortError") onError?.(err.message);
    return null;
  }
}

// Prompts for a new save location, remembers the handle for subsequent saves.
// Falls back to a plain file download on browsers without File System Access support
// (Firefox/Safari), since there's no handle to hold onto in that case.
export async function saveCvAs(onError) {
  if (!hasFileSystemAccess()) {
    downloadCv();
    return "resume.json";
  }
  try {
    const handle = await window.showSaveFilePicker({
      ...PICKER_OPTS,
      suggestedName: "resume.json",
    });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(getCv(), null, 2));
    await writable.close();
    currentHandle = handle;
    markClean();
    return handle.name;
  } catch (err) {
    if (err.name !== "AbortError") onError?.(err.message);
    return null;
  }
}

function downloadCv() {
  const blob = new Blob([JSON.stringify(getCv(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "resume.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Resets to a blank CV and forgets the current file handle, so the next Save prompts fresh.
export function newCv() {
  currentHandle = null;
  setCv(emptyCv());
}

export function hasFileSystemAccess() {
  return typeof window.showOpenFilePicker === "function";
}

// Lets the CV folder switcher make a freshly loaded file the active save target,
// so a plain "Save" afterward writes back to it.
export function setCurrentHandle(handle) {
  currentHandle = handle;
}
