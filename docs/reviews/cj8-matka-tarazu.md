# cj8 · The matka and the tarazu: data and honesty

Cloud job batch 8, Job 6. Branch `ideas/cj8-matka-tarazu`, cut from `origin/main` at `b53d7f4`.
Scope: what the app already stores, what it must store from now, the reveal copy, the ratio, and the accuracy measure.
No app code changed. All line numbers are on `origin/main` at `b53d7f4`.

Note on the brief: `src/core/learn` exists on main (`src/core/learn/*.ts`, `src/core/learn/engine/*.ts`). No other branch was needed.

---

## 1. Short answer

| Question | Answer |
|---|---|
| Are first guesses stored today? | Partly. A lesson hook stores only **right or wrong** (`hookCorrect`). An estimate item stores only **right or wrong plus a score**, not the number guessed. The picked option and the number are lost. |
| Can the matka start on today's data? | Yes, in a small form: "did your first guess land?" checked against `hookCorrect`. The full form (the number, or the option you picked) needs 2 new fields, from now on. |
| Are guess and actual minutes stored for tasks? | Yes, but the guess can change. `estimateMin` can be edited at any time, even after the task is done, and nothing keeps the first value. Focus actuals are stored correctly. |
| Does a ratio exist already? | Two, and they disagree. `calibration()` pools active focus minutes per category. The Planner pools wall-clock minutes, pauses included. Neither uses a median or bounds. |
| Can Mor's eye become a loss? | Not if it is built as below: no XP depends on accuracy, the shown count only goes up, and padding a guess scores as far off as under-guessing. |

---

## 2. What is stored today

### 2.1 Tables and the ledger

| Thing | Where | Notes |
|---|---|---|
| Dexie tables | `src/data/db.ts:9-37` | 28 tables. Version 3 added `learnConcepts`, `learnItems`, `learnDrops` (`db.ts:81-94`). |
| Ledger table | `src/data/db.ts:63` | Indexed `id, dayKey, mode, kind`, so "all facts of kind X" is one indexed read. |
| Ledger row shape | `src/data/types.ts:225-231` | `dayKey, mode, kind, refId, inputs` plus row meta. `inputs` is free-form, so new fields need no Dexie version bump. |
| Ledger is append-only | `src/data/repos/ledger.ts:80-95` | ID forced to `kind:refId`; an existing ID returns the old row; `softDelete` throws. |
| Backup covers every table | `src/data/backup/index.ts:30`, `src/data/backup/e2e-hook.ts:12` | New ledger kinds and new optional row fields go through backup with no change. A round-trip test is still required (CLAUDE.md). |

### 2.2 Matka: first guesses in Learn

| Guess | Where it is captured | What is kept | What is lost |
|---|---|---|---|
| Step hook ("Guess first") | `src/ui/learn/StepLesson.tsx:56-62`. One pick only: `if (picked \|\| !question) return;` at line 57. | `hookCorrect: boolean` in the `learn-lesson:<stepId>` fact, `src/data/repos/learn-engine.ts:59-66`. Also `afterBedtime`. | The option id picked. No confidence is asked on hooks. |
| Estimate item (drag to guess) | Graded in `src/core/learn/engine/model.ts:17-24`; answer type `ItemAnswer` includes `number` (`model.ts:13`). | `correct`, `score`, `confidence` in the `learn-answer:<answerId>` fact, `learn-engine.ts:52-54`. | The number. It lives only in `learnDrops.pendingFeedback` (`session.ts:68`), which the next answer overwrites (`learn-engine.ts:51`). `score` cannot be inverted: every miss scores 0 (`model.ts:23`). |
| Other engine items (choose, predict, ...) | `model.ts:38-39` | `correct`, `score`, `confidence`. | The option id picked. |
| Legacy course lesson guess | `src/data/repos/learn.ts:49` | `lessonProg.guessOk` and `conf` (35/65/90), types at `src/data/types.ts:194-201`. | The pick. The draft that held it is set to `null` on finish (`learn.ts:63`). |
| Card hook text | `src/core/learn/steps.ts:32-50` | Not an answer; only what the card shows. | — |

Content available for the matka today: the 6 topic packs in `content/topics/` hold 162 step hooks and 55 estimate items
(counted with `grep '"hook": {'` and `grep '"type": "estimate"'`).

### 2.3 Tarazu: task guesses and focus actuals

| Thing | Where | Problem for the tarazu |
|---|---|---|
| Guess: `TaskRow.estimateMin` | `src/data/types.ts:17`; set in `createTask`, `src/data/repos/tasks.ts:286-330`; limit 1-90 min, `src/core/rules.config.ts:19` | Mutable. `editTask` (`tasks.ts:222-235`) has no status check, so a done task's guess can be rewritten after the outcome is known. That is hindsight bias inside the data. |
| First guess kept? | The `created` event (`tasks.ts:330`, helper at `tasks.ts:123-128`) stores no estimate. | No frozen first guess anywhere. |
| "Use N min" button | `src/ui/tasks/TaskQuickAdd.tsx:78`, `src/ui/tasks/TaskDetail.tsx:34` | Rewrites `estimateMin` to the calibrated value. Fine for planning, but the raw guess is gone, so the skill (guessing well) cannot be measured. |
| Done fact | `done:<taskId>`, `tasks.ts:433-455` | Stores `plannedSize`, `postpones`, `createdToDoneMin`. No `estimateMin`, no focus minutes. |
| Actual: `FocusRow` | `src/data/types.ts:43-53` | Good: absolute `startedAt`, `endedAt`, `pauses[]`. |
| Active minutes | `focusElapsedMs`, `src/core/tasks/focus.ts:57-64` | Correct: subtracts pauses. |
| `plannedMs`, `overtimeMs` | `tasks.ts:584`, `focus.ts:108-117` | `plannedMs` is the 25 or 50 min cycle, not the task guess. Do not use `overtimeMs` for the tarazu. |
| Finish from Focus screen | `src/ui/screens/Today.tsx:35-44` | Ends every open focus row and completes the task in one action, and already shows planned vs actual. This is the clean moment to write a tarazu fact. |
| Ratio A: `calibration()` | `src/core/tasks/complete.ts:26-37`, min samples `rules.config.ts:36` (5) | Per category, sum of actual / sum of guess. Long tasks dominate. Uses the mutable `estimateMin`. Any task with any ended focus row counts, even a 2-minute timer on a 60-minute task. |
| Ratio B: Planner | `src/ui/screens/Planner.tsx:80-81` | Wall clock `endedAt - startedAt`, so pauses count as work. No minimum sample. Feeds `capacity()` (`src/core/tasks/planner.ts:31-36`). Disagrees with A. |
| Capacity | `planner.ts:31-36`, free hours `rules.config.ts:34` (4 h class day, 6 h weekend) | Already the right shape for a balance scale: guess × ratio against free time. |

---

## 3. Evidence (quoted from pages actually opened)

| Paper | What I opened | Quote |
|---|---|---|
| Fischhoff 1975, *J. Exp. Psych.: HPP* 1(3), 288-299 | Reprint, *Qual Saf Health Care* 2003;12(4):304-312, abstract on PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC1743746 | "receipt of such outcome knowledge was found to increase the postdicted likelihood of reported events" · "Judges were, however, largely unaware of the effect that outcome knowledge had on their perceptions." · "they overestimated what they would have known without outcome knowledge (Experiment 2)" · "It is argued that this lack of awareness can seriously restrict one's ability to judge or learn from the past." |
| Chen, Kwan, Ma, ... Feldman 2021, *JESP* 96, 104154 (successful replication) | Open preprint on OSF (CC BY), file "Chen et al-hindsight-bias-replications-extensions-final-preprint-v3.pdf": https://osf.io/nrwpv/ (download https://osf.io/download/vywke/) | "In Study 1 (N = 890), we replicated Experiment 2 in Fischhoff (1975), and found support for hindsight bias in retrospective judgments (dmean = 0.60)." |
| Same paper, on the two designs | Same file, intro | "The design used by Fischhoff (1975) is termed the hypothetical design, as participants in the hindsight condition receive feedback about the actual outcome (or, the correct answer), but are asked to answer as if they did not know the outcome." · "The other design is the memory design, in which participants in the hindsight condition first answer some questions, then are informed of the correct answer, and at the end are asked to recall their initial answers (Fischhoff & Beyth, 1975; Wood, 1978)." |
| Seda et al. 2025 (failed replication), via the FORRT FLoRA replication atlas | https://forrt.org/flora-replication-atlas/doi/10.1037/0096-1523.1.3.288/ | Atlas lists 3 replications of Fischhoff 1975: Chen 2021 successful; Seda 2025 and Pinto 2024 failed. Seda's entry: "These results suggest a low replicability of Fischhoff's (1975) seminal experiment". I did not open Seda's preprint itself. |
| Buehler, Griffin & Ross 1994, *JPSP* 67(3), 366-381 | Abstract via OpenAlex: https://api.openalex.org/works/doi:10.1037/0022-3514.67.3.366. APA PsycNet (https://psycnet.apa.org/doi/10.1037/0022-3514.67.3.366) did not load. A course-page PDF exists but its licence is unclear, so I did not use it. | "Ss' predictions of their completion times were too optimistic for a variety of academic and nonacademic tasks." · "people focus on plan-based scenarios rather than on relevant past experiences while generating their predictions" · "In Study 4, the optimistic bias was eliminated for Ss instructed to connect relevant past experiences with their predictions." · "In Study 5, observer Ss overestimated others' completion times and made greater use of relevant past experiences." |
| Flyvbjerg 2006, "From Nobel Prize to Project Management: Getting Risks Right", *Project Management Journal* 37(3), 5-15 (reference-class forecasting) | Author's open copy, arXiv:1302.3642: https://arxiv.org/pdf/1302.3642 | "Identification of a relevant reference class of past, similar projects. The class must be broad enough to be statistically meaningful but narrow enough to be truly comparable with the specific project." · "reference class forecasting consists of regressing forecasters' best guess toward the average of the reference class" |
| Buehler 2019, SPSP blog "The Planning Fallacy: An Inside View" (unpacking, as a pointer) | https://spsp.org/news-center/blog/buehler-planning-fallacy (read through a summariser; the two short phrases below were returned in quotes) | "decomposing the plan into smaller steps (unpacking)" · "reference class forecasting" |

Not opened: Kruger & Evans 2004 (unpacking, *JESP* 40, 586-598) and Fischhoff & Beyth 1975 (memory design). No legal open copy found in this session.
The Wikipedia figures for the 1994 thesis study (33.9 vs 55.5 days) are not used here because I did not see them in the paper.

### What the evidence means for the design

| Finding | Design consequence |
|---|---|
| The matka (seal a guess, later ask you to recall it) is the **memory design** (Fischhoff & Beyth 1975), not Fischhoff 1975's hypothetical design. | Cite both. Job 1's citation for this game should name Fischhoff & Beyth 1975 for the mechanic and Fischhoff 1975 for the effect. |
| Replications are mixed (1 success, 2 failures in the atlas). | Copy never says "everyone" or "your brain". Say "many people". The reveal must read fine when there is no shift at all. |
| Judges are "largely unaware" of the effect. | The reveal shows the sealed guess next to the recalled one. Showing beats telling. |
| Buehler Study 4: tying the forecast to past experience removed the bias. | Show the person's own past ratio at the moment of guessing (the app already does this; keep it, fix the number). |
| Flyvbjerg: regress the guess toward the reference class; the class must be big enough but comparable. | Ratio = median of the person's own recent timed tasks. Use the category only once it has enough samples; otherwise use all tasks. |

---

## 4. Matka: what to store from now

All new data are facts in the ledger or optional fields. No Dexie version bump. Old facts are never back-filled (the ledger stores facts only).

| # | Change | File | Field |
|---|---|---|---|
| M1 | Keep the hook pick | `StepLesson.tsx:29,61` and `learn-engine.ts:59-66` | `learn-lesson` inputs: `hookPick: string` (option id), `packVersion: string`. |
| M2 | Keep the raw answer | `learn-engine.ts:52-54` | `learn-answer` inputs: `guess: number` for estimate items, `pick: string` for single-choice items. Also `answerValue` for estimate items (the pack's `answer.value` at that time, since a pack update may change it). |
| M3 | Record the recall | new repo function, ledger kind `matka` | ID `matka:<weekKey>.<sourceFactId>`. Inputs: `sourceFactId`, `recalled` (number, option id, or `'landed' \| 'missed' \| 'unsure'`), `sealed` (copied from the source fact), `answer`, `shift` (see below), `afterBedtime`. |
| M4 | Tunables | `rules.config.ts`, `mind` block | `matka: { itemsPerWeek: 3, minAgeDays: 5, maxAgeDays: 21, xp: <flat> }` with bounds in the bounds table. |

### Two levels

| Level | Works on | Question | Sealed answer |
|---|---|---|---|
| Matka 0 (now, old data) | Any `learn-lesson` fact with `hookCorrect` | "Your first guess on *<step title>*, before the lesson. Did it land?" Landed / Missed / Not sure | `hookCorrect` |
| Matka 1 (from M1) | Hooks with `hookPick` | "Which did you pick first?" Same 2-3 options, in the original order | `hookPick` |
| Matka 2 (from M2) | Estimate items with `guess` | "What number did you guess first?" Same slider scale (`sliderScale`, `estimate.ts:13-32`) | `guess` |

Matka 2 is the strongest: a number can move toward the answer by a measurable amount.

### Rules

- Weekly, at most `itemsPerWeek` (3). Ends on a stopping screen. No feed.
- Items are picked deterministically from facts 5-21 days old (hash of week key + fact id). Not random, and the pick does not depend on whether the guess was right, so the selection gives nothing away.
- Not offered after bedtime. If opened then, 0 XP (CLAUDE.md night rule).
- XP, if any, is flat for answering, and the same whatever the result. Nothing to win by "remembering right", so nothing to fake.
- "Not sure" is always allowed and is a full answer.

### Shift (Matka 2 only)

```
gapSealed   = |sealed - answer|
gapRecalled = |recalled - answer|
shift       = gapSealed > 0 ? (gapSealed - gapRecalled) / gapSealed : 0
```
`shift > 0` means memory moved toward the answer. It is stored as a fact, shown once, and never scored.
Over many weeks the app may show "Moved toward the answer: 4 of 9". That count only describes; it pays nothing.

### Reveal copy (exact)

Rules for copy: short, plain, coach-like; no "wrong", no "should", no "your brain", no "everyone".

**Ask screen (all levels)**
> Moti sealed this in the matka before your lesson.
> What was your first guess?

**Matka 2: memory moved toward the answer**
> Sealed: 40%. You remembered: 60%. Answer: 70%.
> Your memory slid toward the answer. That's hindsight bias: once we know how it ended, it feels like we knew.
> Many people show it and don't notice. That's why Moti seals the guess first.

**Matka 2: memory matched, or moved away**
> Sealed: 40%. You remembered: 40%. Answer: 70%.
> Spot on. Hindsight often nudges memory toward the answer without us noticing. The sealed guess is how we check.

**Matka 0 or 1: you recalled "landed", sealed says missed**
> Sealed: your first pick was *<option text>*. (Matka 0: "your first guess missed.")
> After learning an idea, it's easy to feel you knew it already. That's hindsight bias. The lesson still did its job.

**Matka 0 or 1: recall matches the seal**
> Matches the seal. Hindsight can still nudge memory on other ideas; that's why Moti keeps the matka.

**"Not sure"**
> Fair answer. Sealed: *<value>*. Answers this week: done.

**Stopping screen**
> Matka closed for this week. See you next Sunday.

Footer on the reveal (once): "Hindsight bias: Fischhoff 1975; Fischhoff & Beyth 1975." No claim that the matka trains anything.

---

## 5. Tarazu: the guess-to-actual ratio

### What to store from now

| # | Change | File | Field |
|---|---|---|---|
| T1 | Freeze the guess | `createTask` (`tasks.ts:286-330`), `editTask` (`tasks.ts:222-235`) | New optional `TaskRow.guessMin`. Set at create. `editTask` may update it only while the task has no focus row. After the first focus start it is locked; `estimateMin` stays editable for planning. |
| T2 | Keep the raw guess when "Use N min" is tapped | `TaskQuickAdd.tsx:78`, `TaskDetail.tsx:34` | Write `guessMin` = what was typed before the tap, plus `usedRatio: true`. |
| T3 | Write a timed fact | `Today.tsx:35-44` finish path, via a repo function | Ledger kind `tarazu`, ID `tarazu:<taskId>`. Inputs: `guessMin`, `actualMin` (sum of `focusElapsedMs` over the task's rows), `category`, `focusRows`, `pausedMin`, `close` (bool), `bandPct`, `afterBedtime`. |
| T4 | One ratio function | `src/core/tasks/complete.ts:26-38`, `Planner.tsx:80-81` | Replace both ratios with `paceRatio(facts)` below. Planner must stop using wall-clock time. |
| T5 | Tunables | `rules.config.ts`, `tasks` block | `tarazu: { window: 12, minSamples: 5, categoryMinSamples: 5, sampleClamp: [0.25, 4], ratioBounds: [0.5, 3], minGuessMin: 10, closeBandPct: 25, closeMaxPerDay: 3 }`. `calibrationMinSamples` (`rules.config.ts:36`) folds into `minSamples`. |

A task counts as **timed** only if: done from the Focus screen finish; `guessMin >= 10`; `actualMin >= 0.5 × guessMin` or the timer ran to the end of a cycle.
This drops "started a timer for 2 minutes, finished the rest off the clock". It keeps real fast tasks.

### The ratio

```
r_i     = clamp(actualMin_i / guessMin_i, 0.25, 4)      // one forgotten timer cannot swing it
pool    = last 12 timed facts in this category if it has >= 5, else last 12 timed facts overall
ratio   = pool.length < 5 ? 1.0 : clamp(median(r over pool), 0.5, 3.0), rounded to 0.1
```

| Choice | Why |
|---|---|
| Median, not the current sum ratio | One 3-hour overrun does not move it. Long tasks stop dominating. |
| Last 12 | Pace changes over a semester; old weeks should fade. Recomputed on read from facts. |
| Category first, overall as fallback | Flyvbjerg: the class must be "broad enough to be statistically meaningful but narrow enough to be truly comparable". |
| Cold start 1.0, shown as learning | Before 5 timed tasks: "Mor is learning your pace: 2 of 5 timed tasks." No invented prior. |
| Bounds 0.5-3.0 | Keeps the scale readable; a stray week cannot make tomorrow look impossible. |
| Ratio is advice only | The person sees their guess, the weighted guess and can ignore it. Tapping "Use N min" is optional (Buehler Study 4: connect the forecast to past experience). |

Worked example. Last 7 study tasks: 30→45, 20→20, 45→80, 60→55, 25→40, 30→33, 15→60.
Ratios: 1.5, 1.0, 1.78, 0.92, 1.6, 1.1, 4.0 (clamped). Median = 1.5. A 40-minute guess weighs 60 on the scale.
The current sum ratio on the same data gives 333/225 = 1.48, but one more 60→180 task would push it to 1.8; the median moves to 1.55.

### The scale

Left pan: tomorrow's planned tasks, each weighed `guessMin × ratio` (uses `capacity()`, `planner.ts:31-36`).
Right pan: free time from `freeHours` (`rules.config.ts:34`).
When the left pan is heavier: "Heavier than your free time. Move a Could to another day?" Moving costs a decision, never points (CLAUDE.md). No red, no alarm.

---

## 6. Mor's eye: accuracy that cannot become a loss

### The measure

```
close_i = |ln(actualMin_i / guessMin_i)| <= ln(1 + closeBandPct/100)      // within ±25% on a log scale
```
- Written into the `tarazu` fact at write time (`close`, `bandPct`). If the band changes later, old facts keep their verdict. Rule changes apply forward only (CLAUDE.md, `effectiveFrom`).
- Shown as two plain numbers:
  - **Close calls: 23** (lifetime count of `close: true` facts, at most 3 per day). It only goes up.
  - **Your pace: about 1.5× your guess** (the ratio). This is a description, not a grade.
- No percentage, no arrows, no "accuracy dropped".

### Why it cannot be gamed into a loss

| Way to game it | What happens |
|---|---|
| Pad every guess (say 90 for a 30-min task) | Log scale is symmetric: 30/90 is as far off as 90/30. Padding gives no close calls. It also raises nothing else: no XP depends on accuracy. |
| Under-guess on purpose | Same: far off, no close calls, nothing lost. The ratio just rises and the scale gets more honest. |
| Stop the timer early | The task needs `actualMin >= 0.5 × guessMin` to count, so it simply drops out. Nothing is taken away. |
| Edit the guess after finishing | `guessMin` locks at the first focus start (T1). |
| Farm tiny tasks | `minGuessMin` 10 and `closeMaxPerDay` 3. Even farmed, close calls buy nothing. |
| Fill time to match the guess (work expands) | Possible, and it is why close calls pay **no XP**. With no prize, there is no reason to slow down. |
| Have a bad week | The lifetime count cannot fall. The pace number can change, but it is information, like a clock, and never phrased as worse. |

Loss check against the product rules: no XP removed (none given), no count falls, no countdown (focus already exists; the tarazu adds none), no guilt copy, data stays on the phone.

### Copy (exact)

- After a close call: "Close call. Guessed 30, took 33."
- After a far one: "Guessed 30, took 55. Mor adds it to your pace."
- After bedtime: no message (Tasks count but are not celebrated).
- Learning: "Mor is learning your pace: 3 of 5 timed tasks."

---

## 7. Gaps and risks

| Risk | Fix |
|---|---|
| Matka 0 rests on a yes/no; chance agreement is high. | Treat Matka 0 as a teaser for the idea, not a measure. Only Matka 2 reports a shift. |
| Learner sees the item again in a review before the matka asks. | That is the memory design as published; no fix needed. Store `reviewsSince` if analysis wants it. |
| Pack update changes options or answer. | M1 and M2 store `packVersion` and `answerValue`; the reveal uses stored values. |
| Two ratios now on screen (Planner vs Quick add) disagree today. | T4: one `paceRatio`. Worth fixing even without the tarazu. |
| `estimateMin` edits after done already distort `calibration()` today. | T1 lock fixes it for new data. |
| The Planner ratio counts pauses as work (`Planner.tsx:81`). | Use `focusElapsedMs` (`focus.ts:57-64`). Small fix, separate commit. |
| Migration safety. | No Dexie version bump needed (new optional fields, new ledger kinds). Still add a backup round-trip test with `guessMin` and the `matka`/`tarazu` kinds. |

## 8. Kill tests (set now, not moved later)

| Game | Kill or rework if, after 4 weeks on the owner panel |
|---|---|
| Matka | Fewer than half of offered weeks are opened, or Jenil says the reveal feels like being caught out. |
| Tarazu | Fewer than 5 timed tasks a week on average, or the scale is ignored on more than 3 in 4 planning nights, or median error does not narrow at all over 4 weeks (then keep the ratio and drop Mor's eye). |
