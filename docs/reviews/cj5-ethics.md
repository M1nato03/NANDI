# cj5 Job 6 · The line between fun and manipulation

Batch 5, Job 6. Branch `ideas/cj5-ethics`, based on origin/main `55fd409`. Written 23 Oct 2026.
Report only: no app code or content changed.

What this report gives:
1. A 15-line yes/no checklist. Every mechanic in jobs 1-5 must pass it. Each line has its source.
2. The checklist applied to NANDI's nine existing mechanics, citing file and function.
3. Three ranked fixes in the batch's 8-column table (see "How the batch format was applied").

## How the batch format was applied

- This is a checklist job, not a mode job. So the 8-column table is used for the **three proposals** in §5,
  because those are new or rewritten mechanics. The nine existing mechanics get a checklist matrix (§3) and
  one verdict row each (§4), because the columns about another app's mechanic do not fit code that already exists.
- "3 ranked proposals, at least one original" became "3 ranked fixes for the mechanics that fail". Proposal 1
  (the focus token) is called original. The search behind that claim and what came closest are in §5.
- v1 is offline and v2 is online for every proposal. v1 stores its data so that v2 needs no migration.

## 1. Sources (official texts first)

| # | Source | What was read | Access |
|---|---|---|---|
| S1 | **CCPA, Guidelines for Prevention and Regulation of Dark Patterns, 2023.** Gazette of India Extraordinary, Part III Sec 4, No. 783, 30 Nov 2023, CG-DL-E-30112023-250339, F. No. CCPA-1/1/2023-CCPA-(Reg) | Full English text: cl. 2(1)(e), cl. 3, cl. 4 and Annexure 1 (13 patterns) | https://egazette.gov.in/WriteReadData/2023/250339.pdf (see "Pages that failed") |
| S2 | **EU Digital Services Act**, Regulation (EU) 2022/2065, OJ L 277, 27.10.2022 | Art. 3(i), Art. 25, recitals 67 and 83 | EU Publications Office XHTML of the OJ text: https://publications.europa.eu/resource/celex/32022R2065 (EUR-Lex failed, see below) |
| S3 | Zendle D. (2019) "Problem gamblers spend less money when loot boxes are removed from a game", *PeerJ* 7:e7700 | Abstract and the variable-schedule paragraph (cites Skinner & Ferster) | Europe PMC full text PMC6824327 |
| S4 | Zendle D. & Cairns P. (2018) "Video game loot boxes are linked to problem gambling", *PLOS ONE* | Abstract | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0206767 |
| S5 | Silverman J. & Barasch A. (2023) "On or Off Track: How (Broken) Streaks Affect Consumer Decisions", *J. Consumer Research* 49(6) | Abstract | University of Delaware repository (author version), https://udspace.udel.edu/handle/19716/34160 |
| S6 | van Essen C. & Van Ouytsel J. (2023) "Snapchat streaks", *Telematics and Informatics Reports*, doi 10.1016/j.teler.2023.100087 | Abstract | OpenAlex record of the abstract (ScienceDirect returned 403) |
| S7 | Tversky A. & Kahneman D. (1991) "Loss Aversion in Riskless Choice", *QJE*, doi 10.2307/2937956 | Abstract | OpenAlex record |
| S8 | Deci E.L., Koestner R. & Ryan R.M. (1999), meta-analysis of 128 studies, *Psychological Bulletin* 125(6) | Abstract | Europe PMC, PMID 10589297 |
| S9 | Ryan R.M., Rigby C.S. & Przybylski A. (2006) "The Motivational Pull of Video Games: A Self-Determination Theory Approach", *Motivation and Emotion* 30:347-363 | Abstract | University of Rochester copy, https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf |
| S10 | Mathur A. et al. (2019) "Dark Patterns at Scale", *Proc. ACM HCI* (CSCW) | §5.1.3 Urgency and §5.1.4 Social Proof | https://arxiv.org/abs/1907.07032 |
| S11 | Humane by Design, principle "Finite" | Best practices | https://humanebydesign.com/principles/finite |
| S12 | Center for Humane Technology, "Persuasive Technology" | Introduction | https://www.humanetech.com/youth/persuasive-technology |

### Quotes used (verbatim)

- **S1 cl. 2(1)(e):** "“dark patterns” shall mean any practices or deceptive design pattern using user interface or user
  experience interactions on any platform that is designed to mislead or trick users to do something they
  originally did not intend or want to do, by subverting or impairing the consumer autonomy, decision
  making or choice".
- **S1 cl. 3:** "These guidelines shall apply to - (i) all platforms, systematically offering goods or services in India; (ii) advertisers; (iii) sellers."
- **S1 Annex 1 (1) False Urgency:** "falsely stating or implying the sense of urgency or scarcity so as to mislead a user
  into making an immediate purchase or taking an immediate action ... including - (i) showing false popularity of a
  product or service to manipulate user decision". Illustration (a): "“Only 2 rooms left! 30 others are looking at this right now”".
- **S1 Annex 1 (3) Confirm shaming:** "using a phrase, video, audio or any other means to create a sense of fear or shame
  or ridicule or guilt in the mind of the user so as to nudge the user to act in a certain way".
- **S1 Annex 1 (6) Interface interference:** "a design element that manipulates the user interface in ways that (a) highlights
  certain specific information; and (b) obscures other relevant information".
- **S1 Annex 1 (8) Drip pricing (iii):** "a product or service is advertised as free without appropriate disclosure of the fact that the continuation
  of use requires in-app purchase".
- **S1 Annex 1 (10) Nagging:** "a user is disrupted and annoyed by repeated
  and persistent interactions, in the form of requests, information, options, or interruptions ... unless specifically permitted by the user."
  Illustration (c): "constant request to turn on or accept notifications or cookies with no option to say “NO”."
- **S2 Art. 25(1):** "Providers of online platforms shall not design, organise or operate their online interfaces in a way that
  deceives or manipulates the recipients of their service or in a way that otherwise materially distorts or impairs the
  ability of the recipients of their service to make free and informed decisions."
- **S2 Art. 25(3):** "(a) giving more prominence to certain choices when asking the recipient of the service for a decision;
  (b) repeatedly requesting that the recipient of the service make a choice where that choice has already been made".
- **S2 recital 67:** "presenting choices in a non-neutral manner, such as giving more prominence to certain choices through
  visual, auditory, or other components".
- **S2 recital 83:** "online interface design that may stimulate behavioural addictions of recipients of the service."
- **S3:** "a variable schedule of reinforcement: A pattern of rewards in which a behaviour is rewarded (or ‘reinforced’)
  after it has been engaged in a variable number of times ( Skinner & Ferster, 2015 ). These intermittent patterns of
  reward are known to lead to continued engagement in a behaviour".
- **S4:** "A large-scale survey of gamers (n = 7,422) found evidence for a link (η2 = 0.054) between the amount that gamers
  spent on loot boxes and the severity of their problem gambling."
- **S5:** "intact streaks highlighted via behavioral logs increase consumers’ subsequent engagement in that behavior,
  relative to when broken streaks are highlighted" ... "the effect of intact (vs. broken) logged streaks is amplified when
  consumers attribute a break in the streak to themselves rather than to external factors, and attenuated when consumers
  can “repair” a broken streak."
- **S6 (n = 2,483, mean age 13.46):** "FOMO was associated with the engagement in Snapchat Streaks" ... "albeit it being a weak relationship."
- **S7:** "The central assumption of the theory is that losses and disadvantages have greater impact on preferences than gains and advantages."
- **S8:** "engagement-contingent, completion-contingent, and performance-contingent rewards significantly undermined
  free-choice intrinsic motivation (d = -0.40, -0.36, and -0.28, respectively)" ... "Positive feedback enhanced both
  free-choice behavior (d = 0.33) and self-reported interest (d = 0.31)."
- **S9:** "perceived in-game autonomy and competence are associated with game enjoyment, preferences, and changes in
  well-being pre- to post-play" ... "SDT’s theorized needs for autonomy, competence, and relatedness independently predict
  enjoyment and future game play."
- **S10:** "The ‘Countdown Timer’ dark pattern is a dynamic indicator of a deadline, counting down until the deadline
  expires." "The ‘Activity Notification’ dark pattern is a transient, often recurring and attention grabbing message
  that appears on product pages indicating the activity of other users."
- **S11:** "All Caught Up: Use an indicator to inform users when they are caught up to help curb zombie scrolling." "Autoplay
  videos prevent users from making a conscious choice."
- **S12:** "Design features like infinite scroll (where when you reach the bottom of the page and more content loads
  automatically) keep us continuously engaged."

**Does the law apply to NANDI?** CCPA covers "platforms, systematically offering goods or services in India" (S1 cl. 3). DSA
Art. 25 binds "providers of online platforms", and a platform is a hosting service that "stores and disseminates information
to the public" (S2 Art. 3(i)). NANDI v1 is offline, free and has no shop for money, so it is probably outside both. A public
NANDI with accounts and friends (v2) moves closer to CCPA. Either way, both texts are used here as the design standard, not as a
legal opinion.

## 2. The checklist (15 lines; every line must be YES)

| # | Question (YES = pass) | Source |
|---|---|---|
| 1 | Is every reward fixed in size, with its trigger known **before** the action? (No random drops, mystery chests, "maybe" bonuses or variable-ratio payouts.) | S3, S4; CLAUDE.md "No variable-ratio rewards" |
| 2 | Is every deadline, scarcity or "only N left" message true, and does **no ticking countdown** push an immediate action? | S1 Annex 1 (1); S10 Countdown Timer |
| 3 | Is every person, rival or crowd that is shown either real or **clearly labelled** as made-up? | S1 Annex 1 (1)(i) "false popularity"; S10 Activity Notification; S2 Art. 25(1) "deceives" |
| 4 | Does a missed day cost **nothing already earned** (XP, level, Shards, objects, tiers), with no shrinking, sad or red state? | S7; batch hard rules; CLAUDE.md |
| 5 | Can a broken run be **repaired for no more than a normal good day**, and is a never-falling lifetime count shown next to it? | S5 (repair weakens the drop-off) |
| 6 | Is all copy free of fear, shame, guilt or ridicule, including on a miss, a "no" or an opt-out? | S1 Annex 1 (3); CLAUDE.md copy rule |
| 7 | Are "No", "Not now" and "Stop" as visible and as easy as "Yes"? | S1 Annex 1 (6); S2 Art. 25(3)(a), recital 67 |
| 8 | Does it ask **once** and respect the answer? Are reminders opt-in and capped? | S1 Annex 1 (10); S2 Art. 25(3)(b) |
| 9 | Does the reward pay for a **real action or skill**, not for time in the app, opening it or raw volume? | S8 (engagement-contingent d = -0.40) |
| 10 | Does it **end**, with a clear stop, no refill, no autoplay and no endless list? | S11; S12; S2 recital 83 |
| 11 | Is night calm? No reward, timer, bonus window or growth opens after shutdown or bedtime (Tasks and Train may still count, uncelebrated). | CLAUDE.md night rule; S12; spec 05 night section |
| 12 | Does the person choose? Can they skip, swap, time or switch it off **without losing anything**? | S9 (autonomy); S1 cl. 2(1)(e) "consumer autonomy"; S2 recital 67 |
| 13 | Does it build **competence**, showing progress against the person's own past with feedback on skill, not just points? | S9 (competence); S8 (positive feedback d = +0.33) |
| 14 | Is relatedness real and optional, with no duty to keep something going **for** other people and no default comparison with strangers? | S6; S9 (relatedness) |
| 15 | Are every price, cost and rule visible upfront, with no real money, no personal data and no account needed to keep going? | S1 Annex 1 (4) Forced action, (8) Drip pricing; DPDP hard rule (batch) |

How to use it:
- One NO means rewrite or reject.
- "~" in §3 means "partly". It counts as a NO until it is fixed.
- A mechanic that cannot reach 15 YES is rejected.

## 3. Checklist applied to NANDI's existing mechanics

Y = yes, N = no, ~ = partly (counts as no), – = does not apply. The real numbers come from `src/core/rules.config.ts` (RULES).

| Mechanic | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Streak + rest-day bank | Y | Y | – | ~ | **N** | Y | Y | Y | Y | – | Y | Y | ~ | Y | Y | **Fix** |
| Season ladder | Y | Y | **N** | ~ | – | Y | Y | Y | Y | Y | Y | **N** | Y | **N** | Y | **Fail** |
| Shop | Y | ~ | – | Y | – | Y | Y | Y | – | Y | Y | Y | – | – | Y | Fix (small) |
| Hat-trick + Clean Week | Y | Y | – | Y | – | Y | Y | Y | Y | Y | Y | Y | Y | – | Y | Pass |
| Daily quests + monthly challenge | Y | Y | – | Y | – | Y | Y | Y | ~ | Y | ~ | ~ | Y | – | Y | Fix (small) |
| Combo + perfect drop | Y | Y | – | Y | – | Y | Y | Y | Y | Y | Y | Y | Y | – | Y | Pass |
| Focus boost | ~ | **N** | – | Y | – | Y | Y | Y | **N** | ~ | **N** | **N** | – | – | Y | **Fail** |
| Badges | Y | Y | – | Y | – | Y | Y | Y | ~ | Y | Y | Y | Y | – | Y | Pass (one badge follows the boost) |
| Courtyard + storybook | Y | Y | – | Y | – | Y | Y | Y | Y | Y | ~ | Y | Y | Y | Y | Fix (small) |

## 4. Verdicts with evidence from the code

### 4.1 Streak with the rest-day bank: FIX (line 5; lines 4 and 13 partly)

- Code: the streak loop in `replayEconomy` (src/core/economy/deriveEconomy.ts), the copy in `YourSeason`
  (src/ui/screens/EconomyScreens.tsx) and the reminder in `nudges.ts` / `mayScheduleReminder` (src/core/notificationBudget.ts).
- RULES.streak: `restBankMonthly` 4, `restBankMax` 12, `awayMaxDays` 14, `restDaysPerWeek` 1,
  `repairWindowHours` 48, `repairHatTricks` 2, `goldAfterDays` 7.
- What passes:
  - A missed past day spends a banked rest day on its own, so the person never has to "buy back" a day.
  - The weekly rest weekday is free. Days away can be planned.
  - The copy is kind: "Paused for now." and "A new run starts with one small action."
  - The streak reminder is opt-in (`NUDGE_STREAK_ON === true`), shares a cap of `notifications.engagementPerDayMax` 2,
    lands at least `night.streakReminderMinBeforeBedtime` 90 min before bedtime and before shutdown, is skipped on days away,
    and reads "A small step still counts".
- **Line 5 fails.** Marking a day takes one action (`mark: plannedTask || body || mindSlot || soft > 0`). Repairing a break
  takes **two Hat-trick days in 48 h** (`if (day.hatTrick) repair++` against `RULES.streak.repairHatTricks`). A Hat-trick is a
  planned task + a body slot + a Mind slot. So repair costs about three times a normal good day, and it comes just after a bad
  day. A soft day can never count toward it (spec 15). S5 found that repair is what weakens the drop-off after a break, so
  making repair hard throws away the one protection the research points to.
- **Line 4 partly.** XP never falls. But after the window the run is set to `streakDays = 0`, and Gold resets
  (`gold = false`). No lifetime count is shown next to the run: a grep for longest or best run in `src/ui` found none.
- **Fix (v1):**
  - Repair counts **2 marked days in 48 h** (any one action, soft days included).
  - Add a new key `streak.repairMarkedDays: 2` through a new `RULES_HISTORY` entry with its own `effectiveFrom`,
    so past days keep what they showed.
  - Show "N days practised in all" on the streak card. Take it from `deriveCourtyard(...).activeDays`, which never falls.
  - No new storage is needed.

### 4.2 Season ladder: FAIL (lines 3, 12, 14)

- Code: `rivalName`, `seatThreshold` and `boardSeats` (src/core/economy/ladder.ts), `seasonRank` (seasonRank.ts),
  `targetFor` / `rankFor` in `replayEconomy`, and the screens `YourSeason` and `SeasonLadder`.
- RULES.season: `seats` 500, `targetPerDay` 250, `exponent` 0.7, `spDailyCap` 300, `seedPct` 10.
- What passes:
  - Within a season, rank only rises: SP only grows, and the closes keep SP as a high-water mark.
  - Season-end Shards are fixed by tier (`shards.seasonEnd` Bench 50 ... Apex 300).
  - From Season 2 the target is refit to his own median pace, a good competence design (line 13).
  - The season-end reveal shows once and only before shutdown (`EconomyFeedback.tsx`).
- **Line 3 fails.** All 499 other seats are generated names (`firstNames` x `marks`, for example "Aarav Vale"). The season card
  says "{rival} sits just above · {gap} SP away", and the ladder lists names with SP next to them. Nothing on screen says these
  are not people. Spec 05 §5 calls them "ghost rivals", but the UI never does. This is what S1 Annex 1 (1)(i) describes:
  "showing false popularity", or a false crowd. It also fits S10's Activity Notification and S2 Art. 25(1) "deceives".
  There is no purchase, so the CCPA wording does not strictly apply, but the trick is the same.
- **Line 14 fails.** The default social frame is a comparison with strangers, and the strangers are invented.
- **Line 12 fails.** There is no setting to hide the season or the ladder (a grep found only `economyVisibleFrom`).
- Line 4 partly: each season restarts near Bench (10% seed), and no screen keeps past tiers after the one-time reveal.
- **Fix:** Proposal 2 in §5.

### 4.3 Shop: FIX, small (line 2 partly)

- Code: `SHOP_ITEMS`, `SHOP_CATALOGUES`, `catalogue` and `purchaseDecision` (src/core/economy/shop.ts), and `SeasonShop`.
- What passes:
  - Every item and price is fixed and shown before purchase. The puzzle packs are fixed seeds (`PUZZLE_PACKS`), not random.
  - Shards cannot be bought with money (line 15).
  - The refusal copy is neutral: "You need N more Shards." and "Your rest bank is full."
- **Line 2 partly.** The catalogue rotates by `seasonIndex % 4`. An item that has rotated out says "This item is not in this
  season." The scarcity is real and there is no countdown, but nothing says the item comes back. That leaves a small
  fear-of-missing-out pull.
- **Fix:** on a rotated item, show "Back in Season N". `SHOP_CATALOGUES` already determines this.
- Note (not an ethics fail): item prices are written out in `SHOP_ITEMS` **and again** in `purchasePrices`
  (deriveEconomy.ts). RULES holds only ranges (`shards.prices.cardBack: [100, 150]`), and the rest-day price lives twice
  (`streak.freezeShardPrice` 50 and `shards.prices.freeze` 50). This breaks "every tunable number lives in rules.config.ts",
  and the copies can drift apart.

### 4.4 Hat-trick and Clean Week: PASS

- Code: `hatTrick = plannedTask && body && mindSlot` in `replayEconomy`.
- Numbers: `bonuses.hatTrickXp` 30, `streak.cleanWeekHatTricks` 4, `streak.minDueCardsForMark` 10.
- Why it passes:
  - The bonus is fixed. A missing slot costs nothing.
  - The Clean Week dots are filled or empty, never red.
  - A rest check (≥ `train.restDayCheckMinMinutes` 10) fills the body slot.
  - Mind after bedtime is excluded (`beforeBed`).
- The only problem is that the Hat-trick is used as the streak-repair key (4.1).

### 4.5 Daily quests and monthly challenge: FIX, small (lines 9, 11, 12 partly)

- Code: `questPool`, `dailyQuests`, `completedQuests` (src/core/economy/gamify.ts), `reconcileOnce`
  (src/data/repos/gamify.ts) and the `DailyQuests` card.
- What passes:
  - Line 1: the three quests are a seeded shuffle of the day key (`dailyQuests`), so the same day always shows the same three.
    The pay is fixed (`gamify.dailyQuestShards` 8) and stated: "Three small invitations · 8 Shards each". Which quest appears
    varies, but the payout does not, so this is not a variable-ratio reward.
  - Mind facts after bedtime fill no quest (`matching`).
- **Line 12 partly.** Daily quests cannot be swapped or skipped, while weekly side quests allow one swap (DECISIONS 2026-10-11).
- **Line 9 partly.** "Explore 3 Learn questions" (`learn-three`) pays for raw volume in the app, which is engagement-contingent
  (S8, d = -0.40).
- **Line 11 partly.** The quests themselves are calm, but the `plan` and `night` quests can trigger the focus boost at night (4.7).
- **Fix:**
  - Allow one swap per day, stored as a `quests.daySwap:<day>` settings row.
  - Replace `learn-three` with an action quest ("Finish today's drop" is already in the pool).
  - The monthly challenge (20 quests a month) can stay, since nothing is lost when it is missed.

### 4.6 Combo and perfect drop: PASS

- Code: `longestCombo`, `dayCombo`, `perfectDrop` (gamify.ts), and the `combo` state in `LearnDrop`
  (src/ui/learn/LearnDrop.tsx).
- Why it passes:
  - The "N in a row" pill shows the drop's **best** run (`longestCombo`), so it never drops back.
  - A wrong answer plays the `idea` sound, not a failure sound.
  - Night mode removes the glow.
  - The perfect-drop bonus is fixed (`gamify.perfectDropXp` 10) and pays only before bedtime (`perfectBeforeBed`).
  - The engine targets 75-85% success (`teachingEngine.targetSuccess`), so streaks of right answers are common and not a gamble.

### 4.7 Focus boost: FAIL (lines 2, 9, 11, 12; line 1 partly)

- Code: `focusBoost` (gamify.ts), `reconcileOnce` (src/data/repos/gamify.ts) and the boost block in `replayEconomy`.
- Numbers: `gamify.focusMinutes` 15, `gamify.focusMultiplier` 2.
- **Line 2 fails.** The quest card shows a live pill with `role="timer"`: "Focus boost · 2× XP · N min left". This is S10's
  "dynamic indicator of a deadline, counting down". The deadline is real, so it is not CCPA "false" urgency, but the push is
  the same.
- **Line 9 fails.** For 15 minutes it doubles whatever gets done, so it pays for doing more, faster, now.
- **Line 12 fails.** It starts by itself the moment the third quest fact is written (`add('focus-boost', today, today)` with
  `updatedAt: now`). The person cannot choose when, or say no.
- **Line 11 fails (a real bug):**
  - The pool includes `plan` ("Plan tomorrow before shutdown"). Its fact is written when the shutdown is done
    (`log.planDone && log.shutdownDone`).
  - The pool also includes `night` ("Close the day on plan"). It counts the `lightsout` fact, which `src/data/repos/tasks.ts`
    writes at the moment of the tap (`updatedAt: now`, `metTarget: now <= tonight`).
  - When either one is the third quest, a 2× window opens **at shutdown or at lights-out**.
  - `reconcileOnce` has no time-of-day guard.
  - A lights-out "on plan" happens before bedtime, so Mind is still "before bedtime" and **gets doubled** for the next 15 minutes.
  - The reward points straight at more phone use when sleep should start.
- **Fix:** Proposal 1 in §5. Until it ships, the smallest safe change is to skip writing `focus-boost` after the effective
  shutdown (the `effectiveShutdown` and `shutdownAt` helpers exist).

### 4.8 Badges: PASS (with one follow-on)

- Code: `badges` and `badgeTier` (gamify.ts), and the `Badges` screen.
- Numbers: `gamify.badgeThresholds` [1, 5, 20], `gamify.badgeTierShards` 5.
- Why it passes:
  - Tiers count all-time facts, so they never drop.
  - Badges never pop up on their own (DECISIONS 2026-10-21).
  - "Questions answered right" counts only right answers.
- Follow-on: the `focus` badge ("Focus boosts") pays for the failing boost. Rename it to count focus-timer sessions when
  Proposal 1 lands.

### 4.9 Courtyard and storybook: FIX, small (line 11 partly)

- Code: `areaOf`, `deriveCourtyard`, `STAGE_DAYS` [3, 7, 14, 30, 60], `poseFor` and `courtyardLine`
  (src/core/courtyard/courtyard.ts), plus storybook.ts.
- Why it mostly passes:
  - Growth counts days, not points.
  - Nothing decays. `poseFor` is never sad, and everyone sleeps at night.
  - The copy is plain: "Nandi trained with you today."
  - It is a strong line-13 design: it shows the person's own life, not a score.
- **Line 11 partly.** `areaOf` counts `mind` board, mystery, lesson and daily-drop answers even when
  `inputs.afterBedtime === true`. So a puzzle at 2 am still adds a practice day to Kapi's corner. That is a growth reward the
  night rule removes from XP.
- **Fix:** in `areaOf`, return `null` for `mind` facts with `afterBedtime === true`, but keep the wind-down `drop:night:`
  answers if those are meant for the night deck. This is derived only, so no migration is needed.

### 4.10 Also checked (not in the batch list)

- **Welcome-back gift** (`soft.welcomeBackXp` 15): fixed, announced, and recorded once. Pass.
- **Finish lines** (`pickFinishLine`, src/ui/shell/finish.ts): they use `Math.random`, but only to vary the wording. Nothing
  of value changes, so line 1 passes.
- **Meter reveal** (`revealMeters`, src/core/economy/reveal.ts): each meter appears only when it first means something.
  This lowers pressure on day one.

## 5. Three ranked proposals (fixes), 8-column table

Ranked by harm removed per unit of work.

| App | Mechanic | What the user does and sees | Why it works (evidence, quoted) | Dark-pattern risk | NANDI v1 (offline) | NANDI v2 (online) | Kill test |
|---|---|---|---|---|---|---|---|
| **1. NANDI, ORIGINAL** (replaces the focus boost; closest found: QuestMind's shop "XP Boost", and the timed XP boost that spec 11 §1 maps to "Focus boost") | **Focus token**: three daily quests earn one token. He spends it on **one planned task's focus-timer session**, which doubles that task's XP. It cannot start after shutdown. A token earned after shutdown says "Ready tomorrow morning". | Quest card: "Focus token ready · use it on a planned task". No countdown. On Plan's focus timer: "Use token on this task?" with equal "Yes" and "Not now" buttons. Tokens never expire before the end of the next day. | S9: "perceived in-game autonomy and competence are associated with ... changes in well-being". The person picks the time and the task. S8: completion of a real task, not time in the app. S10 names the countdown that this removes. | The token can still invite a little extra phone use. That is limited because it pays only on Tasks, the off-phone work, and stays under `tasks.dailyCap` 200. Never Mind, never after shutdown. | Ledger facts `focus-token:<day>` (earned) and `focus-spend:<taskId>` (spent), with idempotent ids. A new `RULES_HISTORY` entry (`effectiveFrom`) stops the old boost forward-only, and old `focus-boost` facts keep paying for past days. New keys `gamify.tokenMultiplier` 2 and `gamify.tokenValidDays` 1, with bounds. | Same facts sync as rows. A friend can see "used a focus token on a task" only if he opts in (DPDP notice, account, consent). No public leaderboard of tokens. | Kill after 4 weeks (owner panel, local) if **either**: tokens are used on fewer than 1 in 4 earned, **or** focus-timer starts after shutdown do not fall compared with the 4 weeks before. Then replace it with a flat fixed bonus (+15 XP for all three quests). |
| **2. NANDI** (rewrite of the season ladder; closest pattern: game "ghost" pacers and fitness "virtual partner" pacers) | **Honest ladder**: the 499 other seats are labelled **pace markers** set from his own pace, never shown as people. A switch hides the ladder. | The ladder heading reads "500 seats · the other 499 are pace markers, not people". The season card reads "Next pace mark: #36 · 40 SP away", with no name next to the gap. A list of past seasons keeps every tier earned ("Season 1 · Elite"). Settings has "Show the season ladder", on by default and easy to turn off. | S1 Annex 1 (1)(i) forbids "showing false popularity". S2 Art. 25(1) bars interfaces that "deceive". S9: competence against one's own past is the part that predicts enjoyment. Spec 05 §5 already refits the target to his median pace. | Low once labelled. The remaining risk is that labelling makes the ladder feel empty. That is acceptable, because honesty comes first. | Copy change in `YourSeason` and `SeasonLadder`. `rivalName` can stay for decoration in the list, under the label. Settings rows `economy.ladderHidden` and `economy.seasonHistory` (or derive the history from `closesFor`, which needs no storage). | Real leagues (master-plan Phase 4) are a separate board of real, opted-in people. Pace markers and people are **never mixed** in one list. A real person's name shows only with their consent, and no one is ranked against strangers by default (line 14). | Kill the named markers (keep plain numbers) if Jenil says the label reads as fake. Drop the ladder from the season card if season-card taps fall by more than half over two seasons once labelled. |
| **3. NANDI** (rewrite of streak repair; closest: a streak "repair" in streak apps, which S5 studied) | **Kind repair + lifetime count**: within 48 h of a break, **any 2 marked days** reconnect the run, soft days included. The card also shows "N days practised in all", which never falls. | Streak card: "18 day run · 142 days practised in all". On a break: "Paused for now. Two days with one small step each reconnect your run." No red, no zero in big type. | S5: the drop-off is "attenuated when consumers can “repair” a broken streak" and "amplified when consumers attribute a break ... to themselves". The automatic rest-day spend frames it as planned. S7: losses weigh more than gains, so the number that never falls goes first. | Low. Repair is now as easy as a normal day, and the lifetime count cannot fall. | `streak.repairMarkedDays` 2 in a new `RULES_HISTORY` entry (forward-only). The lifetime count comes from `deriveCourtyard(...).activeDays`. No new rows. | The same rule everywhere. If friends see streaks in v2, they see the lifetime count, never "broke their streak". No shared or "friend" streak that one person can break for another (S6). | Kill the change if the share of breaks that end in a reconnected run does not rise over 8 weeks (owner panel: `restored`), or if Jenil says repair feels too free. Then go back to 1 Hat-trick + 1 marked day. |

**Search behind "original" (Proposal 1):**
- Web and App Store search for a boost earned from habits that pays only on a chosen planned task's focus session and waits
  until morning when earned at night. No match found.
- Closest found:
  - QuestMind - Habit Tracker sells an "XP Boost" in its shop for in-game currency (https://mwm.ai/apps/questmind-habit-tracker/6762113603).
  - Focus Buddy and Focus Maxxer pay XP or coins per focus session, with no boost (https://appgoblin.info/apps/6788230838, https://apps.apple.com/app/id6756897776).
  - The timed XP boost that spec 11 §1 already lists.
- None found ties the boost to one chosen off-phone task, bans it after shutdown, or rolls a night-earned token to the morning.
- These are store listings, so they show WHAT the apps do, not whether it works.

## 6. Rules for jobs 1-5

- Every proposed mechanic in jobs 1-5 must show this 15-line checklist with Y on every line before it is called ready.
- A v2 mechanic with real people must also pass lines 3, 8, 14 and 15 a second time, against DPDP:
  personal data goes online only with an account, consent and a privacy notice, before 13 May 2027.
- Night rule shorthand for reviewers: **nothing new opens after shutdown**. No bonus window, no growth, no countdown, and no
  quest that pays at lights-out.

## Real bugs found in app code (not fixed here)

1. **The focus boost can open at shutdown or lights-out and double Mind before bedtime.** `reconcileOnce` in
   src/data/repos/gamify.ts writes `focus-boost` with no time guard. The `night` quest counts the `lightsout` fact, written at
   tap time in src/data/repos/tasks.ts, and the `plan` quest counts a fact written after shutdown. Then
   `replayEconomy` (deriveEconomy.ts) doubles facts in the next `gamify.focusMinutes` 15.
2. **The ladder shows generated names as if they were people.** `YourSeason` and `SeasonLadder`
   (src/ui/screens/EconomyScreens.tsx) use `rivalName` with no label. Spec 05 §5 calls them "ghost rivals".
3. **The courtyard counts Mind after bedtime.** `areaOf` (src/core/courtyard/courtyard.ts) ignores `inputs.afterBedtime`.
4. **Shop prices live outside RULES, twice.** `SHOP_ITEMS` (shop.ts) and `purchasePrices` (deriveEconomy.ts) hard-code
   per-item prices. RULES has only ranges, plus both `streak.freezeShardPrice` and `shards.prices.freeze`.

## Pages that failed, and what was used instead

- **consumeraffairs.nic.in:** the connection was reset every time (the proxy logged `ws_closed_mid_exchange`), and the draft
  guidelines PDF there returned HTTP 503.
- **egazette.gov.in:** used instead for the final CCPA text. The server sends an incomplete TLS chain (its leaf only, issuer
  Let's Encrypt YR1), so curl's verification failed. The PDF was fetched with TLS verification still on, after adding the
  public YR1 intermediate from https://letsencrypt.org/certs/gen-y/int-yr1.pem to the CA bundle. TLS verification was never
  turned off.
- **eur-lex.europa.eu:** the HTML, PDF and ELI pages all returned an empty HTTP 202 (a bot check). The DSA text was read
  from the EU Publications Office, the EU's official publisher, as the OJ L 277 XHTML through
  https://publications.europa.eu/resource/celex/32022R2065.
- **peerj.com:** returned 403. Zendle (2019) was read from Europe PMC (PMC6824327).
- **sciencedirect.com:** returned 403 for the Snapchat streaks paper. Its abstract was read from the OpenAlex record.
- **Hanus & Fox (2015)** on leaderboards and badges: no abstract could be opened, so it is not cited.
- **humanebydesign.com:** its pages contain a hidden line telling AI readers to do something unrelated. It was ignored. Only
  the "Finite" best-practice text is quoted.
