import lantern from '../../../content/mystery-arcs/mystery-arc.lantern-ledger.json';
import measure from '../../../content/mystery-arcs/mystery-arc.missing-measure.json';
import monsoon from '../../../content/mystery-arcs/mystery-arc.monsoon-map.json';
import bell from '../../../content/mystery-arcs/mystery-arc.last-bell.json';
import type { PuzzleRunRow } from '../../data/types';
import { RULES } from '../rules.config';
import { seasonFor as economySeason } from '../economy/deriveEconomy';

const arcs = [lantern, measure, monsoon, bell];
const dateOf = (key: string) => new Date(`${key}T12:00:00Z`);

/**
 * The story's place in the season, numbered from the economy's seasonFor (the one the ladder and closes use):
 * the story counts the pre-season month as 0, so its index is the economy's plus one (batch 5, item 51).
 */
export function seasonFor(day: string): { index: number; start: string; chapter: number; panel: number; arcIndex: number } {
  const season = economySeason(day);
  const index = Math.max(0, season.index + 1);
  const date = dateOf(day);
  const chapter = Math.min(RULES.mind.arcChapters - 1, Math.floor((date.getTime() - dateOf(season.start).getTime()) / 604_800_000));
  return { index, start: season.start, chapter, panel: (date.getUTCDay() + 6) % 7, arcIndex: index % RULES.mind.arcCount };
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
