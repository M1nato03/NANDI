import { describe, it, expect } from 'vitest';
import { readFile, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, sep } from 'node:path';
import { runInNewContext } from 'node:vm';
import { convertDeck } from './convert-legacy';
import { buildPacks } from './build-packs';
import { validatePack } from '../src/data/packs/validate';
import * as v from 'valibot';
import { packSchema } from '../src/data/packs/schemas';
import gita from '../content/lessons/lessons.gita-restless-mind.json';

describe('deck conversion', () => {
  it('uses the synthetic fixture and strips all SRS state', async () => {
    const source = await readFile('legacy/src/content.js', 'utf8');
    const data = JSON.parse(await readFile('legacy/data/fixture-legacy-export.json', 'utf8'));
    const legacy = runInNewContext(`${source}\n;({LAWS,TACTICS,TYPES,ITEMS})`, Object.create(null));
    const pack = convertDeck(legacy, data);
    expect(pack.body.cards).toHaveLength(3);
    expect(pack.body.cards[0]).toEqual({ id: 'l4-1', topic: '4', order: 1, front: 'Fixture front 1', back: 'Fixture back 1' });
    expect(pack.body.items).toHaveLength(44);
    expect(validatePack(pack)).toEqual([]);
    for (const card of pack.body.cards) expect(Object.keys(card).sort()).toEqual(['back', 'front', 'id', 'order', 'topic']);
    pack.body.cards[0].box = 1;
    expect(v.safeParse(packSchema, pack).success).toBe(false);
  });
});

describe('pack build', () => {
  it('indexes the exact published bytes by SHA-256', async () => {
    const temp = await mkdtemp(join(process.cwd(), '.pack-test-'));
    try {
      const content = join(temp, 'content');
      const dist = join(temp, 'dist');
      await mkdir(content);
      await writeFile(join(content, 'lessons.gita-restless-mind.json'), JSON.stringify(gita));
      const index = await buildPacks(content, dist);
      expect(index.packs).toHaveLength(1);
      const entry = index.packs[0];
      const bytes = await readFile(join(dist, entry.url.replace('/packs/', '')));
      expect(entry.bytes).toBe(bytes.length);
      expect(entry.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
      expect(JSON.parse(await readFile(join(dist, 'index.json'), 'utf8')).packs[0]).toEqual(entry);
    } finally {
      if (resolve(temp).startsWith(`${resolve(process.cwd())}${sep}`)) await rm(temp, { recursive: true, force: true });
    }
  });
});
