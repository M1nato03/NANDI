import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import raw from './anchors.json';
import { containFit, homeFit, parseAnchors, type Rect } from '../../core/courtyard/anchors';
import { nudgeAnchors } from '../../core/courtyard/nudges';
import { AREAS, type CourtyardState } from '../../core/courtyard/courtyard';
import { PARTS } from './Scene';
import { NO_PART, PROP_PARTS, SCENE_PROPS } from './layoutBParts';
import { LayoutBScene } from './LayoutBScene';

// Spec 571 stage 2 (b2, 8 Nov): today's parts at the painted pass's positions, one existing part per prop.
// The anchors as the home uses them: the pass plus the layout-B nudges.
const anchors = nudgeAnchors(parseAnchors(raw));
const at = (stage: number): CourtyardState => ({ areas: AREAS.map(area => ({ id: area.id, friend: area.friend, label: area.label, practice: area.practice, days: 10, stage, today: false, week: 0, nextAt: null, nextObject: null })) as unknown as CourtyardState['areas'], activeDays: 10, treeStage: stage, todayCount: 0, lanterns: 2, toran: 3 });
const css = (rect: Rect): Rect => rect.map(value => value / 3) as unknown as Rect;

describe('the prop → part table', () => {
  it('covers every painted prop exactly once: a part, a scene fixture, or listed as having no part', () => {
    const named = [...PROP_PARTS.map(row => row.prop), ...Object.keys(SCENE_PROPS), ...NO_PART];
    expect(new Set(named).size).toBe(named.length);
    expect(named.sort()).toEqual(Object.keys(anchors.props).sort());
    for (const row of PROP_PARTS) expect(PARTS[row.part], row.part).toBeDefined();
  });

  it('every part keeps its aspect (contain fit); the ones more than 25% off their rect are listed for b2', () => {
    const off = PROP_PARTS.filter(row => containFit(PARTS[row.part].box, css(anchors.props[row.prop]!)).aspectOff > 1.25).map(row => row.prop);
    expect(off).toEqual(['mor-marigold-bed', 'mor-birdbath-water', 'moti-picture-frame', 'moti-bulbs-small-photos', 'kapi-kite', 'kapi-telescope',
      'nandi-dumbbells', 'nandi-medals', 'kachhua-pillow', 'kachhua-charpai', 'chiku-open-book', 'chiku-reading-lamp']);
  });
});

describe('the layout B scene', () => {
  const fit = homeFit(anchors, 360, 800, Math.min(anchors.friends.kapi.tap[1], anchors.props['kapi-kite']![1]));
  const scene = (stage: number) => renderToStaticMarkup(<LayoutBScene anchors={anchors} fit={fit} width={360} height={800} state={at(stage)} phase="day" onFriend={() => undefined} />);
  it('draws each corner’s parts from the stage it reaches, nothing before', () => {
    expect(scene(0).match(/class="courtyard-part"/g)).toBeNull();
    expect(scene(1).match(/class="courtyard-part"/g)).toHaveLength(6);
    expect(scene(5).match(/class="courtyard-part"/g)).toHaveLength(PROP_PARTS.length);
    expect(scene(3)).toContain('data-part="cot"');
    expect(scene(3)).not.toContain('data-part="gymFrame"');
    expect(scene(4)).toContain('data-part="gymFrame"');
    expect(scene(4)).not.toContain('data-part="medals"');
  });
  it('six friends at their foot points and six taps; the count fixtures follow the counts', () => {
    const html = scene(5);
    expect(html.match(/class="courtyard-b-friend"/g)).toHaveLength(6);
    expect(html.match(/class="courtyard-friend-tap"/g)).toHaveLength(6);
    expect(html).toContain('data-lanterns="2"');
    expect(html).toContain('data-toran="3"');
  });

  it('§0.14: one tag per keepsake on the bole (no letters), a peg-board only from the 12th, a tap each', () => {
    const tag = (i: number) => ({ campId: `camp-${i}`, campName: `Camp ${i}`, landmarkId: `mark-${i}`, motif: ['river', 'meadow', 'glacier', 'pass'][i % 4]!, index: i, reachedOn: '2026-11-01' });
    const html = (count: number) => renderToStaticMarkup(<LayoutBScene anchors={anchors} fit={fit} width={360} height={800} state={at(5)} phase="day" onFriend={() => undefined}
      keepsakes={Array.from({ length: count }, (_, i) => tag(i))} onKeepsake={() => undefined} />);
    const four = html(4);
    expect(four.match(/class="courtyard-keepsake"/g)).toHaveLength(4);
    expect(four.match(/data-on="trunk"/g)).toHaveLength(4);
    expect(four).not.toContain('courtyard-pegboard');
    expect(four.match(/class="courtyard-keepsake-tap"/g)).toHaveLength(4);
    expect(four).toContain('aria-label="Keepsake from Camp 0"');
    // No text inside the art: the camp name lives only on the button and in the caption.
    expect(four.match(/<text/g)).toBeNull();
    const many = html(13);
    expect(many).toContain('courtyard-pegboard');
    expect(many.match(/data-on="board"/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it('evening and night: the tint, then the lights glowing where their parts stand; daytime has none', () => {
    const night = renderToStaticMarkup(<LayoutBScene anchors={anchors} fit={fit} width={360} height={800} state={at(5)} phase="night" onFriend={() => undefined} />);
    expect(night).toContain('courtyard-b-glow');
    expect(night).toContain('courtyard-flicker');
    expect(night).toContain('courtyard-twinkle');
    expect(scene(5)).not.toContain('courtyard-b-glow');
  });

  it('frame mode (wide screens): the wall band repeats across the visible width', () => {
    const wide = homeFit(anchors, 1280, 800, Math.min(anchors.friends.kapi.tap[1], anchors.props['kapi-kite']![1]));
    const html = renderToStaticMarkup(<LayoutBScene anchors={anchors} fit={wide} width={1280} height={800} state={at(3)} phase="day" onFriend={() => undefined} />);
    expect(wide.mode).toBe('frame');
    expect(html.match(/translate\((-?\d+) 0\)"><rect y="80"/g)).toHaveLength(7);
  });
});

