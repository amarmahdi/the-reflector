// ──────────────────────────────────────────────
// Ghost of Yesterday — Home Screen Card
// Shows what your past self did (or didn't do)
// ──────────────────────────────────────────────

import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useReflectorStore } from '@/store/useReflectorStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { getMissQuote, getSuccessQuote, getStreakQuote } from '@/lib/ghostQuotes';
import type { Grid40, GridDay } from '@/types/models';

// ── Types ────────────────────────────────────────────────────────────────────

interface GridYesterdayResult {
  grid: Grid40;
  routineTitle: string;
  day: GridDay | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getYesterdayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime() - 86_400_000;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GhostCard() {
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const focusSessions = useFocusStore((s) => s.focusSessions);
  const userStats = useGamificationStore((s) => s.userStats);

  const yesterdayMs = useMemo(() => getYesterdayMs(), []);

  // Collect yesterday info for each active grid
  const yesterdayGrids = useMemo<GridYesterdayResult[]>(() => {
    return grids
      .filter((g) => g.status === 'active')
      .map((g) => {
        const routine = routines.find((r) => r.id === g.routineId);
        const day = g.days.find((d) => d.date === yesterdayMs) ?? null;
        return { grid: g, routineTitle: routine?.title ?? 'Routine', day };
      })
      .filter((r) => r.day !== null); // only grids that had a day yesterday
  }, [grids, routines, yesterdayMs]);

  // Yesterday's focus minutes
  const yesterdayFocusMinutes = useMemo(() => {
    const total = focusSessions
      .filter((s) => {
        const sDay = new Date(s.startTime);
        sDay.setHours(0, 0, 0, 0);
        return sDay.getTime() === yesterdayMs && s.completed;
      })
      .reduce((sum, s) => sum + Math.round(s.actualDuration / 60000), 0);
    return total;
  }, [focusSessions, yesterdayMs]);

  // Don't render if no active grids had a day yesterday
  if (yesterdayGrids.length === 0) return null;

  const completedGrids = yesterdayGrids.filter((r) => r.day?.status === 'completed');
  const missedGrids = yesterdayGrids.filter(
    (r) => r.day?.status === 'scarred' || r.day?.status === 'pending'
  );

  const allCompleted = missedGrids.length === 0 && completedGrids.length > 0;
  const allMissed = completedGrids.length === 0 && missedGrids.length > 0;
  const isMixed = completedGrids.length > 0 && missedGrids.length > 0;
  const isStreakDay = allCompleted && userStats.currentStreak >= 3;

  // ── Streak State (D) — takes precedence over perfect ──
  if (isStreakDay) {
    const quote = getStreakQuote(userStats.currentStreak);
    return (
      <View style={[styles.card, styles.streakCard]}>
        <Text style={styles.header}>🔥  {userStats.currentStreak} days straight.</Text>
        <Text style={styles.body}>Past-you is proud.</Text>
        <Text style={[styles.quote, styles.streakQuote]}>{quote}</Text>
        {yesterdayFocusMinutes > 0 && (
          <Text style={styles.focusPill}>+{yesterdayFocusMinutes} min focused</Text>
        )}
      </View>
    );
  }

  // ── Perfect State (A) ──
  if (allCompleted) {
    const first = completedGrids[0];
    const quote = getSuccessQuote();
    const dayNum = first.day ? first.day.dayIndex : '?';
    return (
      <View style={[styles.card, styles.successCard]}>
        <Text style={styles.ghostLabel}>👻  GHOST OF YESTERDAY</Text>
        <Text style={styles.body}>
          Yesterday, you completed{' '}
          <Text style={styles.accent}>{first.routineTitle}</Text>.
          {completedGrids.length > 1 && (
            <Text> All {completedGrids.length} routines done.</Text>
          )}{' '}
          Day {dayNum}. You showed up.
        </Text>
        {yesterdayFocusMinutes > 0 && (
          <Text style={styles.subText}>{yesterdayFocusMinutes} minutes of focus.</Text>
        )}
        <Text style={styles.quote}>"{quote}"</Text>
      </View>
    );
  }

  // ── All Missed State (B) ──
  if (allMissed) {
    const first = missedGrids[0];
    const reason = first.day?.failureReason;
    const quote = getMissQuote();
    return (
      <View style={[styles.card, styles.missCard]}>
        <Text style={styles.ghostLabel}>👻  GHOST OF YESTERDAY</Text>
        <Text style={styles.body}>
          Yesterday, you skipped{' '}
          <Text style={styles.missAccent}>{first.routineTitle}</Text>
          {missedGrids.length > 1 && ` and ${missedGrids.length - 1} other${missedGrids.length - 1 > 1 ? 's' : ''}`}.
        </Text>
        {reason ? (
          <Text style={styles.subText}>
            Your excuse:{' '}
            <Text style={styles.missAccent}>"{reason}"</Text>
          </Text>
        ) : null}
        <Text style={styles.quote}>"{quote}"</Text>
        <Text style={styles.cta}>Break the pattern.</Text>
      </View>
    );
  }

  // ── Mixed State (C) ──
  if (isMixed) {
    const quote = getMissQuote();
    return (
      <View style={[styles.card, styles.mixedCard]}>
        <Text style={styles.ghostLabel}>👻  GHOST OF YESTERDAY</Text>
        <View style={styles.mixedList}>
          {completedGrids.map((r) => (
            <Text key={r.grid.id} style={styles.mixedRow}>
              <Text style={styles.checkIcon}>✓ </Text>
              <Text style={styles.accent}>{r.routineTitle}</Text>
              {r.day ? <Text style={styles.subText}> — Day {r.day.dayIndex}</Text> : null}
            </Text>
          ))}
          {missedGrids.map((r) => (
            <Text key={r.grid.id} style={styles.mixedRow}>
              <Text style={styles.missIcon}>✗ </Text>
              <Text style={styles.missAccent}>{r.routineTitle}</Text>
              {r.day?.failureReason ? (
                <Text style={styles.subText}> — "{r.day.failureReason}"</Text>
              ) : null}
            </Text>
          ))}
        </View>
        <Text style={styles.quote}>"{quote}"</Text>
        <Text style={styles.cta}>One isn't enough. Show up for all of it today.</Text>
      </View>
    );
  }

  return null;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  successCard: {
    borderColor: COLORS.crimsonDim,
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  missCard: {
    borderColor: COLORS.warmRed,
    shadowColor: COLORS.warmRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mixedCard: {
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  streakCard: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.surface1,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ghostLabel: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.label,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.widest,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  header: {
    color: COLORS.gold,
    fontSize: TYPOGRAPHY.subtitle,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.tight,
    marginBottom: SPACING.xs,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    lineHeight: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  accent: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.semibold,
  },
  missAccent: {
    color: COLORS.warmRed,
    fontWeight: TYPOGRAPHY.semibold,
  },
  subText: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.medium,
    marginBottom: SPACING.sm,
  },
  quote: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.caption,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    letterSpacing: TYPOGRAPHY.tight,
  },
  streakQuote: {
    color: COLORS.gold,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  cta: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.wide,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
  },
  focusPill: {
    color: COLORS.crimson,
    fontSize: TYPOGRAPHY.label,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.normal,
    marginTop: SPACING.xs,
  },
  mixedList: {
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  mixedRow: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    lineHeight: SPACING.xl,
  },
  checkIcon: {
    color: COLORS.crimson,
    fontWeight: TYPOGRAPHY.bold,
  },
  missIcon: {
    color: COLORS.warmRed,
    fontWeight: TYPOGRAPHY.bold,
  },
});
