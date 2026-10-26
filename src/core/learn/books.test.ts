import { describe, expect, it } from 'vitest';
import { fixtureTopic } from './engine/fixtures/topic';
import type { TopicPack } from '../../data/packs/schemas';
import { bookDone, bookUnitId, chapterRef, chapterState, checkPicks, currentBook, libraryShelves, nextChapter, untaughtSteps } from './books';

// Spec 33: a two-chapter book from the fixture's two ideas, each with two steps.
const step = (id: string) => ({ id, title: id, claimId: 'c1', sourceRefs: ['s1'], hook: { stem: 'Guess?', options: [{ id: 'a', text: 'A', correct: true, feedback: 'Yes.' }, { id: 'b', text: 'B', correct: false, feedback: 'No.' }] },
  teach: 'Seeds need water.', visual: { kind: 'flow' as const, nodes: ['Dry', 'Wet'] }, example: { ask: 'Tap it', parts: ['a', 'b'], spot: 'a', feedback: 'Yes.' },
  guided: [{ stem: 'Which?', hint: 'Water.', options: [{ id: 'a', text: 'A', correct: true, feedback: 'Yes.' }, { id: 'b', text: 'B', correct: false, feedback: 'No.' }] }], takeaway: `Takeaway ${id}.` });
const [seed, sprout] = fixtureTopic.body.modules[0]!.concepts;
const make = (topicId: string, rights: 'original' | 'public-domain' | 'private' = 'original'): TopicPack => ({ ...fixtureTopic, id: `topic.${topicId}`,
  body: { topic: { id: topicId, title: topicId }, book: { ...fixtureTopic.body.book!, title: `Book ${topicId}`, rights },
    modules: [{ id: `${topicId}-ch1`, title: 'One', minutes: 3, check: 'quiz', concepts: [{ ...seed!, steps: [step('s1a'), step('s1b')] }] },
      { id: `${topicId}-ch2`, title: 'Two', minutes: 3, check: 'quiz', concepts: [{ ...sprout!, steps: [step('s2a'), step('s2b')] }] }] } });
const lab = make('seed-lab');

describe('spec 33 books', () => {
  it('a chapter is its untaught steps, idea by idea, in order', () => {
    expect(untaughtSteps(lab.body.modules[0]!, new Set()).map(entry => entry.step.id)).toEqual(['s1a', 's1b']);
    expect(untaughtSteps(lab.body.modules[0]!, new Set(['s1a'])).map(entry => entry.step.id)).toEqual(['s1b']);
  });
  it('chapter states: not started, in progress, done, and due for review once done', () => {
    const state = (taught: string[], done: string[], due = false) => chapterState({ topicId: 'seed-lab', module: lab.body.modules[0]!, taught: new Set(taught), done: new Set(done), due: () => due });
    expect(state([], [])).toBe('not-started');
    expect(state(['s1a'], [])).toBe('in-progress');
    expect(state(['s1a', 's1b'], [chapterRef('seed-lab', 'seed-lab-ch1')])).toBe('done');
    expect(state(['s1a', 's1b'], [chapterRef('seed-lab', 'seed-lab-ch1')], true)).toBe('due');
  });
  it('the next chapter, and a book done when every chapter is', () => {
    expect(nextChapter(lab, new Set())?.id).toBe('seed-lab-ch1');
    expect(nextChapter(lab, new Set([chapterRef('seed-lab', 'seed-lab-ch1')]))?.id).toBe('seed-lab-ch2');
    expect(bookDone(lab, new Set([chapterRef('seed-lab', 'seed-lab-ch1'), chapterRef('seed-lab', 'seed-lab-ch2')]))).toBe(true);
  });
  it('Continue offers the unfinished book read most recently, else the first unfinished one', () => {
    const other = make('river');
    expect(currentBook([lab, other], { done: new Set(), lastTouched: new Map() })).toBe(lab);
    expect(currentBook([lab, other], { done: new Set(), lastTouched: new Map([['seed-lab', 10], ['river', 20]]) })).toBe(other);
    const labDone = new Set([chapterRef('seed-lab', 'seed-lab-ch1'), chapterRef('seed-lab', 'seed-lab-ch2')]);
    expect(currentBook([lab, other], { done: labDone, lastTouched: new Map([['seed-lab', 30]]) })).toBe(other);
  });
  it('shelves: Originals, Classics, Private, Finished, leaving out empty ones', () => {
    const classic = make('classic', 'public-domain'), mine = make('mine', 'private');
    expect(libraryShelves([lab, mine], new Set()).map(shelf => shelf.shelf)).toEqual(['originals', 'private']);
    const done = new Set([chapterRef('seed-lab', 'seed-lab-ch1'), chapterRef('seed-lab', 'seed-lab-ch2')]);
    expect(libraryShelves([lab, classic], done).map(shelf => [shelf.shelf, shelf.books.map(book => book.body.topic.id)])).toEqual([['classics', ['classic']], ['finished', ['seed-lab']]]);
  });
  it("an Original's chest keeps the id its unit had; a new book's chest is its own", () => {
    expect(bookUnitId({ ...lab, body: { ...lab.body, topic: { id: 'psychology', title: 'p' } } })).toBe('psychology-module');
    expect(bookUnitId(lab)).toBe('book:seed-lab');
  });
  it('a quiz check is three items, one idea at a time, the same for the same seed', () => {
    const both: TopicPack['body']['modules'][number] = { ...lab.body.modules[0]!, concepts: [lab.body.modules[0]!.concepts[0]!, lab.body.modules[1]!.concepts[0]!] };
    const picks = checkPicks(both, 'x');
    expect(picks).toHaveLength(3);
    expect(picks[0]!.concept.id).not.toBe(picks[1]!.concept.id);
    expect(checkPicks(both, 'x').map(pick => pick.item.id)).toEqual(picks.map(pick => pick.item.id));
  });
});
