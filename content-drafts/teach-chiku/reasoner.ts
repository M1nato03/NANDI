// Teach Chiku: a tiny pure reasoner over a learner's cause map.
// Draft only (cloud job batch 8, job 2). Not wired into the app.
//
// Chiku answers only by following links in the map. No hidden knowledge,
// no randomness. Same map + same question = same answer and the same trace.

export type Relation = 'sets-off' | 'more-likely' | 'less-likely' | 'example-of';

export interface Support {
  claimId: string;
  /** Exact words copied from the claim text (checked by the tests). */
  quote: string;
}

export interface MapNode {
  id: string;
  label: string;
}

export interface MapLink {
  id: string;
  from: string;
  to: string;
  relation: Relation;
  support: Support[];
}

export interface WrongMap {
  /** The misconception id this wrong map comes from. */
  misconceptionId: string;
  kind: 'extra-link' | 'missing-link' | 'swapped-link';
  /** Tempting wrong links the learner might draw. */
  add: MapLink[];
  /** Correct link ids the learner leaves out (or replaces). */
  remove: string[];
  /** Claims that show the wrong map is wrong. */
  refutedBy: Support[];
}

export type Query =
  | { kind: 'effect'; from: string; change: 'up' | 'down'; to: string }
  | { kind: 'causes'; to: string };

export type Verdict = 'more' | 'less' | 'no-change' | 'unsure';

export type Answer =
  | { kind: 'effect'; verdict: Verdict; paths: string[][] }
  | { kind: 'causes'; nodes: string[] };

export interface Question {
  id: string;
  ask: string;
  query: Query;
  support: Support[];
  /** Key "correct" or a misconception id from wrongMaps. */
  expect: Record<string, Answer>;
}

export interface TeachMap {
  conceptId: string;
  nodes: MapNode[];
  links: MapLink[];
  wrongMaps: WrongMap[];
  questions: Question[];
}

export interface Pack {
  schema: 'concept.teach.map';
  version: number;
  topicId: string;
  source?: string;
  status?: string;
  maps: TeachMap[];
}

/** The link list Chiku sees for the correct map or one wrong map. */
export function linksFor(map: TeachMap, variant: string): MapLink[] {
  if (variant === 'correct') return map.links;
  const wrong = map.wrongMaps.find((w) => w.misconceptionId === variant);
  if (!wrong) throw new Error(`no wrong map ${variant} in ${map.conceptId}`);
  return [...map.links.filter((l) => !wrong.remove.includes(l.id)), ...wrong.add];
}

const SIGN: Record<Relation, 1 | -1> = {
  'sets-off': 1,
  'more-likely': 1,
  'less-likely': -1,
  // "A is an example of B": A inherits what B does, so the walk goes A -> B unchanged.
  'example-of': 1,
};

/** Every simple path of links from `from` to `to`, in a stable order. */
export function paths(links: MapLink[], from: string, to: string): MapLink[][] {
  const out: MapLink[][] = [];
  const walk = (at: string, seen: Set<string>, trail: MapLink[]) => {
    if (at === to && trail.length > 0) {
      out.push(trail);
      return;
    }
    for (const l of links) {
      if (l.from !== at || seen.has(l.to)) continue;
      walk(l.to, new Set([...seen, l.to]), [...trail, l]);
    }
  };
  walk(from, new Set([from]), []);
  return out;
}

export function effect(links: MapLink[], from: string, change: 'up' | 'down', to: string) {
  const found = paths(links, from, to);
  const dir = change === 'up' ? 1 : -1;
  const signs = new Set(found.map((p) => p.reduce((s, l) => s * SIGN[l.relation], dir)));
  let verdict: Verdict;
  if (signs.size === 0) verdict = 'no-change';
  else if (signs.size > 1) verdict = 'unsure';
  else verdict = signs.has(1) ? 'more' : 'less';
  return { verdict, paths: found.map((p) => p.map((l) => l.id)) };
}

export function answer(map: TeachMap, variant: string, q: Query): Answer {
  const links = linksFor(map, variant);
  if (q.kind === 'effect') {
    return { kind: 'effect', ...effect(links, q.from, q.change, q.to) };
  }
  const nodes = map.nodes
    .map((n) => n.id)
    .filter((id) => id !== q.to && effect(links, id, 'up', q.to).verdict === 'more');
  return { kind: 'causes', nodes };
}

const PHRASE: Record<Relation, string> = {
  'sets-off': 'sets off',
  'more-likely': 'makes more likely',
  'less-likely': 'makes less likely',
  'example-of': 'is an example of',
};

/** What Chiku says, in plain words, with the trace that led there. */
export function say(map: TeachMap, variant: string, q: Query): string {
  const label = (id: string) => map.nodes.find((n) => n.id === id)?.label ?? id;
  const links = linksFor(map, variant);
  const byId = (id: string) => links.find((l) => l.id === id)!;
  const a = answer(map, variant, q);
  if (a.kind === 'causes') {
    if (a.nodes.length === 0) return `Nothing in my map leads to "${label(q.to)}".`;
    return `From my map: ${a.nodes.map((n) => `"${label(n)}"`).join(', ')}.`;
  }
  if (q.kind !== 'effect') throw new Error('unreachable');
  const head = {
    more: 'More likely.',
    less: 'Less likely.',
    'no-change': 'No change.',
    unsure: 'I cannot tell: my links disagree.',
  }[a.verdict];
  if (a.paths.length === 0) {
    return `${head} My map has no path from "${label(q.from)}" to "${label(q.to)}".`;
  }
  const trail = a.paths
    .map((p) =>
      p
        .map((id) => {
          const l = byId(id);
          return `"${label(l.from)}" ${PHRASE[l.relation]} "${label(l.to)}"`;
        })
        .join(', then '),
    )
    .join('; and ');
  return `${head} Because ${trail}.`;
}

// ---------- Pack checks (structure only; content checks live in the test) ----------

export function checkPack(pack: Pack): string[] {
  const errs: string[] = [];
  if (pack.schema !== 'concept.teach.map') errs.push('schema must be concept.teach.map');
  for (const m of pack.maps) {
    const at = m.conceptId;
    const ids = new Set(m.nodes.map((n) => n.id));
    if (ids.size !== m.nodes.length) errs.push(`${at}: duplicate node id`);
    if (m.nodes.length < 3 || m.nodes.length > 6) errs.push(`${at}: needs 3-6 nodes`);
    if (m.wrongMaps.length < 1 || m.wrongMaps.length > 2) errs.push(`${at}: needs 1-2 wrong maps`);
    if (m.questions.length !== 2) errs.push(`${at}: needs exactly 2 questions`);
    const all = [...m.links, ...m.wrongMaps.flatMap((w) => w.add)];
    const linkIds = new Set<string>();
    for (const l of all) {
      if (linkIds.has(l.id)) errs.push(`${at}: duplicate link id ${l.id}`);
      linkIds.add(l.id);
      if (!ids.has(l.from) || !ids.has(l.to)) errs.push(`${at}: link ${l.id} has an unknown node`);
      if (l.from === l.to) errs.push(`${at}: link ${l.id} loops on itself`);
    }
    for (const l of m.links) if (l.support.length === 0) errs.push(`${at}: link ${l.id} has no claim`);
    for (const w of m.wrongMaps) {
      if (w.add.length + w.remove.length === 0) errs.push(`${at}: ${w.misconceptionId} changes nothing`);
      for (const r of w.remove)
        if (!m.links.some((l) => l.id === r)) errs.push(`${at}: ${w.misconceptionId} removes unknown ${r}`);
      if (w.refutedBy.length === 0) errs.push(`${at}: ${w.misconceptionId} has no refuting claim`);
    }
    for (const q of m.questions) {
      const variants = ['correct', ...m.wrongMaps.map((w) => w.misconceptionId)];
      for (const v of variants) if (!q.expect[v]) errs.push(`${at}/${q.id}: missing answer for ${v}`);
      const nodesInQ = q.query.kind === 'effect' ? [q.query.from, q.query.to] : [q.query.to];
      for (const n of nodesInQ) if (!ids.has(n)) errs.push(`${at}/${q.id}: unknown node ${n}`);
    }
  }
  return errs;
}
