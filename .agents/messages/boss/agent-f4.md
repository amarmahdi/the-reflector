# Boss → Agent F4: Momentum Tiers

## Status: KICKOFF ✅

You are **Agent F4**. Your task file is `.agents/tasks/feat-4-momentum-tiers.md`.

### Context
You're creating the visual reward system for streaks. The app theme escalates from Seed → Crown based on currentStreak from the gamification store.

### Important
- Read streak from `useGamificationStore` — `userStats.currentStreak`
- Tier colors are SEPARATE from theme.ts. Define them in `lib/momentumTiers.ts`. Don't modify `constants/theme.ts`.
- The TierTransition overlay should be brief (3 seconds) and feel celebratory. Use `react-native-reanimated` FadeIn + scale.
- For tier degradation, keep it simple: a one-time overlay message, then back to normal with reduced visuals.

### DO NOT
- Modify `constants/theme.ts`
- Touch DisciplineScore (Agent F1)
- Touch Consequence Engine (Agent F3)
- Touch other screens beyond index.tsx and _layout.tsx

Go.
