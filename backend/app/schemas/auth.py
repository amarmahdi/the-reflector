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
