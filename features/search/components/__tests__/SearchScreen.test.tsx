import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { logger } from '@/lib/logger';
import { ThemeProvider } from '@/theme/ThemeContext';

import { router } from 'expo-router';

import { SearchScreen } from '@/features/search';
import { useSearch } from '@/features/search/hooks/useSearch';
import type { SearchResultItem } from '@/features/search/api/searchRepository';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/features/settings', () => ({
  useSelectedTranslation: () => ({
    translationCode: 'syn',
    isLoaded: true,
    setTranslationCode: async () => {},
  }),
}));

jest.mock('@/features/search/hooks/useSearch', () => ({
  useSearch: jest.fn(),
}));

const mockUseSearch = jest.mocked(useSearch);

const RESULTS: SearchResultItem[] = [
  {
    verseId: 1,
    bookUniversalId: 1,
    bookShortTitle: 'Быт',
    chapter: 1,
    verseNumber: 1,
    snippet: 'В начале',
  },
];

function renderSearchScreen() {
  return render(
    <ThemeProvider>
      <SearchScreen />
    </ThemeProvider>,
  );
}

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the empty state for empty results', async () => {
    mockUseSearch.mockReturnValue({
      query: '',
      reloadKey: 0,
      results: [],
      isLoading: false,
      error: null,
    });

    await renderSearchScreen();

    expect(screen.getByText('Ничего не найдено')).toBeOnTheScreen();
  });

  it('shows the error state and reruns the search on retry', async () => {
    mockUseSearch.mockReturnValue({
      query: '',
      reloadKey: 0,
      results: null,
      isLoading: false,
      error: new Error('fts broken'),
    });

    await renderSearchScreen();

    expect(screen.getByText('Не удалось выполнить поиск')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Повторить'));

    expect(mockUseSearch).toHaveBeenLastCalledWith('', 'syn', 1);
  });

  it('renders search result rows', async () => {
    mockUseSearch.mockReturnValue({
      query: 'любовь',
      reloadKey: 0,
      results: RESULTS,
      isLoading: false,
      error: null,
    });

    await renderSearchScreen();

    expect(screen.getByText(/В начале/)).toBeOnTheScreen();
  });
});
