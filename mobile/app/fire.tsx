import { useState } from 'react';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';

import { useReflectorStore } from '@/store/useReflectorStore';
import { useJournalStore } from '@/store/useJournalStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, REFLECTION_MIN_CHARS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { onJournalEntryCreated, onGridFailed, onDayScarred } from '@/lib/appActions';
import { Screen, PrimaryButton, StyledInput } from '@/components/ui';
import type { Consequence } from '@/lib/consequenceEngine';

// ── Styled Components (fire-specific) ────────────────────────────────────────

const FireScreen = styled(Screen)`
  justify-content: center;
  padding: ${SPACING.xxxl}px ${SPACING.xxl}px;
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
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.medium};
  text-align: center;
  margin-top: ${SPACING.xl}px;
`;

// Pact reminder card
const PactReminder = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.gold};
  border-radius: ${RADIUS.lg}px;
  padding: ${SPACING.lg}px;
  margin-bottom: ${SPACING.xxl}px;
`;

const PactReminderTitle = styled.Text`
  color: ${COLORS.gold};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.wider}px;
  margin-bottom: ${SPACING.md}px;
`;

const PactReminderText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  line-height: 20px;
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
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.semibold};
  margin-top: ${SPACING.md}px;
`;

// Consequence banner — shown after reflection is submitted
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
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.normal}px;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function TheFireScreen() {
  const router = useRouter();
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const markDayScarred = useReflectorStore((s) => s.markDayScarred);
  const checkHardReset = useReflectorStore((s) => s.checkHardReset);
  const failGrid = useReflectorStore((s) => s.failGrid);
  const pacts = useReflectorStore((s) => s.pacts);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reason, setReason] = useState('');
  const [pendingConsequence, setPendingConsequence] = useState<Consequence | null>(null);

  // Derive scarred entries from raw state
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStart = now.getTime();

  const scarredEntries = grids
    .filter((g) => g.status === 'active')
    .flatMap((grid) =>
      grid.days
        .filter((day) => day.date < todayStart && day.status === 'pending')
        .map((day) => ({ grid, day }))
    );

  const current = scarredEntries[currentIndex];
  const routine = current
    ? routines.find((r) => r.id === current.grid.routineId)
    : undefined;

  const charsLeft = Math.max(0, REFLECTION_MIN_CHARS - reason.length);
  const canSubmit = reason.length >= REFLECTION_MIN_CHARS;

  // Find pact for the current grid
  const currentPact = current
    ? pacts.find((p) => p.gridId === current.grid.id)
    : undefined;

  const handleSubmit = async () => {
    if (!current) return;
    haptic.medium();

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

    // Apply consequence (XP penalty + wound tracking + forced reflection flag)
    const consequence = await onDayScarred();
    setPendingConsequence(consequence);

    if (checkHardReset(current.grid.id)) {
      failGrid(current.grid.id);
      onGridFailed(current.grid.id);
    }
  };

  const handleContinue = () => {
    setPendingConsequence(null);
    setReason('');
    if (currentIndex + 1 < scarredEntries.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.replace('/');
    }
  };

  // No scars to reflect on — go home
  if (scarredEntries.length === 0 || !current) {
    return (
      <FireScreen>
        <Title>All caught up</Title>
        <Subtitle>No missed days to reflect on. Keep going.</Subtitle>
        <PrimaryButton onPress={() => router.replace('/')} label="Return Home" />
      </FireScreen>
    );
  }

  return (
    <FireScreen>
      <Title>A day was missed.</Title>
      <Subtitle>
        Before you move forward, take a moment to reflect on what happened.
        This isn't punishment — it's awareness.
      </Subtitle>

      <RoutineName>{routine?.title ?? 'Unknown Routine'}</RoutineName>
      <DayLabel>Day {current.day.dayIndex} — Missed</DayLabel>

      {/* Pact confrontation — show their own words */}
      {currentPact && (
        <PactReminder>
          <PactReminderTitle>📜 You promised:</PactReminderTitle>
          <PactReminderText>"{currentPact.why}"</PactReminderText>

          <PactReminderLabel>You said you'd sacrifice:</PactReminderLabel>
          <PactReminderText>"{currentPact.sacrifice}"</PactReminderText>

          <PactConfrontation>Are you giving up on that?</PactConfrontation>
        </PactReminder>
      )}

      {pendingConsequence ? (
        // Show consequence after reflection is submitted
        <>
          <ConsequenceBanner>
            <ConsequenceTitle>CONSEQUENCE</ConsequenceTitle>
            <ConsequenceMessage>{pendingConsequence.message}</ConsequenceMessage>
            <ConsequenceXP>-{pendingConsequence.xpPenalty} XP</ConsequenceXP>
          </ConsequenceBanner>
          <PrimaryButton
            onPress={handleContinue}
            label={currentIndex + 1 < scarredEntries.length ? 'Next Reflection' : 'Continue'}
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
            placeholder="Write your reflection..."
            textAlignVertical="top"
            style={{ minHeight: 120 }}
          />

          <CharCount met={canSubmit}>
            {canSubmit
              ? 'Minimum met'
              : `${charsLeft} more character${charsLeft !== 1 ? 's' : ''} needed`}
          </CharCount>

          <PrimaryButton
            onPress={handleSubmit}
            label="I understand"
            disabled={!canSubmit}
            style={{ marginTop: SPACING.xxl }}
          />

          {scarredEntries.length > 1 && (
            <Counter>
              {currentIndex + 1} of {scarredEntries.length} reflections
            </Counter>
          )}
        </>
      )}
    </FireScreen>
  );
}
