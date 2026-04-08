# Task: Type-Safe Seed Data & Store Contract Validation

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Goal
Make `lib/seedData.ts` type-safe so that any field mismatch, missing key, or wrong data shape is caught at compile time — never on the user's phone.

## Changes

### 1. Create Store State Type Exports

Each store currently defines its state interface privately. Export them so seed data can reference them.

#### `store/useReflectorStore.ts`
Export the `ReflectorState` interface (already defined, just add `export`):
```diff
-interface ReflectorState {
+export interface ReflectorState {
```

#### `store/useFocusStore.ts`  
```diff
-interface FocusState {
+export interface FocusState {
```

#### `store/useJournalStore.ts`
```diff
-interface JournalState {
+export interface JournalState {
```

#### `store/useGamificationStore.ts`
```diff
-interface GamificationState {
+export interface GamificationState {
```

#### `store/useAlarmStore.ts`
```diff
-interface AlarmState {
+export interface AlarmState {
```

### 2. Type-Annotate Seed Data

In `lib/seedData.ts`, import the state types and annotate every object:

```ts
import type { ReflectorState } from '@/store/useReflectorStore';
import type { FocusState } from '@/store/useFocusStore';
import type { JournalState } from '@/store/useJournalStore';
import type { GamificationState } from '@/store/useGamificationStore';
import type { AlarmState } from '@/store/useAlarmStore';

// Extract only the data fields (remove action methods)
type ReflectorData = Pick<ReflectorState, 'routines' | 'grids' | 'dailyCheckIns' | 'dailyTodos' | 'recurringTasks' | 'notificationSettings'>;
type FocusData = Pick<FocusState, 'focusSessions'>;
type JournalData = Pick<JournalState, 'journalEntries'>;
type GamificationData = Pick<GamificationState, 'userStats' | 'achievements' | 'hasOnboarded'>;
type AlarmData = Pick<AlarmState, 'alarms'>;

// Then annotate:
const reflectorState: { state: ReflectorData; version: number } = { ... };
const focusState: { state: FocusData; version: number } = { ... };
const journalState: { state: JournalData; version: number } = { ... };
const gamificationState: { state: GamificationData; version: number } = { ... };
const alarmState: { state: AlarmData; version: number } = { ... };
```

### 3. Validate the AsyncStorage Keys Match

Create a `store/keys.ts` file that centralizes all store persistence keys:

```ts
export const STORE_KEYS = {
  reflector: 'reflector-store',
  gamification: 'reflector-gamification',
  focus: 'reflector-focus',
  journal: 'reflector-journal',
  alarms: 'reflector-alarms',
} as const;
```

Then update:
- Each store's `persist()` call to use `STORE_KEYS.xxx`
- `seedData.ts` to use `STORE_KEYS.xxx` in the `multiSet` call
- This prevents the silent mismatch we had (e.g., writing to `'reflector-focus'` but the store reads from `'focus-store'`)

### 4. Delete Unused Legacy Components

These components are defined but NEVER imported anywhere:
- `components/EmptyState.tsx` — replaced by `components/ui/EmptyState.tsx`
- `components/RoutineStrip.tsx` — 0 imports
- `components/Grid40Card.tsx` — 0 imports  
- `components/GreetingHero.tsx` — 0 imports
- `components/AnimatedCounter.tsx` — 0 imports
- `components/SwipeableGridCell.tsx` — 0 imports

Verify they have 0 imports before deleting. Keep `EditScreenInfo.tsx`, `StyledText.tsx`, `Themed.tsx`, `ExternalLink.tsx` (they may be used by Expo boilerplate).

## Verification

After all changes, run:
```bash
npx tsc --noEmit
```

Any field mismatch in seed data will now be a **compile-time error**, not a runtime crash.


---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-3.md`
3. Confirm status is `KICKOFF` before starting

### When Done
Write your completion report to `.agents/messages/from-agent-3/done.md` containing:
- Files created/modified (with line counts)
- Decisions you made
- Any issues found
- Verification results (`npx tsc --noEmit`)

### If Stuck
Write `.agents/messages/from-agent-3/blocker.md` with:
- What you are stuck on
- Options you see
- What you need from the Boss

### Check for Follow-ups
After reporting done, check `.agents/messages/boss/agent-3.md` for any follow-up instructions from the Boss.
