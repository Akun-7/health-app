import { View, Text, Switch, Pressable } from 'react-native';
import { IconTrash } from '@tabler/icons-react-native';
import { useTheme } from '../theme';

type Props = {
  icon: React.ReactNode;
  title: string;
  time: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onDelete?: () => void;
  showDivider?: boolean;
};

export default function ReminderListItem({
  icon,
  title,
  time,
  enabled,
  onToggle,
  onDelete,
  showDivider = true,
}: Props) {
  const { colors, typography, spacing, sizes } = useTheme();

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
        />
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={{ width: sizes.iconDecorative, height: sizes.iconDecorative, alignItems: 'center', justifyContent: 'center' }}
          >
            <IconTrash size={sizes.iconInline} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {showDivider ? <View style={{ height: 0.5, backgroundColor: colors.border }} /> : null}
    </View>
  );
}
