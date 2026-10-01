import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
} from 'react-native';

import type { Book } from '@/db/models';
import { StatusView } from '@/components/StatusView';
import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import { DEFAULT_TRANSLATION } from '../api/readingRepository';
import { useBooks } from '../hooks/useBooks';
import { groupBooksByTestament } from '../lib/books';
import { BookRow } from './BookRow';

export function ReadingScreen() {
  const { palette, fontSizes } = useTheme();
  const [reloadKey, setReloadKey] = useState(0);
  const { books, isLoading, error } = useBooks(DEFAULT_TRANSLATION, reloadKey);

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
