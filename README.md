# cvf — ATS-compatible CV composer

A local, no-backend tool for composing ATS-friendly CVs. Data lives in plain JSON files;
the browser renders and prints them (Ctrl+P → Save as PDF). No build step, no server-side
code — just static files served locally.

## Launch

Double-click `start.bat`. It starts a local static server (using `npx serve`, so Node.js
must be installed) and opens the app in your browser at `http://localhost:5173`.

A local server (not `file://`) is required because the app uses ES modules and the File
System Access API, both of which need a real HTTP origin.

Chrome or Edge is required for full functionality (open/save files in place). Other
browsers fall back to download-only.

## Workflow

1. **Generate content with AI (optional, manual step):** copy the prompt template in
   [PROMPT.md](PROMPT.md) into any AI chat along with your background info, and paste the
   resulting JSON into a new file under `cvs/`.
2. **Open** that file in cvf via the toolbar's Open button.
3. **Edit** directly from the form panel on the left — every field maps to the JSON. Use
   the ↑/↓ arrows next to a section heading to reorder sections, and the "Hide" checkbox
   to exclude a section from print without deleting its data.
4. **Save** writes back to the same file in place. **Save As** picks a new file (useful for
   forking a role- or language-specific variant, e.g. `resume.fr.json` → `resume.en.json`).
5. **Print / PDF** opens the browser print dialog — choose "Save as PDF". Empty sections
   and fields are automatically omitted from the printed output, and the layout stays
   single-column for ATS parseability.

## Multiple CVs

There's no in-app CV switcher — the native Open dialog *is* the switcher. Keep your
variants (per role, per language) as separate files in `cvs/`:

```
cvs/
  resume.fr.default.json
  resume.en.default.json
  resume.en.acme-corp.json
```

## Project structure

- `index.html` — single page, form panel + live print preview in one DOM
- `js/schema.js` — CV data shape and field definitions (the single source of truth for
  both the form and the render output)
- `js/state.js` — in-memory CV data + subscribe/notify
- `js/fileAccess.js` — File System Access API (open/save/save-as), with a download
  fallback for browsers that don't support it
- `js/render.js` — renders CV data to the printable DOM, skipping hidden/empty sections
- `js/form.js` — renders the editable form panel from the schema
- `js/sections.js` — section reorder and hide/show logic
- `css/app.css` — UI chrome (toolbar, form panel) — not printed
- `css/print.css` — the actual CV styling, used for both the on-screen preview and print
