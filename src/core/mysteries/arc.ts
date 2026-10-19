import lantern from '../../../content/mystery-arcs/mystery-arc.lantern-ledger.json';
import measure from '../../../content/mystery-arcs/mystery-arc.missing-measure.json';
import monsoon from '../../../content/mystery-arcs/mystery-arc.monsoon-map.json';
import bell from '../../../content/mystery-arcs/mystery-arc.last-bell.json';
import type { PuzzleRunRow } from '../../data/types';
import { RULES } from '../rules.config';

const arcs = [lantern, measure, monsoon, bell];
const dateOf = (key: string) => new Date(`${key}T12:00:00Z`);
const keyOf = (date: Date) => date.toISOString().slice(0, 10);
const firstMonday = (year: number, month: number) => {
  const first = new Date(Date.UTC(year, month, 1, 12));
  first.setUTCDate(1 + (8 - first.getUTCDay()) % 7);
  return first;
};

export function seasonFor(day: string): { index: number; start: string; chapter: number; panel: number; arcIndex: number } {
  const date = dateOf(day);
  let year = date.getUTCFullYear(), month = date.getUTCMonth();
  let start = firstMonday(year, month);
  if (date < start) { month--; if (month < 0) { year--; month = 11; } start = firstMonday(year, month); }
  const index = Math.max(0, (year - 2026) * 12 + month - 10 + 1);
  const chapter = Math.min(RULES.mind.arcChapters - 1, Math.floor((date.getTime() - start.getTime()) / 604_800_000));
  return { index, start: keyOf(start), chapter, panel: (date.getUTCDay() + 6) % 7, arcIndex: index % RULES.mind.arcCount };
}

export function currentArcTitle(dayKey: string): string {
  const arcIndex = seasonFor(dayKey).arcIndex;
  return arcs.find(pack => pack.body.arcIndex === arcIndex)?.title ?? 'The Proving Ground';
}

export type RevealedPanel = { id: string; dayKey: string; arcTitle: string; chapterTitle: string; text: string; bonus: boolean };
export function revealedPanels(runs: readonly PuzzleRunRow[], throughDay: string): RevealedPanel[] {
  const current = seasonFor(throughDay);
  const solved = runs.filter(row => !row.deleted && row.daily && row.result === 'solved' && row.dayKey && row.dayKey <= throughDay && seasonFor(row.dayKey).start === current.start);
  const panels: RevealedPanel[] = [];
  for (const row of solved.filter(item => item.type === 'mystery').sort((a, b) => a.dayKey!.localeCompare(b.dayKey!))) {
    const slot = seasonFor(row.dayKey!);
    const arc = arcs.find(pack => pack.body.arcIndex === slot.arcIndex);
    const chapter = arc?.body.chapters[slot.chapter];
    if (!arc || !chapter) continue;
    panels.push({ id: row.id, dayKey: row.dayKey!, arcTitle: arc.title, chapterTitle: chapter.title, text: chapter.panels[slot.panel]!, bonus: false });
    if (slot.panel === 6 && solved.some(board => board.type !== 'mystery' && board.dayKey === row.dayKey)) panels.push({ id: `${row.id}:bonus`, dayKey: row.dayKey!, arcTitle: arc.title, chapterTitle: chapter.title, text: chapter.bonus, bonus: true });
  }
  return panels;
}
