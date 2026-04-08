import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { asyncStorageAdapter } from './storage';
import { STORE_KEYS } from './keys';
import {
  Routine,
  Grid40,
  DailyCheckIn,
  GridDay,
  DailyTodo,
  RecurringTask,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  createGrid40,
  createRoutine,
} from '@/types/models';
import type { SubTask, TaskCategory, TimeBlock, TaskPriority, Pact } from '@/types/models';
import * as Crypto from 'expo-crypto';

// ──────────────────────────────────────────────
// State shape
// ──────────────────────────────────────────────

export interface ReflectorState {
  routines: Routine[];
  grids: Grid40[];
  dailyCheckIns: DailyCheckIn[];
  dailyTodos: DailyTodo[];
  recurringTasks: RecurringTask[];
  pacts: Pact[];
  notificationSettings: NotificationSettings;

  // ── Routine actions ──
  addRoutine: (title: string, subTasks: Omit<SubTask, 'id'>[]) => Routine;

  // ── Grid actions ──
  startGrid: (routineId: string, hardReset: boolean) => Grid40;
  markDayCompleted: (gridId: string, dayIndex: number) => void;
  markDayScarred: (gridId: string, dayIndex: number, failureReason: string) => void;
  failGrid: (gridId: string) => void;
  completeGrid: (gridId: string) => void;

  // ── Daily check-in actions ──
  toggleSubTask: (gridId: string, dayIndex: number, subTaskId: string) => void;
  getCheckIn: (gridId: string, dayIndex: number) => DailyCheckIn | undefined;

  // ── Daily todo actions ──
  addTodo: (title: string, category: TaskCategory, timeBlock: TimeBlock, priority: TaskPriority, scheduledTime: string) => DailyTodo;
  toggleTodo: (todoId: string) => void;
  removeTodo: (todoId: string) => void;

  // ── Recurring task actions ──
  addRecurringTask: (title: string, category: TaskCategory, timeBlock: TimeBlock, priority: TaskPriority, scheduledTime: string, activeDays: number[]) => RecurringTask;
  removeRecurringTask: (taskId: string) => void;
  editRecurringTask: (id: string, updates: Partial<Omit<RecurringTask, 'id' | 'createdAt'>>) => void;
  toggleRecurringTaskPause: (id: string) => void;
  generateDailyTodos: () => void;

  // ── Notification settings ──
  updateNotificationSettings: (partial: Partial<NotificationSettings>) => void;

  // ── Queries ──
  getActiveGrids: () => Grid40[];
  getRoutineById: (routineId: string) => Routine | undefined;
  getGridById: (gridId: string) => Grid40 | undefined;

  // ── Routine editing ──
  editRoutine: (id: string, title: string, subTasks: SubTask[]) => void;
  deleteRoutine: (id: string) => void;
  deleteGrid: (gridId: string) => void;
  clearOldTodos: (beforeDate: number) => void;

  // ── Hard Reset check ──
  checkHardReset: (gridId: string) => boolean;

  // ── Pact actions ──
  signPact: (pact: Omit<Pact, 'id' | 'signedAt'>) => void;
  getPactForGrid: (gridId: string) => Pact | undefined;

  // ── Prestige ──
  incrementRoutinePrestige: (routineId: string) => void;

  // ── Scar detection (for Reflection Lock) ──
  getNewlyScarredDays: () => { grid: Grid40; day: GridDay }[];
}

// ──────────────────────────────────────────────
// Store implementation
// ──────────────────────────────────────────────

export const useReflectorStore = create<ReflectorState>()(
  persist(
    (set, get) => ({
      routines: [],
      grids: [],
      dailyCheckIns: [],
      dailyTodos: [],
      recurringTasks: [],
      pacts: [],
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,

      // ── Routine actions ──────────────────────

      addRoutine: (title, subTasks) => {
        const routine = createRoutine(title, subTasks);
        set((state) => ({ routines: [...state.routines, routine] }));
        return routine;
      },

      // ── Grid actions ─────────────────────────

      startGrid: (routineId, hardReset) => {
        // Pass the routine's completedGridCount so prestige can force hard reset
        const routine = get().routines.find((r) => r.id === routineId);
        const grid = createGrid40(routineId, hardReset, routine?.completedGridCount ?? 0);
        set((state) => ({ grids: [...state.grids, grid] }));
        return grid;
      },

      markDayCompleted: (gridId, dayIndex) => {
        set((state) => ({
          grids: state.grids.map((g) =>
            g.id === gridId
              ? {
                  ...g,
                  days: g.days.map((d) =>
                    d.dayIndex === dayIndex ? { ...d, status: 'completed' as const } : d
                  ),
                }
              : g
          ),
        }));
      },

      markDayScarred: (gridId, dayIndex, failureReason) => {
        set((state) => ({
          grids: state.grids.map((g) =>
            g.id === gridId
              ? {
                  ...g,
                  days: g.days.map((d) =>
                    d.dayIndex === dayIndex
                      ? { ...d, status: 'scarred' as const, failureReason }
                      : d
                  ),
                }
              : g
          ),
        }));
      },

      failGrid: (gridId) => {
        set((state) => ({
          grids: state.grids.map((g) =>
            g.id === gridId ? { ...g, status: 'failed' as const } : g
          ),
        }));
      },

      completeGrid: (gridId) => {
        set((state) => {
          const grid = state.grids.find((g) => g.id === gridId);
          const updatedGrids = state.grids.map((g) =>
            g.id === gridId ? { ...g, status: 'completed' as const } : g
          );
          // Also increment prestige for the linked routine
          const updatedRoutines = grid
            ? state.routines.map((r) =>
                r.id === grid.routineId
                  ? { ...r, completedGridCount: (r.completedGridCount ?? 0) + 1 }
                  : r
              )
            : state.routines;
          return { grids: updatedGrids, routines: updatedRoutines };
        });
      },

      // ── Daily check-in actions ───────────────

      toggleSubTask: (gridId, dayIndex, subTaskId) => {
        set((state) => {
          const existing = state.dailyCheckIns.find(
            (c) => c.gridId === gridId && c.dayIndex === dayIndex
          );

          if (existing) {
            const has = existing.completedSubTaskIds.includes(subTaskId);
            return {
              dailyCheckIns: state.dailyCheckIns.map((c) =>
                c.gridId === gridId && c.dayIndex === dayIndex
                  ? {
                      ...c,
                      completedSubTaskIds: has
                        ? c.completedSubTaskIds.filter((id) => id !== subTaskId)
                        : [...c.completedSubTaskIds, subTaskId],
                    }
                  : c
              ),
            };
          }

          return {
            dailyCheckIns: [
              ...state.dailyCheckIns,
              { gridId, dayIndex, completedSubTaskIds: [subTaskId] },
            ],
          };
        });
      },

      getCheckIn: (gridId, dayIndex) => {
        return get().dailyCheckIns.find(
          (c) => c.gridId === gridId && c.dayIndex === dayIndex
        );
      },

      // ── Daily todo actions ────────────────────

      addTodo: (title, category, timeBlock, priority, scheduledTime) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todo: DailyTodo = {
          id: Crypto.randomUUID(),
          title,
          completed: false,
          category,
          timeBlock,
          priority,
          scheduledTime,
          date: now.getTime(),
          createdAt: Date.now(),
        };
        set((state) => ({ dailyTodos: [...state.dailyTodos, todo] }));
        return todo;
      },

      toggleTodo: (todoId) => {
        set((state) => ({
          dailyTodos: state.dailyTodos.map((t) =>
            t.id === todoId ? { ...t, completed: !t.completed } : t
          ),
        }));
      },

      removeTodo: (todoId) => {
        set((state) => ({
          dailyTodos: state.dailyTodos.filter((t) => t.id !== todoId),
        }));
      },

      // ── Recurring task actions ──────────────────

      addRecurringTask: (title, category, timeBlock, priority, scheduledTime, activeDays) => {
        const task: RecurringTask = {
          id: Crypto.randomUUID(),
          title,
          category,
          timeBlock,
          priority,
          scheduledTime,
          activeDays,
          createdAt: Date.now(),
        };
        set((state) => ({ recurringTasks: [...state.recurringTasks, task] }));
        return task;
      },

      removeRecurringTask: (taskId) => {
        set((state) => ({
          recurringTasks: state.recurringTasks.filter((t) => t.id !== taskId),
          dailyTodos: state.dailyTodos.filter((t) => t.recurringTaskId !== taskId),
        }));
      },

      editRecurringTask: (id, updates) => {
        set((state) => ({
          recurringTasks: state.recurringTasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        }));
      },

      toggleRecurringTaskPause: (id) => {
        set((state) => ({
          recurringTasks: state.recurringTasks.map((t) =>
            t.id === id ? { ...t, isPaused: !t.isPaused, updatedAt: Date.now() } : t
          ),
        }));
      },

      generateDailyTodos: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayStart = now.getTime();
        const dayOfWeek = now.getDay();

        const { recurringTasks, dailyTodos } = get();

        const newTodos: DailyTodo[] = [];
        for (const task of recurringTasks) {
          // Check if this task is active today
          if (task.activeDays.length > 0 && !task.activeDays.includes(dayOfWeek)) continue;
          if (task.isPaused) continue;

          // Check if already generated for today
          const exists = dailyTodos.some(
            (t) => t.recurringTaskId === task.id && t.date === todayStart
          );
          if (exists) continue;

          newTodos.push({
            id: Crypto.randomUUID(),
            title: task.title,
            completed: false,
            category: task.category,
            timeBlock: task.timeBlock,
            priority: task.priority,
            scheduledTime: task.scheduledTime,
            recurringTaskId: task.id,
            date: todayStart,
            createdAt: Date.now(),
          });
        }

        if (newTodos.length > 0) {
          set((state) => ({ dailyTodos: [...state.dailyTodos, ...newTodos] }));
        }
      },

      // ── Notification settings ──────────────────

      updateNotificationSettings: (partial) => {
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...partial },
        }));
      },

      // ── Queries ──────────────────────────────

      getActiveGrids: () => {
        return get().grids.filter((g) => g.status === 'active');
      },

      getRoutineById: (routineId) => {
        return get().routines.find((r) => r.id === routineId);
      },

      getGridById: (gridId) => {
        return get().grids.find((g) => g.id === gridId);
      },

      // ── Routine editing ──────────────────────

      editRoutine: (id, title, subTasks) => {
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id ? { ...r, title, subTasks } : r
          ),
        }));
      },

      deleteRoutine: (id) => {
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
          // Also remove grids that use this routine (only non-active ones)
          grids: state.grids.filter((g) => g.routineId !== id || g.status === 'active'),
        }));
      },

      deleteGrid: (gridId) => {
        set((state) => ({
          grids: state.grids.filter((g) => g.id !== gridId),
          dailyCheckIns: state.dailyCheckIns.filter((c) => c.gridId !== gridId),
        }));
      },

      clearOldTodos: (beforeDate) => {
        set((state) => ({
          dailyTodos: state.dailyTodos.filter((t) => t.date >= beforeDate),
        }));
      },

      // ── Hard Reset check ─────────────────────

      checkHardReset: (gridId) => {
        const grid = get().grids.find((g) => g.id === gridId);
        if (!grid || !grid.isHardResetEnabled) return false;

        for (let i = 0; i < grid.days.length - 1; i++) {
          if (
            grid.days[i].status === 'scarred' &&
            grid.days[i + 1].status === 'scarred'
          ) {
            return true; // 2 consecutive scarred days found
          }
        }
        return false;
      },

      // ── Pact actions ──────────────────────────

      signPact: (pact) => {
        const newPact: Pact = {
          ...pact,
          id: Crypto.randomUUID(),
          signedAt: Date.now(),
        };
        set((state) => ({ pacts: [...state.pacts, newPact] }));
      },

      getPactForGrid: (gridId) => {
        return get().pacts.find((p) => p.gridId === gridId);
      },

      // ── Prestige ─────────────────────────────

      incrementRoutinePrestige: (routineId) => {
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === routineId
              ? { ...r, completedGridCount: (r.completedGridCount ?? 0) + 1 }
              : r
          ),
        }));
      },

      // ── Scar detection ──────────────────────

      getNewlyScarredDays: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayStart = now.getTime();
        const MS_PER_DAY = 86_400_000;
        const yesterdayStart = todayStart - MS_PER_DAY;

        const results: { grid: Grid40; day: GridDay }[] = [];

        for (const grid of get().grids) {
          if (grid.status !== 'active') continue;

          for (const day of grid.days) {
            // A day that passed (yesterday or earlier) and is still pending → newly scarred
            if (day.date <= yesterdayStart && day.status === 'pending') {
              results.push({ grid, day });
            }
          }
        }

        return results;
      },
    }),
    {
      name: STORE_KEYS.reflector,
      storage: asyncStorageAdapter,
    }
  )
);
