import { RULES } from '../rules.config';
import PZ, { type PuzzleBoard, type PuzzleDifficulty, type PuzzleType } from './index';

/** Intro is extra; it never changes the shared date seed or the daily slot. */
export function needsIntro(type: PuzzleType, runs: readonly { type: string; result?: string; deleted?: number }[]): boolean {
  return !runs.some(run => run.type === type && run.result === 'solved' && !run.deleted);
}

export function featuredSpec(day: string): { type: PuzzleType; diff: PuzzleDifficulty } {
  const weekday = new Date(`${day}T12:00:00`).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const [featured, diff] = RULES.mind.featuredByWeekday[weekday];
  if (featured !== 'BOSS') return { type: featured, diff };
  const date = new Date(`${day}T12:00:00`);
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { type: RULES.mind.bossRotation[week % RULES.mind.bossRotation.length]!, diff };
}

export function dailyBoard(day: string): PuzzleBoard | null {
  const { type, diff } = featuredSpec(day);
  const seed = PZ.hash(`daily:${day}:${type}:${diff}`);
  for (let attempt = 0; attempt < 6; attempt++) {
    const board = PZ.generate(type, { seed: (seed + attempt * 7919) >>> 0, diff });
    if (board) return board;
  }
  return null;
}
