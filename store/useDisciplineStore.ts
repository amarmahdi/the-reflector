// ──────────────────────────────────────────────
// The Reflector – Discipline Store
// Persists daily discipline snapshots and focus goal
// ──────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { STORE_KEYS } from './keys';
import type { DisciplineSnapshot } from '@/types/models';
import { DEFAULT_FOCUS_GOAL_MINUTES } from '@/types/models';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DisciplineState {
  snapshots: DisciplineSnapshot[];  // last 30 days max
  focusGoalMinutes: number;         // configurable daily focus goal

  // Actions
  recordSnapshot: (snapshot: DisciplineSnapshot) => void;
  getTodayScore: () => number;
  get14DayTrend: () => DisciplineSnapshot[];
  getAverageScore: (days: number) => number;
  setFocusGoal: (minutes: number) => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

const MAX_SNAPSHOTS = 30;

export const useDisciplineStore = create<DisciplineState>()(
  persist(
    (set, get) => ({
      snapshots: [],
      focusGoalMinutes: DEFAULT_FOCUS_GOAL_MINUTES,

      recordSnapshot: (snapshot: DisciplineSnapshot) => {
        set((s) => {
          // Replace existing snapshot for same day (upsert)
          const filtered = s.snapshots.filter((snap) => snap.date !== snapshot.date);
          const updated = [...filtered, snapshot]
            // Keep only the most recent 30 days
            .sort((a, b) => b.date - a.date)
            .slice(0, MAX_SNAPSHOTS);
          return { snapshots: updated };
        });
      },

      getTodayScore: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayMs = now.getTime();
        const todaySnap = get().snapshots.find((s) => s.date === todayMs);
        return todaySnap?.score ?? 0;
      },

      get14DayTrend: () => {
        const MS_PER_DAY = 86_400_000;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const cutoff = now.getTime() - 13 * MS_PER_DAY;
        return get()
          .snapshots.filter((s) => s.date >= cutoff)
          .sort((a, b) => a.date - b.date);
      },

      getAverageScore: (days: number) => {
        const MS_PER_DAY = 86_400_000;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const cutoff = now.getTime() - (days - 1) * MS_PER_DAY;
        const relevant = get().snapshots.filter((s) => s.date >= cutoff);
        if (relevant.length === 0) return 0;
        const sum = relevant.reduce((acc, s) => acc + s.score, 0);
        return Math.round(sum / relevant.length);
      },

      setFocusGoal: (minutes: number) => {
        set({ focusGoalMinutes: Math.max(1, minutes) });
      },
    }),
    {
      name: STORE_KEYS.discipline,
      storage: asyncStorageAdapter,
    },
  ),
);
