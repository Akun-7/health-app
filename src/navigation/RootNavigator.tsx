import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useOnboarding } from '../context/OnboardingContext';
import { resolveHomeRoute } from './resolveHomeRoute';
import CustomDrawerContent from './CustomDrawerContent';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import AddMeasurementScreen from '../screens/AddMeasurementScreen';
import HistoryScreen from '../screens/HistoryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import AddReminderScreen from '../screens/AddReminderScreen';
import LabResultsScreen from '../screens/LabResultsScreen';
import AddLabResultScreen from '../screens/AddLabResultScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import MedicalRecordScreen from '../screens/MedicalRecordScreen';
import HealthTipsScreen from '../screens/HealthTipsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SOSScreen from '../screens/SOSScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import AddEmergencyContactScreen from '../screens/AddEmergencyContactScreen';
import ChatScreen from '../screens/ChatScreen';
import DoctorInboxScreen from '../screens/DoctorInboxScreen';
import BluetoothScreen from '../screens/BluetoothScreen';
import SleepScreen from '../screens/SleepScreen';
import CameraHeartRateScreen from '../screens/CameraHeartRateScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;
  ProfileSetup: { mode?: 'edit' } | undefined;
  Main: NavigatorScreenParams<MainDrawerParamList> | undefined;
  AddMeasurement: undefined;
  Insights: undefined;
  AddReminder: undefined;
  AddLabResult: undefined;
  AddMedication: undefined;
  EmergencyContacts: undefined;
  AddEmergencyContact: undefined;
  DoctorInbox: undefined;
  Bluetooth: undefined;
  Sleep: undefined;
  CameraHeartRate: undefined;
};

// The 12-item drawer ("Main").
export type MainDrawerParamList = {
  Dashboard: undefined;
  Doctors: undefined;
  Appointment: undefined;
  Chat: { patientId?: string; patientEmail?: string } | undefined;
  LabResults: undefined;
  Medications: undefined;
  History: undefined;
  MedicalRecord: undefined;
  SOS: undefined;
  Reminders: undefined;
  HealthTips: undefined;
  Settings: undefined;
};

export type MainScreenProps<T extends keyof MainDrawerParamList> = CompositeScreenProps<
  DrawerScreenProps<MainDrawerParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();

function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Doctors" component={DoctorsScreen} />
      <Drawer.Screen name="Appointment" component={AppointmentScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="LabResults" component={LabResultsScreen} />
      <Drawer.Screen name="Medications" component={MedicationsScreen} />
      <Drawer.Screen name="History" component={HistoryScreen} />
      <Drawer.Screen name="MedicalRecord" component={MedicalRecordScreen} />
      <Drawer.Screen name="SOS" component={SOSScreen} />
      <Drawer.Screen name="Reminders" component={RemindersScreen} />
      <Drawer.Screen name="HealthTips" component={HealthTipsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export default function RootNavigator() {
  const theme = useTheme();
  const { user, loading: authLoading, guestMode } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { seen: onboardingSeen, loading: onboardingLoading } = useOnboarding();
  const navTheme = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;

  if (authLoading || profileLoading || onboardingLoading) {
    return (
      <>
        <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.pageBackground }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </>
    );
  }

  const initialRouteName = !onboardingSeen ? 'Onboarding' : resolveHomeRoute(user, profile, guestMode);

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
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
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          <Stack.Screen name="Main" component={MainDrawerNavigator} />
          <Stack.Screen name="AddMeasurement" component={AddMeasurementScreen} />
          <Stack.Screen name="Insights" component={InsightsScreen} />
          <Stack.Screen name="AddReminder" component={AddReminderScreen} />
          <Stack.Screen name="AddLabResult" component={AddLabResultScreen} />
          <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
          <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
          <Stack.Screen name="AddEmergencyContact" component={AddEmergencyContactScreen} />
          <Stack.Screen name="DoctorInbox" component={DoctorInboxScreen} />
          <Stack.Screen name="Bluetooth" component={BluetoothScreen} />
          <Stack.Screen name="Sleep" component={SleepScreen} />
          <Stack.Screen name="CameraHeartRate" component={CameraHeartRateScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
