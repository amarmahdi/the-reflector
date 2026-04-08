// ──────────────────────────────────────────────
// The Reflector – Discipline Engine
// Calculates the daily composite Discipline Score (0-100)
// ──────────────────────────────────────────────

import type {
  Grid40,
  DailyTodo,
  JournalEntry,
  DisciplineSnapshot,
} from '@/types/models';
import { DISCIPLINE_WEIGHTS } from '@/types/models';
import type { FocusSession } from '@/types/models';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStartOfDay(epochMs?: number): number {
  const d = epochMs ? new Date(epochMs) : new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function parseHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

// ── Sub-score Calculators ─────────────────────────────────────────────────────

/**
 * Routine score (0–100):
 * For each active grid, was today's day marked completed?
 * Average across all active grids. No active grids → 50 (neutral).
 */
function calcRoutineScore(grids: Grid40[], todayMs: number): number {
  const activeGrids = grids.filter((g) => g.status === 'active');
  if (activeGrids.length === 0) return 50;

  let completed = 0;
  for (const grid of activeGrids) {
    const todayDay = grid.days.find((d) => d.date === todayMs);
    if (todayDay?.status === 'completed') completed++;
  }
  return Math.round((completed / activeGrids.length) * 100);
}

/**
 * Focus score (0–100):
 * min(100, (todayFocusMinutes / focusGoalMinutes) * 100)
 */
function calcFocusScore(
  focusSessions: FocusSession[],
  focusGoalMinutes: number,
  todayMs: number,
): number {
  const todayMinutes = focusSessions
    .filter((s) => s.completed && s.createdAt >= todayMs)
    .reduce((sum, s) => sum + s.actualDuration / 60000, 0);

  return Math.min(100, Math.round((todayMinutes / Math.max(1, focusGoalMinutes)) * 100));
}

/**
 * Task score (0–100):
 * (completedTodos / totalTodayTodos) * 100
 * No todos today → 50 (neutral).
 */
function calcTaskScore(dailyTodos: DailyTodo[], todayMs: number): number {
  const todayTodos = dailyTodos.filter((t) => t.date === todayMs);
  if (todayTodos.length === 0) return 50;
  const done = todayTodos.filter((t) => t.completed).length;
  return Math.round((done / todayTodos.length) * 100);
}

/**
 * Journal score (0–100):
 * 100 if journaled today. +10 bonus per consecutive streak day (capped at 100).
 * 0 if not journaled today.
 */
function calcJournalScore(journalEntries: JournalEntry[], todayMs: number): number {
  const journaledToday = journalEntries.some((e) => e.date === todayMs);
  if (!journaledToday) return 0;

  // Count consecutive journal days including today
  const MS_PER_DAY = 86_400_000;
  let streak = 1;
  let checkDate = todayMs - MS_PER_DAY;

  while (journalEntries.some((e) => e.date === checkDate)) {
    streak++;
    checkDate -= MS_PER_DAY;
  }

  return Math.min(100, 100 + (streak - 1) * 10);
}

/**
 * Wake score (0–100):
 * 100 if app was opened within 30 min of wakeTime.
 * Degrades linearly: -2 per minute late. Floor at 0.
 */
function calcWakeScore(wakeTime: string, appOpenedAt: number): number {
  const { h, m } = parseHHMM(wakeTime);
  const today = new Date(appOpenedAt);
  today.setHours(0, 0, 0, 0);
  const wakeMs = today.getTime() + (h * 60 + m) * 60000;
  const gracePeriodMs = 30 * 60000; // 30-minute grace window

  const minutesLate = Math.max(0, (appOpenedAt - (wakeMs + gracePeriodMs)) / 60000);
  return Math.max(0, Math.round(100 - minutesLate * 2));
}

// ── Main Calculator ───────────────────────────────────────────────────────────

/**
 * Calculate the composite Discipline Score for today.
 * Call this whenever a significant action occurs (app open, task/routine/journal complete).
 */
export function calculateDisciplineScore(
  grids: Grid40[],
  dailyTodos: DailyTodo[],
  focusSessions: FocusSession[],
  journalEntries: JournalEntry[],
  wakeTime: string,
  focusGoalMinutes: number,
  appOpenedAt: number,
): DisciplineSnapshot {
  const todayMs = getStartOfDay();

  const routineScore = calcRoutineScore(grids, todayMs);
  const focusScore = calcFocusScore(focusSessions, focusGoalMinutes, todayMs);
  const taskScore = calcTaskScore(dailyTodos, todayMs);
  const journalScore = calcJournalScore(journalEntries, todayMs);
  const wakeScore = calcWakeScore(wakeTime, appOpenedAt);

  const score = Math.round(
    routineScore * DISCIPLINE_WEIGHTS.routine +
    focusScore   * DISCIPLINE_WEIGHTS.focus   +
    taskScore    * DISCIPLINE_WEIGHTS.task     +
    journalScore * DISCIPLINE_WEIGHTS.journal  +
    wakeScore    * DISCIPLINE_WEIGHTS.wake,
  );

  return {
    date: todayMs,
    score: Math.max(0, Math.min(100, score)),
    breakdown: {
      routineScore,
      focusScore,
      taskScore,
      journalScore,
      wakeScore,
    },
    createdAt: Date.now(),
  };
}
