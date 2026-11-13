import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

/** Phrases that never belong in product copy. Keep this check separate from name bans. */
// Spec 24 / cj5-mind §3.3: no brain-training claims (Simons 2016; Sala & Gobet 2019).
export const copyPhrases = ['addiction', 'fail', 'fails', 'failed', 'failing', 'failure', 'lost', 'you should', 'streak broken',
  'brain training', 'train your brain', 'makes you smarter', 'boost your IQ', 'raise your IQ'] as const;
const pattern = new RegExp(`\\b(?:${copyPhrases.join('|')})\\b`, 'gi');

/**
 * b2 13 Nov (A2): loss words in app copy (src/ui only; book and lesson text in content/ may use them). Each allowed use
 * is named by file and text: none of them talks about the person's own days.
 */
export const uiLossWords = ['streak', 'missed'] as const;
const lossPattern = new RegExp(`\\b(?:${uiLossWords.join('|')})\\b`, 'gi');
export const lossAllowed: readonly { file: string; text: string; why: string }[] = [
  { file: 'src/ui/learn/Matka.tsx', text: 'Missed', why: 'the matka answer (did the guess land), not the person' },
  { file: 'src/ui/bookGame/BookGame.tsx', text: 'Growing missed ₹280', why: 'the book game’s money outcome' },
  { file: 'src/ui/screens/OwnerPanel.tsx', text: 'soft vs missed', why: 'owner-only numbers' },
  { file: 'src/ui/learn/HaveliDemo.tsx', text: 'one missed day.', why: 'an e2e-only fixture idea (route learn/haveli-demo)' },
];
export function findLossWords(text: string, file = ''): { line: number; phrase: string }[] {
  const allowed = lossAllowed.filter(row => file.replace(/\\/g, '/').endsWith(row.file) && text.includes(row.text));
  if (allowed.length) return [];
  return text.split(/\r?\n/).flatMap((line, index) => [...line.matchAll(lossPattern)].map(match => ({ line: index + 1, phrase: `loss word: ${match[0]}` })));
}

/** a9 13 Nov (w10 #7): UI copy uses the curly apostrophe (’), never a straight one between letters. */
export function findStraightApostrophes(text: string): { line: number; phrase: string }[] {
  return text.split(/\r?\n/).flatMap((line, index) => [...line.matchAll(/[A-Za-z]+'[A-Za-z]+/g)].map(match => ({ line: index + 1, phrase: `straight apostrophe: ${match[0]}` })));
}

/** S1 (Sun): a phrase in straight double quotes ("Open anyway") in user-facing copy; a CSS font list is not copy. */
export function findStraightQuotes(text: string): { line: number; phrase: string }[] {
  // Not copy: a CSS font list or a canvas font (700 20px "DM Sans"), or a selector ([type="range"]).
  if (/\b(sans-serif|serif|monospace)\b|\d(px|rem|em)\b|=\s*"/.test(text)) return [];
  // A string that is only a quoted name ('"DM Sans"', a font picked in code) is a value, not a sentence.
  if (/^"[^"]*"$/.test(text.trim())) return [];
  return text.split(/\r?\n/).flatMap((line, index) => [...line.matchAll(/"[A-Za-z][^"\n]*"/g)].map(match => ({ line: index + 1, phrase: `straight quotes: ${match[0]}` })));
}

/** S2 (Sun): in a template, straight quotes around an interpolation ('${title}', "${card}") in user-facing copy. */
export function findQuotedInterpolations(source: string): { line: number; phrase: string }[] {
  return source.split(/\r?\n/).flatMap((line, index) => [...line.matchAll(/(['"])\$\{[^}]+\}\1/g)]
    .filter(match => line.lastIndexOf('`', match.index) !== -1)
    .map(match => ({ line: index + 1, phrase: `straight quotes around an interpolation: ${match[0]}` })));
}

export function findCopyIssues(text: string): { line: number; phrase: string }[] {
  return text.split(/\r?\n/).flatMap((line, index) => [...line.matchAll(pattern)].map(match => ({ line: index + 1, phrase: match[0] })));
}

function visibleFragments(path: string, source: string): { line: number; text: string; attr?: boolean }[] {
  if (path.endsWith('.json')) return source.split(/\r?\n/).map((text, index) => ({ line: index + 1, text }));
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const fragments: { line: number; text: string; attr?: boolean }[] = [];
  // A className is never copy: its strings are skipped (b2 13 Nov, A2).
  const inClassName = (node: ts.Node) => {
    for (let at: ts.Node | undefined = node.parent; at; at = at.parent) if (ts.isJsxAttribute(at)) return at.name.getText(file) === 'className';
    return false;
  };
  function visit(node: ts.Node) {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) && inClassName(node)) return;
    if (ts.isJsxText(node)) fragments.push({ line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, text: node.getText(file) });
    if (ts.isStringLiteral(node) && (/\s|[.!?]/.test(node.text) || ts.isJsxAttribute(node.parent))) {
      fragments.push({ line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, text: node.text, attr: ts.isJsxAttribute(node.parent) });
    }
    // Template copy is checked for apostrophes only (see scan).
    if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      const text = ts.isNoSubstitutionTemplateLiteral(node) ? node.text : [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(' ');
      fragments.push({ line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, text: `\u0000${text}` });
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
      const ui = !child.endsWith('.json');
      if (ui) for (const hit of findQuotedInterpolations(source)) { console.log(`${child}:${hit.line}:${hit.phrase}`); hits++; }
      for (const fragment of visibleFragments(child, source)) {
        const template = fragment.text.startsWith('\u0000');
        const text = template ? fragment.text.slice(1) : fragment.text;
        const issues = [...(template ? [] : findCopyIssues(text)), ...(ui ? [...findStraightApostrophes(text), ...findLossWords(text, child), ...(fragment.attr ? [] : findStraightQuotes(text))] : [])];
        for (const hit of issues) {
          console.log(`${child}:${fragment.line + hit.line - 1}:${hit.phrase}`);
          hits++;
        }
      }
    }
  }
  return hits;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (await scan('src/ui') + await scan('content')) process.exitCode = 1;
}
