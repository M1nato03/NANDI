import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

/** Phrases that never belong in product copy. Keep this check separate from name bans. */
export const copyPhrases = ['addiction', 'fail', 'fails', 'failed', 'failing', 'failure', 'lost', 'you should', 'streak broken'] as const;
const pattern = new RegExp(`\\b(?:${copyPhrases.join('|')})\\b`, 'gi');

export function findCopyIssues(text: string): { line: number; phrase: string }[] {
  return text.split(/\r?\n/).flatMap((line, index) => [...line.matchAll(pattern)].map(match => ({ line: index + 1, phrase: match[0] })));
}

function visibleFragments(path: string, source: string): { line: number; text: string }[] {
  if (path.endsWith('.json')) return source.split(/\r?\n/).map((text, index) => ({ line: index + 1, text }));
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const fragments: { line: number; text: string }[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) fragments.push({ line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, text: node.getText(file) });
    if (ts.isStringLiteral(node) && (/\s|[.!?]/.test(node.text) || ts.isJsxAttribute(node.parent))) {
      fragments.push({ line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, text: node.text });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return fragments;
}

async function scan(path: string): Promise<number> {
  let hits = 0;
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) hits += await scan(child);
    else if (entry.isFile() && /\.(tsx?|json)$/.test(child) && !/\.test\./.test(child)) {
      const source = await readFile(child, 'utf8');
      for (const fragment of visibleFragments(child, source)) for (const hit of findCopyIssues(fragment.text)) {
        console.log(`${child}:${fragment.line + hit.line - 1}:${hit.phrase}`);
        hits++;
      }
    }
  }
  return hits;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (await scan('src/ui') + await scan('content')) process.exitCode = 1;
}
