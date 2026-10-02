import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AVAILABLE_TRANSLATIONS,
  useAppearance,
  useSelectedTranslation,
  type AvailableTranslation,
} from '@/features/settings';
import { toError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  READING_FONT_STEPS,
  spacing,
  THEME_MODES,
  type ReadingFontStepId,
  type ThemeMode,
} from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

const TRANSLATION_LABELS: Record<
  AvailableTranslation,
  { title: string; subtitle: string }
> = {
  rst: { title: 'Синодальный перевод', subtitle: 'Русский' },
  kjva: { title: 'King James Version с апокрифами', subtitle: 'Английский' },
};

const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  system: 'Как в системе',
  light: 'Светлая',
  dark: 'Тёмная',
};

const READING_FONT_LABELS: Record<ReadingFontStepId, string> = {
  small: 'Мелкий',
  medium: 'Обычный',
  large: 'Крупный',
  xlarge: 'Очень крупный',
};

export function SettingsScreen() {
  const { palette, readingFontSize, readingLineHeight } = useTheme();
  const insets = useSafeAreaInsets();
  const { translationCode, setTranslationCode } = useSelectedTranslation();
  const {
    themeMode,
    readingFontStepId,
    setThemeMode,
    setReadingFontStepId,
  } = useAppearance();

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

  const handleThemeModePress = useCallback(
    (mode: ThemeMode) => {
      if (mode === themeMode) {
        return;
      }
      logger.info('SettingsScreen', 'Theme mode selected', {
        themeMode: mode,
      });
      setThemeMode(mode).catch((cause: unknown) => {
        logger.error('SettingsScreen', 'Failed to store theme mode', {
          themeMode: mode,
          message: toError(cause).message,
        });
        Alert.alert('Настройки', 'Не удалось сохранить тему');
      });
    },
    [setThemeMode, themeMode],
  );

  const handleReadingFontPress = useCallback(
    (stepId: ReadingFontStepId) => {
      if (stepId === readingFontStepId) {
        return;
      }
      logger.info('SettingsScreen', 'Reading font size selected', {
        readingFontStepId: stepId,
      });
      setReadingFontStepId(stepId).catch((cause: unknown) => {
        logger.error('SettingsScreen', 'Failed to store reading font size', {
          readingFontStepId: stepId,
          message: toError(cause).message,
        });
        Alert.alert('Настройки', 'Не удалось сохранить размер текста');
      });
    },
    [setReadingFontStepId, readingFontStepId],
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
      <SectionLabel>Перевод</SectionLabel>
      <View
        style={[
          styles.group,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        {AVAILABLE_TRANSLATIONS.map((code) => (
          <OptionRow
            key={code}
            title={TRANSLATION_LABELS[code].title}
            subtitle={TRANSLATION_LABELS[code].subtitle}
            active={code === translationCode}
            onPress={() => handleTranslationPress(code)}
          />
        ))}
      </View>

      <SectionLabel>Тема</SectionLabel>
      <View
        style={[
          styles.group,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        {THEME_MODES.map((mode) => (
          <OptionRow
            key={mode}
            title={THEME_MODE_LABELS[mode]}
            active={mode === themeMode}
            onPress={() => handleThemeModePress(mode)}
          />
        ))}
      </View>

      <SectionLabel>Размер текста</SectionLabel>
      <View
        style={[
          styles.group,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        {READING_FONT_STEPS.map((step) => (
          <OptionRow
            key={step.id}
            title={READING_FONT_LABELS[step.id]}
            subtitle={`${step.fontSize} pt`}
            active={step.id === readingFontStepId}
            onPress={() => handleReadingFontPress(step.id)}
          />
        ))}
      </View>
      <Text
        style={[
          styles.preview,
          {
            color: palette.text,
            fontSize: readingFontSize,
            lineHeight: readingLineHeight,
          },
        ]}
      >
        В начале сотворил Бог небо и землю.
      </Text>
    </View>
  );
}

interface OptionRowProps {
  title: string;
  subtitle?: string;
  active: boolean;
  onPress: () => void;
}

function OptionRow({ title, subtitle, active, onPress }: OptionRowProps) {
  const { palette, fontSizes } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.rowText}>
        <Text
          style={[styles.rowTitle, { color: palette.text, fontSize: fontSizes.md }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.rowSubtitle,
              { color: palette.textMuted, fontSize: fontSizes.sm },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {active ? (
        <Ionicons name="checkmark" size={fontSizes.lg} color={palette.primary} />
      ) : null}
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { palette, fontSizes } = useTheme();

  return (
    <Text
      style={[
        styles.sectionLabel,
        { color: palette.textMuted, fontSize: fontSizes.sm },
      ]}
    >
      {children}
    </Text>
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
    marginBottom: spacing.l,
    overflow: 'hidden',
  },
  preview: {
    marginBottom: spacing.m,
    paddingHorizontal: spacing.s,
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
