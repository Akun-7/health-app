import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconMenu2, IconPlus, IconClipboardList, IconTrash } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useLabResults } from '../context/LabResultsContext';
import { useLocale } from '../context/LocaleContext';
import { formatTime } from '../data/measurements';
import type { MainScreenProps } from '../navigation/RootNavigator';

type Props = MainScreenProps<'LabResults'>;

export default function LabResultsScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { labResults, deleteLabResult } = useLabResults();
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
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('labResults.title')}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AddLabResult')}
          hitSlop={8}
          accessibilityLabel={t('labResults.addTitle')}
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

      {labResults.length === 0 ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('labResults.empty')}</Text>
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
          {labResults.map((result, index) => (
            <View
              key={result.id}
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
                <IconClipboardList size={sizes.iconInline} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{result.name}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  {result.value} · {formatTime(result.createdAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => deleteLabResult(result.id)}
                hitSlop={8}
                accessibilityLabel={`${t('common.delete')}: ${result.name}`}
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
