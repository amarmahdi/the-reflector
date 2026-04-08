// ──────────────────────────────────────────────
// The Reflector – Focus Stats (Sacred Growth Design)
// ──────────────────────────────────────────────

import React, { useEffect } from 'react';
import styled from 'styled-components/native';
import { COLORS, TYPOGRAPHY } from '@/constants/theme';
import { useTodayCompletedCount, useTodayFocusMinutes, useFocusStreakDays } from '@/hooks/useStoreData';

// ── Styled Components ────────────────────────────────────────────────────────

const Card = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 14px;
  padding: 20px 16px;
  flex-direction: row;
  justify-content: space-around;
`;

const StatColumn = styled.View`
  align-items: center;
  flex: 1;
`;

const StatValue = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: ${TYPOGRAPHY.hero}px;
  font-weight: ${TYPOGRAPHY.black};
`;

const StatLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: 2px;
  margin-top: 6px;
`;

const StatDivider = styled.View`
  width: 1px;
  background-color: ${COLORS.border};
  margin-vertical: 4px;
`;

// ── Animated Number Component ────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <StatValue>{displayValue}</StatValue>;
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function FocusStats() {
  const sessions = useTodayCompletedCount();
  const minutes = useTodayFocusMinutes();
  const streak = useFocusStreakDays();

  return (
    <Card>
      <StatColumn>
        <AnimatedNumber value={sessions} />
        <StatLabel>SESSIONS</StatLabel>
      </StatColumn>

      <StatDivider />

      <StatColumn>
        <AnimatedNumber value={minutes} />
        <StatLabel>MINUTES</StatLabel>
      </StatColumn>

      <StatDivider />

      <StatColumn>
        <AnimatedNumber value={streak} />
        <StatLabel>STREAK</StatLabel>
      </StatColumn>
    </Card>
  );
}
