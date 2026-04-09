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

/**
 * Check + request exact alarm permission (required on Android 12+).
 * Returns true if permission is granted.
 */
export async function ensureExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const settings = await notifee.getNotificationSettings();
    const alarmStatus = settings.android.alarm;

    if (alarmStatus === AndroidNotificationSetting.ENABLED) {
      return true;
    }

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
 * Must be called before any alarm notification is displayed.
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
 * Fire the alarm immediately — wakes the device, pops over the lock screen.
 */
export async function fireAlarmNotifee(label?: string): Promise<void> {
  if (Platform.OS !== 'android') return;

  await ensureAlarmChannel();

  try {
    await notifee.displayNotification({
      title: label ?? 'WAKE UP, REFLECTOR.',
      body: 'Your alarm is going off. Face it.',
      android: {
        channelId: ALARM_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        fullScreenAction: {
          id: 'wake-alarm',
          launchActivity: 'default',
        },
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: 'wake-alarm',
          launchActivity: 'default',
        },
      },
    });
    console.log('[ALARM] Immediate alarm fired');
  } catch (e) {
    console.error('[ALARM] Failed to fire immediate alarm:', e);
  }
}

/**
 * Schedule an alarm at a specific hour:minute using Notifee trigger.
 * Returns the notification ID so it can be cancelled individually.
 */
export async function scheduleAlarmNotifee(
  hour: number,
  minute: number,
  label: string = 'WAKE UP, REFLECTOR.',
  id?: string,
): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  const hasPermission = await ensureExactAlarmPermission();
  if (!hasPermission) {
    console.warn('[ALARM] Skipping schedule — no exact alarm permission');
  }

  await ensureAlarmChannel();

  // Compute next occurrence
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  try {
    const notifId = await notifee.createTriggerNotification(
      {
        ...(id ? { id } : {}),
        title: label,
        body: 'Time to check in. Open The Reflector.',
        android: {
          channelId: ALARM_CHANNEL_ID,
          category: AndroidCategory.ALARM,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          fullScreenAction: {
            id: 'wake-alarm',
            launchActivity: 'default',
          },
          ongoing: true,
          autoCancel: false,
          pressAction: {
            id: 'wake-alarm',
            launchActivity: 'default',
          },
        },
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
    await notifee.cancelAllNotifications();
    await notifee.cancelTriggerNotifications();
    console.log('[ALARM] All alarms cancelled');
  } catch (e) {
    console.error('[ALARM] Failed to cancel:', e);
  }
}

/**
 * Register Notifee background event handler.
 * Must be called at module level (outside of any component).
 *
 * When a scheduled trigger fires in the background, the DELIVERED event
 * re-displays an IMMEDIATE full-screen notification. This is what makes
 * the alarm pop over the lock screen and wake the device — trigger
 * notifications alone only show in the notification shade.
 */
export function registerNotifeeBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('[ALARM] Background event:', type, detail.notification?.title);

    if (type === EventType.DELIVERED) {
      // Trigger notification was delivered — re-display as immediate
      // full-screen alarm notification to wake device / show over apps
      console.log('[ALARM] Trigger DELIVERED — firing full-screen alarm');
      try {
        await ensureAlarmChannel();
        await notifee.displayNotification({
          title: detail.notification?.title ?? 'WAKE UP, REFLECTOR.',
          body: detail.notification?.body ?? 'Your alarm is going off. Face it.',
          android: {
            channelId: ALARM_CHANNEL_ID,
            category: AndroidCategory.ALARM,
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            fullScreenAction: {
              id: 'wake-alarm',
              launchActivity: 'default',
            },
            ongoing: true,
            autoCancel: false,
            pressAction: {
              id: 'wake-alarm',
              launchActivity: 'default',
            },
            // Keep the screen on and show over lock screen
            lights: ['#FF0000', 500, 500],
            vibrationPattern: [0, 500, 200, 500, 200, 500],
          },
        });
      } catch (e) {
        console.error('[ALARM] Background display failed:', e);
      }
    }

    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      // User tapped the alarm — dismiss it
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
      // Cancel all to clean up
      await notifee.cancelAllNotifications();
    }
  });
}

/**
 * Register foreground event handler.
 * When alarm fires while app is open, this handles it.
 */
export function registerNotifeeForegroundHandler(): void {
  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type === EventType.DELIVERED) {
      console.log('[ALARM] Foreground DELIVERED — alarm fired while app open');
      // Re-display to ensure it pops up
      await ensureAlarmChannel();
      await notifee.displayNotification({
        title: detail.notification?.title ?? 'WAKE UP, REFLECTOR.',
        body: detail.notification?.body ?? 'Your alarm is going off.',
        android: {
          channelId: ALARM_CHANNEL_ID,
          category: AndroidCategory.ALARM,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          fullScreenAction: {
            id: 'wake-alarm',
            launchActivity: 'default',
          },
          ongoing: true,
          autoCancel: false,
          pressAction: {
            id: 'wake-alarm',
            launchActivity: 'default',
          },
          vibrationPattern: [0, 500, 200, 500, 200, 500],
        },
      });
    }

    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
      await notifee.cancelAllNotifications();
    }
  });
}
