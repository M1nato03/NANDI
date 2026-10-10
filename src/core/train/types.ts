export type EquipmentSetting = {
  gymAccess: boolean;
  dumbbells: boolean;
  barbell: 15 | 20 | null;
  smallestPlate: number | null;
  resistanceBand: boolean;
  pullUpBar: boolean;
  sturdyAnchor: boolean;
};

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'core' | 'shoulders' | 'arms';

export type Exercise = {
  id: string;
  name: string;
  muscle: MuscleGroup;
  licence: string;
  attribution: string;
  isHold?: boolean;
  cues?: string[];
};

export type Track = 'gym' | 'bodyweight';

export type LadderPattern = 'push-up' | 'row' | 'squat' | 'hinge' | 'pull-up' | 'dip' | 'core-anti-ext' | 'core-anti-rot' | 'core-ext';

export type LadderStep = {
  id: string;
  exerciseId: string;
  pattern: LadderPattern;
  rank: number;
};

export type RoutineExercise = {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  isPerSide?: boolean;
  isHold?: boolean;
  isBodyweightLadder?: LadderPattern;
};

export type Routine = {
  id: string;
  name: string;
  track: Track;
  exercises: RoutineExercise[];
};

export type SessionSet = {
  load: number;
  reps: number;
  isHold?: boolean;
};

export type SessionExercise = {
  exerciseId: string;
  sets: SessionSet[];
  painFlag: boolean;
  effort?: 'easy' | 'solid' | 'near';
  targetRepMin: number;
  targetRepMax: number;
};

export type TrainSession = {
  id: string;
  dayKey: string;
  routineId: string;
  exercises: SessionExercise[];
};

export type EquipmentLoad = {
  load: number;
  plates?: number[];
};
