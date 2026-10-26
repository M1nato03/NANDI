import type { PuzzleBoard, PuzzleType } from './index';
import type { PuzzleState } from './rules';

/**
 * Spec 29: a do-it-yourself tutorial for every board type, 3-5 steps, one rule and one move per step, on a tiny
 * board. Crowns, Sun & Moon and Mini Sudoku adapt the cj9 tutorials.json steps to the app's symbols; Number Path,
 * Calcudoku and the case are written in the same format.
 */
export type TutorialStep = { text: string; board: PuzzleBoard; start: PuzzleState; cell: number; value: number };
export type Tutorial = { type: PuzzleType; steps: TutorialStep[]; outro: string };

const crownsBoard = (regions: string[]): PuzzleBoard => {
  const letters = [...new Set(regions.join(''))];
  const region = regions.join('').split('').map(letter => letters.indexOf(letter));
  return { type: 'crowns', diff: 'easy', seed: 0, N: regions.length, region, solution: [] };
};
const crownsGrid = (rows: string[]) => rows.join('').split('').map(mark => mark === '*' ? 2 : mark === 'x' ? 1 : 0);
const stripes = ['AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE'];
const blank5 = ['.....', '.....', '.....', '.....', '.....'];
const at = (n: number, row: number, col: number) => row * n + col;

const crowns: Tutorial = {
  type: 'crowns',
  steps: [
    { text: 'Every row gets one crown. This row has one open square left. Tap it twice for a crown.', board: crownsBoard(stripes), start: { grid: crownsGrid(['xxxx.', ...blank5.slice(1)]), path: [] }, cell: at(5, 0, 4), value: 2 },
    { text: 'Every column gets one crown too. Tap this square below the crown once to cross it out.', board: crownsBoard(stripes), start: { grid: crownsGrid(['..*..', ...blank5.slice(1)]), path: [] }, cell: at(5, 1, 2), value: 1 },
    { text: 'Every colour gets one crown. This square has the same colour as the crown, so cross it out.', board: crownsBoard(['EEEAA', 'BBEEA', 'DBECE', 'DDEEE', 'EEEEE']), start: { grid: crownsGrid([...blank5.slice(0, 4), '..*..']), path: [] }, cell: at(5, 0, 0), value: 1 },
    { text: "Crowns can't touch, not even at a corner. Cross out this square at the crown's corner.", board: crownsBoard(stripes), start: { grid: crownsGrid(['.*...', ...blank5.slice(1)]), path: [] }, cell: at(5, 1, 2), value: 1 },
  ],
  outro: 'That is all of Crowns. Your board is bigger, and the same four rules solve it.',
};

const sudokuBoard = (rows: string[]): PuzzleBoard => {
  const givens = rows.join('').split('').map(mark => mark === '.' ? 0 : Number(mark));
  return { type: 'sudoku', diff: 'easy', seed: 0, N: 4, br: 2, bc: 2, givens, solution: [] };
};
const sudokuStep = (text: string, rows: string[], row: number, col: number, value: number): TutorialStep => {
  const board = sudokuBoard(rows);
  return { text, board, start: { grid: (board as Extract<PuzzleBoard, { type: 'sudoku' }>).givens.slice(), path: [] }, cell: at(4, row, col), value };
};
const sudoku: Tutorial = {
  type: 'sudoku',
  steps: [
    sudokuStep('Each row uses 1, 2, 3 and 4 once. Tap the glowing square, then the missing number.', ['123.', '....', '....', '....'], 0, 3, 4),
    sudokuStep('Each column also uses every number once. Fill the missing number.', ['1...', '2...', '3...', '....'], 3, 0, 4),
    sudokuStep('Each small box uses every number once too. Fill the missing number.', ['12..', '3...', '....', '....'], 1, 1, 4),
  ],
  outro: 'Your board is 6 by 6, with 1 to 6 and boxes of 2 by 3. The same three rules solve it.',
};

const sunmoonBoard = (rows: string[], hs: Record<number, number> = {}): PuzzleBoard => {
  const given = rows.join('').split('').map(mark => mark === 'S' ? 1 : mark === 'M' ? 0 : -1);
  return { type: 'sunmoon', diff: 'easy', seed: 0, given, hs: Array.from({ length: 30 }, (_, i) => hs[i] ?? 0), vs: Array(30).fill(0), solution: [] };
};
const empty6 = ['......', '......', '......', '......', '......', '......'];
const sunmoonStep = (text: string, rows: string[], cell: number, value: number, hs?: Record<number, number>): TutorialStep => {
  const board = sunmoonBoard(rows, hs);
  return { text, board, start: { grid: (board as Extract<PuzzleBoard, { type: 'sunmoon' }>).given.slice(), path: [] }, cell, value };
};
const sunmoon: Tutorial = {
  type: 'sunmoon',
  steps: [
    sunmoonStep("Fill each square with a sun or a moon. Three of the same can't sit side by side. Tap twice for a moon here.", ['SS....', ...empty6.slice(1)], at(6, 0, 2), 0),
    sunmoonStep('Each row has 3 suns and 3 moons. This row has its 3 suns, so tap twice for a moon in the last square.', ['SMSMS.', ...empty6.slice(1)], at(6, 0, 5), 0),
    sunmoonStep('Columns follow the same rules. Two suns sit above, so tap twice for a moon below them.', ['S.....', 'S.....', ...empty6.slice(2)], at(6, 2, 0), 0),
    sunmoonStep('= means the two squares match. Tap once for a sun next to this sun.', ['S.....', ...empty6.slice(1)], at(6, 0, 1), 1, { 0: 1 }),
    sunmoonStep('× means the two squares differ. Tap twice for a moon next to this sun.', ['S.....', ...empty6.slice(1)], at(6, 0, 1), 0, { 0: 2 }),
  ],
  outro: 'That is all of Sun & Moon. Some squares start filled; work out the rest with these rules.',
};

const pathBoard: PuzzleBoard = { type: 'path', diff: 'easy', seed: 0, R: 3, C: 3, waypoints: [0, 2, 8], solution: [] };
const pathStep = (text: string, path: number[], cell: number): TutorialStep => ({ text, board: pathBoard, start: { grid: [], path }, cell, value: cell });
const path: Tutorial = {
  type: 'path',
  steps: [
    pathStep('The line starts on 1. Tap the square with 1.', [], 0),
    pathStep('The line moves one square at a time: up, down, left or right. Tap the square next to 1.', [0], 1),
    pathStep('Visit the numbers in order. Carry on to 2.', [0, 1], 2),
    pathStep('The line passes through every square once. Turn down here.', [0, 1, 2], 5),
    pathStep('Finish on the last number once every other square is covered. End on 3.', [0, 1, 2, 5, 4, 3, 6, 7], 8),
  ],
  outro: 'That is all of Number Path. You can also drag your finger to draw the line.',
};

const calcBoard: PuzzleBoard = { type: 'calc', diff: 'easy', seed: 0, N: 3, solution: [], cages: [
  { cells: [0, 3], op: '+', target: 3 }, { cells: [1, 2], op: '×', target: 6 }, { cells: [4, 5], op: '−', target: 2 },
  { cells: [6, 7], op: '÷', target: 3 }, { cells: [8], op: '', target: 2 },
] };
const calcStep = (text: string, filled: Record<number, number>, cell: number, value: number): TutorialStep =>
  ({ text, board: calcBoard, start: { grid: Array.from({ length: 9 }, (_, i) => filled[i] ?? 0), path: [] }, cell, value });
const calc: Tutorial = {
  type: 'calc',
  steps: [
    calcStep('Each row uses 1, 2 and 3 once. Tap the glowing square, then the missing number.', { 0: 1, 1: 2 }, 2, 3),
    calcStep('Each column uses every number once too. Fill the missing number.', { 0: 1, 3: 2 }, 6, 3),
    calcStep('An outlined group makes its number. 3+ means its squares add up to 3. 1 and what make 3?', { 0: 1 }, 3, 2),
    calcStep('6× means its squares multiply to 6. 2 times what makes 6?', { 1: 2 }, 2, 3),
    calcStep('2− means its two squares are 2 apart. 3 and which number are 2 apart?', { 4: 3 }, 5, 1),
  ],
  outro: 'That is all of Calcudoku. ÷ works the same way: one number divided by the other.',
};

export const TUTORIALS: Record<PuzzleType, Tutorial> = { crowns, sudoku, sunmoon, path, calc };

/** The case walkthrough: a 3 by 3 grid of suspects and objects; a tap goes blank, ×, ✓ (as the real grid does). */
export type CaseTutorialStep = { text: string; start: number[]; cell?: number; value?: number; culprit?: number };
export const CASE_TUTORIAL: { suspects: string[]; objects: string[]; steps: CaseTutorialStep[]; outro: string } = {
  suspects: ['Asha', 'Ravi', 'Meera'],
  objects: ['key', 'lamp', 'book'],
  steps: [
    { text: "Each suspect had exactly one object. Clue: Asha had the key. Tap Asha's key square twice for ✓.", start: [0, 0, 0, 0, 0, 0, 0, 0, 0], cell: 0, value: 1 },
    { text: "A ✓ rules out the rest of its row and column, so they show × on their own. Clue: Ravi didn't have the lamp. Tap Ravi's lamp once for ×.", start: [1, 0, 0, 0, 0, 0, 0, 0, 0], cell: 4, value: -1 },
    { text: 'When one square is left in a row, it must be ✓. Mark the last open square in Ravi\'s row.', start: [1, 0, 0, 0, -1, 0, 0, 0, 0], cell: 5, value: 1 },
    { text: 'Last, name the culprit from the key clue. Key clue: the culprit had the lamp. Who had the lamp?', start: [1, 0, 0, 0, -1, 1, 0, 1, 0], culprit: 2 },
  ],
  outro: "That is the whole case. Today's case has more clues and three grids, and the same moves solve it.",
};
