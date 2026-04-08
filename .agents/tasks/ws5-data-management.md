# Agent Task: Data Management, Routine Editing & Profile Tab

## Context
You are working on **The Reflector**, an Expo/React Native discipline-tracking app. You are ONE of 8 agents working in parallel. You MUST only create/modify files listed below.

## Design System (MANDATORY)
- **Styling**: `styled-components/native` — NEVER use `StyleSheet.create`
- **Colors**: Import `{ COLORS }` from `@/constants/theme`
  - Backgrounds: `surface0` (#0D0D0D), `surface1` (#141414), `surface2` (#1C1C1C)
  - Accent: `crimson` (#1A6B3C — it's dark green despite the name)
  - Text: `textPrimary` (#F0EDE8), `textSecondary` (#8A8580), `textDim` (#4A4845)
  - Borders: `border` (#2A2A2A), `borderLight` (#333333)
- **Typography**: ALL headers/labels UPPERCASE. font-weight 900 for headings, 700 for labels. Letter-spacing 2-4px.
- **Haptics**: Import `{ haptic }` from `@/lib/haptics`
- **Icons**: `@hugeicons/react-native` with `@hugeicons/core-free-icons`
- **Dark theme only**

## What Already Exists
- `store/useReflectorStore.ts` — Current main store (you WILL modify this)
- `store/useGamificationStore.ts` — Has `userStats`, `hasOnboarded` (read only, don't modify)
- `app/(tabs)/settings.tsx` — Current settings screen (you will create profile.tsx to REPLACE it)
- All existing tab screens — DO NOT modify `index.tsx`, `today.tsx`, `engine.tsx`, `forge.tsx`

## Files to CREATE

### 1. `lib/dataExport.ts` — Data Export/Import Utilities

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system'; // already in expo

export interface ExportData {
  version: string;
  exportedAt: number;
  stores: {
    reflector: unknown;
    journal: unknown;
    focus: unknown;
    gamification: unknown;
  };
}

/**
 * Export all app data as a JSON string.
 * Reads from all AsyncStorage keys used by zustand persist.
 */
export async function exportAllData(): Promise<string>;

/**
 * Import data from a JSON string. Validates the format before applying.
 * Returns success status and optional error message.
 */
export async function importData(json: string): Promise<{ success: boolean; error?: string }>;

/**
 * Get the approximate size of all stored data.
 */
export async function getStorageSize(): Promise<{ bytes: number; formatted: string }>;

/**
 * Clear all stored data (nuclear reset).
 */
export async function clearAllData(): Promise<void>;
```

Implementation details:
- Store keys are: `reflector-store`, `reflector-journal`, `reflector-focus`, `reflector-gamification`
- Use `AsyncStorage.multiGet()` and `AsyncStorage.multiSet()` for efficiency
- For `getStorageSize`, sum the byte lengths of all stored JSON values
- For `exportAllData`, read all 4 store keys and bundle them
- For `importData`, validate the `version` field exists, then write back to AsyncStorage
- Format bytes as KB/MB

### 2. `app/routine/[routineId].tsx` — Edit Routine Screen

**Stack screen for editing an existing routine.**

**Layout:**
- Header: routine title (editable inline text input)
- Section: "SUB-TASKS" with list of sub-tasks
  - Each sub-task row: title (editable) + CORE/OPTIONAL toggle + delete button
  - Add sub-task row at bottom (same style as forge.tsx)
- Section: "GRID HISTORY"
  - List of all grids that used this routine (active, completed, failed)
  - Each grid card shows: status badge, start date, completion %, scar count
  - Active grids show "ACTIVE" badge in crimson
  - Completed grids show "COMPLETED" badge
  - Failed grids show "FAILED" badge
- Save button at bottom: "SAVE CHANGES" (crimson primary button)
- Delete routine button: "DELETE ROUTINE" (danger style, text only, requires confirmation Alert)
  - Only enabled if no active grid uses this routine

**Store interactions:**
- Use `editRoutine` action (you'll add to main store)
- Use `deleteRoutine` action (you'll add to main store)

### 3. `app/(tabs)/profile.tsx` — Profile & Settings Tab (REPLACES settings.tsx)

**This is the new settings/profile tab. The old `settings.tsx` stays untouched but will be de-registered from tabs by the integration agent.**

**Layout (scrollable):**

**A. Profile Header:**
- "YOUR PROFILE" label + "THE REFLECTOR" title
- Level badge + XP bar (read from `useGamificationStore`)
- Member since date (from `userStats.joinedAt`)

**B. Lifetime Stats Grid:**
- 2x3 grid of stat cards:
  - Total Days Completed
  - Total Grids Completed
  - Total Grids Failed
  - Longest Streak (days)
  - Total Focus Minutes (if available, show 0 if not)
  - Total Journal Entries (if available, show 0 if not)
- Each card: `surface1` background, number in large weight 900 font, label below

**C. Quick Actions Section:**
- "MANAGE ROUTINES" → navigates to routine list (just navigate to forge tab)
- "ACHIEVEMENTS" → navigates to `/achievements`
- "JOURNAL" → navigates to `/journal`
- "RECURRING TASKS" → navigates to `/recurring-tasks`
- Each as a row with chevron icon

**D. Notifications Section:**
- Copy ALL the notification settings UI from the existing `settings.tsx`:
  - Notifications toggle
  - Wake time picker
  - First reminder offset buttons
  - Nudge interval buttons
  - Quiet hours picker
  - Alarm sound selection (default/pick song)
  - YouTube download section
  - Downloaded sounds list
  - Apply schedule button
  - Scheduled count display
- Import the same functions from `@/lib/notifications` and `@/lib/youtubeAudio`

**E. Data Management Section:**
- Section header: "DATA"
- "EXPORT DATA" button (ghost style) → calls `exportAllData()`, uses `Share` API to share JSON
- "IMPORT DATA" button (ghost style) → uses `DocumentPicker` to select JSON file, then `importData()`
- Storage usage display: "Using X KB" (from `getStorageSize()`)
- "CLEAR OLD TODOS" button (danger) → clears todos older than 30 days (confirmation Alert)
- "RESET ALL DATA" button (danger) → calls `clearAllData()` with double-confirmation Alert

**F. About Section:**
- App version: "1.0.0"
- "THE REFLECTOR" tagline

## Files to MODIFY

### 4. `store/useReflectorStore.ts` — Add Routine Editing Actions

Add these new actions to the store interface and implementation:

```typescript
// Add to interface:
editRoutine: (id: string, title: string, subTasks: SubTask[]) => void;
deleteRoutine: (id: string) => void;
deleteGrid: (gridId: string) => void;
clearOldTodos: (beforeDate: number) => void;

// Implementations:
editRoutine: (id, title, subTasks) => {
  set((state) => ({
    routines: state.routines.map((r) =>
      r.id === id ? { ...r, title, subTasks } : r
    ),
  }));
},

deleteRoutine: (id) => {
  set((state) => ({
    routines: state.routines.filter((r) => r.id !== id),
    // Also remove grids that use this routine (only non-active ones)
    grids: state.grids.filter((g) => g.routineId !== id || g.status === 'active'),
  }));
},

deleteGrid: (gridId) => {
  set((state) => ({
    grids: state.grids.filter((g) => g.id !== gridId),
    dailyCheckIns: state.dailyCheckIns.filter((c) => c.gridId !== gridId),
  }));
},

clearOldTodos: (beforeDate) => {
  set((state) => ({
    dailyTodos: state.dailyTodos.filter((t) => t.date >= beforeDate),
  }));
},
```

### 5. MODIFY `app/(tabs)/forge.tsx` — Make Routines Tappable

In the locked routines section, make each `LockedBanner` tappable:
- Wrap with `Pressable` that navigates to `/routine/${r.id}`
- Add a small "EDIT >" indicator text on the right side of the header

## Verification
1. Run `npx expo start` — no TypeScript errors
2. Profile tab renders with all sections
3. Export data → shareable JSON file
4. Edit routine screen: can change title, add/remove sub-tasks, save
5. Tapping a locked routine in Forge navigates to edit screen
6. Data size display shows correct value
7. Clear old todos works with confirmation
