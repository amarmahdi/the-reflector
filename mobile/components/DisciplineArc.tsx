// ──────────────────────────────────────────────
// The Reflector – DisciplineArc
// Animated arc meter showing today's Discipline Score
// Built with react-native only (no react-native-svg dependency)
// Uses rotated View + overflow clipping to create the arc illusion
// ──────────────────────────────────────────────

import { useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { useDisciplineScore, useDisciplineTrend } from '@/hooks/useStoreData';

// ── Constants ────────────────────────────────────────────────────────────────

const ARC_DIAMETER = 180;
const ARC_RADIUS = ARC_DIAMETER / 2;
const STROKE = 14;

// Color tiers
function getArcColor(score: number): string {
  if (score >= 70) return COLORS.crimson;
  if (score >= 40) return COLORS.gold;
  return COLORS.warmRed;
}

function getGlowColor(score: number): string {
  if (score >= 70) return 'rgba(26, 107, 60, 0.30)';
  if (score >= 40) return 'rgba(196, 163, 90, 0.24)';
  return 'rgba(139, 74, 74, 0.30)';
}

// ── Arc built from two semicircles + stop mask ────────────────────────────────
// Technique: rotate the right half for 0–50% and both halves for 50–100%
// This gives a smooth circular progress without SVG.

interface ArcRingProps {
  progress: SharedValue<number>; // 0–1
  color: string;
}

function ArcRing({ progress, color }: ArcRingProps) {
  // Right half: rotates 0→180deg for progress 0→50%
  // Pivot point is the RIGHT edge of the left half (center of the circle).
  // RN doesn't support transformOrigin strings, so we do:
  //   translate to pivot → rotate → translate back
  const rightHalfStyle = useAnimatedStyle(() => {
    const pct = progress.value;
    const degrees = pct <= 0.5 ? pct * 360 : 180;
    return {
      transform: [
        { translateX: ARC_RADIUS },
        { rotate: `${degrees}deg` },
        { translateX: -ARC_RADIUS },
      ],
    };
  });

  // Left half: rotates 0→180deg for progress 50→100%
  // Pivot is the LEFT edge of the right half (also the circle center).
  const leftHalfStyle = useAnimatedStyle(() => {
    const pct = progress.value;
    const degrees = pct <= 0.5 ? 0 : (pct - 0.5) * 360;
    return {
      transform: [
        { translateX: -ARC_RADIUS },
        { rotate: `${degrees}deg` },
        { translateX: ARC_RADIUS },
      ],
    };
  });

  return (
    <View style={{ width: ARC_DIAMETER, height: ARC_DIAMETER, position: 'absolute' }}>
      {/* Track ring */}
      <View style={[styles.trackCircle, { borderColor: COLORS.surface2 }]} />

      {/* Right half clip (left 0 → ARC_RADIUS) — hidden portion */}
      <View style={[styles.halfContainer, { left: ARC_RADIUS }]}>
        <Animated.View style={[styles.halfRotator, rightHalfStyle]}>
          <View style={[styles.halfArc, { borderColor: color, left: -ARC_RADIUS }]} />
        </Animated.View>
      </View>

      {/* Left half clip (right side of circle) */}
      <View style={[styles.halfContainer, { left: 0 }]}>
        <Animated.View style={[styles.halfRotator, leftHalfStyle]}>
          <View style={[styles.halfArc, { borderColor: color, left: 0 }]} />
        </Animated.View>
      </View>

      {/* Inner mask creates the ring appearance */}
      <View style={styles.innerMask} />
    </View>
  );
}

// ── Breakdown Pill ────────────────────────────────────────────────────────────

interface BreakdownPillProps {
  label: string;
  value: number;
}

function BreakdownPill({ label, value }: BreakdownPillProps) {
  const color = value >= 70 ? COLORS.crimson : value >= 40 ? COLORS.gold : COLORS.warmRed;
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}%</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function DisciplineArc() {
  const score = useDisciplineScore();
  const trend = useDisciplineTrend();

  // Yesterday's score for delta
  const yesterday = trend.length >= 2 ? trend[trend.length - 2]?.score : undefined;
  const delta = yesterday !== undefined ? score - yesterday : null;

  // Today's breakdown
  const latest = trend[trend.length - 1];
  const breakdown = latest?.breakdown;

  const arcColor = getArcColor(score);
  const glowColor = getGlowColor(score);
  const pct = score / 100;

  // Animation values
  const arcProgress = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.15);

  useEffect(() => {
    arcProgress.value = withTiming(pct, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    // Pulse glow for extreme scores
    if (score >= 70 || score < 40) {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1400 }),
          withTiming(1.0, { duration: 1400 }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 1400 }),
          withTiming(0.15, { duration: 1400 }),
        ),
        -1,
        true,
      );
    } else {
      glowScale.value = withTiming(1);
      glowOpacity.value = withTiming(0.12);
    }
  }, [score]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Arc ring + centered score */}
      <View style={styles.arcArea}>
        {/* Background glow — inside arcArea so it's always centered */}
        <Animated.View style={[styles.glow, { backgroundColor: glowColor }, glowStyle]} />

        <ArcRing progress={arcProgress} color={arcColor} />

        {/* Score overlay */}
        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreNumber, { color: arcColor }]}>{score}</Text>
          <Text style={styles.scoreLabel}>DISCIPLINE</Text>
          {delta !== null && (
            <Text style={[
              styles.deltaText,
              { color: delta >= 0 ? COLORS.crimson : COLORS.warmRed },
            ]}>
              {delta >= 0 ? `▲${delta}` : `▼${Math.abs(delta)}`} from yesterday
            </Text>
          )}
          {delta === null && score === 0 && (
            <Text style={styles.emptyHint}>Log activity to score</Text>
          )}
        </View>
      </View>

      {/* Breakdown pills */}
      {breakdown ? (
        <View style={styles.pillRow}>
          <BreakdownPill label="Routine" value={breakdown.routineScore} />
          <BreakdownPill label="Focus"   value={breakdown.focusScore} />
          <BreakdownPill label="Tasks"   value={breakdown.taskScore} />
          <BreakdownPill label="Journal" value={breakdown.journalScore} />
        </View>
      ) : (
        <Text style={styles.noDataText}>Complete tasks to start tracking your discipline</Text>
      )}
    </View>
  );
}

export default memo(DisciplineArc);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    // Centered on arcArea (180x180): offset by -(200-180)/2 = -10
    top: -10,
    left: -10,
  },
  arcArea: {
    width: ARC_DIAMETER,
    height: ARC_DIAMETER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  // Arc ring components
  trackCircle: {
    position: 'absolute',
    width: ARC_DIAMETER,
    height: ARC_DIAMETER,
    borderRadius: ARC_RADIUS,
    borderWidth: STROKE,
    borderColor: COLORS.surface2,
  },
  halfContainer: {
    position: 'absolute',
    width: ARC_RADIUS,
    height: ARC_DIAMETER,
    overflow: 'hidden',
    top: 0,
  },
  halfRotator: {
    position: 'absolute',
    width: ARC_DIAMETER,
    height: ARC_DIAMETER,
  },
  halfArc: {
    position: 'absolute',
    width: ARC_DIAMETER,
    height: ARC_DIAMETER,
    borderRadius: ARC_RADIUS,
    borderWidth: STROKE,
    borderColor: COLORS.crimson,
  },
  innerMask: {
    position: 'absolute',
    width: ARC_DIAMETER - STROKE * 2,
    height: ARC_DIAMETER - STROKE * 2,
    borderRadius: (ARC_DIAMETER - STROKE * 2) / 2,
    backgroundColor: COLORS.surface1,
    top: STROKE,
    left: STROKE,
  },
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 52,
  },
  scoreLabel: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.widest,
    marginTop: 2,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.tight,
    marginTop: SPACING.xs,
  },
  emptyHint: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: SPACING.xs,
  },
  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillValue: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.normal,
  },
  pillLabel: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.micro,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.wide,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  noDataText: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
});
