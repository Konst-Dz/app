import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

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
      <RootTabs />
    </ThemeProvider>
  );
}

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
