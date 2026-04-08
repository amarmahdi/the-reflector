// ──────────────────────────────────────────────
// The Reflector – Notification Scheduler
// ──────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationSettings, Grid40, Routine, DailyTodo } from '@/types/models';
import { TASK_CATEGORIES } from '@/types/models';
import {
  scheduleAlarmNotifee,
  fireAlarmNotifee,
  cancelAlarmNotifee,
} from './alarmNotifee';

/**
 * Build a platform-appropriate daily trigger.
 * iOS supports CALENDAR repeats; Android does not, so we use a DATE trigger
 * set to the next occurrence of the given hour:minute.
 */
function dailyTrigger(hour: number, minute: number): Notifications.NotificationTriggerInput {
  if (Platform.OS === 'ios') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    };
  }
  // Android: compute next occurrence as an absolute Date
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  // If the time already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: target,
  };
}

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request notification permissions. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Parse "HH:MM" string into hours and minutes */
function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h ?? 7, minutes: m ?? 0 };
}

/** Cancel all previously scheduled notifications */
export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Escalating message templates */
const NUDGE_MESSAGES = [
  { title: 'TIME TO MOVE.', body: 'Your routines are waiting. Open The Reflector.' },
  { title: 'STILL PENDING.', body: "The grid doesn't fill itself. Get to work." },
  { title: 'DON\'T LET IT SCAR.', body: 'You have unfinished routines today. Act now.' },
  { title: 'LAST CHANCE.', body: 'The day is almost over. Face it or wear the scar.' },
];

/**
 * Schedule all daily notifications based on user settings and active grids.
 * Call this whenever settings change, a grid starts/ends, or on app launch.
 */
export async function scheduleNotifications(
  settings: NotificationSettings,
  activeGrids: Grid40[],
  routines: Routine[],
  todayTodos: DailyTodo[] = []
): Promise<void> {
  // Always cancel existing before rescheduling
  await cancelAllScheduled();
  if (Platform.OS === 'android') await cancelAlarmNotifee();

  if (!settings.enabled) return;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  const { hours: wakeH, minutes: wakeM } = parseTime(settings.wakeTime);

  // ── Morning reminder ──
  const firstH = wakeH + Math.floor((wakeM + settings.firstReminderOffset) / 60);
  const firstM = (wakeM + settings.firstReminderOffset) % 60;

  const routineNames = activeGrids
    .map((g) => routines.find((r) => r.id === g.routineId)?.title)
    .filter(Boolean)
    .join(', ');

  const wakeBody = routineNames
    ? `Today's routines: ${routineNames.toUpperCase()}`
    : 'Time to check in with your routines.';

  if (Platform.OS === 'android') {
    // Android: use Notifee full-screen intent → wakes device, pops over lock screen
    await scheduleAlarmNotifee(wakeH, wakeM, wakeBody);
  } else {
    // iOS: standard notification (Apple doesn't allow full-screen override)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'WAKE UP, REFLECTOR.',
        body: wakeBody,
        sound: true,
        data: { type: 'wake-alarm' },
      },
      trigger: dailyTrigger(wakeH, wakeM),
    });
  }

  // ── Escalating nudges ──
  if (settings.nudgeInterval > 0) {
    const nudgeCount = Math.min(settings.maxNudges, NUDGE_MESSAGES.length);

    for (let i = 0; i < nudgeCount; i++) {
      const totalOffset = settings.firstReminderOffset + settings.nudgeInterval * (i + 1);
      const nudgeH = wakeH + Math.floor((wakeM + totalOffset) / 60);
      const nudgeM = (wakeM + totalOffset) % 60;

      // Don't schedule past quiet hours
      if (nudgeH >= settings.quietHourStart) break;

      const msg = NUDGE_MESSAGES[i];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: true,
        },
        trigger: dailyTrigger(nudgeH, nudgeM),
      });
    }
  }

  // ── End-of-day warning ──
  if (settings.quietHourStart > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'FINAL WARNING.',
        body: 'Your day is ending. Complete your routines or accept the scar.',
        sound: true,
      },
      trigger: dailyTrigger(settings.quietHourStart - 1, 0),
    });
  }

  // ── Per-task reminders ──
  await scheduleTaskReminders(todayTodos, settings.taskReminderMins);
}

/**
 * Schedule a notification X minutes before each uncompleted task's scheduled time.
 */
async function scheduleTaskReminders(
  todos: DailyTodo[],
  reminderMins: number
): Promise<void> {
  const now = new Date();

  for (const todo of todos) {
    if (todo.completed) continue;
    if (!todo.scheduledTime) continue;

    const { hours, minutes } = parseTime(todo.scheduledTime);

    // Compute reminder time = scheduledTime - reminderMins
    let remH = hours;
    let remM = minutes - reminderMins;
    while (remM < 0) {
      remM += 60;
      remH -= 1;
    }
    if (remH < 0) continue; // can't remind before midnight

    // On Android, skip if reminder time already passed today
    if (Platform.OS === 'android') {
      const target = new Date();
      target.setHours(remH, remM, 0, 0);
      if (target.getTime() <= now.getTime()) continue;
    }

    const catLabel = TASK_CATEGORIES[todo.category]?.label ?? 'TASK';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${catLabel}: ${todo.title.toUpperCase()}`,
        body: reminderMins > 0
          ? `Starting in ${reminderMins} min. Get ready.`
          : 'Time to start. Go.',
        sound: true,
        data: { type: 'task-reminder', todoId: todo.id },
      },
      trigger: dailyTrigger(remH, remM),
    });
  }
}

/** Get count of currently scheduled notifications (for debugging/display) */
export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

/** Fire an alarm notification immediately (for testing) */
export async function fireAlarmNow(label?: string): Promise<void> {
  if (Platform.OS === 'android') {
    // Android: fire Notifee full-screen alarm (wakes device, pops over lock screen)
    await fireAlarmNotifee(label);
    return;
  }

  // iOS fallback
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: label ?? 'WAKE UP, REFLECTOR.',
      body: 'This is a test alarm. Slide to dismiss.',
      sound: true,
      data: { type: 'wake-alarm', label: label ?? 'WAKE UP' },
    },
    trigger: null, // fire immediately
  });
}

// ── Alarm Store Integration ──────────────────────────────────────────────────

import type { Alarm } from '@/types/models';

/**
 * Schedule all alarms from the alarm store.
 * Cancels existing notifications and reschedules everything.
 */
export async function scheduleAllAlarms(
  alarms: Alarm[],
  settings: NotificationSettings,
  activeGrids: Grid40[] = [],
  routines: Routine[] = [],
  todayTodos: DailyTodo[] = []
): Promise<void> {
  await cancelAllScheduled();
  if (Platform.OS === 'android') await cancelAlarmNotifee();

  if (!settings.enabled) return;
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  const enabledAlarms = alarms.filter((a) => a.enabled);
  const now = new Date();
  const today = now.getDay(); // 0-6

  // Track whether first alarm has been scheduled (for nudges)
  let firstAlarmScheduled = false;
  let firstAlarmH = 0;
  let firstAlarmM = 0;

  for (const alarm of enabledAlarms) {
    const { hours: aH, minutes: aM } = parseTime(alarm.time);

    // Check if this alarm should fire today based on repeat
    let shouldFireToday = false;
    switch (alarm.repeat) {
      case 'once':
        shouldFireToday = true;
        break;
      case 'daily':
        shouldFireToday = true;
        break;
      case 'weekdays':
        shouldFireToday = today >= 1 && today <= 5; // Mon-Fri
        break;
      case 'custom':
        shouldFireToday = (alarm.customDays ?? []).includes(today);
        break;
    }

    if (!shouldFireToday) continue;

    // Schedule the alarm
    if (alarm.isFullScreen && Platform.OS === 'android') {
      await scheduleAlarmNotifee(aH, aM, alarm.label || 'Alarm');
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.label || 'ALARM',
          body: alarm.type === 'routine'
            ? 'Time for your routine. Open The Reflector.'
            : alarm.type === 'task'
            ? 'Your task is starting. Get ready.'
            : 'Your alarm is going off.',
          sound: true,
          data: {
            type: 'alarm',
            alarmId: alarm.id,
            alarmLabel: alarm.label,
            alarmType: alarm.type,
            linkedEntityId: alarm.linkedEntityId,
          },
        },
        trigger: dailyTrigger(aH, aM),
      });
    }

    // Track first alarm for nudges
    if (!firstAlarmScheduled) {
      firstAlarmScheduled = true;
      firstAlarmH = aH;
      firstAlarmM = aM;
    }
  }

  // ── Escalating nudges (off the first alarm of the day) ──
  if (firstAlarmScheduled && settings.nudgeInterval > 0) {
    const nudgeCount = Math.min(settings.maxNudges, NUDGE_MESSAGES.length);
    for (let i = 0; i < nudgeCount; i++) {
      const totalOffset = settings.firstReminderOffset + settings.nudgeInterval * (i + 1);
      const nudgeH = firstAlarmH + Math.floor((firstAlarmM + totalOffset) / 60);
      const nudgeM = (firstAlarmM + totalOffset) % 60;
      if (nudgeH >= settings.quietHourStart) break;

      const msg = NUDGE_MESSAGES[i];
      await Notifications.scheduleNotificationAsync({
        content: { title: msg.title, body: msg.body, sound: true },
        trigger: dailyTrigger(nudgeH, nudgeM),
      });
    }
  }

  // ── End-of-day warning ──
  if (settings.quietHourStart > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'FINAL WARNING.',
        body: 'Your day is ending. Complete your routines or accept the scar.',
        sound: true,
      },
      trigger: dailyTrigger(settings.quietHourStart - 1, 0),
    });
  }

  // ── Per-task reminders ──
  await scheduleTaskReminders(todayTodos, settings.taskReminderMins);
}

