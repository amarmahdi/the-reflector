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

export function getMissQuote(): string {
  return MISS_QUOTES[getDailyIndex(MISS_QUOTES)];
}

export function getSuccessQuote(): string {
  return SUCCESS_QUOTES[getDailyIndex(SUCCESS_QUOTES)];
}

export function getStreakQuote(streakDays: number): string {
  const raw = STREAK_QUOTES[getDailyIndex(STREAK_QUOTES)];
  return raw.replace('{N}', String(streakDays));
}
