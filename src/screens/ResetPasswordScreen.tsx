import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { resetPassword, ApiError } from '../api/client';
import { apiErrorKey } from '../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useLocale();
  const { applySession } = useAuth();
  const { profile } = useProfile();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email || !code || !newPassword || !confirmPassword) {
      setError(t('common.fillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.errorMismatch'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { token, user } = await resetPassword(email.trim(), code.trim(), newPassword);
      await applySession(token, user);
      navigation.reset({ index: 0, routes: [{ name: profile ? 'Dashboard' : 'ProfileSetup' }] });
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
            <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('resetPassword.title')}</Text>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('resetPassword.subtitle')}</Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <TextField
              label={t('resetPassword.emailLabel')}
              placeholder={t('common.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextField
              label={t('resetPassword.codeLabel')}
              placeholder={t('resetPassword.codePlaceholder')}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />
            <TextField
              label={t('resetPassword.newPasswordLabel')}
              placeholder={t('common.passwordPlaceholder')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextField
              label={t('resetPassword.confirmPasswordLabel')}
              placeholder={t('common.passwordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            {error ? <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text> : null}
          </View>

          <View style={{ gap: spacing.md }}>
            <Button title={t('resetPassword.submit')} onPress={handleSubmit} loading={loading} />
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
