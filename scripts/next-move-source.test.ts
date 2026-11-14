import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Spec 52 gate 2: Home gets its move from one loader and one function. Jenil 14 Nov: the Pause card names no move now
// (its "Not now" lands on Home, where the move is), so it no longer reads the loader.
describe('spec 52: one next move', () => {
  it('Home reads the loader; the Pause card does not; nothing else calls nextMove, and pauseNextMove is gone', () => {
    const files: string[] = [];
    const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) files.push(path); } };
    walk('src');
    const read = (path: string) => readFileSync(path, 'utf8');
    expect(files.filter(path => /pauseNextMove/.test(read(path)))).toEqual([]);
    expect(files.filter(path => /\bnextMove\(/.test(read(path))).map(path => path.replaceAll('\\', '/')).sort()).toEqual(['src/core/nextMove.ts', 'src/ui/yatra/nextMoveRows.ts']);
    expect(read('src/ui/yatra/Yatra.tsx')).toMatch(/import \{ readNextMove \} from '\.\/nextMoveRows'/);
    expect(read('src/ui/pause/PauseCard.tsx')).not.toMatch(/nextMoveRows|readNextMove|moveLine/);
  });
});
