import { Ionicons } from '@expo/vector-icons';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DATABASE_ASSET_SOURCE, DATABASE_NAME, initDatabase } from '@/db/database';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface TabDescriptor {
  route: string;
  title: string;
  icon: IoniconsName;
}

const TABS: TabDescriptor[] = [
  { route: 'index', title: 'Reading', icon: 'book-outline' },
  { route: 'search', title: 'Search', icon: 'search' },
  { route: 'bookmarks', title: 'Bookmarks', icon: 'bookmark-outline' },
  { route: 'settings', title: 'Settings', icon: 'settings-outline' },
];

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
            <RootTabs />
          </SQLiteProvider>
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  );
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

function RootTabs() {
  const { palette } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerShadowVisible: false,
        headerTintColor: palette.text,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.route}
          name={tab.route}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
