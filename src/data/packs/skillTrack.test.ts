import { describe, expect, it } from 'vitest';
import fixture from '../../../tests/fixtures/skill-track.practice.json';
import rights from '../../../tests/fixtures/skill-track.rights.json';
import { validateSkillTrack, type RightsEntry, type SkillTrackPack } from './skillTrack';
import { validatePack } from './validate';

// Spec 43: every validator rule has its own rejection, made by changing one thing in the neutral fixture.
const pack = () => structuredClone(fixture) as unknown as SkillTrackPack;
const register = () => structuredClone(rights) as RightsEntry[];
const lesson = (p: SkillTrackPack, i: number) => p.body.lessons[i]!;
const errorsFor = (change: (p: SkillTrackPack, r: RightsEntry[]) => void) => { const p = pack(), r = register(); change(p, r); return validateSkillTrack(p, r); };

describe('spec 43: the skill-track validator', () => {
  it('the neutral fixture passes, alone and through validatePack', () => {
    expect(validateSkillTrack(pack(), register())).toEqual([]);
    expect(validatePack(pack())).toEqual([]);
  });
  it('rejects a broken shape, a wrong id, and lesson positions with a gap or a repeat', () => {
    expect(errorsFor(p => { (p.body as { lessons: unknown }).lessons = []; }).length).toBeGreaterThan(0);
    expect(errorsFor(p => { p.id = 'track.practice'; })).toContain('id must match kind');
    expect(errorsFor(p => { lesson(p, 2).position = 4; })).toContain('lesson positions must run 1 to 3 with no gap or repeat');
    expect(errorsFor(p => { lesson(p, 2).position = 2; })).toContain('lesson positions must run 1 to 3 with no gap or repeat');
  });
  it('rejects duplicate lesson and variant ids', () => {
    expect(errorsFor(p => { lesson(p, 1).lessonId = 'say-1'; lesson(p, 2).prerequisites = ['say-1']; })).toContain('say-1: duplicate lesson id');
    expect(errorsFor(p => { lesson(p, 1).fresh[0]!.variantId = 'say-1-a'; })).toContain('say-2 say-1-a: duplicate variant id');
  });
  it('rejects a dangling or later prerequisite and an unknown or once-only competency', () => {
    expect(errorsFor(p => { lesson(p, 2).prerequisites = ['say-9']; })).toContain('say-3: prerequisite say-9 does not exist');
    expect(errorsFor(p => { lesson(p, 0).prerequisites = ['say-3']; })).toContain('say-1: prerequisite say-3 must come earlier');
    expect(errorsFor(p => { lesson(p, 0).competencyIds = ['lead-with-ask', 'speak-up']; })).toContain('say-1: unknown competency speak-up');
    expect(errorsFor(p => { lesson(p, 2).competencyIds = ['clear-order']; })).toContain('competency lead-with-ask is not practised in two lessons');
  });
  it('rejects fewer than two fresh cases, a repeated fresh case, and one that repeats the worked example', () => {
    expect(errorsFor(p => { lesson(p, 0).fresh = [lesson(p, 0).fresh[0]!]; }).length).toBeGreaterThan(0);
    expect(errorsFor(p => { lesson(p, 0).fresh[1]!.prompt = lesson(p, 0).fresh[0]!.prompt; })).toContain('say-1 say-1-b: repeats another fresh case');
    expect(errorsFor(p => { lesson(p, 0).fresh[1]!.prompt = lesson(p, 0).worked.prompt; })).toContain('say-1 say-1-b: repeats the worked example');
  });
  it('rejects a fresh check the worked answer would pass', () => {
    expect(errorsFor(p => { const check = lesson(p, 2).fresh[0]!.check!; if (check.kind === 'phrase') check.accepted.push(lesson(p, 2).worked.answer); }))
      .toContain('say-3 say-3-a: the worked answer would pass; a fresh case needs its own answer');
  });
  it('rejects a choice whose answer or near miss is not an option, duplicate options, and duplicate order parts', () => {
    expect(errorsFor(p => { const check = lesson(p, 0).change.check; if (check.kind === 'choice') check.accepted = ['Something else']; }))
      .toContain('say-1 change: accepted answer is not an option: Something else');
    expect(errorsFor(p => { const check = lesson(p, 0).change.check; if (check.kind === 'choice') check.nearMisses = [{ answer: 'Not listed', feedback: 'x' }]; }))
      .toContain('say-1 change: near miss is not an option: Not listed');
    expect(errorsFor(p => { const check = lesson(p, 0).change.check; if (check.kind === 'choice') check.options[2] = check.options[0]!.toUpperCase(); })).toContain('say-1 change: duplicate options');
    expect(errorsFor(p => { const check = lesson(p, 1).change.check; if (check.kind === 'order') check.parts[2] = check.parts[0]!; })).toContain('say-2 change: duplicate parts');
  });
  it('rejects a near miss that is also accepted, and hidden tests that do not hold', () => {
    expect(errorsFor(p => { const check = lesson(p, 2).change.check; if (check.kind === 'phrase') check.nearMisses = [{ answer: 'room 12', feedback: 'x' }]; }))
      .toContain('say-3 change: a near miss is also accepted');
    expect(errorsFor(p => { const check = lesson(p, 2).change.check; if (check.kind === 'phrase') check.tests = { accept: ['Room 21'], reject: [] }; }))
      .toContain('say-3 change: hidden test should be accepted: Room 21');
    expect(errorsFor(p => { const check = lesson(p, 2).change.check; if (check.kind === 'phrase') check.tests = { accept: [], reject: ['room twelve'] }; }))
      .toContain('say-3 change: hidden test should be rejected: room twelve');
  });
  it('rejects placeholder text anywhere in the track', () => {
    expect(errorsFor(p => { lesson(p, 0).useItToday = 'TODO write this'; })).toContain('placeholder text: TODO write this');
    expect(errorsFor(p => { lesson(p, 1).worked.why[0] = 'Each step is...'; })).toContain('placeholder text: Each step is...');
  });
  it('rejects a lesson whose rights entry is missing', () => {
    expect(errorsFor((_p, r) => { r.splice(1, 1); })).toContain('say-2: rights entry r-say-2 is missing');
  });
  it('a release track needs hidden tests on every check and a complete rights entry; a draft does not', () => {
    const noTests = (p: SkillTrackPack) => { delete lesson(p, 0).change.check.tests; };
    expect(errorsFor(noTests)).toEqual([]);
    expect(errorsFor(p => { p.body.status = 'release'; noTests(p); })).toContain('say-1 change: a release check needs hidden tests that accept and reject');
    expect(errorsFor((p, r) => { p.body.status = 'release'; delete r[2]!.reviewedOn; })).toContain('say-3: rights entry r-say-3 is incomplete for release');
    expect(errorsFor(p => { p.body.status = 'release'; })).toEqual([]);
  });
});
