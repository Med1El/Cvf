// Default empty CV shape, used for "New CV" and as the fallback when loading malformed files.
export function emptyCv() {
  return {
    meta: {
      language: "en",
      sectionOrder: ["summary", "experience", "education", "skills", "projects", "languages"],
      hiddenSections: [],
    },
    contact: { name: "", title: "", subtitle: "", email: "", phone: "", location: "", links: [], photo: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
  };
}

// Describes each repeatable section: its data key, display label, the shape of a blank
// entry (for "+ Add"), and which fields render as single-line vs multi-line/list inputs.
// This is the single place form.js and render.js both read field lists from.
export const SECTIONS = {
  summary: {
    label: { en: "Summary", fr: "Résumé" },
    kind: "text",
  },
  experience: {
    label: { en: "Experience", fr: "Expérience" },
    kind: "list",
    emptyEntry: () => ({ role: "", company: "", location: "", start: "", end: "", bullets: [] }),
    fields: [
      { key: "role", label: "Role" },
      { key: "company", label: "Company" },
      { key: "location", label: "Location" },
      { key: "start", label: "Start" },
      { key: "end", label: "End" },
      { key: "bullets", label: "Bullets", kind: "stringList" },
    ],
  },
  education: {
    label: { en: "Education", fr: "Formation" },
    kind: "list",
    emptyEntry: () => ({ degree: "", institution: "", location: "", start: "", end: "" }),
    fields: [
      { key: "degree", label: "Degree" },
      { key: "institution", label: "Institution" },
      { key: "location", label: "Location" },
      { key: "start", label: "Start" },
      { key: "end", label: "End" },
    ],
  },
  skills: {
    label: { en: "Skills", fr: "Compétences" },
    kind: "list",
    emptyEntry: () => ({ category: "", items: [] }),
    fields: [
      { key: "category", label: "Category" },
      { key: "items", label: "Items", kind: "stringList" },
    ],
  },
  projects: {
    label: { en: "Projects", fr: "Projets" },
    kind: "list",
    emptyEntry: () => ({ name: "", description: "", bullets: [], link: "" }),
    fields: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description" },
      { key: "bullets", label: "Bullets", kind: "stringList" },
      { key: "link", label: "Link" },
    ],
  },
  languages: {
    label: { en: "Languages", fr: "Langues" },
    kind: "list",
    emptyEntry: () => ({ name: "", level: "" }),
    fields: [
      { key: "name", label: "Language" },
      { key: "level", label: "Level" },
    ],
  },
};

export const CONTACT_FIELDS = [
  { key: "name", label: "Name" },
  { key: "title", label: "Title" },
  { key: "subtitle", label: "Subtitle" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
];
