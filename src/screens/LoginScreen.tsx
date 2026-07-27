import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { ApiError } from '../api/client';
import { apiErrorKey } from '../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useLocale();
  const { login } = useAuth();
  const { profile } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      setError(t('login.errorRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
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
            <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('login.title')}</Text>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('login.subtitle')}</Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <TextField
              label={t('common.email')}
              placeholder={t('common.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              testID="login-email"
            />
            <TextField
              label={t('common.password')}
              placeholder={t('common.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              testID="login-password"
            />
            {error ? (
              <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text>
            ) : null}
            <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
              <Text style={{ ...typography.small, color: colors.primary, textAlign: 'right' }}>
                {t('login.forgotPassword')}
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: spacing.md }}>
            <Button title={t('login.submit')} onPress={handleLogin} loading={loading} testID="login-submit" />
            <Button
              title={t('login.createAccount')}
              variant="secondary"
              onPress={() => navigation.navigate('SignUp')}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
