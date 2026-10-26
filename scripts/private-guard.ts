import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Spec 33 §7 CI guard: private and licensed books live only on the owner's phone. This finds any file in the repo
 * that is such a book (a pack whose book says rights private or licensed) or carries the "nandiPrivate": true marker.
 */
const SKIP = new Set(['node_modules', '.git', 'dist', 'dist-e2e', 'dist-e2e-b', 'test-results', 'playwright-report', 'shots-out', 'coverage', 'build', '.gradle']);
const MARKER = /"nandiPrivate"\s*:\s*true/;

export function findPrivatePacks(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (SKIP.has(name)) continue;
      const path = join(dir, name);
      const info = statSync(path);
      if (info.isDirectory()) { walk(path); continue; }
      if (!name.endsWith('.json') || info.size > 20_000_000) continue;
      const text = readFileSync(path, 'utf8');
      let rights: unknown;
      try { rights = (JSON.parse(text) as { body?: { book?: { rights?: unknown } } })?.body?.book?.rights; } catch { rights = undefined; }
      if (MARKER.test(text) || rights === 'private' || rights === 'licensed') found.push(relative(root, path).replaceAll('\\', '/'));
    }
  };
  walk(root);
  return found;
}
