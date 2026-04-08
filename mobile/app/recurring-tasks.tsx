import React, { useState } from 'react';
import { Alert, ScrollView, Platform, View } from 'react-native';
import styled from 'styled-components/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import { Screen, EmptyState, PrimaryButton, GhostButton, DangerButton } from '@/components/ui';
import { useReflectorStore } from '@/store/useReflectorStore';
import { useAlarmStore } from '@/store/useAlarmStore';
import { TASK_CATEGORIES } from '@/types/models';
import type { RecurringTask, TaskCategory, TimeBlock, TaskPriority } from '@/types/models';
import { haptic } from '@/lib/haptics';
import DayPicker from '@/components/DayPicker';

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const TIME_BLOCKS: { key: TimeBlock; label: string; icon: string }[] = [
  { key: 'morning', label: 'Morning', icon: '☀' },
  { key: 'afternoon', label: 'Afternoon', icon: '◑' },
  { key: 'evening', label: 'Evening', icon: '☾' },
];

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'must', label: 'Must' },
  { key: 'should', label: 'Should' },
  { key: 'nice', label: 'Nice' },
];

const CATEGORIES: { key: TaskCategory; label: string; color: string }[] = Object.entries(
  TASK_CATEGORIES
).map(([key, val]) => ({ key: key as TaskCategory, ...val }));

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${(m ?? 0).toString().padStart(2, '0')} ${ampm}`;
}

function formatActiveDays(days: number[]): string {
  if (days.length === 0) return 'Every day';
  if (days.length === 7) return 'Every day';
  return days.map((d) => DAY_NAMES[d]).join(', ');
}

// ── Styled Components ────────────────────────────────────────────────────────


const TaskCard = styled.Pressable`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 14px;
  margin-bottom: 10px;
  overflow: hidden;
`;

const TaskCardCollapsed = styled.View`
  padding: 14px 16px;
`;

const TaskRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const TaskTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex: 1;
`;

const CategoryBadge = styled.View<{ bg: string }>`
  background-color: ${({ bg }: { bg: string }) => bg};
  border-radius: 8px;
  padding: 2px 8px;
`;

const CategoryBadgeText = styled.Text`
  color: ${COLORS.surface0};
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const PauseIndicator = styled.Text`
  font-size: 14px;
`;

const TaskSubtitle = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-top: 4px;
`;

// Expanded edit form
const ExpandedForm = styled.View`
  padding: 0 16px 16px;
  border-top-width: 1px;
  border-top-color: ${COLORS.border};
`;

const PickerLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-bottom: 8px;
  margin-top: 16px;
`;

const EditInput = styled.TextInput`
  background-color: ${COLORS.surface2};
  color: ${COLORS.textPrimary};
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
`;

const PickerRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
`;

const CategoryChip = styled.Pressable<{ selected?: boolean; chipColor: string }>`
  border-width: 1px;
  border-color: ${({ selected, chipColor }: { selected?: boolean; chipColor: string }) =>
    selected ? chipColor : COLORS.border};
  background-color: ${({ selected, chipColor }: { selected?: boolean; chipColor: string }) =>
    selected ? chipColor : 'transparent'};
  border-radius: 4px;
  padding: 6px 12px;
`;

const CategoryChipText = styled.Text<{ selected?: boolean }>`
  color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.surface0 : COLORS.textSecondary};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const TimeChip = styled.Pressable<{ selected?: boolean }>`
  flex: 1;
  border-width: 1px;
  border-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimson : COLORS.border};
  background-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimsonGlow : 'transparent'};
  border-radius: 8px;
  padding: 10px 0;
  align-items: center;
`;

const TimeChipIcon = styled.Text`
  font-size: 16px;
  margin-bottom: 4px;
`;

const TimeChipText = styled.Text<{ selected?: boolean }>`
  color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimson : COLORS.textDim};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const PriorityChip = styled.Pressable<{ selected?: boolean }>`
  flex: 1;
  border-width: 1px;
  border-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.textPrimary : COLORS.border};
  background-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.textPrimary : 'transparent'};
  border-radius: 8px;
  padding: 10px 0;
  align-items: center;
`;

const PriorityChipText = styled.Text<{ selected?: boolean }>`
  color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.surface0 : COLORS.textDim};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const TimePickerBtn = styled.Pressable`
  background-color: ${COLORS.surface2};
  border-width: 1px;
  border-color: ${COLORS.crimson};
  border-radius: 10px;
  padding: 14px;
  align-items: center;
`;

const TimePickerBtnText = styled.Text`
  color: ${COLORS.crimson};
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
`;



function RecurringTaskCard({ task }: { task: RecurringTask }) {
  const editRecurringTask = useReflectorStore((s) => s.editRecurringTask);
  const toggleRecurringTaskPause = useReflectorStore((s) => s.toggleRecurringTaskPause);
  const removeRecurringTask = useReflectorStore((s) => s.removeRecurringTask);

  // Alarm store
  const linkedAlarm = useAlarmStore((s) => s.alarms.find((a) => a.linkedEntityId === task.id));
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);

  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCategory, setEditCategory] = useState<TaskCategory>(task.category);
  const [editTimeBlock, setEditTimeBlock] = useState<TimeBlock>(task.timeBlock);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editActiveDays, setEditActiveDays] = useState<number[]>(task.activeDays);
  const [editTime, setEditTime] = useState(() => {
    const [h, m] = task.scheduledTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');

  const cat = TASK_CATEGORIES[task.category];

  const handleExpand = () => {
    haptic.light();
    if (!expanded) {
      // Reset edit state to current task values
      setEditTitle(task.title);
      setEditCategory(task.category);
      setEditTimeBlock(task.timeBlock);
      setEditPriority(task.priority);
      setEditActiveDays(task.activeDays);
      const [h, m] = task.scheduledTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setEditTime(d);
      if (Platform.OS === 'android') setShowTimePicker(false);
    }
    setExpanded(!expanded);
  };

  const handleSave = () => {
    if (!editTitle.trim()) return;

    const hh = editTime.getHours().toString().padStart(2, '0');
    const mm = editTime.getMinutes().toString().padStart(2, '0');

    editRecurringTask(task.id, {
      title: editTitle.trim(),
      category: editCategory,
      timeBlock: editTimeBlock,
      priority: editPriority,
      scheduledTime: `${hh}:${mm}`,
      activeDays: editActiveDays,
    });

    haptic.success();
    setExpanded(false);
  };

  const handlePause = () => {
    haptic.light();
    toggleRecurringTaskPause(task.id);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeRecurringTask(task.id);
            haptic.warning();
          },
        },
      ]
    );
  };

  return (
    <TaskCard onPress={handleExpand}>
      <TaskCardCollapsed>
        <TaskRow>
          <TaskTitle numberOfLines={1}>{task.title}</TaskTitle>
          <CategoryBadge bg={cat.color}>
            <CategoryBadgeText>{cat.label}</CategoryBadgeText>
          </CategoryBadge>
          {task.isPaused && <PauseIndicator>⏸</PauseIndicator>}
        </TaskRow>
        <TaskSubtitle>
          {formatTime(task.scheduledTime)} · {formatActiveDays(task.activeDays)}
        </TaskSubtitle>
      </TaskCardCollapsed>

      {expanded && (
        <ExpandedForm>
          <PickerLabel>TITLE</PickerLabel>
          <EditInput
            value={editTitle}
            onChangeText={setEditTitle}
            placeholderTextColor={COLORS.textDim}
          />

          <PickerLabel>CATEGORY</PickerLabel>
          <PickerRow>
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.key}
                selected={editCategory === c.key}
                chipColor={c.color}
                onPress={() => setEditCategory(c.key)}
              >
                <CategoryChipText selected={editCategory === c.key}>
                  {c.label}
                </CategoryChipText>
              </CategoryChip>
            ))}
          </PickerRow>

          <PickerLabel>TIME BLOCK</PickerLabel>
          <PickerRow>
            {TIME_BLOCKS.map((b) => (
              <TimeChip
                key={b.key}
                selected={editTimeBlock === b.key}
                onPress={() => setEditTimeBlock(b.key)}
              >
                <TimeChipIcon>{b.icon}</TimeChipIcon>
                <TimeChipText selected={editTimeBlock === b.key}>
                  {b.label}
                </TimeChipText>
              </TimeChip>
            ))}
          </PickerRow>

          <PickerLabel>PRIORITY</PickerLabel>
          <PickerRow>
            {PRIORITIES.map((p) => (
              <PriorityChip
                key={p.key}
                selected={editPriority === p.key}
                onPress={() => setEditPriority(p.key)}
              >
                <PriorityChipText selected={editPriority === p.key}>
                  {p.label}
                </PriorityChipText>
              </PriorityChip>
            ))}
          </PickerRow>

          <PickerLabel>SCHEDULED TIME</PickerLabel>
          {Platform.OS === 'android' && !showTimePicker && (
            <TimePickerBtn onPress={() => setShowTimePicker(true)}>
              <TimePickerBtnText>
                {formatTime(
                  `${editTime.getHours().toString().padStart(2, '0')}:${editTime.getMinutes().toString().padStart(2, '0')}`
                )}
              </TimePickerBtnText>
            </TimePickerBtn>
          )}
          {showTimePicker && (
            <DateTimePicker
              value={editTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant="dark"
              onChange={(_, selected) => {
                if (Platform.OS === 'android') setShowTimePicker(false);
                if (selected) setEditTime(selected);
              }}
            />
          )}

          <PickerLabel>ACTIVE DAYS</PickerLabel>
          <DayPicker
            selectedDays={editActiveDays}
            onChange={setEditActiveDays}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
            <GhostButton onPress={handlePause} label={task.isPaused ? 'Resume' : 'Pause'} style={{ flex: 1 }} />
            <PrimaryButton onPress={handleSave} label="Save" style={{ flex: 1 }} />
          </View>

          <DangerButton onPress={handleDelete} label="Delete Task" style={{ marginTop: 12 }} />

          {/* Alarm section */}
          <PickerLabel>ALARM</PickerLabel>
          {linkedAlarm ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <GhostButton onPress={() => {
                haptic.warning();
                deleteAlarm(linkedAlarm.id);
              }} label={`Remove alarm ({linkedAlarm.time})`} style={{ flex: 1 }} />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <PrimaryButton onPress={() => {
                haptic.success();
                addAlarm({
                  label: task.title,
                  time: task.scheduledTime,
                  type: 'task',
                  repeat: task.activeDays.length === 0 ? 'daily'
                    : task.activeDays.length === 5 && !task.activeDays.includes(0) && !task.activeDays.includes(6) ? 'weekdays'
                    : 'custom',
                  customDays: task.activeDays.length > 0 ? task.activeDays : undefined,
                  linkedEntityId: task.id,
                  isFullScreen: true,
                  useCustomSound: false,
                  enabled: true,
                });
              }} label="Add Alarm" style={{ flex: 1 }} />
            </View>
          )}
        </ExpandedForm>
      )}
    </TaskCard>
  );
}

export default function RecurringTasksScreen() {
  const insets = useSafeAreaInsets();
  const recurringTasks = useReflectorStore((s) => s.recurringTasks);

  return (
    <Screen>
      {recurringTasks.length === 0 ? (
        <EmptyState 
          icon="📋" 
          title="No recurring tasks yet." 
          subtitle="Create one from the home screen to have tasks auto-generated daily." 
        />
      ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              {recurringTasks.map((task) => (
                <RecurringTaskCard key={task.id} task={task} />
              ))}
            </View>
          </ScrollView>
      )}
    </Screen>
  );
}
