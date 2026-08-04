import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconHistory, IconChartLine, IconBell, IconSettings, IconAlertTriangle, IconStethoscope, IconWalk } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import VitalCard from '../components/VitalCard';
import Button from '../components/Button';
import MeasurementIcon from '../components/MeasurementIcon';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import CircularGauge from '../components/CircularGauge';
import StreakRow from '../components/StreakRow';
import { measurementMeta, formatMeasurementValue, formatTime } from '../data/measurements';
import type { Measurement, MeasurementType } from '../data/measurements';
import { classify, insightTone } from '../data/insights';
import { computeStreakDays } from '../data/streak';
import { useMeasurements } from '../context/MeasurementsContext';
import { useSteps } from '../context/StepsContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const secondaryVitalTypes: MeasurementType[] = ['bloodPressure', 'spo2'];
const PULSE_GAUGE_MIN = 40;
const PULSE_GAUGE_MAX = 160;

export default function DashboardScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { measurements } = useMeasurements();
  const { available: stepsAvailable, steps } = useSteps();
  const { t } = useLocale();

  function latestFor(type: MeasurementType) {
    return measurements.find((m) => m.type === type);
  }

  const latestPulse = measurements.find((m): m is Extract<Measurement, { type: 'pulse' }> => m.type === 'pulse');
  const pulseStatus = latestPulse ? classify(latestPulse) : null;
  const pulseTone = pulseStatus ? insightTone[pulseStatus] : 'success';
  const streakDays = useMemo(() => computeStreakDays(measurements), [measurements]);

  const quickLinks: {
    key: 'History' | 'Insights' | 'Reminders' | 'Chat';
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: 'History', label: t('quickLink.history'), icon: <IconHistory size={sizes.iconDecorative} color={colors.textPrimary} /> },
    { key: 'Insights', label: t('quickLink.insights'), icon: <IconChartLine size={sizes.iconDecorative} color={colors.textPrimary} /> },
    { key: 'Reminders', label: t('quickLink.reminders'), icon: <IconBell size={sizes.iconDecorative} color={colors.textPrimary} /> },
    { key: 'Chat', label: t('quickLink.telemedicine'), icon: <IconStethoscope size={sizes.iconDecorative} color={colors.textPrimary} /> },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.dashboardBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('dashboard.greeting')}</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('dashboard.subtitle')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={() => navigation.navigate('SOS')}
            hitSlop={8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              height: sizes.tapTargetMin,
              paddingHorizontal: spacing.md,
              borderRadius: radii.round,
              backgroundColor: colors.dangerBg,
            }}
          >
            <IconAlertTriangle size={sizes.iconInline} color={colors.danger} />
            <Text style={{ ...typography.caption, color: colors.danger }}>{t('quickLink.sos')}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={8}
            style={{
              width: sizes.tapTargetMin,
              height: sizes.tapTargetMin,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.round,
              backgroundColor: colors.cardElevated,
              borderWidth: 1,
              borderColor: colors.gaugeTrack,
            }}
          >
            <IconSettings size={sizes.iconDecorative} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={{ backgroundColor: colors.cardElevated, borderRadius: radii.modal, padding: spacing.md, gap: spacing.md }}>
        <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('dashboard.streak')}</Text>
        <StreakRow days={streakDays} />
      </View>

      <View style={{ backgroundColor: colors.cardElevated, borderRadius: radii.modal, padding: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <MeasurementIcon type="pulse" size={sizes.iconInline} color={colors.primary} />
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('measurement.pulse')}</Text>
          </View>
          {latestPulse ? (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>{formatTime(latestPulse.createdAt)}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          {latestPulse ? (
            <CircularGauge
              value={latestPulse.bpm}
              min={PULSE_GAUGE_MIN}
              max={PULSE_GAUGE_MAX}
              unitLabel="BPM"
              tone={pulseTone}
              size={120}
            />
          ) : (
            <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ ...typography.h1, color: colors.textMuted }}>—</Text>
            </View>
          )}
          {pulseStatus ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
              <View style={{ width: 8, height: 8, borderRadius: radii.round, backgroundColor: colors[pulseTone] }} />
              <Text style={{ ...typography.body, color: colors[pulseTone] }}>
                {t(`insights.status.${pulseStatus}` as TranslationKey)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {secondaryVitalTypes.map((type) => {
          const meta = measurementMeta[type];
          const latest = latestFor(type);
          const toneColor = colors[meta.tone];
          return (
            <VitalCard
              key={type}
              icon={<MeasurementIcon type={type} size={sizes.iconInline} color={toneColor} />}
              label={t(`measurement.${type}` as TranslationKey)}
              value={latest ? formatMeasurementValue(latest) : '—'}
              tone={meta.tone}
            />
          );
        })}
        {stepsAvailable ? (
          <VitalCard
            icon={<IconWalk size={sizes.iconInline} color={colors.primary} />}
            label={t('steps.title')}
            value={String(steps)}
            tone="success"
          />
        ) : null}
      </View>

      <Button
        title={t('measurement.add')}
        onPress={() => navigation.navigate('AddMeasurement')}
      />

      <MedicalDisclaimer />

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.cardElevated,
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: colors.gaugeTrack,
        }}
      >
        {quickLinks.map((link, index) => (
          <Pressable
            key={link.key}
            onPress={() => navigation.navigate(link.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: spacing.xs,
              paddingVertical: spacing.md,
              borderLeftWidth: index === 0 ? 0 : 1,
              borderLeftColor: colors.gaugeTrack,
            }}
          >
            {link.icon}
            <Text style={{ ...typography.caption, color: colors.textPrimary }}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
