import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';

import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import { searchVerses, type SearchResultItem } from '../api/searchRepository';
import { buildMatchExpression } from '../lib/query';

const SEARCH_DEBOUNCE_MS = 300;

interface SearchState {
  query: string;
  reloadKey: number;
  results: SearchResultItem[] | null;
  isLoading: boolean;
  error: Error | null;
}

const IDLE_STATE: SearchState = {
  query: '',
  reloadKey: 0,
  results: null,
  isLoading: false,
  error: null,
};

export function useSearch(
  query: string,
  translationCode: string,
  reloadKey: number = 0,
): SearchState {
  const db = useSQLiteContext();
  const matchExpression = useMemo(() => buildMatchExpression(query), [query]);
  const [state, setState] = useState<SearchState>(IDLE_STATE);

  useEffect(() => {
    if (matchExpression === null) {
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setState({
        query,
        reloadKey,
        results: null,
        isLoading: true,
        error: null,
      });
      logger.debug('useSearch', 'Search started', {
        queryLength: query.length,
        translationCode,
        debounceMs: SEARCH_DEBOUNCE_MS,
      });
      searchVerses(db, translationCode, matchExpression)
        .then((results) => {
          if (cancelled) {
            return;
          }
          setState({
            query,
            reloadKey,
            results,
            isLoading: false,
            error: null,
          });
          logger.debug('useSearch', 'Search results ready', {
            count: results.length,
          });
        })
        .catch((cause: unknown) => {
          if (cancelled) {
            return;
          }
          const error = toError(cause);
          setState({
            query,
            reloadKey,
            results: null,
            isLoading: false,
            error,
          });
          logger.error('useSearch', 'Failed to search verses', {
            queryLength: query.length,
            message: error.message,
          });
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [db, matchExpression, query, reloadKey, translationCode]);

  if (matchExpression === null) {
    return IDLE_STATE;
  }
  if (state.query !== query || state.reloadKey !== reloadKey) {
    return IDLE_STATE;
  }
  return state;
}
