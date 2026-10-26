import type { CastName } from './cast/Cast';

/**
 * Spec 25 "one look per friend" (version C, Jenil approved 24 Oct). Each area has one colour, a friend on a stage at the
 * top of its tab, a gentle tint behind the screen, and its own main button. This file is the one source of the numbers;
 * areas.css carries the same values (a test keeps the two in step) and areas.test.ts checks every contrast pair.
 * Decisions 2-4 use the recommended defaults: idea checks in Moti's rose, shop themes change only the neutrals, Train
 * in leaf green. Each is one line here to change.
 */
export type Area = 'plan' | 'train' | 'learn' | 'review' | 'mind' | 'night';
export type AreaTheme = { area: string; tint: string; button: string; onButton: string };

export const AREAS: readonly Area[] = ['plan', 'train', 'learn', 'review', 'mind', 'night'];

export const AREA_PALETTE: Record<'light' | 'dark', { ink: string; surface: string } & Record<Area, AreaTheme>> = {
  light: {
    ink: '#1F1B16', surface: '#FFFCF6',
    plan: { area: '#7E5300', tint: '#FBF3DF', button: '#7E5300', onButton: '#FFFFFF' },
    train: { area: '#2E6A38', tint: '#EEF5EC', button: '#2E6A38', onButton: '#FFFFFF' },
    learn: { area: '#0F6E61', tint: '#E8F4F1', button: '#0F6E61', onButton: '#FFFFFF' },
    review: { area: '#9B2E50', tint: '#FBEEF1', button: '#9B2E50', onButton: '#FFFFFF' },
    mind: { area: '#6950AA', tint: '#F1EEFB', button: '#6950AA', onButton: '#FFFFFF' },
    night: { area: '#4B57A8', tint: '#EEF0FB', button: '#4B57A8', onButton: '#FFFFFF' },
  },
  dark: {
    ink: '#F4F0E8', surface: '#16171C',
    plan: { area: '#FAD27A', tint: '#17150F', button: '#FAD27A', onButton: '#1A1206' },
    train: { area: '#8FD39B', tint: '#101611', button: '#8FD39B', onButton: '#0D1F10' },
    learn: { area: '#5FD4C0', tint: '#0E1615', button: '#5FD4C0', onButton: '#062320' },
    review: { area: '#F59AB4', tint: '#181014', button: '#F59AB4', onButton: '#2A0B16' },
    mind: { area: '#B39DFF', tint: '#13121A', button: '#B39DFF', onButton: '#1A1033' },
    night: { area: '#9FA8FF', tint: '#111220', button: '#9FA8FF', onButton: '#12153A' },
  },
};

/**
 * The stage behind each friend: the same in both themes, because the friends keep fixed colours. Light behind a dark
 * friend, deep behind a light one, at 3:1 or more against the friend's body colour (Cast.tsx). `captionInk` is the text
 * colour for a caption on the stage; `rim` adds a light outline on a deep stage.
 */
export const STAGES: Record<Area, { friend: CastName; stage: string; body: string; captionInk: string; rim: boolean }> = {
  plan: { friend: 'Mor', stage: '#FAD27A', body: '#1e5fb4', captionInk: '#1F1B16', rim: false },
  train: { friend: 'Nandi', stage: '#357A42', body: '#fbf5ea', captionInk: '#FFFFFF', rim: true },
  learn: { friend: 'Chiku', stage: '#0B3F3A', body: '#a9876c', captionInk: '#FFFFFF', rim: true },
  review: { friend: 'Moti', stage: '#7A2440', body: '#a6b8d0', captionInk: '#FFFFFF', rim: true },
  mind: { friend: 'Kapi', stage: '#E4DDFF', body: '#9a6a48', captionInk: '#1F1B16', rim: false },
  night: { friend: 'Kachhua', stage: '#AEB6FF', body: '#4a3324', captionInk: '#1F1B16', rim: false },
};

/** Which area a route belongs to; You has none and stays neutral. */
export function areaOf(path: string): Area | undefined {
  const root = path.split('/')[0];
  if (root === 'night') return 'night';
  return root === 'plan' || root === 'train' || root === 'learn' || root === 'mind' ? root : undefined;
}

const channel = (value: number) => { const v = value / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(index => channel(parseInt(hex.slice(index, index + 2), 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
/** WCAG 2.2 contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/**
 * The per-theme colour variables as one CSS string (the same theme selectors as theme.css), so areas.ts stays the only
 * place the numbers live. App adds it once as a <style> element; areas.css maps them to --area, --button and so on.
 */
export function areaTokenCss(): string {
  const block = (theme: 'light' | 'dark') => AREAS.map(area => {
    const look = AREA_PALETTE[theme][area];
    return `--${area}-area: ${look.area}; --${area}-tint: ${look.tint}; --${area}-button: ${look.button}; --${area}-on: ${look.onButton};`;
  }).join(' ');
  const stages = AREAS.map(area => `--${area}-stage: ${STAGES[area].stage}; --${area}-stage-ink: ${STAGES[area].captionInk};`).join(' ');
  // The night deck is dark in both themes, so Night always takes its dark values (Codex B item 123: a light-theme
  // indigo on the dark deck read at 2.7:1).
  const deck = AREA_PALETTE.dark.night;
  const night = `--night-deck-area: ${deck.area}; --night-deck-button: ${deck.button}; --night-deck-on: ${deck.onButton};`;
  return [
    `:root, :root[data-theme='dark'] { ${block('dark')} ${stages} ${night} }`,
    `@media (prefers-color-scheme: light) { :root:not([data-theme='dark']) { ${block('light')} } }`,
    `:root[data-theme='light'] { ${block('light')} }`,
  ].join('\n');
}
