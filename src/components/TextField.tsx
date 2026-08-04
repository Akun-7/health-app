import { useState } from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { useTheme } from '../theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export default function TextField({ label, error, style, onFocus, onBlur, ...rest }: Props) {
  const { colors, typography, radii, sizes, spacing } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={{ ...typography.caption, color: colors.textSecondary }}>{label}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            height: sizes.inputHeight,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
            paddingHorizontal: spacing.md,
            color: colors.textPrimary,
            fontSize: typography.body.fontSize,
            backgroundColor: colors.surface,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text> : null}
    </View>
  );
}
