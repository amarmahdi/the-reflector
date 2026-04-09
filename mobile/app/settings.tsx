import { useState, useEffect } from 'react';
import { Switch, Alert, Platform, Share, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReflectorStore } from '@/store/useReflectorStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { COLORS } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { scheduleNotifications, getScheduledCount, requestPermissions } from '@/lib/notifications';
import { downloadYouTubeAudio, listDownloadedSounds, deleteDownloadedSound } from '@/lib/youtubeAudio';
import { exportAllData, importData, getStorageSize, clearAllData } from '@/lib/dataExport';
import { manualBackup, restoreFromCloud } from '@/lib/autoBackup';
import { useAuthStore } from '@/store/useAuthStore';
import { STORE_KEYS } from '@/store/keys';
import AsyncStorageLib from '@react-native-async-storage/async-storage';
import { xpForLevel } from '@/types/models';

import { Screen, SectionLabel, PrimaryButton, GhostButton, DangerButton } from '@/components/ui';

const ContentPad = styled.View`
  padding: 0 20px 40px;
`;

// Profile summary card
const ProfileCard = styled.View`
  background-color: ${COLORS.surface1};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.border};
  padding: 20px;
  margin-top: 16px;
  margin-bottom: 8px;
`;

const LevelRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const LevelBadgeView = styled.View`
  background-color: ${COLORS.goldGlow};
  border-width: 1px;
  border-color: ${COLORS.gold};
  border-radius: 8px;
  padding: 5px 12px;
`;

const LevelText = styled.Text`
  color: ${COLORS.gold};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const XPText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const XPBarOuter = styled.View`
  height: 5px;
  background-color: ${COLORS.surface2};
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
`;

const XPBarInner = styled.View<{ width: number }>`
  height: 100%;
  width: ${({ width }: { width: number }) => width}%;
  background-color: ${COLORS.crimson};
  border-radius: 3px;
`;

const StreakRow = styled.Text`
  color: ${COLORS.crimson};
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const MemberSince = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
`;

// Quick links


const LinkRow = styled.Pressable`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
`;

const LinkLeft = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 14px;
`;

const LinkIcon = styled.Text`
  font-size: 18px;
  width: 28px;
  text-align: center;
`;

const LinkLabel = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const ChevronText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 16px;
`;

// Settings rows
const SettingRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
`;

const SettingLabel = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const HintText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 10px;
  line-height: 18px;
`;

const TimeButton = styled.Pressable`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 14px;
  padding: 16px;
  align-items: center;
  margin-bottom: 8px;
`;

const TimeButtonText = styled.Text`
  color: ${COLORS.textPrimary};
  font-size: 28px;
  font-weight: 900;
`;

const TimeButtonHint = styled.Text`
  color: ${COLORS.textDim};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  margin-top: 4px;
`;

const PickerWrapper = styled.View`
  background-color: ${COLORS.surface1};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  align-items: center;
`;

const OptionRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-bottom: 10px;
`;

const OptionBtn = styled.Pressable<{ active: boolean }>`
  flex: 1;
  padding: 12px 0;
  border-width: 1px;
  border-color: ${({ active }: { active: boolean }) => active ? COLORS.crimson : COLORS.border};
  background-color: ${({ active }: { active: boolean }) => active ? COLORS.crimsonGlow : 'transparent'};
  border-radius: 10px;
  align-items: center;
`;

const OptionBtnText = styled.Text<{ active: boolean }>`
  color: ${({ active }: { active: boolean }) => active ? COLORS.crimson : COLORS.textDim};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

// YouTube
const YtInputRow = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-bottom: 8px;
`;

const YtInput = styled.TextInput`
  flex: 1;
  background-color: ${COLORS.surface2};
  border-width: 1px;
  border-color: ${COLORS.border};
  border-radius: 10px;
  padding: 12px 14px;
  color: ${COLORS.textPrimary};
  font-size: 13px;
  font-weight: 500;
`;

const YtDownloadBtn = styled.Pressable`
  width: 48px;
  background-color: ${COLORS.crimson};
  border-radius: 10px;
  align-items: center;
  justify-content: center;
`;

const YtDownloadBtnText = styled.Text`
  color: ${COLORS.white};
  font-size: 20px;
  font-weight: 700;
`;

const DownloadRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 10px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLORS.border};
`;

const DownloadName = styled.Text`
  flex: 1;
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
`;

const DeleteBtn = styled.Pressable`
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
`;

const DeleteBtnText = styled.Text`
  color: ${COLORS.warmRed};
  font-size: 16px;
  font-weight: 700;
`;



const StorageText = styled.Text`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
`;

const AboutText = styled.Text`
  color: ${COLORS.textDim};
  font-size: 12px;
  text-align: center;
  margin-top: 32px;
  font-weight: 500;
`;

const ScheduledInfo = styled.Text`
  color: ${COLORS.textDim};
  font-size: 11px;
  text-align: center;
  margin-top: 8px;
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const notificationSettings = useReflectorStore((s) => s.notificationSettings);
  const updateNotificationSettings = useReflectorStore((s) => s.updateNotificationSettings);
  const grids = useReflectorStore((s) => s.grids);
  const routines = useReflectorStore((s) => s.routines);
  const dailyTodos = useReflectorStore((s) => s.dailyTodos);
  const clearOldTodos = useReflectorStore((s) => s.clearOldTodos);
  const userStats = useGamificationStore((s) => s.userStats);

  const [scheduledCount, setScheduledCount] = useState(0);
  const [showWakePicker, setShowWakePicker] = useState(Platform.OS === 'ios');
  const [showQuietPicker, setShowQuietPicker] = useState(Platform.OS === 'ios');
  const [ytUrl, setYtUrl] = useState('');
  const [ytDownloading, setYtDownloading] = useState(false);
  const [ytProgress, setYtProgress] = useState('');
  const [downloads, setDownloads] = useState<{ name: string; uri: string }[]>([]);
  const [storageInfo, setStorageInfo] = useState('Calculating...');
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Auth state
  const authUser = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const logout = useAuthStore((s) => s.logout);
  const autoBackupEnabled = useAuthStore((s) => s.autoBackupEnabled);
  const setAutoBackup = useAuthStore((s) => s.setAutoBackup);
  const lastBackupAt = useAuthStore((s) => s.lastBackupAt);

  useEffect(() => {
    setDownloads(listDownloadedSounds());
    getStorageSize().then((s) => setStorageInfo(`Using ${s.formatted}`));
  }, []);

  useEffect(() => {
    getScheduledCount().then(setScheduledCount);
  }, [notificationSettings]);

  // XP
  const currentLevelXP = userStats.level > 1 ? xpForLevel(userStats.level - 1) : 0;
  const nextLevelXP = xpForLevel(userStats.level);
  const xpProgress = nextLevelXP > currentLevelXP
    ? ((userStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 0;

  const memberDate = new Date(userStats.joinedAt);
  const memberStr = memberDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Time helpers
  const [wakeH, wakeM] = notificationSettings.wakeTime.split(':').map(Number);
  const wakeDate = new Date();
  wakeDate.setHours(wakeH ?? 7, wakeM ?? 0, 0, 0);
  const quietDate = new Date();
  quietDate.setHours(notificationSettings.quietHourStart, 0, 0, 0);

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const handleWakeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowWakePicker(false);
    if (!date) return;
    const h = date.getHours();
    const m = date.getMinutes();
    updateNotificationSettings({
      wakeTime: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
    });
  };

  const handleQuietChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowQuietPicker(false);
    if (!date) return;
    updateNotificationSettings({ quietHourStart: date.getHours() });
  };

  const handleReschedule = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission needed', 'Enable notifications in your system settings.');
      return;
    }
    const activeGrids = grids.filter((g) => g.status === 'active');
    await scheduleNotifications(notificationSettings, activeGrids, routines);
    const count = await getScheduledCount();
    setScheduledCount(count);
    Alert.alert('Scheduled', `${count} notification${count !== 1 ? 's' : ''} set.`);
  };

  const handleYtDownload = async () => {
    const url = ytUrl.trim();
    if (!url) return;
    setYtDownloading(true);
    setYtProgress('Fetching audio...');
    const result = await downloadYouTubeAudio(url, (pct) => setYtProgress(`Downloading ${pct}%`));
    setYtDownloading(false);
    if (result.success && result.fileUri && result.fileName) {
      setYtProgress('');
      setYtUrl('');
      updateNotificationSettings({ alarmSoundUri: result.fileUri, alarmSoundName: result.fileName });
      setDownloads(listDownloadedSounds());
      Alert.alert('Downloaded', `"${result.fileName}" saved and set as alarm sound.`);
    } else {
      setYtProgress('');
      Alert.alert('Failed', result.error || 'Download failed.');
    }
  };

  const handleExport = async () => {
    try {
      haptic.light();
      const json = await exportAllData();
      await Share.share({ message: json, title: 'The Reflector — Data Export' });
    } catch { Alert.alert('Error', 'Failed to export data.'); }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const response = await fetch(result.assets[0].uri);
      const json = await response.text();
      const importResult = await importData(json);
      if (importResult.success) {
        haptic.success();
        Alert.alert('Imported', 'Data imported. Restart the app for changes to take effect.');
      } else {
        Alert.alert('Failed', importResult.error || 'Import failed.');
      }
    } catch { Alert.alert('Error', 'Failed to import data.'); }
  };

  const handleClearOldTodos = () => {
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const oldCount = dailyTodos.filter((t) => t.date < thirtyDaysAgo).length;
    if (oldCount === 0) { Alert.alert('Nothing to clear', 'No todos older than 30 days.'); return; }
    Alert.alert('Clear old tasks', `Delete ${oldCount} task${oldCount !== 1 ? 's' : ''} older than 30 days?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { haptic.warning(); clearOldTodos(thirtyDaysAgo); getStorageSize().then((s) => setStorageInfo(`Using ${s.formatted}`)); } },
    ]);
  };

  const handleResetAll = () => {
    Alert.alert('Reset all data', 'This will permanently delete ALL your data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'I understand', style: 'destructive', onPress: () => {
        Alert.alert('Are you sure?', 'Everything will be gone forever.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete everything', style: 'destructive', onPress: async () => {
            haptic.error();
            await clearAllData();
            Alert.alert('Done', 'All data cleared. Restart the app.');
          }},
        ]);
      }},
    ]);
  };

  const quickLinks = [
    { icon: '📖', label: 'Reflections', route: '/journal' },
    { icon: '🏆', label: 'Marks of Honor', route: '/achievements' },
    { icon: '📊', label: 'The Mirror', route: '/insights' },
    { icon: '⏰', label: 'The Bell', route: '/alarms' },
    { icon: '🔄', label: 'Disciplines', route: '/recurring-tasks' },
    { icon: '📅', label: 'Week in Review', route: '/weekly-review' },
  ];

  const handleManualBackup = async () => {
    setBackingUp(true);
    const ok = await manualBackup();
    setBackingUp(false);
    if (ok) {
      haptic.success();
      Alert.alert('Backup Complete', 'Your data has been saved to the cloud.');
    } else {
      Alert.alert('Backup Failed', 'Could not upload backup. Check your connection.');
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore from Cloud',
      'This will replace all local data with your latest cloud backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setRestoring(true);
            const data = await restoreFromCloud();
            if (!data) {
              setRestoring(false);
              Alert.alert('No Backup', 'No cloud backup found for your account.');
              return;
            }
            // Write each store back to AsyncStorage
            const pairs: [string, string][] = [];
            const storeMap: Record<string, string> = {
              [STORE_KEYS.reflector]: 'reflector',
              [STORE_KEYS.journal]: 'journal',
              [STORE_KEYS.focus]: 'focus',
              [STORE_KEYS.gamification]: 'gamification',
            };
            for (const [key, field] of Object.entries(storeMap)) {
              if ((data as Record<string, unknown>)[field]) {
                pairs.push([key, JSON.stringify((data as Record<string, unknown>)[field])]);
              }
            }
            if (pairs.length > 0) {
              await AsyncStorageLib.multiSet(pairs);
            }
            setRestoring(false);
            haptic.success();
            Alert.alert('Restored', 'Data restored from cloud. Restart the app for changes to take effect.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'You will need to log in again to sync your data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  const formatBackupDate = (ts: number | null) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <ContentPad>
          {/* Profile Summary */}
          <ProfileCard>
            <LevelRow>
              <LevelBadgeView>
                <LevelText>LVL {userStats.level}</LevelText>
              </LevelBadgeView>
              <XPText>{userStats.totalXP} / {nextLevelXP} XP</XPText>
            </LevelRow>
            <XPBarOuter>
              <XPBarInner width={Math.min(xpProgress, 100)} />
            </XPBarOuter>
            {userStats.currentStreak > 0 && (
              <StreakRow>🌱 {userStats.currentStreak}-day streak</StreakRow>
            )}
            <MemberSince>Member since {memberStr}</MemberSince>
          </ProfileCard>

          {/* Account */}
          {isLoggedIn && authUser && (
            <>
              <SectionLabel>IDENTITY</SectionLabel>
              <SettingRow>
                <SettingLabel>@{authUser.username}</SettingLabel>
                <HintText style={{ marginBottom: 0 }}>{authUser.display_name}</HintText>
              </SettingRow>
            </>
          )}

          {/* Cloud Backup */}
          {isLoggedIn && (
            <>
              <SectionLabel>THE ARCHIVE</SectionLabel>
              <HintText>Last backup: {formatBackupDate(lastBackupAt)}</HintText>
              <SettingRow>
                <SettingLabel>Auto-Sync Daily</SettingLabel>
                <Switch
                  value={autoBackupEnabled}
                  onValueChange={setAutoBackup}
                  trackColor={{ false: COLORS.border, true: COLORS.crimson }}
                  thumbColor={COLORS.white}
                />
              </SettingRow>
              <PrimaryButton
                onPress={handleManualBackup}
                label={backingUp ? 'PRESERVING...' : 'PRESERVE YOUR RECORD'}
                style={{ marginTop: 12 }}
              />
              <GhostButton
                onPress={handleRestore}
                label={restoring ? 'RECOVERING...' : 'RECOVER YOUR PAST'}
                style={{ marginTop: 12 }}
              />
            </>
          )}

          {/* Quick Links */}
          <SectionLabel>PATHS</SectionLabel>
          {quickLinks.map((link) => (
            <LinkRow key={link.route} onPress={() => {
              haptic.light();
              router.push(link.route as any);
            }}>
              <LinkLeft>
                <LinkIcon>{link.icon}</LinkIcon>
                <LinkLabel>{link.label}</LinkLabel>
              </LinkLeft>
              <ChevronText>›</ChevronText>
            </LinkRow>
          ))}

          {/* Notifications */}
          <SectionLabel>THE BELL</SectionLabel>
          <SettingRow>
            <SettingLabel>Enable notifications</SettingLabel>
            <Switch
              value={notificationSettings.enabled}
              onValueChange={(v) => updateNotificationSettings({ enabled: v })}
              trackColor={{ false: COLORS.border, true: COLORS.crimson }}
              thumbColor={COLORS.white}
            />
          </SettingRow>

          {notificationSettings.enabled && (
            <>
              <SectionLabel>RISE TIME</SectionLabel>
              {Platform.OS === 'android' && (
                <TimeButton onPress={() => setShowWakePicker(true)}>
                  <TimeButtonText>{formatTime(wakeH ?? 7, wakeM ?? 0)}</TimeButtonText>
                  <TimeButtonHint>TAP TO CHANGE</TimeButtonHint>
                </TimeButton>
              )}
              {showWakePicker && (
                <PickerWrapper>
                  <DateTimePicker value={wakeDate} mode="time" display="spinner" onChange={handleWakeChange} minuteInterval={1} themeVariant="dark" textColor={COLORS.white} style={{ height: 180, width: '100%' }} />
                </PickerWrapper>
              )}

              <SectionLabel>FIRST CALL</SectionLabel>
              <HintText>{notificationSettings.firstReminderOffset} min after wake</HintText>
              <OptionRow>
                {[15, 30, 60, 90].map((val) => (
                  <OptionBtn key={val} active={notificationSettings.firstReminderOffset === val} onPress={() => updateNotificationSettings({ firstReminderOffset: val })}>
                    <OptionBtnText active={notificationSettings.firstReminderOffset === val}>{val}m</OptionBtnText>
                  </OptionBtn>
                ))}
              </OptionRow>

              <SectionLabel>PERSISTENCE</SectionLabel>
              <OptionRow>
                {[0, 60, 120, 180].map((val) => (
                  <OptionBtn key={val} active={notificationSettings.nudgeInterval === val} onPress={() => updateNotificationSettings({ nudgeInterval: val })}>
                    <OptionBtnText active={notificationSettings.nudgeInterval === val}>{val === 0 ? 'Off' : `${val / 60}h`}</OptionBtnText>
                  </OptionBtn>
                ))}
              </OptionRow>

              <SectionLabel>SILENCE AFTER</SectionLabel>
              {Platform.OS === 'android' && (
                <TimeButton onPress={() => setShowQuietPicker(true)}>
                  <TimeButtonText>{formatTime(notificationSettings.quietHourStart, 0)}</TimeButtonText>
                  <TimeButtonHint>TAP TO CHANGE</TimeButtonHint>
                </TimeButton>
              )}
              {showQuietPicker && (
                <PickerWrapper>
                  <DateTimePicker value={quietDate} mode="time" display="spinner" onChange={handleQuietChange} minuteInterval={30} themeVariant="dark" textColor={COLORS.white} style={{ height: 180, width: '100%' }} />
                </PickerWrapper>
              )}

              <PrimaryButton onPress={handleReschedule} label="RESET THE BELL" style={{ marginTop: 12 }} />
              <ScheduledInfo>{scheduledCount} notifications scheduled</ScheduledInfo>
            </>
          )}

          {/* Alarm Sound */}
          <SectionLabel>THE BELL'S VOICE</SectionLabel>
          <HintText>{notificationSettings.alarmSoundName ?? 'Default (built-in)'}</HintText>
          <OptionRow>
            <OptionBtn active={!notificationSettings.alarmSoundUri} onPress={() => updateNotificationSettings({ alarmSoundUri: null, alarmSoundName: null })}>
              <OptionBtnText active={!notificationSettings.alarmSoundUri}>Default</OptionBtnText>
            </OptionBtn>
            <OptionBtn active={!!notificationSettings.alarmSoundUri} onPress={async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
                if (!result.canceled && result.assets?.[0]) {
                  updateNotificationSettings({ alarmSoundUri: result.assets[0].uri, alarmSoundName: result.assets[0].name });
                }
              } catch {}
            }}>
              <OptionBtnText active={!!notificationSettings.alarmSoundUri}>Pick song</OptionBtnText>
            </OptionBtn>
          </OptionRow>

          <HintText>Or paste a YouTube URL to download as alarm sound:</HintText>
          <YtInputRow>
            <YtInput value={ytUrl} onChangeText={setYtUrl} placeholder="YouTube URL..." placeholderTextColor={COLORS.textDim} editable={!ytDownloading} />
            <YtDownloadBtn onPress={handleYtDownload}><YtDownloadBtnText>↓</YtDownloadBtnText></YtDownloadBtn>
          </YtInputRow>
          {ytProgress ? <HintText>{ytProgress}</HintText> : null}

          {downloads.length > 0 && downloads.map((d) => (
            <DownloadRow key={d.uri}>
              <DownloadName numberOfLines={1}>{d.name}</DownloadName>
              <DeleteBtn onPress={() => { deleteDownloadedSound(d.uri); setDownloads(listDownloadedSounds()); }}>
                <DeleteBtnText>✕</DeleteBtnText>
              </DeleteBtn>
            </DownloadRow>
          ))}

          {/* Data */}
          <SectionLabel>YOUR RECORD</SectionLabel>
          <StorageText>{storageInfo}</StorageText>
          <GhostButton onPress={handleExport} label="CARRY YOUR RECORD" style={{ marginTop: 12 }} />
          <GhostButton onPress={handleImport} label="RECEIVE A RECORD" style={{ marginTop: 12 }} />
          <GhostButton onPress={handleClearOldTodos} label="RELEASE OLD BURDENS" style={{ marginTop: 12 }} />
          <DangerButton onPress={handleResetAll} label="BURN EVERYTHING" style={{ marginTop: 12 }} />

          {/* Logout */}
          {isLoggedIn && (
            <>
              <SectionLabel>DEPARTURE</SectionLabel>
              <DangerButton onPress={handleLogout} label="LEAVE THE SANCTUM" style={{ marginTop: 4 }} />
            </>
          )}

          {/* About */}
          <AboutText>The Reflector v1.0.0{'\n'}Built with intention.</AboutText>
        </ContentPad>
      </ScrollView>
    </Screen>
  );
}
