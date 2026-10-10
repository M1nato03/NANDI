import { isFocusActive } from './repos/tasks';

export async function canReloadNow(): Promise<boolean> {
  return !(await isFocusActive());
}
