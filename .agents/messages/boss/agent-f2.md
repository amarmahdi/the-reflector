# Boss → Agent F2: Ghost of Yesterday

## Status: KICKOFF ✅

You are **Agent F2**. Your task file is `.agents/tasks/feat-2-ghost-yesterday.md`.

### Context
You're building a small but emotionally powerful component. No new store needed — just read existing grid and focus session data. This component sits on the home screen between the greeting and the focus hero card.

### Key Design Note
The card tone should feel **personal and direct**, like a coach talking to you. Not cruel, but honest. Use the user's own failure reasons (from GridDay.failureReason) against them.

### Available
- `useReflectorStore` for grids (check yesterday's GridDay), routines
- `useFocusStore` for yesterday's focus sessions
- `useJournalStore` for yesterday's journal entries
- `useGamificationStore` for currentStreak

### DO NOT
- Create any new stores
- Touch files outside your scope (GhostCard.tsx, ghostQuotes.ts, index.tsx)

Go.
