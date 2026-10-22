import type { PuzzleRunRow } from '../../data/types';
import { RULES } from '../rules.config';
import { WEB_APP } from './challenge';
import { boardNumber } from './daily';

/** One mark per board type at the start of a shared result (spec 19 C). */
export const typeMarks: Record<string, string> = { sudoku: '🔢', crowns: '👑', sunmoon: '🌗', path: '〰️', calc: '➗', mystery: '🔎' };
const maxBulbs = 5;

const timeText = (ms: number | undefined) => {
  const seconds = Math.round((ms ?? 0) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
const titleCase = (value: string) => value.replace(/^./, letter => letter.toUpperCase());

export function shareText(run: Pick<PuzzleRunRow, 'type' | 'diff' | 'solveMs' | 'hintsUsed'>, name: string): string {
  const difficulty = titleCase(run.diff ?? 'easy');
  const hints = run.hintsUsed ?? 0;
  return `NANDI · ${name} (${difficulty}) · ${timeText(run.solveMs)} · ${hints ? `${hints} hint${hints === 1 ? '' : 's'}` : 'no hints'}`;
}

export interface ResultShare {
  type: string;
  name: string;
  diff?: string;
  solveMs?: number;
  hintsUsed?: number;
  /** The daily board number; left out for practice boards, and below 1 it is not shown. */
  number?: number;
  /** Only when this solve is the player's best time for the type and difficulty. */
  best?: boolean;
  /** The board's link; left out for practice boards and cases. */
  link?: string;
  /** A friend answering a challenge: line 3 says "My time on your board". */
  reply?: boolean;
}

/**
 * Spec 19 C: the one result text. Time, hints and the link only: no board state, nothing red, no streak.
 *   NANDI 👑 Crowns #12 · Medium
 *   4:12 · no hints ✨
 *   Same board, your turn: https://…/#mind/challenge/…
 */
export function resultText(share: ResultShare): string {
  const number = share.number !== undefined && share.number >= 1 ? ` #${share.number}` : '';
  const hints = Math.max(0, share.hintsUsed ?? 0);
  const lines = [
    `NANDI ${typeMarks[share.type] ?? '🧩'} ${share.name}${number} · ${titleCase(share.diff ?? 'easy')}`,
    `${timeText(share.solveMs)} · ${hints ? '💡'.repeat(Math.min(hints, maxBulbs)) : 'no hints ✨'}${share.best ? ' · my best' : ''}`,
  ];
  if (share.link) lines.push(share.reply ? `My time on your board: ${share.link}` : `Same board, your turn: ${share.link}`);
  return lines.join('\n');
}

/** "my best" only for a solve at least as fast as every earlier solve of the same type and difficulty (never on a first solve). */
export function isPersonalBest(run: Pick<PuzzleRunRow, 'id' | 'type' | 'diff' | 'solveMs' | 'result'>, runs: readonly Pick<PuzzleRunRow, 'id' | 'type' | 'diff' | 'solveMs' | 'result' | 'deleted'>[]): boolean {
  if (run.result !== 'solved' || run.solveMs === undefined) return false;
  const earlier = runs.filter(row => row.id !== run.id && !row.deleted && row.result === 'solved' && row.type === run.type && row.diff === run.diff && row.solveMs !== undefined);
  return earlier.length > 0 && earlier.every(row => run.solveMs! <= row.solveMs!);
}

/** Spec 19 C: "Case #N" only for the weekday's shared case (an onboarding easy case differs); no link for cases yet. */
export function caseResultText(run: PuzzleRunRow, day: string, diff: 'easy' | 'medium' | 'hard', runs: readonly PuzzleRunRow[]): string {
  const shared = diff === RULES.mind.caseDiffByWeekday[new Date(`${day}T12:00:00`).getDay() as keyof typeof RULES.mind.caseDiffByWeekday];
  return resultText({ type: 'mystery', name: 'Case', diff, solveMs: run.solveMs, hintsUsed: run.hintsUsed, number: shared ? boardNumber(day) : undefined, best: isPersonalBest(run, runs) });
}

/** The week card's text (spec 19 C): one line plus the app's link, with no tracking. */
export function weekShareText(lines: readonly string[]): string {
  return `My week on NANDI: ${lines.join(', ')}.\n${WEB_APP}`;
}

export async function shareTile(run: Pick<PuzzleRunRow, 'type' | 'diff' | 'solveMs' | 'hintsUsed'>, name: string): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = 600;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Share tile is unavailable.');
  context.fillStyle = '#0E0F12'; context.fillRect(0, 0, 900, 600);
  context.fillStyle = '#7CC4FF'; context.font = 'bold 34px sans-serif'; context.fillText('NANDI  ·  MIND', 70, 95);
  context.fillStyle = '#F4F0E8'; context.font = 'bold 72px sans-serif'; context.fillText(name, 70, 230);
  context.font = '36px sans-serif'; context.fillText((run.diff ?? 'easy').toUpperCase(), 70, 300);
  context.fillStyle = '#C9C3B8'; context.font = '32px sans-serif';
  const details = shareText(run, name).split(' · ').slice(2).join('   ·   ');
  context.fillText(details, 70, 420);
  context.fillStyle = '#7CC4FF'; context.fillRect(70, 492, 760, 5);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not make share tile.')), 'image/png'));
  return new File([blob], `nandi-${run.type}-${run.diff}.png`, { type: 'image/png' });
}
