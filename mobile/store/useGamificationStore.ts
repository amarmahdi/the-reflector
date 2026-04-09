import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { STORE_KEYS } from './keys';
import type { Achievement, UserStats, WoundTracker } from '@/types/models';
import { DEFAULT_USER_STATS, DEFAULT_WOUND_TRACKER, xpForLevel } from '@/types/models';

// ──────────────────────────────────────────────
// Gamification Store — Isolated domain store
// ──────────────────────────────────────────────

type IncrementableStatKey =
  | 'totalDaysCompleted'
  | 'totalGridsCompleted'
  | 'totalGridsFailed'
  | 'totalFocusMinutes'
  | 'totalJournalEntries';

export interface GamificationState {
  userStats: UserStats;
  achievements: Achievement[];
  hasOnboarded: boolean;
  userWhy: string;
  wounds: WoundTracker;

  // XP & Leveling
  addXP: (amount: number) => void;

  // Achievements
  unlockAchievement: (id: string) => void;
  isAchievementUnlocked: (id: string) => boolean;
  registerAchievements: (defs: Achievement[]) => void;

  // Stats
  updateStats: (partial: Partial<UserStats>) => void;
  incrementStat: (key: IncrementableStatKey, amount?: number) => void;
  updateStreak: (newStreak: number) => void;

  // Wound / Consequence tracking
  recordMiss: () => void;
  recordPerfectDay: () => void;
  getConsequenceLevel: () => number;

  // Onboarding
  setOnboarded: () => void;
  setUserWhy: (why: string) => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      userStats: DEFAULT_USER_STATS,
      achievements: [],
      hasOnboarded: false,
      userWhy: '',
      wounds: DEFAULT_WOUND_TRACKER,

      addXP: (amount) => {
        set((s) => {
          // Never go below 0 XP
          const newXP = Math.max(0, s.userStats.totalXP + amount);
          let stats = { ...s.userStats, totalXP: newXP };
          while (stats.totalXP >= xpForLevel(stats.level)) {
            stats = { ...stats, level: stats.level + 1 };
          }
          return { userStats: stats };
        });
      },

      unlockAchievement: (id) => {
        const existing = get().achievements.find((a) => a.id === id);
        if (existing?.unlockedAt) return;
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === id ? { ...a, unlockedAt: Date.now() } : a
          ),
        }));
      },

      isAchievementUnlocked: (id) => {
        return !!get().achievements.find((a) => a.id === id)?.unlockedAt;
      },

      registerAchievements: (defs) => {
        set((s) => {
          const existingIds = new Set(s.achievements.map((a) => a.id));
          const newAchievements = defs.filter((d) => !existingIds.has(d.id));
          return {
            achievements: [
              ...s.achievements,
              ...newAchievements.map((d) => ({ ...d, unlockedAt: undefined })),
            ],
          };
        });
      },

      updateStats: (partial) => {
        set((s) => ({
          userStats: { ...s.userStats, ...partial },
        }));
      },

      incrementStat: (key, amount = 1) => {
        set((s) => ({
          userStats: {
            ...s.userStats,
            [key]: (s.userStats[key] as number) + amount,
          },
        }));
      },

      updateStreak: (newStreak) => {
        set((s) => ({
          userStats: {
            ...s.userStats,
            currentStreak: newStreak,
            longestEverStreak: Math.max(s.userStats.longestEverStreak, newStreak),
          },
        }));
      },

      setOnboarded: () => {
        set({ hasOnboarded: true });
      },

      setUserWhy: (why) => {
        set({ userWhy: why });
      },

      recordMiss: () => {
        set((s) => ({
          wounds: {
            ...s.wounds,
            totalMisses: s.wounds.totalMisses + 1,
            activeWounds: s.wounds.activeWounds + 1,
            perfectDayStreak: 0, // reset streak on miss
            lastMissDate: Date.now(),
          },
        }));
      },

      recordPerfectDay: () => {
        set((s) => {
          const newStreak = s.wounds.perfectDayStreak + 1;
          // Heal a wound every 3 consecutive perfect days
          const healed = newStreak > 0 && newStreak % 3 === 0 && s.wounds.activeWounds > 0;
          return {
            wounds: {
              ...s.wounds,
              perfectDayStreak: newStreak,
              activeWounds: healed ? Math.max(0, s.wounds.activeWounds - 1) : s.wounds.activeWounds,
              healedWounds: healed ? s.wounds.healedWounds + 1 : s.wounds.healedWounds,
            },
          };
        });
      },

      getConsequenceLevel: () => {
        return get().wounds.totalMisses;
      },
    }),
    { name: STORE_KEYS.gamification, storage: asyncStorageAdapter }
  )
);
