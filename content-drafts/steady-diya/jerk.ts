/** A small visual response model, not a measure of form or fitness. */
export type MotionSample = {
  timeMs: number;
  x: number;
  y: number;
  z: number;
};

export type FlameFrame = {
  timeMs: number;
  /** RMS change in filtered acceleration, in m/s^3. */
  jerk: number;
  /** 0 = still flame, 1 = visible flicker. Never an extinguished state. */
  flicker: number;
};

const FILTER_MS = 60;
const WINDOW_MS = 400;
const CALM_JERK = 3;
const FULL_FLICKER_JERK = 15;

/**
 * Estimate recent jerk from a short foreground trace.
 * Samples must be ordered. Gaps, invalid values and warm-up yield a calm flame.
 * Thresholds are visual-design guesses; they need device calibration.
 */
export function flameFrames(samples: readonly MotionSample[]): FlameFrame[] {
  const frames: FlameFrame[] = [];
  const window: { timeMs: number; jerkSquared: number }[] = [];
  let filtered: { x: number; y: number; z: number } | undefined;
  let previousTime: number | undefined;

  for (const sample of samples) {
    const { timeMs, x, y, z } = sample;
    if (![timeMs, x, y, z].every(Number.isFinite)) continue;

    const dtMs = previousTime === undefined ? 0 : timeMs - previousTime;
    if (dtMs <= 0 || dtMs > 200 || filtered === undefined) {
      filtered = { x, y, z };
      previousTime = timeMs;
      window.length = 0;
      frames.push({ timeMs, jerk: 0, flicker: 0 });
      continue;
    }

    const alpha = dtMs / (FILTER_MS + dtMs);
    const next = {
      x: filtered.x + alpha * (x - filtered.x),
      y: filtered.y + alpha * (y - filtered.y),
      z: filtered.z + alpha * (z - filtered.z),
    };
    const seconds = dtMs / 1000;
    const jx = (next.x - filtered.x) / seconds;
    const jy = (next.y - filtered.y) / seconds;
    const jz = (next.z - filtered.z) / seconds;
    window.push({ timeMs, jerkSquared: jx * jx + jy * jy + jz * jz });
    while (window.length && timeMs - window[0].timeMs > WINDOW_MS) window.shift();

    const rms = Math.sqrt(window.reduce((sum, item) => sum + item.jerkSquared, 0) / window.length);
    const ready = window.length >= 8 && timeMs - window[0].timeMs >= 300;
    const flicker = ready
      ? Math.min(1, Math.max(0, (rms - CALM_JERK) / (FULL_FLICKER_JERK - CALM_JERK)))
      : 0;
    frames.push({ timeMs, jerk: ready ? rms : 0, flicker });
    filtered = next;
    previousTime = timeMs;
  }
  return frames;
}
