// ──────────────────────────────────────────────
// The Reflector – Alarm Configuration Component (Restyled)
// ──────────────────────────────────────────────

import { useState } from 'react';
import { Switch, Platform } from 'react-native';
import styled from 'styled-components/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS } from '@/constants/theme';
import { CancelButton, PrimaryButton } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import DayPicker from '@/components/DayPicker';
import type { Alarm, AlarmType, AlarmRepeat } from '@/types/models';

// ── Types ────────────────────────────────────────────────────────────────────

interface AlarmConfigProps {
  alarm?: Alarm;
  linkedEntityId?: string;
  linkedType?: AlarmType;
  onSave: (alarm: Omit<Alarm, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const REPEAT_OPTIONS: { key: AlarmRepeat; label: string }[] = [
  { key: 'once', label: 'Once' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekdays', label: 'Weekdays' },
  { key: 'custom', label: 'Custom' },
];

// ── Styled Components ────────────────────────────────────────────────────────

const Container = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 16px;
`;

const FieldLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 8px;
  margin-top: 16px;
`;

const LabelInput = styled.TextInput`
  background-color: ${COLORS.surface2};
  color: ${COLORS.textPrimary};
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  border-width: 1px;
  border-color: ${COLORS.border};
`;

const TimeBtn = styled.Pressable`
  background-color: ${COLORS.surface2};
  border-width: 1px;
  border-color: ${COLORS.crimson};
  border-radius: 14px;
  padding: 14px;
  align-items: center;
`;

const TimeBtnText = styled.Text`
  color: ${COLORS.crimson};
  font-size: 20px;
  font-weight: 900;
`;

const ChipRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

const Chip = styled.Pressable<{ active?: boolean }>`
  flex: 1;
  border-width: 1px;
  border-color: ${({ active }: { active?: boolean }) => active ? COLORS.crimson : COLORS.border};
  background-color: ${({ active }: { active?: boolean }) => active ? COLORS.crimsonGlow : 'transparent'};
  border-radius: 10px;
  padding: 10px 0;
  align-items: center;
`;

const ChipText = styled.Text<{ active?: boolean }>`
  color: ${({ active }: { active?: boolean }) => active ? COLORS.crimson : COLORS.textDim};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const ToggleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
`;

const ToggleLabel = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const ActionsRow = styled.View`
  flex-direction: row;
  gap: 10px;
  margin-top: 20px;
`;



const DeleteBtn = styled.Pressable`
  padding: 12px;
  align-items: center;
  margin-top: 8px;
`;

const DeleteBtnText = styled.Text`
  color: ${COLORS.warmRed};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${(m ?? 0).toString().padStart(2, '0')} ${ampm}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AlarmConfig({
  alarm,
  linkedEntityId,
  linkedType,
  onSave,
  onDelete,
  onCancel,
}: AlarmConfigProps) {
  const [label, setLabel] = useState(alarm?.label ?? '');
  const [repeat, setRepeat] = useState<AlarmRepeat>(alarm?.repeat ?? 'daily');
  const [customDays, setCustomDays] = useState<number[]>(alarm?.customDays ?? []);
  const [isFullScreen, setIsFullScreen] = useState(alarm?.isFullScreen ?? true);
  const [useCustomSound, setUseCustomSound] = useState(alarm?.useCustomSound ?? false);

  const initialTime = (() => {
    if (alarm?.time) {
      const [h, m] = alarm.time.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    return new Date();
  })();

  const [time, setTime] = useState(initialTime);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');

  const timeToHHMM = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const handleSave = () => {
    haptic.success();
    onSave({
      label: label.trim() || 'Alarm',
      time: timeToHHMM(time),
      type: linkedType ?? alarm?.type ?? 'standalone',
      repeat,
      customDays: repeat === 'custom' ? customDays : undefined,
      linkedEntityId: linkedEntityId ?? alarm?.linkedEntityId,
      isFullScreen,
      useCustomSound,
      customSoundFile: alarm?.customSoundFile,
      enabled: alarm?.enabled ?? true,
    });
  };

  return (
    <Container>
      <FieldLabel>ALARM NAME</FieldLabel>
      <LabelInput
        value={label}
        onChangeText={setLabel}
        placeholder="Alarm name"
        placeholderTextColor={COLORS.textDim}
      />

      <FieldLabel>TIME</FieldLabel>
      {Platform.OS === 'android' && !showTimePicker && (
        <TimeBtn onPress={() => setShowTimePicker(true)}>
          <TimeBtnText>{formatTime(timeToHHMM(time))}</TimeBtnText>
        </TimeBtn>
      )}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant="dark"
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setShowTimePicker(false);
            if (selected) setTime(selected);
          }}
        />
      )}

      <FieldLabel>REPEAT</FieldLabel>
      <ChipRow>
        {REPEAT_OPTIONS.map((r) => (
          <Chip
            key={r.key}
            active={repeat === r.key}
            onPress={() => {
              haptic.selection();
              setRepeat(r.key);
            }}
          >
            <ChipText active={repeat === r.key}>{r.label}</ChipText>
          </Chip>
        ))}
      </ChipRow>

      {repeat === 'custom' && (
        <>
          <FieldLabel>ACTIVE DAYS</FieldLabel>
          <DayPicker selectedDays={customDays} onChange={setCustomDays} />
        </>
      )}

      <ToggleRow>
        <ToggleLabel>Full-screen alarm</ToggleLabel>
        <Switch
          value={isFullScreen}
          onValueChange={setIsFullScreen}
          trackColor={{ false: COLORS.border, true: COLORS.crimson }}
          thumbColor={COLORS.white}
        />
      </ToggleRow>

      <ToggleRow>
        <ToggleLabel>Custom sound</ToggleLabel>
        <Switch
          value={useCustomSound}
          onValueChange={setUseCustomSound}
          trackColor={{ false: COLORS.border, true: COLORS.crimson }}
          thumbColor={COLORS.white}
        />
      </ToggleRow>

      <ActionsRow>
        <CancelButton onPress={onCancel} label="Cancel" style={{ flex: 1 }} />
        <PrimaryButton onPress={handleSave} label="Save" style={{ flex: 2 }} />
      </ActionsRow>

      {onDelete && (
        <DeleteBtn onPress={onDelete}>
          <DeleteBtnText>Delete alarm</DeleteBtnText>
        </DeleteBtn>
      )}
    </Container>
  );
}
