import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import raw from './anchors.json';
import { parseAnchors, stageFit } from '../../core/courtyard/anchors';
import { AREAS, type AreaState } from '../../core/courtyard/courtyard';
import { HomeCard, SWIPE_PX, swipeTo } from './HomeCard';
import { friendLabel, StageFriends } from './StageFriends';

// Spec 571 §0.19 layout B (stage 2 commit 3): the bottom card and the six tap targets, before the art is wired.
const anchors = parseAnchors(raw);
const areas: AreaState[] = AREAS.map((area, i) => ({ id: area.id, friend: area.friend, label: area.label, practice: area.practice, days: i, stage: 1, today: i % 2 === 0, week: 0, nextAt: null, nextObject: null } as unknown as AreaState));

describe('the bottom card', () => {
  it('a swipe up past the threshold opens it, down closes it, a short drag changes nothing', () => {
    expect(swipeTo(false, -SWIPE_PX)).toBe(true);
    expect(swipeTo(true, SWIPE_PX)).toBe(false);
    expect(swipeTo(false, -SWIPE_PX + 1)).toBe(false);
    expect(swipeTo(true, SWIPE_PX - 1)).toBe(true);
    expect(swipeTo(true, -200)).toBe(true);
  });

  it('collapsed: the handle (a button too) and the next move; the rest is hidden until opened', () => {
    const closed = renderToStaticMarkup(<HomeCard expanded={false} onExpanded={() => undefined} next={<p>NEXT</p>} rest={<p>WEEK</p>} />);
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain('aria-label="Show this week and your crew"');
    expect(closed).toContain('NEXT');
    expect(closed).toMatch(/id="courtyard-card-more"[^>]*hidden=""/);
    const open = renderToStaticMarkup(<HomeCard expanded onExpanded={() => undefined} next={<p>NEXT</p>} rest={<p>WEEK</p>} />);
    expect(open).toContain('aria-expanded="true"');
    expect(open).not.toMatch(/id="courtyard-card-more"[^>]*hidden/);
  });
});

describe('the six friends’ taps', () => {
  it('one button per friend at its anchor tap rect, labelled with its area and days; a glow where done today', () => {
    const fit = stageFit(anchors, 360, 840);
    const html = renderToStaticMarkup(<StageFriends anchors={anchors} fit={fit} areas={areas} onFriend={() => undefined} />);
    expect(html.match(/class="courtyard-friend-tap"/g)).toHaveLength(6);
    for (const area of areas) expect(html).toContain(`aria-label="${friendLabel(area)}"`);
    expect(html.match(/courtyard-today-glow/g)).toHaveLength(areas.filter(area => area.today).length);
    // Mor's tap at 360 × 840 is its canvas rect / 3.
    const [x, y] = anchors.friends.mor.tap.map(v => v / 3);
    expect(html).toMatch(new RegExp(`data-area="plan"[^>]*style="left:${x!.toFixed(3).slice(0, 5)}`));
    expect(html).toContain(`top:${y!.toString().slice(0, 6)}`);
  });
});
