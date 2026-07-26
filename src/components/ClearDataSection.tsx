import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { IconTrash } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useLocale } from '../context/LocaleContext';
import Button from './Button';

type Props = {
  onClear: () => Promise<void>;
};

export default function ClearDataSection({ onClear }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleConfirm() {
    setClearing(true);
    await onClear();
    setClearing(false);
    setConfirming(false);
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.md,
      }}
    >
      {confirming ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>{t('settings.clearConfirm')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button title={t('common.cancel')} variant="secondary" onPress={() => setConfirming(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t('settings.clearConfirmYes')} onPress={handleConfirm} loading={clearing} />
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setConfirming(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
        >
          <IconTrash size={sizes.iconInline} color={colors.danger} />
          <Text style={{ ...typography.body, color: colors.danger }}>{t('settings.clearAll')}</Text>
        </Pressable>
      )}
    </View>
  );
}
