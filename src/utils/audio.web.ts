let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function playClick(frequency: number, duration: number): void {
  const context = getContext();
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.connect(gain);
  gain.connect(context.destination);

  osc.frequency.value = frequency;
  osc.type = 'sine';

  const now = context.currentTime;
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.start(now);
  osc.stop(now + duration);
}

export async function initAudio(): Promise<void> {
  getContext();
}

export function playAccent(): void {
  playClick(1200, 0.04);
}

export function playNormal(): void {
  playClick(800, 0.04);
}

export async function cleanupAudio(): Promise<void> {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
}
