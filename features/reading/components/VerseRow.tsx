import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Verse } from '@/db/models';
import { fontSizes, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

interface VerseRowProps {
  verse: Verse;
  isHighlighted?: boolean;
}

export const VerseRow = memo(function VerseRow({
  verse,
  isHighlighted = false,
}: VerseRowProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: palette.border },
        isHighlighted ? { backgroundColor: palette.surface } : null,
      ]}
    >
      <Text style={[styles.number, { color: palette.textMuted, fontSize: fontSizes.sm }]}>
        {verse.number}
      </Text>
      <Text style={[styles.text, { color: palette.text, fontSize: fontSizes.md }]}>
        {verse.text}
      </Text>
    </View>
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
  number: {
    minWidth: spacing.xl,
    paddingRight: spacing.s,
    textAlign: 'right',
  },
  text: {
    flex: 1,
    lineHeight: fontSizes.md * 1.5,
  },
});
