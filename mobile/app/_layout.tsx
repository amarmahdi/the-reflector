import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback, useRef } from 'react';
import 'react-native-reanimated';

import * as Notifications from 'expo-notifications';
import notifee, { EventType } from '@notifee/react-native';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';

import { useReflectorStore } from '@/store/useReflectorStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { checkAutoBackup } from '@/lib/autoBackup';
import { COLORS } from '@/constants/theme';
import { scheduleNotifications } from '@/lib/notifications';
import { ensureAlarmChannel, registerNotifeeBackgroundHandler } from '@/lib/alarmNotifee';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerToastCallback, triggerDisciplineCalculation } from '@/lib/appActions';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements';
import { getTierIndex, getTierForStreak, TIERS } from '@/lib/momentumTiers';
import type { MomentumTier } from '@/lib/momentumTiers';
import AchievementToast from '@/components/AchievementToast';
import TierTransition from '@/components/TierTransition';
import type { Achievement } from '@/types/models';
import { xpForLevel } from '@/types/models';
import { seedTestData } from '@/lib/seedData';

// Register Notifee background handler at module level (required)
registerNotifeeBackgroundHandler();

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.setOptions({
  duration: 800,
  fade: true,
});
SplashScreen.preventAutoHideAsync();

// ── DEV: Seed test data on first launch (REMOVE BEFORE PROD) ──────────────
seedTestData().catch(console.error);

// ── Custom Drawer Content ──────────────────────────────────────────────────

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const userStats = useGamificationStore((s) => s.userStats);
  const nextLevelXP = xpForLevel(userStats.level);
  const currentLevelXP = userStats.level > 1 ? xpForLevel(userStats.level - 1) : 0;
  const xpProgress = nextLevelXP > currentLevelXP
    ? ((userStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 0;

  const navItems = [
    { label: 'Home', icon: '🏠', route: '/' },
    { label: 'The Forge', icon: '🔥', route: '/forge' },
    { label: 'Focus', icon: '🧘', route: '/focus' },
    { label: 'Journal', icon: '📖', route: '/journal' },
    { label: 'Insights', icon: '📊', route: '/insights' },
    { label: 'Achievements', icon: '🏆', route: '/achievements' },
    { label: 'Alarms', icon: '⏰', route: '/alarms' },
    { label: 'Recurring Tasks', icon: '🔄', route: '/recurring-tasks' },
    { label: 'Weekly Review', icon: '📅', route: '/weekly-review' },
  ];

  const navigate = (route: string) => {
    props.navigation.closeDrawer();
    if (route === '/') {
      router.navigate('/');
    } else {
      router.push(route as any);
    }
  };

  return (
    <SafeAreaView style={ds.drawerContainer} edges={['top', 'bottom']}>
      {/* Drawer Header — mini profile */}
      <View style={ds.drawerHeader}>
        <Text style={ds.drawerAppName}>The Reflector</Text>
        <View style={ds.drawerLevelRow}>
          <View style={ds.drawerLevelBadge}>
            <Text style={ds.drawerLevelText}>LVL {userStats.level}</Text>
          </View>
          <Text style={ds.drawerXpText}>{userStats.totalXP} XP</Text>
        </View>
        <View style={ds.drawerXpBar}>
          <View style={[ds.drawerXpFill, { width: `${Math.min(xpProgress, 100)}%` }]} />
        </View>
        {userStats.currentStreak > 0 && (
          <Text style={ds.drawerStreak}>🌱 {userStats.currentStreak}-day streak</Text>
        )}
      </View>

      {/* Nav Items */}
      <DrawerContentScrollView {...props} contentContainerStyle={ds.drawerScroll}>
        {navItems.map((item) => (
          <Pressable
            key={item.route}
            style={({ pressed }) => [ds.drawerItem, pressed && ds.drawerItemPressed]}
            onPress={() => navigate(item.route)}
          >
            <Text style={ds.drawerItemIcon}>{item.icon}</Text>
            <Text style={ds.drawerItemLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </DrawerContentScrollView>

      {/* Footer */}
      <Pressable
        style={ds.drawerFooter}
        onPress={() => navigate('/settings')}
      >
        <Text style={ds.drawerFooterIcon}>⚙️</Text>
        <Text style={ds.drawerFooterLabel}>Settings</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Drawer styles (using StyleSheet here since it's the navigation shell, not app content)
const ds = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: COLORS.surface0,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  drawerAppName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  drawerLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  drawerLevelBadge: {
    backgroundColor: 'rgba(196, 163, 90, 0.12)',
    borderWidth: 1,
    borderColor: '#C4A35A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  drawerLevelText: {
    color: '#C4A35A',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  drawerXpText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  drawerXpBar: {
    height: 4,
    backgroundColor: COLORS.surface2,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  drawerXpFill: {
    height: '100%',
    backgroundColor: COLORS.crimson,
    borderRadius: 2,
  },
  drawerStreak: {
    color: COLORS.crimson,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  drawerScroll: {
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 14,
  },
  drawerItemPressed: {
    backgroundColor: COLORS.surface2,
  },
  drawerItemIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  drawerItemLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  drawerFooterIcon: {
    fontSize: 18,
  },
  drawerFooterLabel: {
    color: COLORS.textDim,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});

// ── Root Layout ────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

/** Custom dark theme */
const ReflectorTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.crimson,
    background: COLORS.surface0,
    card: COLORS.surface0,
    text: COLORS.textPrimary,
    border: COLORS.border,
  },
};

function RootLayoutNav() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasOnboarded = useGamificationStore((s) => s.hasOnboarded);
  const setOnboarded = useGamificationStore((s) => s.setOnboarded);
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const notificationSettings = useReflectorStore((s) => s.notificationSettings);
  const checkHardReset = useReflectorStore((s) => s.checkHardReset);
  const failGrid = useReflectorStore((s) => s.failGrid);
  const generateDailyTodos = useReflectorStore((s) => s.generateDailyTodos);
  const dailyTodos = useReflectorStore((s) => s.dailyTodos);
  const registerAchievements = useGamificationStore((s) => s.registerAchievements);

  // Achievement toast state
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);

  // Tier transition state
  const [tierTransition, setTierTransition] = useState<{
    tier: MomentumTier;
    streak: number;
    isDegradation: boolean;
    previousTier?: MomentumTier;
  } | null>(null);

  const userStats = useGamificationStore((s) => s.userStats);
  const prevTierIdxRef = useRef<number | null>(null);

  const handleToastDismiss = useCallback(() => {
    setToastAchievement(null);
  }, []);

  // Register achievement definitions and toast callback on mount
  useEffect(() => {
    registerAchievements(ACHIEVEMENT_DEFINITIONS as Achievement[]);
    registerToastCallback((achievement) => {
      setToastAchievement(achievement);
    });
    return () => registerToastCallback(null);
  }, []);

  // Detect tier changes
  useEffect(() => {
    if (!hasOnboarded) return;
    const currentIdx = getTierIndex(userStats.currentStreak);

    if (prevTierIdxRef.current !== null && prevTierIdxRef.current !== currentIdx) {
      const isDegradation = currentIdx < prevTierIdxRef.current;
      const newTier = TIERS[currentIdx];
      // Only show overlay for non-seed tiers on upgrade, or any degradation
      if (!isDegradation && currentIdx > 0) {
        setTierTransition({
          tier: newTier,
          streak: userStats.currentStreak,
          isDegradation: false,
        });
      } else if (isDegradation) {
        setTierTransition({
          tier: newTier,
          streak: userStats.currentStreak,
          isDegradation: true,
          previousTier: TIERS[prevTierIdxRef.current],
        });
      }
    }

    prevTierIdxRef.current = currentIdx;
  }, [userStats.currentStreak, hasOnboarded]);

  // Notification tap → alarm screen (iOS / expo-notifications)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (data?.type === 'wake-alarm') {
        router.replace('/alarm');
      }
    });
    return () => sub.remove();
  }, []);

  // Foreground notification → alarm screen (iOS / expo-notifications)
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      if (data?.type === 'wake-alarm') {
        router.replace('/alarm');
      }
    });
    return () => sub.remove();
  }, []);

  // Notifee foreground event listener (Android full-screen intent)
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    ensureAlarmChannel();

    notifee.getInitialNotification().then((initial) => {
      if (initial?.notification?.android?.channelId === 'reflector-alarm' || 
          initial?.pressAction?.id === 'wake-alarm') {
        router.replace('/alarm');
      }
    });

    const unsub = notifee.onForegroundEvent(({ type, detail }) => {
      if (
        type === EventType.ACTION_PRESS ||
        type === EventType.PRESS
      ) {
        const platformId = detail?.notification?.android?.channelId;
        const pressId = detail?.pressAction?.id;
        if (pressId === 'wake-alarm' || platformId === 'reflector-alarm') {
          router.replace('/alarm');
        }
      }
    });

    return unsub;
  }, []);

  // Auth gate + onboarding redirect
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (!hasOnboarded) {
      router.replace('/onboarding');
    }
  }, [isLoggedIn, hasOnboarded]);

  // Auto-backup on app open
  useEffect(() => {
    if (isLoggedIn) {
      checkAutoBackup();
    }
  }, [isLoggedIn]);

  // On mount: scan for missed days, enforce hard resets, schedule notifications
  useEffect(() => {
    if (!hasOnboarded) return;

    // Trigger discipline score calculation on app open (force first-of-day calc)
    triggerDisciplineCalculation(undefined, true);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStart = now.getTime();

    // Check for pending past days
    let hasFreshScars = false;

    for (const grid of grids) {
      if (grid.status !== 'active') continue;

      for (const day of grid.days) {
        if (day.date < todayStart && day.status === 'pending') {
          hasFreshScars = true;
        }
      }

      if (grid.isHardResetEnabled && checkHardReset(grid.id)) {
        failGrid(grid.id);
      }
    }

    generateDailyTodos();

    const todayTodos = dailyTodos.filter((t) => t.date === todayStart);
    const activeGrids = grids.filter((g) => g.status === 'active');
    scheduleNotifications(notificationSettings, activeGrids, routines, todayTodos);

    // Only redirect to fire once per day — after user reflects, don't ask again
    if (hasFreshScars) {
      (async () => {
        const lastFireCheck = await AsyncStorage.getItem('reflector-last-fire-check');
        const lastDate = lastFireCheck ? Number(lastFireCheck) : 0;
        if (lastDate < todayStart) {
          await AsyncStorage.setItem('reflector-last-fire-check', String(todayStart));
          router.replace('/fire');
        }
      })();
    }
  }, [hasOnboarded]);

  // Weekly review auto-trigger
  useEffect(() => {
    if (!hasOnboarded) return;

    (async () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      if (dayOfWeek !== 1) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonday = today.getTime();

      const lastReviewStr = await AsyncStorage.getItem('reflector-last-weekly-review');
      const lastReviewDate = lastReviewStr ? Number(lastReviewStr) : 0;

      if (lastReviewDate < thisMonday) {
        router.push('/weekly-review' as any);
      }
    })();
  }, [hasOnboarded]);

  // Common screen options
  const screenOptions = {
    headerStyle: { backgroundColor: COLORS.surface0 },
    headerTintColor: COLORS.textPrimary,
    headerTitleStyle: {
      fontFamily: 'Inter_700Bold',
      fontWeight: '700' as const,
      fontSize: 14,
    },
    headerShadowVisible: false,
    drawerType: 'slide' as const,
    drawerStyle: {
      backgroundColor: COLORS.surface0,
      width: 280,
    },
    swipeEdgeWidth: 50,
    sceneStyle: { backgroundColor: COLORS.surface0 },
  };

  return (
    <ThemeProvider value={ReflectorTheme}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={screenOptions}
      >
        {/* Home — no header (handles its own top bar with menu + profile) */}
        <Drawer.Screen name="index" options={{ headerShown: false, title: 'Home' }} />

        {/* Main feature screens — shown in drawer */}
        <Drawer.Screen name="forge" options={{ title: 'The Forge' }} />
        <Drawer.Screen name="focus" options={{ headerShown: false, title: 'Focus' }} />
        <Drawer.Screen name="insights" options={{ title: 'Insights' }} />
        <Drawer.Screen name="settings" options={{ title: 'Settings', drawerItemStyle: { display: 'none' } }} />

        {/* Stack screens — hidden from drawer, navigated via buttons */}
        <Drawer.Screen name="flow/[gridId]" options={{ title: 'Grid Flow', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="journal/index" options={{ title: 'Journal', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="journal/[entryId]" options={{ title: 'Entry', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="achievements" options={{ title: 'Achievements', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="routine/[routineId]" options={{ title: 'Routine', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="recurring-tasks" options={{ title: 'Recurring Tasks', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="alarms" options={{ title: 'Alarms', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="weekly-review" options={{ title: 'Weekly Review', drawerItemStyle: { display: 'none' } }} />

        {/* Full-screen modals */}
        <Drawer.Screen
          name="fire"
          options={{
            headerShown: false,
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="alarm"
          options={{
            headerShown: false,
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="onboarding"
          options={{
            headerShown: false,
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="login"
          options={{
            headerShown: false,
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="pact"
          options={{
            headerShown: false,
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
      <AchievementToast achievement={toastAchievement} onDismiss={handleToastDismiss} />
      {tierTransition && (
        <TierTransition
          tier={tierTransition.tier}
          streak={tierTransition.streak}
          isDegradation={tierTransition.isDegradation}
          previousTier={tierTransition.previousTier}
          onDismiss={() => setTierTransition(null)}
        />
      )}
    </ThemeProvider>
  );
}
