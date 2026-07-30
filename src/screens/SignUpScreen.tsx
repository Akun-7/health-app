import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePickLicenseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('signup.licenseImagePermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.5,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    setLicenseImage(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
  }

  async function handleSignUp() {
    if (!email || !password) {
      setError(t('common.fillAllFields'));
      return;
    }
    if (isDoctor && !licenseImage) {
      setError(t('signup.licenseImageRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup(email.trim(), password, isDoctor ? 'doctor' : 'patient', licenseImage ?? undefined);
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
                  gap: spacing.sm,
                }}
              >
                <Text style={{ ...typography.small, color: colors.textSecondary }}>{t('signup.doctorDisclaimer')}</Text>
                <Pressable
                  onPress={handlePickLicenseImage}
                  style={{
                    height: 44,
                    borderRadius: radii.button,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                    {licenseImage ? t('signup.licenseImageChange') : t('signup.licenseImagePick')}
                  </Text>
                </Pressable>
                {licenseImage ? (
                  <Image
                    source={{ uri: licenseImage }}
                    style={{ width: '100%', height: 160, borderRadius: radii.card }}
                    resizeMode="contain"
                  />
                ) : null}
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
