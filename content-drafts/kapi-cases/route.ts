import { chooseRules, rng, type HintLadder, type Level, type Rule } from './common';

type Turn = 'left' | 'right';
type Route = { start: number; lengths: [number, number, number]; turns: [Turn, Turn] };
const DIR = ['north', 'east', 'south', 'west'] as const;
const STEP = [[0, 1], [1, 0], [0, -1], [-1, 0]] as const;

export type RouteCase = {
  type: 'route'; seed: number; level: Level; story: string; clues: string[];
  answer: { east: number; north: number; facing: string };
  difficulty: { clues: number; candidates: number };
  rules: Rule<Route>[];
};

export const routeHints: HintLadder = [
  'Mark the start as (0, 0), with north at the top.',
  'Keep track of the direction faced after each turn, then draw each leg.',
  'Add east-west movement separately from north-south movement.',
];

function facing(route: Route, leg: number): number {
  let d = route.start;
  for (let i = 0; i < leg; i++) d = (d + (route.turns[i] === 'right' ? 1 : 3)) % 4;
  return d;
}

export function routeEndpoint(route: Route): { east: number; north: number; facing: string } {
  let east = 0, north = 0;
  for (let leg = 0; leg < 3; leg++) {
    const [dx, dy] = STEP[facing(route, leg)];
    east += dx * route.lengths[leg]; north += dy * route.lengths[leg];
  }
  return { east, north, facing: DIR[facing(route, 2)] };
}

export function routeCandidates(level: Level): Route[] {
  const max = level === 'easy' ? 2 : level === 'medium' ? 3 : 4;
  const out: Route[] = [];
  for (let start = 0; start < 4; start++)
    for (let a = 1; a <= max; a++) for (let b = 1; b <= max; b++) for (let c = 1; c <= max; c++)
      for (const t1 of ['left', 'right'] as const) for (const t2 of ['left', 'right'] as const)
        out.push({ start, lengths: [a, b, c], turns: [t1, t2] });
  return out;
}

export function solveRoute(c: Pick<RouteCase, 'level' | 'rules'>): Route[] {
  return routeCandidates(c.level).filter(r => c.rules.every(rule => rule.holds(r)));
}

function facts(max: number): Rule<Route>[] {
  const out: Rule<Route>[] = [];
  for (let d = 0; d < 4; d++) {
    out.push({ text: `The first leg heads ${DIR[d]}.`, holds: r => r.start === d });
    out.push({ text: `After the first turn, Kapi faces ${DIR[d]}.`, holds: r => facing(r, 1) === d });
    out.push({ text: `The last leg heads ${DIR[d]}.`, holds: r => facing(r, 2) === d });
  }
  for (let leg = 0; leg < 3; leg++) for (let length = 1; length <= max; length++) {
    out.push({ text: `Leg ${leg + 1} is ${length} block${length === 1 ? '' : 's'} long.`, holds: r => r.lengths[leg] === length });
  }
  for (let turn = 0; turn < 2; turn++) for (const way of ['left', 'right'] as const) {
    out.push({ text: `Turn ${turn + 1} is a ${way} turn.`, holds: r => r.turns[turn] === way });
  }
  for (let total = 3; total <= max * 3; total++) {
    out.push({ text: `The whole walk covers ${total} blocks.`, holds: r => r.lengths.reduce((a, b) => a + b, 0) === total });
  }
  return out;
}

export function generateRoute(seed: number, level: Level): RouteCase {
  const random = rng(seed);
  const candidates = routeCandidates(level);
  const hidden = candidates[Math.floor(random() * candidates.length)];
  const max = level === 'easy' ? 2 : level === 'medium' ? 3 : 4;
  const rules = chooseRules(candidates, hidden, facts(max), random, level);
  return {
    type: 'route', seed, level,
    story: 'Kapi walks three straight legs on a square street grid, turning after legs 1 and 2. Start at (0, 0). Where does Kapi finish, and which way is Kapi facing?',
    clues: rules.map(r => r.text), answer: routeEndpoint(hidden), rules,
    difficulty: { clues: rules.length, candidates: candidates.length },
  };
}
