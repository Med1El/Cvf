import { getCv, notify } from "./state.js";

// Swaps a section with its neighbor above/below in meta.sectionOrder. No-op at the edges.
export function moveSection(key, direction) {
  const order = getCv().meta.sectionOrder;
  const i = order.indexOf(key);
  const j = i + direction;
  if (i === -1 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  notify();
}

export function toggleSectionHidden(key) {
  const hidden = getCv().meta.hiddenSections;
  const i = hidden.indexOf(key);
  if (i === -1) hidden.push(key);
  else hidden.splice(i, 1);
  notify();
}

export function isSectionHidden(key) {
  return getCv().meta.hiddenSections.includes(key);
}

// A section is empty when it has no meaningful content to print — used to auto-hide
// blank sections at print time even if the user hasn't explicitly toggled them off.
export function isSectionEmpty(key) {
  const cv = getCv();
  const value = cv[key];
  if (key === "summary") return !value || !value.trim();
  if (!Array.isArray(value)) return true;
  return value.length === 0;
}
