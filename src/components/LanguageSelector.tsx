import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { localeNativeName } from '../context/LocaleContext';
import type { Locale } from '../context/LocaleContext';

type Props = {
  value: Locale;
  onChange: (locale: Locale) => void;
};

const locales: Locale[] = ['ky', 'ru', 'en'];

export default function LanguageSelector({ value, onChange }: Props) {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {locales.map((locale) => {
        const selected = value === locale;
        return (
          <Pressable
            key={locale}
            onPress={() => onChange(locale)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={localeNativeName[locale]}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: spacing.md,
              borderRadius: radii.card,
              backgroundColor: selected ? colors.primaryLight : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
            }}
          >
            <Text style={{ ...typography.caption, color: selected ? colors.primary : colors.textPrimary }}>
              {localeNativeName[locale]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
