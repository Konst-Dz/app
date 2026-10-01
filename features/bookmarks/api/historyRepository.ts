import { type SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/lib/logger';
import { unixTimestampSeconds } from '@/lib/time';

export interface ReadingPosition {
  bookUniversalId: number;
  chapter: number;
  openedAt: number;
}

interface ReadingPositionRow {
  book_universal_id: number;
  chapter: number;
  opened_at: number;
}

export const DEFAULT_HISTORY_LIMIT = 20;
export const MAX_HISTORY_LIMIT = 100;

const UPSERT_SQL = `INSERT INTO reading_history (book_universal_id, chapter, opened_at)
VALUES (?, ?, ?)
ON CONFLICT (book_universal_id, chapter)
DO UPDATE SET opened_at = excluded.opened_at`;

const LAST_SQL = `SELECT book_universal_id, chapter, opened_at
FROM reading_history
ORDER BY opened_at DESC
LIMIT 1`;

const RECENT_SQL = `SELECT book_universal_id, chapter, opened_at
FROM reading_history
ORDER BY opened_at DESC
LIMIT ?`;

function toReadingPosition(row: ReadingPositionRow): ReadingPosition {
  return {
    bookUniversalId: row.book_universal_id,
    chapter: row.chapter,
    openedAt: row.opened_at,
  };
}

function clampLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_HISTORY_LIMIT;
  }
  return Math.min(limit, MAX_HISTORY_LIMIT);
}

function isValidPosition(bookUniversalId: number, chapter: number): boolean {
  return (
    Number.isInteger(bookUniversalId) &&
    bookUniversalId > 0 &&
    Number.isInteger(chapter) &&
    chapter > 0
  );
}

export async function recordReadingPosition(
  db: SQLiteDatabase,
  bookUniversalId: number,
  chapter: number,
): Promise<void> {
  const scope = 'historyRepository.recordReadingPosition';
  if (!isValidPosition(bookUniversalId, chapter)) {
    logger.warn(scope, 'Invalid reading position', {
      bookUniversalId,
      chapter,
    });
    return;
  }

  const startedAt = Date.now();
  try {
    await db.runAsync(UPSERT_SQL, [bookUniversalId, chapter, unixTimestampSeconds()]);
    logger.info(scope, 'Reading position saved', {
      bookUniversalId,
      chapter,
      durationMs: Date.now() - startedAt,
    });
  } catch (cause) {
    logger.error(scope, 'Failed to save reading position', {
      bookUniversalId,
      chapter,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function getLastReadPosition(db: SQLiteDatabase): Promise<ReadingPosition | null> {
  const scope = 'historyRepository.getLastReadPosition';
  const startedAt = Date.now();
  try {
    const row = await db.getFirstAsync<ReadingPositionRow>(LAST_SQL, []);
    const position = row ? toReadingPosition(row) : null;
    logger.debug(scope, 'Last read position loaded', {
      found: position !== null,
      durationMs: Date.now() - startedAt,
    });
    return position;
  } catch (cause) {
    logger.error(scope, 'Failed to load last read position', {
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function getRecentHistory(
  db: SQLiteDatabase,
  limit = DEFAULT_HISTORY_LIMIT,
): Promise<ReadingPosition[]> {
  const scope = 'historyRepository.getRecentHistory';
  const effectiveLimit = clampLimit(limit);
  const startedAt = Date.now();
  try {
    const rows = await db.getAllAsync<ReadingPositionRow>(RECENT_SQL, [effectiveLimit]);
    const positions = rows.map(toReadingPosition);
    logger.debug(scope, 'Recent history loaded', {
      limit: effectiveLimit,
      count: positions.length,
      durationMs: Date.now() - startedAt,
    });
    return positions;
  } catch (cause) {
    logger.error(scope, 'Failed to load recent history', {
      limit: effectiveLimit,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}
