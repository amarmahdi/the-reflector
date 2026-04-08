// ──────────────────────────────────────────────
// The Reflector – Achievement Definitions & Checker
// ──────────────────────────────────────────────

import type { Achievement, Grid40, Routine, UserStats } from '@/types/models';

// ── Achievement Definitions ──────────────────────────────────────────────────

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  // ── STREAKS ──
  {
    id: 'first-blood',
    title: 'FIRST BLOOD',
    description: 'Complete your first day in any grid',
    icon: '🩸',
    category: 'streaks',
    requirement: 'Complete 1 day',
  },
  {
    id: 'three-day-fire',
    title: 'THREE-DAY FIRE',
    description: '3-day completion streak',
    icon: '🔥',
    category: 'streaks',
    requirement: '3 consecutive days completed',
  },
  {
    id: 'week-warrior',
    title: 'WEEK WARRIOR',
    description: '7-day completion streak',
    icon: '⚔️',
    category: 'streaks',
    requirement: '7 consecutive days',
  },
  {
    id: 'fortnight-force',
    title: 'FORTNIGHT FORCE',
    description: '14-day streak',
    icon: '🛡️',
    category: 'streaks',
    requirement: '14 consecutive days',
  },
  {
    id: 'iron-month',
    title: 'IRON MONTH',
    description: '30-day streak',
    icon: '🗡️',
    category: 'streaks',
    requirement: '30 consecutive days',
  },
  {
    id: 'unbreakable',
    title: 'UNBREAKABLE',
    description: '40-day streak — a full grid with zero scars',
    icon: '💎',
    category: 'streaks',
    requirement: 'Complete 40 consecutive days',
  },

  // ── GRIDS ──
  {
    id: 'grid-ignited',
    title: 'GRID IGNITED',
    description: 'Start your first 40-day grid',
    icon: '🔑',
    category: 'grids',
    requirement: 'Start 1 grid',
  },
  {
    id: 'grid-master',
    title: 'GRID MASTER',
    description: 'Complete a full 40-day grid',
    icon: '🏆',
    category: 'grids',
    requirement: 'Complete all 40 days in one grid',
  },
  {
    id: 'multi-grid',
    title: 'MULTI-DISCIPLINE',
    description: 'Run 3 grids simultaneously',
    icon: '🎯',
    category: 'grids',
    requirement: 'Have 3 active grids at once',
  },
  {
    id: 'hard-mode',
    title: 'HARD MODE',
    description: 'Complete a grid with Hard Reset enabled',
    icon: '☠️',
    category: 'grids',
    requirement: 'Complete a hard-reset grid',
  },
  {
    id: 'phoenix',
    title: 'PHOENIX',
    description: 'Start a new grid after failing one',
    icon: '🔥',
    category: 'grids',
    requirement: 'Start a grid after a failure',
  },
  {
    id: 'centurion',
    title: 'CENTURION',
    description: 'Complete 100 total days',
    icon: '💯',
    category: 'grids',
    requirement: '100 days completed across all grids',
  },

  // ── FOCUS ──
  {
    id: 'first-focus',
    title: 'FIRST FOCUS',
    description: 'Complete your first focus session',
    icon: '🧠',
    category: 'focus',
    requirement: 'Complete 1 focus session',
  },
  {
    id: 'deep-diver',
    title: 'DEEP DIVER',
    description: '100 focus minutes in one day',
    icon: '🫧',
    category: 'focus',
    requirement: '100+ minutes focused in one day',
  },
  {
    id: 'focus-week',
    title: 'FOCUS WEEK',
    description: '500 total focus minutes',
    icon: '⏱️',
    category: 'focus',
    requirement: 'Accumulate 500 focused minutes',
  },

  // ── JOURNAL ──
  {
    id: 'first-reflection',
    title: 'FIRST REFLECTION',
    description: 'Write your first journal entry',
    icon: '📝',
    category: 'journal',
    requirement: 'Create 1 journal entry',
  },
  {
    id: 'truth-teller',
    title: 'TRUTH TELLER',
    description: 'Write 10 journal entries',
    icon: '📖',
    category: 'journal',
    requirement: '10 journal entries',
  },
  {
    id: 'chronicler',
    title: 'CHRONICLER',
    description: '50 journal entries',
    icon: '📚',
    category: 'journal',
    requirement: '50 journal entries',
  },

  // ── SPECIAL ──
  {
    id: 'night-owl',
    title: 'NIGHT OWL',
    description: 'Complete a routine after 10 PM',
    icon: '🦉',
    category: 'special',
    requirement: 'Mark a day complete after 22:00',
  },
  {
    id: 'early-bird',
    title: 'EARLY BIRD',
    description: 'Complete a routine before 7 AM',
    icon: '🐦',
    category: 'special',
    requirement: 'Mark a day complete before 07:00',
  },
  {
    id: 'scarred-not-broken',
    title: 'SCARRED NOT BROKEN',
    description: 'Have 5 scars but still complete a grid',
    icon: '⚡',
    category: 'special',
    requirement: 'Complete a grid with 5+ scars',
  },
];

// ── XP rewards per achievement (by id) ───────────────────────────────────────

const ACHIEVEMENT_XP: Record<string, number> = {
  // Streaks — escalating
  'first-blood': 10,
  'three-day-fire': 20,
  'week-warrior': 30,
  'fortnight-force': 50,
  'iron-month': 75,
  'unbreakable': 100,

  // Grids
  'grid-ignited': 10,
  'grid-master': 75,
  'multi-grid': 40,
  'hard-mode': 100,
  'phoenix': 25,
  'centurion': 80,

  // Focus
  'first-focus': 10,
  'deep-diver': 40,
  'focus-week': 50,

  // Journal
  'first-reflection': 10,
  'truth-teller': 30,
  'chronicler': 60,

  // Special
  'night-owl': 15,
  'early-bird': 15,
  'scarred-not-broken': 50,
};

// ── Achievement Checker ──────────────────────────────────────────────────────

interface CheckContext {
  grids: Grid40[];
  routines: Routine[];
  userStats: UserStats;
  isAchievementUnlocked: (id: string) => boolean;
  unlockAchievement: (id: string) => void;
  addXP: (amount: number) => void;
}

/**
 * Check all achievements against current data and unlock any newly earned ones.
 * Call this after any state-changing action (day complete, grid complete, etc).
 * Returns array of newly unlocked achievement IDs.
 */
export function checkAchievements(ctx: CheckContext): string[] {
  const {
    grids,
    userStats,
    isAchievementUnlocked,
    unlockAchievement,
    addXP,
  } = ctx;

  const newlyUnlocked: string[] = [];

  const tryUnlock = (id: string) => {
    if (isAchievementUnlocked(id)) return;
    unlockAchievement(id);
    addXP(ACHIEVEMENT_XP[id] ?? 10);
    newlyUnlocked.push(id);
  };

  const activeGrids = grids.filter((g) => g.status === 'active');
  const completedGrids = grids.filter((g) => g.status === 'completed');
  const failedGrids = grids.filter((g) => g.status === 'failed');
  const streak = userStats.currentStreak;
  const totalDays = userStats.totalDaysCompleted;

  // ── STREAKS ──
  if (totalDays >= 1) tryUnlock('first-blood');
  if (streak >= 3) tryUnlock('three-day-fire');
  if (streak >= 7) tryUnlock('week-warrior');
  if (streak >= 14) tryUnlock('fortnight-force');
  if (streak >= 30) tryUnlock('iron-month');
  if (streak >= 40) tryUnlock('unbreakable');

  // ── GRIDS ──
  if (grids.length >= 1) tryUnlock('grid-ignited');
  if (completedGrids.length >= 1) tryUnlock('grid-master');
  if (activeGrids.length >= 3) tryUnlock('multi-grid');
  if (totalDays >= 100) tryUnlock('centurion');

  // Hard mode: completed grid with hard reset
  if (completedGrids.some((g) => g.isHardResetEnabled)) {
    tryUnlock('hard-mode');
  }

  // Phoenix: has a failed grid AND started another after
  if (failedGrids.length > 0 && grids.length > failedGrids.length) {
    tryUnlock('phoenix');
  }

  // Scarred not broken: completed grid with 5+ scars
  for (const grid of completedGrids) {
    const scarCount = grid.days.filter((d) => d.status === 'scarred').length;
    if (scarCount >= 5) {
      tryUnlock('scarred-not-broken');
      break;
    }
  }

  // ── FOCUS ──
  if (userStats.totalFocusMinutes >= 1) tryUnlock('first-focus');
  if (userStats.totalFocusMinutes >= 500) tryUnlock('focus-week');
  // deep-diver (100 min in one day) must be triggered externally with daily context

  // ── JOURNAL ──
  if (userStats.totalJournalEntries >= 1) tryUnlock('first-reflection');
  if (userStats.totalJournalEntries >= 10) tryUnlock('truth-teller');
  if (userStats.totalJournalEntries >= 50) tryUnlock('chronicler');

  // ── SPECIAL (time-based) ──
  // night-owl and early-bird need to be triggered at the moment of completion
  // with the current hour. They're best called externally:
  //   if (hour >= 22) tryUnlock('night-owl');
  //   if (hour < 7) tryUnlock('early-bird');
  const hour = new Date().getHours();
  if (totalDays >= 1 && hour >= 22) tryUnlock('night-owl');
  if (totalDays >= 1 && hour < 7) tryUnlock('early-bird');

  return newlyUnlocked;
}
