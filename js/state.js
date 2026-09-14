import { emptyCv } from "./schema.js";

let cv = emptyCv();
const listeners = new Set();

// Tracks whether cv has diverged from the last-loaded/last-saved snapshot, so the
// CV switcher can prompt before discarding unsaved edits.
let dirty = false;

export function isDirty() {
  return dirty;
}

export function markClean() {
  dirty = false;
}

// Print/preview section-title language, independent of cv.meta.language. Toggled
// manually from the toolbar; does not affect form field labels.
let previewLanguage = "en";

export function getPreviewLanguage() {
  return previewLanguage;
}

export function togglePreviewLanguage() {
  previewLanguage = previewLanguage === "en" ? "fr" : "en";
  rerender(); // display-only change: re-render without touching the dirty flag
}

// Returns the live CV data object. Callers mutate it directly, then call notify().
export function getCv() {
  return cv;
}

// Replaces the entire CV data object (used when loading a file or starting a new CV).
// This establishes a fresh clean baseline regardless of any prior unsaved edits.
export function setCv(next) {
  cv = next;
  notify();
  markClean();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function rerender() {
  for (const fn of listeners) fn(cv);
}

// Content edit: re-render and mark the CV as having unsaved changes.
export function notify() {
  dirty = true;
  rerender();
}
