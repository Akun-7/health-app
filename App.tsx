import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/theme';
import { SettingsProvider } from './src/context/SettingsContext';
import { LocaleProvider } from './src/context/LocaleContext';
import { AuthProvider } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { MeasurementsProvider } from './src/context/MeasurementsContext';
import { RemindersProvider } from './src/context/RemindersContext';
import { EmergencyContactsProvider } from './src/context/EmergencyContactsContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SettingsProvider>
      <LocaleProvider>
        <ThemeProvider>
          <AuthProvider>
            <ProfileProvider>
              <MeasurementsProvider>
                <RemindersProvider>
                  <EmergencyContactsProvider>
                    <RootNavigator />
                    <StatusBar style="auto" />
                  </EmergencyContactsProvider>
                </RemindersProvider>
              </MeasurementsProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </LocaleProvider>
    </SettingsProvider>
  );
}
