import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Book, Verse } from '@/db/models';
import { saveReadingPosition } from '@/features/bookmarks';
import { logger } from '@/lib/logger';
import { ThemeProvider } from '@/theme/ThemeContext';

import { useLocalSearchParams } from 'expo-router';

import { ChapterScreen } from '@/features/reading';
import { useChapter } from '@/features/reading/hooks/useChapter';
import { VerseList } from '@/features/reading/components/VerseList';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/features/settings', () => ({
  useSelectedTranslation: () => ({
    translationCode: 'syn',
    isLoaded: true,
    setTranslationCode: async () => {},
  }),
}));

jest.mock('@/features/bookmarks', () => ({
  saveReadingPosition: jest.fn(() => Promise.resolve()),
  useBookmarkedVerses: () => ({
    verseNumbers: new Set<number>(),
    toggleVerse: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('@/features/reading/hooks/useChapter', () => ({
  useChapter: jest.fn(),
}));

jest.mock('@/features/reading/hooks/useChapterFootnotes', () => ({
  useChapterFootnotes: () => ({
    footnotesByVerseId: null,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/features/reading/components/VerseList', () => ({
  VerseList: jest.fn(() => null),
}));

jest.mock('@/features/reading/components/FootnoteSheet', () => ({
  FootnoteSheet: () => null,
}));

const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockUseChapter = jest.mocked(useChapter);
const mockSaveReadingPosition = jest.mocked(saveReadingPosition);
const mockVerseList = jest.mocked(VerseList);

const BOOK: Book = {
  id: 42,
  translationId: 1,
  universalId: 1,
  orderNum: 1,
  title: 'Бытие',
  shortTitle: 'Быт',
  chapterCount: 50,
  canonical: true,
};

const VERSES: Verse[] = [
  { id: 1, bookId: 42, chapter: 1, number: 1, text: 'В начале' },
];

function renderChapterScreen() {
  return render(
    <ThemeProvider>
      <ChapterScreen />
    </ThemeProvider>,
  );
}

describe('ChapterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      book: '1',
      chapter: '1',
    } as ReturnType<typeof useLocalSearchParams>);
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the loading state', async () => {
    mockUseChapter.mockReturnValue({
      book: null,
      verses: null,
      isLoading: true,
      error: null,
    });

    await renderChapterScreen();

    expect(screen.getByText('Загрузка…')).toBeOnTheScreen();
  });

  it('shows the error state and reloads the chapter on retry', async () => {
    mockUseChapter.mockReturnValue({
      book: null,
      verses: null,
      isLoading: false,
      error: new Error('db locked'),
    });

    await renderChapterScreen();

    expect(screen.getByText('Не удалось загрузить главу')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Повторить'));

    expect(mockUseChapter).toHaveBeenLastCalledWith('syn', 1, 1, 1);
  });

  it('renders the chapter for an empty verse list', async () => {
    mockUseChapter.mockReturnValue({
      book: BOOK,
      verses: [],
      isLoading: false,
      error: null,
    });

    await renderChapterScreen();

    const verseListProps = mockVerseList.mock.calls[0]?.[0];
    expect(verseListProps).toEqual(expect.objectContaining({ verses: [] }));
    expect(verseListProps?.header).toEqual(
      expect.objectContaining({ props: { title: 'Бытие', chapter: 1 } }),
    );
    expect(screen.getByText('2 Глава ›')).toBeOnTheScreen();
    expect(mockSaveReadingPosition).toHaveBeenCalledWith(1, 1);
  });

  it('passes loaded verses to the list', async () => {
    mockUseChapter.mockReturnValue({
      book: BOOK,
      verses: VERSES,
      isLoading: false,
      error: null,
    });

    await renderChapterScreen();

    expect(mockVerseList.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ verses: VERSES }),
    );
  });
});
