// ──────────────────────────────────────────────
// TierTransition — Full-screen tier change overlay
// ──────────────────────────────────────────────

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import type { MomentumTier } from '@/lib/momentumTiers';

interface TierTransitionProps {
  tier: MomentumTier;
  streak: number;
  isDegradation?: boolean;
  previousTier?: MomentumTier;
  onDismiss: () => void;
}

export default function TierTransition({
  tier,
  streak,
  isDegradation = false,
  previousTier,
  onDismiss,
}: TierTransitionProps) {
  const emojiScale = useSharedValue(0.3);
  const textOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    bgOpacity.value = withTiming(1, { duration: 300 });
    emojiScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Pressable style={styles.touchArea} onPress={onDismiss}>
      <Animated.View style={[styles.overlay, bgStyle]}>
        <View style={styles.content}>
          {/* Large tier emoji */}
          <Animated.Text style={[styles.emoji, emojiStyle]}>
            {tier.emoji}
          </Animated.Text>

          {/* Tier name */}
          <Animated.Text
            style={[styles.tierName, { color: tier.accentColor }, textStyle]}
          >
            {tier.name.toUpperCase()}
          </Animated.Text>

          {/* Message */}
          <Animated.View style={textStyle}>
            {isDegradation && previousTier ? (
              <>
                <Text style={styles.degradeText}>
                  You were at {previousTier.emoji} {previousTier.name}.
                </Text>
                <Text style={styles.degradeText}>
                  Now you're back to {tier.emoji} {tier.name}.
                </Text>
                <Text style={[styles.rebuildText, { color: tier.accentColor }]}>
                  Rebuild.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.message}>"{tier.message}"</Text>
                <Text style={styles.streakDay}>Day {streak} streak</Text>
              </>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  emoji: {
    fontSize: 72,
    marginBottom: SPACING.xxl,
  },
  tierName: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 6,
    marginBottom: SPACING.lg,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  streakDay: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.wide,
    textAlign: 'center',
  },
  degradeText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  rebuildText: {
    fontSize: TYPOGRAPHY.subtitle,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
