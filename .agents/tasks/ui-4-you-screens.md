# Agent Task: Settings + Journal + Achievements + Insights + Remaining Screens

## MANDATORY FIRST STEP
1. Read `.agents/DESIGN_SYSTEM.md` FIRST.
2. Read `.agents/NAV_RULES.md` SECOND. The app uses Drawer navigation. Most screens get a system header. Use `useSafeAreaInsets()` for bottom padding on scrollable content.

## Context
You are rewriting all the "secondary" screens that get pushed from the Home screen or from other screens. There are **NO TABS** — everything is a stack screen. The old `profile.tsx` (which was a 900-line monster) is being replaced by a clean `settings.tsx` that only has settings. Profile stats now live on the home screen.

## Navigation Model
All screens are stack screens pushed via `router.push()`:
- `/settings` — pushed from gear icon on home
- `/journal` — pushed from FAB or journal prompt on home
- `/journal/[entryId]` — pushed from journal list
- `/achievements` — pushed from explore card on home
- `/insights` — pushed from explore card on home (was engine tab)
- `/alarms` — pushed from explore card on home
- `/weekly-review` — pushed from _layout auto-trigger or settings
- `/onboarding` — auto-pushed from _layout on first launch

## Stores Available (READ ONLY)
```typescript
import { useReflectorStore } from '@/store/useReflectorStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useAlarmStore } from '@/store/useAlarmStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { xpForLevel } from '@/types/models';
```

## What to Build

### FILE 1: `app/settings.tsx` — OVERWRITE

Clean, focused settings screen. NOT the old profile monster. The system header says "Settings" (from _layout.tsx).

**Layout:**

**1. Profile Summary** (compact, at top)
```
┌──────────────────────────────┐
│ Level 3 · 127/300 XP         │  ← level badge + XP progress
│ ████████████░░░ 42%          │  ← XP bar
│ 🌱 12-day streak             │
│ Member since March 2025      │
└──────────────────────────────┘
```

**2. Quick Links**
```
┌──────────────────────────────┐
│ 📖  Journal                › │  → /journal
│ 🏆  Achievements           › │  → /achievements
│ 📊  Insights               › │  → /insights
│ ⏰  Alarms                 › │  → /alarms
│ 🔄  Recurring Tasks        › │  → /recurring-tasks
│ 📅  Weekly Review           › │  → /weekly-review
└──────────────────────────────┘
```
Each row: Pressable, 56px height, surface1 bg or transparent with border-bottom.

**3. Notification Settings**
Section label: "NOTIFICATIONS"
- Notifications toggle (Switch)
- If enabled: Wake time picker, reminder offset (15/30/60/90 min), nudge interval, quiet hours
- Keep all existing notification logic from old profile.tsx

**4. Alarm Sound**
Section label: "ALARM SOUND"
- Current sound name
- Default / Pick Song toggle
- YouTube URL download (keep existing logic)
- Downloaded sounds list

**5. Data Management**
Section label: "DATA"
- Storage info ("Using 2.4 MB")
- Export Data button (ghost)
- Import Data button (ghost)
- Clear Old Tasks (ghost)
- Reset All Data (danger button — warmRed border, double confirmation)

**6. About**
- "The Reflector v1.0.0" (textDim, centered)
- "Built with intention." (textDim, centered)

### FILE 2: `app/journal/index.tsx` — OVERWRITE

Journal timeline screen. Header says "Journal" (from _layout).

**Layout:**
- FAB to create new entry (crimson, "+" icon)
- FlatList of journal entries, newest first
- Each entry card:
  ```
  ┌──────────────────────────────┐
  │ March 28, 2025               │  ← 12px, textDim
  │ 😌  Calm                     │  ← mood emoji + label
  │                              │
  │ "Today I realized that..."   │  ← 14px, first 100 chars, textSecondary
  │                              │
  │ 2 tags                       │  ← 11px, textDim
  └──────────────────────────────┘
  ```
  Card: surface1, 14px radius. Tap → `router.push(`/journal/${entry.id}`)`

- Empty state: "Your reflections live here. Start writing to capture your journey." + FAB

### FILE 3: `app/journal/[entryId].tsx` — OVERWRITE
Entry detail view. Restyle to match design system. Keep all logic.
- Show full entry text, mood, tags, date
- Edit/delete options

### FILE 4: `app/achievements.tsx` — OVERWRITE
Restyle:
- Use `COLORS.gold` accent for unlocked achievements (not crimson)
- Unlocked cards: gold left border, goldGlow background
- Locked cards: surface1 bg, textDim text
- Level display in gold
- Filter tabs: All / Unlocked / Locked (segmented control style)
- Keep all achievement checking logic

### FILE 5: `app/insights.tsx` — OVERWRITE
This was the engine tab. Now a stack screen.

**Layout:**
- Page content (header from _layout says "Insights")
- **Plain-English Insights** at the top (NEW):
  ```
  "You're on a 12-day streak. When you focus 30+ minutes, 
   you're 2x more likely to complete your routine."
  ```
  Generate 1-2 insights from `lib/unifiedEngine.ts` or `lib/correlationEngine.ts`
- Weekly Summary card (from existing engine)
- Heatmap calendar (from existing engine)
- Trend chart (from existing engine)
- Focus Insights: total minutes this week, session count (from useFocusStore)
- Journal Insights: entries this week, most common mood (from useJournalStore)

### FILE 6: `app/alarms.tsx` — OVERWRITE
Restyle alarm manager to match new design system. Keep all logic from useAlarmStore.

### FILE 7: `app/weekly-review.tsx` — OVERWRITE
Restyle to feel reflective and celebratory. Keep all logic.

### FILE 8: `app/onboarding.tsx` — OVERWRITE
Restyle to feel warm and inviting:
- Page 1: "Welcome to The Reflector." — warm, simple
- Page 2: Explain the 40-day grid gently ("Build discipline through consistency")
- Page 3: Explain reflection ("Write to understand yourself")
- Page 4: "Let's begin." — warm green button
- Normal case for body text. No aggressive caps.
- Keep swipe mechanics and dot indicators

### Components to OVERWRITE (restyle only — keep logic)
- `components/AchievementToast.tsx` — use gold accent
- `components/JournalCard.tsx` — soften styling
- `components/MoodPicker.tsx` — soften styling
- `components/DayPicker.tsx` — soften styling
- `components/EmptyState.tsx` — warm, encouraging
- `components/LevelBadge.tsx` — use gold accent
- `components/StreakCounter.tsx` — soften

## DO NOT MODIFY
- `store/*`, `lib/*`, `app/_layout.tsx`, `constants/theme.ts`
- `app/index.tsx` (home — another agent)
- `app/forge.tsx`, `app/focus.tsx` (other agents)
- `app/flow/[gridId].tsx`, `app/fire.tsx`, `app/routine/[routineId].tsx`, `app/recurring-tasks.tsx` (other agent)
- `app/alarm.tsx` (the alarm trigger screen — keep as is)

## Verification
1. `npx tsc --noEmit` — zero errors
2. Settings shows clean profile summary + all settings
3. Journal timeline with entry cards
4. Achievements use gold accent
5. Insights show plain-English insights at top
6. Onboarding feels warm and inviting
7. All navigation (push/back) works correctly
