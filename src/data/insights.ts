import type { Measurement, MeasurementType, Tone } from './measurements';

export type InsightStatus = 'good' | 'watch' | 'concern';
export type InsightTrend = 'up' | 'down' | 'stable';

export type Insight = {
  type: MeasurementType;
  status: InsightStatus;
  trend: InsightTrend | null;
  latest: Measurement;
};

export const insightTone: Record<InsightStatus, Tone> = {
  good: 'success',
  watch: 'warning',
  concern: 'danger',
};

function classifyBloodPressure(systolic: number, diastolic: number): InsightStatus {
  if (systolic < 90 || diastolic < 60) return 'concern';
  if (systolic >= 140 || diastolic >= 90) return 'concern';
  if (systolic >= 120 || diastolic >= 80) return 'watch';
  return 'good';
}

function classifyPulse(bpm: number): InsightStatus {
  if (bpm < 50 || bpm > 110) return 'concern';
  if (bpm < 60 || bpm > 100) return 'watch';
  return 'good';
}

function classifySpo2(percent: number): InsightStatus {
  if (percent < 90) return 'concern';
  if (percent < 95) return 'watch';
  return 'good';
}

function classify(measurement: Measurement): InsightStatus {
  if (measurement.type === 'bloodPressure') return classifyBloodPressure(measurement.systolic, measurement.diastolic);
  if (measurement.type === 'pulse') return classifyPulse(measurement.bpm);
  return classifySpo2(measurement.percent);
}

function primaryValue(measurement: Measurement): number {
  if (measurement.type === 'bloodPressure') return measurement.systolic;
  if (measurement.type === 'pulse') return measurement.bpm;
  return measurement.percent;
}

function computeTrend(latest: number, previous: number): InsightTrend {
  if (latest === previous) return 'stable';
  return latest > previous ? 'up' : 'down';
}

const measurementTypes: MeasurementType[] = ['bloodPressure', 'pulse', 'spo2'];

export function computeInsights(measurements: Measurement[]): Insight[] {
  const insights: Insight[] = [];
  for (const type of measurementTypes) {
    const entries = measurements.filter((m) => m.type === type).sort((a, b) => b.createdAt - a.createdAt);
    if (entries.length === 0) continue;
    const [latest, previous] = entries;
    insights.push({
      type,
      status: classify(latest),
      trend: previous ? computeTrend(primaryValue(latest), primaryValue(previous)) : null,
      latest,
    });
  }
  return insights;
}
