import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateAll } from './validate-packs';

// Spec 51: within one pack, ideas must not share recall pieces, a first step (title AND takeaway), a recall decoy, or
// the Chiku game's card, question and guess lines. Run through validateAll in editorial mode, as `npm run packs` does.
type Concept = { id: string; recall: { pieces: string[]; decoys: { text: string }[] }; steps: { title: string; takeaway: string }[]; chiku: { cards: { text: string }[]; newDay: { question: string }; guesses: { why: string }[] } };
const read = (name: string) => JSON.parse(readFileSync(join('content', 'topics', name), 'utf8')) as { body: { modules: { concepts: Concept[] }[] } };
const conceptsOf = (pack: ReturnType<typeof read>) => pack.body.modules.flatMap(module => module.concepts);

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
async function errorsFor(change: (a: Concept, b: Concept) => void, other?: (pack: ReturnType<typeof read>, htwf: ReturnType<typeof read>) => void) {
  const pack = read('book.how-to-win-friends.json');
  const [a, b] = conceptsOf(pack) as [Concept, Concept];
  change(a, b);
  const dir = mkdtempSync(join(tmpdir(), 'packs-51-'));
  dirs.push(dir);
  const path = join(dir, 'htwf.json');
  writeFileSync(path, JSON.stringify(pack));
  if (other) {
    const second = read('book.how-to-stop-worrying.json');
    other(second, pack);
    writeFileSync(join(dir, 'worrying.json'), JSON.stringify(second));
    writeFileSync(path, JSON.stringify(pack));
  }
  return { errors: await validateAll(dir), path, a: a.id, b: b.id };
}

describe('spec 51: one pack cannot repeat a template across ideas', () => {
  it('the shipped packs pass', async () => {
    expect((await errorsFor(() => undefined)).errors).toEqual([]);
  });
  it('fails when two ideas share all three recall pieces', async () => {
    const { errors, path, a, b } = await errorsFor((a, b) => { b.recall.pieces = [...a.recall.pieces]; });
    expect(errors).toContain(`${path}: duplicate recall pieces shared by ${a} and ${b}`);
  });
  it('fails on a shared first-step title AND takeaway, but not on only one of them', async () => {
    const both = await errorsFor((a, b) => { b.steps[0]!.title = a.steps[0]!.title; b.steps[0]!.takeaway = a.steps[0]!.takeaway; });
    expect(both.errors).toContain(`${both.path}: duplicate first-step title and takeaway shared by ${both.a} and ${both.b}`);
    const title = await errorsFor((a, b) => { b.steps[0]!.title = a.steps[0]!.title; });
    expect(title.errors.filter(error => error.includes('duplicate first-step'))).toEqual([]);
    const takeaway = await errorsFor((a, b) => { b.steps[0]!.takeaway = a.steps[0]!.takeaway; });
    expect(takeaway.errors.filter(error => error.includes('duplicate first-step'))).toEqual([]);
  });
  it('fails on a shared decoy, Chiku card, Chiku question or Chiku guess, naming both ideas and the text', async () => {
    const decoy = await errorsFor((a, b) => { b.recall.decoys[1]!.text = a.recall.decoys[0]!.text; });
    expect(decoy.errors).toContain(`${decoy.path}: duplicate recall decoy text shared by ${decoy.a} and ${decoy.b}: ${conceptsOf(read('book.how-to-win-friends.json'))[0]!.recall.decoys[0]!.text}`);
    const card = await errorsFor((a, b) => { b.chiku.cards[2]!.text = a.chiku.cards[2]!.text; });
    expect(card.errors.some(error => error.startsWith(`${card.path}: duplicate Chiku card shared by ${card.a} and ${card.b}: `))).toBe(true);
    const question = await errorsFor((a, b) => { b.chiku.newDay.question = a.chiku.newDay.question; });
    expect(question.errors.some(error => error.startsWith(`${question.path}: duplicate Chiku question shared by ${question.a} and ${question.b}: `))).toBe(true);
    const why = await errorsFor((a, b) => { b.chiku.guesses[2]!.why = a.chiku.guesses[2]!.why; });
    expect(why.errors.some(error => error.startsWith(`${why.path}: duplicate Chiku guess why shared by ${why.a} and ${why.b}: `))).toBe(true);
  });
  it('a repeat inside one idea, or across two packs, is fine', async () => {
    const inside = await errorsFor((a) => { a.recall.decoys[1]!.text = a.recall.decoys[0]!.text; });
    expect(inside.errors.filter(error => error.includes('duplicate'))).toEqual([]);
    const across = await errorsFor(() => undefined, (worrying, htwf) => { conceptsOf(worrying)[0]!.recall.decoys[0]!.text = conceptsOf(htwf)[0]!.recall.decoys[0]!.text; });
    expect(across.errors.filter(error => error.includes('duplicate'))).toEqual([]);
  });
});
