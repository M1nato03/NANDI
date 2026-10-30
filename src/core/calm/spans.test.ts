import { describe, expect, it } from 'vitest';
import { playedMs, readJournal, sitOver, type CalmEvent } from './spans';

const MIN = 60_000;
const at = (minutes: number) => 1_000_000 + minutes * MIN;
const event = (type: CalmEvent['type'], minutes: number, reason?: string): CalmEvent => ({ type, at: at(minutes), ...(reason ? { reason } : {}) });

describe('spec 38 honest minutes: only playing spans count', () => {
  it('a sit that ran straight through counts its length', () => {
    expect(playedMs([event('started', 0), event('ended', 10)], at(12), 10 * MIN)).toBe(10 * MIN);
  });
  it('a pause (the person, or a call) takes its time out; the call itself never counts', () => {
    const journal = [event('started', 0), event('paused', 3, 'call'), event('resumed', 9), event('ended', 16)];
    expect(playedMs(journal, at(20), 10 * MIN)).toBe(10 * MIN);
    expect(playedMs([event('started', 0), event('paused', 3, 'user'), event('stopped', 30)], at(30))).toBe(3 * MIN);
  });
  it('a sit still playing counts up to now; a sound that would not play ends the span', () => {
    expect(playedMs([event('started', 0)], at(4))).toBe(4 * MIN);
    expect(playedMs([event('started', 0), event('paused', 0, 'decode'), event('stopped', 5)], at(5))).toBe(0);
  });
  it('bells change nothing; the length caps the count; a sit is over once ended or stopped', () => {
    const journal = [event('started', 0), event('bell', 5), event('ended', 11)];
    expect(playedMs(journal, at(11), 10 * MIN)).toBe(10 * MIN);
    expect(sitOver(journal)).toBe(true);
    expect(sitOver([event('started', 0), event('paused', 2)])).toBe(false);
  });
  it('reads only well-formed events', () => {
    expect(readJournal([{ type: 'started', at: 5 }, { type: 'odd', at: 6 }, { type: 'ended' }, null])).toEqual([{ type: 'started', at: 5 }]);
  });
});
