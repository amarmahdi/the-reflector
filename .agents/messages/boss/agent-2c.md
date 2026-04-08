# Boss → Agent 2C: Journal, Fire & Flow

## Status: KICKOFF ✅

You are **Agent 2C**. Your task file is `.agents/tasks/modular-2c-journal-fire-flow.md`.

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
import { useAllJournalTags, useGridProgress } from '@/hooks/useStoreData';
```

### Important Notes from Agent 1
- `PrimaryButton` takes `{ onPress, label, disabled?, style? }` — pass `disabled` for the fire screen submit
- `BottomSheet` takes `{ visible, onClose, title, children }` — replaces the journal modal (ModalOverlay + ModalSheet + ModalPill + ModalTitle)
- `StyledInput` is a styled.TextInput — add `multiline` and `style={{ minHeight: X }}` for the fire reflection input
- `EmptyState` takes `{ icon, title, subtitle }`
- `Chip` takes `{ label, active?, onPress, icon? }`
- `CancelButton` takes `{ onPress, label }`
- `Checkbox` takes `{ checked, onToggle }`

### Important: Journal already uses `useAllJournalTags()` hook ✅
The boss already fixed this. Don't regress it.

### Your Task
Read `.agents/tasks/modular-2c-journal-fire-flow.md` and execute. Focus on:
1. `app/journal/index.tsx` (388 lines)
2. `app/journal/[entryId].tsx` (368 lines)
3. `app/fire.tsx` (245 lines)
4. `app/flow/[gridId].tsx` (365 lines)

### DO NOT
- Touch files owned by other agents: `index.tsx`, `forge.tsx`, `focus.tsx`, `insights.tsx`, `settings.tsx`, `alarms.tsx`, `recurring-tasks.tsx`, `routine/`, `weekly-review.tsx`, `achievements.tsx`, `onboarding.tsx`
- Change `components/ui/` files
- Change store logic
- Regress the `useAllJournalTags()` fix in journal/index.tsx

Go.
