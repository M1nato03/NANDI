import { chooseRules, permutations, rng, shuffle, type HintLadder, type Level, type Rule } from './common';

export type SeatingShape = 'row' | 'circle';
export type SeatingCase = {
  type: 'seating'; seed: number; level: Level; shape: SeatingShape;
  story: string; people: string[]; clues: string[]; answer: string[];
  difficulty: { clues: number; candidates: number };
  rules: Rule<string[]>[];
};

const NAMES = ['Asha', 'Dev', 'Ira', 'Kabir', 'Mei', 'Zoya', 'Tashi', 'Nila', 'Farhan'];

export const seatingHints: HintLadder = [
  'Draw one slot per person. In a circle, fix the named anchor at the top.',
  'Put each immediate-neighbour clue on the sketch before testing the wider gaps.',
  'Try the remaining people in open slots; reject any order that breaks one clue.',
];

export function seatingCandidates(people: readonly string[], shape: SeatingShape): string[][] {
  return shape === 'row' ? permutations(people)
    : permutations(people.slice(1)).map(rest => [people[0], ...rest]);
}

export function solveSeating(c: Pick<SeatingCase, 'people' | 'shape' | 'rules'>): string[][] {
  return seatingCandidates(c.people, c.shape).filter(order => c.rules.every(rule => rule.holds(order)));
}

function facts(people: string[], shape: SeatingShape): Rule<string[]>[] {
  const n = people.length;
  const out: Rule<string[]>[] = [];
  for (const a of people) for (const b of people) if (a !== b) {
    const gap = (order: string[]) => (order.indexOf(b) - order.indexOf(a) + n) % n;
    if (shape === 'row') {
      out.push({ text: `${a} sits immediately left of ${b}.`, holds: o => o.indexOf(b) - o.indexOf(a) === 1 });
      out.push({ text: `${a} sits somewhere left of ${b}.`, holds: o => o.indexOf(a) < o.indexOf(b) });
      out.push({ text: `${a} and ${b} have one person between them.`, holds: o => Math.abs(o.indexOf(a) - o.indexOf(b)) === 2 });
    } else {
      out.push({ text: `${b} sits immediately clockwise from ${a}.`, holds: o => gap(o) === 1 });
      out.push({ text: `${a} and ${b} sit opposite each other.`, holds: o => gap(o) === n / 2 });
      out.push({ text: `Moving clockwise from ${a} to ${b}, there is one person between them.`, holds: o => gap(o) === 2 });
    }
  }
  if (shape === 'row') for (const a of people) {
    out.push({ text: `${a} sits at an end of the row.`, holds: o => o[0] === a || o[n - 1] === a });
  }
  return out;
}

export function generateSeating(seed: number, level: Level, shape?: SeatingShape): SeatingCase {
  const random = rng(seed);
  const chosenShape = shape ?? (seed % 2 ? 'circle' : 'row');
  const people = shuffle(NAMES, random).slice(0, chosenShape === 'row' ? 5 : 6);
  const candidates = seatingCandidates(people, chosenShape);
  const answer = candidates[Math.floor(random() * candidates.length)];
  const rules = chooseRules(candidates, answer, facts(people, chosenShape), random, level);
  return {
    type: 'seating', seed, level, shape: chosenShape,
    story: chosenShape === 'row'
      ? `At a campus quiz, ${people.join(', ')} sit in one row, all facing the stage. Who sits where from left to right?`
      : `At a reading-club table, ${people.join(', ')} sit in a circle, all facing the centre. Start at ${people[0]} and list the seats clockwise.`,
    people, clues: rules.map(r => r.text), answer: [...answer], rules,
    difficulty: { clues: rules.length, candidates: candidates.length },
  };
}
