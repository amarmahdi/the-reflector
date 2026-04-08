import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { STORE_KEYS } from './keys';
import type { FocusSession, FocusSessionType } from '@/types/models';
import * as Crypto from 'expo-crypto';

// ──────────────────────────────────────────────
// Focus Timer Store — Isolated domain store
// ──────────────────────────────────────────────

export interface FocusState {
  focusSessions: FocusSession[];

  addFocusSession: (session: Omit<FocusSession, 'id' | 'createdAt'>) => FocusSession;
  getTodayFocusMinutes: () => number;
  getWeekFocusMinutes: () => number;
  getTodaySessions: () => FocusSession[];
  getTodayCompletedCount: () => number;
  getStreakDays: () => number;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      focusSessions: [],

      addFocusSession: (session) => {
        const full: FocusSession = {
          ...session,
          id: Crypto.randomUUID(),
          createdAt: Date.now(),
        };
        set((s) => ({ focusSessions: [...s.focusSessions, full] }));
        return full;
      },

      getTodayFocusMinutes: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayStart = now.getTime();
        return Math.round(
          get()
            .focusSessions.filter((s) => s.createdAt >= todayStart && s.completed)
            .reduce((sum, s) => sum + s.actualDuration / 60000, 0)
        );
      },

      getWeekFocusMinutes: () => {
        const now = new Date();
        const weekAgo = now.getTime() - 7 * 86400000;
        return Math.round(
          get()
            .focusSessions.filter((s) => s.createdAt >= weekAgo && s.completed)
            .reduce((sum, s) => sum + s.actualDuration / 60000, 0)
        );
      },

      getTodaySessions: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayStart = now.getTime();
        return get().focusSessions.filter((s) => s.createdAt >= todayStart);
      },

      getTodayCompletedCount: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayStart = now.getTime();
        return get().focusSessions.filter(
          (s) => s.createdAt >= todayStart && s.completed
        ).length;
      },

      getStreakDays: () => {
        const sessions = get().focusSessions.filter((s) => s.completed);
        if (sessions.length === 0) return 0;

        // Group by day
        const daySet = new Set<number>();
        for (const s of sessions) {
          const d = new Date(s.createdAt);
          d.setHours(0, 0, 0, 0);
          daySet.add(d.getTime());
        }

        const days = Array.from(daySet).sort((a, b) => b - a);
        const MS_PER_DAY = 86400000;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let expected = today.getTime();

        for (const day of days) {
          if (day === expected || day === expected - MS_PER_DAY) {
            streak++;
            expected = day - MS_PER_DAY;
          } else {
            break;
          }
        }
        return streak;
      },
    }),
    { name: STORE_KEYS.focus, storage: asyncStorageAdapter }
  )
);
