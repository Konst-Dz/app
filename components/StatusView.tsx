import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

interface StatusViewProps {
  label: string;
  detail?: string;
  withSpinner?: boolean;
  onRetry?: () => void;
}

export function StatusView({ label, detail, withSpinner = false, onRetry }: StatusViewProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <View style={[styles.status, { backgroundColor: palette.background }]}>
      {withSpinner ? <ActivityIndicator color={palette.primary} size="large" /> : null}
      <Text style={[styles.statusText, { color: palette.textMuted, fontSize: fontSizes.md }]}>
        {label}
      </Text>
      {detail ? (
        <Text style={[styles.detailText, { color: palette.textMuted, fontSize: fontSizes.sm }]}>
          {detail}
        </Text>
      ) : null}
      {onRetry ? <RetryButton onPress={onRetry} /> : null}
    </View>
  );
}

interface RetryButtonProps {
  onPress: () => void;
}

function RetryButton({ onPress }: RetryButtonProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.retryButton, { backgroundColor: palette.primary }]}
    >
      <Text style={[styles.retryText, { color: palette.background, fontSize: fontSizes.sm }]}>
        Повторить
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.m,
    justifyContent: 'center',
    paddingLeft: spacing.l,
    paddingRight: spacing.l,
  },
  statusText: {
    textAlign: 'center',
  },
  detailText: {
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: spacing.s,
    paddingBottom: spacing.s,
    paddingLeft: spacing.l,
    paddingRight: spacing.l,
    paddingTop: spacing.s,
  },
  retryText: {
    fontWeight: '600',
  },
});
