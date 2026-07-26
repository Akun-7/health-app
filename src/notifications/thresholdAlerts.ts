import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

async function ensureAlertChannel(channelName: string) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('alerts', {
    name: channelName,
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// Fires immediately — does not request permission (that already happens via
// the reminders flow); if not yet granted, this silently no-ops rather than
// interrupting the user mid-measurement-entry with a permission prompt.
export async function sendThresholdAlert(title: string, body: string, channelName: string) {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  await ensureAlertChannel(channelName);
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
