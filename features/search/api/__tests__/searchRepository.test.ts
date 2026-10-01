import { describe, expect, it } from '@jest/globals';

import { HIGHLIGHT_END, HIGHLIGHT_START } from '../../lib/query';
import {
  MAX_SEARCH_LIMIT,
  searchVerses,
  type SearchResultItem,
} from '../searchRepository';

interface CapturedCall {
  sql: string;
  params: unknown[];
}

interface StubDb {
  getAllAsync(sql: string, params: unknown[]): Promise<unknown[]>;
  calls: CapturedCall[];
  rows: unknown[];
  failure: Error | null;
}

function createStubDb(
  rows: unknown[] = [],
  failure: Error | null = null,
): StubDb {
  const stub: StubDb = {
    calls: [],
    rows,
    failure,
    async getAllAsync(sql: string, params: unknown[]): Promise<unknown[]> {
      stub.calls.push({ sql, params });
      if (stub.failure !== null) {
        throw stub.failure;
      }
      return stub.rows;
    },
  };
  return stub;
}

const SAMPLE_ROWS = [
  {
    verse_id: 42,
    universal_id: 1,
    short_title: 'Быт',
    chapter: 2,
    number: 7,
    snippet: `И создал ${HIGHLIGHT_START}Господь${HIGHLIGHT_END} Бог человека`,
  },
];

describe('searchVerses', () => {
  it('returns empty result for a null match expression without querying', async () => {
    const db = createStubDb();
    const results = await searchVerses(db as never, 'rst', null);
    expect(results).toEqual([]);
    expect(db.calls).toHaveLength(0);
  });

  it('returns empty result for a blank match expression without querying', async () => {
    const db = createStubDb();
    const results = await searchVerses(db as never, 'rst', '   ');
    expect(results).toEqual([]);
    expect(db.calls).toHaveLength(0);
  });

  it('returns empty result for an empty translation code without querying', async () => {
    const db = createStubDb();
    const results = await searchVerses(db as never, '  ', '"господь"*');
    expect(results).toEqual([]);
    expect(db.calls).toHaveLength(0);
  });

  it('maps snake_case rows to camelCase result items', async () => {
    const db = createStubDb(SAMPLE_ROWS);
    const results: SearchResultItem[] = await searchVerses(
      db as never,
      'rst',
      '"господь"*',
    );
    expect(results).toEqual([
      {
        verseId: 42,
        bookUniversalId: 1,
        bookShortTitle: 'Быт',
        chapter: 2,
        verseNumber: 7,
        snippet: `И создал ${HIGHLIGHT_START}Господь${HIGHLIGHT_END} Бог человека`,
      },
    ]);
  });

  it('binds markers, expression, translation and paging params', async () => {
    const db = createStubDb([]);
    await searchVerses(db as never, 'kjva', '"милост"*', 25, 50);
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0].params).toEqual([
      HIGHLIGHT_START,
      HIGHLIGHT_END,
      '"милост"*',
      'kjva',
      25,
      50,
    ]);
  });

  it('clamps the limit to the maximum value', async () => {
    const db = createStubDb([]);
    await searchVerses(db as never, 'rst', '"мир"*', MAX_SEARCH_LIMIT + 500);
    expect(db.calls[0].params[4]).toBe(MAX_SEARCH_LIMIT);
  });

  it('falls back to the default limit for invalid limit values', async () => {
    const db = createStubDb([]);
    await searchVerses(db as never, 'rst', '"мир"*', Number.NaN);
    expect(db.calls[0].params[4]).toBe(50);
  });

  it('resets a negative offset to zero', async () => {
    const db = createStubDb([]);
    await searchVerses(db as never, 'rst', '"мир"*', 25, -5);
    expect(db.calls[0].params[5]).toBe(0);
  });

  it('rethrows database errors', async () => {
    const db = createStubDb([], new Error('database is locked'));
    await expect(searchVerses(db as never, 'rst', '"мир"*')).rejects.toThrow(
      'database is locked',
    );
  });
});
