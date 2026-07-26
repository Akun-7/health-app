import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { IconSquare, IconSquareCheck } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { apiErrorKey } from '../api/errors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useLocale();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDoctor, setIsDoctor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp() {
    if (!email || !password) {
      setError(t('common.fillAllFields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup(email.trim(), password, isDoctor ? 'doctor' : 'patient');
      navigation.reset({ index: 0, routes: [{ name: isDoctor ? 'DoctorInbox' : 'ProfileSetup' }] });
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
            <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('signup.title')}</Text>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('signup.subtitle')}</Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <TextField
              label={t('common.email')}
              placeholder={t('common.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextField
              label={t('common.password')}
              placeholder={t('common.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {error ? (
              <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text>
            ) : null}
          </View>

          <View style={{ gap: spacing.xs }}>
            <Pressable
              onPress={() => setIsDoctor((prev) => !prev)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              {isDoctor ? (
                <IconSquareCheck size={20} color={colors.primary} />
              ) : (
                <IconSquare size={20} color={colors.textMuted} />
              )}
              <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1 }}>{t('signup.doctorToggle')}</Text>
            </Pressable>
            {isDoctor ? (
              <View
                style={{
                  backgroundColor: colors.warningBg,
                  borderRadius: radii.card,
                  padding: spacing.sm,
                }}
              >
                <Text style={{ ...typography.small, color: colors.textSecondary }}>{t('signup.doctorDisclaimer')}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ gap: spacing.md }}>
            <Button title={t('signup.submit')} onPress={handleSignUp} loading={loading} />
            <Button title={t('signup.haveAccount')} variant="secondary" onPress={() => navigation.navigate('Login')} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
