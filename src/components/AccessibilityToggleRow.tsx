import { View, Text, Switch } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export default function AccessibilityToggleRow({ icon, title, description, value, onValueChange }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();

  return (
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
      <View
        style={{
          width: sizes.tapTargetMin,
          height: sizes.tapTargetMin,
          borderRadius: radii.round,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.body, color: colors.textPrimary }}>{title}</Text>
        {description ? <Text style={{ ...typography.caption, color: colors.textMuted }}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.onPrimary}
        accessibilityLabel={title}
      />
    </View>
  );
}
