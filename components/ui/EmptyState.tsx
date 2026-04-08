import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.huge,
    paddingHorizontal: SPACING.xxxl,
  },
  icon: {
    fontSize: TYPOGRAPHY.hero,
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semibold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center',
    lineHeight: SPACING.xl,
    maxWidth: 280,
  },
});
