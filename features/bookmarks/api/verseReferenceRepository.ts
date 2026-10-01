import { type SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/lib/logger';

export interface VerseReference {
  shortTitle: string;
  text: string;
}

interface VerseReferenceRow {
  short_title: string;
  text: string;
}

const VERSE_REFERENCE_SQL = `SELECT b.short_title, v.text
FROM verses v
JOIN books b ON b.id = v.book_id
JOIN translations t ON t.id = b.translation_id
WHERE b.universal_id = ? AND t.code = ? AND v.chapter = ? AND v.number = ?`;

const BOOK_TITLE_SQL = `SELECT b.short_title
FROM books b
JOIN translations t ON t.id = b.translation_id
WHERE b.universal_id = ? AND t.code = ?`;

function isValidReferenceKey(
  bookUniversalId: number,
  chapter: number,
  verseNumber = 1,
): boolean {
  return (
    Number.isInteger(bookUniversalId) &&
    bookUniversalId > 0 &&
    Number.isInteger(chapter) &&
    chapter > 0 &&
    Number.isInteger(verseNumber) &&
    verseNumber > 0
  );
}

export async function getVerseReference(
  db: SQLiteDatabase,
  translationCode: string,
  bookUniversalId: number,
  chapter: number,
  verseNumber: number,
): Promise<VerseReference | null> {
  const scope = 'verseReferenceRepository.getVerseReference';
  if (translationCode.trim() === '' || !isValidReferenceKey(bookUniversalId, chapter, verseNumber)) {
    logger.warn(scope, 'Invalid verse reference params', {
      translationCode,
      bookUniversalId,
      chapter,
      verseNumber,
    });
    return null;
  }

  const startedAt = Date.now();
  try {
    const row = await db.getFirstAsync<VerseReferenceRow>(VERSE_REFERENCE_SQL, [
      bookUniversalId,
      translationCode,
      chapter,
      verseNumber,
    ]);
    logger.debug(scope, 'Verse reference lookup done', {
      translationCode,
      bookUniversalId,
      chapter,
      verseNumber,
      found: row !== null,
      durationMs: Date.now() - startedAt,
    });
    return row ? { shortTitle: row.short_title, text: row.text } : null;
  } catch (cause) {
    logger.error(scope, 'Failed to load verse reference', {
      translationCode,
      bookUniversalId,
      chapter,
      verseNumber,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function getBookShortTitle(
  db: SQLiteDatabase,
  translationCode: string,
  bookUniversalId: number,
): Promise<string | null> {
  const scope = 'verseReferenceRepository.getBookShortTitle';
  if (translationCode.trim() === '' || !Number.isInteger(bookUniversalId) || bookUniversalId <= 0) {
    logger.warn(scope, 'Invalid book title params', {
      translationCode,
      bookUniversalId,
    });
    return null;
  }

  const startedAt = Date.now();
  try {
    const row = await db.getFirstAsync<{ short_title: string }>(BOOK_TITLE_SQL, [
      bookUniversalId,
      translationCode,
    ]);
    logger.debug(scope, 'Book title lookup done', {
      translationCode,
      bookUniversalId,
      found: row !== null,
      durationMs: Date.now() - startedAt,
    });
    return row?.short_title ?? null;
  } catch (cause) {
    logger.error(scope, 'Failed to load book title', {
      translationCode,
      bookUniversalId,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}
