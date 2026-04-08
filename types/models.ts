// ──────────────────────────────────────────────
// The Reflector – Core Data Models
// ──────────────────────────────────────────────

/** Lifecycle status of a 40-day grid */
export type RoutineStatus = 'active' | 'completed' | 'failed';

/** Status of a single day within a Grid40 */
export type DayStatus = 'pending' | 'completed' | 'scarred';

/** A sub-task within a routine */
export interface SubTask {
  id: string;
  title: string;
  /** If false, can be hidden during "Recalibrate / Survival" mode */
  isCore: boolean;
}

// ──────────────────────────────────────────────
// Prestige System (New Game+)
// ──────────────────────────────────────────────

export type PrestigeLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const PRESTIGE_CONFIG: Record<PrestigeLevel, {
  name: string;
  emoji: string;
  xpMultiplier: number;
  hardResetForced: boolean;
  reflectionMinChars: number;
}> = {
  0: { name: 'Untested',   emoji: '',   xpMultiplier: 1.0, hardResetForced: false, reflectionMinChars: 50  },
  1: { name: 'Tested',     emoji: '⭐',  xpMultiplier: 1.2, hardResetForced: false, reflectionMinChars: 50  },
  2: { name: 'Trained',    emoji: '⭐⭐', xpMultiplier: 1.5, hardResetForced: true,  reflectionMinChars: 75  },
  3: { name: 'Mastered',   emoji: '⭐⭐⭐',xpMultiplier: 2.0, hardResetForced: true,  reflectionMinChars: 100 },
  4: { name: 'Elite',      emoji: '💎',  xpMultiplier: 2.5, hardResetForced: true,  reflectionMinChars: 100 },
  5: { name: 'Legendary',  emoji: '👑',  xpMultiplier: 3.0, hardResetForced: true,  reflectionMinChars: 150 },
};

export function getPrestigeLevel(completions: number): PrestigeLevel {
  return Math.min(5, completions) as PrestigeLevel;
}

/** A routine definition (template) */
export interface Routine {
  id: string;
  title: string; // e.g., "Morning Block", "Deep Work"
  subTasks: SubTask[];
  createdAt: number; // epoch ms
  /** Number of times a grid for this routine has been completed */
  completedGridCount: number;
}

/** A single day entry inside a Grid40 */
export interface GridDay {
  dayIndex: number; // 1 – 40
  date: number; // epoch ms (start-of-day)
  status: DayStatus;
  /** Filled when status is 'scarred' via the Reflection Lock */
  failureReason?: string;
}

/** A 40-day tracking grid bound to one Routine */
export interface Grid40 {
  id: string;
  routineId: string;
  startDate: number; // epoch ms
  status: RoutineStatus;
  days: GridDay[];
  /** If true, 2 consecutive 'scarred' days → grid status = 'failed' */
  isHardResetEnabled: boolean;
}

/** Daily completion record – tracks which sub-tasks are done today */
export interface DailyCheckIn {
  gridId: string;
  dayIndex: number;
  completedSubTaskIds: string[];
}

/** Task category */
export type TaskCategory = 'life' | 'work' | 'health' | 'errands' | 'learning' | 'quick';

/** Time block within a day */
export type TimeBlock = 'morning' | 'afternoon' | 'evening';

/** Priority level */
export type TaskPriority = 'must' | 'should' | 'nice';

/** Category display metadata */
export const TASK_CATEGORIES: Record<TaskCategory, { label: string; color: string }> = {
  life: { label: 'LIFE', color: '#4FC3F7' },
  work: { label: 'WORK', color: '#FFB74D' },
  health: { label: 'HEALTH', color: '#81C784' },
  errands: { label: 'ERRANDS', color: '#E57373' },
  learning: { label: 'LEARNING', color: '#BA68C8' },
  quick: { label: 'QUICK', color: '#90A4AE' },
};

/** A recurring task template — auto-generates DailyTodo items each day */
export interface RecurringTask {
  id: string;
  title: string;
  category: TaskCategory;
  timeBlock: TimeBlock;
  priority: TaskPriority;
  /** Scheduled time as "HH:MM" (24h), e.g. "09:30" */
  scheduledTime: string;
  /** Days of week active: 0=Sun, 1=Mon, …, 6=Sat. Empty = every day. */
  activeDays: number[];
  /** If true, this recurring task is paused and won't generate daily todos */
  isPaused?: boolean;
  /** Last time this task was updated */
  updatedAt?: number;
  createdAt: number;
}

/** A daily to-do item */
export interface DailyTodo {
  id: string;
  title: string;
  completed: boolean;
  category: TaskCategory;
  timeBlock: TimeBlock;
  priority: TaskPriority;
  /** Scheduled time as "HH:MM" (24h), e.g. "09:30" */
  scheduledTime: string;
  /** If generated from a RecurringTask, this links back */
  recurringTaskId?: string;
  date: number; // epoch ms (start-of-day) — items belong to this date
  createdAt: number;
}

/** User notification / schedule preferences */
export interface NotificationSettings {
  /** Wake time as "HH:MM" (24h format), e.g. "06:30" */
  wakeTime: string;
  /** Minutes after wake time for first reminder */
  firstReminderOffset: number;
  /** Minutes between escalating nudges (0 = disabled) */
  nudgeInterval: number;
  /** How many escalating nudges before giving up for the day */
  maxNudges: number;
  /** Hour (0-23) after which no more notifications fire */
  quietHourStart: number;
  /** Whether notifications are enabled at all */
  enabled: boolean;
  /** Minutes before a task's scheduled time to send a reminder */
  taskReminderMins: number;
  /** Custom alarm sound URI from device (null = use default alarm.wav) */
  alarmSoundUri: string | null;
  /** Display name of the selected alarm sound */
  alarmSoundName: string | null;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  wakeTime: '07:00',
  firstReminderOffset: 30, // 30 min after wake
  nudgeInterval: 120, // every 2 hours
  maxNudges: 4,
  quietHourStart: 22, // 10 PM
  enabled: true,
  taskReminderMins: 1,
  alarmSoundUri: null,
  alarmSoundName: null,
};

// ──────────────────────────────────────────────
// Helper / factory utilities
// ──────────────────────────────────────────────

import * as Crypto from 'expo-crypto';

/** Create an empty 40-day array starting from a given date */
export function createGrid40Days(startDate: number): GridDay[] {
  const MS_PER_DAY = 86_400_000;
  return Array.from({ length: 40 }, (_, i) => ({
    dayIndex: i + 1,
    date: startDate + i * MS_PER_DAY,
    status: 'pending' as DayStatus,
  }));
}

/** Build a fresh Grid40 for a given routine */
export function createGrid40(
  routineId: string,
  hardReset: boolean,
  completedGridCount?: number,
): Grid40 {
  const now = new Date();
  // Normalise to start-of-day
  now.setHours(0, 0, 0, 0);
  const startDate = now.getTime();

  // Prestige ≥ 2 forces Hard Reset regardless of user choice
  const prestige = getPrestigeLevel(completedGridCount ?? 0);
  const forceHardReset = PRESTIGE_CONFIG[prestige].hardResetForced;

  return {
    id: Crypto.randomUUID(),
    routineId,
    startDate,
    status: 'active',
    days: createGrid40Days(startDate),
    isHardResetEnabled: hardReset || forceHardReset,
  };
}

/** Build a new Routine definition */
export function createRoutine(title: string, subTasks: Omit<SubTask, 'id'>[]): Routine {
  return {
    id: Crypto.randomUUID(),
    title,
    subTasks: subTasks.map((st) => ({ ...st, id: Crypto.randomUUID() })),
    createdAt: Date.now(),
    completedGridCount: 0,
  };
}

// ──────────────────────────────────────────────
// Journal System
// ──────────────────────────────────────────────

/** Mood options for journal entries */
export type JournalMood = 'great' | 'good' | 'neutral' | 'rough' | 'terrible';

/** A journal entry — manual or auto-generated from reflection lock */
export interface JournalEntry {
  id: string;
  date: number;           // epoch ms (start-of-day)
  title: string;
  body: string;
  mood: JournalMood;
  tags: string[];
  /** If linked to a grid day (e.g. from reflection lock) */
  linkedGridId?: string;
  linkedDayIndex?: number;
  /** true if auto-created by the reflection lock (fire.tsx) */
  isAutoGenerated: boolean;
  createdAt: number;
}

export const MOOD_CONFIG: Record<JournalMood, { emoji: string; label: string; color: string }> = {
  great:   { emoji: '🔥', label: 'GREAT',   color: '#4CAF50' },
  good:    { emoji: '👍', label: 'GOOD',    color: '#8BC34A' },
  neutral: { emoji: '😐', label: 'NEUTRAL', color: '#9E9E9E' },
  rough:   { emoji: '😓', label: 'ROUGH',   color: '#FF9800' },
  terrible:{ emoji: '💀', label: 'TERRIBLE',color: '#F44336' },
};

// ──────────────────────────────────────────────
// Focus Timer
// ──────────────────────────────────────────────

/** Type of focus session */
export type FocusSessionType = 'pomodoro' | 'deep-work' | 'flow' | 'custom';

/** A recorded focus/deep-work session */
export interface FocusSession {
  id: string;
  startTime: number;       // epoch ms
  endTime: number;         // epoch ms
  duration: number;        // planned duration in ms
  actualDuration: number;  // actual elapsed in ms
  type: FocusSessionType;
  linkedGridId?: string;
  linkedSubTaskId?: string;
  completed: boolean;      // finished full duration?
  createdAt: number;
}

export const FOCUS_PRESETS: Record<FocusSessionType, { label: string; minutes: number; icon: string }> = {
  pomodoro:  { label: 'POMODORO',  minutes: 25,  icon: '🍅' },
  'deep-work': { label: 'DEEP WORK', minutes: 50, icon: '🧠' },
  flow:      { label: 'FLOW STATE', minutes: 90,  icon: '🌊' },
  custom:    { label: 'CUSTOM',     minutes: 0,   icon: '⚙️' },
};

// ──────────────────────────────────────────────
// Gamification & Achievements
// ──────────────────────────────────────────────

/** Achievement category */
export type AchievementCategory = 'streaks' | 'grids' | 'focus' | 'journal' | 'special';

/** An achievement definition with optional unlock timestamp */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;           // emoji
  unlockedAt?: number;    // epoch ms — undefined = locked
  category: AchievementCategory;
  requirement: string;    // human-readable
}

/** Lifetime user statistics */
export interface UserStats {
  totalXP: number;
  level: number;
  currentStreak: number;       // consecutive days with ≥1 routine completed
  longestEverStreak: number;
  totalDaysCompleted: number;
  totalGridsCompleted: number;
  totalGridsFailed: number;
  totalFocusMinutes: number;
  totalJournalEntries: number;
  joinedAt: number;            // epoch ms
}

export const DEFAULT_USER_STATS: UserStats = {
  totalXP: 0,
  level: 1,
  currentStreak: 0,
  longestEverStreak: 0,
  totalDaysCompleted: 0,
  totalGridsCompleted: 0,
  totalGridsFailed: 0,
  totalFocusMinutes: 0,
  totalJournalEntries: 0,
  joinedAt: Date.now(),
};

/** Calculate XP needed for a given level */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ──────────────────────────────────────────────
// Flexible Alarm System
// ──────────────────────────────────────────────

/** What entity this alarm is linked to */
export type AlarmType = 'task' | 'routine' | 'standalone';

/** Repeat pattern for alarms */
export type AlarmRepeat = 'once' | 'daily' | 'weekdays' | 'custom';

/** A user-configurable alarm */
export interface Alarm {
  id: string;
  label: string;          // e.g. "Wake Up", "Gym Time", "Sleep"
  time: string;           // "HH:MM" format
  type: AlarmType;
  repeat: AlarmRepeat;
  /** Custom repeat days (0=Sun..6=Sat). Only used when repeat='custom' */
  customDays?: number[];
  /** Linked entity ID (taskId, routineId, or null for standalone) */
  linkedEntityId?: string;
  /** Whether to use full-screen alarm (Android) or just notification */
  isFullScreen: boolean;
  /** Whether to use custom sound vs default */
  useCustomSound: boolean;
  /** Custom sound filename (from downloaded YouTube audio) */
  customSoundFile?: string;
  enabled: boolean;
  createdAt: number;
}

// ──────────────────────────────────────────────
// The Pact (Accountability Contract)
// ──────────────────────────────────────────────

/** A signed accountability pact bound to a grid */
export interface Pact {
  id: string;
  gridId: string;
  /** "Why does this routine matter to you?" — min 50 chars */
  why: string;
  /** "What will you sacrifice if you quit?" */
  sacrifice: string;
  /** "What do you earn if you complete all 40 days?" */
  reward: string;
  /** User's typed name as digital signature */
  signedName: string;
  signedAt: number;       // epoch ms
}

// ──────────────────────────────────────────────
// Discipline Score System
// ──────────────────────────────────────────────

/** A daily snapshot of the user's discipline across all dimensions */
export interface DisciplineSnapshot {
  date: number;           // epoch ms (start-of-day)
  score: number;          // 0-100 composite
  breakdown: {
    routineScore: number;   // 0-100: % of grid tasks completed today
    focusScore: number;     // 0-100: minutes vs daily goal (default 60min)
    taskScore: number;      // 0-100: % of DailyTodos completed
    journalScore: number;   // 0-100: 100 if journaled today, streak bonus
    wakeScore: number;      // 0-100: 100 if app opened before wakeTime
  };
  createdAt: number;
}

export const DISCIPLINE_WEIGHTS = {
  routine: 0.30,
  focus: 0.20,
  task: 0.20,
  journal: 0.15,
  wake: 0.15,
} as const;

export const DEFAULT_FOCUS_GOAL_MINUTES = 60;

// ──────────────────────────────────────────────
// Consequence Engine — Wound Tracking
// ──────────────────────────────────────────────

/** Tracks accumulated consequences from missed routine days */
export interface WoundTracker {
  totalMisses: number;       // lifetime misses across all grids
  activeWounds: number;      // current unhealable wound count
  healedWounds: number;      // wounds healed via perfect day streaks
  perfectDayStreak: number;  // consecutive perfect days (for healing)
  lastMissDate: number;      // epoch ms of last miss
}

export const DEFAULT_WOUND_TRACKER: WoundTracker = {
  totalMisses: 0,
  activeWounds: 0,
  healedWounds: 0,
  perfectDayStreak: 0,
  lastMissDate: 0,
};
