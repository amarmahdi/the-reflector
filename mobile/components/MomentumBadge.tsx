// ──────────────────────────────────────────────
// MomentumBadge — Streak tier indicator
// ──────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { useMomentumTier } from '@/hooks/useMomentumTier';
import { useUserLevel } from '@/hooks/useStoreData';

export default function MomentumBadge() {
  const tier = useMomentumTier();
  const { currentStreak } = useUserLevel();

  // Only show badge once user earns a real tier (Sprout = 4+ days)
  // Seed is the default state — no badge until they've earned it
  if (currentStreak === 0 || tier.key === 'seed') return null;

  return (
    <View style={[styles.container, { borderColor: tier.accentColor }]}>
      <Text style={styles.emoji}>{tier.emoji}</Text>
      <Text style={[styles.name, { color: tier.accentColor }]}>{tier.name}</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={[styles.streak, { color: tier.accentColor }]}>
        Day {currentStreak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  emoji: {
    fontSize: TYPOGRAPHY.body,
  },
  name: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.normal,
  },
  dot: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.caption,
  },
  streak: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.normal,
  },
});
