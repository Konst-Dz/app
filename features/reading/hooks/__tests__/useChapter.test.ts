import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Book, Verse } from '@/db/models';
import { logger } from '@/lib/logger';

import { getBook, getVerses } from '../../api/readingRepository';
import { useChapter } from '../useChapter';

jest.mock('../../api/readingRepository', () => ({
  getBooks: jest.fn(),
  getBook: jest.fn(),
  getVerses: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: jest.fn(),
}));

const mockUseSQLiteContext = jest.mocked(useSQLiteContext);
const mockGetBook = jest.mocked(getBook);
const mockGetVerses = jest.mocked(getVerses);

const DB = { name: 'stub.db' } as unknown as SQLiteDatabase;

const BOOK: Book = {
  id: 42,
  translationId: 1,
  universalId: 1,
  orderNum: 1,
  title: 'Genesis',
  shortTitle: 'Gen',
  chapterCount: 50,
  canonical: true,
};

const OTHER_BOOK: Book = { ...BOOK, id: 43, universalId: 2, title: 'Exodus' };

const VERSES: Verse[] = [
  { id: 1, bookId: 42, chapter: 1, number: 1, text: 'In the beginning' },
  { id: 2, bookId: 42, chapter: 1, number: 2, text: 'And the earth' },
];

describe('useChapter', () => {
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

  it('loads book and verses for valid params', async () => {
    mockGetBook.mockResolvedValue(BOOK);
    mockGetVerses.mockResolvedValue(VERSES);

    const { result } = await renderHook(() => useChapter('syn', 1, 1));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.book).toEqual(BOOK);
    expect(result.current.verses).toEqual(VERSES);
    expect(result.current.error).toBeNull();
    expect(mockGetBook).toHaveBeenCalledWith(DB, 'syn', 1);
    expect(mockGetVerses).toHaveBeenCalledWith(DB, BOOK.id, 1);
  });

  it('clears state with a warning for invalid params', async () => {
    const { result } = await renderHook(() => useChapter('', 0, 0));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.book).toBeNull();
    expect(result.current.verses).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockGetBook).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'useChapter',
      'Invalid chapter params',
      expect.anything(),
    );
  });

  it('resolves to an empty state when the book is not found', async () => {
    mockGetBook.mockResolvedValue(null);

    const { result } = await renderHook(() => useChapter('syn', 999, 1));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.book).toBeNull();
    expect(result.current.verses).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockGetVerses).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'useChapter',
      'Book not found',
      expect.anything(),
    );
  });

  it('exposes repository errors', async () => {
    mockGetBook.mockRejectedValue(new Error('db locked'));

    const { result } = await renderHook(() => useChapter('syn', 1, 1));

    await waitFor(() =>
      expect(result.current.error?.message).toBe('db locked'),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.book).toBeNull();
    expect(result.current.verses).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      'useChapter',
      'Failed to load chapter',
      expect.objectContaining({ message: 'db locked' }),
    );
  });

  it('keeps the state of the active params when a stale load settles', async () => {
    mockGetBook.mockImplementation((_db, code) =>
      code === 'syn'
        ? new Promise<Book>(() => {})
        : Promise.resolve(OTHER_BOOK),
    );
    mockGetVerses.mockResolvedValue([]);

    const { result, rerender } = await renderHook(
      ({ translationCode }: { translationCode: string }) => useChapter(translationCode, 1, 1),
      { initialProps: { translationCode: 'syn' } },
    );

    await rerender({ translationCode: 'kjv' });
    await act(async () => {});

    await waitFor(() => expect(result.current.book).toEqual(OTHER_BOOK));

    expect(result.current.error).toBeNull();
  });

  it('refetches when reloadKey changes', async () => {
    mockGetBook.mockResolvedValue(BOOK);
    mockGetVerses.mockResolvedValue(VERSES);

    const { result, rerender } = await renderHook(
      ({ reloadKey }: { reloadKey: number }) => useChapter('syn', 1, 1, reloadKey),
      { initialProps: { reloadKey: 0 } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await rerender({ reloadKey: 1 });

    await waitFor(() => expect(mockGetBook).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetVerses).toHaveBeenCalledTimes(2);
    expect(result.current.book).toEqual(BOOK);
    expect(result.current.verses).toEqual(VERSES);
  });
});
