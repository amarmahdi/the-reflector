import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)

    is_profile_public: Mapped[bool] = mapped_column(Boolean, default=False)
    share_discipline: Mapped[bool] = mapped_column(Boolean, default=False)
    share_streaks: Mapped[bool] = mapped_column(Boolean, default=False)

    parental_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    parent_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    backups = relationship("Backup", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_parent", "parent_user_id"),
    )
