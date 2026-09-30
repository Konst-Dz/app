import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import { DEFAULT_TRANSLATION } from '../api/readingRepository';
import { useChapter } from '../hooks/useChapter';
import { getAdjacentChapter } from '../lib/navigation';
import { ChapterHeader } from './ChapterHeader';
import { StatusView } from './StatusView';
import { VerseList } from './VerseList';

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
  const { palette, fontSizes } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ book: string; chapter: string }>();
  const [reloadKey, setReloadKey] = useState(0);

  const universalId = parseRouteNumber(params.book);
  const chapter = parseRouteNumber(params.chapter);
  const { book, verses, isLoading, error } = useChapter(
    DEFAULT_TRANSLATION,
    universalId ?? 0,
    chapter ?? 0,
    reloadKey,
  );

  const adjacent = useMemo(
    () => getAdjacentChapter(chapter ?? 0, book?.chapterCount ?? 0),
    [chapter, book?.chapterCount],
  );

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
      <Stack.Screen options={{ title: book.title }} />
      <VerseList
        verses={verses ?? []}
        header={<ChapterHeader title={book.title} chapter={chapter} />}
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
