import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function Chip({ label, active = false, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
      ]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + SPACING.xs / 2,
    paddingHorizontal: SPACING.lg + SPACING.xs / 2,
    gap: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.crimsonGlow,
    borderColor: COLORS.crimson,
  },
  chipInactive: {
    backgroundColor: COLORS.surface1,
    borderColor: COLORS.border,
  },
  icon: {
    fontSize: TYPOGRAPHY.subtitle,
  },
  label: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.normal,
  },
  labelActive: {
    color: COLORS.crimson,
  },
  labelInactive: {
    color: COLORS.textSecondary,
  },
});
