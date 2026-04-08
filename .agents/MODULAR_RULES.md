# Modularization Rules — READ BEFORE ANY CHANGES

## Golden Rules

1. **NEVER define a styled component inline in a screen if it already exists in `components/ui/`.**
   Import it instead: `import { PrimaryButton, SectionLabel, Card } from '@/components/ui';`

2. **NEVER call a store getter function inside a Zustand selector.**
   ```ts
   // ❌ WRONG — causes infinite re-render loop
   const value = useFocusStore((s) => s.getTodayFocusMinutes());
   
   // ✅ CORRECT — use the hook from hooks/
   import { useTodayFocusMinutes } from '@/hooks/useStoreData';
   const value = useTodayFocusMinutes();
   ```

3. **NEVER use `styled.X` as a JSX element when `styled` is from `styled-components/native`.**
   ```ts
   // ❌ WRONG — styled here is the styled-components factory, not RN
   <styled.Pressable onPress={...} />
   
   // ✅ CORRECT — use the RN component directly
   import { Pressable } from 'react-native';
   <Pressable onPress={...} />
   ```

4. **ALWAYS use types from `@/types/models` for data. Never use `any` or untyped objects.**

5. **ALWAYS use `COLORS`, `TYPOGRAPHY`, `SPACING`, `RADIUS` from `@/constants/theme`.**
   Never hardcode `#xxxxxx`, `rgba()`, font sizes, or spacing values.

6. **ALWAYS import from barrel files.** `@/components/ui` not `@/components/ui/PrimaryButton`.

## File Structure After Modularization

```
components/
  ui/                         ← ALL reusable UI primitives
    index.ts                  ← barrel export
    Screen.tsx                ← screen wrapper with background
    Card.tsx                  ← base card, hero card variants  
    Button.tsx                ← PrimaryButton, GhostButton, DangerButton, SmallButton
    EmptyState.tsx            ← icon + title + subtitle empty state
    SectionLabel.tsx          ← uppercase section header with optional line
    ProgressBar.tsx           ← track + fill, configurable color/size
    BottomSheet.tsx           ← modal overlay + sheet + pill + title
    Input.tsx                 ← styled text input with border
    Chip.tsx                  ← filter chip, time block chip, tag chip
    Checkbox.tsx              ← check circle with checkmark

hooks/
  useStoreData.ts             ← typed store hooks (safe getters)

constants/
  theme.ts                    ← COLORS, TYPOGRAPHY, SPACING, RADIUS (existing)
```

## Import Convention

```ts
// UI components
import { Screen, Card, PrimaryButton, SectionLabel, EmptyState } from '@/components/ui';

// Store hooks
import { useTodayFocusMinutes, useActiveGrids } from '@/hooks/useStoreData';

// Theme
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

// Types
import type { DailyTodo, Grid40, Routine } from '@/types/models';
```
