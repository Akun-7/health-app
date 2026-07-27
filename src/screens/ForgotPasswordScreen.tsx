import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useLocale } from '../context/LocaleContext';
import { forgotPassword, ApiError } from '../api/client';
import { apiErrorKey } from '../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email) {
      setError(t('common.fillAllFields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? t(apiErrorKey[err.code]) : t('auth.networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.pageBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }}>
        <View style={{ gap: spacing.xl }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('forgotPassword.title')}</Text>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('forgotPassword.subtitle')}</Text>
          </View>

          {sent ? (
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: radii.card, padding: spacing.md }}>
              <Text style={{ ...typography.body, color: colors.textPrimary }}>{t('forgotPassword.sent')}</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <TextField
                label={t('common.email')}
                placeholder={t('common.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {error ? <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text> : null}
            </View>
          )}

          <View style={{ gap: spacing.md }}>
            {sent ? (
              <Button
                title={t('forgotPassword.enterCode')}
                onPress={() => navigation.navigate('ResetPassword', { email: email.trim() })}
              />
            ) : (
              <Button title={t('forgotPassword.submit')} onPress={handleSubmit} loading={loading} />
            )}
            <Button
              title={t('forgotPassword.backToLogin')}
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
