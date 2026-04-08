// ──────────────────────────────────────────────
// useMomentumTier — Returns current tier from streak
// ──────────────────────────────────────────────

import { useMemo } from 'react';
import { useUserLevel } from '@/hooks/useStoreData';
import { getTierForStreak, type MomentumTier } from '@/lib/momentumTiers';

/** Returns the MomentumTier for the user's current streak */
export function useMomentumTier(): MomentumTier {
  const { currentStreak } = useUserLevel();
  return useMemo(() => getTierForStreak(currentStreak), [currentStreak]);
}
