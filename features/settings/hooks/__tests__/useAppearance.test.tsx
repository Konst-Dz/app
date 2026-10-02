import { describe, expect, it } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { ReadingFontStepId, ThemeMode } from '@/theme/tokens';

import { AppearanceContext, useAppearance } from '../useAppearance';

const VALUES = {
  themeMode: 'system' as ThemeMode,
  readingFontStepId: 'medium' as ReadingFontStepId,
  isLoaded: true,
  setThemeMode: async () => {},
  setReadingFontStepId: async () => {},
};

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <AppearanceContext.Provider value={VALUES}>
      {children}
    </AppearanceContext.Provider>
  );
}

describe('useAppearance', () => {
  it('throws outside of AppearanceProvider', async () => {
    await expect(renderHook(() => useAppearance())).rejects.toThrow(
      'useAppearance must be used within AppearanceProvider',
    );
  });

  it('returns appearance values from the provider', async () => {
    const { result } = await renderHook(() => useAppearance(), {
      wrapper: Wrapper,
    });

    expect(result.current).toBe(VALUES);
  });
});
