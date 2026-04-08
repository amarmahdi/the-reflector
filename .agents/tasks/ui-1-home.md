# Agent Task: Home Screen + Floating Action Button

## MANDATORY FIRST STEP
1. Read `.agents/DESIGN_SYSTEM.md` FIRST.
2. Read `.agents/NAV_RULES.md` SECOND. The app uses **Drawer navigation** — NOT tabs, NOT stack headers.
3. The Home screen has NO system header. You MUST use `SafeAreaView` from `react-native-safe-area-context` and handle the top bar yourself (hamburger menu left, profile icon right).

## Context
You are writing `app/index.tsx` — the **Home screen** of The Reflector app. This is the ONLY main screen. There are NO tabs. The entire app navigates from this home via stack pushes. This screen must feel calm, intentional, and answer: "What should I do right now?"

The old tab-based architecture is **gone**. All screens are now stack screens pushed from here via `router.push()`.

## Navigation Model
- Home is `app/index.tsx` — the root screen
- All other screens push as stack: `/forge`, `/focus`, `/journal`, `/insights`, `/achievements`, `/alarms`, `/settings`, `/weekly-review`, `/recurring-tasks`
- Navigate with: `router.push('/forge')`, `router.push('/focus')`, etc.
- Back button returns to home automatically (stack navigation)

## Stores Available (READ ONLY — do not modify store files)
```typescript
import { useReflectorStore } from '@/store/useReflectorStore';
// Has: routines, grids, dailyTodos, dailyCheckIns, toggleTodo, removeTodo, addTodo, markDayCompleted
import { useGamificationStore } from '@/store/useGamificationStore';
// Has: userStats (level, totalXP, currentStreak, longestEverStreak, totalDaysCompleted, etc.), hasOnboarded
import { useFocusStore } from '@/store/useFocusStore';
// Has: sessions, getTodayFocusMinutes(), getTodaySessions()
import { useJournalStore } from '@/store/useJournalStore';
// Has: entries
```

## Helpers Available
```typescript
import { onTaskCompleted, onDayCompleted, calculateCurrentStreak } from '@/lib/appActions';
import { haptic } from '@/lib/haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { useRouter } from 'expo-router';
```

## What to Build — `app/index.tsx`

### Layout (top to bottom in ScrollView):

**1. Top Bar** (not a header — inline)
- Left: ⚙️ gear icon → `router.push('/settings')`
- Right: current time or nothing
- Subtle, just icons, no background

**2. Greeting Section**
- Time-based: "Good morning." / "Good afternoon." / "Good evening." (22px, weight 700, Title Case)
- Date: "Wednesday · April 2" (14px, textSecondary)
- If streak > 0: "🌱 12-day streak" (12px, crimson color, subtle)
- Calculate streak using `calculateCurrentStreak(grids)` or `userStats.currentStreak`
- A rotating motivational quote (12px, italic, textDim) — hardcode 10-15 spiritual/discipline quotes

**3. "Your Focus" Hero Card** (most important — the action card)
Shows the most urgent active grid (lowest completion percentage).
```
┌──────────────────────────────────┐
│ YOUR FOCUS                       │  ← 10px section label
│                                  │
│ Morning Workout                  │  ← 16px, weight 600
│ Day 12 of 40                     │  ← 13px, textSecondary
│                                  │
│ ████████████░░░░░░░  30%         │  ← progress bar, crimson fill
│                                  │
│ [ Complete Today ✓ ]             │  ← Primary green button
└──────────────────────────────────┘
```
- Card: COLORS.surface1 bg, 14px radius, 20px padding
- Button calls `markDayCompleted(gridId, todayDayIndex)` then `onDayCompleted(gridId, todayDayIndex)`
- Find today's dayIndex by comparing `new Date().setHours(0,0,0,0)` against `grid.days[].date`
- After completing, show a brief "+5 XP" floating text animation (simple Animated.View that fades out)
- When tapped, use `haptic.success()`

If **no active grids**, instead show:
```
┌──────────────────────────────────┐
│ Ready to begin?                  │
│ Create your first routine in     │
│ The Forge to start your          │
│ 40-day journey.                  │
│                                  │
│ [ Go to The Forge → ]           │  ← router.push('/forge')
└──────────────────────────────────┘
```

**4. Other Active Routines** (horizontal FlatList, only if 2+ active grids)
For each active grid (excluding the hero one), show a compact card:
- 120px wide, surface1 bg, 14px radius
- Routine title (13px, weight 600)
- "8/40" progress text
- Mini progress bar
- Tap → `router.push('/flow/${gridId}')`

**5. Today's Tasks Section**
Section label: "TODAY'S TASKS" (10px, weight 600, uppercase, textDim, letter-spacing 2px)
Show tasks as a flat list. Each task row:
- Left: circle (empty = pending, filled green = done)
- Middle: task title (14px, normal case; strikethrough + textDim if completed)
- Right: time block emoji (☀️ morning, 🌅 afternoon, 🌙 evening)
- Tap circle → `toggleTodo(id)` + `onTaskCompleted()` (only when completing)
- Long press → confirm delete alert → `removeTodo(id)`

Below the list: "+ Add a task" text (13px, crimson) that when tapped shows an inline input:
- TextInput + row of 3 time block buttons (☀️🌅🌙) + "Add" button
- No full-screen modal — keep it inline and lightweight
- On add: call `addTodo(title, timeBlock, ...)`

If no tasks: "No tasks for today. Tap + to add one." (14px, textSecondary, encouraging)

**6. Journal Prompt** (only show after 5 PM local time)
```
┌──────────────────────────────────┐
│ 💭 How was your day?             │  ← 15px
│ Take a moment to reflect.        │  ← 13px, textSecondary
│                                  │
│ [ Open Journal → ]              │  ← ghost button, router.push('/journal')
└──────────────────────────────────┘
```

**7. Explore Section** (2×2 grid of tappable cards)
```
┌──────────┐  ┌──────────┐
│ 🔥 The   │  │ 📊 Your  │
│   Forge   │  │ Insights │
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│ 🏆 Achie-│  │ ⏰ Your  │
│ vements  │  │  Alarms  │
└──────────┘  └──────────┘
```
Each card: surface1 bg, 14px radius, 80px height. Centered icon + label.
- The Forge → `router.push('/forge')`
- Your Insights → `router.push('/insights')`
- Achievements → `router.push('/achievements')`
- Your Alarms → `router.push('/alarms')`

**8. Mini Stats Footer** (bottom of scroll)
```
LVL 3  ·  127 XP  ·  45 min focused today
```
- Horizontal row, centered, textDim, 11px
- Pull from `userStats.level`, `userStats.totalXP`, `getTodayFocusMinutes()`

### Floating Action Button (FAB)

Position: bottom-center, 24px from bottom, above everything.
Appearance: 56px circle, crimson bg, white "+" icon, subtle green glow shadow.

**Tap behavior:** FAB expands into 3 options (fan out upward):
```
        🧘 Focus
      ✏️ Journal
    + Task
        ◉ (FAB becomes ✕ to close)
```
- Background dims to rgba(0,0,0,0.5) overlay
- Each option: small pill with icon + label
- 🧘 Focus → `router.push('/focus')`
- ✏️ Journal → `router.push('/journal')`
- + Task → close FAB + scroll to task section + focus the inline task input
- Tap overlay or ✕ → close

Use `react-native-reanimated` for the expand/collapse animation:
- Spring animation, damping 15, stiffness 120
- Each option translates up from FAB position with staggered timing

### Components
DO NOT create separate component files. Keep everything INLINE in `index.tsx`. The home screen is self-contained. Only import from stores, libs, and theme.

Exception: You may create `components/FAB.tsx` if the FAB logic is complex enough to warrant it (>100 lines). If so, export `FAB` and `FABProvider`.

## Files to CREATE/OVERWRITE
- `app/index.tsx` — **OVERWRITE** with complete new Home screen

## DO NOT MODIFY
- `store/*` — all stores are read-only
- `lib/*` — all libs are read-only
- `app/_layout.tsx` — already updated
- Any other `app/*.tsx` files
- `constants/theme.ts` — already updated, just import from it

## Verification
1. `npx tsc --noEmit` — zero errors
2. Home screen renders with greeting, focus card, tasks, explore grid
3. "Complete Today" button works and awards XP
4. Task toggle works (tap circle)
5. FAB expands with 3 options
6. All explore cards navigate to correct screens
7. Empty states are warm and guiding
8. Gear icon opens settings
