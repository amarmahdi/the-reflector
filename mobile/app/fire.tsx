import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, StyleSheet, Alert } from 'react-native';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import { useReflectorStore } from '@/store/useReflectorStore';
import { useJournalStore } from '@/store/useJournalStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, REFLECTION_MIN_CHARS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { onJournalEntryCreated, onGridFailed, onDayScarred } from '@/lib/appActions';
import { Screen, PrimaryButton, GhostButton, StyledInput } from '@/components/ui';
import type { Consequence } from '@/lib/consequenceEngine';
import { getLapseReflection } from '@/lib/aiService';
// NOTE: Consequence type kept for compat; renamed conceptually to "Correction"

// ── Blood-red background ─────────────────────────────────────────────────────

const FIRE_BG = '#0D0505';

// ── Styled Components (fire-specific) ────────────────────────────────────────

const FireScreen = styled(Screen)`
  justify-content: center;
  padding: ${SPACING.xxxl}px ${SPACING.xxl}px;
  background-color: ${FIRE_BG};
`;

const Title = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: ${TYPOGRAPHY.title}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.wide}px;
  margin-bottom: ${SPACING.sm}px;
`;

const Subtitle = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  line-height: 20px;
  margin-bottom: ${SPACING.xxxl}px;
`;

const RoutineName = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 15px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.normal}px;
  margin-bottom: ${SPACING.xs}px;
`;

const DayLabel = styled.Text`
  color: ${COLORS.warmRed};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.wide}px;
  margin-bottom: ${SPACING.xxl}px;
`;

const Prompt = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  line-height: 20px;
  margin-bottom: ${SPACING.md}px;
`;

const CharCount = styled.Text<{ met: boolean }>`
  color: ${({ met }: { met: boolean }) => met ? COLORS.textDim : COLORS.warmRed};
  font-size: 11px;
  font-weight: ${TYPOGRAPHY.medium};
  margin-top: ${SPACING.sm}px;
`;

const Counter = styled.Text`
  color: ${COLORS.warmRed};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.bold};
  text-align: center;
  margin-top: ${SPACING.xl}px;
  letter-spacing: ${TYPOGRAPHY.wide}px;
`;

// Niyyah reminder card — shows their intention when they falter
const PactReminder = styled.View`
  background-color: rgba(139, 74, 74, 0.08);
  border-width: 1.5px;
  border-color: ${COLORS.warmRed};
  border-radius: ${RADIUS.lg}px;
  padding: ${SPACING.xl}px;
  margin-bottom: ${SPACING.xxl}px;
`;

const PactReminderTitle = styled.Text`
  color: ${COLORS.warmRed};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.wider}px;
  margin-bottom: ${SPACING.md}px;
`;

const PactReminderText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 17px;
  font-weight: ${TYPOGRAPHY.medium};
  line-height: 24px;
  font-style: italic;
  margin-bottom: ${SPACING.md}px;
`;

const PactReminderLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.wider}px;
  text-transform: uppercase;
  margin-bottom: ${SPACING.xs}px;
  margin-top: ${SPACING.sm}px;
`;

const PactConfrontation = styled.Text`
  color: ${COLORS.warmRed};
  font-size: ${TYPOGRAPHY.subtitle}px;
  font-weight: ${TYPOGRAPHY.bold};
  margin-top: ${SPACING.md}px;
`;

// Correction banner — shown after reflection is submitted
const ConsequenceBanner = styled.View`
  background-color: rgba(139, 74, 74, 0.15);
  border-width: 1px;
  border-color: ${COLORS.warmRed};
  border-radius: ${RADIUS.lg}px;
  padding: ${SPACING.lg}px;
  margin-top: ${SPACING.xxl}px;
`;

const ConsequenceTitle = styled.Text`
  color: ${COLORS.warmRed};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.wide}px;
  margin-bottom: ${SPACING.xs}px;
`;

const ConsequenceMessage = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  line-height: 20px;
  margin-bottom: ${SPACING.sm}px;
`;

const ConsequenceXP = styled.Text`
  color: ${COLORS.warmRed};
  font-size: 20px;
  font-weight: ${TYPOGRAPHY.black};
  letter-spacing: ${TYPOGRAPHY.normal}px;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function TheFireScreen() {
  const router = useRouter();
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const markDayScarred = useReflectorStore((s) => s.markDayScarred);
  const markDayCompleted = useReflectorStore((s) => s.markDayCompleted);
  const checkHardReset = useReflectorStore((s) => s.checkHardReset);
  const failGrid = useReflectorStore((s) => s.failGrid);
  const pacts = useReflectorStore((s) => s.pacts);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reason, setReason] = useState('');
  const [pendingConsequence, setPendingConsequence] = useState<Consequence | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [aiReflectionLoading, setAiReflectionLoading] = useState(false);

  // ── Animations ──
  const vignetteOpacity = useSharedValue(0.15);
  const contentOpacity = useSharedValue(0);
  const consequenceTranslateY = useSharedValue(120);
  const consequenceOpacity = useSharedValue(0);

  // Pulsing red vignette overlay
  useEffect(() => {
    vignetteOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [vignetteOpacity]);

  // On-mount haptics + content fade-in
  useEffect(() => {
    haptic.warning();
    const timeout = setTimeout(() => haptic.error(), 500);
    contentOpacity.value = withTiming(1, { duration: 800 });
    return () => clearTimeout(timeout);
  }, [contentOpacity]);

  const vignetteStyle = useAnimatedStyle(() => ({
    opacity: vignetteOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const consequenceStyle = useAnimatedStyle(() => ({
    opacity: consequenceOpacity.value,
    transform: [{ translateY: consequenceTranslateY.value }],
  }));

  // Derive lapsed entries from raw state
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStart = now.getTime();

  const lapsedEntries = grids
    .filter((g) => g.status === 'active')
    .flatMap((grid) =>
      grid.days
        .filter((day) => day.date < todayStart && day.status === 'pending')
        .map((day) => ({ grid, day }))
    );

  const current = lapsedEntries[currentIndex];
  const routine = current
    ? routines.find((r) => r.id === current.grid.routineId)
    : undefined;

  const charsLeft = Math.max(0, REFLECTION_MIN_CHARS - reason.length);
  const canSubmit = reason.length >= REFLECTION_MIN_CHARS && !submitting;

  // Find pact for the current grid
  const currentPact = current
    ? pacts.find((p) => p.gridId === current.grid.id)
    : undefined;

  // Animate consequence card in
  const showConsequenceAnimation = useCallback(() => {
    consequenceOpacity.value = withTiming(1, { duration: 400 });
    consequenceTranslateY.value = withSpring(0, {
      damping: 12,
      stiffness: 100,
    });
    haptic.error();
  }, [consequenceOpacity, consequenceTranslateY]);

  const handleSubmit = async () => {
    if (!current || submitting) return;
    setSubmitting(true);
    haptic.error();

    // Brief "Recorded." state before proceeding
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    markDayScarred(current.grid.id, current.day.dayIndex, reason.trim());

    // Auto-create journal entry from reflection
    const journalStore = useJournalStore.getState();
    journalStore.addJournalEntry({
      date: todayStart,
      title: `Missed: ${routine?.title ?? 'Unknown'} — Day ${current.day.dayIndex}`,
      body: reason.trim(),
      mood: 'rough',
      tags: ['reflection', 'missed-day'],
      linkedGridId: current.grid.id,
      linkedDayIndex: current.day.dayIndex,
      isAutoGenerated: true,
    });

    // Update gamification stats for journal entry
    onJournalEntryCreated();

    // Apply correction (XP adjustment + lapse tracking)
    const consequence = await onDayScarred();
    setPendingConsequence(consequence);
    setSubmitting(false);

    // Trigger consequence card animation
    showConsequenceAnimation();

    // Fetch AI lapse reflection (async, non-blocking)
    setAiReflectionLoading(true);
    getLapseReflection(reason.trim(), routine?.title ?? 'Unknown', current.day.dayIndex)
      .then((reflection) => { if (reflection) setAiReflection(reflection); })
      .catch(() => {})
      .finally(() => setAiReflectionLoading(false));

    if (checkHardReset(current.grid.id)) {
      failGrid(current.grid.id);
      onGridFailed(current.grid.id);
    }
  };

  const handleContinue = () => {
    setPendingConsequence(null);
    setAiReflection(null);
    setReason('');
    // Reset consequence animation for next entry
    consequenceTranslateY.value = 120;
    consequenceOpacity.value = 0;
    if (currentIndex + 1 < lapsedEntries.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.replace('/');
    }
  };

  // No lapses to reflect on — go home
  if (lapsedEntries.length === 0 || !current) {
    return (
      <FireScreen>
        <Title>The path is clear.</Title>
        <Subtitle>There are no lapses to account for. Walk forward with gratitude.</Subtitle>
        <PrimaryButton onPress={() => router.replace('/')} label="Continue" />
      </FireScreen>
    );
  }

  return (
    <FireScreen>
      {/* Pulsing red vignette overlay */}
      <Animated.View style={[styles.vignette, vignetteStyle]} pointerEvents="none" />

      <Animated.View style={[styles.contentWrap, contentStyle]}>
        <Title>A lapse in your path.</Title>
        <Subtitle>
          Before you continue, account for what happened.
          This is not punishment. This is Muhasabah — accounting for yourself before you are accounted for.
        </Subtitle>

        <RoutineName>{routine?.title ?? 'Unknown Routine'}</RoutineName>
        <DayLabel>Day {current.day.dayIndex} — Unmarked</DayLabel>

        {/* "I actually did this" — late check-in */}
        <GhostButton
          onPress={() => {
            Alert.alert(
              'Late check-in',
              `Mark Day ${current.day.dayIndex} of ${routine?.title ?? 'this routine'} as completed?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, I did it',
                  onPress: () => {
                    haptic.success();
                    markDayCompleted(current.grid.id, current.day.dayIndex);
                    if (currentIndex + 1 < lapsedEntries.length) {
                      setCurrentIndex((prev) => prev + 1);
                    } else {
                      router.replace('/');
                    }
                  },
                },
              ]
            );
          }}
          label="✓ I actually did this — forgot to check in"
          style={{ marginBottom: SPACING.lg }}
        />

        {/* Pact confrontation — show their own words */}
        {currentPact && (
          <PactReminder>
            <PactReminderTitle>📜 YOUR NIYYAH</PactReminderTitle>
            <PactReminderText>"{currentPact.why}"</PactReminderText>

            <PactReminderLabel>What you committed to sacrifice:</PactReminderLabel>
            <PactReminderText>"{currentPact.sacrifice}"</PactReminderText>

            <PactConfrontation>Remember why you started.</PactConfrontation>
          </PactReminder>
        )}

        {pendingConsequence ? (
          // Show consequence after reflection is submitted — animated
          <>
            <Animated.View style={consequenceStyle}>
              <ConsequenceBanner>
                <ConsequenceTitle>THE CORRECTION</ConsequenceTitle>
                <ConsequenceMessage>{pendingConsequence.message}</ConsequenceMessage>
                <ConsequenceXP>-{pendingConsequence.xpPenalty} XP</ConsequenceXP>
              </ConsequenceBanner>
            </Animated.View>
            {/* AI Lapse Reflection */}
            {aiReflectionLoading && (
              <Text style={styles.aiReflectionLoading}>Reflecting...</Text>
            )}
            {aiReflection && (
              <Animated.View style={[styles.aiReflectionCard]}>
                <Text style={styles.aiReflectionLabel}>THE REFLECTOR</Text>
                <Text style={styles.aiReflectionText}>{aiReflection}</Text>
              </Animated.View>
            )}
            <PrimaryButton
              onPress={handleContinue}
              label={currentIndex + 1 < lapsedEntries.length ? 'Next lapse.' : 'Continue'}
              style={{ marginTop: SPACING.xxl }}
            />
          </>
        ) : (
          // Show reflection form
          <>
            <Prompt>
              What got in the way? Be honest with yourself.
            </Prompt>

            <StyledInput
              multiline
              value={reason}
              onChangeText={setReason}
              placeholder="What got in the way?"
              textAlignVertical="top"
              style={styles.reflectionInput}
            />

            <CharCount met={canSubmit}>
              {canSubmit
                ? 'Minimum met'
                : `${charsLeft} more character${charsLeft !== 1 ? 's' : ''} needed`}
            </CharCount>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[
                styles.submitBtn,
                !canSubmit && styles.submitBtnDisabled,
                canSubmit && styles.submitBtnEnabled,
              ]}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Recorded.' : 'I acknowledge this lapse.'}
              </Text>
            </Pressable>

            {lapsedEntries.length > 1 && (
              <Counter>
                Lapse {currentIndex + 1} of {lapsedEntries.length}
              </Counter>
            )}
          </>
        )}
      </Animated.View>
    </FireScreen>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(80, 10, 10, 0.3)',
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  reflectionInput: {
    minHeight: 160,
    borderColor: 'rgba(139, 74, 74, 0.3)',
  },
  submitBtn: {
    backgroundColor: COLORS.warmRed,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnEnabled: {
    shadowColor: COLORS.warmRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.wide,
  },
  aiReflectionLoading: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.caption,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  aiReflectionCard: {
    backgroundColor: 'rgba(139, 74, 74, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  aiReflectionLabel: {
    color: COLORS.crimson,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  aiReflectionText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
