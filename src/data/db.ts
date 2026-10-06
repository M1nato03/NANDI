import Dexie, { type Table } from 'dexie';
import type {
  CardRow, DailyLogRow, DeckProgRow, ExerciseRow, ExStateRow, FlagRow,
  FocusRow, InventoryRow, LadderRow, LedgerRow, LessonProgRow, PackRow,
  PlanRow, PrRow, ProgramRow, PuzzleRunRow, RatingRow, ReminderRow,
  SessionRow, SetRow, SettingRow, TaskEventRow, TaskRow, UnlockRow,
} from './types';

export class NandiDb extends Dexie {
  tasks!: Table<TaskRow, string>;
  taskEvents!: Table<TaskEventRow, string>;
  focus!: Table<FocusRow, string>;
  reminders!: Table<ReminderRow, string>;
  plans!: Table<PlanRow, string>;
  exercises!: Table<ExerciseRow, string>;
  ladders!: Table<LadderRow, string>;
  programs!: Table<ProgramRow, string>;
  exState!: Table<ExStateRow, string>;
  sessions!: Table<SessionRow, string>;
  sets!: Table<SetRow, string>;
  prs!: Table<PrRow, string>;
  puzzleRuns!: Table<PuzzleRunRow, string>;
  cards!: Table<CardRow, string>;
  deckProg!: Table<DeckProgRow, string>;
  lessonProg!: Table<LessonProgRow, string>;
  ratings!: Table<RatingRow, string>;
  flags!: Table<FlagRow, string>;
  unlocks!: Table<UnlockRow, string>;
  packs!: Table<PackRow, string>;
  ledger!: Table<LedgerRow, string>;
  inventory!: Table<InventoryRow, string>;
  dailyLog!: Table<DailyLogRow, string>;
  settings!: Table<SettingRow, string>;

  constructor(name = 'nandi') {
    super(name);
    // Restate the full list in every later Dexie version: omitted indexes are dropped.
    this.version(1).stores({
      tasks: 'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
      taskEvents: 'id, taskId, kind, at',
      focus: 'id, taskId, startedAt',
      reminders: 'id, refType, refId, at',
      plans: 'id, lessonId, madeDayKey',
      exercises: 'id, pattern, source',
      ladders: 'id, pattern',
      programs: 'id, track',
      exState: 'id',
      sessions: 'id, dayKey, status',
      sets: 'id, sessionId, exerciseId',
      prs: 'id, exerciseId, kind',
      puzzleRuns: 'id, type, dayKey, seed',
      cards: 'id, deckId, due',
      deckProg: 'id, due',
      lessonProg: 'id, packId',
      ratings: 'id',
      flags: 'id, refId',
      unlocks: 'id, kind',
      packs: 'id, kind, version',
      ledger: 'id, dayKey, mode, kind',
      inventory: 'id, kind',
      dailyLog: 'dayKey',
      settings: 'key',
    });
  }
}

export function createDb(name?: string): NandiDb {
  return new NandiDb(name);
}

/** App-wide database handle. Tests should use createDb() with unique names. */
export const db = createDb();
