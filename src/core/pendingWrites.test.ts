import { describe, expect, it } from 'vitest';
import { pendingWrites, trackWrite } from './pendingWrites';

describe('trackWrite', () => {
  it('counts an in-flight write and clears it on success', async () => {
    let finish!: (value: number) => void;
    const result = trackWrite(() => new Promise<number>(resolve => { finish = resolve; }));
    expect(pendingWrites.count).toBe(1);
    finish(42);
    await expect(result).resolves.toBe(42);
    expect(pendingWrites.count).toBe(0);
  });

  it('clears the count when a write fails', async () => {
    expect(pendingWrites.count).toBe(0);
    await expect(trackWrite(async () => { throw new Error('write failed'); })).rejects.toThrow('write failed');
    expect(pendingWrites.count).toBe(0);
  });
});
