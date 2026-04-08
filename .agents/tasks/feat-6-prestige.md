# Task: Prestige System (New Game+)

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Overview
Completing a 40-day grid earns a Prestige Star. Repeat the same routine = harder rules + XP multiplier + permanent badges. Gives infinite replayability.

## Data Model Changes

### Add to `types/models.ts`:
```ts
export type PrestigeLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const PRESTIGE_CONFIG: Record<PrestigeLevel, { 
  name: string; 
  emoji: string; 
  xpMultiplier: number;
  hardResetForced: boolean;
  reflectionMinChars: number;
}> = {
  0: { name: 'Untested', emoji: '', xpMultiplier: 1.0, hardResetForced: false, reflectionMinChars: 50 },
  1: { name: 'Tested', emoji: '⭐', xpMultiplier: 1.2, hardResetForced: false, reflectionMinChars: 50 },
  2: { name: 'Trained', emoji: '⭐⭐', xpMultiplier: 1.5, hardResetForced: true, reflectionMinChars: 75 },
  3: { name: 'Mastered', emoji: '⭐⭐⭐', xpMultiplier: 2.0, hardResetForced: true, reflectionMinChars: 100 },
  4: { name: 'Elite', emoji: '💎', xpMultiplier: 2.5, hardResetForced: true, reflectionMinChars: 100 },
  5: { name: 'Legendary', emoji: '👑', xpMultiplier: 3.0, hardResetForced: true, reflectionMinChars: 150 },
};

export function getPrestigeLevel(completions: number): PrestigeLevel {
  return Math.min(5, completions) as PrestigeLevel;
}
```

### Add to `Routine` interface in `types/models.ts`:
```diff
export interface Routine {
  id: string;
  title: string;
  subTasks: SubTask[];
  createdAt: number;
+ /** Number of times a grid for this routine has been completed */
+ completedGridCount: number;
}
```

Default `completedGridCount: 0` for existing routines.

### Modify `createRoutine` in `types/models.ts`:
```diff
return {
  id: Crypto.randomUUID(),
  title,
  subTasks: ...,
  createdAt: Date.now(),
+ completedGridCount: 0,
};
```

## Store Changes

### `store/useReflectorStore.ts`:
Add action:
```ts
incrementRoutinePrestige: (routineId: string) => void;
```

This is called when a grid completes (status → 'completed'). It increments the routine's `completedGridCount`.

### Modify grid completion logic:
When a grid completes, also call `incrementRoutinePrestige()`. This likely happens in the existing `completeDay` or similar action. Find where `grid.status = 'completed'` is set.

### Modify `createGrid40`:
When creating a new grid for a routine with prestige ≥ 2, force `isHardResetEnabled: true` regardless of user choice.

## XP Multiplier Integration

### `lib/appActions.ts`:
When awarding XP for routine completion, multiply by the prestige multiplier:
```ts
const routine = routines.find(r => r.id === grid.routineId);
const prestige = getPrestigeLevel(routine?.completedGridCount ?? 0);
const config = PRESTIGE_CONFIG[prestige];
addXP(Math.round(5 * config.xpMultiplier)); // 5 base XP * multiplier
```

## Visual Display

### `app/forge.tsx` — Prestige badges on routine cards:
Next to each routine title, show the prestige emoji:
```
Morning Block ⭐⭐⭐
Mastered · 2.0x XP
```

If prestige = 0, show nothing extra.

### `app/flow/[gridId].tsx` — Prestige info banner:
At the top of the grid detail:
```
⭐⭐ Trained · 1.5x XP · Hard Reset ON
```

### Grid completion celebration:
When a grid completes AND it levels up prestige, show:
```
┌──────────────────────────────────┐
│         ⭐⭐⭐                    │
│      MASTERED                    │
│                                  │
│  Morning Block                   │
│  3 completions · 2.0x XP        │
│                                  │
│  "Next grid: harder rules,      │
│   bigger rewards."               │
└──────────────────────────────────┘
```

## Files to Modify
1. `types/models.ts` — add PrestigeLevel, PRESTIGE_CONFIG, completedGridCount to Routine, modify createRoutine
2. `store/useReflectorStore.ts` — add incrementRoutinePrestige action, modify grid completion
3. `lib/appActions.ts` — add XP multiplier logic
4. `app/forge.tsx` — show prestige badges on routine cards
5. `app/flow/[gridId].tsx` — show prestige info banner

## DO NOT
- Create new screens
- Create new stores
- Change existing grid completion flow (just add prestige increment to it)
- Make prestige visible to other features (it's self-contained for now)

---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-f6.md`

### When Done
Write your completion report to `.agents/messages/from-agent-f6/done.md`

### If Stuck
Write `.agents/messages/from-agent-f6/blocker.md`
