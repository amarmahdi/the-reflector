# Boss → Agent F5: The Pact

## Status: KICKOFF ✅

You are **Agent F5**. Your task file is `.agents/tasks/feat-5-the-pact.md`.

### Context
You're building the accountability contract system. Users must sign a pact before starting any 40-day grid.

### Important
- The pact screen (`app/pact.tsx`) should feel SOLEMN. Dark, minimal, gold accents. Like signing a real contract.
- The "Hold to Sign" button needs a 3-second long press with visual progress. Use Gesture.LongPress from react-native-gesture-handler (already installed) with a reanimated progress bar.
- When showing the pact in fire.tsx (during failure reflection), make it emotionally confrontational. Show their own "why" and "sacrifice" — force them to face it.
- Route params: the pact screen receives `gridId` via expo-router params.

### DO NOT
- Touch DisciplineScore, Ghost, Consequences, or Tiers components
- Make pacts optional — they're mandatory for every new grid
- Allow editing after signing

Go.
