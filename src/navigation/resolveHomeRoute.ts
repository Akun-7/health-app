import type { AuthUser } from '../api/client';
import type { Profile } from '../data/profile';
import type { RootStackParamList } from './RootNavigator';

// Shared by RootNavigator's initial route and OnboardingScreen's "done" step
// so the two never drift on where a given user/profile combo should land.
export function resolveHomeRoute(user: AuthUser | null, profile: Profile | null): keyof RootStackParamList {
  if (!user) return 'Login';
  if (user.role === 'doctor') return 'DoctorInbox';
  if (!profile) return 'ProfileSetup';
  return 'Dashboard';
}
