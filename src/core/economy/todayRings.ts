import { RULES, RULES_HISTORY, rulesFor, type RulesHistoryEntry } from '../rules.config';
import type { LedgerRow, SettingRow } from '../../data/types';
import { picks, type Picks } from '../welcome';
import { daySlots, type DayRings } from './daySlots';
import { bodyLine, mindLine, RINGS_NIGHT_LINE, yatraLine } from './ringLines';

/**
 * Spec 571 §0.20: the header's three rings for today, from the same daySlots() the economy pays from (E11), so a ring
 * and the Hat-trick can never disagree. Null until economy.v10From exists (b2 call 3: before it, the header shows an
 * empty reserved slot, never a fake "not yet").
 */
export const RING_NAMES = ['yatra', 'body', 'mind'] as const;
export type RingName = typeof RING_NAMES[number];
export type RingState = 'done' | 'half' | 'none';

const day = (settings: readonly SettingRow[], key: string) => {
  const value = settings.find(row => row.key === key && !row.deleted)?.value;
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '9999-12-31';
};

/** Today's rings from today's ledger rows and the settings, or null before v10From. */
export function todayRings(rows: readonly LedgerRow[], settings: readonly SettingRow[], today: string, history: readonly RulesHistoryEntry[] = RULES_HISTORY): DayRings | null {
  if (today < day(settings, 'economy.v10From')) return null;
  const seen = new Set<string>();
  const own = [...rows].filter(row => !row.deleted && row.dayKey === today)
    .sort((a, b) => a.updatedAt - b.updatedAt || a.id.localeCompare(b.id))
    .filter(row => { if (seen.has(row.id)) return false; seen.add(row.id); return true; });
  const rules = rulesFor(today, history)?.rules ?? RULES;
  return daySlots(own, { key: today, rules, history, v7: today >= day(settings, 'economy.v7From'), v9: today >= day(settings, 'economy.v9From'), v10: true }).rings;
}

/** Spec 52 picks: Yatra if Plan is picked, Body if Train, Mind if Learn or Mind; a Sleep-only picker sees none. */
export function ringsShown(state: Picks): RingName[] {
  return RING_NAMES.filter(name => name === 'yatra' ? picks(state, 'plan') : name === 'body' ? picks(state, 'train') : picks(state, 'learn') || picks(state, 'mind'));
}

/** Where a ring's line leads: Yatra to Mor's list, Body to Train, Mind to Read if Learn is picked, else to Play. */
export function ringRoute(name: RingName, state: Picks): string {
  if (name === 'yatra') return 'yatra';
  if (name === 'body') return 'grow/train';
  return picks(state, 'learn') ? 'grow/read' : 'grow/play';
}

export function ringState(name: RingName, rings: DayRings): RingState {
  if (name === 'yatra') return rings.yatra ? 'done' : 'none';
  if (name === 'body') return rings.body ? 'done' : 'none';
  return rings.mind.length >= 2 ? 'done' : rings.mind.length === 1 ? 'half' : 'none';
}

/** The ring's one line (its tap text and its aria-label). Inside the night window every ring says the night line. */
export function ringLine(name: RingName, rings: DayRings, night: boolean, promise?: string | null): string {
  if (night) return RINGS_NIGHT_LINE;
  if (name === 'yatra') return yatraLine(rings.yatra ? (promise ?? '') : null);
  if (name === 'body') return bodyLine(rings.body);
  return mindLine(rings.mind);
}
