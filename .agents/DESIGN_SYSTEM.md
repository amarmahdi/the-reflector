# The Reflector — Sacred Growth Design System

## Philosophy
The Reflector is a **spiritual discipline practice tool**. The green accent represents **growth, nature, renewal** — not branding. The dark theme creates **focus and introspection**. The overall feel should be a **calm meditation hall**, not a military boot camp.

**Tone:** Warm, wise, encouraging. A gentle guide, not a drill sergeant.

## ⚠️ CRITICAL: What Changed From Before
- **STOP making EVERYTHING UPPERCASE WEIGHT 900 LETTER-SPACING 4PX** — that was screaming at users
- Only use UPPERCASE for small ≤10px labels and badge text
- Screen titles: Title Case, weight 700, letter-spacing 1px
- Section headers: UPPERCASE okay, weight 600, letter-spacing 2px, size 10px
- Body text: Normal case, weight 500, 14px
- Generous spacing everywhere — breathing room
- Rounded corners: 14-20px on cards (not 6-8px)
- Subtle borders or none (not harsh lines)

## Color Usage
```typescript
import { COLORS } from '@/constants/theme';
```

| Token | Hex | Use For |
|-------|-----|---------|
| `surface0` | #0A0A0A | Screen background |
| `surface1` | #111111 | Card background |
| `surface2` | #181818 | Input fields, elevated elements |
| `surface3` | #202020 | Modals, overlays |
| `crimson` | #1A6B3C | Primary actions, progress, CTA buttons |
| `crimsonGlow` | rgba(26,107,60,0.12) | Button backgrounds, active states |
| `crimsonSoft` | rgba(26,107,60,0.06) | Very subtle highlights |
| `gold` | #C4A35A | Achievements, warnings, XP |
| `softBlue` | #4A7B9D | Focus timer, informational |
| `warmRed` | #8B4A4A | Destructive actions, scars |
| `textPrimary` | #F0EDE8 | Main text (warm white) |
| `textSecondary` | #A8A49E | Secondary text, descriptions |
| `textDim` | #5A5652 | Labels, hints, timestamps |
| `border` | #1C1C1C | Card borders (subtle) |

## Typography Rules

```
Screen Title:    20px, weight 700, letter-spacing 1px, Title Case
Section Label:   10px, weight 600, letter-spacing 2px, UPPERCASE
Card Title:      15px, weight 600, letter-spacing 0.5px, Title Case
Body:            14px, weight 500, letter-spacing 0.3px, Normal case
Caption:         12px, weight 500, letter-spacing 0.5px, Normal case
Stat Number:     28px, weight 900, letter-spacing 0px
Small Label:     10px, weight 600, letter-spacing 1.5px, UPPERCASE
Micro Badge:     8px, weight 700, letter-spacing 1px, UPPERCASE
```

## Card Style
```css
background-color: ${COLORS.surface1};
border-radius: 14px;
border-width: 1px;
border-color: ${COLORS.border};
padding: 16px;
```
- NO harsh borders — borders should be barely visible
- Cards float softly on the background
- Use margin 12px between cards

## Button Styles

**Primary (green):**
```css
background-color: ${COLORS.crimson};
border-radius: 14px;
padding: 16px 24px;
```
Label: 13px, weight 700, letter-spacing 1px, UPPERCASE, white

**Ghost:**
```css
border: 1px solid ${COLORS.border};
border-radius: 14px;
padding: 14px 24px;
background: transparent;
```
Label: 13px, weight 600, letter-spacing 1px, textSecondary

**Destructive:**
```css
border: 1px solid ${COLORS.warmRed};
border-radius: 14px;
background: ${COLORS.warmRedGlow};
```
Label: warmRed color

## Empty States
When a screen has no data, show:
- A soft emoji or icon (not aggressive)
- A warm, encouraging message in normal case
- "Your journey starts here — create your first routine"
- A clear CTA button to take action
- DO NOT show "NOTHING TO SHOW" or empty grids of zeros

## Interactions
- `import { haptic } from '@/lib/haptics'` — use on all taps
- Animations: `react-native-reanimated`, use springs (damping: 15-20, stiffness: 100-150)
- Entrance animations: fade in + slight translateY (20px, 300ms)
- Button press: scale to 0.97 with spring

## Tab Structure (4 tabs)
1. **Home** (`index.tsx`) — Daily command center
2. **Forge** (`forge.tsx`) — Routine management & grid dashboard
3. **Focus** (`focus.tsx`) — Timer & sessions
4. **You** (`profile.tsx`) — Profile, settings, links to journal/achievements

## Screen Templates

### Screen Container
```tsx
const Screen = styled.View`
  flex: 1;
  background-color: ${COLORS.surface0};
`;
```

### Page Header (inside ScrollView)
```tsx
const PageHeader = styled.View`
  padding: 20px 20px 16px;
`;

const PageTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const PageSubtitle = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
`;
```

### Section
```tsx
const SectionLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
  padding: 0 20px;
`;
```

## DO NOT
- Use `StyleSheet.create` — use only `styled-components/native`
- Make body text uppercase
- Use weight 900 for anything except stat numbers
- Use letter-spacing > 2px except for micro labels
- Show empty grids of zeros on first use
- Make aggressive error messages — be warm and guiding
