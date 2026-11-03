import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Spec 43: test fixtures never ship. After `vite build`, no file in dist/ may carry the practice-engine fixture or its
 * e2e-only demo route; the e2e build (dist-e2e) is the only place they belong.
 */
const MARKERS = ['practice-fixture', 'skill-track.practice', 'read/skill-demo'];

export async function releaseBundleErrors(dist: string): Promise<string[]> {
  const errors: string[] = [];
  async function visit(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (/\.(js|json|html|css)$/.test(entry.name)) {
        const text = await readFile(path, 'utf8');
        for (const marker of MARKERS) if (text.includes(marker)) errors.push(`${path}: carries test-only "${marker}"`);
      }
    }
  }
  await visit(dist);
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist');
  const errors = await releaseBundleErrors(dist);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('Release bundle carries no test fixtures.');
}
