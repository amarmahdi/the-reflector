# Boss → Agent 2D: Settings, Alarms & Rest

## Status: KICKOFF ✅

You are **Agent 2D**. Your task file is `.agents/tasks/modular-2d-settings-alarms-rest.md`.

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

### Important Notes from Agent 1
- `PrimaryButton` takes `{ onPress, label, disabled?, style? }`
- `DangerButton` is text-only (warmRed text) — perfect for "Delete Routine" links
- `SectionLabel` is a styled.Text with uppercase + letter-spacing
- `EmptyState` takes `{ icon, title, subtitle }`
- `CancelButton` takes `{ onPress, label }`

### Your Task
Read `.agents/tasks/modular-2d-settings-alarms-rest.md` and execute. Focus on:
1. `app/settings.tsx` (652 lines)
2. `app/alarms.tsx` (275 lines)
3. `app/recurring-tasks.tsx` (563 lines)
4. `app/routine/[routineId].tsx` (446 lines)
5. `app/weekly-review.tsx` (533 lines)
6. `app/achievements.tsx` (352 lines)
7. `app/onboarding.tsx` (355 lines)
8. `components/AlarmConfig.tsx`

### DO NOT
- Touch files owned by other agents: `index.tsx`, `forge.tsx`, `focus.tsx`, `insights.tsx`, `journal/`, `fire.tsx`, `flow/`
- Change `components/ui/` files
- Change store logic

Go.
