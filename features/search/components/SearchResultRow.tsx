import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { fontSizes, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import type { SearchResultItem } from '../api/searchRepository';
import { SnippetText } from './SnippetText';

interface SearchResultRowProps {
  item: SearchResultItem;
  onPress: (item: SearchResultItem) => void;
}

export const SearchResultRow = memo(function SearchResultRow({
  item,
  onPress,
}: SearchResultRowProps) {
  const { palette } = useTheme();

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        pressed ? { backgroundColor: palette.surface } : null,
      ]}
    >
      <Text style={[styles.reference, { color: palette.textMuted, fontSize: fontSizes.sm }]}>
        {`${item.bookShortTitle} ${item.chapter}:${item.verseNumber}`}
      </Text>
      <SnippetText snippet={item.snippet} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.s,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: spacing.s,
  },
  reference: {
    marginBottom: spacing.xs,
  },
});
