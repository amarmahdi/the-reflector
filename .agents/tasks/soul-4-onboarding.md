# Agent S4 — Onboarding Rewrite (The Initiation)

## Summary

Replace the current 4-page horizontal swipe tutorial with a sequential, cinematic initiation flow. The onboarding should feel like entering a martial arts dojo — solemn, intentional, and irreversible.

## Context

- Onboarding screen: `app/onboarding.tsx` (complete rewrite)
- Gamification store: `store/useGamificationStore.ts` (need to add `userWhy` field)
- Design system: `constants/theme.ts` (COLORS, TYPOGRAPHY, SPACING, RADIUS)
- Haptics: `lib/haptics.ts`
- Animations: `react-native-reanimated`
- Pact screen: `app/pact.tsx` (redirect here after onboarding)
- The `setOnboarded()` function marks onboarding complete
- Auth: `store/useAuthStore.ts` — user may or may not be logged in during onboarding

## New Onboarding Flow

### Step 1: "Why Are You Here?"

- **Pitch black screen.** Background: `COLORS.surface0` (#0A0A0A)
- After 1 second delay, fade in white text: **"Why are you here?"**
  - Font: 24px, weight 700, color `COLORS.textPrimary`, letter-spacing 2px
  - Centered on screen
- After 2 seconds total, fade in a text input below:
  - Multi-line, min height 100px
  - Placeholder: "What are you trying to build? What are you running from?"
  - Background: `COLORS.surface2`, border: `COLORS.border`
  - On focus: border color `COLORS.crimson`
- Below the input, a subtle "Continue" button that only appears when the user has typed at least 20 characters
  - Style: ghost button, text color `COLORS.textDim`, animates to `COLORS.crimson` when enabled
  - No glow, no emphasis — the question is the star, not the button

**On continue:** Store the answer in `useGamificationStore` as `userWhy`. Animate the entire screen fading out over 500ms.

### Step 2: "The Grid"

- Fade in after Step 1 fades out
- Show the existing mini grid visualization (reuse `GRID_PATTERN` from current onboarding)
- Below it, text:
  - "You will commit to **40 days**."
  - "Each day you honor your word, a cell fills."
  - "Each day you break it, you earn a **scar** — a permanent mark."
- Style: `COLORS.textSecondary`, 15px, centered, line-height 24px
- Bold text in `COLORS.crimson`
- "Continue" button at bottom — same ghost style

### Step 3: "The Warning"

- Black screen, fade in text over 1.5 seconds:
  - **"This app will not congratulate you for doing what you should."**
  - 1 second pause
  - **"It will remind you when you lie to yourself."**
  - 1 second pause
  - **"It will punish your inconsistency."**
  - 1 second pause
  - **"And it will remember every failure."**
- Each line fades in sequentially (use `withDelay` chains)
- All text: 16px, weight 600, `COLORS.textSecondary`, centered
- After all lines appear, pause 2 seconds, then show the continue button

### Step 4: "The Commitment"

- Text: **"Are you ready?"**
  - 28px, weight 700, `COLORS.textPrimary`, centered
- Below: **"Once you begin, there is no going back."**
  - 14px, weight 500, `COLORS.textDim`
- Long-press button: **"I am ready."**
  - Style: `COLORS.crimson` background, white text, 16px, weight 700
  - Requires 2-second long press to activate (use `Gesture.LongPress` from gesture-handler)
  - During press: button fills with a progress animation (left to right fill)
  - On complete: `haptic.success()` fires 3 times in rapid succession
  - Set `setOnboarded()` and navigate to home: `router.replace('/')`

**Remove the "Skip" button entirely.** You do not skip initiation.

## Files to Modify

### `mobile/app/onboarding.tsx`
- Complete rewrite. Delete all existing content and replace with the 4-step flow above.
- Use `useState` for step tracking (step 1-4)
- Use `react-native-reanimated` for all fade/delay animations
- Use `react-native-gesture-handler` for the long-press button
- Use `KeyboardAvoidingView` for Step 1 (has text input)

### `mobile/store/useGamificationStore.ts`
- Add `userWhy: string` to the store state (default: `''`)
- Add `setUserWhy: (why: string) => void` action
- Add `userWhy` to the `partialize` function if persist is used (check the store pattern)

## Rules

- Do NOT modify any other screens
- Do NOT change the `setOnboarded()` logic — just call it on Step 4 completion
- Do NOT add new dependencies — use what's already installed
- Match the dark/sacred aesthetic from `constants/theme.ts`
- The `userWhy` text will be used by the Oracle (S1) and the Pact screen later — just store it
- Keep the file structure the same (single default export)

## Testing

1. Clear app data / first launch
2. Verify Step 1: black screen → "Why are you here?" → text input
3. Verify Step 2: grid visualization + explanation
4. Verify Step 3: sequential text fade-in
5. Verify Step 4: long-press button with progress fill + haptics
6. Verify no "Skip" button anywhere
7. Verify `userWhy` is stored in the gamification store
8. `npx tsc --noEmit` — zero errors

## When Done

1. Write receipt to `.agents/messages/from-agent-s4/done.md`
2. Commit and push to `main`
