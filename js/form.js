import { getCv, notify } from "./state.js";
import { SECTIONS, CONTACT_FIELDS } from "./schema.js";
import { moveSection, toggleSectionHidden, isSectionHidden } from "./sections.js";

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function labeledInput(label, value, onInput, multiline = false) {
  const wrap = el("label", "field");
  wrap.appendChild(Object.assign(document.createElement("span"), { className: "field-label", textContent: label }));
  const input = document.createElement(multiline ? "textarea" : "input");
  if (!multiline) input.type = "text";
  input.value = value || "";
  input.addEventListener("input", (e) => onInput(e.target.value));
  wrap.appendChild(input);
  return wrap;
}

function stringListField(label, items, onChange) {
  const wrap = el("div", "field string-list");
  wrap.appendChild(Object.assign(document.createElement("span"), { className: "field-label", textContent: label }));
  const list = el("div", "string-list-items");

  items.forEach((item, i) => {
    const row = el("div", "string-list-row");
    const input = document.createElement("input");
    input.type = "text";
    input.value = item;
    input.addEventListener("input", (e) => {
      items[i] = e.target.value;
      onChange();
    });
    const removeBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "×", className: "btn-remove" });
    removeBtn.addEventListener("click", () => {
      items.splice(i, 1);
      onChange();
      renderForm();
    });
    row.appendChild(input);
    row.appendChild(removeBtn);
    list.appendChild(row);
  });

  wrap.appendChild(list);
  const addBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "+ Add line", className: "btn-add" });
  addBtn.addEventListener("click", () => {
    items.push("");
    onChange();
    renderForm();
  });
  wrap.appendChild(addBtn);
  return wrap;
}

function renderContactForm(cv) {
  const fieldset = el("fieldset", "form-section");
  fieldset.appendChild(Object.assign(document.createElement("legend"), { textContent: "Contact" }));

  const contact = cv.contact || { links: [] };
  if (!cv.contact) cv.contact = contact;
  if (!contact.links) contact.links = [];

  CONTACT_FIELDS.forEach((f) => {
    fieldset.appendChild(
      labeledInput(f.label, contact[f.key], (v) => {
        contact[f.key] = v;
        notify();
      })
    );
  });

  const photoField = el("div", "field");
  photoField.appendChild(Object.assign(document.createElement("span"), { className: "field-label", textContent: "Photo" }));
  const photoInput = document.createElement("input");
  photoInput.type = "file";
  photoInput.accept = "image/*";
  photoInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      contact.photo = reader.result;
      notify();
      renderForm();
    };
    reader.readAsDataURL(file);
  });
  photoField.appendChild(photoInput);

  if (contact.photo) {
    const preview = el("div", "photo-preview");
    const img = document.createElement("img");
    img.src = contact.photo;
    img.alt = "CV photo preview";
    preview.appendChild(img);

    const removeBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "Remove photo", className: "btn-remove" });
    removeBtn.addEventListener("click", () => {
      contact.photo = "";
      notify();
      renderForm();
    });
    preview.appendChild(removeBtn);
    photoField.appendChild(preview);
  }
  fieldset.appendChild(photoField);

  const linksWrap = el("div", "field");
  linksWrap.appendChild(Object.assign(document.createElement("span"), { className: "field-label", textContent: "Links" }));
  contact.links.forEach((link, i) => {
    const row = el("div", "link-row");
    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.placeholder = "Label";
    labelInput.value = link.label;
    labelInput.addEventListener("input", (e) => {
      link.label = e.target.value;
      notify();
    });
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.placeholder = "URL";
    urlInput.value = link.url;
    urlInput.addEventListener("input", (e) => {
      link.url = e.target.value;
      notify();
    });
    const removeBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "×", className: "btn-remove" });
    removeBtn.addEventListener("click", () => {
      contact.links.splice(i, 1);
      notify();
      renderForm();
    });
    row.appendChild(labelInput);
    row.appendChild(urlInput);
    row.appendChild(removeBtn);
    linksWrap.appendChild(row);
  });
  const addLinkBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "+ Add link", className: "btn-add" });
  addLinkBtn.addEventListener("click", () => {
    contact.links.push({ label: "", url: "" });
    notify();
    renderForm();
  });
  linksWrap.appendChild(addLinkBtn);
  fieldset.appendChild(linksWrap);

  return fieldset;
}

function renderSectionHeader(key, def) {
  const header = el("div", "form-section-header");
  header.appendChild(Object.assign(document.createElement("legend"), { textContent: def.label.en }));

  const controls = el("div", "form-section-controls");
  const upBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "↑", title: "Move up" });
  const downBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "↓", title: "Move down" });
  upBtn.addEventListener("click", () => {
    moveSection(key, -1);
    renderForm();
  });
  downBtn.addEventListener("click", () => {
    moveSection(key, 1);
    renderForm();
  });

  const hideLabel = document.createElement("label");
  hideLabel.className = "hide-toggle";
  const hideCheckbox = document.createElement("input");
  hideCheckbox.type = "checkbox";
  hideCheckbox.checked = isSectionHidden(key);
  hideCheckbox.addEventListener("change", () => {
    toggleSectionHidden(key);
    notify();
  });
  hideLabel.appendChild(hideCheckbox);
  hideLabel.appendChild(document.createTextNode(" Hide"));

  controls.appendChild(upBtn);
  controls.appendChild(downBtn);
  controls.appendChild(hideLabel);
  header.appendChild(controls);
  return header;
}

function renderTextSectionForm(key, def, cv) {
  const fieldset = el("fieldset", "form-section");
  fieldset.appendChild(renderSectionHeader(key, def));
  fieldset.appendChild(
    labeledInput("", cv[key], (v) => {
      cv[key] = v;
      notify();
    }, true)
  );
  return fieldset;
}

function renderEntryForm(def, entry, onRemove) {
  const wrap = el("div", "entry-form");
  def.fields.forEach((f) => {
    if (f.kind === "stringList") {
      if (!Array.isArray(entry[f.key])) entry[f.key] = [];
      wrap.appendChild(stringListField(f.label, entry[f.key], notify));
    } else {
      wrap.appendChild(
        labeledInput(f.label, entry[f.key], (v) => {
          entry[f.key] = v;
          notify();
        })
      );
    }
  });
  const removeBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "Remove entry", className: "btn-remove-entry" });
  removeBtn.addEventListener("click", onRemove);
  wrap.appendChild(removeBtn);
  return wrap;
}

function renderListSectionForm(key, def, cv) {
  const fieldset = el("fieldset", "form-section");
  fieldset.appendChild(renderSectionHeader(key, def));

  cv[key].forEach((entry, i) => {
    fieldset.appendChild(
      renderEntryForm(def, entry, () => {
        cv[key].splice(i, 1);
        notify();
        renderForm();
      })
    );
  });

  const addBtn = Object.assign(document.createElement("button"), { type: "button", textContent: `+ Add ${def.label.en.slice(0, -1) || def.label.en}`, className: "btn-add" });
  addBtn.addEventListener("click", () => {
    cv[key].push(def.emptyEntry());
    notify();
    renderForm();
  });
  fieldset.appendChild(addBtn);
  return fieldset;
}

let container = null;

export function initForm(mountEl) {
  container = mountEl;
  renderForm();
}

// Full re-render of the form panel from current state. Called after any structural
// change (add/remove/reorder) since those alter the number of DOM nodes; per-keystroke
// input events update state directly without triggering this.
export function renderForm() {
  if (!container) return;
  const cv = getCv();
  container.innerHTML = "";
  container.appendChild(renderContactForm(cv));

  for (const key of cv.meta.sectionOrder) {
    const def = SECTIONS[key];
    const node = def.kind === "text" ? renderTextSectionForm(key, def, cv) : renderListSectionForm(key, def, cv);
    container.appendChild(node);
  }
}
