import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import styled from 'styled-components/native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { useJournalStore } from '@/store/useJournalStore';
import { useReflectorStore } from '@/store/useReflectorStore';
import { MOOD_CONFIG, type JournalMood } from '@/types/models';
import { haptic } from '@/lib/haptics';
import MoodPicker from '@/components/MoodPicker';
import { Screen, StyledInput, PrimaryButton, DangerButton } from '@/components/ui';
import { getJournalInsight } from '@/lib/aiService';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFullDate(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Styled Components (screen-specific) ──────────────────────────────────────

const Content = styled.ScrollView.attrs({
  contentContainerStyle: { padding: SPACING.xl, paddingBottom: 60 },
})``; 

const DateRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${SPACING.md}px;
  margin-bottom: ${SPACING.xl}px;
`;

const MoodEmoji = styled.Text`
  font-size: 36px;
`;

const DateColumn = styled.View``;

const DateText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: ${TYPOGRAPHY.medium};
  letter-spacing: ${TYPOGRAPHY.normal}px;
`;

const MoodLabel = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.normal}px;
  margin-top: 2px;
`;

const BadgeRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${SPACING.sm}px;
  margin-bottom: ${SPACING.xl}px;
`;

const Badge = styled.View<{ variant?: string }>`
  background-color: ${({ variant }: { variant?: string }) =>
    variant === 'crimson' ? COLORS.crimsonGlow : COLORS.surface2};
  border-radius: ${RADIUS.md}px;
  padding: 5px ${SPACING.md}px;
  border-width: 1px;
  border-color: ${({ variant }: { variant?: string }) =>
    variant === 'crimson' ? COLORS.crimson : COLORS.border};
`;

const BadgeText = styled.Text<{ variant?: string }>`
  color: ${({ variant }: { variant?: string }) =>
    variant === 'crimson' ? COLORS.crimson : COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.normal}px;
`;

const EntryTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: ${TYPOGRAPHY.title}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.normal}px;
  margin-bottom: ${SPACING.lg}px;
`;

const EntryBody = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 15px;
  font-weight: ${TYPOGRAPHY.medium};
  line-height: 24px;
  margin-bottom: ${SPACING.xxl}px;
`;

const TagsSection = styled.View`
  margin-top: ${SPACING.sm}px;
`;

const TagsLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: ${SPACING.md}px;
`;

const TagsRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${SPACING.sm}px;
`;

const TagChip = styled.View`
  background-color: ${COLORS.surface2};
  border-radius: ${RADIUS.md}px;
  padding: 5px ${SPACING.md}px;
  border-width: 1px;
  border-color: ${COLORS.border};
`;

const TagText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 11px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.tight}px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: ${COLORS.border};
  margin: ${SPACING.xl}px 0;
`;

const EditBodyInput = styled(StyledInput)`
  min-height: 180px;
  margin-bottom: ${SPACING.md}px;
`;

const PickerLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: ${SPACING.sm}px;
  margin-top: ${SPACING.xs}px;
`;

const ActionRow = styled.View`
  flex-direction: row;
  gap: ${SPACING.md}px;
  margin-top: ${SPACING.lg}px;
`;


// ── Component ────────────────────────────────────────────────────────────────

export default function JournalEntryDetailScreen() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();

  const entries = useJournalStore((s) => s.journalEntries);
  const updateJournalEntry = useJournalStore((s) => s.updateJournalEntry);
  const deleteJournalEntry = useJournalStore((s) => s.deleteJournalEntry);
  const routines = useReflectorStore((s) => s.routines);
  const grids = useReflectorStore((s) => s.grids);

  const entry = entries.find((e) => e.id === entryId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editMood, setEditMood] = useState<JournalMood | null>(null);
  const [editTags, setEditTags] = useState('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);

  if (!entry) {
    return (
      <Screen>
        <Content>
          <EntryTitle>Entry not found</EntryTitle>
          <EntryBody>This journal entry may have been deleted.</EntryBody>
        </Content>
      </Screen>
    );
  }

  const mood = MOOD_CONFIG[entry.mood];
  const linkedGrid = entry.linkedGridId ? grids.find((g) => g.id === entry.linkedGridId) : null;
  const linkedRoutine = linkedGrid ? routines.find((r) => r.id === linkedGrid.routineId) : null;

  // Fetch AI insight for entries > 100 chars
  useEffect(() => {
    if (!entry || entry.body.length < 100) return;
    setAiInsightLoading(true);
    getJournalInsight(entry.id, entry.body, entry.mood)
      .then((insight) => { if (insight) setAiInsight(insight); })
      .catch(() => {})
      .finally(() => setAiInsightLoading(false));
  }, [entry?.id]);

  const startEdit = () => {
    setEditTitle(entry.title);
    setEditBody(entry.body);
    setEditMood(entry.mood);
    setEditTags(entry.tags.join(', '));
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!editTitle.trim() || !editBody.trim() || !editMood) return;
    const parsedTags = editTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    updateJournalEntry(entry.id, { title: editTitle.trim(), body: editBody.trim(), mood: editMood, tags: parsedTags });
    haptic.success();
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete entry', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteJournalEntry(entry.id); haptic.warning(); router.back(); } },
    ]);
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Content>
          {isEditing ? (
            <>
              <PickerLabel>TITLE</PickerLabel>
              <StyledInput value={editTitle} onChangeText={setEditTitle} style={{ marginBottom: SPACING.md }} />
              <PickerLabel>BODY</PickerLabel>
              <EditBodyInput value={editBody} onChangeText={setEditBody} multiline textAlignVertical="top" />
              <PickerLabel>MOOD</PickerLabel>
              <MoodPicker selectedMood={editMood} onSelect={setEditMood} />
              <PickerLabel>TAGS (COMMA-SEPARATED)</PickerLabel>
              <StyledInput value={editTags} onChangeText={setEditTags} style={{ marginBottom: SPACING.md }} />
              <PrimaryButton onPress={saveEdit} label="SAVE CHANGES" style={{ marginTop: SPACING.lg }} />
            </>
          ) : (
            <>
              <DateRow>
                <MoodEmoji>{mood.emoji}</MoodEmoji>
                <DateColumn>
                  <DateText>{formatFullDate(entry.date)}</DateText>
                  <MoodLabel>{mood.label}</MoodLabel>
                </DateColumn>
              </DateRow>

              <BadgeRow>
                {entry.isAutoGenerated && (
                  <Badge variant="crimson">
                    <BadgeText variant="crimson">From reflection</BadgeText>
                  </Badge>
                )}
                {linkedRoutine && entry.linkedDayIndex != null && (
                  <Badge>
                    <BadgeText>Linked: {linkedRoutine.title} — Day {entry.linkedDayIndex}</BadgeText>
                  </Badge>
                )}
              </BadgeRow>

              <Divider />

              <EntryTitle>{entry.title}</EntryTitle>
              <EntryBody>{entry.body}</EntryBody>

              {entry.tags.length > 0 && (
                <TagsSection>
                  <Divider />
                  <TagsLabel>TAGS</TagsLabel>
                  <TagsRow>
                    {entry.tags.map((tag) => (
                      <TagChip key={tag}>
                        <TagText>#{tag}</TagText>
                      </TagChip>
                    ))}
                  </TagsRow>
                </TagsSection>
              )}

              {/* AI Insight */}
              {aiInsightLoading && (
                <>
                  <Divider />
                  <TagsLabel>THE REFLECTOR</TagsLabel>
                  <EntryBody style={{ fontStyle: 'italic', fontSize: 13 }}>Analyzing...</EntryBody>
                </>
              )}
              {aiInsight && (
                <>
                  <Divider />
                  <TagsLabel>THE REFLECTOR</TagsLabel>
                  <EntryBody style={{ fontStyle: 'italic', fontSize: 13 }}>{aiInsight}</EntryBody>
                </>
              )}


              <ActionRow>
                <PrimaryButton onPress={() => { haptic.light(); startEdit(); }} label="Edit" style={{ flex: 1 }} />
                <DangerButton onPress={() => { haptic.light(); handleDelete(); }} label="Delete" style={{ flex: 1 }} />
              </ActionRow>
            </>
          )}
        </Content>
      </KeyboardAvoidingView>
    </Screen>
  );
}
