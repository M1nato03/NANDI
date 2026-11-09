import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import raw from './anchors.json';
import { parseAnchors, stageFit } from '../../core/courtyard/anchors';
import { nudgeAnchors } from '../../core/courtyard/nudges';
import { AREAS, type AreaState } from '../../core/courtyard/courtyard';
import { HomeCard, HomeCardRow, orderSections, SWIPE_PX, swipeTo } from './HomeCard';
import { friendLabel, StageFriends } from './StageFriends';

// Spec 571 §0.19 layout B (stage 2 commit 3): the bottom card and the six tap targets, before the art is wired.
// The anchors as the home uses them: the pass plus the layout-B nudges.
const anchors = nudgeAnchors(parseAnchors(raw));
const areas: AreaState[] = AREAS.map((area, i) => ({ id: area.id, friend: area.friend, label: area.label, practice: area.practice, days: i, stage: 1, today: i % 2 === 0, week: 0, nextAt: null, nextObject: null } as unknown as AreaState));

describe('the bottom card', () => {
  it('a swipe up past the threshold opens it, down closes it, a short drag changes nothing', () => {
    expect(swipeTo(false, -SWIPE_PX)).toBe(true);
    expect(swipeTo(true, SWIPE_PX)).toBe(false);
    expect(swipeTo(false, -SWIPE_PX + 1)).toBe(false);
    expect(swipeTo(true, SWIPE_PX - 1)).toBe(true);
    expect(swipeTo(true, -200)).toBe(true);
  });

  it('collapsed: the handle (a button too) and one row; the sheet is hidden until opened', () => {
    const sections = [{ id: 'week', node: <p>WEEK</p> }, { id: 'crew', node: <p>CREW</p> }];
    const closed = renderToStaticMarkup(<HomeCard expanded={false} onExpanded={() => undefined} row={<p>NEXT</p>} sections={sections} />);
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain('aria-label="Show this week and your crew"');
    expect(closed).toContain('NEXT');
    expect(closed).toMatch(/id="courtyard-card-more"[^>]*hidden=""/);
    const open = renderToStaticMarkup(<HomeCard expanded onExpanded={() => undefined} row={<p>NEXT</p>} sections={sections} />);
    expect(open).toContain('aria-expanded="true"');
    expect(open).not.toMatch(/id="courtyard-card-more"[^>]*hidden/);
  });

  it('spec 660 shape: the row is generic (friend, line, meta, one tap), and This week + the crew bar close the sheet', () => {
    const row = renderToStaticMarkup(<HomeCardRow row={{ friend: 'Chiku', line: 'Chiku has a quest', meta: '5 min', onOpen: () => undefined, kind: 'quest' }} />);
    expect(row).toContain('data-kind="quest"');
    expect(row).toContain('data-cast="Chiku"');
    expect(row).toContain('Chiku has a quest');
    expect(row).toContain('5 min');
    expect(orderSections([{ id: 'crew', node: null }, { id: 'board', node: null }, { id: 'week', node: null }, { id: 'extra', node: null }]).map(section => section.id))
      .toEqual(['board', 'extra', 'week', 'crew']);
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
