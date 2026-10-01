import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSizes, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import { formatOpenedAt } from '../lib/formatOpenedAt';
import type { HistoryItem } from '../hooks/useHistoryItems';

interface HistoryItemRowProps {
  item: HistoryItem;
  onPress: (item: HistoryItem) => void;
}

export const HistoryItemRow = memo(function HistoryItemRow({ item, onPress }: HistoryItemRowProps) {
  const { palette, fontSizes } = useTheme();

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: palette.border },
        pressed ? { backgroundColor: palette.surface } : null,
      ]}
    >
      <Ionicons name="time-outline" size={fontSizes.lg} color={palette.textMuted} />
      <View style={styles.textContainer}>
        <Text style={[styles.reference, { color: palette.text, fontSize: fontSizes.md }]}>
          {item.reference}
        </Text>
        <Text style={[styles.openedAt, { color: palette.textMuted, fontSize: fontSizes.sm }]}>
          {formatOpenedAt(item.position.openedAt)}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.m,
    paddingBottom: spacing.m,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: spacing.m,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  reference: {
    fontWeight: '500',
  },
  openedAt: {},
});
