import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from './SignUpScreen';
import { SettingsProvider } from '../context/SettingsContext';
import { LocaleProvider } from '../context/LocaleContext';
import { ThemeProvider } from '../theme';

const mockSignup = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signup: mockSignup }),
}));

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) => mockRequestMediaLibraryPermissionsAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
}));

function renderSignUpScreen() {
  const navigation = { reset: jest.fn(), navigate: jest.fn() };
  const utils = render(
    <SettingsProvider>
      <LocaleProvider>
        <ThemeProvider>
          {/* @ts-expect-error partial navigation/route mock is enough for this screen */}
          <SignUpScreen navigation={navigation} route={{}} />
        </ThemeProvider>
      </LocaleProvider>
    </SettingsProvider>
  );
  return { ...utils, navigation };
}

describe('SignUpScreen', () => {
  beforeEach(() => {
    mockSignup.mockReset();
    mockRequestMediaLibraryPermissionsAsync.mockReset();
    mockLaunchImageLibraryAsync.mockReset();
    mockSignup.mockResolvedValue(undefined);
  });

  it('blocks submission when "Мен дарыгермин" is picked but no license photo was uploaded', async () => {
    const utils = renderSignUpScreen();
    fireEvent.changeText(utils.getByTestId('signup-email'), 'doc@example.com');
    fireEvent.changeText(utils.getByTestId('signup-password'), 'password123');
    fireEvent.press(utils.getByTestId('signup-doctor-toggle'));

    fireEvent.press(utils.getByTestId('signup-submit'));

    await waitFor(() => expect(utils.getByText(/лицензия\/дипломдун сүрөтүн жүктөшүңүз керек/i)).toBeTruthy());
    expect(mockSignup).not.toHaveBeenCalled();
    expect(utils.navigation.reset).not.toHaveBeenCalled();
  });

  it('signs up as a doctor and routes to DoctorInbox once a license photo is attached', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ base64: 'ZmFrZS1saWNlbnNl', mimeType: 'image/jpeg' }],
    });
    const utils = renderSignUpScreen();
    fireEvent.changeText(utils.getByTestId('signup-email'), 'doc@example.com');
    fireEvent.changeText(utils.getByTestId('signup-password'), 'password123');
    fireEvent.press(utils.getByTestId('signup-doctor-toggle'));

    fireEvent.press(utils.getByTestId('signup-license-picker'));
    await waitFor(() => expect(mockLaunchImageLibraryAsync).toHaveBeenCalled());

    fireEvent.press(utils.getByTestId('signup-submit'));

    await waitFor(() => expect(mockSignup).toHaveBeenCalled());
    expect(mockSignup).toHaveBeenCalledWith(
      'doc@example.com',
      'password123',
      'doctor',
      'data:image/jpeg;base64,ZmFrZS1saWNlbnNl'
    );
    expect(utils.navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'DoctorInbox' }] });
  });

  it('signs up as a patient and routes to ProfileSetup', async () => {
    const utils = renderSignUpScreen();
    fireEvent.changeText(utils.getByTestId('signup-email'), 'patient@example.com');
    fireEvent.changeText(utils.getByTestId('signup-password'), 'password123');

    fireEvent.press(utils.getByTestId('signup-submit'));

    await waitFor(() => expect(mockSignup).toHaveBeenCalled());
    expect(mockSignup).toHaveBeenCalledWith('patient@example.com', 'password123', 'patient', undefined);
    expect(utils.navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'ProfileSetup' }] });
  });
});
