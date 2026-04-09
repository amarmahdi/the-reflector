// ──────────────────────────────────────────────
// The Reflector – Centralized Store Persistence Keys
// ──────────────────────────────────────────────
// Single source of truth for all Zustand persist() names.
// Used by stores, seed data, and data export to prevent silent mismatches.

export const STORE_KEYS = {
  reflector: 'reflector-store-v3',
  gamification: 'reflector-gamification-v3',
  focus: 'reflector-focus-v3',
  journal: 'reflector-journal-v3',
  alarms: 'reflector-alarms-v3',
  discipline: 'reflector-discipline-v3',
} as const;

export type StoreKeyName = keyof typeof STORE_KEYS;
export type StoreKeyValue = (typeof STORE_KEYS)[StoreKeyName];
