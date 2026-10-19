// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { createDb } from '../db';
import { exportBackup, importBackup } from '../backup';
import { unlockTechnique } from './techniques';
import { techniqueId } from '../../core/puzzles/techniques';

it('unlocks once and survives backup restore', async () => {
  const db = createDb('technique-test');
  try {
    expect(await unlockTechnique(db, 'sudoku', 'Naked single', 1000)).toBe(true);
    expect(await unlockTechnique(db, 'sudoku', 'Naked single', 1001)).toBe(false);
    const backup = await exportBackup(db, 2000);
    await db.unlocks.clear();
    await importBackup(db, backup);
    expect(await db.unlocks.get(techniqueId('sudoku', 'Naked single'))).toMatchObject({ kind: 'technique' });
  } finally { await db.delete(); }
});
