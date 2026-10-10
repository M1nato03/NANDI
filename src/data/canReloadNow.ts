import { isFocusActive } from './repos/tasks';
import { isTrainSessionActive } from './repos/train';

export async function canReloadNow(): Promise<boolean> {
  const [focus, workout] = await Promise.all([isFocusActive(), isTrainSessionActive()]);
  return !focus && !workout;
}
