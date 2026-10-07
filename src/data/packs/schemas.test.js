import { describe, it, expect } from 'vitest';
import * as v from 'valibot';
import gita from '../../../content/lessons/lessons.gita-restless-mind.json';
import charaka from '../../../content/lessons/lessons.charaka-holds-up.json';
import { packSchema } from './schemas';
import { bundledPacks } from './seed';

describe('pack schemas', () => {
  it('accepts both converted lesson packs', () => {
    expect(v.safeParse(packSchema, gita).success).toBe(true);
    expect(v.safeParse(packSchema, charaka).success).toBe(true);
  });
  it('exposes the lessons and the Greene deck as offline seeds', () => {
    expect(bundledPacks.map((pack) => pack.id).sort()).toEqual(['deck.greene', 'lessons.charaka-holds-up', 'lessons.gita-restless-mind']);
  });
  it('rejects an incomplete envelope', () => {
    const pack = structuredClone(gita);
    delete pack.version;
    expect(v.safeParse(packSchema, pack).success).toBe(false);
  });
  it('rejects a malformed diagram', () => {
    const pack = structuredClone(gita);
    pack.body.lessons[0].pic = { k: 'chain', steps: 4 };
    expect(v.safeParse(packSchema, pack).success).toBe(false);
  });
});
