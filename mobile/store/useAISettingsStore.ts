// ──────────────────────────────────────────────
// The Reflector – AI Settings Store
// ──────────────────────────────────────────────
// Persists AI provider selection and API keys.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorageAdapter } from './storage';

export type AIProvider = 'gemini' | 'deepseek' | 'openai';

export interface AIProviderConfig {
  id: AIProvider;
  label: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DEFAULT_PROVIDERS: Record<AIProvider, Omit<AIProviderConfig, 'apiKey'>> = {
  gemini: {
    id: 'gemini',
    label: 'Gemini (Backend)',
    baseUrl: '', // Uses existing backend
    model: 'gemini-2.0-flash',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o-mini',
  },
};

export interface AISettingsState {
  activeProvider: AIProvider;
  apiKeys: Record<AIProvider, string>;

  setActiveProvider: (provider: AIProvider) => void;
  setApiKey: (provider: AIProvider, key: string) => void;
  getActiveConfig: () => AIProviderConfig;
}

export const useAISettingsStore = create<AISettingsState>()(
  persist(
    (set, get) => ({
      activeProvider: 'gemini',
      apiKeys: {
        gemini: '', // Uses backend, no key needed on mobile
        deepseek: 'sk-c64cd7a2849e4f0ebf171b41860040b8',
        openai: '',
      },

      setActiveProvider: (provider) => set({ activeProvider: provider }),

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      getActiveConfig: () => {
        const { activeProvider, apiKeys } = get();
        const base = DEFAULT_PROVIDERS[activeProvider];
        return { ...base, apiKey: apiKeys[activeProvider] };
      },
    }),
    {
      name: 'reflector-ai-settings-v1',
      storage: asyncStorageAdapter,
    }
  )
);
