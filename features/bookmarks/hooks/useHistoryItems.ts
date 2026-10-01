import type { SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { useSelectedTranslation } from '@/features/settings';
import { logger } from '@/lib/logger';

import type { ReadingPosition } from '../api/historyRepository';
import { getBookShortTitle } from '../api/verseReferenceRepository';

export interface HistoryItem {
  key: string;
  reference: string;
  position: ReadingPosition;
}

interface HistoryItemsState {
  items: HistoryItem[];
  isReady: boolean;
}

const FALLBACK_TITLE = 'Книга';

function toKey(position: ReadingPosition): string {
  return `${position.bookUniversalId}-${position.chapter}`;
}

function toFallbackReference(position: ReadingPosition): string {
  return `${FALLBACK_TITLE} ${position.bookUniversalId} ${position.chapter}`;
}

export function useHistoryItems(
  db: SQLiteDatabase | null,
  positions: ReadingPosition[] | null,
  enabled: boolean,
): HistoryItemsState {
  const { translationCode } = useSelectedTranslation();
  const [state, setState] = useState<HistoryItemsState>({
    items: [],
    isReady: false,
  });

  useEffect(() => {
    if (!enabled || !db || !positions) {
      setState({ items: [], isReady: false });
      return undefined;
    }
    if (positions.length === 0) {
      setState({ items: [], isReady: true });
      return undefined;
    }

    let cancelled = false;
    logger.debug('useHistoryItems', 'Enriching history', {
      count: positions.length,
    });

    const lookups = positions.map(async (position): Promise<HistoryItem> => {
      try {
        const shortTitle = await getBookShortTitle(
          db,
          translationCode,
          position.bookUniversalId,
        );
        if (!shortTitle) {
          logger.warn('useHistoryItems', 'Book not found for history entry', {
            bookUniversalId: position.bookUniversalId,
          });
        }
        return {
          key: toKey(position),
          reference: shortTitle
            ? `${shortTitle} ${position.chapter}`
            : toFallbackReference(position),
          position,
        };
      } catch (cause) {
        logger.warn('useHistoryItems', 'Failed to resolve book title', {
          bookUniversalId: position.bookUniversalId,
          message: cause instanceof Error ? cause.message : String(cause),
        });
        return {
          key: toKey(position),
          reference: toFallbackReference(position),
          position,
        };
      }
    });

    Promise.all(lookups).then((items) => {
      if (cancelled) {
        return;
      }
      setState({ items, isReady: true });
      logger.debug('useHistoryItems', 'History enriched', {
        count: items.length,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [db, positions, enabled, translationCode]);

  return state;
}
