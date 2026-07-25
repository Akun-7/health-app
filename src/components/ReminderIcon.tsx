import { IconPill, IconHeartbeat, IconGlassFull, IconRun } from '@tabler/icons-react-native';
import type { ReminderCategory } from '../data/reminders';

type Props = {
  category: ReminderCategory;
  size: number;
  color: string;
};

export default function ReminderIcon({ category, size, color }: Props) {
  if (category === 'medicine') return <IconPill size={size} color={color} />;
  if (category === 'measurement') return <IconHeartbeat size={size} color={color} />;
  if (category === 'water') return <IconGlassFull size={size} color={color} />;
  return <IconRun size={size} color={color} />;
}
