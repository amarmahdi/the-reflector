import styled from 'styled-components/native';
import { COLORS } from '@/constants/theme';

/** Full-screen wrapper with app background */
export const Screen = styled.View`
  flex: 1;
  background-color: ${COLORS.surface0};
`;

/** Scrollable full-screen wrapper */
export const ScrollScreen = styled.ScrollView.attrs({
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
  background-color: ${COLORS.surface0};
`;
