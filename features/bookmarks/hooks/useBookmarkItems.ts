import type { SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { DEFAULT_TRANSLATION } from '@/db/content';
import { logger } from '@/lib/logger';

import type { Bookmark } from '../api/bookmarksRepository';
import { getVerseReference } from '../api/verseReferenceRepository';

export interface BookmarkItem {
  key: string;
  reference: string;
  text: string | null;
  bookmark: Bookmark;
}

interface BookmarkItemsState {
  items: BookmarkItem[];
  isReady: boolean;
}

const FALLBACK_TITLE = 'Книга';

function toKey(bookmark: Bookmark): string {
  return `${bookmark.bookUniversalId}-${bookmark.chapter}-${bookmark.verseNumber}`;
}

function toFallbackReference(bookmark: Bookmark): string {
  return `${FALLBACK_TITLE} ${bookmark.bookUniversalId} ${bookmark.chapter}:${bookmark.verseNumber}`;
}

export function useBookmarkItems(
  db: SQLiteDatabase | null,
  bookmarks: Bookmark[] | null,
  enabled: boolean,
): BookmarkItemsState {
  const [state, setState] = useState<BookmarkItemsState>({ items: [], isReady: false });

  useEffect(() => {
    if (!enabled || !db || !bookmarks) {
      setState({ items: [], isReady: false });
      return undefined;
    }
    if (bookmarks.length === 0) {
      setState({ items: [], isReady: true });
      return undefined;
    }

    let cancelled = false;
    logger.debug('useBookmarkItems', 'Enriching bookmarks', { count: bookmarks.length });

    const lookups = bookmarks.map(async (bookmark): Promise<BookmarkItem> => {
      try {
        const reference = await getVerseReference(
          db,
          DEFAULT_TRANSLATION,
          bookmark.bookUniversalId,
          bookmark.chapter,
          bookmark.verseNumber,
        );
        if (!reference) {
          logger.warn('useBookmarkItems', 'Verse not found for bookmark', {
            bookUniversalId: bookmark.bookUniversalId,
            chapter: bookmark.chapter,
            verseNumber: bookmark.verseNumber,
          });
        }
        return {
          key: toKey(bookmark),
          reference: reference
            ? `${reference.shortTitle} ${bookmark.chapter}:${bookmark.verseNumber}`
            : toFallbackReference(bookmark),
          text: reference?.text ?? null,
          bookmark,
        };
      } catch (cause) {
        logger.warn('useBookmarkItems', 'Failed to resolve verse reference', {
          bookUniversalId: bookmark.bookUniversalId,
          message: cause instanceof Error ? cause.message : String(cause),
        });
        return {
          key: toKey(bookmark),
          reference: toFallbackReference(bookmark),
          text: null,
          bookmark,
        };
      }
    });

    Promise.all(lookups).then((items) => {
      if (cancelled) {
        return;
      }
      setState({ items, isReady: true });
      logger.debug('useBookmarkItems', 'Bookmarks enriched', { count: items.length });
    });

    return () => {
      cancelled = true;
    };
  }, [db, bookmarks, enabled]);

  return state;
}
