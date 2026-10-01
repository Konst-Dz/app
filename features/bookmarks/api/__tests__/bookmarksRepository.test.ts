import { describe, expect, it } from '@jest/globals';

import {
  addBookmark,
  getBookmarkedVerseNumbers,
  getBookmarks,
  removeBookmark,
  toggleBookmark,
  type Bookmark,
} from '../bookmarksRepository';
import { asDb, callsOf, createStubDb } from './stubDb';

const SAMPLE_ROW = {
  id: 11,
  book_universal_id: 1,
  chapter: 2,
  verse_number: 7,
  created_at: 1_760_000_000,
};

describe('addBookmark', () => {
  it('inserts a bookmark with a unix timestamp and returns the mapped model', async () => {
    const db = createStubDb({ runResult: { lastInsertRowId: 33, changes: 1 } });

    const bookmark: Bookmark = await addBookmark(asDb(db), 1, 2, 7);

    expect(bookmark).toEqual({
      id: 33,
      bookUniversalId: 1,
      chapter: 2,
      verseNumber: 7,
      createdAt: expect.any(Number),
    });
    const insert = callsOf(db, 'runAsync');
    expect(insert).toHaveLength(1);
    expect(insert[0].params[0]).toBe(1);
    expect(insert[0].params[1]).toBe(2);
    expect(insert[0].params[2]).toBe(7);
    expect(Number.isInteger(insert[0].params[3])).toBe(true);
  });

  it('rejects an invalid verse key without querying', async () => {
    const db = createStubDb();

    await expect(addBookmark(asDb(db), 1, 2, 0)).rejects.toThrow(/Invalid bookmark verse key/);
    expect(db.calls).toHaveLength(0);
  });

  it('rethrows database errors', async () => {
    const db = createStubDb({ failure: new Error('database is locked') });

    await expect(addBookmark(asDb(db), 1, 2, 7)).rejects.toThrow('database is locked');
  });
});

describe('removeBookmark', () => {
  it('returns true when a row was deleted', async () => {
    const db = createStubDb({ runResult: { lastInsertRowId: 0, changes: 1 } });

    const removed = await removeBookmark(asDb(db), 1, 2, 7);

    expect(removed).toBe(true);
    expect(callsOf(db, 'runAsync')[0].params).toEqual([1, 2, 7]);
  });

  it('returns false when nothing matched', async () => {
    const db = createStubDb({ runResult: { lastInsertRowId: 0, changes: 0 } });

    const removed = await removeBookmark(asDb(db), 1, 2, 7);

    expect(removed).toBe(false);
  });

  it('returns false for an invalid verse key without querying', async () => {
    const db = createStubDb();

    const removed = await removeBookmark(asDb(db), 0, 2, 7);

    expect(removed).toBe(false);
    expect(db.calls).toHaveLength(0);
  });
});

describe('toggleBookmark', () => {
  it('adds a bookmark when the verse is not bookmarked yet', async () => {
    const db = createStubDb({ firstRow: null, runResult: { lastInsertRowId: 5, changes: 1 } });

    const result = await toggleBookmark(asDb(db), 1, 2, 7);

    expect(result).toEqual({
      bookmarked: true,
      bookmark: {
        id: 5,
        bookUniversalId: 1,
        chapter: 2,
        verseNumber: 7,
        createdAt: expect.any(Number),
      },
    });
    expect(callsOf(db, 'getFirstAsync')).toHaveLength(1);
    expect(callsOf(db, 'runAsync')[0].sql).toContain('INSERT INTO bookmarks');
  });

  it('removes a bookmark when the verse is already bookmarked', async () => {
    const db = createStubDb({ firstRow: SAMPLE_ROW });

    const result = await toggleBookmark(asDb(db), 1, 2, 7);

    expect(result).toEqual({ bookmarked: false, bookmark: null });
    expect(callsOf(db, 'runAsync')[0].sql).toContain('DELETE FROM bookmarks');
    expect(callsOf(db, 'runAsync')[0].params).toEqual([1, 2, 7]);
  });

  it('returns a negative result for an invalid verse key without querying', async () => {
    const db = createStubDb();

    const result = await toggleBookmark(asDb(db), -1, 2, 7);

    expect(result).toEqual({ bookmarked: false, bookmark: null });
    expect(db.calls).toHaveLength(0);
  });
});

describe('getBookmarks', () => {
  it('maps snake_case rows to camelCase bookmarks', async () => {
    const db = createStubDb({ allRows: [SAMPLE_ROW] });

    const bookmarks = await getBookmarks(asDb(db));

    expect(bookmarks).toEqual([
      {
        id: 11,
        bookUniversalId: 1,
        chapter: 2,
        verseNumber: 7,
        createdAt: 1_760_000_000,
      },
    ]);
  });

  it('rethrows database errors', async () => {
    const db = createStubDb({ failure: new Error('no such table') });

    await expect(getBookmarks(asDb(db))).rejects.toThrow('no such table');
  });
});

describe('getBookmarkedVerseNumbers', () => {
  it('returns verse numbers for the chapter', async () => {
    const db = createStubDb({ allRows: [{ verse_number: 7 }, { verse_number: 12 }] });

    const verseNumbers = await getBookmarkedVerseNumbers(asDb(db), 1, 2);

    expect(verseNumbers).toEqual([7, 12]);
    expect(callsOf(db, 'getAllAsync')[0].params).toEqual([1, 2]);
  });

  it('returns an empty list for invalid chapter params without querying', async () => {
    const db = createStubDb();

    const verseNumbers = await getBookmarkedVerseNumbers(asDb(db), 0, 2);

    expect(verseNumbers).toEqual([]);
    expect(db.calls).toHaveLength(0);
  });
});
