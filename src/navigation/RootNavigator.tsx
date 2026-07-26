import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddMeasurementScreen from '../screens/AddMeasurementScreen';
import HistoryScreen from '../screens/HistoryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import AddReminderScreen from '../screens/AddReminderScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SOSScreen from '../screens/SOSScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import AddEmergencyContactScreen from '../screens/AddEmergencyContactScreen';
import ChatScreen from '../screens/ChatScreen';
import DoctorInboxScreen from '../screens/DoctorInboxScreen';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ProfileSetup: { mode?: 'edit' } | undefined;
  Dashboard: undefined;
  AddMeasurement: undefined;
  History: undefined;
  Insights: undefined;
  Reminders: undefined;
  AddReminder: undefined;
  Settings: undefined;
  SOS: undefined;
  EmergencyContacts: undefined;
  AddEmergencyContact: undefined;
  Chat: { patientId?: string; patientEmail?: string } | undefined;
  DoctorInbox: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navTheme = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;

  if (authLoading || profileLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.pageBackground }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const initialRouteName = !user
    ? 'Login'
    : user.role === 'doctor'
      ? 'DoctorInbox'
      : !profile
        ? 'ProfileSetup'
        : 'Dashboard';

  return (
    <NavigationContainer
      theme={{
        ...navTheme,
        colors: {
          ...navTheme.colors,
          background: theme.colors.pageBackground,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AddMeasurement" component={AddMeasurementScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Insights" component={InsightsScreen} />
        <Stack.Screen name="Reminders" component={RemindersScreen} />
        <Stack.Screen name="AddReminder" component={AddReminderScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="SOS" component={SOSScreen} />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
        <Stack.Screen name="AddEmergencyContact" component={AddEmergencyContactScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="DoctorInbox" component={DoctorInboxScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
