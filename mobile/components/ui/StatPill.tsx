import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface StatPillProps {
  value: string | number;
  label: string;
  accent?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function StatPill({ value, label, accent = false }: StatPillProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, accent && styles.valueAccent]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.title,
    fontWeight: TYPOGRAPHY.black,
    marginBottom: SPACING.xs,
  },
  valueAccent: {
    color: COLORS.crimson,
  },
  label: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.label,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.widest,
    textTransform: 'uppercase',
  },
});
