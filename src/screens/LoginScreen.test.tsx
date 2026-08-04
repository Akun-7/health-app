import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';
import { SettingsProvider } from '../context/SettingsContext';
import { LocaleProvider } from '../context/LocaleContext';
import { ThemeProvider } from '../theme';
import type { AuthUser } from '../api/client';

const mockLogin = jest.fn<Promise<AuthUser>, [string, string]>();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

let mockProfile: unknown = null;
jest.mock('../context/ProfileContext', () => ({
  useProfile: () => ({ profile: mockProfile }),
}));

function renderLoginScreen() {
  const navigation = { reset: jest.fn(), navigate: jest.fn() };
  const utils = render(
    <SettingsProvider>
      <LocaleProvider>
        <ThemeProvider>
          {/* @ts-expect-error partial navigation/route mock is enough for this screen */}
          <LoginScreen navigation={navigation} route={{}} />
        </ThemeProvider>
      </LocaleProvider>
    </SettingsProvider>
  );
  return { ...utils, navigation };
}

async function submitLogin(utils: ReturnType<typeof renderLoginScreen>, email: string, password: string) {
  fireEvent.changeText(utils.getByTestId('login-email'), email);
  fireEvent.changeText(utils.getByTestId('login-password'), password);
  fireEvent.press(utils.getByTestId('login-submit'));
}

describe('LoginScreen', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockProfile = null;
  });

  it('routes a doctor account straight to DoctorInbox, bypassing Main/ProfileSetup', async () => {
    mockLogin.mockResolvedValue({ id: '1', email: 'doc@example.com', role: 'doctor', verificationStatus: 'approved' });
    const utils = renderLoginScreen();

    await submitLogin(utils, 'doc@example.com', 'password123');

    await waitFor(() => expect(utils.navigation.reset).toHaveBeenCalled());
    expect(utils.navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'DoctorInbox' }],
    });
  });

  it('routes a patient account with an existing profile to Main', async () => {
    mockProfile = { name: 'Aman' };
    mockLogin.mockResolvedValue({ id: '2', email: 'patient@example.com', role: 'patient', verificationStatus: null });
    const utils = renderLoginScreen();

    await submitLogin(utils, 'patient@example.com', 'password123');

    await waitFor(() => expect(utils.navigation.reset).toHaveBeenCalled());
    expect(utils.navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  });

  it('routes a patient account with no profile yet to ProfileSetup', async () => {
    mockProfile = null;
    mockLogin.mockResolvedValue({ id: '3', email: 'newpatient@example.com', role: 'patient', verificationStatus: null });
    const utils = renderLoginScreen();

    await submitLogin(utils, 'newpatient@example.com', 'password123');

    await waitFor(() => expect(utils.navigation.reset).toHaveBeenCalled());
    expect(utils.navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'ProfileSetup' }],
    });
  });

  it('does not navigate when the login call fails', async () => {
    mockLogin.mockRejectedValue(new Error('bad credentials'));
    const utils = renderLoginScreen();

    await submitLogin(utils, 'wrong@example.com', 'wrongpass');

    await waitFor(() => expect(utils.getByText(/Серверге туташуу мүмкүн болбоду/)).toBeTruthy());
    expect(mockLogin).toHaveBeenCalled();
    expect(utils.navigation.reset).not.toHaveBeenCalled();
  });
});
