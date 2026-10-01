import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

export type BookmarksSegment = 'bookmarks' | 'history';

interface SegmentSwitcherProps {
  value: BookmarksSegment;
  onChange: (segment: BookmarksSegment) => void;
}

const SEGMENTS: ReadonlyArray<{ key: BookmarksSegment; label: string }> = [
  { key: 'bookmarks', label: 'Закладки' },
  { key: 'history', label: 'История' },
];

export const SegmentSwitcher = memo(function SegmentSwitcher({
  value,
  onChange,
}: SegmentSwitcherProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <View style={[styles.container, { borderColor: palette.border }]}>
      {SEGMENTS.map((segment) => {
        const isActive = segment.key === value;
        return (
          <Pressable
            key={segment.key}
            onPress={() => onChange(segment.key)}
            style={[styles.segment, isActive ? { backgroundColor: palette.primary } : null]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? palette.background : palette.textMuted, fontSize: fontSizes.sm },
              ]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.s,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginHorizontal: spacing.m,
    marginTop: spacing.s,
    marginBottom: spacing.s,
    overflow: 'hidden',
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    paddingBottom: spacing.s,
    paddingTop: spacing.s,
  },
  label: {
    fontWeight: '600',
  },
});
