/** Millisecond timestamps and dayKey strings are supplied by callers. */
export type DayKey = string;
export interface RowMeta {
  updatedAt: number;
  deleted: 0 | 1;
  deviceId: string;
}
export interface EntityRow extends RowMeta { id: string }
export interface StateRow extends RowMeta { id: string }

export interface TaskRow extends EntityRow {
  title: string;
  status: string;
  dayKey: DayKey;
  notes?: string;
  size?: string;
  estimateMin?: number;
  plannedSize?: string;
  category?: string;
  mustOrCould?: 'must' | 'could';
  scheduledStart?: number | null;
  scheduledEnd?: number | null;
  place?: string;
  firstStep?: string;
  postponeCount?: number;
  firstScheduledDayKey?: DayKey;
  doneAt?: number;
  parentId?: string;
  checkpointOf?: string;
  xpShare?: number;
}
export interface TaskEventRow extends EntityRow {
  taskId: string;
  kind: 'created' | 'scheduled' | 'postponed' | 'realReasonMove' | 'shrunk' | 'split' | 'started' | 'switched' | 'done' | 'someday' | 'dropped';
  at: number;
  reason?: string;
  budgetCounted?: boolean;
}
export interface FocusRow extends EntityRow {
  taskId: string;
  startedAt: number;
  plannedMs?: number;
  pauses?: { at: number; resumeAt?: number }[];
  endedAt?: number;
  overtimeMs?: number;
  switches?: number;
}
export interface ReminderRow extends EntityRow {
  refType: string;
  refId: string;
  at: number;
  notifId?: number;
  channel?: 'tasks' | 'rest' | 'planning';
  status?: 'scheduled' | 'fired' | 'cancelled';
}
export interface PlanRow extends EntityRow {
  lessonId: string;
  madeDayKey: DayKey;
  ifText?: string;
  thenText?: string;
  fired?: null | 'yes' | 'partly' | 'no' | 'na';
}
export interface ExerciseRow extends EntityRow {
  pattern: string;
  source: string;
  name?: string;
  equipment?: string[];
  cues?: string[];
  image?: string;
  licence?: string;
  attribution?: string;
  custom?: boolean;
}
export interface LadderRow extends EntityRow {
  pattern: string;
  steps?: { exerciseId: string; sets: number; repMin: number; repMax: number; holdS?: number }[];
}
export interface ProgramRow extends EntityRow {
  track: 'gym' | 'bodyweight';
  templates?: { key: string; slots: unknown[] }[];
  equipment?: import('../core/train').EquipmentSetting;
  days?: number[];
  weeklyTarget?: 2 | 3;
  restDay?: number;
  heatModeEnabled?: boolean;
  heatStartedAt?: number;
  startedAt?: number;
  placement?: Record<string, number>;
  sessionsStarted?: number;
  lastRetestWeek?: number;
}
export interface ExStateRow extends StateRow {
  loadKg?: number;
  ladderStep?: number;
  successStreak?: number;
  failStreak?: number;
  lastIncreaseAt?: number;
  increasesThisWeek?: number;
  increaseWeek?: string;
  lastReps?: number;
  lastLoadKg?: number;
}
export interface SessionRow extends EntityRow {
  dayKey: DayKey;
  status: 'active' | 'completed' | 'minimum' | 'partial' | 'safety' | 'skipped';
  templateKey?: string;
  heatMode?: string;
  readiness?: string;
  startedAt?: number;
  endedAt?: number;
  planned?: import('../core/train').RoutineExercise[];
  painExerciseIds?: string[];
  effortByExercise?: Record<string, 'easy' | 'solid' | 'near'>;
  restEndsAt?: number;
  xp?: number;
}
export interface SetRow extends EntityRow {
  sessionId: string;
  exerciseId: string;
  type?: 'warmup' | 'working';
  loadKg?: number;
  reps?: number;
  durationS?: number;
  effort?: 'easy' | 'solid' | 'near';
  painFlag?: boolean;
  completedAt?: number;
  slot?: number;
  confirmedJump?: boolean;
}
export interface PrRow extends EntityRow {
  exerciseId: string;
  kind: 'load' | 'repsAtLoad' | 'e1rm' | 'ladderStep' | 'hold';
  value?: number;
  setId?: string;
  at?: number;
  loadKg?: number;
}
export interface PuzzleRunRow extends EntityRow {
  type: 'sudoku' | 'crowns' | 'sunmoon' | 'path' | 'calc' | 'mystery';
  dayKey?: DayKey;
  seed?: string;
  diff?: string;
  daily?: boolean;
  intro?: boolean;
  solveMs?: number;
  score?: number;
  hintsUsed?: number;
  hintRungs?: number[];
  techniquesSeen?: string[];
  result?: 'solved' | 'revealed' | 'abandoned';
  tries?: number;
  source?: 'app' | 'legacy';
  legacyBest?: boolean;
  legacyRaw?: unknown;
  grid?: number[];
  path?: number[];
  notes?: number[];
  notesMode?: boolean;
  activeMs?: number;
  lastActiveAt?: number;
  finishedAt?: number;
  afterBedtime?: boolean;
  practiceAttempt?: number;
}
export interface CardRow extends StateRow {
  deckId: string;
  due: DayKey;
  packId?: string;
  itemId?: string;
  topic?: string;
  box?: number;
  reviews?: number;
  last?: DayKey;
}
export interface DeckProgRow extends StateRow {
  due: DayKey;
  b?: number;
  n?: number;
  c?: number;
  last?: DayKey;
}
export interface LessonProgRow extends StateRow {
  packId: string;
  doneDayKey?: DayKey;
  guessOk?: boolean;
  conf?: number;
  transferOk?: boolean;
  whyOk?: boolean;
}
export interface RatingRow extends StateRow {
  value?: number;
  n?: number;
}
export interface FlagRow extends EntityRow {
  refId: string;
  kind?: string;
  hidden?: boolean;
  note?: string;
  at?: number;
}
export interface UnlockRow extends EntityRow {
  kind: string;
  refId?: string;
  at?: number;
}
export interface PackRow extends StateRow {
  kind: string;
  version: string;
  json?: unknown;
  sha256?: string;
  installedAt?: number;
}
export interface LedgerRow extends EntityRow {
  dayKey: DayKey;
  mode: string;
  kind: string;
  refId: string;
  inputs: Record<string, unknown>;
}
export interface QuestRow extends EntityRow {
  sourceId: string;
  week: string;
  title: string;
  kind: 'once' | 'total';
  target: number;
  unit: string;
  step: number;
  progress: number;
  tapIds: string[];
  status: 'active' | 'done' | 'archived' | 'swapped';
  custom: boolean;
}
export interface InventoryRow extends EntityRow {
  kind: string;
  price?: number;
  at?: number;
}
export interface DailyLogRow extends RowMeta {
  dayKey: DayKey;
  reelsBucket?: string;
  wellbeingMinutes?: number;
  lightsOutAt?: number;
  bedtimeTarget?: number;
  agency1to5?: number;
  agencyOpenedInstead?: boolean;
  appMinutes?: number;
  planDone?: boolean;
  shutdownDone?: boolean;
  reviewDone?: boolean;
  shutdownIfThen?: string;
  windDownAt?: number;
  nightOverrides?: number;
}
export interface SettingRow extends RowMeta {
  key: string;
  value: unknown;
}
