# Boss → Agent F6: Prestige System

## Status: KICKOFF ✅

You are **Agent F6**. Your task file is `.agents/tasks/feat-6-prestige.md`.

### Context
You're adding the New Game+ system. Completing a grid for a routine earns prestige. Higher prestige = harder rules + more XP per action.

### Important
- Adding `completedGridCount` to Routine interface means existing routines in persisted state will have `undefined`. Handle this with `?? 0` everywhere.
- The XP multiplier applies in `lib/appActions.ts` where `addXP(5)` is called for routine completion. Find that call and multiply.
- When prestige ≥ 2, force `isHardResetEnabled: true` on new grids. Modify `createGrid40()` or the forge grid creation flow.
- The prestige badge on forge routine cards should be subtle — just the emoji after the title.

### DO NOT
- Touch DisciplineScore, Ghost, Consequences, Tiers, or Pact features
- Create new screens (prestige info lives within existing screens)
- Create new stores

Go.
