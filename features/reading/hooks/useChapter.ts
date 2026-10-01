import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import type { Book, Verse } from '@/db/models';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import { getBook, getVerses } from '../api/readingRepository';

interface ChapterState {
  book: Book | null;
  verses: Verse[] | null;
  isLoading: boolean;
  error: Error | null;
}

function isValidChapterParams(translationCode: string, universalId: number, chapter: number): boolean {
  if (translationCode.trim() === '') {
    return false;
  }
  if (!Number.isInteger(universalId) || universalId <= 0) {
    return false;
  }
  return Number.isInteger(chapter) && chapter > 0;
}

export function useChapter(
  translationCode: string,
  universalId: number,
  chapter: number,
  reloadKey: number = 0,
): ChapterState {
  const db = useSQLiteContext();
  const [state, setState] = useState<ChapterState>({
    book: null,
    verses: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!isValidChapterParams(translationCode, universalId, chapter)) {
      logger.warn('useChapter', 'Invalid chapter params', {
        translationCode,
        universalId,
        chapter,
      });
      setState({ book: null, verses: null, isLoading: false, error: null });
      return;
    }

    setState({ book: null, verses: null, isLoading: true, error: null });
    logger.debug('useChapter', 'Loading chapter', {
      translationCode,
      universalId,
      chapter,
    });

    getBook(db, translationCode, universalId)
      .then((book) => {
        if (cancelled) {
          return undefined;
        }
        if (!book) {
          setState({ book: null, verses: null, isLoading: false, error: null });
          logger.warn('useChapter', 'Book not found', {
            translationCode,
            universalId,
          });
          return undefined;
        }
        return getVerses(db, book.id, chapter).then((verses) => {
          if (cancelled) {
            return;
          }
          setState({ book, verses, isLoading: false, error: null });
          logger.debug('useChapter', 'Chapter ready', {
            bookId: book.id,
            chapter,
            verseCount: verses.length,
          });
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const error = toError(cause);
        setState({ book: null, verses: null, isLoading: false, error });
        logger.error('useChapter', 'Failed to load chapter', {
          translationCode,
          universalId,
          chapter,
          message: error.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [db, translationCode, universalId, chapter, reloadKey]);

  return state;
}
