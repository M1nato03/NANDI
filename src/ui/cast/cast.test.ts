import { describe, expect, it } from 'vitest';
import { dropCast, finishCast } from './placement';
import { completedModuleKey } from './UnitScene';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACCESSORY, Cast, castNames, poses } from './Cast';
import { CAMP, TrekScene } from '../yatra/TrekScene';
import { deriveTrek } from '../../core/yatra/trek';
import { currentTrail } from '../../data/yatra/trails';

describe('cast placement', () => {
  it('uses the intended friend for each finish and a memory keeper for review', () => {
    expect(finishCast.task.name).toBe('Mor');
    expect(finishCast.train.name).toBe('Nandi');
    expect(finishCast.learn.name).toBe('Chiku');
    expect(finishCast.puzzle.name).toBe('Kapi');
    expect(finishCast.night.name).toBe('Kachhua');
    expect(dropCast(false, undefined)).toEqual({ name: 'Chiku', pose: 'think' });
    expect(dropCast(false, true)).toEqual({ name: 'Chiku', pose: 'cheer' });
    expect(dropCast(true, false)).toEqual({ name: 'Moti', pose: 'think' });
  });
  it('selects a fully learned module only once', () => {
    const modules = [{ id: 'one', concepts: [{ id: 'a' }, { id: 'b' }] }, { id: 'two', concepts: [{ id: 'c' }] }];
    expect(completedModuleKey(modules, new Set(['a']), () => false)).toBeUndefined();
    expect(completedModuleKey(modules, new Set(['a', 'b']), () => false)).toBe('one');
    expect(completedModuleKey(modules, new Set(['a', 'b']), id => id === 'one')).toBeUndefined();
  });
});

// The opening is spec 45a's square breath now: its rules are in src/core/calm/squareBreath.test.ts.

describe('area accessories (spec 25 §4)', () => {
  it('every friend wears its one accessory in all 4 poses', () => {
    for (const name of castNames) for (const pose of poses) {
      const svg = renderToStaticMarkup(createElement(Cast, { name, pose }));
      expect(svg.match(/class="cast-accessory"/g), `${name} ${pose}`).toHaveLength(1);
      expect(svg, `${name} ${pose}`).toContain(ACCESSORY[name].fill);
    }
  });
});

describe('spec 45b: the five friends at camp', () => {
  const trek = deriveTrek([], currentTrail()!, '2026-10-28', '2026-10-28');
  const scene = (onFriend?: () => void) => renderToStaticMarkup(createElement(TrekScene, { trek, night: false, onRename: () => undefined, onFriend }));
  it('on Home each friend is a labelled button at its own place, to its own area', () => {
    const html = scene(() => undefined);
    const labels = [...html.matchAll(/<button[^>]*class="trek-actor [a-z]+ camp-friend"[^>]*aria-label="([^"]+)"/g)].map(match => match[1]);
    expect(labels).toEqual(['Plan, Mor at the map', 'Read, Chiku on the reading rock', 'Train, Nandi by the pack', 'Play, Kapi in the branches', 'Calm, Kachhua by the fire']);
    expect(CAMP.map(spot => spot.route)).toEqual(['plan', 'read', 'yatra/train', 'yatra/mind', 'yatra/calm']);
    for (const spot of CAMP) expect(html).toContain(`>${spot.area}</span>`);
    // Each hit target is at least 44 px.
    for (const spot of CAMP) expect(spot.size).toBeGreaterThanOrEqual(44);
  });
  it('elsewhere (a night Calm) the friends are pictures, not buttons, and the scene keeps its caption', () => {
    const html = scene();
    expect(html).not.toContain('camp-friend');
    expect(html).toContain('trek-caption');
    expect(html.match(/data-cast="/g)).toHaveLength(5);
  });
});
