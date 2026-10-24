import * as v from 'valibot';

const text = v.pipe(v.string(), v.minLength(1));
const strings = v.array(text);
const pair = v.tuple([text, text]);
const triple = v.tuple([text, text, text]);
const integer = v.pipe(v.number(), v.integer());
const semver = v.pipe(v.string(), v.regex(/^\d+\.\d+\.\d+$/));

const sourceRef = v.strictObject({ id: text, title: text, publisher: text, year: integer, url: v.pipe(v.string(), v.url()), asOf: v.optional(v.pipe(v.string(), v.isoDate())) });
const claim = v.strictObject({ id: text, text, sourceRefs: v.pipe(strings, v.minLength(1)) });
const option = v.strictObject({ id: text, text, feedback: text, correct: v.boolean(), misconceptionIds: v.optional(strings), sourceRefs: v.pipe(strings, v.minLength(1)) });
// Spec 16 R1: what a practice item asks the learner to do with the idea.
const practiceJob = v.picklist(['reverse', 'misconception', 'transfer', 'combine', 'edge', 'recall']);
const itemBase = { id: text, conceptId: text, step: v.optional(text), job: v.optional(practiceJob), stem: text, difficultySeed: v.union([v.picklist([1, 2, 3]), v.pipe(v.number(), v.minValue(400), v.maxValue(2400))]), misconceptionTags: strings, sourceRefs: v.pipe(strings, v.minLength(1)), options: v.pipe(v.array(option), v.minLength(2)) };
const choice = (type: 'predict' | 'choose' | 'scenario' | 'fill-the-step' | 'true-not-quite' | 'explain-it-back') => v.strictObject({ ...itemBase, type: v.literal(type) });
export const topicItemSchema = v.variant('type', [
  choice('predict'), choice('choose'), v.strictObject({ ...itemBase, type: v.literal('why'), task: v.optional(v.picklist(['reason', 'spot-the-flaw'])) }),
  choice('scenario'), choice('fill-the-step'), choice('true-not-quite'), choice('explain-it-back'),
  v.strictObject({ ...itemBase, type: v.literal('order'), answer: v.pipe(strings, v.minLength(2)) }),
  v.strictObject({ ...itemBase, type: v.literal('match'), answer: v.pipe(v.array(v.strictObject({ left: text, right: text })), v.minLength(2)) }),
  v.strictObject({ ...itemBase, type: v.literal('estimate'), answer: v.strictObject({ value: v.number(), min: v.number(), max: v.number(), unit: text }) }),
]);
// Spec 14: a step teaches one small idea before any question on it (hook guess, teach card, worked example, guided tries).
const lessonOption = v.strictObject({ id: text, text, correct: v.boolean(), feedback: text });
const lessonOptions = v.pipe(v.array(lessonOption), v.minLength(2), v.maxLength(3));
export const stepVisualSchema = v.variant('kind', [
  v.strictObject({ kind: v.literal('flow'), nodes: v.pipe(strings, v.minLength(2), v.maxLength(4)) }),
  v.strictObject({ kind: v.literal('compare'), left: v.strictObject({ title: text, lines: v.pipe(strings, v.minLength(1), v.maxLength(3)) }), right: v.strictObject({ title: text, lines: v.pipe(strings, v.minLength(1), v.maxLength(3)) }) }),
  v.strictObject({ kind: v.literal('scale'), label: text, min: text, max: text, marks: v.pipe(v.array(v.strictObject({ at: v.pipe(v.number(), v.minValue(0), v.maxValue(100)), text })), v.minLength(1), v.maxLength(3)) }),
]);
export const topicStepSchema = v.strictObject({
  id: text, title: text, claimId: text, sourceRefs: v.pipe(strings, v.minLength(1)),
  hook: v.strictObject({ stem: text, options: lessonOptions }),
  teach: text, visual: stepVisualSchema,
  // `ask` names exactly what to tap, since more than one part could fairly 'show the idea'.
  example: v.strictObject({ ask: v.pipe(text, v.maxLength(60)), parts: v.pipe(strings, v.minLength(2), v.maxLength(5)), spot: text, feedback: text }),
  guided: v.pipe(v.array(v.strictObject({ stem: text, hint: text, options: lessonOptions })), v.minLength(1), v.maxLength(3)),
  takeaway: text,
});
export const topicConceptSchema = v.strictObject({
  id: text, title: text, prerequisites: strings,
  hook: v.pipe(text, v.maxLength(280)), hookSourceRefs: v.pipe(strings, v.minLength(1)),
  // Spec 19 E: an editor-written question to send a friend after the lesson; answer-free (checked in validate.ts).
  askLine: v.optional(v.pipe(text, v.maxLength(140), v.endsWith('?'))),
  rule: v.pipe(text, v.maxLength(280)), ruleSourceRefs: v.pipe(strings, v.minLength(1)),
  claims: v.pipe(v.array(claim), v.minLength(1)),
  items: v.pipe(v.array(topicItemSchema), v.minLength(1)),
  steps: v.optional(v.pipe(v.array(topicStepSchema), v.minLength(2), v.maxLength(3))),
  misconceptions: v.array(v.strictObject({ id: text, name: text, correction: text, sourceRefs: v.pipe(strings, v.minLength(1)) })),
  sources: v.pipe(v.array(sourceRef), v.minLength(1)),
  quest: v.optional(v.strictObject({ title: text, detail: text, sourceRefs: v.pipe(strings, v.minLength(1)) })),
  factCheck: v.optional(v.strictObject({ checker: v.optional(text), verdicts: v.array(v.strictObject({ claimId: text, verdict: v.picklist(['supported', 'unsupported', 'outdated']) })) })),
});
export const topicBodySchema = v.strictObject({ topic: v.strictObject({ id: text, title: text, description: v.optional(text) }), modules: v.pipe(v.array(v.strictObject({ id: text, title: text, concepts: v.pipe(v.array(topicConceptSchema), v.minLength(1)) })), v.minLength(1)) });

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

export const winddownMoveSchema = v.strictObject({
  id: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/)),
  text: v.pipe(v.string(), v.minLength(1), v.maxLength(70), v.regex(/^[A-Za-z0-9 ,.'!?-]+$/)),
  minutes: v.pipe(integer, v.minValue(2), v.maxValue(15)),
  kind: v.picklist(['read', 'write', 'body', 'tidy', 'prepare', 'quiet']),
});
export const winddownBodySchema = v.strictObject({ moves: v.pipe(v.array(winddownMoveSchema), v.minLength(24), v.maxLength(24)) });

const trackQuestionSchema = v.strictObject({ q: text, options: v.tuple([text, text, text]), answer: v.pipe(integer, v.minValue(0), v.maxValue(2)), why: text });
export const trackUnitSchema = v.strictObject({
  id: text, title: text, minutes: v.pipe(integer, v.minValue(1), v.maxValue(15)),
  lookFor: v.tuple([text, text, text]), explanation: text,
  video: v.optional(v.strictObject({ url: v.pipe(v.string(), v.url()), startSeconds: v.pipe(integer, v.minValue(0)), title: text })),
  videoTodo: v.optional(text), check: v.tuple([trackQuestionSchema, trackQuestionSchema, trackQuestionSchema]),
  cards: v.tuple([v.tuple([text, text]), v.tuple([text, text]), v.tuple([text, text])]),
});
export const trackModuleSchema = v.strictObject({ id: text, title: text, units: v.pipe(v.array(trackUnitSchema), v.minLength(1)), apply: v.strictObject({ title: text, detail: text }) });
export const trackBodySchema = v.strictObject({ track: v.strictObject({ id: text, name: text, blurb: text }), modules: v.pipe(v.array(trackModuleSchema), v.minLength(1)), todoUnits: v.optional(v.array(v.strictObject({ title: text, note: text }))) });

const envelope = {
  id: v.pipe(v.string(), v.regex(/^[a-z0-9-]+\.[a-z0-9-]+$/)),
  version: semver, schema: v.pipe(integer, v.minValue(1)), minAppVersion: semver,
  title: text, description: v.optional(text), author: v.picklist(['claude', 'jenil', 'legacy', 'codex']),
  createdAt: v.pipe(v.string(), v.isoTimestamp()), changelog: v.optional(text),
};
export const packEnvelopeSchema = v.strictObject({
  ...envelope,
  kind: v.picklist(['lessons', 'deck', 'quests', 'winddown', 'track', 'puzzles', 'program', 'rules', 'mystery-arc', 'shop', 'topic']),
  body: v.unknown(),
});
export const lessonsPackSchema = v.strictObject({ ...envelope, kind: v.literal('lessons'), body: lessonsBodySchema });
export const deckPackSchema = v.strictObject({ ...envelope, kind: v.literal('deck'), body: deckBodySchema });
export const questsPackSchema = v.strictObject({ ...envelope, kind: v.literal('quests'), body: questsBodySchema });
export const winddownPackSchema = v.strictObject({ ...envelope, kind: v.literal('winddown'), body: winddownBodySchema });
export const trackPackSchema = v.strictObject({ ...envelope, kind: v.literal('track'), body: trackBodySchema });
export const topicPackSchema = v.strictObject({ ...envelope, kind: v.literal('topic'), body: topicBodySchema });
export const mysteryArcPackSchema = v.strictObject({ ...envelope, kind: v.literal('mystery-arc'), body: v.strictObject({
  arcIndex: v.pipe(integer, v.minValue(0), v.maxValue(3)),
  chapters: v.pipe(v.array(v.strictObject({ title: text, panels: v.tuple([text, text, text, text, text, text, text]), bonus: text })), v.minLength(4), v.maxLength(5)),
}) });
export const packSchema = v.variant('kind', [lessonsPackSchema, deckPackSchema, questsPackSchema, winddownPackSchema, trackPackSchema, topicPackSchema, mysteryArcPackSchema]);
export type Pack = v.InferOutput<typeof packSchema>;
export type WinddownMove = v.InferOutput<typeof winddownMoveSchema>;
export type Lesson = v.InferOutput<typeof lessonSchema>;
export type TrackPack = v.InferOutput<typeof trackPackSchema>;
export type TrackUnit = v.InferOutput<typeof trackUnitSchema>;
export type TopicPack = v.InferOutput<typeof topicPackSchema>;
export type TopicConcept = v.InferOutput<typeof topicConceptSchema>;
export type TopicItem = v.InferOutput<typeof topicItemSchema>;
export type TopicStep = v.InferOutput<typeof topicStepSchema>;
export type StepVisual = v.InferOutput<typeof stepVisualSchema>;
