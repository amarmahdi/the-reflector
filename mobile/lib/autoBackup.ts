// ──────────────────────────────────────────────
// Auto Backup — Sync local data to cloud
// ──────────────────────────────────────────────
import { useAuthStore } from '@/store/useAuthStore';
import { exportAllData } from '@/lib/dataExport';
import { api } from '@/lib/apiClient';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Check if a backup is due and fire it in the background.
 * Call this once from _layout on mount.
 */
export async function checkAutoBackup(): Promise<void> {
  const { isLoggedIn, autoBackupEnabled, lastBackupAt, setLastBackupAt } =
    useAuthStore.getState();

  if (!isLoggedIn || !autoBackupEnabled) return;

  const now = Date.now();
  if (lastBackupAt && now - lastBackupAt < ONE_DAY_MS) return;

  try {
    const json = await exportAllData();
    const data = JSON.parse(json);
    await api('/backup/', {
      method: 'POST',
      body: { data: data.stores, app_version: '1.0.0', is_auto: true },
    });
    setLastBackupAt(now);
  } catch (e) {
    // Silently fail — auto-backup should never block the user
    console.warn('[AutoBackup] failed:', e);
  }
}

/**
 * Trigger a manual backup. Returns true on success.
 */
export async function manualBackup(): Promise<boolean> {
  const { setLastBackupAt } = useAuthStore.getState();

  try {
    const json = await exportAllData();
    const data = JSON.parse(json);
    await api('/backup/', {
      method: 'POST',
      body: { data: data.stores, app_version: '1.0.0', is_auto: false },
    });
    setLastBackupAt(Date.now());
    return true;
  } catch (e) {
    console.error('[ManualBackup] failed:', e);
    return false;
  }
}

/**
 * Restore the latest backup from the cloud.
 * Returns the raw data object, or null if not available.
 */
export async function restoreFromCloud(): Promise<Record<string, unknown> | null> {
  try {
    const backup = await api<{ data: Record<string, unknown> }>('/backup/latest');
    return backup.data;
  } catch {
    return null;
  }
}
