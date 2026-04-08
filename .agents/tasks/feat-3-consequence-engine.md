# Task: Consequence Engine

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Overview
When the user misses a routine day, the app doesn't just mark a scar — it imposes progressive consequences: XP loss, tier drops, forced reflections, and visual "wounds" on the home screen.

## Data Model Changes

### Add to `types/models.ts`:
```ts
/** Tracks accumulated consequences from missed routine days */
export interface WoundTracker {
  totalMisses: number;        // lifetime misses (resets per grid, or accumulates — see below)
  activeWounds: number;       // current unhealable wound count
  healedWounds: number;       // wounds healed via perfect day streaks
  perfectDayStreak: number;   // consecutive perfect days (for healing)
  lastMissDate: number;       // epoch ms of last miss
}

export const DEFAULT_WOUND_TRACKER: WoundTracker = {
  totalMisses: 0,
  activeWounds: 0,
  healedWounds: 0,
  perfectDayStreak: 0,
  lastMissDate: 0,
};
```

### Add to `GamificationState` in `store/useGamificationStore.ts`:
```ts
wounds: WoundTracker;

// Actions
recordMiss: () => void;       // called when a day is scarred
recordPerfectDay: () => void; // called when ALL active grids completed
getConsequenceLevel: () => number; // 1-4 based on recent misses
```

## Consequence Logic

Create `lib/consequenceEngine.ts`:

```ts
export interface Consequence {
  level: number;          // 1-4
  xpPenalty: number;      // XP to remove
  message: string;        // shown to user
  forcedReflection: boolean;  // must write before using app
  tierDrop: boolean;      // drops momentum tier
}

export function getConsequence(missCount: number): Consequence {
  if (missCount <= 1) return {
    level: 1, xpPenalty: 10,
    message: "One slip. Get back.",
    forcedReflection: false, tierDrop: false,
  };
  if (missCount === 2) return {
    level: 2, xpPenalty: 25,
    message: "Two misses. The cracks are showing.",
    forcedReflection: false, tierDrop: true,
  };
  if (missCount === 3) return {
    level: 3, xpPenalty: 50,
    message: "Three. This is becoming a pattern.",
    forcedReflection: true, tierDrop: true,
  };
  return {
    level: 4, xpPenalty: 100,
    message: "What happened to the person who started?",
    forcedReflection: true, tierDrop: true,
  };
}
```

## Healing Mechanic
- Complete ALL active grids for 3 consecutive days = heal 1 wound
- Track via `perfectDayStreak` in WoundTracker
- When healed, show a brief celebration: *"Wound healed. +1 strength."*
- `activeWounds` decremented, `healedWounds` incremented

## Integration Points

### `lib/appActions.ts` — modify `onDayScarred()` (or create if not existing):
```ts
export function onDayScarred() {
  const { recordMiss, getConsequenceLevel } = useGamificationStore.getState();
  recordMiss();
  const consequence = getConsequence(getConsequenceLevel());
  
  // Apply XP penalty
  const { addXP } = useGamificationStore.getState();
  addXP(-consequence.xpPenalty);
  
  // If forced reflection required, set a flag for _layout.tsx to intercept
  if (consequence.forcedReflection) {
    AsyncStorage.setItem('pending-forced-reflection', 'true');
  }
}
```

### `app/_layout.tsx` — check for pending forced reflection:
On app open, if `pending-forced-reflection` is set, redirect to a reflection screen before allowing navigation.

### `app/index.tsx` — Wound Counter display:
Show a small "wounds" indicator near the discipline score or in the stats footer:
```
💔 2 wounds  ·  1 day until heal
```

Use COLORS.warmRed for wound display. When wounds = 0, show nothing.

### `app/fire.tsx` — show consequence message:
After the user writes their failure reflection, show the consequence message:
```
"Two misses. The cracks are showing. -25 XP."
```

## Files to Create
1. `lib/consequenceEngine.ts`

## Files to Modify
1. `types/models.ts` — add WoundTracker interface
2. `store/useGamificationStore.ts` — add wounds field + actions
3. `lib/appActions.ts` — add onDayScarred consequence logic
4. `app/index.tsx` — add wound counter display
5. `app/fire.tsx` — show consequence message after reflection
6. `app/_layout.tsx` — forced reflection redirect check

## DO NOT
- Change the existing fire.tsx reflection flow (just add to it)
- Remove any existing XP gains
- Change how scars work in the grid

---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-f3.md`

### When Done
Write your completion report to `.agents/messages/from-agent-f3/done.md`

### If Stuck
Write `.agents/messages/from-agent-f3/blocker.md`
