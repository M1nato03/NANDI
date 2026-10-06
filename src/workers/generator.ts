import PZ, { type PuzzleBoard, type PuzzleType } from '../core/puzzles';
import CaseGen, { type MysteryCase } from '../core/mysteries';

export const puzzleTypes: PuzzleType[] = ['sudoku', 'crowns', 'sunmoon', 'path', 'calc'];
export interface GeneratorResult {
  boards: Array<{ type: PuzzleType; name: string; board: PuzzleBoard | null }>;
  case: MysteryCase | null;
}

export function generateCheck(day: string): GeneratorResult {
  const boards = puzzleTypes.map(type => ({
    type, name: PZ.TYPES[type].name,
    board: PZ.generate(type, { seed: PZ.hash(`${day}:${type}`), diff: 'easy' }),
  }));
  return { boards, case: CaseGen.daily(day) };
}

export function boardText(board: PuzzleBoard): string {
  const size = board.type === 'path' ? board.C : board.type === 'sunmoon' ? 6 : board.N;
  const cells = board.type === 'sudoku' ? board.givens.map(value => value || '·')
    : board.type === 'sunmoon' ? board.given.map(value => value < 0 ? '·' : value ? 'S' : 'M')
      : board.type === 'crowns' ? board.region.map(value => String.fromCharCode(65 + value))
        : board.type === 'path' ? Array.from({ length: board.R * board.C }, (_, index) => {
          const waypoint = board.waypoints.indexOf(index);
          return waypoint < 0 ? '·' : String(waypoint + 1);
        })
          : Array.from({ length: board.N * board.N }, (_, index) => {
            const cage = board.cages.find(item => item.cells[0] === index);
            return cage ? String(cage.target) : '·';
          });
  return Array.from({ length: Math.ceil(cells.length / size) }, (_, row) =>
    cells.slice(row * size, (row + 1) * size).map(cell => String(cell).padStart(2, ' ')).join(' ')).join('\n');
}
