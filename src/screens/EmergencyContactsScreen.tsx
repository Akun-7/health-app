import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft, IconPlus, IconTrash, IconUser } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import { useLocale } from '../context/LocaleContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EmergencyContacts'>;

export default function EmergencyContactsScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { contacts, deleteContact } = useEmergencyContacts();
  const { t } = useLocale();

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityLabel={t('common.back')}
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
            <IconArrowLeft size={sizes.iconDecorative} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('emergencyContacts.title')}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AddEmergencyContact')}
          hitSlop={8}
          accessibilityLabel={t('emergencyContacts.addTitle')}
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

      {contacts.length === 0 ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('emergencyContacts.empty')}</Text>
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
          {contacts.map((contact, index) => (
            <View
              key={contact.id}
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
                <IconUser size={sizes.iconInline} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{contact.name}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{contact.phone}</Text>
              </View>
              <Pressable
                onPress={() => deleteContact(contact.id)}
                hitSlop={8}
                accessibilityLabel={`${t('common.delete')}: ${contact.name}`}
                accessibilityRole="button"
                style={{ width: sizes.tapTargetMin, height: sizes.tapTargetMin, alignItems: 'center', justifyContent: 'center' }}
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
