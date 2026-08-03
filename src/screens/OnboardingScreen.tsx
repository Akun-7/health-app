import { useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { IconHeartbeat, IconClipboardPlus, IconBellRinging, IconAlertTriangle } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import Button from '../components/Button';
import { useLocale } from '../context/LocaleContext';
import { useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { resolveHomeRoute } from '../navigation/resolveHomeRoute';
import type { TranslationKey } from '../i18n/ky';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const steps: { icon: typeof IconHeartbeat; titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { icon: IconHeartbeat, titleKey: 'onboarding.step1.title', descriptionKey: 'onboarding.step1.description' },
  { icon: IconClipboardPlus, titleKey: 'onboarding.step2.title', descriptionKey: 'onboarding.step2.description' },
  { icon: IconBellRinging, titleKey: 'onboarding.step3.title', descriptionKey: 'onboarding.step3.description' },
  { icon: IconAlertTriangle, titleKey: 'onboarding.step4.title', descriptionKey: 'onboarding.step4.description' },
];

export default function OnboardingScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();
  const { markSeen } = useOnboarding();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [index, setIndex] = useState(0);

  const isLast = index === steps.length - 1;
  const step = steps[index];
  const Icon = step.icon;

  async function finish() {
    await markSeen();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: resolveHomeRoute(user, profile) }] });
    }
  }

  function handleNext() {
    if (isLast) {
      finish();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.pageBackground }}>
      <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: radii.round,
              backgroundColor: colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={56} color={colors.primary} />
          </View>
          <View style={{ gap: spacing.sm, alignItems: 'center' }}>
            <Text style={{ ...typography.h1, color: colors.textPrimary, textAlign: 'center' }}>
              {t(step.titleKey)}
            </Text>
            <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
              {t(step.descriptionKey)}
            </Text>
          </View>
        </View>

        <View style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs }}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === index ? 20 : sizes.iconInline / 2,
                  height: sizes.iconInline / 2,
                  borderRadius: radii.round,
                  backgroundColor: i === index ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {isLast ? null : (
              <View style={{ flex: 1 }}>
                <Button title={t('onboarding.skip')} variant="secondary" onPress={finish} testID="onboarding-skip" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Button
                title={isLast ? t('onboarding.start') : t('onboarding.next')}
                onPress={handleNext}
                testID="onboarding-next"
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
