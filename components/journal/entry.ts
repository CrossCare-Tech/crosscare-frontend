// A journal entry as passed between the timeline, entry and edit screens.
// The API stores photos and notes separately; `kind` says which one this is.
export type JournalEntryParam = {
  id: string;
  kind: "photo" | "note";
  title: string; // photo caption, or note title
  description?: string; // note text
  imageUrl?: string;
  date: string; // ISO string
};

// The notes list endpoint cuts descriptions to 30 characters plus " ...".
// Editing such a note would overwrite the full text, so it has to be detected.
export const isTruncatedNote = (description?: string) =>
  !!description && /^[\s\S]{30} \.\.\.$/.test(description);

// Notes need a title; use the start of the note text
export const noteTitle = (text: string) => {
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > 40 ? `${firstLine.slice(0, 40).trim()}…` : firstLine;
};

export const entryText = (entry: JournalEntryParam) =>
  entry.kind === "note" ? entry.description || entry.title : entry.title.trim();
