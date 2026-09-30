import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { spacing } from '@/theme/tokens';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (__DEV__) {
      console.error('[ErrorBoundary] caught error', error);
    }
  }

  render(): ReactNode {
    const { error } = this.state;

    if (error) {
      return <ErrorFallback description={error.message} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ description }: { description: string }) {
  const { palette, fontSizes } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.text, fontSize: fontSizes.lg }]}>
        Не удалось загрузить данные
      </Text>
      <Text style={[styles.description, { color: palette.textMuted, fontSize: fontSizes.md }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.s,
    justifyContent: 'center',
    padding: spacing.l,
  },
  title: {
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
  },
});
