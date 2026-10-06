/** Starting defaults from 05-economy §2. Rule changes apply by dayKey, never retroactively. */
export const RULES = {
  version: 1,
  effectiveFrom: '2026-10-05',
  dayBoundaryHour: 4,

  // 05-economy §2, Tasks; 02-tasks §6 (timers and optional pre-reminder).
  tasks: {
    sizeMinutes: { S: [0, 15], M: [16, 45], L: [46, 90] },
    xpBySize: { S: 10, M: 20, L: 35 },
    firstDayMultiplier: 1.5,
    fullRateTasksPerDay: 8,
    overflowMultiplier: 0.5,
    quickWin: { xp: 5, withinMin: 30, maxPerDay: 5 },
    // pending Jenil's decision (Clutch), see docs/plans/phase-0.md
    clutch: { shareOfSizeXp: 0.25, minPostpones: 2, maxPerDay: 1 },
    dailyCap: 200,
    maxEstimateMin: 90,
    subtaskMin: 25,
    subtaskMax: 60,
    firstStepMaxChars: 120,
    maxMustsPerDay: 3,
    postpone: {
      weeklyBudget: 5,
      realReasonExceptionsPerWeek: 2,
      autoSomedayAt: 4,
      untouchedDaysToSomeday: 14,
      autoRaise: { lookbackWeeks: 4, overrunWeeksThreshold: 3, raiseBy: 2 },
      baselineFactor: 0.67,
      autoBudgetMin: 5,
      autoBudgetMax: 12,
    },
    freeHours: { classDay: 4, weekend: 6 },
    focus: { workMin: 25, breakMin: 5, longBreakMin: 15, longBreakEvery: 4, extendMin: 10, presetLong: [50, 10] },
    calibrationMinSamples: 5,
    startAdherenceWindowMin: 15,
    liveTimers: 1,
    preReminderMin: 5,
  },

  // 05-economy §2, Train; placement thresholds from 03-train §1 and DECISIONS.md.
  train: {
    sessionFullXp: 60,
    sessionPartialFloorXp: 40,
    minimumOrSafetyXp: 40,
    restDayCheckXp: 10,
    restDayCheckMinMinutes: 10,
    prXp: 15,
    prMaxPerDay: 2,
    weeklyTarget: 3,
    weeklyBonus: { targetMet: 60, oneShort: 30 },
    dailyCapExclWeekly: 100,
    progression: { confirmSessions: 2, failHoldAt: 2, failDeloadAt: 3, deloadPct: 10, maxIncreasesPerWeekEarly: 1, earlyWeeks: 6 },
    ladder: { repMin: 5, repMax: 8, sets: 3, holdMinS: 20, holdMaxS: 60 },
    placement: { stopMinReps: 5, stopMaxReps: 11, moveUpAtReps: 12, maxTestsPerPattern: 3 },
    weeklyHardSetIncreaseMaxPct: 20,
    heatMode: { volumeCutPct: 25, acclimatiseDays: 12 },
    retestEveryWeeks: 8,
  },

  // 05-economy §2, Mind.
  mind: {
    mysteryXp: 25,
    dropBoardXp: 10,
    lessonXp: 15,
    lessonsPaidPerDay: 1,
    lessonsPerCoursePerDay: 1,
    cardXp: 1,
    cardsMaxPerDay: 20,
    sideBoardXp: 10,
    sideBoardsMaxPerDay: 1,
    dailyCap: 80,
    freePlayXp: 0,
    dropUnlockTime: '07:00',
    featuredByWeekday: {
      1: ['sudoku', 'easy'], 2: ['sunmoon', 'easy'], 3: ['path', 'medium'], 4: ['crowns', 'medium'],
      5: ['calc', 'medium'], 6: ['crowns', 'hard'], 0: ['BOSS', 'hard'],
    },
    bossRotation: ['sudoku', 'crowns', 'calc', 'path', 'sunmoon'],
    caseDiffByWeekday: { 1: 'easy', 2: 'easy', 3: 'medium', 4: 'medium', 5: 'medium', 6: 'medium', 0: 'hard' },
    onboardingEasyCases: 3,
    eloK: { early: 40, later: 24, earlyAnswers: 20 },
    eloClamp: [400, 2400],
    hintScore: 0.6,
    caseScore: { cleanSolve: 1, withHintsOrSecondTry: 0.7, revealed: 0 },
    cardBoxIntervalsDays: [0, 1, 3, 7, 14, 30, 60],
    itemIntervalsDays: [0, 21, 45, 90, 180],
    itemRetryDays: { default: 2, teaser: 3 },
    miniMysteryRetiresAfterAnswer: true,
  },

  // 05-economy §2, cross-mode bonuses.
  bonuses: { hatTrickXp: 30, lightsOutXp: 15 },

  // 05-economy §§2, 4, cumulative level curve.
  level: { stepBase: 100, softCap: 50 },

  // 05-economy §§2, 5, season rank and 500-seat ladder.
  season: {
    spDailyCap: 300,
    targetPerDay: 250,
    exponent: 0.7,
    seats: 500,
    seedPct: 10,
    tiers: [['Bench', 301, 500], ['Challenger', 151, 300], ['Contender', 51, 150], ['Elite', 11, 50], ['Ace', 2, 10], ['Apex', 1, 1]],
  },

  // 05-economy §2, streaks.
  streak: {
    startFreezes: 2,
    maxFreezes: 2,
    freezeEveryDays: 7,
    freezeShardPrice: 50,
    restDaysPerWeek: 1,
    repairWindowHours: 48,
    repairHatTricks: 2,
    goldAfterDays: 7,
    cleanWeekHatTricks: 4,
    minDueCardsForMark: 10,
  },

  // 05-economy §2, Shards and shop prices.
  shards: {
    perXp: 0.1,
    levelUpBonus: 20,
    seasonEnd: { Bench: 50, Challenger: 100, Contender: 150, Elite: 200, Ace: 250, Apex: 300 },
    prices: { freeze: 50, cardBack: [100, 150], banner: [100, 150], puzzlePack: [150, 250], soundPack: 300, theme: [400, 800] },
  },

  // 05-economy §2, night schedule. Clock bounds, if added, use the night timeline.
  night: {
    windDownCapMin: 10,
    defaultBedtime: '01:30',
    goalBedtime: '23:30',
    bedtimeStepMin: 15,
    bedtimeRampEveryDays: 3,
    bedtimeRampNeedsMetOfLast3: 2,
    defaultShutdown: '23:15',
    shutdownMinBeforeBedtime: 15,
    streakReminderMinBeforeBedtime: 90,
    lightsOutEndsAt: 'dayBoundary',
    morningBackfill: true,
  },

  // 05-economy §2, notifications, backup and animation timing.
  notifications: { engagementPerDayMax: 2, planningReminderTime: '09:00' },
  backup: { nagAfterDays: 7 },
  juice: { microMs: [100, 200], mesoMs: [400, 800], macroMs: [1200, 2500], macroPerDayMax: 2 },
} as const;

type Widen<T> = T extends number ? number
  : T extends string ? string
  : T extends boolean ? boolean
  : T extends readonly unknown[] ? { readonly [K in keyof T]: Widen<T[K]> }
  : T extends object ? { readonly [K in keyof T]: Widen<T[K]> }
  : T;

export type Rules = Widen<typeof RULES>;

/** Numeric rule bounds, keyed by dot path (array indexes are numeric path parts).
 * Ranges permit small tuning while retaining useful ordering and nonnegative awards.
 * Cross-field constraints, such as tier adjacency, need separate pack validation.
 */
export const RULES_BOUNDS: Record<string, readonly [number, number]> = {
  // Identity and day boundary: version is a positive schema number; hours use a local 24-hour clock.
  version: [1, 999], dayBoundaryHour: [0, 23],
  // Tasks: size bands cover practical estimates; XP and caps remain nonnegative.
  'tasks.sizeMinutes.S.0': [0, 0], 'tasks.sizeMinutes.S.1': [5, 30],
  'tasks.sizeMinutes.M.0': [1, 60], 'tasks.sizeMinutes.M.1': [15, 90],
  'tasks.sizeMinutes.L.0': [1, 120], 'tasks.sizeMinutes.L.1': [30, 240],
  'tasks.xpBySize.S': [1, 100], 'tasks.xpBySize.M': [1, 150], 'tasks.xpBySize.L': [1, 200],
  'tasks.firstDayMultiplier': [1, 2], 'tasks.fullRateTasksPerDay': [1, 20], 'tasks.overflowMultiplier': [0, 1],
  'tasks.quickWin.xp': [0, 50], 'tasks.quickWin.withinMin': [1, 120], 'tasks.quickWin.maxPerDay': [0, 20],
  'tasks.clutch.shareOfSizeXp': [0, 0.5], 'tasks.clutch.minPostpones': [1, 10], 'tasks.clutch.maxPerDay': [0, 10],
  'tasks.dailyCap': [100, 300], 'tasks.maxEstimateMin': [30, 240],
  'tasks.subtaskMin': [5, 120], 'tasks.subtaskMax': [15, 180], 'tasks.firstStepMaxChars': [20, 500],
  'tasks.maxMustsPerDay': [1, 10],
  // 02-tasks §3 permits a pack budget of 3–15; automatic limits stay inside it.
  'tasks.postpone.weeklyBudget': [3, 15], 'tasks.postpone.realReasonExceptionsPerWeek': [0, 7],
  'tasks.postpone.autoSomedayAt': [2, 10], 'tasks.postpone.untouchedDaysToSomeday': [1, 60],
  'tasks.postpone.autoRaise.lookbackWeeks': [1, 12], 'tasks.postpone.autoRaise.overrunWeeksThreshold': [1, 12],
  'tasks.postpone.autoRaise.raiseBy': [1, 5], 'tasks.postpone.baselineFactor': [0, 1],
  'tasks.postpone.autoBudgetMin': [3, 15], 'tasks.postpone.autoBudgetMax': [3, 15],
  'tasks.freeHours.classDay': [0, 24], 'tasks.freeHours.weekend': [0, 24],
  'tasks.focus.workMin': [5, 120], 'tasks.focus.breakMin': [1, 30],
  'tasks.focus.longBreakMin': [5, 60], 'tasks.focus.longBreakEvery': [1, 10],
  'tasks.focus.extendMin': [1, 60], 'tasks.focus.presetLong.0': [5, 120], 'tasks.focus.presetLong.1': [1, 30],
  'tasks.calibrationMinSamples': [1, 50], 'tasks.startAdherenceWindowMin': [0, 60],
  'tasks.liveTimers': [1, 1], 'tasks.preReminderMin': [0, 30],
  // Train: session awards, weekly goals, progression and safe finite placement tests.
  'train.sessionFullXp': [1, 200], 'train.sessionPartialFloorXp': [0, 200],
  'train.minimumOrSafetyXp': [0, 200], 'train.restDayCheckXp': [0, 50],
  'train.restDayCheckMinMinutes': [1, 60], 'train.prXp': [0, 100], 'train.prMaxPerDay': [0, 10],
  'train.weeklyTarget': [2, 7], 'train.weeklyBonus.targetMet': [0, 200], 'train.weeklyBonus.oneShort': [0, 200],
  'train.dailyCapExclWeekly': [40, 300],
  'train.progression.confirmSessions': [1, 10], 'train.progression.failHoldAt': [1, 10],
  'train.progression.failDeloadAt': [1, 10], 'train.progression.deloadPct': [0, 50],
  'train.progression.maxIncreasesPerWeekEarly': [0, 5], 'train.progression.earlyWeeks': [0, 52],
  'train.ladder.repMin': [1, 30], 'train.ladder.repMax': [1, 30], 'train.ladder.sets': [1, 10],
  'train.ladder.holdMinS': [1, 180], 'train.ladder.holdMaxS': [1, 300],
  'train.placement.stopMinReps': [1, 30], 'train.placement.stopMaxReps': [1, 30],
  'train.placement.moveUpAtReps': [2, 30], 'train.placement.maxTestsPerPattern': [1, 10],
  'train.weeklyHardSetIncreaseMaxPct': [0, 100], 'train.heatMode.volumeCutPct': [0, 50],
  'train.heatMode.acclimatiseDays': [1, 30], 'train.retestEveryWeeks': [1, 52],
  // Mind: nonnegative XP, bounded daily volume and valid rating/interval domains.
  'mind.mysteryXp': [0, 100], 'mind.dropBoardXp': [0, 100], 'mind.lessonXp': [0, 100],
  'mind.lessonsPaidPerDay': [0, 10], 'mind.lessonsPerCoursePerDay': [0, 10],
  'mind.cardXp': [0, 20], 'mind.cardsMaxPerDay': [0, 100], 'mind.sideBoardXp': [0, 100],
  'mind.sideBoardsMaxPerDay': [0, 10], 'mind.dailyCap': [40, 120], 'mind.freePlayXp': [0, 0],
  'mind.onboardingEasyCases': [0, 20], 'mind.eloK.early': [1, 100], 'mind.eloK.later': [1, 100],
  'mind.eloK.earlyAnswers': [1, 100], 'mind.eloClamp.0': [0, 3000], 'mind.eloClamp.1': [100, 4000],
  'mind.hintScore': [0, 1], 'mind.caseScore.cleanSolve': [0, 1],
  'mind.caseScore.withHintsOrSecondTry': [0, 1], 'mind.caseScore.revealed': [0, 1],
  'mind.cardBoxIntervalsDays.0': [0, 365], 'mind.cardBoxIntervalsDays.1': [0, 365],
  'mind.cardBoxIntervalsDays.2': [0, 365], 'mind.cardBoxIntervalsDays.3': [0, 365],
  'mind.cardBoxIntervalsDays.4': [0, 365], 'mind.cardBoxIntervalsDays.5': [0, 365],
  'mind.cardBoxIntervalsDays.6': [0, 365],
  'mind.itemIntervalsDays.0': [0, 365], 'mind.itemIntervalsDays.1': [0, 365],
  'mind.itemIntervalsDays.2': [0, 365], 'mind.itemIntervalsDays.3': [0, 365],
  'mind.itemIntervalsDays.4': [0, 365],
  'mind.itemRetryDays.default': [0, 30], 'mind.itemRetryDays.teaser': [0, 30],
  // Cross-mode rewards and the level curve.
  'bonuses.hatTrickXp': [0, 100], 'bonuses.lightsOutXp': [0, 100],
  'level.stepBase': [1, 1000], 'level.softCap': [1, 200],
  // Season percentages and ranks remain inside a 1–1000-seat ladder.
  'season.spDailyCap': [1, 1000], 'season.targetPerDay': [1, 1000],
  'season.exponent': [0.1, 2], 'season.seats': [2, 1000], 'season.seedPct': [0, 100],
  'season.tiers.0.1': [1, 1000], 'season.tiers.0.2': [1, 1000],
  'season.tiers.1.1': [1, 1000], 'season.tiers.1.2': [1, 1000],
  'season.tiers.2.1': [1, 1000], 'season.tiers.2.2': [1, 1000],
  'season.tiers.3.1': [1, 1000], 'season.tiers.3.2': [1, 1000],
  'season.tiers.4.1': [1, 1000], 'season.tiers.4.2': [1, 1000],
  'season.tiers.5.1': [1, 1000], 'season.tiers.5.2': [1, 1000],
  // Streak windows and repair costs are finite and nonnegative.
  'streak.startFreezes': [0, 10], 'streak.maxFreezes': [0, 10],
  'streak.freezeEveryDays': [1, 60], 'streak.freezeShardPrice': [0, 1000],
  'streak.restDaysPerWeek': [0, 7], 'streak.repairWindowHours': [1, 168],
  'streak.repairHatTricks': [0, 7], 'streak.goldAfterDays': [1, 365],
  'streak.cleanWeekHatTricks': [0, 7], 'streak.minDueCardsForMark': [0, 100],
  // Shards and shop prices cannot become negative.
  'shards.perXp': [0, 1], 'shards.levelUpBonus': [0, 1000],
  'shards.seasonEnd.Bench': [0, 1000], 'shards.seasonEnd.Challenger': [0, 1000],
  'shards.seasonEnd.Contender': [0, 1000], 'shards.seasonEnd.Elite': [0, 1000],
  'shards.seasonEnd.Ace': [0, 1000], 'shards.seasonEnd.Apex': [0, 1000],
  'shards.prices.freeze': [0, 2000], 'shards.prices.cardBack.0': [0, 2000],
  'shards.prices.cardBack.1': [0, 2000], 'shards.prices.banner.0': [0, 2000],
  'shards.prices.banner.1': [0, 2000], 'shards.prices.puzzlePack.0': [0, 2000],
  'shards.prices.puzzlePack.1': [0, 2000], 'shards.prices.soundPack': [0, 2000],
  'shards.prices.theme.0': [0, 2000], 'shards.prices.theme.1': [0, 2000],
  // Night and system limits: bounded days/minutes, notifications, backup and animation durations.
  'night.windDownCapMin': [0, 60], 'night.bedtimeStepMin': [1, 60],
  'night.bedtimeRampEveryDays': [1, 30], 'night.bedtimeRampNeedsMetOfLast3': [0, 3],
  'night.shutdownMinBeforeBedtime': [0, 180], 'night.streakReminderMinBeforeBedtime': [0, 240],
  'notifications.engagementPerDayMax': [0, 5], 'backup.nagAfterDays': [1, 90],
  'juice.microMs.0': [0, 1000], 'juice.microMs.1': [0, 1000],
  'juice.mesoMs.0': [0, 2000], 'juice.mesoMs.1': [0, 2000],
  'juice.macroMs.0': [0, 5000], 'juice.macroMs.1': [0, 5000],
  'juice.macroPerDayMax': [0, 10],
};

export type RulesHistoryEntry = { effectiveFrom: string; rules: Rules; note?: string };

export const RULES_HISTORY: readonly RulesHistoryEntry[] = [
  { effectiveFrom: RULES.effectiveFrom, rules: RULES },
];

/** Finds the latest version in force on a dayKey; no entry applies before the first date. */
export function rulesFor(
  dayKey: string,
  history: readonly RulesHistoryEntry[] = RULES_HISTORY,
): RulesHistoryEntry | undefined {
  let current: RulesHistoryEntry | undefined;
  for (const entry of history) {
    if (entry.effectiveFrom <= dayKey && (!current || entry.effectiveFrom > current.effectiveFrom)) {
      current = entry;
    }
  }
  return current;
}
