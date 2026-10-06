import { describe, it, expect } from 'vitest';
import gita from '../../../content/lessons/lessons.gita-restless-mind.json';
import charaka from '../../../content/lessons/lessons.charaka-holds-up.json';
import { validatePack } from './validate';

const bad = (pack, change, message) => {
  const copy = structuredClone(pack);
  change(copy, copy.body.lessons[0]);
  expect(validatePack(copy).join(' ')).toContain(message);
};

describe('lesson rules from the legacy harness and content spec', () => {
  it('accepts the 35 converted lessons', () => {
    expect(gita.body.lessons.length + charaka.body.lessons.length).toBe(35);
    expect(validatePack(gita)).toEqual([]);
    expect(validatePack(charaka)).toEqual([]);
  });
  it('rejects duplicate lesson IDs', () => bad(gita, (p) => { p.body.lessons[1].id = p.body.lessons[0].id; }, 'duplicate id'));
  it('rejects missing text', () => bad(gita, (_, l) => { l.rule = ''; }, 'rule'));
  it('rejects too few options', () => bad(gita, (_, l) => { l.o = ['one', 'two']; }, 'needs 3 options'));
  it('rejects duplicate options', () => bad(gita, (_, l) => { l.o[1] = l.o[0]; }, 'duplicate options'));
  it('rejects an answer outside options', () => bad(gita, (_, l) => { l.a = 999; }, 'answer out of range'));
  it('checks transfer and why answers', () => {
    bad(gita, (_, l) => { l.tr.a = -1; }, 'transfer answer out of range');
    bad(gita, (_, l) => { l.wy.o[1] = l.wy.o[0]; }, 'why duplicate options');
  });
  it('rejects a missing diagram part', () => bad(gita, (_, l) => { delete l.pic.steps; }, 'pic'));
  it('rejects a missing term', () => bad(gita, (_, l) => { l.term.w = ''; }, 'term'));
  it('requires Gita verses', () => bad(gita, (_, l) => { delete l.v; }, 'needs verses'));
  it('requires Charaka source, grade and science note', () => {
    bad(charaka, (_, l) => { delete l.src; }, 'needs source');
    bad(charaka, (_, l) => { delete l.grade; }, 'needs grade');
    bad(charaka, (_, l) => { delete l.sci; }, 'needs sci');
  });
  it('requires two story beats', () => bad(gita, (_, l) => { l.st.pop(); }, 'st'));
  it('requires two plan cues and actions', () => bad(gita, (_, l) => { l.pl.i = ['one']; }, 'plan needs 2'));
  it('requires two recall cards', () => bad(gita, (_, l) => { l.cards.pop(); }, 'needs 2 cards'));
  it('enforces scene and option limits', () => {
    bad(gita, (_, l) => { l.scene = 'x'.repeat(301); }, 'scene exceeds 300');
    bad(gita, (_, l) => { l.o[0] = 'x'.repeat(161); }, 'option exceeds 160');
  });
});
