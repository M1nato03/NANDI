import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Spec 52 gate 2: Home and the Pause card get their move from one loader and one function.
describe('spec 52: one next move', () => {
  it('Home and the Pause card both read the loader; nothing else calls nextMove, and pauseNextMove is gone', () => {
    const files: string[] = [];
    const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) files.push(path); } };
    walk('src');
    const read = (path: string) => readFileSync(path, 'utf8');
    expect(files.filter(path => /pauseNextMove/.test(read(path)))).toEqual([]);
    expect(files.filter(path => /\bnextMove\(/.test(read(path))).map(path => path.replaceAll('\\', '/')).sort()).toEqual(['src/core/nextMove.ts', 'src/ui/yatra/nextMoveRows.ts']);
    for (const screen of ['src/ui/yatra/Yatra.tsx', 'src/ui/pause/PauseCard.tsx']) expect(read(screen)).toMatch(/import \{ readNextMove \} from '\.\/nextMoveRows'|import \{ readNextMove \} from '\.\.\/yatra\/nextMoveRows'/);
  });
});
