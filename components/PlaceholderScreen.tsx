import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';

interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
}

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text
        style={[styles.title, { color: palette.text, fontSize: fontSizes.xl }]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: palette.textMuted, fontSize: fontSizes.md },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
  },
});
