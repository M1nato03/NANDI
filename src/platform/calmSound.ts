/**
 * Spec 35 Calm sounds. The sounds are recorded loops (CC0, each licence checked on its source page) kept in
 * public/calm and streamed through an audio element, as Your sound is; nothing is decoded whole into memory. The
 * bells are made in code with WebAudio, so they need no files (scripts/render-calm-audio.ts saves a preview).
 */
export type CalmPreset = { id: string; name: string; file: string };
/** The recorded loops, in the order the sound row shows them. Each file's source and licence is in public/calm/SOURCES.md. */
export const CALM_SOUNDS: readonly CalmPreset[] = [];
export const presetOf = (id: string) => CALM_SOUNDS.find(sound => sound.id === id);

function gainOf(ctx: BaseAudioContext, value: number): GainNode { const node = ctx.createGain(); node.gain.value = value; return node; }

/** One bell strike: inharmonic partials with long decays. */
function strike(ctx: BaseAudioContext, out: AudioNode, at: number, base: number, level: number, decay: number): void {
  [[1, 1], [2.0, 0.5], [2.76, 0.32], [5.4, 0.16], [8.93, 0.08]].forEach(([ratio, weight]) => {
    const tone = ctx.createOscillator(), env = ctx.createGain();
    tone.type = 'sine'; tone.frequency.setValueAtTime(base * ratio!, at);
    env.gain.setValueAtTime(0.0001, at); env.gain.linearRampToValueAtTime(level * weight!, at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay / Math.sqrt(ratio!));
    tone.connect(env); env.connect(out); tone.start(at); tone.stop(at + decay + 0.1);
  });
}

/** The end bell: today's three soft notes (spec 34). */
export function endBell(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  [523.25, 783.99, 1046.5].forEach((frequency, index) => {
    const when = at + index * 0.11, tone = ctx.createOscillator(), gain = ctx.createGain();
    tone.type = 'sine'; tone.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(0.26 / (index + 1), when + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    tone.connect(gain); gain.connect(out); tone.start(when); tone.stop(when + 1.5);
  });
}
/** The start bell and the interval bell: one soft strike (the interval one quieter than the end bell). */
export function softStrike(ctx: BaseAudioContext, out: AudioNode, at: number, level = 0.18): void { strike(ctx, out, at, 523.25, level, 4); }
/** The quiet tick between body-scan lines. */
export function tick(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  const tone = ctx.createOscillator(), gain = ctx.createGain();
  tone.type = 'sine'; tone.frequency.setValueAtTime(1320, at);
  gain.gain.setValueAtTime(0.0001, at); gain.gain.linearRampToValueAtTime(0.05, at + 0.005); gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
  tone.connect(gain); gain.connect(out); tone.start(at); tone.stop(at + 0.15);
}

const FADE_IN = 3, FADE_OUT = 4;
const level = (volume: number) => Math.pow(volume / 100, 2);

/**
 * The live mixer for one session: the sound (a preset or the user's file) and the bells go through their own volume
 * and then one limiter. Sound fades in over 3 s and out over 4 s. The file is streamed through an audio element, never
 * decoded whole into memory.
 */
export class CalmAudio {
  private ctx: AudioContext;
  private sound: GainNode;
  private bells: GainNode;
  private element: HTMLAudioElement | null = null;
  private url: string | null = null;

  static create(): CalmAudio | null {
    try { return window.AudioContext ? new CalmAudio(new window.AudioContext()) : null; } catch { return null; }
  }
  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10; limiter.ratio.value = 12; limiter.attack.value = 0.003; limiter.release.value = 0.25;
    limiter.connect(ctx.destination);
    this.sound = gainOf(ctx, 0.0001); this.sound.connect(limiter);
    this.bells = gainOf(ctx, 0.5); this.bells.connect(limiter);
  }

  /** Loops a preset (its address) or Your sound (its file), or plays nothing for silence; the bells ring either way. */
  play(o: { src?: string; file?: Blob; soundVolume: number; bellVolume: number }): void {
    void this.ctx.resume();
    this.setVolumes(o.soundVolume, o.bellVolume, FADE_IN);
    if (o.file) this.url = URL.createObjectURL(o.file);
    const src = this.url ?? o.src;
    if (!src) return;
    const element = new Audio(src);
    element.loop = true; element.className = 'calm-sound-audio'; element.hidden = true;
    document.body.append(element);
    this.ctx.createMediaElementSource(element).connect(this.sound);
    this.element = element;
    void element.play().catch(() => undefined);
  }

  setVolumes(soundVolume: number, bellVolume: number, over = 0.3): void {
    const now = this.ctx.currentTime;
    this.sound.gain.cancelScheduledValues(now);
    this.sound.gain.setValueAtTime(Math.max(0.0001, this.sound.gain.value), now);
    this.sound.gain.linearRampToValueAtTime(Math.max(0.0001, level(soundVolume)), now + over);
    this.bells.gain.setValueAtTime(level(bellVolume) * 2, now);
  }

  ring(kind: 'start' | 'interval' | 'end' | 'tick'): void {
    const at = this.ctx.currentTime + 0.02;
    if (kind === 'end') endBell(this.ctx, this.bells, at);
    else if (kind === 'tick') tick(this.ctx, this.bells, at);
    else softStrike(this.ctx, this.bells, at, kind === 'start' ? 0.2 : 0.12);
  }

  /** Fades the sound out over 4 s, then lets everything go. */
  finish(): void {
    const now = this.ctx.currentTime;
    this.sound.gain.cancelScheduledValues(now);
    this.sound.gain.setValueAtTime(Math.max(0.0001, this.sound.gain.value), now);
    this.sound.gain.exponentialRampToValueAtTime(0.0001, now + FADE_OUT);
    window.setTimeout(() => this.close(), (FADE_OUT + 1.5) * 1000);
  }

  close(): void {
    if (this.element) { this.element.pause(); this.element.remove(); this.element = null; }
    if (this.url) { URL.revokeObjectURL(this.url); this.url = null; }
    void this.ctx.close().catch(() => undefined);
  }
}
