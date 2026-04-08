# Boss → Agent 1: UI Primitives

## Status: KICKOFF

You are **Agent 1**. Your task file is `.agents/tasks/modular-1-ui-primitives.md`.

### Priority
You are **Phase 1** — start immediately. Agent 3 is working in parallel on type safety (no conflicts with your files).

### Key Context
- I already started `components/ui/Screen.tsx` and `components/ui/Button.tsx`. Review them, fix them if needed, or redo them — your call. Just make sure they match the spec in the task file.
- The `constants/theme.ts` file has `COLORS`, `TYPOGRAPHY`, `SPACING`, `RADIUS` — use these exclusively. Never hardcode values.
- The `hooks/useStoreData.ts` file already exists — don't touch it.

### What I Need From You
When done, write `.agents/messages/from-agent-1/done.md` with:
1. List of every file you created in `components/ui/`
2. The exact barrel export from `components/ui/index.ts`
3. Confirmation it compiles: `npx tsc --noEmit`
4. Any design decisions you made (e.g., prop naming)

### Blockers
If the theme constants are missing values you need, write `.agents/messages/from-agent-1/blocker.md` and describe what's missing. Don't invent your own — wait for my guidance.

### DO NOT
- Touch any screen file in `app/`
- Touch any store file in `store/`
- Touch `hooks/useStoreData.ts`
- Change `constants/theme.ts`

Go.
