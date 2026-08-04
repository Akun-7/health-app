import { Pressable, Text, PressableProps, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';

type Props = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

export default function Button({ title, variant = 'primary', loading, disabled, style, ...rest }: Props) {
  const { colors, typography, radii, sizes } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        {
          height: sizes.buttonHeight,
          borderRadius: radii.button,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          backgroundColor: isPrimary ? colors.primary : 'transparent',
          borderWidth: isPrimary ? 0 : 1,
          borderColor: colors.border,
        },
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={{ ...typography.body, color: isPrimary ? colors.onPrimary : colors.textPrimary, fontWeight: typography.h3.fontWeight }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
