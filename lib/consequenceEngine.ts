// ──────────────────────────────────────────────
// The Reflector – Consequence Engine
// Progressive penalties for missed routine days
// ──────────────────────────────────────────────

export interface Consequence {
  level: number;           // 1–4 severity
  xpPenalty: number;       // XP to remove (apply as negative addXP)
  message: string;         // shown to user after reflection
  forcedReflection: boolean; // if true, user must write before using app
  tierDrop: boolean;       // drops momentum tier (handled by Agent F4)
}

/**
 * Returns the consequence for a given cumulative miss count.
 * missCount should be the CURRENT total (after incrementing).
 */
export function getConsequence(missCount: number): Consequence {
  if (missCount <= 1) {
    return {
      level: 1,
      xpPenalty: 10,
      message: 'One slip. Get back.',
      forcedReflection: false,
      tierDrop: false,
    };
  }
  if (missCount === 2) {
    return {
      level: 2,
      xpPenalty: 25,
      message: 'Two misses. The cracks are showing.',
      forcedReflection: false,
      tierDrop: true,
    };
  }
  if (missCount === 3) {
    return {
      level: 3,
      xpPenalty: 50,
      message: 'Three. This is becoming a pattern.',
      forcedReflection: true,
      tierDrop: true,
    };
  }
  // 4+
  return {
    level: 4,
    xpPenalty: 100,
    message: 'What happened to the person who started?',
    forcedReflection: true,
    tierDrop: true,
  };
}
