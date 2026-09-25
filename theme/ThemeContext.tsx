import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { fontSizes, palette, spacing, type Palette } from './tokens';

interface Theme {
  palette: Palette;
  colorScheme: 'light' | 'dark';
}

interface ThemeValues extends Theme {
  spacing: typeof spacing;
  fontSizes: typeof fontSizes;
}

const ThemeContext = createContext<ThemeValues | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();

  const value = useMemo<ThemeValues>(
    () => ({
      palette: colorScheme === 'dark' ? palette.dark : palette.light,
      colorScheme: colorScheme === 'dark' ? 'dark' : 'light',
      spacing,
      fontSizes,
    }),
    [colorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValues {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return theme;
}
