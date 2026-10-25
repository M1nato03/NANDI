import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkKolam, generateKolam, generatePatternFamily, loopCount, sites, toPathData, toSvg, traceLoops, type Pt } from './kolam';

const SIZES = [3, 4, 5] as const;
const SEEDS = 200;

describe('model', () => {
  it.each(SIZES)('n=%i: 2n(n-1) sites, and with no walls the line splits into n loops', (n) => {
    expect(sites(n)).toHaveLength(2 * n * (n - 1));
    expect(loopCount(n, [])).toBe(n);
  });

  it.each(SIZES)('n=%i: every configuration uses each of the 4n^2 segments exactly once', (n) => {
    const loops = traceLoops(n, new Set(sites(n).slice(0, n).map(([x, y]) => `${x},${y}`)));
    expect(loops.reduce((s, l) => s + l.length, 0)).toBe(4 * n * n);
  });
});

describe('generator + checker', () => {
  for (const n of SIZES) {
    for (const strict of [false, true]) {
      it(`${n}x${n} ${strict ? 'strict' : 'open'}: ${SEEDS} seeds all give one closed line round every dot`, () => {
        const t0 = performance.now();
        let empties = 0;
        for (let seed = 1; seed <= SEEDS; seed++) {
          const k = generateKolam(n, seed, { strict });
          const c = checkKolam(n, k.points);
          expect(c.problems).toEqual([]);
          expect(c.ok).toBe(true);
          expect(c.loops).toBe(1);
          // Faces of one closed line with c crossings = c + 2, so empty regions = (n-1)^2 - walls.
          expect(c.emptyRegions).toBe((n - 1) ** 2 - k.walls.length);
          if (strict) expect(c.emptyRegions).toBe(0);
          empties += c.emptyRegions;
        }
        const ms = (performance.now() - t0) / SEEDS;
        console.log(`${n}x${n} ${strict ? 'strict' : 'open'}: ${ms.toFixed(2)} ms per kolam, mean empty regions ${(empties / SEEDS).toFixed(2)}`);
      });
    }
  }

  it('is deterministic for a seed', () => {
    expect(generateKolam(5, 42)).toEqual(generateKolam(5, 42));
    expect(generateKolam(4, 9, { strict: true })).toEqual(generateKolam(4, 9, { strict: true }));
  });

  it('keeps quarter-turn symmetry on 3x3 and 5x5', () => {
    for (const n of [3, 5]) {
      const k = generateKolam(n, 1, { strict: true });
      expect(k.symmetry).toBe(4);
      const set = new Set(k.walls);
      for (const w of k.walls) {
        const [x, y] = w.split(',').map(Number);
        expect(set.has(`${2 * n - y},${x}`)).toBe(true);
      }
    }
  });
});

describe('clock pattern families', () => {
  const rimTurns = (n: number, walls: readonly string[]) => walls.filter((wall) => {
    const [x, y] = wall.split(',').map(Number);
    return x === 1 || y === 1 || x === 2 * n - 1 || y === 2 * n - 1;
  }).length;

  it.each(SIZES)('%ix%i: both families keep one strict closed line, with different turn placement', (n) => {
    for (let seed = 1; seed <= 40; seed++) {
      const rim = generatePatternFamily(n, seed, 'rim-turns');
      const inner = generatePatternFamily(n, seed, 'inner-turns');
      for (const k of [rim, inner]) {
        const result = checkKolam(n, k.points);
        expect(result.ok).toBe(true);
        expect(result.loops).toBe(1);
        expect(result.emptyRegions).toBe(0);
        expect(k.seed).toBe(seed);
      }
      expect(rimTurns(n, rim.walls)).toBeGreaterThan(rimTurns(n, inner.walls));
      expect(generatePatternFamily(n, seed, 'rim-turns')).toEqual(rim);
    }
  });
});

describe('checker rejects bad lines', () => {
  const good = generateKolam(4, 3, { strict: true });

  it('rejects one loop out of several (does not cover every dot)', () => {
    const [first] = traceLoops(4, new Set());
    const c = checkKolam(4, first);
    expect(c.ok).toBe(false);
  });

  it('rejects a line that is not closed or skips a step', () => {
    expect(checkKolam(4, good.points.slice(0, -1)).ok).toBe(false);
    const broken = good.points.map((p, i): Pt => (i === 10 ? [p[0] + 2, p[1]] : p));
    expect(checkKolam(4, broken).ok).toBe(false);
  });

  it('rejects a line that retraces a segment', () => {
    const p = good.points;
    const retrace: Pt[] = [...p.slice(0, 5), p[3], p[4], ...p.slice(7)];
    expect(checkKolam(4, retrace).ok).toBe(false);
  });

  it('rejects a full single line whose turn joins two dots into one region', () => {
    // Independent tracer that lets one site turn the wrong way (along the line joining two dots).
    const traceWith = (n: number, walls: Set<string>, bad: string): Pt[][] => {
      const used = new Set<string>();
      const seg = (a: Pt, b: Pt) => [a, b].map((p) => p.join(',')).sort().join('|');
      const loops: Pt[][] = [];
      for (const [sx, sy] of sites(n).concat([[0, 1]])) {
        for (const [sdx, sdy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const nx = sx + sdx, ny = sy + sdy;
          if (nx < 0 || ny < 0 || nx > 2 * n || ny > 2 * n || used.has(seg([sx, sy], [nx, ny]))) continue;
          const loop: Pt[] = [];
          let x = sx, y = sy, dx = sdx, dy = sdy;
          do {
            loop.push([x, y]);
            used.add(seg([x, y], [x + dx, y + dy]));
            x += dx; y += dy;
            const k = `${x},${y}`;
            if (x === 0 || x === 2 * n) dx = -dx;
            else if (y === 0 || y === 2 * n) dy = -dy;
            else if (k === bad) { if (x % 2 === 0) dy = -dy; else dx = -dx; }
            else if (walls.has(k)) { if (x % 2 === 0) dx = -dx; else dy = -dy; }
          } while (!(x === sx && y === sy && dx === sdx && dy === sdy));
          loops.push(loop);
        }
      }
      return loops;
    };
    let tested = 0;
    for (let seed = 1; seed <= 20 && tested < 5; seed++) {
      const k = generateKolam(4, seed);
      for (const w of k.walls) {
        const loops = traceWith(4, new Set(k.walls.filter((x) => x !== w)), w);
        if (loops.length !== 1) continue;
        const c = checkKolam(4, loops[0]);
        expect(c.ok).toBe(false);
        expect(c.problems.join(' ')).toMatch(/would join them/);
        tested++;
      }
    }
    expect(tested).toBeGreaterThan(0);
  });
});

describe('svg', () => {
  it('path data is closed and has one curve command per step', () => {
    const k = generateKolam(3, 7, { strict: true });
    const d = toPathData(k.points);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/Q/g)).toHaveLength(k.points.length);
  });

  it.each([
    ['sample-3x3-strict-seed7.svg', 3, 7, true],
    ['sample-4x4-strict-seed3.svg', 4, 3, true],
    ['sample-4x4-open-seed11.svg', 4, 11, false],
    ['sample-5x5-strict-seed5.svg', 5, 5, true],
    ['sample-5x5-open-seed2.svg', 5, 2, false],
  ] as const)('%s matches the generator output', (file, n, seed, strict) => {
    const svg = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
    expect(svg).toBe(toSvg(generateKolam(n, seed, { strict })));
  });

  it.each(['rim-turns', 'inner-turns'] as const)('5x5 %s sample matches its family', (family) => {
    const svg = readFileSync(new URL(`./sample-5x5-${family}-seed7.svg`, import.meta.url), 'utf8');
    expect(svg).toBe(toSvg(generatePatternFamily(5, 7, family)));
  });
});
