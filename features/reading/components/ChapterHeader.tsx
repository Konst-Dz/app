import { StyleSheet, Text } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

interface ChapterHeaderProps {
  title: string;
  chapter: number;
}

export function ChapterHeader({ title, chapter }: ChapterHeaderProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <Text style={[styles.header, { color: palette.text, fontSize: fontSizes.lg }]}>
      {title}
      <Text style={[styles.chapterSuffix, { color: palette.textMuted, fontSize: fontSizes.md }]}>
        {' '}
        · Глава {chapter}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    fontWeight: '600',
    paddingBottom: spacing.s,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: spacing.m,
  },
  chapterSuffix: {
    fontWeight: '400',
  },
});
