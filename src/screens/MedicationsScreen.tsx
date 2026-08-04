import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconMenu2, IconPlus, IconPill, IconTrash } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useMedications } from '../context/MedicationsContext';
import { useLocale } from '../context/LocaleContext';
import type { MainScreenProps } from '../navigation/RootNavigator';

type Props = MainScreenProps<'Medications'>;

export default function MedicationsScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { medications, deleteMedication } = useMedications();
  const { t } = useLocale();

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable
            onPress={() => navigation.toggleDrawer()}
            hitSlop={8}
            accessibilityLabel={t('nav.appName')}
            accessibilityRole="button"
            style={{
              width: sizes.tapTargetMin,
              height: sizes.tapTargetMin,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.round,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <IconMenu2 size={sizes.iconDecorative} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('medications.title')}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AddMedication')}
          hitSlop={8}
          accessibilityLabel={t('medications.addTitle')}
          accessibilityRole="button"
          style={{
            width: sizes.tapTargetMin,
            height: sizes.tapTargetMin,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.round,
            backgroundColor: colors.primary,
          }}
        >
          <IconPlus size={sizes.iconDecorative} color={colors.onPrimary} />
        </Pressable>
      </View>

      {medications.length === 0 ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('medications.empty')}</Text>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
          }}
        >
          {medications.map((medication, index) => (
            <View
              key={medication.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.sm,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
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
                <IconPill size={sizes.iconInline} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{medication.name}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{medication.dosage}</Text>
              </View>
              <Pressable
                onPress={() => deleteMedication(medication.id)}
                hitSlop={8}
                accessibilityLabel={`${t('common.delete')}: ${medication.name}`}
                accessibilityRole="button"
                style={{
                  width: sizes.tapTargetMin,
                  height: sizes.tapTargetMin,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconTrash size={sizes.iconInline} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
