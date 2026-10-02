import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { logger } from '@/lib/logger';
import {
  DEFAULT_READING_FONT_STEP_ID,
  DEFAULT_THEME_MODE,
  fontSizes,
  getReadingFontStep,
  palette,
  resolveColorScheme,
  spacing,
  type Palette,
  type ReadingFontStepId,
  type ThemeMode,
} from './tokens';

interface Theme {
  palette: Palette;
  colorScheme: 'light' | 'dark';
}

interface ThemeValues extends Theme {
  themeMode: ThemeMode;
  readingFontSize: number;
  readingLineHeight: number;
  spacing: typeof spacing;
  fontSizes: typeof fontSizes;
}

interface ThemeProviderProps {
  mode?: ThemeMode;
  readingFontStepId?: ReadingFontStepId;
  children: ReactNode;
}

const ThemeContext = createContext<ThemeValues | null>(null);

export function ThemeProvider({
  mode = DEFAULT_THEME_MODE,
  readingFontStepId = DEFAULT_READING_FONT_STEP_ID,
  children,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const previousAppearanceRef = useRef<string | null>(null);

  const value = useMemo<ThemeValues>(() => {
    const colorScheme = resolveColorScheme(mode, systemColorScheme);
    const readingFontStep = getReadingFontStep(readingFontStepId);
    return {
      palette: colorScheme === 'dark' ? palette.dark : palette.light,
      colorScheme,
      themeMode: mode,
      readingFontSize: readingFontStep.fontSize,
      readingLineHeight: readingFontStep.lineHeight,
      spacing,
      fontSizes,
    };
  }, [mode, readingFontStepId, systemColorScheme]);

  useEffect(() => {
    const appearanceKey = `${mode}|${readingFontStepId}`;
    if (previousAppearanceRef.current === appearanceKey) return;
    const isFirstRun = previousAppearanceRef.current === null;
    previousAppearanceRef.current = appearanceKey;
    if (isFirstRun) return;
    logger.info('ThemeProvider', 'Appearance changed', {
      themeMode: mode,
      readingFontStepId,
    });
  }, [mode, readingFontStepId]);

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
