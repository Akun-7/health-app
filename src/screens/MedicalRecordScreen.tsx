import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconMenu2 } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { measurementMeta, formatMeasurementValue, formatTime } from '../data/measurements';
import type { MeasurementType } from '../data/measurements';
import { useProfile } from '../context/ProfileContext';
import { useMeasurements } from '../context/MeasurementsContext';
import { useMedications } from '../context/MedicationsContext';
import { useLabResults } from '../context/LabResultsContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { MainScreenProps } from '../navigation/RootNavigator';

type Props = MainScreenProps<'MedicalRecord'>;

const vitalTypes: MeasurementType[] = ['bloodPressure', 'pulse', 'spo2'];

export default function MedicalRecordScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { profile } = useProfile();
  const { measurements } = useMeasurements();
  const { medications } = useMedications();
  const { labResults } = useLabResults();
  const { t } = useLocale();

  function latestFor(type: MeasurementType) {
    return measurements.find((m) => m.type === type);
  }

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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('medicalRecord.title')}</Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('medicalRecord.profileSection')}</Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
          }}
        >
          {profile ? (
            <>
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                {t('settings.profileSummary', { gender: t(`gender.${profile.gender}` as TranslationKey), age: profile.age })}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                {t('settings.profileMetrics', { height: profile.height, weight: profile.weight })}
              </Text>
            </>
          ) : (
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('medicalRecord.emptySection')}</Text>
          )}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('medicalRecord.vitalsSection')}</Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
          }}
        >
          {vitalTypes.map((type, index) => {
            const latest = latestFor(type);
            return (
              <View
                key={type}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing.sm,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  {t(`measurement.${type}` as TranslationKey)}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ ...typography.body, color: colors[measurementMeta[type].tone] }}>
                    {latest ? formatMeasurementValue(latest) : '—'}
                  </Text>
                  {latest ? (
                    <Text style={{ ...typography.small, color: colors.textMuted }}>{formatTime(latest.createdAt)}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('medicalRecord.medicationsSection')}</Text>
        {medications.length === 0 ? (
          <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('medicalRecord.emptySection')}</Text>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
            }}
          >
            {medications.map((medication, index) => (
              <View
                key={medication.id}
                style={{
                  paddingVertical: spacing.sm,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{medication.name}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{medication.dosage}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('medicalRecord.labResultsSection')}</Text>
        {labResults.length === 0 ? (
          <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('medicalRecord.emptySection')}</Text>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
            }}
          >
            {labResults.map((result, index) => (
              <View
                key={result.id}
                style={{
                  paddingVertical: spacing.sm,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{result.name}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{result.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <MedicalDisclaimer />
    </ScrollView>
  );
}
