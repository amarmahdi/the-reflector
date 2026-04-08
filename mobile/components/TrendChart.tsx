import React, { useEffect } from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import type { WeeklyTrend } from '@/lib/heatmapEngine';

// ── Config ───────────────────────────────────────────────────────────────────

const CHART_HEIGHT = 180;
const DOT_SIZE = 6;
const PADDING_LEFT = 28;
const PADDING_RIGHT = 8;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 24;

// ── Styled Components ────────────────────────────────────────────────────────

const Container = styled.View`
  height: ${CHART_HEIGHT}px;
  position: relative;
`;

const GridLine = styled.View<{ top: number }>`
  position: absolute;
  left: ${PADDING_LEFT}px;
  right: ${PADDING_RIGHT}px;
  top: ${({ top }: { top: number }) => top}px;
  height: 1px;
  background-color: ${COLORS.border};
`;

const YAxisLabel = styled.Text<{ top: number }>`
  position: absolute;
  left: 0;
  top: ${({ top }: { top: number }) => top - 5}px;
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const XAxisLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 7px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-align: center;
`;

const XAxisRow = styled.View`
  flex-direction: row;
  position: absolute;
  left: ${PADDING_LEFT}px;
  right: ${PADDING_RIGHT}px;
  bottom: 0;
  justify-content: space-between;
`;

// ── Animated Dot ─────────────────────────────────────────────────────────────

function AnimatedDot({
  x,
  y,
  index,
}: {
  x: number;
  y: number;
  index: number;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 80,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.back(2)) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - DOT_SIZE / 2,
          top: y - DOT_SIZE / 2,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: COLORS.crimson,
          zIndex: 10,
        },
        animatedStyle,
      ]}
    />
  );
}

// ── Line between two dots ────────────────────────────────────────────────────

function ConnectingLine({
  x1,
  y1,
  x2,
  y2,
  index,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  index: number;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      index * 80 + 100,
      withTiming(1, { duration: 200 })
    );
  }, []);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x1,
          top: y1 - 0.5,
          width: length,
          height: 1.5,
          backgroundColor: COLORS.crimson,
          transformOrigin: 'left center',
          transform: [{ rotate: `${angle}deg` }],
          zIndex: 5,
        },
        animatedStyle,
      ]}
    />
  );
}

// ── Fill area polygon (simplified) ───────────────────────────────────────────

function FillArea({
  points,
  chartBottom,
}: {
  points: { x: number; y: number }[];
  chartBottom: number;
}) {
  if (points.length < 2) return null;

  // Create fill strips between adjacent points
  return (
    <>
      {points.map((point, i) => {
        if (i === points.length - 1) return null;
        const next = points[i + 1];
        const width = next.x - point.x;
        const minY = Math.min(point.y, next.y);
        const height = chartBottom - minY;

        return (
          <View
            key={`fill-${i}`}
            style={{
              position: 'absolute',
              left: point.x,
              top: minY,
              width: width,
              height: height,
              backgroundColor: COLORS.crimsonGlow,
              zIndex: 1,
            }}
          />
        );
      })}
    </>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface TrendChartProps {
  data: WeeklyTrend[];
}

export default function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) return null;

  const plotWidth = 300; // approximate — will be measured
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const chartBottom = PADDING_TOP + plotHeight;

  // Grid lines at 0%, 50%, 100%
  const gridLines = [
    { pct: 100, y: PADDING_TOP },
    { pct: 50, y: PADDING_TOP + plotHeight / 2 },
    { pct: 0, y: chartBottom },
  ];

  // Calculate point positions
  const points = data.map((d, i) => {
    const x = PADDING_LEFT + (i / Math.max(data.length - 1, 1)) * (plotWidth - PADDING_LEFT);
    const y = chartBottom - d.completionRate * plotHeight;
    return { x, y, data: d };
  });

  return (
    <Container style={{ width: plotWidth + PADDING_LEFT + PADDING_RIGHT }}>
      {/* Grid lines */}
      {gridLines.map((line) => (
        <React.Fragment key={line.pct}>
          <GridLine top={line.y} />
          <YAxisLabel top={line.y}>{line.pct}%</YAxisLabel>
        </React.Fragment>
      ))}

      {/* Fill area */}
      <FillArea points={points} chartBottom={chartBottom} />

      {/* Connecting lines */}
      {points.map((p, i) => {
        if (i === points.length - 1) return null;
        const next = points[i + 1];
        return (
          <ConnectingLine
            key={`line-${i}`}
            x1={p.x}
            y1={p.y}
            x2={next.x}
            y2={next.y}
            index={i}
          />
        );
      })}

      {/* Dots */}
      {points.map((p, i) => (
        <AnimatedDot key={`dot-${i}`} x={p.x} y={p.y} index={i} />
      ))}

      {/* X-axis labels */}
      <XAxisRow>
        {data.map((_, i) => (
          <XAxisLabel key={i}>W{i + 1}</XAxisLabel>
        ))}
      </XAxisRow>
    </Container>
  );
}
