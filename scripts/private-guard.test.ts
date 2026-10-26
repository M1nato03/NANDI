import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { findPrivatePacks } from './private-guard';

// Spec 33 §7: no private or licensed book may ever be in the repo (or the app build made from it).
describe('private book guard', () => {
  it('finds no private or licensed book anywhere in the repo', () => {
    expect(findPrivatePacks(process.cwd())).toEqual([]);
  });

  // The self-test: a fixture placed under a content/ folder makes the guard fail, then the fixture is removed.
  // It runs in a scratch copy of the layout, so no other test can pick the fixture up from the real content/.
  const root = mkdtempSync(join(tmpdir(), 'nandi-guard-'));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  it('catches a private pack, a licensed pack and the private marker under content/', () => {
    mkdirSync(join(root, 'content', 'topics'), { recursive: true });
    const book = (rights: string) => JSON.stringify({ id: 'topic.x', kind: 'topic', body: { book: { title: 'X', rights } } });
    writeFileSync(join(root, 'content', 'topics', 'mine.json'), book('private'));
    writeFileSync(join(root, 'content', 'topics', 'bought.json'), book('licensed'));
    writeFileSync(join(root, 'content', 'notes.json'), '{ "nandiPrivate": true }');
    writeFileSync(join(root, 'content', 'topics', 'free.json'), book('public-domain'));
    expect(findPrivatePacks(root).sort()).toEqual(['content/notes.json', 'content/topics/bought.json', 'content/topics/mine.json']);
    rmSync(join(root, 'content'), { recursive: true, force: true });
    expect(findPrivatePacks(root)).toEqual([]);
  });
});
