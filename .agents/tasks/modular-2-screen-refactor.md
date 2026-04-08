# Task: Refactor All Screens to Use Shared UI Components

**READ `.agents/MODULAR_RULES.md` FIRST.**  
**This task DEPENDS ON `modular-1-ui-primitives` being completed first.**

## Goal
Refactor every screen to import from `@/components/ui` instead of defining its own styled components. Delete all inline duplicates.

## Per-Screen Checklist

Each screen MUST be refactored to:
1. Remove all locally-defined styled components that now exist in `@/components/ui/`
2. Import from `@/components/ui` instead
3. Replace store getter calls with hooks from `@/hooks/useStoreData`
4. Keep screen-specific styled components that are truly unique (e.g. grid cells, timer ring)

---

### `app/index.tsx` (1310 lines → target ~800)
**Remove and replace:**
- `Screen` → `import { Screen } from '@/components/ui'`
- `SectionLabel` → `import { SectionLabel } from '@/components/ui'`
- `PrimaryButton`, `PrimaryButtonText` → `import { PrimaryButton } from '@/components/ui'`
- `GhostButton`, `GhostButtonText` → `import { GhostButton } from '@/components/ui'`
- `ProgressBarBg`, `ProgressBarFill` → `import { ProgressBar } from '@/components/ui'`
- `MiniProgressBg`, `MiniProgressFill` → `import { ProgressBar } from '@/components/ui'`
- `EmptyTitle`, `EmptySubtitle` → `import { EmptyState } from '@/components/ui'`
- `InlineCancelBtn`, `InlineCancelText` → `import { CancelButton } from '@/components/ui'`
- `InlineAddBtn`, `InlineAddText` → `import { PrimaryButton } from '@/components/ui'`
- `StyledInput` → keep as `InlineInput` (has specific auto-focus behavior)
- Already uses `useTodayFocusMinutes()` hook ✓

**Keep (unique to home):**
- `TopBar`, `TopBarButton`, `TopBarIcon` (drawer-specific header)
- `HeroCard`, `HeroDayText`, etc. (hero layout)
- `TaskRow`, `Checkbox`, `TodoContent` (swipeable todo - but extract Checkbox)
- `FabContainer`, `FabButton` etc. (FAB menu)
- `XpFloatText` (XP animation)

---

### `app/forge.tsx` (791 lines → target ~500)
**Remove and replace:**
- `SectionLabel` → shared
- `PrimaryBtn`, `PrimaryBtnText` → `PrimaryButton`
- `SmallPrimaryBtn`, `SmallPrimaryBtnText` → `SmallButton`
- `ProgressBarBg`, `ProgressBarFill` → `ProgressBar`
- `EmptyIcon`, `EmptyTitle` → `EmptyState`
- `Card` → shared `Card`

---

### `app/focus.tsx` (763 lines → target ~550)
**Remove and replace:**
- `Screen` → shared
- `SectionLabel` → shared
- `PrimaryBtn`, `PrimaryBtnText` → `PrimaryButton`

**Replace store call:**
- Use `useTodaySessions()` from `@/hooks/useStoreData` (line 402 already correct)

---

### `app/insights.tsx` (676 lines → target ~450)
**Remove and replace:**
- `Screen` → shared
- `EmptyContainer`, `EmptyIcon`, `EmptyTitle`, `EmptyHint` → `EmptyState`
- `SectionHeader`, `SectionTitle`, `SectionLine` → `SectionHeader` from shared
- `Card` → shared `Card`
- `StatRow`, `StatPillContainer`, `StatValue`, `StatLabel` → `StatPill`
- `MiniBar`, `MiniBarFill` → `ProgressBar`
- `SectionHint` → can keep as local or make shared caption

**Replace store calls:**
- `getWeekFocusMinutes` → `useWeekFocusMinutes()` (line 406 already correct)

---

### `app/journal/index.tsx` (388 lines → target ~250)
**Remove and replace:**
- `Screen` → shared
- `EmptyContainer`, `EmptyIcon`, `EmptyTitle`, `EmptySubtitle` → `EmptyState`
- `FilterChip`, `FilterChipText` → `Chip`
- `CancelBtn`, `CancelBtnText` → `CancelButton`
- `ConfirmBtn`, `ConfirmBtnText` → `PrimaryButton`
- `StyledInput` → shared `StyledInput`
- `ModalOverlay`, `ModalSheet`, `ModalPill`, `ModalTitle`, `ModalActions` → `BottomSheet`
- Already uses `useAllJournalTags()` hook ✓

---

### `app/alarms.tsx` (275 lines → target ~180)
**Remove and replace:**
- `SectionLabel` → shared
- `EmptyContainer`, `EmptyIcon`, `EmptyTitle`, `EmptySubtitle` → `EmptyState`

---

### `app/recurring-tasks.tsx` (563 lines → target ~380)
**Remove and replace:**
- `EmptyContainer`, `EmptyIcon`, `EmptyTitle` → `EmptyState`
- `PrimaryBtn`, `PrimaryBtnText` → `PrimaryButton`

---

### `app/settings.tsx` (652 lines → target ~500)
**Remove and replace:**
- `SectionLabel` → shared

---

### `app/routine/[routineId].tsx` (446 lines → target ~320)
**Remove and replace:**
- `SectionLabel` → shared
- `SaveBtn`, `SaveBtnText` → `PrimaryButton`

---

### `app/flow/[gridId].tsx` (365 lines → target ~280)
**Remove and replace:**
- `Screen` → shared `ScrollScreen`
- `ErrorContainer`, `ErrorIcon`, `ErrorText` → `EmptyState`
- `CompleteBtn`, `CompleteBtnText` → `PrimaryButton`
- `ContentPad` → shared `Card` or keep

---

### `app/fire.tsx` (245 lines → target ~180)
**Remove and replace:**
- `Screen` → shared
- `SubmitBtn`, `SubmitBtnText` → `PrimaryButton` (with disabled prop)
- `ReturnBtn`, `ReturnBtnText` → `PrimaryButton`

---

### `app/weekly-review.tsx` (533 lines → target ~400)
**Remove and replace:**
- `SectionLabel` → shared

---

### `components/AlarmConfig.tsx`
**Remove and replace:**
- `CancelBtn`, `CancelBtnText` → `CancelButton`
- `SaveBtn`, `SaveBtnText` → `PrimaryButton`

---

### `components/FocusStats.tsx`
**Replace store calls:**
- `getTodayCompletedCount` → `useTodayCompletedCount()`
- `getTodayFocusMinutes` → `useTodayFocusMinutes()`
- `getStreakDays` → `useFocusStreakDays()`
All from `@/hooks/useStoreData`

## Rules
1. Do NOT change any logic, navigation, or store calls (except getter→hook swaps)
2. Do NOT change layout or visual appearance
3. The app must look IDENTICAL after refactoring
4. Remove unused imports after cleanup
5. Run `npx tsc --noEmit` after changes to verify no type errors
