import { useCallback, useEffect, useState } from 'react';

import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import {
  getBookmarkedVerseNumbers,
  toggleBookmark,
} from '../api/bookmarksRepository';
import { useUserDataDatabase } from './useUserDataDatabase';

interface BookmarkedVersesState {
  verseNumbers: Set<number>;
  isLoading: boolean;
  error: Error | null;
}

export interface BookmarkedVersesResult extends BookmarkedVersesState {
  toggleVerse: (verseNumber: number) => Promise<void>;
}

function isValidChapterParams(bookUniversalId: number, chapter: number): boolean {
  return (
    Number.isInteger(bookUniversalId) &&
    bookUniversalId > 0 &&
    Number.isInteger(chapter) &&
    chapter > 0
  );
}

export function useBookmarkedVerses(
  bookUniversalId: number,
  chapter: number,
): BookmarkedVersesResult {
  const { database, isLoading: isDatabaseLoading, error: databaseError } = useUserDataDatabase();
  const [verseNumbers, setVerseNumbers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!database) {
      return undefined;
    }
    if (!isValidChapterParams(bookUniversalId, chapter)) {
      logger.warn('useBookmarkedVerses', 'Invalid chapter params', {
        bookUniversalId,
        chapter,
      });
      setVerseNumbers(new Set());
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    logger.debug('useBookmarkedVerses', 'Loading bookmarked verses', {
      bookUniversalId,
      chapter,
    });

    getBookmarkedVerseNumbers(database, bookUniversalId, chapter)
      .then((numbers) => {
        if (cancelled) {
          return;
        }
        setVerseNumbers(new Set(numbers));
        setIsLoading(false);
        setError(null);
        logger.debug('useBookmarkedVerses', 'Bookmarked verses ready', {
          count: numbers.length,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const loadError = toError(cause);
        setError(loadError);
        setIsLoading(false);
        logger.error('useBookmarkedVerses', 'Failed to load bookmarked verses', {
          bookUniversalId,
          chapter,
          message: loadError.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [database, bookUniversalId, chapter, reloadKey]);

  const toggleVerse = useCallback(
    async (verseNumber: number) => {
      if (!database) {
        logger.warn('useBookmarkedVerses', 'Toggle skipped, database is not ready', {
          bookUniversalId,
          chapter,
          verseNumber,
        });
        return;
      }

      setVerseNumbers((current) => {
        const next = new Set(current);
        if (next.has(verseNumber)) {
          next.delete(verseNumber);
        } else {
          next.add(verseNumber);
        }
        return next;
      });
      logger.debug('useBookmarkedVerses', 'Toggling bookmark', {
        bookUniversalId,
        chapter,
        verseNumber,
      });

      try {
        await toggleBookmark(database, bookUniversalId, chapter, verseNumber);
      } catch (cause) {
        const toggleError = toError(cause);
        setError(toggleError);
        setReloadKey((key) => key + 1);
        logger.error('useBookmarkedVerses', 'Failed to toggle bookmark', {
          bookUniversalId,
          chapter,
          verseNumber,
          message: toggleError.message,
        });
      }
    },
    [database, bookUniversalId, chapter],
  );

  return {
    verseNumbers,
    isLoading: isLoading || isDatabaseLoading,
    error: databaseError ?? error,
    toggleVerse,
  };
}
