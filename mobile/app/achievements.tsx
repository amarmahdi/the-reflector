// ──────────────────────────────────────────────
// The Reflector – Achievements Gallery (Restyled)
// ──────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { FlatList, Dimensions, Pressable } from 'react-native';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { Screen, Card } from '@/components/ui';
import { useGamificationStore } from '@/store/useGamificationStore';
import { xpForLevel } from '@/types/models';
import type { Achievement, AchievementCategory } from '@/types/models';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements';
import { haptic } from '@/lib/haptics';

// ── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

type FilterTab = 'all' | AchievementCategory;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'streaks', label: 'Streaks' },
  { key: 'grids', label: 'Grids' },
  { key: 'focus', label: 'Focus' },
  { key: 'journal', label: 'Journal' },
  { key: 'special', label: 'Special' },
];

// ── Styled Components ────────────────────────────────────────────────────────



// XP Bar
const XPSection = styled.View`
  padding: 16px 20px;
`;

const XPRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const XPLevelLabel = styled.Text`
  color: ${COLORS.gold};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const XPText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const XPBarTrack = styled.View`
  height: 6px;
  background-color: ${COLORS.surface2};
  border-radius: 3px;
  overflow: hidden;
`;

// Stats row
const StatsRow = styled.View`
  flex-direction: row;
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  margin: 0 20px 12px;
  overflow: hidden;
`;

const StatItem = styled.View`
  flex: 1;
  align-items: center;
  padding: 14px 0;
`;

const StatDivider = styled.View`
  width: 1px;
  background-color: ${COLORS.border};
`;

const StatValue = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 20px;
  font-weight: 900;
`;

const StatLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1.5px;
  margin-top: 3px;
`;

// Filter tabs
const FilterScroll = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
})`
  margin-bottom: 4px;
`;

const FilterChip = styled.Pressable<{ active?: boolean }>`
  border-width: 1px;
  border-color: ${({ active }: { active?: boolean }) => active ? COLORS.gold : COLORS.border};
  background-color: ${({ active }: { active?: boolean }) => active ? COLORS.goldGlow : 'transparent'};
  border-radius: 10px;
  padding: 8px 16px;
`;

const FilterChipText = styled.Text<{ active?: boolean }>`
  color: ${({ active }: { active?: boolean }) => active ? COLORS.gold : COLORS.textDim};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

// Achievement card
const AchievementCardContainer = styled(Card)<{ unlocked?: boolean }>`
  width: ${CARD_WIDTH}px;
  border-color: ${({ unlocked }: { unlocked?: boolean }) => unlocked ? COLORS.gold : COLORS.border};
  padding: 16px;
  margin-bottom: ${CARD_GAP}px;
  opacity: ${({ unlocked }: { unlocked?: boolean }) => unlocked ? 1 : 0.35};
`;

const CardIcon = styled.Text`
  font-size: 32px;
  margin-bottom: 10px;
`;

const CardTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const CardDescription = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
`;

const CardEarned = styled.Text`
  color: ${COLORS.gold};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-top: 10px;
`;

const CardRequirement = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 500;
  font-style: italic;
  margin-top: 8px;
`;

const ListContainer = styled.View`
  flex: 1;
  padding: 0 20px;
`;

// ── Animated Card ────────────────────────────────────────────────────────────

function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (!unlocked) return;
    haptic.light();
    scale.value = withSpring(0.95, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={cardStyle}>
        <AchievementCardContainer unlocked={unlocked}>
          <CardIcon>{unlocked ? achievement.icon : '?'}</CardIcon>
          <CardTitle>{achievement.title}</CardTitle>
          <CardDescription>{achievement.description}</CardDescription>
          {unlocked && achievement.unlockedAt ? (
            <CardEarned>Earned · {formatDate(achievement.unlockedAt)}</CardEarned>
          ) : (
            <CardRequirement>{achievement.requirement}</CardRequirement>
          )}
        </AchievementCardContainer>
      </Animated.View>
    </Pressable>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const gamStore = useGamificationStore();
  const { userStats, achievements } = gamStore;
  const { level, totalXP } = userStats;

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  useEffect(() => {
    gamStore.registerAchievements(
      ACHIEVEMENT_DEFINITIONS.map((d) => ({ ...d, unlockedAt: undefined }))
    );
  }, []);

  // XP progress
  const xpNeeded = xpForLevel(level);
  const xpPrev = level > 1 ? xpForLevel(level - 1) : 0;
  const xpIntoLevel = totalXP - xpPrev;
  const xpRange = xpNeeded - xpPrev;
  const progressRatio = xpRange > 0 ? Math.min(xpIntoLevel / xpRange, 1) : 0;

  const barWidth = useSharedValue(0);
  useEffect(() => {
    barWidth.value = withTiming(progressRatio, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [progressRatio]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
    height: 6,
    backgroundColor: COLORS.gold,
    borderRadius: 3,
  }));

  // Merge definitions
  const mergedAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const stored = achievements.find((a) => a.id === def.id);
    return { ...def, unlockedAt: stored?.unlockedAt };
  });

  const unlockedCount = mergedAchievements.filter((a) => a.unlockedAt).length;
  const totalCount = mergedAchievements.length;

  const filtered = activeFilter === 'all'
    ? mergedAchievements
    : mergedAchievements.filter((a) => a.category === activeFilter);

  const sorted = [...filtered].sort((a, b) => {
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    return 0;
  });

  const renderItem = useCallback(
    ({ item }: { item: Achievement }) => (
      <AchievementCard achievement={item} unlocked={!!item.unlockedAt} />
    ),
    []
  );

  return (
    <Screen>
      {/* XP Bar */}
      <XPSection>
        <XPRow>
          <XPLevelLabel>Level {level}</XPLevelLabel>
          <XPText>{xpIntoLevel} / {xpRange} XP</XPText>
        </XPRow>
        <XPBarTrack>
          <Animated.View style={fillStyle} />
        </XPBarTrack>
      </XPSection>

      {/* Stats */}
      <StatsRow>
        <StatItem>
          <StatValue>{level}</StatValue>
          <StatLabel>LEVEL</StatLabel>
        </StatItem>
        <StatDivider />
        <StatItem>
          <StatValue>{totalXP}</StatValue>
          <StatLabel>TOTAL XP</StatLabel>
        </StatItem>
        <StatDivider />
        <StatItem>
          <StatValue>{unlockedCount}/{totalCount}</StatValue>
          <StatLabel>UNLOCKED</StatLabel>
        </StatItem>
      </StatsRow>

      {/* Filter tabs */}
      <FilterScroll>
        {FILTER_TABS.map((tab) => (
          <FilterChip
            key={tab.key}
            active={activeFilter === tab.key}
            onPress={() => { haptic.selection(); setActiveFilter(tab.key); }}
          >
            <FilterChipText active={activeFilter === tab.key}>{tab.label}</FilterChipText>
          </FilterChip>
        ))}
      </FilterScroll>

      {/* Grid */}
      <ListContainer>
        <FlatList
          data={sorted}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        />
      </ListContainer>
    </Screen>
  );
}
