import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReflectorStore } from '@/store/useReflectorStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { COLORS } from '@/constants/theme';
import { computeEngineResults } from '@/lib/correlationEngine';
import { computeHeatmapData, computeWeeklyTrends, computeWeeklySummary } from '@/lib/heatmapEngine';
import { computeDailyScores, computeFocusRoutineCorrelations, computeMoodCompletionInsight } from '@/lib/unifiedEngine';
import type { CorrelationPair, WordFrequency, StreakInfo } from '@/lib/correlationEngine';
import type { JournalMood } from '@/types/models';
import { MOOD_CONFIG } from '@/types/models';
import HeatmapCalendar from '@/components/HeatmapCalendar';
import TrendChart from '@/components/TrendChart';
import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import { useWeekFocusMinutes } from '@/hooks/useStoreData';
import { Screen, EmptyState, SectionHeader, Card, StatPill, ProgressBar } from '@/components/ui';

// ── Styled Components ────────────────────────────────────────────────────────

const SectionWrapper = styled.View`
  padding: 0 20px;
  margin-top: 24px;
`;

const SectionHint = styled.Text`
  color: ${COLORS.textDim};
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 14px;
  line-height: 18px;
`;

// Insight quote card (plain English)
const InsightQuoteCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 20px;
  margin: 16px 20px 0;
`;

const InsightQuoteText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  font-weight: 500;
  font-style: italic;
  line-height: 22px;
  letter-spacing: 0.3px;
`;

const InsightQuoteHighlight = styled.Text`
  color: ${COLORS.crimson};
  font-weight: 700;
  font-style: normal;
`;


// Streak card
const CardHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
`;

const CardTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex: 1;
`;

const RateText = styled.Text<{ good?: boolean }>`
  color: ${({ good }: { good?: boolean }) => good ? COLORS.crimson : COLORS.warmRed};
  font-size: 22px;
  font-weight: 900;
`;

const StatRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 14px;
`;

// Correlation card
const CorrRoutines = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const CorrArrow = styled.Text`
  color: ${COLORS.crimson};
`;

const CorrStats = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 10px;
`;

const CorrStat = styled.View`
  align-items: center;
`;

const CorrStatValue = styled.Text<{ color?: string }>`
  color: ${({ color }: { color?: string }) => color || COLORS.textPrimary};
  font-size: 22px;
  font-weight: 900;
`;

const CorrStatLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1.5px;
  margin-top: 2px;
`;

const CorrSample = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 500;
  text-align: right;
`;

// Word cloud
const WordCloudContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
`;

const WordBubble = styled.View`
  flex-direction: row;
  align-items: baseline;
  background-color: ${COLORS.surface2};
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 6px 12px;
  border-radius: 10px;
  gap: 6px;
`;

const WordText = styled.Text<{ fontSize: number }>`
  color: ${COLORS.crimson};
  font-weight: 700;
  font-size: ${({ fontSize }: { fontSize: number }) => fontSize}px;
`;

const WordCount = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
`;

// Focus correlation
const FocusCorrCard = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
`;

const FocusCorrTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
`;

const FocusCorrRow = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 8px;
`;

const FocusCorrStat = styled.View`
  align-items: center;
`;

const FocusCorrValue = styled.Text<{ accent?: boolean }>`
  color: ${({ accent }: { accent?: boolean }) => accent ? COLORS.warmRed : COLORS.textPrimary};
  font-size: 20px;
  font-weight: 900;
`;

const FocusCorrLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1.5px;
  margin-top: 2px;
`;

const InsightCard = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
`;

const InsightText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
`;

const InsightHighlight = styled.Text`
  color: ${COLORS.crimson};
  font-weight: 700;
`;

// ── Sub-components ───────────────────────────────────────────────────────────

function StreakCard({ streak }: { streak: StreakInfo }) {
  const rate = Math.round(streak.completionRate * 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle numberOfLines={1}>{streak.routineTitle}</CardTitle>
        <RateText good={rate >= 70}>{rate}%</RateText>
      </CardHeader>
      <StatRow>
        <StatPill value={streak.currentStreak} label="CURRENT" />
        <StatPill value={streak.longestStreak} label="LONGEST" />
        <StatPill value={streak.totalCompleted} label="DONE" />
        <StatPill value={streak.totalScarred} label="SCARS" accent />
      </StatRow>
      <ProgressBar percent={rate} height={4} />
    </Card>
  );
}

function CorrelationCard({ pair }: { pair: CorrelationPair }) {
  const effect = Math.round(pair.dominoEffect * 100);
  const isPositive = effect > 0;
  return (
    <Card>
      <CorrRoutines>
        {pair.routineA.title} <CorrArrow>{isPositive ? '→' : '⊘'}</CorrArrow> {pair.routineB.title}
      </CorrRoutines>
      <CorrStats>
        <CorrStat>
          <CorrStatValue>{Math.round(pair.probBGivenA * 100)}%</CorrStatValue>
          <CorrStatLabel>IF A DONE</CorrStatLabel>
        </CorrStat>
        <CorrStat>
          <CorrStatValue color={COLORS.warmRed}>{Math.round(pair.probBGivenAMissed * 100)}%</CorrStatValue>
          <CorrStatLabel>IF A MISSED</CorrStatLabel>
        </CorrStat>
        <CorrStat>
          <CorrStatValue color={isPositive ? COLORS.crimson : COLORS.warmRed}>
            {isPositive ? '+' : ''}{effect}%
          </CorrStatValue>
          <CorrStatLabel>DOMINO</CorrStatLabel>
        </CorrStat>
      </CorrStats>
      <CorrSample>{pair.sampleSize} days analyzed</CorrSample>
    </Card>
  );
}

function WordBubbleItem({ entry, rank }: { entry: WordFrequency; rank: number }) {
  const fontSize = Math.max(11, 22 - rank * 1.2);
  const opacity = Math.max(0.4, 1 - rank * 0.04);
  return (
    <WordBubble style={{ opacity }}>
      <WordText fontSize={fontSize}>{entry.word}</WordText>
      <WordCount>{entry.count}</WordCount>
    </WordBubble>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const userStats = useGamificationStore((s) => s.userStats);
  const weekFocusMinutes = useWeekFocusMinutes();
  const focusSessions = useFocusStore((s) => s.focusSessions);
  const journalEntries = useJournalStore((s) => s.journalEntries);

  const results = useMemo(() => computeEngineResults(grids, routines), [grids, routines]);
  const heatmapData = useMemo(() => computeHeatmapData(grids), [grids]);
  const weeklyTrends = useMemo(() => computeWeeklyTrends(grids), [grids]);
  const weeklySummary = useMemo(() => computeWeeklySummary(grids), [grids]);
  const focusCorrelations = useMemo(() => computeFocusRoutineCorrelations(), [grids, routines]);
  const dailyScores = useMemo(() => computeDailyScores(14), [grids, routines]);
  const moodInsight = useMemo(() => computeMoodCompletionInsight(), [grids]);

  const hasData =
    results.correlations.length > 0 ||
    results.wordCloud.length > 0 ||
    results.streaks.length > 0 ||
    heatmapData.length > 0 ||
    focusCorrelations.length > 0 ||
    dailyScores.some((d) => d.overallScore > 0);

  // Focus insights
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const weekAgo = now.getTime() - 7 * 86400000;
  const weekFocusSessions = focusSessions.filter((s) => s.createdAt >= weekAgo && s.completed).length;

  // Journal insights
  const weekJournalEntries = journalEntries.filter((e) => e.createdAt >= weekAgo);
  const weekJournalCount = weekJournalEntries.length;
  const moodCounts = new Map<string, number>();
  for (const e of weekJournalEntries) {
    moodCounts.set(e.mood, (moodCounts.get(e.mood) ?? 0) + 1);
  }
  let topMood: JournalMood | null = null;
  let topMoodCount = 0;
  for (const [mood, count] of moodCounts) {
    if (count > topMoodCount) { topMood = mood as JournalMood; topMoodCount = count; }
  }

  // Generate plain-English insights
  const plainInsights: string[] = [];
  if (userStats.currentStreak > 0) {
    plainInsights.push(`You're on a ${userStats.currentStreak}-day streak — keep going.`);
  }
  if (focusCorrelations.length > 0) {
    const bestCorr = focusCorrelations[0];
    if (bestCorr.avgFocusMinutesOnCompletedDays > bestCorr.avgFocusMinutesOnMissedDays) {
      plainInsights.push(
        `When you focus ${bestCorr.avgFocusMinutesOnCompletedDays}+ minutes, you're more likely to complete "${bestCorr.routineTitle}".`
      );
    }
  }
  if (moodInsight && moodInsight.avgMoodOnCompletedDays > moodInsight.avgMoodOnMissedDays) {
    plainInsights.push(
      `Your mood is noticeably better on days you complete your routines.`
    );
  }
  if (weekFocusMinutes > 0) {
    plainInsights.push(`You've focused ${weekFocusMinutes} minutes this week.`);
  }

  if (!hasData) {
    return (
      <EmptyState
        icon="📊"
        title="Your insights await"
        subtitle="Complete a few days across your routines to unlock cross-feature analytics and trends."
      />
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Plain-English Insights */}
        {plainInsights.length > 0 && (
          <InsightQuoteCard>
            <InsightQuoteText>
              {plainInsights.map((insight, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? ' ' : ''}{insight}
                </React.Fragment>
              ))}
            </InsightQuoteText>
          </InsightQuoteCard>
        )}

        {/* Weekly Summary */}
        <SectionWrapper>
          <WeeklySummaryCard summary={weeklySummary} />
        </SectionWrapper>

        {/* Focus Insights */}
        {(weekFocusMinutes > 0 || weekFocusSessions > 0) && (
          <SectionWrapper>
            <SectionHeader label="FOCUS INSIGHTS" />
            <Card>
              <StatRow>
                <StatPill value={weekFocusMinutes} label="MINUTES THIS WEEK" />
                <StatPill value={weekFocusSessions} label="SESSIONS" />
              </StatRow>
            </Card>
          </SectionWrapper>
        )}

        {/* Journal Insights */}
        {weekJournalCount > 0 && (
          <SectionWrapper>
            <SectionHeader label="JOURNAL INSIGHTS" />
            <Card>
              <StatRow>
                <StatPill value={weekJournalCount} label="ENTRIES THIS WEEK" />
                <StatPill value={topMood ? MOOD_CONFIG[topMood].emoji : '—'} label={topMood ? `TOP MOOD: ${MOOD_CONFIG[topMood].label}` : 'NO MOOD DATA'} />
              </StatRow>
            </Card>
          </SectionWrapper>
        )}

        {/* Heatmap */}
        {heatmapData.length > 0 && (
          <SectionWrapper>
            <SectionHeader label="CONTRIBUTION HEATMAP" />
            <HeatmapCalendar data={heatmapData} />
          </SectionWrapper>
        )}

        {/* Weekly Trend */}
        {weeklyTrends.some((w) => w.totalDays > 0) && (
          <SectionWrapper>
            <SectionHeader label="WEEKLY TREND" />
            <TrendChart data={weeklyTrends} />
          </SectionWrapper>
        )}

        {/* Streaks */}
        {results.streaks.length > 0 && (
          <SectionWrapper>
            <SectionHeader label="STREAKS" />
            {results.streaks.map((s) => (
              <StreakCard key={s.routineId} streak={s} />
            ))}
          </SectionWrapper>
        )}

        {/* Domino Effects */}
        {results.correlations.length > 0 && (
          <SectionWrapper>
            <SectionHeader label="DOMINO EFFECTS" />
            <SectionHint>How completing one routine influences another.</SectionHint>
            {results.correlations.map((c, i) => (
              <CorrelationCard key={i} pair={c} />
            ))}
          </SectionWrapper>
        )}

        {/* Excuses */}
        {results.wordCloud.length > 0 && (
          <SectionWrapper>
            <SectionHeader label="YOUR EXCUSES" />
            <SectionHint>Most frequent words in your failure reflections.</SectionHint>
            <WordCloudContainer>
              {results.wordCloud.slice(0, 20).map((w, i) => (
                <WordBubbleItem key={w.word} entry={w} rank={i} />
              ))}
            </WordCloudContainer>
          </SectionWrapper>
        )}

        {/* Focus × Routines */}
        {focusCorrelations.length > 0 && (
          <SectionWrapper>
            <SectionHeader label="FOCUS × ROUTINES" />
            <SectionHint>How your focus time relates to routine completion.</SectionHint>
            {focusCorrelations.map((fc) => {
              const pctMore = fc.avgFocusMinutesOnCompletedDays > 0 && fc.avgFocusMinutesOnMissedDays > 0
                ? Math.round(((fc.avgFocusMinutesOnCompletedDays - fc.avgFocusMinutesOnMissedDays) / Math.max(fc.avgFocusMinutesOnMissedDays, 1)) * 100)
                : null;
              return (
                <FocusCorrCard key={fc.routineTitle}>
                  <FocusCorrTitle>{fc.routineTitle}</FocusCorrTitle>
                  <FocusCorrRow>
                    <FocusCorrStat>
                      <FocusCorrValue>{fc.avgFocusMinutesOnCompletedDays}m</FocusCorrValue>
                      <FocusCorrLabel>COMPLETED DAYS</FocusCorrLabel>
                    </FocusCorrStat>
                    <FocusCorrStat>
                      <FocusCorrValue accent>{fc.avgFocusMinutesOnMissedDays}m</FocusCorrValue>
                      <FocusCorrLabel>MISSED DAYS</FocusCorrLabel>
                    </FocusCorrStat>
                  </FocusCorrRow>
                  {pctMore !== null && pctMore > 0 && (
                    <SectionHint>
                      When you focused {fc.avgFocusMinutesOnCompletedDays}+ minutes, you were {pctMore}% more likely to complete this routine.
                    </SectionHint>
                  )}
                </FocusCorrCard>
              );
            })}
          </SectionWrapper>
        )}

        {/* Daily Score Trend */}
        {dailyScores.some((d) => d.overallScore > 0) && (
          <SectionWrapper>
            <SectionHeader label="DAILY SCORE TREND" />
            <SectionHint>Your unified performance over the past 14 days.</SectionHint>
            <TrendChart data={dailyScores.map((d) => ({ weekStart: d.date, completionRate: d.overallScore / 100, totalCompleted: d.tasksCompleted, totalDays: 1 }))} />
          </SectionWrapper>
        )}

        {/* Mood × Completion */}
        {moodInsight && (moodInsight.completedDayCount > 0 || moodInsight.missedDayCount > 0) && (
          <SectionWrapper>
            <SectionHeader label="MOOD × COMPLETION" />
            <InsightCard>
              <InsightText>
                Your mood averaged <InsightHighlight>{moodInsight.avgMoodOnCompletedDays}/5</InsightHighlight> on completed days vs <InsightHighlight>{moodInsight.avgMoodOnMissedDays}/5</InsightHighlight> on missed days.
              </InsightText>
            </InsightCard>
          </SectionWrapper>
        )}
      </ScrollView>
    </Screen>
  );
}
