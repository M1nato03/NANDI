import { Exercise, LadderStep } from './types';

// Example attribution from the free-exercise-db
export const EXERCISE_LIBRARY: Record<string, Exercise> = {
  'goblet-squat': { id: 'goblet-squat', name: 'Goblet Squat', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'leg-press': { id: 'leg-press', name: 'Leg Press', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'db-bench': { id: 'db-bench', name: 'Dumbbell Bench Press', muscle: 'chest', licence: 'Unlicense', attribution: 'yuhonas' },
  'machine-chest-press': { id: 'machine-chest-press', name: 'Machine Chest Press', muscle: 'chest', licence: 'Unlicense', attribution: 'yuhonas' },
  'seated-cable-row': { id: 'seated-cable-row', name: 'Seated Cable Row', muscle: 'back', licence: 'Unlicense', attribution: 'yuhonas' },
  '1-arm-db-row': { id: '1-arm-db-row', name: 'One-Arm Dumbbell Row', muscle: 'back', licence: 'Unlicense', attribution: 'yuhonas' },
  'db-rdl': { id: 'db-rdl', name: 'Dumbbell Romanian Deadlift', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'plank': { id: 'plank', name: 'Plank', muscle: 'core', licence: 'Unlicense', attribution: 'yuhonas', isHold: true },
  'lat-pulldown': { id: 'lat-pulldown', name: 'Lat Pulldown', muscle: 'back', licence: 'Unlicense', attribution: 'yuhonas' },
  'split-squat': { id: 'split-squat', name: 'Split Squat', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'seated-db-press': { id: 'seated-db-press', name: 'Seated Dumbbell Press', muscle: 'shoulders', licence: 'Unlicense', attribution: 'yuhonas' },
  'hip-thrust': { id: 'hip-thrust', name: 'Hip Thrust', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'back-extension': { id: 'back-extension', name: 'Back Extension', muscle: 'core', licence: 'Unlicense', attribution: 'yuhonas' },
  'pallof-press': { id: 'pallof-press', name: 'Pallof Press', muscle: 'core', licence: 'Unlicense', attribution: 'yuhonas' },
  'side-plank': { id: 'side-plank', name: 'Side Plank', muscle: 'core', licence: 'Unlicense', attribution: 'yuhonas', isHold: true },
  'long-lever-plank': { id: 'long-lever-plank', name: 'Long-lever Plank', muscle: 'core', licence: 'Custom', attribution: 'NANDI', isHold: true, cues: ['Place elbows a little ahead of shoulders.', 'Hold a straight line. Stop when that line breaks.'] },
  'star-side-plank': { id: 'star-side-plank', name: 'Star Side Plank', muscle: 'core', licence: 'Custom', attribution: 'NANDI', isHold: true, cues: ['Stack shoulders and hips.', 'Raise the top leg only while steady.'] },

  // Ladder steps
  'wall-push-up': { id: 'wall-push-up', name: 'Wall Push-up', muscle: 'chest', licence: 'Custom', attribution: 'NANDI', cues: ['Hands on the wall at chest height.', 'Keep a straight line as you move in and out.'] },
  'incline-push-up': { id: 'incline-push-up', name: 'Incline Push-up', muscle: 'chest', licence: 'Unlicense', attribution: 'yuhonas' },
  'full-push-up': { id: 'full-push-up', name: 'Push-up', muscle: 'chest', licence: 'Unlicense', attribution: 'yuhonas' },
  'diamond-push-up': { id: 'diamond-push-up', name: 'Diamond Push-up', muscle: 'chest', licence: 'Unlicense', attribution: 'yuhonas' },
  'pseudo-planche': { id: 'pseudo-planche', name: 'Pseudo-planche Push-up', muscle: 'chest', licence: 'Custom', attribution: 'NANDI', cues: ['Hands near hips with a small forward lean.', 'Keep the lean steady through each clean rep.'] },

  'vertical-row': { id: 'vertical-row', name: 'Vertical Row', muscle: 'back', licence: 'Custom', attribution: 'NANDI', cues: ['Hold a secure anchor and lean back a little.', 'Pull chest toward hands without shrugging.'] },
  'incline-row': { id: 'incline-row', name: 'Incline Row', muscle: 'back', licence: 'Unlicense', attribution: 'yuhonas' },
  'horizontal-row': { id: 'horizontal-row', name: 'Horizontal Row', muscle: 'back', licence: 'Unlicense', attribution: 'yuhonas' },
  'backpack-row': { id: 'backpack-row', name: 'Backpack Row', muscle: 'back', licence: 'Custom', attribution: 'NANDI', cues: ['Hinge at the hips with a steady back.', 'Pull the backpack toward your ribs.'] },
  'band-row': { id: 'band-row', name: 'Band Row', muscle: 'back', licence: 'Custom', attribution: 'NANDI', cues: ['Secure the band before pulling.', 'Pull elbows back without shrugging.'] },
  'wide-row': { id: 'wide-row', name: 'Wide Row', muscle: 'back', licence: 'Unlicense', attribution: 'yuhonas' },
  'archer-row': { id: 'archer-row', name: 'Archer Row', muscle: 'back', licence: 'Custom', attribution: 'NANDI', cues: ['Use a secure anchor.', 'Pull toward one hand while the other arm stays longer.'] },
  
  'assisted-squat': { id: 'assisted-squat', name: 'Assisted Squat', muscle: 'legs', licence: 'Custom', attribution: 'NANDI', cues: ['Hold a stable support.', 'Sit down between your feet, then stand tall.'] },
  'bw-squat': { id: 'bw-squat', name: 'Bodyweight Squat', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'bg-split-squat': { id: 'bg-split-squat', name: 'Bulgarian Split Squat', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'shrimp-squat': { id: 'shrimp-squat', name: 'Shrimp Squat', muscle: 'legs', licence: 'Custom', attribution: 'NANDI', cues: ['Stand on one foot with the other knee bent behind.', 'Lower only as far as you can control.'] },
  
  'bw-rdl': { id: 'bw-rdl', name: 'Bodyweight RDL', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'sl-rdl': { id: 'sl-rdl', name: 'Single-leg RDL', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'banded-nordic': { id: 'banded-nordic', name: 'Banded Nordic Curl', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },
  'nordic-curl': { id: 'nordic-curl', name: 'Nordic Curl', muscle: 'legs', licence: 'Unlicense', attribution: 'yuhonas' },

  'scapular-pull': { id: 'scapular-pull', name: 'Scapular Pull', muscle: 'back', licence: 'Custom', attribution: 'NANDI', cues: ['Hang with straight arms.', 'Pull shoulders down a little, then relax.'] },
  'arch-hang': { id: 'arch-hang', name: 'Arch Hang', muscle: 'back', licence: 'Custom', attribution: 'NANDI', isHold: true, cues: ['Hang with arms long.', 'Keep shoulders gently active and feet slightly forward.'] },
  'pull-up-negative': { id: 'pull-up-negative', name: 'Pull-up Negative', muscle: 'back', licence: 'Unlicense', attribution: 'yuhonas' },
  'pull-up': { id: 'pull-up', name: 'Pull-up', muscle: 'back', licence: 'Unlicense', attribution: 'yuhonas' },

  'support-hold': { id: 'support-hold', name: 'Support Hold', muscle: 'chest', licence: 'Custom', attribution: 'NANDI', isHold: true, cues: ['Press down on stable bars.', 'Keep shoulders away from ears.'] },
  'dip-negative': { id: 'dip-negative', name: 'Dip Negative', muscle: 'chest', licence: 'Unlicense', attribution: 'yuhonas' },
  'dip': { id: 'dip', name: 'Parallel-bar Dip', muscle: 'chest', licence: 'Unlicense', attribution: 'yuhonas' },
  
  'reverse-hyper': { id: 'reverse-hyper', name: 'Reverse Hyper / Superman', muscle: 'core', licence: 'Unlicense', attribution: 'yuhonas' }
};

export const LADDERS: Record<string, LadderStep[]> = {
  'push-up': [
    { id: 'step-push-1', exerciseId: 'wall-push-up', pattern: 'push-up', rank: 1 },
    { id: 'step-push-2', exerciseId: 'incline-push-up', pattern: 'push-up', rank: 2 },
    { id: 'step-push-3', exerciseId: 'full-push-up', pattern: 'push-up', rank: 3 },
    { id: 'step-push-4', exerciseId: 'diamond-push-up', pattern: 'push-up', rank: 4 },
    { id: 'step-push-5', exerciseId: 'pseudo-planche', pattern: 'push-up', rank: 5 },
  ],
  'row': [
    { id: 'step-row-1', exerciseId: 'vertical-row', pattern: 'row', rank: 1 },
    { id: 'step-row-2', exerciseId: 'incline-row', pattern: 'row', rank: 2 },
    { id: 'step-row-3', exerciseId: 'horizontal-row', pattern: 'row', rank: 3 },
    { id: 'step-row-4', exerciseId: 'wide-row', pattern: 'row', rank: 4 },
    { id: 'step-row-5', exerciseId: 'archer-row', pattern: 'row', rank: 5 },
  ],
  'squat': [
    { id: 'step-sq-1', exerciseId: 'assisted-squat', pattern: 'squat', rank: 1 },
    { id: 'step-sq-2', exerciseId: 'bw-squat', pattern: 'squat', rank: 2 },
    { id: 'step-sq-3', exerciseId: 'split-squat', pattern: 'squat', rank: 3 },
    { id: 'step-sq-4', exerciseId: 'bg-split-squat', pattern: 'squat', rank: 4 },
    { id: 'step-sq-5', exerciseId: 'shrimp-squat', pattern: 'squat', rank: 5 },
  ],
  'hinge': [
    { id: 'step-h-1', exerciseId: 'bw-rdl', pattern: 'hinge', rank: 1 },
    { id: 'step-h-2', exerciseId: 'sl-rdl', pattern: 'hinge', rank: 2 },
    { id: 'step-h-3', exerciseId: 'banded-nordic', pattern: 'hinge', rank: 3 },
    { id: 'step-h-4', exerciseId: 'nordic-curl', pattern: 'hinge', rank: 4 },
  ],
  'pull-up': [
    { id: 'step-pu-1', exerciseId: 'scapular-pull', pattern: 'pull-up', rank: 1 },
    { id: 'step-pu-2', exerciseId: 'arch-hang', pattern: 'pull-up', rank: 2 },
    { id: 'step-pu-3', exerciseId: 'pull-up-negative', pattern: 'pull-up', rank: 3 },
    { id: 'step-pu-4', exerciseId: 'pull-up', pattern: 'pull-up', rank: 4 },
  ],
  'dip': [
    { id: 'step-d-1', exerciseId: 'support-hold', pattern: 'dip', rank: 1 },
    { id: 'step-d-2', exerciseId: 'dip-negative', pattern: 'dip', rank: 2 },
    { id: 'step-d-3', exerciseId: 'dip', pattern: 'dip', rank: 3 },
  ],
  'core-anti-ext': [
    { id: 'step-cae-1', exerciseId: 'plank', pattern: 'core-anti-ext', rank: 1 },
    { id: 'step-cae-2', exerciseId: 'long-lever-plank', pattern: 'core-anti-ext', rank: 2 }
  ],
  'core-anti-rot': [
    { id: 'step-car-1', exerciseId: 'side-plank', pattern: 'core-anti-rot', rank: 1 },
    { id: 'step-car-2', exerciseId: 'star-side-plank', pattern: 'core-anti-rot', rank: 2 }
  ],
  'core-ext': [
    { id: 'step-ce-1', exerciseId: 'reverse-hyper', pattern: 'core-ext', rank: 1 }
  ]
};
