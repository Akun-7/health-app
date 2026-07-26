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

const ADHERENCE_CATEGORY = 'reminder-adherence';
let adherenceCategoryConfigured = false;

// Lets the user tap "Taken"/"Skip" directly on the notification, without
// opening the app. Only needs configuring once per app session.
export async function configureAdherenceCategory(takenLabel: string, skipLabel: string) {
  if (Platform.OS === 'web' || adherenceCategoryConfigured) return;
  adherenceCategoryConfigured = true;
  await Notifications.setNotificationCategoryAsync(ADHERENCE_CATEGORY, [
    { identifier: 'taken', buttonTitle: takenLabel, options: { opensAppToForeground: false } },
    { identifier: 'skip', buttonTitle: skipLabel, options: { opensAppToForeground: false } },
  ]);
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
  reminder: { id: string; title: string; time: string },
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
      data: { reminderId: reminder.id },
      categoryIdentifier: ADHERENCE_CATEGORY,
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
