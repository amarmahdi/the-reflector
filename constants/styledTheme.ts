import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from './theme';

export const reflectorTheme = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
};

export type ReflectorTheme = typeof reflectorTheme;

// Augment styled-components types
declare module 'styled-components/native' {
  export interface DefaultTheme extends ReflectorTheme {}
}
