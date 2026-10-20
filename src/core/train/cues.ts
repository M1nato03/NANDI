import FORM_CUES from './form-cues.json';
import { EXERCISE_LIBRARY } from './library';

/** Three beginner form cues per exercise (audit 10-21); the older two-line cues are the fallback. */
export function formCues(exerciseId: string): string[] {
  return (FORM_CUES as Record<string, string[]>)[exerciseId] ?? EXERCISE_LIBRARY[exerciseId]?.cues ?? [];
}
