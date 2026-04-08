# Agent Task: Unified Analytics & Weekly Review

## Context
You are working on **The Reflector**, an Expo/React Native discipline app. The analytics engine currently only looks at grid data. It needs to pull from ALL stores (focus, journal, gamification) to show unified insights and a weekly review.

## Design System
- `styled-components/native` — no `StyleSheet.create`
- Colors: `import { COLORS } from '@/constants/theme'` — surface0 (#0D0D0D), surface1 (#141414), surface2 (#1C1C1C), crimson (#1A6B3C), textPrimary (#F0EDE8), textSecondary (#8A8580), textDim (#4A4845), border (#2A2A2A)
- ALL headers UPPERCASE, weight 900, letter-spacing 2-4px
- Haptics: `import { haptic } from '@/lib/haptics'`
- Animations: `react-native-reanimated`
- Dark theme only

## What to Build

### 1. NEW `lib/unifiedEngine.ts` — Cross-Feature Analytics

The "brain" that queries ALL stores and produces unified insights:

```typescript
import { useReflectorStore } from '@/store/useReflectorStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useGamificationStore } from '@/store/useGamificationStore';

export interface DailyScore {
  date: number;
  routineCompletion: number;  // 0-1
  tasksCompleted: number;
  focusMinutes: number;
  journalEntries: number;
  overallScore: number;       // weighted composite 0-100
}

export interface WeeklyOverview {
  weekStart: number;
  dailyScores: DailyScore[];
  avgScore: number;
  bestDay: DailyScore | null;
  worstDay: DailyScore | null;
  totalRoutineDays: number;
  totalScars: number;
  totalFocusMinutes: number;
  totalJournalEntries: number;
  mostCommonMood: string | null;
  vsLastWeek: number;         // -100 to +100, percentage change
  topFailureWord: string | null;
}

export interface FocusRoutineCorrelation {
  routineTitle: string;
  avgFocusMinutesOnCompletedDays: number;
  avgFocusMinutesOnMissedDays: number;
  correlation: number;        // -1 to +1
}

/**
 * Compute daily scores for the past N days.
 * Score formula: (routineCompletion * 40) + (tasksCompleted * 2) + (focusMinutes * 0.3) + (journalEntries * 5)
 * Capped at 100.
 */
export function computeDailyScores(days?: number): DailyScore[];

/**
 * Compute this week's unified overview.
 */
export function computeWeeklyOverview(): WeeklyOverview;

/**
 * Correlate focus session time with routine completion.
 * For each routine: avg focus minutes on days it was completed vs days it was missed.
 */
export function computeFocusRoutineCorrelations(): FocusRoutineCorrelation[];
```

Implementation: Use `.getState()` on each store to read their data. Group focus sessions by date, match with grid days, compute correlations.

### 2. NEW `app/weekly-review.tsx` — Weekly Review Modal

Full-screen modal triggered on first app open of the week (Monday) or accessible from profile.

**Layout:**
- Dark overlay, full-screen modal
- Header: "WEEK IN REVIEW" + week date range (e.g. "MAR 27 — APR 2")
- **Score Ring**: Large circular score display showing weekly average (0-100), animated fill
- **Stats Grid** (2x3):
  - Routine days completed
  - Total scars
  - Focus minutes
  - Journal entries
  - Current streak
  - vs Last Week (% change with ▲/▼ indicator)
- **Best Day / Worst Day**: Cards showing date + score + what happened
- **Most Common Mood**: Emoji + label (if journal entries exist)
- **Top Failure Word**: From word cloud analysis (if any scars)
- **Intention Input**: "SET THIS WEEK'S INTENTION" text input, saved to AsyncStorage
- **Last Week's Intention**: Show what was set last week (if any)
- **CLOSE button**: "LET'S GO" primary crimson button

Use `react-native-reanimated` for entrance animations (slide up, fade in sections sequentially).

### 3. MODIFY `app/_layout.tsx` — Weekly Review Auto-Trigger

- On app mount, check if it's Monday (or first open since last Monday)
- If the user hasn't seen the weekly review for this week, navigate to `/weekly-review`
- Store the last review date in AsyncStorage: `reflector-last-weekly-review`
- Check: `if (dayOfWeek === 1 && lastReviewDate < thisMonday) showWeeklyReview()`

### 4. MODIFY `app/(tabs)/profile.tsx` — Add Weekly Review Link

In the Quick Actions section, add:
```tsx
<ActionRow onPress={() => router.push('/weekly-review')}>
  <ActionLabel>WEEKLY REVIEW</ActionLabel>
</ActionRow>
```

### 5. MODIFY `app/(tabs)/engine.tsx` — Add Cross-Feature Sections

After the existing sections, add:

**"FOCUS × ROUTINES" Section:**
- For each routine, show: "When you focused X+ minutes, you were Y% more likely to complete [routine]"
- Use `computeFocusRoutineCorrelations()` from unified engine
- Only show if there's enough data (≥5 overlapping days)

**"DAILY SCORE TREND" Section:**
- Line chart showing daily score over the past 14 days
- Use the existing `TrendChart` component with daily score data
- X-axis: dates, Y-axis: 0-100

**"MOOD × COMPLETION" mini-insight:**
- If journal entries exist with linked grid days, show:
  "Your mood averaged [X] on completed days vs [Y] on missed days"
- Map mood to numeric: great=5, good=4, neutral=3, rough=2, terrible=1

## DO NOT MODIFY
- `store/useReflectorStore.ts`, `store/useFocusStore.ts`, `store/useJournalStore.ts`, `store/useGamificationStore.ts` — read only
- `app/(tabs)/_layout.tsx`
- `lib/correlationEngine.ts` — keep existing, your engine is additive
- `lib/heatmapEngine.ts` — keep existing

## Verification
1. `npx tsc --noEmit` — zero errors
2. Daily scores compute correctly from all stores
3. Weekly review modal shows accurate data
4. Focus × Routines correlation displays in engine tab
5. Weekly review auto-triggers on Monday (test by mocking date)
6. Intention input saves and displays next week
