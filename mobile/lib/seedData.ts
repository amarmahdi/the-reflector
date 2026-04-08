/**
 * Seed Data — Temporary dev helper
 * Populates all stores with realistic test data.
 * Delete this file after testing.
 *
 * TYPE-SAFE: All state objects are typed against store interfaces.
 * KEY-SAFE: All AsyncStorage keys come from store/keys.ts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORE_KEYS } from '@/store/keys';
import type { ReflectorState } from '@/store/useReflectorStore';
import type { FocusState } from '@/store/useFocusStore';
import type { JournalState } from '@/store/useJournalStore';
import type { GamificationState } from '@/store/useGamificationStore';
import type { AlarmState } from '@/store/useAlarmStore';

// Extract only the data fields (remove action methods)
type ReflectorData = Pick<ReflectorState, 'routines' | 'grids' | 'dailyCheckIns' | 'dailyTodos' | 'recurringTasks' | 'notificationSettings'>;
type FocusData = Pick<FocusState, 'focusSessions'>;
type JournalData = Pick<JournalState, 'journalEntries'>;
type GamificationData = Pick<GamificationState, 'userStats' | 'achievements' | 'hasOnboarded'>;
type AlarmData = Pick<AlarmState, 'alarms'>;

const DAY_MS = 86400000;

function uuid() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime() - n * DAY_MS;
}

export async function seedTestData() {
  // Check if already seeded
  const seeded = await AsyncStorage.getItem('__dev_seeded');
  if (seeded) return;

  const routineId1 = uuid();
  const routineId2 = uuid();
  const routineId3 = uuid();
  const gridId1 = uuid();
  const gridId2 = uuid();

  // Build 40-day grid for routine 1 — started 15 days ago, 12 completed, 2 scarred, 1 pending today
  const grid1Days = Array.from({ length: 40 }, (_, i) => {
    const date = daysAgo(14) + i * DAY_MS;
    let status: 'completed' | 'scarred' | 'pending' = 'pending';
    if (i < 12) status = 'completed';
    else if (i === 5 || i === 9) status = 'scarred';
    return {
      dayIndex: i + 1,
      date,
      status,
      reflection: status === 'scarred' ? 'Missed this day — was traveling.' : undefined,
    };
  });

  // Build 40-day grid for routine 2 — started 7 days ago, 6 completed, 1 scarred
  const grid2Days = Array.from({ length: 40 }, (_, i) => {
    const date = daysAgo(6) + i * DAY_MS;
    let status: 'completed' | 'scarred' | 'pending' = 'pending';
    if (i < 6) status = 'completed';
    else if (i === 3) status = 'scarred';
    return {
      dayIndex: i + 1,
      date,
      status,
    };
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayMs = now.getTime();

  // ── Reflector Store ──
  const reflectorState: { state: ReflectorData; version: number } = {
    state: {
      routines: [
        {
          id: routineId1,
          title: 'Morning Workout',
          subTasks: [
            { id: uuid(), title: 'Push-ups (3 sets)', isCore: true },
            { id: uuid(), title: 'Pull-ups (3 sets)', isCore: true },
            { id: uuid(), title: 'Stretch 10 min', isCore: false },
          ],
          createdAt: daysAgo(20),
          completedGridCount: 0,
        },
        {
          id: routineId2,
          title: 'Reading',
          subTasks: [
            { id: uuid(), title: 'Read 30 pages', isCore: true },
            { id: uuid(), title: 'Take notes', isCore: false },
          ],
          createdAt: daysAgo(10),
          completedGridCount: 0,
        },
        {
          id: routineId3,
          title: 'Meditation',
          subTasks: [
            { id: uuid(), title: 'Sit quietly 15 min', isCore: true },
            { id: uuid(), title: 'Breathing exercise', isCore: true },
            { id: uuid(), title: 'Journal reflection', isCore: false },
          ],
          createdAt: daysAgo(5),
          completedGridCount: 0,
        },
      ],
      grids: [
        {
          id: gridId1,
          routineId: routineId1,
          days: grid1Days,
          status: 'active',
          isHardResetEnabled: false,
          startDate: daysAgo(14),
        },
        {
          id: gridId2,
          routineId: routineId2,
          days: grid2Days,
          status: 'active',
          isHardResetEnabled: true,
          startDate: daysAgo(6),
        },
      ],
      dailyTodos: [
        { id: uuid(), title: 'Meditate 10 minutes', date: todayMs, completed: false, timeBlock: 'morning', category: 'health', priority: 'must', scheduledTime: '06:30', createdAt: todayMs },
        { id: uuid(), title: 'Read 30 pages', date: todayMs, completed: true, timeBlock: 'morning', category: 'learning', priority: 'should', scheduledTime: '08:00', createdAt: todayMs },
        { id: uuid(), title: 'Run 5K', date: todayMs, completed: false, timeBlock: 'afternoon', category: 'health', priority: 'should', scheduledTime: '14:00', createdAt: todayMs },
        { id: uuid(), title: 'Review finances', date: todayMs, completed: false, timeBlock: 'evening', category: 'life', priority: 'nice', scheduledTime: '19:00', createdAt: todayMs },
        { id: uuid(), title: 'Stretch and cool down', date: todayMs, completed: true, timeBlock: 'afternoon', category: 'health', priority: 'nice', scheduledTime: '15:00', createdAt: todayMs },
      ],
      dailyCheckIns: [],
      recurringTasks: [
        { id: uuid(), title: 'Meditate 10 minutes', timeBlock: 'morning', category: 'health', priority: 'must', scheduledTime: '06:30', activeDays: [], createdAt: daysAgo(15) },
        { id: uuid(), title: 'Read 30 pages', timeBlock: 'morning', category: 'learning', priority: 'should', scheduledTime: '08:00', activeDays: [], createdAt: daysAgo(10) },
        { id: uuid(), title: 'Review finances', timeBlock: 'evening', category: 'life', priority: 'nice', scheduledTime: '19:00', activeDays: [], createdAt: daysAgo(5) },
      ],
      notificationSettings: {
        wakeTime: '07:00',
        firstReminderOffset: 30,
        nudgeInterval: 120,
        maxNudges: 4,
        quietHourStart: 22,
        enabled: true,
        taskReminderMins: 1,
        alarmSoundUri: null,
        alarmSoundName: null,
      },
    },
    version: 0,
  };

  // ── Gamification Store ──
  const gamificationState: { state: GamificationData; version: number } = {
    state: {
      userStats: {
        level: 3,
        totalXP: 187,
        currentStreak: 12,
        longestEverStreak: 12,
        totalDaysCompleted: 18,
        totalGridsCompleted: 0,
        totalGridsFailed: 0,
        totalJournalEntries: 4,
        totalFocusMinutes: 285,
        joinedAt: daysAgo(20),
      },
      achievements: [],
      hasOnboarded: true,
    },
    version: 0,
  };

  // ── Focus Store ──
  const focusState: { state: FocusData; version: number } = {
    state: {
      focusSessions: [
        {
          id: uuid(),
          startTime: daysAgo(0) + 9 * 3600000,
          endTime: daysAgo(0) + 9 * 3600000 + 25 * 60000,
          duration: 25 * 60000,
          actualDuration: 25 * 60000,
          type: 'pomodoro' as const,
          completed: true,
          createdAt: daysAgo(0) + 9 * 3600000,
        },
        {
          id: uuid(),
          startTime: daysAgo(0) + 14 * 3600000,
          endTime: daysAgo(0) + 14 * 3600000 + 50 * 60000,
          duration: 50 * 60000,
          actualDuration: 50 * 60000,
          type: 'deep-work' as const,
          completed: true,
          createdAt: daysAgo(0) + 14 * 3600000,
        },
        {
          id: uuid(),
          startTime: daysAgo(1) + 10 * 3600000,
          endTime: daysAgo(1) + 10 * 3600000 + 25 * 60000,
          duration: 25 * 60000,
          actualDuration: 12 * 60000,
          type: 'pomodoro' as const,
          completed: false,
          createdAt: daysAgo(1) + 10 * 3600000,
        },
        {
          id: uuid(),
          startTime: daysAgo(2) + 8 * 3600000,
          endTime: daysAgo(2) + 8 * 3600000 + 90 * 60000,
          duration: 90 * 60000,
          actualDuration: 90 * 60000,
          type: 'flow' as const,
          completed: true,
          createdAt: daysAgo(2) + 8 * 3600000,
        },
      ],
    },
    version: 0,
  };

  // ── Journal Store ──
  const journalState: { state: JournalData; version: number } = {
    state: {
      journalEntries: [
        {
          id: uuid(),
          date: daysAgo(0),
          title: 'Consistency Over Intensity',
          body: "Today I realized that consistency is more important than intensity. Even when I didn't feel like working out, I showed up and did the bare minimum. That's still a win.",
          mood: 'good' as const,
          tags: ['discipline', 'growth'],
          isAutoGenerated: false,
          createdAt: daysAgo(0) + 20 * 3600000,
        },
        {
          id: uuid(),
          date: daysAgo(1),
          title: 'Momentum Building',
          body: "Great day. Hit all my routines, read more than usual, and felt genuinely calm during meditation. The streak is building momentum.",
          mood: 'great' as const,
          tags: ['streak', 'momentum'],
          isAutoGenerated: false,
          createdAt: daysAgo(1) + 21 * 3600000,
        },
        {
          id: uuid(),
          date: daysAgo(3),
          title: 'Missed Workout',
          body: "Missed my workout because I overslept. Feeling frustrated but I know one missed day doesn't erase the progress. Back at it tomorrow.",
          mood: 'rough' as const,
          tags: ['setback', 'resilience'],
          isAutoGenerated: false,
          createdAt: daysAgo(3) + 19 * 3600000,
        },
        {
          id: uuid(),
          date: daysAgo(5),
          title: 'Reading Changes You',
          body: "Started my reading routine this week. Already feeling the benefits — my mind is sharper and I'm sleeping better. Books really do change you.",
          mood: 'good' as const,
          tags: ['reading', 'habits'],
          isAutoGenerated: false,
          createdAt: daysAgo(5) + 20 * 3600000,
        },
      ],
    },
    version: 0,
  };

  // ── Alarm Store ──
  const alarmState: { state: AlarmData; version: number } = {
    state: {
      alarms: [
        {
          id: uuid(),
          label: 'MORNING WORKOUT',
          time: '06:30',
          type: 'routine' as const,
          repeat: 'daily' as const,
          linkedEntityId: routineId1,
          isFullScreen: true,
          useCustomSound: false,
          enabled: true,
          createdAt: daysAgo(14),
        },
        {
          id: uuid(),
          label: 'READING TIME',
          time: '20:00',
          type: 'routine' as const,
          repeat: 'daily' as const,
          linkedEntityId: routineId2,
          isFullScreen: false,
          useCustomSound: false,
          enabled: true,
          createdAt: daysAgo(6),
        },
        {
          id: uuid(),
          label: 'WAKE UP',
          time: '06:00',
          type: 'standalone' as const,
          repeat: 'daily' as const,
          isFullScreen: true,
          useCustomSound: false,
          enabled: true,
          createdAt: daysAgo(20),
        },
      ],
    },
    version: 0,
  };

  // Write all stores — keys from STORE_KEYS, never hardcoded
  await AsyncStorage.multiSet([
    [STORE_KEYS.reflector, JSON.stringify(reflectorState)],
    [STORE_KEYS.gamification, JSON.stringify(gamificationState)],
    [STORE_KEYS.focus, JSON.stringify(focusState)],
    [STORE_KEYS.journal, JSON.stringify(journalState)],
    [STORE_KEYS.alarms, JSON.stringify(alarmState)],
    ['__dev_seeded', 'true'],
  ]);

  console.log('🌱 Test data seeded successfully');
}
