import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { STORE_KEYS } from './keys';
import type { JournalEntry, JournalMood } from '@/types/models';
import * as Crypto from 'expo-crypto';

// ──────────────────────────────────────────────
// Journal Store — Isolated domain store
// ──────────────────────────────────────────────

export interface JournalState {
  journalEntries: JournalEntry[];

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => JournalEntry;
  updateJournalEntry: (id: string, partial: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  getJournalByDate: (date: number) => JournalEntry[];
  searchJournal: (query: string) => JournalEntry[];
  getEntriesByMood: (mood: JournalMood) => JournalEntry[];
  getEntriesByTag: (tag: string) => JournalEntry[];
  getAllTags: () => string[];
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      journalEntries: [],

      addJournalEntry: (entry) => {
        const full: JournalEntry = {
          ...entry,
          id: Crypto.randomUUID(),
          createdAt: Date.now(),
        };
        set((s) => ({ journalEntries: [full, ...s.journalEntries] }));
        return full;
      },

      updateJournalEntry: (id, partial) => {
        set((s) => ({
          journalEntries: s.journalEntries.map((e) =>
            e.id === id ? { ...e, ...partial } : e
          ),
        }));
      },

      deleteJournalEntry: (id) => {
        set((s) => ({
          journalEntries: s.journalEntries.filter((e) => e.id !== id),
        }));
      },

      getJournalByDate: (date) => {
        return get().journalEntries.filter((e) => e.date === date);
      },

      searchJournal: (query) => {
        const q = query.toLowerCase();
        return get().journalEntries.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.body.toLowerCase().includes(q) ||
            e.tags.some((t) => t.toLowerCase().includes(q))
        );
      },

      getEntriesByMood: (mood) => {
        return get().journalEntries.filter((e) => e.mood === mood);
      },

      getEntriesByTag: (tag) => {
        const t = tag.toLowerCase();
        return get().journalEntries.filter((e) =>
          e.tags.some((et) => et.toLowerCase() === t)
        );
      },

      getAllTags: () => {
        const tagSet = new Set<string>();
        for (const entry of get().journalEntries) {
          for (const tag of entry.tags) {
            tagSet.add(tag);
          }
        }
        return Array.from(tagSet).sort();
      },
    }),
    { name: STORE_KEYS.journal, storage: asyncStorageAdapter }
  )
);
