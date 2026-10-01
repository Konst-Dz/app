import { type SQLiteDatabase } from 'expo-sqlite';

import { toFootnote, type Footnote, type FootnoteRow } from '@/db/models';
import { logger } from '@/lib/logger';

export async function getFootnotesForChapter(
  db: SQLiteDatabase,
  bookId: number,
  chapter: number,
): Promise<Footnote[]> {
  if (
    !Number.isInteger(bookId) ||
    bookId <= 0 ||
    !Number.isInteger(chapter) ||
    chapter <= 0
  ) {
    logger.warn(
      'footnotesRepository.getFootnotesForChapter',
      'Invalid footnote query params',
      {
        bookId,
        chapter,
      },
    );
    return [];
  }

  const startedAt = Date.now();
  try {
    const rows = await db.getAllAsync<FootnoteRow>(
      `SELECT f.id, f.verse_id, f.marker, f.text
       FROM footnotes f
       JOIN verses v ON v.id = f.verse_id
       WHERE v.book_id = ? AND v.chapter = ?
       ORDER BY v.number, f.id`,
      [bookId, chapter],
    );
    const footnotes = rows.map(toFootnote);
    logger.debug(
      'footnotesRepository.getFootnotesForChapter',
      'Footnotes loaded',
      {
        bookId,
        chapter,
        count: footnotes.length,
        durationMs: Date.now() - startedAt,
      },
    );
    return footnotes;
  } catch (cause) {
    logger.error(
      'footnotesRepository.getFootnotesForChapter',
      'Failed to load footnotes',
      {
        bookId,
        chapter,
        durationMs: Date.now() - startedAt,
      },
    );
    throw cause;
  }
}

export function groupFootnotesByVerse(
  footnotes: Footnote[],
): ReadonlyMap<number, Footnote[]> {
  const footnotesByVerseId = new Map<number, Footnote[]>();
  for (const footnote of footnotes) {
    const existing = footnotesByVerseId.get(footnote.verseId);
    if (existing) {
      existing.push(footnote);
    } else {
      footnotesByVerseId.set(footnote.verseId, [footnote]);
    }
  }
  return footnotesByVerseId;
}
