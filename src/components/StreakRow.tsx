import { View, Text } from 'react-native';
import { IconStarFilled } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useLocale } from '../context/LocaleContext';
import type { StreakDay } from '../data/streak';
import type { TranslationKey } from '../i18n/ky';

type Props = { days: StreakDay[] };

const DOT_SIZE = 32;

export default function StreakRow({ days }: Props) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useLocale();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {days.map((day) => (
        <View key={day.timestamp} style={{ alignItems: 'center', gap: spacing.xs }}>
          <View
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: radii.round,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: day.active ? colors.success : 'transparent',
              borderWidth: day.active ? 0 : 1,
              borderColor: colors.gaugeTrack,
            }}
          >
            {day.active ? <IconStarFilled size={16} color={colors.onPrimary} /> : null}
          </View>
          <Text style={{ ...typography.small, color: colors.textMuted }}>
            {t(`day.short.${day.dayOfWeek}` as TranslationKey)}
          </Text>
        </View>
      ))}
    </View>
  );
}
