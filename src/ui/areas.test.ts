import { describe, expect, it } from 'vitest';
import { AREA_PALETTE, AREAS, areaOf, areaTokenCss, contrast, STAGES } from './areas';

// Spec 25 gate: every area pair in both themes. Text 4.5, button text 4.5, friend body against its stage 3.0.
const secondaryInk = { light: '#4D463C', dark: '#C9C3B8' } as const;

describe('area looks (spec 25)', () => {
  for (const theme of ['light', 'dark'] as const) for (const area of AREAS) {
    const palette = AREA_PALETTE[theme];
    const look = palette[area];
    it(`${theme} ${area}: text, labels and the main button read at 4.5:1 or more`, () => {
      expect(contrast(palette.ink, look.tint)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(secondaryInk[theme], look.tint)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(look.area, look.tint)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(look.area, palette.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(look.onButton, look.button)).toBeGreaterThanOrEqual(4.5);
    });
  }
  for (const area of AREAS) it(`${area}: the friend stands out on its stage (3:1) and a caption reads (4.5:1)`, () => {
    const stage = STAGES[area];
    expect(contrast(stage.body, stage.stage)).toBeGreaterThanOrEqual(3);
    expect(contrast(stage.captionInk, stage.stage)).toBeGreaterThanOrEqual(4.5);
    // A deep stage gets a light rim so the friend's dark outline still reads.
    expect(stage.rim).toBe(contrast('#FFFFFF', stage.stage) > contrast('#1F1B16', stage.stage));
  });
  it('the token CSS carries every number from the palette, light in both light selectors', () => {
    const css = areaTokenCss();
    const [dark, media, light] = css.split('\n');
    for (const area of AREAS) {
      for (const [theme, text] of [['dark', dark], ['light', media], ['light', light]] as const) {
        const look = AREA_PALETTE[theme][area];
        expect(text, `${theme} ${area}`).toContain(`--${area}-area: ${look.area}; --${area}-tint: ${look.tint}; --${area}-button: ${look.button}; --${area}-on: ${look.onButton};`);
      }
      expect(dark).toContain(`--${area}-stage: ${STAGES[area].stage};`);
    }
  });
  it('Night always uses its dark values, so overlays on the dark deck read at 4.5:1 in either theme (Codex B item 123)', () => {
    const night = AREA_PALETTE.dark.night;
    for (const surface of ['#0B0D16', '#131726', '#1A1F33']) expect(contrast(night.area, surface), surface).toBeGreaterThanOrEqual(4.5);
    expect(contrast(night.onButton, night.button)).toBeGreaterThanOrEqual(4.5);
    expect(areaTokenCss().split('\n')[0]).toContain(`--night-deck-area: ${night.area};`);
  });
  it('maps routes to areas; You stays neutral', () => {
    expect(['plan', 'train/workout', 'learn/drop', 'mind/board/sudoku/easy', 'night', 'you', 'you/backup'].map(areaOf)).toEqual(['plan', 'train', 'learn', 'mind', 'night', undefined, undefined]);
  });
});
