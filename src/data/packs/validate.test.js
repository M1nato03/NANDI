import { describe, it, expect } from 'vitest';
import gita from '../../../content/lessons/lessons.gita-restless-mind.json';
import charaka from '../../../content/lessons/lessons.charaka-holds-up.json';
import quests from '../../../content/quests/quests.core.json';
import winddown from '../../../content/winddown/winddown.core.json';
import money from '../../../content/topics/topic.money-markets.json';
import body from '../../../content/topics/topic.body-training.json';
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

describe('quest pack', () => {
  it('validates 40 varied definitions and rejects duplicates and malformed totals', () => {
    expect(quests.body.quests).toHaveLength(40);
    expect(validatePack(quests)).toEqual([]);
    const duplicate = structuredClone(quests);
    duplicate.body.quests[1].id = duplicate.body.quests[0].id;
    expect(validatePack(duplicate).join(' ')).toContain('duplicate id');
    const malformed = structuredClone(quests);
    malformed.body.quests[0].unit = '';
    expect(validatePack(malformed).join(' ')).toContain('invalid total unit');
  });
});

describe('wind-down pack', () => {
  it('validates 24 offline moves and rejects duplicate IDs and malformed moves', () => {
    expect(winddown.body.moves).toHaveLength(24);
    expect(validatePack(winddown)).toEqual([]);
    const duplicate = structuredClone(winddown);
    duplicate.body.moves[1].id = duplicate.body.moves[0].id;
    expect(validatePack(duplicate).join(' ')).toContain('duplicate id');
    const tooLong = structuredClone(winddown);
    tooLong.body.moves[0].text = 'x'.repeat(71);
    expect(validatePack(tooLong).length).toBeGreaterThan(0);
    const markup = structuredClone(winddown);
    markup.body.moves[0].text = '<b>Read</b>';
    expect(validatePack(markup).length).toBeGreaterThan(0);
    const duration = structuredClone(winddown);
    duration.body.moves[0].minutes = 16;
    expect(validatePack(duration).length).toBeGreaterThan(0);
  });
});

describe('topic editorial rules', () => {
  const badTopic = (change, message) => {
    const copy = structuredClone(money);
    change(copy.body.modules[0].concepts, copy.body.modules[0]);
    expect(validatePack(copy, { allowUnchecked: true, editorial: true }).join(' ')).toContain(message);
  };
  it('accepts the hand-authored money pack', () => {
    expect(validatePack(money, { editorial: true })).toEqual([]);
  });
  it('accepts the body and training pack with checked claims and editorial rules', () => {
    expect(body.body.modules[0].concepts).toHaveLength(8);
    expect(body.body.modules[0].concepts.flatMap(concept => concept.items)).toHaveLength(64);
    expect(validatePack(body, { editorial: true })).toEqual([]);
  });
  it('requires a difficulty ladder and concept-based estimates', () => {
    badTopic((concepts) => { concepts[0].items[3].difficultySeed = 2; }, 'needs at least 2 level-1 items');
    badTopic((concepts) => { concepts[0].items[4].difficultySeed = 2; }, 'needs at least 2 level-3 items');
    badTopic((concepts) => { concepts[0].items[2].stem = 'A snack costs ₹20, then ₹25. With ₹100, how many fit?'; }, 'estimate must name its concept or mechanism');
  });
  it('requires eight items, one estimate and two Indian scenes', () => {
    badTopic((concepts) => { concepts[0].items.pop(); }, 'needs exactly 8 items');
    badTopic((concepts) => { const item = concepts[0].items[2]; item.type = 'choose'; delete item.answer; }, 'needs an estimate item');
    badTopic((concepts) => { concepts[0].items[0].stem = 'A plain case with no place. What follows?'; concepts[0].items[1].stem = 'Another plain case with no place. What follows?'; }, 'needs 2 Indian student scenarios or predictions');
  });
  it('limits type repetition and requires all ten types in a module', () => {
    badTopic((concepts) => { concepts[0].items[3].type = 'predict'; concepts[0].items[4].type = 'predict'; delete concepts[0].items[4].task; }, 'more than 2 predict items');
    badTopic((concepts) => { for (const concept of concepts) for (const item of concept.items) if (item.type === 'order') { item.type = 'choose'; delete item.answer; } }, 'missing item type order');
  });
  it('rejects cloned openings, option sets and dates in stems', () => {
    badTopic((concepts) => { concepts[0].items[1].stem = concepts[0].items[0].stem + ' Again?'; }, 'repeated stem prefix');
    badTopic((concepts) => { concepts[0].items[1].options = structuredClone(concepts[0].items[0].options); }, 'repeated option set');
    badTopic((concepts) => { concepts[0].items[0].stem = 'On 2026-10-16, the canteen price rises. What follows?'; }, 'date in stem');
    badTopic((concepts) => { delete concepts[0].sources[0].asOf; }, 'money source needs asOf metadata');
  });
  it('requires explanatory feedback in fresh words', () => {
    badTopic((concepts) => { concepts[0].items[0].options[1].feedback = 'Same.'; }, 'feedback needs 8-30 words');
    badTopic((concepts) => { const option = concepts[0].items[0].options[1]; option.feedback = option.text + ' That is the answer written again with some padding.'; }, 'feedback repeats option');
    badTopic((concepts) => { concepts[0].items[0].options[0].feedback = 'This has far too many filler words to make a useful explanation. It adds more filler words again and again, so the whole comment runs past the set limit for this small item and makes the feedback hard to read.'; }, 'feedback needs 8-30 words');
  });
});
