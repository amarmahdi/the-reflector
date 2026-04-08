# Agent Task: Gamification & Achievements System

## Context
You are working on **The Reflector**, an Expo/React Native discipline-tracking app. You are ONE of 8 agents working in parallel. You MUST only create/modify files listed below.

## Design System (MANDATORY)
- **Styling**: `styled-components/native` — NEVER use `StyleSheet.create`
- **Colors**: Import `{ COLORS }` from `@/constants/theme`
  - Backgrounds: `surface0` (#0D0D0D), `surface1` (#141414), `surface2` (#1C1C1C)
  - Accent: `crimson` (#1A6B3C — it's dark green despite the name)
  - Text: `textPrimary` (#F0EDE8), `textSecondary` (#8A8580), `textDim` (#4A4845)
  - Borders: `border` (#2A2A2A)
  - `crimsonGlow`: rgba(26,107,60,0.18), `crimsonDim`: #0F3D22
- **Typography**: ALL headers/labels UPPERCASE. font-weight 900 for headings, 700 for labels. Letter-spacing 2-4px.
- **Haptics**: Import `{ haptic }` from `@/lib/haptics`
- **Animations**: Use `react-native-reanimated` extensively for achievement unlocks, XP animations
- **Dark theme only**

## What Already Exists (DO NOT MODIFY)
- `store/useGamificationStore.ts` — Has `userStats`, `achievements`, `hasOnboarded`, `addXP`, `unlockAchievement`, `isAchievementUnlocked`, `registerAchievements`, `updateStats`, `incrementStat`, `updateStreak`, `setOnboarded`
- `types/models.ts` — Has `Achievement`, `UserStats`, `AchievementCategory`, `DEFAULT_USER_STATS`, `xpForLevel`
- `store/useReflectorStore.ts` — DO NOT TOUCH
- `app/(tabs)/_layout.tsx` — DO NOT TOUCH

## Files to CREATE

### 1. `lib/achievements.ts` — Achievement Definitions & Checker

**Define 20+ achievements across all categories:**

```typescript
import type { Achievement } from '@/types/models';

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  // STREAKS
  { id: 'first-blood', title: 'FIRST BLOOD', description: 'Complete your first day in any grid', icon: '🩸', category: 'streaks', requirement: 'Complete 1 day' },
  { id: 'three-day-fire', title: 'THREE-DAY FIRE', description: '3-day completion streak', icon: '🔥', category: 'streaks', requirement: '3 consecutive days completed' },
  { id: 'week-warrior', title: 'WEEK WARRIOR', description: '7-day completion streak', icon: '⚔️', category: 'streaks', requirement: '7 consecutive days' },
  { id: 'fortnight-force', title: 'FORTNIGHT FORCE', description: '14-day streak', icon: '🛡️', category: 'streaks', requirement: '14 consecutive days' },
  { id: 'iron-month', title: 'IRON MONTH', description: '30-day streak', icon: '🗡️', category: 'streaks', requirement: '30 consecutive days' },
  { id: 'unbreakable', title: 'UNBREAKABLE', description: '40-day streak — a full grid with zero scars', icon: '💎', category: 'streaks', requirement: 'Complete 40 consecutive days' },

  // GRIDS
  { id: 'grid-ignited', title: 'GRID IGNITED', description: 'Start your first 40-day grid', icon: '🔑', category: 'grids', requirement: 'Start 1 grid' },
  { id: 'grid-master', title: 'GRID MASTER', description: 'Complete a full 40-day grid', icon: '🏆', category: 'grids', requirement: 'Complete all 40 days in one grid' },
  { id: 'multi-grid', title: 'MULTI-DISCIPLINE', description: 'Run 3 grids simultaneously', icon: '🎯', category: 'grids', requirement: 'Have 3 active grids at once' },
  { id: 'hard-mode', title: 'HARD MODE', description: 'Complete a grid with Hard Reset enabled', icon: '☠️', category: 'grids', requirement: 'Complete a hard-reset grid' },
  { id: 'phoenix', title: 'PHOENIX', description: 'Start a new grid after failing one', icon: '🔥', category: 'grids', requirement: 'Start a grid after a failure' },
  { id: 'centurion', title: 'CENTURION', description: 'Complete 100 total days', icon: '💯', category: 'grids', requirement: '100 days completed across all grids' },

  // FOCUS (these will be checked when focus timer integrates)
  { id: 'first-focus', title: 'FIRST FOCUS', description: 'Complete your first focus session', icon: '🧠', category: 'focus', requirement: 'Complete 1 focus session' },
  { id: 'deep-diver', title: 'DEEP DIVER', description: '100 focus minutes in one day', icon: '🫧', category: 'focus', requirement: '100+ minutes focused in one day' },
  { id: 'focus-week', title: 'FOCUS WEEK', description: '500 total focus minutes', icon: '⏱️', category: 'focus', requirement: 'Accumulate 500 focused minutes' },

  // JOURNAL
  { id: 'first-reflection', title: 'FIRST REFLECTION', description: 'Write your first journal entry', icon: '📝', category: 'journal', requirement: 'Create 1 journal entry' },
  { id: 'truth-teller', title: 'TRUTH TELLER', description: 'Write 10 journal entries', icon: '📖', category: 'journal', requirement: '10 journal entries' },
  { id: 'chronicler', title: 'CHRONICLER', description: '50 journal entries', icon: '📚', category: 'journal', requirement: '50 journal entries' },

  // SPECIAL
  { id: 'night-owl', title: 'NIGHT OWL', description: 'Complete a routine after 10 PM', icon: '🦉', category: 'special', requirement: 'Mark a day complete after 22:00' },
  { id: 'early-bird', title: 'EARLY BIRD', description: 'Complete a routine before 7 AM', icon: '🐦', category: 'special', requirement: 'Mark a day complete before 07:00' },
  { id: 'scarred-not-broken', title: 'SCARRED NOT BROKEN', description: 'Have 5 scars but still complete a grid', icon: '⚡', category: 'special', requirement: 'Complete a grid with 5+ scars' },
];
```

**Implement checker function:**
```typescript
/**
 * Check all achievements against current data and unlock any newly earned ones.
 * Call this after any state-changing action (day complete, grid complete, etc).
 * Returns array of newly unlocked achievement IDs.
 */
export function checkAchievements(context: {
  grids: Grid40[];
  routines: Routine[];
  userStats: UserStats;
  isAchievementUnlocked: (id: string) => boolean;
  unlockAchievement: (id: string) => void;
  addXP: (amount: number) => void;
}): string[];
```

Each achievement, when unlocked, should also call `addXP()` with an appropriate amount (10-100 XP depending on difficulty).

### 2. `app/achievements.tsx` — Achievements Gallery Screen

**Layout:**
- Header: "YOUR ACHIEVEMENTS" label + "HALL OF HONOR" title
- XP bar at top: shows current level, XP progress to next level (animated bar)
- Stats row: LEVEL | TOTAL XP | UNLOCKED (X/Y)
- Grid of achievement cards (2 columns, using `<FlatList>` with `numColumns={2}`)
- Each card:
  - If unlocked: icon large (32px), title, description, "EARNED" + date
  - If locked: dimmed (opacity 0.3), icon as "?", requirement text shown
  - `surface1` background, 8px border-radius
  - Unlocked cards have `crimson` left border accent (3px)
- Tap unlocked card → subtle scale animation + shows full details
- Category filter tabs at top: ALL | STREAKS | GRIDS | FOCUS | JOURNAL | SPECIAL

### 3. `components/AchievementToast.tsx` — Pop-up Achievement Notification

**Requirements:**
- Overlay component rendered at root level
- When triggered, slides in from the top with spring animation
- Shows: achievement icon + "ACHIEVEMENT UNLOCKED" + title
- Gold/accent glow border animation
- `haptic.success()` on appear
- Auto-dismisses after 3 seconds with slide-out animation
- Props:
  ```typescript
  interface AchievementToastProps {
    achievement: Achievement | null;
    onDismiss: () => void;
  }
  ```
- Use `react-native-reanimated` for slide + spring animations

### 4. `components/StreakCounter.tsx` — Streak Display for Home Screen

**Requirements:**
- Shows current streak number in large font (42px, weight 900)
- Below number: "DAY STREAK" label
- Fire emoji that grows with streak: <7 days = 🔥, <14 = 🔥🔥, <30 = 🔥🔥🔥
- If streak equals `longestEverStreak`, show "PERSONAL BEST!" badge with animation
- Animated number counter on mount (counts from 0 to current value)
- Props:
  ```typescript
  interface StreakCounterProps {
    currentStreak: number;
    longestStreak: number;
  }
  ```

### 5. `components/LevelBadge.tsx` — XP & Level Progress

**Requirements:**
- Compact component showing: Level number + XP progress bar
- Props read from `useGamificationStore`
- Progress bar: `surface2` background, `crimson` fill
- "LVL X" label, weight 900
- "X / Y XP" below progress bar
- Width: fills container
- Animate progress bar fill on mount

## Verification
1. Run `npx expo start` — no TypeScript errors
2. Import `ACHIEVEMENT_DEFINITIONS` and verify 20+ achievements defined
3. `checkAchievements` correctly identifies unlockable achievements
4. Achievement gallery renders with locked/unlocked states
5. Toast component slides in/out with animation
6. Streak counter animates number on mount
