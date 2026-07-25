import type { Measurement, MeasurementType } from './measurements';
import { formatMeasurementValue } from './measurements';
import type { TranslationKey } from '../i18n/ky';

const measurementTypes: MeasurementType[] = ['bloodPressure', 'pulse', 'spo2'];

export function buildSosMessage(
  measurements: Measurement[],
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  const latestByType = measurementTypes
    .map((type) => measurements.find((m) => m.type === type))
    .filter((m): m is Measurement => Boolean(m));

  const details = latestByType.length
    ? latestByType
        .map((m) => `${t(`measurement.${m.type}` as TranslationKey)}: ${formatMeasurementValue(m)}`)
        .join(', ')
    : t('sos.noMeasurements');

  return t('sos.message', { details });
}
