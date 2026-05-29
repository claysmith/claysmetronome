import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Colors, AccentColors, Spacing } from '@/constants/theme';
import { useTheme, useThemePreference } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { preference, setPreference, flashEnabled, setFlashEnabled, accentColor, setAccentColor } = useThemePreference();

  const LABELS: Record<string, string> = { dark: 'Dark', light: 'Light', system: 'System' };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, { paddingTop: insets.top + Spacing.six }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={[styles.backArrow, { color: colors.accent }]}>{'\u2190'}</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
            <View style={styles.chipRow}>
              {(['dark', 'light', 'system'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setPreference(mode)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: preference === mode ? colors.accent : colors.backgroundElement,
                      borderColor: preference === mode ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: preference === mode ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {LABELS[mode]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Accent Color */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Accent Color</Text>
            <View style={styles.colorRow}>
              {Object.entries(AccentColors).map(([name, shades]) => {
                const selected = accentColor === name;
                return (
                  <Pressable
                    key={name}
                    onPress={() => setAccentColor(name)}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: shades.dark,
                        borderColor: selected ? colors.accent : colors.border,
                        borderWidth: selected ? 3 : 1,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Flash */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Visual</Text>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Beat flash</Text>
              <Pressable
                onPress={() => setFlashEnabled(!flashEnabled)}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: flashEnabled ? colors.accent : colors.backgroundElement,
                    borderColor: flashEnabled ? colors.accent : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    flashEnabled ? styles.toggleKnobOn : styles.toggleKnobOff,
                    { backgroundColor: flashEnabled ? '#FFFFFF' : colors.textSecondary },
                  ]}
                />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.five,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.five,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
});
