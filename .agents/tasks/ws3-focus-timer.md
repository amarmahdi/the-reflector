# Agent Task: Focus Timer & Deep Work Mode

## Context
You are working on **The Reflector**, an Expo/React Native discipline-tracking app. You are ONE of 8 agents working in parallel. You MUST only create/modify files listed below.

## Design System (MANDATORY)
- **Styling**: `styled-components/native` — NEVER use `StyleSheet.create`
- **Colors**: Import `{ COLORS }` from `@/constants/theme`
  - Backgrounds: `surface0` (#0D0D0D), `surface1` (#141414), `surface2` (#1C1C1C)
  - Accent: `crimson` (#1A6B3C — it's dark green despite the name)
  - Text: `textPrimary` (#F0EDE8), `textSecondary` (#8A8580), `textDim` (#4A4845)
  - Borders: `border` (#2A2A2A)
- **Typography**: ALL headers/labels UPPERCASE. font-weight 900 for headings, 700 for labels. Letter-spacing 2-4px.
- **Haptics**: Import `{ haptic }` from `@/lib/haptics` — use `haptic.heavy()` on start, `haptic.success()` on timer complete
- **Animations**: Use `react-native-reanimated` for timer animations
- **Dark theme only**

## What Already Exists (DO NOT MODIFY)
- `store/useFocusStore.ts` — Has `focusSessions`, `addFocusSession`, `getTodayFocusMinutes`, `getWeekFocusMinutes`, `getTodaySessions`, `getTodayCompletedCount`, `getStreakDays`
- `types/models.ts` — Has `FocusSession`, `FocusSessionType`, `FOCUS_PRESETS`
- `store/useReflectorStore.ts` — DO NOT TOUCH
- `app/(tabs)/_layout.tsx` — DO NOT TOUCH (another agent handles tab registration)

## Files to CREATE

### 1. `app/(tabs)/focus.tsx` — Focus Timer Tab Screen

This is a NEW tab screen. Create it at `app/(tabs)/focus.tsx`.

**Layout (top to bottom):**

**A. Page Header:**
- Label: "DEEP WORK MODE"
- Title: "THE FOCUS" with accent on "FOCUS"
- Same header style as other tabs (see forge.tsx, engine.tsx for reference)

**B. Session Type Selector:**
- Row of 4 pressable preset buttons: Pomodoro (25m), Deep Work (50m), Flow State (90m), Custom
- Use `FOCUS_PRESETS` from models for labels/icons
- Selected preset has `crimson` border and `crimsonGlow` background
- For Custom: show a time input when selected (minute picker using +/- buttons, range 1-180)

**C. Circular Timer Display (centerpiece):**
- Large circular progress indicator (use the `CircularTimer` component)
- Inside circle: remaining time in MM:SS format (large, weight 900)
- Below time: session type label
- Diameter: ~250px

**D. Control Buttons:**
- Row of 3 buttons centered below timer:
  - START (primary crimson button, switches to PAUSE when running)
  - RESET (ghost/outline button)
- When timer is paused: show RESUME + RESET
- When timer completes: show "SESSION COMPLETE" message + START NEW button

**E. Today's Stats Card:**
- Card with `surface1` background showing:
  - Sessions completed today (number)
  - Total focused minutes today
  - Focus streak (days)
- Use `useFocusStore` getters

**Timer Logic:**
- Use `useRef` for interval ID
- Update every 1000ms
- When timer reaches 0:
  - Call `haptic.success()`
  - Record session via `addFocusSession()`
  - Show completion state
  - Play short vibration pattern: `Vibration.vibrate([0, 500, 200, 500])`
- When user manually stops early:
  - Record with `completed: false` and `actualDuration` = elapsed time
- Keep screen awake during timer (use `expo-keep-awake` if available, otherwise skip)

### 2. `components/CircularTimer.tsx` — Animated Circular Progress

**Requirements:**
- Circular progress ring using `react-native-reanimated` animated styles
- Props:
  ```typescript
  interface CircularTimerProps {
    progress: number;       // 0 to 1 (percentage remaining)
    size: number;           // diameter in px
    strokeWidth?: number;   // default 8
    children?: React.ReactNode; // content inside circle
  }
  ```
- Draw using 2 concentric circles:
  - Background ring: `border` color (#2A2A2A)
  - Progress ring: `crimson` color, animated rotation via `transform` + `overflow: hidden` clipping technique
  - OR use SVG if `react-native-svg` is available (it IS in the project via reanimated)
- Actually, simplest approach: Use a technique with 2 half-circles and rotation:
  ```
  - Container (circular, overflow hidden)
  - Right half (rotating from 0 to 180deg for 0-50%)
  - Left half (rotating for 50-100%)
  ```
- Pulse animation on completion (scale 1.0 → 1.05 → 1.0, repeat 3 times)
- Smooth animated transition when progress changes

### 3. `components/FocusStats.tsx` — Focus Statistics Card

**Requirements:**
- Reusable card showing focus metrics
- Props: none (reads directly from `useFocusStore`)
- 3-column stat display: SESSIONS | MINUTES | STREAK
- Each column: large number (weight 900) + small label below
- `surface1` background, `border` border, 8px border radius
- Animate numbers counting up on mount (use `react-native-reanimated` interpolation)

## Implementation Notes

- The focus tab will be registered in the tab navigator by another agent. Your file just needs to exist at `app/(tabs)/focus.tsx` and export a default React component.
- For the timer interval, use `useEffect` cleanup to prevent memory leaks:
  ```typescript
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(id);
          handleTimerComplete();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);
  ```
- Format time helper:
  ```typescript
  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  ```

## Verification
1. Run `npx expo start` — no TypeScript errors
2. Focus tab screen renders (even if not yet in tab bar, navigable directly)
3. Select a preset → timer shows correct duration
4. Start timer → counts down smoothly
5. Complete timer → haptic feedback + session recorded
6. Stats card shows accurate numbers from store
