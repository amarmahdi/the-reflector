// ──────────────────────────────────────────────
// Unified Analytics Engine — Cross-Feature Insights
// ──────────────────────────────────────────────

import { useReflectorStore } from '@/store/useReflectorStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import type { JournalMood } from '@/types/models';

// ── Types ──────────────────────────────────────

export interface DailyScore {
  date: number;
  routineCompletion: number;  // 0-1
  tasksCompleted: number;
  focusMinutes: number;
  journalEntries: number;
  overallScore: number;       // weighted composite 0-100
}

export interface WeeklyOverview {
  weekStart: number;
  dailyScores: DailyScore[];
  avgScore: number;
  bestDay: DailyScore | null;
  worstDay: DailyScore | null;
  totalRoutineDays: number;
  totalScars: number;
  totalFocusMinutes: number;
  totalJournalEntries: number;
  mostCommonMood: string | null;
  vsLastWeek: number;         // -100 to +100, percentage change
  topFailureWord: string | null;
}

export interface FocusRoutineCorrelation {
  routineTitle: string;
  avgFocusMinutesOnCompletedDays: number;
  avgFocusMinutesOnMissedDays: number;
  correlation: number;        // -1 to +1
}

export interface MoodCompletionInsight {
  avgMoodOnCompletedDays: number;
  avgMoodOnMissedDays: number;
  completedDayCount: number;
  missedDayCount: number;
}

// ── Helpers ────────────────────────────────────

const MS_PER_DAY = 86_400_000;

const MOOD_NUMERIC: Record<JournalMood, number> = {
  great: 5,
  good: 4,
  neutral: 3,
  rough: 2,
  terrible: 1,
};

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? 6 : dow - 1; // shift so Monday=0
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

// STOP WORDS to filter from failure analysis
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'the', 'a', 'an', 'and', 'or', 'but', 'is', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'it', 'its', 'this', 'that', 'not', 'so', 'just',
  'than', 'too', 'very', 'am', 'are', 'from', 'as', 'if', 'then', 'no', 'up',
  'out', 'about', 'into', 'over', 'after', 'all', 'also', 'which', 'what',
  'when', 'where', 'how', 'who', 'whom', 'there', 'here', 'some', 'other',
  'like', 'get', 'got', 'going', 'went', 'really', 'because', 'didn',
  't', 'don', 'didn\'t', 'don\'t', 'wasn\'t', 'couldn\'t', 'wouldn\'t',
]);

// ── Core Functions ─────────────────────────────

/**
 * Compute daily scores for the past N days.
 * Score formula: (routineCompletion * 40) + (tasksCompleted * 2) + (focusMinutes * 0.3) + (journalEntries * 5)
 * Capped at 100.
 */
export function computeDailyScores(days: number = 14): DailyScore[] {
  const { grids, dailyTodos } = useReflectorStore.getState();
  const { focusSessions } = useFocusStore.getState();
  const { journalEntries } = useJournalStore.getState();

  const today = startOfDay(Date.now());
  const scores: DailyScore[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = today - i * MS_PER_DAY;

    // 1. Routine completion for this day
    let routineTotal = 0;
    let routineCompleted = 0;
    for (const grid of grids) {
      for (const day of grid.days) {
        if (startOfDay(day.date) === date && day.status !== 'pending') {
          routineTotal++;
          if (day.status === 'completed') routineCompleted++;
        }
      }
    }
    const routineCompletion = routineTotal > 0 ? routineCompleted / routineTotal : 0;

    // 2. Tasks completed on this day
    const tasksCompleted = dailyTodos.filter(
      (t) => startOfDay(t.date) === date && t.completed
    ).length;

    // 3. Focus minutes on this day
    const focusMinutes = Math.round(
      focusSessions
        .filter((s) => startOfDay(s.startTime) === date && s.completed)
        .reduce((sum, s) => sum + s.actualDuration / 60000, 0)
    );

    // 4. Journal entries on this day
    const journalCount = journalEntries.filter(
      (e) => startOfDay(e.date) === date
    ).length;

    // Compute score
    const rawScore =
      routineCompletion * 40 +
      tasksCompleted * 2 +
      focusMinutes * 0.3 +
      journalCount * 5;

    scores.push({
      date,
      routineCompletion,
      tasksCompleted,
      focusMinutes,
      journalEntries: journalCount,
      overallScore: Math.min(100, Math.round(rawScore)),
    });
  }

  return scores;
}

/**
 * Compute this week's unified overview.
 */
export function computeWeeklyOverview(): WeeklyOverview {
  const { grids } = useReflectorStore.getState();
  const { journalEntries } = useJournalStore.getState();

  const today = startOfDay(Date.now());
  const thisWeekStart = startOfWeek(today);
  const lastWeekStart = thisWeekStart - 7 * MS_PER_DAY;

  // Daily scores for the week (7 days from Monday)
  const dailyScores: DailyScore[] = [];
  for (let i = 0; i < 7; i++) {
    const date = thisWeekStart + i * MS_PER_DAY;
    if (date > today) break;
    // Reuse computeDailyScores logic inline for single-day efficiency
    const scores = computeDailyScoresForDate(date);
    dailyScores.push(scores);
  }

  // Average score
  const avgScore = dailyScores.length > 0
    ? Math.round(dailyScores.reduce((sum, d) => sum + d.overallScore, 0) / dailyScores.length)
    : 0;

  // Best/worst days
  let bestDay: DailyScore | null = null;
  let worstDay: DailyScore | null = null;
  for (const day of dailyScores) {
    if (!bestDay || day.overallScore > bestDay.overallScore) bestDay = day;
    if (!worstDay || day.overallScore < worstDay.overallScore) worstDay = day;
  }

  // Routine days and scars
  let totalRoutineDays = 0;
  let totalScars = 0;
  for (const grid of grids) {
    for (const day of grid.days) {
      const dayDate = startOfDay(day.date);
      if (dayDate >= thisWeekStart && dayDate <= today) {
        if (day.status === 'completed') totalRoutineDays++;
        if (day.status === 'scarred') totalScars++;
      }
    }
  }

  // Focus minutes
  const totalFocusMinutes = dailyScores.reduce((sum, d) => sum + d.focusMinutes, 0);

  // Journal entries
  const weekJournalEntries = journalEntries.filter(
    (e) => startOfDay(e.date) >= thisWeekStart && startOfDay(e.date) <= today
  );
  const totalJournalEntries = weekJournalEntries.length;

  // Most common mood
  const moodCounts = new Map<string, number>();
  for (const entry of weekJournalEntries) {
    moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1);
  }
  let mostCommonMood: string | null = null;
  let bestMoodCount = 0;
  for (const [mood, count] of moodCounts) {
    if (count > bestMoodCount) {
      mostCommonMood = mood;
      bestMoodCount = count;
    }
  }

  // vs Last Week
  const lastWeekScores: number[] = [];
  for (let i = 0; i < 7; i++) {
    const date = lastWeekStart + i * MS_PER_DAY;
    const scores = computeDailyScoresForDate(date);
    lastWeekScores.push(scores.overallScore);
  }
  const lastWeekAvg = lastWeekScores.length > 0
    ? lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length
    : 0;
  const vsLastWeek = lastWeekAvg > 0
    ? Math.round(((avgScore - lastWeekAvg) / lastWeekAvg) * 100)
    : 0;

  // Top failure word from scarred day reflections this week
  const failureWords = new Map<string, number>();
  for (const grid of grids) {
    for (const day of grid.days) {
      const dayDate = startOfDay(day.date);
      if (dayDate >= thisWeekStart && dayDate <= today && day.status === 'scarred' && day.failureReason) {
        const words = day.failureReason
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
        for (const word of words) {
          failureWords.set(word, (failureWords.get(word) || 0) + 1);
        }
      }
    }
  }
  let topFailureWord: string | null = null;
  let topFailureCount = 0;
  for (const [word, count] of failureWords) {
    if (count > topFailureCount) {
      topFailureWord = word;
      topFailureCount = count;
    }
  }

  return {
    weekStart: thisWeekStart,
    dailyScores,
    avgScore,
    bestDay,
    worstDay,
    totalRoutineDays,
    totalScars,
    totalFocusMinutes,
    totalJournalEntries,
    mostCommonMood,
    vsLastWeek,
    topFailureWord,
  };
}

/** Helper: compute a single day's scores */
function computeDailyScoresForDate(date: number): DailyScore {
  const { grids, dailyTodos } = useReflectorStore.getState();
  const { focusSessions } = useFocusStore.getState();
  const { journalEntries } = useJournalStore.getState();

  let routineTotal = 0;
  let routineCompleted = 0;
  for (const grid of grids) {
    for (const day of grid.days) {
      if (startOfDay(day.date) === date && day.status !== 'pending') {
        routineTotal++;
        if (day.status === 'completed') routineCompleted++;
      }
    }
  }
  const routineCompletion = routineTotal > 0 ? routineCompleted / routineTotal : 0;

  const tasksCompleted = dailyTodos.filter(
    (t) => startOfDay(t.date) === date && t.completed
  ).length;

  const focusMinutes = Math.round(
    focusSessions
      .filter((s) => startOfDay(s.startTime) === date && s.completed)
      .reduce((sum, s) => sum + s.actualDuration / 60000, 0)
  );

  const journalCount = journalEntries.filter(
    (e) => startOfDay(e.date) === date
  ).length;

  const rawScore =
    routineCompletion * 40 +
    tasksCompleted * 2 +
    focusMinutes * 0.3 +
    journalCount * 5;

  return {
    date,
    routineCompletion,
    tasksCompleted,
    focusMinutes,
    journalEntries: journalCount,
    overallScore: Math.min(100, Math.round(rawScore)),
  };
}

/**
 * Correlate focus session time with routine completion.
 */
export function computeFocusRoutineCorrelations(): FocusRoutineCorrelation[] {
  const { grids, routines } = useReflectorStore.getState();
  const { focusSessions } = useFocusStore.getState();

  // Group focus minutes by date
  const focusByDate = new Map<number, number>();
  for (const session of focusSessions) {
    if (!session.completed) continue;
    const date = startOfDay(session.startTime);
    focusByDate.set(date, (focusByDate.get(date) || 0) + session.actualDuration / 60000);
  }

  const results: FocusRoutineCorrelation[] = [];

  for (const routine of routines) {
    const completedDayFocus: number[] = [];
    const missedDayFocus: number[] = [];

    for (const grid of grids) {
      if (grid.routineId !== routine.id) continue;
      for (const day of grid.days) {
        if (day.status === 'pending') continue;
        const date = startOfDay(day.date);
        const focusMins = focusByDate.get(date) || 0;

        if (day.status === 'completed') {
          completedDayFocus.push(focusMins);
        } else if (day.status === 'scarred') {
          missedDayFocus.push(focusMins);
        }
      }
    }

    // Only include if enough overlapping data
    const totalDays = completedDayFocus.length + missedDayFocus.length;
    if (totalDays < 5) continue;

    const avgCompleted = completedDayFocus.length > 0
      ? completedDayFocus.reduce((a, b) => a + b, 0) / completedDayFocus.length
      : 0;
    const avgMissed = missedDayFocus.length > 0
      ? missedDayFocus.reduce((a, b) => a + b, 0) / missedDayFocus.length
      : 0;

    // Simple correlation: positive if more focus on completed days
    const maxAvg = Math.max(avgCompleted, avgMissed, 1);
    const correlation = (avgCompleted - avgMissed) / maxAvg;

    results.push({
      routineTitle: routine.title,
      avgFocusMinutesOnCompletedDays: Math.round(avgCompleted),
      avgFocusMinutesOnMissedDays: Math.round(avgMissed),
      correlation: Math.round(correlation * 100) / 100,
    });
  }

  return results;
}

/**
 * Compute mood × completion insight.
 */
export function computeMoodCompletionInsight(): MoodCompletionInsight | null {
  const { grids } = useReflectorStore.getState();
  const { journalEntries } = useJournalStore.getState();

  if (journalEntries.length === 0) return null;

  // Map journal entries by date
  const moodByDate = new Map<number, number[]>();
  for (const entry of journalEntries) {
    const date = startOfDay(entry.date);
    const numeric = MOOD_NUMERIC[entry.mood];
    if (!moodByDate.has(date)) moodByDate.set(date, []);
    moodByDate.get(date)!.push(numeric);
  }

  const completedDayMoods: number[] = [];
  const missedDayMoods: number[] = [];

  for (const grid of grids) {
    for (const day of grid.days) {
      if (day.status === 'pending') continue;
      const date = startOfDay(day.date);
      const moods = moodByDate.get(date);
      if (!moods || moods.length === 0) continue;

      const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
      if (day.status === 'completed') {
        completedDayMoods.push(avgMood);
      } else if (day.status === 'scarred') {
        missedDayMoods.push(avgMood);
      }
    }
  }

  if (completedDayMoods.length === 0 && missedDayMoods.length === 0) return null;

  return {
    avgMoodOnCompletedDays: completedDayMoods.length > 0
      ? Math.round((completedDayMoods.reduce((a, b) => a + b, 0) / completedDayMoods.length) * 10) / 10
      : 0,
    avgMoodOnMissedDays: missedDayMoods.length > 0
      ? Math.round((missedDayMoods.reduce((a, b) => a + b, 0) / missedDayMoods.length) * 10) / 10
      : 0,
    completedDayCount: completedDayMoods.length,
    missedDayCount: missedDayMoods.length,
  };
}
