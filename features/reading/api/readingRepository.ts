import { type SQLiteDatabase } from 'expo-sqlite';

import {
  toBook,
  toVerse,
  type Book,
  type BookRow,
  type Verse,
  type VerseRow,
} from '@/db/models';
import { logger } from '@/lib/logger';

export { DEFAULT_TRANSLATION } from '@/db/content';

export async function getBooks(
  db: SQLiteDatabase,
  translationCode: string,
): Promise<Book[]> {
  if (translationCode.trim() === '') {
    logger.warn('readingRepository.getBooks', 'Empty translation code', {
      translationCode,
    });
    return [];
  }

  const startedAt = Date.now();
  try {
    const rows = await db.getAllAsync<BookRow>(
      `SELECT b.id, b.translation_id, b.universal_id, b.order_num, b.title, b.short_title, b.chapter_count, b.canonical
       FROM books b
       JOIN translations t ON t.id = b.translation_id
       WHERE t.code = ?
       ORDER BY b.order_num`,
      [translationCode],
    );
    const books = rows.map(toBook);
    logger.debug('readingRepository.getBooks', 'Books loaded', {
      translationCode,
      count: books.length,
      durationMs: Date.now() - startedAt,
    });
    return books;
  } catch (cause) {
    logger.error('readingRepository.getBooks', 'Failed to load books', {
      translationCode,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function getBook(
  db: SQLiteDatabase,
  translationCode: string,
  universalId: number,
): Promise<Book | null> {
  if (translationCode.trim() === '' || !Number.isInteger(universalId) || universalId <= 0) {
    logger.warn('readingRepository.getBook', 'Invalid book query params', {
      translationCode,
      universalId,
    });
    return null;
  }

  const startedAt = Date.now();
  try {
    const row = await db.getFirstAsync<BookRow>(
      `SELECT b.id, b.translation_id, b.universal_id, b.order_num, b.title, b.short_title, b.chapter_count, b.canonical
       FROM books b
       JOIN translations t ON t.id = b.translation_id
       WHERE t.code = ? AND b.universal_id = ?`,
      [translationCode, universalId],
    );
    const book = row ? toBook(row) : null;
    logger.debug('readingRepository.getBook', 'Book lookup done', {
      translationCode,
      universalId,
      found: book !== null,
      durationMs: Date.now() - startedAt,
    });
    return book;
  } catch (cause) {
    logger.error('readingRepository.getBook', 'Failed to load book', {
      translationCode,
      universalId,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function getVerses(
  db: SQLiteDatabase,
  bookId: number,
  chapter: number,
): Promise<Verse[]> {
  if (!Number.isInteger(bookId) || bookId <= 0 || !Number.isInteger(chapter) || chapter <= 0) {
    logger.warn('readingRepository.getVerses', 'Invalid verse query params', {
      bookId,
      chapter,
    });
    return [];
  }

  const startedAt = Date.now();
  try {
    const rows = await db.getAllAsync<VerseRow>(
      'SELECT id, book_id, chapter, number, text FROM verses WHERE book_id = ? AND chapter = ? ORDER BY number',
      [bookId, chapter],
    );
    const verses = rows.map(toVerse);
    logger.debug('readingRepository.getVerses', 'Verses loaded', {
      bookId,
      chapter,
      count: verses.length,
      durationMs: Date.now() - startedAt,
    });
    return verses;
  } catch (cause) {
    logger.error('readingRepository.getVerses', 'Failed to load verses', {
      bookId,
      chapter,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}
