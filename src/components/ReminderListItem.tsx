import { View, Text, Switch, Pressable } from 'react-native';
import { IconTrash, IconCheck, IconX } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useLocale } from '../context/LocaleContext';

type Props = {
  icon: React.ReactNode;
  title: string;
  time: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onDelete?: () => void;
  showDivider?: boolean;
  weeklyStats: { taken: number; total: number };
  onLogTaken: () => void;
  onLogSkipped: () => void;
};

export default function ReminderListItem({
  icon,
  title,
  time,
  enabled,
  onToggle,
  onDelete,
  showDivider = true,
  weeklyStats,
  onLogTaken,
  onLogSkipped,
}: Props) {
  const { colors, typography, spacing, sizes } = useTheme();
  const { t } = useLocale();

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md }}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>{title}</Text>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>{time}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.onPrimary}
          accessibilityLabel={title}
        />
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            accessibilityLabel={`${t('common.delete')}: ${title}`}
            accessibilityRole="button"
            style={{ width: sizes.tapTargetMin, height: sizes.tapTargetMin, alignItems: 'center', justifyContent: 'center' }}
          >
            <IconTrash size={sizes.iconInline} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.sm, gap: spacing.sm }}>
        <Text style={{ ...typography.small, color: colors.textMuted, flex: 1 }}>
          {t('reminder.weeklyStats', { taken: weeklyStats.taken, total: weeklyStats.total })}
        </Text>
        <Pressable
          onPress={onLogSkipped}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <IconX size={sizes.iconInline} color={colors.textMuted} />
          <Text style={{ ...typography.small, color: colors.textMuted }}>{t('reminder.skip')}</Text>
        </Pressable>
        <Pressable
          onPress={onLogTaken}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <IconCheck size={sizes.iconInline} color={colors.success} />
          <Text style={{ ...typography.small, color: colors.success }}>{t('reminder.taken')}</Text>
        </Pressable>
      </View>
      {showDivider ? <View style={{ height: 0.5, backgroundColor: colors.border }} /> : null}
    </View>
  );
}
