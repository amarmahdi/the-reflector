// ──────────────────────────────────────────────
// The Reflector – Centralized Store Persistence Keys
// ──────────────────────────────────────────────
// Single source of truth for all Zustand persist() names.
// Used by stores, seed data, and data export to prevent silent mismatches.

export const STORE_KEYS = {
  reflector: 'reflector-store-v5',
  gamification: 'reflector-gamification-v5',
  focus: 'reflector-focus-v5',
  journal: 'reflector-journal-v5',
  alarms: 'reflector-alarms-v5',
  discipline: 'reflector-discipline-v5',
} as const;

export type StoreKeyName = keyof typeof STORE_KEYS;
export type StoreKeyValue = (typeof STORE_KEYS)[StoreKeyName];
