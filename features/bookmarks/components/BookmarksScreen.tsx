import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { StatusView } from '@/components/StatusView';
import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import type { HistoryItem } from '../hooks/useHistoryItems';
import type { BookmarkItem } from '../hooks/useBookmarkItems';
import { useBookmarks } from '../hooks/useBookmarks';
import { useBookmarkItems } from '../hooks/useBookmarkItems';
import { useHistoryItems } from '../hooks/useHistoryItems';
import { useRecentHistory } from '../hooks/useRecentHistory';
import { BookmarkItemRow } from './BookmarkItemRow';
import { HistoryItemRow } from './HistoryItemRow';
import { SegmentSwitcher, type BookmarksSegment } from './SegmentSwitcher';

const EMPTY_BOOKMARKS_LABEL = 'Закладок пока нет. Нажмите и удерживайте стих, чтобы добавить закладку.';
const EMPTY_HISTORY_LABEL = 'История пуста. Откройте главу, и она появится здесь.';
const LOAD_ERROR_LABEL = 'Не удалось загрузить данные';

export function BookmarksScreen() {
  const contentDb = useSQLiteContext();
  const { palette } = useTheme();
  const [segment, setSegment] = useState<BookmarksSegment>('bookmarks');

  const {
    bookmarks,
    isLoading: isBookmarksLoading,
    error: bookmarksError,
    toggle,
    refresh: refreshBookmarks,
  } = useBookmarks();
  const {
    positions,
    isLoading: isHistoryLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useRecentHistory();

  const { items: bookmarkItems, isReady: bookmarkItemsReady } = useBookmarkItems(
    contentDb,
    bookmarks,
    segment === 'bookmarks',
  );
  const { items: historyItems, isReady: historyItemsReady } = useHistoryItems(
    contentDb,
    positions,
    segment === 'history',
  );

  useFocusEffect(
    useCallback(() => {
      logger.debug('BookmarksScreen', 'Screen focused, refreshing lists');
      refreshBookmarks();
      refreshHistory();
    }, [refreshBookmarks, refreshHistory]),
  );

  const handleBookmarkPress = useCallback((item: BookmarkItem) => {
    logger.info('BookmarksScreen', 'Bookmark pressed', {
      universalId: item.bookmark.bookUniversalId,
      chapter: item.bookmark.chapter,
      verse: item.bookmark.verseNumber,
    });
    router.push({
      pathname: '/chapter/[book]/[chapter]',
      params: {
        book: String(item.bookmark.bookUniversalId),
        chapter: String(item.bookmark.chapter),
        verse: String(item.bookmark.verseNumber),
      },
    });
  }, []);

  const handleHistoryPress = useCallback((item: HistoryItem) => {
    logger.info('BookmarksScreen', 'History entry pressed', {
      universalId: item.position.bookUniversalId,
      chapter: item.position.chapter,
    });
    router.push({
      pathname: '/chapter/[book]/[chapter]',
      params: {
        book: String(item.position.bookUniversalId),
        chapter: String(item.position.chapter),
      },
    });
  }, []);

  const handleBookmarkDelete = useCallback(
    (item: BookmarkItem) => {
      Alert.alert('Удалить закладку?', item.reference, [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            logger.info('BookmarksScreen', 'Bookmark deletion confirmed', {
              universalId: item.bookmark.bookUniversalId,
              chapter: item.bookmark.chapter,
              verse: item.bookmark.verseNumber,
            });
            void toggle(item.bookmark);
          },
        },
      ]);
    },
    [toggle],
  );

  const handleRetry = useCallback(() => {
    logger.debug('BookmarksScreen', 'Retry lists load');
    refreshBookmarks();
    refreshHistory();
  }, [refreshBookmarks, refreshHistory]);

  const isBookmarksSegment = segment === 'bookmarks';
  const keyExtractor = useCallback((item: BookmarkItem | HistoryItem) => item.key, []);

  const renderBookmarkItem = useCallback(
    ({ item }: { item: BookmarkItem }) => (
      <BookmarkItemRow item={item} onPress={handleBookmarkPress} onDelete={handleBookmarkDelete} />
    ),
    [handleBookmarkPress, handleBookmarkDelete],
  );

  const renderHistoryItem = useCallback(
    ({ item }: { item: HistoryItem }) => <HistoryItemRow item={item} onPress={handleHistoryPress} />,
    [handleHistoryPress],
  );

  const loadError = bookmarksError ?? historyError;
  if (loadError) {
    return <StatusView label={LOAD_ERROR_LABEL} onRetry={handleRetry} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SegmentSwitcher value={segment} onChange={setSegment} />
      {isBookmarksSegment ? (
        isBookmarksLoading || !bookmarkItemsReady ? (
          <StatusView label="Загрузка…" withSpinner />
        ) : bookmarkItems.length === 0 ? (
          <StatusView label={EMPTY_BOOKMARKS_LABEL} />
        ) : (
          <FlatList
            data={bookmarkItems}
            renderItem={renderBookmarkItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.content}
          />
        )
      ) : isHistoryLoading || !historyItemsReady ? (
        <StatusView label="Загрузка…" withSpinner />
      ) : historyItems.length === 0 ? (
        <StatusView label={EMPTY_HISTORY_LABEL} />
      ) : (
        <FlatList
          data={historyItems}
          renderItem={renderHistoryItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.content}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.l,
  },
});
