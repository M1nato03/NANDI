/**
 * Slow kolam prototype (cj8). Pure TypeScript, no app imports, no randomness at runtime
 * beyond a seeded PRNG. Not wired into the app.
 *
 * Model (the "mirror curve" model used for sona and sikku kolam; see docs/reviews/cj8-kolam.md):
 * - An n x n grid of dots sits at odd lattice points (2i+1, 2j+1) inside the box [0, 2n]^2.
 * - The line moves diagonally, one lattice step at a time, through "odd" points (x + y odd).
 *   Interior odd points are midpoints between two neighbouring dots ("sites").
 *   Odd points on the box edge are where the line bounces around an outer dot.
 * - At each site the line either crosses itself (X) or turns away (a "wall" between the two dots).
 *   A wall always sits between the two dots, so it never lets two dots share a region.
 * - With no walls an n x n grid gives n separate loops. Walls splice loops together.
 *   The generator adds walls until exactly one closed loop remains.
 */

export type Pt = readonly [number, number];

/** Rotational symmetry order: 4 = quarter turn, 2 = half turn, 1 = none. */
export type Symmetry = 4 | 2 | 1;

export interface Kolam {
  n: number;
  seed: number;
  /** The rotational symmetry the generator managed to keep. */
  symmetry: Symmetry;
  /** Site keys "x,y" that hold a wall. Every other interior site is a crossing. */
  walls: string[];
  /** The closed line as lattice points; the last step returns to points[0]. */
  points: Pt[];
}

export interface GenOptions {
  /** Highest symmetry to try first (default 4). The generator steps down 4 -> 2 -> 1 if stuck. */
  symmetry?: Symmetry;
  /** Greedy restarts per symmetry level before stepping down (default 12). */
  restarts?: number;
  /** After reaching one loop, try this many extra wall toggles that keep one loop (default 2n). */
  extraTries?: number;
  /**
   * Strict pulli kolam (Demaine et al. 2007 definition): every bounded region holds exactly one dot,
   * so no empty diamonds between four dots. Default false: small empty diamonds are allowed.
   */
  strict?: boolean;
}

/** Original layout studies within the square-dot, one-line model. These are not traditional names. */
export type PatternFamily = 'rim-turns' | 'inner-turns';

/** mulberry32: small seeded PRNG so a seed always gives the same kolam. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (x: number, y: number) => `${x},${y}`;

/** All interior sites (midpoints between two neighbouring dots). Count is 2n(n-1). */
export function sites(n: number): Pt[] {
  const out: Pt[] = [];
  for (let x = 1; x < 2 * n; x++) {
    for (let y = 1; y < 2 * n; y++) {
      if ((x + y) % 2 === 1) out.push([x, y]);
    }
  }
  return out;
}

/** Direction after arriving at point (x, y) moving (dx, dy). */
function nextDir(n: number, walls: ReadonlySet<string>, x: number, y: number, dx: number, dy: number): [number, number] {
  if (x === 0 || x === 2 * n) return [-dx, dy];
  if (y === 0 || y === 2 * n) return [dx, -dy];
  if (walls.has(key(x, y))) {
    // x even: dots sit left and right, the wall is vertical, so flip dx. y even: flip dy.
    return x % 2 === 0 ? [-dx, dy] : [dx, -dy];
  }
  return [dx, dy];
}

const segKey = (ax: number, ay: number, bx: number, by: number) =>
  ax < bx || (ax === bx && ay < by) ? `${ax},${ay}|${bx},${by}` : `${bx},${by}|${ax},${ay}`;

/** Trace every loop of the configuration. Each unit segment is used by exactly one loop. */
export function traceLoops(n: number, walls: ReadonlySet<string>): Pt[][] {
  const used = new Set<string>();
  const loops: Pt[][] = [];
  // Every unit segment touches exactly one dot diamond; start from each dot diamond edge.
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cx = 2 * i + 1;
      const cy = 2 * j + 1;
      const starts: [number, number, number, number][] = [
        [cx - 1, cy, 1, -1],
        [cx, cy - 1, 1, 1],
        [cx + 1, cy, -1, 1],
        [cx, cy + 1, -1, -1],
      ];
      for (const [sx, sy, sdx, sdy] of starts) {
        if (used.has(segKey(sx, sy, sx + sdx, sy + sdy))) continue;
        const loop: Pt[] = [];
        let x = sx, y = sy, dx = sdx, dy = sdy;
        for (;;) {
          loop.push([x, y]);
          used.add(segKey(x, y, x + dx, y + dy));
          x += dx;
          y += dy;
          [dx, dy] = nextDir(n, walls, x, y, dx, dy);
          if (x === sx && y === sy && dx === sdx && dy === sdy) break;
        }
        loops.push(loop);
      }
    }
  }
  return loops;
}

/** Rotate a site 90 degrees about the grid centre. */
const rot = (n: number, [x, y]: Pt): Pt => [2 * n - y, x];

/** Group sites into orbits under rotation by 360/order degrees (order 4, 2 or 1). */
function orbits(n: number, order: Symmetry): string[][] {
  const seen = new Set<string>();
  const out: string[][] = [];
  const steps = order === 4 ? 1 : order === 2 ? 2 : 4; // quarter turns per symmetry step
  for (const s of sites(n)) {
    const k = key(s[0], s[1]);
    if (seen.has(k)) continue;
    const orbit: string[] = [];
    let p: Pt = s;
    for (let r = 0; r < order; r++) {
      const pk = key(p[0], p[1]);
      if (!orbit.includes(pk)) orbit.push(pk);
      seen.add(pk);
      for (let q = 0; q < steps; q++) p = rot(n, p);
    }
    out.push(orbit);
  }
  return out;
}

function shuffle<T>(a: T[], r: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const toggle = (walls: Set<string>, orbit: string[]) => {
  for (const k of orbit) {
    if (walls.has(k)) walls.delete(k);
    else walls.add(k);
  }
};

/** Greedy splicing: toggle orbits, keep a toggle only if the loop count drops. */
function splice(n: number, order: Symmetry, r: () => number): Set<string> | null {
  const walls = new Set<string>();
  let count = traceLoops(n, walls).length;
  let progress = true;
  while (count > 1 && progress) {
    progress = false;
    for (const orbit of shuffle(orbits(n, order), r)) {
      toggle(walls, orbit);
      const c = traceLoops(n, walls).length;
      if (c < count) {
        count = c;
        progress = true;
        if (count === 1) break;
      } else toggle(walls, orbit);
    }
  }
  return count === 1 ? walls : null;
}

/** Generate one valid single-line kolam. Deterministic for a given (n, seed, options). */
export function generateKolam(n: number, seed: number, opts: GenOptions = {}): Kolam {
  if (!Number.isInteger(n) || n < 2 || n > 9) throw new Error('n must be an integer from 2 to 9');
  const r = rng(seed);
  const levels = ([4, 2, 1] as Symmetry[]).filter((o) => o <= (opts.symmetry ?? 4));
  const restarts = opts.restarts ?? 12;
  for (const order of levels) {
    for (let a = 0; a < restarts; a++) {
      const walls = opts.strict ? wallTree(n, order, r) : splice(n, order, r);
      if (!walls || traceLoops(n, walls).length !== 1) continue;
      if (!opts.strict) {
        // Variety: extra toggles at the same symmetry that keep exactly one loop.
        const orb = orbits(n, order);
        const extra = opts.extraTries ?? 2 * n;
        for (let t = 0; t < extra; t++) {
          const o = orb[Math.floor(r() * orb.length)]!;
          toggle(walls, o);
          if (traceLoops(n, walls).length !== 1) toggle(walls, o);
        }
      }
      const [points] = traceLoops(n, walls);
      return { n, seed, symmetry: order, walls: [...walls].sort(), points: points! };
    }
  }
  throw new Error(`could not reach one loop (n=${n}, seed=${seed})`);
}

/**
 * Choose a strict single-line layout from a small, deterministic candidate set.
 * Rim turns put more separating turns beside the outside row of dots; inner turns put fewer there.
 * The source for both remains the same square-dot model, so checkKolam validates the final line.
 */
export function generatePatternFamily(n: number, seed: number, family: PatternFamily): Kolam {
  if (family !== 'rim-turns' && family !== 'inner-turns') throw new Error(`unknown pattern family: ${family}`);
  const r = rng(seed ^ 0x4b4f4c41);
  let best: Kolam | undefined;
  let bestScore = family === 'rim-turns' ? -Infinity : Infinity;
  for (let i = 0; i < 16; i++) {
    const candidate = generateKolam(n, Math.floor(r() * 4294967296), { strict: true, symmetry: 1 });
    const rimTurns = candidate.walls.filter((wall) => {
      const [x, y] = wall.split(',').map(Number);
      return x === 1 || y === 1 || x === 2 * n - 1 || y === 2 * n - 1;
    }).length;
    if (family === 'rim-turns' ? rimTurns > bestScore : rimTurns < bestScore) {
      best = candidate;
      bestScore = rimTurns;
    }
  }
  // Keep the caller's date seed in the result, rather than the internal candidate seed.
  return { ...best!, seed };
}

/**
 * Strict mode: a wall joins the two corner regions beside it (the gaps between four dots, or the
 * outside). One closed line with c crossings has c + 2 faces, so the number of empty regions is
 * (n-1)^2 - walls. No empty region means the walls form a spanning tree over the corners plus the
 * outside. Build a random spanning tree (Kruskal over symmetric orbits); the caller checks it is one loop.
 */
function wallTree(n: number, order: Symmetry, r: () => number): Set<string> | null {
  const corner = (x: number, y: number) => (x <= 0 || y <= 0 || x >= 2 * n || y >= 2 * n ? 'out' : key(x, y));
  const ends = (k: string): [string, string] => {
    const [x = 0, y = 0] = k.split(',').map(Number);
    return x % 2 === 0 ? [corner(x, y - 1), corner(x, y + 1)] : [corner(x - 1, y), corner(x + 1, y)];
  };
  const parent = new Map<string, string>();
  const find = (a: string): string => {
    const p = parent.get(a);
    if (!p || p === a) return a;
    const root = find(p);
    parent.set(a, root);
    return root;
  };
  const walls = new Set<string>();
  const target = (n - 1) * (n - 1);
  for (const orbit of shuffle(orbits(n, order), r)) {
    // Add the whole orbit only if it closes no cycle.
    const saved = new Map(parent);
    let ok = true;
    for (const k of orbit) {
      const [a, b] = ends(k);
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) {
        ok = false;
        break;
      }
      parent.set(ra, rb);
    }
    if (ok) orbit.forEach((k) => walls.add(k));
    else {
      parent.clear();
      saved.forEach((v, k) => parent.set(k, v));
    }
  }
  return walls.size === target ? walls : null;
}

// ---------------------------------------------------------------------------------------------
// Checker. It reads only n and the point list, never the generator's walls.

export interface CheckResult {
  ok: boolean;
  /** Number of closed loops found in the drawing (must be 1). */
  loops: number;
  /** Bounded regions with no dot inside (small diamonds between four dots). Allowed, reported. */
  emptyRegions: number;
  problems: string[];
}

/** Check that `points` is one closed line that goes around every dot of an n x n grid on its own. */
export function checkKolam(n: number, points: readonly Pt[]): CheckResult {
  const problems: string[] = [];
  const L = points.length;
  const max = 2 * n;
  const total = 4 * n * n;
  if (L !== total) problems.push(`line has ${L} steps, expected ${total} (every segment once)`);

  // 1. Every step is a diagonal unit step between odd points inside the box; closes on itself.
  const segs = new Set<string>();
  for (let k = 0; k < L; k++) {
    const [ax, ay] = points[k]!;
    const [bx, by] = points[(k + 1) % L];
    if ((ax + ay) % 2 !== 1 || ax < 0 || ay < 0 || ax > max || ay > max) problems.push(`bad point ${ax},${ay}`);
    if (Math.abs(bx - ax) !== 1 || Math.abs(by - ay) !== 1) problems.push(`step ${k} is not a diagonal unit step`);
    const s = segKey(ax, ay, bx, by);
    if (segs.has(s)) problems.push(`segment ${s} used twice (line retraces)`);
    segs.add(s);
  }

  // 2. Local moves at each point. Regions: dots "d", corners "c", outside "out".
  const parent = new Map<string, string>();
  const find = (a: string): string => {
    let p = parent.get(a) ?? a;
    if (p !== a) {
      p = find(p);
      parent.set(a, p);
    }
    return p;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  const region = (x: number, y: number) => {
    if (x <= 0 || y <= 0 || x >= max || y >= max) return 'out';
    return x % 2 === 1 ? `d${x},${y}` : `c${x},${y}`;
  };
  const visits = new Map<string, number>();
  for (let k = 0; k < L && problems.length === 0; k++) {
    const [px, py] = points[(k - 1 + L) % L]!;
    const [x, y] = points[k]!;
    const [qx, qy] = points[(k + 1) % L]!;
    const din = [x - px, y - py] as const;
    const dout = [qx - x, qy - y] as const;
    const kk = key(x, y);
    visits.set(kk, (visits.get(kk) ?? 0) + 1);
    const straight = din[0] === dout[0] && din[1] === dout[1];
    const flipX = din[0] === -dout[0] && din[1] === dout[1];
    const flipY = din[0] === dout[0] && din[1] === -dout[1];
    if (x === 0 || x === max) {
      if (!flipX) problems.push(`at edge ${kk} the line must bounce back`);
    } else if (y === 0 || y === max) {
      if (!flipY) problems.push(`at edge ${kk} the line must bounce back`);
    } else if (straight) {
      // crossing: the four regions stay apart
    } else if (x % 2 === 0 ? flipX : flipY) {
      // a turn that keeps the two dots apart; it joins the two corner regions
      if (x % 2 === 0) union(region(x, y - 1), region(x, y + 1));
      else union(region(x - 1, y), region(x + 1, y));
    } else {
      problems.push(`at ${kk} the line turns between two dots and would join them`);
    }
  }
  for (const [kk, v] of visits) {
    const [x, y] = kk.split(',').map(Number);
    const edge = x === 0 || y === 0 || x === max || y === max;
    if (v !== (edge ? 1 : 2)) problems.push(`point ${kk} visited ${v} times`);
  }

  // 3. Every dot sits alone in a bounded region.
  const dotRoots = new Map<string, string>();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const d = `d${2 * i + 1},${2 * j + 1}`;
      const root = find(d);
      if (root === find('out')) problems.push(`dot ${d} is not enclosed`);
      if (dotRoots.has(root)) problems.push(`dot ${d} shares a region with ${dotRoots.get(root)}`);
      dotRoots.set(root, d);
    }
  }
  const emptyRoots = new Set<string>();
  for (let x = 2; x < max; x += 2) {
    for (let y = 2; y < max; y += 2) {
      const root = find(`c${x},${y}`);
      if (root !== find('out')) emptyRoots.add(root);
    }
  }
  return { ok: problems.length === 0, loops: problems.length === 0 ? 1 : 0, emptyRegions: emptyRoots.size, problems };
}

/** Count loops in an arbitrary wall set, for tests and the review table. */
export const loopCount = (n: number, walls: Iterable<string>) => traceLoops(n, new Set(walls)).length;

// ---------------------------------------------------------------------------------------------
// SVG output.

/**
 * SVG path data. The line passes through the middle of each unit segment; each lattice point is
 * a quadratic control point, so crossings stay straight and turns become smooth arcs round the dots.
 */
export function toPathData(points: readonly Pt[], unit = 20, pad = 10): string {
  const L = points.length;
  const X = (v: number) => +(pad + v * unit).toFixed(2);
  const mid = (k: number): [number, number] => {
    const a = points[k % L]!;
    const b = points[(k + 1) % L]!;
    return [X((a[0] + b[0]) / 2), X((a[1] + b[1]) / 2)];
  };
  const [sx, sy] = mid(0);
  let d = `M${sx} ${sy}`;
  for (let k = 1; k <= L; k++) {
    const c = points[k % L]!;
    const [mx, my] = mid(k);
    d += ` Q${X(c[0])} ${X(c[1])} ${mx} ${my}`;
  }
  return d + ' Z';
}

export function toSvg(k: Kolam, unit = 20): string {
  const pad = unit / 2;
  const size = 2 * k.n * unit + 2 * pad;
  const dots: string[] = [];
  for (let i = 0; i < k.n; i++) {
    for (let j = 0; j < k.n; j++) {
      dots.push(`<circle cx="${pad + (2 * i + 1) * unit}" cy="${pad + (2 * j + 1) * unit}" r="${unit * 0.14}"/>`);
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `<title>Single-line kolam, ${k.n} by ${k.n} dots (seed ${k.seed})</title>`,
    `<rect width="100%" height="100%" fill="#2b2622"/>`,
    `<g fill="#f4efe6">${dots.join('')}</g>`,
    `<path d="${toPathData(k.points, unit, pad)}" fill="none" stroke="#f4efe6" stroke-width="${unit * 0.16}" stroke-linecap="round" stroke-linejoin="round"/>`,
    `</svg>`,
    '',
  ].join('\n');
}

/** Length of the line in lattice units (each step is sqrt 2). Used for the tracing-time table. */
export const lineLength = (k: Kolam) => k.points.length * Math.SQRT2;
