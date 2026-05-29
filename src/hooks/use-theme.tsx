import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Paths, File } from 'expo-file-system';
import { Colors, AccentColors } from '@/constants/theme';
import { setVolume as setAudioVolume } from '@/utils/audio';

type ThemeMode = 'light' | 'dark' | 'system';

interface Settings {
  theme: ThemeMode;
  volume: number;
  flashEnabled: boolean;
  accentColor: string;
  hapticEnabled: boolean;
}

const FILE_PATH = Paths.cache + '/settings.json';

interface ThemeContextValue {
  resolved: 'light' | 'dark';
  preference: ThemeMode;
  setPreference: (mode: ThemeMode) => void;
  volume: number;
  setVolume: (v: number) => void;
  flashEnabled: boolean;
  setFlashEnabled: (v: boolean) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (v: boolean) => void;
}

const DEFAULT_SETTINGS: Settings = { theme: 'dark', volume: 0.8, flashEnabled: false, accentColor: 'green', hapticEnabled: false };

const ThemeContext = createContext<ThemeContextValue>({
  resolved: 'dark',
  preference: 'dark',
  setPreference: () => {},
  volume: 0.8,
  setVolume: () => {},
  flashEnabled: false,
  setFlashEnabled: () => {},
  hapticEnabled: false,
  setHapticEnabled: () => {},
  accentColor: 'green',
  setAccentColor: () => {},
});

function loadSettings(): Settings {
  try {
    const file = new File(FILE_PATH);
    if (file.exists) {
      const raw = file.textSync();
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const t = parsed.theme;
        const theme: ThemeMode = t === 'light' || t === 'dark' || t === 'system' ? t : DEFAULT_SETTINGS.theme;
        const volume = typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : DEFAULT_SETTINGS.volume;
        const flashEnabled = typeof parsed.flashEnabled === 'boolean' ? parsed.flashEnabled : DEFAULT_SETTINGS.flashEnabled;
        const accentColor = typeof parsed.accentColor === 'string' && AccentColors[parsed.accentColor] ? parsed.accentColor : DEFAULT_SETTINGS.accentColor;
        const hapticEnabled = typeof parsed.hapticEnabled === 'boolean' ? parsed.hapticEnabled : DEFAULT_SETTINGS.hapticEnabled;
        return { theme, volume, flashEnabled, accentColor, hapticEnabled };
      }
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: Settings): void {
  try {
    const file = new File(FILE_PATH);
    file.write(JSON.stringify(s));
  } catch {}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const setPreference = useCallback((mode: ThemeMode) => {
    setSettings((prev) => {
      const next = { ...prev, theme: mode };
      saveSettings(next);
      return next;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setSettings((prev) => {
      const next = { ...prev, volume: clamped };
      saveSettings(next);
      return next;
    });
    setAudioVolume(clamped);
  }, []);

  const setFlashEnabled = useCallback((v: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, flashEnabled: v };
      saveSettings(next);
      return next;
    });
  }, []);

  const setAccentColor = useCallback((c: string) => {
    setSettings((prev) => {
      const next = { ...prev, accentColor: c };
      saveSettings(next);
      return next;
    });
  }, []);

  const setHapticEnabled = useCallback((v: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, hapticEnabled: v };
      saveSettings(next);
      return next;
    });
  }, []);

  // Sync initial volume to audio on mount
  useEffect(() => {
    setAudioVolume(settings.volume);
  }, []); // only on mount

  const systemScheme = useColorScheme();
  const preference = settings.theme;
  const resolved: 'light' | 'dark' = preference === 'system'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : preference;

  return (
    <ThemeContext.Provider value={{ resolved, preference, setPreference, volume: settings.volume, setVolume, flashEnabled: settings.flashEnabled, setFlashEnabled, hapticEnabled: settings.hapticEnabled, setHapticEnabled, accentColor: settings.accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext);
}

function dimHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = Math.round(255 * (1 - factor));
  return `#${[r, g, b].map(c => Math.round(mix + c * factor).toString(16).padStart(2, '0')).join('')}`;
}

/** @deprecated Use `useThemeContext().resolved` with `Colors[resolved]` instead. */
export function useTheme(): Record<string, string> {
  const { resolved, accentColor } = useThemeContext();
  const palette: Record<string, string> = { ...Colors[resolved] };
  const userAccent = AccentColors[accentColor];
  if (userAccent) {
    palette.accent = userAccent[resolved];
    palette.beatAccentActive = userAccent[resolved];
    palette.beatAccentInactive = dimHex(userAccent[resolved], 0.45);
  }
  return palette;
}

export function useThemePreference(): ThemeContextValue {
  return useThemeContext();
}
