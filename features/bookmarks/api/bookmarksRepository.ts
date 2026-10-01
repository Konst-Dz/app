import { type SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/lib/logger';
import { unixTimestampSeconds } from '@/lib/time';

export interface Bookmark {
  id: number;
  bookUniversalId: number;
  chapter: number;
  verseNumber: number;
  createdAt: number;
}

export interface BookmarkToggleResult {
  bookmarked: boolean;
  bookmark: Bookmark | null;
}

interface BookmarkRow {
  id: number;
  book_universal_id: number;
  chapter: number;
  verse_number: number;
  created_at: number;
}

const INSERT_SQL = `INSERT INTO bookmarks (book_universal_id, chapter, verse_number, created_at)
VALUES (?, ?, ?, ?)`;

const DELETE_SQL = `DELETE FROM bookmarks
WHERE book_universal_id = ? AND chapter = ? AND verse_number = ?`;

const SELECT_ALL_SQL = `SELECT id, book_universal_id, chapter, verse_number, created_at
FROM bookmarks
ORDER BY created_at DESC, id DESC`;

const SELECT_ONE_SQL = `SELECT id, book_universal_id, chapter, verse_number, created_at
FROM bookmarks
WHERE book_universal_id = ? AND chapter = ? AND verse_number = ?`;

const SELECT_VERSE_NUMBERS_SQL = `SELECT verse_number
FROM bookmarks
WHERE book_universal_id = ? AND chapter = ?
ORDER BY verse_number`;

function toBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    bookUniversalId: row.book_universal_id,
    chapter: row.chapter,
    verseNumber: row.verse_number,
    createdAt: row.created_at,
  };
}

function isValidVerseKey(bookUniversalId: number, chapter: number, verseNumber: number): boolean {
  return (
    Number.isInteger(bookUniversalId) &&
    bookUniversalId > 0 &&
    Number.isInteger(chapter) &&
    chapter > 0 &&
    Number.isInteger(verseNumber) &&
    verseNumber > 0
  );
}

function logInvalidKey(scope: string, bookUniversalId: number, chapter: number, verseNumber: number) {
  logger.warn(scope, 'Invalid bookmark verse key', {
    bookUniversalId,
    chapter,
    verseNumber,
  });
}

export async function findBookmark(
  db: SQLiteDatabase,
  bookUniversalId: number,
  chapter: number,
  verseNumber: number,
): Promise<Bookmark | null> {
  const scope = 'bookmarksRepository.findBookmark';
  if (!isValidVerseKey(bookUniversalId, chapter, verseNumber)) {
    logInvalidKey(scope, bookUniversalId, chapter, verseNumber);
    return null;
  }
  const row = await db.getFirstAsync<BookmarkRow>(SELECT_ONE_SQL, [
    bookUniversalId,
    chapter,
    verseNumber,
  ]);
  return row ? toBookmark(row) : null;
}

export async function addBookmark(
  db: SQLiteDatabase,
  bookUniversalId: number,
  chapter: number,
  verseNumber: number,
): Promise<Bookmark> {
  const scope = 'bookmarksRepository.addBookmark';
  if (!isValidVerseKey(bookUniversalId, chapter, verseNumber)) {
    logInvalidKey(scope, bookUniversalId, chapter, verseNumber);
    throw new Error(
      `Invalid bookmark verse key: book=${bookUniversalId}, chapter=${chapter}, verse=${verseNumber}`,
    );
  }

  const createdAt = unixTimestampSeconds();
  const startedAt = Date.now();
  try {
    const result = await db.runAsync(INSERT_SQL, [bookUniversalId, chapter, verseNumber, createdAt]);
    logger.info(scope, 'Bookmark added', {
      bookUniversalId,
      chapter,
      verseNumber,
      durationMs: Date.now() - startedAt,
    });
    return {
      id: Number(result.lastInsertRowId),
      bookUniversalId,
      chapter,
      verseNumber,
      createdAt,
    };
  } catch (cause) {
    logger.error(scope, 'Failed to add bookmark', {
      bookUniversalId,
      chapter,
      verseNumber,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function removeBookmark(
  db: SQLiteDatabase,
  bookUniversalId: number,
  chapter: number,
  verseNumber: number,
): Promise<boolean> {
  const scope = 'bookmarksRepository.removeBookmark';
  if (!isValidVerseKey(bookUniversalId, chapter, verseNumber)) {
    logInvalidKey(scope, bookUniversalId, chapter, verseNumber);
    return false;
  }

  const startedAt = Date.now();
  try {
    const result = await db.runAsync(DELETE_SQL, [bookUniversalId, chapter, verseNumber]);
    const removed = result.changes > 0;
    logger.info(scope, 'Bookmark removed', {
      bookUniversalId,
      chapter,
      verseNumber,
      removed,
      durationMs: Date.now() - startedAt,
    });
    return removed;
  } catch (cause) {
    logger.error(scope, 'Failed to remove bookmark', {
      bookUniversalId,
      chapter,
      verseNumber,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function toggleBookmark(
  db: SQLiteDatabase,
  bookUniversalId: number,
  chapter: number,
  verseNumber: number,
): Promise<BookmarkToggleResult> {
  const scope = 'bookmarksRepository.toggleBookmark';
  if (!isValidVerseKey(bookUniversalId, chapter, verseNumber)) {
    logInvalidKey(scope, bookUniversalId, chapter, verseNumber);
    return { bookmarked: false, bookmark: null };
  }

  const existing = await findBookmark(db, bookUniversalId, chapter, verseNumber);
  if (existing) {
    await removeBookmark(db, bookUniversalId, chapter, verseNumber);
    return { bookmarked: false, bookmark: null };
  }
  const bookmark = await addBookmark(db, bookUniversalId, chapter, verseNumber);
  logger.debug(scope, 'Bookmark toggled on', { bookmark });
  return { bookmarked: true, bookmark };
}

export async function getBookmarks(db: SQLiteDatabase): Promise<Bookmark[]> {
  const scope = 'bookmarksRepository.getBookmarks';
  const startedAt = Date.now();
  try {
    const rows = await db.getAllAsync<BookmarkRow>(SELECT_ALL_SQL, []);
    const bookmarks = rows.map(toBookmark);
    logger.debug(scope, 'Bookmarks loaded', {
      count: bookmarks.length,
      durationMs: Date.now() - startedAt,
    });
    return bookmarks;
  } catch (cause) {
    logger.error(scope, 'Failed to load bookmarks', {
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function getBookmarkedVerseNumbers(
  db: SQLiteDatabase,
  bookUniversalId: number,
  chapter: number,
): Promise<number[]> {
  const scope = 'bookmarksRepository.getBookmarkedVerseNumbers';
  if (!Number.isInteger(bookUniversalId) || bookUniversalId <= 0 || !Number.isInteger(chapter) || chapter <= 0) {
    logger.warn(scope, 'Invalid chapter query params', {
      bookUniversalId,
      chapter,
    });
    return [];
  }

  const startedAt = Date.now();
  try {
    const rows = await db.getAllAsync<{ verse_number: number }>(SELECT_VERSE_NUMBERS_SQL, [
      bookUniversalId,
      chapter,
    ]);
    const verseNumbers = rows.map((row) => row.verse_number);
    logger.debug(scope, 'Bookmarked verse numbers loaded', {
      bookUniversalId,
      chapter,
      count: verseNumbers.length,
      durationMs: Date.now() - startedAt,
    });
    return verseNumbers;
  } catch (cause) {
    logger.error(scope, 'Failed to load bookmarked verse numbers', {
      bookUniversalId,
      chapter,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}
