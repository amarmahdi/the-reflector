# Agent F4 — Done ✅

## Files Created (4)

| File | Lines | Purpose |
|------|-------|---------|
| `lib/momentumTiers.ts` | 98 | Tier definitions (6 tiers: Seed→Crown), type exports, `getTierForStreak()`, `getTierIndex()` |
| `hooks/useMomentumTier.ts` | 13 | Hook wrapping `useUserLevel().currentStreak` → `MomentumTier` via `useMemo` |
| `components/MomentumBadge.tsx` | 58 | Compact badge: `⚡ Lightning · Day 24`. Styled with tier's accent color. Self-hiding when streak=0 |
| `components/TierTransition.tsx` | 162 | Full-screen overlay for tier upgrades/degradation. Animates emoji scale + text fade. 3s auto-dismiss or tap |

## Files Modified (2)

| File | Changes |
|------|---------|
| `app/index.tsx` | Replaced static `🌱 X-day streak` with `<MomentumBadge />`. HeroCard gets dynamic `borderColor`, `shadowColor`, `shadowOpacity`, `shadowRadius`, `elevation` based on `tier.glowIntensity`. ProgressBar color shifts to `tier.accentColor` for tiers above Fire (glowIntensity > 0.4). |
| `app/_layout.tsx` | Added `useRef<number>` to track previous tier index. `useEffect` on `userStats.currentStreak` detects tier upgrades (non-seed) and degradation. Renders `<TierTransition />` overlay alongside `<AchievementToast />`. Added `useRef` to React imports. |

## Tier System Implemented

| Tier | Streak | Accent | Glow | Badge |
|------|--------|--------|------|-------|
| 🌱 Seed | 0-3 | `#1A6B3C` | None | — |
| 🌿 Sprout | 4-7 | `#27AE60` | Subtle 0.2 | 🌿 |
| 🌲 Growth | 8-14 | `#2ECC71` | Medium 0.4 | 🌲 |
| 🔥 Fire | 15-21 | `#F1C40F` | Strong 0.6 | 🔥 |
| ⚡ Lightning | 22-30 | `#9B59B6` | Animated 0.8 | ⚡ |
| 👑 Crown | 31-40 | `#FFD700` | Full 1.0 | 👑 |

## Decisions Made

1. **Tier colors in `lib/momentumTiers.ts`**: Per boss instructions, tier colors are completely separate from `constants/theme.ts`. No theme modifications.

2. **Drawer streak display**: Kept the drawer's `🌱 X-day streak` text as-is (not in my scope — it's in `CustomDrawerContent`, and the task only calls for index.tsx/layout changes). The MomentumBadge only replaces the home screen streak.

3. **Card glow via inline styles**: Used `style` prop overrides on `HeroCard` for dynamic glow rather than creating new styled component variants. This keeps the existing styled component intact while adding tier-responsive visuals.

4. **Progress bar color switching**: Only applied tier accent color to the progress bar for Fire tier and above (`glowIntensity > 0.4`) to avoid subtle green-on-green confusion at lower tiers.

5. **Tier degradation detection**: Compared `prevTierIdxRef.current` with the new index on every streak change. Degradation message includes both old and new tier names.

6. **Auto-dismiss timing**: 3 seconds as specified, with immediate tap-to-dismiss fallback.

## Not Touched

- ✅ `constants/theme.ts` — not modified
- ✅ DisciplineScore (Agent F1) — not touched
- ✅ Consequence Engine (Agent F3) — not touched
- ✅ No other screens beyond `index.tsx` and `_layout.tsx`
- ✅ No store logic changes

## Verification

```
npx tsc --noEmit — 0 errors in my files
Pre-existing: 3 errors in lib/seedData.ts (missing completedGridCount — not my scope)
```
