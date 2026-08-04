import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { isValidPhone } from '../data/emergencyContacts';
import { useEmergencyContacts } from '../context/EmergencyContactsContext';
import { useLocale } from '../context/LocaleContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEmergencyContact'>;

export default function AddEmergencyContactScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { addContact } = useEmergencyContacts();
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!name.trim()) {
      setError(t('emergencyContacts.errorNameRequired'));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t('emergencyContacts.errorPhoneInvalid'));
      return;
    }
    setError('');
    setLoading(true);
    await addContact({ name: name.trim(), phone: phone.trim() });
    setLoading(false);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.pageBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, gap: spacing.xl }}>
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
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('emergencyContacts.addTitle')}</Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <TextField
            label={t('emergencyContacts.nameLabel')}
            placeholder={t('emergencyContacts.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          <TextField
            label={t('emergencyContacts.phoneLabel')}
            placeholder={t('emergencyContacts.phonePlaceholder')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          {error ? <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text> : null}
        </View>

        <View style={{ flex: 1 }} />
        <Button title={t('common.save')} onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
