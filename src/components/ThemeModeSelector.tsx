import { View, Text, Pressable } from 'react-native';
import { IconDeviceDesktop, IconSun, IconMoon } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { ThemeMode } from '../context/SettingsContext';

type Props = {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
};

const themeOptions: { key: ThemeMode; labelKey: TranslationKey; icon: typeof IconSun }[] = [
  { key: 'system', labelKey: 'theme.system', icon: IconDeviceDesktop },
  { key: 'light', labelKey: 'theme.light', icon: IconSun },
  { key: 'dark', labelKey: 'theme.dark', icon: IconMoon },
];

export default function ThemeModeSelector({ value, onChange }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {themeOptions.map((option) => {
        const selected = value === option.key;
        const Icon = option.icon;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t(option.labelKey)}
            style={{
              flex: 1,
              gap: spacing.xs,
              alignItems: 'center',
              paddingVertical: spacing.md,
              borderRadius: radii.card,
              backgroundColor: selected ? colors.primaryLight : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
            }}
          >
            <Icon size={sizes.iconInline} color={selected ? colors.primary : colors.textMuted} />
            <Text style={{ ...typography.caption, color: selected ? colors.primary : colors.textPrimary }}>
              {t(option.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
