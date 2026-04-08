# Agent Task: Today Screen Redesign

## Context
You are working on **The Reflector**, an Expo/React Native discipline-tracking app. You are ONE of 8 parallel agents. Only create/modify files listed below.

## Design System
- `styled-components/native` — no `StyleSheet.create`
- Colors: `import { COLORS } from '@/constants/theme'` — surface0 (#0D0D0D), surface1 (#141414), surface2 (#1C1C1C), crimson (#1A6B3C), textPrimary (#F0EDE8), textSecondary (#8A8580), textDim (#4A4845), border (#2A2A2A), crimsonGlow (rgba(26,107,60,0.18))
- ALL headers UPPERCASE, weight 900, letter-spacing 2-4px
- Haptics: `import { haptic } from '@/lib/haptics'`
- Dark theme only

## DO NOT MODIFY
- `store/useReflectorStore.ts`, any store files, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, other tab files, `app/_layout.tsx`

## Files to CREATE

### 1. `components/GreetingHero.tsx` — Time-Aware Greeting Card
Greeting based on time of day:
- Before 12:00 → "GOOD MORNING"
- 12:00-17:00 → "GOOD AFTERNOON"
- 17:00-21:00 → "GOOD EVENING"
- After 21:00 → "WIND DOWN"

Props: `streakCount: number`

**Requirements:**
- Large greeting text (22px, weight 900, letter-spacing 3px)
- Below: date in format "WEDNESDAY · APRIL 2, 2026"
- Below: streak display — fire emoji + "X DAY STREAK" in crimson (only if streakCount > 0)
- Bottom: rotating motivational quote (pick randomly from hardcoded list of 30+ discipline quotes)
- Quote in textSecondary, italic, 12px, with quotation marks
- Padded section: 20px horizontal, 24px vertical
- Border bottom: 1px border color

Quote examples to include:
```
"Discipline is choosing between what you want now and what you want most."
"The pain of discipline weighs ounces. The pain of regret weighs tons."
"We are what we repeatedly do. Excellence is not an act, but a habit."
"You don't rise to the level of your goals. You fall to the level of your systems."
"Hard choices, easy life. Easy choices, hard life."
```
Include at least 30 quotes.

### 2. `components/RoutineStrip.tsx` — Horizontal Routine Progress Cards
Horizontal scroll strip showing active routine cards.

Props: none (reads from `useReflectorStore`)

**Requirements:**
- Horizontal `<ScrollView>` with `showsHorizontalScrollIndicator={false}`
- Each card: `surface1` background, 120px width, 100px height, 8px border-radius
- Card content: routine name (10px, weight 900, 2 lines max), "DAY X/40" label, mini progress bar (3px height, crimson fill)
- Card has 1px border, border color
- Gap between cards: 10px
- Padding: 20px horizontal on container
- `onPress` → navigate to `/flow/[gridId]`
- If today's day is completed, show a small green checkmark badge on the card
- If no active routines: don't render this component at all

## Files to MODIFY

### 3. `app/(tabs)/today.tsx` — Redesign the Today Screen

Keep ALL existing functionality but reorganize the layout. Keep all existing styled components that you still need; remove unused ones.

**New layout order (top to bottom in ScrollView):**

1. **GreetingHero** component (replaces the old DateHeader + AppName section)
2. **RoutineStrip** component (new, replaces the old "ROUTINES TODAY" section)
3. **SummaryCard** (KEEP existing, but move it here — shows routines/complete/tasks done counts)
4. **Time Block Sections** (KEEP existing morning/afternoon/evening sections with todo items)
5. **FAB** (KEEP existing floating action button for adding tasks)
6. **Add Task Modal** (KEEP existing modal — it works well)

**Additional enhancements:**
- Add `haptic.light()` when toggling a todo
- Add `haptic.light()` when removing a todo (long press)
- Add swipe-to-delete on todo items using `react-native-gesture-handler`:
  - Swipe left reveals red "DELETE" background
  - Full swipe deletes the item with `haptic.warning()`
  - Use `Gesture.Pan()` similar to existing `SwipeableGridCell.tsx`

**Import changes:**
- Add: `import GreetingHero from '@/components/GreetingHero'`
- Add: `import RoutineStrip from '@/components/RoutineStrip'`
- Add: `import { haptic } from '@/lib/haptics'`
- Keep all existing imports that are still used

**Remove the old DateHeader/AppName rendering** and replace with `<GreetingHero streakCount={0} />` (streak will be wired by gamification agent later, use 0 for now).

**Remove the old "ROUTINES TODAY" section** and replace with `<RoutineStrip />`.

## Verification
1. `npx expo start` — no TS errors
2. Today tab shows greeting based on time of day
3. Motivational quote displays (different on each app open)
4. Routine strip scrolls horizontally, cards navigate to flow
5. Summary card and time block sections still work correctly
6. FAB + add modal still work
7. Todo toggle has haptic feedback
