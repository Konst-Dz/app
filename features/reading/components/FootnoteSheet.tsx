import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Footnote } from '@/db/models';
import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

interface FootnoteSheetProps {
  visible: boolean;
  chapterTitle: string;
  chapter: number;
  verseNumber: number;
  footnotes: readonly Footnote[];
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
}

export const FootnoteSheet = memo(function FootnoteSheet({
  visible,
  chapterTitle,
  chapter,
  verseNumber,
  footnotes,
  isLoading,
  error,
  onClose,
}: FootnoteSheetProps) {
  const { palette, fontSizes, readingFontSize, readingLineHeight } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      logger.debug('FootnoteSheet', 'Footnote sheet opened', {
        chapter,
        verseNumber,
      });
    }
  }, [visible, chapter, verseNumber]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View
            style={[styles.backdropTint, { backgroundColor: palette.overlay }]}
          />
        </Pressable>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: palette.background,
              borderTopColor: palette.border,
              paddingBottom: Math.max(insets.bottom, spacing.m),
            },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: palette.text, fontSize: fontSizes.lg },
              ]}
            >
              {chapterTitle} {chapter}:{verseNumber}
            </Text>
            <Pressable
              accessibilityLabel="Закрыть сноски"
              onPress={onClose}
              style={({ pressed }) => (pressed ? styles.closePressed : null)}
            >
              <Ionicons
                name="close"
                size={fontSizes.xl}
                color={palette.textMuted}
              />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.status}>
              <ActivityIndicator color={palette.primary} />
              <Text
                style={[
                  styles.statusText,
                  { color: palette.textMuted, fontSize: fontSizes.md },
                ]}
              >
                Загрузка сносок…
              </Text>
            </View>
          ) : error !== null ? (
            <View style={styles.status}>
              <Text
                style={[
                  styles.statusText,
                  { color: palette.textMuted, fontSize: fontSizes.md },
                ]}
              >
                Не удалось загрузить сноски
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              alwaysBounceVertical={false}
            >
              {footnotes.map((footnote) => (
                <View key={footnote.id} style={styles.footnote}>
                  <Text
                    style={[
                      styles.marker,
                      { color: palette.primary, fontSize: fontSizes.md },
                    ]}
                  >
                    {footnote.marker ?? ''}
                  </Text>
                  <Text
                    style={[
                      styles.footnoteText,
                      {
                        color: palette.text,
                        fontSize: readingFontSize,
                        lineHeight: readingLineHeight,
                      },
                    ]}
                  >
                    {footnote.text}
                  </Text>
                </View>
              ))}
              {footnotes.length === 0 ? (
                <Text
                  style={[
                    styles.statusText,
                    { color: palette.textMuted, fontSize: fontSizes.md },
                  ]}
                >
                  У этого стиха нет сносок
                </Text>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backdropTint: {
    flex: 1,
    opacity: 0.4,
  },
  panel: {
    borderTopLeftRadius: spacing.m,
    borderTopRightRadius: spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '70%',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  closePressed: {
    opacity: 0.7,
  },
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.s,
    paddingBottom: spacing.l,
    paddingTop: spacing.s,
  },
  statusText: {
    flex: 1,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: spacing.l,
  },
  footnote: {
    flexDirection: 'row',
    marginBottom: spacing.s,
  },
  marker: {
    fontWeight: '600',
    minWidth: spacing.l,
  },
  footnoteText: {
    flex: 1,
  },
});
