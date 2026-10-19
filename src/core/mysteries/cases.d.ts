export type CaseDifficulty = 'easy' | 'medium' | 'hard';
export type Clue = { k: string; text?: string; s?: number; p?: number; i?: number; a?: number; b?: number };
export type MysteryCase = {
  seed: number; diff: CaseDifficulty; n: number; theme: string; title: string; setup: string;
  S: Array<{ n: string; role: string }>;
  I: Array<{ n: string }>;
  P: Array<{ p: string; n: string; s: string }>;
  clues: Clue[]; sol: { sp: number[]; si: number[] }; culprit: number;
  killer: { k: 'place' | 'item'; idx: number }; killerText: string; steps: string[];
};

declare const CaseGen: {
  generate: (options: { seed: number; diff?: CaseDifficulty; theme?: string }) => MysteryCase | null;
  daily: (date: string, diff?: CaseDifficulty) => MysteryCase | null;
  dailyDiff: (date: string) => CaseDifficulty;
  hash: (text: string) => number;
  countSolutions: (clues: Clue[], n: number) => number;
  holds: (clue: Clue, sp: number[], si: number[]) => boolean;
  propagate: (clues: Clue[], n: number, cross: boolean, current?: { A: number[]; B: number[]; C: number[] }) => { solved: boolean; bad: boolean; steps: Array<{ g: 'A' | 'B' | 'C'; r: number; c: number; v: number; why: { rule: string } }>; G: { A: number[][]; B: number[][]; C: number[][] } };
};
export default CaseGen;
