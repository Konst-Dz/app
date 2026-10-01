import { useCallback, useEffect, useState } from 'react';

import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import { getLastReadPosition, type ReadingPosition } from '../api/historyRepository';
import { useUserDataDatabase } from './useUserDataDatabase';

interface LastReadPositionState {
  position: ReadingPosition | null;
  isLoading: boolean;
  error: Error | null;
}

export interface LastReadPositionResult extends LastReadPositionState {
  refresh: () => void;
}

export function useLastReadPosition(): LastReadPositionResult {
  const { database, isLoading: isDatabaseLoading, error: databaseError } = useUserDataDatabase();
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!database) {
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    logger.debug('useLastReadPosition', 'Loading last read position');

    getLastReadPosition(database)
      .then((item) => {
        if (cancelled) {
          return;
        }
        setPosition(item);
        setIsLoading(false);
        setError(null);
        logger.debug('useLastReadPosition', 'Last read position ready', {
          found: item !== null,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const loadError = toError(cause);
        setPosition(null);
        setIsLoading(false);
        setError(loadError);
        logger.error('useLastReadPosition', 'Failed to load last read position', {
          message: loadError.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [database, reloadKey]);

  const refresh = useCallback(() => {
    logger.debug('useLastReadPosition', 'Refreshing last read position');
    setReloadKey((key) => key + 1);
  }, []);

  return {
    position,
    isLoading: isLoading || isDatabaseLoading,
    error: databaseError ?? error,
    refresh,
  };
}
