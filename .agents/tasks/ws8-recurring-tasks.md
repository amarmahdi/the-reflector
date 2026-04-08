# Agent Task: Recurring Tasks Enhancement

## Context
You are working on **The Reflector**, an Expo/React Native discipline-tracking app. You are ONE of 8 parallel agents. Only create/modify files listed below.

## Design System
- `styled-components/native` — no `StyleSheet.create`
- Colors: `import { COLORS } from '@/constants/theme'` — surface0 (#0D0D0D), surface1 (#141414), surface2 (#1C1C1C), crimson (#1A6B3C), textPrimary (#F0EDE8), textSecondary (#8A8580), textDim (#4A4845), border (#2A2A2A), crimsonGlow (rgba(26,107,60,0.18))
- ALL headers UPPERCASE, weight 900, letter-spacing 2-4px
- Haptics: `import { haptic } from '@/lib/haptics'`
- Dark theme only

## DO NOT MODIFY
- `store/useJournalStore.ts`, `store/useFocusStore.ts`, `store/useGamificationStore.ts`
- `app/(tabs)/_layout.tsx`, `app/_layout.tsx`, other tab files except where noted
- `types/models.ts` — already has `isPaused?: boolean` and `updatedAt?: number` on `RecurringTask`

## Files to CREATE

### 1. `components/DayPicker.tsx` — Day-of-Week Selector

Reusable row of 7 day circles.

```typescript
interface DayPickerProps {
  selectedDays: number[];  // 0=Sun, 1=Mon, ..., 6=Sat
  onChange: (days: number[]) => void;
  disabled?: boolean;
}
```

**Requirements:**
- Row of 7 circles, evenly spaced
- Each circle: 36px diameter, shows single letter (S M T W T F S)
- Unselected: `surface2` background, `textDim` text, `border` border
- Selected: `crimson` background, `white` text, no border
- Tap toggles selection with `haptic.selection()`
- If `disabled`, reduce opacity to 0.5, disable touches
- "EVERY DAY" hint text below when no days selected (empty = every day)

### 2. `app/recurring-tasks.tsx` — Recurring Tasks Manager Screen

Stack screen (navigated to from profile or settings, not a tab).

**Layout:**

**A. Header:**
- "TASK TEMPLATES" label
- "RECURRING TASKS" title with accent

**B. Task List (ScrollView):**
Each recurring task as an expandable card:
- **Collapsed state (default):**
  - Row: Title + Category badge (colored from TASK_CATEGORIES) + Pause indicator (⏸ if paused)
  - Subtitle: scheduled time + active days summary (e.g., "MON, WED, FRI" or "EVERY DAY")
  - Tap to expand

- **Expanded state:**
  - Title: editable `TextInput` (pre-filled)
  - Category picker: row of chips (same as today.tsx add modal)
  - Time block picker: Morning/Afternoon/Evening chips
  - Priority picker: Must/Should/Nice chips
  - Time picker: scheduled time (use DateTimePicker)
  - Day picker: `DayPicker` component
  - Action buttons row:
    - "PAUSE" / "RESUME" toggle button (ghost style)
    - "SAVE" button (primary crimson)
    - "DELETE" button (danger text style with confirmation Alert)

**C. Empty state:** When no recurring tasks exist: "NO RECURRING TASKS" + "Create one from the Today tab" subtitle

**Store interactions:**
- Read: `useReflectorStore` → `recurringTasks`
- Edit: use `editRecurringTask` action (you'll add)
- Pause: use `toggleRecurringTaskPause` action (you'll add)
- Delete: use existing `removeRecurringTask`

## Files to MODIFY

### 3. `store/useReflectorStore.ts` — Add Recurring Task Editing Actions

Add to the interface:
```typescript
editRecurringTask: (id: string, updates: Partial<Omit<RecurringTask, 'id' | 'createdAt'>>) => void;
toggleRecurringTaskPause: (id: string) => void;
```

Add implementations:
```typescript
editRecurringTask: (id, updates) => {
  set((state) => ({
    recurringTasks: state.recurringTasks.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
    ),
  }));
},

toggleRecurringTaskPause: (id) => {
  set((state) => ({
    recurringTasks: state.recurringTasks.map((t) =>
      t.id === id ? { ...t, isPaused: !t.isPaused, updatedAt: Date.now() } : t
    ),
  }));
},
```

Also modify `generateDailyTodos` to skip paused tasks. Find the line:
```typescript
if (task.activeDays.length > 0 && !task.activeDays.includes(dayOfWeek)) continue;
```
Add after it:
```typescript
if (task.isPaused) continue;
```

### 4. Add navigation link from `app/(tabs)/settings.tsx`

At the bottom of the settings screen (inside `<ContentPad>`, before the closing tag), add a button:
```tsx
<ActionBtn variant="ghost" onPress={() => router.push('/recurring-tasks')}>
  <ActionBtnText variant="ghost">MANAGE RECURRING TASKS</ActionBtnText>
</ActionBtn>
```

Add `import { useRouter } from 'expo-router';` and `const router = useRouter();` inside the component.

## Verification
1. `npx expo start` — no TS errors
2. Navigate to recurring-tasks screen — shows list of existing recurring tasks
3. Expand a task → edit fields → save → changes persist
4. Pause a task → paused indicator shows → `generateDailyTodos` skips it
5. Delete a task → confirmation → removed
6. DayPicker toggles days correctly with haptics
7. Settings screen has the "MANAGE RECURRING TASKS" button
