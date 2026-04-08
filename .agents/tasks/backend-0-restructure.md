---
description: "B0 — Restructure monorepo: move React Native app into mobile/ subfolder"
depends_on: []
agent: agent-b0
---

# B0 — Restructure Monorepo

## Objective

Move all React Native / Expo code from the repo root into a `mobile/` subfolder so that the final structure is:

```
the-reflector/
├── mobile/          ← All RN code lives here
├── backend/         ← FastAPI (built by other agents)
├── README.md        ← Root-level README (keep at root)
├── .gitignore       ← Root-level gitignore (update)
```

## What to Move

Everything currently at the repo root EXCEPT:
- `.git/` — DO NOT TOUCH
- `.gitignore` — keep at root but update paths
- `README.md` — keep at root
- `.agents/` — keep at root (shared agent infra)
- `backend/` — leave alone (other agents build this)

Everything else goes into `mobile/`:
- `app/` (expo-router pages)
- `assets/`
- `components/`
- `constants/`
- `hooks/`
- `lib/`
- `store/`
- `types/`
- `scripts/`
- `package.json`, `package-lock.json`
- `tsconfig.json`
- `app.json`
- `babel.config.js`
- `metro.config.js` (if exists)
- `.vscode/` (move into mobile/)
- `android/`, `ios/` (generated, in .gitignore, but move if present)
- `node_modules/` (in .gitignore, skip)
- Any other config files at root (`tailwind.config.js`, etc.)
- Test files (`req-test.js`, `test-audio.js`, `test-yt-ext.mjs`)

## Steps

1. Create `mobile/` directory
2. Move all items listed above into `mobile/`
3. Update `mobile/tsconfig.json` — path aliases should still work since they're relative to the tsconfig location
4. Verify `mobile/app.json` and `mobile/package.json` don't need path changes
5. Update root `.gitignore`:
   - Prefix mobile-specific ignores with `mobile/` (e.g. `mobile/node_modules/`, `mobile/.expo/`, `mobile/android/`, `mobile/ios/`)
   - Add `backend/` ignores: `backend/__pycache__/`, `backend/.env`, `backend/venv/`
6. Run `cd mobile && npm install` to regenerate node_modules
7. Run `cd mobile && npx tsc --noEmit` to verify zero TypeScript errors
8. Run `cd mobile && npx expo doctor` (if available) to check config

## Critical Rules

- **DO NOT** break any import paths. All `@/` imports resolve relative to `tsconfig.json` which is now inside `mobile/`. They should work automatically.
- **DO NOT** modify any source code files. This is a MOVE-ONLY operation.
- **DO NOT** touch `.git/` or git history.
- The `android/` folder may exist locally (it's in .gitignore). If present, move it too.

## Verification

```bash
cd mobile && npx tsc --noEmit   # Must be 0 errors
cd mobile && npm run android     # Should still build (if device connected)
```

## Done Criteria

Write completion report to `.agents/messages/from-agent-b0/done.md` confirming:
- All files moved
- TSC passes
- No broken imports
