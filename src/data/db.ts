import Dexie, { type Table } from 'dexie';
import type {
  CardRow, DailyLogRow, DeckProgRow, ExerciseRow, ExStateRow, FlagRow, LearnConceptRow, LearnDropRow, LearnItemRow,
  BookGameStateRow, FocusRow, QuestPhotoRow, InventoryRow, LadderRow, LedgerRow, LessonProgRow, NotebookPageRow, NotebookVersionRow, PackRow, PhoneUsageRow,
  PlanRow, PrRow, PrivatePackRow, ProgramRow, PuzzleRunRow, QuestRow, RatingRow, ReminderRow,
  SessionRow, SetRow, SettingRow, SkillAttemptRow, TaskEventRow, TaskRow, UnlockRow,
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
  quests!: Table<QuestRow, string>;
  inventory!: Table<InventoryRow, string>;
  dailyLog!: Table<DailyLogRow, string>;
  settings!: Table<SettingRow, string>;
  learnConcepts!: Table<LearnConceptRow, string>;
  learnItems!: Table<LearnItemRow, string>;
  learnDrops!: Table<LearnDropRow, string>;
  privatePacks!: Table<PrivatePackRow, string>;
  phoneUsageMinutes!: Table<PhoneUsageRow, string>;
  skillAttempts!: Table<SkillAttemptRow, string>;
  notebookPages!: Table<NotebookPageRow, string>;
  notebookVersions!: Table<NotebookVersionRow, string>;
  bookGameStates!: Table<BookGameStateRow, string>;
  questPhotos!: Table<QuestPhotoRow, string>;

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
    this.version(2).stores({
      tasks: 'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
      taskEvents: 'id, taskId, kind, at', focus: 'id, taskId, startedAt',
      reminders: 'id, refType, refId, at', plans: 'id, lessonId, madeDayKey',
      exercises: 'id, pattern, source', ladders: 'id, pattern', programs: 'id, track',
      exState: 'id', sessions: 'id, dayKey, status', sets: 'id, sessionId, exerciseId',
      prs: 'id, exerciseId, kind', puzzleRuns: 'id, type, dayKey, seed',
      cards: 'id, deckId, due', deckProg: 'id, due', lessonProg: 'id, packId',
      ratings: 'id', flags: 'id, refId', unlocks: 'id, kind',
      packs: 'id, kind, version', ledger: 'id, dayKey, mode, kind',
      inventory: 'id, kind', dailyLog: 'dayKey', settings: 'key',
      quests: 'id, week, status, sourceId, updatedAt',
    }).upgrade(async tx => { await tx.table('quests').clear(); });
    this.version(3).stores({
      tasks: 'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
      taskEvents: 'id, taskId, kind, at', focus: 'id, taskId, startedAt',
      reminders: 'id, refType, refId, at', plans: 'id, lessonId, madeDayKey',
      exercises: 'id, pattern, source', ladders: 'id, pattern', programs: 'id, track',
      exState: 'id', sessions: 'id, dayKey, status', sets: 'id, sessionId, exerciseId',
      prs: 'id, exerciseId, kind', puzzleRuns: 'id, type, dayKey, seed',
      cards: 'id, deckId, due', deckProg: 'id, due', lessonProg: 'id, packId',
      ratings: 'id', flags: 'id, refId', unlocks: 'id, kind',
      packs: 'id, kind, version', ledger: 'id, dayKey, mode, kind',
      inventory: 'id, kind', dailyLog: 'dayKey', settings: 'key',
      quests: 'id, week, status, sourceId, updatedAt',
      learnConcepts: 'id', learnItems: 'id, lastSeen', learnDrops: 'id',
    });
    // Spec 33 §7: private books imported on this phone.
    this.version(4).stores({
      tasks: 'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
      taskEvents: 'id, taskId, kind, at', focus: 'id, taskId, startedAt',
      reminders: 'id, refType, refId, at', plans: 'id, lessonId, madeDayKey',
      exercises: 'id, pattern, source', ladders: 'id, pattern', programs: 'id, track',
      exState: 'id', sessions: 'id, dayKey, status', sets: 'id, sessionId, exerciseId',
      prs: 'id, exerciseId, kind', puzzleRuns: 'id, type, dayKey, seed',
      cards: 'id, deckId, due', deckProg: 'id, due', lessonProg: 'id, packId',
      ratings: 'id', flags: 'id, refId', unlocks: 'id, kind',
      packs: 'id, kind, version', ledger: 'id, dayKey, mode, kind',
      inventory: 'id, kind', dailyLog: 'dayKey', settings: 'key',
      quests: 'id, week, status, sourceId, updatedAt',
      learnConcepts: 'id', learnItems: 'id, lastSeen', learnDrops: 'id',
      privatePacks: 'id',
    });
    // Spec 46a: the daily minutes record, kept on this phone only (never in a backup file).
    this.version(5).stores({
      tasks: 'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
      taskEvents: 'id, taskId, kind, at', focus: 'id, taskId, startedAt',
      reminders: 'id, refType, refId, at', plans: 'id, lessonId, madeDayKey',
      exercises: 'id, pattern, source', ladders: 'id, pattern', programs: 'id, track',
      exState: 'id', sessions: 'id, dayKey, status', sets: 'id, sessionId, exerciseId',
      prs: 'id, exerciseId, kind', puzzleRuns: 'id, type, dayKey, seed',
      cards: 'id, deckId, due', deckProg: 'id, due', lessonProg: 'id, packId',
      ratings: 'id', flags: 'id, refId', unlocks: 'id, kind',
      packs: 'id, kind, version', ledger: 'id, dayKey, mode, kind',
      inventory: 'id, kind', dailyLog: 'dayKey', settings: 'key',
      quests: 'id, week, status, sourceId, updatedAt',
      learnConcepts: 'id', learnItems: 'id, lastSeen', learnDrops: 'id',
      privatePacks: 'id',
      phoneUsageMinutes: 'id, dayKey, packageName',
    });
    // Spec 43 (starter): practice runs and the private notebook's pages and versions.
    this.version(6).stores({
      tasks: 'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
      taskEvents: 'id, taskId, kind, at', focus: 'id, taskId, startedAt',
      reminders: 'id, refType, refId, at', plans: 'id, lessonId, madeDayKey',
      exercises: 'id, pattern, source', ladders: 'id, pattern', programs: 'id, track',
      exState: 'id', sessions: 'id, dayKey, status', sets: 'id, sessionId, exerciseId',
      prs: 'id, exerciseId, kind', puzzleRuns: 'id, type, dayKey, seed',
      cards: 'id, deckId, due', deckProg: 'id, due', lessonProg: 'id, packId',
      ratings: 'id', flags: 'id, refId', unlocks: 'id, kind',
      packs: 'id, kind, version', ledger: 'id, dayKey, mode, kind',
      inventory: 'id, kind', dailyLog: 'dayKey', settings: 'key',
      quests: 'id, week, status, sourceId, updatedAt',
      learnConcepts: 'id', learnItems: 'id, lastSeen', learnDrops: 'id',
      privatePacks: 'id',
      phoneUsageMinutes: 'id, dayKey, packageName',
      skillAttempts: 'id, trackId, lessonId, dayKey, status, retryDue',
      notebookPages: 'id, trackId, createdAt', notebookVersions: 'id, pageId, createdAt',
    });
    // Spec 40: a book game's saved year, one row per book (only Babylon has a game).
    this.version(7).stores({
      tasks: 'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
      taskEvents: 'id, taskId, kind, at', focus: 'id, taskId, startedAt',
      reminders: 'id, refType, refId, at', plans: 'id, lessonId, madeDayKey',
      exercises: 'id, pattern, source', ladders: 'id, pattern', programs: 'id, track',
      exState: 'id', sessions: 'id, dayKey, status', sets: 'id, sessionId, exerciseId',
      prs: 'id, exerciseId, kind', puzzleRuns: 'id, type, dayKey, seed',
      cards: 'id, deckId, due', deckProg: 'id, due', lessonProg: 'id, packId',
      ratings: 'id', flags: 'id, refId', unlocks: 'id, kind',
      packs: 'id, kind, version', ledger: 'id, dayKey, mode, kind',
      inventory: 'id, kind', dailyLog: 'dayKey', settings: 'key',
      quests: 'id, week, status, sourceId, updatedAt',
      learnConcepts: 'id', learnItems: 'id, lastSeen', learnDrops: 'id',
      privatePacks: 'id',
      phoneUsageMinutes: 'id, dayKey, packageName',
      skillAttempts: 'id, trackId, lessonId, dayKey, status, retryDue',
      notebookPages: 'id, trackId, createdAt', notebookVersions: 'id, pageId, createdAt',
      bookGameStates: 'id',
    });
    this.version(8).stores({
      tasks: 'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
      taskEvents: 'id, taskId, kind, at', focus: 'id, taskId, startedAt',
      reminders: 'id, refType, refId, at', plans: 'id, lessonId, madeDayKey',
      exercises: 'id, pattern, source', ladders: 'id, pattern', programs: 'id, track',
      exState: 'id', sessions: 'id, dayKey, status', sets: 'id, sessionId, exerciseId',
      prs: 'id, exerciseId, kind', puzzleRuns: 'id, type, dayKey, seed',
      cards: 'id, deckId, due', deckProg: 'id, due', lessonProg: 'id, packId',
      ratings: 'id', flags: 'id, refId', unlocks: 'id, kind',
      packs: 'id, kind, version', ledger: 'id, dayKey, mode, kind',
      inventory: 'id, kind', dailyLog: 'dayKey', settings: 'key',
      quests: 'id, week, status, sourceId, updatedAt',
      learnConcepts: 'id', learnItems: 'id, lastSeen', learnDrops: 'id',
      privatePacks: 'id',
      phoneUsageMinutes: 'id, dayKey, packageName',
      skillAttempts: 'id, trackId, lessonId, dayKey, status, retryDue',
      notebookPages: 'id, trackId, createdAt', notebookVersions: 'id, pageId, createdAt',
      bookGameStates: 'id',
      // Spec 660 §2.4: quest photos, on this phone only (never in a backup); v7 → v8 adds only this empty table.
      questPhotos: 'id, questFactId, takenAt',
    });
  }
}

export function createDb(name?: string): NandiDb {
  return new NandiDb(name);
}

/** App-wide database handle. Tests should use createDb() with unique names. */
export const db = createDb();
