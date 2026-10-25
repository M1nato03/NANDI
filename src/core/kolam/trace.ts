/**
 * Spec 26 B1: tracing the night's kolam with one finger in one unbroken line. The line only grows while the finger
 * moves slowly and stays near the line's growing end (cj8 tracing rule: about 0.25 px/ms on a 360 px phone). Going
 * fast is never an error: the line waits, Kachhua tucks in, and growth resumes when the finger slows.
 */
export const TRACE = { maxSpeedPxPerMs: 0.25, tolerancePx: 22, lookAheadPx: 40, sampleStepPx: 3 } as const;
export type Point = { x: number; y: number };
export type Trace = { progress: number; total: number; tooFast: boolean; last?: Point & { t: number } };

/** The closed line as screen points (lattice points times the unit), starting and ending at the first point. */
export function tracePath(points: readonly (readonly [number, number])[], unit: number, pad: number): Point[] {
  const path = points.map(([x, y]) => ({ x: pad + x * unit, y: pad + y * unit }));
  return path.length ? [...path, path[0]!] : path;
}

const segLength = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
export function pathLength(path: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += segLength(path[i - 1]!, path[i]!);
  return total;
}

/** The point at a distance along the path. */
export function pointAt(path: readonly Point[], distance: number): Point {
  let left = distance;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!, b = path[i]!, length = segLength(a, b);
    if (left <= length) { const f = length ? left / length : 0; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
    left -= length;
  }
  return path.at(-1) ?? { x: 0, y: 0 };
}

export function startTrace(path: readonly Point[]): Trace {
  return { progress: 0, total: pathLength(path), tooFast: false };
}

/** One finger sample. Progress only ever grows; a fast move pauses it without losing anything. */
export function advanceTrace(path: readonly Point[], trace: Trace, sample: Point & { t: number }): Trace {
  const last = trace.last;
  const dt = last ? Math.max(1, sample.t - last.t) : 1;
  const speed = last ? Math.hypot(sample.x - last.x, sample.y - last.y) / dt : 0;
  if (speed > TRACE.maxSpeedPxPerMs) return { ...trace, tooFast: true, last: sample };
  // Look along the next stretch of line for the point nearest the finger.
  let best = trace.progress, bestGap = Infinity;
  for (let d = trace.progress; d <= Math.min(trace.total, trace.progress + TRACE.lookAheadPx); d += 2) {
    const p = pointAt(path, d), gap = Math.hypot(p.x - sample.x, p.y - sample.y);
    if (gap < bestGap) { bestGap = gap; best = d; }
  }
  const progress = bestGap <= TRACE.tolerancePx ? Math.max(trace.progress, best) : trace.progress;
  return { ...trace, progress: progress >= trace.total - 2 ? trace.total : progress, tooFast: false, last: sample };
}

export const traceDone = (trace: Trace) => trace.total > 0 && trace.progress >= trace.total;
