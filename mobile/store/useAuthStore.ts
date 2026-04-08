import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';
import { api } from '@/lib/apiClient';

// ──────────────────────────────────────────────
// Auth Store — JWT + User State
// ──────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  is_profile_public: boolean;
  share_discipline: boolean;
  share_streaks: boolean;
  parental_mode: boolean;
  created_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  autoBackupEnabled: boolean;
  lastBackupAt: number | null;

  // Actions
  setTokens: (access: string, refresh: string) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, password: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
  setAutoBackup: (enabled: boolean) => void;
  setLastBackupAt: (ts: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoggedIn: false,
      autoBackupEnabled: false,
      lastBackupAt: null,

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh, isLoggedIn: true });
      },

      login: async (username, password) => {
        const data = await api<{ access_token: string; refresh_token: string }>(
          '/auth/login',
          { method: 'POST', body: { username, password }, skipAuth: true }
        );
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isLoggedIn: true,
        });
        // Fetch full profile
        await get().fetchProfile();
      },

      register: async (username, displayName, password) => {
        const data = await api<{ access_token: string; refresh_token: string }>(
          '/auth/register',
          {
            method: 'POST',
            body: { username, display_name: displayName, password },
            skipAuth: true,
          }
        );
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isLoggedIn: true,
        });
        await get().fetchProfile();
      },

      fetchProfile: async () => {
        const user = await api<AuthUser>('/auth/me');
        set({ user });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoggedIn: false,
        });
      },

      setAutoBackup: (enabled) => set({ autoBackupEnabled: enabled }),
      setLastBackupAt: (ts) => set({ lastBackupAt: ts }),
    }),
    {
      name: 'reflector-auth-v1',
      storage: asyncStorageAdapter,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isLoggedIn: state.isLoggedIn,
        autoBackupEnabled: state.autoBackupEnabled,
        lastBackupAt: state.lastBackupAt,
      }),
    }
  )
);
