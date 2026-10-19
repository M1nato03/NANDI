import type { PuzzleRunRow } from '../../data/types';

export function shareText(run: Pick<PuzzleRunRow, 'type' | 'diff' | 'solveMs' | 'hintsUsed'>, name: string): string {
  const seconds = Math.round((run.solveMs ?? 0) / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const difficulty = (run.diff ?? 'easy').replace(/^./, letter => letter.toUpperCase());
  const hints = run.hintsUsed ?? 0;
  return `NANDI · ${name} (${difficulty}) · ${time} · ${hints ? `${hints} hint${hints === 1 ? '' : 's'}` : 'no hints'}`;
}

export async function shareTile(run: Pick<PuzzleRunRow, 'type' | 'diff' | 'solveMs' | 'hintsUsed'>, name: string): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = 600;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Share tile is unavailable.');
  context.fillStyle = '#0E0F12'; context.fillRect(0, 0, 900, 600);
  context.fillStyle = '#7CC4FF'; context.font = 'bold 34px sans-serif'; context.fillText('NANDI  ·  MIND', 70, 95);
  context.fillStyle = '#F4F0E8'; context.font = 'bold 72px sans-serif'; context.fillText(name, 70, 230);
  context.font = '36px sans-serif'; context.fillText((run.diff ?? 'easy').toUpperCase(), 70, 300);
  context.fillStyle = '#C9C3B8'; context.font = '32px sans-serif';
  const details = shareText(run, name).split(' · ').slice(2).join('   ·   ');
  context.fillText(details, 70, 420);
  context.fillStyle = '#7CC4FF'; context.fillRect(70, 492, 760, 5);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not make share tile.')), 'image/png'));
  return new File([blob], `nandi-${run.type}-${run.diff}.png`, { type: 'image/png' });
}
