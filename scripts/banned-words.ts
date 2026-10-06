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
  const hits = (await scanDirectory('src')) + (await scanDirectory('content'));
  if (hits > 0) process.exitCode = 1;
}
