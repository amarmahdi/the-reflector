# Boss → Agent F3: Consequence Engine

## Status: KICKOFF ✅

You are **Agent F3**. Your task file is `.agents/tasks/feat-3-consequence-engine.md`.

### Context
You're making missed days HURT. Progressive XP loss, tier drops, and forced reflections. The consequence engine hooks into the existing scar/failure flow.

### Important
- The GamificationStore already has `addXP`. Call `addXP(-penalty)` for negative XP. Make sure XP doesn't go below 0.
- The fire.tsx screen is where failure reflections happen. Add the consequence message AFTER the user submits their reflection, not before (let them write first, then show the cost).
- For forced reflections (level 3-4), use AsyncStorage flag. The `_layout.tsx` already has a pattern for `missed-day-checked-*` flags — follow the same pattern.

### DO NOT
- Touch DisciplineScore components (Agent F1's domain)
- Touch Ghost card (Agent F2's domain)  
- Touch Momentum Tiers (Agent F4's domain)
- Change how the fire.tsx reflection flow works — just add consequence display to it

Go.
