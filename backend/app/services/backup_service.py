import json
import uuid
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.backup import Backup
from app.schemas.backup import BackupUpload
from app.config import get_settings


async def create_backup(
    db: AsyncSession,
    user_id: uuid.UUID,
    upload: BackupUpload,
) -> Backup:
    """Create a new backup and prune old ones beyond the limit."""
    size_bytes = len(json.dumps(upload.data).encode("utf-8"))

    backup = Backup(
        user_id=user_id,
        data=upload.data,
        app_version=upload.app_version,
        size_bytes=size_bytes,
        is_auto=upload.is_auto,
    )
    db.add(backup)
    await db.flush()

    # Prune: keep only the latest MAX_BACKUPS_PER_USER backups for this user
    settings = get_settings()
    max_backups = settings.MAX_BACKUPS_PER_USER

    # Get IDs of backups to keep (most recent N)
    keep_subq = (
        select(Backup.id)
        .where(Backup.user_id == user_id)
        .order_by(Backup.created_at.desc())
        .limit(max_backups)
        .subquery()
    )

    # Delete anything not in the keep list
    await db.execute(
        delete(Backup).where(
            Backup.user_id == user_id,
            Backup.id.notin_(select(keep_subq.c.id)),
        )
    )

    return backup


async def list_backups(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[Backup]:
    """Return all backups for a user, newest first."""
    result = await db.execute(
        select(Backup)
        .where(Backup.user_id == user_id)
        .order_by(Backup.created_at.desc())
    )
    return list(result.scalars().all())


async def get_backup(
    db: AsyncSession,
    backup_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Backup | None:
    """Fetch a single backup, only if it belongs to the user."""
    result = await db.execute(
        select(Backup).where(
            Backup.id == backup_id,
            Backup.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_latest_backup(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> Backup | None:
    """Fetch the most recent backup for a user."""
    result = await db.execute(
        select(Backup)
        .where(Backup.user_id == user_id)
        .order_by(Backup.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def delete_backup(
    db: AsyncSession,
    backup_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """Delete a backup. Returns True if deleted, False if not found."""
    backup = await get_backup(db, backup_id, user_id)
    if not backup:
        return False
    await db.delete(backup)
    await db.flush()
    return True
