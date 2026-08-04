import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import Button from '../components/Button';
import CircularGauge from '../components/CircularGauge';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { classify, insightTone } from '../data/insights';
import { averageRedBrightness, estimateBpm } from '../camera/ppg';
import type { PpgSample } from '../camera/ppg';
import { useMeasurements } from '../context/MeasurementsContext';
import { useLocale } from '../context/LocaleContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraHeartRate'>;
type Phase = 'ready' | 'measuring' | 'result' | 'error';

const DURATION_MS = 15000;
const CAPTURE_DELAY_MS = 120;
const GAUGE_MIN = 40;
const GAUGE_MAX = 160;

export default function CameraHeartRateScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();
  const { addMeasurement } = useMeasurements();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('ready');
  const [progress, setProgress] = useState(0);
  const [resultBpm, setResultBpm] = useState<number | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const samplesRef = useRef<PpgSample[]>([]);
  const runningRef = useRef(false);

  useEffect(() => {
    runningRef.current = true;
    return () => {
      runningRef.current = false;
    };
  }, []);

  async function handleStart() {
    samplesRef.current = [];
    setProgress(0);
    setPhase('measuring');
    const startTime = Date.now();

    while (runningRef.current && Date.now() - startTime < DURATION_MS) {
      try {
        const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0, skipProcessing: true });
        if (photo?.base64) {
          samplesRef.current.push({ timestamp: Date.now(), value: averageRedBrightness(photo.base64) });
        }
      } catch {
        // A single failed capture shouldn't abort the whole reading.
      }
      if (!runningRef.current) return;
      setProgress(Math.min(1, (Date.now() - startTime) / DURATION_MS));
      await new Promise((resolve) => setTimeout(resolve, CAPTURE_DELAY_MS));
    }
    if (!runningRef.current) return;

    const bpm = estimateBpm(samplesRef.current);
    setResultBpm(bpm);
    setPhase(bpm === null ? 'error' : 'result');
  }

  async function handleSave() {
    if (resultBpm === null) return;
    await addMeasurement({ type: 'pulse', bpm: resultBpm });
    navigation.goBack();
  }

  const status = resultBpm !== null ? classify({ id: '', type: 'pulse', bpm: resultBpm, createdAt: 0 }) : null;
  const tone = status ? insightTone[status] : 'success';

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBackground, padding: spacing.lg, gap: spacing.xl }}>
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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('camera.title')}</Text>
      </View>

      {!permission ? null : !permission.granted ? (
        <View style={{ gap: spacing.md }}>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            {permission.canAskAgain ? t('camera.permissionRequired') : t('camera.permissionDenied')}
          </Text>
          {permission.canAskAgain ? (
            <Button title={t('camera.grantPermission')} onPress={requestPermission} />
          ) : null}
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          {phase === 'ready' || phase === 'measuring' ? (
            <>
              <View
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: radii.modal,
                  overflow: 'hidden',
                  alignSelf: 'center',
                  backgroundColor: colors.surface,
                }}
              >
                <CameraView
                  ref={cameraRef}
                  style={{ flex: 1 }}
                  facing="back"
                  enableTorch={phase === 'measuring'}
                />
              </View>
              <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
                {phase === 'measuring' ? t('camera.holdStill') : t('camera.instructions')}
              </Text>
              {phase === 'measuring' ? (
                <View style={{ gap: spacing.xs }}>
                  <View style={{ height: 8, borderRadius: radii.round, backgroundColor: colors.border }}>
                    <View
                      style={{
                        height: 8,
                        borderRadius: radii.round,
                        backgroundColor: colors.primary,
                        width: `${Math.round(progress * 100)}%`,
                      }}
                    />
                  </View>
                  <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                    {t('camera.measuring')}
                  </Text>
                </View>
              ) : (
                <Button title={t('camera.start')} onPress={handleStart} />
              )}
              <MedicalDisclaimer />
            </>
          ) : phase === 'error' ? (
            <View style={{ gap: spacing.md }}>
              <Text style={{ ...typography.body, color: colors.danger }}>{t('camera.failed')}</Text>
              <Button title={t('camera.retry')} onPress={() => setPhase('ready')} />
            </View>
          ) : (
            <View style={{ gap: spacing.lg, alignItems: 'center' }}>
              <CircularGauge value={resultBpm ?? 0} min={GAUGE_MIN} max={GAUGE_MAX} unitLabel="BPM" tone={tone} />
              {status ? (
                <Text style={{ ...typography.body, color: colors[tone] }}>{t(`insights.status.${status}`)}</Text>
              ) : null}
              <Text style={{ ...typography.small, color: colors.textMuted, textAlign: 'center' }}>
                {t('camera.disclaimer')}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
                <View style={{ flex: 1 }}>
                  <Button title={t('camera.retry')} variant="secondary" onPress={() => setPhase('ready')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title={t('camera.save')} onPress={handleSave} />
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
