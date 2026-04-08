// ──────────────────────────────────────────────
// The Correlation Engine — Analytics Logic
// ──────────────────────────────────────────────

import type { Grid40, Routine, GridDay } from '@/types/models';

// ── Stop words for failure word cloud ──────────
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours',
  'he', 'she', 'it', 'its', 'they', 'them', 'their', 'theirs', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but',
  'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for',
  'with', 'about', 'against', 'between', 'through', 'during', 'before',
  'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can',
  'will', 'just', 'don', 'should', 'now', 'didn', 'wasn', 'wouldn', 'couldn',
  'doesn', 'hadn', 'hasn', 'haven', 'isn', 'aren', 'weren', 'won', 'got',
  'get', 'really', 'also', 'went', 'like', 'much', 'even',
]);

// ── Types ──────────────────────────────────────

export interface CorrelationPair {
  routineA: { id: string; title: string };
  routineB: { id: string; title: string };
  /** P(B completed | A completed) */
  probBGivenA: number;
  /** P(B completed | A missed) */
  probBGivenAMissed: number;
  /** Domino effect strength: probBGivenA - probBGivenAMissed */
  dominoEffect: number;
  /** Number of overlapping days used for calculation */
  sampleSize: number;
}

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number; // relative to total non-stop words
}

export interface StreakInfo {
  routineId: string;
  routineTitle: string;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  totalScarred: number;
  completionRate: number;
}

export interface EngineResults {
  correlations: CorrelationPair[];
  wordCloud: WordFrequency[];
  streaks: StreakInfo[];
}

// ── Helpers ────────────────────────────────────

/** Build a date→status map for a grid's days */
function buildDateStatusMap(grid: Grid40): Map<number, 'completed' | 'scarred' | 'pending'> {
  const map = new Map<number, 'completed' | 'scarred' | 'pending'>();
  for (const day of grid.days) {
    map.set(day.date, day.status);
  }
  return map;
}

// ── Cross-Routine Conditional Probability ──────

export function computeCorrelations(
  grids: Grid40[],
  routines: Routine[]
): CorrelationPair[] {
  const results: CorrelationPair[] = [];

  // Group grids by routine
  const gridsByRoutine = new Map<string, Grid40[]>();
  for (const grid of grids) {
    const existing = gridsByRoutine.get(grid.routineId) ?? [];
    existing.push(grid);
    gridsByRoutine.set(grid.routineId, existing);
  }

  const routineIds = Array.from(gridsByRoutine.keys());

  // For each pair of routines
  for (let i = 0; i < routineIds.length; i++) {
    for (let j = i + 1; j < routineIds.length; j++) {
      const idA = routineIds[i];
      const idB = routineIds[j];
      const gridsA = gridsByRoutine.get(idA) ?? [];
      const gridsB = gridsByRoutine.get(idB) ?? [];

      const routineA = routines.find((r) => r.id === idA);
      const routineB = routines.find((r) => r.id === idB);
      if (!routineA || !routineB) continue;

      // Merge all date→status maps per routine
      const mapA = new Map<number, string>();
      const mapB = new Map<number, string>();
      for (const g of gridsA) {
        for (const [date, status] of buildDateStatusMap(g)) {
          mapA.set(date, status);
        }
      }
      for (const g of gridsB) {
        for (const [date, status] of buildDateStatusMap(g)) {
          mapB.set(date, status);
        }
      }

      // Find overlapping dates where both routines have a non-pending status
      let aCompletedBCompleted = 0;
      let aCompletedBMissed = 0;
      let aMissedBCompleted = 0;
      let aMissedBMissed = 0;

      for (const [date, statusA] of mapA) {
        const statusB = mapB.get(date);
        if (!statusB || statusA === 'pending' || statusB === 'pending') continue;

        const aDone = statusA === 'completed';
        const bDone = statusB === 'completed';

        if (aDone && bDone) aCompletedBCompleted++;
        if (aDone && !bDone) aCompletedBMissed++;
        if (!aDone && bDone) aMissedBCompleted++;
        if (!aDone && !bDone) aMissedBMissed++;
      }

      const totalACompleted = aCompletedBCompleted + aCompletedBMissed;
      const totalAMissed = aMissedBCompleted + aMissedBMissed;
      const sampleSize = totalACompleted + totalAMissed;

      if (sampleSize < 3) continue; // Not enough data

      const probBGivenA = totalACompleted > 0
        ? aCompletedBCompleted / totalACompleted
        : 0;
      const probBGivenAMissed = totalAMissed > 0
        ? aMissedBCompleted / totalAMissed
        : 0;

      results.push({
        routineA: { id: idA, title: routineA.title },
        routineB: { id: idB, title: routineB.title },
        probBGivenA,
        probBGivenAMissed,
        dominoEffect: probBGivenA - probBGivenAMissed,
        sampleSize,
      });
    }
  }

  // Sort by strongest domino effect
  results.sort((a, b) => Math.abs(b.dominoEffect) - Math.abs(a.dominoEffect));
  return results;
}

// ── Failure Word Cloud ─────────────────────────

export function computeWordCloud(grids: Grid40[]): WordFrequency[] {
  const wordCounts = new Map<string, number>();
  let totalWords = 0;

  for (const grid of grids) {
    for (const day of grid.days) {
      if (day.status === 'scarred' && day.failureReason) {
        const words = day.failureReason
          .toLowerCase()
          .replace(/[^a-z\s']/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

        for (const word of words) {
          wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
          totalWords++;
        }
      }
    }
  }

  if (totalWords === 0) return [];

  const results: WordFrequency[] = Array.from(wordCounts.entries())
    .map(([word, count]) => ({
      word,
      count,
      percentage: (count / totalWords) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  return results;
}

// ── Streak Analytics ───────────────────────────

export function computeStreaks(
  grids: Grid40[],
  routines: Routine[]
): StreakInfo[] {
  const results: StreakInfo[] = [];

  // Group grids by routine
  const gridsByRoutine = new Map<string, Grid40[]>();
  for (const grid of grids) {
    const existing = gridsByRoutine.get(grid.routineId) ?? [];
    existing.push(grid);
    gridsByRoutine.set(grid.routineId, existing);
  }

  for (const [routineId, rGrids] of gridsByRoutine) {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) continue;

    // Collect all days across all grids for this routine, sorted by date
    const allDays: GridDay[] = rGrids
      .flatMap((g) => g.days)
      .filter((d) => d.status !== 'pending')
      .sort((a, b) => a.date - b.date);

    let currentStreak = 0;
    let longestStreak = 0;
    let runningStreak = 0;
    let totalCompleted = 0;
    let totalScarred = 0;

    for (const day of allDays) {
      if (day.status === 'completed') {
        totalCompleted++;
        runningStreak++;
        if (runningStreak > longestStreak) longestStreak = runningStreak;
      } else {
        totalScarred++;
        runningStreak = 0;
      }
    }

    // Current streak = running streak at the end of sorted days
    currentStreak = runningStreak;

    const total = totalCompleted + totalScarred;
    results.push({
      routineId,
      routineTitle: routine.title,
      currentStreak,
      longestStreak,
      totalCompleted,
      totalScarred,
      completionRate: total > 0 ? totalCompleted / total : 0,
    });
  }

  results.sort((a, b) => b.completionRate - a.completionRate);
  return results;
}

// ── Master compute ─────────────────────────────

export function computeEngineResults(
  grids: Grid40[],
  routines: Routine[]
): EngineResults {
  return {
    correlations: computeCorrelations(grids, routines),
    wordCloud: computeWordCloud(grids),
    streaks: computeStreaks(grids, routines),
  };
}
