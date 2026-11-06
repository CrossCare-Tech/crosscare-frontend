import { QuestionnaireDomain, QuestionnaireQuestion } from "@/constants/questionaireData";

// Walks the same decision tree as the in-chat questionnaire (`followUp` per answer, "*" for any
// answer, otherwise the next question in the list), so both ways of answering ask the same things.

// A step that only shows information (no options, nothing to answer), e.g. "q1-smoke-info".
export const isInfoStep = (q: QuestionnaireQuestion) =>
  !q.options?.length && (/-info$/.test(q.id) || /provided information/i.test(q.flag ?? ""));

// True for a step the patient answers by typing.
export const isFreeTextStep = (q: QuestionnaireQuestion) => !q.options?.length && !isInfoStep(q);

// `answer` null means "skipped": follow the default branch (any answer, else the first option).
export const nextQuestionId = (
  domain: QuestionnaireDomain,
  question: QuestionnaireQuestion,
  answer: string | null
): string | null => {
  const follow = question.followUp;
  let target: string | undefined;
  if (follow) {
    target = answer !== null ? follow[answer] ?? follow["*"] : follow["*"] ?? follow[question.options?.[0] ?? ""];
  }
  if (target) return target.startsWith("domain[") ? null : target;
  const index = domain.questions.findIndex((q) => q.id === question.id);
  return domain.questions[index + 1]?.id ?? null;
};

// Rough length of the whole path, for "Question 3 of about 9" and the progress bar.
// Follows the default branch from the current question and never loops.
export const estimateTotal = (domain: QuestionnaireDomain, path: string[]): number => {
  const seen = new Set(path);
  let total = path.length;
  let current = domain.questions.find((q) => q.id === path[path.length - 1]);
  while (current) {
    const nextId = nextQuestionId(domain, current, null);
    if (!nextId || seen.has(nextId)) break;
    seen.add(nextId);
    total++;
    current = domain.questions.find((q) => q.id === nextId);
  }
  return total;
};
