// ──────────────────────────────────────────────
// The Reflector – Daily Review (Muhasabah)
// ──────────────────────────────────────────────
// End-of-day AI analysis. Shows comprehensive review
// of today's performance with patterns, recommendations.

import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { COLORS } from '@/constants/theme';
import { Screen, SectionLabel, PrimaryButton } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { getDailyReview, refreshDailyReview, type AIDailyReview } from '@/lib/aiService';
import { buildFullContext } from '@/lib/aiContext';

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
  font-weight: 600;
  letter-spacing: 1px;
`;

const Title = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 1px;
`;

const Subtitle = styled.Text`
  color: ${COLORS.textDim};
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
`;

const ContentPad = styled.View`
  padding: 20px;
`;

// Quick stats row
const StatsRow = styled.View`
  flex-direction: row;
  gap: 10px;
  margin-bottom: 20px;
`;

const StatCard = styled.View`
  flex: 1;
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 14px 12px;
  align-items: center;
`;

const StatValue = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 20px;
  font-weight: 900;
`;

const StatLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 4px;
`;

// AI Verdict card
const VerdictCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 16px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 20px;
  margin-bottom: 20px;
`;

const VerdictLabel = styled.Text`
  color: ${COLORS.crimson};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
`;

const VerdictText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
`;

// Pattern/Recommendation items
const ItemCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 14px 16px;
  margin-bottom: 8px;
`;

const ItemText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
`;

const RiskBadge = styled.View<{ level: string }>`
  align-self: flex-start;
  background-color: ${({ level }: { level: string }) =>
    level === 'high' ? 'rgba(244, 67, 54, 0.15)' :
    level === 'medium' ? 'rgba(255, 152, 0, 0.15)' :
    'rgba(76, 175, 80, 0.15)'};
  border-width: 1px;
  border-color: ${({ level }: { level: string }) =>
    level === 'high' ? '#F44336' :
    level === 'medium' ? '#FF9800' :
    '#4CAF50'};
  border-radius: 8px;
  padding: 4px 10px;
  margin-bottom: 12px;
`;

const RiskText = styled.Text<{ level: string }>`
  color: ${({ level }: { level: string }) =>
    level === 'high' ? '#F44336' :
    level === 'medium' ? '#FF9800' :
    '#4CAF50'};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const LoadingWrap = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;
`;

const LoadingText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 13px;
  font-weight: 500;
  margin-top: 16px;
  font-style: italic;
`;

const EmptyText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  padding: 40px 20px;
  font-style: italic;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function DailyReviewScreen() {
  const router = useRouter();
  const [review, setReview] = useState<AIDailyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick stats from context
  const ctx = buildFullContext();

  useEffect(() => {
    getDailyReview()
      .then((r) => setReview(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    haptic.light();
    const r = await refreshDailyReview();
    if (r) setReview(r);
    setRefreshing(false);
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header>
          <BackButton onPress={() => router.back()}>
            <BackText>← BACK</BackText>
          </BackButton>
          <Title>Daily Review</Title>
          <Subtitle>{todayDate} · Muhasabah</Subtitle>
        </Header>

        <ContentPad>
          {/* Quick Stats */}
          <StatsRow>
            <StatCard>
              <StatValue>{ctx.currentStreak}</StatValue>
              <StatLabel>Streak</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{ctx.averageScore7d}</StatValue>
              <StatLabel>Avg Score</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{ctx.todayFocusMinutes}</StatValue>
              <StatLabel>Focus Min</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{ctx.todayTodosCompleted}/{ctx.todayTodosTotal}</StatValue>
              <StatLabel>Tasks</StatLabel>
            </StatCard>
          </StatsRow>

          {loading ? (
            <LoadingWrap>
              <ActivityIndicator size="large" color={COLORS.crimson} />
              <LoadingText>The Reflector is analyzing your day...</LoadingText>
            </LoadingWrap>
          ) : review ? (
            <>
              {/* Risk Level */}
              <Animated.View entering={FadeIn.delay(200)}>
                <RiskBadge level={review.riskLevel}>
                  <RiskText level={review.riskLevel}>
                    {review.riskLevel.toUpperCase()} RISK
                  </RiskText>
                </RiskBadge>
              </Animated.View>

              {/* AI Verdict */}
              <Animated.View entering={SlideInDown.delay(300).springify()}>
                <VerdictCard>
                  <VerdictLabel>AI DAILY VERDICT</VerdictLabel>
                  <VerdictText>{review.verdict}</VerdictText>
                </VerdictCard>
              </Animated.View>

              {/* Patterns */}
              {review.patterns.length > 0 && (
                <Animated.View entering={FadeIn.delay(500)}>
                  <SectionLabel>PATTERNS DETECTED</SectionLabel>
                  {review.patterns.map((p, i) => (
                    <ItemCard key={`p-${i}`}>
                      <ItemText>• {p}</ItemText>
                    </ItemCard>
                  ))}
                </Animated.View>
              )}

              {/* Recommendations */}
              {review.recommendations.length > 0 && (
                <Animated.View entering={FadeIn.delay(700)}>
                  <SectionLabel>RECOMMENDATIONS</SectionLabel>
                  {review.recommendations.map((r, i) => (
                    <ItemCard key={`r-${i}`}>
                      <ItemText>→ {r}</ItemText>
                    </ItemCard>
                  ))}
                </Animated.View>
              )}

              {/* Refresh */}
              <PrimaryButton
                onPress={handleRefresh}
                label={refreshing ? 'Refreshing...' : 'Refresh Analysis'}
                style={{ marginTop: 20, opacity: refreshing ? 0.5 : 1 }}
              />
            </>
          ) : (
            <>
              <EmptyText>
                Could not generate analysis right now. Check your AI provider settings or internet connection.
              </EmptyText>
              <PrimaryButton
                onPress={handleRefresh}
                label={refreshing ? 'Trying...' : 'Try Again'}
                style={{ marginTop: 8, opacity: refreshing ? 0.5 : 1 }}
              />
            </>
          )}
        </ContentPad>
      </ScrollView>
    </Screen>
  );
}
