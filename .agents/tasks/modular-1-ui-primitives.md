# Task: Extract Reusable UI Primitives

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Goal
Create a `components/ui/` directory with reusable styled-components that replace the 50+ duplicated definitions across screens.

## Files to Create

### 1. `components/ui/Screen.tsx`
A full-screen wrapper. Currently defined 13x across files.
```tsx
export const Screen = styled.View`
  flex: 1;
  background-color: ${COLORS.surface0};
`;

// ScrollScreen variant for scrollable pages
export const ScrollScreen = styled.ScrollView`
  flex: 1;
  background-color: ${COLORS.surface0};
`;
```

### 2. `components/ui/Button.tsx`
Create these button variants (currently 15+ copies across files):

- **PrimaryButton** — green fill, white text, 14px radius. Used in: index, focus, forge, recurring-tasks, flow, routine editor
- **GhostButton** — transparent, border only. Used in: index, forge
- **DangerButton** — warmRed fill. Used in: settings, routine editor
- **SmallButton** — compact version. Used in: forge
- **CancelButton** — border, textSecondary. Used in: journal, alarms

Each button should export both the Pressable and Text as a single component:
```tsx
interface ButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  style?: any;
}
export function PrimaryButton({ onPress, label, disabled, style }: ButtonProps) { ... }
```

### 3. `components/ui/Card.tsx`
Base card pattern (9+ copies):
```tsx
export const Card = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: ${RADIUS.lg}px;
  padding: ${SPACING.lg}px;
`;
```
Also export `HeroCard` (larger padding, no border) and `StatCard` variants.

### 4. `components/ui/EmptyState.tsx`
Replace the existing unused `components/EmptyState.tsx` and the 6+ inline copies:
```tsx
interface EmptyStateProps {
  icon: string;      // emoji
  title: string;
  subtitle: string;
}
export function EmptyState({ icon, title, subtitle }: EmptyStateProps) { ... }
```

### 5. `components/ui/SectionLabel.tsx`
7 copies across files. Standardize:
```tsx
export const SectionLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.widest}px;
  text-transform: uppercase;
  padding: 0 ${SPACING.xl}px;
  margin-bottom: ${SPACING.md}px;
`;
```
Also export `SectionHeader` (row with line divider).

### 6. `components/ui/ProgressBar.tsx`
5+ copies with different prop names. Standardize:
```tsx
interface ProgressBarProps {
  percent: number;    // 0-100
  color?: string;     // default COLORS.crimson
  height?: number;    // default 4
  showLabel?: boolean;
}
export function ProgressBar({ percent, color, height, showLabel }: ProgressBarProps) { ... }
```

### 7. `components/ui/BottomSheet.tsx`
Modal pattern used in journal with potential reuse:
```tsx
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) { ... }
```

### 8. `components/ui/Input.tsx`
3 copies of the same styled TextInput:
```tsx
export const StyledInput = styled.TextInput`
  background-color: ${COLORS.surface2};
  color: ${COLORS.textPrimary};
  padding: 14px 16px;
  border-radius: ${RADIUS.lg}px;
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  border-width: 1px;
  border-color: ${COLORS.border};
`;
```

### 9. `components/ui/Chip.tsx`
Filter chips used in journal, focus, recurring-tasks:
```tsx
interface ChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: string;
}
export function Chip({ label, active, onPress, icon }: ChipProps) { ... }
```

### 10. `components/ui/Checkbox.tsx`
Check circle used in index (todos) and flow (subtasks):
```tsx
interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
}
export function Checkbox({ checked, onToggle }: CheckboxProps) { ... }
```

### 11. `components/ui/StatPill.tsx`
Stat value + label pattern used 5+ times in insights, weekly-review:
```tsx
interface StatPillProps {
  value: string | number;
  label: string;
  accent?: boolean;
}
export function StatPill({ value, label, accent }: StatPillProps) { ... }
```

### 12. `components/ui/index.ts`
Barrel export file:
```ts
export { Screen, ScrollScreen } from './Screen';
export { PrimaryButton, GhostButton, DangerButton, SmallButton, CancelButton } from './Button';
export { Card, HeroCard } from './Card';
export { EmptyState } from './EmptyState';
export { SectionLabel, SectionHeader } from './SectionLabel';
export { ProgressBar } from './ProgressBar';
export { BottomSheet } from './BottomSheet';
export { StyledInput } from './Input';
export { Chip } from './Chip';
export { Checkbox } from './Checkbox';
export { StatPill } from './StatPill';
```

## Styling Rules
- ALL colors from `COLORS` constant
- ALL font sizes from `TYPOGRAPHY` constant
- ALL spacing from `SPACING` constant
- ALL radii from `RADIUS` constant
- NO hardcoded `#hex` or `rgba()` values
- ALL components typed with TypeScript interfaces

## DO NOT
- Change any screen file yet (that's a separate task)
- Change navigation or store logic
- Move existing domain-specific components (JournalCard, MoodPicker, etc.)


---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-1.md`
3. Confirm status is `KICKOFF` before starting

### When Done
Write your completion report to `.agents/messages/from-agent-1/done.md` containing:
- Files created/modified (with line counts)
- Decisions you made
- Any issues found
- Verification results (`npx tsc --noEmit`)

### If Stuck
Write `.agents/messages/from-agent-1/blocker.md` with:
- What you are stuck on
- Options you see
- What you need from the Boss

### Check for Follow-ups
After reporting done, check `.agents/messages/boss/agent-1.md` for any follow-up instructions from the Boss.
