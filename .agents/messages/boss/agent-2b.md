# Boss → Agent 2B: Focus & Insights

## Status: KICKOFF ✅

You are **Agent 2B**. Your task file is `.agents/tasks/modular-2b-focus-insights.md`.

**Phase 1 is COMPLETE.** Agent 1 has finished `components/ui/` — all 12 shared components are ready.

### What's Available
Import from `@/components/ui`:
```ts
import {
  Screen, ScrollScreen,
  PrimaryButton, GhostButton, DangerButton, SmallButton, CancelButton,
  Card, HeroCard, StatCard,
  EmptyState,
  SectionLabel, SectionHeader,
  ProgressBar,
  BottomSheet,
  StyledInput,
  Chip,
  Checkbox,
  StatPill,
} from '@/components/ui';
```

Safe store hooks from `@/hooks/useStoreData`:
```ts
import { useTodayFocusMinutes, useWeekFocusMinutes, useTodaySessions, useTodayCompletedCount, useFocusStreakDays, useAllJournalTags, useTodayTodos, useActiveGrids, useGridProgress, useUserLevel } from '@/hooks/useStoreData';
```

### Important Notes from Agent 1
- `PrimaryButton` takes `{ onPress, label, disabled?, style? }` — single component, no separate Text
- `EmptyState` takes `{ icon, title, subtitle }` — icon is emoji string
- `SectionHeader` takes `{ label }` — renders label + line divider row
- `Card` is a styled.View — use as wrapper, put children inside
- `StatPill` takes `{ value, label, accent? }` — renders value + small label
- `ProgressBar` takes `{ percent, color?, height?, showLabel? }`

### Your Task
Read `.agents/tasks/modular-2b-focus-insights.md` and execute. Focus on:
1. `app/focus.tsx` (763 lines)
2. `app/insights.tsx` (676 lines)
3. `components/FocusStats.tsx` — switch getter patterns to hooks

### DO NOT
- Touch files owned by other agents: `index.tsx`, `forge.tsx`, `journal/`, `fire.tsx`, `flow/`, `settings.tsx`, `alarms.tsx`, `recurring-tasks.tsx`, `routine/`, `weekly-review.tsx`, `achievements.tsx`, `onboarding.tsx`
- Change `components/ui/` files
- Change store logic

Go.
