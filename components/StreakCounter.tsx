// ──────────────────────────────────────────────
// The Reflector – Streak Counter Component (Restyled)
// ──────────────────────────────────────────────

import { useEffect } from 'react';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

// ── Styled Components ────────────────────────────────────────────────────────

const Container = styled.View`
  align-items: center;
  padding: 20px;
`;

const FireRow = styled.View`
  flex-direction: row;
  margin-bottom: 8px;
`;

const FireEmoji = styled.Text`
  font-size: 28px;
`;

const StreakLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  margin-top: 4px;
  text-transform: uppercase;
`;

const PersonalBestBadge = styled.View`
  margin-top: 10px;
  background-color: ${COLORS.goldGlow};
  border-width: 1px;
  border-color: ${COLORS.gold};
  border-radius: 10px;
  padding: 5px 14px;
`;

const PersonalBestText = styled.Text`
  color: ${COLORS.gold};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  const badgeScale = useSharedValue(0);

  const isPersonalBest = currentStreak > 0 && currentStreak >= longestStreak;

  useEffect(() => {
    if (isPersonalBest) {
      badgeScale.value = withSequence(
        withTiming(0, { duration: 800 }),
        withSpring(1, { damping: 8, stiffness: 150 }),
      );
    }
  }, [currentStreak]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeScale.value,
  }));

  // Fire emoji scaling with streak
  const getFireEmojis = () => {
    if (currentStreak < 7) return '🌱';
    if (currentStreak < 14) return '🌱🌱';
    if (currentStreak < 30) return '🔥🔥🔥';
    return '🔥🔥🔥🔥';
  };

  return (
    <Container>
      <FireRow>
        <FireEmoji>{getFireEmojis()}</FireEmoji>
      </FireRow>

      <AnimatedNumberDisplay target={currentStreak} />

      <StreakLabel>Day streak</StreakLabel>

      {isPersonalBest && (
        <Animated.View style={badgeStyle}>
          <PersonalBestBadge>
            <PersonalBestText>✦ Personal best</PersonalBestText>
          </PersonalBestBadge>
        </Animated.View>
      )}
    </Container>
  );
}

// ── Animated Number Sub-component ────────────────────────────────────────────

function AnimatedNumberDisplay({ target }: { target: number }) {
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = 0;
    animValue.value = withTiming(target, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [target]);

  const scaleStyle = useAnimatedStyle(() => {
    const progress = target > 0 ? animValue.value / target : 1;
    return {
      transform: [{ scale: 0.5 + progress * 0.5 }],
      opacity: Math.min(progress * 2, 1),
    };
  });

  return (
    <Animated.View style={scaleStyle}>
      <Animated.Text
        style={{
          color: COLORS.textPrimary,
          fontSize: 42,
          fontWeight: '900',
          letterSpacing: 2,
        }}
      >
        {target}
      </Animated.Text>
    </Animated.View>
  );
}
