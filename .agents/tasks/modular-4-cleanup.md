# Task: Clean Up Dead Code & Consolidate Utilities

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Goal
Remove dead code, consolidate scattered utility patterns, and ensure a clean import graph.

## 1. Consolidate Haptic Patterns

Currently every screen imports `haptic` and calls it with the same patterns. This is fine but we should verify consistency.

Verify all files use `import { haptic } from '@/lib/haptics'` — no inline `Haptics.xxx()` calls.

## 2. Consolidate Date Helpers

Multiple screens define the same inline date helpers:
- `getStartOfDay()` in journal/index.tsx
- `daysAgo()` in seedData.ts  
- `formatDayName()` in WeeklySummaryCard.tsx
- `formatDateHeader()` in journal/index.tsx
- `formatTimeHHMM()` in index.tsx
- `getGreeting()` / `getFormattedDate()` in index.tsx

**Create `lib/dateUtils.ts`** with:
```ts
export function getStartOfDay(epoch?: number): number { ... }
export function daysAgo(n: number): number { ... }
export function formatDateHeader(epoch: number): string { ... }
export function formatTimeHHMM(time: string): string { ... }
export function getGreeting(): string { ... }
export function getFormattedDate(): string { ... }
export function isAfter5PM(): boolean { ... }
```

Then update all screens to import from `@/lib/dateUtils` instead of defining locally.

## 3. Remove Expo Boilerplate Files

These files are from `create-expo-app` and are NOT used:
- `components/EditScreenInfo.tsx`
- `components/StyledText.tsx`
- `components/ExternalLink.tsx`
- `components/Themed.tsx`
- `components/useColorScheme.ts`
- `components/useColorScheme.web.ts`
- `components/useClientOnlyValue.ts`
- `components/useClientOnlyValue.web.ts`

Verify with `grep -r "EditScreenInfo\|StyledText\|ExternalLink\|Themed\|useColorScheme\|useClientOnlyValue" app/ components/ --include="*.tsx" --include="*.ts"` that none are imported, then delete them.

## 4. Consolidate `appActions.ts` Callbacks

`lib/appActions.ts` contains gamification side effects:
- `onDayCompleted`
- `onTaskCompleted`
- `onGridCompleted`
- `onGridFailed`
- `onJournalEntryCreated`

These are used across many screens. Verify all screens import from `@/lib/appActions` consistently (no inline gamification logic).

## 5. Constants Audit

Check that no screen hardcodes:
- `40` (grid size) — should use `GRID.TOTAL_DAYS`
- `50` (reflection min chars) — should use `REFLECTION_MIN_CHARS`
- Font sizes — should use `TYPOGRAPHY`
- Spacing values — should use `SPACING`
- Border radii — should use `RADIUS`

## Verification

```bash
# Verify no unused imports
npx tsc --noEmit

# Verify no unused component files
for f in components/*.tsx; do
  base=$(basename "$f" .tsx)
  count=$(grep -r "$base" app/ components/ --include="*.tsx" --include="*.ts" -l | wc -l)
  if [ "$count" -le 1 ]; then
    echo "POSSIBLY UNUSED: $f (found in $count files)"
  fi
done
```


---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-4.md`
3. Confirm status is `KICKOFF` before starting

### When Done
Write your completion report to `.agents/messages/from-agent-4/done.md` containing:
- Files created/modified (with line counts)
- Decisions you made
- Any issues found
- Verification results (`npx tsc --noEmit`)

### If Stuck
Write `.agents/messages/from-agent-4/blocker.md` with:
- What you are stuck on
- Options you see
- What you need from the Boss

### Check for Follow-ups
After reporting done, check `.agents/messages/boss/agent-4.md` for any follow-up instructions from the Boss.
