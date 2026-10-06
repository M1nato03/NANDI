import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as v from 'valibot';
import { loadPackFiles, root } from './pack-files';
import { packSchema } from '../src/data/packs/schemas';
import { validateAll } from './validate-packs';

export async function buildPacks(contentDir = resolve(root, 'content'), outputDir = resolve(root, 'dist/packs')) {
  const errors = await validateAll(contentDir);
  if (errors.length) throw new Error(errors.join('\n'));
  await mkdir(join(outputDir, 'v'), { recursive: true });
  const packs = [];
  for (const { value } of await loadPackFiles(contentDir)) {
    const pack = v.parse(packSchema, value);
    const filename = `${pack.id}@${pack.version}.json`;
    const bytes = Buffer.from(`${JSON.stringify(pack)}\n`);
    await writeFile(join(outputDir, 'v', filename), bytes);
    packs.push({
      id: pack.id, kind: pack.kind, version: pack.version, schema: pack.schema,
      minAppVersion: pack.minAppVersion, url: `/packs/v/${filename}`,
      sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length,
    });
  }
  const index = { generatedAt: new Date().toISOString(), packs };
  await writeFile(join(outputDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPacks().then((index) => console.log(`Built ${index.packs.length} packs.`))
    .catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
