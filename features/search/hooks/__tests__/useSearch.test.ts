import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/lib/logger';

import type { SearchResultItem } from '../../api/searchRepository';
import { searchVerses } from '../../api/searchRepository';
import { useSearch } from '../useSearch';

jest.mock('../../api/searchRepository', () => ({
  searchVerses: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: jest.fn(),
}));

const mockUseSQLiteContext = jest.mocked(useSQLiteContext);
const mockSearchVerses = jest.mocked(searchVerses);

const DB = { name: 'stub.db' } as unknown as SQLiteDatabase;

const RESULTS: SearchResultItem[] = [
  {
    verseId: 1,
    bookUniversalId: 1,
    bookShortTitle: 'Gen',
    chapter: 1,
    verseNumber: 1,
    snippet: 'In the beginning',
  },
];

describe('useSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseSQLiteContext.mockReturnValue(DB);
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('stays idle for a query below the minimum length', async () => {
    const { result } = await renderHook(() => useSearch('a', 'syn'));

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.results).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockSearchVerses).not.toHaveBeenCalled();
  });

  it('debounces the query before searching', async () => {
    let resolveSearch: (results: SearchResultItem[]) => void = () => {};
    mockSearchVerses.mockImplementation(
      () =>
        new Promise<SearchResultItem[]>((resolve) => {
          resolveSearch = resolve;
        }),
    );

    const { result } = await renderHook(() => useSearch('love', 'syn'));

    await act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(mockSearchVerses).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(mockSearchVerses).toHaveBeenCalledTimes(1);
    expect(mockSearchVerses).toHaveBeenCalledWith(DB, 'syn', '"love"*');
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSearch(RESULTS);
    });

    expect(result.current.results).toEqual(RESULTS);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('cancels the pending debounce when the query changes', async () => {
    mockSearchVerses.mockResolvedValue(RESULTS);

    const { rerender } = await renderHook(
      ({ query }: { query: string }) => useSearch(query, 'syn'),
      { initialProps: { query: 'lov' } },
    );

    await rerender({ query: 'love' });

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSearchVerses).toHaveBeenCalledTimes(1);
    expect(mockSearchVerses).toHaveBeenCalledWith(DB, 'syn', '"love"*');
  });

  it('reruns the search when reloadKey changes', async () => {
    mockSearchVerses.mockResolvedValue(RESULTS);

    const { rerender } = await renderHook(
      ({ reloadKey }: { reloadKey: number }) => useSearch('love', 'syn', reloadKey),
      { initialProps: { reloadKey: 0 } },
    );

    await act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(mockSearchVerses).toHaveBeenCalledTimes(1);

    await rerender({ reloadKey: 1 });

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSearchVerses).toHaveBeenCalledTimes(2);
  });

  it('exposes search errors', async () => {
    mockSearchVerses.mockRejectedValue(new Error('fts broken'));

    const { result } = await renderHook(() => useSearch('love', 'syn'));

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {});

    expect(result.current.error?.message).toBe('fts broken');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      'useSearch',
      'Failed to search verses',
      expect.objectContaining({ message: 'fts broken' }),
    );
  });
});
