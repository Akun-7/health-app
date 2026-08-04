import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft, IconMoon, IconInfoCircle } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import Button from '../components/Button';
import { useSleep } from '../context/SleepContext';
import { useLocale } from '../context/LocaleContext';
import { formatDurationParts } from '../data/sleep';
import { formatDateGroup, formatTime } from '../data/measurements';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Sleep'>;

export default function SleepScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();
  const { supported, sessions, sampleNowAndRefresh } = useSleep();
  const [checking, setChecking] = useState(false);
  const [lastStill, setLastStill] = useState<boolean | null>(null);

  async function handleCheckNow() {
    setChecking(true);
    const sample = await sampleNowAndRefresh();
    setLastStill(sample.still);
    setChecking(false);
  }

  const [latest] = sessions;

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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('sleep.title')}</Text>
      </View>

      {!supported ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('sleep.unsupported')}</Text>
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.warningBg,
              borderRadius: radii.card,
              padding: spacing.md,
            }}
          >
            <IconInfoCircle size={sizes.iconInline} color={colors.warning} />
            <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1 }}>{t('sleep.disclaimer')}</Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button title={checking ? t('sleep.checking') : t('sleep.checkNow')} onPress={handleCheckNow} loading={checking} />
            {lastStill !== null ? (
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                {lastStill ? t('sleep.currentlyStill') : t('sleep.currentlyMoving')}
              </Text>
            ) : null}
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('sleep.lastSession')}</Text>
            {latest ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  backgroundColor: colors.primaryLight,
                  borderRadius: radii.card,
                  padding: spacing.md,
                }}
              >
                <IconMoon size={sizes.iconDecorative} color={colors.primary} />
                <Text style={{ ...typography.h1, color: colors.textPrimary }}>
                  {t('sleep.duration', formatDurationParts(latest.durationMs))}
                </Text>
              </View>
            ) : (
              <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('sleep.noSessions')}</Text>
            )}
          </View>

          {sessions.length > 1 ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>{t('sleep.recentSessions')}</Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: spacing.md,
                }}
              >
                {sessions.slice(1).map((session, index) => (
                  <View
                    key={session.start}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>
                      {formatDateGroup(session.start, t)} · {formatTime(session.start)}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                      {t('sleep.duration', formatDurationParts(session.durationMs))}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
