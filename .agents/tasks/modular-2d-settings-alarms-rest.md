# Task: Refactor Settings, Alarms, Recurring Tasks, Routine Editor, Weekly Review, Achievements & Onboarding

**READ `.agents/MODULAR_RULES.md` FIRST.**  
**REQUIRES: `components/ui/` from `modular-1-ui-primitives` to exist.**

## Scope
Refactor all remaining screens to use shared components from `@/components/ui`.

---

## `app/settings.tsx` (652 lines → target ~500)

### Remove and import from `@/components/ui`:
- `const SectionLabel` → `import { SectionLabel } from '@/components/ui'`

### Keep:
- All settings-specific rows, toggles, sliders (unique to this screen)
- Sound picker, time picker components

---

## `app/alarms.tsx` (275 lines → target ~180)

### Remove and import from `@/components/ui`:
- `const SectionLabel` → shared
- `const EmptyContainer` + `EmptyIcon` + `EmptyTitle` + `EmptySubtitle` → `import { EmptyState } from '@/components/ui'`

### Keep:
- Alarm list items, toggle switches, time display

---

## `app/recurring-tasks.tsx` (563 lines → target ~380)

### Remove and import from `@/components/ui`:
- `const EmptyContainer` + `EmptyIcon` + `EmptyTitle` → `import { EmptyState } from '@/components/ui'`
- `const PrimaryBtn` + `PrimaryBtnText` → `import { PrimaryButton } from '@/components/ui'`

### Keep:
- Task list items, category chips, time block selectors
- Add/edit form modal
- Day picker component

---

## `app/routine/[routineId].tsx` (446 lines → target ~320)

### Remove and import from `@/components/ui`:
- `const SectionLabel` → shared
- `const SaveBtn` + `SaveBtnText` → `import { PrimaryButton } from '@/components/ui'`

### Keep:
- SubTask list with add/remove
- Routine configuration form
- Delete confirmation

---

## `app/weekly-review.tsx` (533 lines → target ~400)

### Remove and import from `@/components/ui`:
- `const SectionLabel` → shared

### Keep:
- Review sections specific to weekly data
- Score display and trends

---

## `app/achievements.tsx` (352 lines → target ~290)

### Remove and import from `@/components/ui`:
- Any `Screen`, `EmptyState`, `Card`, `SectionLabel` patterns if present

### Keep:
- Achievement cards, progress indicators
- Locked/unlocked state display

---

## `app/onboarding.tsx` (355 lines → target ~300)

### Remove and import from `@/components/ui`:
- Any button patterns → shared buttons

### Keep:
- Onboarding flow, step indicators
- Welcome content

---

## `components/AlarmConfig.tsx`

### Remove and import from `@/components/ui`:
- `const CancelBtn` + `CancelBtnText` → `import { CancelButton } from '@/components/ui'`
- `const SaveBtn` + `SaveBtnText` → `import { PrimaryButton } from '@/components/ui'`

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
2. Read your boss message at `.agents/messages/boss/agent-2d.md`
3. Confirm status is `KICKOFF` before starting

### When Done
Write your completion report to `.agents/messages/from-agent-2d/done.md` containing:
- Files created/modified (with line counts)
- Decisions you made
- Any issues found
- Verification results (`npx tsc --noEmit`)

### If Stuck
Write `.agents/messages/from-agent-2d/blocker.md` with:
- What you are stuck on
- Options you see
- What you need from the Boss

### Check for Follow-ups
After reporting done, check `.agents/messages/boss/agent-2d.md` for any follow-up instructions from the Boss.
