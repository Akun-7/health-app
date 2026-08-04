import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconMenu2, IconPlus, IconInfoCircle } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import ReminderIcon from '../components/ReminderIcon';
import ReminderListItem from '../components/ReminderListItem';
import { useReminders } from '../context/RemindersContext';
import { useReminderLog } from '../context/ReminderLogContext';
import { weeklyStats } from '../data/reminderLog';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import { getReminderPermissionStatus, requestReminderPermissions } from '../notifications/reminderNotifications';
import type { ReminderPermissionStatus } from '../notifications/reminderNotifications';
import type { MainScreenProps } from '../navigation/RootNavigator';

type Props = MainScreenProps<'Reminders'>;

export default function RemindersScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { reminders, toggleReminder, deleteReminder } = useReminders();
  const { log, logEntry } = useReminderLog();
  const { t } = useLocale();
  const [permissionStatus, setPermissionStatus] = useState<ReminderPermissionStatus | null>(null);

  useEffect(() => {
    getReminderPermissionStatus().then(setPermissionStatus);
  }, []);

  async function handleRequestPermission() {
    await requestReminderPermissions(t('reminder.channelName'));
    setPermissionStatus(await getReminderPermissionStatus());
  }

  const sorted = useMemo(() => [...reminders].sort((a, b) => a.time.localeCompare(b.time)), [reminders]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable
            onPress={() => navigation.toggleDrawer()}
            hitSlop={8}
            accessibilityLabel={t('nav.appName')}
            accessibilityRole="button"
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
            <IconMenu2 size={sizes.iconDecorative} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('quickLink.reminders')}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AddReminder')}
          hitSlop={8}
          accessibilityLabel={t('reminder.addTitle')}
          accessibilityRole="button"
          style={{
            width: sizes.tapTargetMin,
            height: sizes.tapTargetMin,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.round,
            backgroundColor: colors.primary,
          }}
        >
          <IconPlus size={sizes.iconDecorative} color={colors.onPrimary} />
        </Pressable>
      </View>

      {permissionStatus === 'unsupported' || permissionStatus === 'denied' || permissionStatus === 'undetermined' ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.warningBg,
            borderRadius: radii.card,
            padding: spacing.md,
          }}
        >
          <IconInfoCircle size={sizes.iconInline} color={colors.warning} />
          <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1 }}>
            {permissionStatus === 'unsupported'
              ? t('reminder.permissionUnsupportedList')
              : t('reminder.permissionDeniedList')}
          </Text>
          {permissionStatus !== 'unsupported' ? (
            <Pressable onPress={handleRequestPermission}>
              <Text style={{ ...typography.caption, color: colors.primary }}>{t('reminder.grantPermission')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {sorted.length === 0 ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('reminder.empty')}</Text>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
          }}
        >
          {sorted.map((reminder, index) => (
            <ReminderListItem
              key={reminder.id}
              icon={<ReminderIcon category={reminder.category} size={sizes.iconDecorative} color={colors.primary} />}
              title={reminder.title || t(`reminder.${reminder.category}` as TranslationKey)}
              time={reminder.time}
              enabled={reminder.enabled}
              onToggle={(value) => toggleReminder(reminder.id, value)}
              onDelete={() => deleteReminder(reminder.id)}
              showDivider={index < sorted.length - 1}
              weeklyStats={weeklyStats(log, reminder.id)}
              onLogTaken={() => logEntry(reminder.id, 'taken')}
              onLogSkipped={() => logEntry(reminder.id, 'skipped')}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
