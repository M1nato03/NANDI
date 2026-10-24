import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { answer, checkPack, effect, linksFor, say, type MapLink, type Pack } from './reasoner';

const here = dirname(fileURLToPath(import.meta.url));
const pack = JSON.parse(readFileSync(resolve(here, 'psychology.json'), 'utf8')) as Pack;
const topic = JSON.parse(
  readFileSync(resolve(here, '../../content/topics/topic.psychology.json'), 'utf8'),
) as {
  body: {
    modules: {
      concepts: {
        id: string;
        claims: { id: string; text: string }[];
        misconceptions: { id: string }[];
        factCheck?: { verdicts: { claimId: string; verdict: string }[] };
      }[];
    }[];
  };
};
const concepts = topic.body.modules.flatMap((m) => m.concepts);

describe('reasoner basics', () => {
  const links: MapLink[] = [
    { id: 'a', from: 'x', to: 'y', relation: 'sets-off', support: [] },
    { id: 'b', from: 'y', to: 'z', relation: 'less-likely', support: [] },
    { id: 'c', from: 'x', to: 'z', relation: 'more-likely', support: [] },
    { id: 'd', from: 'z', to: 'x', relation: 'more-likely', support: [] },
  ];
  it('multiplies signs along a path and handles a removed cause', () => {
    expect(effect(links.slice(0, 2), 'x', 'up', 'z')).toEqual({ verdict: 'less', paths: [['a', 'b']] });
    expect(effect(links.slice(0, 2), 'x', 'down', 'z').verdict).toBe('more');
  });
  it('says unsure when paths disagree, and survives a loop', () => {
    expect(effect(links, 'x', 'up', 'z')).toEqual({ verdict: 'unsure', paths: [['a', 'b'], ['c']] });
  });
  it('says no change when there is no path', () => {
    expect(effect(links, 'z', 'up', 'q')).toEqual({ verdict: 'no-change', paths: [] });
  });
});

describe('psychology pack structure', () => {
  it('passes the pack checks', () => {
    expect(checkPack(pack)).toEqual([]);
  });
  it('covers all 10 Psychology concepts once', () => {
    expect(pack.maps.map((m) => m.conceptId).sort()).toEqual(concepts.map((c) => c.id).sort());
  });
});

for (const map of pack.maps) {
  describe(map.conceptId, () => {
    const concept = concepts.find((c) => c.id === map.conceptId)!;
    const claimText = (id: string) => concept.claims.find((c) => c.id === id)?.text;

    it('quotes real, fact-checked claims word for word', () => {
      const supports = [
        ...map.links.flatMap((l) => l.support),
        ...map.wrongMaps.flatMap((w) => w.refutedBy),
        ...map.questions.flatMap((q) => q.support),
      ];
      for (const s of supports) {
        const text = claimText(s.claimId);
        expect(text, `${s.claimId} exists`).toBeDefined();
        expect(text, `${s.claimId} quote`).toContain(s.quote);
        const v = concept.factCheck?.verdicts.find((x) => x.claimId === s.claimId)?.verdict;
        expect(v, `${s.claimId} fact-check`).toBe('supported');
      }
    });

    it('takes every wrong map from the concept misconceptions', () => {
      const ids = concept.misconceptions.map((m) => m.id);
      for (const w of map.wrongMaps) expect(ids).toContain(w.misconceptionId);
    });

    const variants = ['correct', ...map.wrongMaps.map((w) => w.misconceptionId)];
    for (const q of map.questions) {
      for (const v of variants) {
        it(`${q.id} on the ${v} map gives the expected answer`, () => {
          expect(answer(map, v, q.query)).toEqual(q.expect[v]);
          expect(say(map, v, q.query).length).toBeGreaterThan(0);
        });
      }
    }

    for (const w of map.wrongMaps) {
      it(`${w.misconceptionId} makes a visible mistake on at least one question`, () => {
        const differs = map.questions.some(
          (q) => JSON.stringify(answer(map, w.misconceptionId, q.query)) !== JSON.stringify(answer(map, 'correct', q.query)),
        );
        expect(differs).toBe(true);
      });
      it(`${w.misconceptionId} mistake is traceable to the changed links`, () => {
        const changed = new Set([...w.add.map((l) => l.id), ...w.remove]);
        for (const q of map.questions) {
          const right = answer(map, 'correct', q.query);
          const wrong = answer(map, w.misconceptionId, q.query);
          if (JSON.stringify(right) === JSON.stringify(wrong)) continue;
          // The wrong answer either walks an added link, or loses a path that used a removed link.
          const usedLinks = (a: typeof right) =>
            a.kind === 'effect'
              ? a.paths.flat()
              : a.nodes.flatMap((n) => {
                  const r = effect(linksFor(map, w.misconceptionId), n, 'up', (q.query as { to: string }).to);
                  const c = effect(map.links, n, 'up', (q.query as { to: string }).to);
                  return [...r.paths.flat(), ...c.paths.flat()];
                });
          const touched = [...usedLinks(right), ...usedLinks(wrong)].some((id) => changed.has(id));
          expect(touched, `${q.id}`).toBe(true);
        }
      });
    }
  });
}

it('prints what Chiku says (for the review)', () => {
  const lines: string[] = [];
  for (const map of pack.maps)
    for (const q of map.questions)
      for (const v of ['correct', ...map.wrongMaps.map((w) => w.misconceptionId)])
        lines.push(`${map.conceptId} ${q.id} ${v}: ${say(map, v, q.query)}`);
  expect(lines.length).toBe(58);
  if (process.env.TEACH_CHIKU_PRINT) console.log(lines.join('\n'));
});
