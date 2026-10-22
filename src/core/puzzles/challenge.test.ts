import { afterEach, describe, expect, it, vi } from 'vitest';
import PZ from '.';
import { dailyBoard, featuredSpec, friendBoard } from './daily';
import { challengeRoute, challengeUrl, parseChallenge, type Challenge } from './challenge';
import { canonicalRoute } from '../../ui/shell/router';

const linkFor = (day: string, linkDay: string | null = day): Challenge => {
  const board = dailyBoard(day)!;
  return { type: board.type, diff: board.diff, seed: Number(board.seed), ...(linkDay ? { day: linkDay } : {}) };
};

afterEach(() => { vi.restoreAllMocks(); });

describe('challenge a friend', () => {
  it('rebuilds the identical daily board from the link', () => {
    for (const day of ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']) {
      const board = dailyBoard(day)!;
      const parsed = parseChallenge(challengeRoute({ type: board.type, diff: board.diff, seed: Number(board.seed), day }).slice('mind/'.length))!;
      expect(parsed.day, day).toBe(day);
      const again = PZ.generate(parsed.type, { seed: parsed.seed, diff: parsed.diff });
      expect(again?.solution, day).toEqual(board.solution);
      expect(JSON.stringify(again), day).toBe(JSON.stringify(board));
    }
  });
  it('builds a route the router accepts and rejects anything else', () => {
    const route = challengeRoute({ type: 'sunmoon', diff: 'hard', seed: 4_000_000_000, day: '2026-11-05' });
    expect(route).toBe('mind/challenge/20261105/sunmoon/hard/4000000000');
    expect(route).toMatch(/^[a-z0-9]+(?:\/[a-z0-9]+)*$/);
    expect(canonicalRoute(`#${route}`)).toBe(route);
    expect(challengeUrl({ type: 'calc', diff: 'easy', seed: 7 })).toBe('https://nandi.nandi11.workers.dev/#mind/challenge/calc/easy/7');
    expect(challengeUrl({ type: 'calc', diff: 'easy', seed: 7, day: '2026-11-05' })).toBe('https://nandi.nandi11.workers.dev/#mind/challenge/20261105/calc/easy/7');
    expect(parseChallenge('challenge/chess/easy/7')).toBeNull();
    expect(parseChallenge('challenge/calc/easy/99999999999')).toBeNull();
    expect(parseChallenge('board/calc/easy')).toBeNull();
    expect(parseChallenge('challenge/20261331/calc/easy/7')).toBeNull();
    expect(parseChallenge('challenge/20260230/calc/easy/7')).toBeNull();
    expect(parseChallenge('challenge/20261105/chess/easy/7')).toBeNull();
  });
  it('keeps reading old links without a day', () => {
    expect(parseChallenge('challenge/crowns/medium/797416356')).toEqual({ type: 'crowns', diff: 'medium', seed: 797416356 });
    expect(parseChallenge('challenge/20261105/crowns/medium/797416356')).toEqual({ type: 'crowns', diff: 'medium', seed: 797416356, day: '2026-11-05' });
  });
});

describe("a friend's link to today's board (spec 19 D)", () => {
  const today = '2026-11-05';
  it("today's day with today's generated seed opens as the daily board", () => {
    const opened = friendBoard(linkFor(today), today);
    expect(opened.daily).toBe(true);
    expect(JSON.stringify(opened.board)).toBe(JSON.stringify(dailyBoard(today)));
  });
  it("yesterday's link, a wrong seed, or an old link without a day stays practice (same board as the link)", () => {
    const yesterday = linkFor('2026-11-04');
    expect(friendBoard(yesterday, today).daily).toBe(false);
    expect(JSON.stringify(friendBoard(yesterday, today).board)).toBe(JSON.stringify(dailyBoard('2026-11-04')));
    // Yesterday's board relabelled as today's: the seed check still says practice.
    expect(friendBoard({ ...yesterday, day: today }, today).daily).toBe(false);
    expect(friendBoard({ ...linkFor(today), seed: linkFor(today).seed + 1 }, today).daily).toBe(false);
    expect(friendBoard(linkFor(today, null), today).daily).toBe(false);
    // Today's link opened tomorrow is practice too.
    expect(friendBoard(linkFor(today), '2026-11-06').daily).toBe(false);
  });
  it('a board that needed seed retries still matches, on the retried seed only', () => {
    const { type, diff } = featuredSpec(today);
    const first = PZ.hash(`daily:${today}:${type}:${diff}`) >>> 0;
    const generate = PZ.generate.bind(PZ);
    // The first attempt builds no board, so dailyBoard moves on to its next seed.
    vi.spyOn(PZ, 'generate').mockImplementation((kind, options) => options.seed === first ? null : generate(kind, options));
    const board = dailyBoard(today)!;
    expect(Number(board.seed)).toBe((first + 7919) >>> 0);
    expect(friendBoard({ type, diff, seed: Number(board.seed), day: today }, today).daily).toBe(true);
    expect(friendBoard({ type, diff, seed: first, day: today }, today).daily).toBe(false);
  });
});
