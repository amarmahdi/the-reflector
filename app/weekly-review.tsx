import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, TextInput as RNTextInput } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/theme';
import { Screen, SectionLabel, PrimaryButton, StyledInput } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useGamificationStore } from '@/store/useGamificationStore';
import { computeWeeklyOverview } from '@/lib/unifiedEngine';
import { MOOD_CONFIG, type JournalMood } from '@/types/models';

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY_INTENTION = 'reflector-weekly-intention';
const STORAGE_KEY_LAST_INTENTION = 'reflector-last-weekly-intention';
const MS_PER_DAY = 86_400_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function formatDayName(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

// ── Styled Components ────────────────────────────────────────────────────────



const Header = styled.View`
  padding: 24px 20px 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
`;

const BackButton = styled.Pressable`
  margin-bottom: 8px;
`;

const BackText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
`;

const HeaderLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 3px;
  margin-bottom: 4px;
`;

const HeaderTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 4px;
`;

const HeaderAccent = styled.Text`
  color: ${COLORS.crimson};
`;

const ContentPad = styled.View`
  padding: 20px;
  padding-bottom: 60px;
`;

// Score Ring
const ScoreRingContainer = styled.View`
  align-items: center;
  margin-bottom: 28px;
`;

const ScoreCircleOuter = styled.View`
  width: 160px;
  height: 160px;
  border-radius: 80px;
  border-width: 6px;
  border-color: ${COLORS.border};
  align-items: center;
  justify-content: center;
  position: relative;
`;

const ScoreCircleFill = styled(Animated.View)<{ progress: number }>`
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 80px;
  border-width: 6px;
  border-color: ${COLORS.crimson};
  border-top-color: transparent;
  border-right-color: transparent;
`;

const ScoreValue = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 2px;
`;

const ScoreLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 3px;
  margin-top: -4px;
`;

// Stats Grid
const StatsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
`;

const StatCard = styled(Animated.View)`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 8px;
  padding: 14px;
  width: 48%;
  flex-grow: 1;
`;

const StatValue = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 1px;
`;

const StatValueAccent = styled.Text`
  color: ${COLORS.crimson};
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 1px;
`;

const StatLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-top: 2px;
`;

const ChangeIndicator = styled.Text<{ positive: boolean }>`
  color: ${({ positive }: { positive: boolean }) =>
    positive ? '#4CAF50' : '#F44336'};
  font-size: 18px;
  font-weight: 900;
`;



// Day Cards
const DayCard = styled(Animated.View)`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 8px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const DayInfo = styled.View``;

const DayName = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1.5px;
`;

const DayDate = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-top: 2px;
`;

const DayScore = styled.Text<{ high?: boolean }>`
  color: ${({ high }: { high?: boolean }) =>
    high ? COLORS.crimson : COLORS.textSecondary};
  font-size: 24px;
  font-weight: 900;
`;

// Mood card
const MoodCard = styled(Animated.View)`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 8px;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
`;

const MoodEmoji = styled.Text`
  font-size: 32px;
`;

const MoodText = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 2px;
`;

const MoodSubtext = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
`;

// Top failure word
const FailureCard = styled(Animated.View)`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 8px;
  padding: 16px;
  align-items: center;
  margin-bottom: 10px;
`;

const FailureWord = styled.Text`
  color: ${COLORS.crimson};
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 3px;
`;

const FailureLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-top: 4px;
`;



const LastIntentionCard = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
`;

const LastIntentionLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 4px;
`;

const LastIntentionText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 700;
  font-style: italic;
`;



// ── Component ────────────────────────────────────────────────────────────────

export default function WeeklyReviewScreen() {
  const router = useRouter();
  const userStats = useGamificationStore((s) => s.userStats);

  const [intention, setIntention] = useState('');
  const [lastIntention, setLastIntention] = useState<string | null>(null);

  const overview = useMemo(() => computeWeeklyOverview(), []);

  // Load intention data
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_LAST_INTENTION).then((val) => {
      if (val) setLastIntention(val);
    });
    AsyncStorage.getItem(STORAGE_KEY_INTENTION).then((val) => {
      if (val) setIntention(val);
    });
  }, []);

  // Score ring animation
  const scoreAnim = useSharedValue(0);
  useEffect(() => {
    scoreAnim.value = withDelay(
      400,
      withSpring(overview.avgScore / 100, { damping: 15, stiffness: 80 })
    );
  }, [overview.avgScore]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scoreAnim.value * 360}deg` }],
    opacity: scoreAnim.value > 0 ? 1 : 0,
  }));

  // Date range
  const weekEnd = overview.weekStart + 6 * MS_PER_DAY;
  const dateRange = `${formatDateShort(overview.weekStart)} — ${formatDateShort(Math.min(weekEnd, Date.now()))}`;

  const handleClose = async () => {
    haptic.success();

    // Save intention for next week
    if (intention.trim()) {
      await AsyncStorage.setItem(STORAGE_KEY_INTENTION, intention.trim());
      // Move current intention to "last" for next week
      await AsyncStorage.setItem(STORAGE_KEY_LAST_INTENTION, intention.trim());
    }

    // Mark review as seen
    await AsyncStorage.setItem(
      'reflector-last-weekly-review',
      String(overview.weekStart)
    );

    router.back();
  };

  const moodConfig = overview.mostCommonMood
    ? MOOD_CONFIG[overview.mostCommonMood as JournalMood]
    : null;

  return (
    <Screen>
      <Header>
        <BackButton onPress={() => router.back()}>
          <BackText>← BACK</BackText>
        </BackButton>
        <HeaderLabel>{dateRange}</HeaderLabel>
        <HeaderTitle>
          WEEK IN <HeaderAccent>REVIEW</HeaderAccent>
        </HeaderTitle>
      </Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ContentPad>
          {/* Score Ring */}
          <ScoreRingContainer>
            <ScoreCircleOuter>
              <ScoreCircleFill progress={overview.avgScore / 100} style={ringStyle} />
              <ScoreValue>{overview.avgScore}</ScoreValue>
              <ScoreLabel>WEEKLY SCORE</ScoreLabel>
            </ScoreCircleOuter>
          </ScoreRingContainer>

          {/* Stats Grid (2x3) */}
          <StatsGrid>
            <StatCard entering={FadeIn.delay(100)}>
              <StatValue>{overview.totalRoutineDays}</StatValue>
              <StatLabel>ROUTINE DAYS</StatLabel>
            </StatCard>
            <StatCard entering={FadeIn.delay(150)}>
              <StatValueAccent>{overview.totalScars}</StatValueAccent>
              <StatLabel>TOTAL SCARS</StatLabel>
            </StatCard>
            <StatCard entering={FadeIn.delay(200)}>
              <StatValue>{overview.totalFocusMinutes}</StatValue>
              <StatLabel>FOCUS MINUTES</StatLabel>
            </StatCard>
            <StatCard entering={FadeIn.delay(250)}>
              <StatValue>{overview.totalJournalEntries}</StatValue>
              <StatLabel>JOURNAL ENTRIES</StatLabel>
            </StatCard>
            <StatCard entering={FadeIn.delay(300)}>
              <StatValue>{userStats.currentStreak}</StatValue>
              <StatLabel>CURRENT STREAK</StatLabel>
            </StatCard>
            <StatCard entering={FadeIn.delay(350)}>
              <ChangeIndicator positive={overview.vsLastWeek >= 0}>
                {overview.vsLastWeek >= 0 ? '▲' : '▼'} {Math.abs(overview.vsLastWeek)}%
              </ChangeIndicator>
              <StatLabel>VS LAST WEEK</StatLabel>
            </StatCard>
          </StatsGrid>

          {/* Best / Worst Day */}
          {overview.bestDay && (
            <>
              <SectionLabel>BEST DAY</SectionLabel>
              <DayCard entering={SlideInDown.delay(400).springify()}>
                <DayInfo>
                  <DayName>{formatDayName(overview.bestDay.date)}</DayName>
                  <DayDate>{formatDateShort(overview.bestDay.date)}</DayDate>
                </DayInfo>
                <DayScore high>{overview.bestDay.overallScore}</DayScore>
              </DayCard>
            </>
          )}

          {overview.worstDay && overview.bestDay?.date !== overview.worstDay?.date && (
            <>
              <SectionLabel>WORST DAY</SectionLabel>
              <DayCard entering={SlideInDown.delay(500).springify()}>
                <DayInfo>
                  <DayName>{formatDayName(overview.worstDay.date)}</DayName>
                  <DayDate>{formatDateShort(overview.worstDay.date)}</DayDate>
                </DayInfo>
                <DayScore>{overview.worstDay.overallScore}</DayScore>
              </DayCard>
            </>
          )}

          {/* Most Common Mood */}
          {moodConfig && (
            <>
              <SectionLabel>MOST COMMON MOOD</SectionLabel>
              <MoodCard entering={FadeIn.delay(600)}>
                <MoodEmoji>{moodConfig.emoji}</MoodEmoji>
                <MoodText>{moodConfig.label}</MoodText>
              </MoodCard>
            </>
          )}

          {/* Top Failure Word */}
          {overview.topFailureWord && (
            <>
              <SectionLabel>YOUR TOP EXCUSE</SectionLabel>
              <FailureCard entering={FadeIn.delay(700)}>
                <FailureWord>"{overview.topFailureWord.toUpperCase()}"</FailureWord>
                <FailureLabel>MOST USED IN REFLECTIONS</FailureLabel>
              </FailureCard>
            </>
          )}

          {/* Last Week's Intention */}
          {lastIntention && (
            <>
              <SectionLabel>LAST WEEK'S INTENTION</SectionLabel>
              <LastIntentionCard>
                <LastIntentionLabel>YOU SAID:</LastIntentionLabel>
                <LastIntentionText>"{lastIntention}"</LastIntentionText>
              </LastIntentionCard>
            </>
          )}

          {/* This Week's Intention */}
          <SectionLabel>SET THIS WEEK'S INTENTION</SectionLabel>
          <StyledInput
            value={intention}
            onChangeText={setIntention}
            placeholder="What will you commit to this week?"
            placeholderTextColor={COLORS.textDim}
            multiline
          />

          <PrimaryButton onPress={handleClose} label="LET'S GO" style={{ marginTop: 20 }} />
        </ContentPad>
      </ScrollView>
    </Screen>
  );
}
