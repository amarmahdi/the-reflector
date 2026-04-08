import { useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui';
import { useGamificationStore } from '@/store/useGamificationStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Styled Components ────────────────────────────────────────────────────────

const Container = styled.View`
  flex: 1;
  background-color: ${COLORS.surface0};
`;

const SkipButton = styled.Pressable`
  position: absolute;
  top: 60px;
  right: 24px;
  z-index: 10;
  padding: 8px 16px;
`;

const SkipText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
`;

const Page = styled.View`
  width: ${SCREEN_WIDTH}px;
  height: ${SCREEN_HEIGHT}px;
  align-items: center;
  justify-content: center;
  padding: 40px 36px;
`;

const DotsContainer = styled.View`
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  flex-direction: row;
  justify-content: center;
  gap: 10px;
  z-index: 10;
`;

const Dot = styled.View<{ active: boolean }>`
  width: ${({ active }: { active: boolean }) => (active ? 28 : 8)}px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ active }: { active: boolean }) =>
    active ? COLORS.crimson : COLORS.border};
`;

// Page 1 styles
const BigTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 2px;
  text-align: center;
  line-height: 44px;
`;

const BigTitleAccent = styled.Text`
  color: ${COLORS.crimson};
`;

const Subtitle = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-align: center;
  margin-top: 16px;
  line-height: 22px;
`;

// Page 2 styles
const PageTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
  text-align: center;
  margin-bottom: 24px;
`;

const GridContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  width: 200px;
  gap: 4px;
  justify-content: center;
  margin-bottom: 32px;
`;

const GridCell = styled.View<{ filled: boolean; scarred: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background-color: ${({
    filled,
    scarred,
  }: {
    filled: boolean;
    scarred: boolean;
  }) =>
    scarred
      ? COLORS.surface3
      : filled
        ? COLORS.crimson
        : COLORS.surface2};
  border-width: 1px;
  border-color: ${({
    filled,
    scarred,
  }: {
    filled: boolean;
    scarred: boolean;
  }) =>
    scarred
      ? COLORS.textDim
      : filled
        ? COLORS.crimson
        : COLORS.border};
`;

const PageBody = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 15px;
  font-weight: 500;
  line-height: 24px;
  text-align: center;
  max-width: 300px;
`;

const BodyAccent = styled.Text`
  color: ${COLORS.crimson};
  font-weight: 700;
`;



// ── Decorative Mini Grid ─────────────────────────────────────────────────────

const GRID_PATTERN: ('filled' | 'scar' | 'empty')[] = [
  'filled', 'filled', 'filled', 'filled', 'filled', 'filled', 'filled', 'filled',
  'filled', 'filled', 'filled', 'scar', 'filled', 'filled', 'filled', 'filled',
  'filled', 'filled', 'filled', 'filled', 'filled', 'scar', 'filled', 'filled',
  'filled', 'filled', 'filled', 'filled', 'empty', 'empty', 'empty', 'empty',
  'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
];

// ── Pulsing Text Component ──────────────────────────────────────────────────

function PulsingText({ children }: { children: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        {
          color: COLORS.crimson,
          fontSize: 24,
          fontWeight: '700',
          letterSpacing: 2,
          marginTop: 24,
        },
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}

// ── Fade-In Wrapper ─────────────────────────────────────────────────────────

function FadeInView({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 700 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 700 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const setOnboarded = useGamificationStore((s) => s.setOnboarded);
  const router = useRouter();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleFinish = () => {
    setOnboarded();
    router.replace('/');
  };

  return (
    <Container>
      <SkipButton onPress={handleFinish}>
        <SkipText>Skip</SkipText>
      </SkipButton>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {/* Page 1: Welcome */}
        <Page>
          <FadeInView delay={300}>
            <BigTitle>
              The{'\n'}
              <BigTitleAccent>Reflector</BigTitleAccent>
            </BigTitle>
          </FadeInView>
          <FadeInView delay={800}>
            <Subtitle>Discipline is built,{'\n'}not found.</Subtitle>
          </FadeInView>
        </Page>

        {/* Page 2: 40-Day Grid */}
        <Page>
          <FadeInView delay={0}>
            <PageTitle>The 40-Day Grid</PageTitle>
          </FadeInView>
          <FadeInView delay={200}>
            <GridContainer>
              {GRID_PATTERN.map((type, i) => (
                <GridCell key={i} filled={type === 'filled'} scarred={type === 'scar'} />
              ))}
            </GridContainer>
          </FadeInView>
          <FadeInView delay={400}>
            <PageBody>
              Commit to <BodyAccent>40 days</BodyAccent> of your routine. Each day you complete fills a cell. Miss a day and you earn a <BodyAccent>scar</BodyAccent> — a permanent mark on your grid.
            </PageBody>
          </FadeInView>
        </Page>

        {/* Page 3: Face Your Failures */}
        <Page>
          <FadeInView delay={0}>
            <PageTitle>Face Your Failures</PageTitle>
          </FadeInView>
          <FadeInView delay={300}>
            <PageBody>
              When you miss a day, you can't just move on. You must <BodyAccent>reflect</BodyAccent> on what went wrong before continuing. No sugarcoating. No excuses.{'\n\n'}The grid stays locked until you face it.
            </PageBody>
          </FadeInView>
          <FadeInView delay={600}>
            <PulsingText>Face it.</PulsingText>
          </FadeInView>
        </Page>

        {/* Page 4: Ready */}
        <Page>
          <FadeInView delay={0}>
            <BigTitle>Ready?</BigTitle>
          </FadeInView>
          <FadeInView delay={400}>
            <Subtitle>
              No shortcuts.{'\n'}No cheat codes.{'\n'}Just you and the grid.
            </Subtitle>
          </FadeInView>
          <FadeInView delay={800}>
            <PrimaryButton 
              onPress={handleFinish} 
              label="Let's begin" 
              style={{
                marginTop: 32,
                shadowColor: COLORS.crimson,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            />
          </FadeInView>
        </Page>
      </ScrollView>

      <DotsContainer>
        {[0, 1, 2, 3].map((i) => (
          <Dot key={i} active={currentPage === i} />
        ))}
      </DotsContainer>
    </Container>
  );
}
