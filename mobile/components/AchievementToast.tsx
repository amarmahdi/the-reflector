// ──────────────────────────────────────────────
// The Reflector – Achievement Toast Overlay (Restyled)
// ──────────────────────────────────────────────

import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import type { Achievement } from '@/types/models';

// ── Types ────────────────────────────────────────────────────────────────────

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

// ── Styled Components ────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const IconCircle = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${COLORS.goldGlow};
  border-width: 1.5px;
  border-color: ${COLORS.gold};
  align-items: center;
  justify-content: center;
`;

const IconText = styled.Text`
  font-size: 24px;
`;

const TextColumn = styled.View`
  flex: 1;
`;

const UnlockedLabel = styled.Text`
  color: ${COLORS.gold};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 3px;
`;

const TitleText = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const DescText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 500;
  margin-top: 2px;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (achievement) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.4, { duration: 600 }),
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
      );
      haptic.success();

      const timeout = setTimeout(() => {
        translateY.value = withTiming(-150, { duration: 300, easing: Easing.in(Easing.cubic) });
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.85, { duration: 300 });
        setTimeout(() => onDismiss(), 350);
      }, 3000);

      return () => clearTimeout(timeout);
    } else {
      translateY.value = -150;
      opacity.value = 0;
      scale.value = 0.85;
    }
  }, [achievement]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value * 0.5,
  }));

  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          alignItems: 'center',
          paddingTop: 60,
        },
        containerStyle,
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          {
            width: SCREEN_WIDTH - 40,
            backgroundColor: COLORS.surface1,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: COLORS.gold,
            padding: 16,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            shadowColor: COLORS.gold,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 16,
            elevation: 10,
          },
          glowStyle,
        ]}
      >
        <IconCircle>
          <IconText>{achievement.icon}</IconText>
        </IconCircle>
        <TextColumn>
          <UnlockedLabel>ACHIEVEMENT UNLOCKED</UnlockedLabel>
          <TitleText>{achievement.title}</TitleText>
          <DescText>{achievement.description}</DescText>
        </TextColumn>
      </Animated.View>
    </Animated.View>
  );
}
