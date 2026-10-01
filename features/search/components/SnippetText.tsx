import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { fontSizes } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import { splitSnippet } from '../lib/query';

interface SnippetTextProps {
  snippet: string;
}

export const SnippetText = memo(function SnippetText({ snippet }: SnippetTextProps) {
  const { palette } = useTheme();
  const segments = splitSnippet(snippet);

  return (
    <Text style={[styles.text, { color: palette.text, fontSize: fontSizes.md }]}>
      {segments.map((segment, index) => (
        <Text
          key={index}
          style={segment.isHighlighted ? { color: palette.primary, fontWeight: '600' } : null}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
});

const styles = StyleSheet.create({
  text: {
    flex: 1,
    lineHeight: fontSizes.md * 1.5,
  },
});
