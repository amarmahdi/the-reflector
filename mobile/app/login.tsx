import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/apiClient';
import { COLORS, TYPOGRAPHY } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Username availability
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // Debounced username check
  useEffect(() => {
    if (mode !== 'register') return;
    setUsernameAvailable(null);

    const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean.length < 3) return;

    if (checkTimer.current) clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await api<{ available: boolean }>(
          `/auth/check-username/${clean}`,
          { skipAuth: true }
        );
        setUsernameAvailable(res.available);
      } catch {
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    }, 500);

    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [username, mode]);

  const handleSubmit = async () => {
    setError('');
    const cleanUsername = username.toLowerCase().trim();

    if (!cleanUsername || !password) {
      setError('All fields are required.');
      return;
    }

    if (mode === 'register' && !displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(cleanUsername, password);
      } else {
        await register(cleanUsername, displayName.trim(), password);
      }
      haptic.success();
      // Don't navigate — _layout.tsx auth gate will handle
      // routing to /onboarding or / based on hasOnboarded
    } catch (e: unknown) {
      haptic.error();
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setUsernameAvailable(null);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.logo}>🌿</Text>
            <Text style={s.title}>The Reflector</Text>
            <Text style={s.subtitle}>
              {mode === 'login' ? 'Welcome back.' : 'Begin your journey.'}
            </Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>USERNAME</Text>
              <TextInput
                style={s.input}
                value={username}
                onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_unique_name"
                placeholderTextColor={COLORS.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
              {mode === 'register' && username.length >= 3 && (
                <View style={s.availRow}>
                  {checkingUsername ? (
                    <ActivityIndicator size="small" color={COLORS.textDim} />
                  ) : usernameAvailable === true ? (
                    <Text style={s.availGood}>✓ Available</Text>
                  ) : usernameAvailable === false ? (
                    <Text style={s.availBad}>✕ Taken</Text>
                  ) : null}
                </View>
              )}
            </View>

            {mode === 'register' && (
              <View style={s.inputGroup}>
                <Text style={s.label}>DISPLAY NAME</Text>
                <TextInput
                  style={s.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your Name"
                  placeholderTextColor={COLORS.textDim}
                  maxLength={100}
                />
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.label}>PASSWORD</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textDim}
                secureTextEntry
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [s.submitBtn, pressed && s.submitBtnPressed]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={s.submitBtnText}>
                  {mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Toggle */}
          <View style={s.toggleRow}>
            <Text style={s.toggleText}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <Pressable onPress={toggleMode}>
              <Text style={s.toggleLink}>
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface0,
  },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  availGood: {
    color: COLORS.crimson,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  availBad: {
    color: COLORS.warmRed,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  error: {
    color: COLORS.warmRed,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: COLORS.crimson,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
  },
  toggleText: {
    color: COLORS.textDim,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  toggleLink: {
    color: COLORS.crimson,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
