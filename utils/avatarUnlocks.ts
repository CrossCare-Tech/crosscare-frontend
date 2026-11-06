// Unlock rules of the Avatar Studio ("start", "journal-5", "vitals-streak-7", "checkin-14"), checked against the
// patient's own data. "checkin-N" needs the daily check-in, which has no backend yet, so it stays locked.

export type AvatarStats = { journalEntries: number; bestVitalsStreak: number };

const DAY_MS = 86400000;

// Longest run of consecutive days in a list of "YYYY-MM-DD" dates. The best run counts, not the current one, so an
// item the patient already earned does not lock again after a missed day.
export const longestStreak = (days: string[]): number => {
  const sorted = [...new Set(days)].map((d) => Date.parse(`${d}T12:00:00Z`)).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  sorted.forEach((time, index) => {
    run = index > 0 && time - sorted[index - 1] === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
};

export type RuleProgress = { have: number; need: number };

// null when the rule cannot be measured yet (check-ins) or is unknown
export const ruleProgress = (rule: string, stats: AvatarStats): RuleProgress | null => {
  const match = /^(journal|vitals-streak)-(\d+)$/.exec(rule);
  if (!match) return null;
  return { have: match[1] === "journal" ? stats.journalEntries : stats.bestVitalsStreak, need: Number(match[2]) };
};

export const isRuleMet = (rule: string, stats: AvatarStats): boolean => {
  if (rule === "start") return true;
  const progress = ruleProgress(rule, stats);
  return !!progress && progress.have >= progress.need;
};
