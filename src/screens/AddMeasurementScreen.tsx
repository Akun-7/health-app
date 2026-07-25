import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import MeasurementIcon from '../components/MeasurementIcon';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import type { MeasurementType } from '../data/measurements';
import { useMeasurements } from '../context/MeasurementsContext';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMeasurement'>;

export default function AddMeasurementScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { addMeasurement } = useMeasurements();
  const { t } = useLocale();
  const [type, setType] = useState<MeasurementType>('bloodPressure');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [spo2, setSpo2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const typeOptions: { key: MeasurementType }[] = [
    { key: 'bloodPressure' },
    { key: 'pulse' },
    { key: 'spo2' },
  ];

  function isValid() {
    if (type === 'bloodPressure') return !!systolic && !!diastolic;
    if (type === 'pulse') return !!pulse;
    return !!spo2;
  }

  async function handleSave() {
    if (!isValid()) {
      setError(t('common.fillAllFields'));
      return;
    }
    setError('');
    setLoading(true);
    if (type === 'bloodPressure') {
      await addMeasurement({ type, systolic: Number(systolic), diastolic: Number(diastolic) });
    } else if (type === 'pulse') {
      await addMeasurement({ type, bpm: Number(pulse) });
    } else {
      await addMeasurement({ type, percent: Number(spo2) });
    }
    setLoading(false);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.pageBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, gap: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable
            onPress={() => navigation.goBack()}
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
            <IconArrowLeft size={sizes.iconDecorative} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('measurement.add')}</Text>
        </View>

        <View style={{ gap: spacing.xl }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('measurement.typeLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {typeOptions.map((option) => {
                const selected = type === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setType(option.key)}
                    style={{
                      flex: 1,
                      gap: spacing.xs,
                      alignItems: 'center',
                      paddingVertical: spacing.md,
                      borderRadius: radii.card,
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.border,
                    }}
                  >
                    <MeasurementIcon
                      type={option.key}
                      size={sizes.iconInline}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                    <Text style={{ ...typography.caption, color: selected ? colors.primary : colors.textPrimary }}>
                      {t(`measurement.${option.key}` as TranslationKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            {type === 'bloodPressure' ? (
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label={t('measurement.systolicLabel')}
                    placeholder={t('measurement.systolicPlaceholder')}
                    value={systolic}
                    onChangeText={setSystolic}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label={t('measurement.diastolicLabel')}
                    placeholder={t('measurement.diastolicPlaceholder')}
                    value={diastolic}
                    onChangeText={setDiastolic}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            ) : null}

            {type === 'pulse' ? (
              <TextField
                label={t('measurement.pulseLabel')}
                placeholder={t('measurement.pulsePlaceholder')}
                value={pulse}
                onChangeText={setPulse}
                keyboardType="number-pad"
              />
            ) : null}

            {type === 'spo2' ? (
              <TextField
                label={t('measurement.spo2Label')}
                placeholder={t('measurement.spo2Placeholder')}
                value={spo2}
                onChangeText={setSpo2}
                keyboardType="number-pad"
              />
            ) : null}

            {error ? <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text> : null}
          </View>
        </View>

        <MedicalDisclaimer />

        <View style={{ flex: 1 }} />
        <Button title={t('common.save')} onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
