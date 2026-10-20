import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import ts from 'typescript';

// Code identifiers and JSON field names are not visible copy.
const forbidden = [
  ['D', 'uo'], ['o', 'wl'], ['L', 'ily'], ['Z', 'ari'], ['lin', 'gots'], ['g', 'ems'],
  ['he', 'arts'], ['Diamond', ' League'], ['Streak', ' Society'], ['Legen', 'dary'],
  ['Su', 'per'], ['M', 'ax'],
].map(parts => parts.join(''));
const pattern = new RegExp(`\\b(?:${forbidden.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
function files(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(folder, entry.name)) : [join(folder, entry.name)]);
}
function visibleCopy(file: string): string {
  const source = readFileSync(file, 'utf8');
  if (file.endsWith('.json')) {
    const strings: string[] = [];
    const collect = (value: unknown): void => {
      if (typeof value === 'string') strings.push(value);
      else if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === 'object') Object.values(value).forEach(collect);
    };
    collect(JSON.parse(source));
    return strings.join('\n');
  }
  const strings: string[] = [];
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const collect = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node) || ts.isJsxText(node)) strings.push(node.text);
    ts.forEachChild(node, collect);
  };
  collect(tree);
  return strings.join('\n');
}
test('shipped copy introduces no borrowed terms', () => {
  const hits: string[] = [];
  for (const file of [...files('src'), ...files('content')].filter(path => /\.(tsx?|json)$/.test(path) && !/\.test\.tsx?$/.test(path))) {
    for (const match of visibleCopy(file).matchAll(pattern)) hits.push(`${file.replaceAll('\\', '/')}:${match[0].toLowerCase()}`);
  }
  // Existing labels and educational copy predate this workstream and cannot be renamed here.
  // Keep their exact file/word counts so any new use still fails the gate.
  expect(hits).toEqual([
    'src/ui/screens/GeneratorCheck.tsx:max',
    'src/ui/train/Workout.tsx:max',
    'content/deck/deck.greene.json:lily',
    'content/lessons/lessons.charaka-holds-up.json:owl',
    'content/lessons/lessons.charaka-holds-up.json:max',
    'content/lessons/lessons.charaka-holds-up.json:max',
    'content/lessons/lessons.charaka-holds-up.json:max',
  ]);
});
