import { RULES } from '../rules.config';
import { LADDERS } from './library';
import { LadderPattern, LadderStep } from './types';

export function getBodyweightPlacementStartStep(pattern: LadderPattern): LadderStep {
  const ladder = LADDERS[pattern];
  if (!ladder || ladder.length === 0) throw new Error(`Ladder not found for pattern ${pattern}`);
  const middleIndex = Math.floor(ladder.length / 2);
  const step = ladder[middleIndex];
  if (!step) throw new Error(`Middle step not found for pattern ${pattern}`);
  return step;
}

export type PlacementTestResult = {
  reps: number;
  stepRank: number;
};

export function evaluateBodyweightPlacement(
  pattern: LadderPattern,
  results: PlacementTestResult[]
): { finalStepRank: number; complete: boolean } {
  const ladder = LADDERS[pattern];
  if (!ladder) throw new Error(`Ladder not found for pattern ${pattern}`);
  
  if (results.length === 0) return { finalStepRank: getBodyweightPlacementStartStep(pattern).rank, complete: false };

  const lastResult = results[results.length - 1]!;
  
  // Stop if max tests per pattern is reached
  if (results.length >= RULES.train.placement.maxTestsPerPattern) {
    // Start on the last step with >=5
    let bestRank = ladder[0]!.rank;
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i]!.reps >= RULES.train.placement.stopMinReps) {
        bestRank = results[i]!.stepRank;
        break;
      }
    }
    return { finalStepRank: bestRank, complete: true };
  }

  // If >= 12, move up
  if (lastResult.reps >= RULES.train.placement.moveUpAtReps) {
    if (lastResult.stepRank < ladder.length) {
      return { finalStepRank: lastResult.stepRank + 1, complete: false };
    } else {
      return { finalStepRank: lastResult.stepRank, complete: true };
    }
  }
  
  // If < 5, move down
  if (lastResult.reps < RULES.train.placement.stopMinReps) {
    // Check if we previously got >= 12 on a lower step. If moving up dropped below 5, start on lower step.
    if (results.length > 1) {
      const prevResult = results[results.length - 2]!;
      if (prevResult.reps >= RULES.train.placement.moveUpAtReps) {
        return { finalStepRank: prevResult.stepRank, complete: true };
      }
    }

    if (lastResult.stepRank > 1) {
      return { finalStepRank: lastResult.stepRank - 1, complete: false };
    } else {
      return { finalStepRank: 1, complete: true };
    }
  }

  // Stop at first step where max reps is in 5-11
  return { finalStepRank: lastResult.stepRank, complete: true };
}

export function evaluateGymPlacement(reps: number): { complete: boolean, message?: string } {
  // Very light start, add increment until reps < 12. First two sessions use that load.
  if (reps >= RULES.train.placement.moveUpAtReps) {
    return { complete: false }; // need to add load
  }
  return { complete: true };
}
