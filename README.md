# Clays Metronome

A metronome app for iOS built with Expo SDK 56.

## Features

- BPM range 20–300 with slider, +/- buttons, and direct numeric entry
- Tap tempo
- Time signatures: 1/4, 2/4, 3/4, 4/4, 5/4, 6/4, 7/4, 8/4
- Accent pattern — tap any beat dot to toggle accent on/off
- Swing/shuffle slider (0–100%)
- Subdivision: off, 8th, 16th, 8th triplet
- Volume control
- Haptic pulse on each beat (optional, off by default)
- Visual beat flash overlay (optional, off by default)
- Dark / Light / System theme
- Accent color presets (green, blue, purple, orange, pink, red, teal, white)
- All preferences persist across restarts

## Tech Stack

- **Framework:** Expo SDK 56 with file-based routing (expo-router)
- **Audio:** `expo-audio` — WAV files generated in JavaScript, written to cache via `expo-file-system`
- **Haptics:** `expo-haptics`
- **Storage:** Single `settings.json` in app cache via `expo-file-system`
- **State:** React hooks (`useRef` for scheduler, `useState` for UI, `useContext` for theme/settings)

## Getting Started

```bash
npm install
npx expo start
```

**Important:** CoreAudio is broken on the iOS simulator (`kAudio_UnsupportedPropertyError -66680`). Audio will not play on a simulator. Use a physical device or run an EAS build.

## EAS Build

Two profiles are configured in `eas.json`:

```bash
# Development build (installed via Expo Go-like workflow)
eas build --platform ios --profile development

# Production IPA
eas build --platform ios --profile production
```

## Project Structure

```
src/
  app/
    _layout.tsx        — Theme-aware root layout
    index.tsx          — Main metronome screen
    settings.tsx       — Theme, accent color, flash, haptics toggles
  hooks/
    use-metronome.ts   — Beat scheduler, swing, subdivision, haptics
    use-theme.tsx      — ThemeProvider, settings persistence, accent colors
  utils/
    audio.ts           — WAV generation, file caching, AudioPlayer management
  constants/
    theme.ts           — Color palettes, accent presets, spacing, defaults
```

## Key Decisions

- **`expo-audio` over `expo-av`** — `expo-av` is incompatible with SDK 56 (missing `ExpoModulesCore/EXEventEmitter.h`).
- **WAV generated in JS** — 8-bit, 22050 Hz, 200ms. Written to cache as base64, loaded from `file://` URIs. No bundled assets needed.
- **`seekTo(0).then(() => play())`** — ensures playback restarts from the beginning on rapid re-triggers.
- **Scheduler uses `useCallback([])`** — empty deps; state changes that affect timing (BPM, swing) use refs. `setCurrentBeat()` is safe to call inside the while-loop because React state setters are stable.
- **Single `settings.json`** — stores theme, volume, flashEnabled, hapticEnabled, and accentColor.
- **Simulator audio** — if you need to test audio on a simulator, try `sudo killall coreaudiod` to restart the CoreAudio daemon.
