// Default style values — chosen to match the current print.css exactly so loading
// a CV with no saved config produces zero visual change.
export const DEFAULT_STYLE = {
	fontSizePt: 10.5,       // base text size (pt)
	nameSizePt: 20,         // cv-name
	contactTitleSizePt: 14, // cv-title (job title under name)
	contactSubtitleSizePt: 10.5, // cv-subtitle
	titleSizePt: 11.5,      // cv-section-title
	sectionGapRem: 0.9,     // margin-bottom between sections
	entryGapRem: 0.6,       // margin-bottom between entries
	contactSpacing: 1,      // scale factor for spacing between contact sub-elements (1 = current)
	padVMm: 16,             // page top/bottom padding (mm)
	padHMm: 18,             // page left/right padding (mm)
	blankLineHeightPt: 8,   // height of empty-line spacers in summary
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
