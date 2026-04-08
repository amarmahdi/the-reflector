# Agent Task: Final Integration — Tab Restructure & Wiring

## Context
Run this AFTER all other 8 agents have completed their work. This agent wires everything together.

## What to do

### 1. Update `app/(tabs)/_layout.tsx` — New 6-Tab Structure
Replace the current 5 tabs with 6 tabs in this order:
1. `today` → TODAY (rename current `index` to keep today as home, see below)
2. `wall` → THE WALL
3. `forge` → THE FORGE (existing)
4. `focus` → FOCUS (new, created by WS3)
5. `engine` → ENGINE (existing)
6. `profile` → PROFILE (new, created by WS5, replaces settings)

**Critical file operations:**
- Rename `app/(tabs)/index.tsx` → `app/(tabs)/wall.tsx`
- Rename `app/(tabs)/today.tsx` → `app/(tabs)/index.tsx` (makes Today the home tab)
- Remove `settings` tab registration (profile replaces it)
- Add `focus` and `profile` tab registrations with appropriate icons

Use these icons from `@hugeicons/core-free-icons`:
- Focus: `Timer01Icon` or `HourglassIcon`
- Profile: `UserIcon` or `UserCircleIcon`

### 2. Verify all navigation routes work
- `/journal` → Journal timeline
- `/journal/[entryId]` → Journal detail
- `/achievements` → Achievements gallery
- `/routine/[routineId]` → Edit routine
- `/recurring-tasks` → Recurring tasks manager
- `/flow/[gridId]` → Grid flow (existing)
- `/fire` → Reflection lock (existing)
- `/alarm` → Alarm (existing)
- `/onboarding` → Onboarding (existing)

### 3. Cross-wire features
- In Today screen: wire `streakCount` prop of GreetingHero to `useGamificationStore().userStats.currentStreak`
- In profile.tsx: verify XP/level display reads from gamification store
- In achievements gallery: make sure `registerAchievements` is called on mount with `ACHIEVEMENT_DEFINITIONS`

### 4. Run final verification
- `npx expo start` — zero TypeScript errors
- All 6 tabs render
- Navigation between all screens works
- Data persists across app restarts
