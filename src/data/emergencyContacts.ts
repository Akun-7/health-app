export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  createdAt: number;
};

const PHONE_PATTERN = /^\+?[0-9()\s-]{6,}$/;

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}
