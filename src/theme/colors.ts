// Дизайн система: dizayn-sistema.md (Ден соолук тиркемеси — MVP)

export const brand = {
  primary: '#185FA5',
  primaryDark: '#0C447C',
  primaryLight: '#E6F1FB',
};

export const semantic = {
  danger: '#E24B4A',
  dangerBg: '#FCEBEB',
  warning: '#EF9F27',
  warningBg: '#FAEEDA',
  success: '#639922',
  successBg: '#EAF3DE',
};

// Documentation only specifies the light-mode neutral palette. Dark-mode
// values below are derived to keep the same contrast ratios (text/bg
// swapped, semantic BG tints darkened) since "Dark mode милдеттүү" but no
// dark hex values were provided in dizayn-sistema.md.
export const light = {
  textPrimary: '#1A1A18',
  textSecondary: '#5F5E5A',
  textMuted: '#888780',
  border: '#E4E2D9',
  surface: '#FFFFFF',
  pageBackground: '#F1EFE8',
  onPrimary: '#FFFFFF',
  ...brand,
  ...semantic,
};

export const dark = {
  textPrimary: '#F1EFE8',
  textSecondary: '#B8B6AE',
  textMuted: '#83817A',
  border: '#3A3934',
  surface: '#232320',
  pageBackground: '#171715',
  onPrimary: '#FFFFFF',
  primary: '#3E85C7',
  primaryDark: '#185FA5',
  primaryLight: '#1B2E3E',
  danger: '#F0716F',
  dangerBg: '#3A2223',
  warning: '#F2B355',
  warningBg: '#3B2E17',
  success: '#8BC24A',
  successBg: '#243016',
};

export type ColorTokens = typeof light;
