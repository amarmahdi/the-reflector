# CRITICAL: Navigation & Layout Rules for ALL Agent Tasks

## Navigation Architecture
The app uses **Drawer navigation** (NOT tabs, NOT stack). 

### How to open the drawer
```typescript
import { useNavigation, DrawerActions } from '@react-navigation/native';
const navigation = useNavigation();
navigation.dispatch(DrawerActions.openDrawer());
```

### How to navigate between screens
```typescript
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/forge');      // navigate to a screen
router.back();              // go back
router.navigate('/');       // go to home
```

### How screens are structured
- `app/index.tsx` — Home (no header, handles its own top bar)
- All other screens get a system header from the Drawer layout
- Drawer slides in from left edge (swipe or menu button)
- The drawer contains: Home, Forge, Focus, Journal, Insights, Achievements, Alarms, Recurring Tasks, Weekly Review, Settings

## SafeArea
The entire app is wrapped in `<SafeAreaProvider>` in `_layout.tsx`. 

**For screens with headerShown: false** (index.tsx, focus.tsx):
You MUST handle safe area yourself:
```typescript
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Option A: Use SafeAreaView as wrapper
<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface0 }} edges={['top', 'left', 'right']}>
  {/* content */}
</SafeAreaView>

// Option B: Use insets manually
const insets = useSafeAreaInsets();
<View style={{ flex: 1, paddingTop: insets.top }}>
  {/* content */}
</View>
```

**For screens with headers** (forge.tsx, settings.tsx, etc.):
The system header already handles top safe area. Just ensure bottom padding for scrollable content:
```typescript
const insets = useSafeAreaInsets();
<ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
```

## Home Screen Top Bar
The home screen (`index.tsx`) has NO system header. It must render its own top bar:
- **Left**: hamburger menu icon (☰) → opens the drawer
- **Right**: profile icon → `router.push('/settings')`
- This bar must be INSIDE SafeAreaView to avoid going under the camera

```typescript
const navigation = useNavigation();
const insets = useSafeAreaInsets();

<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface0 }} edges={['top', 'left', 'right']}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
    <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
      <Text>☰</Text>
    </Pressable>
    <Pressable onPress={() => router.push('/settings')}>
      <Text>👤</Text>
    </Pressable>
  </View>
  {/* rest of home content */}
</SafeAreaView>
```

## DO NOT MODIFY
- `app/_layout.tsx` — already configured with Drawer + SafeArea + custom drawer content
- `constants/theme.ts` — already updated
