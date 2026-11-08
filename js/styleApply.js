// Injects (or updates) a single <style> tag that overrides print.css for both
// on-screen preview and @media print / @page, driven by the style state object.

const STYLE_ID = "cv-style-override";

function getOrCreateStyleEl() {
	let el = document.getElementById(STYLE_ID);
	if (!el) {
		el = document.createElement("style");
		el.id = STYLE_ID;
		document.head.appendChild(el);
	}
	return el;
}

export function applyStyle(s) {
	const el = getOrCreateStyleEl();

	// Font sizes use pt (same unit as print.css).
	// Spacing uses the same units as print.css: rem for margins, mm for page padding.
	el.textContent = `
.cv-preview {
	font-size: ${s.fontSizePt}pt;
	padding: ${s.padVMm}mm ${s.padHMm}mm;
}

.cv-name {
	font-size: ${s.nameSizePt}pt;
}

.cv-section-title {
	font-size: ${s.titleSizePt}pt;
}

.cv-contact,
.cv-section {
	margin-bottom: ${s.sectionGapRem}rem;
}

.cv-name {
	font-size: ${s.nameSizePt}pt;
	margin-bottom: ${(0.15 * s.contactSpacing).toFixed(3)}rem;
}

.cv-title {
	font-size: ${s.contactTitleSizePt}pt;
	margin-bottom: ${(0.2 * s.contactSpacing).toFixed(3)}rem;
}

.cv-subtitle {
	font-size: ${s.contactSubtitleSizePt}pt;
	margin-bottom: ${(0.4 * s.contactSpacing).toFixed(3)}rem;
}

.cv-contact-line,
.cv-links {
	margin-top: ${(0.1 * s.contactSpacing).toFixed(3)}rem;
	margin-bottom: ${(0.1 * s.contactSpacing).toFixed(3)}rem;
}

.cv-entry {
	margin-bottom: ${s.entryGapRem}rem;
}

.cv-entry-primary {
	font-size: ${s.fontSizePt}pt;
}

.cv-entry-description,
.cv-summary-text,
.cv-skill-row,
.cv-language-line {
	font-size: ${s.fontSizePt}pt;
}

.cv-blank-line {
	display: block;
	height: ${s.blankLineHeightPt}pt;
}

@page {
	size: A4;
	margin: ${s.padVMm}mm ${s.padHMm}mm;
}

@media print {
	.cv-preview {
		padding: 0;
	}
}
`.trim();
}
