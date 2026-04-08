# Agent Task: Onboarding & UX Polish

## Context
You are working on **The Reflector**, an Expo/React Native discipline-tracking app (Expo 54, React Native 0.81). You are ONE of 8 parallel agents. Only create/modify files listed below.

## Design System
- `styled-components/native` only — no `StyleSheet.create`
- Colors: `import { COLORS } from '@/constants/theme'` — surface0 (#0D0D0D), surface1 (#141414), crimson (#1A6B3C green accent), textPrimary (#F0EDE8), textDim (#4A4845), border (#2A2A2A)
- ALL headers UPPERCASE, weight 900, letter-spacing 2-4px
- Haptics: `import { haptic } from '@/lib/haptics'`
- Animations: `react-native-reanimated`
- Dark theme only

## DO NOT MODIFY
- `store/useReflectorStore.ts`, `store/useGamificationStore.ts`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/today.tsx`, `app/(tabs)/engine.tsx`, `app/(tabs)/settings.tsx`

## Files to CREATE

### 1. `app/onboarding.tsx` — First-Launch Onboarding
4 swipeable pages using horizontal `ScrollView` with `pagingEnabled`:
- **Page 1**: "THE REFLECTOR" title (REFLECTOR in crimson), subtitle "DISCIPLINE IS BUILT. NOT FOUND.", fade-in animations
- **Page 2**: "THE 40-DAY GRID" — decorative mini 5x8 grid, explain grid + scar system
- **Page 3**: "FACE YOUR FAILURES" — explain reflection lock, pulsing "FACE IT." text
- **Page 4**: "READY?" — "LET'S BEGIN" button → `setOnboarded()` + navigate to tabs

Include: SKIP button top-right, 4 dot indicators, slide transitions. Import `useGamificationStore` for `setOnboarded`.

### 2. `components/EmptyState.tsx` — Reusable Empty State
Props: `icon: string, title: string, subtitle: string, ctaLabel?: string, onCta?: () => void, accentWord?: string`. Centered layout, animated entrance (fade + translateY), optional CTA button.

### 3. `components/AnimatedCounter.tsx` — Animated Number
Props: `value: number, duration?: number, suffix?: string, prefix?: string, style?: TextStyle`. Counts from 0→value on mount using reanimated. Re-animates on value change.

## Files to MODIFY

### 4. `app/_layout.tsx` — Add onboarding check + new stack screens
- Import `useGamificationStore`, check `hasOnboarded`, redirect to `/onboarding` if false
- Add Stack.Screen entries: `onboarding` (fullScreenModal), `journal/index`, `journal/[entryId]`, `achievements`, `routine/[routineId]`, `recurring-tasks`, `weekly-review`
- Keep ALL existing screens unchanged, add new ones before closing `</Stack>`

### 5. `app/(tabs)/forge.tsx` — Add haptics
Import `{ haptic } from '@/lib/haptics'`. Add: `haptic.light()` in handleAddSubTask, `haptic.heavy()` in handleStartGrid, `haptic.selection()` in toggleCore.

### 6. `app/flow/[gridId].tsx` — Add haptics
Import haptic. Add: `haptic.light()` on subtask toggle, `haptic.success()` in handleMarkComplete, `haptic.selection()` on recalibrate toggle.

## Verification
1. `npx expo start` — no TS errors
2. Fresh install → onboarding appears, swipe through pages, "LET'S BEGIN" works
3. Haptics fire on forge/flow interactions
