// ──────────────────────────────────────────────
// The Reflector – Unified Action Layer
// Central nervous system for cross-feature side effects
// ──────────────────────────────────────────────

import { useReflectorStore } from '@/store/useReflectorStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useDisciplineStore } from '@/store/useDisciplineStore';
import { calculateDisciplineScore } from '@/lib/disciplineEngine';
import { checkAchievements } from '@/lib/achievements';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements';
import { getConsequence } from '@/lib/consequenceEngine';
import { getPrestigeLevel, PRESTIGE_CONFIG } from '@/types/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FocusSession, Grid40, Achievement } from '@/types/models';


// ── Toast callback registration ─────────────────────────────────────────────

let _toastCallback: ((achievement: Achievement) => void) | null = null;

export function registerToastCallback(cb: typeof _toastCallback) {
  _toastCallback = cb;
}

export function showAchievementToast(achievementId: string) {
  const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
  if (def && _toastCallback) {
    _toastCallback({ ...def, unlockedAt: Date.now() });
  }
}

/** Show toast for each newly unlocked achievement */
function showToastsForUnlocked(ids: string[]) {
  // Stagger toasts with a delay so they don't overlap
  ids.forEach((id, i) => {
    setTimeout(() => showAchievementToast(id), i * 3500);
  });
}

// ── Achievement check helper ────────────────────────────────────────────────

function runAchievementCheck(): string[] {
  const reflector = useReflectorStore.getState();
  const gam = useGamificationStore.getState();

  return checkAchievements({
    grids: reflector.grids,
    routines: reflector.routines,
    userStats: gam.userStats,
    isAchievementUnlocked: gam.isAchievementUnlocked,
    unlockAchievement: gam.unlockAchievement,
    addXP: gam.addXP,
  });
}

// ── Public Actions ──────────────────────────────────────────────────────────

// ── Discipline Score Calculation ────────────────────────────────────────────

/** Debounce: only recalculate if last run was > 5 minutes ago */
let _lastDisciplineCalcMs = 0;
const DISCIPLINE_DEBOUNCE_MS = 5 * 60 * 1000;

/**
 * Trigger a discipline score calculation.
 * Reads current state from all stores, calculates composite score,
 * and persists the snapshot. Debounced to 5 minutes.
 * Pass `force = true` to bypass debounce.
 */
export function triggerDisciplineCalculation(_dateMs?: number, force = false): void {
  const now = Date.now();
  if (!force && now - _lastDisciplineCalcMs < DISCIPLINE_DEBOUNCE_MS) return;
  _lastDisciplineCalcMs = now;

  try {
    const reflector = useReflectorStore.getState();
    const focus = useFocusStore.getState();
    const journal = useJournalStore.getState();
    const disciplineStore = useDisciplineStore.getState();

    const snapshot = calculateDisciplineScore(
      reflector.grids,
      reflector.dailyTodos,
      focus.focusSessions,
      journal.journalEntries,
      reflector.notificationSettings.wakeTime,
      disciplineStore.focusGoalMinutes,
      now, // appOpenedAt — approximated by current time for mid-day recalcs
    );

    disciplineStore.recordSnapshot(snapshot);
  } catch {
    // Calculation is non-critical — never crash the app
  }
}

/** Call after marking a grid day as completed */
export function onDayCompleted(gridId: string, dayIndex: number): string[] {
  const gam = useGamificationStore.getState();
  const reflector = useReflectorStore.getState();

  const grid = reflector.grids.find((g) => g.id === gridId);
  const routine = reflector.routines.find((r) => r.id === grid?.routineId);
  const prestige = getPrestigeLevel(routine?.completedGridCount ?? 0);
  const config = PRESTIGE_CONFIG[prestige];

  // Update gamification stats
  gam.incrementStat('totalDaysCompleted');
  gam.addXP(Math.round(5 * config.xpMultiplier)); // 5 base XP * multiplier

  // Calculate and update streak
  const streak = calculateCurrentStreak(reflector.grids);
  gam.updateStreak(streak);

  // Check if ALL active grids have today completed — perfect day = wound heals
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayMs = now.getTime();
  const activeGrids = reflector.grids.filter((g) => g.status === 'active');
  const allDone = activeGrids.every((g) =>
    g.days.some((d) => d.date === todayMs && d.status === 'completed')
  );
  if (allDone && activeGrids.length > 0) {
    gam.recordPerfectDay();
  }

  // Check achievements
  const newlyUnlocked = runAchievementCheck();

  // Recalculate discipline score
  triggerDisciplineCalculation();

  // Show toasts
  showToastsForUnlocked(newlyUnlocked);

  return newlyUnlocked;
}

/** Call after a grid is fully completed (all 40 days) */
export function onGridCompleted(gridId: string): string[] {
  const gam = useGamificationStore.getState();
  const reflector = useReflectorStore.getState();

  gam.incrementStat('totalGridsCompleted');

  // Apply prestige XP multiplier
  const grid = reflector.grids.find((g) => g.id === gridId);
  const routine = grid ? reflector.routines.find((r) => r.id === grid.routineId) : undefined;
  const prestige = getPrestigeLevel(routine?.completedGridCount ?? 0);
  const config = PRESTIGE_CONFIG[prestige];
  gam.addXP(Math.round(50 * config.xpMultiplier)); // 50 base XP * prestige multiplier

  const newlyUnlocked = runAchievementCheck();
  showToastsForUnlocked(newlyUnlocked);

  return newlyUnlocked;
}

/** Call after a grid fails */
export function onGridFailed(gridId: string): void {
  const gam = useGamificationStore.getState();
  gam.incrementStat('totalGridsFailed');
  gam.updateStreak(0); // Reset streak on failure
}

/** Call after a focus session completes */
export function onFocusSessionCompleted(session: FocusSession): string[] {
  const gam = useGamificationStore.getState();
  const focus = useFocusStore.getState();

  // Update total focus minutes
  const minutesAdded = Math.round(session.actualDuration / 60000);
  gam.incrementStat('totalFocusMinutes', minutesAdded);
  gam.addXP(Math.max(1, Math.floor(minutesAdded / 5))); // 1 XP per 5 focus minutes

  // Check achievements
  const newlyUnlocked = runAchievementCheck();

  // Deep diver check (100 min in one day)
  const todayMinutes = focus.getTodayFocusMinutes();
  if (todayMinutes >= 100 && !gam.isAchievementUnlocked('deep-diver')) {
    gam.unlockAchievement('deep-diver');
    gam.addXP(40);
    newlyUnlocked.push('deep-diver');
  }

  // Recalculate discipline score
  triggerDisciplineCalculation();

  showToastsForUnlocked(newlyUnlocked);

  return newlyUnlocked;
}

/** Call after a journal entry is created */
export function onJournalEntryCreated(): string[] {
  const gam = useGamificationStore.getState();

  gam.incrementStat('totalJournalEntries');
  gam.addXP(3); // 3 XP per journal entry

  const newlyUnlocked = runAchievementCheck();

  // Recalculate discipline score
  triggerDisciplineCalculation();

  showToastsForUnlocked(newlyUnlocked);

  return newlyUnlocked;
}

/** Call after a task is toggled complete */
export function onTaskCompleted(): void {
  const gam = useGamificationStore.getState();
  gam.addXP(2); // 2 XP per task completion
  triggerDisciplineCalculation();
}

/**
 * Call when a grid day is scarred (missed).
 * Records the miss, applies XP penalty, and optionally flags forced reflection.
 * Returns the consequence so fire.tsx can display the message.
 */
export async function onDayScarred() {
  const gam = useGamificationStore.getState();

  // Record the miss first (increments totalMisses)
  gam.recordMiss();

  // Get consequence based on NEW total miss count
  const missCount = gam.getConsequenceLevel(); // already incremented by recordMiss
  const consequence = getConsequence(missCount);

  // Apply XP penalty (addXP guards against going below 0)
  gam.addXP(-consequence.xpPenalty);

  // If forced reflection is required, set AsyncStorage flag
  // _layout.tsx checks this on next open and redirects to fire screen
  if (consequence.forcedReflection) {
    await AsyncStorage.setItem('pending-forced-reflection', 'true');
  }

  return consequence;
}

// ── Streak Calculation ──────────────────────────────────────────────────────

/**
 * Calculate current streak from grid data.
 * A streak counts consecutive days where at least 1 grid day was completed.
 */
export function calculateCurrentStreak(grids: Grid40[]): number {
  // Collect all completed day dates across all grids
  const completedDates = new Set<number>();
  for (const grid of grids) {
    for (const day of grid.days) {
      if (day.status === 'completed') {
        completedDates.add(day.date);
      }
    }
  }

  if (completedDates.size === 0) return 0;

  // Count backwards from today
  const MS_PER_DAY = 86400000;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let current = now.getTime();
  let streak = 0;

  // Allow today to not be completed yet (check yesterday first if today isn't done)
  if (!completedDates.has(current)) {
    current -= MS_PER_DAY;
  }

  while (completedDates.has(current)) {
    streak++;
    current -= MS_PER_DAY;
  }

  return streak;
}
