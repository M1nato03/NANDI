import { describe, expect, it } from 'vitest';
import { TRACE, advanceTrace, pathLength, pointAt, startTrace, traceDone, tracePath } from './trace';
import { generateKolam } from './kolam';

const kolam = generateKolam(3, 7, { strict: true });
const path = tracePath(kolam.points, 20, 10);

describe('spec 26 kolam tracing', () => {
  it('a slow finger along the line draws it to the end', () => {
    let trace = startTrace(path);
    const total = pathLength(path);
    for (let d = 0, t = 0; d <= total; d += TRACE.sampleStepPx, t += 20) trace = advanceTrace(path, trace, { ...pointAt(path, d), t });
    expect(traceDone(trace)).toBe(true);
  });
  it('a fast move only pauses the line; nothing is lost and slowing down carries on', () => {
    let trace = startTrace(path);
    for (let d = 0, t = 0; d <= 60; d += 3, t += 20) trace = advanceTrace(path, trace, { ...pointAt(path, d), t });
    const before = trace.progress;
    trace = advanceTrace(path, trace, { ...pointAt(path, 120), t: (trace.last?.t ?? 0) + 10 });
    expect(trace.tooFast).toBe(true);
    expect(trace.progress).toBe(before);
    trace = advanceTrace(path, trace, { ...pointAt(path, before + 3), t: (trace.last?.t ?? 0) + 400 });
    expect(trace.tooFast).toBe(false);
    expect(trace.progress).toBeGreaterThanOrEqual(before);
  });
  it('a finger far from the line, or far ahead of its end, adds nothing', () => {
    let trace = startTrace(path);
    trace = advanceTrace(path, trace, { x: 500, y: 500, t: 0 });
    expect(trace.progress).toBe(0);
    const far = pointAt(path, 200);
    trace = advanceTrace(path, { ...trace, last: { ...far, t: 0 } }, { ...far, t: 2000 });
    expect(trace.progress).toBe(0);
  });
});
