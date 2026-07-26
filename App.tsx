import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/theme';
import { SettingsProvider } from './src/context/SettingsContext';
import { LocaleProvider } from './src/context/LocaleContext';
import { AuthProvider } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { MeasurementsProvider } from './src/context/MeasurementsContext';
import { RemindersProvider } from './src/context/RemindersContext';
import { ReminderLogProvider } from './src/context/ReminderLogContext';
import { EmergencyContactsProvider } from './src/context/EmergencyContactsContext';
import { BleProvider } from './src/context/BleContext';
import { StepsProvider } from './src/context/StepsContext';
import { SleepProvider } from './src/context/SleepContext';
import { ComposeProviders } from './src/context/ComposeProviders';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ComposeProviders
      providers={[
        SettingsProvider,
        LocaleProvider,
        ThemeProvider,
        AuthProvider,
        ProfileProvider,
        MeasurementsProvider,
        RemindersProvider,
        ReminderLogProvider,
        EmergencyContactsProvider,
        BleProvider,
        StepsProvider,
        SleepProvider,
      ]}
    >
      <RootNavigator />
      <StatusBar style="auto" />
    </ComposeProviders>
  );
}
