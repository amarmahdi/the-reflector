import React from 'react';
import styled from 'styled-components/native';
import { COLORS } from '@/constants/theme';
import type { WeeklySummary } from '@/lib/heatmapEngine';

// ── Styled Components ────────────────────────────────────────────────────────

const Card = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 14px;
  padding: 16px;
`;

const CardLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 14px;
`;

const TopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const BigRate = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 36px;
  font-weight: 900;
`;

const BigRateSuffix = styled.Text`
  color: ${COLORS.textDim};
  font-size: 16px;
  font-weight: 600;
`;

const VsLastWeek = styled.Text<{ positive: boolean }>`
  color: ${({ positive }: { positive: boolean }) =>
    positive ? COLORS.crimson : COLORS.warmRed};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const StatsRow = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 14px;
`;

const StatColumn = styled.View`
  align-items: center;
  flex: 1;
`;

const StatValue = styled.Text<{ accent?: boolean }>`
  color: ${({ accent }: { accent?: boolean }) =>
    accent ? COLORS.warmRed : COLORS.textPrimary};
  font-size: 20px;
  font-weight: 900;
`;

const StatLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1.5px;
  margin-top: 2px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: ${COLORS.border};
  margin-bottom: 12px;
`;

const DayRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const DayInfo = styled.View`
  flex: 1;
`;

const DayLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const DayValue = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 600;
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDayName(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ── Component ────────────────────────────────────────────────────────────────

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
}

export default function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const rate = Math.round(summary.completionRate * 100);
  const vsPositive = summary.vsLastWeek >= 0;

  return (
    <Card>
      <CardLabel>THIS WEEK</CardLabel>

      <TopRow>
        <BigRate>
          {rate}
          <BigRateSuffix>%</BigRateSuffix>
        </BigRate>
        {summary.vsLastWeek !== 0 && (
          <VsLastWeek positive={vsPositive}>
            {vsPositive ? '▲' : '▼'} {Math.abs(summary.vsLastWeek)}%
          </VsLastWeek>
        )}
      </TopRow>

      <StatsRow>
        <StatColumn>
          <StatValue>{summary.totalCompleted}</StatValue>
          <StatLabel>COMPLETED</StatLabel>
        </StatColumn>
        <StatColumn>
          <StatValue accent>{summary.totalScarred}</StatValue>
          <StatLabel>SCARRED</StatLabel>
        </StatColumn>
        <StatColumn>
          <StatValue>{summary.totalCompleted + summary.totalScarred}</StatValue>
          <StatLabel>TOTAL</StatLabel>
        </StatColumn>
      </StatsRow>

      {(summary.bestDay || summary.worstDay) && (
        <>
          <Divider />
          <DayRow>
            {summary.bestDay && (
              <DayInfo>
                <DayLabel>BEST DAY</DayLabel>
                <DayValue>
                  {formatDayName(summary.bestDay.date)} — {Math.round(summary.bestDay.rate * 100)}%
                </DayValue>
              </DayInfo>
            )}
            {summary.worstDay && (
              <DayInfo style={{ alignItems: 'flex-end' }}>
                <DayLabel>WORST DAY</DayLabel>
                <DayValue>
                  {formatDayName(summary.worstDay.date)} — {Math.round(summary.worstDay.rate * 100)}%
                </DayValue>
              </DayInfo>
            )}
          </DayRow>
        </>
      )}
    </Card>
  );
}
