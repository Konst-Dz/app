import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_TRANSLATION } from '@/db/content';
import { getUserDatabase } from '@/db/userData';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import {
  getSelectedTranslationCode,
  setSelectedTranslationCode,
  type AvailableTranslation,
} from '../api/settingsRepository';
import { TranslationContext } from '../hooks/useSelectedTranslation';

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [translationCode, setTranslationCode] =
    useState<string>(DEFAULT_TRANSLATION);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    logger.debug('TranslationProvider', 'Loading selected translation');
    getUserDatabase()
      .then((db) => getSelectedTranslationCode(db))
      .then((code) => {
        if (cancelled) {
          return;
        }
        setTranslationCode(code);
        setIsLoaded(true);
        logger.info('TranslationProvider', 'Selected translation loaded', {
          translationCode: code,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        setIsLoaded(true);
        logger.warn(
          'TranslationProvider',
          'Failed to load selected translation, using default',
          {
            translationCode: DEFAULT_TRANSLATION,
            message: toError(cause).message,
          },
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const changeTranslation = useCallback(async (code: AvailableTranslation) => {
    const db = await getUserDatabase();
    await setSelectedTranslationCode(db, code);
    setTranslationCode(code);
    logger.info('TranslationProvider', 'Translation changed', {
      translationCode: code,
    });
  }, []);

  const value = useMemo(
    () => ({
      translationCode,
      isLoaded,
      setTranslationCode: changeTranslation,
    }),
    [translationCode, isLoaded, changeTranslation],
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}
