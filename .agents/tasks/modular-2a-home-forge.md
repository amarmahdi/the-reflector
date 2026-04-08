# Task: Refactor Home & Forge Screens

**READ `.agents/MODULAR_RULES.md` FIRST.**  
**REQUIRES: `components/ui/` from `modular-1-ui-primitives` to exist.**

## Scope
Refactor `app/index.tsx` and `app/forge.tsx` to use shared components from `@/components/ui`.

---

## `app/index.tsx` (1310 lines → target ~800)

### Remove and import from `@/components/ui`:
- `const Screen = styled.View` → `import { Screen } from '@/components/ui'`
- `const SectionLabel = styled.Text` → `import { SectionLabel } from '@/components/ui'`
- `const PrimaryButton = styled.Pressable` + `PrimaryButtonText` → `import { PrimaryButton } from '@/components/ui'`
- `const GhostButton = styled.Pressable` + `GhostButtonText` → `import { GhostButton } from '@/components/ui'`
- `const ProgressBarBg` + `ProgressBarFill` → `import { ProgressBar } from '@/components/ui'`
- `const MiniProgressBg` + `MiniProgressFill` → `import { ProgressBar } from '@/components/ui'`
- `const EmptyTitle` + `EmptySubtitle` → `import { EmptyState } from '@/components/ui'`
- `const InlineCancelBtn` + `InlineCancelText` → `import { CancelButton } from '@/components/ui'`
- `const InlineAddBtn` + `InlineAddText` → `import { PrimaryButton } from '@/components/ui'`

### Keep (unique to home screen):
- `TopBar`, `TopBarButton`, `TopBarIcon` (drawer header)
- `HeroCard`, `HeroRoutineTitle`, `HeroDayText` (hero layout)
- `TaskRow`, `Checkbox`, `TodoContent`, `TodoTopRow`, etc. (swipeable todo system)
- `FabContainer`, `FabButton`, `FabOption*` (FAB action menu)
- `XpFloatText` (XP animation)
- `OtherRoutineCard`, etc. (horizontal scroll cards)
- `JournalCard` styled components (journal prompt section)
- `ExploreGrid`, `ExploreCard` (explore section)
- `StatsFooter` (mini stats)

### Store hook fix (already done):
- Line ~839: `useTodayFocusMinutes()` from `@/hooks/useStoreData` ✅

### Extract inline helpers to `@/lib/dateUtils`:
- `getGreeting()`, `getFormattedDate()`, `isAfter5PM()`, `formatTimeHHMM()`
- Create `lib/dateUtils.ts` if it doesn't exist

---

## `app/forge.tsx` (791 lines → target ~500)

### Remove and import from `@/components/ui`:
- `const SectionLabel` → shared
- `const PrimaryBtn` + `PrimaryBtnText` → `import { PrimaryButton } from '@/components/ui'`
- `const SmallPrimaryBtn` + `SmallPrimaryBtnText` → `import { SmallButton } from '@/components/ui'`
- `const ProgressBarBg` + `ProgressBarFill` → `import { ProgressBar } from '@/components/ui'`
- `const EmptyIcon` + `EmptyTitle` → `import { EmptyState } from '@/components/ui'`
- `const Card` (if matching base card pattern) → `import { Card } from '@/components/ui'`

### Keep (unique to forge):
- `RoutineCard`, `RoutineTitle`, `RoutineMeta` (routine list items)
- `GridCard`, `GridStatusBadge` (grid cards)
- `SubTaskRow`, `SubTaskInput` (routine creation form)
- FAB and modal for creating routines

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
2. Read your boss message at `.agents/messages/boss/agent-2a.md`
3. Confirm status is `KICKOFF` before starting

### When Done
Write your completion report to `.agents/messages/from-agent-2a/done.md` containing:
- Files created/modified (with line counts)
- Decisions you made
- Any issues found
- Verification results (`npx tsc --noEmit`)

### If Stuck
Write `.agents/messages/from-agent-2a/blocker.md` with:
- What you are stuck on
- Options you see
- What you need from the Boss

### Check for Follow-ups
After reporting done, check `.agents/messages/boss/agent-2a.md` for any follow-up instructions from the Boss.
