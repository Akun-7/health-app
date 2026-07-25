import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let handlerConfigured = false;

export function configureNotificationHandler() {
  if (Platform.OS === 'web' || handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannel(channelName: string) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: channelName,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export type ReminderPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getReminderPermissionStatus(): Promise<ReminderPermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestReminderPermissions(channelName: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureAndroidChannel(channelName);
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleReminderNotification(
  reminder: { title: string; time: string },
  labels: { categoryLabel: string; channelName: string }
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const granted = await requestReminderPermissions(labels.channelName);
  if (!granted) return null;

  const [hourStr, minuteStr] = reminder.time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title || labels.categoryLabel,
      body: labels.categoryLabel,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelReminderNotification(notificationId: string | null | undefined) {
  if (!notificationId || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
