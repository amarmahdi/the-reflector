import { useState } from 'react';
import { Alert, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReflectorStore } from '@/store/useReflectorStore';
import { useAlarmStore } from '@/store/useAlarmStore';
import { COLORS } from '@/constants/theme';
import { SectionLabel, PrimaryButton, SmallButton, ProgressBar, EmptyState } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { getPrestigeLevel, PRESTIGE_CONFIG } from '@/types/models';

// ── Types ────────────────────────────────────────────────────────────────────

interface SubTaskDraft {
  title: string;
  isCore: boolean;
}

// ── Styled Components ────────────────────────────────────────────────────────

const Screen = styled.ScrollView`
  flex: 1;
  background-color: ${COLORS.surface0};
`;

// Active grid card
const GridCard = styled.Pressable`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 16px;
  margin-bottom: 12px;
`;

const GridCardTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const GridCardMeta = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 10px;
`;

const GridCardFooter = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const GridCardDetail = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: 500;
`;

const HardResetTag = styled.Text`
  color: ${COLORS.warmRed};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
`;

// Routine card
const RoutineCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 16px;
  margin-bottom: 12px;
`;

const RoutineCardHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
`;

const RoutineCardTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex: 1;
`;

const RoutineCardSub = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
`;

const RoutineCardActions = styled.View`
  flex-direction: row;
  gap: 10px;
`;

const PrestigeBadge = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const SmallGhostBtn = styled.Pressable`
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 10px;
  padding: 10px 16px;
  align-items: center;
`;

const SmallGhostBtnText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
`;

const InProgressBadge = styled.View`
  background-color: ${COLORS.crimsonGlow};
  border-width: 1px;
  border-color: ${COLORS.crimson};
  border-radius: 8px;
  padding: 8px 14px;
`;

const InProgressBadgeText = styled.Text`
  color: ${COLORS.crimson};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
`;

// Create routine form
const CreateCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 16px;
  margin-bottom: 12px;
`;

const CreateTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
`;

const StyledInput = styled.TextInput`
  background-color: ${COLORS.surface2};
  color: ${COLORS.textPrimary};
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
`;

const SubTaskRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
`;

const SubTaskInfo = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const SubTaskTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 500;
  flex: 1;
`;

const CoreBadge = styled.Pressable<{ isCore: boolean }>`
  background-color: ${({ isCore }: { isCore: boolean }) => isCore ? COLORS.crimsonGlow : COLORS.surface2};
  border-width: 1px;
  border-color: ${({ isCore }: { isCore: boolean }) => isCore ? COLORS.crimson : COLORS.border};
  border-radius: 6px;
  padding: 3px 8px;
`;

const CoreBadgeText = styled.Text<{ isCore: boolean }>`
  color: ${({ isCore }: { isCore: boolean }) => isCore ? COLORS.crimson : COLORS.textDim};
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const RemoveBtn = styled.Pressable`
  padding: 4px 8px;
`;

const RemoveBtnText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 16px;
`;

const AddSubTaskRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
`;

const AddBtnSmall = styled.Pressable`
  background-color: ${COLORS.crimson};
  width: 44px;
  height: 44px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
`;

const AddBtnSmallText = styled.Text`
  color: ${COLORS.white};
  font-size: 22px;
  font-weight: 500;
`;

const InputWrapper = styled.View`
  flex: 1;
`;

const AddTextBtn = styled.Pressable`
  padding: 8px 0;
  margin-top: 8px;
`;

const AddTextBtnLabel = styled.Text`
  color: ${COLORS.crimson};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

// Toggle
const ToggleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 16px;
  margin-top: 12px;
`;

const ToggleInfo = styled.View`
  flex: 1;
  margin-right: 16px;
`;

const ToggleLabel = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const ToggleHint = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  margin-top: 4px;
  line-height: 16px;
`;

// History
const HistoryToggle = styled.Pressable`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 28px;
  margin-bottom: 12px;
`;

const HistoryTitle = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
`;

const HistoryArrow = styled.Text<{ expanded: boolean }>`
  color: ${COLORS.textDim};
  font-size: 12px;
  transform: ${({ expanded }: { expanded: boolean }) => expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
`;

const HistoryCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 14px 16px;
  margin-bottom: 10px;
`;

const HistoryRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const HistoryName = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 500;
  flex: 1;
`;

const HistoryDate = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: 500;
  margin-top: 4px;
`;

const StatusTag = styled.Text<{ completed: boolean }>`
  color: ${({ completed }: { completed: boolean }) => completed ? COLORS.crimson : COLORS.warmRed};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
`;

// AlarmTime display
const AlarmTimeText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 600;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function TheForgeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [routineTitle, setRoutineTitle] = useState('');
  const [subTasks, setSubTasks] = useState<SubTaskDraft[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [hardReset, setHardReset] = useState(false);
  const [dailyAlarm, setDailyAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [showAlarmPicker, setShowAlarmPicker] = useState(Platform.OS === 'ios');
  const [showHistory, setShowHistory] = useState(false);

  const addRoutine = useReflectorStore((s) => s.addRoutine);
  const startGrid = useReflectorStore((s) => s.startGrid);
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const addAlarm = useAlarmStore((s) => s.addAlarm);

  const activeGrids = grids.filter((g) => g.status === 'active');
  const completedOrFailedGrids = grids.filter((g) => g.status === 'completed' || g.status === 'failed');

  // Check if a routine already has an active grid
  const hasActiveGridFor = (routineId: string) =>
    activeGrids.some((g) => g.routineId === routineId);

  const handleAddSubTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    haptic.light();
    setSubTasks((prev) => [...prev, { title: trimmed, isCore: true }]);
    setNewTaskTitle('');
  };

  const toggleCore = (index: number) => {
    haptic.selection();
    setSubTasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, isCore: !st.isCore } : st))
    );
  };

  const removeSubTask = (index: number) => {
    setSubTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateRoutine = () => {
    if (!routineTitle.trim()) {
      Alert.alert('Missing title', 'Please enter a routine name.');
      return;
    }
    if (subTasks.length === 0) {
      Alert.alert('No sub-tasks', 'Add at least one sub-task.');
      return;
    }

    haptic.heavy();
    const routine = addRoutine(routineTitle.trim(), subTasks);
    const grid = startGrid(routine.id, hardReset);

    // Create daily alarm if enabled
    if (dailyAlarm) {
      const hh = alarmTime.getHours().toString().padStart(2, '0');
      const mm = alarmTime.getMinutes().toString().padStart(2, '0');
      addAlarm({
        label: routineTitle.trim(),
        time: `${hh}:${mm}`,
        type: 'routine',
        repeat: 'daily',
        linkedEntityId: routine.id,
        isFullScreen: true,
        useCustomSound: false,
        enabled: true,
      });
    }

    setRoutineTitle('');
    setSubTasks([]);
    setNewTaskTitle('');
    setHardReset(false);
    setDailyAlarm(false);

    // Navigate to pact screen — pacts are mandatory for every new grid
    router.push(`/pact?gridId=${grid.id}` as any);
  };

  const handleStartExistingGrid = (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    const prestige = getPrestigeLevel(routine?.completedGridCount ?? 0);
    const config = PRESTIGE_CONFIG[prestige];

    // Prestige ≥ 2 forces hard reset — skip dialog
    if (config.hardResetForced) {
      haptic.heavy();
      const grid = startGrid(routineId, true);
      router.push(`/pact?gridId=${grid.id}` as any);
      return;
    }

    Alert.alert(
      'Start Grid',
      'Enable Hard Reset mode?\n\n2 consecutive missed days will destroy the grid.',
      [
        {
          text: 'No, standard mode',
          onPress: () => {
            haptic.heavy();
            const grid = startGrid(routineId, false);
            router.push(`/pact?gridId=${grid.id}` as any);
          },
        },
        {
          text: 'Yes, hard reset',
          style: 'destructive',
          onPress: () => {
            haptic.heavy();
            const grid = startGrid(routineId, true);
            router.push(`/pact?gridId=${grid.id}` as any);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getGridProgress = (grid: typeof grids[0]) => {
    const completed = grid.days.filter((d) => d.status === 'completed').length;
    return Math.round((completed / grid.days.length) * 100);
  };

  const getGridScars = (grid: typeof grids[0]) =>
    grid.days.filter((d) => d.status === 'scarred').length;

  const getGridCurrentDay = (grid: typeof grids[0]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayMs = now.getTime();
    const todayDay = grid.days.find((d) => d.date === todayMs);
    if (todayDay) return todayDay.dayIndex;
    // Fallback: find the latest completed/scarred day
    const lastDone = grid.days.filter((d) => d.status !== 'pending').sort((a, b) => b.dayIndex - a.dayIndex)[0];
    return lastDone ? lastDone.dayIndex : 1;
  };

  return (
    <Screen
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
    >
      {/* ── Active Grids ─────────────────────────────────────── */}
      <SectionLabel>ACTIVE</SectionLabel>
      {activeGrids.length === 0 ? (
        <EmptyState icon="🌱" title="No active disciplines." subtitle="Create a routine and start your journey." />
      ) : (
        activeGrids.map((grid) => {
          const routine = routines.find((r) => r.id === grid.routineId);
          if (!routine) return null;
          const progress = getGridProgress(grid);
          const scars = getGridScars(grid);
          const currentDay = getGridCurrentDay(grid);

          return (
            <GridCard
              key={grid.id}
              onPress={() => {
                haptic.light();
                router.push(`/flow/${grid.id}` as any);
              }}
            >
              <GridCardTitle>{routine.title}</GridCardTitle>
              <GridCardMeta>Day {currentDay} of 40 · {progress}%</GridCardMeta>
              <ProgressBar percent={progress} height={6} />
              <GridCardFooter>
                <GridCardDetail>
                  {scars} scar{scars !== 1 ? 's' : ''} · Started {formatDate(grid.startDate)}
                </GridCardDetail>
                {grid.isHardResetEnabled && (
                  <HardResetTag>Hard Reset: On</HardResetTag>
                )}
              </GridCardFooter>
            </GridCard>
          );
        })
      )}

      {/* ── Your Routines ────────────────────────────────────── */}
      <SectionLabel>YOUR ROUTINES</SectionLabel>
      {routines.length === 0 ? (
        <EmptyState icon="📋" title="No routines yet." subtitle="Create one below." />
      ) : (
        routines.map((r) => {
          const isActive = hasActiveGridFor(r.id);
          return (
            <RoutineCard key={r.id}>
              <RoutineCardHeader>
                <RoutineCardTitle>{r.title}</RoutineCardTitle>
              </RoutineCardHeader>
              {(() => {
                const prestige = getPrestigeLevel(r.completedGridCount ?? 0);
                const cfg = PRESTIGE_CONFIG[prestige];
                return prestige > 0 ? (
                  <PrestigeBadge>
                    {cfg.emoji} {cfg.name} · {cfg.xpMultiplier}x XP
                    {cfg.hardResetForced ? ' · Hard Reset ON' : ''}
                  </PrestigeBadge>
                ) : null;
              })()}
              <RoutineCardSub>{r.subTasks.length} sub-task{r.subTasks.length !== 1 ? 's' : ''}</RoutineCardSub>
              <RoutineCardActions>
                {isActive ? (
                  <InProgressBadge>
                    <InProgressBadgeText>In progress</InProgressBadgeText>
                  </InProgressBadge>
                ) : (
                  <SmallButton
                    onPress={() => {
                      haptic.medium();
                      handleStartExistingGrid(r.id);
                    }}
                    label="Start Grid"
                  />
                )}
                <SmallGhostBtn
                  onPress={() => {
                    haptic.light();
                    router.push(`/routine/${r.id}` as any);
                  }}
                >
                  <SmallGhostBtnText>Edit</SmallGhostBtnText>
                </SmallGhostBtn>
              </RoutineCardActions>
            </RoutineCard>
          );
        })
      )}

      {/* ── Create New Routine ───────────────────────────────── */}
      <SectionLabel>CREATE NEW ROUTINE</SectionLabel>
      <CreateCard>
        <CreateTitle>Create a New Routine</CreateTitle>

        <StyledInput
          value={routineTitle}
          onChangeText={setRoutineTitle}
          placeholder="Routine title..."
          placeholderTextColor={COLORS.textDim}
        />

        {subTasks.length > 0 && (
          <>
            {subTasks.map((st, i) => (
              <SubTaskRow key={i}>
                <SubTaskInfo>
                  <SubTaskTitle numberOfLines={1}>{st.title}</SubTaskTitle>
                  <CoreBadge isCore={st.isCore} onPress={() => toggleCore(i)}>
                    <CoreBadgeText isCore={st.isCore}>{st.isCore ? 'Core' : 'Opt'}</CoreBadgeText>
                  </CoreBadge>
                </SubTaskInfo>
                <RemoveBtn onPress={() => removeSubTask(i)}>
                  <RemoveBtnText>✕</RemoveBtnText>
                </RemoveBtn>
              </SubTaskRow>
            ))}
          </>
        )}

        <AddSubTaskRow>
          <InputWrapper>
            <StyledInput
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Add a sub-task..."
              placeholderTextColor={COLORS.textDim}
              onSubmitEditing={handleAddSubTask}
            />
          </InputWrapper>
          <AddBtnSmall onPress={handleAddSubTask}>
            <AddBtnSmallText>+</AddBtnSmallText>
          </AddBtnSmall>
        </AddSubTaskRow>

        <ToggleRow>
          <ToggleInfo>
            <ToggleLabel>Hard Reset Mode</ToggleLabel>
            <ToggleHint>2 consecutive missed days destroys the grid.</ToggleHint>
          </ToggleInfo>
          <Switch
            value={hardReset}
            onValueChange={setHardReset}
            trackColor={{ false: COLORS.border, true: COLORS.crimson }}
            thumbColor={COLORS.white}
          />
        </ToggleRow>

        <ToggleRow>
          <ToggleInfo>
            <ToggleLabel>Daily Alarm</ToggleLabel>
            <ToggleHint>Get reminded daily for this routine.</ToggleHint>
          </ToggleInfo>
          <Switch
            value={dailyAlarm}
            onValueChange={setDailyAlarm}
            trackColor={{ false: COLORS.border, true: COLORS.crimson }}
            thumbColor={COLORS.white}
          />
        </ToggleRow>

        {dailyAlarm && (
          <ToggleRow>
            <ToggleInfo>
              <ToggleLabel>Alarm Time</ToggleLabel>
            </ToggleInfo>
            {Platform.OS === 'android' && !showAlarmPicker && (
              <SmallGhostBtn onPress={() => setShowAlarmPicker(true)}>
                <AlarmTimeText>
                  {alarmTime.getHours() % 12 || 12}:{alarmTime.getMinutes().toString().padStart(2, '0')} {alarmTime.getHours() >= 12 ? 'PM' : 'AM'}
                </AlarmTimeText>
              </SmallGhostBtn>
            )}
            {showAlarmPicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant="dark"
                onChange={(_, selected) => {
                  if (Platform.OS === 'android') setShowAlarmPicker(false);
                  if (selected) setAlarmTime(selected);
                }}
              />
            )}
          </ToggleRow>
        )}

        <PrimaryButton onPress={handleCreateRoutine} label="Create Routine" />
      </CreateCard>

      {/* ── History (collapsible) ─────────────────────────────── */}
      {completedOrFailedGrids.length > 0 && (
        <>
          <HistoryToggle onPress={() => {
            haptic.light();
            setShowHistory((prev) => !prev);
          }}>
            <HistoryTitle>HISTORY ({completedOrFailedGrids.length})</HistoryTitle>
            <HistoryArrow expanded={showHistory}>›</HistoryArrow>
          </HistoryToggle>

          {showHistory && completedOrFailedGrids
            .sort((a, b) => b.startDate - a.startDate)
            .map((grid) => {
              const routine = routines.find((r) => r.id === grid.routineId);
              const progress = getGridProgress(grid);
              const isCompleted = grid.status === 'completed';
              return (
                <HistoryCard key={grid.id}>
                  <HistoryRow>
                    <HistoryName>{routine?.title ?? 'Unknown'}</HistoryName>
                    <StatusTag completed={isCompleted}>
                      {isCompleted ? 'Completed ✓' : 'Failed ✕'}
                    </StatusTag>
                  </HistoryRow>
                  <HistoryDate>
                    {formatDate(grid.startDate)} · {progress}% completed
                  </HistoryDate>
                </HistoryCard>
              );
            })}
        </>
      )}
    </Screen>
  );
}
