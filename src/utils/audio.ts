import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { Paths, File, EncodingType } from 'expo-file-system';

let accentPlayer: AudioPlayer | null = null;
let normalPlayer: AudioPlayer | null = null;
let _volume = 0.8;

function base64FromBytes(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function generateWavBase64(frequency: number): { base64: string; file: File } {
  const sr = 22050;
  const durMs = 200;
  const numSamples = Math.floor((sr * durMs) / 1000);
  const dataSize = numSamples;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);

  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };

  w(0, 'RIFF');
  v.setUint32(4, 44 + dataSize - 8, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  w(36, 'data');
  v.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sr;
    const env = Math.min(t / 0.002, 1) * Math.max(1 - Math.max(t - 0.002, 0) / (durMs / 1000 - 0.002), 0);
    const sample = Math.sin(2 * Math.PI * frequency * t) * env * 0.5 + 0.5;
    v.setUint8(44 + i, Math.floor(sample * 255));
  }

  const bytes = new Uint8Array(buf);
  const base64 = base64FromBytes(bytes);

  const file = new File(Paths.cache, 'click_' + frequency + '.wav');
  file.write(base64, { encoding: EncodingType.Base64 });

  return { base64, file };
}

export async function initAudio(): Promise<boolean> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });

    const accent = generateWavBase64(1200);
    const normal = generateWavBase64(800);

    if (!accent.file.exists || !normal.file.exists) {
      console.warn('Audio: file write failed');
      return false;
    }

    accentPlayer = createAudioPlayer({ uri: accent.file.uri });
    normalPlayer = createAudioPlayer({ uri: normal.file.uri });

    for (const p of [accentPlayer, normalPlayer]) {
      if (!p) continue;
      for (let tries = 0; tries < 100; tries++) {
        if (p.isLoaded) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    const ready = accentPlayer?.isLoaded && normalPlayer?.isLoaded;
    if (ready) {
      accentPlayer!.volume = _volume;
      normalPlayer!.volume = _volume;

      // Prime audio session — play then pause to activate AVAudioSession
      try {
        await accentPlayer!.seekTo(0);
        accentPlayer!.play();
        await new Promise((r) => setTimeout(r, 20));
        accentPlayer!.pause();
        await accentPlayer!.seekTo(0);
      } catch {}
    } else {
      console.warn('Audio: players did not load');
    }
    return !!ready;
  } catch (e) {
    console.warn('Audio init error:', e);
    return false;
  }
}

export function playAccent(): void {
  const p = accentPlayer;
  if (p?.isLoaded) {
    void p.seekTo(0).then(() => { try { p.play(); } catch {} });
  }
}

export function playNormal(): void {
  const p = normalPlayer;
  if (p?.isLoaded) {
    void p.seekTo(0).then(() => { try { p.play(); } catch {} });
  }
}

export function getVolume(): number {
  return _volume;
}

export function setVolume(v: number): void {
  _volume = v;
  if (accentPlayer?.isLoaded) accentPlayer.volume = v;
  if (normalPlayer?.isLoaded) normalPlayer.volume = v;
}

export function cleanupAudio(): void {
  accentPlayer?.remove();
  normalPlayer?.remove();
  accentPlayer = null;
  normalPlayer = null;
}
