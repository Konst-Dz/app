import type { SQLiteProviderAssetSource, SQLiteDatabase } from 'expo-sqlite';

import bibleAsset from '@/assets/db/bible.db';

export const DATABASE_NAME = 'bible.db';

export const DATABASE_ASSET_SOURCE: SQLiteProviderAssetSource = {
  assetId: bibleAsset,
};

function logDebug(message: string, payload?: Record<string, unknown>) {
  if (__DEV__) {
    console.log('[db]', message, payload ?? '');
  }
}

function logError(message: string, cause: unknown) {
  if (__DEV__) {
    console.error('[db]', message, cause);
  }
}

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    logDebug('init start');
    const integrity = await db.getFirstAsync<{ quick_check: string }>('PRAGMA quick_check');
    if (!integrity || integrity.quick_check !== 'ok') {
      throw new Error(`Integrity check failed: ${integrity?.quick_check ?? 'no result'}`);
    }
    const stats = await db.getFirstAsync<{
      translations: number;
      books: number;
      verses: number;
    }>(
      'SELECT (SELECT COUNT(*) FROM translations) AS translations, (SELECT COUNT(*) FROM books) AS books, (SELECT COUNT(*) FROM verses) AS verses',
    );
    logDebug('database ready', { ...stats });
    await logDevSmokeSample(db);
  } catch (cause) {
    logError('init failed', cause);
    throw cause;
  }
}

async function logDevSmokeSample(db: SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    return;
  }
  const verse = await db.getFirstAsync<{ text: string }>(
    "SELECT v.text FROM verses v JOIN books b ON b.id = v.book_id JOIN translations t ON t.id = b.translation_id WHERE t.code = 'rst' AND b.universal_id = 1 AND v.chapter = 1 AND v.number = 1",
  );
  logDebug('smoke sample', { reference: 'Genesis 1:1 (rst)', text: verse?.text });
}
