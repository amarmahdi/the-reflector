import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class Backup(Base):
    __tablename__ = "backups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    app_version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0.0")
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_auto: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="backups")

    __table_args__ = (
        Index("ix_backups_user_created", "user_id", "created_at"),
    )
