# Boss Handoff — Context for Agents B2, B3, B4, B5, B6

## Status

✅ **B0 — Monorepo restructure COMPLETE**
✅ **B1 — Backend scaffold + DB COMPLETE**

---

## What's Already Done

### Repo Structure
```
the-reflector/
├── mobile/          ← All React Native (Expo) code lives here
├── backend/         ← FastAPI lives here
├── .agents/         ← Agent task files and messages
├── .gitignore       ← Updated for monorepo
└── README.md
```

### Backend Foundation (`backend/`)
- `app/main.py` — FastAPI app, CORS enabled, `/health` route
- `app/config.py` — Pydantic Settings, reads from `.env`
- `app/database.py` — **Lazy** async SQLAlchemy engine + `get_db()` dependency
- `app/models/user.py` — `User` model (UUID PK, unique username, visibility prefs, parental mode)
- `app/models/backup.py` — `Backup` model (JSONB data, user FK, is_auto flag)
- `app/models/__init__.py` — imports both models for Alembic discovery
- `alembic/` — configured with psycopg2 sync driver for migrations
- **`alembic upgrade head` has been run — tables are LIVE on the real database**

### Database (DigitalOcean Managed PostgreSQL)
- Host: `db-postgresql-tor1-76737-do-user-29306418-0.d.db.ondigitalocean.com`
- Port: `25060`
- User: `doadmin`
- Database: `defaultdb`
- SSL: required
- **Tables created:** `users`, `backups` (with all indexes)

### Environment
- Python venv at `backend/venv/` — all packages installed
- `backend/.env` — contains real DATABASE_URL (asyncpg format for app runtime)
- For Alembic migration commands, prefix with `DATABASE_URL="postgresql://..."` (psycopg2 format)

---

## Rules for All Agents

1. **All backend work goes in `backend/`**
2. **All mobile work goes in `mobile/`**
3. Always `cd backend && source venv/bin/activate` before running Python commands
4. `get_db()` is an **async generator** — always use `async with` or as a FastAPI `Depends`
5. `Base` is imported from `app.database` — never re-declare it
6. Wire new routers into `app/main.py` using `app.include_router()`
7. Write a completion receipt to `.agents/messages/from-agent-<id>/done.md` when done

---

## Agent B2 — Auth System

See full task: `.agents/tasks/backend-2-auth.md`

**Your deliverables:**
- `app/core/security.py` — bcrypt + JWT
- `app/core/deps.py` — `get_current_user` FastAPI dependency  
- `app/schemas/auth.py` — Pydantic request/response schemas
- `app/api/auth.py` — 6 endpoints (register, login, refresh, me, check-username, update-profile)
- Wire router into `app/main.py`

**Username rules:** lowercase, 3-30 chars, alphanumeric + underscores only, must not start with underscore.

---

## Agent B3 — Backup API

**Depends on: B2 done first** (needs `get_current_user`)

See full task: `.agents/tasks/backend-3-backup.md`

**Your deliverables:**
- `app/schemas/backup.py`
- `app/services/backup_service.py`
- `app/api/backup.py` — 5 endpoints
- Wire router into `app/main.py`

---

## Agent B4 — AI Analysis

**Depends on: B1 done** (B2 optional but recommended)

See full task: `.agents/tasks/backend-4-ai.md`

**Your deliverables:**
- `app/core/ai.py` — Gemini client (`google-genai` already installed)
- `app/schemas/analysis.py`
- `app/services/analysis_service.py`
- `app/api/analysis.py` — 1 endpoint
- Wire router into `app/main.py`

**Gemini key is in `.env` as `GEMINI_API_KEY`. Model: `gemini-3-pro-preview`**

---

## Agent B5 — Docker + Deployment

**Depends on: B2, B3, B4 all done**

See full task: `.agents/tasks/backend-5-deployment.md`

**Your deliverables:**
- `backend/Dockerfile`
- `backend/docker-compose.yml`
- `backend/nginx.conf`
- `backend/deploy.sh` (chmod +x)

**Note:** No local PostgreSQL needed in Docker Compose — we use the managed DO database directly. Remove the `db` service from compose. Just `api` + `nginx`.

---

## Agent B6 — Mobile Integration

**Depends on: B2 done** (needs auth endpoint URLs)

See full task: `.agents/tasks/backend-6-mobile.md`

**All mobile work is in `mobile/` — always `cd mobile` first.**

**Your deliverables:**
- `mobile/lib/apiClient.ts` — fetch wrapper with JWT injection + auto-refresh
- `mobile/store/useAuthStore.ts` — Zustand auth store (persisted)
- `mobile/app/login.tsx` — Login/Register screen, sacred aesthetic
- `mobile/app/_layout.tsx` — Add auth gate
- `mobile/app/settings.tsx` — Add Account + Cloud Backup sections
- `mobile/lib/autoBackup.ts` — Background auto-backup service

**API base URL:** store in `mobile/.env` as `EXPO_PUBLIC_API_URL=http://<droplet-ip>:80`
