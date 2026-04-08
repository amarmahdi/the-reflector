import React from 'react';
import styled from 'styled-components/native';
import { COLORS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

// ── Types ────────────────────────────────────────────────────────────────────

interface DayPickerProps {
  selectedDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ── Styled Components ────────────────────────────────────────────────────────

const Container = styled.View<{ disabled?: boolean }>`
  opacity: ${({ disabled }: { disabled?: boolean }) => (disabled ? 0.5 : 1)};
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 6px;
`;

const DayCircle = styled.Pressable<{ selected?: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  background-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimson : COLORS.surface2};
  border-width: ${({ selected }: { selected?: boolean }) =>
    selected ? '0px' : '1px'};
  border-color: ${COLORS.border};
`;

const DayText = styled.Text<{ selected?: boolean }>`
  color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.white : COLORS.textDim};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const HintText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-align: center;
  margin-top: 8px;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function DayPicker({ selectedDays, onChange, disabled }: DayPickerProps) {
  const toggle = (dayIndex: number) => {
    if (disabled) return;
    haptic.selection();

    if (selectedDays.includes(dayIndex)) {
      onChange(selectedDays.filter((d) => d !== dayIndex));
    } else {
      onChange([...selectedDays, dayIndex].sort());
    }
  };

  return (
    <Container disabled={disabled}>
      <Row>
        {DAY_LETTERS.map((letter, index) => {
          const isSelected = selectedDays.includes(index);
          return (
            <DayCircle
              key={index}
              selected={isSelected}
              onPress={() => toggle(index)}
              disabled={disabled}
            >
              <DayText selected={isSelected}>{letter}</DayText>
            </DayCircle>
          );
        })}
      </Row>
      {selectedDays.length === 0 && (
        <HintText>Every day</HintText>
      )}
    </Container>
  );
}
