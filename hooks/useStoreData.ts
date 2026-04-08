/**
 * Centralized Store Hooks — Safe, typed wrappers around Zustand getters.
 *
 * WHY: Calling store getter functions inside Zustand selectors
 * (e.g., `useStore((s) => s.getSomething())`) causes INFINITE RE-RENDER LOOPS
 * because the getter returns a new reference every render, triggering a re-render,
 * which calls the getter again.
 *
 * RULE: Always use these hooks instead of calling getters in selectors.
 */
import { useMemo } from 'react';
import { useFocusStore } from '@/store/useFocusStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useReflectorStore } from '@/store/useReflectorStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useDisciplineStore } from '@/store/useDisciplineStore';
import type { DisciplineSnapshot } from '@/types/models';

// ── Focus Store Hooks ────────────────────────────────────────────────────────

export function useTodayFocusMinutes(): number {
  const getter = useFocusStore((s) => s.getTodayFocusMinutes);
  const sessions = useFocusStore((s) => s.focusSessions);
  return useMemo(() => getter(), [sessions]);
}

export function useWeekFocusMinutes(): number {
  const getter = useFocusStore((s) => s.getWeekFocusMinutes);
  const sessions = useFocusStore((s) => s.focusSessions);
  return useMemo(() => getter(), [sessions]);
}

export function useTodaySessions() {
  const getter = useFocusStore((s) => s.getTodaySessions);
  const sessions = useFocusStore((s) => s.focusSessions);
  return useMemo(() => getter(), [sessions]);
}

export function useTodayCompletedCount(): number {
  const getter = useFocusStore((s) => s.getTodayCompletedCount);
  const sessions = useFocusStore((s) => s.focusSessions);
  return useMemo(() => getter(), [sessions]);
}

export function useFocusStreakDays(): number {
  const getter = useFocusStore((s) => s.getStreakDays);
  const sessions = useFocusStore((s) => s.focusSessions);
  return useMemo(() => getter(), [sessions]);
}

// ── Journal Store Hooks ──────────────────────────────────────────────────────

export function useAllJournalTags(): string[] {
  const getter = useJournalStore((s) => s.getAllTags);
  const entries = useJournalStore((s) => s.journalEntries);
  return useMemo(() => getter(), [entries]);
}

// ── Reflector Store Hooks ────────────────────────────────────────────────────

export function useTodayTodos() {
  const dailyTodos = useReflectorStore((s) => s.dailyTodos);
  return useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return dailyTodos.filter((t) => t.date === now.getTime());
  }, [dailyTodos]);
}

export function useActiveGrids() {
  const grids = useReflectorStore((s) => s.grids);
  return useMemo(() => grids.filter((g) => g.status === 'active'), [grids]);
}

export function useGridProgress(gridId: string) {
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  return useMemo(() => {
    const grid = grids.find((g) => g.id === gridId);
    if (!grid) return null;
    const routine = routines.find((r) => r.id === grid.routineId);
    const completed = grid.days.filter((d) => d.status === 'completed').length;
    const total = grid.days.length;
    return {
      grid,
      routine,
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [grids, routines, gridId]);
}

// ── Gamification Hooks ───────────────────────────────────────────────────────

export function useUserLevel() {
  const userStats = useGamificationStore((s) => s.userStats);
  return useMemo(() => ({
    level: userStats.level,
    totalXP: userStats.totalXP,
    currentStreak: userStats.currentStreak,
    longestEverStreak: userStats.longestEverStreak,
  }), [userStats]);
}

// ── Discipline Score Hooks ───────────────────────────────────────────────────

export function useDisciplineScore(): number {
  const getTodayScore = useDisciplineStore((s) => s.getTodayScore);
  const snapshots = useDisciplineStore((s) => s.snapshots);
  return useMemo(() => getTodayScore(), [snapshots]);
}

export function useDisciplineTrend(): DisciplineSnapshot[] {
  const get14DayTrend = useDisciplineStore((s) => s.get14DayTrend);
  const snapshots = useDisciplineStore((s) => s.snapshots);
  return useMemo(() => get14DayTrend(), [snapshots]);
}
