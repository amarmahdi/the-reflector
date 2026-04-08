# Agent Task: Flexible Alarm System

## Context
You are working on **The Reflector**, an Expo/React Native discipline app. The alarm system is currently hardcoded as a single "wake up" alarm. The user wants alarms to be **attachable to any task, routine, or standalone** — fully user-configurable.

## Design System
- `styled-components/native` — no `StyleSheet.create`
- Colors: `import { COLORS } from '@/constants/theme'` — surface0 (#0D0D0D), surface1 (#141414), surface2 (#1C1C1C), crimson (#1A6B3C), textPrimary (#F0EDE8), textSecondary (#8A8580), textDim (#4A4845), border (#2A2A2A)
- ALL headers UPPERCASE, weight 900, letter-spacing 2-4px
- Haptics: `import { haptic } from '@/lib/haptics'`
- Dark theme only

## Current Alarm Architecture
- `lib/alarmNotifee.ts` — Android full-screen alarm (Notifee)
- `lib/notifications.ts` — Schedules a single wake alarm + nudges based on `NotificationSettings`
- `app/alarm.tsx` — Alarm screen (swipe to dismiss, plays audio)
- `app/(tabs)/settings.tsx` — Static wake time picker and alarm sound config
- `app/(tabs)/profile.tsx` — Copies the same settings UI from settings.tsx

The problem: There's ONE global alarm (wake time). Users can't set individual alarms per task or routine.

## What to Build

### 1. New Data Model — `types/models.ts`

Add a new `Alarm` interface:

```typescript
export type AlarmType = 'task' | 'routine' | 'standalone';
export type AlarmRepeat = 'once' | 'daily' | 'weekdays' | 'custom';

export interface Alarm {
  id: string;
  label: string;          // e.g. "Wake Up", "Gym Time", "Sleep"
  time: string;           // "HH:MM" format
  type: AlarmType;
  repeat: AlarmRepeat;
  /** Custom repeat days (0=Sun..6=Sat). Only used when repeat='custom' */
  customDays?: number[];
  /** Linked entity ID (taskId, routineId, or null for standalone) */
  linkedEntityId?: string;
  /** Whether to use full-screen alarm (Android) or just notification */
  isFullScreen: boolean;
  /** Whether to use custom sound vs default */
  useCustomSound: boolean;
  /** Custom sound filename (from downloaded YouTube audio) */
  customSoundFile?: string;
  enabled: boolean;
  createdAt: number;
}
```

### 2. New Store — `store/useAlarmStore.ts`

Create a new isolated Zustand store with persist:

```typescript
interface AlarmState {
  alarms: Alarm[];
  addAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt'>) => Alarm;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  getAlarmsByType: (type: AlarmType) => Alarm[];
  getAlarmForEntity: (entityId: string) => Alarm | undefined;
  getActiveAlarms: () => Alarm[];
}
```

Use persist key: `reflector-alarms`, use `asyncStorageAdapter` from `./storage`.

### 3. New Component — `components/AlarmConfig.tsx`

Reusable alarm configuration component (used in multiple places):

```typescript
interface AlarmConfigProps {
  alarm?: Alarm;             // existing alarm to edit, or undefined for new
  linkedEntityId?: string;   // pre-fill linked entity
  linkedType?: AlarmType;    // pre-fill type
  onSave: (alarm: Omit<Alarm, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;     // only shown for existing alarms
  onCancel: () => void;
}
```

**UI layout:**
- Label input (text field, placeholder "ALARM NAME")
- Time picker (use `@react-native-community/datetimepicker` mode="time")
- Repeat selector: Row of chips — ONCE / DAILY / WEEKDAYS / CUSTOM
  - If CUSTOM: show `DayPicker` component (already exists at `components/DayPicker.tsx`)
- Full-screen toggle (Switch — "FULL SCREEN ALARM")
- Sound selector: DEFAULT / CUSTOM
  - If custom sound exists (from YouTube downloads), show list of available sounds
- SAVE / CANCEL / DELETE buttons

### 4. New Screen — `app/alarms.tsx` — Alarm Manager

Stack screen showing all user alarms with ability to add/edit.

**Layout:**
- Header: "ALARMS" label + "YOUR ALARMS" title
- List of alarm cards:
  - Each card: time (large, 24px), label, repeat info, type badge (TASK/ROUTINE/STANDALONE), enabled toggle switch
  - Tap to expand/edit inline using `AlarmConfig` component
  - Swipe to delete
- FAB to add new standalone alarm
- Section grouping: STANDALONE alarms, then ROUTINE alarms, then TASK alarms
- Empty state when no alarms

### 5. MODIFY `lib/notifications.ts` — Use Alarm Store

Replace the hardcoded alarm scheduling with a system that reads from the alarm store:

- Rename `scheduleNotifications` to accept alarms from the alarm store
- Add new function: `scheduleAllAlarms(alarms: Alarm[], settings: NotificationSettings)` that:
  - Cancels all existing scheduled notifications
  - For each enabled alarm:
    - If `isFullScreen` → use `scheduleAlarmNotifee()` (Android) or standard notification (iOS)
    - If not → schedule a standard notification
    - Handle repeat patterns (once/daily/weekdays/custom)
  - Keep the escalating nudges for the FIRST alarm of the day (wake-up equivalent)

### 6. Integration Points (add alarm buttons in existing screens)

**MODIFY `app/(tabs)/today.tsx`** — In the AddTask modal, add an optional "SET ALARM" toggle. When enabled, show a mini time picker. When the task is saved, also create an alarm linked to it via `useAlarmStore.addAlarm()`.

**MODIFY `app/(tabs)/forge.tsx`** — When starting a grid, add an optional "SET DAILY ALARM" step. If enabled, create a recurring alarm linked to the routine.

**MODIFY `app/recurring-tasks.tsx`** — In the expanded task editor, add an "ALARM" section. Show existing alarm if linked, or "ADD ALARM" button. Use `AlarmConfig` component.

### 7. MODIFY `app/alarm.tsx` — Show Alarm Context

When the alarm screen triggers, show WHAT alarm it is:
- Read the alarm label and linked entity from the alarm store
- Display the label (e.g. "WAKE UP" or "GYM TIME") instead of generic "WAKE UP, REFLECTOR."
- If linked to a routine, show the routine name

### 8. MODIFY `app/(tabs)/profile.tsx` — Add Alarm Management Link

In the Quick Actions section, add:
```tsx
<ActionRow onPress={() => router.push('/alarms')}>
  <ActionLabel>MANAGE ALARMS</ActionLabel>
</ActionRow>
```

## DO NOT MODIFY
- `store/useReflectorStore.ts` (use your own store)
- `store/useJournalStore.ts`, `store/useFocusStore.ts`, `store/useGamificationStore.ts`
- `app/(tabs)/_layout.tsx`, `app/(tabs)/engine.tsx`
- `lib/correlationEngine.ts`, `lib/heatmapEngine.ts`

## Verification
1. `npx tsc --noEmit` — zero errors
2. Can create standalone alarms from the alarm manager
3. Can attach alarms to tasks during creation
4. Can attach alarms to routines when starting a grid
5. Alarm screen shows the correct label when triggered
6. Toggling alarms on/off works
7. Repeat patterns (daily, weekdays, custom) schedule correctly
