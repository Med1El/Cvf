import { getStyle, setStyle, resetStyle, subscribeStyle, DEFAULT_STYLE } from "./styleState.js";
import { saveStyleConfig } from "./styleConfig.js";

// Slider definitions — label, state key, range, step, unit displayed next to value.
const SLIDERS = [
	{ label: "Taille des textes",              key: "fontSizePt",        min: 7,   max: 14,  step: 0.5, unit: "pt" },
	{ label: "Taille du nom",                  key: "nameSizePt",           min: 14,  max: 32,  step: 0.5, unit: "pt" },
	{ label: "Taille du titre",                key: "contactTitleSizePt",   min: 9,   max: 24,  step: 0.5, unit: "pt" },
	{ label: "Taille du sous-titre",           key: "contactSubtitleSizePt",min: 7,   max: 16,  step: 0.5, unit: "pt" },
	{ label: "Taille des titres",              key: "titleSizePt",          min: 9,   max: 18,  step: 0.5, unit: "pt" },
	{ label: "Marges entre blocs",             key: "sectionGapRem",     min: 0,   max: 2,   step: 0.05, unit: "rem" },
	{ label: "Marges entre chaque contenu",    key: "entryGapRem",       min: 0,   max: 1.5, step: 0.05, unit: "rem" },
	{ label: "Espacement éléments contact",    key: "contactSpacing",    min: 0,   max: 3,   step: 0.05, unit: "×"   },
	{ label: "Marges intérieures verticales",  key: "padVMm",            min: 5,   max: 40,  step: 1,   unit: "mm" },
	{ label: "Marges intérieures horizontales",key: "padHMm",            min: 5,   max: 35,  step: 1,   unit: "mm" },
	{ label: "Espacement ligne vide",          key: "blankLineHeightPt", min: 0,   max: 20,  step: 1,   unit: "pt" },
];

// Holds references to each <input type="range"> so we can sync them when style changes
// externally (e.g. loading a config, reset).
const inputMap = {};

function buildDrawer(getFolderHandle, getCvName, onSaveStatus) {
	const drawer = document.createElement("div");
	drawer.id = "style-drawer";
	drawer.className = "style-drawer style-drawer-hidden";

	// Header row
	const header = document.createElement("div");
	header.className = "style-drawer-header";

	const title = document.createElement("span");
	title.className = "style-drawer-title";
	title.textContent = "Style";

	const closeBtn = document.createElement("button");
	closeBtn.className = "style-drawer-close";
	closeBtn.textContent = "✕";
	closeBtn.title = "Close";
	closeBtn.addEventListener("click", () => drawer.classList.add("style-drawer-hidden"));

	header.appendChild(title);
	header.appendChild(closeBtn);
	drawer.appendChild(header);

	// Slider rows
	const body = document.createElement("div");
	body.className = "style-drawer-body";

	const style = getStyle();

	SLIDERS.forEach(({ label, key, min, max, step, unit }) => {
		const row = document.createElement("div");
		row.className = "style-slider-row";

		const labelRow = document.createElement("div");
		labelRow.className = "style-slider-label-row";

		const labelEl = document.createElement("label");
		labelEl.className = "style-slider-label";
		labelEl.textContent = label;

		const valueEl = document.createElement("span");
		valueEl.className = "style-slider-value";
		valueEl.textContent = `${style[key]} ${unit}`;

		labelRow.appendChild(labelEl);
		labelRow.appendChild(valueEl);

		const input = document.createElement("input");
		input.type = "range";
		input.className = "style-slider-input";
		input.min = min;
		input.max = max;
		input.step = step;
		input.value = style[key];

		input.addEventListener("input", () => {
			const val = parseFloat(input.value);
			valueEl.textContent = `${val} ${unit}`;
			setStyle({ [key]: val });
		});

		inputMap[key] = { input, valueEl, unit };

		row.appendChild(labelRow);
		row.appendChild(input);
		body.appendChild(row);
	});

	drawer.appendChild(body);

	// Footer: Reset + Save Style buttons
	const footer = document.createElement("div");
	footer.className = "style-drawer-footer";

	const resetBtn = document.createElement("button");
	resetBtn.className = "style-drawer-btn";
	resetBtn.textContent = "Reset";
	resetBtn.title = "Reset to defaults";
	resetBtn.addEventListener("click", () => {
		resetStyle();
	});

	const saveBtn = document.createElement("button");
	saveBtn.className = "style-drawer-btn style-drawer-btn-primary";
	saveBtn.textContent = "Save style";
	saveBtn.title = "Save style settings for this CV";
	saveBtn.addEventListener("click", async () => {
		const folderHandle = getFolderHandle();
		const cvName = getCvName();
		if (!folderHandle || !cvName) {
			onSaveStatus("No CV folder selected — style not saved to disk");
			return;
		}
		await saveStyleConfig(folderHandle, cvName, getStyle());
		onSaveStatus("Style saved");
	});

	footer.appendChild(resetBtn);
	footer.appendChild(saveBtn);
	drawer.appendChild(footer);

	// Keep sliders in sync when style changes externally (load or reset).
	subscribeStyle((s) => {
		for (const { key, unit } of SLIDERS) {
			const entry = inputMap[key];
			if (!entry) continue;
			entry.input.value = s[key];
			entry.valueEl.textContent = `${s[key]} ${unit}`;
		}
	});

	return drawer;
}

// Creates the "Style" toolbar button, builds the drawer, and attaches both to the DOM.
// getFolderHandle / getCvName are getter functions called at save time (late binding).
export function initStyleDrawer(toolbarActionsEl, getFolderHandle, getCvName, onSaveStatus) {
	const toggleBtn = document.createElement("button");
	toggleBtn.id = "btn-style";
	toggleBtn.textContent = "Style";
	toggleBtn.title = "Open style controls";

	const drawer = buildDrawer(getFolderHandle, getCvName, onSaveStatus);
	document.body.appendChild(drawer);

	toggleBtn.addEventListener("click", () => {
		drawer.classList.toggle("style-drawer-hidden");
	});

	toolbarActionsEl.appendChild(toggleBtn);
}
