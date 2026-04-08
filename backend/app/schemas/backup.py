from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class BackupUpload(BaseModel):
    data: dict
    app_version: str = "1.0.0"
    is_auto: bool = False


class BackupMeta(BaseModel):
    id: UUID
    app_version: str
    size_bytes: int
    is_auto: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class BackupFull(BackupMeta):
    data: dict
