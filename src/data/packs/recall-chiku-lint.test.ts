import { describe, expect, it } from 'vitest';
import psychology from '../../../content/topics/topic.psychology.json';
import { validatePack } from './validate';

// Spec 26/30 content lint: readability is checked on sentences; short labels (recall pieces, decoy tiles, Chiku cards)
// get the banned-word and advice checks only (cj10 content, 26 Oct).
const copy = () => JSON.parse(JSON.stringify(psychology));
const habits = (pack: ReturnType<typeof copy>) => pack.body.modules.flatMap((m: { concepts: unknown[] }) => m.concepts).find((c: { id: string }) => c.id === 'habits');

describe('recall and Chiku lint', () => {
  it('the approved Psychology pack passes', () => expect(validatePack(copy(), { editorial: true }).filter(e => /recall|chiku/.test(e))).toEqual([]));
  it('a short label is not scored for readability, but a hard sentence still is', () => {
    const pack = copy();
    habits(pack).chiku.cards[1].text = 'Nobody ever notices';
    expect(validatePack(pack, { editorial: true }).filter(e => /chiku/.test(e))).toEqual([]);
    habits(pack).chiku.guesses[0].why = 'Institutionalised organisational considerations predominantly characterise unconventionalities.';
    expect(validatePack(pack, { editorial: true })).toContainEqual(expect.stringMatching(/habits\.chiku: Flesch reading ease below 60/));
  });
  it('a hard fix line fails readability', () => {
    const pack = copy();
    habits(pack).recall.decoys[0].fix = 'Institutionalised organisational considerations predominantly characterise unconventionalities.';
    const errors = validatePack(pack, { editorial: true });
    expect(errors).toContainEqual(expect.stringMatching(/habits\.recall: Flesch reading ease below 60/));
  });
});
