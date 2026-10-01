import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
} from 'react-native';

import type { Book } from '@/db/models';
import { StatusView } from '@/components/StatusView';
import { useLastReadPosition } from '@/features/bookmarks';
import { useSelectedTranslation } from '@/features/settings';
import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import { useBooks } from '../hooks/useBooks';
import { groupBooksByTestament } from '../lib/books';
import { BookRow } from './BookRow';
import { ContinueReadingBanner } from './ContinueReadingBanner';

export function ReadingScreen() {
  const { palette, fontSizes } = useTheme();
  const [reloadKey, setReloadKey] = useState(0);
  const { translationCode } = useSelectedTranslation();
  const { books, isLoading, error } = useBooks(translationCode, reloadKey);
  const { position: lastReadPosition, refresh: refreshLastReadPosition } = useLastReadPosition();

  useFocusEffect(
    useCallback(() => {
      logger.debug('ReadingScreen', 'Screen focused, refreshing last read position');
      refreshLastReadPosition();
    }, [refreshLastReadPosition]),
  );

  const lastReadBook = useMemo(() => {
    if (!books || !lastReadPosition) {
      return null;
    }
    return books.find((book) => book.universalId === lastReadPosition.bookUniversalId) ?? null;
  }, [books, lastReadPosition]);

  const sections = useMemo(
    () => (books ? groupBooksByTestament(books) : []),
    [books],
  );

  const handleBookPress = useCallback((book: Book) => {
    logger.debug('ReadingScreen', 'Book selected', {
      universalId: book.universalId,
      title: book.title,
    });
    router.push({
      pathname: '/chapter/[book]/[chapter]',
      params: { book: String(book.universalId), chapter: '1' },
    });
  }, []);

  const handleContinuePress = useCallback(() => {
    if (!lastReadPosition) {
      return;
    }
    logger.info('ReadingScreen', 'Continue reading pressed', {
      universalId: lastReadPosition.bookUniversalId,
      chapter: lastReadPosition.chapter,
    });
    router.push({
      pathname: '/chapter/[book]/[chapter]',
      params: {
        book: String(lastReadPosition.bookUniversalId),
        chapter: String(lastReadPosition.chapter),
      },
    });
  }, [lastReadPosition]);

  const handleRetry = useCallback(() => {
    logger.debug('ReadingScreen', 'Retry books load');
    setReloadKey((key) => key + 1);
  }, []);

  if (isLoading && books === null) {
    return <StatusView label="Загрузка…" withSpinner />;
  }

  if (error) {
    return <StatusView label="Не удалось загрузить книги" onRetry={handleRetry} />;
  }

  if (books !== null && books.length === 0) {
    return <StatusView label="Книги не найдены" />;
  }

  return (
    <SectionList
      style={styles.list}
      sections={sections}
      keyExtractor={(book) => String(book.id)}
      renderItem={({ item }) => <BookRow book={item} onPress={handleBookPress} />}
      renderSectionHeader={({ section }) => (
        <Text
          style={[
            styles.sectionHeader,
            {
              backgroundColor: palette.background,
              color: palette.textMuted,
              fontSize: fontSizes.sm,
            },
          ]}
        >
          {section.title}
        </Text>
      )}
      ListHeaderComponent={
        lastReadPosition && lastReadBook ? (
          <ContinueReadingBanner
            book={lastReadBook}
            chapter={lastReadPosition.chapter}
            onPress={handleContinuePress}
          />
        ) : null
      }
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled
      refreshing={isLoading}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRetry}
          tintColor={palette.primary}
          colors={[palette.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.l,
  },
  sectionHeader: {
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingBottom: spacing.s,
    paddingLeft: spacing.m,
    paddingTop: spacing.m,
    textTransform: 'uppercase',
  },
});
