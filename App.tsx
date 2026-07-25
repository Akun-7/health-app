import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/theme';
import { SettingsProvider } from './src/context/SettingsContext';
import { LocaleProvider } from './src/context/LocaleContext';
import { AuthProvider } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { MeasurementsProvider } from './src/context/MeasurementsContext';
import { RemindersProvider } from './src/context/RemindersContext';
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
                  <RootNavigator />
                  <StatusBar style="auto" />
                </RemindersProvider>
              </MeasurementsProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </LocaleProvider>
    </SettingsProvider>
  );
}
