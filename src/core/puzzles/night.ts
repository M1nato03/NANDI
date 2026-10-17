import PZ, { type PuzzleDifficulty, type PuzzleType } from './index';
import { dailyBoard } from './daily';

export type NightPuzzleChoice = { type: PuzzleType; diff: PuzzleDifficulty; daily: boolean };

export function selectNightPuzzle(type: PuzzleType, diff: PuzzleDifficulty, dailySolved: boolean): NightPuzzleChoice {
  return !dailySolved && diff !== 'hard'
    ? { type, diff, daily: true }
    : { type, diff: 'easy', daily: false };
}

export function nightPracticeSeed(day: string, type: PuzzleType): number {
  return PZ.hash(`night-practice:${day}:${type}`);
}

export function nightPuzzleBoard(day: string, choice: NightPuzzleChoice) {
  return choice.daily ? dailyBoard(day) : PZ.generate(choice.type, { seed: nightPracticeSeed(day, choice.type), diff: 'easy' });
}
