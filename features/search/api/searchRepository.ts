import { type SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/lib/logger';

import { HIGHLIGHT_END, HIGHLIGHT_START } from '../lib/query';

export const DEFAULT_SEARCH_LIMIT = 50;
export const MAX_SEARCH_LIMIT = 100;
export const SNIPPET_TOKENS = 12;

export interface SearchResultItem {
  verseId: number;
  bookUniversalId: number;
  bookShortTitle: string;
  chapter: number;
  verseNumber: number;
  snippet: string;
}

interface SearchResultRow {
  verse_id: number;
  universal_id: number;
  short_title: string;
  chapter: number;
  number: number;
  snippet: string;
}

const SEARCH_SQL = `SELECT v.id AS verse_id,
       b.universal_id,
       b.short_title,
       v.chapter,
       v.number,
       snippet(verses_fts, 0, ?, ?, '…', ${SNIPPET_TOKENS}) AS snippet
FROM verses_fts
JOIN verses v ON v.id = verses_fts.rowid
JOIN books b ON b.id = v.book_id
JOIN translations t ON t.id = b.translation_id
WHERE verses_fts MATCH ?
  AND t.code = ?
ORDER BY bm25(verses_fts), b.order_num, v.chapter, v.number
LIMIT ? OFFSET ?`;

function toSearchResultItem(row: SearchResultRow): SearchResultItem {
  return {
    verseId: row.verse_id,
    bookUniversalId: row.universal_id,
    bookShortTitle: row.short_title,
    chapter: row.chapter,
    verseNumber: row.number,
    snippet: row.snippet,
  };
}

function clampLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_SEARCH_LIMIT;
  }
  return Math.min(limit, MAX_SEARCH_LIMIT);
}

function clampOffset(offset: number): number {
  if (!Number.isInteger(offset) || offset < 0) {
    return 0;
  }
  return offset;
}

export async function searchVerses(
  db: SQLiteDatabase,
  translationCode: string,
  matchExpression: string | null,
  limit = DEFAULT_SEARCH_LIMIT,
  offset = 0,
): Promise<SearchResultItem[]> {
  if (matchExpression === null || matchExpression.trim() === '') {
    logger.debug('searchRepository.searchVerses', 'Empty match expression, search skipped', {
      translationCode,
    });
    return [];
  }
  if (translationCode.trim() === '') {
    logger.warn('searchRepository.searchVerses', 'Empty translation code', {
      translationCode,
    });
    return [];
  }

  const effectiveLimit = clampLimit(limit);
  const effectiveOffset = clampOffset(offset);
  const startedAt = Date.now();
  try {
    const rows = await db.getAllAsync<SearchResultRow>(SEARCH_SQL, [
      HIGHLIGHT_START,
      HIGHLIGHT_END,
      matchExpression,
      translationCode,
      effectiveLimit,
      effectiveOffset,
    ]);
    const results = rows.map(toSearchResultItem);
    logger.debug('searchRepository.searchVerses', 'Search completed', {
      translationCode,
      expressionLength: matchExpression.length,
      limit: effectiveLimit,
      offset: effectiveOffset,
      count: results.length,
      durationMs: Date.now() - startedAt,
    });
    return results;
  } catch (cause) {
    logger.error('searchRepository.searchVerses', 'Failed to search verses', {
      translationCode,
      expressionLength: matchExpression.length,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}
