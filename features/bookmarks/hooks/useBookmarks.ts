import { useCallback, useEffect, useState } from 'react';

import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import {
  getBookmarks,
  removeBookmark,
  type Bookmark,
} from '../api/bookmarksRepository';
import { useUserDataDatabase } from './useUserDataDatabase';

interface BookmarksState {
  bookmarks: Bookmark[] | null;
  isLoading: boolean;
  error: Error | null;
}

export interface BookmarksResult extends BookmarksState {
  toggle: (bookmark: Bookmark) => Promise<void>;
  refresh: () => void;
}

export function useBookmarks(): BookmarksResult {
  const { database, isLoading: isDatabaseLoading, error: databaseError } = useUserDataDatabase();
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!database) {
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    logger.debug('useBookmarks', 'Loading bookmarks');

    getBookmarks(database)
      .then((items) => {
        if (cancelled) {
          return;
        }
        setBookmarks(items);
        setIsLoading(false);
        setError(null);
        logger.debug('useBookmarks', 'Bookmarks ready', { count: items.length });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const loadError = toError(cause);
        setBookmarks(null);
        setIsLoading(false);
        setError(loadError);
        logger.error('useBookmarks', 'Failed to load bookmarks', {
          message: loadError.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [database, reloadKey]);

  const toggle = useCallback(
    async (bookmark: Bookmark) => {
      if (!database) {
        logger.warn('useBookmarks', 'Toggle skipped, database is not ready', {
          bookmarkId: bookmark.id,
        });
        return;
      }

      try {
        await removeBookmark(database, bookmark.bookUniversalId, bookmark.chapter, bookmark.verseNumber);
        setReloadKey((key) => key + 1);
      } catch (cause) {
        const toggleError = toError(cause);
        setError(toggleError);
        logger.error('useBookmarks', 'Failed to remove bookmark', {
          bookmarkId: bookmark.id,
          message: toggleError.message,
        });
      }
    },
    [database],
  );

  const refresh = useCallback(() => {
    logger.debug('useBookmarks', 'Refreshing bookmarks');
    setReloadKey((key) => key + 1);
  }, []);

  return {
    bookmarks,
    isLoading: isLoading || isDatabaseLoading,
    error: databaseError ?? error,
    toggle,
    refresh,
  };
}
