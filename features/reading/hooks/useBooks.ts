import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import type { Book } from '@/db/models';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import { getBooks } from '../api/readingRepository';

interface BooksState {
  books: Book[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useBooks(translationCode: string, reloadKey: number = 0): BooksState {
  const db = useSQLiteContext();
  const [state, setState] = useState<BooksState>({
    books: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ books: null, isLoading: true, error: null });
    logger.debug('useBooks', 'Loading books', { translationCode });

    getBooks(db, translationCode)
      .then((books) => {
        if (cancelled) {
          return;
        }
        setState({ books, isLoading: false, error: null });
        logger.debug('useBooks', 'Books ready', {
          translationCode,
          count: books.length,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const error = toError(cause);
        setState({ books: null, isLoading: false, error });
        logger.error('useBooks', 'Failed to load books', {
          translationCode,
          message: error.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [db, translationCode, reloadKey]);

  return state;
}
