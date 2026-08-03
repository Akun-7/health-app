import { renderHook, waitFor, act } from '@testing-library/react-native';
import { RemindersProvider, useReminders } from './RemindersContext';

const mockScheduleReminderNotification = jest.fn<Promise<string | null>, unknown[]>(async () => 'notif-1');
const mockCancelReminderNotification = jest.fn<Promise<void>, unknown[]>(async () => undefined);
jest.mock('../notifications/reminderNotifications', () => ({
  configureNotificationHandler: jest.fn(),
  configureAdherenceCategory: jest.fn(),
  scheduleReminderNotification: (...args: unknown[]) => mockScheduleReminderNotification(...args),
  cancelReminderNotification: (...args: unknown[]) => mockCancelReminderNotification(...args),
}));

const mockSecureStorageData = new Map<string, string>();
jest.mock('../storage/secureStorage', () => ({
  secureStorage: {
    getItem: jest.fn(async (key: string) => mockSecureStorageData.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockSecureStorageData.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockSecureStorageData.delete(key);
    }),
  },
}));

const mockFetchCloudReminders = jest.fn<Promise<{ reminders: unknown[] }>, unknown[]>(async () => ({ reminders: [] }));
const mockSyncCloudReminders = jest.fn<Promise<{ reminders: unknown[] }>, unknown[]>(async () => ({ reminders: [] }));
jest.mock('../api/client', () => ({
  fetchCloudReminders: (...args: unknown[]) => mockFetchCloudReminders(...args),
  syncCloudReminders: (...args: unknown[]) => mockSyncCloudReminders(...args),
}));

jest.mock('./AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', loading: false }),
}));

jest.mock('./LocaleContext', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

function renderReminders() {
  return renderHook(() => useReminders(), {
    wrapper: ({ children }) => <RemindersProvider>{children}</RemindersProvider>,
  });
}

describe('RemindersContext', () => {
  beforeEach(() => {
    mockSecureStorageData.clear();
    mockScheduleReminderNotification.mockClear();
    mockCancelReminderNotification.mockClear();
    mockFetchCloudReminders.mockClear();
    mockSyncCloudReminders.mockClear();
  });

  it('addReminder schedules a notification, stores the reminder enabled, and syncs to the cloud', async () => {
    const { result } = renderReminders();
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: Awaited<ReturnType<typeof result.current.addReminder>> | undefined;
    await act(async () => {
      created = await result.current.addReminder({ category: 'medicine', title: 'Aspirin', time: '08:00' });
    });

    expect(created?.enabled).toBe(true);
    expect(created?.notificationId).toBe('notif-1');
    expect(result.current.reminders).toHaveLength(1);
    expect(result.current.reminders[0].title).toBe('Aspirin');
    expect(mockScheduleReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockSyncCloudReminders).toHaveBeenCalledWith('test-token', result.current.reminders);
  });

  it('toggleReminder(false) cancels the notification and clears notificationId; toggleReminder(true) reschedules it', async () => {
    const { result } = renderReminders();
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: Awaited<ReturnType<typeof result.current.addReminder>> | undefined;
    await act(async () => {
      created = await result.current.addReminder({ category: 'medicine', title: 'Aspirin', time: '08:00' });
    });

    await act(async () => {
      await result.current.toggleReminder(created!.id, false);
    });
    expect(result.current.reminders[0].enabled).toBe(false);
    expect(result.current.reminders[0].notificationId).toBeNull();
    expect(mockCancelReminderNotification).toHaveBeenCalledWith('notif-1');

    await act(async () => {
      await result.current.toggleReminder(created!.id, true);
    });
    expect(result.current.reminders[0].enabled).toBe(true);
    expect(result.current.reminders[0].notificationId).toBe('notif-1');
    expect(mockScheduleReminderNotification).toHaveBeenCalledTimes(2);
  });

  it('deleteReminder cancels the notification and removes the reminder from the list', async () => {
    const { result } = renderReminders();
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: Awaited<ReturnType<typeof result.current.addReminder>> | undefined;
    await act(async () => {
      created = await result.current.addReminder({ category: 'water', title: 'Drink water', time: '12:00' });
    });
    expect(result.current.reminders).toHaveLength(1);

    await act(async () => {
      await result.current.deleteReminder(created!.id);
    });

    expect(result.current.reminders).toHaveLength(0);
    expect(mockCancelReminderNotification).toHaveBeenCalledWith('notif-1');
  });
});
