import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { useGamificationStore } from '@/store/useGamificationStore';
import { haptic } from '@/lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Decorative Mini Grid ─────────────────────────────────────────────────────

const GRID_PATTERN: ('filled' | 'scar' | 'empty')[] = [
  'filled', 'filled', 'filled', 'filled', 'filled', 'filled', 'filled', 'filled',
  'filled', 'filled', 'filled', 'scar',   'filled', 'filled', 'filled', 'filled',
  'filled', 'filled', 'filled', 'filled', 'filled', 'scar',   'filled', 'filled',
  'filled', 'filled', 'filled', 'filled', 'empty',  'empty',  'empty',  'empty',
  'empty',  'empty',  'empty',  'empty',  'empty',  'empty',  'empty',  'empty',
];

// ── Constants ────────────────────────────────────────────────────────────────

const HOLD_DURATION_MS = 2000;
const MIN_WHY_CHARS = 20;

// ── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const setOnboarded = useGamificationStore((s) => s.setOnboarded);
  const setUserWhy = useGamificationStore((s) => s.setUserWhy);

  // ── Transition animation ──
  const screenOpacity = useSharedValue(1);

  const screenAnimStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const transitionTo = useCallback(
    (nextStep: number) => {
      screenOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(setStep)(nextStep);
          screenOpacity.value = withTiming(1, { duration: 500 });
        }
      });
    },
    [screenOpacity],
  );

  return (
    <View style={s.root}>
      <Animated.View style={[s.container, screenAnimStyle]}>
        {step === 1 && (
          <StepWhy
            onContinue={(why) => {
              setUserWhy(why);
              transitionTo(2);
            }}
          />
        )}
        {step === 2 && <StepGrid onContinue={() => transitionTo(3)} />}
        {step === 3 && <StepWarning onContinue={() => transitionTo(4)} />}
        {step === 4 && (
          <StepCommitment
            onComplete={() => {
              setOnboarded();
              router.replace('/');
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 1 — "Why Are You Here?"
// ═══════════════════════════════════════════════════════════════════════════════

function StepWhy({ onContinue }: { onContinue: (why: string) => void }) {
  const [why, setWhy] = useState('');
  const [focused, setFocused] = useState(false);

  // Staged fade-ins
  const titleOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
    inputOpacity.value = withDelay(2000, withTiming(1, { duration: 800 }));
  }, [titleOpacity, inputOpacity]);

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const inputStyle = useAnimatedStyle(() => ({ opacity: inputOpacity.value }));

  const canContinue = why.trim().length >= MIN_WHY_CHARS;

  // Button animates from dim to crimson when enabled
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    btnOpacity.value = withTiming(canContinue ? 1 : 0, { duration: 400 });
  }, [canContinue, btnOpacity]);

  const btnAnimStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.flex}
    >
      <ScrollView
        contentContainerStyle={s.centeredContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.Text style={[s.whyTitle, titleStyle]}>
          Why are you here?
        </Animated.Text>

        <Animated.View style={[s.inputWrapper, inputStyle]}>
          <TextInput
            multiline
            value={why}
            onChangeText={setWhy}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="What are you trying to build? What are you running from?"
            placeholderTextColor={COLORS.textDim}
            style={[
              s.whyInput,
              focused && s.whyInputFocused,
            ]}
          />
        </Animated.View>

        {canContinue && (
          <Animated.View style={btnAnimStyle}>
            <Text
              style={s.ghostButton}
              onPress={() => {
                haptic.light();
                onContinue(why.trim());
              }}
            >
              Continue
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 2 — "The Grid"
// ═══════════════════════════════════════════════════════════════════════════════

function StepGrid({ onContinue }: { onContinue: () => void }) {
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
  }, [fadeIn]);

  const style = useAnimatedStyle(() => ({ opacity: fadeIn.value }));

  return (
    <Animated.View style={[s.centeredContent, style]}>
      {/* Mini grid visualization */}
      <View style={s.gridContainer}>
        {GRID_PATTERN.map((type, i) => (
          <View
            key={i}
            style={[
              s.gridCell,
              type === 'filled' && s.gridCellFilled,
              type === 'scar' && s.gridCellScar,
            ]}
          />
        ))}
      </View>

      {/* Explanation */}
      <Text style={s.gridBody}>
        You will commit to{' '}
        <Text style={s.boldCrimson}>40 days</Text>.{'\n\n'}
        Each day you honor your word, a cell fills.{'\n\n'}
        Each day you break it, you earn a{' '}
        <Text style={s.boldCrimson}>scar</Text> — a permanent mark.
      </Text>

      <Text
        style={s.ghostButton}
        onPress={() => {
          haptic.light();
          onContinue();
        }}
      >
        Continue
      </Text>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 3 — "The Warning"
// ═══════════════════════════════════════════════════════════════════════════════

const WARNING_LINES = [
  'This app will not congratulate you for doing what you should.',
  'It will remind you when you lie to yourself.',
  'It will punish your inconsistency.',
  'And it will remember every failure.',
];

function StepWarning({ onContinue }: { onContinue: () => void }) {
  const line0 = useSharedValue(0);
  const line1 = useSharedValue(0);
  const line2 = useSharedValue(0);
  const line3 = useSharedValue(0);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    // Sequential fade-in: line at 0ms, 2.5s, 4s, 5.5s
    line0.value = withTiming(1, { duration: 1500 });
    line1.value = withDelay(2500, withTiming(1, { duration: 1500 }));
    line2.value = withDelay(4000, withTiming(1, { duration: 1500 }));
    line3.value = withDelay(5500, withTiming(1, { duration: 1500 }));
    // Button shows 2 seconds after last line finishes (5500 + 1500 + 2000 = 9000)
    btnOpacity.value = withDelay(9000, withTiming(1, { duration: 600 }));
  }, [line0, line1, line2, line3, btnOpacity]);

  const lineValues = [line0, line1, line2, line3];

  return (
    <View style={s.centeredContent}>
      {WARNING_LINES.map((text, i) => (
        <WarningLine key={i} text={text} animValue={lineValues[i]} />
      ))}

      <WarningButton btnOpacity={btnOpacity} onContinue={onContinue} />
    </View>
  );
}

function WarningLine({
  text,
  animValue,
}: {
  text: string;
  animValue: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({ opacity: animValue.value }));

  return (
    <Animated.Text style={[s.warningText, style]}>
      {text}
    </Animated.Text>
  );
}

function WarningButton({
  btnOpacity,
  onContinue,
}: {
  btnOpacity: SharedValue<number>;
  onContinue: () => void;
}) {
  const style = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  return (
    <Animated.View style={[s.warningBtnWrap, style]}>
      <Text
        style={s.ghostButton}
        onPress={() => {
          haptic.light();
          onContinue();
        }}
      >
        Continue
      </Text>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 4 — "The Commitment"
// ═══════════════════════════════════════════════════════════════════════════════

function StepCommitment({ onComplete }: { onComplete: () => void }) {
  const [pressing, setPressing] = useState(false);

  const fadeIn = useSharedValue(0);
  const holdProgress = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
  }, [fadeIn]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${holdProgress.value * 100}%` as `${number}%`,
  }));

  const handleComplete = useCallback(() => {
    // Fire haptic.success() 3 times in rapid succession
    haptic.success();
    setTimeout(() => haptic.success(), 100);
    setTimeout(() => haptic.success(), 200);
    setTimeout(() => onComplete(), 400);
  }, [onComplete]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(HOLD_DURATION_MS)
    .onBegin(() => {
      holdProgress.value = withTiming(1, {
        duration: HOLD_DURATION_MS,
        easing: Easing.linear,
      });
      runOnJS(setPressing)(true);
    })
    .onEnd((_event, success) => {
      if (success) {
        runOnJS(handleComplete)();
      } else {
        holdProgress.value = withTiming(0, { duration: 200 });
        runOnJS(setPressing)(false);
      }
    })
    .onFinalize((_event, success) => {
      if (!success) {
        holdProgress.value = withTiming(0, { duration: 200 });
        runOnJS(setPressing)(false);
      }
    });

  return (
    <Animated.View style={[s.centeredContent, containerStyle]}>
      <Text style={s.commitTitle}>Are you ready?</Text>
      <Text style={s.commitSubtitle}>
        Once you begin, there is no going back.
      </Text>

      <GestureDetector gesture={longPressGesture}>
        <Animated.View style={s.holdBtn}>
          <Animated.View style={[s.holdProgress, progressStyle]} />
          <Text style={s.holdBtnText}>
            {pressing ? 'Hold...' : 'I am ready.'}
          </Text>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface0,
  },
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // Shared centered layout
  centeredContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },

  // ── Step 1: Why ──
  whyTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
  },
  inputWrapper: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - 72,
  },
  whyInput: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    padding: SPACING.lg,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  whyInputFocused: {
    borderColor: COLORS.crimson,
  },

  // ── Ghost Button (shared) ──
  ghostButton: {
    color: COLORS.crimson,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.wide,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.xl,
  },

  // ── Step 2: Grid ──
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 200,
    gap: 4,
    justifyContent: 'center',
    marginBottom: SPACING.xxxl,
  },
  gridCell: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridCellFilled: {
    backgroundColor: COLORS.crimson,
    borderColor: COLORS.crimson,
  },
  gridCellScar: {
    backgroundColor: COLORS.surface3,
    borderColor: COLORS.textDim,
  },
  gridBody: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: TYPOGRAPHY.medium,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  boldCrimson: {
    color: COLORS.crimson,
    fontWeight: '700',
  },

  // ── Step 3: Warning ──
  warningText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.xxl,
    maxWidth: 320,
  },
  warningBtnWrap: {
    marginTop: SPACING.xl,
  },

  // ── Step 4: Commitment ──
  commitTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  commitSubtitle: {
    color: COLORS.textDim,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.huge,
  },
  holdBtn: {
    backgroundColor: COLORS.crimson,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    minWidth: 220,
  },
  holdProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.lg,
  },
  holdBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: TYPOGRAPHY.wide,
    zIndex: 1,
  },
});
