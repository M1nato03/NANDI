import type { LedgerRow } from '../../data/types';
import { AREAS, deriveCourtyard, type AreaId, type FriendName } from './courtyard';
import { storyGoodThings } from '../soft/soft';

type Band = 'one' | 'some' | 'many';
type Lines = Record<Band, readonly [string, string]>;

// Hand-written, two per band; {n} is the number of days that week. The week picks the variant.
const LINES: Record<AreaId, Lines> = {
  train: {
    one: ['Nandi stretched out on the mat once this week. One session still moves the body.', 'One workout this week. Nandi kept the clubs warm for next time.'],
    some: ['Nandi trained with you on {n} days. The mat is starting to look used.', '{n} days of moving this week. Nandi stands a little prouder.'],
    many: ['{n} training days! Nandi barely sat down all week.', 'Nandi counted {n} days of training. Strong week, steady pace.'],
  },
  plan: {
    one: ['Mor saw one day of finished tasks. One flower opened.', 'A task got done this week, and Mor fanned out to celebrate.'],
    some: ['Tasks got done on {n} days. Mor\'s garden has new colour.', 'Mor counted {n} days of plans turned into done.'],
    many: ['{n} days of getting things done. Mor\'s garden is in full bloom.', 'Mor watched you finish tasks on {n} days. The courtyard is tidy and bright.'],
  },
  learn: {
    one: ['Chiku found one new idea with you this week.', 'One day of learning. Chiku tucked a new page into the pile.'],
    some: ['Chiku learned with you on {n} days. The book stack grew.', '{n} days of new ideas. Chiku keeps asking for more.'],
    many: ['{n} days of learning! Chiku read by lamplight all week.', 'Chiku counted {n} learning days. That is a lot of new ideas.'],
  },
  remember: {
    one: ['Moti checked one old idea with you. It stays sharp now.', 'One day of idea checks. Moti put it safely in the box.'],
    some: ['Moti kept old ideas fresh on {n} days.', '{n} days of looking back. Moti\'s shelf of jars is filling up.'],
    many: ['{n} days of idea checks. Moti forgets nothing this week.', 'Moti counted {n} days of remembering. Your ideas are well kept.'],
  },
  mind: {
    one: ['Kapi solved one puzzle with you and grinned about it all week.', 'One puzzle day. Kapi turned the cube one more time.'],
    some: ['Kapi puzzled with you on {n} days. Sharp week.', '{n} days of puzzles. Kapi is already planning the next one.'],
    many: ['{n} puzzle days! Kapi ran out of chalk on the slate.', 'Kapi counted {n} days of thinking games. Clever week.'],
  },
  sleep: {
    one: ['One night on time. Kachhua slept well beside you.', 'Kachhua remembers one early night this week. A good start.'],
    some: ['You slept on time {n} nights. Kachhua is well rested.', '{n} nights on time. Kachhua\'s cot never felt so comfy.'],
    many: ['{n} nights on time! Kachhua has never slept this well.', 'Kachhua counted {n} good nights. Rest is part of the work.'],
  },
};
const QUIET = ['A quiet week in the courtyard. The friends rested and kept your place warm.', 'The courtyard had a slow week. Everyone is still here, ready when you are.'] as const;
// Spec 15: soft days get their own page. {day} is the weekday of a single soft day; {n} the count.
const SOFT_ONE = ['On {day} you took it slow and still lit a lantern.', 'On {day} you went gently, and Kachhua lit a lantern for it.'] as const;
const SOFT_MANY = ['{n} lanterns this week. Kachhua kept every one glowing.', '{n} soft days this week, and a lantern for each. You kept showing up.'] as const;
const CLOSE = ['That was your week. Same courtyard, a little more lived in.', 'Week done. The friends are saving a spot for next week.'] as const;

export interface StoryPage { kind: 'cover' | 'area' | 'quiet' | 'soft' | 'close'; friend?: FriendName; area?: AreaId; stage?: number; days?: number; text: string }
export interface Storybook { weekStart: string; weekEnd: string; pages: StoryPage[]; practisedAreas: number }

const addDays = (key: string, count: number) => new Date(Date.parse(`${key}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10);
/** Monday of the week that holds `day`. */
export function storyWeekStart(day: string): string { return addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7)); }
const pick = <T,>(items: readonly T[], seed: string) => items[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % items.length]!;
const band = (n: number): Band => n >= 5 ? 'many' : n >= 2 ? 'some' : 'one';
const short = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** The story of one Monday–Sunday week, from the ledger alone. */
export function buildStorybook(facts: readonly LedgerRow[], weekStart: string): Storybook {
  const weekEnd = addDays(weekStart, 6);
  const state = deriveCourtyard(facts, weekEnd, weekStart);
  const practised = state.areas.filter(area => area.week > 0).sort((a, b) => b.week - a.week);
  const pages: StoryPage[] = [{ kind: 'cover', text: `${short(weekStart)} – ${short(weekEnd)}` }];
  const hasSoft = facts.some(fact => !fact.deleted && fact.kind === 'soft' && fact.dayKey >= weekStart && fact.dayKey <= weekEnd);
  if (!practised.length && !hasSoft) pages.push({ kind: 'quiet', friend: 'Kachhua', text: pick(QUIET, weekStart) });
  for (const area of practised) pages.push({ kind: 'area', friend: area.friend, area: area.id, stage: area.stage, days: area.week,
    text: pick(LINES[area.id][band(area.week)], weekStart + area.id).replace('{n}', String(area.week)) });
  const softDays = [...new Set(facts.filter(fact => !fact.deleted && fact.kind === 'soft' && fact.dayKey >= weekStart && fact.dayKey <= weekEnd).map(fact => fact.dayKey))].sort();
  if (softDays.length) {
    const weekday = new Date(`${softDays[0]}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
    const kept = storyGoodThings(facts, weekStart, weekEnd);
    pages.push({ kind: 'soft', friend: 'Kachhua', days: softDays.length,
      text: (softDays.length === 1 ? pick(SOFT_ONE, weekStart) : pick(SOFT_MANY, weekStart)).replace('{day}', weekday).replace('{n}', String(softDays.length))
        + (kept.length ? ` A good thing you kept: “${kept[0]}”` : '') });
  }
  if (practised.length || softDays.length) pages.push({ kind: 'close', text: pick(CLOSE, weekStart) });
  return { weekStart, weekEnd, pages, practisedAreas: practised.length };
}

/** The last `count` weeks before (and including) the week of `today`, newest first. */
export function recentWeeks(today: string, count: number): string[] {
  const start = storyWeekStart(today);
  return Array.from({ length: count }, (_, index) => addDays(start, -7 * index));
}
export const areaLabel = (id: AreaId) => AREAS.find(area => area.id === id)!.label;
