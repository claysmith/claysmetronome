import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Colors, Spacing, MetronomeDefaults } from '@/constants/theme';
import { useMetronome } from '@/hooks/use-metronome';
import { useTheme, useThemePreference } from '@/hooks/use-theme';

function useColors() {
  return useTheme();
}

export default function MetronomeScreen() {
  const insets = useSafeAreaInsets();
  const met = useMetronome();
  const colors = useColors();
  const { volume, setVolume, flashEnabled, hapticEnabled } = useThemePreference();

  const [bpmEditing, setBpmEditing] = useState(false);
  const bpmInputRef = useRef<TextInput>(null);

  const bpmDisplayRef = useRef<Text>(null);

  const beatPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    met.setHapticEnabled(hapticEnabled);
  }, [hapticEnabled, met]);

  useEffect(() => {
    if (met.isPlaying && met.currentBeat >= 0) {
      beatPulse.setValue(0);
      Animated.sequence([
        Animated.timing(beatPulse, { toValue: 1, duration: 30, useNativeDriver: true }),
        Animated.timing(beatPulse, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start();
    }
  }, [met.currentBeat, met.isPlaying, beatPulse]);

  const bpmFraction = (met.bpm - MetronomeDefaults.minBpm) /
    (MetronomeDefaults.maxBpm - MetronomeDefaults.minBpm);

  const bpm = met.bpm;

  const handleBpmDecrement = useCallback(() => {
    met.setBpm(bpm - 1);
  }, [met, bpm]);

  const handleBpmIncrement = useCallback(() => {
    met.setBpm(bpm + 1);
  }, [met, bpm]);

  const onStartStop = useCallback(() => {
    met.toggle();
  }, [met]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {flashEnabled && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.accent,
              opacity: beatPulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1],
              }),
            },
          ]}
        />
      )}
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + Spacing.six,
            paddingBottom: Math.max(insets.bottom, Spacing.four),
            paddingLeft: Math.max(insets.left, Spacing.four),
            paddingRight: Math.max(insets.right, Spacing.four),
          },
        ]}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Settings */}
        <View style={styles.themeRow}>
          <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
            <Text style={[styles.themeToggle, { color: colors.textSecondary }]}>
              {'\u2699'}
            </Text>
          </Pressable>
        </View>

        {/* BPM Display */}
        <View style={styles.bpmSection}>
          <View style={styles.bpmRow}>
            <Pressable onPress={handleBpmDecrement} hitSlop={16}>
              <Text style={[styles.bpmArrow, { color: colors.textSecondary }]}>
                {'\u2212'}
              </Text>
            </Pressable>

            <View style={styles.bpmNumberContainer}>
              {bpmEditing ? (
                <TextInput
                  ref={bpmInputRef}
                  style={[styles.bpmInput, { color: colors.text, borderColor: colors.accent }]}
                  keyboardType="number-pad"
                  defaultValue={String(bpm)}
                  selectTextOnFocus
                  onSubmitEditing={(e) => {
                    const val = parseInt(e.nativeEvent.text, 10);
                    if (!isNaN(val)) met.setBpm(val);
                    setBpmEditing(false);
                  }}
                  onBlur={() => setBpmEditing(false)}
                />
              ) : (
                <Pressable
                  onPress={() => {
                    setBpmEditing(true);
                    setTimeout(() => bpmInputRef.current?.focus(), 50);
                  }}
                >
                  <Text
                    ref={bpmDisplayRef}
                    style={[styles.bpmNumber, { color: colors.text }]}
                  >
                    {bpm}
                  </Text>
                </Pressable>
              )}
              <Text style={[styles.bpmLabel, { color: colors.textSecondary }]}>
                BPM
              </Text>
            </View>

            <Pressable onPress={handleBpmIncrement} hitSlop={16}>
              <Text style={[styles.bpmArrow, { color: colors.textSecondary }]}>
                +
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tempo Slider */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderTrackContainer}>
            <View
              style={[
                styles.sliderTrack,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.sliderFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${bpmFraction * 100}%`,
                  },
                ]}
              />
            </View>
            <SliderThumb
              fraction={bpmFraction}
              colors={colors}
              onFractionChange={(f) => {
                const val = Math.round(
                  MetronomeDefaults.minBpm +
                    f * (MetronomeDefaults.maxBpm - MetronomeDefaults.minBpm),
                );
                met.setBpm(val);
              }}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
              {MetronomeDefaults.minBpm}
            </Text>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
              {MetronomeDefaults.maxBpm}
            </Text>
          </View>
        </View>

        {/* Volume */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderLabelRow}>
            <Text style={[styles.sliderSectionLabel, { color: colors.textSecondary }]}>
              Volume
            </Text>
            <Text style={[styles.sliderValueLabel, { color: colors.text }]}>
              {Math.round(volume * 100)}%
            </Text>
          </View>
          <View style={styles.sliderTrackContainer}>
            <View
              style={[
                styles.sliderTrack,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.sliderFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${volume * 100}%`,
                  },
                ]}
              />
            </View>
            <SliderThumb
              fraction={volume}
              colors={colors}
              onFractionChange={setVolume}
            />
          </View>
        </View>

        {/* Swing */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderLabelRow}>
            <Text style={[styles.sliderSectionLabel, { color: colors.textSecondary }]}>
              Swing
            </Text>
            <Text style={[styles.sliderValueLabel, { color: colors.text }]}>
              {met.swing > 0 ? `${met.swing}%` : 'Off'}
            </Text>
          </View>
          <View style={styles.sliderTrackContainer}>
            <View
              style={[
                styles.sliderTrack,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.sliderFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${met.swing}%`,
                  },
                ]}
              />
            </View>
            <SliderThumb
              fraction={met.swing / 100}
              colors={colors}
              onFractionChange={(f) => met.setSwing(Math.round(f * 100))}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Straight</Text>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Shuffle</Text>
          </View>
        </View>

        {/* Tap Tempo */}
        <Pressable
          onPress={met.tap}
          style={({ pressed }) => [
            styles.tapButton,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.tapButtonText, { color: colors.text }]}>
            Tap Tempo
          </Text>
        </Pressable>

        {/* Beat Indicators + Time Signatures */}
        <View style={styles.beatSection}>
          <BeatDots
            count={met.beatsPerMeasure}
            currentBeat={met.currentBeat}
            accentPattern={met.accentPattern}
            colors={colors}
            onDotPress={met.toggleAccent}
          />

          <TimeSignatureSelector
            current={met.beatsPerMeasure}
            colors={colors}
            onChange={met.setBeatsPerMeasure}
          />

          {/* Subdivision */}
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Subdivide</Text>
            <View style={styles.chipRow}>
              {(['none', '8th', '16th', '8t'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => met.setSubdivision(s)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: met.subdivision === s ? colors.accent : colors.backgroundElement,
                      borderColor: met.subdivision === s ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: met.subdivision === s ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {s === 'none' ? 'Off' : s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        </ScrollView>

        {/* Start / Stop Button */}
        <Pressable
          onPress={onStartStop}
          style={({ pressed }) => [
            styles.startStopButton,
            {
              backgroundColor: met.isPlaying ? colors.danger : colors.accent,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.startStopText}>
            {met.isPlaying ? 'STOP' : 'START'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SliderThumb({
  fraction,
  colors,
  onFractionChange,
}: {
  fraction: number;
  colors: Record<string, string>;
  onFractionChange: (f: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const [trackLayout, setTrackLayout] = useState({ x: 0, width: 1 });

  const handlePress = useCallback(
    (pageX: number) => {
      const f = Math.max(0, Math.min(1, (pageX - trackLayout.x) / trackLayout.width));
      onFractionChange(f);
    },
    [trackLayout, onFractionChange],
  );

  const onLayout = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      setTrackLayout({ x, width });
    });
  }, []);

  return (
    <View
      ref={trackRef}
      onLayout={onLayout}
      style={styles.sliderHitArea}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => handlePress(e.nativeEvent.pageX)}
      onResponderMove={(e) => handlePress(e.nativeEvent.pageX)}
    >
      <View
        style={[
          styles.sliderThumb,
          {
            backgroundColor: colors.accent,
            borderColor: colors.background,
            left: `${fraction * 100}%`,
          },
        ]}
      />
    </View>
  );
}

function BeatDots({
  count,
  currentBeat,
  accentPattern,
  colors,
  onDotPress,
}: {
  count: number;
  currentBeat: number;
  accentPattern: boolean[];
  colors: Record<string, string>;
  onDotPress: (index: number) => void;
}) {
  return (
    <View style={styles.beatDotsRow}>
      {Array.from({ length: count }, (_, i) => {
        const isActive = currentBeat === i;
        const isAccented = accentPattern[i] ?? false;
        const dotSize = isActive ? 20 : isAccented ? 16 : 12;

        let bg: string;
        if (isActive && isAccented) {
          bg = colors.beatAccentActive;
        } else if (isActive && !isAccented) {
          bg = colors.beatActive;
        } else if (!isActive && isAccented) {
          bg = colors.beatAccentInactive;
        } else {
          bg = colors.beatInactive;
        }

        return (
          <Pressable
            key={i}
            onPress={() => onDotPress(i)}
            hitSlop={8}
            style={styles.beatDotWrapper}
          >
            <View
              style={[
                styles.beatDot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: bg,
                },
              ]}
            />
            <Text
              style={[
                styles.beatDotNumber,
                { color: isActive ? colors.text : colors.textSecondary },
              ]}
            >
              {i + 1}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TimeSignatureSelector({
  current,
  colors,
  onChange,
}: {
  current: number;
  colors: Record<string, string>;
  onChange: (beats: number) => void;
}) {
  return (
    <View style={styles.timeSigWrap}>
      {MetronomeDefaults.timeSignatures.map((ts) => {
        const selected = ts.beats === current;
        return (
          <Pressable
            key={ts.beats}
            onPress={() => onChange(ts.beats)}
            style={[
              styles.timeSigChip,
              {
                backgroundColor: selected
                  ? colors.accent
                  : colors.backgroundElement,
                borderColor: selected ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.timeSigText,
                { color: selected ? '#FFFFFF' : colors.text },
              ]}
            >
              {ts.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
  },

  // Scroll
  scrollArea: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
  },

  // Theme
  themeRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: Spacing.one,
  },
  themeToggle: {
    fontSize: 22,
    fontWeight: '600',
  },

  // BPM
  bpmSection: {
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  bpmNumberContainer: {
    alignItems: 'center',
  },
  bpmNumber: {
    fontSize: 96,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    lineHeight: 100,
  },
  bpmInput: {
    fontSize: 96,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    lineHeight: 100,
    borderBottomWidth: 2,
    minWidth: 180,
    textAlign: 'center',
    padding: 0,
  },
  bpmLabel: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: Spacing.half,
  },
  bpmArrow: {
    fontSize: 44,
    fontWeight: '300',
    width: 60,
    textAlign: 'center',
  },

  // Slider
  sliderSection: {
    width: '100%',
    maxWidth: 400,
    marginBottom: Spacing.two,
  },
  sliderTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 1,
  },
  sliderHitArea: {
    position: 'absolute',
    left: -8,
    right: -8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    position: 'absolute',
    marginLeft: -8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  sliderLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  sliderSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sliderValueLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Tap Tempo
  tapButton: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    marginBottom: Spacing.five,
  },
  tapButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },

  // Beats
  beatSection: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  controlRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 1,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  beatDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  beatDotWrapper: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  beatDot: {},
  beatDotNumber: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Time Signature
  timeSigWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  timeSigChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Spacing.five,
    borderWidth: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  timeSigText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Start/Stop
  startStopButton: {
    width: 200,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  startStopText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
