import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconMenu2, IconUser } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { fetchDoctors } from '../api/client';
import type { DoctorSummary } from '../api/client';
import GuestAccountRequired from '../components/GuestAccountRequired';
import type { MainScreenProps } from '../navigation/RootNavigator';

type Props = MainScreenProps<'Doctors'>;

export default function DoctorsScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { token, guestMode } = useAuth();
  const { t } = useLocale();
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchDoctors(token).then((result) => {
      if (!cancelled) setDoctors(result.doctors);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (guestMode) {
    return <GuestAccountRequired onCreateAccount={() => navigation.navigate('SignUp')} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('doctors.title')}</Text>
      </View>

      {doctors.length === 0 ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('doctors.empty')}</Text>
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
          {doctors.map((doctor, index) => (
            <Pressable
              key={doctor.id}
              onPress={() => navigation.navigate('Chat')}
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
              <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{doctor.email}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
