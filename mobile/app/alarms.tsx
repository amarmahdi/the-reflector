// ──────────────────────────────────────────────
// The Reflector – Alarm Manager Screen (Restyled)
// ──────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { ScrollView, Switch, Alert } from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { useAlarmStore } from '@/store/useAlarmStore';
import AlarmConfig from '@/components/AlarmConfig';
import { Screen, SectionLabel, EmptyState } from '@/components/ui';
import { scheduleAllAlarms } from '@/lib/notifications';
import { useReflectorStore } from '@/store/useReflectorStore';
import type { Alarm, AlarmType } from '@/types/models';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${(m ?? 0).toString().padStart(2, '0')} ${ampm}`;
}

function repeatLabel(alarm: Alarm): string {
  switch (alarm.repeat) {
    case 'once': return 'Once';
    case 'daily': return 'Daily';
    case 'weekdays': return 'Weekdays';
    case 'custom': {
      const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      return (alarm.customDays ?? []).map((d) => days[d]).join(' ');
    }
    default: return '';
  }
}

function typeLabel(type: AlarmType): string {
  switch (type) {
    case 'standalone': return 'Standalone';
    case 'task': return 'Task';
    case 'routine': return 'Routine';
    default: return '';
  }
}

// ── Styled Components ────────────────────────────────────────────────────────



const ListContent = styled.View`
  padding: 0 20px 100px;
`;

// Alarm card
const AlarmCard = styled.Pressable`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  margin-bottom: 12px;
  overflow: hidden;
`;

const AlarmCardInner = styled.View`
  padding: 16px;
  flex-direction: row;
  align-items: center;
`;

const AlarmInfo = styled.View`
  flex: 1;
`;

const AlarmTime = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 24px;
  font-weight: 900;
`;

const AlarmLabel = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  margin-top: 2px;
`;

const AlarmMeta = styled.View`
  flex-direction: row;
  gap: 6px;
  margin-top: 6px;
`;

const AlarmBadge = styled.View<{ variant?: 'type' | 'repeat' }>`
  background-color: ${({ variant }: { variant?: string }) =>
    variant === 'type' ? COLORS.crimsonGlow : COLORS.surface2};
  border-radius: 8px;
  padding: 3px 8px;
`;

const AlarmBadgeText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;



// FAB
const Fab = styled.Pressable`
  position: absolute;
  bottom: 28px;
  right: 20px;
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
  font-weight: 700;
  margin-top: -2px;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function AlarmsScreen() {
  const insets = useSafeAreaInsets();
  const alarms = useAlarmStore((s) => s.alarms);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarmStore = useAlarmStore((s) => s.updateAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const standalone = alarms.filter((a) => a.type === 'standalone');
  const routine = alarms.filter((a) => a.type === 'routine');
  const task = alarms.filter((a) => a.type === 'task');

  // Reschedule OS alarms whenever store changes
  useEffect(() => {
    const { grids, routines, dailyTodos, notificationSettings } = useReflectorStore.getState();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayMs = now.getTime();
    const activeGrids = grids.filter((g) => g.status === 'active');
    const todayTodos = dailyTodos.filter((t) => t.date === todayMs);
    scheduleAllAlarms(alarms, notificationSettings, activeGrids, routines, todayTodos);
  }, [alarms]);

  const renderAlarmCard = (alarm: Alarm) => {
    const isExpanded = expandedId === alarm.id;
    return (
      <AlarmCard key={alarm.id} onPress={() => { haptic.light(); setExpandedId(isExpanded ? null : alarm.id); }}>
        <AlarmCardInner>
          <AlarmInfo>
            <AlarmTime>{formatTime12(alarm.time)}</AlarmTime>
            <AlarmLabel>{alarm.label}</AlarmLabel>
            <AlarmMeta>
              <AlarmBadge variant="type"><AlarmBadgeText>{typeLabel(alarm.type)}</AlarmBadgeText></AlarmBadge>
              <AlarmBadge variant="repeat"><AlarmBadgeText>{repeatLabel(alarm)}</AlarmBadgeText></AlarmBadge>
            </AlarmMeta>
          </AlarmInfo>
          <Switch
            value={alarm.enabled}
            onValueChange={() => { haptic.light(); toggleAlarm(alarm.id); }}
            trackColor={{ false: COLORS.border, true: COLORS.crimson }}
            thumbColor={COLORS.white}
          />
        </AlarmCardInner>
        {isExpanded && (
          <AlarmConfig
            alarm={alarm}
            onSave={(data) => { updateAlarmStore(alarm.id, data); setExpandedId(null); }}
            onDelete={() => {
              Alert.alert('Delete alarm', `Delete "${alarm.label}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => { haptic.warning(); deleteAlarm(alarm.id); setExpandedId(null); } },
              ]);
            }}
            onCancel={() => setExpandedId(null)}
          />
        )}
      </AlarmCard>
    );
  };

  const renderSection = (title: string, items: Alarm[]) => {
    if (items.length === 0) return null;
    return (
      <>
        <SectionLabel>{title}</SectionLabel>
        {items.map(renderAlarmCard)}
      </>
    );
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <ListContent>
          {alarms.length === 0 && !showNew && (
            <EmptyState
              icon="⏰"
              title="No alarms yet"
              subtitle="Tap + to create your first alarm. You can also attach alarms to tasks and routines."
            />
          )}

          {renderSection('Standalone', standalone)}
          {renderSection('Routine alarms', routine)}
          {renderSection('Task alarms', task)}

          {showNew && (
            <>
              <SectionLabel>NEW ALARM</SectionLabel>
              <AlarmConfig
                linkedType="standalone"
                onSave={(data) => { addAlarm(data); setShowNew(false); }}
                onCancel={() => setShowNew(false)}
              />
            </>
          )}
        </ListContent>
      </ScrollView>

      {!showNew && (
        <Fab onPress={() => { haptic.light(); setShowNew(true); }}>
          <FabText>+</FabText>
        </Fab>
      )}
    </Screen>
  );
}
