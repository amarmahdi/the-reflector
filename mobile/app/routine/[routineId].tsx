import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReflectorStore } from '@/store/useReflectorStore';
import { COLORS } from '@/constants/theme';
import { SectionLabel, PrimaryButton, DangerButton } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import type { SubTask } from '@/types/models';

// ── Styled Components ────────────────────────────────────────────────────────

const Screen = styled.ScrollView`
  flex: 1;
  background-color: ${COLORS.surface0};
`;

const ContentPad = styled.View`
  padding: 8px 20px 40px;
`;



const TitleInput = styled.TextInput`
  background-color: ${COLORS.surface2};
  color: ${COLORS.textPrimary};
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-width: 1px;
  border-color: ${COLORS.border};
`;

// Sub-task row
const SubTaskRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
`;

const SubTaskInfo = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const SubTaskTitleInput = styled.TextInput`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  padding: 4px 0;
`;

const CoreBadge = styled.Pressable<{ isCore: boolean }>`
  background-color: ${({ isCore }: { isCore: boolean }) => isCore ? COLORS.crimsonGlow : COLORS.surface2};
  border-width: 1px;
  border-color: ${({ isCore }: { isCore: boolean }) => isCore ? COLORS.crimson : COLORS.border};
  border-radius: 8px;
  padding: 4px 10px;
`;

const CoreBadgeText = styled.Text<{ isCore: boolean }>`
  color: ${({ isCore }: { isCore: boolean }) => isCore ? COLORS.crimson : COLORS.textDim};
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const SmallBtn = styled.Pressable`
  padding: 6px 10px;
`;

const SmallBtnText = styled.Text<{ danger?: boolean }>`
  color: ${({ danger }: { danger?: boolean }) => danger ? COLORS.warmRed : COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const SubTaskActions = styled.View`
  flex-direction: row;
  gap: 4px;
`;

// Add row
const AddRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
`;

const AddInputWrapper = styled.View`
  flex: 1;
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

const AddBtn = styled.Pressable`
  background-color: ${COLORS.crimson};
  width: 44px;
  height: 44px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
`;

const AddBtnText = styled.Text`
  color: ${COLORS.white};
  font-size: 22px;
  font-weight: 500;
`;

// Grid history
const GridCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 14px 16px;
  margin-bottom: 10px;
`;

const GridCardHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const GridDate = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 500;
`;

const StatusBadge = styled.View<{ status: string }>`
  border-width: 1px;
  border-color: ${({ status }: { status: string }) =>
    status === 'active' ? COLORS.crimson :
    status === 'completed' ? COLORS.crimson :
    COLORS.warmRed};
  background-color: ${({ status }: { status: string }) =>
    status === 'active' ? COLORS.crimsonGlow :
    status === 'completed' ? COLORS.crimsonGlow :
    'rgba(139, 74, 74, 0.12)'};
  border-radius: 8px;
  padding: 3px 8px;
`;

const StatusBadgeText = styled.Text<{ status: string }>`
  color: ${({ status }: { status: string }) =>
    status === 'active' ? COLORS.crimson :
    status === 'completed' ? COLORS.crimson :
    COLORS.warmRed};
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const GridStats = styled.View`
  flex-direction: row;
  gap: 16px;
`;

const GridStat = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: 500;
`;

const GridStatValue = styled.Text`
  color: ${COLORS.textSecondary};
`;



const EmptyText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  padding: 20px 0;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function EditRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const routines = useReflectorStore((s) => s.routines);
  const grids = useReflectorStore((s) => s.grids);
  const editRoutine = useReflectorStore((s) => s.editRoutine);
  const deleteRoutine = useReflectorStore((s) => s.deleteRoutine);

  const routine = routines.find((r) => r.id === routineId);
  const routineGrids = grids.filter((g) => g.routineId === routineId);
  const hasActiveGrid = routineGrids.some((g) => g.status === 'active');

  const [title, setTitle] = useState(routine?.title ?? '');
  const [subTasks, setSubTasks] = useState<SubTask[]>(routine?.subTasks ?? []);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    if (routine) {
      setTitle(routine.title);
      setSubTasks([...routine.subTasks]);
    }
  }, [routine?.id]);

  if (!routine || !routineId) {
    return (
      <Screen>
        <ContentPad>
          <EmptyText>Routine not found.</EmptyText>
        </ContentPad>
      </Screen>
    );
  }

  const handleAddSubTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    haptic.light();
    const newSt: SubTask = {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      isCore: true,
    };
    setSubTasks((prev) => [...prev, newSt]);
    setNewTaskTitle('');
  };

  const toggleCore = (index: number) => {
    haptic.selection();
    setSubTasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, isCore: !st.isCore } : st))
    );
  };

  const removeSubTask = (index: number) => {
    haptic.light();
    setSubTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSubTaskTitle = (index: number, newTitle: string) => {
    setSubTasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, title: newTitle } : st))
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Routine name cannot be empty.');
      return;
    }
    if (subTasks.length === 0) {
      Alert.alert('No sub-tasks', 'At least one sub-task is required.');
      return;
    }
    haptic.success();
    editRoutine(routineId, title.trim(), subTasks);
    Alert.alert('Saved', 'Routine updated successfully.');
    router.back();
  };

  const handleDelete = () => {
    if (hasActiveGrid) {
      Alert.alert('Cannot delete', 'This routine has an active grid. Complete or fail the grid first.');
      return;
    }
    Alert.alert(
      'Delete routine',
      `Are you sure you want to delete "${routine.title}"? This will also remove all non-active grid history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptic.error();
            deleteRoutine(routineId);
            router.back();
          },
        },
      ]
    );
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getGridCompletion = (grid: typeof grids[0]) => {
    const completed = grid.days.filter((d) => d.status === 'completed').length;
    return Math.round((completed / grid.days.length) * 100);
  };

  const getGridLapses = (grid: typeof grids[0]) => {
    return grid.days.filter((d) => d.status === 'scarred').length;
  };

  return (
    <Screen
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <ContentPad>
        <SectionLabel>ROUTINE NAME</SectionLabel>
        <TitleInput
          value={title}
          onChangeText={setTitle}
          placeholder="Routine name"
          placeholderTextColor={COLORS.textDim}
        />

        <SectionLabel>SUB-TASKS ({subTasks.length})</SectionLabel>
        {subTasks.map((st, i) => (
          <SubTaskRow key={st.id}>
            <SubTaskInfo>
              <SubTaskTitleInput
                value={st.title}
                onChangeText={(t: string) => updateSubTaskTitle(i, t)}
                placeholderTextColor={COLORS.textDim}
              />
              <CoreBadge isCore={st.isCore} onPress={() => toggleCore(i)}>
                <CoreBadgeText isCore={st.isCore}>{st.isCore ? 'Core' : 'Opt'}</CoreBadgeText>
              </CoreBadge>
            </SubTaskInfo>
            <SubTaskActions>
              <SmallBtn onPress={() => removeSubTask(i)}>
                <SmallBtnText danger>Delete</SmallBtnText>
              </SmallBtn>
            </SubTaskActions>
          </SubTaskRow>
        ))}

        <AddRow>
          <AddInputWrapper>
            <StyledInput
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="New sub-task..."
              placeholderTextColor={COLORS.textDim}
              onSubmitEditing={handleAddSubTask}
            />
          </AddInputWrapper>
          <AddBtn onPress={handleAddSubTask}>
            <AddBtnText>+</AddBtnText>
          </AddBtn>
        </AddRow>

        {/* Grid History */}
        <SectionLabel>GRID HISTORY ({routineGrids.length})</SectionLabel>
        {routineGrids.length === 0 ? (
          <EmptyText>No grids yet.</EmptyText>
        ) : (
          routineGrids
            .sort((a, b) => b.startDate - a.startDate)
            .map((grid) => (
              <GridCard key={grid.id}>
                <GridCardHeader>
                  <GridDate>Started {formatDate(grid.startDate)}</GridDate>
                  <StatusBadge status={grid.status}>
                    <StatusBadgeText status={grid.status}>
                      {grid.status.charAt(0).toUpperCase() + grid.status.slice(1)}
                    </StatusBadgeText>
                  </StatusBadge>
                </GridCardHeader>
                <GridStats>
                  <GridStat>
                    Completion <GridStatValue>{getGridCompletion(grid)}%</GridStatValue>
                  </GridStat>
                  <GridStat>
                    Lapses <GridStatValue>{getGridLapses(grid)}</GridStatValue>
                  </GridStat>
                </GridStats>
              </GridCard>
            ))
        )}

        <PrimaryButton onPress={handleSave} label="Save Changes" style={{ marginTop: 28 }} />

        {!hasActiveGrid && (
          <DangerButton onPress={handleDelete} label="Delete Routine" style={{ marginTop: 12 }} />
        )}
      </ContentPad>
    </Screen>
  );
}
