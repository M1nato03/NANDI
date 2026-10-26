import { describe, expect, it } from 'vitest';
import { fixtureTopic } from '../../core/learn/engine/fixtures/topic';
import { validatePack } from './validate';
import type { TopicPack } from './schemas';

// Spec 33: every topic pack is a book, and the validator holds the book rules.
const book = (patch: Partial<NonNullable<TopicPack['body']['book']>>, modules = fixtureTopic.body.modules): TopicPack =>
  ({ ...fixtureTopic, body: { ...fixtureTopic.body, book: { ...fixtureTopic.body.book!, ...patch }, modules } });
const errors = (pack: unknown) => validatePack(pack).join(' | ');

describe('spec 33 book rules', () => {
  it('the fixture book passes, and a topic pack with no book block fails', () => {
    expect(validatePack(fixtureTopic)).toEqual([]);
    expect(errors({ ...fixtureTopic, body: { ...fixtureTopic.body, book: undefined } })).toMatch(/needs a book block/);
  });
  it('a book may say so in its id (book.how-to-win-friends), and nothing else may', () => {
    expect(validatePack({ ...fixtureTopic, id: 'book.seed-lab' })).toEqual([]);
    expect(errors({ ...fixtureTopic, id: 'deck.seed-lab' })).toMatch(/id must match kind/);
  });
  it('a public-domain book needs its edition and an author who died more than 60 years ago', () => {
    expect(errors(book({ rights: 'public-domain' }))).toMatch(/needs its edition[\s\S]*needs authorDied/);
    expect(validatePack(book({ rights: 'public-domain', edition: '1936 original text', authorDied: 1955, region: 'IN' }))).toEqual([]);
    expect(errors(book({ rights: 'public-domain', edition: '1950 text', authorDied: 1970 }))).toMatch(/not 60 years past/);
  });
  it("an author's own claim must cite the book itself", () => {
    const [growth] = fixtureTopic.body.modules;
    const authored = (sourceTitle: string) => [{ ...growth!, concepts: growth!.concepts.map((concept, index) => index ? concept : {
      ...concept, claims: [{ ...concept.claims[0]!, voice: 'author' as const }], sources: [{ ...concept.sources[0]!, title: sourceTitle }] }) }];
    expect(errors(book({}, authored('Garden Lab notes')))).toMatch(/author claim needs the book itself/);
    expect(validatePack(book({}, authored('Seed Lab, chapter 1')))).toEqual([]);
  });
  it('every chapter has minutes and a check it can run', () => {
    const [growth] = fixtureTopic.body.modules;
    expect(errors(book({}, [{ ...growth!, minutes: undefined, check: undefined }]))).toMatch(/needs minutes[\s\S]*needs a check/);
    expect(errors(book({}, [{ ...growth!, check: 'recall' }]))).toMatch(/recall check needs an idea with recall pieces/);
    expect(errors(book({}, [{ ...growth!, check: 'chiku' }]))).toMatch(/chiku check needs an idea with a Chiku scene/);
  });
});
