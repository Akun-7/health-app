import { View, Text } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'danger' | 'warning' | 'success';
};

export default function VitalCard({ icon, label, value, tone }: Props) {
  const { colors, typography, radii, spacing } = useTheme();
  const toneColors = {
    danger: { fg: colors.danger, bg: colors.dangerBg },
    warning: { fg: colors.warning, bg: colors.warningBg },
    success: { fg: colors.success, bg: colors.successBg },
  }[tone];

  return (
    <View
      style={{
        flexBasis: '48%',
        backgroundColor: toneColors.bg,
        borderRadius: radii.card,
        padding: spacing.md,
        gap: spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {icon}
        <Text style={{ ...typography.caption, color: toneColors.fg }}>{label}</Text>
      </View>
      <Text style={{ ...typography.h1, color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}
