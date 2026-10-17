// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { pendingWrites } from '../core/pendingWrites';
import { saveAutoBackup } from '../platform/files';
import { recordError } from '../ui/errorRing';
import { runAutoBackup } from './autoBackup';
import { db } from './db';

vi.mock('../platform/files', () => ({ saveAutoBackup: vi.fn() }));
vi.mock('../ui/errorRing', () => ({ recordError: vi.fn() }));

beforeEach(async () => {
  vi.resetAllMocks();
  vi.setSystemTime(new Date(2026, 9, 17, 9, 12));
  await Promise.all(db.tables.map(table => table.clear()));
});
afterEach(() => vi.useRealTimers());

describe('APK automatic backup', () => {
  it('writes the same envelope as manual export once per day', async () => {
    vi.mocked(saveAutoBackup).mockResolvedValue(7);
    const saved = await runAutoBackup();
    expect(saved.lastSavedDay).toBe('2026-10-17');
    expect(saved.kept).toBe(7);
    const file = vi.mocked(saveAutoBackup).mock.calls[0]?.[0];
    expect(file?.name).toBe('nandi-auto-2026-10-17.json');
    expect(JSON.parse(await file!.text())).toMatchObject({ app: 'nandi', ppFormatVersion: 2 });
    await runAutoBackup();
    expect(saveAutoBackup).toHaveBeenCalledTimes(1);
  });

  it('waits while tracked writes are pending and logs failures for a later open', async () => {
    vi.mocked(saveAutoBackup).mockRejectedValue(new Error('disk full'));
    pendingWrites.increment();
    try { await runAutoBackup(); expect(saveAutoBackup).not.toHaveBeenCalled(); }
    finally { pendingWrites.decrement(); }
    const failed = await runAutoBackup();
    expect(failed.failureStreak).toBe(1);
    expect(recordError).toHaveBeenCalledWith('promise', expect.any(Error));
    vi.mocked(saveAutoBackup).mockResolvedValue(1);
    const recovered = await runAutoBackup();
    expect(recovered.failureStreak).toBe(0);
  });

  it('lets Back up now run after an automatic save already in progress', async () => {
    let finish!: (kept: number) => void;
    vi.mocked(saveAutoBackup).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue(1);
    const automatic = runAutoBackup();
    while (!vi.mocked(saveAutoBackup).mock.calls.length) await new Promise(resolve => setTimeout(resolve, 0));
    const manual = runAutoBackup(true);
    finish(1);
    await Promise.all([automatic, manual]);
    expect(saveAutoBackup).toHaveBeenCalledTimes(2);
  });
});
