import { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import type { Verse } from '@/db/models';
import { spacing } from '@/theme/tokens';

import { VerseRow } from './VerseRow';

interface VerseListProps {
  verses: Verse[];
  header: React.ReactElement;
}

const INITIAL_NUM_TO_RENDER = 25;
const MAX_TO_RENDER_PER_BATCH = 25;
const WINDOW_SIZE = 7;

export function VerseList({ verses, header }: VerseListProps) {
  const listRef = useRef<FlatList<Verse> | null>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [verses]);

  const renderVerse = useCallback(
    ({ item }: { item: Verse }) => <VerseRow verse={item} />,
    [],
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
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
});
