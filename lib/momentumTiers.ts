// ──────────────────────────────────────────────
// Momentum Tiers — Visual transformation system
// ──────────────────────────────────────────────
// Tier colors are SEPARATE from theme.ts.
// The app's visual theme escalates based on streak length.

export type MomentumTierKey = 'seed' | 'sprout' | 'growth' | 'fire' | 'lightning' | 'crown';

export interface MomentumTier {
  key: MomentumTierKey;
  name: string;
  emoji: string;
  minStreak: number;
  accentColor: string;
  glowColor: string;
  glowIntensity: number; // 0 = none, 1 = max
  message: string;       // shown when tier changes
}

export const TIERS: MomentumTier[] = [
  {
    key: 'seed',
    name: 'Seed',
    emoji: '🌱',
    minStreak: 0,
    accentColor: '#1A6B3C',
    glowColor: 'rgba(26,107,60,0.12)',
    glowIntensity: 0,
    message: '',
  },
  {
    key: 'sprout',
    name: 'Sprout',
    emoji: '🌿',
    minStreak: 4,
    accentColor: '#27AE60',
    glowColor: 'rgba(39,174,96,0.15)',
    glowIntensity: 0.2,
    message: 'Growing. Keep it up.',
  },
  {
    key: 'growth',
    name: 'Growth',
    emoji: '🌲',
    minStreak: 8,
    accentColor: '#2ECC71',
    glowColor: 'rgba(46,204,113,0.2)',
    glowIntensity: 0.4,
    message: "You're building something real.",
  },
  {
    key: 'fire',
    name: 'Fire',
    emoji: '🔥',
    minStreak: 15,
    accentColor: '#F1C40F',
    glowColor: 'rgba(241,196,15,0.2)',
    glowIntensity: 0.6,
    message: "On fire. Don't stop now.",
  },
  {
    key: 'lightning',
    name: 'Lightning',
    emoji: '⚡',
    minStreak: 22,
    accentColor: '#9B59B6',
    glowColor: 'rgba(155,89,182,0.25)',
    glowIntensity: 0.8,
    message: 'UNSTOPPABLE.',
  },
  {
    key: 'crown',
    name: 'Crown',
    emoji: '👑',
    minStreak: 31,
    accentColor: '#FFD700',
    glowColor: 'rgba(255,215,0,0.3)',
    glowIntensity: 1.0,
    message: 'Royalty. You earned this.',
  },
];

/** Get the tier index for a given streak count */
export function getTierIndex(streak: number): number {
  let idx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (streak >= TIERS[i].minStreak) {
      idx = i;
      break;
    }
  }
  return idx;
}

/** Get the tier object for a given streak count */
export function getTierForStreak(streak: number): MomentumTier {
  return TIERS[getTierIndex(streak)];
}
