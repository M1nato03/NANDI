import { describe, expect, it } from 'vitest';
import { flameFrames, type MotionSample } from './jerk';

const trace = (value: (i: number) => number): MotionSample[] =>
  Array.from({ length: 80 }, (_, i) => ({ timeMs: i * 20, x: value(i), y: 0, z: 0 }));

describe('steady diya flame response', () => {
  it('keeps a slow smooth movement calm', () => {
    const frames = flameFrames(trace(i => 0.18 * Math.sin(i * 0.04)));
    expect(Math.max(...frames.map(frame => frame.flicker))).toBe(0);
  });

  it('flickers for repeated sharp changes and never goes out', () => {
    const frames = flameFrames(trace(i => (i % 8 < 4 ? 1.5 : -1.5)));
    expect(frames.at(-1)!.flicker).toBeGreaterThan(0.5);
    expect(frames.every(frame => frame.flicker >= 0 && frame.flicker <= 1)).toBe(true);
  });

  it('resets after a sensor gap instead of treating it as a jerk', () => {
    const samples = trace(() => 0);
    samples.push({ timeMs: 2500, x: 9, y: 0, z: 0 });
    expect(flameFrames(samples).at(-1)).toMatchObject({ jerk: 0, flicker: 0 });
  });

  it('ignores invalid samples', () => {
    const frames = flameFrames([
      { timeMs: 0, x: 0, y: 0, z: 0 },
      { timeMs: 20, x: Number.NaN, y: 0, z: 0 },
      { timeMs: 40, x: 0, y: 0, z: 0 },
    ]);
    expect(frames).toHaveLength(2);
    expect(frames.at(-1)?.flicker).toBe(0);
  });
});
