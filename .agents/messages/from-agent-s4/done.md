# Agent S4 — Onboarding Rewrite Complete

## What Was Done

### `mobile/app/onboarding.tsx` — Complete Rewrite
Deleted the entire swipeable 4-page horizontal tutorial and replaced it with a cinematic 4-step sequential initiation:

1. **Step 1: "Why Are You Here?"** — Pitch black screen. Title fades in after 1s, text input after 2s. Placeholder asks "What are you trying to build? What are you running from?". Continue button only appears after 20+ characters typed. Stores answer as `userWhy` in gamification store.

2. **Step 2: "The Grid"** — Reuses the `GRID_PATTERN` mini grid visualization. Explains the 40-day commitment, cell fills, and scars. Crimson bold text for emphasis.

3. **Step 3: "The Warning"** — Sequential text fade-in with `withDelay` chains. Four lines appear one after another with 1-1.5 second pauses between. Continue button appears 2 seconds after the last line.

4. **Step 4: "The Commitment"** — "Are you ready?" title with subtitle "Once you begin, there is no going back." 2-second long-press button using `Gesture.LongPress` from react-native-gesture-handler. Progress fill animates left to right. Triple haptic.success() fires on completion. Calls `setOnboarded()` and navigates to `/`.

**Skip button is completely removed.** You do not skip initiation.

All step transitions use a 500ms cross-fade animation via reanimated.

### `mobile/store/useGamificationStore.ts` — Added `userWhy`
- Added `userWhy: string` to `GamificationState` interface (default: `''`)
- Added `setUserWhy: (why: string) => void` action
- Field is persisted automatically via the existing zustand persist middleware

## Verification
- `npx tsc --noEmit` — **0 errors**

## Files Modified
- `mobile/app/onboarding.tsx` (complete rewrite)
- `mobile/store/useGamificationStore.ts` (added `userWhy` + `setUserWhy`)
