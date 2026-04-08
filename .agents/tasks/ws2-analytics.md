# Agent Task: Analytics Dashboard & Heatmap

## Context
You are working on **The Reflector**, an Expo/React Native discipline-tracking app. You are ONE of 8 agents working in parallel. You MUST only create/modify files listed below.

## Design System (MANDATORY)
- **Styling**: `styled-components/native` — NEVER use `StyleSheet.create`
- **Colors**: Import `{ COLORS }` from `@/constants/theme`
  - Backgrounds: `surface0` (#0D0D0D), `surface1` (#141414), `surface2` (#1C1C1C)
  - Accent: `crimson` (#1A6B3C — it's dark green despite the name)
  - Text: `textPrimary` (#F0EDE8), `textSecondary` (#8A8580), `textDim` (#4A4845)
  - Borders: `border` (#2A2A2A), `borderLight` (#333333)
  - Also use: `crimsonDim` (#0F3D22) for mid-range heatmap, `crimsonGlow` (rgba(26,107,60,0.18)) for low-range
- **Typography**: ALL headers and labels UPPERCASE. font-weight 900 for headings, 700 for labels. Letter-spacing 2-4px for headers.
- **Haptics**: Import `{ haptic }` from `@/lib/haptics`
- **Dark theme only**
- **No external chart libraries** — build all visualizations with `<View>` elements and `react-native-reanimated` animations

## What Already Exists (DO NOT MODIFY)
- `lib/correlationEngine.ts` — Has `computeCorrelations`, `computeWordCloud`, `computeStreaks`, `computeEngineResults`
- `store/useReflectorStore.ts` — Has `grids`, `routines` state
- `types/models.ts` — Has all needed types
- Other files in `app/(tabs)/` — DO NOT TOUCH except `engine.tsx`

## Files to CREATE

### 1. `lib/heatmapEngine.ts` — Heatmap Data Computation
```typescript
import type { Grid40, Routine } from '@/types/models';

export interface HeatmapDay {
  date: number;          // epoch ms (start-of-day)
  completionRate: number; // 0 to 1
  routinesDone: number;
  routinesTotal: number;
  dayOfWeek: number;     // 0=Sun ... 6=Sat
}

export interface WeeklyTrend {
  weekStart: number;     // epoch ms
  completionRate: number;
  totalCompleted: number;
  totalDays: number;
}

export interface WeeklySummary {
  totalCompleted: number;
  totalScarred: number;
  totalPending: number;
  completionRate: number;
  bestDay: { date: number; rate: number } | null;
  worstDay: { date: number; rate: number } | null;
  vsLastWeek: number;    // percentage change from last week (-100 to +100)
}

/**
 * Compute heatmap data for the past N days.
 * For each day, calculate completionRate across all active grids.
 * A day with no grids = skip (don't include).
 */
export function computeHeatmapData(grids: Grid40[], days?: number): HeatmapDay[];

/**
 * Compute weekly completion trends for the past N weeks.
 */
export function computeWeeklyTrends(grids: Grid40[], weeks?: number): WeeklyTrend[];

/**
 * Compute this week's summary.
 */
export function computeWeeklySummary(grids: Grid40[]): WeeklySummary;
```

Implement all three functions. Default `days` to 365 (full year). Default `weeks` to 12.

### 2. `components/HeatmapCalendar.tsx` — GitHub-Style Contribution Heatmap

**Requirements:**
- Horizontally scrollable `<ScrollView>` showing grid of small squares
- Layout: columns = weeks, rows = 7 (days of week). Most recent week on the right.
- Each cell is a small `<View>` (size calculated from screen width, roughly 12-14px)
- Cell gap: 2px
- Color scale based on `completionRate`:
  - 0%: `surface2` (#1C1C1C)
  - 1-33%: `crimsonGlow` (rgba(26,107,60,0.18))
  - 34-66%: `crimsonDim` (#0F3D22)
  - 67-99%: `crimson` (#1A6B3C) at 70% opacity
  - 100%: `crimson` (#1A6B3C) full
- Day labels on left: M, W, F (only 3 to save space)
- Month labels across top
- Tap a cell → show tooltip with date + "3/4 routines done" info
- Auto-scroll to rightmost (current week) on mount
- Animate cells fading in on mount with staggered delay (using `react-native-reanimated`)

### 3. `components/TrendChart.tsx` — Weekly Trend Line Chart

**Requirements:**
- Custom-drawn chart using positioned `<View>` elements
- X-axis: week labels ("W1", "W2", ... "W12")
- Y-axis: percentage (0%, 50%, 100%)
- Line drawn by positioning small dots (6px circles) at each data point
- Connect dots with thin lines (use absolute positioned `<View>` with rotation transforms)
- Fill area below the line with `crimsonGlow` color
- Animated on mount — dots appear left-to-right with stagger
- Height: 180px fixed
- Grid lines (horizontal) at 0%, 50%, 100% in `border` color

### 4. `components/WeeklySummaryCard.tsx` — Week Summary Card

**Requirements:**
- Card with `surface1` background
- Shows: Total completed, Total scarred, Completion rate %, vs last week (▲ or ▼ with percentage)
- Best day and worst day with formatted dates
- "THIS WEEK" header
- Accent color for improvement, crimson for decline

## Files to MODIFY

### 5. `app/(tabs)/engine.tsx` — Complete Redesign

Replace the entire screen content with a redesigned analytics dashboard:

**New layout (top to bottom):**
1. Page header: "ANALYTICS & INSIGHTS" label + "THE ENGINE" title (keep existing style)
2. **Weekly Summary Card** (new component)
3. **Heatmap Calendar** section with "CONTRIBUTION HEATMAP" section header (new component)
4. **Trend Chart** section with "WEEKLY TREND" section header (new component)
5. **Streaks** section (KEEP existing `StreakCard` component and rendering logic)
6. **Domino Effects** section (KEEP existing `CorrelationCard` component and rendering logic)
7. **Your Excuses** word cloud section (KEEP existing `WordBubbleItem` component and rendering logic)

Import and use `computeHeatmapData`, `computeWeeklyTrends`, `computeWeeklySummary` from `@/lib/heatmapEngine`.

Keep the existing empty state for when there's no data.

## Verification
1. Run `npx expo start` — no TypeScript errors
2. Engine tab renders with all sections when there's grid data
3. Heatmap scrolls horizontally, cells colored correctly
4. Trend chart renders with dots and connecting lines
5. Weekly summary shows accurate data
6. Existing streak/correlation/word cloud sections still work
