import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * Zustand-compatible storage backed by AsyncStorage.
 * Works in Expo Go without a native build.
 *
 * NOTE: To upgrade to MMKV later (for sync perf), create a
 * dev build with `npx expo prebuild` and swap this adapter.
 */
export const asyncStorageAdapter = createJSONStorage(() => AsyncStorage);
