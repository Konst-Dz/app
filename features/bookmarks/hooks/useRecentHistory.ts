import { useEffect, useState } from 'react';

import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import {
  DEFAULT_HISTORY_LIMIT,
  getRecentHistory,
  type ReadingPosition,
} from '../api/historyRepository';
import { useUserDataDatabase } from './useUserDataDatabase';

interface RecentHistoryState {
  positions: ReadingPosition[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useRecentHistory(limit: number = DEFAULT_HISTORY_LIMIT): RecentHistoryState {
  const { database, isLoading: isDatabaseLoading, error: databaseError } = useUserDataDatabase();
  const [positions, setPositions] = useState<ReadingPosition[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!database) {
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    logger.debug('useRecentHistory', 'Loading recent history', { limit });

    getRecentHistory(database, limit)
      .then((items) => {
        if (cancelled) {
          return;
        }
        setPositions(items);
        setIsLoading(false);
        setError(null);
        logger.debug('useRecentHistory', 'Recent history ready', { count: items.length });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const loadError = toError(cause);
        setPositions(null);
        setIsLoading(false);
        setError(loadError);
        logger.error('useRecentHistory', 'Failed to load recent history', {
          message: loadError.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [database, limit]);

  return {
    positions,
    isLoading: isLoading || isDatabaseLoading,
    error: databaseError ?? error,
  };
}
