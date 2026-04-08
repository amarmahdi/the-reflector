---
description: "B2 — Authentication: JWT, unique usernames, register/login/refresh/profile"
depends_on: [backend-1-scaffold]
agent: agent-b2
---

# B2 — Authentication System

## Objective

Build the full auth system: unique Instagram-style usernames, bcrypt password hashing, JWT access + refresh tokens, and user profile management.

## Files to Create

### `backend/app/core/security.py`

Password + JWT utilities:

```python
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
```

### `backend/app/core/deps.py`

FastAPI dependencies:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.security import decode_token
from app.models.user import User
from sqlalchemy import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

### `backend/app/schemas/auth.py`

```python
from pydantic import BaseModel, Field
import re

USERNAME_REGEX = re.compile(r'^[a-z0-9_]{3,30}$')

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    display_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str
    is_profile_public: bool
    share_discipline: bool
    share_streaks: bool
    parental_mode: bool
    created_at: str

class UsernameCheckResponse(BaseModel):
    username: str
    available: bool

class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    is_profile_public: bool | None = None
    share_discipline: bool | None = None
    share_streaks: bool | None = None
    parental_mode: bool | None = None
    parent_username: str | None = None   # Link to parent by username
```

### `backend/app/api/auth.py`

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /auth/register` | POST | No | Create new user. Validate username format (lowercase, alphanum + underscore, 3-30 chars). Return JWT pair. |
| `POST /auth/login` | POST | No | Verify username + password. Update `last_login`. Return JWT pair. |
| `POST /auth/refresh` | POST | No | Accept refresh_token, validate, return new access_token. |
| `GET /auth/me` | GET | Yes | Return current user profile. |
| `GET /auth/check-username/{username}` | GET | No | Check if username is available. |
| `PATCH /auth/update-profile` | PATCH | Yes | Update display_name, visibility prefs, parental settings. |

## Username Validation Rules

- Lowercase only (auto-lowercase on registration)
- 3-30 characters
- Only alphanumeric + underscores
- Must not start with underscore
- Must be unique (DB constraint handles this too)
- Return 409 Conflict if username taken

## Wire into `app/main.py`

Uncomment and add:
```python
from app.api.auth import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
```

## Verification

Test with curl:
```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"amar","display_name":"Amar","password":"test123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"amar","password":"test123"}'

# Check username
curl http://localhost:8000/auth/check-username/amar

# Get profile (with token)
curl -H "Authorization: Bearer <token>" http://localhost:8000/auth/me
```

## Done Criteria

Write completion report to `.agents/messages/from-agent-b2/done.md` confirming:
- All 6 endpoints working
- JWT generation + validation working
- Username validation (format + uniqueness) working
- Password hashing with bcrypt working
