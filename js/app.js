import { subscribe, getCv, setCv, isDirty, getPreviewLanguage, togglePreviewLanguage } from "./state.js";
import { renderCv } from "./render.js";
import { initForm, renderForm } from "./form.js";
import { openCv, saveCv, saveCvAs, newCv, hasFileSystemAccess } from "./fileAccess.js";
import { pickCvFolder, reuseCvFolder, listCvFiles, loadCvFile } from "./cvFolder.js";

const preview = document.getElementById("cv-preview");
const statusEl = document.getElementById("status");
const fallbackNotice = document.getElementById("fallback-notice");
const toggleLangBtn = document.getElementById("btn-toggle-lang");
const pickFolderBtn = document.getElementById("btn-pick-folder");
const cvSwitcher = document.getElementById("cv-switcher");
const downloadSampleBtn = document.getElementById("btn-download-sample");

let cvFolder = null;
let currentCvName = null;
let cvLoaded = false;

function setStatus(text) {
	statusEl.textContent = text;
}

function showError(message) {
	setStatus(`Error: ${message}`);
}

// Button always shows the language a click will switch *to*, not the current one.
function syncToggleLangBtn() {
	toggleLangBtn.textContent = getPreviewLanguage() === "en" ? "FR" : "EN";
}

subscribe(() => renderCv(preview));
subscribe(syncToggleLangBtn);

initForm(document.getElementById("form-panel"));
renderCv(preview);
syncToggleLangBtn();

// Lists the CVs in the picked folder and loads the first one, since the dropdown
// always shows a selection and that selection should match what's actually loaded.
async function populateCvSwitcher() {
	const names = await listCvFiles(cvFolder);
	cvSwitcher.innerHTML = "";
	for (const name of names) {
		const option = document.createElement("option");
		option.value = name;
		option.textContent = name;
		cvSwitcher.appendChild(option);
	}
	cvSwitcher.hidden = names.length === 0;
	if (names.length > 0) await switchToCv(names[0]);
}

async function switchToCv(name) {
	await loadCvFile(cvFolder, name);
	currentCvName = name;
	cvLoaded = true;
	renderForm();
	setStatus(`Opened ${name}`);
}

async function loadSampleCv() {
	const response = await fetch("./json/sample-cv.json");
	if (!response.ok) throw new Error(`Could not load sample CV (${response.status})`);
	setCv(await response.json());
	cvLoaded = true;
	renderForm();
	setStatus("Sample CV loaded");
}

function downloadSampleCv() {
	const link = document.createElement("a");
	link.href = "./json/sample-cv.json";
	link.download = "sample-cv.json";
	link.click();
}

// Reuse a previously picked folder first; use the bundled sample only when no CV was loaded.
async function initializeCv() {
	const handle = await reuseCvFolder();
	if (handle) {
		cvFolder = handle;
		await populateCvSwitcher();
	}
	if (!cvLoaded) await loadSampleCv();
}

initializeCv().catch((err) => showError(err.message));

document.getElementById("btn-new").addEventListener("click", () => {
	newCv();
	cvLoaded = true;
	renderForm();
	setStatus("New CV");
});

document.getElementById("btn-open").addEventListener("click", async () => {
	const name = await openCv(showError);
	if (name) {
		currentCvName = name;
		cvLoaded = true;
		renderForm();
		setStatus(`Opened ${name}`);
	}
});

document.getElementById("btn-save").addEventListener("click", async () => {
	const name = await saveCv(showError);
	if (name) setStatus(`Saved ${name}`);
});

document.getElementById("btn-save-as").addEventListener("click", async () => {
	const name = await saveCvAs(showError);
	if (name) setStatus(`Saved as ${name}`);
});

pickFolderBtn.addEventListener("click", async () => {
	try {
		cvFolder = await pickCvFolder();
		await populateCvSwitcher();
		if (!cvLoaded) await loadSampleCv();
		setStatus("CV folder set");
	} catch (err) {
		if (err.name !== "AbortError") showError(err.message);
	}
});

cvSwitcher.addEventListener("change", async () => {
	const name = cvSwitcher.value;
	if (isDirty()) {
		// OK saves and switches; Cancel here means "don't save" (not "cancel the switch"),
		// so a second confirm asks explicitly before discarding, rather than assuming.
		const wantsSave = confirm("You have unsaved changes. Save before switching?");
		if (wantsSave) {
			const saved = await saveCv(showError);
			if (!saved) {
				cvSwitcher.value = currentCvName ?? "";
				return;
			}
		} else {
			const wantsDiscard = confirm("Discard unsaved changes and switch anyway?");
			if (!wantsDiscard) {
				cvSwitcher.value = currentCvName ?? "";
				return;
			}
		}
	}
	await switchToCv(name);
});

toggleLangBtn.addEventListener("click", () => togglePreviewLanguage());
downloadSampleBtn.addEventListener("click", downloadSampleCv);

window.addEventListener("beforeunload", (event) => {
	if (!isDirty()) return;
	event.preventDefault();
	event.returnValue = "";
});

// Turn "Mohamed ELALAMI" into "cv-mohamed-elalami-2026-07-10", which the browser's
// "Save as PDF" dialog proposes as the filename (it derives it from document.title).
function pdfFilename() {
	const slug = (getCv().contact.name || "cv")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	const date = new Date().toLocaleDateString("en-CA");
	return `cv-${slug || "cv"}-${date}`;
}

document.getElementById("btn-print").addEventListener("click", () => {
	const originalTitle = document.title;
	document.title = pdfFilename();
	window.print();
	document.title = originalTitle;
});

if (!hasFileSystemAccess()) {
	fallbackNotice.hidden = false;
	document.getElementById("btn-save").disabled = true;
	document.getElementById("btn-save-as").textContent = "Download JSON";
}
