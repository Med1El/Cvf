import { getCv, getPreviewLanguage } from "./state.js";
import { SECTIONS } from "./schema.js";
import { isSectionHidden, isSectionEmpty } from "./sections.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderContact(cv) {
  const wrap = el("header", "cv-contact");
  const contact = cv.contact || {};
  const info = el("div", "cv-contact-info");

  if (contact.name) info.appendChild(el("h1", "cv-name", contact.name));
  if (contact.title) info.appendChild(el("p", "cv-title", contact.title));
  if (contact.subtitle) info.appendChild(el("p", "cv-subtitle", contact.subtitle));

  [contact.email, contact.phone, contact.location]
    .filter(Boolean)
    .forEach((detail) => info.appendChild(el("p", "cv-contact-line", detail)));

  const links = (contact.links || []).filter((l) => l.url);
  if (links.length) {
    links.forEach((l) => {
      const p = el("p", "cv-links");
      const a = document.createElement("a");
      a.href = l.url;
      a.textContent = l.label || l.url;
      p.appendChild(a);
      info.appendChild(p);
    });
  }

  wrap.appendChild(info);

  if (contact.photo) {
    const photoWrap = el("div", "cv-photo");
    const img = document.createElement("img");
    img.src = contact.photo;
    img.alt = contact.name || "Profile photo";
    photoWrap.appendChild(img);
    wrap.appendChild(photoWrap);
  }

  return wrap;
}

function renderTextSection(def, value, label) {
  const section = el("section", "cv-section");
  section.appendChild(el("h2", "cv-section-title", label));
  section.appendChild(el("p", "cv-summary-text", value));
  return section;
}

function renderStringList(items) {
  const ul = el("ul", "cv-bullets");
  items.filter(Boolean).forEach((item) => ul.appendChild(el("li", null, item)));
  return ul;
}

function renderEntry(def, entry) {
  const wrap = el("div", "cv-entry");

  // First line: role/degree/category + company/institution, right-aligned dates.
  const primary = entry[def.fields[0].key];
  const secondary = def.fields[1] ? entry[def.fields[1].key] : null;
  const start = entry.start;
  const end = entry.end;

  if (primary || secondary) {
    const head = el("div", "cv-entry-head");
    const left = el("span", "cv-entry-primary", [primary, secondary].filter(Boolean).join(" — "));
    head.appendChild(left);
    if (start || end) {
      head.appendChild(el("span", "cv-entry-dates", [start, end].filter(Boolean).join(" – ")));
    }
    wrap.appendChild(head);
  }

  if (entry.location) wrap.appendChild(el("p", "cv-entry-location", entry.location));
  if (entry.description) wrap.appendChild(el("p", "cv-entry-description", entry.description));

  const listField = def.fields.find((f) => f.kind === "stringList");
  if (listField) {
    const items = (entry[listField.key] || []).filter(Boolean);
    if (items.length) wrap.appendChild(renderStringList(items));
  }

  if (entry.link) {
    const a = document.createElement("a");
    a.href = entry.link;
    a.textContent = entry.link;
    a.className = "cv-entry-link";
    wrap.appendChild(a);
  }

  return wrap;
}

function renderSkillsSection(def, value, label) {
  const section = el("section", "cv-section");
  section.appendChild(el("h2", "cv-section-title", label));
  value
    .filter((row) => row.category || (row.items || []).some(Boolean))
    .forEach((row) => {
      const p = el("p", "cv-skill-row");
      const items = (row.items || []).filter(Boolean).join(", ");
      if (row.category) p.appendChild(el("strong", null, row.category + ": "));
      p.appendChild(document.createTextNode(items));
      section.appendChild(p);
    });
  return section;
}

function renderLanguagesSection(def, value, label) {
  const section = el("section", "cv-section");
  section.appendChild(el("h2", "cv-section-title", label));
  const p = el(
    "p",
    "cv-languages-line",
    value
      .filter((row) => row.name)
      .map((row) => (row.level ? `${row.name} (${row.level})` : row.name))
      .join(" • ")
  );
  section.appendChild(p);
  return section;
}

function renderListSection(key, def, value, label) {
  const nonEmpty = value.filter((entry) =>
    Object.values(entry).some((v) => (Array.isArray(v) ? v.some(Boolean) : Boolean(v)))
  );
  if (!nonEmpty.length) return null;

  if (key === "skills") return renderSkillsSection(def, nonEmpty, label);
  if (key === "languages") return renderLanguagesSection(def, nonEmpty, label);

  const section = el("section", "cv-section");
  section.appendChild(el("h2", "cv-section-title", label));
  nonEmpty.forEach((entry) => section.appendChild(renderEntry(def, entry)));
  return section;
}

// Rebuilds the printable CV DOM from current state, skipping hidden and empty sections
// entirely so print output never shows blank headings or gaps.
export function renderCv(container) {
  const cv = getCv();
  const lang = getPreviewLanguage();
  container.innerHTML = "";
  container.appendChild(renderContact(cv));

  for (const key of cv.meta.sectionOrder) {
    if (isSectionHidden(key)) continue;
    if (isSectionEmpty(key)) continue;

    const def = SECTIONS[key];
    const value = cv[key];
    const label = def.label[lang];
    const node = def.kind === "text" ? renderTextSection(def, value, label) : renderListSection(key, def, value, label);
    if (node) container.appendChild(node);
  }
}
