import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORE_KEYS } from '@/store/keys';

// ──────────────────────────────────────────────
// Data Export / Import Utilities
// ──────────────────────────────────────────────

const ALL_STORE_KEYS = Object.values(STORE_KEYS);

export interface ExportData {
  version: string;
  exportedAt: number;
  stores: {
    reflector: unknown;
    journal: unknown;
    focus: unknown;
    gamification: unknown;
  };
}

/**
 * Export all app data as a JSON string.
 * Reads from all AsyncStorage keys used by zustand persist.
 */
export async function exportAllData(): Promise<string> {
  const pairs = await AsyncStorage.multiGet([...ALL_STORE_KEYS]);

  const storeMap: Record<string, unknown> = {};
  for (const [key, value] of pairs) {
    try {
      storeMap[key] = value ? JSON.parse(value) : null;
    } catch {
      storeMap[key] = value;
    }
  }

  const data: ExportData = {
    version: '1.0.0',
    exportedAt: Date.now(),
    stores: {
      reflector: storeMap[STORE_KEYS.reflector] ?? null,
      journal: storeMap[STORE_KEYS.journal] ?? null,
      focus: storeMap[STORE_KEYS.focus] ?? null,
      gamification: storeMap[STORE_KEYS.gamification] ?? null,
    },
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import data from a JSON string. Validates the format before applying.
 * Returns success status and optional error message.
 */
export async function importData(json: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(json) as ExportData;

    if (!data.version) {
      return { success: false, error: 'Invalid export file: missing version field.' };
    }

    if (!data.stores) {
      return { success: false, error: 'Invalid export file: missing stores field.' };
    }

    const pairs: [string, string][] = [];

    if (data.stores.reflector != null) {
      pairs.push([STORE_KEYS.reflector, JSON.stringify(data.stores.reflector)]);
    }
    if (data.stores.journal != null) {
      pairs.push([STORE_KEYS.journal, JSON.stringify(data.stores.journal)]);
    }
    if (data.stores.focus != null) {
      pairs.push([STORE_KEYS.focus, JSON.stringify(data.stores.focus)]);
    }
    if (data.stores.gamification != null) {
      pairs.push([STORE_KEYS.gamification, JSON.stringify(data.stores.gamification)]);
    }

    if (pairs.length === 0) {
      return { success: false, error: 'Export file contains no store data.' };
    }

    await AsyncStorage.multiSet(pairs);

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error: `Failed to import: ${msg}` };
  }
}

/**
 * Get the approximate size of all stored data.
 */
export async function getStorageSize(): Promise<{ bytes: number; formatted: string }> {
  const pairs = await AsyncStorage.multiGet([...ALL_STORE_KEYS]);

  let totalBytes = 0;
  for (const [key, value] of pairs) {
    if (value) {
      // Approximate byte length (UTF-16 chars → rough byte count)
      totalBytes += key.length + value.length;
    }
  }

  return {
    bytes: totalBytes,
    formatted: formatBytes(totalBytes),
  };
}

/**
 * Clear all stored data (nuclear reset).
 */
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([...ALL_STORE_KEYS]);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
