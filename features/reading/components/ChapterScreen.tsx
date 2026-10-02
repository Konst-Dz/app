import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Footnote, Verse } from '@/db/models';
import { StatusView } from '@/components/StatusView';
import { saveReadingPosition, useBookmarkedVerses } from '@/features/bookmarks';
import { useSelectedTranslation } from '@/features/settings';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import { useChapter } from '../hooks/useChapter';
import { useChapterFootnotes } from '../hooks/useChapterFootnotes';
import { getAdjacentChapter } from '../lib/navigation';
import { ChapterHeader } from './ChapterHeader';
import { FootnoteSheet } from './FootnoteSheet';
import { VerseList } from './VerseList';

interface SelectedFootnoteVerse {
  verseNumber: number;
  footnotes: ReadonlyArray<Footnote>;
}

const EMPTY_FOOTNOTES: ReadonlyArray<Footnote> = [];

function parseRouteNumber(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function ChapterScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ book: string; chapter: string; verse?: string }>();
  const [reloadKey, setReloadKey] = useState(0);
  const { translationCode } = useSelectedTranslation();

  const universalId = parseRouteNumber(params.book);
  const chapter = parseRouteNumber(params.chapter);
  const targetVerse = parseRouteNumber(params.verse);
  const { book, verses, isLoading, error } = useChapter(
    translationCode,
    universalId ?? 0,
    chapter ?? 0,
    reloadKey,
  );

  const adjacent = useMemo(
    () => getAdjacentChapter(chapter ?? 0, book?.chapterCount ?? 0),
    [chapter, book?.chapterCount],
  );

  const { verseNumbers: bookmarkedVerses, toggleVerse } = useBookmarkedVerses(
    universalId ?? 0,
    chapter ?? 0,
  );

  const {
    footnotesByVerseId,
    isLoading: footnotesLoading,
    error: footnotesError,
  } = useChapterFootnotes(book?.id ?? null, chapter ?? 0);

  const footnoteVerseIds = useMemo(
    () => (footnotesByVerseId ? new Set(footnotesByVerseId.keys()) : null),
    [footnotesByVerseId],
  );

  const [selectedFootnoteVerse, setSelectedFootnoteVerse] =
    useState<SelectedFootnoteVerse | null>(null);

  useEffect(() => {
    logger.debug('ChapterScreen', 'Route params', { book: params.book, chapter: params.chapter });
    if (universalId === null || chapter === null) {
      logger.warn('ChapterScreen', 'Invalid route params, returning to book list', {
        book: params.book,
        chapter: params.chapter,
      });
      router.replace('/(tabs)');
    }
  }, [universalId, chapter, params.book, params.chapter]);

  useEffect(() => {
    if (universalId === null || chapter === null || !book || verses === null) {
      return;
    }
    logger.debug('ChapterScreen', 'Recording reading position', {
      universalId,
      chapter,
    });
    saveReadingPosition(universalId, chapter).catch((cause: unknown) => {
      logger.warn('ChapterScreen', 'Failed to record reading position', {
        universalId,
        chapter,
        message: toError(cause).message,
      });
    });
  }, [universalId, chapter, book, verses]);

  const goToChapter = useCallback(
    (target: number) => {
      if (universalId === null) {
        return;
      }
      logger.debug('ChapterScreen', 'Navigate to chapter', {
        from: chapter,
        to: target,
        universalId,
      });
      router.replace({
        pathname: '/chapter/[book]/[chapter]',
        params: { book: String(universalId), chapter: String(target) },
      });
    },
    [universalId, chapter],
  );

  const handlePrev = useCallback(() => {
    if (adjacent.prev !== null) {
      goToChapter(adjacent.prev);
    }
  }, [adjacent.prev, goToChapter]);

  const handleNext = useCallback(() => {
    if (adjacent.next !== null) {
      goToChapter(adjacent.next);
    }
  }, [adjacent.next, goToChapter]);

  const handleRetry = useCallback(() => {
    logger.debug('ChapterScreen', 'Retry chapter load');
    setReloadKey((key) => key + 1);
  }, []);

  const handleVerseLongPress = useCallback(
    (verse: Verse) => {
      if (universalId === null || chapter === null) {
        return;
      }
      logger.info('ChapterScreen', 'Bookmark toggle requested from verse', {
        universalId,
        chapter,
        verse: verse.number,
      });
      void toggleVerse(verse.number);
    },
    [toggleVerse, universalId, chapter],
  );

  const handleVersePress = useCallback(
    (verse: Verse) => {
      const footnotes = footnotesByVerseId?.get(verse.id);
      if (!footnotes || footnotes.length === 0) {
        return;
      }
      logger.info('ChapterScreen', 'Footnotes opened for verse', {
        universalId,
        chapter,
        verse: verse.number,
        footnoteCount: footnotes.length,
      });
      setSelectedFootnoteVerse({ verseNumber: verse.number, footnotes });
    },
    [footnotesByVerseId, universalId, chapter],
  );

  const handleFootnoteSheetClose = useCallback(() => {
    setSelectedFootnoteVerse(null);
  }, []);

  if (universalId === null || chapter === null) {
    return null;
  }

  if (isLoading && verses === null) {
    return <StatusView label="Загрузка…" withSpinner />;
  }

  if (error) {
    return <StatusView label="Не удалось загрузить главу" onRetry={handleRetry} />;
  }

  if (!book) {
    return <StatusView label="Книга не найдена" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen
        options={{
          title: book.title,
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text,
          contentStyle: { backgroundColor: palette.background },
        }}
      />
      <VerseList
        verses={verses ?? []}
        header={<ChapterHeader title={book.title} chapter={chapter} />}
        targetVerse={targetVerse}
        bookmarkedVerseNumbers={bookmarkedVerses}
        footnoteVerseIds={footnoteVerseIds}
        onVersePress={handleVersePress}
        onVerseLongPress={handleVerseLongPress}
      />
      <View
        style={[
          styles.navigationBar,
          {
            backgroundColor: palette.background,
            borderTopColor: palette.border,
            paddingBottom: Math.max(insets.bottom, spacing.s),
          },
        ]}
      >
        <ChapterNavButton
          label={`‹ Глава ${adjacent.prev ?? ''}`.trimEnd()}
          disabled={adjacent.prev === null}
          onPress={handlePrev}
        />
        <ChapterNavButton
          label={`${adjacent.next ?? ''} Глава ›`.trimStart()}
          disabled={adjacent.next === null}
          onPress={handleNext}
        />
      </View>
      <FootnoteSheet
        visible={selectedFootnoteVerse !== null}
        chapterTitle={book.title}
        chapter={chapter}
        verseNumber={selectedFootnoteVerse?.verseNumber ?? 0}
        footnotes={selectedFootnoteVerse?.footnotes ?? EMPTY_FOOTNOTES}
        isLoading={footnotesLoading}
        error={footnotesError}
        onClose={handleFootnoteSheetClose}
      />
    </View>
  );
}

interface ChapterNavButtonProps {
  label: string;
  disabled: boolean;
  onPress: () => void;
}

function ChapterNavButton({ label, disabled, onPress }: ChapterNavButtonProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.navButton,
        pressed && !disabled ? styles.navButtonPressed : null,
        pressed && !disabled ? { backgroundColor: palette.surface } : null,
      ]}
    >
      <Text
        style={[
          styles.navButtonText,
          { color: disabled ? palette.textMuted : palette.primary, fontSize: fontSizes.md },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  navigationBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 48,
  },
  navButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.s,
    paddingTop: spacing.s,
  },
  navButtonPressed: {},
  navButtonText: {
    fontWeight: '500',
  },
});
