import { inferSessions, formatDurationParts } from './sleep';
import type { SleepSample } from '../sleep/sleepSampling';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const STEP = 30 * MINUTE; // well within the 45-minute gap tolerance

function moving(at: number): SleepSample {
  return { at, still: false };
}

// A contiguous still run sampled every STEP ms from start to end (inclusive),
// mirroring how the background task actually samples over time.
function stillRun(start: number, end: number): SleepSample[] {
  const samples: SleepSample[] = [];
  for (let t = start; t < end; t += STEP) samples.push({ at: t, still: true });
  samples.push({ at: end, still: true });
  return samples;
}

describe('inferSessions', () => {
  test('empty input yields no sessions', () => {
    expect(inferSessions([])).toEqual([]);
  });

  test('a still run of 3+ hours becomes one session', () => {
    const start = 0;
    const end = 4 * HOUR;
    const sessions = inferSessions(stillRun(start, end));
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toEqual({ start, end, durationMs: end - start });
  });

  test('a still run shorter than 3 hours is dropped', () => {
    expect(inferSessions(stillRun(0, 2 * HOUR))).toEqual([]);
  });

  test('a gap of exactly 45 minutes does not split a session', () => {
    const firstEnd = 3 * HOUR;
    const secondStart = firstEnd + 45 * MINUTE;
    const secondEnd = secondStart + 3 * HOUR;
    const samples = [...stillRun(0, firstEnd), ...stillRun(secondStart, secondEnd)];
    const sessions = inferSessions(samples);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].start).toBe(0);
    expect(sessions[0].end).toBe(secondEnd);
  });

  test('a gap of more than 45 minutes splits into separate runs', () => {
    const firstEnd = 3 * HOUR;
    const secondStart = firstEnd + 46 * MINUTE;
    const secondEnd = secondStart + 3 * HOUR;
    const samples = [...stillRun(0, firstEnd), ...stillRun(secondStart, secondEnd)];
    const sessions = inferSessions(samples);
    expect(sessions).toHaveLength(2);
  });

  test('a non-still sample ends the current run', () => {
    // First run (0 - 2h) is only 2h, dropped. Second run (3h - 6h) is 3h, kept.
    const samples = [...stillRun(0, 2 * HOUR), moving(2 * HOUR + MINUTE), ...stillRun(3 * HOUR, 6 * HOUR)];
    const sessions = inferSessions(samples);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toEqual({ start: 3 * HOUR, end: 6 * HOUR, durationMs: 3 * HOUR });
  });

  test('multiple sessions are sorted most-recent-first', () => {
    const samples = [
      ...stillRun(0, 4 * HOUR),
      moving(4 * HOUR + MINUTE),
      ...stillRun(10 * HOUR, 14 * HOUR),
    ];
    const sessions = inferSessions(samples);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].start).toBe(10 * HOUR);
    expect(sessions[1].start).toBe(0);
  });

  test('samples are sorted internally, so out-of-order input still works', () => {
    const start = 0;
    const end = 4 * HOUR;
    const samples = [...stillRun(start, end)].reverse();
    const sessions = inferSessions(samples);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].start).toBe(start);
    expect(sessions[0].end).toBe(end);
  });
});

describe('formatDurationParts', () => {
  test('converts milliseconds to hours and minutes', () => {
    expect(formatDurationParts(0)).toEqual({ hours: 0, minutes: 0 });
    expect(formatDurationParts(90 * MINUTE)).toEqual({ hours: 1, minutes: 30 });
    expect(formatDurationParts(7 * HOUR + 15 * MINUTE)).toEqual({ hours: 7, minutes: 15 });
  });
});
