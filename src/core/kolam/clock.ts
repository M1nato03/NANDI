import { generateKolam, generatePatternFamily, type Kolam, type PatternFamily } from './kolam';

export interface ClockKolam {
  nightDate: string;
  size: 3 | 4 | 5;
  seed: number;
  family: 'base' | PatternFamily;
  lineColor: 'warm-white' | 'silver';
  kolam: Kolam;
}

const localDateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

/** Fixed date hash; independent of runtime randomness and stable offline. */
export function dateSeed(dateKey: string): number {
  let hash = 2166136261;
  for (const char of dateKey) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Margazhi for this product rule: 16 Dec through 14 Jan, inclusive. */
export function isMargazhi(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (month === 12 && day >= 16) || (month === 1 && day <= 14);
}

/** A layout's fingerprint: its size and wall sites, so the same layout reads the same whatever seed made it. */
export function layoutHash(kolam: Kolam): string {
  return `${kolam.n}:${[...kolam.walls].sort().join(';')}`;
}

/** How far back a 3 by 3 layout may not repeat (spec 26 B2), and how many seeds to try before allowing a repeat. */
export const NO_REPEAT_NIGHTS = 30;
export const NO_REPEAT_TRIES = 50;

const FAMILIES = ['base', 'rim-turns', 'inner-turns'] as const;
const build = (size: number, seed: number, family: (typeof FAMILIES)[number]) => family === 'base' ? generateKolam(size, seed, { strict: true }) : generatePatternFamily(size, seed, family);

/**
 * The night's kolam. The 04:00 boundary keeps a post-midnight visit on the previous night's pattern. The date seeds
 * the pattern (the same for everyone that night) and picks the family. At 3 by 3 the base family alone has only two
 * layouts, so all three families are drawn from together and the seed steps past any layout this phone saw in its
 * last 30 nights, up to 50 tries, before a repeat is allowed.
 */
export function selectClockKolam(now: Date, options: { fullMoon?: (nightDate: string) => boolean; recent?: readonly string[] } = {}, existing?: ClockKolam): ClockKolam {
  if (Number.isNaN(now.getTime())) throw new RangeError('valid local date required');
  const hour = now.getHours();
  const night = new Date(now);
  if (hour < 4) night.setDate(night.getDate() - 1);
  const nightDate = localDateKey(night);
  if (existing?.nightDate === nightDate) return existing;
  const base = hour >= 23 || hour < 4 ? 3 : hour >= 21 ? 4 : 5;
  const size = Math.min(5, base + (isMargazhi(night) ? 1 : 0)) as 3 | 4 | 5;
  const first = dateSeed(nightDate);
  let seed = first, family: (typeof FAMILIES)[number] = FAMILIES[first % 3]!, kolam = build(size, seed, family);
  if (size === 3 && options.recent?.length) {
    const recent = new Set(options.recent.slice(-NO_REPEAT_NIGHTS));
    for (let step = 0; step < NO_REPEAT_TRIES; step++) {
      const candidateSeed = (first + step * 7919) >>> 0;
      const candidateFamily = FAMILIES[candidateSeed % 3]!;
      const candidate = build(size, candidateSeed, candidateFamily);
      if (!recent.has(layoutHash(candidate))) { seed = candidateSeed; family = candidateFamily; kolam = candidate; break; }
    }
  }
  return { nightDate, size, seed, family, lineColor: options.fullMoon?.(nightDate) ? 'silver' : 'warm-white', kolam };
}
