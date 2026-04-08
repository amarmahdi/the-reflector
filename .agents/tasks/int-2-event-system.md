# Agent Task: Cross-Feature Event System & Achievement Wiring

## Context
You are working on **The Reflector**, an Expo/React Native discipline app. Currently all features (routines, focus timer, journal, gamification) are **completely isolated**. Nothing triggers achievements, nothing updates XP, streaks aren't calculated, and no store talks to any other store.

Your job: Wire everything together through a central action layer.

## Design System
- `styled-components/native` — no `StyleSheet.create`
- `import { COLORS } from '@/constants/theme'`
- `import { haptic } from '@/lib/haptics'`

## The Problem
Right now:
- `markDayCompleted()` doesn't update `totalDaysCompleted` in gamification
- `addFocusSession()` doesn't update `totalFocusMinutes` in gamification
- `addJournalEntry()` doesn't update `totalJournalEntries` in gamification
- No action checks achievements
- `GreetingHero` receives `streakCount={0}` hardcoded
- `AchievementToast` component exists but is never mounted or triggered
- Daily streak isn't calculated
- Focus sessions don't link to routines in analytics

## What to Build

### 1. NEW `lib/appActions.ts` — Unified Action Layer

This is the **central nervous system**. It calls the appropriate store action AND triggers all side effects.

```typescript
import { useReflectorStore } from '@/store/useReflectorStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useJournalStore } from '@/store/useJournalStore';
import { checkAchievements } from '@/lib/achievements';
import { haptic } from '@/lib/haptics';
import type { FocusSession, JournalEntry, JournalMood } from '@/types/models';

/**
 * Call these instead of calling store actions directly.
 * They handle cross-cutting concerns (XP, achievements, stats, streaks).
 * These work outside of React components using .getState().
 */

/** Call after marking a grid day as completed */
export function onDayCompleted(gridId: string, dayIndex: number): string[] {
  const reflector = useReflectorStore.getState();
  const gam = useGamificationStore.getState();

  // 1. Mark the day completed (already called by the consuming code)
  // reflector.markDayCompleted(gridId, dayIndex);

  // 2. Update gamification stats
  gam.incrementStat('totalDaysCompleted');
  gam.addXP(5); // 5 XP per day completed

  // 3. Calculate and update streak
  const streak = calculateCurrentStreak(reflector.grids);
  gam.updateStreak(streak);

  // 4. Check achievements
  const newlyUnlocked = checkAchievements({
    grids: reflector.grids,
    routines: reflector.routines,
    userStats: gam.userStats,
    isAchievementUnlocked: gam.isAchievementUnlocked,
    unlockAchievement: gam.unlockAchievement,
    addXP: gam.addXP,
  });

  return newlyUnlocked; // Caller can show AchievementToast
}

/** Call after a grid is fully completed (all 40 days) */
export function onGridCompleted(gridId: string): string[] {
  const reflector = useReflectorStore.getState();
  const gam = useGamificationStore.getState();

  gam.incrementStat('totalGridsCompleted');
  gam.addXP(50); // 50 XP per grid completed

  const newlyUnlocked = checkAchievements({
    grids: reflector.grids,
    routines: reflector.routines,
    userStats: gam.userStats,
    isAchievementUnlocked: gam.isAchievementUnlocked,
    unlockAchievement: gam.unlockAchievement,
    addXP: gam.addXP,
  });

  return newlyUnlocked;
}

/** Call after a grid fails */
export function onGridFailed(gridId: string): void {
  const gam = useGamificationStore.getState();
  gam.incrementStat('totalGridsFailed');
  gam.updateStreak(0); // Reset streak on failure
}

/** Call after a focus session completes */
export function onFocusSessionCompleted(session: FocusSession): string[] {
  const reflector = useReflectorStore.getState();
  const gam = useGamificationStore.getState();
  const focus = useFocusStore.getState();

  // Update total focus minutes
  const minutesAdded = Math.round(session.actualDuration / 60000);
  gam.incrementStat('totalFocusMinutes', minutesAdded);
  gam.addXP(Math.max(1, Math.floor(minutesAdded / 5))); // 1 XP per 5 focus minutes

  // Check achievements
  const newlyUnlocked = checkAchievements({
    grids: reflector.grids,
    routines: reflector.routines,
    userStats: gam.userStats,
    isAchievementUnlocked: gam.isAchievementUnlocked,
    unlockAchievement: gam.unlockAchievement,
    addXP: gam.addXP,
  });

  // Deep diver check (100 min in one day)
  const todayMinutes = focus.getTodayFocusMinutes();
  if (todayMinutes >= 100 && !gam.isAchievementUnlocked('deep-diver')) {
    gam.unlockAchievement('deep-diver');
    gam.addXP(40);
    newlyUnlocked.push('deep-diver');
  }

  return newlyUnlocked;
}

/** Call after a journal entry is created */
export function onJournalEntryCreated(): string[] {
  const reflector = useReflectorStore.getState();
  const gam = useGamificationStore.getState();

  gam.incrementStat('totalJournalEntries');
  gam.addXP(3); // 3 XP per journal entry

  const newlyUnlocked = checkAchievements({
    grids: reflector.grids,
    routines: reflector.routines,
    userStats: gam.userStats,
    isAchievementUnlocked: gam.isAchievementUnlocked,
    unlockAchievement: gam.unlockAchievement,
    addXP: gam.addXP,
  });

  return newlyUnlocked;
}

/** Call after a task is toggled complete */
export function onTaskCompleted(): void {
  const gam = useGamificationStore.getState();
  gam.addXP(2); // 2 XP per task completion
}

/**
 * Calculate current streak from grid data.
 * A streak counts consecutive days where at least 1 grid day was completed.
 */
export function calculateCurrentStreak(grids: Grid40[]): number {
  // Collect all completed day dates across all grids
  const completedDates = new Set<number>();
  for (const grid of grids) {
    for (const day of grid.days) {
      if (day.status === 'completed') {
        completedDates.add(day.date);
      }
    }
  }

  if (completedDates.size === 0) return 0;

  // Count backwards from today
  const MS_PER_DAY = 86400000;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let current = now.getTime();
  let streak = 0;

  // Allow today to not be completed yet (check yesterday first if today isn't done)
  if (!completedDates.has(current)) {
    current -= MS_PER_DAY;
  }

  while (completedDates.has(current)) {
    streak++;
    current -= MS_PER_DAY;
  }

  return streak;
}
```

**Import `Grid40` type as needed at the top.**

### 2. MODIFY `app/(tabs)/today.tsx` — Wire Streak + Task XP

- Import `useGamificationStore` and read `userStats.currentStreak`
- Replace `<GreetingHero streakCount={0} />` with `<GreetingHero streakCount={currentStreak} />`
- Import `onTaskCompleted` from `@/lib/appActions`
- In the todo toggle handler, after calling `toggleTodo`, call `onTaskCompleted()` when completing (not uncompleting)

### 3. MODIFY `app/(tabs)/focus.tsx` — Wire Focus XP + Achievements

- Import `onFocusSessionCompleted` from `@/lib/appActions`
- After calling `addFocusSession()` with `completed: true`, call `onFocusSessionCompleted(session)`
- Store the returned `newlyUnlocked` array and display `AchievementToast` if any

### 4. MODIFY `app/journal/index.tsx` — Wire Journal XP + Achievements

- Import `onJournalEntryCreated` from `@/lib/appActions`
- After calling `addJournalEntry()`, call `onJournalEntryCreated()`
- Display `AchievementToast` for newly unlocked achievements

### 5. MODIFY `app/flow/[gridId].tsx` — Wire Day Completion + Grid Events

- Import `onDayCompleted`, `onGridCompleted` from `@/lib/appActions`
- After `markDayCompleted()`, call `onDayCompleted(gridId, dayIndex)`
- Check if grid is now fully complete (all 40 days), if so call `onGridCompleted(gridId)`
- Display `AchievementToast` for any new achievements

### 6. MODIFY `components/SwipeableGridCell.tsx` — Wire Day Completion

- Import `onDayCompleted` from `@/lib/appActions`
- In `onSwipeComplete` callback, after the parent handler runs, call `onDayCompleted()`

Actually, the parent component (Grid40Card or the Wall screen) handles the swipe → it calls `markDayCompleted`. So the wiring should happen wherever `markDayCompleted` is called. Check `app/(tabs)/index.tsx` (the Wall) for where day completion is handled and add `onDayCompleted()` there.

### 7. MODIFY `app/_layout.tsx` — Mount AchievementToast Globally

- Import `AchievementToast` from `@/components/AchievementToast`
- Add a global state for showing achievement toast (use a simple context or zustand)
- Mount `<AchievementToast />` at the root level so it shows over any screen
- Create a simple hook or global function to trigger it:
  ```typescript
  // Add to appActions.ts
  let _toastCallback: ((achievement: Achievement) => void) | null = null;
  export function registerToastCallback(cb: typeof _toastCallback) { _toastCallback = cb; }
  export function showAchievementToast(achievementId: string) {
    const defs = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
    if (defs && _toastCallback) _toastCallback({ ...defs, unlockedAt: Date.now() });
  }
  ```
- In `_layout.tsx`, register the callback on mount
- In each `onDayCompleted`/`onFocusSessionCompleted`/etc call, loop through `newlyUnlocked` and show toast

### 8. MODIFY `app/fire.tsx` — Wire Scar Events

- Import `onJournalEntryCreated` from `@/lib/appActions`
- After the auto-journal entry is created in handleSubmit, call `onJournalEntryCreated()`
- The scar itself should reset the streak: streak calculation handles this automatically since the scarred day breaks the consecutive completion chain

### 9. MODIFY `app/(tabs)/engine.tsx` — Show Unified Stats

- Import `useFocusStore` and `useJournalStore`
- Add a new section "FOCUS INSIGHTS" showing:
  - Total focus minutes this week (from focus store)
  - Focus sessions count
- Add a new section "JOURNAL INSIGHTS" showing:
  - Total entries this week
  - Most common mood this week
- These sections go between the Weekly Summary and the Heatmap

## DO NOT MODIFY
- `store/useReflectorStore.ts` — read only
- `store/useFocusStore.ts` — read only
- `store/useJournalStore.ts` — read only
- `store/useGamificationStore.ts` — read only
- `types/models.ts` — NO changes needed
- `app/(tabs)/_layout.tsx`

## Verification
1. `npx tsc --noEmit` — zero errors
2. Mark a day as completed → XP increases, stats update, achievements check
3. Complete a focus session → totalFocusMinutes updates in gamification
4. Create a journal entry → totalJournalEntries updates, XP awarded
5. GreetingHero shows actual streak count
6. AchievementToast appears when an achievement unlocks
7. Engine tab shows focus and journal sections
