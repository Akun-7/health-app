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
  // Dashboard/gauge-only tokens (Elev8-style redesign, 2026-08-04). Kept
  // separate from surface/pageBackground so the rest of the app's screens
  // are unaffected — only DashboardScreen/VitalCard/CircularGauge use these.
  dashboardBackground: '#EEF3FB',
  cardElevated: '#FFFFFF',
  gaugeTrack: '#DCE6F2',
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
  // Deliberately a cooler navy, distinct from the app's warm-neutral dark
  // palette above — matches the reference design (Elev8 Pro) for the
  // Dashboard specifically, per user request.
  dashboardBackground: '#0E1B33',
  cardElevated: '#1C2C4C',
  gaugeTrack: '#2B3D63',
};

// Улгайган/начар көрүүчү колдонуучулар үчүн "Жогорку контраст" режими: тонго
// боёлгон (pastel) фондор алынып салынат (алар негизги/семантикалык
// текст менен WCAG AA чегине (4.5:1) жетпейт — мис. кадимки dangerBg
// үстүндөгү danger fg ~2.8:1), анын ордуна таза ак/кара фон + так так
// текст/чек ара колдонулат. Семантикалык маани дагы деле иконка/текст
// боюнча айырмаланат (түс менен гана эмес), MedicalDisclaimer'деги
// эрежеге дал келет.
export const lightHighContrast = {
  textPrimary: '#000000',
  textSecondary: '#1A1A1A',
  textMuted: '#444444',
  border: '#000000',
  surface: '#FFFFFF',
  pageBackground: '#FFFFFF',
  onPrimary: '#FFFFFF',
  primary: '#0C447C',
  primaryDark: '#062A4D',
  primaryLight: '#D6E7F7',
  danger: '#B00020',
  dangerBg: '#FFFFFF',
  warning: '#8A5A00',
  warningBg: '#FFFFFF',
  success: '#2E5E0A',
  successBg: '#FFFFFF',
  // High contrast always wins over the Dashboard's decorative navy/tint —
  // stays plain white with a black track so the gauge/cards keep the same
  // WCAG guarantees as the rest of high-contrast mode.
  dashboardBackground: '#FFFFFF',
  cardElevated: '#FFFFFF',
  gaugeTrack: '#000000',
};

export const darkHighContrast = {
  textPrimary: '#FFFFFF',
  textSecondary: '#F0F0F0',
  textMuted: '#CFCFCF',
  border: '#FFFFFF',
  surface: '#000000',
  pageBackground: '#000000',
  onPrimary: '#000000',
  primary: '#66B2FF',
  primaryDark: '#3E85C7',
  primaryLight: '#001B33',
  danger: '#FF6659',
  dangerBg: '#000000',
  warning: '#FFC24B',
  warningBg: '#000000',
  success: '#8BD44C',
  successBg: '#000000',
  dashboardBackground: '#000000',
  cardElevated: '#000000',
  gaugeTrack: '#FFFFFF',
};

export type ColorTokens = typeof light;
