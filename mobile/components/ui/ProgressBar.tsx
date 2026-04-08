import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProgressBar({
  percent,
  color = COLORS.crimson,
  height = SPACING.xs,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: `${clamped}%`,
              height,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{Math.round(clamped)}%</Text>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: RADIUS.sm,
  },
  label: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.label,
    fontWeight: TYPOGRAPHY.semibold,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
});
