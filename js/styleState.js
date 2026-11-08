// Default style values — chosen to match the current print.css exactly so loading
// a CV with no saved config produces zero visual change.
export const DEFAULT_STYLE = {
	// ── Basic ────────────────────────────────────────────────────────────────
	fontSizePt: 10.5,
	nameSizePt: 20,
	contactTitleSizePt: 14,
	contactSubtitleSizePt: 10.5,
	titleSizePt: 11.5,
	sectionGapRem: 0.9,
	entryGapRem: 0.6,
	padVMm: 16,
	padHMm: 18,
	// ── Advanced mode flag ───────────────────────────────────────────────────
	advancedMode: false,
	// ── Advanced: contact spacing ────────────────────────────────────────────
	contactNameGapRem: 0.15,
	contactTitleGapRem: 0.2,
	contactSubtitleGapRem: 0.4,
	contactLineGapRem: 0.1,
	// ── Advanced: summary ────────────────────────────────────────────────────
	summaryFontSizePt: 10.5,
	summaryLineHeight: 1.4,
	blankLineHeightPt: 8,
	// ── Advanced: experience ─────────────────────────────────────────────────
	expRoleSizePt: 10.5,
	expLocationInline: false,
	expEntryGapRem: 0.6,
	expDatesSizePt: 9.5,
	expLocationSizePt: 9.5,
	expDescSizePt: 10.5,
	expBulletsSizePt: 10.5,
	expBulletGapRem: 0.12,
	// ── Advanced: skills ─────────────────────────────────────────────────────
	skillsFontSizePt: 10.5,
	skillsRowGapRem: 0.15,
	// ── Advanced: education ──────────────────────────────────────────────────
	eduFontSizePt: 10.5,
	eduEntryGapRem: 0.6,
	eduInline: false,
	// ── Advanced: languages ──────────────────────────────────────────────────
	langFontSizePt: 10.5,
	langLineGapRem: 0.15,
	langInline: false,
};

let current = { ...DEFAULT_STYLE };
const listeners = new Set();

export function getStyle() {
	return { ...current };
}

// Merges a partial patch into current style and notifies subscribers.
export function setStyle(patch) {
	current = { ...current, ...patch };
	for (const fn of listeners) fn(current);
}

export function resetStyle() {
	setStyle({ ...DEFAULT_STYLE });
}

export function subscribeStyle(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
