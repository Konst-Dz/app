import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_HISTORY_LIMIT,
  MAX_HISTORY_LIMIT,
  getLastReadPosition,
  getRecentHistory,
  recordReadingPosition,
  type ReadingPosition,
} from '../historyRepository';
import { asDb, callsOf, createStubDb } from './stubDb';

const SAMPLE_ROW = {
  book_universal_id: 1,
  chapter: 2,
  opened_at: 1_760_000_000,
};

describe('recordReadingPosition', () => {
  it('upserts a position with a unix timestamp', async () => {
    const db = createStubDb();

    await recordReadingPosition(asDb(db), 1, 2);

    const upsert = callsOf(db, 'runAsync');
    expect(upsert).toHaveLength(1);
    expect(upsert[0].sql).toContain('ON CONFLICT (book_universal_id, chapter)');
    expect(upsert[0].params[0]).toBe(1);
    expect(upsert[0].params[1]).toBe(2);
    expect(Number.isInteger(upsert[0].params[2])).toBe(true);
  });

  it('skips an invalid position without querying', async () => {
    const db = createStubDb();

    await recordReadingPosition(asDb(db), 0, 2);

    expect(db.calls).toHaveLength(0);
  });

  it('rethrows database errors', async () => {
    const db = createStubDb({ failure: new Error('database is locked') });

    await expect(recordReadingPosition(asDb(db), 1, 2)).rejects.toThrow('database is locked');
  });
});

describe('getLastReadPosition', () => {
  it('maps a snake_case row to a camelCase position', async () => {
    const db = createStubDb({ firstRow: SAMPLE_ROW });

    const position: ReadingPosition | null = await getLastReadPosition(asDb(db));

    expect(position).toEqual({
      bookUniversalId: 1,
      chapter: 2,
      openedAt: 1_760_000_000,
    });
  });

  it('returns null when history is empty', async () => {
    const db = createStubDb({ firstRow: null });

    const position = await getLastReadPosition(asDb(db));

    expect(position).toBeNull();
  });

  it('rethrows database errors', async () => {
    const db = createStubDb({ failure: new Error('no such table') });

    await expect(getLastReadPosition(asDb(db))).rejects.toThrow('no such table');
  });
});

describe('getRecentHistory', () => {
  it('maps rows and binds the requested limit', async () => {
    const db = createStubDb({ allRows: [SAMPLE_ROW] });

    const positions = await getRecentHistory(asDb(db), 5);

    expect(positions).toEqual([
      {
        bookUniversalId: 1,
        chapter: 2,
        openedAt: 1_760_000_000,
      },
    ]);
    expect(callsOf(db, 'getAllAsync')[0].params).toEqual([5]);
  });

  it('falls back to the default limit for invalid values', async () => {
    const db = createStubDb();

    await getRecentHistory(asDb(db), Number.NaN);

    expect(callsOf(db, 'getAllAsync')[0].params).toEqual([DEFAULT_HISTORY_LIMIT]);
  });

  it('clamps the limit to the maximum value', async () => {
    const db = createStubDb();

    await getRecentHistory(asDb(db), MAX_HISTORY_LIMIT + 500);

    expect(callsOf(db, 'getAllAsync')[0].params).toEqual([MAX_HISTORY_LIMIT]);
  });

  it('rethrows database errors', async () => {
    const db = createStubDb({ failure: new Error('no such table') });

    await expect(getRecentHistory(asDb(db))).rejects.toThrow('no such table');
  });
});
