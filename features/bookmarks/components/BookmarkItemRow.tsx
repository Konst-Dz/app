import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSizes, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import type { BookmarkItem } from '../hooks/useBookmarkItems';

interface BookmarkItemRowProps {
  item: BookmarkItem;
  onPress: (item: BookmarkItem) => void;
  onDelete: (item: BookmarkItem) => void;
}

export const BookmarkItemRow = memo(function BookmarkItemRow({
  item,
  onPress,
  onDelete,
}: BookmarkItemRowProps) {
  const { palette, fontSizes } = useTheme();

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const handleDelete = useCallback(() => {
    onDelete(item);
  }, [item, onDelete]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: palette.border },
        pressed ? { backgroundColor: palette.surface } : null,
      ]}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.reference, { color: palette.primary, fontSize: fontSizes.sm }]}>
          {item.reference}
        </Text>
        {item.text !== null ? (
          <Text
            style={[styles.text, { color: palette.text, fontSize: fontSizes.md }]}
            numberOfLines={3}
          >
            {item.text}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={handleDelete}
        hitSlop={8}
        style={styles.deleteButton}
        accessibilityLabel="Удалить закладку"
      >
        <Ionicons name="trash-outline" size={fontSizes.lg} color={palette.textMuted} />
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.s,
    paddingBottom: spacing.m,
    paddingLeft: spacing.m,
    paddingRight: spacing.s,
    paddingTop: spacing.m,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  reference: {
    fontWeight: '600',
  },
  text: {
    lineHeight: fontSizes.md * 1.4,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.s,
  },
});
