// Prototype 8.7 "Mood Keyword Alert": words in a journal entry that call for a gentle check-in.
// ponytail: a short fixed list, no language model and no context. It only decides whether to show support
// options, never a diagnosis; a real classifier (and the clinical review of the list) comes later.
const PHRASES = [
  "overwhelmed",
  "hopeless",
  "worthless",
  "can't cope",
  "cant cope",
  "can't go on",
  "no point",
  "give up",
  "hurt myself",
  "disappear",
  "sobrecarregada",
  "sem esperança",
  "não aguento",
  "desesperada",
  "abrumada",
  "sin esperanza",
];

export const mentionsDistress = (text: string) => {
  const lower = text.toLowerCase();
  return PHRASES.some((phrase) => lower.includes(phrase));
};
