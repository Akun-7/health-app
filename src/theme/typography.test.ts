import { buildTypography, typography } from './typography';

describe('buildTypography', () => {
  it('scale 1 matches the base typography tokens exactly', () => {
    expect(buildTypography(1)).toEqual(typography);
  });

  it('scales fontSize and lineHeight proportionally, rounding to whole pixels', () => {
    const scaled = buildTypography(1.25);
    expect(scaled.h1).toEqual({ fontSize: 28, fontWeight: typography.h1.fontWeight, lineHeight: 35 });
    expect(scaled.body).toEqual({ fontSize: 19, fontWeight: typography.body.fontWeight, lineHeight: 25 });
    expect(scaled.small).toEqual({ fontSize: 14, fontWeight: typography.small.fontWeight, lineHeight: 18 });
  });

  it('never changes fontWeight, only fontSize/lineHeight', () => {
    const scaled = buildTypography(1.25);
    for (const key of Object.keys(typography) as (keyof typeof typography)[]) {
      expect(scaled[key].fontWeight).toBe(typography[key].fontWeight);
    }
  });
});
