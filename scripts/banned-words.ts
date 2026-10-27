import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const bannedWords = [
  'Blue Lock',
  'Ego',
  'Egoist',
  'Queens',
  'Tango',
  'Zip',
  'KenKen',
];
const bannedPattern = new RegExp(`\\b(?:${bannedWords.join('|')})\\b`, 'g');

export function findBannedWords(
  text: string,
): { line: number; word: string }[] {
  const hits: { line: number; word: string }[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    for (const match of line.matchAll(bannedPattern)) {
      hits.push({ line: index + 1, word: match[0] });
    }
  }
  return hits;
}

// Spec 34: Calm and Mind (Yatra) copy says what a thing is, never what it does to you. Scoped to those screens and
// content so a book's own words are not flagged.
const claimPhrases = [
  'reduce stress', 'stress relief', 'de-stress', 'anxiety', 'depression', 'heal', 'healing', 'therapy', 'therapeutic',
  'cure', 'treat', 'treatment', 'calm your mind', 'clear your mind', 'quiet your mind', 'boost', 'brain', 'brain training',
  'IQ', 'cognitive', 'sharper', 'improve focus', 'improve memory', 'mental health', 'wellness benefits',
  'lower blood pressure', 'blood pressure', 'heart rate', 'sleep better', 'better sleep', 'detox', 'mindfulness benefits',
  'proven', 'clinically', 'scientifically',
];
const claimPattern = new RegExp(`(?<![\\w-])(?:${claimPhrases.join('|')})(?![\\w-])`, 'gi');
export const claimScopes = ['src/ui/yatra', 'src/ui/mind', 'src/ui/screens/Mind.tsx', 'content/yatra'];

export function findClaims(text: string): { line: number; word: string }[] {
  const hits: { line: number; word: string }[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    for (const match of line.matchAll(claimPattern)) hits.push({ line: index + 1, word: match[0] });
  }
  return hits;
}

async function scanClaims(path: string): Promise<number> {
  let count = 0;
  const entries = await readdir(path, { withFileTypes: true }).catch(() => null);
  if (!entries) {
    for (const hit of findClaims(await readFile(path, 'utf8').catch(() => ''))) {
      console.log(`${path}:${hit.line}:${hit.word} (a health or brain claim)`);
      count++;
    }
    return count;
  }
  for (const entry of entries) {
    if (!/\.test\.tsx?$/.test(entry.name)) count += await scanClaims(join(path, entry.name));
  }
  return count;
}

async function scanDirectory(directory: string): Promise<number> {
  let count = 0;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      count += await scanDirectory(path);
    } else if (entry.isFile()) {
      for (const hit of findBannedWords(await readFile(path, 'utf8'))) {
        console.log(`${path}:${hit.line}:${hit.word}`);
        count++;
      }
    }
  }
  return count;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  let hits = (await scanDirectory('src')) + (await scanDirectory('content'));
  for (const scope of claimScopes) hits += await scanClaims(scope);
  if (hits > 0) process.exitCode = 1;
}
