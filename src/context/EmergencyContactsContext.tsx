import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmergencyContact } from '../data/emergencyContacts';

const STORAGE_KEY = 'health-app/emergencyContacts';

type NewContact = { name: string; phone: string };

type EmergencyContactsContextValue = {
  contacts: EmergencyContact[];
  loading: boolean;
  addContact: (input: NewContact) => Promise<EmergencyContact>;
  deleteContact: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const EmergencyContactsContext = createContext<EmergencyContactsContextValue | null>(null);

export function EmergencyContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setContacts(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: EmergencyContact[]) {
    setContacts(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function addContact(input: NewContact) {
    const contact: EmergencyContact = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    await persist([contact, ...contacts]);
    return contact;
  }

  async function deleteContact(id: string) {
    await persist(contacts.filter((c) => c.id !== id));
  }

  async function clearAll() {
    await persist([]);
  }

  const value = useMemo(
    () => ({ contacts, loading, addContact, deleteContact, clearAll }),
    [contacts, loading]
  );

  return <EmergencyContactsContext.Provider value={value}>{children}</EmergencyContactsContext.Provider>;
}

export function useEmergencyContacts(): EmergencyContactsContextValue {
  const ctx = useContext(EmergencyContactsContext);
  if (!ctx) {
    throw new Error('useEmergencyContacts must be used within an EmergencyContactsProvider');
  }
  return ctx;
}
