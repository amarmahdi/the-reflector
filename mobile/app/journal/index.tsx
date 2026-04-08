import React, { useState, useMemo } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';

import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/theme';
import { useJournalStore } from '@/store/useJournalStore';
import { useAllJournalTags } from '@/hooks/useStoreData';
import { MOOD_CONFIG, type JournalMood } from '@/types/models';
import { haptic } from '@/lib/haptics';
import { onJournalEntryCreated } from '@/lib/appActions';
import JournalCard from '@/components/JournalCard';
import MoodPicker from '@/components/MoodPicker';
import {
  Screen,
  EmptyState,
  Chip,
  BottomSheet,
  StyledInput,
  CancelButton,
  PrimaryButton,
} from '@/components/ui';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateHeader(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getStartOfDay(epoch: number): number {
  const d = new Date(epoch);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ── Styled Components (screen-specific only) ─────────────────────────────────

const SearchBar = styled.TextInput`
  background-color: ${COLORS.surface2};
  color: ${COLORS.textPrimary};
  padding: ${SPACING.md}px ${SPACING.lg}px;
  margin: ${SPACING.md}px ${SPACING.xl}px 0;
  border-radius: ${RADIUS.lg}px;
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  border-width: 1px;
  border-color: ${COLORS.border};
`;

const FilterRow = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { paddingHorizontal: SPACING.xl, gap: SPACING.sm },
})`
  margin-top: ${SPACING.md}px;
  max-height: 44px;
`;

const DateGroupHeader = styled.View`
  padding: ${SPACING.xl}px ${SPACING.xl}px ${SPACING.sm}px;
`;

const DateGroupText = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const Fab = styled.Pressable`
  position: absolute;
  bottom: 28px;
  right: ${SPACING.xl}px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${COLORS.crimson};
  align-items: center;
  justify-content: center;
  elevation: 8;
  shadow-color: ${COLORS.crimson};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
`;

const FabText = styled.Text`
  color: ${COLORS.white};
  font-size: 28px;
  font-weight: ${TYPOGRAPHY.bold};
  margin-top: -2px;
`;

const BodyInput = styled(StyledInput)`
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

const ModalActions = styled.View`
  flex-direction: row;
  gap: ${SPACING.md}px;
  margin-top: ${SPACING.xl}px;
`;

const ListContent = styled.View`
  padding: 0 ${SPACING.xl}px 120px;
`;

// ── Component ────────────────────────────────────────────────────────────────

const MOODS = Object.entries(MOOD_CONFIG) as [JournalMood, typeof MOOD_CONFIG[JournalMood]][];

export default function JournalTimelineScreen() {
  const router = useRouter();
  const entries = useJournalStore((s) => s.journalEntries);
  const allTags = useAllJournalTags();
  const addJournalEntry = useJournalStore((s) => s.addJournalEntry);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<JournalMood | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newMood, setNewMood] = useState<JournalMood | null>(null);
  const [newTags, setNewTags] = useState('');

  const filteredEntries = useMemo(() => {
    let result = [...entries];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (selectedMoodFilter) result = result.filter((e) => e.mood === selectedMoodFilter);
    if (selectedTagFilter) { const t = selectedTagFilter.toLowerCase(); result = result.filter((e) => e.tags.some((et) => et.toLowerCase() === t)); }
    return result;
  }, [entries, searchQuery, selectedMoodFilter, selectedTagFilter]);

  const groupedEntries = useMemo(() => {
    const groups: { date: number; label: string; entries: typeof filteredEntries }[] = [];
    const dateMap = new Map<number, typeof filteredEntries>();
    for (const entry of filteredEntries) {
      const dayStart = getStartOfDay(entry.date);
      if (!dateMap.has(dayStart)) dateMap.set(dayStart, []);
      dateMap.get(dayStart)!.push(entry);
    }
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b - a);
    for (const date of sortedDates) {
      groups.push({ date, label: formatDateHeader(date), entries: dateMap.get(date)! });
    }
    return groups;
  }, [filteredEntries]);

  const handleSave = () => {
    if (!newTitle.trim() || !newBody.trim() || !newMood) return;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const parsedTags = newTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    addJournalEntry({ date: now.getTime(), title: newTitle.trim(), body: newBody.trim(), mood: newMood, tags: parsedTags, isAutoGenerated: false });
    onJournalEntryCreated();
    haptic.success();
    setNewTitle(''); setNewBody(''); setNewMood(null); setNewTags(''); setShowAddModal(false);
  };

  return (
    <Screen>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search entries..." placeholderTextColor={COLORS.textDim} />

      <FilterRow>
        {MOODS.map(([key, config]) => (
          <Chip key={key} label={`${config.emoji} ${config.label}`} active={selectedMoodFilter === key} onPress={() => { haptic.light(); setSelectedMoodFilter((prev) => prev === key ? null : key); }} />
        ))}
      </FilterRow>

      {allTags.length > 0 && (
        <FilterRow>
          {allTags.map((tag) => (
            <Chip key={tag} label={`#${tag}`} active={selectedTagFilter === tag} onPress={() => { haptic.light(); setSelectedTagFilter((prev) => prev === tag ? null : tag); }} />
          ))}
        </FilterRow>
      )}

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon="📓"
          title="Your story begins here"
          subtitle="Tap the + button to write your first journal entry. Reflect on your day, track your mood, and build self-awareness."
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ListContent>
            {groupedEntries.map((group) => (
              <React.Fragment key={group.date}>
                <DateGroupHeader>
                  <DateGroupText>{group.label}</DateGroupText>
                </DateGroupHeader>
                {group.entries.map((entry) => (
                  <JournalCard key={entry.id} entry={entry} onPress={() => router.push(`/journal/${entry.id}` as any)} />
                ))}
              </React.Fragment>
            ))}
          </ListContent>
        </ScrollView>
      )}

      <Fab onPress={() => { haptic.light(); setShowAddModal(true); }}>
        <FabText>+</FabText>
      </Fab>

      <BottomSheet visible={showAddModal} onClose={() => setShowAddModal(false)} title="New Entry">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <StyledInput value={newTitle} onChangeText={setNewTitle} placeholder="Entry title..." autoFocus style={{ marginBottom: SPACING.md }} />
          <BodyInput value={newBody} onChangeText={setNewBody} placeholder="Write your thoughts..." multiline textAlignVertical="top" />
          <PickerLabel>MOOD</PickerLabel>
          <MoodPicker selectedMood={newMood} onSelect={setNewMood} />
          <PickerLabel>TAGS (COMMA-SEPARATED)</PickerLabel>
          <StyledInput value={newTags} onChangeText={setNewTags} placeholder="e.g. gratitude, growth, focus" style={{ marginBottom: SPACING.md }} />
          <ModalActions>
            <CancelButton onPress={() => { haptic.light(); setShowAddModal(false); }} label="Cancel" />
            <PrimaryButton
              onPress={handleSave}
              label="Save"
              disabled={!newTitle.trim() || !newBody.trim() || !newMood}
              style={{ flex: 2 }}
            />
          </ModalActions>
        </KeyboardAvoidingView>
      </BottomSheet>
    </Screen>
  );
}
