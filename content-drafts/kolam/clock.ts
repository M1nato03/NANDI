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

/** The 04:00 boundary keeps a post-midnight visit on the previous night's pattern. */
export function selectClockKolam(now: Date, fullMoonNights: ReadonlySet<string> = new Set(), existing?: ClockKolam): ClockKolam {
  if (Number.isNaN(now.getTime())) throw new RangeError('valid local date required');
  const hour = now.getHours();
  const night = new Date(now);
  if (hour < 4) night.setDate(night.getDate() - 1);
  const nightDate = localDateKey(night);
  if (existing?.nightDate === nightDate) return existing;
  const base = hour >= 23 || hour < 4 ? 3 : hour >= 21 ? 4 : 5;
  const size = Math.min(5, base + (isMargazhi(night) ? 1 : 0)) as 3 | 4 | 5;
  const seed = dateSeed(nightDate);
  const family = (['base', 'rim-turns', 'inner-turns'] as const)[seed % 3];
  const kolam = family === 'base' ? generateKolam(size, seed, { strict: true }) : generatePatternFamily(size, seed, family);
  return { nightDate, size, seed, family, lineColor: fullMoonNights.has(nightDate) ? 'silver' : 'warm-white', kolam };
}
