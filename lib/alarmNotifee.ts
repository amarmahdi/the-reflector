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
} from '@notifee/react-native';
import { Platform, Linking } from 'react-native';

const ALARM_CHANNEL_ID = 'reflector-alarm-v2';

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
      console.log('[ALARM] Exact alarm permission: GRANTED');
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
    // Note: To change a channel's sound/vibration property on Android, you MUST create a new ID.
    // 'reflector-alarm-v2' removes the default Android alarm sound so your custom MP3 plays cleanly.
    await notifee.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'Wake Alarm',
      description: 'Full-screen alarm that wakes your device',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default', // standard notification blip instead of continuous blasting
      vibration: true,
      bypassDnd: true,
    });
    console.log('[ALARM] Channel created successfully');
  } catch (e) {
    console.error('[ALARM] Failed to create channel:', e);
  }
}

/**
 * Display a full-screen alarm notification NOW.
 * This is used both for immediate testing and by the background handler
 * when a trigger fires.
 */
async function displayAlarmNotification(
  body: string = 'Your alarm is going off. Face it.',
  title: string = 'WAKE UP, REFLECTOR.'
): Promise<void> {
  await notifee.displayNotification({
    title,
    body,
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
}

/**
 * Fire the alarm immediately — wakes the device, pops over the lock screen.
 */
export async function fireAlarmNotifee(label?: string): Promise<void> {
  if (Platform.OS !== 'android') return;

  await ensureAlarmChannel();

  try {
    await displayAlarmNotification(
      'Your alarm is going off. Face it.',
      label ?? 'WAKE UP, REFLECTOR.'
    );
    console.log('[ALARM] Immediate alarm fired');
  } catch (e) {
    console.error('[ALARM] Failed to fire immediate alarm:', e);
  }
}

/**
 * Schedule an alarm at a specific hour:minute using Notifee trigger.
 */
export async function scheduleAlarmNotifee(
  hour: number,
  minute: number,
  body: string = 'Time to check in with your routines.'
): Promise<void> {
  if (Platform.OS !== 'android') return;

  // Ensure permission + channel
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
    await notifee.createTriggerNotification(
      {
        title: 'WAKE UP, REFLECTOR.',
        body,
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
          allowWhileIdle: true,
        },
      }
    );

    // Verify trigger was actually registered
    const triggers = await notifee.getTriggerNotifications();
    console.log(`[ALARM] Scheduled for ${hour}:${String(minute).padStart(2, '0')} → ${target.toLocaleString()}`);
    console.log(`[ALARM] Active triggers registered: ${triggers.length}`);
  } catch (e) {
    console.error('[ALARM] Failed to schedule alarm:', e);
  }
}

/**
 * Cancel the ongoing alarm notification (call after user dismisses).
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
 * When the scheduled trigger fires in the background, this handler
 * re-displays a full-screen notification to wake the device.
 */
export function registerNotifeeBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('[ALARM] Background event type:', type);

    if (type === EventType.DELIVERED) {
      // Trigger notification was delivered — ensure it shows as full-screen
      console.log('[ALARM] Background DELIVERED — re-displaying full-screen alarm');
      try {
        await ensureAlarmChannel();
        await displayAlarmNotification(detail.notification?.body ?? 'Your alarm is going off.');
      } catch (e) {
        console.error('[ALARM] Background display failed:', e);
      }
    }

    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      console.log('[ALARM] Background PRESS — user tapped alarm');
    }
  });
}
