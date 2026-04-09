// ──────────────────────────────────────────────
// The Reflector – Centralized Store Persistence Keys
// ──────────────────────────────────────────────
// Single source of truth for all Zustand persist() names.
// Used by stores, seed data, and data export to prevent silent mismatches.

export const STORE_KEYS = {
  reflector: 'reflector-store-v4',
  gamification: 'reflector-gamification-v4',
  focus: 'reflector-focus-v4',
  journal: 'reflector-journal-v4',
  alarms: 'reflector-alarms-v4',
  discipline: 'reflector-discipline-v4',
} as const;

export type StoreKeyName = keyof typeof STORE_KEYS;
export type StoreKeyValue = (typeof STORE_KEYS)[StoreKeyName];
