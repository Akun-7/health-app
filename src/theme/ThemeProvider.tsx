import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, lightHighContrast, darkHighContrast, ColorTokens } from './colors';
import { buildTypography, TypographyTokens } from './typography';
import { spacing, SpacingTokens } from './spacing';
import { radii, sizes, RadiiTokens } from './radii';
import { useSettings } from '../context/SettingsContext';

// "Чоң тамга" режиминде бардык fontSize/lineHeight ушул эсеге чоңоют.
const LARGE_TEXT_SCALE = 1.25;

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: RadiiTokens;
  sizes: typeof sizes;
  highContrast: boolean;
  largeText: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(scheme: 'light' | 'dark', highContrast: boolean, largeText: boolean): Theme {
  const colors = highContrast ? (scheme === 'dark' ? darkHighContrast : lightHighContrast) : scheme === 'dark' ? dark : light;
  return {
    scheme,
    colors,
    typography: buildTypography(largeText ? LARGE_TEXT_SCALE : 1),
    spacing,
    radii,
    sizes,
    highContrast,
    largeText,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();
  const scheme =
    settings.themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : settings.themeMode;
  const theme = useMemo(
    () => buildTheme(scheme, settings.highContrast, settings.largeText),
    [scheme, settings.highContrast, settings.largeText]
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
