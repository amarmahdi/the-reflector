---
description: "B1 — Backend scaffold: FastAPI project, PostgreSQL models, Alembic migrations, config"
depends_on: [backend-0-restructure]
agent: agent-b1
---

# B1 — Backend Scaffold + Database + Config

## Objective

Create the full FastAPI project skeleton inside `backend/` with PostgreSQL models, async SQLAlchemy, Alembic migrations, and Pydantic settings.

## Project Structure to Create

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, CORS, lifespan, router mounting
│   ├── config.py               # Pydantic Settings from .env
│   ├── database.py             # Async SQLAlchemy engine + session + Base
│   ├── models/
│   │   ├── __init__.py         # Import all models for Alembic discovery
│   │   ├── user.py
│   │   └── backup.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── api/
│   │   └── __init__.py
│   ├── core/
│   │   └── __init__.py
│   └── services/
│       └── __init__.py
├── alembic/
│   ├── env.py
│   └── versions/               # Empty initially
├── alembic.ini
├── requirements.txt
├── .env.example
└── .env                        # Actual env (gitignored)
```

## Config — `app/config.py`

Use `pydantic-settings` to load from `.env`:

```python
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://reflector:changeme@db:5432/reflector"
    SECRET_KEY: str = "CHANGE-ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440   # 24h
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3-pro-preview"
    MAX_BACKUPS_PER_USER: int = 10
```

## Database — `app/database.py`

- Use `create_async_engine` with `asyncpg`
- Create `async_sessionmaker` with `AsyncSession`
- Create `Base` (DeclarativeBase)
- Create `get_db()` async generator dependency

## Models

### `app/models/user.py` — User

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `username` | String(30) | UNIQUE, indexed, lowercase, alphanumeric + underscore only |
| `display_name` | String(100) | |
| `password_hash` | String(128) | bcrypt hash |
| `is_profile_public` | Boolean | default False |
| `share_discipline` | Boolean | default False — share discipline score with followers |
| `share_streaks` | Boolean | default False — share streak data with followers |
| `parental_mode` | Boolean | default False — linked parent can see everything |
| `parent_user_id` | UUID | FK → users.id, nullable |
| `created_at` | DateTime(tz) | |
| `last_login` | DateTime(tz) | nullable |

### `app/models/backup.py` — Backup

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users.id, ON DELETE CASCADE, indexed |
| `data` | JSONB | Full Zustand store dumps |
| `app_version` | String(20) | |
| `size_bytes` | Integer | Calculated from JSON size |
| `is_auto` | Boolean | Auto vs manual backup |
| `created_at` | DateTime(tz) | |

Add composite index on `(user_id, created_at)` for efficient latest-backup queries.

## FastAPI App — `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="The Reflector API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Mobile app — all origins OK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "alive", "version": "1.0.0"}

# Mount routers (will be added by B2-B4 agents):
# app.include_router(auth_router, prefix="/auth", tags=["Auth"])
# app.include_router(backup_router, prefix="/backup", tags=["Backup"])
# app.include_router(analysis_router, prefix="/analyze", tags=["Analysis"])
# app.include_router(social_router, prefix="/social", tags=["Social"])
```

## Alembic Setup

1. Initialize alembic: `alembic init alembic`
2. Configure `alembic.ini` → `sqlalchemy.url` should read from env
3. Update `alembic/env.py` to:
   - Import `Base` from `app.database`
   - Import all models from `app.models`
   - Use async engine for migrations
4. Generate initial migration: `alembic revision --autogenerate -m "initial tables"`
5. Apply: `alembic upgrade head`

## Requirements — `requirements.txt`

```
fastapi[standard]==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.1
pydantic-settings==2.7.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
google-genai==1.0.0
httpx==0.28.1
python-multipart==0.0.20
```

## .env.example

```
DATABASE_URL=postgresql+asyncpg://reflector:changeme@db:5432/reflector
SECRET_KEY=replace-with-64-char-random-string
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-3-pro-preview
```

## Verification

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -c "from app.main import app; print('OK')"
```

## Done Criteria

Write completion report to `.agents/messages/from-agent-b1/done.md` confirming:
- All files created
- Models importable
- FastAPI app instantiates
- `/health` route responds
