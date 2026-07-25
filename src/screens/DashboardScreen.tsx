import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconHistory, IconChartLine, IconBell, IconSettings, IconAlertTriangle } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import VitalCard from '../components/VitalCard';
import Button from '../components/Button';
import MeasurementIcon from '../components/MeasurementIcon';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { measurementMeta, formatMeasurementValue } from '../data/measurements';
import type { MeasurementType } from '../data/measurements';
import { useMeasurements } from '../context/MeasurementsContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const vitalTypes: MeasurementType[] = ['bloodPressure', 'pulse', 'spo2'];

export default function DashboardScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { measurements } = useMeasurements();
  const { t } = useLocale();

  function latestFor(type: MeasurementType) {
    return measurements.find((m) => m.type === type);
  }

  const quickLinks: {
    key: 'History' | 'Insights' | 'Reminders' | 'Settings';
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: 'History', label: t('quickLink.history'), icon: <IconHistory size={sizes.iconDecorative} color={colors.textPrimary} /> },
    { key: 'Insights', label: t('quickLink.insights'), icon: <IconChartLine size={sizes.iconDecorative} color={colors.textPrimary} /> },
    { key: 'Reminders', label: t('quickLink.reminders'), icon: <IconBell size={sizes.iconDecorative} color={colors.textPrimary} /> },
    { key: 'Settings', label: t('quickLink.settings'), icon: <IconSettings size={sizes.iconDecorative} color={colors.textPrimary} /> },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
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
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <IconSettings size={sizes.iconDecorative} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {vitalTypes.map((type) => {
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
      </View>

      <Button
        title={t('measurement.add')}
        onPress={() => navigation.navigate('AddMeasurement')}
      />

      <MedicalDisclaimer />

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: colors.border,
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
              borderLeftColor: colors.border,
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
