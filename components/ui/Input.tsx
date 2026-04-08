import styled from 'styled-components/native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

/** Styled text input with surface2 background and border */
export const StyledInput = styled.TextInput.attrs({
  placeholderTextColor: COLORS.textDim,
})`
  background-color: ${COLORS.surface2};
  color: ${COLORS.textPrimary};
  padding: ${SPACING.lg}px;
  border-radius: ${RADIUS.lg}px;
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  border-width: 1px;
  border-color: ${COLORS.border};
`;
