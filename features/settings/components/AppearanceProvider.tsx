import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getUserDatabase } from '@/db/userData';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  DEFAULT_READING_FONT_STEP_ID,
  DEFAULT_THEME_MODE,
  type ReadingFontStepId,
  type ThemeMode,
} from '@/theme/tokens';

import {
  getReadingFontStepId,
  getThemeMode,
  setReadingFontStepId,
  setThemeMode,
} from '../api/settingsRepository';
import { AppearanceContext } from '../hooks/useAppearance';

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] =
    useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [readingFontStepId, setReadingFontStepIdState] =
    useState<ReadingFontStepId>(DEFAULT_READING_FONT_STEP_ID);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    logger.debug('AppearanceProvider', 'Loading appearance settings');
    getUserDatabase()
      .then((db) => Promise.all([getThemeMode(db), getReadingFontStepId(db)]))
      .then(([mode, stepId]) => {
        if (cancelled) {
          return;
        }
        setThemeModeState(mode);
        setReadingFontStepIdState(stepId);
        setIsLoaded(true);
        logger.info('AppearanceProvider', 'Appearance settings loaded', {
          themeMode: mode,
          readingFontStepId: stepId,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        setIsLoaded(true);
        logger.warn(
          'AppearanceProvider',
          'Failed to load appearance settings, using defaults',
          {
            themeMode: DEFAULT_THEME_MODE,
            readingFontStepId: DEFAULT_READING_FONT_STEP_ID,
            message: toError(cause).message,
          },
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const changeThemeMode = useCallback(async (mode: ThemeMode) => {
    const db = await getUserDatabase();
    await setThemeMode(db, mode);
    setThemeModeState(mode);
    logger.info('AppearanceProvider', 'Theme mode changed', {
      themeMode: mode,
    });
  }, []);

  const changeReadingFontStepId = useCallback(
    async (stepId: ReadingFontStepId) => {
      const db = await getUserDatabase();
      await setReadingFontStepId(db, stepId);
      setReadingFontStepIdState(stepId);
      logger.info('AppearanceProvider', 'Reading font size changed', {
        readingFontStepId: stepId,
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      themeMode,
      readingFontStepId,
      isLoaded,
      setThemeMode: changeThemeMode,
      setReadingFontStepId: changeReadingFontStepId,
    }),
    [
      themeMode,
      readingFontStepId,
      isLoaded,
      changeThemeMode,
      changeReadingFontStepId,
    ],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}
