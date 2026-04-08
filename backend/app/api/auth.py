from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.deps import get_current_user
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
    UsernameCheckResponse,
    UpdateProfileRequest,
    USERNAME_REGEX,
)

router = APIRouter()


def _validate_username(username: str) -> str:
    """Validate and normalize username. Returns lowercased username or raises 422."""
    username = username.lower().strip()

    if not USERNAME_REGEX.match(username):
        raise HTTPException(
            status_code=422,
            detail="Username must be 3-30 characters, lowercase alphanumeric and underscores only",
        )

    if username.startswith("_"):
        raise HTTPException(
            status_code=422,
            detail="Username must not start with an underscore",
        )

    return username


def _user_to_response(user: User) -> UserResponse:
    """Convert a User model instance to a UserResponse schema."""
    return UserResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        is_profile_public=user.is_profile_public,
        share_discipline=user.share_discipline,
        share_streaks=user.share_streaks,
        parental_mode=user.parental_mode,
        created_at=user.created_at.isoformat(),
    )


# ──────────────────────────────────────────────
# POST /auth/register
# ──────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    username = _validate_username(body.username)

    # Check uniqueness
    existing = await db.execute(select(User).where(User.username == username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        username=username,
        display_name=body.display_name.strip(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.flush()  # Populate user.id before commit

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ──────────────────────────────────────────────
# POST /auth/login
# ──────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.username == body.username.lower().strip())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Update last_login timestamp
    user.last_login = datetime.now(timezone.utc)

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ──────────────────────────────────────────────
# POST /auth/refresh
# ──────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Verify user still exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ──────────────────────────────────────────────
# GET /auth/me
# ──────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return _user_to_response(current_user)


# ──────────────────────────────────────────────
# GET /auth/check-username/{username}
# ──────────────────────────────────────────────
@router.get("/check-username/{username}", response_model=UsernameCheckResponse)
async def check_username(username: str, db: AsyncSession = Depends(get_db)):
    username = username.lower().strip()

    # Check format validity — if invalid format, it's "available: false" conceptually,
    # but we return available=false with the normalized username
    if not USERNAME_REGEX.match(username) or username.startswith("_"):
        return UsernameCheckResponse(username=username, available=False)

    result = await db.execute(select(User).where(User.username == username))
    taken = result.scalar_one_or_none() is not None

    return UsernameCheckResponse(username=username, available=not taken)


# ──────────────────────────────────────────────
# PATCH /auth/update-profile
# ──────────────────────────────────────────────
@router.patch("/update-profile", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.display_name is not None:
        current_user.display_name = body.display_name.strip()

    if body.is_profile_public is not None:
        current_user.is_profile_public = body.is_profile_public

    if body.share_discipline is not None:
        current_user.share_discipline = body.share_discipline

    if body.share_streaks is not None:
        current_user.share_streaks = body.share_streaks

    if body.parental_mode is not None:
        current_user.parental_mode = body.parental_mode

    if body.parent_username is not None:
        # Look up parent user by username
        result = await db.execute(
            select(User).where(User.username == body.parent_username.lower().strip())
        )
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent user not found")
        current_user.parent_user_id = parent.id

    return _user_to_response(current_user)
