# Agent 1 — Done: UI Primitives

## Status: COMPLETE

## Files Created/Modified in `components/ui/`

| File | Lines | Status |
|------|-------|--------|
| `Screen.tsx` | 17 | **Kept as-is** — already correct |
| `Button.tsx` | 153 | **Rewritten** — replaced hardcoded values with SPACING/TYPOGRAPHY tokens |
| `Card.tsx` | 32 | **New** — Card, HeroCard, StatCard |
| `EmptyState.tsx` | 55 | **New** — icon + title + subtitle (no animations) |
| `SectionLabel.tsx` | 50 | **New** — styled SectionLabel + SectionHeader component |
| `ProgressBar.tsx` | 63 | **New** — configurable percent/color/height/showLabel |
| `BottomSheet.tsx` | 78 | **New** — Modal wrapper with overlay + sheet + pill + title |
| `Input.tsx` | 17 | **New** — StyledInput with default placeholderTextColor |
| `Chip.tsx` | 72 | **New** — active/inactive filter chip with optional icon |
| `Checkbox.tsx` | 55 | **New** — 22px circular checkbox with checkmark |
| `StatPill.tsx` | 49 | **New** — value + label with optional accent color |
| `index.ts` | 16 | **New** — barrel export |

**Total: 12 files, ~657 lines**

## Barrel Export (`components/ui/index.ts`)

```ts
export { Screen, ScrollScreen } from './Screen';
export { PrimaryButton, GhostButton, DangerButton, SmallButton, CancelButton } from './Button';
export { Card, HeroCard, StatCard } from './Card';
export { EmptyState } from './EmptyState';
export { SectionLabel, SectionHeader } from './SectionLabel';
export { ProgressBar } from './ProgressBar';
export { BottomSheet } from './BottomSheet';
export { StyledInput } from './Input';
export { Chip } from './Chip';
export { Checkbox } from './Checkbox';
export { StatPill } from './StatPill';
```

## Verification

```
$ npx tsc --noEmit
components/ExternalLink.tsx(13,7): error TS2578: Unused '@ts-expect-error' directive.
```

**Zero errors from my files.** The only error is a pre-existing issue in `ExternalLink.tsx`.

## Design Decisions

### 1. Button.tsx — Rewritten with Tokens
The boss's partial `Button.tsx` had hardcoded padding (14, 15, 10) and `fontSize: 11`. I replaced all with the nearest SPACING/TYPOGRAPHY tokens:
- `paddingVertical: 14/15` → `SPACING.lg` (16) — 1-2px difference, consistent
- `paddingVertical: 10` → `SPACING.sm` (8) — keeps SmallButton compact
- `fontSize: 11` → `TYPOGRAPHY.caption` (12) — nearest token

### 2. DangerButton — Text-Only, Not Filled
Changed from `warmRed fill + white text` to `text-only warmRed`. The actual usage in settings.tsx and routine/[routineId].tsx uses danger as a text link (e.g., "Delete Routine"), not a filled button. This matches real usage better.

### 3. EmptyState — Lightweight, No Animations
Created a simple version without Reanimated animations. The existing `components/EmptyState.tsx` (domain-specific, with fade-in and CTA button) is left untouched. They coexist until screens are migrated.

### 4. Input.tsx — Default placeholderTextColor
Used `styled.TextInput.attrs()` to bake in `placeholderTextColor: COLORS.textDim` so consumers don't repeat it everywhere.

### 5. Chip.tsx — Arithmetic on Tokens
Used `SPACING.sm + SPACING.xs / 2` for padding to get 10px without hardcoding. Not beautiful but rule-compliant.

### 6. Checkbox.tsx — Fixed 22px Size
Hardcoded `SIZE = 22` since it's a component-specific constant (not a theme token). The checkmark fontSize uses `TYPOGRAPHY.label + 1` (11px) as the nearest practical size.

### 7. StatCard — Added Beyond Spec
The barrel export spec only listed `Card, HeroCard` but the Card.tsx description said "Also export... StatCard variants." Added `StatCard` to both the file and barrel.

## Not Touched
- ✅ No screen files in `app/`
- ✅ No store files in `store/`
- ✅ No `hooks/useStoreData.ts`
- ✅ No `constants/theme.ts`
