// ──────────────────────────────────────────────
// Ghost of Yesterday — Quote Banks
// Seeded by date so quotes are stable within a day.
// ──────────────────────────────────────────────

const MISS_QUOTES = [
  'Is that who you are?',
  'The excuse was louder than the commitment.',
  'Same pattern. Different day. Change it.',
  'Your future self is watching.',
  "Nobody's coming to save you.",
];

const SUCCESS_QUOTES = [
  'Will you match that today?',
  'Consistency is character. Keep building.',
  'The compound effect is working.',
  "Yesterday's discipline is today's foundation.",
];

const STREAK_QUOTES = [
  "Past-you is proud. Don't let them down.",
  'Momentum is a weapon. Keep swinging.',
  "You're becoming someone new.",
  "The person who started wouldn't recognize you.",
];

/** Seed by date so the quote is stable within a single day. */
function getDailyIndex(arr: string[]): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % arr.length;
}

/** Prepend a data-aware context line when yesterday's score is available. */
function prependScoreContext(quote: string, yesterdayScore?: number): string {
  if (yesterdayScore === undefined) return quote;
  if (yesterdayScore < 30) return `Yesterday scored ${yesterdayScore}. ${quote}`;
  if (yesterdayScore <= 60) return `A ${yesterdayScore} day. ${quote}`;
  if (yesterdayScore > 80) return `Yesterday was strong at ${yesterdayScore}. ${quote}`;
  return quote;
}

export function getMissQuote(yesterdayScore?: number): string {
  const raw = MISS_QUOTES[getDailyIndex(MISS_QUOTES)];
  return prependScoreContext(raw, yesterdayScore);
}

export function getSuccessQuote(yesterdayScore?: number): string {
  const raw = SUCCESS_QUOTES[getDailyIndex(SUCCESS_QUOTES)];
  return prependScoreContext(raw, yesterdayScore);
}

export function getStreakQuote(streakDays: number, yesterdayScore?: number): string {
  const raw = STREAK_QUOTES[getDailyIndex(STREAK_QUOTES)];
  const quote = raw.replace('{N}', String(streakDays));
  return prependScoreContext(quote, yesterdayScore);
}
