# Task: Discipline Score System

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Overview
Create a single composite Discipline Score (0-100) calculated daily from all app systems. This becomes the north star metric displayed prominently on the home screen.

## Data Model Changes

### New in `types/models.ts`:
```ts
/** A daily snapshot of the user's discipline across all dimensions */
export interface DisciplineSnapshot {
  date: number;           // epoch ms (start-of-day)
  score: number;          // 0-100 composite
  breakdown: {
    routineScore: number;   // 0-100: % of grid tasks completed today
    focusScore: number;     // 0-100: minutes vs daily goal (default 60min)
    taskScore: number;      // 0-100: % of DailyTodos completed
    journalScore: number;   // 0-100: 100 if journaled today, streak bonus
    wakeScore: number;      // 0-100: 100 if app opened before wakeTime
  };
  createdAt: number;
}

export const DISCIPLINE_WEIGHTS = {
  routine: 0.30,
  focus: 0.20,
  task: 0.20,
  journal: 0.15,
  wake: 0.15,
} as const;

export const DEFAULT_FOCUS_GOAL_MINUTES = 60;
```

### New store: `store/useDisciplineStore.ts`
```ts
export interface DisciplineState {
  snapshots: DisciplineSnapshot[];  // last 30 days max
  focusGoalMinutes: number;         // configurable daily focus goal
  
  // Actions
  recordSnapshot: (snapshot: DisciplineSnapshot) => void;
  getTodayScore: () => number;
  get14DayTrend: () => DisciplineSnapshot[];
  getAverageScore: (days: number) => number;
  setFocusGoal: (minutes: number) => void;
}
```

Persist with key: add `discipline: 'reflector-discipline'` to `store/keys.ts`.

## Calculation Logic

Create `lib/disciplineEngine.ts`:

```ts
export function calculateDisciplineScore(
  grids: Grid40[],
  dailyTodos: DailyTodo[],
  focusSessions: FocusSession[],
  journalEntries: JournalEntry[],
  wakeTime: string,        // from NotificationSettings
  focusGoalMinutes: number,
  appOpenedAt: number,      // timestamp when app was opened today
): DisciplineSnapshot { ... }
```

### Scoring rules:
- **Routine (30%)**: For each active grid, did user complete today? Average across all active grids. If no active grids, score = 50 (neutral).
- **Focus (20%)**: `min(100, (todayFocusMinutes / focusGoalMinutes) * 100)`. Cap at 100.
- **Tasks (20%)**: `(completedTodos / totalTodos) * 100`. If no todos today, score = 50.
- **Journal (15%)**: 100 if journaled today. +10 bonus per consecutive journal day (cap at 100). 0 if not.
- **Wake (15%)**: 100 if app was opened within 30 min of wakeTime. Degrades linearly: -2 per minute late. Floor at 0.

## New Hook: `hooks/useStoreData.ts`
Add:
```ts
export function useDisciplineScore(): number { ... }
export function useDisciplineTrend(): DisciplineSnapshot[] { ... }
```

## Home Screen Integration

Add to `app/index.tsx` — a new `DisciplineArc` component between the greeting and the hero card:

```
┌──────────────────────────────────┐
│         DISCIPLINE SCORE         │
│              78                  │
│         ╭━━━━━━━━━╮              │
│        ╱ ▓▓▓▓▓▓▓░░ ╲             │  ← Arc meter, green/amber/red
│       ╱              ╲            │
│      ▲3 from yesterday           │  ← Daily change indicator
│                                  │
│  Routine  Focus  Tasks  Journal  │  ← Mini breakdown pills
│    85%     60%    90%    100%    │
└──────────────────────────────────┘
```

### Visual rules:
- Score ≥ 70: Arc pulses COLORS.crimson (green), glow effect
- Score 40-69: Arc is COLORS.gold (amber), steady
- Score < 40: Arc pulses COLORS.warmRed, dims surrounding cards

Create as `components/DisciplineArc.tsx` — self-contained component.

## Trigger
Calculate and save snapshot:
- When user opens the app (in `_layout.tsx` useEffect)
- When user completes a task/routine/journal entry (in `appActions.ts`)
- Debounce: only recalculate if last calculation was >5 minutes ago

## Files to Create
1. `store/useDisciplineStore.ts`
2. `lib/disciplineEngine.ts`
3. `components/DisciplineArc.tsx`

## Files to Modify
1. `types/models.ts` — add DisciplineSnapshot, weights, focus goal
2. `store/keys.ts` — add discipline key
3. `hooks/useStoreData.ts` — add discipline hooks
4. `app/index.tsx` — add DisciplineArc between greeting and hero card
5. `app/_layout.tsx` — trigger daily snapshot calculation on app open
6. `lib/appActions.ts` — trigger recalculation on task/routine/journal completion

## DO NOT
- Change existing store logic
- Modify other screens (insights, settings, etc.)
- Remove any existing functionality

---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-f1.md`
3. Confirm status is `KICKOFF` before starting

### When Done
Write your completion report to `.agents/messages/from-agent-f1/done.md` containing:
- Files created/modified (with line counts)
- Decisions you made
- Any issues found
- Verification results (`npx tsc --noEmit`)

### If Stuck
Write `.agents/messages/from-agent-f1/blocker.md` with:
- What you are stuck on
- Options you see
- What you need from the Boss

### Check for Follow-ups
After reporting done, check `.agents/messages/boss/agent-f1.md` for any follow-up instructions from the Boss.
