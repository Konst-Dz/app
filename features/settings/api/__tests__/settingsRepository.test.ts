import { describe, expect, it } from '@jest/globals';

import {
  AVAILABLE_TRANSLATIONS,
  READING_FONT_SIZE_SETTING_KEY,
  THEME_MODE_SETTING_KEY,
  getReadingFontStepId,
  getSelectedTranslationCode,
  getSetting,
  getThemeMode,
  isAvailableTranslation,
  isReadingFontStepId,
  isThemeMode,
  setReadingFontStepId,
  setSelectedTranslationCode,
  setSetting,
  setThemeMode,
  TRANSLATION_SETTING_KEY,
} from '../settingsRepository';
import { asDb, callsOf, createStubDb } from './stubDb';

describe('getSetting', () => {
  it('returns the stored value', async () => {
    const db = createStubDb({ firstRow: { value: 'kjva' } });

    const value = await getSetting(asDb(db), TRANSLATION_SETTING_KEY);

    expect(value).toBe('kjva');
    const calls = callsOf(db, 'getFirstAsync');
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('FROM settings');
    expect(calls[0].params).toEqual([TRANSLATION_SETTING_KEY]);
  });

  it('returns null when the key is missing', async () => {
    const db = createStubDb({ firstRow: null });

    const value = await getSetting(asDb(db), TRANSLATION_SETTING_KEY);

    expect(value).toBeNull();
  });

  it('returns null for an empty key without querying', async () => {
    const db = createStubDb();

    const value = await getSetting(asDb(db), '  ');

    expect(value).toBeNull();
    expect(db.calls).toHaveLength(0);
  });

  it('rethrows database errors', async () => {
    const db = createStubDb({ failure: new Error('database is locked') });

    await expect(getSetting(asDb(db), TRANSLATION_SETTING_KEY)).rejects.toThrow(
      'database is locked',
    );
  });
});

describe('setSetting', () => {
  it('upserts the value with the conflict clause', async () => {
    const db = createStubDb();

    await setSetting(asDb(db), TRANSLATION_SETTING_KEY, 'kjva');

    const calls = callsOf(db, 'runAsync');
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain(
      'ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    );
    expect(calls[0].params).toEqual([TRANSLATION_SETTING_KEY, 'kjva']);
  });

  it('rejects an empty key or value without querying', async () => {
    const db = createStubDb();

    await expect(setSetting(asDb(db), '  ', 'kjva')).rejects.toThrow(
      /Invalid setting/,
    );
    await expect(
      setSetting(asDb(db), TRANSLATION_SETTING_KEY, ''),
    ).rejects.toThrow(/Invalid setting/);
    expect(db.calls).toHaveLength(0);
  });

  it('rethrows database errors', async () => {
    const db = createStubDb({ failure: new Error('database is locked') });

    await expect(
      setSetting(asDb(db), TRANSLATION_SETTING_KEY, 'rst'),
    ).rejects.toThrow('database is locked');
  });
});

describe('isAvailableTranslation', () => {
  it('accepts only whitelisted codes', () => {
    expect(AVAILABLE_TRANSLATIONS).toEqual(['rst', 'kjva']);
    expect(isAvailableTranslation('rst')).toBe(true);
    expect(isAvailableTranslation('kjva')).toBe(true);
    expect(isAvailableTranslation('nrt')).toBe(false);
    expect(isAvailableTranslation('')).toBe(false);
  });
});

describe('getSelectedTranslationCode', () => {
  it('returns the stored whitelisted code', async () => {
    const db = createStubDb({ firstRow: { value: 'kjva' } });

    const code = await getSelectedTranslationCode(asDb(db));

    expect(code).toBe('kjva');
  });

  it('falls back to the default translation when nothing is stored', async () => {
    const db = createStubDb({ firstRow: null });

    const code = await getSelectedTranslationCode(asDb(db));

    expect(code).toBe('rst');
  });

  it('falls back to the default translation for an unknown stored code', async () => {
    const db = createStubDb({ firstRow: { value: 'nrt' } });

    const code = await getSelectedTranslationCode(asDb(db));

    expect(code).toBe('rst');
  });
});

describe('setSelectedTranslationCode', () => {
  it('stores a whitelisted code', async () => {
    const db = createStubDb();

    await setSelectedTranslationCode(asDb(db), 'kjva');

    const calls = callsOf(db, 'runAsync');
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual([TRANSLATION_SETTING_KEY, 'kjva']);
  });

  it('rejects an unknown code without querying', async () => {
    const db = createStubDb();

    await expect(setSelectedTranslationCode(asDb(db), 'nrt')).rejects.toThrow(
      /Unknown translation code: nrt/,
    );
    expect(db.calls).toHaveLength(0);
  });
});

describe('isThemeMode', () => {
  it('accepts only whitelisted modes', () => {
    expect(isThemeMode('system')).toBe(true);
    expect(isThemeMode('light')).toBe(true);
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('black')).toBe(false);
    expect(isThemeMode('')).toBe(false);
  });
});

describe('getThemeMode', () => {
  it('returns the stored whitelisted mode', async () => {
    const db = createStubDb({ firstRow: { value: 'dark' } });

    const mode = await getThemeMode(asDb(db));

    expect(mode).toBe('dark');
    const calls = callsOf(db, 'getFirstAsync');
    expect(calls[0].params).toEqual([THEME_MODE_SETTING_KEY]);
  });

  it('falls back to the default mode when nothing is stored', async () => {
    const db = createStubDb({ firstRow: null });

    const mode = await getThemeMode(asDb(db));

    expect(mode).toBe('system');
  });

  it('falls back to the default mode for an unknown stored value', async () => {
    const db = createStubDb({ firstRow: { value: 'black' } });

    const mode = await getThemeMode(asDb(db));

    expect(mode).toBe('system');
  });
});

describe('setThemeMode', () => {
  it('stores a whitelisted mode', async () => {
    const db = createStubDb();

    await setThemeMode(asDb(db), 'dark');

    const calls = callsOf(db, 'runAsync');
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual([THEME_MODE_SETTING_KEY, 'dark']);
  });

  it('rejects an unknown mode without querying', async () => {
    const db = createStubDb();

    await expect(setThemeMode(asDb(db), 'black')).rejects.toThrow(
      /Unknown theme mode: black/,
    );
    expect(db.calls).toHaveLength(0);
  });
});

describe('isReadingFontStepId', () => {
  it('accepts only whitelisted step ids', () => {
    expect(isReadingFontStepId('small')).toBe(true);
    expect(isReadingFontStepId('medium')).toBe(true);
    expect(isReadingFontStepId('large')).toBe(true);
    expect(isReadingFontStepId('xlarge')).toBe(true);
    expect(isReadingFontStepId('huge')).toBe(false);
    expect(isReadingFontStepId('')).toBe(false);
  });
});

describe('getReadingFontStepId', () => {
  it('returns the stored whitelisted step id', async () => {
    const db = createStubDb({ firstRow: { value: 'large' } });

    const stepId = await getReadingFontStepId(asDb(db));

    expect(stepId).toBe('large');
    const calls = callsOf(db, 'getFirstAsync');
    expect(calls[0].params).toEqual([READING_FONT_SIZE_SETTING_KEY]);
  });

  it('falls back to the default step when nothing is stored', async () => {
    const db = createStubDb({ firstRow: null });

    const stepId = await getReadingFontStepId(asDb(db));

    expect(stepId).toBe('medium');
  });

  it('falls back to the default step for an unknown stored value', async () => {
    const db = createStubDb({ firstRow: { value: 'huge' } });

    const stepId = await getReadingFontStepId(asDb(db));

    expect(stepId).toBe('medium');
  });
});

describe('setReadingFontStepId', () => {
  it('stores a whitelisted step id', async () => {
    const db = createStubDb();

    await setReadingFontStepId(asDb(db), 'xlarge');

    const calls = callsOf(db, 'runAsync');
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual([READING_FONT_SIZE_SETTING_KEY, 'xlarge']);
  });

  it('rejects an unknown step id without querying', async () => {
    const db = createStubDb();

    await expect(setReadingFontStepId(asDb(db), 'huge')).rejects.toThrow(
      /Unknown reading font size id: huge/,
    );
    expect(db.calls).toHaveLength(0);
  });
});
