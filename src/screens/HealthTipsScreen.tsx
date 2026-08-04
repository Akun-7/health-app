import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconMenu2, IconBulb } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { MainScreenProps } from '../navigation/RootNavigator';

type Props = MainScreenProps<'HealthTips'>;

const TIP_NUMBERS = [1, 2, 3, 4, 5] as const;

export default function HealthTipsScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('healthTips.title')}</Text>
      </View>

      <View style={{ gap: spacing.md }}>
        {TIP_NUMBERS.map((n) => (
          <View
            key={n}
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
            }}
          >
            <View
              style={{
                width: sizes.tapTargetMin,
                height: sizes.tapTargetMin,
                borderRadius: radii.round,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconBulb size={sizes.iconInline} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={{ ...typography.h3, color: colors.textPrimary }}>
                {t(`healthTips.tip${n}Title` as TranslationKey)}
              </Text>
              <Text style={{ ...typography.body, color: colors.textSecondary }}>
                {t(`healthTips.tip${n}Body` as TranslationKey)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
