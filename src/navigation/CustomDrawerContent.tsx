import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import {
  IconHome2,
  IconStethoscope,
  IconCalendarPlus,
  IconMessageCircle2,
  IconClipboardList,
  IconPill,
  IconActivityHeartbeat,
  IconFileDescription,
  IconAlertTriangle,
  IconBell,
  IconBulb,
  IconSettings,
} from '@tabler/icons-react-native';
import { useTheme } from '../theme';
import { useLocale } from '../context/LocaleContext';
import type { TranslationKey } from '../i18n/ky';
import type { MainDrawerParamList } from './RootNavigator';

type DrawerItemDef = {
  route: keyof MainDrawerParamList;
  labelKey: TranslationKey;
  icon: (color: string, size: number) => ReactNode;
};

const items: DrawerItemDef[] = [
  { route: 'Dashboard', labelKey: 'nav.dashboard', icon: (color, size) => <IconHome2 color={color} size={size} /> },
  { route: 'Doctors', labelKey: 'nav.doctors', icon: (color, size) => <IconStethoscope color={color} size={size} /> },
  { route: 'Appointment', labelKey: 'nav.appointment', icon: (color, size) => <IconCalendarPlus color={color} size={size} /> },
  { route: 'Chat', labelKey: 'nav.chat', icon: (color, size) => <IconMessageCircle2 color={color} size={size} /> },
  { route: 'LabResults', labelKey: 'nav.labResults', icon: (color, size) => <IconClipboardList color={color} size={size} /> },
  { route: 'Medications', labelKey: 'nav.medications', icon: (color, size) => <IconPill color={color} size={size} /> },
  { route: 'History', labelKey: 'nav.vitals', icon: (color, size) => <IconActivityHeartbeat color={color} size={size} /> },
  { route: 'MedicalRecord', labelKey: 'nav.medicalRecord', icon: (color, size) => <IconFileDescription color={color} size={size} /> },
  { route: 'SOS', labelKey: 'nav.sos', icon: (color, size) => <IconAlertTriangle color={color} size={size} /> },
  { route: 'Reminders', labelKey: 'nav.reminders', icon: (color, size) => <IconBell color={color} size={size} /> },
  { route: 'HealthTips', labelKey: 'nav.tips', icon: (color, size) => <IconBulb color={color} size={size} /> },
  { route: 'Settings', labelKey: 'nav.settings', icon: (color, size) => <IconSettings color={color} size={size} /> },
];

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { colors, typography } = useTheme();
  const { t } = useLocale();
  const activeRoute = props.state.routes[props.state.index]?.name;

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: colors.surface }}>
      <Text style={{ ...typography.h2, color: colors.textPrimary, paddingHorizontal: 16, paddingBottom: 12 }}>
        {t('nav.appName')}
      </Text>
      {items.map((item) => {
        const focused = activeRoute === item.route;
        return (
          <DrawerItem
            key={item.route}
            label={t(item.labelKey)}
            focused={focused}
            icon={({ color, size }) => item.icon(color, size)}
            activeTintColor={colors.primary}
            activeBackgroundColor={colors.primaryLight}
            inactiveTintColor={colors.textPrimary}
            labelStyle={{ ...typography.body }}
            onPress={() => props.navigation.navigate(item.route)}
          />
        );
      })}
    </DrawerContentScrollView>
  );
}
