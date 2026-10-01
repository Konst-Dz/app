import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Book } from '@/db/models';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

interface ContinueReadingBannerProps {
  book: Book;
  chapter: number;
  onPress: () => void;
}

export const ContinueReadingBanner = memo(function ContinueReadingBanner({
  book,
  chapter,
  onPress,
}: ContinueReadingBannerProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.banner,
        { backgroundColor: palette.surface, borderBottomColor: palette.border },
        pressed ? styles.bannerPressed : null,
      ]}
    >
      <Ionicons name="book" size={fontSizes.lg} color={palette.primary} />
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: palette.textMuted, fontSize: fontSizes.sm }]}>
          Продолжить чтение
        </Text>
        <Text style={[styles.title, { color: palette.text, fontSize: fontSizes.md }]}>
          {book.title} {chapter}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={fontSizes.lg} color={palette.textMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.m,
    paddingBottom: spacing.m,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: spacing.m,
  },
  bannerPressed: {
    opacity: 0.7,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '600',
  },
});
