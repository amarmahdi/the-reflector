// ──────────────────────────────────────────────
// The Reflector – Circular Timer (Sacred Growth Design)
// ──────────────────────────────────────────────

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface CircularTimerProps {
  progress: number;       // 0 to 1 (percentage remaining)
  size?: number;          // diameter in px (default 250)
  strokeWidth?: number;   // default 6
  isComplete?: boolean;   // triggers pulse animation
  arcColor?: string;      // override arc color (default: softBlue)
  children?: React.ReactNode; // content inside circle
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CircularTimer({
  progress,
  size = 250,
  strokeWidth = 6,
  isComplete = false,
  arcColor = COLORS.softBlue,
  children,
}: CircularTimerProps) {
  const halfSize = size / 2;
  const innerSize = size - strokeWidth * 2;

  // Animated progress value for smooth transitions
  const animatedProgress = useSharedValue(progress);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  // Subtle pulse on completion
  useEffect(() => {
    if (isComplete) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        3,
        false
      );
      glowOpacity.value = withTiming(0.25, { duration: 400 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isComplete]);

  // Right half rotation (covers 0% to 50% of progress)
  const rightHalfStyle = useAnimatedStyle(() => {
    const p = animatedProgress.value;
    const rotation = p <= 0.5 ? p * 360 : 180;
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Left half rotation (covers 50% to 100% of progress)
  const leftHalfStyle = useAnimatedStyle(() => {
    const p = animatedProgress.value;
    const rotation = p <= 0.5 ? 0 : (p - 0.5) * 360;
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Left mask — hide left half fill when progress < 50%
  const leftMaskStyle = useAnimatedStyle(() => {
    const p = animatedProgress.value;
    return {
      backgroundColor: p <= 0.5 ? COLORS.surface0 : arcColor,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, containerAnimatedStyle]}>
      {/* Soft glow behind the timer */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size + 28,
            height: size + 28,
            borderRadius: (size + 28) / 2,
            backgroundColor: arcColor,
          },
          glowStyle,
        ]}
      />

      {/* Background ring */}
      <View
        style={[
          styles.circleBase,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
            backgroundColor: COLORS.surface2,
          },
        ]}
      >
        {/* Right half container */}
        <View
          style={[
            styles.halfContainer,
            {
              width: halfSize,
              height: size,
              left: halfSize,
              borderTopRightRadius: halfSize,
              borderBottomRightRadius: halfSize,
              overflow: 'hidden',
            },
          ]}
        >
          <Animated.View
            style={[
              {
                width: halfSize,
                height: size,
                backgroundColor: arcColor,
                borderTopRightRadius: halfSize,
                borderBottomRightRadius: halfSize,
                position: 'absolute',
                right: 0,
                transformOrigin: 'left center',
              },
              rightHalfStyle,
            ]}
          />
        </View>

        {/* Left half container */}
        <View
          style={[
            styles.halfContainer,
            {
              width: halfSize,
              height: size,
              left: 0,
              borderTopLeftRadius: halfSize,
              borderBottomLeftRadius: halfSize,
              overflow: 'hidden',
            },
          ]}
        >
          <Animated.View
            style={[
              {
                width: halfSize,
                height: size,
                backgroundColor: arcColor,
                borderTopLeftRadius: halfSize,
                borderBottomLeftRadius: halfSize,
                position: 'absolute',
                left: 0,
                transformOrigin: 'right center',
              },
              leftHalfStyle,
            ]}
          />
        </View>

        {/* Left mask — covers the left half progress when < 50% */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: halfSize,
              height: size,
              left: 0,
              borderTopLeftRadius: halfSize,
              borderBottomLeftRadius: halfSize,
            },
            leftMaskStyle,
          ]}
        />

        {/* Inner circle (content area) */}
        <View
          style={[
            styles.innerCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              top: strokeWidth,
              left: strokeWidth,
              backgroundColor: COLORS.surface0,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circleBase: {
    position: 'relative',
    overflow: 'hidden',
  },
  halfContainer: {
    position: 'absolute',
    top: 0,
  },
  innerCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
