import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AREA_PALETTE, AREAS, contrast } from '../areas';
import { RingGlyph } from './TodayRings';

// Spec 571 §0.20 header rings: what each state draws, and the knock-out contrast (≥3:1, light and dark).
const rings = { yatra: 'task1', body: 'workout' as const, mind: ['chapter' as const, 'calm' as const] };

describe('ring glyphs', () => {
  it('lit: a filled ring with its marks knocked out; closed Mind shows its two marks at 9 CSS in the order done', () => {
    const yatra = renderToStaticMarkup(<RingGlyph name="yatra" rings={rings} night={false} />);
    expect(yatra).toContain('data-state="done"');
    expect(yatra).toContain('class="ring-fill"');
    expect(yatra).toContain('ring-mark-feather');
    const body = renderToStaticMarkup(<RingGlyph name="body" rings={rings} night={false} />);
    expect(body).toContain('ring-mark-dumbbell');
    const mind = renderToStaticMarkup(<RingGlyph name="mind" rings={rings} night={false} />);
    expect(mind).toContain('ring-marks two');
    expect(mind.indexOf('ring-mark-book')).toBeLessThan(mind.indexOf('ring-mark-leaf'));
    expect(mind.match(/width="9"/g)).toHaveLength(2);
  });

  it('half: the left half of the ring and one centred mark; unlit: the track only, never a ghost mark', () => {
    const half = renderToStaticMarkup(<RingGlyph name="mind" rings={{ ...rings, mind: ['board'] }} night={false} />);
    expect(half).toContain('data-state="half"');
    expect(half).toContain('class="ring-half"');
    expect(half).not.toContain('class="ring-fill"');
    expect(half.match(/ring-mark-grid/g)).toHaveLength(1);
    const none = renderToStaticMarkup(<RingGlyph name="yatra" rings={{ ...rings, yatra: null }} night={false} />);
    expect(none).toContain('data-state="none"');
    expect(none).not.toContain('ring-mark');
    expect(none).not.toContain('ring-fill');
  });

  it('night: every ring shows the moon and hides what lit it', () => {
    for (const name of ['yatra', 'body', 'mind'] as const) {
      const markup = renderToStaticMarkup(<RingGlyph name={name} rings={rings} night />);
      expect(markup).toContain('ring-mark-moon');
      expect(markup).not.toMatch(/ring-mark-(feather|dumbbell|book|leaf)/);
      expect(markup).not.toContain('ring-fill');
    }
  });
});

describe('ring contrast (≥3:1 for the ring, its track and its knocked-out marks)', () => {
  // The economy themes swap the surface (theme.css linen / lagoon); the rings keep the spec 25 area tokens.
  const surfaces = { dark: [AREA_PALETTE.dark.surface, '#231f1a', '#122630'], light: [AREA_PALETTE.light.surface, '#fffaf0', '#f7fffd'] };
  const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  for (const theme of ['dark', 'light'] as const) {
    for (const area of ['plan', 'train', 'learn'] as const) it(`${theme} ${area}`, () => {
      const colour = AREA_PALETTE[theme][area].area;
      // The top bar is the surface at 92% over the area tint (redesign.css .topbar), for every area tint and economy theme.
      for (const surface of surfaces[theme]) for (const tintArea of AREAS) {
        const bar = mix(surface, AREA_PALETTE[theme][tintArea].tint, 0.08);
        expect(contrast(colour, bar), `${surface} over ${tintArea}`).toBeGreaterThanOrEqual(3);
        // Marks are knocked out in the surface colour.
        expect(contrast(colour, surface), surface).toBeGreaterThanOrEqual(3);
      }
    });
  }
});
