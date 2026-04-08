import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface ButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  style?: any;
}

// ── Primary Button (green fill) ──────────────────────────────────────────────

export function PrimaryButton({ onPress, label, disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryBtn, disabled && styles.disabledBtn, style]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

// ── Ghost Button (transparent, border) ───────────────────────────────────────

export function GhostButton({ onPress, label, disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.ghostBtn, disabled && styles.disabledBtn, style]}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

// ── Cancel Button (border, secondary text) ───────────────────────────────────

export function CancelButton({ onPress, label, disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.cancelBtn, disabled && styles.disabledBtn, style]}
    >
      <Text style={styles.cancelBtnText}>{label}</Text>
    </Pressable>
  );
}

// ── Danger Button (warmRed text, no fill) ────────────────────────────────────

export function DangerButton({ onPress, label, disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.dangerBtn, disabled && styles.disabledBtn, style]}
    >
      <Text style={styles.dangerBtnText}>{label}</Text>
    </Pressable>
  );
}

// ── Small Button (compact primary) ───────────────────────────────────────────

export function SmallButton({ onPress, label, disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.smallBtn, disabled && styles.disabledBtn, style]}
    >
      <Text style={styles.smallBtnText}>{label}</Text>
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: COLORS.crimson,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.wide,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  ghostBtnText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.normal,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.wide,
  },
  dangerBtn: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: COLORS.warmRed,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.wide,
  },
  smallBtn: {
    backgroundColor: COLORS.crimson,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  smallBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.normal,
  },
  disabledBtn: {
    opacity: 0.4,
  },
});
