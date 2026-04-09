# Agent S3 — The Fire Screen (Hostage Mode)

## Summary

Transform the Fire screen from a gentle reflection form into an inescapable, uncomfortable confrontation. The user should FEEL the weight of their failure through color, animation, and haptics. This is the app's most important emotional moment.

## Dependency

⚠️ **Run AFTER Agent S2 (Copywriting).** S2 changes the text on this screen. S3 changes the visuals.

## Context

- Fire screen: `app/fire.tsx`
- Design system: `constants/theme.ts` (COLORS, TYPOGRAPHY, SPACING, RADIUS)
- Haptics: `lib/haptics.ts` (haptic.light, haptic.medium, haptic.success, haptic.warning, haptic.error)
- Animations: `react-native-reanimated` is available
- The screen is already a fullscreen modal (headerShown: false in _layout.tsx)

## Visual Changes to `app/fire.tsx`

### Background

Replace the default `Screen` background with a **deep blood-red darkness**:
- Base background: `#0D0505` (almost black with red undertone)
- Add a pulsing red vignette overlay using `react-native-reanimated`:
  - Semi-transparent radial gradient feel using a positioned `Animated.View` with `backgroundColor: 'rgba(80, 10, 10, 0.3)'`
  - Opacity pulses slowly between 0.15 and 0.35 over 3 seconds
  - Positioned absolute, covers entire screen

### On Mount

- Fire a `haptic.warning()` immediately on mount — the phone buzzes when you arrive
- Add 500ms delay, then a second `haptic.error()` — double-pulse to feel the weight
- Fade-in the content over 800ms (currently no entrance animation)

### The Pact Confrontation Card

Make it more dominant:
- Increase padding to 20px
- Border color: `COLORS.gold` → `COLORS.warmRed` (this is a confrontation, not a reminder)
- Add a subtle background glow: `rgba(139, 74, 74, 0.08)`
- Make the pact text larger: 15px → 17px
- Make "Are you giving up on that?" → "Are you abandoning your word?" (if S2 hasn't changed it)

### The Reflection Input

- Increase minimum height from 120px to 160px
- Border color: `COLORS.border` → `rgba(139, 74, 74, 0.3)` (subtle red tint)
- Focus border: `COLORS.warmRed`
- Placeholder text color: slightly more visible

### The Submit Button

- When disabled (not enough chars): dim, no glow
- When enabled: add a subtle pulsing shadow in `COLORS.warmRed`
- On press: heavy haptic `haptic.error()` + the button text changes to "Scarred." for 1 second before proceeding

### Consequence Banner Animation

When the consequence appears after submitting:
- Slide up from bottom with `withSpring` (damping: 12, stiffness: 100)
- Fire `haptic.error()` on appear
- XP penalty text should be large and red: 20px font
- Add a "weight drop" feel — the card should overshoot slightly and bounce back

### Counter Text

Change the counter style:
- "1 of 3 reflections" → "Wound 1 of 3"
- Color: `COLORS.warmRed` instead of `COLORS.textDim`

## Rules

- Keep ALL existing logic intact (markDayScarred, journal auto-create, consequence system, hard reset check)
- Keep the component structure the same — only modify visual properties and add animations
- Use `react-native-reanimated` for all animations (already imported)
- Use `styled-components/native` for all styling (already used)
- Do NOT modify the Pact data model or any store logic

## Testing

1. Deliberately miss a day in a grid (set a day to pending in the past)
2. Open the app — verify redirect to Fire screen
3. Verify the screen feels dark red and heavy
4. Verify haptic buzz on mount
5. Type a reflection and submit
6. Verify consequence card slides up with animation
7. Verify XP penalty is visually prominent

## When Done

1. Write receipt to `.agents/messages/from-agent-s3/done.md`
2. Commit and push to `main`
