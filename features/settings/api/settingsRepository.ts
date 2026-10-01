import { type SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_TRANSLATION } from '@/db/content';
import { logger } from '@/lib/logger';

export const TRANSLATION_SETTING_KEY = 'selected_translation';

export const AVAILABLE_TRANSLATIONS = ['rst', 'kjva'] as const;

export type AvailableTranslation = (typeof AVAILABLE_TRANSLATIONS)[number];

interface SettingRow {
  value: string;
}

export function isAvailableTranslation(
  code: string,
): code is AvailableTranslation {
  return (AVAILABLE_TRANSLATIONS as readonly string[]).includes(code);
}

export async function getSetting(
  db: SQLiteDatabase,
  key: string,
): Promise<string | null> {
  if (key.trim() === '') {
    logger.warn('settingsRepository.getSetting', 'Empty setting key');
    return null;
  }

  const startedAt = Date.now();
  try {
    const row = await db.getFirstAsync<SettingRow>(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );
    logger.debug('settingsRepository.getSetting', 'Setting lookup done', {
      key,
      found: row !== null,
      durationMs: Date.now() - startedAt,
    });
    return row?.value ?? null;
  } catch (cause) {
    logger.error('settingsRepository.getSetting', 'Failed to read setting', {
      key,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function setSetting(
  db: SQLiteDatabase,
  key: string,
  value: string,
): Promise<void> {
  if (key.trim() === '' || value.trim() === '') {
    logger.warn(
      'settingsRepository.setSetting',
      'Invalid setting key or value',
      { key },
    );
    throw new Error('Invalid setting key or value');
  }

  const startedAt = Date.now();
  try {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
    logger.debug('settingsRepository.setSetting', 'Setting stored', {
      key,
      durationMs: Date.now() - startedAt,
    });
  } catch (cause) {
    logger.error('settingsRepository.setSetting', 'Failed to store setting', {
      key,
      durationMs: Date.now() - startedAt,
    });
    throw cause;
  }
}

export async function getSelectedTranslationCode(
  db: SQLiteDatabase,
): Promise<AvailableTranslation> {
  const stored = await getSetting(db, TRANSLATION_SETTING_KEY);
  if (stored === null) {
    logger.debug(
      'settingsRepository.getSelectedTranslationCode',
      'No stored translation, using default',
      {
        translationCode: DEFAULT_TRANSLATION,
      },
    );
    return DEFAULT_TRANSLATION;
  }
  if (!isAvailableTranslation(stored)) {
    logger.warn(
      'settingsRepository.getSelectedTranslationCode',
      'Stored translation is unknown, using default',
      {
        stored,
        translationCode: DEFAULT_TRANSLATION,
      },
    );
    return DEFAULT_TRANSLATION;
  }
  return stored;
}

export async function setSelectedTranslationCode(
  db: SQLiteDatabase,
  code: string,
): Promise<void> {
  if (!isAvailableTranslation(code)) {
    logger.warn(
      'settingsRepository.setSelectedTranslationCode',
      'Unknown translation code',
      { code },
    );
    throw new Error(`Unknown translation code: ${code}`);
  }
  await setSetting(db, TRANSLATION_SETTING_KEY, code);
  logger.info(
    'settingsRepository.setSelectedTranslationCode',
    'Translation selected',
    { code },
  );
}
