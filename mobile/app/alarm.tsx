import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Vibration, Platform } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { COLORS } from '@/constants/theme';
import { cancelAlarmNotifee } from '@/lib/alarmNotifee';
import { useReflectorStore } from '@/store/useReflectorStore';
import { useAlarmStore } from '@/store/useAlarmStore';

const SWIPE_THRESHOLD = 200;

const defaultAlarmSource = require('@/assets/audio/alarm.wav');

export default function AlarmScreen() {
  const router = useRouter();
  const alarmSoundUri = useReflectorStore((s) => s.notificationSettings.alarmSoundUri);
  const alarms = useAlarmStore((s) => s.alarms);
  const audioSource = alarmSoundUri ? { uri: alarmSoundUri } : defaultAlarmSource;
  const player = useAudioPlayer(audioSource);
  const [dismissed, setDismissed] = useState(false);

  // Find the most relevant alarm to display context
  const activeAlarm = (() => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const nowTime = `${hh}:${mm}`;
    // Find alarm closest to current time
    return alarms.find((a) => a.enabled && a.time === nowTime)
      ?? alarms.find((a) => a.enabled)
      ?? null;
  })();

  const alarmLabel = activeAlarm?.label ?? 'WAKE UP';
  const alarmSubtext = activeAlarm?.type === 'routine'
    ? 'TIME FOR YOUR ROUTINE'
    : activeAlarm?.type === 'task'
    ? 'YOUR TASK IS STARTING'
    : 'THE GRID IS WAITING';

  // Pulsing animation for the wake text
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value,
  }));

  // Slide-to-dismiss
  const translateX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleDismiss)();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  // Configure audio mode + start alarm
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
      } catch {}
    })();

    player.loop = true;
    player.volume = 1.0;
    player.play();

    // Start pulsing
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    // Start vibration pattern: vibrate 1s, pause 0.5s, repeat
    const VIBRATION_PATTERN = [0, 1000, 500, 1000, 500, 1000];
    Vibration.vibrate(VIBRATION_PATTERN, true);

    return () => {
      Vibration.cancel();
      try { player.pause(); } catch {}
    };
  }, []);

  function handleDismiss() {
    if (dismissed) return;
    setDismissed(true);
    Vibration.cancel();
    try { player.pause(); } catch {}
    // Clear the ongoing Notifee alarm notification on Android
    if (Platform.OS === 'android') cancelAlarmNotifee();
    router.replace('/');
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={pulseStyle}>
          <Text style={styles.timeText}>{timeStr}</Text>
          <Text style={styles.wakeText}>{alarmLabel}</Text>
          <Text style={styles.subText}>{alarmSubtext}</Text>
        </Animated.View>
      </View>

      {/* Slide to dismiss */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <Text style={styles.sliderHint}>SLIDE TO CONFIRM →</Text>
          <GestureDetector gesture={swipeGesture}>
            <Animated.View style={[styles.sliderThumb, slideStyle]}>
              <Text style={styles.sliderThumbText}>I'M{'\n'}AWAKE</Text>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: COLORS.white,
    fontSize: 64,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  wakeText: {
    color: COLORS.crimson,
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    marginTop: 16,
  },
  subText: {
    color: COLORS.mutedGrey,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
    marginTop: 12,
  },
  sliderContainer: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  sliderTrack: {
    height: 80,
    backgroundColor: COLORS.scarGrey,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.crimson,
    justifyContent: 'center',
    paddingLeft: 8,
    overflow: 'hidden',
  },
  sliderHint: {
    color: COLORS.mutedGrey,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
  },
  sliderThumb: {
    width: 72,
    height: 64,
    backgroundColor: COLORS.crimson,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderThumbText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
