import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';
import type { Tone } from '../data/measurements';

type Props = {
  value: number;
  min: number;
  max: number;
  unitLabel: string;
  statusLabel?: string;
  tone: Tone;
  size?: number;
};

// Progress-ring gauge (react-native-svg circle + strokeDasharray/-offset,
// rotated -90deg so the fill starts at 12 o'clock and grows clockwise) —
// no new native dependency, react-native-svg is already used by src/theme
// consumers elsewhere in the app (icons).
export default function CircularGauge({ value, min, max, unitLabel, statusLabel, tone, size = 140 }: Props) {
  const { colors, typography } = useTheme();
  const strokeWidth = Math.round(size * 0.09);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(max, Math.max(min, value));
  const fraction = max === min ? 0 : (clamped - min) / (max - min);
  const dashOffset = circumference * (1 - fraction);
  const center = size / 2;
  const toneColor = colors[tone];

  const angleRad = ((-90 + fraction * 360) * Math.PI) / 180;
  const markerX = center + radius * Math.cos(angleRad);
  const markerY = center + radius * Math.sin(angleRad);
  const markerRadius = Math.max(4, strokeWidth * 0.55);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.gaugeTrack} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={toneColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {fraction > 0 ? (
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={markerX} cy={markerY} r={markerRadius} fill={colors.cardElevated} stroke={toneColor} strokeWidth={2} />
        </Svg>
      ) : null}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>{Math.round(value)}</Text>
        <Text style={{ ...typography.small, color: colors.textMuted }}>{unitLabel}</Text>
        {statusLabel ? (
          <Text style={{ ...typography.caption, color: toneColor, marginTop: 2 }}>{statusLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}
