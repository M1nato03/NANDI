import { chooseRules, permutations, rng, shuffle, type HintLadder, type Level, type Rule } from './common';

// Roles are a small blood-only tree. G is parent of P and S; P is parent
// of C; C is parent of D. Gender and partnerships are unspecified.
type Role = 'G' | 'P' | 'S' | 'C' | 'D';
type Assignment = Record<Role, string>;
const ROLES: Role[] = ['G', 'P', 'S', 'C', 'D'];
const EDGES: [Role, Role][] = [['G', 'P'], ['G', 'S'], ['P', 'C'], ['C', 'D']];
const NAMES = ['Kiran', 'Tashi', 'Noor', 'Arya', 'Sai', 'Harpreet', 'Iman', 'Nima', 'Kavi', 'Aman'];

export type FamilyCase = {
  type: 'family'; seed: number; level: Level; story: string; people: string[];
  clues: string[]; question: string; answer: string;
  difficulty: { clues: number; candidates: number };
  rules: Rule<Assignment>[];
};

export const familyHints: HintLadder = [
  'Draw only the blood links named in the clues. Leave gender unspecified.',
  'A parent link points down one generation; a grandparent link points down two.',
  'Place the named people in a small tree, then trace the question pair.',
];

export function familyCandidates(people: readonly string[]): Assignment[] {
  return permutations(people).map(p => Object.fromEntries(ROLES.map((role, i) => [role, p[i]])) as Assignment);
}

export function solveFamily(c: Pick<FamilyCase, 'people' | 'rules'>): Assignment[] {
  return familyCandidates(c.people).filter(a => c.rules.every(rule => rule.holds(a)));
}

function parent(a: Assignment, x: string, y: string): boolean {
  return EDGES.some(([p, c]) => a[p] === x && a[c] === y);
}

function ancestor(a: Assignment, x: string, y: string, steps: number): boolean {
  if (steps === 1) return parent(a, x, y);
  return Object.values(a).some(mid => parent(a, x, mid) && ancestor(a, mid, y, steps - 1));
}

function siblings(a: Assignment, x: string, y: string): boolean {
  return x !== y && Object.values(a).some(p => parent(a, p, x) && parent(a, p, y));
}

function facts(people: string[]): Rule<Assignment>[] {
  const out: Rule<Assignment>[] = [];
  for (const x of people) for (const y of people) if (x !== y) {
    out.push({ text: `${x} is a parent of ${y}.`, holds: a => parent(a, x, y) });
    out.push({ text: `${x} is a grandparent of ${y}.`, holds: a => ancestor(a, x, y, 2) });
    out.push({ text: `${x} and ${y} are siblings.`, holds: a => siblings(a, x, y) });
  }
  return out;
}

export function familyRelation(a: Assignment, x: string, y: string): string {
  for (let d = 1; d <= 3; d++) {
    if (ancestor(a, x, y, d)) return ['parent', 'grandparent', 'great-grandparent'][d - 1];
    if (ancestor(a, y, x, d)) return ['child', 'grandchild', 'great-grandchild'][d - 1];
  }
  if (siblings(a, x, y)) return 'sibling';
  if (a.S === x && a.C === y) return "parent's sibling";
  if (a.C === x && a.S === y) return "sibling's child";
  if (a.S === x && a.D === y) return "grandparent's sibling";
  if (a.D === x && a.S === y) return "sibling's grandchild";
  throw new Error('Unclassified blood relation');
}

export function generateFamily(seed: number, level: Level): FamilyCase {
  const random = rng(seed);
  const people = shuffle(NAMES, random).slice(0, 5);
  const candidates = familyCandidates(people);
  const hidden = candidates[Math.floor(random() * candidates.length)];
  const rules = chooseRules(candidates, hidden, facts(people), random, level);
  const pairs = shuffle(people.flatMap(x => people.filter(y => x !== y).map(y => [x, y] as const)), random);
  const pair = pairs.find(([x, y]) => rules.every(rule =>
    new Set(candidates.filter(rule.holds).map(a => familyRelation(a, x, y))).size > 1));
  if (!pair) throw new Error('No question survives the one-clue check');
  return {
    type: 'family', seed, level,
    story: `At a family gathering, ${people.join(', ')} compare their family tree. All clues are blood relations; no gender is specified.`,
    people, clues: rules.map(r => r.text), question: `How is ${pair[0]} related to ${pair[1]}?`,
    answer: familyRelation(hidden, pair[0], pair[1]), rules,
    difficulty: { clues: rules.length, candidates: candidates.length },
  };
}
