// ──────────────────────────────────────────────
// The Reflector – Centralized Haptic Feedback
// ──────────────────────────────────────────────

import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback utilities.
 * Usage: import { haptic } from '@/lib/haptics';
 *        haptic.light(); // on button press
 *        haptic.success(); // on task completion
 */
export const haptic = {
  /** Light tap — button presses, toggles */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Medium impact — confirmations, card interactions */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Heavy impact — major actions (start grid, complete day) */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Success notification — task/day completed */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Warning notification — scar, missed day */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /** Error notification — failure, hard reset triggered */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Selection change — tab switches, picker changes */
  selection: () => Haptics.selectionAsync(),
} as const;
