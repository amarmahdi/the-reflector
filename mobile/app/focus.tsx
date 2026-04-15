// ──────────────────────────────────────────────
// The Reflector – Focus Timer (Sacred Growth Design)
// ──────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Vibration, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';

import { COLORS, TYPOGRAPHY } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { onFocusSessionCompleted } from '@/lib/appActions';
import { useFocusStore } from '@/store/useFocusStore';
import { useReflectorStore } from '@/store/useReflectorStore';
import { useTodaySessions } from '@/hooks/useStoreData';
import { FOCUS_PRESETS, FocusSessionType } from '@/types/models';
import { Screen, SectionLabel, PrimaryButton, GhostButton } from '@/components/ui';
import CircularTimer from '@/components/CircularTimer';
import FocusStats from '@/components/FocusStats';
import { getFocusMotivation } from '@/lib/aiService';
import AIMarkdown from '@/components/AIMarkdown';

// ── Types ────────────────────────────────────────────────────────────────────

type TimerState = 'idle' | 'running' | 'paused' | 'complete';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatSessionTime = (ms: number) => {
  const d = new Date(ms);
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'pm' : 'am';
  return `${h}:${m} ${ampm}`;
};

const PRESET_KEYS: FocusSessionType[] = ['pomodoro', 'deep-work', 'flow', 'custom'];

// ── Styled Components ────────────────────────────────────────────────────────

// Custom header bar
const HeaderBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px 12px;
`;

const BackButton = styled.Pressable`
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
`;

const BackIcon = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 22px;
`;

const HeaderTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 16px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.wide}px;
`;

const HeaderSpacer = styled.View`
  width: 44px;
`;

const ContentContainer = styled.View`
  padding: 0 20px 40px;
  align-items: center;
`;

// ── Context Selector ─────────────────────────────────────────────────────────

const ContextSection = styled.View`
  width: 100%;
  margin-bottom: 24px;
`;

const ContextLabel = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  margin-bottom: 12px;
`;

const ChipScroll = styled.ScrollView`
  margin-bottom: 4px;
`;

const ContextChip = styled.Pressable<{ active?: boolean }>`
  background-color: ${({ active }: { active?: boolean }) =>
    active ? COLORS.crimsonGlow : COLORS.surface1};
  border-width: 1px;
  border-color: ${({ active }: { active?: boolean }) =>
    active ? COLORS.crimson : COLORS.border};
  border-radius: 14px;
  padding: 10px 18px;
  margin-right: 8px;
`;

const ContextChipText = styled.Text<{ active?: boolean }>`
  color: ${({ active }: { active?: boolean }) =>
    active ? COLORS.crimson : COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.normal}px;
`;

// ── Session Type Selector ────────────────────────────────────────────────────

const SelectorRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-bottom: 28px;
  width: 100%;
`;

const PresetCard = styled.Pressable<{ isSelected: boolean }>`
  flex: 1;
  align-items: center;
  padding: 14px 4px;
  border-radius: 14px;
  border-width: 1px;
  border-color: ${({ isSelected }: { isSelected: boolean }) =>
    isSelected ? COLORS.crimson : COLORS.border};
  background-color: ${({ isSelected }: { isSelected: boolean }) =>
    isSelected ? COLORS.crimsonGlow : COLORS.surface1};
`;

const PresetIcon = styled.Text`
  font-size: 22px;
  margin-bottom: 6px;
`;

const PresetLabel = styled.Text<{ isSelected: boolean }>`
  color: ${({ isSelected }: { isSelected: boolean }) =>
    isSelected ? COLORS.textPrimary : COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.micro}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.wider}px;
  text-align: center;
`;

const PresetMinutes = styled.Text<{ isSelected: boolean }>`
  color: ${({ isSelected }: { isSelected: boolean }) =>
    isSelected ? COLORS.crimson : COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  margin-top: 2px;
`;

// ── Custom Stepper ───────────────────────────────────────────────────────────

const StepperRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
`;

const StepperBtn = styled.Pressable`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${COLORS.surface2};
  border-width: 1px;
  border-color: ${COLORS.border};
  align-items: center;
  justify-content: center;
`;

const StepperBtnText = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 20px;
  font-weight: ${TYPOGRAPHY.bold};
`;

const StepperValue = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 32px;
  font-weight: ${TYPOGRAPHY.black};
  min-width: 60px;
  text-align: center;
`;

const StepperUnit = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: 2px;
`;

// ── Timer Area ───────────────────────────────────────────────────────────────

const TimerContainer = styled.View`
  margin-bottom: 8px;
  align-items: center;
`;

const TimerText = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 48px;
  font-weight: ${TYPOGRAPHY.black};
`;

const TimerSessionLabel = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.medium};
  letter-spacing: ${TYPOGRAPHY.normal}px;
  margin-top: 4px;
`;

// ── Controls ─────────────────────────────────────────────────────────────────

const ControlsRow = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 28px;
  margin-bottom: 36px;
`;

// ── Completion ───────────────────────────────────────────────────────────────

const CompletionContainer = styled.View`
  align-items: center;
  margin-top: 28px;
  margin-bottom: 36px;
`;

const CompletionText = styled.Text`
  color: ${COLORS.crimson};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.wide}px;
  margin-bottom: 16px;
`;

const XPFloat = styled(Animated.Text)`
  color: ${COLORS.gold};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.wide}px;
  margin-bottom: 16px;
`;

// ── Today's Sessions ─────────────────────────────────────────────────────────

const SessionsSection = styled.View`
  width: 100%;
  margin-top: 8px;
`;

const SessionCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  overflow: hidden;
`;

const SessionRow = styled.View<{ cancelled?: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: 14px 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
  opacity: ${({ cancelled }: { cancelled?: boolean }) => cancelled ? 0.5 : 1};
`;

const SessionIcon = styled.Text`
  font-size: 16px;
  margin-right: 12px;
`;

const SessionInfo = styled.View`
  flex: 1;
`;

const SessionType = styled.Text<{ cancelled?: boolean }>`
  color: ${({ cancelled }: { cancelled?: boolean }) =>
    cancelled ? COLORS.textDim : COLORS.textPrimary};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  letter-spacing: ${TYPOGRAPHY.tight}px;
  text-decoration-line: ${({ cancelled }: { cancelled?: boolean }) =>
    cancelled ? 'line-through' : 'none'};
`;

const SessionTime = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.medium};
  margin-top: 2px;
`;

const SessionDuration = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.semibold};
  margin-right: 8px;
`;

const SessionStatus = styled.Text<{ completed: boolean }>`
  color: ${({ completed }: { completed: boolean }) =>
    completed ? COLORS.crimson : COLORS.warmRed};
  font-size: 14px;
`;

const SessionSummaryRow = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 12px 16px;
  gap: 16px;
`;

const SummaryText = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.medium};
  letter-spacing: ${TYPOGRAPHY.normal}px;
`;

const StatsContainer = styled.View`
  width: 100%;
  margin-top: 24px;
`;

const EmptySessionsText = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  text-align: center;
  padding: 40px 20px;
`;

const AIFocusCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 14px 16px;
  width: 100%;
  margin-bottom: 20px;
`;

const AIFocusLabel = styled.Text`
  color: ${COLORS.crimson};
  font-size: 9px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const AIFocusText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: ${TYPOGRAPHY.medium};
  line-height: 19px;
  font-style: italic;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function FocusTimerScreen() {
  useKeepAwake();
  const router = useRouter();

  const addFocusSession = useFocusStore((s) => s.addFocusSession);
  const todaySessions = useTodaySessions();
  const routines = useReflectorStore((s) => s.routines);
  const grids = useReflectorStore((s) => s.grids);

  // Active routines (those with active grids)
  const activeRoutines = grids
    .filter((g) => g.status === 'active')
    .map((g) => routines.find((r) => r.id === g.routineId))
    .filter(Boolean) as { id: string; title: string }[];

  // Timer state
  const [selectedType, setSelectedType] = useState<FocusSessionType>('pomodoro');
  const [focusContext, setFocusContext] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [remainingMs, setRemainingMs] = useState(25 * 60 * 1000);
  const [totalDurationMs, setTotalDurationMs] = useState(25 * 60 * 1000);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);
  const [aiMotivation, setAiMotivation] = useState<string | null>(null);
  const [aiCompletion, setAiCompletion] = useState<string | null>(null);

  // Get duration for selected type
  const getDurationMs = useCallback(
    (type: FocusSessionType): number => {
      if (type === 'custom') return customMinutes * 60 * 1000;
      return FOCUS_PRESETS[type].minutes * 60 * 1000;
    },
    [customMinutes]
  );

  // Update remaining time when preset changes (only while idle)
  useEffect(() => {
    if (timerState === 'idle') {
      const duration = getDurationMs(selectedType);
      setRemainingMs(duration);
      setTotalDurationMs(duration);
    }
  }, [selectedType, customMinutes, timerState, getDurationMs]);

  // Fetch AI motivation on mount
  useEffect(() => {
    getFocusMotivation('before')
      .then((msg) => { if (msg) setAiMotivation(msg); })
      .catch(() => {});
  }, []);

  // Timer interval
  useEffect(() => {
    if (timerState !== 'running') return;

    const id = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(id);
          handleTimerComplete();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [timerState]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTimerComplete = useCallback(() => {
    setTimerState('complete');
    haptic.success();
    Vibration.vibrate([0, 500, 200, 500]);

    const now = Date.now();
    const session = addFocusSession({
      startTime: startTimeRef.current,
      endTime: now,
      duration: totalDurationMs,
      actualDuration: totalDurationMs,
      type: selectedType,
      completed: true,
    });

    // Gamification
    const unlocked = onFocusSessionCompleted(session);
    const earnedXP = Math.round(totalDurationMs / 60000); // 1 XP per minute
    setXpAmount(earnedXP);
    setShowXP(true);
    setTimeout(() => setShowXP(false), 3000);

    // Fetch AI completion message
    getFocusMotivation('after', Math.round(totalDurationMs / 60000))
      .then((msg) => { if (msg) setAiCompletion(msg); })
      .catch(() => {});
  }, [totalDurationMs, selectedType, addFocusSession]);

  const handleStart = () => {
    haptic.heavy();
    const duration = getDurationMs(selectedType);
    setTotalDurationMs(duration);
    setRemainingMs(duration);
    startTimeRef.current = Date.now();
    elapsedBeforePauseRef.current = 0;
    setTimerState('running');
  };

  const handlePause = () => {
    haptic.medium();
    elapsedBeforePauseRef.current = totalDurationMs - remainingMs;
    setTimerState('paused');
  };

  const handleResume = () => {
    haptic.medium();
    setTimerState('running');
  };

  const handleReset = () => {
    haptic.light();

    if (timerState === 'running' || timerState === 'paused') {
      const elapsed = totalDurationMs - remainingMs;
      if (elapsed > 0) {
        addFocusSession({
          startTime: startTimeRef.current,
          endTime: Date.now(),
          duration: totalDurationMs,
          actualDuration: elapsed,
          type: selectedType,
          completed: false,
        });
      }
    }

    const duration = getDurationMs(selectedType);
    setRemainingMs(duration);
    setTotalDurationMs(duration);
    setTimerState('idle');
  };

  const handleStartNew = () => {
    haptic.light();
    setShowXP(false);
    const duration = getDurationMs(selectedType);
    setRemainingMs(duration);
    setTotalDurationMs(duration);
    setTimerState('idle');
  };

  const handleSelectPreset = (type: FocusSessionType) => {
    if (timerState !== 'idle') return;
    haptic.selection();
    setSelectedType(type);
  };

  const handleCustomAdjust = (delta: number) => {
    haptic.light();
    setCustomMinutes((prev) => Math.max(1, Math.min(180, prev + delta)));
  };

  // Progress
  const progress = totalDurationMs > 0 ? remainingMs / totalDurationMs : 0;
  const sessionLabel = FOCUS_PRESETS[selectedType].label;
  const completedToday = todaySessions.filter((s) => s.completed);
  const totalMinutesToday = Math.round(
    completedToday.reduce((sum, s) => sum + s.actualDuration / 60000, 0)
  );

  return (
    <Screen>
      {/* ── Custom Header ─────────────────────────────────────── */}
      <HeaderBar>
        <BackButton onPress={() => { haptic.light(); router.back(); }}>
          <BackIcon>←</BackIcon>
        </BackButton>
        <HeaderTitle>The Crucible</HeaderTitle>
        <HeaderSpacer />
      </HeaderBar>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
      >
        <ContentContainer>
          {/* ── Context Selector ─────────────────────────────────── */}
          {timerState === 'idle' && (
            <ContextSection>
              <ContextLabel>What are you working on?</ContextLabel>
              <ChipScroll horizontal showsHorizontalScrollIndicator={false}>
                {activeRoutines.map((r) => (
                  <ContextChip
                    key={r.id}
                    active={focusContext === r.id}
                    onPress={() => {
                      haptic.selection();
                      setFocusContext(focusContext === r.id ? null : r.id);
                    }}
                  >
                    <ContextChipText active={focusContext === r.id}>
                      {r.title}
                    </ContextChipText>
                  </ContextChip>
                ))}
                <ContextChip
                  active={focusContext === 'free'}
                  onPress={() => {
                    haptic.selection();
                    setFocusContext(focusContext === 'free' ? null : 'free');
                  }}
                >
                  <ContextChipText active={focusContext === 'free'}>
                    Free Focus
                  </ContextChipText>
                </ContextChip>
              </ChipScroll>
            </ContextSection>
          )}

          {/* ── AI Focus Motivation ─── */}
          {aiMotivation && timerState === 'idle' && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ width: '100%' }}>
              <AIFocusCard>
                <AIFocusLabel>THE REFLECTOR</AIFocusLabel>
                <AIMarkdown>{aiMotivation}</AIMarkdown>
              </AIFocusCard>
            </Animated.View>
          )}

          {/* ── Session Type Selector ────────────────────────────── */}
          <SelectorRow>
            {PRESET_KEYS.map((type) => {
              const preset = FOCUS_PRESETS[type];
              const isSelected = selectedType === type;
              return (
                <PresetCard
                  key={type}
                  isSelected={isSelected}
                  onPress={() => handleSelectPreset(type)}
                  disabled={timerState !== 'idle'}
                >
                  <PresetIcon>{preset.icon}</PresetIcon>
                  <PresetLabel isSelected={isSelected}>
                    {preset.label}
                  </PresetLabel>
                  {type !== 'custom' && (
                    <PresetMinutes isSelected={isSelected}>
                      {preset.minutes}m
                    </PresetMinutes>
                  )}
                </PresetCard>
              );
            })}
          </SelectorRow>

          {/* ── Custom Time Stepper ──────────────────────────────── */}
          {selectedType === 'custom' && timerState === 'idle' && (
            <StepperRow>
              <StepperBtn onPress={() => handleCustomAdjust(-5)}>
                <StepperBtnText>−</StepperBtnText>
              </StepperBtn>
              <StepperBtn onPress={() => handleCustomAdjust(-1)}>
                <StepperBtnText>−</StepperBtnText>
              </StepperBtn>
              <TimerContainer>
                <StepperValue>{customMinutes}</StepperValue>
                <StepperUnit>MINUTES</StepperUnit>
              </TimerContainer>
              <StepperBtn onPress={() => handleCustomAdjust(1)}>
                <StepperBtnText>+</StepperBtnText>
              </StepperBtn>
              <StepperBtn onPress={() => handleCustomAdjust(5)}>
                <StepperBtnText>+</StepperBtnText>
              </StepperBtn>
            </StepperRow>
          )}

          {/* ── Circular Timer ──────────────────────────────────── */}
          <TimerContainer>
            <CircularTimer
              progress={progress}
              size={250}
              strokeWidth={6}
              isComplete={timerState === 'complete'}
            >
              <TimerText>{formatTime(remainingMs)}</TimerText>
              <TimerSessionLabel>{sessionLabel}</TimerSessionLabel>
            </CircularTimer>
          </TimerContainer>

          {/* ── Controls ─────────────────────────────────────────── */}
          {timerState === 'complete' ? (
            <CompletionContainer>
              <CompletionText>Session complete 🌱</CompletionText>
              {showXP && (
                <XPFloat entering={FadeInDown.duration(400)}>
                  +{xpAmount} XP
                </XPFloat>
              )}
              <PrimaryButton onPress={handleStartNew} label="Start Another" />
              {aiCompletion && (
                <AIFocusCard style={{ marginTop: 16 }}>
                  <AIFocusLabel>THE REFLECTOR</AIFocusLabel>
                  <AIMarkdown>{aiCompletion}</AIMarkdown>
                </AIFocusCard>
              )}
            </CompletionContainer>
          ) : (
            <ControlsRow>
              {timerState === 'idle' && (
                <PrimaryButton onPress={handleStart} label="Start" />
              )}

              {timerState === 'running' && (
                <>
                  <PrimaryButton onPress={handlePause} label="Pause" />
                  <GhostButton onPress={handleReset} label="Reset" />
                </>
              )}

              {timerState === 'paused' && (
                <>
                  <PrimaryButton onPress={handleResume} label="Resume" />
                  <GhostButton onPress={handleReset} label="Reset" />
                </>
              )}
            </ControlsRow>
          )}

          {/* ── Today's Sessions ─────────────────────────────────── */}
          <SessionsSection>
            <SectionLabel>TODAY'S SESSIONS</SectionLabel>

            {todaySessions.length === 0 ? (
              <EmptySessionsText>
                No sessions yet today — start your first focus block above.
              </EmptySessionsText>
            ) : (
              <SessionCard>
                {todaySessions
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((session) => {
                    const preset = FOCUS_PRESETS[session.type];
                    const mins = Math.round(session.actualDuration / 60000);
                    return (
                      <SessionRow key={session.id} cancelled={!session.completed}>
                        <SessionIcon>{preset.icon}</SessionIcon>
                        <SessionInfo>
                          <SessionType cancelled={!session.completed}>
                            {preset.label}
                          </SessionType>
                          <SessionTime>{formatSessionTime(session.startTime)}</SessionTime>
                        </SessionInfo>
                        <SessionDuration>{mins} min</SessionDuration>
                        <SessionStatus completed={session.completed}>
                          {session.completed ? '✓' : '✕'}
                        </SessionStatus>
                      </SessionRow>
                    );
                  })}
                <SessionSummaryRow>
                  <SummaryText>
                    {completedToday.length} session{completedToday.length !== 1 ? 's' : ''} · {totalMinutesToday} min total
                  </SummaryText>
                </SessionSummaryRow>
              </SessionCard>
            )}
          </SessionsSection>

          {/* ── Stats ─────────────────────────────────────────────── */}
          <StatsContainer>
            <SectionLabel>YOUR PROGRESS</SectionLabel>
            <FocusStats />
          </StatsContainer>
        </ContentContainer>
      </ScrollView>
    </Screen>
  );
}
