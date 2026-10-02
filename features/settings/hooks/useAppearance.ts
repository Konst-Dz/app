import { createContext, useContext } from 'react';

import type { ReadingFontStepId, ThemeMode } from '@/theme/tokens';

export interface AppearanceValues {
  themeMode: ThemeMode;
  readingFontStepId: ReadingFontStepId;
  isLoaded: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setReadingFontStepId: (stepId: ReadingFontStepId) => Promise<void>;
}

export const AppearanceContext = createContext<AppearanceValues | null>(null);

export function useAppearance(): AppearanceValues {
  const appearance = useContext(AppearanceContext);

  if (!appearance) {
    throw new Error(
      'useAppearance must be used within AppearanceProvider',
    );
  }

  return appearance;
}
