import type { TranslationKey } from '../i18n/ky';
import type { ApiErrorCode } from './client';

export const apiErrorKey: Record<ApiErrorCode, TranslationKey> = {
  invalid_email: 'auth.invalidEmail',
  invalid_password: 'auth.invalidPassword',
  email_taken: 'auth.emailTaken',
  invalid_credentials: 'auth.invalidCredentials',
  unauthorized: 'auth.invalidCredentials',
  forbidden: 'auth.invalidCredentials',
  invalid_input: 'chat.errorEmpty',
  network_error: 'auth.networkError',
};
