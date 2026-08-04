import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import type { Gender } from '../data/profile';
import { useProfile } from '../context/ProfileContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const genderOptions: Gender[] = ['female', 'male'];

export default function ProfileSetupScreen({ navigation, route }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { profile, saveProfile } = useProfile();
  const { t } = useLocale();
  const isEdit = route.params?.mode === 'edit';

  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [age, setAge] = useState(profile ? String(profile.age) : '');
  const [height, setHeight] = useState(profile ? String(profile.height) : '');
  const [weight, setWeight] = useState(profile ? String(profile.weight) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!gender || !age || !height || !weight) {
      setError(t('common.fillAllFields'));
      return;
    }
    setError('');
    setLoading(true);
    await saveProfile({ gender, age: Number(age), height: Number(height), weight: Number(weight) });
    setLoading(false);
    if (isEdit) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
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
            {isEdit ? (
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
                <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('profileSetup.titleEdit')}</Text>
              </View>
            ) : (
              <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('profileSetup.titleCreate')}</Text>
            )}
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('profileSetup.subtitle')}</Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('profileSetup.genderLabel')}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {genderOptions.map((key) => {
                  const selected = gender === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setGender(key)}
                      style={{
                        flex: 1,
                        height: sizes.buttonHeight,
                        borderRadius: radii.button,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? colors.primaryLight : 'transparent',
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.body,
                          color: selected ? colors.primary : colors.textPrimary,
                        }}
                      >
                        {t(`gender.${key}` as TranslationKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TextField
              label={t('profileSetup.ageLabel')}
              placeholder={t('profileSetup.agePlaceholder')}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
            <TextField
              label={t('profileSetup.heightLabel')}
              placeholder={t('profileSetup.heightPlaceholder')}
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
            />
            <TextField
              label={t('profileSetup.weightLabel')}
              placeholder={t('profileSetup.weightPlaceholder')}
              value={weight}
              onChangeText={setWeight}
              keyboardType="number-pad"
            />
            {error ? (
              <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text>
            ) : null}
          </View>

          <Button title={isEdit ? t('common.save') : t('profileSetup.submitCreate')} onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
