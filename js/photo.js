// Shared photo helper: downscales an image data URL to a compact JPEG data URL.
// Used both when a photo is uploaded (keeps the saved JSON small) and when a PDF
// is exported (slims down legacy CVs that already contain a full-resolution photo).

// Bounds the longest side to maxSide pixels and re-encodes as JPEG. A 512px photo
// at quality 0.8 is typically 40-80 KB — versus several MB for a raw phone photo.
export function compressPhoto(dataUrl, maxSide = 512, quality = 0.8) {
	return new Promise((resolve, reject) => {
		if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
			reject(new Error("Not an image"));
			return;
		}
		const img = new Image();
		img.onload = () => {
			try {
				const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
				const w = Math.max(1, Math.round(img.naturalWidth * scale));
				const h = Math.max(1, Math.round(img.naturalHeight * scale));
				const canvas = document.createElement("canvas");
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext("2d");
				// JPEG has no alpha channel — paint white first so transparent
				// PNGs don't come out with a black background.
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, w, h);
				ctx.drawImage(img, 0, 0, w, h);
				resolve(canvas.toDataURL("image/jpeg", quality));
			} catch (err) {
				reject(err);
			}
		};
		img.onerror = () => reject(new Error("Could not decode image"));
		img.src = dataUrl;
	});
}
