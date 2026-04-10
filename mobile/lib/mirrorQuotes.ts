// ──────────────────────────────────────────────
// The Mirror (Muhasabah) — Quote Banks
// Seeded by date so quotes are stable within a day.
// "Account for yourselves before you are accounted for."
// ──────────────────────────────────────────────

const MISS_QUOTES = [
  'You slipped. But the door of return is still open.',
  'A lapse is not a fall — unless you choose to stay down.',
  'The one who repents from a sin is like one who never sinned.',
  'What will you do with today to make up for yesterday?',
  'The best of those who sin are those who repent.',
];

const SUCCESS_QUOTES = [
  'The most beloved deeds to Allah are the most consistent, even if small.',
  'Consistency is the proof of sincerity. Keep going.',
  'You showed up. That is the entire battle.',
  "Yesterday's discipline is today's foundation.",
];

const STREAK_QUOTES = [
  'Istiqamah — steadfastness. You are living it.',
  'Consistency compounds. Your future self will thank you.',
  "You're becoming someone your past self prayed to be.",
  'Small deeds, done consistently, outweigh grand gestures.',
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
