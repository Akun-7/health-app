import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { IconArrowLeft, IconBluetooth, IconDeviceMobile } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import Button from '../components/Button';
import { useBle } from '../context/BleContext';
import { useMeasurements } from '../context/MeasurementsContext';
import { useLocale } from '../context/LocaleContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Bluetooth'>;

export default function BluetoothScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();
  const { supported, scanning, devices, connectedDevice, connecting, lastReading, startScan, stopScan, connect, disconnect } = useBle();
  const { addMeasurement } = useMeasurements();
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!lastReading) return;
    if (lastReading.type === 'bloodPressure') {
      await addMeasurement({ type: 'bloodPressure', systolic: lastReading.systolic, diastolic: lastReading.diastolic });
    } else {
      await addMeasurement({ type: 'spo2', percent: lastReading.percent });
    }
    if (lastReading.pulse !== null) {
      await addMeasurement({ type: 'pulse', bpm: lastReading.pulse });
    }
    setSaved(true);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('bluetooth.title')}</Text>
      </View>

      {!supported ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('bluetooth.unsupported')}</Text>
      ) : connectedDevice ? (
        <View style={{ gap: spacing.md }}>
          <View
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
            <IconDeviceMobile size={sizes.iconDecorative} color={colors.primary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>
              {connectedDevice.name ?? connectedDevice.id}
            </Text>
          </View>

          {lastReading ? (
            <View
              style={{
                backgroundColor: colors.primaryLight,
                borderRadius: radii.card,
                padding: spacing.md,
                gap: spacing.sm,
              }}
            >
              <Text style={{ ...typography.h1, color: colors.textPrimary }}>
                {lastReading.type === 'bloodPressure'
                  ? `${lastReading.systolic}/${lastReading.diastolic}`
                  : `${lastReading.percent}%`}
              </Text>
              <Button title={saved ? t('bluetooth.saved') : t('common.save')} onPress={handleSave} disabled={saved} />
            </View>
          ) : (
            <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('bluetooth.waitingReading')}</Text>
          )}

          <Button title={t('bluetooth.disconnect')} variant="secondary" onPress={disconnect} />
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('bluetooth.subtitle')}</Text>
          <Button
            title={scanning ? t('bluetooth.stopScan') : t('bluetooth.startScan')}
            onPress={scanning ? stopScan : startScan}
          />
          {devices.length === 0 ? (
            scanning ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('bluetooth.noDevices')}</Text>
            )
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
              {devices.map((device, index) => (
                <Pressable
                  key={device.id}
                  onPress={() => connect(device.id)}
                  disabled={connecting}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingVertical: spacing.sm,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <IconBluetooth size={sizes.iconInline} color={colors.primary} />
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{device.name}</Text>
                  {connecting ? <ActivityIndicator color={colors.primary} /> : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
