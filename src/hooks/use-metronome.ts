import { useCallback, useEffect, useRef, useState } from 'react';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

import { initAudio, playAccent, playNormal } from '@/utils/audio';

export type Subdivision = 'none' | '8th' | '16th' | '8t';

interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure: number;
  accentPattern: boolean[];
  currentBeat: number;
  swing: number;
  subdivision: Subdivision;
}

interface UseMetronomeReturn extends MetronomeState {
  start: () => void;
  stop: () => void;
  toggle: () => void;
  setBpm: (bpm: number) => void;
  setBeatsPerMeasure: (count: number) => void;
  toggleAccent: (beatIndex: number) => void;
  tap: () => void;
  setSwing: (swing: number) => void;
  setSubdivision: (s: Subdivision) => void;
  audioReady: boolean;
}

function defaultAccentPattern(beats: number): boolean[] {
  return Array.from({ length: beats }, (_, i) => i === 0);
}

function swingFactor(swing: number): number {
  return 0.5 + swing * 0.0016;
}

function getSubdivisionOffsets(sub: Subdivision, swing: number, interval: number): number[] {
  if (sub === 'none') {
    return swing > 0 ? [interval * swingFactor(swing)] : [];
  }
  if (sub === '8th') return [interval * swingFactor(swing)];
  if (sub === '16th') return [interval / 4, interval / 2, 3 * interval / 4];
  if (sub === '8t') return [interval / 3, 2 * interval / 3];
  return [];
}

export function useMetronome(): UseMetronomeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasureState] = useState(4);
  const [accentPattern, setAccentPattern] = useState(() => defaultAccentPattern(4));
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [swing, setSwingState] = useState(0);
  const [subdivision, setSubdivisionState] = useState<Subdivision>('none');
  const [audioReady, setAudioReady] = useState(false);

  const isPlayingRef = useRef(false);
  const bpmRef = useRef(120);
  const beatsRef = useRef(4);
  const accentRef = useRef<boolean[]>(defaultAccentPattern(4));
  const swingRef = useRef(0);
  const subdivisionRef = useRef<Subdivision>('none');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extraTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextTickRef = useRef(0);
  const currentBeatRef = useRef(-1);
  const tapTimesRef = useRef<number[]>([]);
  const audioInitRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  useEffect(() => {
    accentRef.current = accentPattern;
  }, [accentPattern]);

  useEffect(() => {
    swingRef.current = swing;
  }, [swing]);

  useEffect(() => {
    subdivisionRef.current = subdivision;
  }, [subdivision]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      extraTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  function clearExtraTimers() {
    extraTimersRef.current.forEach(clearTimeout);
    extraTimersRef.current = [];
  }

  const ensureAudioInit = useCallback(async () => {
    if (!audioInitRef.current) {
      audioInitRef.current = true;
      const ok = await initAudio();
      setAudioReady(ok);
    }
  }, []);

  const scheduleNext = useCallback(() => {
    if (!isPlayingRef.current) return;

    const now = performance.now() + 0.01;
    const interval = 60000 / bpmRef.current;

    if (nextTickRef.current < now - interval * 2) {
      nextTickRef.current = now;
    }

    while (nextTickRef.current <= now) {
      const beat = currentBeatRef.current;
      const isAccented = accentRef.current[beat] ?? false;

      setCurrentBeat(beat);

      if (isAccented) {
        playAccent();
        void impactAsync(ImpactFeedbackStyle.Medium);
      } else {
        playNormal();
        void impactAsync(ImpactFeedbackStyle.Light);
      }

      currentBeatRef.current = (currentBeatRef.current + 1) % beatsRef.current;
      nextTickRef.current += interval;
    }

    clearExtraTimers();

    const offsets = getSubdivisionOffsets(
      subdivisionRef.current,
      swingRef.current,
      interval,
    );

    const beatTime = nextTickRef.current - interval;
    for (const offset of offsets) {
      const delay = beatTime + offset - performance.now();
      if (delay > 0) {
        const t = setTimeout(() => {
          if (!isPlayingRef.current) return;
          playNormal();
        }, delay);
        extraTimersRef.current.push(t);
      }
    }

    const mainDelay = Math.max(0, nextTickRef.current - performance.now());
    timerRef.current = setTimeout(scheduleNext, mainDelay);
  }, []);

  const tickLoop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearExtraTimers();

    const interval = 60000 / bpmRef.current;
    nextTickRef.current = performance.now() + interval;
    currentBeatRef.current = 0;

    setCurrentBeat(0);

    scheduleNext();
  }, [scheduleNext]);

  const start = useCallback(async () => {
    await ensureAudioInit();
    setIsPlaying(true);
    isPlayingRef.current = true;
    tickLoop();
  }, [ensureAudioInit, tickLoop]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    clearExtraTimers();
    currentBeatRef.current = -1;
    setCurrentBeat(-1);
  }, []);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const setBpm = useCallback((value: number) => {
    const clamped = Math.max(20, Math.min(300, value));
    setBpmState(clamped);

    if (isPlayingRef.current) {
      const interval = 60000 / clamped;
      const now = performance.now();
      if (nextTickRef.current < now) {
        nextTickRef.current = now + interval;
      } else if (nextTickRef.current > now + interval * 2) {
        nextTickRef.current = now + interval;
      }
    }
  }, []);

  const setBeatsPerMeasure = useCallback((count: number) => {
    setBeatsPerMeasureState(count);
    setAccentPattern((prev) => {
      const next = Array.from({ length: count }, (_, i) => i === 0);
      for (let i = 0; i < Math.min(prev.length, count); i++) {
        next[i] = prev[i];
      }
      return next;
    });
    if (isPlayingRef.current) {
      currentBeatRef.current = currentBeatRef.current % count;
    }
  }, []);

  const toggleAccent = useCallback((beatIndex: number) => {
    setAccentPattern((prev) => {
      const next = [...prev];
      next[beatIndex] = !next[beatIndex];
      return next;
    });
  }, []);

  const tap = useCallback(() => {
    const now = performance.now();
    const times = tapTimesRef.current;

    times.push(now);

    while (times.length > 0 && now - times[0] > 3000) {
      times.shift();
    }

    if (times.length > 8) {
      times.splice(0, times.length - 8);
    }

    if (times.length >= 2) {
      let sum = 0;
      for (let i = 1; i < times.length; i++) {
        sum += times[i] - times[i - 1];
      }
      const avg = sum / (times.length - 1);
      const bpmValue = Math.round(60000 / avg);
      setBpm(Math.max(20, Math.min(300, bpmValue)));
    }
  }, [setBpm]);

  const setSwing = useCallback((value: number) => {
    setSwingState(value);
  }, []);

  const setSubdivision = useCallback((s: Subdivision) => {
    setSubdivisionState(s);
  }, []);

  return {
    isPlaying,
    bpm,
    beatsPerMeasure,
    accentPattern,
    currentBeat,
    swing,
    subdivision,
    start,
    stop,
    toggle,
    setBpm,
    setBeatsPerMeasure,
    toggleAccent,
    tap,
    setSwing,
    setSubdivision,
    audioReady,
  };
}
