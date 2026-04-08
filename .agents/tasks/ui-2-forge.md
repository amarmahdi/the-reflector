# Agent Task: Forge + Grid Flow + Fire Screen — Complete UI/UX Rewrite

## MANDATORY FIRST STEP
1. Read `.agents/DESIGN_SYSTEM.md` FIRST.
2. Read `.agents/NAV_RULES.md` SECOND. The app uses Drawer navigation. All screens get a system header from the Drawer layout. Use `useSafeAreaInsets()` for bottom padding on scrollable content.

## Context
You are rewriting the Forge, Grid Flow, and Fire screens. There are **NO TABS** — all screens are stack screens pushed from the home via `router.push('/forge')`. The back button returns to the previous screen.

## Navigation Model
- Forge is `app/forge.tsx` pushed from home
- Grid Flow is `app/flow/[gridId].tsx` pushed from home or forge
- Fire is `app/fire.tsx` — full-screen modal (auto-opened by _layout on missed days)
- Routine editor is `app/routine/[routineId].tsx`
- Recurring tasks is `app/recurring-tasks.tsx`
- Navigate with: `router.push()`, `router.back()`

## Stores Available (READ ONLY)
```typescript
import { useReflectorStore } from '@/store/useReflectorStore';
// Has: routines, grids, addRoutine, startGrid, deleteRoutine, editRoutine, markDayCompleted, failGrid
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { onDayCompleted, onGridCompleted, onGridFailed } from '@/lib/appActions';
```

## What to Build

### FILE 1: `app/forge.tsx` — OVERWRITE — Routine Dashboard

**Page Header (inline, no system header — headerShown: true is set in _layout but you can customize)**
Use the default header from _layout (title: "The Forge"). Just build the content.

**Layout:**

**1. Active Grids Section**
Section label: "ACTIVE" (10px, weight 600, letter-spacing 2px, UPPERCASE, textDim)
For each active grid, show a card:
```
┌──────────────────────────────┐
│ Morning Workout              │  ← 15px, weight 600
│ Day 12 of 40 · 30%          │  ← 13px, textSecondary
│ ████████░░░░░░░ 30%         │  ← green progress bar
│                              │
│ 3 scars · Started Mar 21    │  ← 11px, textDim
│ Hard Reset: ON               │  ← if enabled, warmRed text
└──────────────────────────────┘
```
Tap card → `router.push(`/flow/${gridId}`)`.
Card: surface1, 14px radius, 16px padding, 12px gap between cards.

If no active grids: "No active disciplines. Create a routine and start your journey."

**2. Your Routines Section**
Section label: "YOUR ROUTINES"
For each routine:
```
┌──────────────────────────────┐
│ 📖 Reading                   │  ← 15px, weight 600
│ 3 sub-tasks                  │  ← 12px, textSecondary
│                              │
│ [Start Grid]  [Edit]         │  ← buttons
└──────────────────────────────┘
```
- "Start Grid" → Alert asking if hard reset should be enabled (yes/no) → `startGrid(routineId, hardReset)`
- "Edit" → `router.push(`/routine/${routineId}`)`
- If routine already has an active grid, show "In Progress" badge instead of "Start Grid"

**3. Create New Routine Section**
Card with input:
```
┌──────────────────────────────┐
│ Create a New Routine         │  ← 15px, weight 600
│                              │
│ [ Routine title...       ]   │  ← TextInput, surface2 bg
│                              │
│ Sub-tasks:                   │
│ [ Sub-task 1...          ] ✕ │
│ [ Sub-task 2...          ] ✕ │
│ [ + Add sub-task ]           │  ← text button
│                              │
│ [ Create Routine ]           │  ← Primary crimson button
└──────────────────────────────┘
```

**4. History Section** (collapsible)
Section label: "HISTORY"  
Tap to expand/collapse. Show completed and failed grids:
- Each: routine name, date range, completion %, status badge
- status "Completed ✓" in crimson, "Failed ✕" in warmRed

### FILE 2: `app/flow/[gridId].tsx` — OVERWRITE — Grid Day View

Restyle to match new design system. Keep ALL logic:
- `markDayCompleted`, `onDayCompleted`, `onGridCompleted`
- The 5×8 grid visualization
- Day detail expansion
- Scar indicators

Style changes:
- Card backgrounds: surface1
- Border radius: 14px
- Typography per design system (Title Case headers, not all caps)
- Grid cells: softer borders (COLORS.border), completed cells in crimson bg with white number
- Section labels: 10px uppercase

### FILE 3: `app/fire.tsx` — OVERWRITE — Scar Reflection

Restyle to feel **solemn and meditative**, not angry:
- Dark full screen
- Title: "A day was missed." (20px, weight 700, normal case — NOT aggressive)
- Subtitle explaining what happened (14px, textSecondary)
- Reflection input with generous height (120px min)
- "I understand" submit button (crimson, calm)
- Keep all logic: writing reflection, creating journal entry, calling `onJournalEntryCreated()`

### FILE 4: `app/routine/[routineId].tsx` — OVERWRITE
Restyle to match new design system. Keep all edit logic.

### FILE 5: `app/recurring-tasks.tsx` — OVERWRITE
Restyle to match new design system. Keep all logic for managing recurring task templates.

## DO NOT MODIFY
- `store/*`, `lib/*`, `app/_layout.tsx`, `constants/theme.ts`
- `app/index.tsx` (home screen — another agent)
- `app/focus.tsx`, `app/settings.tsx`, `app/insights.tsx`
- `app/journal/*`, `app/achievements.tsx`, `app/alarms.tsx`

## Verification
1. `npx tsc --noEmit` — zero errors
2. Forge shows active grids + routine list + create form
3. Can create new routines with sub-tasks
4. Can start new grids with hard reset option
5. Grid flow screen shows 5×8 grid, can complete days
6. Fire screen feels calm and reflective
7. History shows completed/failed grids
