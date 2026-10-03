import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusView } from '@/components/StatusView';
import { useSelectedTranslation } from '@/features/settings';
import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

import {
  DEFAULT_SEARCH_LIMIT,
  type SearchResultItem,
} from '../api/searchRepository';
import { useSearch } from '../hooks/useSearch';
import { SearchResultRow } from './SearchResultRow';

const INITIAL_NUM_TO_RENDER = 20;
const MAX_TO_RENDER_PER_BATCH = 20;
const WINDOW_SIZE = 7;

function searchResultKeyExtractor(item: SearchResultItem): string {
  return String(item.verseId);
}

export function SearchScreen() {
  const { palette, fontSizes } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const { translationCode } = useSelectedTranslation();
  const { results, isLoading, error } = useSearch(
    query,
    translationCode,
    reloadKey,
  );

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const handleRetry = useCallback(() => {
    logger.debug('SearchScreen', 'Retry search');
    setReloadKey((key) => key + 1);
  }, []);

  const handleResultPress = useCallback((item: SearchResultItem) => {
    logger.debug('SearchScreen', 'Search result pressed', {
      verseId: item.verseId,
      book: item.bookUniversalId,
      chapter: item.chapter,
      verse: item.verseNumber,
    });
    router.push({
      pathname: '/chapter/[book]/[chapter]',
      params: {
        book: String(item.bookUniversalId),
        chapter: String(item.chapter),
        verse: String(item.verseNumber),
      },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SearchResultItem>) => (
      <SearchResultRow item={item} onPress={handleResultPress} />
    ),
    [handleResultPress],
  );

  const renderContent = () => {
    if (error !== null) {
      return (
        <StatusView label="Не удалось выполнить поиск" onRetry={handleRetry} />
      );
    }
    if (isLoading) {
      return <StatusView label="Поиск…" withSpinner />;
    }
    if (results === null) {
      return null;
    }
    if (results.length === 0) {
      return <StatusView label="Ничего не найдено" />;
    }
    return (
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={searchResultKeyExtractor}
        contentContainerStyle={styles.listContent}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
        windowSize={WINDOW_SIZE}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          results.length >= DEFAULT_SEARCH_LIMIT ? <ResultsLimitFooter /> : null
        }
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            marginTop: spacing.m,
          },
        ]}
      >
        <Ionicons name="search" size={fontSizes.lg} color={palette.textMuted} />
        <TextInput
          style={[
            styles.input,
            { color: palette.text, fontSize: fontSizes.md },
          ]}
          placeholder="Поиск по стихам"
          placeholderTextColor={palette.textMuted}
          value={query}
          onChangeText={handleQueryChange}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query !== '' ? (
          <Pressable onPress={handleClear} hitSlop={spacing.s}>
            <Ionicons
              name="close-circle"
              size={fontSizes.lg}
              color={palette.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      <View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, spacing.m) },
        ]}
      >
        {renderContent()}
      </View>
    </KeyboardAvoidingView>
  );
}

function ResultsLimitFooter() {
  const { palette, fontSizes } = useTheme();

  return (
    <Text
      style={[
        styles.limitFooter,
        { color: palette.textMuted, fontSize: fontSizes.sm },
      ]}
    >
      {`Показаны первые ${DEFAULT_SEARCH_LIMIT} результатов`}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchBar: {
    alignItems: 'center',
    borderRadius: spacing.s,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.s,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    paddingLeft: spacing.s,
    paddingRight: spacing.s,
  },
  input: {
    flex: 1,
    paddingBottom: spacing.s,
    paddingTop: spacing.s,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  limitFooter: {
    paddingBottom: spacing.l,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: spacing.m,
    textAlign: 'center',
  },
});
