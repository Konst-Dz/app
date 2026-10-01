import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import type { Footnote } from '@/db/models';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import {
  getFootnotesForChapter,
  groupFootnotesByVerse,
} from '../api/footnotesRepository';

interface ChapterFootnotesState {
  footnotesByVerseId: ReadonlyMap<number, Footnote[]> | null;
  isLoading: boolean;
  error: Error | null;
}

export function useChapterFootnotes(
  bookId: number | null,
  chapter: number,
): ChapterFootnotesState {
  const db = useSQLiteContext();
  const [state, setState] = useState<ChapterFootnotesState>({
    footnotesByVerseId: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (bookId === null || !Number.isInteger(chapter) || chapter <= 0) {
      setState({ footnotesByVerseId: null, isLoading: false, error: null });
      return;
    }

    setState({ footnotesByVerseId: null, isLoading: true, error: null });
    logger.debug('useChapterFootnotes', 'Loading chapter footnotes', {
      bookId,
      chapter,
    });

    getFootnotesForChapter(db, bookId, chapter)
      .then((footnotes) => {
        if (cancelled) {
          return;
        }
        setState({
          footnotesByVerseId: groupFootnotesByVerse(footnotes),
          isLoading: false,
          error: null,
        });
        logger.debug('useChapterFootnotes', 'Chapter footnotes ready', {
          bookId,
          chapter,
          footnoteCount: footnotes.length,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const error = toError(cause);
        setState({ footnotesByVerseId: null, isLoading: false, error });
        logger.error(
          'useChapterFootnotes',
          'Failed to load chapter footnotes',
          {
            bookId,
            chapter,
            message: error.message,
          },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [db, bookId, chapter]);

  return state;
}
