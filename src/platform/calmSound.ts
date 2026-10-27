/**
 * Spec 35 Calm sounds, all made in code with WebAudio: no audio files, no licences, almost no size. Each preset is
 * seeded, so the same sound plays the same way each time. Every function takes a BaseAudioContext, so the same code
 * plays live and renders offline (scripts/render-calm-audio.ts saves 20-second previews).
 */
export const CALM_SOUNDS = [
  { id: 'river', name: 'River' }, { id: 'rain', name: 'Rain on the tent' }, { id: 'fire', name: 'Campfire' },
  { id: 'wind', name: 'Ridge wind' }, { id: 'crickets', name: 'Night crickets' }, { id: 'temple', name: 'Temple bell' },
  { id: 'tanpura', name: 'Tanpura drone' }, { id: 'noise', name: 'Soft noise' },
] as const;
export type CalmSoundId = (typeof CALM_SOUNDS)[number]['id'];
export const isPreset = (id: string): id is CalmSoundId => CALM_SOUNDS.some(sound => sound.id === id);

/** A small seeded random source (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Colour = 'white' | 'pink' | 'brown';
/** A seamless noise loop: the last second is cross-faded into the first, so the loop has no click. */
function noise(ctx: BaseAudioContext, colour: Colour, seed: number, seconds = 8): AudioBuffer {
  const rate = ctx.sampleRate, length = Math.floor(seconds * rate), fade = rate;
  const raw = new Float32Array(length + fade), random = seeded(seed);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < raw.length; i++) {
    const white = random() * 2 - 1;
    if (colour === 'white') raw[i] = white * 0.5;
    else if (colour === 'pink') {
      // Paul Kellet's pink filter.
      b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759; b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856; b4 = 0.55 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.016898;
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11; b6 = white * 0.115926;
    } else { last = (last + 0.02 * white) / 1.02; raw[i] = last * 3.5; }
  }
  const buffer = ctx.createBuffer(1, length, rate), data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = i < fade ? raw[i]! * (i / fade) + raw[length + i]! * (1 - i / fade) : raw[i]!;
  return buffer;
}

function loop(ctx: BaseAudioContext, buffer: AudioBuffer, at: number): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer; source.loop = true; source.start(at);
  return source;
}
function filter(ctx: BaseAudioContext, type: BiquadFilterType, frequency: number, q = 0.7): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = type; node.frequency.value = frequency; node.Q.value = q;
  return node;
}
function gainOf(ctx: BaseAudioContext, value: number): GainNode { const node = ctx.createGain(); node.gain.value = value; return node; }
/** A slow wobble on a parameter: depth either side of its value, at `rate` Hz. */
function lfo(ctx: BaseAudioContext, param: AudioParam, rate: number, depth: number, at: number): OscillatorNode {
  const osc = ctx.createOscillator(), amount = gainOf(ctx, depth);
  osc.frequency.value = rate; osc.connect(amount); amount.connect(param); osc.start(at);
  return osc;
}
/** A short burst of noise through a band: a drop, a crackle or a click. */
function burst(ctx: BaseAudioContext, out: AudioNode, white: AudioBuffer, at: number, o: { freq: number; q: number; level: number; decay: number; offset: number }): void {
  const source = ctx.createBufferSource(), band = filter(ctx, 'bandpass', o.freq, o.q), env = ctx.createGain();
  source.buffer = white;
  env.gain.setValueAtTime(0, at); env.gain.linearRampToValueAtTime(o.level, at + 0.002); env.gain.exponentialRampToValueAtTime(0.0001, at + o.decay);
  source.connect(band); band.connect(env); env.connect(out);
  source.start(at, o.offset, o.decay + 0.02);
}
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

/** A running preset: `fill` schedules its events up to a time; `stop` ends it. */
export type Voice = { fill(until: number): void; stop(at: number): void };
type Events = (at: number) => number;

/** Builds a preset into `out`, starting at `at`. `pitch` is Sa in Hz (tanpura only). */
/** Per-preset trims so every sound sits near the same loudness at the same volume (measured from the renders). */
const TRIM: Record<CalmSoundId, number> = { river: 2, rain: 3.4, fire: 1, wind: 1.7, crickets: 5.4, temple: 4, tanpura: 2.2, noise: 2.5 };

export function startPreset(ctx: BaseAudioContext, dest: AudioNode, id: CalmSoundId, o: { seed: number; pitch: number; at: number }): Voice {
  const random = seeded(o.seed), at = o.at;
  const out = gainOf(ctx, TRIM[id]);
  out.connect(dest);
  const nodes: AudioScheduledSourceNode[] = [];
  const bed = (colour: Colour, chain: AudioNode[], level: number) => {
    const source = loop(ctx, noise(ctx, colour, o.seed + nodes.length * 7919), at), gain = gainOf(ctx, level);
    [source, ...chain, gain].reduce((from, to) => { from.connect(to); return to; }).connect(out);
    nodes.push(source);
    return gain;
  };
  const white = noise(ctx, 'white', o.seed + 101, 2);
  let events: Events | null = null, next = at;

  switch (id) {
    case 'river': {
      const swell = bed('brown', [filter(ctx, 'bandpass', 420, 0.5), filter(ctx, 'lowpass', 1600)], 0.55);
      nodes.push(lfo(ctx, swell.gain, 0.07, 0.15, at));
      const sparkle = bed('white', [filter(ctx, 'bandpass', 2200, 0.9)], 0.05);
      nodes.push(lfo(ctx, sparkle.gain, 0.23, 0.025, at));
      break;
    }
    case 'rain': {
      bed('pink', [filter(ctx, 'highpass', 500), filter(ctx, 'lowpass', 5200)], 0.32);
      // Drops on the tent: light ticks, and now and then a heavier drop on the canvas.
      events = t => {
        const heavy = random() < 0.12;
        burst(ctx, out, white, t, heavy ? { freq: 260 + random() * 160, q: 2, level: 0.22 + random() * 0.12, decay: 0.09, offset: random() * 1.5 }
          : { freq: 2400 + random() * 2600, q: 3, level: 0.05 + random() * 0.08, decay: 0.025, offset: random() * 1.5 });
        return t + 0.03 + random() * 0.16;
      };
      break;
    }
    case 'fire': {
      const rumble = bed('brown', [filter(ctx, 'lowpass', 260)], 0.7);
      nodes.push(lfo(ctx, rumble.gain, 0.31, 0.12, at));
      bed('pink', [filter(ctx, 'bandpass', 900, 0.6)], 0.035);
      // Crackles come in little clusters, with an odd pop.
      events = t => {
        const cluster = 1 + Math.floor(random() * 4);
        for (let k = 0; k < cluster; k++) {
          const pop = random() < 0.1;
          burst(ctx, out, white, t + k * (0.008 + random() * 0.03), pop ? { freq: 700 + random() * 300, q: 1.2, level: 0.35, decay: 0.05, offset: random() * 1.5 }
            : { freq: 1800 + random() * 3500, q: 1.5, level: 0.08 + random() * 0.22, decay: 0.004 + random() * 0.01, offset: random() * 1.5 });
        }
        return t + 0.08 + random() * random() * 1.2;
      };
      break;
    }
    case 'wind': {
      const band = filter(ctx, 'bandpass', 520, 1.4);
      nodes.push(lfo(ctx, band.frequency, 0.045, 260, at));
      const gust = bed('pink', [band, filter(ctx, 'lowpass', 2200)], 0.5);
      gust.gain.setValueAtTime(0.35, at);
      events = t => { gust.gain.setTargetAtTime(0.2 + random() * 0.55, t, 1.2 + random() * 1.5); return t + 3 + random() * 4; };
      bed('brown', [filter(ctx, 'lowpass', 180)], 0.4);
      break;
    }
    case 'crickets': {
      // A faint night air, about 10 dB under the chirps, so the crickets lead (item 210).
      bed('brown', [filter(ctx, 'lowpass', 400)], 0.038);
      // Two crickets, each with its own pitch and rhythm: a chirp is a few quick pulses.
      const crickets = [{ freq: 4400, every: 0.9, pulses: 3 }, { freq: 5200, every: 1.35, pulses: 4 }];
      const due = crickets.map((_, k) => at + 0.3 + k * 0.45);
      events = t => {
        const k = due[0]! <= due[1]! ? 0 : 1, cricket = crickets[k]!, start = Math.max(t, due[k]!);
        for (let p = 0; p < cricket.pulses; p++) {
          const tone = ctx.createOscillator(), env = ctx.createGain(), when = start + p * 0.034;
          tone.type = 'sine'; tone.frequency.setValueAtTime(cricket.freq + random() * 60, when);
          env.gain.setValueAtTime(0, when); env.gain.linearRampToValueAtTime(0.07, when + 0.004); env.gain.linearRampToValueAtTime(0, when + 0.02);
          tone.connect(env); env.connect(out); tone.start(when); tone.stop(when + 0.03);
        }
        due[k] = start + cricket.every * (0.85 + random() * 0.3);
        return Math.min(due[0]!, due[1]!);
      };
      break;
    }
    case 'temple': {
      bed('pink', [filter(ctx, 'lowpass', 700)], 0.06);
      // A distant bell every 40-60 s; the first comes soon, so a short listen hears one.
      const far = filter(ctx, 'lowpass', 1800); far.connect(out);
      next = at + 2;
      events = t => { strike(ctx, far, t, 196 + random() * 4, 0.16, 11); return t + 40 + random() * 20; };
      break;
    }
    case 'tanpura': {
      // Sa, low Pa, Sa, low Sa: each pluck is a bright string that blooms (the jivari) and slowly fades.
      const sa = o.pitch, strings = [sa, sa * 0.75, sa, sa * 0.5], harmonics = 28;
      const real = new Float32Array(harmonics + 1), imag = new Float32Array(harmonics + 1);
      for (let n = 1; n <= harmonics; n++) imag[n] = 1 / Math.pow(n, 0.85);
      const wave = ctx.createPeriodicWave(real, imag);
      const buzz = ctx.createWaveShaper(), curve = new Float32Array(1024);
      for (let i = 0; i < curve.length; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(1.6 * x + 0.25 * x * x); }
      buzz.curve = curve;
      const body = filter(ctx, 'lowpass', 3800); buzz.connect(body); body.connect(out);
      let k = 0;
      next = at + 0.05;
      events = t => {
        const freq = strings[k % 4]!; k++;
        [0, 0.35 + random() * 0.2].forEach((detune, layer) => {
          const tone = ctx.createOscillator(), shine = filter(ctx, 'peaking', 1100, 1.6), env = ctx.createGain();
          tone.setPeriodicWave(wave); tone.frequency.setValueAtTime(freq + detune, t);
          shine.gain.setValueAtTime(2, t); shine.gain.linearRampToValueAtTime(11, t + 1.2); shine.gain.linearRampToValueAtTime(4, t + 6);
          shine.frequency.setValueAtTime(900, t); shine.frequency.exponentialRampToValueAtTime(2600, t + 2.5);
          const level = layer ? 0.035 : 0.06;
          env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(level, t + 0.03); env.gain.setTargetAtTime(level * 0.55, t + 0.03, 0.8);
          env.gain.setTargetAtTime(0.0001, t + 3.5, 1.6);
          tone.connect(shine); shine.connect(env); env.connect(buzz); tone.start(t); tone.stop(t + 10);
        });
        return t + (k % 4 === 0 ? 1.6 : 1.15);
      };
      break;
    }
    case 'noise': {
      bed('pink', [filter(ctx, 'lowpass', 2400)], 0.3);
      break;
    }
  }
  return {
    fill(until: number) { if (events) while (next < until) next = events(next); },
    stop(when: number) { for (const node of nodes) { try { node.stop(when); } catch { /* already stopped */ } } events = null; },
  };
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
  private voice: Voice | null = null;
  private element: HTMLAudioElement | null = null;
  private url: string | null = null;
  private timer = 0;

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

  play(o: { preset?: CalmSoundId; file?: Blob; seed: number; pitch: number; soundVolume: number; bellVolume: number }): void {
    const now = this.ctx.currentTime;
    void this.ctx.resume();
    this.setVolumes(o.soundVolume, o.bellVolume, FADE_IN);
    if (o.preset) {
      const voice = startPreset(this.ctx, this.sound, o.preset, { seed: o.seed, pitch: o.pitch, at: now + 0.05 });
      this.voice = voice;
      voice.fill(now + 4);
      // Events are scheduled a few seconds ahead, topped up each second.
      this.timer = window.setInterval(() => voice.fill(this.ctx.currentTime + 4), 1000);
    } else if (o.file) {
      this.url = URL.createObjectURL(o.file);
      const element = new Audio(this.url);
      element.loop = true; element.className = 'calm-user-audio'; element.hidden = true;
      document.body.append(element);
      this.ctx.createMediaElementSource(element).connect(this.sound);
      this.element = element;
      void element.play().catch(() => undefined);
    }
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
    window.clearInterval(this.timer);
    this.voice?.stop(this.ctx.currentTime);
    if (this.element) { this.element.pause(); this.element.remove(); this.element = null; }
    if (this.url) { URL.revokeObjectURL(this.url); this.url = null; }
    void this.ctx.close().catch(() => undefined);
  }
}
