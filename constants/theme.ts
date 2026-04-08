// ──────────────────────────────────────────────
// The Reflector – Sacred Growth Design System
// ──────────────────────────────────────────────
// Philosophy: Calm, intentional, warm. A spiritual practice space,
// not a drill sergeant. The green represents growth, renewal, nature.
// Dark backgrounds create focus. Generous spacing creates breathing room.

export const COLORS = {
  // Core
  black: '#080808',
  white: '#F0EDE8',
  offWhite: '#C9C4BC',

  // Primary – Sacred Green (growth, nature, renewal)
  crimson: '#1A6B3C',          // kept name for compatibility
  crimsonDim: '#0F3D22',
  crimsonGlow: 'rgba(26, 107, 60, 0.12)',
  crimsonSoft: 'rgba(26, 107, 60, 0.06)',

  // Secondary accents
  gold: '#C4A35A',             // for warnings, achievements
  goldGlow: 'rgba(196, 163, 90, 0.12)',
  softBlue: '#4A7B9D',        // for info, focus timer
  softBlueGlow: 'rgba(74, 123, 157, 0.12)',
  warmRed: '#8B4A4A',         // for destructive, scars
  warmRedGlow: 'rgba(139, 74, 74, 0.12)',

  // Surfaces — layered depth
  surface0: '#0A0A0A',        // deepest background
  surface1: '#111111',        // card background
  surface2: '#181818',        // elevated cards, inputs
  surface3: '#202020',        // modals, popovers

  // Borders — subtle
  border: '#1C1C1C',
  borderLight: '#282828',
  borderFocus: '#1A6B3C',

  // Text hierarchy
  textPrimary: '#F0EDE8',     // warm white
  textSecondary: '#A8A49E',   // warm mid-tone
  textDim: '#5A5652',         // labels, hints
  textMuted: '#3A3836',       // disabled, very subtle

  // Legacy aliases
  scarGrey: '#1C1C1C',
  mutedGrey: '#8A8580',
  borderGrey: '#1C1C1C',
} as const;

export const TYPOGRAPHY = {
  // Weights — more nuanced
  black: '900' as const,       // stats, numbers
  bold: '700' as const,        // section headers
  semibold: '600' as const,    // card titles, labels
  medium: '500' as const,      // body text
  regular: '400' as const,     // long-form text

  // Sizes
  hero: 28,                    // big greeting, main stat
  title: 20,                   // screen title
  subtitle: 16,                // section title
  body: 14,                    // body text
  caption: 12,                 // secondary info
  label: 10,                   // small labels
  micro: 8,                    // badges, tiny labels

  // Letter spacing
  tight: 0.3,
  normal: 0.5,
  wide: 1,
  wider: 1.5,
  widest: 2.5,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#1A6B3C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const GRID = {
  COLUMNS: 8,
  ROWS: 5,
  TOTAL_DAYS: 40,
} as const;

export const REFLECTION_MIN_CHARS = 50;
