import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MIND_ACTS } from '../../core/economy/daySlots';
import { bodyLine, mindLine, promiseTitle, RINGS_NIGHT_LINE, yatraLine } from '../../core/economy/ringLines';
import { BODY_MARK, MIND_MARK, RING_MARK_MAX_STROKES, RING_MARK_STROKE, RING_MARKS, RingMark, type RingMarkKind } from './RingMark';

// Spec 571 §0.20 §marks (jenil-a9, within Jenil's "they are perfect"): the tap lines and the marks, not wired yet.
describe('ring tap lines', () => {
  it('Mind closed: the 15 pairings, named in the order done (the spec list is the fixture)', () => {
    const lines: string[] = [];
    for (let i = 0; i < MIND_ACTS.length; i++) for (let j = i + 1; j < MIND_ACTS.length; j++) lines.push(mindLine([MIND_ACTS[i]!, MIND_ACTS[j]!]));
    expect(lines).toEqual([
      "Mind: today’s idea and a chapter.", "Mind: today’s idea and a Calm sit.", "Mind: today’s idea and a solved case.", "Mind: today’s idea and Kapi’s board.", "Mind: today’s idea and your cards.",
      'Mind: a chapter and a Calm sit.', 'Mind: a chapter and a solved case.', "Mind: a chapter and Kapi’s board.", 'Mind: a chapter and your cards.',
      'Mind: a Calm sit and a solved case.', "Mind: a Calm sit and Kapi’s board.", 'Mind: a Calm sit and your cards.',
      "Mind: a solved case and Kapi’s board.", 'Mind: a solved case and your cards.', "Mind: Kapi’s board and your cards.",
    ]);
    // The other order names them the other way round, and a third act changes nothing.
    expect(mindLine(['calm', 'chapter'])).toBe('Mind: a Calm sit and a chapter.');
    expect(mindLine(['calm', 'chapter', 'board'])).toBe('Mind: a Calm sit and a chapter.');
  });
  it('Mind unlit and half', () => {
    expect(mindLine([])).toBe('Mind: any two.');
    expect(mindLine(['chapter'])).toBe('Mind: a chapter. One more, a different one, closes it.');
    expect(mindLine(['drop'])).toBe("Mind: today’s idea. One more, a different one, closes it.");
  });
  it('Yatra names the promise kept, up to 28 characters; Body names the move; the night line', () => {
    expect(yatraLine(null)).toBe('Yatra: keep one promise.');
    expect(yatraLine('Call the bank')).toBe('Yatra: you kept a promise, Call the bank.');
    expect(promiseTitle('Finish the quarterly report draft for Monday')).toBe('Finish the quarterly report…');
    expect(promiseTitle('Finish the quarterly report draft for Monday').length).toBe(28);
    expect(promiseTitle('  Exactly   twenty-eight chars!  ')).toBe('Exactly twenty-eight chars!');
    expect(bodyLine('workout')).toBe('Body: a workout.');
    expect(bodyLine('walk')).toBe('Body: a rest walk.');
    expect(bodyLine(null)).toBe('Body: one real move.');
    expect(RINGS_NIGHT_LINE).toBe('Rings rest for the night.');
  });
});

describe('ring marks', () => {
  it('one mark per Mind act and per move, all different, each at most 4 strokes', () => {
    expect(Object.keys(MIND_MARK).sort()).toEqual([...MIND_ACTS].sort());
    const used = [...Object.values(MIND_MARK), ...Object.values(BODY_MARK), 'feather', 'moon'] as RingMarkKind[];
    expect(new Set(used).size).toBe(used.length);
    expect(Object.keys(RING_MARKS).sort()).toEqual([...used].sort());
    for (const [kind, shapes] of Object.entries(RING_MARKS)) {
      const strokes = shapes.reduce((sum, shape) => sum + ('d' in shape ? shape.d.split(/[Mm]/).filter(part => part.trim()).length : 1), 0);
      expect(strokes, kind).toBeLessThanOrEqual(RING_MARK_MAX_STROKES);
    }
  });
  it('draws at stroke 2.6 in the 24-unit box, decorative only', () => {
    for (const kind of Object.keys(RING_MARKS) as RingMarkKind[]) {
      const svg = renderToStaticMarkup(<RingMark kind={kind} />);
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain(`stroke-width="${RING_MARK_STROKE}"`);
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('width="10"');
    }
    expect(RING_MARK_STROKE).toBe(2.6);
  });
  it('b2 nits (8 Nov): the dumbbell has two rounded plates, not an "H"; the feather eye-spot holds at 10 CSS px', () => {
    expect(RING_MARKS.dumbbell).toHaveLength(3);
    expect(RING_MARKS.dumbbell.filter(shape => 'rect' in shape)).toEqual([{ rect: [4, 7.5, 3.5, 9, 1] }, { rect: [16.5, 7.5, 3.5, 9, 1] }]);
    const eye = RING_MARKS.feather.find(shape => 'circle' in shape) as { circle: [number, number, number] };
    expect(eye.circle[2]).toBe(2.4);
  });
});
