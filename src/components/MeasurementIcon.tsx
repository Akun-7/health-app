import { IconHeartbeat, IconDroplet, IconLungs } from '@tabler/icons-react-native';
import type { MeasurementType } from '../data/measurements';

type Props = {
  type: MeasurementType;
  size: number;
  color: string;
};

export default function MeasurementIcon({ type, size, color }: Props) {
  if (type === 'bloodPressure') return <IconHeartbeat size={size} color={color} />;
  if (type === 'pulse') return <IconDroplet size={size} color={color} />;
  return <IconLungs size={size} color={color} />;
}
