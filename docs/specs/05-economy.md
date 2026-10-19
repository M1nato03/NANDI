# 05 · Economy: one ledger, three modes, tilted toward real life

Evidence: `docs/research-brief.md`, section "One ledger pays all three modes". Where this spec differs from the brief, this spec wins; the differences are flagged inline.

**Principles from the evidence:**

- **Reward undermining:**
  - Expected tangible rewards reduce intrinsic motivation (d = −0.36), and completion-contingent ones more (−0.44).
  - "Less than the maximum" performance rewards are worst (−0.88).
  - Unexpected rewards have no effect (0.01).
  - Informational positive feedback helps college students (+0.43).
  - So: XP is framed as **feedback** ("3 of 3 planned tasks, your best Tuesday this month"). Surprises are deterministic but unannounced. Puzzles (already fun) are capped low. Real-world tasks and workouts carry most of the base XP (about 70% excluding bonuses; about 57% of the worked example below including bonuses). **No defeat states.**
- **No variable-ratio rewards of any kind:** no loot boxes, spins or random drops. That loop is what he's escaping.
- **Gamification decays:** the novelty dip comes around weeks 4–6. So: seasons, an Arc 2 change around week 5, and judging at weeks 8–10.
- **Streaks:** two freezes beat one, and three add nothing. Earn-back beats paying. Broken streaks cause drop-off. So: forgiving streaks, and a weekly Clean Week as the headline.
- **Progress never goes backwards:** no XP is ever removed. Level and Shards never decrease, whether from postponing, rule changes or anything else.

## 1. The ledger

- `ledger` is **append-only** and stores **facts only**: `id` (idempotent, `kind:refId`), `mode`, `kind`, `refId`, `dayKey`, `at`, and inputs such as `plannedSize`, `firstDay`, `shareOfSets` and `beforeBedtime`. **It stores no XP, SP or Shards.**
- **Every number is derived** by pure functions in `src/core/economy`, run over the facts in `dayKey` order. Caps and ordering rules (the 8th-task halving, the 80 Mind cap, quick-win limits) apply per day across rows. This keeps imports and merges consistent.
- **Derived views:**
  - **Level:** cumulative XP.
  - **Season rank:** SP is XP capped at 300 a day.
  - **Shards balance.**
  - **Streak state.**
  - **Hexagon** (28-day rolling).
- **Rule changes apply forward only.** Every rules version has an `effectiveFrom` dayKey.
  - Days before it are scored with the rules that were active then. The app keeps all past rules versions; they're small.
  - Days from it onward use the new rules.
  - So past XP, level and Shards **never decrease**. The only full replay is a migration that adds new derived views without changing old scores.
- **Night rule (after his bedtime until the 04:00 day boundary):**
  - **Mind** facts are logged but earn **0 XP** and don't count toward the Hat-trick or the daily streak mark.
  - **Tasks and Train** still count, because real work beats scrolling, but get no macro celebration.
  - The lights-out check-in happens before bedtime.
- **Baseline week:** the ledger is written, but the UI hides the economy until `settings.economyVisibleFrom`. Baseline XP counts toward level (endowed progress) but not toward Season 1.
- **19 Oct 2026 decision:** existing installs set `economyVisibleFrom` to the current day on upgrade. Season 1 still begins on 2 Nov; earlier XP affects level and Shards, not Season 1 SP.

## 2. `src/core/rules.config.ts` (starting values; all are judgement unless marked)

**Precedence:** code defaults < the latest valid `rules` pack < automatic adjustments the app makes within bounds (postpone budget from the baseline and auto-raise). A rules-pack value **resets the automatic value from its `effectiveFrom` date**, and automatic logic continues from there. Each layer is bounded by `RULES_BOUNDS`.

**Clock times at night:** compare times on a **night timeline** (minutes after 12:00 noon, so 23:15 → 675 and 01:15 → 795). One helper in `src/core/time` does this, and every min/max of clock times (shutdown, streak reminder, bedtime bounds and ramp) uses it. Tests use the default times.

```ts
export const RULES = {
  version: 1, effectiveFrom: '2026-10-05',
  dayBoundaryHour: 4,

  tasks: {
    sizeMinutes: { S: [0, 15], M: [16, 45], L: [46, 90] },
    xpBySize: { S: 10, M: 20, L: 35 },
    firstDayMultiplier: 1.5,                     // done on firstScheduledDayKey (see 02-tasks for inheritance on split)
    fullRateTasksPerDay: 8, overflowMultiplier: 0.5,
    quickWin: { xp: 5, withinMin: 30, maxPerDay: 5 },           // replaces size XP for that task
    clutch: { shareOfSizeXp: 0.25, minPostpones: 2, maxPerDay: 1 },   // unannounced; always less than the ×1.5 it lost
    dailyCap: 200,
    maxEstimateMin: 90, subtaskMin: 25, subtaskMax: 60, firstStepMaxChars: 120,
    maxMustsPerDay: 3,
    postpone: { weeklyBudget: 5, realReasonExceptionsPerWeek: 2, autoSomedayAt: 4, untouchedDaysToSomeday: 14,
                autoRaise: { lookbackWeeks: 4, overrunWeeksThreshold: 3, raiseBy: 2 },
                baselineFactor: 0.67, autoBudgetMin: 5, autoBudgetMax: 12 },
    freeHours: { classDay: 4, weekend: 6 },
    focus: { workMin: 25, breakMin: 5, longBreakMin: 15, longBreakEvery: 4, extendMin: 10, presetLong: [50, 10] },
    calibrationMinSamples: 5,
    startAdherenceWindowMin: 15,
  },

  train: {
    sessionFullXp: 60, sessionPartialFloorXp: 40, minimumOrSafetyXp: 40, restDayCheckXp: 10, restDayCheckMinMinutes: 10,
    prXp: 15, prMaxPerDay: 2,
    weeklyTarget: 3,                                  // 2 in "two-day mode" (a first-class choice)
    weeklyBonus: { targetMet: 60, oneShort: 30 },     // oneShort applies only when target is 3
    dailyCapExclWeekly: 100,
    progression: { confirmSessions: 2, failHoldAt: 2, failDeloadAt: 3, deloadPct: 10, maxIncreasesPerWeekEarly: 1, earlyWeeks: 6 },
    ladder: { repMin: 5, repMax: 8, sets: 3, holdMinS: 20, holdMaxS: 60 },
    weeklyHardSetIncreaseMaxPct: 20,
    heatMode: { volumeCutPct: 25, acclimatiseDays: 12 },
    retestEveryWeeks: 8,                               // counted from program start, not from seasons
  },

  mind: {
    mysteryXp: 25, dropBoardXp: 10, lessonXp: 15, lessonsPaidPerDay: 1, lessonsPerCoursePerDay: 1,
    learnDropXp: 15,                              // completed five-item Learn drop, inside the Mind cap
    cardXp: 1, cardsMaxPerDay: 20, sideBoardXp: 10, sideBoardsMaxPerDay: 1,
    dailyCap: 80, freePlayXp: 0,
    dropUnlockTime: '07:00',
    featuredByWeekday: {                               // 0 = Sunday … 6 = Saturday
      1: ['sudoku','easy'], 2: ['sunmoon','easy'], 3: ['path','medium'], 4: ['crowns','medium'],
      5: ['calc','medium'], 6: ['crowns','hard'], 0: ['BOSS','hard'] },
    bossRotation: ['sudoku','crowns','calc','path','sunmoon'],   // Sunday boss type = bossRotation[isoWeek % 5]
    caseDiffByWeekday: { 1:'easy', 2:'easy', 3:'medium', 4:'medium', 5:'medium', 6:'medium', 0:'hard' },  // Sunday case = chapter finale
    onboardingEasyCases: 3,
    eloK: { early: 40, later: 24, earlyAnswers: 20 }, eloClamp: [400, 2400], hintScore: 0.6,
    caseScore: { cleanSolve: 1, withHintsOrSecondTry: 0.7, revealed: 0 },
    cardBoxIntervalsDays: [0, 1, 3, 7, 14, 30, 60],
    itemIntervalsDays: [0, 21, 45, 90, 180], itemRetryDays: { default: 2, teaser: 3 }, miniMysteryRetiresAfterAnswer: true,
  },

  bonuses: { hatTrickXp: 30, lightsOutXp: 15 },

  level: { stepBase: 100, softCap: 50 },           // step L→L+1 costs 100·L; total to reach L = 50·L·(L−1)

  season: { spDailyCap: 300, targetPerDay: 250, exponent: 0.7, seats: 500, seedPct: 10,
            tiers: [ ['Bench',301,500], ['Challenger',151,300], ['Contender',51,150], ['Elite',11,50], ['Ace',2,10], ['Apex',1,1] ] },

  streak: { startFreezes: 2, maxFreezes: 2, freezeEveryDays: 7, freezeShardPrice: 50, restDaysPerWeek: 1,
            repairWindowHours: 48, repairHatTricks: 2, goldAfterDays: 7, cleanWeekHatTricks: 4, minDueCardsForMark: 10 },

  shards: { perXp: 0.1, levelUpBonus: 20,
            seasonEnd: { Bench: 50, Challenger: 100, Contender: 150, Elite: 200, Ace: 250, Apex: 300 },
            prices: { freeze: 50, cardBack: [100,150], banner: [100,150], puzzlePack: [150,250], soundPack: 300, theme: [400,800] } },

  night: { windDownCapMin: 10, defaultBedtime: '01:30', goalBedtime: '23:30', bedtimeStepMin: 15, bedtimeRampEveryDays: 3,
           bedtimeRampNeedsMetOfLast3: 2, defaultShutdown: '23:15', shutdownMinBeforeBedtime: 15,
           streakReminderMinBeforeBedtime: 90, lightsOutEndsAt: 'dayBoundary', morningBackfill: true },

  notifications: { engagementPerDayMax: 2, planningReminderTime: '09:00' },   // self-set reminders excluded

  backup: { nagAfterDays: 7 },

  juice: { microMs: [100,200], mesoMs: [400,800], macroMs: [1200,2500], macroPerDayMax: 2 },
} as const;
// RULES_BOUNDS: allow-list of overridable keys with [min, max], e.g.
// tasks.postpone.weeklyBudget [3,15] · mind.dailyCap [40,120] · tasks.dailyCap [100,300] · night.goalBedtime ['22:00','01:00']
```

## 3. Award rules (pure functions; test every line)

**Shared definitions:**

- **Planned task:** a task that had a time slot at some point, or was a Must for the day.
- **Body slot:** a training session (any XP-earning session) or a rest-day check.
- **Mind slot (19 Oct 2026):** the five-item Learn drop finished, the daily case solved, the daily board solved, or at least 10 due cards reviewed before bedtime. Practice and Free Play never count.

| Mode | Event | XP | Rule |
|---|---|---|---|
| Tasks | Done (S/M/L) | 10/20/35 | Uses `plannedSize`. ×1.5 if done on `firstScheduledDayKey`. Tasks beyond the 8th done that day earn ×0.5. **Subtasks from a split share the parent's XP pro-rata by estimate (`xpShare`)** and inherit `firstScheduledDayKey`. Creation-time splits share a pool of `round(35 × estimateMin / 90)` (see 02-tasks §4) |
| Tasks | Quick win | 5 | Created and done within 30 min; replaces size XP; max 5/day |
| Tasks | Clutch | Flat 5 XP (changed 2026-10-08 by the owner) | Done after ≥2 postpones; max 1/day; never announced in advance. Always less than the ×1.5 bonus it lost, so postponing never pays |
| Tasks | Cap | 200/day | |
| Train | Session | best of the day counts | If he logs two sessions on one dayKey, XP for the day is the **higher** of the two (a morning minimum never blocks a later full session) |
| Train | Full planned session | 60 | All planned working sets done (extra sets earn 0) |
| Train | Partial session | `max(40, round(60 × share))` if every exercise has ≥1 working set; otherwise `round(60 × share)` with no floor | `share` = planned working sets done ÷ planned working sets |
| Train | Minimum session (1 set of each) or safety stop (pain flag) | 40 | A safety stop is never punished |
| Train | Rest-day check (≥10 min walk/mobility) | 10 | Any non-session day; max 1/day; counts as the Body slot |
| Train | PR / ladder unlock | +15 | Max 2/day; excludes warm-up and pain-flagged sets |
| Train | Weekly target met / one short | +60 / +30 | Once per ISO week, outside the daily cap. "One short" only when the target is 3. In two-day mode, meeting 2 earns the full +60 |
| Train | Cap | 100/day | Excluding the weekly bonus |
| Mind | Mystery / featured board / lesson / card / side board | 25 / 10 / 15 / 1 / 10 | First solve of each date-seeded drop item only. **Only 1 lesson a day pays** (a second course's lesson is allowed at 0 XP). Cards max 20. Side boards max 1 |
| Mind | Five-item Learn drop finished | 15 | Once per day before bedtime; inside the 80 XP Mind cap and counts as the Mind slot. Individual answers earn 0 XP. |
| Mind | Cap | 80/day | Free Play: 0. After bedtime: 0 (see the night rule) |
| All | Hat-trick | +30 | ≥1 planned task done + a Body slot + a Mind slot on the same dayKey |
| All | Lights-out check-in | +15 | Self-report before his current bedtime target; once a day. If it's missed, a next-morning back-fill card records the time at 0 XP |

**Worked example (a typical good day = 245 XP):**

- Tasks: 2 Musts done on their first day (M 20×1.5 = 30, S 10×1.5 = 15) plus 1 L done after one postpone (35) = 80.
- Train: full session = 60.
- Mind: mystery 25 + featured board 10 + lesson 15 + 10 cards 10 = 60.
- Bonuses: Hat-trick 30 + lights-out 15 = 45.
- **Total: 245.**

**Maximum day:** 200 + 100 + 80 + 30 + 15 = **425** (plus the weekly Train bonus once a week).

## 4. Level curve

- The step from level L to L+1 costs `100·L`, so reaching level L takes `50·L·(L−1)` XP in total.
- **Pacing at 245 XP/day:** level 5 around day 4, level 10 around day 18, level 20 around day 78, level 30 around day 178, level 50 around day 500.
- **Beyond 50:** cosmetic Prestige stars.
- **Badges:** level badges look like jersey numbers.

## 5. Seasons and the 500-seat ladder

> Changed from the brief's 300 seats: a 300-candidate selection programme is one franchise's signature premise, so we use **500 seats** to stay clearly original. The formula is written in terms of `RULES.season.seats`.

- **Season dates:** a season runs from the **first Monday of a month** to the day before the next month's first Monday (4 or 5 weeks). This uses the fresh-start effect: goal commitments rose 62.9% on Mondays.
- **Season 1:** Mon 2 Nov 2026 → Sun 6 Dec (35 days, target 8,750 SP). Arc 2 starts Mon 7 Dec.

```
SP/day   = min(XP that day, spDailyCap)            // 300
target   = targetPerDay × days_in_season            // 250 × days
rank     = seats − floor( (seats − 1) × min(1, SP / target) ^ exponent )
seed     = min(seedPct% of last season's SP, seedPct% of target), added on day 1
tiers    = #500–301 Bench · #300–151 Challenger · #150–51 Contender · #50–11 Elite · #10–2 Ace · #1 Apex
```

- **Worked ranks** (they hold for 28- and 35-day seasons as fractions of the target): first-day 250 SP → #452 (28 days) or #459 (35 days); half the target → #193; three-quarters → #93; 90% → #37; full target → #1; a full previous season's seed → #401.
- **Ghost rivals:** the other seats are filled with original ghost rivals (generated names and simple original marks). **Seat thresholds come from the inverse of the rank formula**, so the board always agrees with his rank.
  - **One named rival sits just above him**, with the SP gap to the next seat shown.
- **From Season 2:** re-fit `target` so that matching his own previous median pace lands around #50. The ladder becomes a contest with his past self.
- **No defeat states.** Rank changes read as progress ("+14 places this week").
- **Season end:** a macro "stat reveal", a tier badge, Shards by tier, the next Arc story and a rotated shop catalogue.
  - **The app bundles 4 Arcs and 4 shop catalogues** and cycles through them if no new pack arrives, so seasons never depend on Claude.
- **Later:** a co-op "duo goal" with a friend via share codes (Phase 4). Competition plus collaboration beat pure competition in the meta-analysis.

## 6. Streaks and Clean Week

- **Daily mark:** the day counts with **one meaningful action**: a planned task done, a Body slot, or a Mind slot (the definitions in section 3). Opening the app doesn't count.
- **Freezes:**
  - Start each streak with **2**; never hold more than 2.
  - +1 free at each 7-day milestone (if under 2); buy one for 50 Shards.
  - A freeze is applied automatically to a missed day.
- **Rest day:** one pre-chosen rest day a week never uses a freeze.
- **Earn-back:** within **48 h** of a break, **2 Hat-trick days restore** the streak.
- **Gold "perfect" streak:** shown after day 7, only for weeks with no freezes used.
- **Headline metric: the Clean Week.** At least **4 Hat-trick days** from Monday to Sunday, tracked as its own weekly streak. With 3 workouts plus rest-day checks, 4 or more stays reachable.
- **Copy on a break:** "Streak paused. Life happens. Two Hat-trick days in 48 h restores it."
- **Symbol:** **not a flame.** Use a stamina pip or jersey stripe.

## 7. Shards (soft currency)

- **Earned:**
  - `floor(cumulative XP / 10)`;
  - +20 per level-up;
  - a season-end award by tier: Bench 50, Challenger 100, Contender 150, Elite 200, Ace 250, Apex 300.
  - That comes to roughly 800–1,100 per season.
- **Balance** = earned − spent (derived). It never goes negative, because earnings never decrease (forward-only rules).
- **Fixed prices:** freeze 50 · card back or banner 100–150 · handcrafted puzzle pack 150–250 · sound pack 300 · full UI theme 400–800.
- **Never:** convert Shards to XP, buy rank, or sell anything random. The catalogue rotates each season. Puzzle packs earn no XP beyond the daily cap.

## 8. Hexagon (six stats, 28-day rolling, 0–100 each; Phase 3)

| Stat | Source (suggested formula; tune later) |
|---|---|
| **Drive** | 50 × share of tasks done on their first scheduled day + 50 × start-adherence rate |
| **Body** | 100 × min(1, sessions in 28 days ÷ (4 × weeklyTarget)), plus up to +10 for ladder unlocks or PRs (clamped at 100) |
| **Mind** | 100 × share of drop days with a solved featured board, weighted up for no-hint clears |
| **Recall** | 100 × review completion of due cards × recall rate |
| **Wisdom** | 50 × lesson days ÷ 28 + 50 × share of plans that fired (yes or partly) |
| **Discipline** | 70 × share of nights with lights-out before target + 30 × share of Clean Weeks |

## 9. Night mode

**Windows:**

- **Wind-down** starts when he completes the shutdown, or at the shutdown time, whichever comes first, and runs until bedtime.
- **Lights-out** runs from bedtime until the **04:00 day boundary**.
- The shutdown time is the **earlier on the night timeline** of his shutdown setting and bedtime − 15 min, so it follows the bedtime ramp. With the defaults (23:15 and 01:30) it stays at 23:15.

**What each window allows:**

- **Wind-down:**
  - Only leftover Daily Drop items and reviews.
  - A **10-minute cap on active Mind time** (timers count only while a Mind screen is in the foreground).
  - No new lessons, no sharing, quieter juice, no engagement pushes.
- **Lights-out:**
  - A calm screen with the lights-out check-in (+15 if done before the target).
  - Mind earns 0 XP; no sound, no animation.

**Override and back-fill:**

- **Override:** he can always override, because autonomy matters. Overrides are counted in `dailyLog.nightOverrides`.
- **Morning back-fill:** if last night's lights-out time or Reels bucket is missing, a 0-XP card asks for both next morning.

**Bedtime target ramp:**

- Start at his real bedtime (default 01:30).
- Every 3 days, move 15 min earlier if he met the target on at least 2 of the last 3 nights.
- Stop at `goalBedtime` (he sets it at kickoff; default 23:30).
- The ramp never moves later automatically; he can move it himself.

## 10. Notifications budget

- **Engagement pushes: max 2 a day:**
  - the morning first-step nudge (default 08:30, opt-out), or an opt-in planning reminder;
  - one opt-in streak reminder, scheduled no later than the earlier (on the night timeline) of bedtime − 90 min and the shutdown time, and **never during wind-down or lights-out**. Don't copy Duolingo's 10 pm streak-saver.
- **Never send:** social, store or "new content" pushes.
- **Self-scheduled reminders** (task blocks, rest timer, shutdown nudge) sit outside this budget.
- The night-deck nudge is the shutdown reminder. Both nudges are local Android notifications and can be turned off in Day and night.

## 11. Juice budget

Medium-to-high juice beat both none and extreme (Kao 2020, n = 3,018).

- **Micro** (every check-off or cell): 100–200 ms, light haptic.
- **Meso** (task done, puzzle solved, workout logged): 400–800 ms. The XP counts up and the bar fills with a slight overshoot.
- **Macro** (level-up, tier promotion, season end): 1.2–2.5 s full-screen stat reveal.
  - Skippable; max 2 a day.
  - Only for real-world actions, and never after bedtime.
- **Reduced motion** (OS setting or in-app toggle): fades replace slides, slams and speed lines.
- **Scripture cards:** micro only.

## 12. Acceptance tests

1. The worked example sums to 245. The maximum day sums to 425 (with the weekly bonus separate).
2. Caps hold under adversarial input:
   - 50 S tasks → ≤200;
   - 30 puzzles → 80;
   - two lessons in a day → 15;
   - two Train sessions in a day → max(XP of each), not the sum.
3. **Splitting:** an L (35) split into 3 subtasks earns 35 in total (×1.5 only if the parent was still on its first scheduled day). Split after postpone #3 → no ×1.5. Creation-time pool = round(35 × estimate / 90).
4. **Clutch:** for each size, a task postponed twice then done earns less than the same task done on its first day (changed 2026-10-08 by the owner).
5. Re-running awards over the same facts gives identical totals. Importing a backup twice creates no duplicate ledger rows.
6. After bedtime: Mind facts give 0 XP and don't satisfy the Hat-trick Mind slot. A task done after bedtime still earns its XP.
7. **Forward-only rules:** applying a rules version with a lower cap from dayKey D leaves totals before D unchanged. Level and Shards never decrease.
8. Level: total XP 4,500 → level 10; 122,500 → level 50.
9. Rank (500 seats, 28-day season):
   - SP 250 → #452; 3,500 → #193; 7,000 → #1;
   - a seed of 700 → #401;
   - the seed is capped at 10% of target.
10. **Streak:**
    - a missed day with 1 freeze → kept, freezes = 0;
    - a second consecutive miss → broken;
    - 2 Hat-tricks within 48 h → restored;
    - the rest day → no freeze used;
    - a Free Play board alone doesn't mark the day.
11. Clean Week: 4 Hat-trick days with 3 workouts + 1 rest-day check → true.
12. The Shards balance never goes negative. A purchase is refused if the balance is short. There is no random purchase type.
13. Engagement notifications ≤ 2 per dayKey. The streak reminder is never at or after the night-timeline minimum of (bedtime − 90 min, shutdown).
14. **Night timeline:** with shutdown 23:15 and bedtime 01:30, shutdown stays 23:15 and the reminder is at or before 23:15. With bedtime 23:30, shutdown becomes 23:15 and the reminder must be at or before 22:00.
