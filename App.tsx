import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme';
import { SettingsProvider } from './src/context/SettingsContext';
import { LocaleProvider } from './src/context/LocaleContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { AuthProvider } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { MeasurementsProvider } from './src/context/MeasurementsContext';
import { RemindersProvider } from './src/context/RemindersContext';
import { MedicationsProvider } from './src/context/MedicationsContext';
import { LabResultsProvider } from './src/context/LabResultsContext';
import { ReminderLogProvider } from './src/context/ReminderLogContext';
import { EmergencyContactsProvider } from './src/context/EmergencyContactsContext';
import { BleProvider } from './src/context/BleContext';
import { StepsProvider } from './src/context/StepsContext';
import { SleepProvider } from './src/context/SleepContext';
import { ComposeProviders } from './src/context/ComposeProviders';
import RootNavigator from './src/navigation/RootNavigator';

function GestureRoot({ children }: { children: ReactNode }) {
  return <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>;
}

export default function App() {
  return (
    <ComposeProviders
      providers={[
        GestureRoot,
        SettingsProvider,
        LocaleProvider,
        ThemeProvider,
        OnboardingProvider,
        AuthProvider,
        ProfileProvider,
        MeasurementsProvider,
        RemindersProvider,
        MedicationsProvider,
        LabResultsProvider,
        ReminderLogProvider,
        EmergencyContactsProvider,
        BleProvider,
        StepsProvider,
        SleepProvider,
      ]}
    >
      <RootNavigator />
    </ComposeProviders>
  );
}
