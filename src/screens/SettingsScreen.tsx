import { View, Text, ScrollView, Pressable } from 'react-native';
import {
  IconArrowLeft,
  IconLogout,
  IconUser,
  IconPencil,
  IconAlertTriangle,
  IconMoon,
} from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import ThemeModeSelector from '../components/ThemeModeSelector';
import LanguageSelector from '../components/LanguageSelector';
import SettingsLinkRow from '../components/SettingsLinkRow';
import ClearDataSection from '../components/ClearDataSection';
import { useSettings } from '../context/SettingsContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { useMeasurements } from '../context/MeasurementsContext';
import { useReminders } from '../context/RemindersContext';
import { useReminderLog } from '../context/ReminderLogContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { settings, setThemeMode } = useSettings();
  const { locale, setLocale, t } = useLocale();
  const { profile } = useProfile();
  const { logout } = useAuth();
  const { clearAll: clearMeasurements } = useMeasurements();
  const { clearAll: clearReminders } = useReminders();
  const { clearAll: clearReminderLog } = useReminderLog();

  async function handleClearData() {
    await Promise.all([clearMeasurements(), clearReminders(), clearReminderLog()]);
  }

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{
            width: sizes.tapTargetMin,
            height: sizes.tapTargetMin,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.round,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <IconArrowLeft size={sizes.iconDecorative} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('quickLink.settings')}</Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('settings.profileSection')}</Text>
        <Pressable
          onPress={() => navigation.navigate('ProfileSetup', { mode: 'edit' })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
          }}
        >
          <View
            style={{
              width: sizes.tapTargetMin,
              height: sizes.tapTargetMin,
              borderRadius: radii.round,
              backgroundColor: colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconUser size={sizes.iconDecorative} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            {profile ? (
              <>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  {t('settings.profileSummary', { gender: t(`gender.${profile.gender}` as TranslationKey), age: profile.age })}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  {t('settings.profileMetrics', { height: profile.height, weight: profile.weight })}
                </Text>
              </>
            ) : (
              <Text style={{ ...typography.body, color: colors.textPrimary }}>{t('settings.profileEmpty')}</Text>
            )}
          </View>
          <IconPencil size={sizes.iconInline} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('sos.title')}</Text>
        <SettingsLinkRow
          icon={<IconAlertTriangle size={sizes.iconDecorative} color={colors.primary} />}
          title={t('emergencyContacts.title')}
          onPress={() => navigation.navigate('EmergencyContacts')}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <SettingsLinkRow
          icon={<IconMoon size={sizes.iconDecorative} color={colors.primary} />}
          title={t('sleep.title')}
          onPress={() => navigation.navigate('Sleep')}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('settings.themeSection')}</Text>
        <ThemeModeSelector value={settings.themeMode} onChange={setThemeMode} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('settings.languageSection')}</Text>
        <LanguageSelector value={locale} onChange={setLocale} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('settings.dataSection')}</Text>
        <ClearDataSection onClear={handleClearData} />
      </View>

      <Pressable
        onPress={handleLogout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surface,
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
        }}
      >
        <IconLogout size={sizes.iconInline} color={colors.textPrimary} />
        <Text style={{ ...typography.body, color: colors.textPrimary }}>{t('settings.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}
