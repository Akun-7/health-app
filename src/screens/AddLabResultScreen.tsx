import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useLabResults } from '../context/LabResultsContext';
import { useLocale } from '../context/LocaleContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddLabResult'>;

export default function AddLabResultScreen({ navigation }: Props) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { addLabResult } = useLabResults();
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!name.trim()) {
      setError(t('labResults.errorNameRequired'));
      return;
    }
    if (!value.trim()) {
      setError(t('labResults.errorValueRequired'));
      return;
    }
    setError('');
    setLoading(true);
    await addLabResult({ name: name.trim(), value: value.trim() });
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
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{t('labResults.addTitle')}</Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <TextField
            label={t('labResults.nameLabel')}
            placeholder={t('labResults.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          <TextField
            label={t('labResults.valueLabel')}
            placeholder={t('labResults.valuePlaceholder')}
            value={value}
            onChangeText={setValue}
          />
          {error ? <Text style={{ ...typography.small, color: colors.danger }}>{error}</Text> : null}
        </View>

        <View style={{ flex: 1 }} />
        <Button title={t('common.save')} onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
