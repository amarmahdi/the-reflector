import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useState } from 'react';
import { Modal } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReflectorStore } from '@/store/useReflectorStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { onDayCompleted, onGridCompleted } from '@/lib/appActions';
import { ScrollScreen, EmptyState, PrimaryButton } from '@/components/ui';
import { getPrestigeLevel, PRESTIGE_CONFIG } from '@/types/models';

// ── Styled Components (flow-specific) ────────────────────────────────────────

// Grid visualization
const GridContainer = styled.View`
  padding: ${SPACING.lg}px ${SPACING.xl}px;
  margin-bottom: ${SPACING.sm}px;
`;

const GridVisual = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${SPACING.xs}px;
  margin-bottom: ${SPACING.lg}px;
`;

const GridCell = styled.View<{ status: string; isToday: boolean }>`
  width: 18%;
  aspect-ratio: 1;
  border-radius: ${RADIUS.md}px;
  align-items: center;
  justify-content: center;
  background-color: ${({ status }: { status: string }) =>
    status === 'completed' ? COLORS.crimson :
    status === 'scarred' ? COLORS.warmRed :
    COLORS.surface2};
  border-width: ${({ isToday }: { isToday: boolean }) => isToday ? '2px' : '1px'};
  border-color: ${({ status, isToday }: { status: string; isToday: boolean }) =>
    isToday ? COLORS.softBlue :
    status === 'completed' ? COLORS.crimson :
    status === 'scarred' ? COLORS.warmRed :
    COLORS.border};
`;

const GridCellNumber = styled.Text<{ status: string }>`
  color: ${({ status }: { status: string }) =>
    status === 'completed' || status === 'scarred' ? COLORS.white : COLORS.textDim};
  font-size: 11px;
  font-weight: ${TYPOGRAPHY.semibold};
`;

// Content
const ContentPad = styled.View`
  padding: 0px ${SPACING.xl}px 40px;
`;

const RecalibrateBtn = styled.Pressable<{ active: boolean }>`
  border-width: 1px;
  border-color: ${({ active }: { active: boolean }) => active ? COLORS.crimson : COLORS.border};
  background-color: ${({ active }: { active: boolean }) => active ? COLORS.crimsonGlow : 'transparent'};
  padding: ${SPACING.md}px ${SPACING.lg}px;
  border-radius: ${RADIUS.md}px;
  align-self: flex-start;
  margin-bottom: ${SPACING.xl}px;
  flex-direction: row;
  align-items: center;
  gap: ${SPACING.sm}px;
`;

const RecalibrateDot = styled.View<{ active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${({ active }: { active: boolean }) => active ? COLORS.crimson : COLORS.textDim};
`;

const RecalibrateBtnText = styled.Text<{ active: boolean }>`
  color: ${({ active }: { active: boolean }) => active ? COLORS.crimson : COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.wider}px;
`;

const TaskList = styled.View`
  gap: 6px;
`;

const TaskRow = styled.Pressable<{ done: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: ${SPACING.lg}px;
  border-radius: ${RADIUS.lg}px;
  background-color: ${({ done }: { done: boolean }) => done ? COLORS.surface1 : COLORS.surface2};
  border-width: 1px;
  border-color: ${({ done }: { done: boolean }) => done ? COLORS.border : COLORS.borderLight};
  opacity: ${({ done }: { done: boolean }) => done ? 0.7 : 1};
`;

const FlowCheckbox = styled.View<{ done: boolean }>`
  width: 24px;
  height: 24px;
  border-width: 1.5px;
  border-color: ${({ done }: { done: boolean }) => done ? COLORS.crimson : COLORS.border};
  background-color: ${({ done }: { done: boolean }) => done ? COLORS.crimson : 'transparent'};
  border-radius: 7px;
  align-items: center;
  justify-content: center;
  margin-right: ${SPACING.lg}px;
`;

const Checkmark = styled.Text`
  color: ${COLORS.white};
  font-size: ${TYPOGRAPHY.caption}px;
  font-weight: ${TYPOGRAPHY.bold};
`;

const TaskInfo = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${SPACING.sm}px;
  flex: 1;
`;

const TaskTitle = styled.Text<{ done: boolean }>`
  color: ${({ done }: { done: boolean }) => done ? COLORS.textDim : COLORS.textPrimary};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${({ done }: { done: boolean }) => done ? TYPOGRAPHY.regular : TYPOGRAPHY.medium};
  text-decoration-line: ${({ done }: { done: boolean }) => done ? 'line-through' : 'none'};
  flex: 1;
`;

const OptionalBadge = styled.View`
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: ${SPACING.sm}px;
  padding: 2px ${SPACING.sm}px;
`;

const OptionalBadgeText = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.micro}px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: ${TYPOGRAPHY.wide}px;
`;

const ScarIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
`;

const ScarDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${COLORS.warmRed};
`;

const ScarText = styled.Text`
  color: ${COLORS.warmRed};
  font-size: 11px;
  font-weight: ${TYPOGRAPHY.medium};
`;

const ErrorWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.surface0};
  padding: 40px;
`;

// Prestige banner
const PrestigeBanner = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: ${RADIUS.md}px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: ${SPACING.sm}px ${SPACING.lg}px;
  margin: 0px ${SPACING.xl}px ${SPACING.md}px;
  flex-direction: row;
  align-items: center;
  gap: ${SPACING.sm}px;
`;

const PrestigeBannerText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: 0.4px;
`;

// Prestige level-up celebration modal
const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0,0,0,0.75);
  align-items: center;
  justify-content: center;
  padding: ${SPACING.xxl}px;
`;

const CelebrationCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: ${RADIUS.xl}px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: ${SPACING.xxl}px;
  align-items: center;
  width: 100%;
`;

const CelebrationEmoji = styled.Text`
  font-size: 48px;
  margin-bottom: ${SPACING.md}px;
`;

const CelebrationTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 22px;
  font-weight: ${TYPOGRAPHY.bold};
  letter-spacing: 2px;
  margin-bottom: ${SPACING.sm}px;
`;

const CelebrationRoutine = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: ${TYPOGRAPHY.body}px;
  font-weight: ${TYPOGRAPHY.medium};
  margin-bottom: ${SPACING.sm}px;
`;

const CelebrationMeta = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  margin-bottom: ${SPACING.lg}px;
`;

const CelebrationHint = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-style: italic;
  text-align: center;
  line-height: 18px;
  margin-bottom: ${SPACING.xl}px;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function TheFlowScreen() {
  const { gridId } = useLocalSearchParams<{ gridId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const dailyCheckIns = useReflectorStore((s) => s.dailyCheckIns);
  const toggleSubTask = useReflectorStore((s) => s.toggleSubTask);
  const markDayCompleted = useReflectorStore((s) => s.markDayCompleted);

  const [recalibrateMode, setRecalibrateMode] = useState(false);

  type PrestigeLevelUpData = {
    newPrestige: number;
    newConfig: (typeof PRESTIGE_CONFIG)[0];
    routineTitle: string;
    completions: number;
  } | null;
  const [prestigeLevelUp, setPrestigeLevelUp] = useState<PrestigeLevelUpData>(null);

  const grid = grids.find((g) => g.id === gridId);
  const routine = grid ? routines.find((r) => r.id === grid.routineId) : undefined;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayMs = now.getTime();
  const todayDay = grid?.days.find((d) => d.date === todayMs);

  const checkIn = todayDay
    ? dailyCheckIns.find((c) => c.gridId === gridId && c.dayIndex === todayDay.dayIndex)
    : undefined;
  const completedIds = checkIn?.completedSubTaskIds ?? [];

  if (!grid || !gridId || !routine) {
    return (
      <ErrorWrapper>
        <EmptyState
          icon="🔍"
          title="Grid not found"
          subtitle="Grid or routine not found. It may have been deleted."
        />
      </ErrorWrapper>
    );
  }

  if (!todayDay) {
    return (
      <ErrorWrapper>
        <EmptyState
          icon="📅"
          title="No active day"
          subtitle="No active day for today in this grid."
        />
      </ErrorWrapper>
    );
  }

  const visibleSubTasks = recalibrateMode
    ? routine.subTasks.filter((st) => st.isCore)
    : routine.subTasks;

  const requiredTasks = recalibrateMode
    ? routine.subTasks.filter((st) => st.isCore)
    : routine.subTasks;
  const allDone = requiredTasks.every((st) => completedIds.includes(st.id));

  const scarsCount = grid.days.filter((d) => d.status === 'scarred').length;

  // Prestige info for current routine
  const currentPrestige = getPrestigeLevel(routine.completedGridCount ?? 0);
  const currentPrestigeConfig = PRESTIGE_CONFIG[currentPrestige];

  const handleMarkComplete = () => {
    haptic.success();
    markDayCompleted(gridId, todayDay.dayIndex);

    // Wire gamification side effects
    onDayCompleted(gridId, todayDay.dayIndex);

    // Check if the grid is now fully complete (all 40 days done)
    const stateAfterDay = useReflectorStore.getState();
    const updatedGrid = stateAfterDay.grids.find((g) => g.id === gridId);
    if (updatedGrid) {
      const allGridDaysDone = updatedGrid.days.every(
        (d) => d.status === 'completed' || d.status === 'scarred'
      );
      const noScars = updatedGrid.days.every((d) => d.status !== 'pending');
      if (allGridDaysDone && noScars) {
        // Record old prestige level before completeGrid increments it
        const routineBeforeComplete = stateAfterDay.routines.find(
          (r) => r.id === grid.routineId
        );
        const oldCount = routineBeforeComplete?.completedGridCount ?? 0;
        const oldPrestige = getPrestigeLevel(oldCount);

        // completeGrid atomically marks completed AND increments prestige
        useReflectorStore.getState().completeGrid(gridId);
        onGridCompleted(gridId);

        // Detect prestige level-up and show celebration
        const newCount = oldCount + 1;
        const newPrestige = getPrestigeLevel(newCount);
        if (newPrestige > oldPrestige) {
          const newConfig = PRESTIGE_CONFIG[newPrestige];
          setPrestigeLevelUp({
            newPrestige,
            newConfig,
            routineTitle: routine.title,
            completions: newCount,
          });
          return; // wait for user to dismiss modal before navigating
        }
      }
    }

    router.back();
  };

  return (
    <>
      <ScrollScreen
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* ── 5×8 Grid Visualization ──────────────────────────────── */}
        <GridContainer>
          <GridVisual>
            {grid.days.map((day) => {
              const isToday = day.date === todayMs;
              return (
                <GridCell key={day.dayIndex} status={day.status} isToday={isToday}>
                  <GridCellNumber status={day.status}>{day.dayIndex}</GridCellNumber>
                </GridCell>
              );
            })}
          </GridVisual>

          {scarsCount > 0 && (
            <ScarIndicator>
              <ScarDot />
              <ScarText>{scarsCount} scar{scarsCount !== 1 ? 's' : ''}</ScarText>
            </ScarIndicator>
          )}
        </GridContainer>

        {/* ── Prestige Info Banner ─────────────────────────────────── */}
        {currentPrestige > 0 && (
          <PrestigeBanner>
            <PrestigeBannerText>
              {currentPrestigeConfig.emoji} {currentPrestigeConfig.name} · {currentPrestigeConfig.xpMultiplier}x XP
              {currentPrestigeConfig.hardResetForced ? ' · Hard Reset ON' : ''}
            </PrestigeBannerText>
          </PrestigeBanner>
        )}

        {/* ── Task Checklist ──────────────────────────────────────── */}
        <ContentPad>
          <RecalibrateBtn
            active={recalibrateMode}
            onPress={() => {
              haptic.selection();
              setRecalibrateMode((prev) => !prev);
            }}
          >
            <RecalibrateDot active={recalibrateMode} />
            <RecalibrateBtnText active={recalibrateMode}>
              {recalibrateMode ? 'Survival mode — core only' : 'Recalibrate'}
            </RecalibrateBtnText>
          </RecalibrateBtn>

          <TaskList>
            {visibleSubTasks.map((st) => {
              const isDone = completedIds.includes(st.id);
              return (
                <TaskRow
                  key={st.id}
                  done={isDone}
                  onPress={() => {
                    haptic.light();
                    toggleSubTask(gridId, todayDay.dayIndex, st.id);
                  }}
                >
                  <FlowCheckbox done={isDone}>
                    {isDone && <Checkmark>✓</Checkmark>}
                  </FlowCheckbox>
                  <TaskInfo>
                    <TaskTitle done={isDone}>{st.title}</TaskTitle>
                    {!st.isCore && (
                      <OptionalBadge>
                        <OptionalBadgeText>Optional</OptionalBadgeText>
                      </OptionalBadge>
                    )}
                  </TaskInfo>
                </TaskRow>
              );
            })}
          </TaskList>

          {allDone && todayDay.status === 'pending' && (
            <PrimaryButton
              onPress={handleMarkComplete}
              label="Mark Day Complete"
              style={{ marginTop: SPACING.xxl }}
            />
          )}
        </ContentPad>
      </ScrollScreen>

      {/* ── Prestige Level-Up Celebration Modal ─────────────────── */}
      <Modal
        visible={prestigeLevelUp !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPrestigeLevelUp(null);
          router.back();
        }}
      >
        <ModalOverlay>
          <CelebrationCard>
            <CelebrationEmoji>{prestigeLevelUp?.newConfig.emoji}</CelebrationEmoji>
            <CelebrationTitle>{prestigeLevelUp?.newConfig.name?.toUpperCase()}</CelebrationTitle>
            <CelebrationRoutine>{prestigeLevelUp?.routineTitle}</CelebrationRoutine>
            <CelebrationMeta>
              {prestigeLevelUp?.completions} completion{prestigeLevelUp?.completions !== 1 ? 's' : ''}{' '}
              · {prestigeLevelUp?.newConfig.xpMultiplier}x XP
            </CelebrationMeta>
            {prestigeLevelUp?.newConfig.hardResetForced && (
              <CelebrationHint>
                "Next grid: harder rules, bigger rewards."
              </CelebrationHint>
            )}
            <PrimaryButton
              label="Continue"
              onPress={() => {
                haptic.success();
                setPrestigeLevelUp(null);
                router.back();
              }}
            />
          </CelebrationCard>
        </ModalOverlay>
      </Modal>
    </>
  );
}

