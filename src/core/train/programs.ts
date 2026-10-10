import { Routine } from './types';

export const PROGRAMS: Record<string, Routine> = {
  'gym-foundations-a': {
    id: 'gym-foundations-a',
    name: 'Gym Foundations A',
    track: 'gym',
    exercises: [
      { exerciseId: 'goblet-squat', sets: 3, repMin: 8, repMax: 12 },
      { exerciseId: 'db-bench', sets: 3, repMin: 8, repMax: 12 },
      { exerciseId: 'seated-cable-row', sets: 3, repMin: 8, repMax: 12 },
      { exerciseId: 'db-rdl', sets: 2, repMin: 8, repMax: 12 },
      { exerciseId: 'plank', sets: 3, repMin: 20, repMax: 40, isHold: true }
    ]
  },
  'gym-foundations-b': {
    id: 'gym-foundations-b',
    name: 'Gym Foundations B',
    track: 'gym',
    exercises: [
      { exerciseId: 'lat-pulldown', sets: 3, repMin: 8, repMax: 12 },
      { exerciseId: 'split-squat', sets: 3, repMin: 8, repMax: 12, isPerSide: true },
      { exerciseId: 'seated-db-press', sets: 3, repMin: 8, repMax: 12 },
      { exerciseId: 'hip-thrust', sets: 2, repMin: 10, repMax: 15 },
      { exerciseId: 'pallof-press', sets: 3, repMin: 20, repMax: 40, isPerSide: true, isHold: true }
    ]
  },
  'hostel-bodyweight': {
    id: 'hostel-bodyweight',
    name: 'Hostel Bodyweight',
    track: 'bodyweight',
    exercises: [
      { exerciseId: 'bw-squat', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'squat' },
      { exerciseId: 'full-push-up', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'push-up' },
      { exerciseId: 'bw-rdl', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'hinge' },
      { exerciseId: 'horizontal-row', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'row' },
      { exerciseId: 'plank', sets: 3, repMin: 20, repMax: 60, isBodyweightLadder: 'core-anti-ext', isHold: true },
      { exerciseId: 'side-plank', sets: 3, repMin: 20, repMax: 60, isBodyweightLadder: 'core-anti-rot', isHold: true },
      { exerciseId: 'reverse-hyper', sets: 3, repMin: 5, repMax: 8, isBodyweightLadder: 'core-ext' }
    ]
  }
};
