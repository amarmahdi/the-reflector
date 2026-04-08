// ──────────────────────────────────────────────
// Heatmap Engine — Calendar & Trend Data
// ──────────────────────────────────────────────

import type { Grid40 } from '@/types/models';

// ── Types ──────────────────────────────────────

export interface HeatmapDay {
  date: number;           // epoch ms (start-of-day)
  completionRate: number; // 0 to 1
  routinesDone: number;
  routinesTotal: number;
  dayOfWeek: number;      // 0=Sun ... 6=Sat
}

export interface WeeklyTrend {
  weekStart: number;      // epoch ms
  completionRate: number;
  totalCompleted: number;
  totalDays: number;
}

export interface WeeklySummary {
  totalCompleted: number;
  totalScarred: number;
  totalPending: number;
  completionRate: number;
  bestDay: { date: number; rate: number } | null;
  worstDay: { date: number; rate: number } | null;
  vsLastWeek: number;    // percentage change from last week (-100 to +100)
}

// ── Helpers ────────────────────────────────────

const MS_PER_DAY = 86_400_000;

/** Normalise a timestamp to start-of-day */
function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Get the Monday (start-of-week) for a given date */
function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0=Sun
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // shift so Monday=0
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

// ── Main Functions ─────────────────────────────

/**
 * Compute heatmap data for the past N days.
 * For each day, calculate completionRate across all active grids.
 * A day with no grids = skip (don't include).
 */
export function computeHeatmapData(grids: Grid40[], days: number = 365): HeatmapDay[] {
  const today = startOfDay(Date.now());
  const cutoff = today - days * MS_PER_DAY;

  // Build a map: date → { completed, total }
  const dayMap = new Map<number, { completed: number; total: number }>();

  for (const grid of grids) {
    for (const day of grid.days) {
      if (day.status === 'pending') continue; // skip unresolved days
      const dayDate = startOfDay(day.date);
      if (dayDate < cutoff || dayDate > today) continue;

      const entry = dayMap.get(dayDate) ?? { completed: 0, total: 0 };
      entry.total += 1;
      if (day.status === 'completed') {
        entry.completed += 1;
      }
      dayMap.set(dayDate, entry);
    }
  }

  // Convert to HeatmapDay array
  const result: HeatmapDay[] = [];
  for (const [date, { completed, total }] of dayMap) {
    result.push({
      date,
      completionRate: total > 0 ? completed / total : 0,
      routinesDone: completed,
      routinesTotal: total,
      dayOfWeek: new Date(date).getDay(),
    });
  }

  result.sort((a, b) => a.date - b.date);
  return result;
}

/**
 * Compute weekly completion trends for the past N weeks.
 */
export function computeWeeklyTrends(grids: Grid40[], weeks: number = 12): WeeklyTrend[] {
  const today = startOfDay(Date.now());
  const currentWeekStart = startOfWeek(today);
  const cutoff = currentWeekStart - (weeks - 1) * 7 * MS_PER_DAY;

  // Build weekly buckets
  const weekMap = new Map<number, { completed: number; total: number }>();

  // Initialize all week buckets
  for (let i = 0; i < weeks; i++) {
    const ws = cutoff + i * 7 * MS_PER_DAY;
    weekMap.set(ws, { completed: 0, total: 0 });
  }

  for (const grid of grids) {
    for (const day of grid.days) {
      if (day.status === 'pending') continue;
      const dayDate = startOfDay(day.date);
      if (dayDate < cutoff) continue;

      const ws = startOfWeek(dayDate);
      const entry = weekMap.get(ws);
      if (!entry) continue;

      entry.total += 1;
      if (day.status === 'completed') {
        entry.completed += 1;
      }
    }
  }

  const result: WeeklyTrend[] = [];
  const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => a - b);

  for (const ws of sortedWeeks) {
    const { completed, total } = weekMap.get(ws)!;
    result.push({
      weekStart: ws,
      completionRate: total > 0 ? completed / total : 0,
      totalCompleted: completed,
      totalDays: total,
    });
  }

  return result;
}

/**
 * Compute this week's summary.
 */
export function computeWeeklySummary(grids: Grid40[]): WeeklySummary {
  const today = startOfDay(Date.now());
  const thisWeekStart = startOfWeek(today);
  const lastWeekStart = thisWeekStart - 7 * MS_PER_DAY;

  let totalCompleted = 0;
  let totalScarred = 0;
  let totalPending = 0;
  let lastWeekCompleted = 0;
  let lastWeekTotal = 0;

  // Per-day tracking for best/worst
  const dayRates = new Map<number, { completed: number; total: number }>();

  for (const grid of grids) {
    for (const day of grid.days) {
      const dayDate = startOfDay(day.date);

      // This week
      if (dayDate >= thisWeekStart && dayDate <= today) {
        if (day.status === 'completed') totalCompleted++;
        else if (day.status === 'scarred') totalScarred++;
        else totalPending++;

        if (day.status !== 'pending') {
          const entry = dayRates.get(dayDate) ?? { completed: 0, total: 0 };
          entry.total++;
          if (day.status === 'completed') entry.completed++;
          dayRates.set(dayDate, entry);
        }
      }

      // Last week (for comparison)
      if (dayDate >= lastWeekStart && dayDate < thisWeekStart) {
        if (day.status !== 'pending') {
          lastWeekTotal++;
          if (day.status === 'completed') lastWeekCompleted++;
        }
      }
    }
  }

  const thisWeekTotal = totalCompleted + totalScarred;
  const completionRate = thisWeekTotal > 0 ? totalCompleted / thisWeekTotal : 0;
  const lastWeekRate = lastWeekTotal > 0 ? lastWeekCompleted / lastWeekTotal : 0;
  const vsLastWeek = thisWeekTotal > 0 && lastWeekTotal > 0
    ? Math.round((completionRate - lastWeekRate) * 100)
    : 0;

  // Find best and worst days
  let bestDay: { date: number; rate: number } | null = null;
  let worstDay: { date: number; rate: number } | null = null;

  for (const [date, { completed, total }] of dayRates) {
    const rate = total > 0 ? completed / total : 0;
    if (!bestDay || rate > bestDay.rate) bestDay = { date, rate };
    if (!worstDay || rate < worstDay.rate) worstDay = { date, rate };
  }

  return {
    totalCompleted,
    totalScarred,
    totalPending,
    completionRate,
    bestDay,
    worstDay,
    vsLastWeek,
  };
}
