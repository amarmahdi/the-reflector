// ──────────────────────────────────────────────
// The Reflector – Alarm Store
// ──────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { STORE_KEYS } from './keys';
import type { Alarm, AlarmType } from '@/types/models';
import * as Crypto from 'expo-crypto';

// ── State Shape ──────────────────────────────────────────────────────────────

export interface AlarmState {
  alarms: Alarm[];

  addAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt'>) => Alarm;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  getAlarmsByType: (type: AlarmType) => Alarm[];
  getAlarmForEntity: (entityId: string) => Alarm | undefined;
  getActiveAlarms: () => Alarm[];
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: [],

      addAlarm: (data) => {
        const alarm: Alarm = {
          ...data,
          id: Crypto.randomUUID(),
          createdAt: Date.now(),
        };
        set((s) => ({ alarms: [...s.alarms, alarm] }));
        return alarm;
      },

      updateAlarm: (id, updates) => {
        set((s) => ({
          alarms: s.alarms.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteAlarm: (id) => {
        set((s) => ({
          alarms: s.alarms.filter((a) => a.id !== id),
        }));
      },

      toggleAlarm: (id) => {
        set((s) => ({
          alarms: s.alarms.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        }));
      },

      getAlarmsByType: (type) => {
        return get().alarms.filter((a) => a.type === type);
      },

      getAlarmForEntity: (entityId) => {
        return get().alarms.find((a) => a.linkedEntityId === entityId);
      },

      getActiveAlarms: () => {
        return get().alarms.filter((a) => a.enabled);
      },
    }),
    { name: STORE_KEYS.alarms, storage: asyncStorageAdapter }
  )
);
