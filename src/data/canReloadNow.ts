import { isFocusActive } from './repos/tasks';
import { isTrainSessionActive } from './repos/train';
import { isMeditationActive } from './repos/meditation';

export async function canReloadNow(): Promise<boolean> {
  const [focus, workout, meditation] = await Promise.all([isFocusActive(), isTrainSessionActive(), isMeditationActive()]);
  return !focus && !workout && !meditation;
}
