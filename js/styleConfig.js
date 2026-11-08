// Reads and writes per-CV style configs in a config/ subfolder of the CV folder.
// File path: <cvFolder>/config/<cvBaseName>.config.json
// All functions are no-ops when folderHandle is null (no folder picked yet).

async function getOrCreateConfigFolder(folderHandle) {
	return folderHandle.getDirectoryHandle("config", { create: true });
}

function configFileName(cvName) {
	// Strip .json extension if present, then append .config.json
	const base = cvName.replace(/\.json$/i, "");
	return `${base}.config.json`;
}

// Loads the style config for the given CV. Returns the parsed object, or null if
// no config file exists yet or if folderHandle is null.
export async function loadStyleConfig(folderHandle, cvName) {
	if (!folderHandle || !cvName) return null;
	try {
		const configFolder = await getOrCreateConfigFolder(folderHandle);
		const fileHandle = await configFolder.getFileHandle(configFileName(cvName));
		const file = await fileHandle.getFile();
		return JSON.parse(await file.text());
	} catch {
		// File doesn't exist yet or parse error — treat as no saved config.
		return null;
	}
}

// Saves the style object for the given CV. No-op if folderHandle or cvName is null.
export async function saveStyleConfig(folderHandle, cvName, styleObj) {
	if (!folderHandle || !cvName) return;
	try {
		const configFolder = await getOrCreateConfigFolder(folderHandle);
		const fileHandle = await configFolder.getFileHandle(configFileName(cvName), { create: true });
		const writable = await fileHandle.createWritable();
		await writable.write(JSON.stringify(styleObj, null, 2));
		await writable.close();
	} catch (err) {
		console.warn("Could not save style config:", err);
	}
}
