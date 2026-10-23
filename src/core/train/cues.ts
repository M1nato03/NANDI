import FORM_CUES from './form-cues.json';
import { EXERCISE_LIBRARY } from './library';
import type { RoutineExercise } from './types';

/** Three beginner form cues per exercise (audit 10-21); the older two-line cues are the fallback. A variant keys its own (`sl-rdl:slow`, spec 17). */
export function formCues(exerciseId: string, variant?: RoutineExercise['variant']): string[] {
  const cues = FORM_CUES as Record<string, string[]>;
  return (variant ? cues[`${exerciseId}:${variant}`] : undefined) ?? cues[exerciseId] ?? EXERCISE_LIBRARY[exerciseId]?.cues ?? [];
}
