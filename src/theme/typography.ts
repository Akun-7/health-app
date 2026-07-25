// Шрифт үй-бүлөсү: Sans-serif (Inter / SF Pro / System UI)
// Эки гана салмак: 400 (Regular) жана 500 (Medium). Bold колдонулбайт.

export const fontFamily = 'System';

export const weight = {
  regular: '400' as const,
  medium: '500' as const,
};

export const typography = {
  h1: { fontSize: 22, fontWeight: weight.medium, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: weight.medium, lineHeight: 24 },
  h3: { fontSize: 16, fontWeight: weight.medium, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: weight.regular, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: weight.regular, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: weight.regular, lineHeight: 14 }, // Жеткиликтүүлүк: минимум чек
};

export type TypographyTokens = typeof typography;
