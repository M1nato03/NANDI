import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../data/db';
import { canShareNow } from '../data/repos/night';

const shareLink = vi.fn<(...args: unknown[]) => Promise<'shared'>>(async () => 'shared');
const shareOrDownload = vi.fn<(...args: unknown[]) => Promise<'shared'>>(async () => 'shared');
vi.mock('../platform/files', () => ({ shareLink: (...args: unknown[]) => shareLink(...args), shareOrDownload: (...args: unknown[]) => shareOrDownload(...args) }));
const { shareFileNow, shareNote, shareTextNow } = await import('./shareActions');

const at = (hour: number, minute = 0) => new Date(2026, 10, 5, hour, minute).getTime();
const bedtime = async (value: string) => db.settings.put({ key: 'planner.bedtime', value, updatedAt: 1, deleted: 0, deviceId: 'test' });

beforeEach(async () => { await Promise.all(db.tables.map(table => table.clear())); shareLink.mockClear(); shareOrDownload.mockClear(); });
afterEach(() => { vi.useRealTimers(); });

describe('bedtime gate on every share (spec 19)', () => {
  it('is open in the day and closed after shutdown and bedtime, using the saved bedtime', async () => {
    await bedtime('22:30');
    expect(await canShareNow(db, at(12))).toBe(true);
    expect(await canShareNow(db, at(22, 15))).toBe(false); // shutdown comes before bedtime and starts the wind-down
    expect(await canShareNow(db, at(23))).toBe(false);
    expect(await canShareNow(db, at(2))).toBe(false);
  });
  it('closes early when the person started wind-down by hand', async () => {
    await db.dailyLog.put({ dayKey: '2026-11-05', windDownAt: at(18), updatedAt: 1, deleted: 0, deviceId: 'test' });
    expect(await canShareNow(db, at(17))).toBe(true);
    expect(await canShareNow(db, at(19))).toBe(false);
  });
  it('a handler checks the clock again at tap time: a screen left open past bedtime sends nothing', async () => {
    let day = true;
    expect(await shareTextNow('NANDI 👑 Crowns', async () => day)).toBe('shared');
    day = false;
    expect(await shareTextNow('NANDI 👑 Crowns', async () => day)).toBe('night');
    const makeTile = vi.fn(async () => new File(['png'], 'tile.png', { type: 'image/png' }));
    expect(await shareFileNow(makeTile, 'text', {}, async () => day)).toBe('night');
    expect(shareLink).toHaveBeenCalledTimes(1);
    expect(makeTile).not.toHaveBeenCalled();
    expect(shareOrDownload).not.toHaveBeenCalled();
    expect(shareNote('night')).toBe('Sharing waits for the morning.');
  });
  it('the real gate reads the clock and bedtime at tap time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await bedtime('23:00');
    vi.setSystemTime(at(23, 50));
    expect(await shareTextNow('text')).toBe('night');
    vi.setSystemTime(at(11));
    expect(await shareTextNow('text')).toBe('shared');
    expect(shareLink).toHaveBeenCalledTimes(1);
  });
  it('sharing writes nothing: no XP, Shards, badge, ledger fact or count', async () => {
    const before = await Promise.all(db.tables.map(table => table.count()));
    await shareTextNow('text', async () => true);
    await shareFileNow(new File(['png'], 'tile.png', { type: 'image/png' }), 'text', {}, async () => true);
    expect(await Promise.all(db.tables.map(table => table.count()))).toEqual(before);
  });
});
