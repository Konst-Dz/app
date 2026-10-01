import { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import type { Verse } from '@/db/models';
import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';

import { VerseRow } from './VerseRow';

interface VerseListProps {
  verses: Verse[];
  header: React.ReactElement;
  targetVerse?: number | null;
  bookmarkedVerseNumbers?: ReadonlySet<number>;
  onVerseLongPress?: (verse: Verse) => void;
}

interface ScrollToIndexFailedInfo {
  index: number;
  highestMeasuredFrameIndex: number;
  averageItemLength: number;
}

const INITIAL_NUM_TO_RENDER = 25;
const MAX_TO_RENDER_PER_BATCH = 25;
const WINDOW_SIZE = 7;
const SCROLL_RETRY_DELAY_MS = 100;

export function VerseList({
  verses,
  header,
  targetVerse = null,
  bookmarkedVerseNumbers,
  onVerseLongPress,
}: VerseListProps) {
  const listRef = useRef<FlatList<Verse> | null>(null);

  useEffect(() => {
    if (targetVerse === null || verses.length === 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      return;
    }
    const index = verses.findIndex((verse) => verse.number === targetVerse);
    if (index === -1) {
      logger.debug('VerseList', 'Target verse not found in chapter', {
        targetVerse,
      });
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      return;
    }
    logger.debug('VerseList', 'Scrolling to verse', { targetVerse, index });
    listRef.current?.scrollToIndex({ index, viewPosition: 0, animated: false });
  }, [verses, targetVerse]);

  const handleScrollToIndexFailed = useCallback(
    (info: ScrollToIndexFailedInfo) => {
      logger.debug('VerseList', 'Scroll to index failed, retrying', {
        index: info.index,
      });
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: info.index, viewPosition: 0, animated: false });
      }, SCROLL_RETRY_DELAY_MS);
    },
    [],
  );

  const renderVerse = useCallback(
    ({ item }: { item: Verse }) => (
      <VerseRow
        verse={item}
        isHighlighted={targetVerse !== null && item.number === targetVerse}
        isBookmarked={bookmarkedVerseNumbers?.has(item.number) ?? false}
        onLongPress={onVerseLongPress}
      />
    ),
    [targetVerse, bookmarkedVerseNumbers, onVerseLongPress],
  );

  return (
    <FlatList
      ref={listRef}
      data={verses}
      renderItem={renderVerse}
      keyExtractor={(verse) => String(verse.id)}
      ListHeaderComponent={header}
      contentContainerStyle={styles.content}
      initialNumToRender={INITIAL_NUM_TO_RENDER}
      maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
      windowSize={WINDOW_SIZE}
      onScrollToIndexFailed={handleScrollToIndexFailed}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
});
