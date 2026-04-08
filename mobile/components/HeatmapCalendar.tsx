import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Dimensions, Pressable } from 'react-native';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import type { HeatmapDay } from '@/lib/heatmapEngine';

// ── Config ───────────────────────────────────────────────────────────────────

const CELL_SIZE = 13;
const CELL_GAP = 2;
const DAY_LABEL_WIDTH = 20;
const MONTH_HEADER_HEIGHT = 16;
const ROWS = 7; // days per week

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

// ── Color mapping ────────────────────────────────────────────────────────────

function getHeatColor(rate: number): string {
  if (rate === 0) return COLORS.surface2;
  if (rate <= 0.33) return COLORS.crimsonGlow;
  if (rate <= 0.66) return COLORS.crimsonDim;
  if (rate < 1) return 'rgba(26, 107, 60, 0.7)';
  return COLORS.crimson;
}

// ── Styled Components ────────────────────────────────────────────────────────

const Container = styled.View`
  margin-bottom: 4px;
`;

const MonthRow = styled.View`
  flex-direction: row;
  margin-left: ${DAY_LABEL_WIDTH}px;
  height: ${MONTH_HEADER_HEIGHT}px;
  margin-bottom: 2px;
`;

const MonthLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  position: absolute;
`;

const GridContainer = styled.View`
  flex-direction: row;
`;

const DayLabelsColumn = styled.View`
  width: ${DAY_LABEL_WIDTH}px;
  justify-content: flex-start;
`;

const DayLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  height: ${CELL_SIZE + CELL_GAP}px;
  line-height: ${CELL_SIZE + CELL_GAP}px;
`;

const WeekColumn = styled.View`
  width: ${CELL_SIZE + CELL_GAP}px;
`;

const TooltipContainer = styled.View`
  position: absolute;
  top: -40px;
  background-color: ${COLORS.surface2};
  border-width: 1px;
  border-color: ${COLORS.borderLight};
  border-radius: 6px;
  padding: 6px 10px;
  z-index: 100;
`;

const TooltipText = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 10px;
  font-weight: 600;
`;

const TooltipSubText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 9px;
  margin-top: 1px;
`;

const LegendRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
  padding-right: 4px;
`;

const LegendLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1px;
`;

const LegendCell = styled.View<{ bg: string }>`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background-color: ${({ bg }: { bg: string }) => bg};
`;

// ── Animated Cell ────────────────────────────────────────────────────────────

function AnimatedCell({
  day,
  index,
  onPress,
}: {
  day: HeatmapDay | null;
  index: number;
  onPress: (day: HeatmapDay) => void;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      Math.min(index * 3, 800), // cap stagger at 800ms
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const color = day ? getHeatColor(day.completionRate) : COLORS.surface2;

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          borderRadius: 2,
          backgroundColor: color,
          marginBottom: CELL_GAP,
        }}
      >
        {day && (
          <Pressable
            style={{ width: '100%', height: '100%' }}
            onPress={() => onPress(day)}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
}

// ── Types for grid structure ─────────────────────────────────────────────────

interface WeekData {
  days: (HeatmapDay | null)[]; // 7 slots, index 0=Sun, 6=Sat
}

// ── Component ────────────────────────────────────────────────────────────────

interface HeatmapCalendarProps {
  data: HeatmapDay[];
}

export default function HeatmapCalendar({ data }: HeatmapCalendarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [tooltip, setTooltip] = useState<HeatmapDay | null>(null);

  // Build a lookup by date
  const dayLookup = new Map<number, HeatmapDay>();
  for (const d of data) {
    dayLookup.set(d.date, d);
  }

  // Build weeks grid: go back ~52 weeks from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalWeeks = 53;

  // Find the Sunday of the earliest week
  const endDate = today.getTime();
  const todayDow = today.getDay(); // 0=Sun
  const lastSunday = endDate - todayDow * 86_400_000;
  const firstSunday = lastSunday - (totalWeeks - 1) * 7 * 86_400_000;

  const weeks: WeekData[] = [];
  const monthMarkers: { col: number; label: string }[] = [];
  let prevMonth = -1;

  for (let w = 0; w < totalWeeks; w++) {
    const weekDays: (HeatmapDay | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const ts = firstSunday + (w * 7 + d) * 86_400_000;
      if (ts > endDate) {
        weekDays.push(null);
      } else {
        weekDays.push(dayLookup.get(ts) ?? null);
      }

      // Month labels: check first day of each week
      if (d === 0) {
        const date = new Date(ts);
        const month = date.getMonth();
        if (month !== prevMonth) {
          monthMarkers.push({ col: w, label: MONTH_NAMES[month] });
          prevMonth = month;
        }
      }
    }
    weeks.push({ days: weekDays });
  }

  // Auto-scroll to right on mount
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleCellPress = (day: HeatmapDay) => {
    setTooltip(tooltip?.date === day.date ? null : day);
  };

  const gridWidth = totalWeeks * (CELL_SIZE + CELL_GAP);

  return (
    <Container>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        <GridContainer>
          {/* Day labels column */}
          <DayLabelsColumn>
            <Animated.View style={{ height: MONTH_HEADER_HEIGHT + 2 }} />
            {DAY_LABELS.map((label, i) => (
              <DayLabel key={i}>{label}</DayLabel>
            ))}
          </DayLabelsColumn>

          {/* Grid */}
          <Animated.View>
            {/* Month labels */}
            <Animated.View style={{
              flexDirection: 'row',
              height: MONTH_HEADER_HEIGHT,
              marginBottom: 2,
              width: gridWidth,
            }}>
              {monthMarkers.map((m, i) => (
                <MonthLabel
                  key={i}
                  style={{ left: m.col * (CELL_SIZE + CELL_GAP) }}
                >
                  {m.label}
                </MonthLabel>
              ))}
            </Animated.View>

            {/* Weeks */}
            <Animated.View style={{ flexDirection: 'row' }}>
              {weeks.map((week, wIdx) => (
                <WeekColumn key={wIdx}>
                  {week.days.map((day, dIdx) => (
                    <AnimatedCell
                      key={dIdx}
                      day={day}
                      index={wIdx * 7 + dIdx}
                      onPress={handleCellPress}
                    />
                  ))}
                </WeekColumn>
              ))}
            </Animated.View>
          </Animated.View>
        </GridContainer>
      </ScrollView>

      {/* Tooltip */}
      {tooltip && (
        <TooltipContainer style={{ right: 8 }}>
          <TooltipText>
            {new Date(tooltip.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </TooltipText>
          <TooltipSubText>
            {tooltip.routinesDone}/{tooltip.routinesTotal} routines done
          </TooltipSubText>
        </TooltipContainer>
      )}

      {/* Legend */}
      <LegendRow>
        <LegendLabel>LESS</LegendLabel>
        <LegendCell bg={COLORS.surface2} />
        <LegendCell bg={COLORS.crimsonGlow} />
        <LegendCell bg={COLORS.crimsonDim} />
        <LegendCell bg="rgba(26, 107, 60, 0.7)" />
        <LegendCell bg={COLORS.crimson} />
        <LegendLabel>MORE</LegendLabel>
      </LegendRow>
    </Container>
  );
}
