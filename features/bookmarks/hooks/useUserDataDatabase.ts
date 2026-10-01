import { type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { getUserDatabase } from '@/db/userData';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export interface UserDatabaseState {
  database: SQLiteDatabase | null;
  isLoading: boolean;
  error: Error | null;
}

export function useUserDataDatabase(): UserDatabaseState {
  const [state, setState] = useState<UserDatabaseState>({
    database: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    logger.debug('useUserDataDatabase', 'Requesting user data database');

    getUserDatabase()
      .then((database) => {
        if (cancelled) {
          return;
        }
        setState({ database, isLoading: false, error: null });
        logger.debug('useUserDataDatabase', 'User data database ready');
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        const error = toError(cause);
        setState({ database: null, isLoading: false, error });
        logger.error('useUserDataDatabase', 'Failed to open user data database', {
          message: error.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
