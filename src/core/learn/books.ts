import type { TopicConcept, TopicModule, TopicPack, TopicStep } from '../../data/packs/schemas';

/**
 * Spec 33: books. A book is a topic pack with a `book` block; its modules are chapters. A chapter is read in one
 * sitting: every untaught step of its ideas, then one check, then a `chapter:<bookId>:<moduleId>` fact marks it done.
 */
export type ChapterState = 'not-started' | 'in-progress' | 'done' | 'due';
export type Shelf = 'originals' | 'classics' | 'private' | 'finished';

/** Each Original was one unit before it became a book; its unit chest keeps that id, so no chest is paid twice. */
const LEGACY_UNITS: Record<string, string> = {
  psychology: 'psychology-module', 'money-markets': 'money-markets-module', 'how-things-work': 'how-things-work-module',
  'history-civilisations': 'history-civilisations-module', 'health-nutrition': 'health-nutrition-module', 'body-training': 'body-training-module',
};
export const bookId = (pack: TopicPack) => pack.body.topic.id;
export const bookUnitId = (pack: TopicPack) => LEGACY_UNITS[bookId(pack)] ?? `book:${bookId(pack)}`;
export const bookConcepts = (pack: TopicPack): TopicConcept[] => pack.body.modules.flatMap(module => module.concepts);
export const bookTitle = (pack: TopicPack) => pack.body.book?.title ?? pack.body.topic.title;
export const chapterFactId = (topicId: string, moduleId: string) => `chapter:${topicId}:${moduleId}`;
export const chapterRef = (topicId: string, moduleId: string) => `${topicId}:${moduleId}`;
export const bookMinutes = (pack: TopicPack) => pack.body.modules.reduce((sum, module) => sum + (module.minutes ?? 0), 0);

/** The chapter's steps in reading order: idea by idea, each idea's steps in order. */
export function chapterSteps(module: TopicModule): { concept: TopicConcept; step: TopicStep }[] {
  return module.concepts.flatMap(concept => (concept.steps ?? []).map(step => ({ concept, step })));
}
export function untaughtSteps(module: TopicModule, taught: ReadonlySet<string>) {
  return chapterSteps(module).filter(entry => !taught.has(entry.step.id));
}

export function chapterState(input: { topicId: string; module: TopicModule; taught: ReadonlySet<string>; done: ReadonlySet<string>; due: (conceptId: string) => boolean }): ChapterState {
  const { topicId, module, taught, done, due } = input;
  if (done.has(chapterRef(topicId, module.id))) return module.concepts.some(concept => due(concept.id)) ? 'due' : 'done';
  return chapterSteps(module).some(entry => taught.has(entry.step.id)) ? 'in-progress' : 'not-started';
}

export function nextChapter(pack: TopicPack, done: ReadonlySet<string>): TopicModule | undefined {
  return pack.body.modules.find(module => !done.has(chapterRef(bookId(pack), module.id)));
}
export const bookDone = (pack: TopicPack, done: ReadonlySet<string>) => !nextChapter(pack, done);

/**
 * The book Continue offers: the unfinished book read most recently (its latest taught step or finished chapter),
 * else the first unfinished book in library order.
 */
export function currentBook(packs: readonly TopicPack[], input: { done: ReadonlySet<string>; lastTouched: ReadonlyMap<string, number> }): TopicPack | undefined {
  const open = packs.filter(pack => !bookDone(pack, input.done));
  const touched = open.filter(pack => (input.lastTouched.get(bookId(pack)) ?? 0) > 0)
    .sort((a, b) => (input.lastTouched.get(bookId(b)) ?? 0) - (input.lastTouched.get(bookId(a)) ?? 0));
  return touched[0] ?? open[0];
}

/** Library shelves, in the spec's order; a finished book moves to Finished. Empty shelves are left out. */
export function libraryShelves(packs: readonly TopicPack[], done: ReadonlySet<string>): { shelf: Shelf; title: string; books: TopicPack[] }[] {
  const finished = packs.filter(pack => bookDone(pack, done));
  const open = packs.filter(pack => !finished.includes(pack));
  const rights = (pack: TopicPack) => pack.body.book?.rights ?? 'original';
  return ([
    ['originals', 'NANDI Originals', open.filter(pack => rights(pack) === 'original')],
    ['classics', 'Classics', open.filter(pack => rights(pack) === 'public-domain' || rights(pack) === 'licensed')],
    ['private', 'Private', open.filter(pack => rights(pack) === 'private')],
    ['finished', 'Finished', finished],
  ] as const).filter(([, , books]) => books.length > 0).map(([shelf, title, books]) => ({ shelf, title, books: [...books] }));
}

/** The chapter's one-line takeaway for the done card: its recall idea's takeaway if it has one, else its last step's. */
export function chapterTakeaway(module: TopicModule): string {
  const steps = chapterSteps(module);
  const recall = module.concepts.find(concept => concept.recall && concept.steps?.length);
  return recall?.steps?.at(-1)?.takeaway ?? steps.at(-1)?.step.takeaway ?? module.title;
}

const hash = (value: string) => { let h = 2166136261; for (const char of value) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return h >>> 0; };
/**
 * Spec 33 §3: a quiz check is three of the chapter's items, mixed: one from each idea in turn (the seed picks which),
 * so no two in a row share an idea when the chapter has three ideas or more.
 */
export function checkPicks(module: TopicModule, seed: string, count = 3): { concept: TopicConcept; item: TopicConcept['items'][number] }[] {
  const pools = module.concepts.map(concept => ({ concept, items: [...concept.items].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`) || a.id.localeCompare(b.id)) }));
  const order = [...pools].sort((a, b) => hash(`${seed}:${a.concept.id}`) - hash(`${seed}:${b.concept.id}`) || a.concept.id.localeCompare(b.concept.id));
  const picks: { concept: TopicConcept; item: TopicConcept['items'][number] }[] = [];
  for (let round = 0; picks.length < count && order.some(pool => pool.items.length > round); round++)
    for (const pool of order) if (picks.length < count && pool.items[round]) picks.push({ concept: pool.concept, item: pool.items[round]! });
  return picks;
}
