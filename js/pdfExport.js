import { compressPhoto } from "./photo.js";
import { SECTIONS } from "./schema.js";

// A4 geometry in mm, matching the @page margins in css/print.css.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = { top: 16, right: 18, bottom: 16, left: 18 };
const CONTENT_W = PAGE_W - MARGIN.left - MARGIN.right;

const INK = [17, 24, 39];
const GRAY = [107, 114, 128];
const ACCENT = [37, 99, 235];

function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

async function savePdf(blob, filename) {
	if (typeof window.showSaveFilePicker !== "function") {
		downloadBlob(blob, filename);
		return blob.size;
	}

	const handle = await window.showSaveFilePicker({
		suggestedName: filename,
		types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
	});
	const writable = await handle.createWritable();
	await writable.write(blob);
	await writable.close();
	return blob.size;
}

// Mirrors render.js: an entry counts only when at least one field carries content.
function nonEmptyEntries(value) {
	return (value || []).filter((entry) =>
		Object.values(entry).some((v) => (Array.isArray(v) ? v.some(Boolean) : Boolean(v)))
	);
}

function isSectionEmpty(key, cv) {
	if (key === "summary") return !cv.summary || !cv.summary.trim();
	return nonEmptyEntries(cv[key]).length === 0;
}

// Builds a small vector PDF (real selectable text + one downscaled JPEG photo)
// instead of rasterizing pages to images. Text stays sharp, ATS-parseable, and
// tiny; a typical CV lands around 50-200 KB.
export async function exportCompressedPdf(cv, filename, lang = "en") {
	const JsPdf = window.jspdf?.jsPDF;
	if (!JsPdf) {
		throw new Error("PDF library could not be loaded");
	}

	const doc = new JsPdf({
		unit: "mm",
		format: "a4",
		orientation: "portrait",
		compress: true,
	});
	let y = MARGIN.top;

	const ensure = (need) => {
		if (y + need > PAGE_H - MARGIN.bottom) {
			doc.addPage();
			y = MARGIN.top;
		}
	};

	// Writes wrapped paragraph text, flowing across pages as needed.
	const para = (text, { size = 10.5, style = "normal", color = INK, x = MARGIN.left, width = CONTENT_W, gap = 1.2 } = {}) => {
		doc.setFont("helvetica", style);
		doc.setFontSize(size);
		doc.setTextColor(...color);
		for (const line of doc.splitTextToSize(text, width)) {
			ensure(size * 0.45);
			doc.text(line, x, y);
			y += size * 0.45;
		}
		y += gap;
	};

	const sectionTitle = (label) => {
		ensure(12);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11.5);
		doc.setTextColor(...ACCENT);
		doc.text(label.toUpperCase(), MARGIN.left, y);
		y += 1.8;
		doc.setDrawColor(...ACCENT);
		doc.setLineWidth(0.5);
		doc.line(MARGIN.left, y, MARGIN.left + CONTENT_W, y);
		y += 3;
	};

	// Contact header, with the photo floated right when present.
	const contact = cv.contact || {};
	let photoData = null;
	if (contact.photo) {
		try {
			photoData = await compressPhoto(contact.photo, 300, 0.7);
		} catch {
			photoData = null;
		}
	}
	const textW = photoData ? CONTENT_W - 40 : CONTENT_W;

	if (contact.name) para(contact.name, { size: 20, style: "bold", width: textW, gap: 0.5 });
	if (contact.title) para(contact.title, { size: 14, color: GRAY, width: textW, gap: 0.5 });
	if (contact.subtitle) para(contact.subtitle, { size: 10.5, color: GRAY, width: textW, gap: 0.8 });
	for (const detail of [contact.email, contact.phone, contact.location].filter(Boolean)) {
		para(detail, { size: 9.5, color: GRAY, width: textW, gap: 0.3 });
	}
	for (const link of (contact.links || []).filter((l) => l.url)) {
		para(link.url, { size: 9.5, color: ACCENT, width: textW, gap: 0.3 });
	}
	if (photoData) {
		try {
			doc.addImage(photoData, "JPEG", MARGIN.left + CONTENT_W - 32, MARGIN.top, 32, 32);
			y = Math.max(y, MARGIN.top + 36);
		} catch {
			// Photo decode failed — text is already laid out, just skip the image.
		}
	}
	y += 3;

	for (const key of cv.meta.sectionOrder || []) {
		if ((cv.meta.hiddenSections || []).includes(key)) continue;
		if (isSectionEmpty(key, cv)) continue;
		const def = SECTIONS[key];
		if (!def) continue;
		const label = def.label[lang] || def.label.en;
		sectionTitle(label);

		if (key === "summary") {
			para(cv.summary.trim(), { gap: 2 });
			continue;
		}

		if (key === "skills") {
			for (const row of nonEmptyEntries(cv.skills)) {
				const items = (row.items || []).filter(Boolean).join(", ");
				para(row.category ? `${row.category}: ${items}` : items, { gap: 0.8 });
			}
			y += 1;
			continue;
		}

		if (key === "languages") {
			for (const row of nonEmptyEntries(cv.languages)) {
				para(`- ${row.level ? `${row.name} (${row.level})` : row.name}`, { gap: 0.8 });
			}
			y += 1;
			continue;
		}

		// Generic entries (experience / education / projects): headline with
		// right-aligned dates, then location, description, bullets, link.
		for (const entry of nonEmptyEntries(cv[key])) {
			const primary = [entry[def.fields[0].key], def.fields[1] && entry[def.fields[1].key]]
				.filter(Boolean)
				.join(" — ");
			const dates = [entry.start, entry.end].filter(Boolean).join(" – ");
			if (primary || dates) {
				doc.setFont("helvetica", "normal");
				doc.setFontSize(9.5);
				doc.setTextColor(...GRAY);
				const datesW = dates ? doc.getTextWidth(dates) : 0;
				doc.setFont("helvetica", "bold");
				doc.setFontSize(10.5);
				doc.setTextColor(...INK);
				const lines = primary ? doc.splitTextToSize(primary, CONTENT_W - datesW - (dates ? 4 : 0)) : [""];
				ensure(10.5 * 0.45);
				if (primary) doc.text(lines[0], MARGIN.left, y);
				if (dates) doc.text(dates, MARGIN.left + CONTENT_W - datesW, y);
				y += 10.5 * 0.45;
				for (const rest of lines.slice(1)) {
					ensure(10.5 * 0.45);
					doc.text(rest, MARGIN.left, y);
					y += 10.5 * 0.45;
				}
				y += 0.6;
			}
			if (entry.location) para(entry.location, { size: 9.5, style: "italic", color: GRAY, gap: 0.4 });
			if (entry.description) para(entry.description, { gap: 0.4 });
			const listField = def.fields.find((f) => f.kind === "stringList");
			for (const item of ((listField && entry[listField.key]) || []).filter(Boolean)) {
				para(`• ${item}`, { x: MARGIN.left + 4, width: CONTENT_W - 4, gap: 0.4 });
			}
			if (entry.link) para(entry.link, { size: 9.5, color: ACCENT, gap: 0.4 });
			y += 1.6;
		}
	}

	return savePdf(doc.output("blob"), filename);
}
