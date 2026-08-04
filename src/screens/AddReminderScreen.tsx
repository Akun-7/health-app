import { useEffect, useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import ReminderIcon from '../components/ReminderIcon';
import { isValidTime } from '../data/reminders';
import type { ReminderCategory } from '../data/reminders';
import { useReminders } from '../context/RemindersContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import { getReminderPermissionStatus } from '../notifications/reminderNotifications';
import type { ReminderPermissionStatus } from '../notifications/reminderNotifications';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddReminder'>;

const categories: ReminderCategory[] = ['medicine', 'measurement', 'water', 'exercise'];

export default function AddReminderScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { addReminder } = useReminders();
  const { t } = useLocale();
  const [category, setCategory] = useState<ReminderCategory>('medicine');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<ReminderPermissionStatus | null>(null);

  useEffect(() => {
    getReminderPermissionStatus().then(setPermissionStatus);
  }, []);

  async function handleSave() {
    if (!title.trim()) {
      setError(t('reminder.errorTitleRequired'));
      return;
    }
    if (!isValidTime(time)) {
      setError(t('reminder.errorTimeInvalid'));
      return;
    }
    setError('');
    setLoading(true);
    await addReminder({ category, title: title.trim(), time: time.trim() });
    setLoading(false);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.pageBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, gap: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityLabel={t('common.back')}
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
            <IconArrowLeft size={sizes.iconDecorative} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('reminder.addTitle')}</Text>
        </View>

        {permissionStatus === 'unsupported' || permissionStatus === 'denied' ? (
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              backgroundColor: colors.warningBg,
              borderRadius: radii.card,
              padding: spacing.md,
            }}
          >
            <IconInfoCircle size={sizes.iconInline} color={colors.warning} />
            <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1 }}>
              {permissionStatus === 'unsupported'
                ? t('reminder.permissionUnsupportedAdd')
                : t('reminder.permissionDeniedAdd')}
            </Text>
          </View>
        ) : null}

        <View style={{ gap: spacing.xl }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('reminder.categoryLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {categories.map((key) => {
                const selected = category === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setCategory(key)}
                    style={{
                      flexBasis: '48%',
                      flexGrow: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.xs,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.md,
                      borderRadius: radii.card,
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.border,
                    }}
                  >
                    <ReminderIcon
                      category={key}
                      size={sizes.iconInline}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                    <Text style={{ ...typography.caption, color: selected ? colors.primary : colors.textPrimary }}>
                      {t(`reminder.${key}` as TranslationKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            <TextField
              label={t('reminder.titleLabel')}
              placeholder={t('reminder.titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
            />
            <TextField
              label={t('reminder.timeLabel')}
              placeholder={t('reminder.timePlaceholder')}
              value={time}
              onChangeText={setTime}
              keyboardType="numbers-and-punctuation"
            />
            {error ? <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text> : null}
          </View>
        </View>

        <View style={{ flex: 1 }} />
        <Button title={t('common.save')} onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
