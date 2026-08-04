import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { IconLogout, IconUser } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { fetchThreads } from '../api/client';
import type { ChatThread } from '../api/client';
import { formatTime } from '../data/measurements';
import GuestAccountRequired from '../components/GuestAccountRequired';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorInbox'>;

export default function DoctorInboxScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { user, token, logout, guestMode } = useAuth();
  const { t } = useLocale();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const isVerified = user?.verificationStatus === 'approved';

  useEffect(() => {
    if (!token || !isVerified) return;
    let cancelled = false;
    fetchThreads(token).then((result) => {
      if (!cancelled) setThreads(result.threads);
    });
    return () => {
      cancelled = true;
    };
  }, [token, isVerified]);

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  if (guestMode) {
    return <GuestAccountRequired onCreateAccount={() => navigation.navigate('SignUp')} />;
  }

  if (!isVerified) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.pageBackground, padding: spacing.lg, gap: spacing.xl, justifyContent: 'center' }}>
        <Text style={{ ...typography.h2, color: colors.textPrimary, textAlign: 'center' }}>
          {user?.verificationStatus === 'rejected' ? t('doctorInbox.rejected') : t('doctorInbox.pending')}
        </Text>
        <Pressable
          onPress={handleLogout}
          style={{
            height: sizes.buttonHeight,
            borderRadius: radii.button,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...typography.body, color: colors.textPrimary }}>{t('settings.logout')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('doctorInbox.title')}</Text>
        <Pressable
          onPress={handleLogout}
          hitSlop={8}
          accessibilityLabel={t('settings.logout')}
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
          <IconLogout size={sizes.iconDecorative} color={colors.textPrimary} />
        </Pressable>
      </View>

      {threads.length === 0 ? (
        <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('doctorInbox.empty')}</Text>
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
          {threads.map((thread, index) => (
            <Pressable
              key={thread.patientId}
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'Chat',
                  params: { patientId: thread.patientId, patientEmail: thread.patientEmail },
                })
              }
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
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{thread.patientEmail}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>
                  {thread.lastMessage}
                </Text>
              </View>
              <Text style={{ ...typography.small, color: colors.textMuted }}>{formatTime(thread.lastMessageAt)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
