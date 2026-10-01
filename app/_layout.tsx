import { SQLiteProvider } from 'expo-sqlite';
import { Stack, usePathname } from 'expo-router';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DATABASE_ASSET_SOURCE, DATABASE_NAME, initDatabase } from '@/db/database';
import { logger } from '@/lib/logger';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Suspense fallback={<DatabaseFallback />}>
          <SQLiteProvider
            databaseName={DATABASE_NAME}
            assetSource={DATABASE_ASSET_SOURCE}
            onInit={initDatabase}
            useSuspense
          >
            <RouteLogger />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </SQLiteProvider>
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function RouteLogger() {
  const pathname = usePathname();

  useEffect(() => {
    logger.debug('Navigator', 'Route changed', { pathname });
  }, [pathname]);

  return null;
}

function DatabaseFallback() {
  const { palette } = useTheme();

  return (
    <View style={[styles.fallback, { backgroundColor: palette.background }]}>
      <ActivityIndicator color={palette.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
