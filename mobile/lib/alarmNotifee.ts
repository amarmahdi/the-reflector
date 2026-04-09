// ──────────────────────────────────────────────
// The Reflector – Notifee Alarm (Android Full-Screen Intent)
// ──────────────────────────────────────────────

import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
  TriggerType,
  EventType,
  AndroidNotificationSetting,
  AlarmType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

const ALARM_CHANNEL_ID = 'reflector-alarm-v3';
const ACTIVITY_CLASS = 'com.anonymous.thereflector.MainActivity';

/**
 * Shared notification config for alarm display.
 * Used by both the trigger notification and the re-displayed immediate notification.
 */
function alarmNotificationConfig(title: string, body: string) {
  return {
    title,
    body,
    android: {
      channelId: ALARM_CHANNEL_ID,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      asForegroundService: true,
      fullScreenAction: {
        id: 'wake-alarm',
        launchActivity: ACTIVITY_CLASS,
      },
      ongoing: true,
      autoCancel: false,
      pressAction: {
        id: 'wake-alarm',
        launchActivity: ACTIVITY_CLASS,
      },
      lights: ['#FF0000', 500, 500] as [string, number, number],
      vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
    },
  };
}

/**
 * Check + request exact alarm permission (required on Android 12+).
 */
export async function ensureExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const settings = await notifee.getNotificationSettings();
    if (settings.android.alarm === AndroidNotificationSetting.ENABLED) return true;
    console.warn('[ALARM] Exact alarm permission: NOT GRANTED — opening settings');
    await notifee.openAlarmPermissionSettings();
    return false;
  } catch (e) {
    console.error('[ALARM] Permission check failed:', e);
    return false;
  }
}

/**
 * Create the high-priority alarm notification channel.
 */
export async function ensureAlarmChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await notifee.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'Wake Alarm',
      description: 'Full-screen alarm that wakes your device',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default',
      vibration: true,
      bypassDnd: true,
    });
  } catch (e) {
    console.error('[ALARM] Failed to create channel:', e);
  }
}

/**
 * Fire the alarm immediately.
 */
export async function fireAlarmNotifee(label?: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  await ensureAlarmChannel();
  try {
    await notifee.displayNotification(
      alarmNotificationConfig(
        label ?? 'WAKE UP, REFLECTOR.',
        'Your alarm is going off. Face it.'
      )
    );
    console.log('[ALARM] Immediate alarm fired');
  } catch (e) {
    console.error('[ALARM] Failed to fire immediate alarm:', e);
  }
}

/**
 * Schedule an alarm at a specific hour:minute.
 */
export async function scheduleAlarmNotifee(
  hour: number,
  minute: number,
  label: string = 'WAKE UP, REFLECTOR.',
  id?: string,
): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  await ensureExactAlarmPermission();
  await ensureAlarmChannel();

  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  try {
    const config = alarmNotificationConfig(label, 'Time to check in. Open The Reflector.');
    const notifId = await notifee.createTriggerNotification(
      {
        ...(id ? { id } : {}),
        ...config,
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: target.getTime(),
        alarmManager: {
          type: AlarmType.SET_ALARM_CLOCK,
          allowWhileIdle: true,
        },
      }
    );

    console.log(`[ALARM] Scheduled "${label}" for ${hour}:${String(minute).padStart(2, '0')} → ${target.toLocaleString()}`);
    return notifId;
  } catch (e) {
    console.error('[ALARM] Failed to schedule alarm:', e);
    return null;
  }
}

/**
 * Cancel all alarm notifications and triggers.
 */
export async function cancelAlarmNotifee(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await notifee.stopForegroundService();
  } catch {}
  try {
    await notifee.cancelAllNotifications();
    await notifee.cancelTriggerNotifications();
    console.log('[ALARM] All alarms cancelled');
  } catch (e) {
    console.error('[ALARM] Failed to cancel:', e);
  }
}

/**
 * Background event handler — runs in headless JS when app is killed.
 * When the scheduled trigger fires, it re-displays an IMMEDIATE
 * foreground-service notification to force the device to wake up.
 */
export function registerNotifeeBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('[ALARM] Background event:', type, detail.notification?.title);

    if (type === EventType.DELIVERED) {
      console.log('[ALARM] Trigger DELIVERED — firing foreground-service alarm');
      try {
        await ensureAlarmChannel();
        await notifee.displayNotification(
          alarmNotificationConfig(
            detail.notification?.title ?? 'WAKE UP, REFLECTOR.',
            detail.notification?.body ?? 'Your alarm is going off. Face it.'
          )
        );
      } catch (e) {
        console.error('[ALARM] Background display failed:', e);
      }
    }

    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
      try { await notifee.stopForegroundService(); } catch {}
      await notifee.cancelAllNotifications();
    }
  });
}
