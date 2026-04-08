# Task: Momentum Tiers (Visual Transformation)

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Overview
The app's visual theme escalates based on your streak. Longer streaks = more premium visuals. Breaking a streak degrades everything instantly.

## Tier System

| Tier | Streak | Key | Accent Color | Border Glow | Badge |
|------|--------|-----|-------------|-------------|-------|
| 🌱 Seed | 0-3 | `seed` | Default green | None | — |
| 🌿 Sprout | 4-7 | `sprout` | Brighter green | Subtle card glow | 🌿 |
| 🌲 Growth | 8-14 | `growth` | Emerald `#2ECC71` | Card + header glow | 🌲 |
| 🔥 Fire | 15-21 | `fire` | Gold `#F1C40F` | Strong glow, gold borders | 🔥 |
| ⚡ Lightning | 22-30 | `lightning` | Purple-gold gradient | Animated pulse glow | ⚡ |
| 👑 Crown | 31-40 | `crown` | Pure gold `#FFD700` | Full gold theme overlay | 👑 |

## Implementation

### 1. Create `lib/momentumTiers.ts`:
```ts
export type MomentumTierKey = 'seed' | 'sprout' | 'growth' | 'fire' | 'lightning' | 'crown';

export interface MomentumTier {
  key: MomentumTierKey;
  name: string;
  emoji: string;
  minStreak: number;
  accentColor: string;
  glowColor: string;       // for shadow/glow effects
  glowIntensity: number;   // 0 = none, 1 = max
  message: string;         // shown when tier changes
}

export const TIERS: MomentumTier[] = [
  { key: 'seed', name: 'Seed', emoji: '🌱', minStreak: 0, accentColor: '#1A6B3C', glowColor: 'rgba(26,107,60,0.12)', glowIntensity: 0, message: '' },
  { key: 'sprout', name: 'Sprout', emoji: '🌿', minStreak: 4, accentColor: '#27AE60', glowColor: 'rgba(39,174,96,0.15)', glowIntensity: 0.2, message: 'Growing. Keep it up.' },
  { key: 'growth', name: 'Growth', emoji: '🌲', minStreak: 8, accentColor: '#2ECC71', glowColor: 'rgba(46,204,113,0.2)', glowIntensity: 0.4, message: 'You\'re building something real.' },
  { key: 'fire', name: 'Fire', emoji: '🔥', minStreak: 15, accentColor: '#F1C40F', glowColor: 'rgba(241,196,15,0.2)', glowIntensity: 0.6, message: 'On fire. Don\'t stop now.' },
  { key: 'lightning', name: 'Lightning', emoji: '⚡', minStreak: 22, accentColor: '#9B59B6', glowColor: 'rgba(155,89,182,0.25)', glowIntensity: 0.8, message: 'UNSTOPPABLE.' },
  { key: 'crown', name: 'Crown', emoji: '👑', minStreak: 31, accentColor: '#FFD700', glowColor: 'rgba(255,215,0,0.3)', glowIntensity: 1.0, message: 'Royalty. You earned this.' },
];

export function getTierForStreak(streak: number): MomentumTier { ... }
export function getTierIndex(streak: number): number { ... }
```

### 2. Create hook: `hooks/useMomentumTier.ts`
```ts
export function useMomentumTier(): MomentumTier {
  const { currentStreak } = useUserLevel();
  return useMemo(() => getTierForStreak(currentStreak), [currentStreak]);
}
```

### 3. Create `components/MomentumBadge.tsx`:
A small badge that shows current tier emoji + name, displayed next to the streak counter:
```
⚡ Lightning · Day 24
```
Styled with the tier's accent color.

### 4. Create `components/TierTransition.tsx`:
A brief full-screen overlay shown when user reaches a new tier:
```
┌──────────────────────────────────┐
│                                  │
│            ⚡                    │
│                                  │
│        LIGHTNING                 │
│                                  │
│    "UNSTOPPABLE."                │
│                                  │
│    Day 22 streak                 │
│                                  │
└──────────────────────────────────┘
```
- Animated fade in with scale
- Auto-dismisses after 3 seconds or tap
- Uses `react-native-reanimated` for entrance animation

### 5. Tier Degradation
When streak breaks (detected in `_layout.tsx` or `appActions.ts`):
- Calculate previous tier and new tier
- If dropped, show a degradation overlay:
```
"You were at ⚡ Lightning.
Now you're back to 🌱 Seed.
Rebuild."
```
- Card borders across the app lose their glow
- Can use AsyncStorage flag `tier-dropped` to show this once

### 6. Home Screen Integration

In `app/index.tsx`:
- Replace the static streak display with `<MomentumBadge />`
- Cards get dynamic border/shadow based on tier's `glowColor` and `glowIntensity`
- Pass tier accent to the hero card's progress bar color

## Files to Create
1. `lib/momentumTiers.ts`
2. `hooks/useMomentumTier.ts`
3. `components/MomentumBadge.tsx`
4. `components/TierTransition.tsx`

## Files to Modify
1. `app/index.tsx` — add MomentumBadge, dynamic card glow
2. `app/_layout.tsx` — detect tier changes, show TierTransition overlay

## DO NOT
- Modify `constants/theme.ts` (tier colors are separate from the design system)
- Change store logic (reads streak from existing gamification store)
- Touch any other screens beyond index.tsx and _layout.tsx

---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-f4.md`

### When Done
Write your completion report to `.agents/messages/from-agent-f4/done.md`

### If Stuck
Write `.agents/messages/from-agent-f4/blocker.md`
