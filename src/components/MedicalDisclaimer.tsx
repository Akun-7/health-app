import { View, Text } from 'react-native';
import { IconInfoCircle } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useLocale } from '../context/LocaleContext';

export default function MedicalDisclaimer() {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primaryLight,
        borderRadius: radii.card,
        padding: spacing.md,
      }}
    >
      <IconInfoCircle size={sizes.iconInline} color={colors.primary} />
      <Text style={{ ...typography.small, color: colors.textSecondary, flex: 1 }}>{t('disclaimer.text')}</Text>
    </View>
  );
}
