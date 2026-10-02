import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/lib/logger';

import type { Bookmark } from '../../api/bookmarksRepository';
import { getVerseReference } from '../../api/verseReferenceRepository';
import { useBookmarkItems } from '../useBookmarkItems';

jest.mock('@/features/settings', () => ({
  useSelectedTranslation: () => ({
    translationCode: 'syn',
    isLoaded: true,
    setTranslationCode: async () => {},
  }),
}));

jest.mock('../../api/verseReferenceRepository', () => ({
  getBookShortTitle: jest.fn(),
  getVerseReference: jest.fn(),
}));

const mockGetVerseReference = jest.mocked(getVerseReference);

const DB = {} as SQLiteDatabase;

const BOOKMARK: Bookmark = {
  id: 7,
  bookUniversalId: 1,
  chapter: 1,
  verseNumber: 1,
  createdAt: 1000,
};

const BOOKMARKS = [BOOKMARK];
const EMPTY_BOOKMARKS: Bookmark[] = [];

describe('useBookmarkItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is not ready while disabled', async () => {
    const { result } = await renderHook(() =>
      useBookmarkItems(DB, BOOKMARKS, false),
    );

    expect(result.current.items).toEqual([]);
    expect(result.current.isReady).toBe(false);
    expect(mockGetVerseReference).not.toHaveBeenCalled();
  });

  it('is not ready without a database', async () => {
    const { result } = await renderHook(() =>
      useBookmarkItems(null, BOOKMARKS, true),
    );

    expect(result.current.isReady).toBe(false);
    expect(mockGetVerseReference).not.toHaveBeenCalled();
  });

  it('is not ready without bookmarks', async () => {
    const { result } = await renderHook(() =>
      useBookmarkItems(DB, null, true),
    );

    expect(result.current.isReady).toBe(false);
    expect(mockGetVerseReference).not.toHaveBeenCalled();
  });

  it('is ready with an empty bookmark list', async () => {
    const { result } = await renderHook(() => useBookmarkItems(DB, EMPTY_BOOKMARKS, true));

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.items).toEqual([]);
  });

  it('enriches bookmarks with verse references', async () => {
    mockGetVerseReference.mockResolvedValue({
      shortTitle: 'Быт',
      text: 'В начале',
    });

    const { result } = await renderHook(() =>
      useBookmarkItems(DB, BOOKMARKS, true),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.items).toEqual([
      {
        key: '1-1-1',
        reference: 'Быт 1:1',
        text: 'В начале',
        bookmark: BOOKMARK,
      },
    ]);
    expect(mockGetVerseReference).toHaveBeenCalledWith(DB, 'syn', 1, 1, 1);
  });

  it('falls back when the verse is not found', async () => {
    mockGetVerseReference.mockResolvedValue(null);

    const { result } = await renderHook(() =>
      useBookmarkItems(DB, BOOKMARKS, true),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.items).toEqual([
      {
        key: '1-1-1',
        reference: 'Книга 1 1:1',
        text: null,
        bookmark: BOOKMARK,
      },
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      'useBookmarkItems',
      'Verse not found for bookmark',
      expect.anything(),
    );
  });

  it('falls back when the lookup fails', async () => {
    mockGetVerseReference.mockRejectedValue(new Error('db locked'));

    const { result } = await renderHook(() =>
      useBookmarkItems(DB, BOOKMARKS, true),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.items).toEqual([
      {
        key: '1-1-1',
        reference: 'Книга 1 1:1',
        text: null,
        bookmark: BOOKMARK,
      },
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      'useBookmarkItems',
      'Failed to resolve verse reference',
      expect.objectContaining({ message: 'db locked' }),
    );
  });
});
