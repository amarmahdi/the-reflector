// ──────────────────────────────────────────────
// The Reflector – Home Screen (Sacred Growth)
// ──────────────────────────────────────────────

import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  TextInput as RNTextInput,
  ScrollView,
  View,
  Text
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import DisciplineArc from '@/components/DisciplineArc';
import { useDisciplineStore } from '@/store/useDisciplineStore';
import MirrorCard from '@/components/MirrorCard';
import MomentumBadge from '@/components/MomentumBadge';
import { CancelButton, EmptyState, GhostButton, PrimaryButton, ProgressBar, Screen, SectionLabel } from '@/components/ui';
import { COLORS } from '@/constants/theme';
import { useTodayFocusMinutes } from '@/hooks/useStoreData';
import { onDayCompleted, onTaskCompleted } from '@/lib/appActions';
import { formatTimeHHMM, getFormattedDate, getGreeting, isAfter5PM } from '@/lib/dateUtils';
import { haptic } from '@/lib/haptics';
import { api } from '@/lib/apiClient';
import { getCachedOracleVerdict } from '@/lib/oracle';
import { getHomeGreeting } from '@/lib/aiService';
import AIMarkdown from '@/components/AIMarkdown';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useReflectorStore } from '@/store/useReflectorStore';
import type {
  DailyTodo,
  TaskCategory,
  TaskPriority,
  TimeBlock
} from '@/types/models';
import { TASK_CATEGORIES } from '@/types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Context-Aware Verdict ────────────────────────────────────────────────────

function getTodayVerdict(
  score: number,
  yesterdayScore: number,
  streak: number,
  tasksComplete: number,
  tasksTotal: number,
  gridDayPending: boolean,
): string {
  if (score === 0 && tasksComplete === 0) return 'You haven\'t started yet. The day is waiting.';
  if (score >= 90) return 'You\'re in command today. Don\'t let up.';
  if (score >= 70 && yesterdayScore > score) return `${score}. Yesterday was ${yesterdayScore}. Hold the line.`;
  if (score >= 70) return `${score}. Respectable. But you\'ve done better.`;
  if (score >= 50 && score < 70) return `${score}. Mediocre. You know what you need to do.`;
  if (score < 50 && score > 0) return `${score}. The grid remembers days like this.`;
  if (streak === 0) return 'No streak. Today is day one — again.';
  if (streak >= 30) return `${streak} days. Don\'t you dare stop now.`;
  if (streak >= 14) return `${streak} days. The momentum is real. Protect it.`;
  if (tasksTotal > 0 && tasksComplete === tasksTotal && !gridDayPending) return 'All tasks complete. The grid awaits.';
  if (tasksTotal > 0 && tasksComplete === 0) return `${tasksTotal} tasks. None complete. Begin.`;
  return 'Show up today. That\'s all that\'s asked.';
}

// ── Helpers ──────────────────────────────────────────────────────────────────



// ── Constants ────────────────────────────────────────────────────────────────

const TIME_BLOCKS: { key: TimeBlock; label: string; icon: string }[] = [
  { key: 'morning', label: 'MORNING', icon: '☀️' },
  { key: 'afternoon', label: 'AFTERNOON', icon: '🌅' },
  { key: 'evening', label: 'EVENING', icon: '🌙' },
];

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'must', label: 'MUST' },
  { key: 'should', label: 'SHOULD' },
  { key: 'nice', label: 'NICE' },
];

const CATEGORIES: { key: TaskCategory; label: string; color: string }[] = Object.entries(
  TASK_CATEGORIES,
).map(([key, val]) => ({ key: key as TaskCategory, ...val }));

const SWIPE_THRESHOLD = -100;

const EXPLORE_ITEMS = [
  { icon: '🔥', label: 'The Forge', route: '/forge' },
  { icon: '📊', label: 'The Mirror', route: '/insights' },
  { icon: '🏆', label: 'Marks of Honor', route: '/achievements' },
  { icon: '⏰', label: 'The Bell', route: '/alarms' },
];

// ── Styled Components ────────────────────────────────────────────────────────

// Top bar
const TopBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
`;

const TopBarButton = styled.Pressable`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
`;

const TopBarIcon = styled.Text`
  font-size: 22px;
`;

// Greeting
const GreetingContainer = styled.View`
  padding: 8px 20px 20px;
`;

const GreetingText = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const DateText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  font-weight: 500;
  margin-top: 4px;
`;

const StreakRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  gap: 4px;
`;

const StreakText = styled.Text`
  color: ${COLORS.crimson};
  font-size: 12px;
  font-weight: 600;
`;

const VerdictText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  font-style: italic;
  text-align: center;
  padding: 0 20px;
  margin-top: 4px;
  margin-bottom: 12px;
`;

const StatusRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.surface1};
  border-radius: 10px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 10px 16px;
  margin: 0 20px 16px;
  flex-wrap: wrap;
`;

const StatusItem = styled.Text<{ done?: boolean }>`
  color: ${({ done }: { done?: boolean }) => done ? COLORS.crimson : COLORS.textDim};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const StatusDot = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
`;

// Oracle Teaser
const OracleTeaserCard = styled.Pressable`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-left-width: 3px;
  border-left-color: ${COLORS.warmRed};
  border-radius: 10px;
  padding: 14px 16px;
  margin: 0 20px 16px;
`;

const OracleTeaserLabel = styled.Text`
  color: ${COLORS.warmRed};
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 3px;
  margin-bottom: 6px;
`;

const OracleTeaserText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  font-style: italic;
  line-height: 20px;
`;

const OracleTeaserLink = styled.Text`
  color: ${COLORS.warmRed};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-top: 8px;
`;
// Section label
// Focus hero card
const HeroCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 20px;
  margin: 0 20px 12px;
`;

const HeroRoutineTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const HeroDayText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 14px;
`;

const ProgressPercent = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: 600;
  text-align: right;
  margin-bottom: 16px;
`;

// Empty focus card
const EmptyHeroCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 24px 20px;
  margin: 0 20px 12px;
  align-items: center;
`;

// Other routines horizontal
const OtherRoutineCard = styled.Pressable`
  width: 140px;
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 14px;
  margin-right: 10px;
`;

const OtherRoutineTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
`;

const OtherRoutineProgress = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
`;

// Tasks
const TasksContainer = styled.View`
  padding: 0 20px;
  margin-top: 24px;
`;

const TaskRow = styled.Pressable`
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
`;

const Checkbox = styled.View<{ done?: boolean }>`
  width: 22px;
  height: 22px;
  border-width: 1.5px;
  border-color: ${({ done }: { done?: boolean }) => (done ? COLORS.crimson : COLORS.border)};
  border-radius: 11px;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  background-color: ${({ done }: { done?: boolean }) => (done ? COLORS.crimson : 'transparent')};
`;

const CheckmarkText = styled.Text`
  color: ${COLORS.white};
  font-size: 11px;
  font-weight: 700;
`;

const TodoContent = styled.View`
  flex: 1;
`;

const TodoTopRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
`;

const TodoTimeLabel = styled.Text`
  color: ${COLORS.crimson};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const CategoryTag = styled.View<{ bg: string }>`
  background-color: ${({ bg }: { bg: string }) => bg};
  padding: 1px 6px;
  border-radius: 3px;
`;

const CategoryTagText = styled.Text`
  color: ${COLORS.surface0};
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const MustBadge = styled.Text`
  color: ${COLORS.crimson};
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const RecurringIcon = styled.Text`
  color: ${COLORS.textDim};
  font-size: 12px;
`;

const TodoTitle = styled.Text<{ done?: boolean }>`
  color: ${({ done }: { done?: boolean }) => (done ? COLORS.textDim : COLORS.textPrimary)};
  font-size: 14px;
  font-weight: ${({ done }: { done?: boolean }) => (done ? '400' : '500')};
  text-decoration-line: ${({ done }: { done?: boolean }) => (done ? 'line-through' : 'none')};
`;

const TimeBlockEmoji = styled.Text`
  font-size: 16px;
`;

const TaskEmptyText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  padding: 16px 0;
  text-align: center;
`;

// Inline add task
const AddTaskRow = styled.Pressable`
  padding: 14px 0;
  align-items: center;
`;

const AddTaskText = styled.Text`
  color: ${COLORS.crimson};
  font-size: 13px;
  font-weight: 600;
`;

const InlineAddContainer = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 16px;
  margin-top: 8px;
`;

const InlineInput = styled.TextInput`
  background-color: ${COLORS.surface2};
  color: ${COLORS.textPrimary};
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  margin-bottom: 12px;
`;

const InlinePickerRow = styled.View`
  flex-direction: row;
  gap: 6px;
  margin-bottom: 10px;
`;

const InlineTimeChip = styled.Pressable<{ selected?: boolean }>`
  flex: 1;
  border-width: 1px;
  border-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimson : COLORS.border};
  background-color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimsonGlow : 'transparent'};
  border-radius: 10px;
  padding: 10px 0;
  align-items: center;
`;

const InlineTimeIcon = styled.Text`
  font-size: 16px;
`;

const InlineTimeLabel = styled.Text<{ selected?: boolean }>`
  color: ${({ selected }: { selected?: boolean }) =>
    selected ? COLORS.crimson : COLORS.textDim};
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-top: 2px;
`;

const InlineButtonRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-top: 4px;
`;

// Journal prompt
const JournalCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 20px;
  margin: 24px 20px 0;
`;

const JournalPromptTitle = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const JournalPromptSub = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
`;

// Explore grid
const ExploreGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  padding: 0 20px;
  gap: 10px;
  margin-top: 24px;
`;

const ExploreCard = styled.Pressable`
  width: ${(SCREEN_WIDTH - 50) / 2}px;
  height: 80px;
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  align-items: center;
  justify-content: center;
`;

const ExploreIcon = styled.Text`
  font-size: 22px;
  margin-bottom: 4px;
`;

const ExploreLabel = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

// Mini stats footer
const StatsFooter = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 24px 20px;
  gap: 12px;
`;

const StatsText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: 600;
`;

const StatsDot = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
`;

// FAB
const FabContainer = styled.View`
  position: absolute;
  bottom: 24px;
  align-self: center;
  align-items: center;
`;

const FabButton = styled.Pressable`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${COLORS.crimson};
  align-items: center;
  justify-content: center;
  shadow-color: ${COLORS.crimson};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.4;
  shadow-radius: 8px;
  elevation: 8;
`;

const FabIcon = styled.Text`
  color: ${COLORS.white};
  font-size: 28px;
  font-weight: 700;
`;

const FabOverlay = styled.Pressable`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

const FabOption = styled.Pressable`
  flex-direction: row;
  align-items: center;
  background-color: ${COLORS.surface1};
  border-radius: 20px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 10px 16px;
  gap: 8px;
  margin-bottom: 8px;
`;

const FabOptionIcon = styled.Text`
  font-size: 16px;
`;

const FabOptionLabel = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 13px;
  font-weight: 600;
`;

// XP float
const XpFloatText = styled(Animated.Text)`
  color: ${COLORS.gold};
  font-size: 14px;
  font-weight: 700;
  position: absolute;
  top: -4px;
  right: 20px;
`;

// ── AI Greeting Card ─────────────────────────────────────────────────────────

const AIGreetingCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 16px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 16px 20px;
  margin-horizontal: 20px;
  margin-bottom: 16px;
`;

const AIGreetingLabel = styled.Text`
  color: ${COLORS.crimson};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const AIGreetingText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  font-style: italic;
`;


// ── Swipeable Todo Item ──────────────────────────────────────────────────────

function SwipeableTodoItem({
  todo,
  onToggle,
  onRemove,
}: {
  todo: DailyTodo;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const translateX = useSharedValue(0);

  const handleDelete = useCallback(() => {
    haptic.warning();
    onRemove();
  }, [onRemove]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        translateX.value = withTiming(-300, { duration: 200 });
        runOnJS(handleDelete)();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));

  const cat = TASK_CATEGORIES[todo.category];
  const blockEmoji = todo.timeBlock === 'morning' ? '☀️' : todo.timeBlock === 'afternoon' ? '🌅' : '🌙';

  return (
    <Animated.View style={{ overflow: 'hidden' }}>
      {/* Delete background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 100,
            backgroundColor: COLORS.warmRed,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
          },
          deleteOpacity,
        ]}
      >
        <Animated.Text
          style={{
            color: COLORS.white,
            fontWeight: '700',
            fontSize: 10,
            letterSpacing: 1.5,
          }}
        >
          DELETE
        </Animated.Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ backgroundColor: COLORS.surface0 }, rowStyle]}>
          <TaskRow
            onPress={() => {
              haptic.light();
              onToggle();
            }}
            onLongPress={() => {
              Alert.alert('Abandon this task?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    haptic.warning();
                    onRemove();
                  },
                },
              ]);
            }}
          >
            <Checkbox done={todo.completed}>
              {todo.completed && <CheckmarkText>✓</CheckmarkText>}
            </Checkbox>
            <TodoContent>
              <TodoTopRow>
                <TodoTimeLabel>{formatTimeHHMM(todo.scheduledTime)}</TodoTimeLabel>
                <CategoryTag bg={cat.color}>
                  <CategoryTagText>{cat.label}</CategoryTagText>
                </CategoryTag>
                {todo.priority === 'must' && <MustBadge>● MUST</MustBadge>}
                {todo.recurringTaskId && <RecurringIcon>↻</RecurringIcon>}
              </TodoTopRow>
              <TodoTitle done={todo.completed}>{todo.title}</TodoTitle>
            </TodoContent>
            <TimeBlockEmoji>{blockEmoji}</TimeBlockEmoji>
          </TaskRow>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const taskInputRef = useRef<RNTextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Stores
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const dailyTodos = useReflectorStore((s) => s.dailyTodos);
  const dailyCheckIns = useReflectorStore((s) => s.dailyCheckIns);
  const addTodo = useReflectorStore((s) => s.addTodo);
  const toggleTodo = useReflectorStore((s) => s.toggleTodo);
  const removeTodo = useReflectorStore((s) => s.removeTodo);
  const markDayCompleted = useReflectorStore((s) => s.markDayCompleted);
  const generateDailyTodos = useReflectorStore((s) => s.generateDailyTodos);

  const userStats = useGamificationStore((s) => s.userStats);
  const todayFocusMinutes = useTodayFocusMinutes();
  const journalEntries = useJournalStore((s) => s.journalEntries);
  const disciplineSnapshots = useDisciplineStore((s) => s.snapshots);
  const getTodayScore = useDisciplineStore((s) => s.getTodayScore);

  const addAlarm = useAlarmStore((s) => s.addAlarm);

  // State
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTimeBlock, setNewTimeBlock] = useState<TimeBlock>('morning');
  const [fabOpen, setFabOpen] = useState(false);
  const [showXpFloat, setShowXpFloat] = useState(false);

  // FAB animation
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);
  const fabOption1Y = useSharedValue(0);
  const fabOption2Y = useSharedValue(0);
  const fabOption3Y = useSharedValue(0);
  const fabOptionOpacity = useSharedValue(0);
  const xpOpacity = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);

  // Generate todos on mount
  useEffect(() => {
    generateDailyTodos();
  }, []);



  // Oracle teaser (Sun/Mon only, cached verdict)
  const [oracleTeaser, setOracleTeaser] = useState<string | null>(null);
  useEffect(() => {
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      getCachedOracleVerdict()
        .then((verdict) => {
          if (verdict) {
            // Extract first sentence for the teaser
            const firstSentence = verdict.split(/(?<=[.!?])\s/)[0] || verdict;
            setOracleTeaser(firstSentence);
          }
        })
        .catch(() => {});
    }
  }, []);

  // AI Greeting (cached 6h, data-aware)
  const [aiGreeting, setAiGreeting] = useState<string | null>(null);
  useEffect(() => {
    getHomeGreeting()
      .then((greeting) => { if (greeting) setAiGreeting(greeting); })
      .catch(() => {});
  }, []);

  // Today
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayMs = now.getTime();

  const todayTodos = dailyTodos.filter((t) => t.date === todayMs);
  const activeGrids = grids.filter((g) => g.status === 'active');

  // Find the most urgent grid (lowest completion %)
  const gridProgress = activeGrids.map((grid) => {
    const completed = grid.days.filter((d) => d.status === 'completed').length;
    const total = grid.days.length;
    const routine = routines.find((r) => r.id === grid.routineId);
    const todayDay = grid.days.find((d) => d.date === todayMs);

    // Check if all core sub-tasks are done for today
    const coreSubTasks = routine?.subTasks.filter((st) => st.isCore) ?? [];
    const checkIn = todayDay
      ? dailyCheckIns.find((c) => c.gridId === grid.id && c.dayIndex === todayDay.dayIndex)
      : undefined;
    const completedCoreIds = coreSubTasks.filter(
      (st) => checkIn?.completedSubTaskIds.includes(st.id)
    );
    const allCoreDone = coreSubTasks.length > 0 && completedCoreIds.length === coreSubTasks.length;

    return {
      grid,
      routine,
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      todayDay,
      todayCompleted: todayDay?.status === 'completed',
      allCoreDone,
      coreTotal: coreSubTasks.length,
      coreDone: completedCoreIds.length,
    };
  });

  // Sort by % ascending — most urgent first
  const sortedGrids = [...gridProgress].sort((a, b) => a.percent - b.percent);
  const heroGrid = sortedGrids.length > 0 ? sortedGrids[0] : null;
  const otherGrids = sortedGrids.slice(1);

  // XP float animation
  const showXpFloatAnim = useCallback(() => {
    setShowXpFloat(true);
    xpOpacity.value = 0;
    xpTranslateY.value = 0;
    xpOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(800, withTiming(0, { duration: 400 })),
    );
    xpTranslateY.value = withTiming(-40, { duration: 1400, easing: Easing.out(Easing.ease) });
    setTimeout(() => setShowXpFloat(false), 1600);
  }, []);

  const xpFloatStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ translateY: xpTranslateY.value }],
  }));

  // Handle complete today for hero grid
  const handleCompleteToday = useCallback(() => {
    if (!heroGrid?.grid || !heroGrid.todayDay) return;
    haptic.success();
    markDayCompleted(heroGrid.grid.id, heroGrid.todayDay.dayIndex);
    onDayCompleted(heroGrid.grid.id, heroGrid.todayDay.dayIndex);
    showXpFloatAnim();
  }, [heroGrid]);

  // Simple confirmation when user completes without all sub-tasks checked
  const handleEarlyComplete = useCallback(() => {
    if (!heroGrid?.routine) return;
    Alert.alert(
      'Complete today?',
      `You’ve checked ${heroGrid.coreDone} of ${heroGrid.coreTotal} core tasks. Did you finish the rest outside the app?`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, I completed it',
          onPress: () => {
            handleCompleteToday();
          },
        },
      ]
    );
  }, [heroGrid, handleCompleteToday]);

  // FAB toggle
  const toggleFab = useCallback(() => {
    haptic.light();
    const opening = !fabOpen;
    setFabOpen(opening);
    fabRotation.value = withSpring(opening ? 1 : 0, { damping: 15, stiffness: 120 });
    fabOptionOpacity.value = withTiming(opening ? 1 : 0, { duration: 200 });
    fabOption1Y.value = withSpring(opening ? -140 : 0, { damping: 15, stiffness: 120 });
    fabOption2Y.value = withDelay(
      30,
      withSpring(opening ? -95 : 0, { damping: 15, stiffness: 120 }),
    );
    fabOption3Y.value = withDelay(
      60,
      withSpring(opening ? -50 : 0, { damping: 15, stiffness: 120 }),
    );
  }, [fabOpen]);

  const closeFab = useCallback(() => {
    setFabOpen(false);
    fabRotation.value = withSpring(0, { damping: 15, stiffness: 120 });
    fabOptionOpacity.value = withTiming(0, { duration: 150 });
    fabOption1Y.value = withSpring(0, { damping: 15, stiffness: 120 });
    fabOption2Y.value = withSpring(0, { damping: 15, stiffness: 120 });
    fabOption3Y.value = withSpring(0, { damping: 15, stiffness: 120 });
  }, []);

  const fabRotateStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value * 45}deg` },
    ],
  }));

  const option1Style = useAnimatedStyle(() => ({
    opacity: fabOptionOpacity.value,
    transform: [{ translateY: fabOption1Y.value }],
  }));

  const option2Style = useAnimatedStyle(() => ({
    opacity: fabOptionOpacity.value,
    transform: [{ translateY: fabOption2Y.value }],
  }));

  const option3Style = useAnimatedStyle(() => ({
    opacity: fabOptionOpacity.value,
    transform: [{ translateY: fabOption3Y.value }],
  }));

  // Inline add task
  const handleInlineAdd = useCallback(() => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    haptic.light();
    addTodo(trimmed, 'quick', newTimeBlock, 'should', '09:00');
    setNewTitle('');
    setShowInlineAdd(false);
  }, [newTitle, newTimeBlock]);

  // Sort todos by time
  const sortedTodos = [...todayTodos].sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime),
  );

  const todosDone = todayTodos.filter((t) => t.completed).length;

  // ── Context-aware verdict ──
  const todayScore = getTodayScore();
  const yesterdaySnapMs = todayMs - 86_400_000;
  const yesterdaySnap = disciplineSnapshots.find((s) => s.date === yesterdaySnapMs);
  const yesterdayScore = yesterdaySnap?.score ?? 0;
  const gridDayCompleted = heroGrid?.todayCompleted ?? false;
  const journaledToday = journalEntries.some((e) => e.date === todayMs);
  const verdict = getTodayVerdict(
    todayScore, yesterdayScore, userStats.currentStreak,
    todosDone, todayTodos.length, !gridDayCompleted,
  );

  return (
    <>
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* ─── 1. Top Bar ─── */}
          <TopBar>
            <TopBarButton
              onPress={() => {
                haptic.light();
                navigation.dispatch(DrawerActions.openDrawer());
              }}
            >
              <TopBarIcon>☰</TopBarIcon>
            </TopBarButton>
            <TopBarButton
              onPress={() => {
                haptic.light();
                router.push('/settings' as any);
              }}
            >
              <TopBarIcon>⚙️</TopBarIcon>
            </TopBarButton>
          </TopBar>

          {/* ─── 2. Greeting ─── */}
          <GreetingContainer>
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <GreetingText>{getGreeting()}</GreetingText>
              <DateText>{getFormattedDate()}</DateText>
              <MomentumBadge />

            </Animated.View>
          </GreetingContainer>

          {/* ─── 3. Discipline Arc ─── */}
          <DisciplineArc />

          {/* ─── 3a. Today's Verdict ─── */}
          <VerdictText>{verdict}</VerdictText>

          {/* ─── 3b. Today's Status ─── */}
          <StatusRow>
            <StatusItem done={todosDone === todayTodos.length && todayTodos.length > 0}>
              {todosDone} of {todayTodos.length} tasks
            </StatusItem>
            <StatusDot>•</StatusDot>
            <StatusItem done={gridDayCompleted}>
              Grid day {gridDayCompleted ? '✓' : 'pending'}
            </StatusItem>
            <StatusDot>•</StatusDot>
            <StatusItem done={journaledToday}>
              {journaledToday ? 'Reflected' : 'No reflection yet'}
            </StatusItem>
          </StatusRow>

          {/* ─── 3c. The Mirror (Muhasabah) ─── */}
          <MirrorCard />

          {/* ─── 3d. AI Greeting ─── */}
          {aiGreeting && (
            <AIGreetingCard>
              <AIGreetingLabel>THE REFLECTOR</AIGreetingLabel>
              <AIMarkdown>{aiGreeting}</AIMarkdown>
            </AIGreetingCard>
          )}

          {/* ─── 3e. Oracle Teaser (Sun/Mon) ─── */}
          {oracleTeaser && (
            <OracleTeaserCard
              onPress={() => {
                haptic.light();
                router.push('/weekly-review' as any);
              }}
            >
              <OracleTeaserLabel>THE ORACLE SPEAKS</OracleTeaserLabel>
              <OracleTeaserText>{oracleTeaser}</OracleTeaserText>
              <OracleTeaserLink>Read the full verdict →</OracleTeaserLink>
            </OracleTeaserCard>
          )}

          {/* ─── 4. Your Focus Hero Card ─── */}
          <SectionLabel>YOUR FOCUS</SectionLabel>
          {heroGrid ? (
            <HeroCard>
              <Animated.View style={{ position: 'relative' }}>
                <HeroRoutineTitle>
                  {heroGrid.routine?.title ?? 'Routine'}
                </HeroRoutineTitle>
                <HeroDayText>
                  Day {heroGrid.completed + 1} of {heroGrid.total}
                </HeroDayText>
                <ProgressBar percent={heroGrid.percent} height={8} />
                <ProgressPercent>{heroGrid.percent}%</ProgressPercent>

                {heroGrid.todayCompleted ? (
                  <GhostButton
                    onPress={() => {
                      haptic.light();
                      router.push(`/flow/${heroGrid.grid.id}` as any);
                    }}
                    label="Completed ✓  ·  View grid →"
                  />
                ) : heroGrid.todayDay && heroGrid.allCoreDone ? (
                  <PrimaryButton onPress={handleCompleteToday} label="Complete Today ✓" />
                ) : heroGrid.todayDay ? (
                  <>
                    <GhostButton
                      onPress={handleEarlyComplete}
                      label={`${heroGrid.coreDone}/${heroGrid.coreTotal} core tasks — Complete anyway`}
                    />
                  </>
                ) : (
                  <GhostButton
                    onPress={() => {
                      haptic.light();
                      router.push(`/flow/${heroGrid.grid.id}` as any);
                    }}
                    label="View grid →"
                  />
                )}

                {showXpFloat && <XpFloatText style={xpFloatStyle}>+5 XP</XpFloatText>}
              </Animated.View>
            </HeroCard>
          ) : (
            <EmptyHeroCard>
              <EmptyState icon="🌱" title="Ready to begin?" subtitle="Create your first routine in The Forge to start your 40-day journey." />
              <PrimaryButton
                onPress={() => {
                  haptic.light();
                  router.push('/forge' as any);
                }}
                label="Go to The Forge →"
              />
            </EmptyHeroCard>
          )}

          {/* ─── 4. Other Active Routines ─── */}
          {otherGrids.length > 0 && (
            <>
              <SectionLabel style={{ marginTop: 12 }}>OTHER ROUTINES</SectionLabel>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={otherGrids}
                keyExtractor={(item) => item.grid.id}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                renderItem={({ item }) => (
                  <OtherRoutineCard
                    onPress={() => {
                      haptic.light();
                      router.push(`/flow/${item.grid.id}` as any);
                    }}
                  >
                    <OtherRoutineTitle numberOfLines={1}>
                      {item.routine?.title ?? 'Routine'}
                    </OtherRoutineTitle>
                    <OtherRoutineProgress>
                      {item.completed}/{item.total}
                    </OtherRoutineProgress>
                    <ProgressBar percent={item.percent} height={4} />
                  </OtherRoutineCard>
                )}
              />
            </>
          )}

          {/* ─── 5. Today's Tasks ─── */}
          <TasksContainer>
            <SectionLabel style={{ paddingHorizontal: 0 }}>
              TODAY'S TASKS
            </SectionLabel>

            {sortedTodos.length === 0 ? (
              <TaskEmptyText>
                No tasks for today. Tap + to add one.
              </TaskEmptyText>
            ) : (
              sortedTodos.map((todo) => (
                <SwipeableTodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => {
                    const wasCompleted = todo.completed;
                    toggleTodo(todo.id);
                    if (!wasCompleted) onTaskCompleted();
                  }}
                  onRemove={() => removeTodo(todo.id)}
                />
              ))
            )}

            {/* Inline add task */}
            {showInlineAdd ? (
              <InlineAddContainer>
                <InlineInput
                  ref={taskInputRef}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="What needs to be done?"
                  placeholderTextColor={COLORS.textDim}
                  autoFocus
                  onSubmitEditing={handleInlineAdd}
                  returnKeyType="done"
                />
                <InlinePickerRow>
                  {TIME_BLOCKS.map((b) => (
                    <InlineTimeChip
                      key={b.key}
                      selected={newTimeBlock === b.key}
                      onPress={() => setNewTimeBlock(b.key)}
                    >
                      <InlineTimeIcon>{b.icon}</InlineTimeIcon>
                      <InlineTimeLabel selected={newTimeBlock === b.key}>
                        {b.label}
                      </InlineTimeLabel>
                    </InlineTimeChip>
                  ))}
                </InlinePickerRow>
                <InlineButtonRow>
                  <CancelButton
                    style={{ flex: 1 }}
                    onPress={() => {
                      setShowInlineAdd(false);
                      setNewTitle('');
                    }}
                    label="Cancel"
                  />
                  <PrimaryButton style={{ flex: 2 }} onPress={handleInlineAdd} label="ADD" />
                </InlineButtonRow>
              </InlineAddContainer>
            ) : (
              <AddTaskRow
                onPress={() => {
                  haptic.light();
                  setShowInlineAdd(true);
                }}
              >
                <AddTaskText>+ Add to today</AddTaskText>
              </AddTaskRow>
            )}
          </TasksContainer>

          {/* ─── 6. Journal Prompt (after 5 PM) ─── */}
          {isAfter5PM() && (
            <JournalCard>
              <JournalPromptTitle>💭 How was your day?</JournalPromptTitle>
              <JournalPromptSub>Take a moment to reflect.</JournalPromptSub>
              <GhostButton
                onPress={() => {
                  haptic.light();
                  router.push('/journal' as any);
                }}
                label="Open Journal →"
              />
            </JournalCard>
          )}

          {/* ─── 7. Explore Grid ─── */}
          <SectionLabel style={{ marginTop: 24 }}>PATHS</SectionLabel>
          <ExploreGrid>
            {EXPLORE_ITEMS.map((item) => (
              <ExploreCard
                key={item.route}
                onPress={() => {
                  haptic.light();
                  router.push(item.route as any);
                }}
              >
                <ExploreIcon>{item.icon}</ExploreIcon>
                <ExploreLabel>{item.label}</ExploreLabel>
              </ExploreCard>
            ))}
          </ExploreGrid>

          {/* ─── 8. Mini Stats Footer ─── */}
          <StatsFooter>
            <StatsText>LVL {userStats.level}</StatsText>
            <StatsDot>·</StatsDot>
            <StatsText>{userStats.totalXP} XP</StatsText>
            <StatsDot>·</StatsDot>
            <StatsText>{todayFocusMinutes} min focused today</StatsText>
          </StatsFooter>
        </ScrollView>
      </SafeAreaView>

      {/* ─── FAB Overlay ─── */}
      {fabOpen && <FabOverlay onPress={closeFab} />}

      {/* ─── FAB Options ─── */}
      <FabContainer style={{ bottom: insets.bottom + 24 }}>
        <Animated.View style={[{ position: 'absolute', alignItems: 'center' }, option1Style]}>
          <FabOption
            onPress={() => {
              closeFab();
              haptic.light();
              router.push('/focus' as any);
            }}
          >
            <FabOptionIcon>🧘</FabOptionIcon>
            <FabOptionLabel>Focus</FabOptionLabel>
          </FabOption>
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', alignItems: 'center' }, option2Style]}>
          <FabOption
            onPress={() => {
              closeFab();
              haptic.light();
              router.push('/journal' as any);
            }}
          >
            <FabOptionIcon>✏️</FabOptionIcon>
            <FabOptionLabel>Journal</FabOptionLabel>
          </FabOption>
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', alignItems: 'center' }, option3Style]}>
          <FabOption
            onPress={() => {
              closeFab();
              haptic.light();
              setShowInlineAdd(true);
              // Scroll to task section
              setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
                taskInputRef.current?.focus();
              }, 200);
            }}
          >
            <FabOptionIcon>📝</FabOptionIcon>
            <FabOptionLabel>Task</FabOptionLabel>
          </FabOption>
        </Animated.View>

        <Animated.View style={fabRotateStyle}>
          <FabButton onPress={toggleFab}>
            <FabIcon>{fabOpen ? '✕' : '+'}</FabIcon>
          </FabButton>
        </Animated.View>
      </FabContainer>
    </Screen>
    </>
  );
}
