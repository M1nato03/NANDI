/** Starting defaults from 05-economy §2. Rule changes apply by dayKey, never retroactively. */
export const RULES = {
  version: 5,
  // 28 Oct (spec 36, "Effort pays"): measured effort pays more: focus minutes and clean blocks, a longer kept chhutti and
  // calm minutes; the tasks cap rises to 300. It counts from economy.v6From, the day this build first runs on a phone,
  // so no day shown before it is rescored; see RULES_HISTORY.
  // 29 Oct (spec 36 v2): Train pays per real set, a harder Mind board pays more (less per hint), and a Read chapter pays
  // for what it taught and what was answered right; the Train and Mind caps rise. From economy.v7From.
  effectiveFrom: '2026-10-29',
  dayBoundaryHour: 4,
  // Spec 26: Moti's haveli offers at most this many ideas a day. It decides what is offered, not what pays (the
  // rebuild pays as a card review under mind.cardsMaxPerDay), so it sits outside the scoring keys.
  moti: { haveliDailyCap: 5 },

  // 05-economy §2, Tasks; 02-tasks §6 (timers and optional pre-reminder).
  tasks: {
    sizeMinutes: { S: [0, 15], M: [16, 45], L: [46, 90] },
    xpBySize: { S: 10, M: 20, L: 35 },
    firstDayMultiplier: 1.5,
    fullRateTasksPerDay: 8,
    overflowMultiplier: 0.5,
    quickWin: { xp: 5, withinMin: 30, maxPerDay: 5 },
    // Clutch is a flat bonus, capped by the first-day bonus forfeited.
    clutch: { clutchBonusXp: 5, minPostpones: 2, maxPerDay: 1 },
    dailyCap: 300,
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
    // Spec 36: minutes on the focus timer pay, measured and honest. 1 XP per 2 minutes (pauses and time in a distracting
    // app never count), +5 for each full 25-minute block with no pause, only while the focus guard can watch. After 60
    // minutes with no touch, "Still working?" waits 5 minutes, then the timer pauses itself at the prompt. A distracting
    // app in front for 60 seconds pauses the focus at the moment it opened.
    focusPay: { minutesPerXp: 2, blockMin: 25, blockXp: 5, stillCheckMin: 60, stillGraceMin: 5, guardGraceSec: 60 },
    calibrationMinSamples: 5,
    rewardBlockedWords: ['instagram', 'insta', 'reels', 'shorts', 'youtube', 'tiktok', 'snapchat', 'facebook', 'twitter', 'x.com', 'threads'],
    startAdherenceWindowMin: 15,
    liveTimers: 1,
    preReminderMin: 5,
  },

  // 05-economy §2, Train; placement thresholds from 03-train §1 and DECISIONS.md.
  train: {
    // Smallest load step per equipment kind, kg (spec 03 §3: from his equipment, never a constant).
    increments: { dumbbell: 2.5, machine: 5, cable: 2.5 },
    sessionFullXp: 60,
    sessionPartialFloorXp: 40,
    minimumOrSafetyXp: 40,
    restDayCheckXp: 10,
    restDayCheckMinMinutes: 10,
    prXp: 15,
    prMaxPerDay: 2,
    weeklyTarget: 3,
    weeklyBonus: { targetMet: 60, oneShort: 30 },
    // Spec 36 v2: a whole plan pays baseXp + perSetXp for each paid working set, up to maxSets; a session stopped early
    // pays partialPerSetXp a set (floor sessionPartialFloorXp when every exercise was touched). A set is paid only when
    // it fills a planned slot and comes at least minGapS after the previous paid set (a real set plus rest always does).
    setPay: { baseXp: 48, perSetXp: 4, partialPerSetXp: 8, maxSets: 12, minGapS: 45 },
    dailyCapExclWeekly: 130,
    progression: { confirmSessions: 2, failHoldAt: 2, failDeloadAt: 3, deloadPct: 10, maxIncreasesPerWeekEarly: 1, earlyWeeks: 6 },
    ladder: { repMin: 5, repMax: 8, sets: 3, holdMinS: 20, holdMaxS: 60 },
    placement: { stopMinReps: 5, stopMaxReps: 11, moveUpAtReps: 12, maxTestsPerPattern: 3 },
    weeklyHardSetIncreaseMaxPct: 20,
      prLoadJumpConfirmPct: 50,
      compoundRestS: 90,
      coreRestS: 60,
      heatIndoorCelsius: 27,
      heatIndoorHumidityPct: 75,
    heatMode: { volumeCutPct: 25, acclimatiseDays: 12 },
    retestEveryWeeks: 8,
      retestVolumeCutPct: 30,
  },

  // 05-economy §2, Mind.
  mind: {
    learnDropXp: 15,
    mysteryXp: 25,
    dropBoardXp: 10,
    lessonXp: 15,
    lessonsPaidPerDay: 1,
    lessonsPerCoursePerDay: 1,
    cardXp: 1,
    cardsMaxPerDay: 20,
    sideBoardXp: 10,
    sideBoardsMaxPerDay: 1,
    // Spec 30: playing Chiku's one-card scene, once per idea, the same whichever card comes first.
    chikuXp: 5,
    // Spec 36 v2: a solved board pays by its difficulty, less hintXp per hint, never below minXp; no time bonus.
    boardPay: { easy: 10, medium: 20, hard: 30, hintXp: 5, minXp: 5 },
    // Spec 36 v2: a new chapter pays baseXp + stepXp per newly taught step + rightXp per right first answer in its check
    // (at most rightMax), up to maxXp, for paidPerDay chapters a day. It replaces the day's drop 15 when it was the drop.
    chapterPay: { baseXp: 5, stepXp: 5, rightXp: 5, rightMax: 3, maxXp: 40, paidPerDay: 3 },
    dailyCap: 120,
    freePlayXp: 0,
    dropUnlockTime: '07:00',
    featuredByWeekday: {
      1: ['sudoku', 'easy'], 2: ['sunmoon', 'easy'], 3: ['path', 'medium'], 4: ['crowns', 'medium'],
      5: ['calc', 'medium'], 6: ['crowns', 'hard'], 0: ['BOSS', 'hard'],
    },
    bossRotation: ['sudoku', 'crowns', 'calc', 'path', 'sunmoon'],
    caseDiffByWeekday: { 1: 'easy', 2: 'easy', 3: 'medium', 4: 'medium', 5: 'medium', 6: 'medium', 0: 'hard' },
    onboardingEasyCases: 3,
    hintLadderRungs: 3,
    parMinSolves: 5,
    parWindow: 10,
    arcCount: 4,
    arcChapters: 5,
    arcPanelMaxWords: 60,
    eloK: { early: 40, later: 24, earlyAnswers: 20 },
    eloClamp: [400, 2400],
    hintScore: 0.6,
    // Spec 04: the detective rating a daily case is scored against, by difficulty (internal, never shown or paid).
    caseElo: { easy: 1000, medium: 1100, hard: 1200 },
    caseScore: { cleanSolve: 1, withHintsOrSecondTry: 0.7, revealed: 0 },
    cardBoxIntervalsDays: [0, 1, 3, 7, 14, 30, 60],
    reviewSession: { ramp: [5, 7, 10], bigPile: 10, resetAfterDays: 7, spreadAbove: 50, spreadPerDay: 10 },
    itemIntervalsDays: [0, 21, 45, 90, 180],
    itemRetryDays: { default: 2, teaser: 3 },
    miniMysteryRetiresAfterAnswer: true,
    // Spec 19 B: "Daily board #1" is this planning day (release day; Jenil may move it).
    boardNumberEpoch: '2026-10-23',
  },

  learningTracks: {
    activeTracks: 1, newUnitsPerWeek: 4, dailyBudgetMin: 25,
    unitCheckMin: 3, moduleTestMin: 10, dueReviewMin: 1,
    newCardsPerDay: 5, backlogBrakeDue: 30, busyDayCards: 1,
    // Spec 14: a lesson day is one new step plus up to this many reviews of earlier steps.
    lessonReviews: 3,
    checkMinQuestions: 3, modulePassPercent: 70,
  },

  teachingEngine: {
    calibrationDisplayMinAnswers: 20,
    contentReviewSamplePerModule: 5,
    contentReviewNoteMaxChars: 300,
    // [slip, guess] for each tap format. Both stay within [0.01, 0.49].
    bkt: {
      predict: [0.12, 0.25], choose: [0.10, 0.20], why: [0.12, 0.20],
      order: [0.16, 0.10], match: [0.16, 0.12], estimate: [0.20, 0.15],
      scenario: [0.12, 0.20], 'fill-the-step': [0.14, 0.20],
      'true-not-quite': [0.14, 0.49], 'explain-it-back': [0.12, 0.33],
    },
    learn: 0.02, eloK: 24, targetSuccess: [0.75, 0.85],
  },

  // 05-economy §2, cross-mode bonuses.
  bonuses: { hatTrickXp: 30, lightsOutXp: 15 },
  // Spec 15, soft days: one gentle thing keeps the day (flat XP, no Hat-trick slot); a fixed gift on the first day back.
  soft: { dayXp: 10, welcomeBackXp: 15, from: '2026-10-22', careLowDays: 4, careWindowDays: 14 },
  // Your own side quests pay XP for the first few done each week; more still count as done (cj4 item 45).
  quests: { sideQuestXp: 20, paidCustomPerWeek: 3 },
  gamify: { dailyQuestShards: 8, badgeTierShards: 5, unitChestShards: 25, perfectDropXp: 10,
    focusMinutes: 15, focusMultiplier: 2, goldReviewItems: 5, goldReviewPass: 4,
    badgeThresholds: [1, 5, 20] },

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
    restBankMonthly: 4,
    restBankMax: 12,
    awayMaxDays: 14,
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
    // One price table: the shop shows these and the replay charges them (batch 5 moved both copies here).
    prices: {
      freeze: 50, 'cardback:weave': 100, 'cardback:orbit': 150, 'cardback:steps': 150,
      'banner:dawn': 100, 'banner:grove': 150, 'banner:sky': 150, 'puzzle:paths': 150, 'puzzle:patterns': 250,
      'sound:soft': 300, 'theme:linen': 400, 'theme:lagoon': 800,
    },
  },

  // 05-economy §2, night schedule. Clock bounds, if added, use the night timeline.
  // spec 11 W5: a busy day moves the night later (bounded) and keeps Learn small.
  adaptive: { busyMinutes: 240, busyShiftMin: 30, veryBusyMinutes: 360, veryBusyShiftMin: 60 },
  // Spec 24 #3 Taal week: how many claps a week can move to a later rest beat. It pays nothing, so it sits outside the
  // scoring keys (cj5-train §7 #1).
  taal: { movesPerWeek: 1 },

  // Spec 17 Nordic ready card. Not scoring, so it sits outside `train` (whose values the rules history fingerprints).
  nordic: { notNowDays: 14, introSets: 2, introReps: 3 },

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
    pauseLeadMin: 30,
    pauseBreathSeconds: 5,
    pauseSnoozeMin: 10,
    pauseTestMin: 2,
    pauseDayLimitMin: 30,
    pauseDayLimitChoices: [15, 30, 45, 60, 90],
    // The "If I…, then I…" night plan leads the night card from this long before bedtime.
    planLeadMin: 30,
  },

  // Spec 24 #1 (cj5-focus §5 #1): Phone ki chhutti, a planned off-phone window checked afterwards, never blocked.
  // xp: Jenil chose 10 for a MEASURED kept window on 24 Oct (item 64); a self-reported one always pays 0.
  // Spec 36: a measured window pays xp for its first 30 minutes and extraXpPer10Min for each further 10 (60 min = 16, 3 h = 40).
  plan: { chhutti: { xp: 10, extraXpPer10Min: 2, paidPerDay: 1, startMin: 30, rampStepMin: 15, maxMin: 180, graceMin: 5, rampNeedsKeptOfLast3: 2, lockPasses: 3, lockSlackMs: 5000 } },

  // Spec 36: each minute sat in a counted Calm session pays, up to a daily cap.
  calm: { xpPerMin: 1, dailyCap: 30 },

  // Spec 12: practice days a courtyard corner needs for stages 1–5. Days, never points.
  courtyard: { stageDays: [3, 7, 14, 30, 60] },

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
  ...Object.fromEntries(Object.keys(RULES.teachingEngine.bkt).flatMap(type => [
    [`teachingEngine.bkt.${type}.0`, [0.01, 0.49]],
    [`teachingEngine.bkt.${type}.1`, [0.01, 0.49]],
  ])),
  'teachingEngine.learn': [0, 0.1], 'teachingEngine.eloK': [1, 80],
  'teachingEngine.calibrationDisplayMinAnswers': [1, 100],
  'teachingEngine.contentReviewSamplePerModule': [1, 20], 'teachingEngine.contentReviewNoteMaxChars': [50, 1000],
  'teachingEngine.targetSuccess.0': [0.5, 0.9], 'teachingEngine.targetSuccess.1': [0.5, 0.95],
  'learningTracks.activeTracks': [1, 1], 'learningTracks.newUnitsPerWeek': [1, 4],
  'learningTracks.dailyBudgetMin': [10, 45], 'learningTracks.newCardsPerDay': [1, 5], 'learningTracks.lessonReviews': [0, 10],
  'learningTracks.unitCheckMin': [1, 10], 'learningTracks.moduleTestMin': [5, 20], 'learningTracks.dueReviewMin': [0, 5],
  'learningTracks.backlogBrakeDue': [10, 50], 'learningTracks.busyDayCards': [1, 1],
  'learningTracks.checkMinQuestions': [3, 3], 'learningTracks.modulePassPercent': [50, 90],
  'quests.sideQuestXp': [0, 50], 'quests.paidCustomPerWeek': [0, 50],
  'gamify.dailyQuestShards': [0, 100], 'gamify.badgeTierShards': [0, 100],
  'gamify.unitChestShards': [0, 200], 'gamify.perfectDropXp': [0, 100],
  'gamify.focusMinutes': [1, 60], 'gamify.focusMultiplier': [1, 3],
  'gamify.goldReviewItems': [5, 5], 'gamify.goldReviewPass': [4, 5],
  'gamify.badgeThresholds.0': [1, 100], 'gamify.badgeThresholds.1': [2, 500], 'gamify.badgeThresholds.2': [3, 1000],
  // Identity and day boundary: version is a positive schema number; hours use a local 24-hour clock.
  version: [1, 999], dayBoundaryHour: [0, 23],
  // Tasks: size bands cover practical estimates; XP and caps remain nonnegative.
  'tasks.sizeMinutes.S.0': [0, 0], 'tasks.sizeMinutes.S.1': [5, 30],
  'tasks.sizeMinutes.M.0': [1, 60], 'tasks.sizeMinutes.M.1': [15, 90],
  'tasks.sizeMinutes.L.0': [1, 120], 'tasks.sizeMinutes.L.1': [30, 240],
  'tasks.xpBySize.S': [1, 100], 'tasks.xpBySize.M': [1, 150], 'tasks.xpBySize.L': [1, 200],
  'tasks.firstDayMultiplier': [1, 2], 'tasks.fullRateTasksPerDay': [1, 20], 'tasks.overflowMultiplier': [0, 1],
  'tasks.quickWin.xp': [0, 50], 'tasks.quickWin.withinMin': [1, 120], 'tasks.quickWin.maxPerDay': [0, 20],
  'tasks.clutch.clutchBonusXp': [0, 50], 'tasks.clutch.minPostpones': [1, 10], 'tasks.clutch.maxPerDay': [0, 10],
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
  'tasks.focusPay.minutesPerXp': [1, 10], 'tasks.focusPay.blockMin': [10, 60], 'tasks.focusPay.blockXp': [0, 20],
  'tasks.focusPay.stillCheckMin': [30, 180], 'tasks.focusPay.stillGraceMin': [1, 15], 'tasks.focusPay.guardGraceSec': [10, 300],
  'calm.xpPerMin': [0, 5], 'calm.dailyCap': [0, 60],
  'tasks.calibrationMinSamples': [1, 50], 'tasks.startAdherenceWindowMin': [0, 60],
  'tasks.liveTimers': [1, 1], 'tasks.preReminderMin': [0, 30],
  // Train: session awards, weekly goals, progression and safe finite placement tests.
  'train.sessionFullXp': [1, 200], 'train.sessionPartialFloorXp': [0, 200],
  'train.minimumOrSafetyXp': [0, 200], 'train.restDayCheckXp': [0, 50],
  'train.restDayCheckMinMinutes': [1, 60], 'train.prXp': [0, 100], 'train.prMaxPerDay': [0, 10],
  'train.weeklyTarget': [2, 7], 'train.weeklyBonus.targetMet': [0, 200], 'train.weeklyBonus.oneShort': [0, 200],
  'train.dailyCapExclWeekly': [40, 300],
  'train.setPay.baseXp': [0, 100], 'train.setPay.perSetXp': [0, 20], 'train.setPay.partialPerSetXp': [0, 20], 'train.setPay.maxSets': [1, 30], 'train.setPay.minGapS': [0, 300],
  'mind.boardPay.easy': [0, 100], 'mind.boardPay.medium': [0, 100], 'mind.boardPay.hard': [0, 100], 'mind.boardPay.hintXp': [0, 50], 'mind.boardPay.minXp': [0, 50],
  'mind.chapterPay.baseXp': [0, 50], 'mind.chapterPay.stepXp': [0, 20], 'mind.chapterPay.rightXp': [0, 20], 'mind.chapterPay.rightMax': [0, 10],
  'mind.chapterPay.maxXp': [0, 100], 'mind.chapterPay.paidPerDay': [0, 10],
  'train.increments.dumbbell': [0.5, 10], 'train.increments.machine': [0.5, 20], 'train.increments.cable': [0.5, 10],
  'train.progression.confirmSessions': [1, 10], 'train.progression.failHoldAt': [1, 10],
  'train.progression.failDeloadAt': [1, 10], 'train.progression.deloadPct': [0, 50],
  'train.progression.maxIncreasesPerWeekEarly': [0, 5], 'train.progression.earlyWeeks': [0, 52],
  'train.ladder.repMin': [1, 30], 'train.ladder.repMax': [1, 30], 'train.ladder.sets': [1, 10],
  'train.ladder.holdMinS': [1, 180], 'train.ladder.holdMaxS': [1, 300],
  'train.placement.stopMinReps': [1, 30], 'train.placement.stopMaxReps': [1, 30],
  'train.placement.moveUpAtReps': [2, 30], 'train.placement.maxTestsPerPattern': [1, 10],
  'train.weeklyHardSetIncreaseMaxPct': [0, 100], 'train.heatMode.volumeCutPct': [0, 50],
    'train.prLoadJumpConfirmPct': [0, 200], 'train.compoundRestS': [0, 300],
    'train.coreRestS': [0, 300], 'train.heatIndoorCelsius': [0, 50],
    'train.heatIndoorHumidityPct': [0, 100],
  'train.heatMode.acclimatiseDays': [1, 30], 'train.retestEveryWeeks': [1, 52],
    'train.retestVolumeCutPct': [0, 80],
  'nordic.notNowDays': [1, 60], 'nordic.introSets': [1, 5], 'nordic.introReps': [1, 10],
  // Mind: nonnegative XP, bounded daily volume and valid rating/interval domains.
  'mind.mysteryXp': [0, 100], 'mind.dropBoardXp': [0, 100], 'mind.lessonXp': [0, 100],
  'mind.learnDropXp': [0, 100],
  'mind.lessonsPaidPerDay': [0, 10], 'mind.lessonsPerCoursePerDay': [0, 10],
  'mind.cardXp': [0, 20], 'mind.chikuXp': [0, 20], 'moti.haveliDailyCap': [3, 8], 'mind.cardsMaxPerDay': [0, 100], 'mind.sideBoardXp': [0, 100],
  'mind.sideBoardsMaxPerDay': [0, 10], 'mind.dailyCap': [40, 200], 'mind.freePlayXp': [0, 0],
  'mind.onboardingEasyCases': [0, 20], 'mind.eloK.early': [1, 100], 'mind.eloK.later': [1, 100],
  'mind.hintLadderRungs': [3, 3], 'mind.parMinSolves': [1, 10], 'mind.parWindow': [5, 20],
  'mind.arcCount': [4, 4], 'mind.arcChapters': [4, 5], 'mind.arcPanelMaxWords': [1, 60],
  'mind.eloK.earlyAnswers': [1, 100], 'mind.eloClamp.0': [0, 3000], 'mind.eloClamp.1': [100, 4000],
  'mind.hintScore': [0, 1], 'mind.caseElo.easy': [400, 2400], 'mind.caseElo.medium': [400, 2400], 'mind.caseElo.hard': [400, 2400], 'mind.caseScore.cleanSolve': [0, 1],
  'mind.caseScore.withHintsOrSecondTry': [0, 1], 'mind.caseScore.revealed': [0, 1],
  'mind.cardBoxIntervalsDays.0': [0, 365], 'mind.cardBoxIntervalsDays.1': [0, 365],
  'mind.cardBoxIntervalsDays.2': [0, 365], 'mind.cardBoxIntervalsDays.3': [0, 365],
  'mind.cardBoxIntervalsDays.4': [0, 365], 'mind.cardBoxIntervalsDays.5': [0, 365],
  'mind.cardBoxIntervalsDays.6': [0, 365],
  'mind.reviewSession.ramp.0': [1, 10], 'mind.reviewSession.ramp.1': [1, 10],
  'mind.reviewSession.ramp.2': [1, 20], 'mind.reviewSession.bigPile': [1, 50],
  'mind.reviewSession.resetAfterDays': [1, 30], 'mind.reviewSession.spreadAbove': [10, 100],
  'mind.reviewSession.spreadPerDay': [1, 20],
  'mind.itemIntervalsDays.0': [0, 365], 'mind.itemIntervalsDays.1': [0, 365],
  'mind.itemIntervalsDays.2': [0, 365], 'mind.itemIntervalsDays.3': [0, 365],
  'mind.itemIntervalsDays.4': [0, 365],
  'mind.itemRetryDays.default': [0, 30], 'mind.itemRetryDays.teaser': [0, 30],
  // Cross-mode rewards and the level curve.
  'bonuses.hatTrickXp': [0, 100], 'bonuses.lightsOutXp': [0, 100],
  'soft.dayXp': [0, 100], 'soft.welcomeBackXp': [0, 100], 'soft.careLowDays': [1, 14], 'soft.careWindowDays': [1, 60],
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
  'streak.restBankMonthly': [0, 31], 'streak.restBankMax': [0, 365],
  'streak.awayMaxDays': [1, 365], 'streak.freezeShardPrice': [0, 1000],
  'streak.restDaysPerWeek': [0, 7], 'streak.repairWindowHours': [1, 168],
  'streak.repairHatTricks': [0, 7], 'streak.goldAfterDays': [1, 365],
  'streak.cleanWeekHatTricks': [0, 7], 'streak.minDueCardsForMark': [0, 100],
  // Shards and shop prices cannot become negative.
  'shards.perXp': [0, 1], 'shards.levelUpBonus': [0, 1000],
  'shards.seasonEnd.Bench': [0, 1000], 'shards.seasonEnd.Challenger': [0, 1000],
  'shards.seasonEnd.Contender': [0, 1000], 'shards.seasonEnd.Elite': [0, 1000],
  'shards.seasonEnd.Ace': [0, 1000], 'shards.seasonEnd.Apex': [0, 1000],
  'shards.prices.freeze': [0, 2000], 'shards.prices.cardback:weave': [0, 2000], 'shards.prices.cardback:orbit': [0, 2000],
  'shards.prices.cardback:steps': [0, 2000], 'shards.prices.banner:dawn': [0, 2000], 'shards.prices.banner:grove': [0, 2000],
  'shards.prices.banner:sky': [0, 2000], 'shards.prices.puzzle:paths': [0, 2000], 'shards.prices.puzzle:patterns': [0, 2000],
  'shards.prices.sound:soft': [0, 2000], 'shards.prices.theme:linen': [0, 2000], 'shards.prices.theme:lagoon': [0, 2000],
  // Night and system limits: bounded days/minutes, notifications, backup and animation durations.
  'night.windDownCapMin': [0, 60], 'night.bedtimeStepMin': [1, 60],
  'night.bedtimeRampEveryDays': [1, 30], 'night.bedtimeRampNeedsMetOfLast3': [0, 3],
  'night.shutdownMinBeforeBedtime': [0, 180], 'night.streakReminderMinBeforeBedtime': [0, 240],
  'night.pauseLeadMin': [0, 120],
  'night.pauseBreathSeconds': [1, 30], 'night.pauseSnoozeMin': [1, 60], 'night.pauseTestMin': [1, 10], 'night.pauseDayLimitMin': [5, 240],
  'night.pauseDayLimitChoices.0': [5, 240], 'night.pauseDayLimitChoices.1': [5, 240], 'night.pauseDayLimitChoices.2': [5, 240],
  'night.pauseDayLimitChoices.3': [5, 240], 'night.pauseDayLimitChoices.4': [5, 240], 'night.planLeadMin': [0, 180],
  'plan.chhutti.xp': [0, 50], 'plan.chhutti.extraXpPer10Min': [0, 10], 'plan.chhutti.paidPerDay': [0, 3], 'plan.chhutti.startMin': [10, 120], 'plan.chhutti.rampStepMin': [0, 60],
  'plan.chhutti.maxMin': [30, 300], 'plan.chhutti.graceMin': [0, 30], 'plan.chhutti.rampNeedsKeptOfLast3': [1, 3], 'plan.chhutti.lockPasses': [1, 10], 'plan.chhutti.lockSlackMs': [1000, 15000],
  'courtyard.stageDays.0': [1, 400], 'courtyard.stageDays.1': [1, 400], 'courtyard.stageDays.2': [1, 400], 'courtyard.stageDays.3': [1, 400], 'courtyard.stageDays.4': [1, 400],
  'taal.movesPerWeek': [0, 3],
  'adaptive.busyMinutes': [60, 720], 'adaptive.busyShiftMin': [0, 60], 'adaptive.veryBusyMinutes': [60, 900], 'adaptive.veryBusyShiftMin': [0, 60],
  'notifications.engagementPerDayMax': [0, 5], 'backup.nagAfterDays': [1, 90],
  'juice.microMs.0': [0, 1000], 'juice.microMs.1': [0, 1000],
  'juice.mesoMs.0': [0, 2000], 'juice.mesoMs.1': [0, 2000],
  'juice.macroMs.0': [0, 5000], 'juice.macroMs.1': [0, 5000],
  'juice.macroPerDayMax': [0, 10],
};

export type RulesHistoryEntry = { effectiveFrom: string; rules: Rules; note?: string };

// Before 29 Oct (spec 36 v2) a session paid by its share of planned sets, every board paid 10 and a chapter paid
// through the day's drop, with caps of 100 and 80: the frozen copies have no setPay, boardPay or chapterPay keys.
const { setPay: _noSetPay, ...TRAIN_BEFORE_V2 } = RULES.train;
const { boardPay: _noBoardPay, chapterPay: _noChapterPay, ...MIND_BEFORE_V2 } = RULES.mind;
void _noSetPay; void _noBoardPay; void _noChapterPay;
/** The rules in force from 28 Oct: focus minutes, a longer chhutti and calm pay (spec 36 v1). Frozen. */
const RULES_2026_10_28 = { ...RULES, version: 4, effectiveFrom: '2026-10-28', train: { ...TRAIN_BEFORE_V2, dailyCapExclWeekly: 100 }, mind: { ...MIND_BEFORE_V2, dailyCap: 80 } } as unknown as Rules;
// Before 28 Oct (spec 36) focus minutes, a longer chhutti and calm minutes paid nothing and the tasks cap was 200, so
// the frozen copies have no focusPay, extraXpPer10Min or calm keys at all (each reads as 0).
const { focusPay: _noFocusPay, ...TASKS_BEFORE_EFFORT } = RULES_2026_10_28.tasks;
const { extraXpPer10Min: _noExtra, ...CHHUTTI_BEFORE_EFFORT } = RULES_2026_10_28.plan.chhutti;
const { calm: _noCalm, ...RULES_WITHOUT_CALM } = RULES_2026_10_28;
void _noFocusPay; void _noExtra; void _noCalm;
/** The rules in force from 26 Oct: teaching Chiku pays (spec 30); effort did not pay yet. Frozen. */
const RULES_2026_10_26 = { ...RULES_WITHOUT_CALM, version: 3, effectiveFrom: '2026-10-26', tasks: { ...TASKS_BEFORE_EFFORT, dailyCap: 200 }, plan: { chhutti: CHHUTTI_BEFORE_EFFORT } } as unknown as Rules;
// Before 26 Oct there was no Chiku step, so the frozen copies have no chikuXp key at all (it reads as 0).
const { chikuXp: _noChiku, ...MIND_BEFORE_CHIKU } = RULES_2026_10_28.mind;
void _noChiku;
/** The rules in force from 25 Oct: a measured chhutti pays 10 XP (item 64); no Chiku step yet. Frozen. */
const RULES_2026_10_25 = { ...RULES_2026_10_26, version: 2, effectiveFrom: '2026-10-25', mind: MIND_BEFORE_CHIKU } as unknown as Rules;
/** The rules in force from 5 Oct: as 25 Oct, except that a measured chhutti paid nothing (item 64). Frozen. */
const RULES_2026_10_05 = { ...RULES_2026_10_25, version: 1, effectiveFrom: '2026-10-05', plan: { chhutti: { ...CHHUTTI_BEFORE_EFFORT, xp: 0 } } } as unknown as Rules;

export const RULES_HISTORY: readonly RulesHistoryEntry[] = [
  { effectiveFrom: RULES_2026_10_05.effectiveFrom, rules: RULES_2026_10_05 },
  { effectiveFrom: RULES_2026_10_25.effectiveFrom, rules: RULES_2026_10_25, note: 'chhutti pays 10 XP when measured (item 64)' },
  { effectiveFrom: RULES_2026_10_26.effectiveFrom, rules: RULES_2026_10_26, note: 'teaching Chiku pays 5 XP once per idea (spec 30)' },
  { effectiveFrom: RULES_2026_10_28.effectiveFrom, rules: RULES_2026_10_28, note: 'effort pays: focus minutes and blocks, longer chhutti, calm minutes; tasks cap 300 (spec 36)' },
  { effectiveFrom: RULES.effectiveFrom, rules: RULES, note: 'effort pays in Train, Mind and Read: per real set, by board difficulty, by chapter depth; caps 130 and 120 (spec 36 v2)' },
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
