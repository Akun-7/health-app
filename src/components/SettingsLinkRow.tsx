import { View, Text, Pressable } from 'react-native';
import { IconChevronRight } from '@tabler/icons-react-native';
import { useTheme } from '../theme';

type Props = {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
};

export default function SettingsLinkRow({ icon, title, onPress }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();

  return (
    <Pressable
      onPress={onPress}
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
      <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{title}</Text>
      <IconChevronRight size={sizes.iconInline} color={colors.textMuted} />
    </Pressable>
  );
}
