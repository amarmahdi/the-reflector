import React from 'react';
import styled from 'styled-components/native';
import { COLORS } from '@/constants/theme';
import { MOOD_CONFIG, type JournalMood } from '@/types/models';
import { haptic } from '@/lib/haptics';

// ── Types ────────────────────────────────────────────────────────────────────

interface MoodPickerProps {
  selectedMood: JournalMood | null;
  onSelect: (mood: JournalMood) => void;
}

// ── Styled Components ────────────────────────────────────────────────────────

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
`;

const MoodButton = styled.Pressable<{ selected?: boolean }>`
  flex: 1;
  align-items: center;
  padding: 12px 4px;
  border-radius: 14px;
  border-width: 1.5px;
  border-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimson : COLORS.border};
  background-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimsonGlow : 'transparent'};
`;

const MoodEmoji = styled.Text`
  font-size: 24px;
  margin-bottom: 4px;
`;

const MoodLabel = styled.Text<{ selected?: boolean }>`
  color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimson : COLORS.textDim};
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

// ── Component ────────────────────────────────────────────────────────────────

const MOODS = Object.entries(MOOD_CONFIG) as [JournalMood, typeof MOOD_CONFIG[JournalMood]][];

export default function MoodPicker({ selectedMood, onSelect }: MoodPickerProps) {
  return (
    <Row>
      {MOODS.map(([key, config]) => {
        const isSelected = selectedMood === key;
        return (
          <MoodButton
            key={key}
            selected={isSelected}
            onPress={() => {
              haptic.light();
              onSelect(key);
            }}
          >
            <MoodEmoji>{config.emoji}</MoodEmoji>
            <MoodLabel selected={isSelected}>{config.label}</MoodLabel>
          </MoodButton>
        );
      })}
    </Row>
  );
}
