# Agent S3 — Fire Screen Hostage Mode Complete

## What Was Done

### `mobile/app/fire.tsx` — Visual Overhaul

All existing logic (markDayScarred, journal auto-create, consequence engine, hard reset check) preserved exactly. Only visuals were changed.

#### Background
- Base background: `#0D0505` (deep blood-red darkness)
- Pulsing red vignette overlay: `rgba(80, 10, 10, 0.3)`, opacity pulses 0.15–0.35 over 3 seconds
- Uses `withRepeat` + `withSequence` for continuous pulse

#### On Mount
- `haptic.warning()` fires immediately
- `haptic.error()` fires after 500ms — double-pulse weight effect
- Content fades in over 800ms via reanimated

#### Pact Confrontation Card (aggressive)
- Border: `COLORS.gold` → `COLORS.warmRed` (1.5px)
- Background: `rgba(139, 74, 74, 0.08)` subtle red glow
- Padding increased to 20px (`SPACING.xl`)
- Pact text size: 15px → 17px with 24px line-height
- Title color: `COLORS.gold` → `COLORS.warmRed`
- Confrontation text: "Are you abandoning your word?" (16px → bold, subtitle size)

#### Reflection Input
- Min height: 120px → 160px
- Border: `rgba(139, 74, 74, 0.3)` (red tint)

#### Submit Button (custom, not PrimaryButton)
- Background: `COLORS.warmRed`
- When disabled: dim, no glow
- When enabled: pulsing `warmRed` shadow (shadowOpacity 0.4, radius 14)
- On press: `haptic.error()` fires, button text changes to "Scarred." for 1 second before proceeding
- Replaced PrimaryButton with custom Pressable to support "Scarred." text state

#### Consequence Card Animation
- Slides up from 120px below with `withSpring` (damping: 12, stiffness: 100) — bouncy overshoot
- Fades in simultaneously over 400ms
- `haptic.error()` fires on appear

#### Counter
- Text: `{n} of {n} reflections` → `Wound {n} of {n}`
- Color: `COLORS.textDim` → `COLORS.warmRed`
- Weight: medium → bold with letter-spacing

#### XP Penalty
- Font size: caption (12px) → 20px large and bold (`TYPOGRAPHY.black`)

## Verification
- `npx tsc --noEmit` — **0 errors**

## Files Modified
- `mobile/app/fire.tsx` (visual overhaul only)
