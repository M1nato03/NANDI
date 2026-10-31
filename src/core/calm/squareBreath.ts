/**
 * Spec 45a: the square breath. With holds: in 5 s, hold 5 s, out 5 s, hold 5 s (20 s a round). Without: in 5 s, out 6 s
 * (11 s a round), on the square's top and bottom sides only. Everything here is read from the time since the breath
 * began, so a phone that slept or a page that came back never replays old ticks.
 */
export type SquareKind = 'in' | 'hold' | 'out' | 'hold-out';
export type SquarePhase = { kind: SquareKind; label: string; seconds: number; side: 0 | 1 | 2 | 3 };

const WITH_HOLDS: readonly SquarePhase[] = [
  { kind: 'in', label: 'Breathe in', seconds: 5, side: 0 },
  { kind: 'hold', label: 'Hold', seconds: 5, side: 1 },
  { kind: 'out', label: 'Breathe out', seconds: 5, side: 2 },
  { kind: 'hold-out', label: 'Hold', seconds: 5, side: 3 },
];
const NO_HOLDS: readonly SquarePhase[] = [
  { kind: 'in', label: 'Breathe in', seconds: 5, side: 0 },
  { kind: 'out', label: 'Breathe out', seconds: 6, side: 2 },
];

export const phasesFor = (holds: boolean): readonly SquarePhase[] => holds ? WITH_HOLDS : NO_HOLDS;
export const roundMs = (holds: boolean): number => phasesFor(holds).reduce((sum, phase) => sum + phase.seconds * 1000, 0);

/** One cue a round, in this order. */
export const BODY_CUES = [
  'Let your tongue rest on the roof of your mouth.',
  'Let your shoulders drop.',
  'Sit tall, or lean back. Whichever is easier.',
  'Unclench your jaw. Soften your hands.',
] as const;
export const cueFor = (round: number): string => BODY_CUES[((round % BODY_CUES.length) + BODY_CUES.length) % BODY_CUES.length]!;

export type SquareMoment = { round: number; index: number; phase: SquarePhase; intoMs: number; count: number };
/** Where the breath is `elapsedMs` after it began: the round, the phase, how far into it, and the 5…1 count. */
export function squareAt(elapsedMs: number, holds: boolean): SquareMoment {
  const phases = phasesFor(holds), round = roundMs(holds);
  const at = Math.max(0, elapsedMs);
  let into = at % round, index = 0;
  while (into >= phases[index]!.seconds * 1000) { into -= phases[index]!.seconds * 1000; index++; }
  const phase = phases[index]!;
  return { round: Math.floor(at / round), index, phase, intoMs: into, count: Math.max(1, Math.ceil((phase.seconds * 1000 - into) / 1000)) };
}

/** The opener: two rounds, then three seconds offering "One more round"; that one extra round, then it leaves. */
export const OPENER_ROUNDS = 2;
export const AGAIN_WINDOW_MS = 3000;
export type OpenerStage = { stage: 'breath'; breathMs: number; round: number } | { stage: 'again'; leftMs: number } | { stage: 'done' };
/**
 * `sinceMs`: time since the opener began; `extraFromMs`: when "One more round" was pressed (same clock), or null.
 * The extra round starts at the press, and its cue follows on from the first two.
 */
export function openerStage(sinceMs: number, holds: boolean, extraFromMs: number | null): OpenerStage {
  const round = roundMs(holds), first = OPENER_ROUNDS * round;
  if (extraFromMs !== null) {
    const extra = sinceMs - extraFromMs;
    return extra < round ? { stage: 'breath', breathMs: extra, round: OPENER_ROUNDS + squareAt(extra, holds).round } : { stage: 'done' };
  }
  if (sinceMs < first) return { stage: 'breath', breathMs: sinceMs, round: squareAt(sinceMs, holds).round };
  if (sinceMs < first + AGAIN_WINDOW_MS) return { stage: 'again', leftMs: first + AGAIN_WINDOW_MS - sinceMs };
  return { stage: 'done' };
}

/** You's choice: no opening breath, once a planning day (the default), or on every open. */
export type OpeningMode = 'off' | 'daily' | 'every';
export const OPENING_MODES: readonly OpeningMode[] = ['off', 'daily', 'every'];
/**
 * Whether this open shows the breath. `ordinary` is false for a link, a notification, the widget, a pending Pause card,
 * the first run or the night route: such an open is skipped and does not use up the day's breath.
 */
export function openerDue({ mode, today, lastShownDay, ordinary }: { mode: OpeningMode; today: string; lastShownDay: string | null; ordinary: boolean }): boolean {
  if (!ordinary || mode === 'off') return false;
  return mode === 'every' || lastShownDay !== today;
}
