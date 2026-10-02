import { describe, expect, it } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  TranslationContext,
  useSelectedTranslation,
} from '../useSelectedTranslation';

const VALUES = {
  translationCode: 'syn',
  isLoaded: true,
  setTranslationCode: async () => {},
};

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <TranslationContext.Provider value={VALUES}>
      {children}
    </TranslationContext.Provider>
  );
}

describe('useSelectedTranslation', () => {
  it('throws outside of TranslationProvider', async () => {
    await expect(renderHook(() => useSelectedTranslation())).rejects.toThrow(
      'useSelectedTranslation must be used within TranslationProvider',
    );
  });

  it('returns translation values from the provider', async () => {
    const { result } = await renderHook(() => useSelectedTranslation(), {
      wrapper: Wrapper,
    });

    expect(result.current).toBe(VALUES);
  });
});
