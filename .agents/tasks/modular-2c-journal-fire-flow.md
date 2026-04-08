# Task: Refactor Journal, Fire & Grid Flow Screens

**READ `.agents/MODULAR_RULES.md` FIRST.**  
**REQUIRES: `components/ui/` from `modular-1-ui-primitives` to exist.**

## Scope
Refactor `app/journal/index.tsx`, `app/journal/[entryId].tsx`, `app/fire.tsx`, and `app/flow/[gridId].tsx`.

---

## `app/journal/index.tsx` (388 lines → target ~250)

### Remove and import from `@/components/ui`:
- `const Screen = styled.View` → `import { Screen } from '@/components/ui'`
- `const EmptyContainer` + `EmptyIcon` + `EmptyTitle` + `EmptySubtitle` → `import { EmptyState } from '@/components/ui'`
- `const FilterChip` + `FilterChipText` → `import { Chip } from '@/components/ui'`
- `const CancelBtn` + `CancelBtnText` → `import { CancelButton } from '@/components/ui'`
- `const ConfirmBtn` + `ConfirmBtnText` → `import { PrimaryButton } from '@/components/ui'`
- `const StyledInput` → `import { StyledInput } from '@/components/ui'`
- `const ModalOverlay` + `ModalSheet` + `ModalPill` + `ModalTitle` + `ModalActions` → `import { BottomSheet } from '@/components/ui'`
- `const BodyInput` → keep (unique multiline variant with min-height)
- `const PickerLabel` → keep or create shared `Label`

### Store hook already fixed:
- Uses `useAllJournalTags()` from `@/hooks/useStoreData` ✅

---

## `app/journal/[entryId].tsx` (368 lines → target ~280)

### Remove and import from `@/components/ui`:
- `Screen` → shared
- Any duplicate `Card`, `EmptyState`, or button patterns

### Keep:
- Entry detail content, mood display, tag display
- Edit/delete functionality

---

## `app/fire.tsx` (245 lines → target ~180)

### Remove and import from `@/components/ui`:
- `const Screen = styled.View` → `import { Screen } from '@/components/ui'`
- `const SubmitBtn` + `SubmitBtnText` → `import { PrimaryButton } from '@/components/ui'` (pass `disabled` prop)
- `const ReturnBtn` + `ReturnBtnText` → `import { PrimaryButton } from '@/components/ui'`
- `const ReflectionInput = styled.TextInput` → `import { StyledInput } from '@/components/ui'` (add `multiline` and `minHeight` via style prop)

### Keep (unique to fire):
- `Title`, `Subtitle` (screen-specific large text)
- `RoutineName`, `DayLabel` (scar info)
- `Prompt` (reflection prompt)
- `CharCount` (character counter)
- `Counter` (pagination counter)

---

## `app/flow/[gridId].tsx` (365 lines → target ~280)

### Remove and import from `@/components/ui`:
- `const Screen = styled.ScrollView` → `import { ScrollScreen } from '@/components/ui'`
- `const ErrorContainer` + `ErrorIcon` + `ErrorText` → `import { EmptyState } from '@/components/ui'`
- `const CompleteBtn` + `CompleteBtnText` → `import { PrimaryButton } from '@/components/ui'`

### Keep (unique to grid flow):
- `GridContainer`, `GridVisual`, `GridCell`, `GridCellNumber` (5×8 grid visualization)
- `ContentPad` (padding wrapper)
- `RecalibrateBtn`, `RecalibrateBtnText`, `RecalibrateDot` (recalibrate toggle)
- `TaskList`, `TaskRow`, `Checkbox`, `Checkmark`, `TaskInfo`, `TaskTitle` (subtask checklist)
- `OptionalBadge` (optional task label)
- `ScarIndicator`, `ScarDot`, `ScarText` (scar count)

## Rules
1. **The app must look IDENTICAL after refactoring** — no visual changes
2. Do NOT change any logic, navigation, or store calls
3. Remove unused imports after cleanup
4. Use `COLORS`, `TYPOGRAPHY`, `SPACING`, `RADIUS` from theme — no hardcoded values
5. Run `npx tsc --noEmit` to verify no type errors


---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-2c.md`
3. Confirm status is `KICKOFF` before starting

### When Done
Write your completion report to `.agents/messages/from-agent-2c/done.md` containing:
- Files created/modified (with line counts)
- Decisions you made
- Any issues found
- Verification results (`npx tsc --noEmit`)

### If Stuck
Write `.agents/messages/from-agent-2c/blocker.md` with:
- What you are stuck on
- Options you see
- What you need from the Boss

### Check for Follow-ups
After reporting done, check `.agents/messages/boss/agent-2c.md` for any follow-up instructions from the Boss.
