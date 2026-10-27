import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

export async function loadPackFiles(contentDir = resolve(root, 'content')) {
  const files: string[] = [];
  async function visit(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name.endsWith('.json')) files.push(path);
    }
  }
  await visit(contentDir);
  files.sort();
  return Promise.all(files.map(async (path) => ({ path, value: JSON.parse(await readFile(path, 'utf8')) as unknown })));
}

/** Spec 34: Yatra trails live in content/yatra but are not packs; they have their own rules (src/core/yatra/trail). */
export const isTrailFile = (path: string) => /[\\/]yatra[\\/][^\\/]+\.json$/.test(path);
