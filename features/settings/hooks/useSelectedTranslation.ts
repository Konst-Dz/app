import { createContext, useContext } from 'react';

import type { AvailableTranslation } from '../api/settingsRepository';

export interface TranslationValues {
  translationCode: string;
  isLoaded: boolean;
  setTranslationCode: (code: AvailableTranslation) => Promise<void>;
}

export const TranslationContext = createContext<TranslationValues | null>(null);

export function useSelectedTranslation(): TranslationValues {
  const translation = useContext(TranslationContext);

  if (!translation) {
    throw new Error(
      'useSelectedTranslation must be used within TranslationProvider',
    );
  }

  return translation;
}
