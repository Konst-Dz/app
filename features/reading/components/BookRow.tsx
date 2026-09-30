import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Book } from '@/db/models';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

interface BookRowProps {
  book: Book;
  onPress: (book: Book) => void;
}

export const BookRow = memo(function BookRow({ book, onPress }: BookRowProps) {
  const { palette, fontSizes } = useTheme();

  const handlePress = useCallback(() => {
    onPress(book);
  }, [book, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? palette.surface : palette.background,
          borderBottomColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: palette.text, fontSize: fontSizes.md }]}>
        {book.title}
      </Text>
      <Text style={[styles.shortTitle, { color: palette.textMuted, fontSize: fontSizes.sm }]}>
        {book.shortTitle}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingBottom: spacing.s,
    paddingTop: spacing.s,
  },
  title: {
    flex: 1,
    fontWeight: '500',
  },
  shortTitle: {
    marginLeft: spacing.s,
  },
});
