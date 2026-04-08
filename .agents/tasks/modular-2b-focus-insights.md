# Task: Refactor Focus & Insights Screens

**READ `.agents/MODULAR_RULES.md` FIRST.**  
**REQUIRES: `components/ui/` from `modular-1-ui-primitives` to exist.**

## Scope
Refactor `app/focus.tsx` and `app/insights.tsx` to use shared components from `@/components/ui`.

---

## `app/focus.tsx` (763 lines → target ~550)

### Remove and import from `@/components/ui`:
- `const Screen = styled.View` → `import { Screen } from '@/components/ui'`
- `const SectionLabel = styled.Text` → `import { SectionLabel } from '@/components/ui'`
- `const PrimaryBtn = styled.Pressable` + `PrimaryBtnText` → `import { PrimaryButton } from '@/components/ui'`

### Store hook fix:
- Line ~402: `const getTodaySessions = useFocusStore((s) => s.getTodaySessions)` — already correct (extracts function ref, doesn't call it). But switch to `import { useTodaySessions } from '@/hooks/useStoreData'` for consistency.

### Keep (unique to focus):
- `CircularTimer` component import (already shared)
- Timer controls, session type selector
- Session history cards
- Context selector for active routines
- All animation logic (reanimated)

---

## `app/insights.tsx` (676 lines → target ~450)

### Remove and import from `@/components/ui`:
- `const Screen = styled.View` → `import { Screen } from '@/components/ui'`
- `const EmptyContainer` + `EmptyIcon` + `EmptyTitle` + `EmptyHint` → `import { EmptyState } from '@/components/ui'`
- `const SectionHeader = styled.View` + `SectionTitle` + `SectionLine` → `import { SectionHeader } from '@/components/ui'`
- `const Card = styled.View` → `import { Card } from '@/components/ui'`
- `const StatRow` + `StatPillContainer` + `StatValue` + `StatLabel` → `import { StatPill } from '@/components/ui'`
- `const MiniBar` + `MiniBarFill` → `import { ProgressBar } from '@/components/ui'`
- `const SectionHint` → keep as local (or create shared `Caption` text)

### Store hook fix:
- Line ~406: `const getWeekFocusMinutes = useFocusStore((s) => s.getWeekFocusMinutes)` — already correct but switch to `import { useWeekFocusMinutes } from '@/hooks/useStoreData'` for consistency.

### Keep (unique to insights):
- `StreakCard` sub-component
- `CorrelationCard` sub-component
- `WordBubbleItem` sub-component
- `FocusCorrCard`, `FocusCorrTitle`, etc. (focus correlation display)
- `InsightQuoteCard`, `InsightQuoteText`, `InsightQuoteHighlight` (quote cards)
- `InsightCard`, `InsightText`, `InsightHighlight` (mood insight)
- Import of `HeatmapCalendar`, `TrendChart`, `WeeklySummaryCard` (already shared)

### Also update `components/FocusStats.tsx`:
Replace all getter patterns with hooks:
```diff
-const getTodayCompletedCount = useFocusStore((s) => s.getTodayCompletedCount);
-const getTodayFocusMinutes = useFocusStore((s) => s.getTodayFocusMinutes);
-const getStreakDays = useFocusStore((s) => s.getStreakDays);
+import { useTodayCompletedCount, useTodayFocusMinutes, useFocusStreakDays } from '@/hooks/useStoreData';
+const todayCompleted = useTodayCompletedCount();
+const todayMinutes = useTodayFocusMinutes();
+const streakDays = useFocusStreakDays();
```

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
2. Read your boss message at `.agents/messages/boss/agent-2b.md`
3. Confirm status is `KICKOFF` before starting

### When Done
Write your completion report to `.agents/messages/from-agent-2b/done.md` containing:
- Files created/modified (with line counts)
- Decisions you made
- Any issues found
- Verification results (`npx tsc --noEmit`)

### If Stuck
Write `.agents/messages/from-agent-2b/blocker.md` with:
- What you are stuck on
- Options you see
- What you need from the Boss

### Check for Follow-ups
After reporting done, check `.agents/messages/boss/agent-2b.md` for any follow-up instructions from the Boss.
