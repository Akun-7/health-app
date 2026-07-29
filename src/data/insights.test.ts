import { classify } from './insights';
import type { Measurement } from './measurements';

function bp(systolic: number, diastolic: number): Measurement {
  return { id: 't', type: 'bloodPressure', systolic, diastolic, createdAt: 0 };
}

function pulse(bpm: number): Measurement {
  return { id: 't', type: 'pulse', bpm, createdAt: 0 };
}

function spo2(percent: number): Measurement {
  return { id: 't', type: 'spo2', percent, createdAt: 0 };
}

describe('classify — bloodPressure', () => {
  test('normal reading is good', () => {
    expect(classify(bp(110, 70))).toBe('good');
  });

  test('elevated reading (120-139 / 80-89) is watch', () => {
    expect(classify(bp(120, 70))).toBe('watch');
    expect(classify(bp(110, 80))).toBe('watch');
    expect(classify(bp(139, 89))).toBe('watch');
  });

  test('high reading (>=140 / >=90) is concern', () => {
    expect(classify(bp(140, 70))).toBe('concern');
    expect(classify(bp(110, 90))).toBe('concern');
  });

  test('low reading (<90 / <60) is concern', () => {
    expect(classify(bp(89, 70))).toBe('concern');
    expect(classify(bp(110, 59))).toBe('concern');
  });

  test('boundary values are inclusive on the concern side', () => {
    expect(classify(bp(90, 60))).toBe('good');
    expect(classify(bp(89, 60))).toBe('concern');
    expect(classify(bp(90, 59))).toBe('concern');
  });
});

describe('classify — pulse', () => {
  test('normal range (60-100) is good', () => {
    expect(classify(pulse(60))).toBe('good');
    expect(classify(pulse(100))).toBe('good');
    expect(classify(pulse(80))).toBe('good');
  });

  test('watch range (50-59 or 101-110)', () => {
    expect(classify(pulse(50))).toBe('watch');
    expect(classify(pulse(59))).toBe('watch');
    expect(classify(pulse(101))).toBe('watch');
    expect(classify(pulse(110))).toBe('watch');
  });

  test('concern range (<50 or >110)', () => {
    expect(classify(pulse(49))).toBe('concern');
    expect(classify(pulse(111))).toBe('concern');
  });
});

describe('classify — spo2', () => {
  test('normal (>=95) is good', () => {
    expect(classify(spo2(95))).toBe('good');
    expect(classify(spo2(100))).toBe('good');
  });

  test('watch range (90-94)', () => {
    expect(classify(spo2(90))).toBe('watch');
    expect(classify(spo2(94))).toBe('watch');
  });

  test('concern (<90)', () => {
    expect(classify(spo2(89))).toBe('concern');
    expect(classify(spo2(0))).toBe('concern');
  });
});
