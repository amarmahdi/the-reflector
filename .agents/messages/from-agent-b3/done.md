# Agent B3 — Cloud Backup & Restore API — DONE ✅

## Completed: 2026-04-08

## Files Created

| File | Purpose |
|---|---|
| `app/schemas/backup.py` | Pydantic schemas: BackupUpload, BackupMeta, BackupFull (with `from_attributes` for ORM) |
| `app/services/__init__.py` | Services package init |
| `app/services/backup_service.py` | Business logic: create_backup, list_backups, get_backup, get_latest_backup, delete_backup + auto-prune |
| `app/api/backup.py` | 5 auth-protected endpoints (POST, GET list, GET latest, GET by ID, DELETE) |

## Files Modified

| File | Change |
|---|---|
| `app/main.py` | Added `from app.api.backup import router as backup_router` and `app.include_router(backup_router, prefix="/backup", tags=["Backup"])` — existing auth router line untouched |

## Endpoints Verified

| Endpoint | Method | Auth | Status | Test Result |
|---|---|---|---|---|
| `POST /backup/` | POST | Yes | 201 | ✅ Creates backup, returns BackupMeta with calculated size_bytes |
| `POST /backup/` (auto) | POST | Yes | 201 | ✅ is_auto=true stored correctly |
| `GET /backup/` | GET | Yes | 200 | ✅ Returns list of BackupMeta, newest first |
| `GET /backup/latest` | GET | Yes | 200 | ✅ Returns full BackupFull with JSONB data |
| `GET /backup/{id}` | GET | Yes | 200 | ✅ Returns specific BackupFull |
| `GET /backup/{id}` (deleted) | GET | Yes | 404 | ✅ "Backup not found" |
| `DELETE /backup/{id}` | DELETE | Yes | 204 | ✅ No content body returned |
| `GET /backup/` (no token) | GET | No | 401 | ✅ "Not authenticated" |

## Technical Notes

- **Auto-prune**: On every `create_backup`, backups exceeding `MAX_BACKUPS_PER_USER` (config default: 10) are automatically deleted using a subquery that keeps only the newest N
- **Size calculation**: `size_bytes` computed from `len(json.dumps(data).encode("utf-8"))` for accurate byte count
- **User isolation**: All queries scope by `user_id` — users can never access another user's backups
- **Route ordering**: `/latest` is defined before `/{backup_id}` so FastAPI matches it correctly
- **DB transactions**: Uses `db.flush()` (not `commit`) — the `get_db` session manager handles commit/rollback

## Dependencies for Other Agents

- **B5 (Deployment)**: No additional dependencies needed — backup endpoints are wired and functional
- **B6 (Mobile)**: Backup endpoints are at `/backup/*` — POST returns 201, DELETE returns 204
