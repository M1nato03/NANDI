import { chooseRules, rng, shuffle, type HintLadder, type Level, type Rule } from './common';

export type LockCase = {
  type: 'lock'; seed: number; level: Level; story: string; clues: string[]; answer: string;
  difficulty: { clues: number; candidates: number };
  rules: Rule<string>[];
};

export const lockHints: HintLadder = [
  'A “nothing right” clue removes all three shown digits.',
  'For a “wrong place” clue, keep one shown digit but move it away from that slot.',
  'Check every remaining code against every clue, including the absent digits.',
];

const CODES = Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, '0'))
  .filter(code => code[0] !== '0' && new Set(code).size === 3);
const GUESSES = Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, '0'))
  .filter(code => new Set(code).size === 3);

type Feedback = 'placed' | 'misplaced' | 'absent' | 'other';

export function lockFeedback(code: string, guess: string): Feedback {
  const placed = [...guess].filter((digit, i) => code[i] === digit).length;
  const present = [...guess].filter(digit => code.includes(digit)).length;
  if (placed === 1 && present === 1) return 'placed';
  if (placed === 0 && present === 1) return 'misplaced';
  if (present === 0) return 'absent';
  return 'other';
}

export function lockCandidates(): string[] { return [...CODES]; }

export function solveLock(c: Pick<LockCase, 'rules'>): string[] {
  return CODES.filter(code => c.rules.every(rule => rule.holds(code)));
}

function clue(guess: string, feedback: Exclude<Feedback, 'other'>): Rule<string> {
  const phrase = feedback === 'placed' ? 'one digit right and well placed'
    : feedback === 'misplaced' ? 'one digit right but wrong place' : 'nothing right';
  return {
    text: `${guess}: ${phrase}.`,
    holds: code => lockFeedback(code, guess) === feedback,
  };
}

export function generateLock(seed: number, level: Level): LockCase {
  const random = rng(seed);
  const answer = CODES[Math.floor(random() * CODES.length)];
  const guesses = shuffle(GUESSES, random);
  const facts = guesses.flatMap(guess => {
    const feedback = lockFeedback(answer, guess);
    return feedback === 'other' ? [] : [clue(guess, feedback)];
  });
  const rules = chooseRules(CODES, answer, facts, random, level);
  return {
    type: 'lock', seed, level,
    story: 'A three-digit practice lock uses three different digits. The first digit is not zero. Each clue says exactly how many digits are in the code; all unmentioned digits in that guess are absent. Find the code.',
    clues: rules.map(r => r.text), answer, rules,
    difficulty: { clues: rules.length, candidates: CODES.length },
  };
}
