import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import MeasurementIcon from '../components/MeasurementIcon';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { measurementMeta, formatMeasurementValue, formatTime, formatDateGroup } from '../data/measurements';
import type { Measurement, Tone } from '../data/measurements';
import { useMeasurements } from '../context/MeasurementsContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

type Section = { date: string; entries: Measurement[] };

function groupByDate(measurements: Measurement[], t: (key: TranslationKey) => string): Section[] {
  const sorted = [...measurements].sort((a, b) => b.createdAt - a.createdAt);
  const sections: Section[] = [];
  for (const entry of sorted) {
    const date = formatDateGroup(entry.createdAt, t);
    const section = sections.find((s) => s.date === date);
    if (section) section.entries.push(entry);
    else sections.push({ date, entries: [entry] });
  }
  return sections;
}

export default function HistoryScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { measurements } = useMeasurements();
  const { t } = useLocale();
  const sections = useMemo(() => groupByDate(measurements, t), [measurements, t]);

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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('quickLink.history')}</Text>
      </View>

      <MedicalDisclaimer />

      {sections.length === 0 ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('history.empty')}</Text>
      ) : null}

      {sections.map((section) => (
        <View key={section.date} style={{ gap: spacing.sm }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{section.date}</Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {section.entries.map((entry, index) => {
              const meta = measurementMeta[entry.type];
              const tone = toneColors[meta.tone];
              return (
                <View
                  key={entry.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: radii.round,
                      backgroundColor: tone.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MeasurementIcon type={entry.type} size={sizes.iconInline} color={tone.fg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.body, color: colors.textPrimary }}>
                      {t(`measurement.${entry.type}` as TranslationKey)}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>{formatTime(entry.createdAt)}</Text>
                  </View>
                  <Text style={{ ...typography.h3, color: colors.textPrimary }}>{formatMeasurementValue(entry)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
