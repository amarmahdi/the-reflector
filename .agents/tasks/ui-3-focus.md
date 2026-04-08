# Agent Task: Focus Timer — Complete UI/UX Rewrite

## MANDATORY FIRST STEP
1. Read `.agents/DESIGN_SYSTEM.md` FIRST.
2. Read `.agents/NAV_RULES.md` SECOND. The app uses Drawer navigation. The Focus screen has `headerShown: false` — you MUST use `SafeAreaView` from `react-native-safe-area-context` and handle your own back button.

## Context
You are rewriting `app/focus.tsx` — the **Focus Timer**. It is a **stack screen** pushed from the home FAB or explore card via `router.push('/focus')`. There are NO TABS. headerShown is false so you handle your own header/back button.

## Navigation
- Focus is pushed from home: `router.push('/focus')`
- Back: `router.back()` or use a custom back button in your header
- No tabs — this is a full-screen immersive experience

## Stores Available (READ ONLY)
```typescript
import { useFocusStore } from '@/store/useFocusStore';
// Has: sessions, addFocusSession, getTodayFocusMinutes(), getTodaySessions()
import { useReflectorStore } from '@/store/useReflectorStore';
// Has: routines, grids (for "what are you focusing on?" selector)
import { COLORS, TYPOGRAPHY } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { onFocusSessionCompleted } from '@/lib/appActions';
import { FOCUS_PRESETS, FocusSessionType } from '@/types/models';
```

## What to Build — `app/focus.tsx` — OVERWRITE

### Layout:

**1. Custom Header Bar**
Since headerShown is false for this screen, create your own:
- Left: "←" back button (Pressable, 44px touch target) → `router.back()`
- Center: "Focus" (16px, weight 700)
- Background: transparent (overlays the content)

**2. "What are you working on?" — Context Selector**
Before starting, let user pick what they're focusing on:
```
What are you working on?

┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Work │ │ Read │ │ Med  │ │ Free │
│  out │ │ ing  │ │      │ │Focus │
└──────┘ └──────┘ └──────┘ └──────┘
```
- Horizontal scroll of chips
- Show active routine names from `useReflectorStore`
- Last chip: "Free Focus" (default, no linked routine)
- Selected chip: crimsonGlow bg, crimson border
- This selection is stored in component state (not persisted beyond the session)
- Optional — user can ignore and just start

**3. Session Type Selector**
Row of 4 preset buttons:
- 🍅 Pomodoro (25min)
- 🧠 Deep Work (50min)
- 🌊 Flow (90min)
- ⚡ Custom

Styled as cards: surface1 bg, 14px radius. Selected: crimson border + crimsonGlow bg.
If Custom selected + idle: show +/- stepper for minutes (keep existing logic).

**4. Timer Display — Centered, Immersive**
Use `components/CircularTimer.tsx` (you will restyle it):
- Large ring (250px) with arc showing remaining time
- Arc color: `COLORS.softBlue` (#4A7B9D) — differentiate focus from the green accent
- Stroke width: 6px
- Track: surface2 color
- Time inside ring: 48px, weight 900 (stats are the ONE place we use 900)
- Below time: session type name (12px, textSecondary)

**5. Controls**
Center horizontally below the timer:
- **Idle:** `[START]` — primary crimson button, large (padding 18px 48px), 14px radius
- **Running:** `[PAUSE]` (crimson) + `[RESET]` (ghost border)
- **Paused:** `[RESUME]` (crimson) + `[RESET]` (ghost)
- **Complete:** "Session complete 🌱" text (crimson, 14px) + `[Start Another]` button

On complete:
- `haptic.success()`
- Vibration pattern: `[0, 500, 200, 500]`
- Call `addFocusSession(...)` then `onFocusSessionCompleted(session)`
- Show subtle "+X XP" floating text

**6. Today's Sessions** (below controls, scrollable)
Section label: "TODAY'S SESSIONS"
```
┌──────────────────────────────┐
│ 🍅 Pomodoro      25 min  ✓  │  ← completed
│ 🧠 Deep Work     50 min  ✓  │
│ ⚡ Custom        15 min  ✕  │  ← cancelled (textDim, strikethrough)
├──────────────────────────────┤
│ 3 sessions · 75 min total   │
└──────────────────────────────┘
```

### Components to OVERWRITE

**`components/CircularTimer.tsx`** — Restyle:
- Arc color: `COLORS.softBlue` instead of crimson
- Track color: `COLORS.surface2`
- Stroke width: 6px (thinner, more elegant)
- When complete: subtle pulse glow animation
- Keep ring size configurable via props

**`components/FocusStats.tsx`** — Restyle to match new design system. Same data, softer look.

## Files to OVERWRITE
- `app/focus.tsx`
- `components/CircularTimer.tsx`
- `components/FocusStats.tsx`

## DO NOT MODIFY
- `store/*`, `lib/*`, `app/_layout.tsx`, `constants/theme.ts`
- `app/index.tsx`, `app/forge.tsx`, `app/settings.tsx`, `app/insights.tsx`

## Verification
1. `npx tsc --noEmit` — zero errors
2. Back button returns to home
3. Can select what you're focusing on
4. Timer works: start, pause, resume, reset, complete
5. On complete: XP is awarded (via onFocusSessionCompleted)
6. Timer arc uses softBlue color
7. Today's sessions list shows completed and cancelled
