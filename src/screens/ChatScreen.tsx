import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { IconArrowLeft, IconSend, IconInfoCircle } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { fetchMyMessages, sendMyMessage, fetchPatientMessages, sendPatientMessage } from '../api/client';
import type { ChatMessage } from '../api/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const POLL_INTERVAL_MS = 3000;

export default function ChatScreen({ navigation, route }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { user, token } = useAuth();
  const { t } = useLocale();
  const patientId = route.params?.patientId;
  const isDoctorView = Boolean(patientId);
  const title = route.params?.patientEmail ?? t('chat.title');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      const result = isDoctorView
        ? await fetchPatientMessages(token as string, patientId as string)
        : await fetchMyMessages(token as string);
      if (!cancelled) setMessages(result.messages);
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, isDoctorView, patientId]);

  async function handleSend() {
    if (!draft.trim() || !token) return;
    setSending(true);
    const { message } = isDoctorView
      ? await sendPatientMessage(token, patientId as string, draft.trim())
      : await sendMyMessage(token, draft.trim());
    setMessages((prev) => [...prev, message]);
    setDraft('');
    setSending(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.pageBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.sm }}>
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
        <Text style={{ ...typography.h1, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {!isDoctorView ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.warningBg,
            borderRadius: radii.card,
            padding: spacing.md,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.sm,
          }}
        >
          <IconInfoCircle size={sizes.iconInline} color={colors.warning} />
          <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1 }}>{t('chat.disclaimer')}</Text>
        </View>
      ) : null}

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, flexGrow: 1 }}>
        {messages.length === 0 ? (
          <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('chat.empty')}</Text>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === user?.id;
            return (
              <View
                key={message.id}
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: isMine ? colors.primaryLight : colors.surface,
                  borderRadius: radii.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{message.text}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.sm, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <TextField placeholder={t('chat.placeholder')} value={draft} onChangeText={setDraft} multiline />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={sending || !draft.trim()}
          accessibilityLabel={t('chat.send')}
          accessibilityRole="button"
          style={{
            width: sizes.tapTargetMin,
            height: sizes.tapTargetMin,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.round,
            backgroundColor: colors.primary,
            opacity: sending || !draft.trim() ? 0.5 : 1,
          }}
        >
          <IconSend size={sizes.iconInline} color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
