# Agent F3: Consequence Engine — DONE ✅

## Summary

The Consequence Engine has been fully implemented. Missed routine days now carry progressive weight — not just a scar on the grid, but real XP loss, wound accumulation, and for serious patterns, forced reflections.

---

## Files Created

### `lib/consequenceEngine.ts` [NEW]
- `Consequence` interface with `level`, `xpPenalty`, `message`, `forcedReflection`, `tierDrop`
- `getConsequence(missCount)` function returning 4-tier progressive consequence:
  - Level 1 (1 miss): -10 XP, no forced reflection
  - Level 2 (2 misses): -25 XP, tier drop
  - Level 3 (3 misses): -50 XP, forced reflection, tier drop
  - Level 4 (4+ misses): -100 XP, forced reflection, tier drop

---

## Files Modified

### `types/models.ts`
- Added `WoundTracker` interface: `totalMisses`, `activeWounds`, `healedWounds`, `perfectDayStreak`, `lastMissDate`
- Added `DEFAULT_WOUND_TRACKER` constant

### `store/useGamificationStore.ts`
- Added `wounds: WoundTracker` field (initialized from `DEFAULT_WOUND_TRACKER`)
- Added `recordMiss()`: increments totalMisses + activeWounds, resets perfectDayStreak
- Added `recordPerfectDay()`: increments streak, heals 1 wound every 3 perfect days
- Added `getConsequenceLevel()`: returns current totalMisses count
- Fixed `addXP()`: now uses `Math.max(0, ...)` to prevent XP going negative

### `lib/appActions.ts`
- Added `triggerDisciplineCalculation` export stub (fixes pre-existing `_layout.tsx` import error)
- Added `onDayScarred()`: calls `recordMiss()`, applies XP penalty, sets `pending-forced-reflection` flag in AsyncStorage if level 3+, returns Consequence object
- Added `recordPerfectDay()` call in `onDayCompleted()` when all active grids are completed for the day
- Removed duplicate `getPrestigeLevel`/`PRESTIGE_CONFIG` import

### `app/fire.tsx`
- Added `pendingConsequence` state
- `handleSubmit` is now `async`, calls `onDayScarred()`, stores consequence
- After reflection submitted: shows `ConsequenceBanner` with message + XP penalty display
- User clicks "Continue" (or "Next Reflection") to proceed — this separates writing from seeing the cost
- Added `ConsequenceBanner`, `ConsequenceTitle`, `ConsequenceMessage`, `ConsequenceXP` styled components using `COLORS.warmRed`

### `app/index.tsx`
- Reads `wounds` from `useGamificationStore`
- Stats footer shows `💔 N wound(s)` in `COLORS.warmRed` when `activeWounds > 0`
- Hidden completely when wounds = 0 (no noise for clean users)

### `app/_layout.tsx`
- Added `pending-forced-reflection` AsyncStorage check on app mount
- If flag is set, clears it (to prevent loop) and redirects to `/fire`
- Follows same pattern as existing `reflector-last-fire-check` logic

---

## TypeScript Status
- `npx tsc --noEmit`: 1 remaining error in `store/useReflectorStore.ts` — `Pact` type not yet in models. This is pre-existing from another agent's work and not related to this feature.
- All consequence engine changes compile cleanly.

---

## Key Design Decisions
1. **Consequence shown AFTER reflection** (per boss message) — user writes first, then sees the cost.
2. **XP capped at 0** — `addXP(-penalty)` can't put users in negative XP.
3. **Forced reflection uses AsyncStorage flag** — follows existing `reflector-last-fire-check` pattern in `_layout.tsx`.
4. **Wound healing is gradual** — 3 consecutive perfect days heals 1 wound (encouraging sustained recovery).
5. **Did NOT touch**: DisciplineScore, GhostCard, or Momentum Tiers (per boss instructions).
