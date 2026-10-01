import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_READING_FONT_STEP_ID,
  DEFAULT_THEME_MODE,
  READING_FONT_STEPS,
  THEME_MODES,
  getReadingFontStep,
  resolveColorScheme,
} from '../tokens';

describe('resolveColorScheme', () => {
  it('follows the system scheme in system mode', () => {
    expect(resolveColorScheme('system', 'light')).toBe('light');
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
  });

  it('falls back to light when the system scheme is unknown', () => {
    expect(resolveColorScheme('system', null)).toBe('light');
    expect(resolveColorScheme('system', undefined)).toBe('light');
  });

  it('overrides the system scheme in explicit modes', () => {
    expect(resolveColorScheme('light', 'dark')).toBe('light');
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
  });
});

describe('getReadingFontStep', () => {
  it('returns the step matching a known id', () => {
    expect(getReadingFontStep('small').id).toBe('small');
    expect(getReadingFontStep('xlarge').fontSize).toBe(22);
  });

  it('falls back to the default step for unknown ids', () => {
    expect(getReadingFontStep('huge').id).toBe(DEFAULT_READING_FONT_STEP_ID);
    expect(getReadingFontStep('').id).toBe(DEFAULT_READING_FONT_STEP_ID);
  });
});

describe('appearance tokens consistency', () => {
  it('keeps theme modes and defaults in sync', () => {
    expect(THEME_MODES).toEqual(['system', 'light', 'dark']);
    expect(THEME_MODES).toContain(DEFAULT_THEME_MODE);
    expect(READING_FONT_STEPS.map((step) => step.id)).toContain(
      DEFAULT_READING_FONT_STEP_ID,
    );
  });

  it('derives line heights from font sizes', () => {
    for (const step of READING_FONT_STEPS) {
      expect(step.lineHeight).toBe(Math.round(step.fontSize * 1.5));
      expect(step.lineHeight).toBeGreaterThan(step.fontSize);
    }
  });
});
