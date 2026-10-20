import type { CastName, Pose } from './Cast';
import type { FinishActivity } from '../shell/finish';

export const finishCast: Record<FinishActivity, { name: CastName; pose: Pose }> = {
  task: { name: 'Nandi', pose: 'cheer' }, learn: { name: 'Chiku', pose: 'cheer' },
  puzzle: { name: 'Kapi', pose: 'cheer' }, case: { name: 'Kapi', pose: 'think' },
  train: { name: 'Nandi', pose: 'cheer' }, night: { name: 'Kachhua', pose: 'rest' },
};
export function dropCast(review: boolean, correct: boolean | undefined): { name: CastName; pose: Pose } {
  return review ? { name: 'Moti', pose: correct ? 'cheer' : 'think' } : { name: 'Chiku', pose: correct ? 'cheer' : 'think' };
}
