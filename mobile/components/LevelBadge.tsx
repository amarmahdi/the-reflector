// ──────────────────────────────────────────────
// The Reflector – Level Badge Component (Restyled)
// ──────────────────────────────────────────────

import { useEffect } from 'react';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { useGamificationStore } from '@/store/useGamificationStore';
import { xpForLevel } from '@/types/models';

// ── Styled Components ────────────────────────────────────────────────────────

const Container = styled.View`
  width: 100%;
  padding: 12px 0;
`;

const TopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const LevelLabel = styled.Text`
  color: ${COLORS.gold};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const XPLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const BarTrack = styled.View`
  height: 5px;
  background-color: ${COLORS.surface2};
  border-radius: 3px;
  overflow: hidden;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function LevelBadge() {
  const userStats = useGamificationStore((s) => s.userStats);
  const { level, totalXP } = userStats;

  const xpNeeded = xpForLevel(level);
  const xpPrev = level > 1 ? xpForLevel(level - 1) : 0;
  const xpIntoLevel = totalXP - xpPrev;
  const xpRange = xpNeeded - xpPrev;
  const progressRatio = xpRange > 0 ? Math.min(xpIntoLevel / xpRange, 1) : 0;

  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(progressRatio, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressRatio]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
    height: 5,
    backgroundColor: COLORS.gold,
    borderRadius: 3,
  }));

  return (
    <Container>
      <TopRow>
        <LevelLabel>Level {level}</LevelLabel>
        <XPLabel>
          {xpIntoLevel} / {xpRange} XP
        </XPLabel>
      </TopRow>
      <BarTrack>
        <Animated.View style={fillStyle} />
      </BarTrack>
    </Container>
  );
}
