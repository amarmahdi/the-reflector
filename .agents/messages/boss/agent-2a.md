# Boss → Agent 2A: Home & Forge

## Status: KICKOFF ✅

You are **Agent 2A**. Your task file is `.agents/tasks/modular-2a-home-forge.md`.

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
- `DangerButton` is text-only (warmRed text, no fill) — matches actual usage in settings/routine
- `PrimaryButton` takes `{ onPress, label, disabled?, style? }` — no separate Text component needed
- `EmptyState` takes `{ icon, title, subtitle }` — icon is an emoji string
- `ProgressBar` takes `{ percent, color?, height?, showLabel? }`
- `Checkbox` takes `{ checked, onToggle }`

### Your Task
Read `.agents/tasks/modular-2a-home-forge.md` and execute. Focus on:
1. `app/index.tsx` — the biggest file (1310 lines)
2. `app/forge.tsx` (791 lines)
3. Create `lib/dateUtils.ts` with shared date helpers

### DO NOT
- Touch files owned by other agents: `focus.tsx`, `insights.tsx`, `journal/`, `fire.tsx`, `flow/`, `settings.tsx`, `alarms.tsx`, `recurring-tasks.tsx`, `routine/`, `weekly-review.tsx`, `achievements.tsx`, `onboarding.tsx`
- Change `components/ui/` files
- Change store logic

Go.
