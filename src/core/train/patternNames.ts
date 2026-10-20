import type { LadderPattern } from './types';

/** Plain names for the movement patterns, for screens (the raw keys are ids, not words). */
export const PATTERN_NAMES: Record<LadderPattern, string> = {
  'squat': 'Squat', 'push-up': 'Push-up', 'hinge': 'Hip hinge', 'row': 'Row', 'pull-up': 'Pull-up', 'dip': 'Dip',
  'core-anti-ext': 'Plank', 'core-anti-rot': 'Side plank', 'core-ext': 'Lower back',
};
