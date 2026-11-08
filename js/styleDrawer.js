import { getStyle, setStyle, resetStyle, subscribeStyle } from "./styleState.js";
import { saveStyleConfig } from "./styleConfig.js";

// ── Slider / toggle definitions ───────────────────────────────────────────────

const BASIC_SLIDERS = [
	{ label: "Taille des textes",               key: "fontSizePt",            min: 7,  max: 14,  step: 0.5,  unit: "pt"  },
	{ label: "Taille du nom",                   key: "nameSizePt",            min: 14, max: 32,  step: 0.5,  unit: "pt"  },
	{ label: "Taille du titre",                 key: "contactTitleSizePt",    min: 9,  max: 24,  step: 0.5,  unit: "pt"  },
	{ label: "Taille du sous-titre",            key: "contactSubtitleSizePt", min: 7,  max: 16,  step: 0.5,  unit: "pt"  },
	{ label: "Taille des titres de section",    key: "titleSizePt",           min: 9,  max: 18,  step: 0.5,  unit: "pt"  },
	{ label: "Marges entre blocs",              key: "sectionGapRem",         min: 0,  max: 2,   step: 0.05, unit: "rem" },
	{ label: "Marges entre chaque contenu",     key: "entryGapRem",           min: 0,  max: 1.5, step: 0.05, unit: "rem" },
	{ label: "Marges intérieures verticales",   key: "padVMm",                min: 5,  max: 40,  step: 1,    unit: "mm"  },
	{ label: "Marges intérieures horizontales", key: "padHMm",                min: 5,  max: 35,  step: 1,    unit: "mm"  },
];

// Each advanced group is rendered as a <details> collapsible.
// A group may contain `sliders` and/or `toggles`.
const ADVANCED_GROUPS = [
	{
		label: "Espacement contact",
		sliders: [
			{ label: "Espace nom → titre",        key: "contactNameGapRem",     min: 0, max: 1,   step: 0.01, unit: "rem" },
			{ label: "Espace titre → sous-titre", key: "contactTitleGapRem",    min: 0, max: 1,   step: 0.01, unit: "rem" },
			{ label: "Espace sous-titre → infos", key: "contactSubtitleGapRem", min: 0, max: 1,   step: 0.01, unit: "rem" },
			{ label: "Espace entre infos",        key: "contactLineGapRem",     min: 0, max: 0.5, step: 0.01, unit: "rem" },
		],
	},
	{
		label: "Résumé",
		sliders: [
			{ label: "Taille du texte",       key: "summaryFontSizePt",  min: 7,  max: 14, step: 0.5,  unit: "pt" },
			{ label: "Interligne",            key: "summaryLineHeight",  min: 1,  max: 3,  step: 0.05, unit: "×"  },
			{ label: "Espacement ligne vide", key: "blankLineHeightPt",  min: 0,  max: 20, step: 1,    unit: "pt" },
		],
	},
	{
		label: "Expérience",
		toggles: [
			{ label: "Localisation sur la même ligne que le titre", key: "expLocationInline" },
		],
		sliders: [
			{ label: "Taille rôle / entreprise", key: "expRoleSizePt",    min: 7, max: 14,  step: 0.5,  unit: "pt"  },
			{ label: "Taille dates",             key: "expDatesSizePt",   min: 7, max: 14,  step: 0.5,  unit: "pt"  },
			{ label: "Taille localisation",      key: "expLocationSizePt",min: 7, max: 14,  step: 0.5,  unit: "pt"  },
			{ label: "Taille description",       key: "expDescSizePt",    min: 7, max: 14,  step: 0.5,  unit: "pt"  },
			{ label: "Taille bullets",           key: "expBulletsSizePt", min: 7, max: 14,  step: 0.5,  unit: "pt"  },
			{ label: "Espace entre bullets",     key: "expBulletGapRem",  min: 0, max: 0.5, step: 0.01, unit: "rem" },
			{ label: "Espace entre expériences", key: "expEntryGapRem",   min: 0, max: 2,   step: 0.05, unit: "rem" },
		],
	},
	{
		label: "Compétences",
		sliders: [
			{ label: "Taille du texte",         key: "skillsFontSizePt", min: 7, max: 14,  step: 0.5,  unit: "pt"  },
			{ label: "Espace entre catégories", key: "skillsRowGapRem",  min: 0, max: 0.5, step: 0.01, unit: "rem" },
		],
	},
	{
		label: "Formation",
		toggles: [
			{ label: "Affichage en ligne (diplôme — école   années   ville)", key: "eduInline" },
		],
		sliders: [
			{ label: "Taille du texte",         key: "eduFontSizePt",   min: 7, max: 14,  step: 0.5,  unit: "pt"  },
			{ label: "Espace entre formations", key: "eduEntryGapRem",  min: 0, max: 1.5, step: 0.05, unit: "rem" },
		],
	},
	{
		label: "Langues",
		toggles: [
			{ label: "Toutes les langues sur une ligne", key: "langInline" },
		],
		sliders: [
			{ label: "Taille du texte",     key: "langFontSizePt",  min: 7, max: 14,  step: 0.5,  unit: "pt"  },
			{ label: "Espace entre langues",key: "langLineGapRem",  min: 0, max: 0.5, step: 0.01, unit: "rem" },
		],
	},
];

// ── Widget builders ───────────────────────────────────────────────────────────

// inputMap holds refs to every live input so subscribeStyle can sync them when
// style changes externally (config load, reset).
const inputMap = {};

function makeSliderRow(label, key, min, max, step, unit, currentVal) {
	const row = document.createElement("div");
	row.className = "style-slider-row";

	const labelRow = document.createElement("div");
	labelRow.className = "style-slider-label-row";

	const labelEl = document.createElement("label");
	labelEl.className = "style-slider-label";
	labelEl.textContent = label;

	const valueEl = document.createElement("span");
	valueEl.className = "style-slider-value";
	valueEl.textContent = `${currentVal} ${unit}`;

	labelRow.appendChild(labelEl);
	labelRow.appendChild(valueEl);

	const input = document.createElement("input");
	input.type = "range";
	input.className = "style-slider-input";
	input.min = min;
	input.max = max;
	input.step = step;
	input.value = currentVal;

	input.addEventListener("input", () => {
		const val = parseFloat(input.value);
		valueEl.textContent = `${val} ${unit}`;
		setStyle({ [key]: val });
	});

	inputMap[key] = { input, valueEl, unit, type: "range" };

	row.appendChild(labelRow);
	row.appendChild(input);
	return row;
}

function makeToggleRow(label, key, currentVal) {
	const row = document.createElement("div");
	row.className = "style-toggle-row";

	const labelEl = document.createElement("label");
	labelEl.className = "style-toggle-label";

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.className = "style-toggle-input";
	checkbox.checked = !!currentVal;

	checkbox.addEventListener("change", () => {
		setStyle({ [key]: checkbox.checked });
	});

	inputMap[key] = { input: checkbox, type: "toggle" };

	labelEl.appendChild(checkbox);
	labelEl.appendChild(document.createTextNode(" " + label));
	row.appendChild(labelEl);
	return row;
}

function makeAdvancedGroup({ label, sliders = [], toggles = [] }, s) {
	const details = document.createElement("details");
	details.className = "style-group";

	const summary = document.createElement("summary");
	summary.className = "style-group-summary";
	summary.textContent = label;
	details.appendChild(summary);

	const body = document.createElement("div");
	body.className = "style-group-body";

	// Toggles first
	toggles.forEach(({ label: tLabel, key }) => {
		body.appendChild(makeToggleRow(tLabel, key, s[key]));
	});

	// Then sliders
	sliders.forEach(({ label: sLabel, key, min, max, step, unit }) => {
		body.appendChild(makeSliderRow(sLabel, key, min, max, step, unit, s[key]));
	});

	details.appendChild(body);
	return details;
}

// ── Drawer builder ────────────────────────────────────────────────────────────

function buildDrawer(getFolderHandle, getCvName, onSaveStatus) {
	const drawer = document.createElement("div");
	drawer.id = "style-drawer";
	drawer.className = "style-drawer style-drawer-hidden";

	// Header
	const header = document.createElement("div");
	header.className = "style-drawer-header";
	const titleEl = document.createElement("span");
	titleEl.className = "style-drawer-title";
	titleEl.textContent = "Style";
	const closeBtn = document.createElement("button");
	closeBtn.className = "style-drawer-close";
	closeBtn.textContent = "✕";
	closeBtn.title = "Fermer";
	closeBtn.addEventListener("click", () => drawer.classList.add("style-drawer-hidden"));
	header.appendChild(titleEl);
	header.appendChild(closeBtn);
	drawer.appendChild(header);

	// Scrollable body
	const body = document.createElement("div");
	body.className = "style-drawer-body";

	const s = getStyle();

	// Basic sliders
	BASIC_SLIDERS.forEach(({ label, key, min, max, step, unit }) => {
		body.appendChild(makeSliderRow(label, key, min, max, step, unit, s[key]));
	});

	// ── Advanced mode toggle ──────────────────────────────────────────────
	const advToggleRow = document.createElement("div");
	advToggleRow.className = "style-advanced-toggle-row";
	const advLabel = document.createElement("label");
	advLabel.className = "style-advanced-toggle-label";
	const advCheckbox = document.createElement("input");
	advCheckbox.type = "checkbox";
	advCheckbox.className = "style-advanced-checkbox";
	advCheckbox.checked = !!s.advancedMode;
	advLabel.appendChild(advCheckbox);
	advLabel.appendChild(document.createTextNode(" Mode avancé"));
	advToggleRow.appendChild(advLabel);
	body.appendChild(advToggleRow);

	// ── Advanced groups section ───────────────────────────────────────────
	const advSection = document.createElement("div");
	advSection.className = "style-advanced-section";
	advSection.hidden = !s.advancedMode;

	ADVANCED_GROUPS.forEach((group) => {
		advSection.appendChild(makeAdvancedGroup(group, s));
	});

	body.appendChild(advSection);

	// Wire advanced checkbox after advSection exists
	advCheckbox.addEventListener("change", () => {
		const on = advCheckbox.checked;
		advSection.hidden = !on;
		setStyle({ advancedMode: on });
	});

	drawer.appendChild(body);

	// Footer
	const footer = document.createElement("div");
	footer.className = "style-drawer-footer";

	const resetBtn = document.createElement("button");
	resetBtn.className = "style-drawer-btn";
	resetBtn.textContent = "Reset";
	resetBtn.addEventListener("click", resetStyle);

	const saveBtn = document.createElement("button");
	saveBtn.className = "style-drawer-btn style-drawer-btn-primary";
	saveBtn.textContent = "Sauvegarder";
	saveBtn.addEventListener("click", async () => {
		const folderHandle = getFolderHandle();
		const cvName = getCvName();
		if (!folderHandle || !cvName) {
			onSaveStatus("Aucun dossier CV — style non sauvegardé");
			return;
		}
		await saveStyleConfig(folderHandle, cvName, getStyle());
		onSaveStatus("Style sauvegardé");
	});

	footer.appendChild(resetBtn);
	footer.appendChild(saveBtn);
	drawer.appendChild(footer);

	// Sync all inputs when style changes externally (config load or reset)
	subscribeStyle((s) => {
		for (const [key, entry] of Object.entries(inputMap)) {
			if (!(key in s)) continue;
			if (entry.type === "range") {
				entry.input.value = s[key];
				entry.valueEl.textContent = `${s[key]} ${entry.unit}`;
			} else if (entry.type === "toggle") {
				entry.input.checked = !!s[key];
			}
		}
		// Sync advanced mode toggle and section visibility
		advCheckbox.checked = !!s.advancedMode;
		advSection.hidden = !s.advancedMode;
	});

	return drawer;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initStyleDrawer(toolbarActionsEl, getFolderHandle, getCvName, onSaveStatus) {
	const toggleBtn = document.createElement("button");
	toggleBtn.id = "btn-style";
	toggleBtn.textContent = "Style";
	toggleBtn.title = "Ouvrir les contrôles de style";

	const drawer = buildDrawer(getFolderHandle, getCvName, onSaveStatus);
	document.body.appendChild(drawer);

	toggleBtn.addEventListener("click", () => {
		drawer.classList.toggle("style-drawer-hidden");
	});

	toolbarActionsEl.appendChild(toggleBtn);
}
