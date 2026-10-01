import { type SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_TRANSLATION } from '@/db/content';
import { logger } from '@/lib/logger';
import {
  DEFAULT_READING_FONT_STEP_ID,
  DEFAULT_THEME_MODE,
  READING_FONT_STEPS,
  THEME_MODES,
  type ReadingFontStepId,
  type ThemeMode,
} from '@/theme/tokens';

export const TRANSLATION_SETTING_KEY = 'selected_translation';
export const THEME_MODE_SETTING_KEY = 'theme_mode';
export const READING_FONT_SIZE_SETTING_KEY = 'reading_font_size';

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

export function isThemeMode(mode: string): mode is ThemeMode {
  return (THEME_MODES as readonly string[]).includes(mode);
}

export function isReadingFontStepId(
  stepId: string,
): stepId is ReadingFontStepId {
  return READING_FONT_STEPS.some((step) => step.id === stepId);
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

export async function getThemeMode(
  db: SQLiteDatabase,
): Promise<ThemeMode> {
  const stored = await getSetting(db, THEME_MODE_SETTING_KEY);
  if (stored === null) {
    logger.debug(
      'settingsRepository.getThemeMode',
      'No stored theme mode, using default',
      { themeMode: DEFAULT_THEME_MODE },
    );
    return DEFAULT_THEME_MODE;
  }
  if (!isThemeMode(stored)) {
    logger.warn(
      'settingsRepository.getThemeMode',
      'Stored theme mode is unknown, using default',
      { stored, themeMode: DEFAULT_THEME_MODE },
    );
    return DEFAULT_THEME_MODE;
  }
  return stored;
}

export async function setThemeMode(
  db: SQLiteDatabase,
  mode: string,
): Promise<void> {
  if (!isThemeMode(mode)) {
    logger.warn('settingsRepository.setThemeMode', 'Unknown theme mode', {
      mode,
    });
    throw new Error(`Unknown theme mode: ${mode}`);
  }
  await setSetting(db, THEME_MODE_SETTING_KEY, mode);
  logger.info('settingsRepository.setThemeMode', 'Theme mode selected', {
    mode,
  });
}

export async function getReadingFontStepId(
  db: SQLiteDatabase,
): Promise<ReadingFontStepId> {
  const stored = await getSetting(db, READING_FONT_SIZE_SETTING_KEY);
  if (stored === null) {
    logger.debug(
      'settingsRepository.getReadingFontStepId',
      'No stored reading font size, using default',
      { stepId: DEFAULT_READING_FONT_STEP_ID },
    );
    return DEFAULT_READING_FONT_STEP_ID;
  }
  if (!isReadingFontStepId(stored)) {
    logger.warn(
      'settingsRepository.getReadingFontStepId',
      'Stored reading font size is unknown, using default',
      { stored, stepId: DEFAULT_READING_FONT_STEP_ID },
    );
    return DEFAULT_READING_FONT_STEP_ID;
  }
  return stored;
}

export async function setReadingFontStepId(
  db: SQLiteDatabase,
  stepId: string,
): Promise<void> {
  if (!isReadingFontStepId(stepId)) {
    logger.warn(
      'settingsRepository.setReadingFontStepId',
      'Unknown reading font size id',
      { stepId },
    );
    throw new Error(`Unknown reading font size id: ${stepId}`);
  }
  await setSetting(db, READING_FONT_SIZE_SETTING_KEY, stepId);
  logger.info(
    'settingsRepository.setReadingFontStepId',
    'Reading font size selected',
    { stepId },
  );
}
