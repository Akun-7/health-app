import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { useLocale } from '../context/LocaleContext';

type Props = {
  onCreateAccount: () => void;
};

export default function GuestAccountRequired({ onCreateAccount }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.pageBackground,
        padding: spacing.lg,
        gap: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ ...typography.h2, color: colors.textPrimary, textAlign: 'center' }}>
        {t('guest.accountRequired')}
      </Text>
      <Pressable
        onPress={onCreateAccount}
        accessibilityRole="button"
        accessibilityLabel={t('login.createAccount')}
        style={{
          height: sizes.buttonHeight,
          paddingHorizontal: spacing.xl,
          borderRadius: radii.button,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...typography.body, color: colors.onPrimary }}>{t('login.createAccount')}</Text>
      </Pressable>
    </View>
  );
}
