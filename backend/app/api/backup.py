import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.backup import BackupUpload, BackupMeta, BackupFull
from app.services import backup_service

router = APIRouter()


@router.post("/", response_model=BackupMeta, status_code=status.HTTP_201_CREATED)
async def upload_backup(
    payload: BackupUpload,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload full app state as a new backup."""
    backup = await backup_service.create_backup(db, user.id, payload)
    return backup


@router.get("/", response_model=list[BackupMeta])
async def list_backups(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all backups for the current user (newest first)."""
    return await backup_service.list_backups(db, user.id)


@router.get("/latest", response_model=BackupFull)
async def get_latest_backup(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the most recent full backup. 404 if none exist."""
    backup = await backup_service.get_latest_backup(db, user.id)
    if not backup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No backups found",
        )
    return backup


@router.get("/{backup_id}", response_model=BackupFull)
async def get_backup(
    backup_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a specific backup by ID."""
    backup = await backup_service.get_backup(db, backup_id, user.id)
    if not backup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found",
        )
    return backup


@router.delete("/{backup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_backup(
    backup_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a specific backup."""
    deleted = await backup_service.delete_backup(db, backup_id, user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found",
        )
