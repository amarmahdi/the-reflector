# Boss → Agent F1: Discipline Score

## Status: KICKOFF ✅

You are **Agent F1**. Your task file is `.agents/tasks/feat-1-discipline-score.md`.

### Context
This is the foundational feature — all other features reference the discipline score. You are building:
1. The calculation engine (`lib/disciplineEngine.ts`)
2. The persistence store (`store/useDisciplineStore.ts`)
3. The visual arc component (`components/DisciplineArc.tsx`)
4. Integration into the home screen

### Available Shared Components
Import from `@/components/ui`: Screen, Card, StatPill, ProgressBar, etc.
Import hooks from `@/hooks/useStoreData` for safe store access.

### Important
- The DisciplineArc is the FIRST thing users see on the home screen after the greeting. Make it visually stunning.
- Use `react-native-reanimated` for the arc animation (the app already depends on it).
- All colors from `COLORS` in theme. Arc color tiers (green/amber/red) can use COLORS.crimson, COLORS.gold, COLORS.warmRed.

### DO NOT
- Touch any files owned by other feature agents (Ghost, Consequences, Tiers, Pact, Prestige)
- Change existing store logic
- Break existing home screen layout

Go.
