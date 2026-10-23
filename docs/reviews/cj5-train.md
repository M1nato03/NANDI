# cj5 · Train: a signature mechanic for home and hostel workouts (idea engine, batch 5, job 2)

Branch `ideas/cj5-train`, based on `origin/main` at 55fd409. Report only: no app code or content changed.

## 0. Short answer

- **Signature mechanic (original): the Taal week.** The training week is one rhythm cycle. Session days are
  "clap" beats and rest days are "rest" beats. Both are part of the cycle. Rest beats fill on their own.
  The readiness check can move a clap to a rest beat or shrink it to the minimum session, so the cycle still
  closes. Personal bests count only inside the plan ("clean bests"), so more reps past the plan never pay.
- **Can PRs, readiness and the rest-day bank become one mechanic?** Yes for PRs and readiness. The rest-day bank
  should stay outside it. It is an economy-wide streak tool, and Train rest days should never draw on it.
  Three things in the current code have to be fixed first (§6).
- **Ranked proposals:** 1. Taal week (original). 2. Clean bests and test day. 3. Walk pages.

## 1. What NANDI Train has today (read from origin/main)

| Part | Where | Real numbers (`src/core/rules.config.ts`) |
|---|---|---|
| Session XP | `calculateSessionXp` in `src/core/train/economy.ts`; replay in `src/core/economy/awards.ts` | `train.sessionFullXp` 60, `sessionPartialFloorXp` 40, `minimumOrSafetyXp` 40 |
| Daily Train cap | `calculateTrainDailyXp`; `deriveEconomy.ts` day loop | `train.dailyCapExclWeekly` 100; two sessions on one day: the better one counts |
| PRs | `detectSetPrs` in `src/core/train/pr.ts`; `addPr` in `src/data/repos/train.ts` | `train.prXp` 15, `prMaxPerDay` 2, `prLoadJumpConfirmPct` 50 |
| Ladder progression | `evaluateBodyweightLadder` in `src/core/train/progression.ts` | `train.ladder` 3 sets × 5–8, holds 20–60 s; Nordic steps gated (`gate: 'nordic-setup'`) |
| Weekly target | `calculateWeeklyBonus`; weekly facts `train-week:<week>:two/three` | `train.weeklyTarget` 3; `weeklyBonus.targetMet` 60, `oneShort` 30 |
| Rest-day check | `restDayCheck` in `src/data/repos/train.ts` (fact `train-rest:<dayKey>`) | `train.restDayCheckXp` 10, `restDayCheckMinMinutes` 10 |
| Readiness check | `Dashboard.tsx` ("Slept OK?", "Very sore?"), stored in `SessionRow.readiness` | none |
| Safety | `src/core/train/safety.ts`: heat mode, weekly volume guard, re-test | `weeklyHardSetIncreaseMaxPct` 20, `heatMode` 25 % for 12 days, `retestEveryWeeks` 8, `retestVolumeCutPct` 30 |
| Streak and rest bank | streak loop in `src/core/economy/deriveEconomy.ts`; trips in `src/core/economy/away.ts` | `streak.restBankMonthly` 4, `restBankMax` 12, `awayMaxDays` 14, `restDaysPerWeek` 1, `repairWindowHours` 48, `repairHatTricks` 2 |
| Hat-trick | `hatTrick = plannedTask && body && mindSlot` (`deriveEconomy.ts`) | `bonuses.hatTrickXp` 30. `body` is a session **or** a rest check |
| Courtyard | `src/core/courtyard/courtyard.ts`: Nandi's corner counts `train` `session` or `rest` days | stages at 3/7/14/30/60 practice days (spec 12 §2) |
| Badges and quests | `src/core/economy/gamify.ts`: "Rest days kept", "Make time to move", "Personal bests" | `gamify.badgeThresholds` 1/5/20 |

Already kind: extra sets earn 0, a safety stop pays the same as a minimum session (40), rest checks pay and count
for the courtyard and the Hat-trick, and nothing decays.

## 2. Evidence

All quotes were read on the pages linked. Abstracts came through Europe PMC because PubMed returned HTTP 429.

### 2.1 Goal-gradient effect

Kivetz, Urminsky and Zheng (2006), *Journal of Marketing Research* 43(1), 39–58
([PDF, Columbia](https://business.columbia.edu/sites/default/files-efs/pubfiles/1200/goalgradient.pdf)):
- "participants in a real café reward program purchase coffee more frequently the closer they are to earning a free coffee"
- "customers who receive a 12-stamp coffee card with 2 preexisting 'bonus' stamps complete the 10 required purchases
  faster than customers who receive a 'regular' 10-stamp card"
- After the reward, members "slowed down" ("postreward resetting").

For NANDI:
- A short, visible goal pulls hardest near its end. A **week** of 2–3 beats is near. A lifetime count is not.
- After each close comes a slower start. A weekly cycle gives that pause a natural place.
- The "bonus stamps" trick gives progress that was never earned. NANDI must not use it. Every filled beat must be a real day.

### 2.2 Self-monitoring

- Harkin et al. (2016), *Psychological Bulletin*, 138 studies, N = 19,951
  ([doi:10.1037/bul0000025](https://doi.org/10.1037/bul0000025)): monitoring "promoted goal attainment (d+ = 0.40)".
  Effects were larger "when the information was physically recorded".
- Michie et al. (2009), *Health Psychology*, 122 evaluations, N = 44,747
  ([doi:10.1037/a0016136](https://doi.org/10.1037/a0016136)): "self-monitoring" explained the most heterogeneity
  (13 %). Combining it with another control-theory technique was "significantly more effective ... (0.42 vs. 0.26)".
- The cost of measuring: Etkin, "The Hidden Cost of Personal Quantification" (*J. Consumer Research* 2016;
  [abstract PDF, Wharton](https://marketing.wharton.upenn.edu/wp-content/uploads/2016/10/11-12-2015-Etkin-Jordan-Title-and-Abstract.pdf)):
  "while measurement increases how much of an activity people do ... it can simultaneously reduce how much people
  enjoy those activities", and "measurement can decrease continued engagement".

For NANDI:
- Log the plan, with goal and feedback. That is the combination with evidence behind it.
- Do not log raw output (reps, minutes, calories). Output is what makes exercise "feel more like work".

### 2.3 Exercise adherence in young adults

- Teixeira et al. (2012), *IJBNPA*, an SDT review ([doi:10.1186/1479-5868-9-78](https://doi.org/10.1186/1479-5868-9-78)):
  "intrinsic motivation being more predictive of long-term exercise adherence", and
  "competence satisfaction and more intrinsic motives positively predict exercise participation".
- Plotnikoff et al. (2015), *IJBNPA*, university and college students
  ([doi:10.1186/s12966-015-0203-7](https://doi.org/10.1186/s12966-015-0203-7)): "18/29 yielded significant results",
  with "significant increases in moderate physical activity".
- Mazeas et al. (2022), *JMIR*, a meta-analysis of RCTs of gamified physical activity
  ([doi:10.2196/26779](https://doi.org/10.2196/26779)): "Hedges g=0.42". The long-term effect "was weaker ... (Hedges g=0.15)".
- India context: Anjana et al. (2014), ICMR-INDIAB, N = 14,227
  ([doi:10.1186/1479-5868-11-26](https://doi.org/10.1186/1479-5868-11-26)): "54.4% ... were inactive", and
  "fewer than 10% engaging in recreational physical activity".
- Home training is enough. The ACSM 2026 resistance-training position stand
  ([ACSM summary](https://acsm.org/resistance-training-guidelines-update-2026/)) says the biggest gain is
  "moving from no resistance training to any form of resistance training", and
  "elastic bands, bodyweight exercises, and home-based routines yield marked benefits".
  Training to failure "did not consistently impact outcomes for the average healthy adult".
- Novelty fades. Howe et al. (2016), *BMJ*, Pokémon GO players aged 18–35
  ([doi:10.1136/bmj.i6270](https://doi.org/10.1136/bmj.i6270)): +955 steps in week 1, but
  "By the sixth week after installation, the number of daily steps had gone back to pre-installation levels."
- Althoff et al. (2016), *JMIR* ([doi:10.2196/jmir.6759](https://doi.org/10.2196/jmir.6759)): the game was
  "able to reach low activity populations", whereas the health apps studied drew on "an already very active population".
- Narrative helps. Farič et al. (2021), *Games for Health J.*, on Zombies, Run!
  ([doi:10.1089/g4h.2021.0060](https://doi.org/10.1089/g4h.2021.0060)): "The narrative motivated participants to
  engage in PA for longer sessions", "dissociating the players from the effort of exertion". This is qualitative (n = 30).
- Social incentives: Patel et al. (2019), STEP UP, *JAMA Intern Med* ([doi:10.1001/jamainternmed.2019.3505](https://doi.org/10.1001/jamainternmed.2019.3505)).
  All three arms raised steps. Only the competition arm stayed higher in follow-up
  ("adjusted difference, 569"). Collaboration did not ("adjusted difference, 126 ... P = .49").

For NANDI:
- Competence (a ladder you climb) and enjoyment carry adherence over the long term. Points help less over time.
- Expect the novelty effect to fade by about week 6. The kill tests below run past week 2 for that reason.

### 2.4 Harms of streaks, badges and comparison in fitness

- Silverman and Barasch (2023), *J. Consumer Research*
  ([accepted manuscript](https://udspace.udel.edu/bitstreams/7e3e3b64-8bf2-4527-ac93-94a160358165/download)).
  Study 1 used a 30-day, 7,000-steps workplace challenge.
  - "intact streaks highlighted via behavioral logs increase consumers' subsequent engagement ... relative to when
    broken streaks are highlighted".
  - The effect is "amplified when consumers attribute a break in the streak to themselves" and
    "attenuated when consumers can 'repair' a broken streak".
  - So the way a log draws a gap changes what people do next.
- Kerner and Goodyear (2017), Fitbits with 13–14-year-olds, eight weeks
  ([Brunel record](https://bura.brunel.ac.uk/handle/2438/17200?mode=full)):
  - "significant reductions in need satisfaction and autonomous motivation" and "significant increases in amotivation".
  - Short-term motivation came from "competition, ... guilt, and internal pressure".
- Attig and Franke (2019), *Int. J. Human-Computer Studies*
  ([Lübeck record](https://research.uni-luebeck.de/en/publications/i-track-therefore-i-walk-exploring-the-motivational-costs-of-wear/)):
  "a decrease of motivation for physical activity in situations when the tracker is not available plays a role in
  everyday usage". The effect was "stronger for participants with high extrinsic motivation".
- Simpson and Mazzeo (2017), *Eating Behaviors*, college students
  ([doi:10.1016/j.eatbeh.2017.02.002](https://doi.org/10.1016/j.eatbeh.2017.02.002)): "fitness tracking was uniquely
  associated with ED symptomatology". The authors add that "for some individuals, these devices might do more harm than good".
- Kolnes and Øvretveit (2026), *Behavioral Sciences*, 225 club runners
  ([doi:10.3390/bs16020224](https://doi.org/10.3390/bs16020224)):
  - Runners "who had deleted training sessions due to perceived slow running pace scored higher on other-avoidance goals".
  - Strava also brought "pressure, comparison, and stress, particularly during injury".
- Over-reaching: the ECSS/ACSM consensus, Meeusen et al. (2013)
  ([doi:10.1249/mss.0b013e318279a10a](https://doi.org/10.1249/mss.0b013e318279a10a)):
  training "must avoid the combination of excessive overload plus inadequate recovery".
- Progression speed: Nielsen et al. (2014), *JOSPT*, 874 novice runners
  ([doi:10.2519/jospt.2014.5164](https://doi.org/10.2519/jospt.2014.5164)). Those who progressed weekly distance
  by "more than 30%" "seem to be more vulnerable to distance-related injuries". The result is exploratory
  (HR 1.59, CI 0.96–2.66). NANDI's +20 % hard-set guard is a heuristic in the same spirit, not a proven threshold.

**Gap, stated honestly.** I found no peer-reviewed study that measures injury caused by streak pressure itself.
The search found user requests for a sick or injured mode and opinion pieces, but no data.
The plausible chain is pressure to train on every day (Kerner; Kolnes) plus overload without recovery
(Meeusen) plus fast progression (Nielsen). It is inferred, not measured. Treat it as a design risk, not a finding.

## 3. Mechanics studied (the required table)

"Rejected" means it fails a hard rule even after a rewrite. Names, art and copy from these apps are not reused.

| App | Mechanic | What the user does and sees | Why it works (evidence, quoted) | Dark-pattern risk | NANDI v1 (offline) | NANDI v2 (online) | Kill test |
|---|---|---|---|---|---|---|---|
| Strava | Segments and own-time comparison | Members mark stretches of road. "you can use segments to compare your own times or to compare with other users' times" ([Strava help](https://support.strava.com/hc/en-us/articles/216918167-Strava-Segments)) | Self-monitoring with feedback: "d+ = 0.40" (Harkin 2016) | High. Speed tests near max effort; a public leaderboard pushes past safe limits; needs GPS | **Rewritten:** no timed segments. A fixed "test day" in re-test week (every 8 weeks) finds your ladder step; you compare only with your own earlier test (Proposal 2) | Friends see the step reached on a shared test, never reps or times | Kill if test-day pain flags exceed normal sessions, or if anyone tests outside re-test week to chase a number |
| Strava | Course record and top-of-segment titles | "you have to have the fastest time on a segment" (same page) | Competition kept steps up after STEP UP's intervention ended ("adjusted difference, 569") | High. Ranks on peak effort; titles can be lost | **Rejected** | **Rejected**: a lost title is a loss state | n/a |
| Strava | Local Legends | Most efforts on a segment in "a 90-day rolling window"; "a trophy for iterative participation, not for hard efforts" ([DC Rainmaker](https://dcrainmaker.com/2020/06/strava-legends-feature.html)) | Rewards frequency, not intensity; matches "intrinsic ... long-term adherence" (Teixeira 2012) | Medium. The rolling window takes status away | **Rewritten:** a lifetime count of practice days per movement pattern that only rises (already how courtyard stages work) | Friends can see each other's counts if they choose; no title, no window | Kill if people log rest checks only to raise the count (rest checks per week up, sessions flat) |
| Strava | Kudos | A one-tap reaction on a friend's activity (no official Strava page found; [forum description](https://www.cyclechat.net/threads/strava-kudos.211491/)) | Support: STEP UP's support arm raised steps during the intervention ("adjusted difference, 689") | Medium. Counts invite comparison and curated posting ("deleted training sessions due to perceived slow running pace", Kolnes 2026) | Not needed offline | **Rewritten:** one fixed nod per friend per week, no count shown, no feed | Kill if nods become a number people chase (ask in week 2) |
| Apple Fitness | Three daily rings | "Close your Exercise ring by completing at least 30 minutes of activity at or above a brisk walk" ([apple.com](https://www.apple.com/watch/close-your-rings/)) | Goal-gradient: people speed up "the closer they are" (Kivetz 2006) | Medium. A daily ring every day implies zero rest days; badges for perfect streaks | **Rewritten** as the weekly Taal cycle (Proposal 1): the cycle is a week, and rest beats are part of it | Shared cycle with a friend (duet) | See Proposal 1 |
| Apple Fitness | Pause rings, goals by weekday | Users "pause their Activity rings for a day, week, month, or more" without "affecting their award streaks"; "customize their Activity ring goals by the day of the week" ([Apple Newsroom, watchOS 11](https://www.apple.com/newsroom/2024/06/watchos-11-brings-powerful-health-and-fitness-insights/)) | Repair "attenuated" the drop after a broken streak (Silverman & Barasch 2023) | Low | **Already built**: rest-day bank (4 a month, up to 12) and days away (up to 14) in `away.ts`; training days per weekday in the program | Synced across devices (spec 22 merge: away plans are a union, checked against the bank) | n/a (already shipped) |
| Apple Fitness | 7-day competitions with friends | "Go head to head with a friend in a seven-day competition in which you earn points" (apple.com) | STEP UP: competition worked best and lasted | High for strength. Racing on volume pushes past safe limits, and a loser every week | **Rejected** in v1 | **Rewritten:** a duet on the Taal cycle, where both close their own week and nobody wins (Proposal 1 v2) | Kill the duet if weekly closes do not rise compared with solo weeks |
| Nike Training Club | Bodyweight programs | "Bodyweight training: Equipment-free workouts that build muscle"; "weeks-long workout programs for the gym or home" ([App Store](https://apps.apple.com/us/app/nike-training-club-wellness/id301521403)) | ACSM 2026: "bodyweight exercises, and home-based routines yield marked benefits" | Low | **Already built**: Hostel Bodyweight with ladders and placement (spec 03) | Program packs without an app update (pack updater, Phase 4) | n/a |
| Fitbod | Muscle recovery map | A "composite heat map of your muscle fatigue"; each muscle gets "a percentage between 0% and 100%"; the plan "prioritizes recovered muscles" ([Fitbod blog](https://fitbod.me/blog/muscle-recovery/); the help page returned 403) | No peer-reviewed validation found for the percentage | Medium. A body heat map reads as a physiology claim; red muscles can cause worry | **Rewritten, facts only:** "Push: last trained 2 days ago, 9 hard sets this week". No percentage and no "recovered" word. The weekly hard sets per muscle are already in spec 03 §5 | None needed | Kill if anyone reads it as "my muscle is X % healed" (ask in week 1) |
| Zombies, Run! | Story missions while moving | "500+ epic missions"; "Walk, jog or run anywhere"; chases are optional ([zombiesrungame.com](https://zombiesrungame.com/)) | "The narrative motivated participants to engage in PA for longer sessions" (Farič 2021) | Medium. Chases are a punishing timer; 500 missions is close to a feed | **Rewritten** as Walk pages (Proposal 3): one page per walk day, no chase, text and haptics, offline | Friends read the same page that week | See Proposal 3 |
| Pokémon GO | Adventure Sync, eggs hatched by distance | "Adventure Sync can record your walking distances even when Pokémon GO isn't launched"; "Earn rewards each week for each milestone you cross" ([pokemongo.com](https://pokemongo.com/en/post/adventure-sync/)) | +955 steps in week 1, gone by week 6 (Howe 2016); "reach low activity populations" (Althoff 2016) | High. Egg contents are random (variable reward); background location | **Rewritten:** walking time unlocks a fixed next page (no randomness). No GPS, no step counter: a self-timed 10 minutes using the existing rest check | Optional step import (Health Connect) only with consent | Kill if walk checks per week fall back to baseline by week 6 |
| Cult.fit | Points over 30 days, streaks | "The points are calculated for a period of the last 30 days activity on a rolling window"; "8 points will be removed"; "You miss a day, you break the streak" ([support](https://support.cure.fit/support/solutions/articles/25000020252-i-workout-regularly-but-my-points-are-not-increasing-why-)) | Streaks raise engagement while intact (Silverman & Barasch 2023) | High. Points go down, which breaks "XP never goes down"; a daily streak with no rest | **Rejected**. This is the pattern NANDI is built against | **Rejected** | n/a |
| Healthify (HealthifyMe) | Step and workout tracker, AI coach | "Sync with Apple Health to seamlessly track your steps, workouts, sleep"; "Ria is your AI Health Coach" ([App Store](https://apps.apple.com/app/id943712366); healthifyme.com returned 403) | none found for its specific features | Medium. AI at runtime, calorie focus (Simpson & Mazzeo 2017) | **Rejected**: no AI at runtime, no calorie counting | Not adopted | n/a |
| Gentler Streak (closest to Proposal 1) | Rest keeps the streak; readiness-based suggestions | "Keep your streak alive by following your body's needs, even when it calls for rest days"; "daily suggestions—ranging from rest to high-intensity exercises—based on your readiness" ([App Store](https://apps.apple.com/us/app/gentler-streak-fitness-tracker/id1576857102)) | Repair attenuates the broken-streak drop (Silverman & Barasch 2023) | Low to medium. Readiness comes from HRV and heart rate, close to a health claim; paid features | Learned from, not copied: NANDI uses a two-tap self-report, no sensors | n/a | n/a |

## 4. Question 1: what makes a home or hostel workout feel like a game without pushing past safe limits?

1. **Goals with a ceiling.** The week closes at the plan (2 or 3 sessions). Nothing pays for a fourth set, a fourth
   session or more reps than the plan. NANDI already caps extra sets at 0 XP. PRs are the gap (§6.3).
2. **A near, visible goal that resets weekly.** This is the goal-gradient effect (Kivetz 2006), with a natural pause
   after each close. Never fake progress.
3. **Rest as a move in the game, not a gap.** Draw rest beats as part of the pattern and fill them without asking.
   An absence should never be shown as a break (Silverman & Barasch 2023).
4. **Competence you can see.** Ladder steps ("Push-up · step 3 of 5") rather than volume. Competence and
   intrinsic motives predict long-term adherence (Teixeira 2012).
5. **Story for the light work, never for the hard work.** Narrative takes attention off effort (Farič 2021).
   That helps on a walk and is risky on a max set, so story belongs only to walk days.
6. **Safety rails stay outside the game.** The pain button, the +20 % weekly hard-set confirmation
   (`weeklyHardSetIncreaseMaxPct` 20), the 50 % load-jump confirmation, heat mode (25 % less volume for 12 days)
   and the Nordic gate are never things you can "win" past.
7. **Facts only, no physiology numbers.** "Last trained 2 days ago" is fine. "Muscle 60 % recovered" is a health
   claim NANDI cannot back.

Hostel specifics:
- Needs no space beyond a mat.
- No sound needed: haptics and text, with sound optional.
- No camera and no GPS.
- Rows fall back to a backpack or band when there is no anchor (already in DECISIONS 2026-10-11).

## 5. Question 2: can PRs, readiness and the rest-day bank become one signature mechanic?

**Yes for PRs and readiness. The bank stays separate.** Here is why, from the code.

- **The rest-day bank is economy-wide.** Every unmarked day spends it, from any mode (`deriveEconomy.ts` streak loop:
  `if (!paused && restDays > 0) { restDays--; ... }`). A planned Train rest day does not need it. A 10-minute rest
  check (`train-rest:<dayKey>`) already marks the day through `body`, and any task, Learn drop or soft day marks it
  too. Folding the bank into Train would make a training choice cost a streak token, which is the opposite of the goal.
- **Readiness has no effect yet.** It writes `"<slept>:<sore>"` and shows one line of text. The minimum-session
  screen it should open is unreachable (§6.1). It is the right control for the cycle: it decides today's beat.
- **PRs fit, after one change.** Inside the cycle, a best should mean "cleaner inside the plan", not "more than
  the plan" (§6.3). The ladder unlock (`ladderStep` PR) is the natural high point of a cycle.

So the signature mechanic is **Readiness picks the beat, the week is the cycle, and clean bests mark it.**
The bank keeps its own job: covering days when nothing at all happened.

## 6. Code findings (real issues, not fixed here)

1. **The minimum session from readiness never opens.** `src/ui/train/Workout.tsx` (the `Workout` component) sets
   `minimumMode = session.readiness === 'minimum:10-minutes'`. No code writes that value.
   `Dashboard.tsx` writes `` `${slept ?? 'unanswered'}:${sore ?? 'unanswered'}` `` and `Train.tsx` writes
   `'unanswered:unanswered'` (both via `startSession` in `src/data/repos/train.ts`). So the "Just the minimum" card
   (one set each, 10 minutes) is dead code. A "Not much sleep" or "Very sore" answer only shows a hint line.
   Spec 03 §4 asks the app to "suggest the minimum session".
2. **The Train rest day is never used by the streak.** Onboarding ("Weekly rest day") and Train settings save
   `program.restDay` (`updateProgram`, `ProgramRow.restDay` in `src/data/types.ts`). The streak reads only
   `economy.restWeekday` / `economy.restWeekday:<week>` (`restWeekdayFor` in `deriveEconomy.ts`), which is set in
   `src/ui/screens/Ground.tsx`. Spec 03 §1.3 says the rest day is "for the streak". Someone who picks it in Train
   would expect streak cover and not get it. Rule for any fix: never move the rest weekday of a past week.
3. **Rep PRs pay for reps past the plan.** `detectSetPrs` (`src/core/train/pr.ts`) adds a `repsAtLoad` PR whenever
   reps beat the best at that load, with no upper limit. `logSet` accepts any reps > 0. On bodyweight (load 0),
   one more rep than ever, above the 3 × 5–8 target, pays +15 XP (up to 2 a day). This conflicts with spec 03:
   "Failure sets earn nothing extra. The game never pays for ... going harder". Also, the first session on any new
   exercise or ladder step always produces PRs, because there is no prior best. That one is harmless but cheap.
4. **Rest days do not show in the 28-day heatmap.** In `Dashboard.tsx` the heatmap gets `isRest` for
   `train-rest:<key>` but only adds a class when trained. Rest appears only in the `aria-label`, so on screen a
   rest day looks the same as "no data". This is small, but it is exactly the drawing that Silverman & Barasch
   say matters.
5. Minor: `restDayCheck` refuses whenever any live session row exists that day. A session started and then
   abandoned (status `active`, or `skipped`) blocks the walk check. Consider counting only finished sessions with XP.

## 7. Three ranked proposals

### Proposal 1 (ORIGINAL): the Taal week

**Idea.** In Hindustani music a *taal* is a repeating cycle of beats. Some beats are claps and some are
*khali*, the empty beat: you wave the hand instead. The empty beat is part of the rhythm, not a gap in it.
NANDI's training week works the same way.

**What the user does and sees**
- Train shows seven beats for the week (Monday to Sunday, the same `weekStart` the economy uses).
  - Program days (`program.days`, 3 or 2 in two-day mode) are **clap** beats.
  - The other days are **rest** beats.
- **A clap fills** when any session finishes with XP > 0: full, partial, minimum (40) or a safety stop (40).
  A pain stop fills the beat, so stopping never costs the rhythm.
- **A rest beat fills on its own** when the day ends without a session. No tap is needed.
  - The optional 10-minute walk check adds a small mark on the beat and keeps today's 10 XP, the Hat-trick body
    slot and Nandi's corner.
  - Copy on a rest beat: "Rest is today's beat."
- **Readiness picks the beat.** Before a clap, the two taps ("Slept OK?", "Very sore?") offer three equal buttons
  when an answer is low:
  - "Minimum session" (one set each; fixes §6.1)
  - "Move to [next rest beat]" (swaps clap and rest within the same week)
  - "Rest today"
  - No button is highlighted as the right one.
- **The cycle closes** when the week's claps are filled. Its pattern goes onto a "rhythm sheet", a wall of past
  weeks that only grows.
  - The existing weekly bonus is the reward (60 for the full target, 30 for one short). No new XP.
  - If a week closes one short, it is drawn whole with one open clap, never crossed or red. Copy: "This week closed at 2. That counts."
- **Clean bests mark the high point.** The cycle's high point (the *sam*, the first beat where the cycle resolves)
  is a ladder step-up or a clean best (Proposal 2 rule). It shows once at the close, not as a pop-up mid-set.
- **Training on a rest beat is allowed** and fills it as a clap. It adds no bonus beyond today's rules, and the
  +20 % hard-set confirmation still applies. The rhythm sheet shows it honestly.

**Why it should work**
- A near goal with a visible gradient (Kivetz 2006).
- Recording the plan, combined with feedback (Michie 2009; Harkin 2016).
- Repair inside the week (Silverman & Barasch 2023: repair "attenuated" the broken-streak drop).
- Rest drawn as part of the pattern, so a gap is never shown as a break.
- Weekly fresh starts: Fast et al. (2025, *IJBNPA*, [doi:10.1186/s12966-025-01785-w](https://doi.org/10.1186/s12966-025-01785-w))
  found fitness centre attendance fell "~ 21%" over the work week, "replicating the original Fresh Start Effect".

**Hard-rule test**

| Rule | Pass? | How |
|---|---|---|
| No dark patterns or guilt | Pass | No highlighted "right" readiness choice; no red; a short week is drawn whole |
| No loss states | Pass | Beats only fill; the sheet only grows; a moved or skipped clap removes nothing already earned |
| No random or variable rewards | Pass | Fixed weekly bonus from existing rules |
| No endless feed | Pass | Seven beats a week; the sheet is a record, not content |
| No punishing timers | Pass | Rest beats fill at the day boundary (4 am) with no countdown |
| No health promises | Pass | Readiness is self-report and only changes the plan; no "recovery" claims |
| XP, level and Shards never down | Pass | No new awards; no rule change lowers a past day |
| Personal data online only with consent | Pass in v1 (nothing leaves the phone). v2 needs an account and consent |

**v1 offline: data that v2 needs without a migration**
- Beats are **derived** from existing ledger facts: `train-session:<id>` (`kind: 'session'`, `inputs.xp`),
  `train-rest:<dayKey>` and `train-week:<week>:two/three`, plus `program.days`. Nothing new is stored for them.
- Moves and "rest today" choices go in one settings row per week: key `train.beats:<weekStart>`, value
  `{ moves: [{ from: dayKey, to: dayKey }], restToday: [dayKey] }`, with `updatedAt`, `deleted` and `deviceId`.
  - Spec 22 already merges "Per-week rest-day picks" with "the newer wins", so this row syncs under the same rule.
  - A settings row also keeps older backups restorable (the same reason as DECISIONS 2026-10-19 and 2026-10-20).
- Readiness stays in `SessionRow.readiness`. It is health-adjacent data and **never leaves the phone**, in v1 or v2.
- Tunables go in `RULES.train.taal` (for example `movesPerWeek: 1`, rest-beat fill at the day boundary).
  They get bounds in `RULES_BOUNDS` and a `RULES_HISTORY` entry with `effectiveFrom`.

**v2 online: the duet (*jugalbandi*)**
- Two to four friends' cycles are drawn side by side.
- The duet closes when each person closes their own week. Nobody wins and there is no ranking.
- What is shared: `weekStart` and seven beat states (clap or rest, filled or not). No reps, loads, readiness,
  pain flags or times.
- Before accounts, the same view can come through a spec 19 share link (the week's pattern in the link, no server).
- With accounts, it is friends only, with consent and the DPDP notice (before 13 May 2027).
- Server check: beats are replayed from synced ledger facts. A duet only shows closed or open, so there is
  little to gain from cheating.
- Trade-off for Jenil: STEP UP found competition outlasted collaboration for steps. We choose the duet because
  racing on strength volume pushes past safe limits. If he wants competition, the only safe currency is closed
  weeks (bounded at 1 a week), never volume.

**What makes it hard to copy.** It ties into NANDI's one ledger. The same rest beat feeds Nandi's corner, the
Hat-trick body slot and the soft-day path. It also uses an Indian musical frame rather than a generic ring.

**Originality search.**
- I searched for "taal" or "khali" in fitness apps and found none. The closest result was RepsByBeat, a
  metronome for reps with "rest beats" between sets, which is a different thing.
- Closest mechanics:
  - Gentler Streak ("Keep your streak alive by following your body's needs, even when it calls for rest days"),
    which uses sensor readiness.
  - dayseven, which per its listing counts "recovery" as one of three weekly pillars (from a search summary; the
    listing itself was not opened).
  - Apple's pause rings.
- None draws rest as a scheduled beat that fills on its own, or lets a self-reported readiness check move a beat
  within the week. That combination is what I call original here.

**Build size:** M (one derived view in `src/core/train`, one settings row, the readiness wiring, one Train card,
Playwright at 390 and 360, light and dark).

**Kill test** (Jenil and 5 friends, 2 weeks, then a check at week 6)

| Kill if | Measure (owner panel or a 1–5 question) |
|---|---|
| Sessions on rest beats go above 1 per person per week, so people are filling rest with training | count of `train-session` facts on rest beats |
| Anyone scores 3 or more on "A rest beat felt like falling behind" | a 1–5 question at day 7 and day 14 |
| Pain flags per session rise compared with the 2 weeks before | `painExerciseIds` count |
| Closed weeks are no higher than the 2-week baseline, or have fallen back by week 6 (novelty, Howe 2016) | weeks closed at the target |

### Proposal 2: Clean bests and test day (PR rewrite + Strava segments, rewritten)

**What the user does and sees**
- A best only counts **inside the plan**.
  - Reps: up to the exercise's `repMax` (8 on ladders, 12 on gym lifts).
  - Holds: up to `train.ladder.holdMaxS` (60 s).
  - Load: only when every working set stays in the rep range.
- A set past the cap is logged, but no PR is paid. Copy: "Clean set. You're ready for the next step."
- The ladder step-up stays the main best: "Push-up · step 4 of 5". It already pays one PR (`ladderStep`).
- **Test day** is the existing re-test week (`retestEveryWeeks` 8, volume −30 %).
  - It becomes a calm test: one placement-style set per pattern, using the same 5–11 stop band and 3-test cap
    (`train.placement`).
  - It compares only with **your own** previous test day: "8 weeks ago: step 2. Today: step 3."
  - No other test day is offered.

**Why**
- Competence (Teixeira 2012).
- Self-monitoring with feedback (Harkin 2016).
- It removes the near-failure incentive that ACSM 2026 says gives no extra benefit.
- One test every 8 weeks is a hard stop, so there is no daily max-effort test.

**Hard-rule test.** Passes. No loss states (PR facts already written keep paying, and the change applies forward
from `effectiveFrom`). Nothing random. No timer. No feed.

**v1.** Change `detectSetPrs` to take the plan caps. Add `RULES.train.prCapAtPlan` (bounded) with a new
`RULES_HISTORY` entry. Test results go in the existing `programs.placement` and `exState.ladderStep`, plus a
ledger fact `train-test:<isoWeek>:<pattern>` that is idempotent and stores facts only (step reached).

**v2.** A friend's test card through a share link shows the step reached per pattern. It never shows reps.
There is no leaderboard.

**Closest existing.**
- Calisthenics skill trees. Calistack's nodes go "Locked → Unlocked → Ongoing → Completed → Mastered"; Ascend
  uses a "2-out-of-3 success rule" (both from search summaries of their store listings).
- Strava's own-time segment comparison.
- Not original.

**Build size:** S.

**Kill test.** Kill if PRs per week drop to zero for most testers and they report that bests "never happen".
In that case, show step-ups more often by splitting ladder steps into sub-steps; never re-add uncapped reps.
Also kill if test-day pain flags are above normal sessions.

### Proposal 3: Walk pages (Zombies, Run! and Pokémon GO, rewritten)

**What the user does and sees**
- On a rest beat, the 10-minute walk check (`restDayCheck`, `restDayCheckMinMinutes` 10) opens **one page** of a
  short story: Nandi walks a road through an Indian town, one stop per page.
- The timer uses absolute timestamps, as CLAUDE.md requires, with a haptic tap at 5 and 10 minutes.
- No GPS, no step counter and no chase. The walk is self-reported, like today's check.
- One page per day at most. Pages come in fixed order from a content pack (Valibot-validated, plain text).
- About 30 pages a season. The season's last page is an ending, not a cliffhanger.
- Each page ends on a stopping screen: "That's today's page. You can stop here."
- A missed walk day loses nothing: the next page waits.

**Why**
- "The narrative motivated participants to engage in PA for longer sessions" (Farič 2021).
- Pokémon GO reached "low activity populations" (Althoff 2016).
- India: "fewer than 10% engaging in recreational physical activity" (Anjana 2014), so walking is the right first step.

**Hard-rule test.** Passes after these rewrites: no chases (no punishing timer), no random eggs (fixed order),
no endless missions (one page a day, finite season, stopping screen). Risk to watch: a cliffhanger would pull
people back by suspense, so the copy rule is that every page ends at rest.

**v1.** Pages live in `content/` (e.g. `walk-pages.json`) and are validated in CI. The page read is derived from
the count of `train-rest` facts, so nothing new is stored.

**v2.** Friends on the same season read the same page in the same week and can leave one fixed phrase (no free
text, so no moderation is needed yet). New seasons arrive through the Phase 4 pack updater.

**Closest existing.** Zombies, Run! ("500+ epic missions") and Six to Start's walking stories; Pokémon GO's
distance eggs. Not original.

**Build size:** M (mostly writing; a content accuracy and copy pass for 30 pages).

**Kill test.** Kill if walk checks per week are not higher than baseline at week 2, or are back to baseline by
week 6. Also kill if testers say they walked only to read, and skipped a planned clap to do it (sessions per
week fall).

## 8. Ranking

| Rank | Proposal | Novelty | Fit with NANDI | Kindness | Evidence | Build |
|---|---|---|---|---|---|---|
| 1 | Taal week (original) | high | high: uses ledger, readiness, weekly bonus, courtyard | high | goal gradient, self-monitoring, streak repair | M |
| 2 | Clean bests and test day | low | high: fixes §6.3 | high | SDT competence, ACSM 2026 | S |
| 3 | Walk pages | low | medium: content cost | high once rewritten | narrative (qualitative), Pokémon GO (fades by week 6) | M |

Suggested order: fix §6.1–6.3 first, because Proposal 1 depends on them. Then build Proposals 2 and 1 together.
Proposal 3 waits for a content writer.

## 9. Sources that could not be opened

- PubMed abstract pages returned HTTP 429. The same abstracts were read through Europe PMC's API.
- `business.columbia.edu` abstract page returned 403. The paper's PDF on the same site was read.
- `help.fitbod.me` (Muscle Recovery) returned 403. Fitbod's blog was used instead.
- `healthifyme.com` returned 403, and the Google Play pages for Healthify and NTC came back empty. The App Store
  listings were used.
- Strava's official kudos and Local Legends help articles were not found. Third-party descriptions were used,
  as labelled.
- The Fitbit community thread on a sick or injured mode redirected to a Google support index; no content was read.
- A *Computers in Human Behavior* paper on former tracker users' guilt (vol. 233) was only seen in a search
  summary; the page returned 404. It is not cited.
- The dayseven and Calistack/Ascend listings were seen only as search summaries; their wording above is from those summaries.
- The Grüning and Richlan Strava study is a PsyArXiv preprint (not peer reviewed) and is not used as evidence.
