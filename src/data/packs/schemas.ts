import * as v from 'valibot';

const text = v.pipe(v.string(), v.minLength(1));
const strings = v.array(text);
const pair = v.tuple([text, text]);
const triple = v.tuple([text, text, text]);
const integer = v.pipe(v.number(), v.integer());
const semver = v.pipe(v.string(), v.regex(/^\d+\.\d+\.\d+$/));

export const diagramSchema = v.variant('k', [
  v.strictObject({ k: v.literal('split'), l: text, ls: v.optional(text), r: text, rs: v.optional(text), hi: v.picklist(['l', 'r']) }),
  v.strictObject({ k: v.literal('chain'), steps: strings, hi: v.optional(integer) }),
  v.strictObject({ k: v.literal('three'), top: text, items: triple }),
  v.strictObject({ k: v.literal('thirds'), items: triple }),
  v.strictObject({ k: v.literal('stairs'), steps: v.array(pair), label: v.optional(text), desc: v.optional(v.boolean()) }),
  v.strictObject({ k: v.literal('meter'), zones: strings, hi: integer, label: v.optional(text) }),
  v.strictObject({ k: v.literal('ring'), center: text, outer: strings, shell: v.optional(text) }),
  v.strictObject({ k: v.literal('cycle'), nodes: v.tuple([text, text, text, text]), hi: v.optional(integer) }),
  v.strictObject({ k: v.literal('curves'), a: text, b: text }),
  v.strictObject({ k: v.literal('wave'), top: text, bot: text, line: text, cap: text }),
  v.strictObject({ k: v.literal('balance'), l: text, r: text, mid: text }),
]);

const quiz = { q: text, o: strings, a: integer };
export const lessonSchema = v.strictObject({
  id: text, t: text, bonus: v.optional(v.boolean()), scene: text, ...quiz,
  rv: text, pic: diagramSchema, term: v.strictObject({ w: text, g: text }),
  v: v.optional(v.array(v.strictObject({ ref: text, who: text, s: text, i: text, m: text, n: v.optional(text) }))),
  src: v.optional(v.strictObject({ ref: text, line: text, s: v.optional(text), n: v.optional(text) })),
  grade: v.optional(v.strictObject({ g: text, n: v.optional(text) })), sci: v.optional(text), par: v.optional(text),
  st: pair, rule: text,
  tr: v.strictObject({ s: text, ...quiz, w: text }),
  wy: v.strictObject({ ...quiz, f: text }),
  pl: v.strictObject({ i: strings, t: strings }), cards: v.array(pair), sl: text,
});

export const lessonsBodySchema = v.strictObject({
  course: v.strictObject({ id: text, name: text, short: text, tint: text, blurb: text, note: text }),
  lessons: v.array(lessonSchema),
});

const deckBase = { id: text, d: v.number() };
const answer = { opts: strings, a: integer, why: text };
export const deckItemSchema = v.variant('t', [
  v.strictObject({ ...deckBase, t: v.literal('scenario'), topic: text, scene: text, text, q: text, ...answer }),
  v.strictObject({ ...deckBase, t: v.literal('spot'), kind: v.picklist(['move', 'type']), topic: text, type: v.optional(text), avoid: v.optional(strings), who: text, sub: v.optional(text), msgs: v.array(v.tuple([v.picklist(['t', 'm', 'd']), text])), tell: integer, why: text }),
  v.strictObject({ ...deckBase, t: v.literal('mystery'), title: text, text, clues: strings, q: text, ...answer, hint: v.optional(text) }),
  v.strictObject({ ...deckBase, t: v.literal('teaser'), text, ...answer, hint: v.optional(text) }),
]);

export const deckBodySchema = v.strictObject({
  topics: v.record(v.string(), v.strictObject({ name: text, short: text, notes: v.optional(text) })),
  tactics: v.optional(v.record(v.string(), text)), types: v.optional(strings),
  cards: v.array(v.strictObject({ id: text, topic: text, order: integer, front: text, back: text })),
  items: v.array(deckItemSchema),
});

export const questDefinitionSchema = v.strictObject({
  id: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/)),
  category: v.picklist(['movement', 'social', 'learning', 'reading', 'creativity', 'money', 'mind', 'literature']),
  title: v.pipe(v.string(), v.minLength(3), v.maxLength(120)),
  kind: v.picklist(['once', 'total']),
  target: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10000)),
  unit: v.pipe(v.string(), v.maxLength(24)),
  step: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1000)),
});
export const questsBodySchema = v.strictObject({ quests: v.pipe(v.array(questDefinitionSchema), v.minLength(35)) });

const envelope = {
  id: v.pipe(v.string(), v.regex(/^[a-z0-9-]+\.[a-z0-9-]+$/)),
  version: semver, schema: v.pipe(integer, v.minValue(1)), minAppVersion: semver,
  title: text, description: v.optional(text), author: v.picklist(['claude', 'jenil', 'legacy']),
  createdAt: v.pipe(v.string(), v.isoTimestamp()), changelog: v.optional(text),
};
export const packEnvelopeSchema = v.strictObject({
  ...envelope,
  kind: v.picklist(['lessons', 'deck', 'quests', 'puzzles', 'program', 'rules', 'mystery-arc', 'shop']),
  body: v.unknown(),
});
export const lessonsPackSchema = v.strictObject({ ...envelope, kind: v.literal('lessons'), body: lessonsBodySchema });
export const deckPackSchema = v.strictObject({ ...envelope, kind: v.literal('deck'), body: deckBodySchema });
export const questsPackSchema = v.strictObject({ ...envelope, kind: v.literal('quests'), body: questsBodySchema });
export const packSchema = v.variant('kind', [lessonsPackSchema, deckPackSchema, questsPackSchema]);
export type Pack = v.InferOutput<typeof packSchema>;
export type Lesson = v.InferOutput<typeof lessonSchema>;
