import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft, IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import MeasurementIcon from '../components/MeasurementIcon';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { formatMeasurementValue } from '../data/measurements';
import type { Tone } from '../data/measurements';
import { computeInsights, insightTone } from '../data/insights';
import type { InsightTrend } from '../data/insights';
import { useMeasurements } from '../context/MeasurementsContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Insights'>;

const trendIcon: Record<InsightTrend, typeof IconTrendingUp> = {
  up: IconTrendingUp,
  down: IconTrendingDown,
  stable: IconMinus,
};

export default function InsightsScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { measurements } = useMeasurements();
  const { t } = useLocale();
  const insights = useMemo(() => computeInsights(measurements), [measurements]);

  const toneColors: Record<Tone, { fg: string; bg: string }> = {
    danger: { fg: colors.danger, bg: colors.dangerBg },
    warning: { fg: colors.warning, bg: colors.warningBg },
    success: { fg: colors.success, bg: colors.successBg },
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('quickLink.insights')}</Text>
      </View>

      <MedicalDisclaimer />

      {insights.length === 0 ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('insights.empty')}</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {insights.map((insight) => {
            const tone = toneColors[insightTone[insight.status]];
            const TrendIcon = insight.trend ? trendIcon[insight.trend] : null;
            return (
              <View
                key={insight.type}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
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
                    backgroundColor: tone.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MeasurementIcon type={insight.type} size={sizes.iconInline} color={tone.fg} />
                </View>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {t(`measurement.${insight.type}` as TranslationKey)} · {formatMeasurementValue(insight.latest)}
                  </Text>
                  <Text style={{ ...typography.caption, color: tone.fg }}>
                    {t(`insights.status.${insight.status}` as TranslationKey)}
                  </Text>
                </View>
                {TrendIcon && insight.trend ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <TrendIcon size={sizes.iconInline} color={colors.textMuted} />
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                      {t(`insights.trend.${insight.trend}` as TranslationKey)}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
