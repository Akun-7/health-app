import { View, Text } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'danger' | 'warning' | 'success';
};

export default function VitalCard({ icon, label, value, tone }: Props) {
  const { colors, typography, radii, spacing, highContrast } = useTheme();
  const toneColor = colors[tone];

  return (
    <View
      style={{
        flexBasis: '48%',
        backgroundColor: colors.cardElevated,
        borderRadius: radii.modal,
        padding: spacing.md,
        gap: spacing.xs,
        borderWidth: highContrast ? 2 : 1,
        borderColor: highContrast ? toneColor : colors.gaugeTrack,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {icon}
        <Text style={{ ...typography.caption, color: toneColor }}>{label}</Text>
      </View>
      <Text style={{ ...typography.h1, color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}
