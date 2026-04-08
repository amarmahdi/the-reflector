import styled from 'styled-components/native';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

/** Standard card — surface1 background, border, rounded corners */
export const Card = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: ${RADIUS.lg}px;
  padding: ${SPACING.lg}px;
`;

/** Hero card — larger padding, no border. Used for featured content. */
export const HeroCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: ${RADIUS.lg}px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: ${SPACING.xl}px;
`;

/** Stat card — compact card for displaying a single stat value + label */
export const StatCard = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: ${RADIUS.lg}px;
  padding: ${SPACING.md}px ${SPACING.lg}px;
  align-items: center;
`;
