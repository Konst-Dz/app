export interface Palette {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  border: string;
}

export const palette: { light: Palette; dark: Palette } = {
  light: {
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#1C1C1E',
    textMuted: '#8E8E93',
    primary: '#2F6B4F',
    border: '#E5E5EA',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textMuted: '#98989F',
    primary: '#7FB89A',
    border: '#2C2C2E',
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
