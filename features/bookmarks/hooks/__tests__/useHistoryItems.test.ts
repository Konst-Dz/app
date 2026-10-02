import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/lib/logger';

import type { ReadingPosition } from '../../api/historyRepository';
import { getBookShortTitle } from '../../api/verseReferenceRepository';
import { useHistoryItems } from '../useHistoryItems';

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

const mockGetBookShortTitle = jest.mocked(getBookShortTitle);

const DB = {} as SQLiteDatabase;

const POSITION: ReadingPosition = {
  bookUniversalId: 1,
  chapter: 3,
  openedAt: 2000,
};

const POSITIONS = [POSITION];
const EMPTY_POSITIONS: ReadingPosition[] = [];

describe('useHistoryItems', () => {
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
      useHistoryItems(DB, POSITIONS, false),
    );

    expect(result.current.items).toEqual([]);
    expect(result.current.isReady).toBe(false);
    expect(mockGetBookShortTitle).not.toHaveBeenCalled();
  });

  it('is not ready without a database', async () => {
    const { result } = await renderHook(() =>
      useHistoryItems(null, POSITIONS, true),
    );

    expect(result.current.isReady).toBe(false);
    expect(mockGetBookShortTitle).not.toHaveBeenCalled();
  });

  it('is not ready without positions', async () => {
    const { result } = await renderHook(() =>
      useHistoryItems(DB, null, true),
    );

    expect(result.current.isReady).toBe(false);
    expect(mockGetBookShortTitle).not.toHaveBeenCalled();
  });

  it('is ready with an empty history', async () => {
    const { result } = await renderHook(() => useHistoryItems(DB, EMPTY_POSITIONS, true));

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.items).toEqual([]);
  });

  it('enriches positions with book titles', async () => {
    mockGetBookShortTitle.mockResolvedValue('Быт');

    const { result } = await renderHook(() =>
      useHistoryItems(DB, POSITIONS, true),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.items).toEqual([
      {
        key: '1-3',
        reference: 'Быт 3',
        position: POSITION,
      },
    ]);
    expect(mockGetBookShortTitle).toHaveBeenCalledWith(DB, 'syn', 1);
  });

  it('falls back when the book is not found', async () => {
    mockGetBookShortTitle.mockResolvedValue(null);

    const { result } = await renderHook(() =>
      useHistoryItems(DB, POSITIONS, true),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.items).toEqual([
      {
        key: '1-3',
        reference: 'Книга 1 3',
        position: POSITION,
      },
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      'useHistoryItems',
      'Book not found for history entry',
      expect.anything(),
    );
  });

  it('falls back when the lookup fails', async () => {
    mockGetBookShortTitle.mockRejectedValue(new Error('db locked'));

    const { result } = await renderHook(() =>
      useHistoryItems(DB, POSITIONS, true),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.items).toEqual([
      {
        key: '1-3',
        reference: 'Книга 1 3',
        position: POSITION,
      },
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      'useHistoryItems',
      'Failed to resolve book title',
      expect.objectContaining({ message: 'db locked' }),
    );
  });
});
