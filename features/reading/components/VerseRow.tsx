import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Verse } from '@/db/models';
import { fontSizes, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

interface VerseRowProps {
  verse: Verse;
  isHighlighted?: boolean;
  isBookmarked?: boolean;
  hasFootnote?: boolean;
  onPress?: (verse: Verse) => void;
  onLongPress?: (verse: Verse) => void;
}

export const VerseRow = memo(function VerseRow({
  verse,
  isHighlighted = false,
  isBookmarked = false,
  hasFootnote = false,
  onPress,
  onLongPress,
}: VerseRowProps) {
  const { palette, fontSizes } = useTheme();

  const handlePress = useCallback(() => {
    onPress?.(verse);
  }, [onPress, verse]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(verse);
  }, [onLongPress, verse]);

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      onLongPress={onLongPress ? handleLongPress : undefined}
      style={({ pressed }) => (pressed && onPress ? styles.rowPressed : null)}
    >
      <View
        style={[
          styles.row,
          { borderBottomColor: palette.border },
          isHighlighted ? { backgroundColor: palette.surface } : null,
        ]}
      >
        <View style={styles.marker}>
          {isBookmarked ? (
            <Ionicons
              name="bookmark"
              size={fontSizes.sm}
              color={palette.primary}
            />
          ) : null}
          {!isBookmarked && hasFootnote ? (
            <Ionicons
              name="document-text-outline"
              size={fontSizes.sm}
              color={palette.primary}
            />
          ) : null}
          <Text
            style={[
              styles.number,
              {
                color: isBookmarked ? palette.primary : palette.textMuted,
                fontSize: fontSizes.sm,
              },
            ]}
          >
            {verse.number}
          </Text>
        </View>
        <Text
          style={[styles.text, { color: palette.text, fontSize: fontSizes.md }]}
        >
          {verse.text}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: spacing.s,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: spacing.s,
  },
  marker: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: spacing.xl,
    paddingRight: spacing.s,
  },
  number: {
    textAlign: 'right',
  },
  text: {
    flex: 1,
    lineHeight: fontSizes.md * 1.5,
  },
  rowPressed: {
    opacity: 0.7,
  },
});
