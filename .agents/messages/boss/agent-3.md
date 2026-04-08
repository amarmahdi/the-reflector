# Boss → Agent 3: Type Safety

## Status: KICKOFF

You are **Agent 3**. Your task file is `.agents/tasks/modular-3-type-safety.md`.

### Priority
You are **Phase 1** — start immediately. Agent 1 is working in parallel on UI primitives (no conflicts with your files).

### Key Context
- There are 5 stores: `useReflectorStore`, `useFocusStore`, `useJournalStore`, `useGamificationStore`, `useAlarmStore`
- The seed data file is `lib/seedData.ts` — it writes to AsyncStorage using keys that MUST match each store's `persist()` name
- We've already had crashes from mismatched keys (`sessions` vs `focusSessions`) and wrong types (`{}` vs `[]` for `dailyCheckIns`)
- Your job: make those mismatches impossible by enforcing TypeScript types

### What I Need From You
When done, write `.agents/messages/from-agent-3/done.md` with:
1. List of every store interface you exported
2. The `store/keys.ts` file contents
3. Confirmation seed data compiles: `npx tsc --noEmit`
4. List of any type errors you found and fixed in the seed data
5. List of unused components you deleted (if any)

### Critical Rule
- When creating `store/keys.ts`, verify the ACTUAL persist key each store uses by reading the `persist()` call. Don't guess.
- The seed data in `lib/seedData.ts` uses `AsyncStorage.multiSet` — all keys there must match `store/keys.ts`

### DO NOT
- Touch any screen file in `app/`
- Touch `components/ui/` (that's Agent 1's domain)
- Touch `hooks/useStoreData.ts`
- Change store logic — only add `export` to interfaces and import/use `STORE_KEYS`

Go.
