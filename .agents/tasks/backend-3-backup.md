---
description: "B3 — Cloud Backup & Restore: API for uploading and restoring complete app state"
depends_on: [backend-2-auth]
agent: agent-b3
---

# B3 — Cloud Backup API

## Objective

Build the backup and restore system that safely stores the user's local JSON data to PostgreSQL and returns it on demand. Handle auto vs manual backups and prune old backups.

## Files to Create

### `backend/app/schemas/backup.py`

```python
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

class BackupFull(BackupMeta):
    data: dict
```

### `backend/app/services/backup_service.py`

Functions needing access to DB and current User:

1.  `create_backup(user_id, upload_data)`:
    *   Calculate size_bytes from `json.dumps(upload_data.data)`.
    *   Insert into DB.
    *   Prune old backups: Keep only the latest `MAX_BACKUPS_PER_USER` (from config, default 10) for this user.
2.  `list_backups(user_id)`:
    *   Return list of `BackupMeta` ordered by `created_at` DESC.
3.  `get_backup(backup_id, user_id)`:
    *   Fetch full Backup by ID, ensure it belongs to the user.
4.  `get_latest_backup(user_id)`:
    *   Fetch the single most recent Backup for the user. (Useful for continuous restore checks).
5.  `delete_backup(backup_id, user_id)`:
    *   Delete the backup.

### `backend/app/api/backup.py`

FastAPI endpoints utilizing `backup_service.py`:

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /backup/` | POST | Yes | Upload full app state. Request body: `BackupUpload`. Return: `BackupMeta`. |
| `GET /backup/` | GET | Yes | List backups (`BackupMeta`). |
| `GET /backup/latest` | GET | Yes | Get most recent full backup (`BackupFull`). Return 404 if none. |
| `GET /backup/{id}` | GET | Yes | Get specific backup (`BackupFull`). |
| `DELETE /backup/{id}` | DELETE | Yes | Delete a backup. |

## Wire into `app/main.py`

Uncomment and add:
```python
from app.api.backup import router as backup_router
app.include_router(backup_router, prefix="/backup", tags=["Backup"])
```

## Done Criteria

Write completion report to `.agents/messages/from-agent-b3/done.md` confirming:
- Endpoints working
- Authentication middleware applies to all routes
- Old backup pruning activates when exceeding the limit
