# Agent B2 — Authentication System — DONE ✅

## Completed: 2026-04-08

## Files Created

| File | Purpose |
|---|---|
| `app/core/__init__.py` | Core package init |
| `app/core/security.py` | bcrypt password hashing + JWT access/refresh token creation/decoding |
| `app/core/deps.py` | `get_current_user` FastAPI dependency (OAuth2PasswordBearer) |
| `app/schemas/__init__.py` | Schemas package init |
| `app/schemas/auth.py` | Pydantic schemas: RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse, UsernameCheckResponse, UpdateProfileRequest |
| `app/api/__init__.py` | API package init |
| `app/api/auth.py` | 6 auth endpoints (register, login, refresh, me, check-username, update-profile) |

## Files Modified

| File | Change |
|---|---|
| `app/main.py` | Wired auth router with `app.include_router(auth_router, prefix="/auth", tags=["Auth"])` |
| `.env` | Generated real SECRET_KEY (64-char hex) |

## Endpoints Verified

| Endpoint | Method | Auth | Status | Test Result |
|---|---|---|---|---|
| `/auth/register` | POST | No | 201 | ✅ Returns JWT pair |
| `/auth/register` (duplicate) | POST | No | 409 | ✅ "Username already taken" |
| `/auth/register` (bad format) | POST | No | 422 | ✅ Validates underscore prefix |
| `/auth/login` | POST | No | 200 | ✅ Returns JWT pair, updates last_login |
| `/auth/login` (bad password) | POST | No | 401 | ✅ "Invalid username or password" |
| `/auth/refresh` | POST | No | 200 | ✅ Returns new JWT pair |
| `/auth/me` | GET | Yes | 200 | ✅ Returns full user profile |
| `/auth/me` (bad token) | GET | Yes | 401 | ✅ "Invalid or expired token" |
| `/auth/check-username/{username}` | GET | No | 200 | ✅ available: true/false |
| `/auth/update-profile` | PATCH | Yes | 200 | ✅ Updates display_name, visibility prefs |

## Technical Notes

- Used `bcrypt` library directly (not passlib) due to passlib/bcrypt version incompatibility on Python 3.14
- JWT tokens: access = 24h, refresh = 30 days (configurable via .env)
- Usernames are auto-lowercased on registration and login
- `password_hash` column is String(128) — bcrypt hashes are 60 chars, fits fine
- `get_current_user` dependency is exported from `app.core.deps` for other agents (B3, etc.)

## Dependencies for Other Agents

- **B3 (Backup API)**: Import `get_current_user` from `app.core.deps`
- **B6 (Mobile)**: Auth endpoints are at `/auth/*` — register returns 201, login returns 200
