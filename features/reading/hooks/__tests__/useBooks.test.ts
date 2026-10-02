import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Book } from '@/db/models';
import { logger } from '@/lib/logger';

import { getBooks } from '../../api/readingRepository';
import { useBooks } from '../useBooks';

jest.mock('../../api/readingRepository', () => ({
  getBooks: jest.fn(),
  getBook: jest.fn(),
  getVerses: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: jest.fn(),
}));

const mockUseSQLiteContext = jest.mocked(useSQLiteContext);
const mockGetBooks = jest.mocked(getBooks);

const DB = { name: 'stub.db' } as unknown as SQLiteDatabase;

const BOOKS: Book[] = [
  {
    id: 42,
    translationId: 1,
    universalId: 1,
    orderNum: 1,
    title: 'Genesis',
    shortTitle: 'Gen',
    chapterCount: 50,
    canonical: true,
  },
];

describe('useBooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSQLiteContext.mockReturnValue(DB);
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads books for the translation', async () => {
    mockGetBooks.mockResolvedValue(BOOKS);

    const { result } = await renderHook(() => useBooks('syn'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.books).toEqual(BOOKS);
    expect(result.current.error).toBeNull();
    expect(mockGetBooks).toHaveBeenCalledWith(DB, 'syn');
  });

  it('exposes repository errors', async () => {
    mockGetBooks.mockRejectedValue(new Error('db locked'));

    const { result } = await renderHook(() => useBooks('syn'));

    await waitFor(() =>
      expect(result.current.error?.message).toBe('db locked'),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.books).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      'useBooks',
      'Failed to load books',
      expect.objectContaining({ message: 'db locked' }),
    );
  });

  it('refetches when reloadKey changes', async () => {
    mockGetBooks.mockResolvedValue(BOOKS);

    const { result, rerender } = await renderHook(
      ({ reloadKey }: { reloadKey: number }) => useBooks('syn', reloadKey),
      { initialProps: { reloadKey: 0 } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await rerender({ reloadKey: 1 });

    await waitFor(() => expect(mockGetBooks).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.books).toEqual(BOOKS);
  });
});
