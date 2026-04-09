// ──────────────────────────────────────────────
// The Reflector – Notification Scheduler
// ──────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationSettings, Grid40, Routine, DailyTodo } from '@/types/models';
import type { Alarm } from '@/types/models';
import {
  scheduleAlarmNotifee,
  fireAlarmNotifee,
  cancelAlarmNotifee,
} from './alarmNotifee';

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

/** Fire an alarm notification immediately (for testing) */
export async function fireAlarmNow(label?: string): Promise<void> {
  if (Platform.OS === 'android') {
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
      data: { type: 'wake-alarm' },
    },
    trigger: null,
  });
}

/** Get count of currently scheduled notifications (for debugging/display) */
export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

/**
 * Schedule all alarms from the alarm store.
 * This is the ONLY scheduling function that should be called.
 * It cancels everything first, then schedules only the user's enabled alarms.
 */
export async function scheduleAllAlarms(
  alarms: Alarm[],
  settings: NotificationSettings,
  _activeGrids: Grid40[] = [],
  _routines: Routine[] = [],
  _todayTodos: DailyTodo[] = []
): Promise<void> {
  // Cancel everything first — clean slate
  await cancelAllScheduled();
  if (Platform.OS === 'android') await cancelAlarmNotifee();

  if (!settings.enabled) return;
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  const enabledAlarms = alarms.filter((a) => a.enabled);
  const now = new Date();
  const today = now.getDay(); // 0=Sun, 6=Sat

  let scheduledCount = 0;

  for (const alarm of enabledAlarms) {
    const { hours: aH, minutes: aM } = parseTime(alarm.time);

    // Check if this alarm should fire today based on repeat
    let shouldSchedule = false;
    switch (alarm.repeat) {
      case 'once':
      case 'daily':
        shouldSchedule = true;
        break;
      case 'weekdays':
        shouldSchedule = today >= 1 && today <= 5;
        break;
      case 'custom':
        shouldSchedule = (alarm.customDays ?? []).includes(today);
        break;
    }

    if (!shouldSchedule) continue;

    // On Android: always use Notifee (full-screen capable alarm)
    if (Platform.OS === 'android') {
      await scheduleAlarmNotifee(aH, aM, alarm.label || 'ALARM', `alarm-${alarm.id}`);
      scheduledCount++;
    } else {
      // iOS: use expo-notifications
      const target = new Date();
      target.setHours(aH, aM, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.label || 'ALARM',
          body: 'Your alarm is going off.',
          sound: true,
          data: { type: 'alarm', alarmId: alarm.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: target,
        },
      });
      scheduledCount++;
    }
  }

  console.log(`[ALARM] Scheduled ${scheduledCount} alarm(s). ${enabledAlarms.length} enabled, ${alarms.length} total.`);
}
