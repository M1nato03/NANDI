import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { validatePack } from '../src/data/packs/validate';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const createdAt = '2026-10-07T00:00:00.000Z';

async function evaluate(files: string[], expression: string): Promise<unknown> {
  const source = (await Promise.all(files.map((file) => readFile(resolve(root, 'legacy/src', file), 'utf8')))).join('\n');
  return runInNewContext(`${source}\n;(${expression})`, Object.create(null), { timeout: 5000 });
}

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type LegacyCourse = { id: string; name: string; short: string; cls: string; blurb: string; note: string; lessons: unknown[] };
type LegacyDeck = { LAWS: Record<string, { name: string; short: string }>; TACTICS: Record<string, string>; TYPES: string[]; ITEMS: Array<Record<string, unknown>> };
type LegacyCard = { id: string; law: number; order: number; front: string; back: string };

export function convertCourse(course: LegacyCourse) {
  const { id, name, short, cls, blurb, note, lessons } = plain(course);
  return {
    id: `lessons.${id === 'gita' ? 'gita-restless-mind' : 'charaka-holds-up'}`,
    kind: 'lessons' as const, version: '1.0.0', schema: 1, minAppVersion: '0.1.0',
    title: name, author: 'legacy' as const, createdAt,
    body: { course: { id, name, short, tint: cls.replace(/^t-/, ''), blurb, note }, lessons },
  };
}

export function convertDeck(source: LegacyDeck, exportData: { cards: LegacyCard[] }) {
  const { LAWS, TACTICS, TYPES, ITEMS } = plain(source);
  const cards = exportData.cards.filter((card) => typeof card.law === 'number').map(({ id, law, order, front, back }) => ({ id, topic: String(law), order, front, back }));
  const items = ITEMS.map((item) => {
    const { law, ...rest } = item;
    return law === undefined ? rest : { ...rest, topic: String(law) };
  });
  return {
    id: 'deck.greene', kind: 'deck' as const, version: '1.0.0', schema: 1,
    minAppVersion: '0.1.0', title: 'Read People', author: 'legacy' as const, createdAt,
    body: { topics: LAWS, tactics: TACTICS, types: TYPES, cards, items },
  };
}

async function writePack(path: string, pack: unknown) {
  const errors = validatePack(pack);
  if (errors.length) throw new Error(`${path}: ${errors.join('; ')}`);
  const target = resolve(root, path);
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, `${JSON.stringify(pack, null, 2)}\n`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--deck-from')) throw new Error('Usage: convert-legacy [--deck-from <path>]');
  const courses = plain(await evaluate(['lessons_gita.js', 'lessons_charaka.js'], 'COURSES')) as LegacyCourse[];
  for (const course of courses) await writePack(`content/lessons/${convertCourse(course).id}.json`, convertCourse(course));
  if (!args.length) {
    console.log('Deck skipped: pass --deck-from <path> to convert card text.');
    return;
  }
  const source = plain(await evaluate(['content.js'], '({LAWS, TACTICS, TYPES, ITEMS})')) as LegacyDeck;
  const data = JSON.parse(await readFile(resolve(args[1]!), 'utf8')) as { cards: LegacyCard[] };
  await writePack('content/deck/deck.greene.json', convertDeck(source, data));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
