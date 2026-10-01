import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AVAILABLE_TRANSLATIONS,
  useSelectedTranslation,
  type AvailableTranslation,
} from '@/features/settings';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

const TRANSLATION_LABELS: Record<
  AvailableTranslation,
  { title: string; subtitle: string }
> = {
  rst: { title: 'Синодальный перевод', subtitle: 'Русский' },
  kjva: { title: 'King James Version с апокрифами', subtitle: 'Английский' },
};

export function SettingsScreen() {
  const { palette, fontSizes } = useTheme();
  const insets = useSafeAreaInsets();
  const { translationCode, setTranslationCode } = useSelectedTranslation();

  const handleTranslationPress = useCallback(
    (code: AvailableTranslation) => {
      if (code === translationCode) {
        return;
      }
      logger.info('SettingsScreen', 'Translation selected', {
        translationCode: code,
      });
      setTranslationCode(code).catch((cause: unknown) => {
        logger.error('SettingsScreen', 'Failed to store translation', {
          translationCode: code,
          message: toError(cause).message,
        });
        Alert.alert('Настройки', 'Не удалось сохранить выбор перевода');
      });
    },
    [setTranslationCode, translationCode],
  );

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: palette.background,
          paddingBottom: Math.max(insets.bottom, spacing.m),
        },
      ]}
    >
      <Text
        style={[
          styles.sectionLabel,
          { color: palette.textMuted, fontSize: fontSizes.sm },
        ]}
      >
        Перевод
      </Text>
      <View
        style={[
          styles.group,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        {AVAILABLE_TRANSLATIONS.map((code) => {
          const isActive = code === translationCode;
          const label = TRANSLATION_LABELS[code];
          return (
            <Pressable
              key={code}
              onPress={() => handleTranslationPress(code)}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <View style={styles.rowText}>
                <Text
                  style={[
                    styles.rowTitle,
                    { color: palette.text, fontSize: fontSizes.md },
                  ]}
                >
                  {label.title}
                </Text>
                <Text
                  style={[
                    styles.rowSubtitle,
                    { color: palette.textMuted, fontSize: fontSizes.sm },
                  ]}
                >
                  {label.subtitle}
                </Text>
              </View>
              {isActive ? (
                <Ionicons
                  name="checkmark"
                  size={fontSizes.lg}
                  color={palette.primary}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: spacing.m,
    paddingHorizontal: spacing.m,
  },
  sectionLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
  },
  group: {
    borderRadius: spacing.s,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.s,
    paddingBottom: spacing.m,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: spacing.m,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontWeight: '500',
  },
  rowSubtitle: {
    marginTop: 2,
  },
});
