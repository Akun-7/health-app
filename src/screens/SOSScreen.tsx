import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform } from 'react-native';
import * as SMS from 'expo-sms';
import { IconArrowLeft, IconAlertTriangle } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import Button from '../components/Button';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import { useMeasurements } from '../context/MeasurementsContext';
import { useLocale } from '../context/LocaleContext';
import { buildSosMessage } from '../data/sos';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SOS'>;

export default function SOSScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { contacts } = useEmergencyContacts();
  const { measurements } = useMeasurements();
  const { t } = useLocale();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  async function handleSend() {
    setNotice('');
    setSending(true);
    const message = buildSosMessage(measurements, t);
    const phones = contacts.map((c) => c.phone);
    const smsAvailable = Platform.OS !== 'web' && (await SMS.isAvailableAsync());
    if (smsAvailable) {
      await SMS.sendSMSAsync(phones, message);
    } else {
      setNotice(t('sos.smsUnavailable'));
      // tel: has no meaningful behavior on web (no telephony) and can trigger
      // disruptive OS-level "open app?" prompts there, so only attempt it natively.
      if (Platform.OS !== 'web') {
        await Linking.openURL(`tel:${phones[0]}`);
      }
    }
    setSending(false);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBackground }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
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
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('sos.title')}</Text>
      </View>

      <Text style={{ ...typography.body, color: colors.textSecondary }}>{t('sos.subtitle')}</Text>

      {contacts.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.warningBg,
            borderRadius: radii.card,
            padding: spacing.md,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <IconAlertTriangle size={sizes.iconInline} color={colors.warning} />
            <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{t('sos.noContacts')}</Text>
          </View>
          <Button title={t('sos.addContacts')} onPress={() => navigation.navigate('AddEmergencyContact')} />
        </View>
      ) : (
        <>
          {notice ? (
            <Text style={{ ...typography.caption, color: colors.warning }}>{notice}</Text>
          ) : null}
          <Pressable
            onPress={handleSend}
            disabled={sending}
            style={({ pressed }) => ({
              height: 96,
              borderRadius: radii.modal,
              backgroundColor: colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sending ? 0.6 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ ...typography.h1, color: colors.onPrimary }}>{t('sos.send')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('EmergencyContacts')}>
            <Text style={{ ...typography.caption, color: colors.primary }}>{t('sos.manageContacts')}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
