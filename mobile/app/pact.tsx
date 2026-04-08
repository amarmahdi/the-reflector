import { useState, useCallback } from 'react';
import { Pressable, Text, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useReflectorStore } from '@/store/useReflectorStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { Screen, StyledInput } from '@/components/ui';
import { haptic } from '@/lib/haptics';

// ── Constants ────────────────────────────────────────────────────────────────

const HOLD_DURATION_MS = 3000;
const MIN_WHY_CHARS = 50;

// ── Component ────────────────────────────────────────────────────────────────

export default function ThePactScreen() {
  const { gridId } = useLocalSearchParams<{ gridId: string }>();
  const router = useRouter();

  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const signPact = useReflectorStore((s) => s.signPact);

  const grid = grids.find((g) => g.id === gridId);
  const routine = grid ? routines.find((r) => r.id === grid.routineId) : undefined;

  const [step, setStep] = useState(0); // 0=why, 1=sacrifice, 2=reward, 3=sign
  const [why, setWhy] = useState('');
  const [sacrifice, setSacrifice] = useState('');
  const [reward, setReward] = useState('');
  const [signedName, setSignedName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  // Reanimated progress for hold-to-sign
  const holdProgress = useSharedValue(0);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${holdProgress.value * 100}%`,
  }));

  const handlePactSigned = useCallback(() => {
    if (!gridId || signed) return;
    setSigned(true);
    haptic.heavy();

    signPact({
      gridId,
      why: why.trim(),
      sacrifice: sacrifice.trim(),
      reward: reward.trim(),
      signedName: signedName.trim(),
    });

    // Navigate back after signing — small delay for emotional weight
    setTimeout(() => {
      router.back();
    }, 600);
  }, [gridId, why, sacrifice, reward, signedName, signed, signPact, router]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(HOLD_DURATION_MS)
    .onBegin(() => {
      holdProgress.value = withTiming(1, {
        duration: HOLD_DURATION_MS,
        easing: Easing.linear,
      });
      runOnJS(setIsSigning)(true);
    })
    .onEnd((_event, success) => {
      if (success) {
        runOnJS(handlePactSigned)();
      } else {
        holdProgress.value = withTiming(0, { duration: 200 });
        runOnJS(setIsSigning)(false);
      }
    })
    .onFinalize((_event, success) => {
      if (!success) {
        holdProgress.value = withTiming(0, { duration: 200 });
        runOnJS(setIsSigning)(false);
      }
    });

  // ── Validation ──

  const canAdvanceStep0 = why.trim().length >= MIN_WHY_CHARS;
  const canAdvanceStep1 = sacrifice.trim().length > 0;
  const canAdvanceStep2 = reward.trim().length > 0;
  const canSign = signedName.trim().length > 0 && !signed;

  const whyCharsLeft = Math.max(0, MIN_WHY_CHARS - why.trim().length);

  // ── Error state ──

  if (!grid || !gridId) {
    return (
      <Screen style={s.screenCenter}>
        <Text style={s.errorText}>Grid not found.</Text>
        <Pressable onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkText}>Go back</Text>
        </Pressable>
      </Screen>
    );
  }

  // ── Render step content ──

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepIcon}>📜</Text>
            <Text style={s.pactTitle}>THE PACT</Text>
            <Text style={s.stepPrompt}>
              Before you begin, answer honestly:
            </Text>
            <Text style={s.stepQuestion}>
              Why does this routine matter to you?
            </Text>

            <StyledInput
              multiline
              value={why}
              onChangeText={setWhy}
              placeholder="Be honest with yourself... (min 50 characters)"
              textAlignVertical="top"
              style={s.multilineInput}
            />

            <Text style={[s.charCount, canAdvanceStep0 && s.charCountMet]}>
              {canAdvanceStep0
                ? '✓ Minimum met'
                : `${whyCharsLeft} more character${whyCharsLeft !== 1 ? 's' : ''} needed`}
            </Text>

            <Pressable
              onPress={() => { haptic.light(); setStep(1); }}
              disabled={!canAdvanceStep0}
              style={[s.nextBtn, !canAdvanceStep0 && s.disabledBtn]}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </Pressable>
          </View>
        );

      case 1:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepIcon}>⚖️</Text>
            <Text style={s.stepPrompt}>The price of quitting:</Text>
            <Text style={s.stepQuestion}>
              What will you sacrifice if you quit before day 40?
            </Text>

            <StyledInput
              multiline
              value={sacrifice}
              onChangeText={setSacrifice}
              placeholder="No gaming for a week"
              textAlignVertical="top"
              style={s.multilineInput}
            />

            <View style={s.navRow}>
              <Pressable onPress={() => { haptic.light(); setStep(0); }} style={s.backBtn}>
                <Text style={s.backBtnText}>← Back</Text>
              </Pressable>
              <Pressable
                onPress={() => { haptic.light(); setStep(2); }}
                disabled={!canAdvanceStep1}
                style={[s.nextBtn, s.nextBtnFlex, !canAdvanceStep1 && s.disabledBtn]}
              >
                <Text style={s.nextBtnText}>Next →</Text>
              </Pressable>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepIcon}>🏆</Text>
            <Text style={s.stepPrompt}>The reward for finishing:</Text>
            <Text style={s.stepQuestion}>
              What do you earn when you complete all 40 days?
            </Text>

            <StyledInput
              multiline
              value={reward}
              onChangeText={setReward}
              placeholder="New sneakers, guilt-free"
              textAlignVertical="top"
              style={s.multilineInput}
            />

            <View style={s.navRow}>
              <Pressable onPress={() => { haptic.light(); setStep(1); }} style={s.backBtn}>
                <Text style={s.backBtnText}>← Back</Text>
              </Pressable>
              <Pressable
                onPress={() => { haptic.light(); setStep(3); }}
                disabled={!canAdvanceStep2}
                style={[s.nextBtn, s.nextBtnFlex, !canAdvanceStep2 && s.disabledBtn]}
              >
                <Text style={s.nextBtnText}>Seal the Pact →</Text>
              </Pressable>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepIcon}>📜</Text>
            <Text style={s.pactTitle}>SEAL YOUR PACT</Text>

            <View style={s.contractBox}>
              <Text style={s.contractText}>
                "I commit to completing{' '}
                <Text style={s.contractHighlight}>{routine?.title ?? 'this routine'}</Text>{' '}
                for 40 days.{'\n\n'}
                If I fail, I sacrifice{' '}
                <Text style={s.contractHighlight}>{sacrifice.trim()}</Text>.{'\n\n'}
                If I succeed, I earn{' '}
                <Text style={s.contractHighlight}>{reward.trim()}</Text>."
              </Text>
            </View>

            <Text style={s.signLabel}>Your name:</Text>
            <StyledInput
              value={signedName}
              onChangeText={setSignedName}
              placeholder="Type your full name"
              style={s.nameInput}
            />

            {/* Hold-to-sign button */}
            <GestureDetector gesture={longPressGesture}>
              <Animated.View
                style={[s.holdBtn, !canSign && s.disabledBtn, signed && s.signedBtn]}
              >
                {/* Progress fill */}
                <Animated.View style={[s.holdProgress, animatedProgressStyle]} />
                <Text style={s.holdBtnText}>
                  {signed
                    ? '✓ Pact Sealed'
                    : isSigning
                      ? 'Hold...'
                      : 'Hold to Sign — 3 seconds'}
                </Text>
              </Animated.View>
            </GestureDetector>

            <Pressable onPress={() => { haptic.light(); setStep(2); }} style={s.backBtnCenter}>
              <Text style={s.backBtnText}>← Back</Text>
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  // ── Step indicator ──

  const stepDots = (
    <View style={s.dotRow}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]} />
      ))}
    </View>
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
      >
        <View style={s.container}>
          {stepDots}
          {renderStep()}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  screenCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    marginBottom: SPACING.lg,
  },
  backLink: {
    padding: SPACING.md,
  },
  backLinkText: {
    color: COLORS.gold,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semibold,
  },

  // Step dots
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surface3,
  },
  dotActive: {
    backgroundColor: COLORS.gold,
    width: 24,
  },
  dotDone: {
    backgroundColor: COLORS.gold,
    opacity: 0.4,
  },

  // Step content
  stepContent: {
    gap: SPACING.md,
  },
  stepIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  pactTitle: {
    color: COLORS.gold,
    fontSize: TYPOGRAPHY.hero,
    fontWeight: TYPOGRAPHY.black,
    letterSpacing: TYPOGRAPHY.widest,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  stepPrompt: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
  stepQuestion: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.subtitle,
    fontWeight: TYPOGRAPHY.semibold,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: COLORS.warmRed,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
  },
  charCountMet: {
    color: COLORS.textDim,
  },

  // Navigation buttons
  nextBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  nextBtnFlex: {
    flex: 1,
  },
  nextBtnText: {
    color: COLORS.black,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.wide,
  },
  backBtn: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  backBtnCenter: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  backBtnText: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.normal,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  disabledBtn: {
    opacity: 0.4,
  },

  // Sign step
  contractBox: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginVertical: SPACING.md,
  },
  contractText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  contractHighlight: {
    color: COLORS.gold,
    fontWeight: TYPOGRAPHY.bold,
    fontStyle: 'normal',
  },
  signLabel: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.label,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.wider,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
  },
  nameInput: {
    borderColor: COLORS.gold,
  },

  // Hold-to-sign button
  holdBtn: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: SPACING.lg,
    position: 'relative',
  },
  holdProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.goldGlow,
    borderRadius: RADIUS.lg,
  },
  holdBtnText: {
    color: COLORS.gold,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: TYPOGRAPHY.wider,
    zIndex: 1,
  },
  signedBtn: {
    borderColor: COLORS.crimson,
    backgroundColor: COLORS.crimsonGlow,
  },
});
