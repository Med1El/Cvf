// Injects (or updates) a single <style> tag that overrides print.css for both
// on-screen preview and @media print / @page, driven by the style state object.
//
// Layout:
//   1. Global/basic rules — always emitted. entryGapRem drives ALL sub-element
//      spacing proportionally so the basic slider moves everything at once.
//   2. Advanced overrides — only emitted when s.advancedMode === true. These rules
//      appear after the global ones so they win in the cascade, giving per-section
//      fine-grained control on top of the global base.

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

// Proportional multipliers so that at entryGapRem=0.6 (the default) every
// sub-element margin reproduces the print.css value exactly.
const R = {
	contactLine: 0.1 / 0.6,   // 0.167 → contact-line / links margin
	rowSpacing:  0.15 / 0.6,  // 0.250 → skill-row / language-line margin
	subItem:     0.2 / 0.6,   // 0.333 → entry-description margin
	bulletsTop:  0.25 / 0.6,  // 0.417 → bullets ul top margin
	bulletItem:  0.12 / 0.6,  // 0.200 → bullet li bottom margin
};

function f(n) { return n.toFixed(3); }

export function applyStyle(s) {
	const el = getOrCreateStyleEl();
	const g = s.entryGapRem;

	el.textContent = `
/* ── Global / Basic ─────────────────────────────────────────────────── */
.cv-preview {
	font-size: ${s.fontSizePt}pt;
	padding: ${s.padVMm}mm ${s.padHMm}mm;
}

.cv-name {
	font-size: ${s.nameSizePt}pt;
	margin-bottom: ${f(R.contactLine * g)}rem;
}

.cv-title {
	font-size: ${s.contactTitleSizePt}pt;
	margin-bottom: ${f(R.subItem * g)}rem;
}

.cv-subtitle {
	font-size: ${s.contactSubtitleSizePt}pt;
	margin-bottom: ${f(R.rowSpacing * g * 2)}rem;
}

.cv-section-title {
	font-size: ${s.titleSizePt}pt;
}

.cv-contact,
.cv-section {
	margin-bottom: ${s.sectionGapRem}rem;
}

.cv-entry {
	margin-bottom: ${g}rem;
}

.cv-contact-line,
.cv-links {
	margin-top: ${f(R.contactLine * g)}rem;
	margin-bottom: ${f(R.contactLine * g)}rem;
}

.cv-entry-location {
	margin: ${f(R.contactLine * g)}rem 0;
}

.cv-entry-description {
	margin: ${f(R.subItem * g)}rem 0;
}

.cv-bullets {
	margin-top: ${f(R.bulletsTop * g)}rem;
}

.cv-bullets li {
	margin-bottom: ${f(R.bulletItem * g)}rem;
}

.cv-skill-row,
.cv-language-line {
	margin: ${f(R.rowSpacing * g)}rem 0;
}

.cv-entry-primary,
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

${s.advancedMode ? `
/* ── Advanced overrides ─────────────────────────────────────────────── */

/* Contact spacing */
.cv-name {
	margin-bottom: ${s.contactNameGapRem}rem;
}

.cv-title {
	margin-bottom: ${s.contactTitleGapRem}rem;
}

.cv-subtitle {
	margin-bottom: ${s.contactSubtitleGapRem}rem;
}

.cv-contact-line,
.cv-links {
	margin-top: ${s.contactLineGapRem}rem;
	margin-bottom: ${s.contactLineGapRem}rem;
}

/* Summary */
.cv-summary-text {
	font-size: ${s.summaryFontSizePt}pt;
	line-height: ${s.summaryLineHeight};
}

.cv-blank-line {
	display: block;
	height: ${s.blankLineHeightPt}pt;
}

/* Experience */
.cv-entry-exp {
	margin-bottom: ${s.expEntryGapRem}rem;
}

.cv-entry-primary {
	font-size: ${s.expRoleSizePt}pt;
}

.cv-entry-dates {
	font-size: ${s.expDatesSizePt}pt;
}

.cv-entry-location {
	font-size: ${s.expLocationSizePt}pt;
}

.cv-entry-description {
	font-size: ${s.expDescSizePt}pt;
}

.cv-bullets li {
	font-size: ${s.expBulletsSizePt}pt;
	margin-bottom: ${s.expBulletGapRem}rem;
}

/* Skills */
.cv-skill-row {
	font-size: ${s.skillsFontSizePt}pt;
	margin: ${s.skillsRowGapRem}rem 0;
}

/* Education */
.cv-entry-edu {
	margin-bottom: ${s.eduEntryGapRem}rem;
}

.cv-entry-edu .cv-entry-primary,
.cv-entry-edu .cv-entry-dates,
.cv-entry-edu .cv-entry-location,
.cv-entry-edu .cv-entry-description,
.cv-entry-edu .cv-bullets li,
.cv-entry-edu-inline {
	font-size: ${s.eduFontSizePt}pt;
}

/* Languages */
.cv-language-line {
	font-size: ${s.langFontSizePt}pt;
	margin: ${s.langLineGapRem}rem 0;
}
` : ""}

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
