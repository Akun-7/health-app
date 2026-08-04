import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { IconMenu2, IconCircleCheck } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { sendMyMessage } from '../api/client';
import GuestAccountRequired from '../components/GuestAccountRequired';
import type { MainScreenProps } from '../navigation/RootNavigator';

type Props = MainScreenProps<'Appointment'>;

export default function AppointmentScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { token, guestMode } = useAuth();
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [when, setWhen] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !reason.trim() || !when.trim()) {
      setError(t('appointment.errorRequired'));
      return;
    }
    if (!token) return;
    setError('');
    setLoading(true);
    const text = t('appointment.messageTemplate', { name: name.trim(), reason: reason.trim(), when: when.trim() });
    await sendMyMessage(token, text);
    setLoading(false);
    setSuccess(true);
    setName('');
    setReason('');
    setWhen('');
  }

  if (guestMode) {
    return <GuestAccountRequired onCreateAccount={() => navigation.navigate('SignUp')} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.pageBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, gap: spacing.xl }}>
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
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('appointment.title')}</Text>
        </View>

        {success ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.successBg,
              borderRadius: radii.card,
              padding: spacing.md,
            }}
          >
            <IconCircleCheck size={sizes.iconInline} color={colors.success} />
            <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1 }}>{t('appointment.success')}</Text>
          </View>
        ) : null}

        <View style={{ gap: spacing.md }}>
          <TextField
            label={t('appointment.nameLabel')}
            placeholder={t('appointment.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          <TextField
            label={t('appointment.reasonLabel')}
            placeholder={t('appointment.reasonPlaceholder')}
            value={reason}
            onChangeText={setReason}
          />
          <TextField
            label={t('appointment.whenLabel')}
            placeholder={t('appointment.whenPlaceholder')}
            value={when}
            onChangeText={setWhen}
          />
          {error ? <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text> : null}
        </View>

        <View style={{ flex: 1 }} />
        <Button title={t('appointment.submit')} onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
