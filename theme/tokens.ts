export interface Palette {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  border: string;
  overlay: string;
}

export const palette: { light: Palette; dark: Palette } = {
  light: {
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#1C1C1E',
    textMuted: '#8E8E93',
    primary: '#2F6B4F',
    border: '#E5E5EA',
    overlay: '#000000',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textMuted: '#98989F',
    primary: '#7FB89A',
    border: '#2C2C2E',
    overlay: '#000000',
  },
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
} as const;

export const fontSizes = {
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export const THEME_MODES = ['system', 'light', 'dark'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const DEFAULT_THEME_MODE: ThemeMode = 'system';

export interface ReadingFontStep {
  id: 'small' | 'medium' | 'large' | 'xlarge';
  fontSize: number;
  lineHeight: number;
}

export type ReadingFontStepId = ReadingFontStep['id'];

const DEFAULT_READING_FONT_STEP: ReadingFontStep = {
  id: 'medium',
  fontSize: 16,
  lineHeight: 24,
};

export const READING_FONT_STEPS: readonly ReadingFontStep[] = [
  { id: 'small', fontSize: 14, lineHeight: 21 },
  DEFAULT_READING_FONT_STEP,
  { id: 'large', fontSize: 19, lineHeight: 29 },
  { id: 'xlarge', fontSize: 22, lineHeight: 33 },
];

export const DEFAULT_READING_FONT_STEP_ID: ReadingFontStepId =
  DEFAULT_READING_FONT_STEP.id;

export function resolveColorScheme(
  mode: ThemeMode,
  systemScheme: string | null | undefined,
): 'light' | 'dark' {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function getReadingFontStep(stepId: string): ReadingFontStep {
  return (
    READING_FONT_STEPS.find((step) => step.id === stepId) ??
    DEFAULT_READING_FONT_STEP
  );
}
