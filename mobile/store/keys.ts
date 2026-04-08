// ──────────────────────────────────────────────
// The Reflector – Centralized Store Persistence Keys
// ──────────────────────────────────────────────
// Single source of truth for all Zustand persist() names.
// Used by stores, seed data, and data export to prevent silent mismatches.

export const STORE_KEYS = {
  reflector: 'reflector-store-v2',
  gamification: 'reflector-gamification-v2',
  focus: 'reflector-focus-v2',
  journal: 'reflector-journal-v2',
  alarms: 'reflector-alarms-v2',
  discipline: 'reflector-discipline-v2',
} as const;

export type StoreKeyName = keyof typeof STORE_KEYS;
export type StoreKeyValue = (typeof STORE_KEYS)[StoreKeyName];
