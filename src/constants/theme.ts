import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#60646C',
    background: '#F2F2F7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E0E1E6',
    accent: '#4A6CF7',
    accentDim: '#8DA3F7',
    beatActive: '#22C55E',
    beatInactive: '#D1D5DB',
    beatAccentActive: '#4A6CF7',
    beatAccentInactive: '#93A3F7',
    surface: '#FFFFFF',
    border: '#E5E5EA',
    danger: '#EF4444',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    background: '#0D0D12',
    backgroundElement: '#1C1C23',
    backgroundSelected: '#2C2C35',
    accent: '#6C8CFF',
    accentDim: '#4A6CF7',
    beatActive: '#4ADE80',
    beatInactive: '#3A3A45',
    beatAccentActive: '#6C8CFF',
    beatAccentInactive: '#3A4A8A',
    surface: '#1C1C23',
    border: '#2C2C35',
    danger: '#EF4444',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const AccentColors: Record<string, { light: string; dark: string }> = {
  green:  { light: '#34C759', dark: '#4ADE80' },
  blue:   { light: '#007AFF', dark: '#6C8CFF' },
  purple: { light: '#AF52DE', dark: '#C57BEF' },
  orange: { light: '#FF9500', dark: '#FFB340' },
  pink:   { light: '#FF2D55', dark: '#FF6B8A' },
  red:    { light: '#FF3B30', dark: '#FF6B5E' },
  teal:   { light: '#5AC8FA', dark: '#8AD8FB' },
  white:  { light: '#FFFFFF', dark: '#FFFFFF' },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const MetronomeDefaults = {
  bpm: 120,
  minBpm: 20,
  maxBpm: 300,
  beatsPerMeasure: 4,
  timeSignatures: [
    { label: '2/4', beats: 2 },
    { label: '3/4', beats: 3 },
    { label: '4/4', beats: 4 },
    { label: '5/4', beats: 5 },
    { label: '6/8', beats: 6 },
    { label: '7/8', beats: 7 },
    { label: '9/8', beats: 9 },
    { label: '12/8', beats: 12 },
  ],
} as const;
