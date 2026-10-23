# cj4 · Learning that transfers to real life

Job 3 of cloud batch 4 (23 Oct 2026). Branch `ideas/cj4-transfer`, based on `origin/main` at `a6c21b7`.
Review only: no app code or content JSON changed.

Question: what makes a skill learned in the app show up in real life, and what small add-on could NANDI ship
to make that happen without guilt, streak pressure or random rewards?

---

## 1. Short answer

- Transfer does not happen by itself. Far transfer from practice in one setting to a different one is rare.
  Near transfer, in a setting close to the practised one, is common.
- What moves real behaviour: practice in the real setting, an if-then plan made at lesson time,
  a quick record of whether it happened, and a short reflection that covers what went well and what did not.
- In-app quizzes alone mostly raise knowledge, not behaviour. Behaviour-modelling training has large effects
  on learning and smaller effects on job behaviour.
- Recommended add-on: **Field try**. After a life-skill lesson, offer one tiny, countable real-world try for today
  ("Ask 3 follow-up questions in one conversation"). The next day, ask one question: Did it / Partly / Didn't come up /
  Not this time. Then take an optional one-line note.
- Build it on what already exists: `concept.quest` in the topic schema (validated but never shown), and the
  `PlanRow` + `duePlan()` + "Did your plan fire yesterday?" pattern from Mind lessons.
- It is **not** a Task, earns **0 XP** in v1, never touches the streak, the Hat-trick or the Season,
  and unanswered tries expire silently after 3 days.
- Kill it after 4 weeks if fewer than 15% of offers are taken, or if lesson finishing drops.

---

## 2. What the evidence says

Evidence = peer-reviewed papers and meta-analyses I opened (abstracts via PubMed, Crossref or the
publisher/repository page). Quotes are verbatim from what I read. Section 9 lists what I could not open.

### 2.1 Transfer of training

| Finding | Source (quote) | What it means for NANDI |
|---|---|---|
| Transfer is a known, old problem. | Baldwin & Ford 1988: "there is a growing concern over the 'transfer problem.'" Transfer includes "generalization of learned material to the job and the maintenance of trained skills over a period of time on the job." | A finished lesson is not the goal. The behaviour, done later and kept, is. |
| Use fades fast after training. | Saks & Belcourt 2006, 150 organisations: "62%, 44%, and 34% of employees apply training material on the job immediately, six months, and one year after training." | Plan for the first day and for repeats weeks later, not one try. |
| What happens around the training matters more than the training session. | Saks & Belcourt 2006: "activities in the work environment before and after training were more strongly related to transfer than activities during training." | The after-lesson step is where the value is. NANDI currently stops at the takeaway card. |
| Motivation and support predict transfer, more so for "open" skills. | Blume, Ford, Baldwin & Huang 2010, 89 studies: "most predictor variables examined (e.g., motivation, work environment) had stronger relationships to transfer when the focus of training was on open (e.g., leadership development) as opposed to closed (e.g., computer software) skills." | Conversation, persuasion and focus are open skills. Context and motivation matter more for them. |
| Self-rated transfer is inflated. | Blume et al. 2010: outcomes "obtained by the same source in the same measurement context— which consistently inflated transfer relationships." | Ticks are not proof. The kill test needs a measure beyond the tick (section 7). |
| Far transfer is rare; near transfer works. | Sala & Gobet 2017: "far transfer of learning rarely occurs." Gobet & Sala 2023: "research efforts should be redirected to near transfer." Sala & Gobet 2020: near-transfer effects were "proportional to the similarity between the training task and the outcome measure." | A quiz about follow-up questions will not make someone ask them. The practice has to look like the real thing. |
| It depends on how far the new setting is. | Barnett & Ceci 2002: "evidence for transfer under some conditions is substantial, but critical conditions for many key questions are untested." | Name the setting: hostel, class, internship, family function, WhatsApp group. |
| Two routes to transfer. | Salomon & Perkins 1989: "Low-road transfer depends on extensive, varied practice"; "High-road transfer occurs by intentional mindful abstraction of something from one context ... and application in a new context." | Low road: repeat the try in varied places. High road: the reflection line ("what would I change next time?"). |
| Generalisation has to be planned, not hoped for. | Stokes & Baer 1977 list "Train and Hope" as the default, against active methods such as "Train Sufficient Exemplars", "Program Common Stimuli" and "Introduce to Natural Maintaining Contingencies." | Re-offer the same skill in a new setting (more exemplars). Pick tries where real life rewards the act (people reply warmly). |

### 2.2 Behavioural skills training (instruct, model, rehearse, feedback)

| Finding | Source (quote) | What it means for NANDI |
|---|---|---|
| Modelling-based training helps knowledge most, behaviour less. | Taylor, Russ-Eft & Chan 2005, 117 studies: "BMT effects were largest for learning outcomes, smaller for job behavior, and smaller still for results outcomes." | NANDI's teach card + Show me + guided try is the instruct-model-rehearse half. It will move knowledge more than behaviour. |
| Skills can hold or grow after training. | Taylor et al. 2005: "Although BMT effects on declarative knowledge decayed over time, training effects on skills and job behavior remained stable or even increased." | Real practice is worth more over time than more quiz items. |
| What boosts transfer in BMT. | Taylor et al. 2005: "Transfer was greatest when mixed (negative and positive) models were presented, when practice included trainee-generated scenarios, when trainees were instructed to set goals, when trainees' superiors were also trained, and when rewards and sanctions were instituted in trainees' work environments." | Show me should include a bad example and a good one. Let the learner pick their own setting. Ask for a small goal. NANDI cannot train "superiors", and must not add sanctions. |
| Rules beat scripts. | Taylor et al. 2005: "Skill development was greatest when learning points were used and presented as rule codes." | Keep the 30-word teach card as a rule, not a script to recite. |
| Mastery in training did not reach the real setting until practice moved there. | Hassan et al. 2018 (caregivers, BST): "Although caregivers met mastery criterion within BST sessions, their skills did not generalize to the natural environment until IST [in situ training] was introduced." | The closest match to NANDI's risk: perfect in-app answers, no change outside. The real-world try is the "in situ" step. |
| A computerised version of BST can work, paired with real-setting practice. | Vanselow & Hanley 2014: "CBST may be an acceptable substitute for BST when combined with IST to improve efficiency and maintain efficacy." | An app can do the instruct/model/rehearse part, if a real-world step is added. |
| In-situ practice drives generalisation in coaching too. | LaBrot et al. 2024 meta-analysis (17 studies): "Specific implementation supports (i.e., in situ training and behavioral skills training) significantly contributed to teachers' generalization." | Same message, different field. |

Note: much of the BST in-situ literature is child-safety research on a topic NANDI excludes by hard rule. I did
not use those studies. The caregiver, teacher and computerised-BST studies above make the same point.

### 2.3 Implementation intentions

| Finding | Source (quote) | What it means for NANDI |
|---|---|---|
| If-then plans help people start. | Gollwitzer & Sheeran 2006, 94 tests: "a positive effect of medium-to-large magnitude (d = .65) on goal attainment." They were "effective in promoting the initiation of goal striving." | Ask "When will you try it?" at lesson time, with cue chips. |
| Newer, larger estimate is smaller but holds. | Sheeran, Listrom & Gollwitzer 2024, 642 tests: effective for "cognitive, affective, and behavioural outcomes" (".27 ≤ d ≤ .66"). Effects were larger with an if-then format, high motivation, and rehearsal of the plan. | Use the literal "If ___, then I will ___" format. Show the plan again on the Plan screen (a light rehearsal). |
| Pairing with mental contrasting gives a small-to-medium effect. | Wang, Wang & Gai 2021, 21 studies: "small to medium effect size (g = 0.336)"; "because of some publication bias, the actual effect sizes may be smaller." | Optional: one chip "What might get in the way?" Do not oversell. |

NANDI already has this for Mind lessons: `src/ui/mind/LessonPlayer.tsx` ("Make one if-then plan") and the
"Did your plan fire yesterday?" card in `src/ui/screens/Mind.tsx`, driven by `duePlan()` in
`src/core/learn/learn.ts`. The newer teach-first topic lessons (spec 14) do not have it.

### 2.4 Spaced practice

| Finding | Source (quote) | What it means for NANDI |
|---|---|---|
| Spacing helps retention; the best gap grows with how long you need to remember. | Cepeda et al. 2006, 839 assessments in 317 experiments: "the ISI producing maximal retention increased as retention interval increased." | Re-offer a field try at growing gaps. NANDI already checks concepts at +7 and +30 days (spec 09 §5); line field re-offers up with those. |
| Habits form slowly and one miss is fine. | Lally et al. 2009: time to 95% automaticity "ranged from 18 to 254 days"; "Missing one opportunity to perform the behaviour did not materially affect the habit formation process." | No streak on field tries. Copy can say a missed day does not matter, and it is true. |

### 2.5 "Do it today" missions (between-session practice)

There is no research literature on app "micro-missions" as such. The closest evidence is therapy homework:
a skill practised between sessions, then reviewed.

| Finding | Source (quote) | What it means for NANDI |
|---|---|---|
| Doing the between-session practice links to better outcomes. | Mausbach et al. 2010, 23 studies, 2,183 people: "a significant relationship between homework compliance and treatment outcome suggesting a small to medium effect." | A real-world step is worth adding, with realistic hopes. |
| Quality of the practice matters, not just doing it. | Kazantzis et al. 2016, 17 studies: quantity "g = 0.79" and quality "g = 0.78" at post-treatment; quality rests on only "k = 3" studies. | Ask "Partly" as a valid answer and ask what happened, not only yes/no. |
| How compliance is measured changes the result. | Mausbach et al. 2010: "retroactive assessments had higher effect size than contemporaneous assessments" (r = .26 overall). | Ask the next day, not a week later. Keep the tick honest by not paying for it (section 4). |
| Recording progress helps. | Harkin et al. 2016, 138 studies, N = 19,951: monitoring "promoted goal attainment (d+ = 0.40)"; effects were larger "when the outcomes were reported or made public, and when the information was physically recorded." | A recorded next-day check is the active part. "Public" is not an option: nothing leaves the phone. Recording is. |

Caveat: these are correlational (homework) or about goals in general (monitoring). They support the shape of the
add-on. They do not prove a 2-minute lesson plus one try changes conversation skill. Only the kill test can show that.

### 2.6 Reflection prompts

| Finding | Source (quote) | What it means for NANDI |
|---|---|---|
| Reflecting on experience can beat more practice, early on. | Di Stefano, Gino, Pisano & Staats (working paper, SSRN 2414478; 10 studies, N = 4,340): reflection "is mostly beneficial at the beginning of the learning curve, as long as one has accumulated a sufficient amount of experience on which to reflect"; it can "generate spillover effects to different but related tasks." | Reflect after a real try, not before any. Beginners gain most, which fits 18-25s new to these skills. |
| The field study used a short written reflection. | Lafayette College summary of the same study: trainees spent "the last 15 minutes of their workday" on reflection, writing at least two key lessons and being as specific as possible (summary wording, not a quote). | One specific line is enough on a phone. Do not ask for 15 minutes. |
| Review successes as well as failures. | Ellis & Davidi 2005: soldiers "improved significantly when they were debriefed on their failures and successes after each training day, compared with others who reviewed their failed events only." | After "Did it", ask "What worked?" After "Partly", ask "What would you change?" Never only the failure. |

Status note: Di Stefano et al. is a working paper. I could not open the SSRN or HBS pages (403) and did not use
the "23% better" figure that secondary sources repeat.

### 2.7 Rewards, streaks and guilt

| Finding | Source (quote) | What it means for NANDI |
|---|---|---|
| Expected, completion-based rewards can undermine interest; informational feedback helps. | Deci, Koestner & Ryan 1999, 128 studies: completion-contingent rewards "significantly undermined free-choice intrinsic motivation (d = ... -0.36)"; "Positive feedback enhanced both free-choice behavior (d = 0.33) and self-reported interest (d = 0.31)." Also: "Tangible rewards tended to be more detrimental for children than college students." | Pay field tries with feedback, not XP, in v1. The undermining is smaller for adults, so this is a product choice, not a ban (section 4.3). |
| Broken streaks lower later engagement, more so when people blame themselves. | Silverman & Barasch 2022 (J. Consumer Research), 7 studies: intact logged streaks "increase consumers' subsequent engagement ... relative to when broken streaks are highlighted"; the effect "is amplified when consumers attribute a break in the streak to themselves." | A field-try streak would be a self-blame streak (the person chose to skip). Do not log one. |

---

## 3. What the code already has (origin/main `a6c21b7`)

| Piece | Where | State |
|---|---|---|
| Per-concept real-world quest in content | `topicConceptSchema.quest` in `src/data/packs/schemas.ts` (`title`, `detail`, `sourceRefs`); checked by `validate.ts` (source refs, `advicePattern`) | Validated, **never shown**. A grep of `src/` finds no UI that reads `concept.quest`. |
| Current quest texts | `content/topics/topic.psychology.json`, e.g. "Frame a token: Write a made-up choice as a gain and then as a loss..." | Mostly in-head exercises on made-up cases, not real-world tries. Need rewriting for life-skill tracks. |
| Spec promise | `docs/specs/09-teaching-engine.md` §2: "Each module ends with a side quest that uses the idea outside the app (pairs with Side quests)." | Not built for topic lessons. |
| If-then plan + next-day check | `PlanRow` in `src/data/types.ts` (`lessonId`, `madeDayKey`, `ifText`, `thenText`, `fired: 'yes' \| 'partly' \| 'no' \| 'na'`); `duePlan(made, today, fired)` in `src/core/learn/learn.ts` (due only from the day after, for 3 days, then gone); `answerPlan()` in `src/data/repos/learn.ts`; card in `src/ui/screens/Mind.tsx` | Works for Mind (Gita/Charaka) lessons only. A good base. |
| Teach-first lesson fact | `saveLessonDone()` in `src/data/repos/learn-engine.ts` writes `learn-lesson:<stepId>` | The natural trigger for the offer. |
| Weekly side quests | `src/core/quests/index.ts`, `src/data/repos/quests.ts`, `content/quests/quests.core.json`; fact id `quest:<questId>:<isoWeek>`, 20 XP (`rules.quests.sideQuestXp`) | Week-long, not tied to a lesson. Already has social ones ("Start a conversation with someone new"). |
| Soft-day pattern | `src/core/soft/soft.ts`: fixed choices, never random, lanterns "never go away" | The tone to copy. |
| Wisdom stat | `src/core/hexagon.ts`: 50% days with a lesson, 50% share of plans answered yes/partly vs no | Would pick up field tries automatically if they share the `plans` table. See 4.2. |

---

## 4. Recommended add-on: Field try

### 4.1 The flow

| Moment | What the person sees | Notes |
|---|---|---|
| Lesson Done screen (teach-first step, after the takeaway) | "Try it today: ask 3 follow-up questions in one conversation." Buttons: **Add for today** · **Not today** | Shown only if the concept has a field try. "Not today" writes nothing. No second ask that day. |
| Pick a cue (one tap) | "When?" chips: At lunch · On a call home · In a group chat · My own | This is the if-then plan. Chips are written by editors per concept. "My own" takes 60 characters. |
| Rest of today | One quiet line on Plan, under the Now task: "Field try: 3 follow-up questions · if at lunch" | Not a Task. No timer, no reminder in v1. |
| Next day (from the 4:00 am day boundary, before bedtime) | "Yesterday's field try: 3 follow-up questions." **Did it** · **Partly** · **Didn't come up** · **Not this time** | Same four answers as `PlanRow.fired` (yes, partly, na, no). |
| One-line reflection (optional) | Did it → "What worked?" Partly → "What would you change?" Chips plus own words, 140 characters. Skip is always there. | Successes and failures both reviewed (Ellis & Davidi 2005). |
| Feedback | One fixed, sourced line tied to the lesson, e.g. "In studies, people who asked more follow-ups were liked more. What did you notice?" | Informational, not a reward. Same line every time for that concept. |
| Later | Did it / Partly: offer the same skill again at +7 and +30 days, in a different setting ("This time: a senior or a relative"). Didn't come up: offer once more in 2 days. Not this time: next offer is the smaller version ("Ask 1 follow-up"), then stop. | Spaced, varied practice (Cepeda 2006; Stokes & Baer "sufficient exemplars"). |
| Field notes | Each concept card lists its kept notes, newest first. | On the phone only. No score on the text. |

Limits (all in `src/core/rules.config.ts`, new block `field`):
`offersPerDay: 1`, `openMax: 1`, `checkWindowDays: 3`, `reofferDays: [7, 30]`, `retryDays: 2`,
`noteMaxChars: 140`, `cueMaxChars: 60`, `xp: 0`.

Not offered: after bedtime (Night mode: offer "tomorrow" instead, and no check-in card after bedtime);
on a soft day (`softToday()` set; Plan shows `SoftHome` only); for concepts without an editor-written try.

### 4.2 Fit with Plan, Tasks and the ledger

**Why not a Task.** A field try as a `TaskRow` would break several rules at once:

| Task rule (code) | What would go wrong |
|---|---|
| `checkDayBoundary()` in `src/core/tasks/task-machine.ts` turns a past `planned` task into `unplaced` today | An optional try would follow the person into the next day as a leftover. |
| `postponeGate()` in `src/core/tasks/postponeGate.ts` counts moves against `rules.tasks.postpone.weeklyBudget` (5) and asks for a first step | Skipping a practice try would spend a real postpone decision. |
| `check14DayRule()` moves untouched tasks to someday | Clutter in Someday. |
| `calculateTasksDayXp()` in `src/core/economy/awards.ts` pays S = 10 XP, or a 5 XP quick win | A self-reported tick would earn task XP. |
| `isPlannedDone()` in `src/core/economy/planned.ts` feeds the Hat-trick's planned-task slot | A self-report could complete the Drive slot of a Hat-trick. |
| `steadyLine()` and `needsFreshStart()` in `src/core/tasks/complete.ts` read planned days | "Planned N of the last 7 days" and Fresh Start would count tries. |

**What to build instead.**

1. **Content.** Reuse `concept.quest` and add optional fields in `topicConceptSchema`:
   `cues` (2–3 strings), `smaller` (the easier version), `notice` (the one sourced feedback line),
   `settings` (2–3 strings for re-offers). Validation adds: `detail` ≤ 90 characters and countable
   ("3 follow-up questions", not "be curious"); keep `advicePattern`; no health, money-action or
   "you should" lines; source refs required as now. Editors rewrite the "made-up" quests that are not real-world.
2. **State row.** Reuse the `plans` table (`PlanRow`, ULID `id`, natural fields `updatedAt`, `deleted`,
   `deviceId`). Add optional fields: `kind?: 'if-then' | 'field'`, `conceptId`, `stepId`, `size?: 'full' | 'small'`,
   `note?`. `ifText` holds the cue, `thenText` the try, `fired` the answer. The Dexie index
   (`'id, lessonId, madeDayKey'`) does not change. Backup already exports every table, but CLAUDE.md still
   requires a backup round-trip test before this ships.
3. **Ledger fact on answer.** One fact, written once: id `field:<planId>` (`kind:refId`), `mode: 'learn'`,
   `kind: 'field'`, `dayKey` = answer day, `inputs: { conceptId, stepId, result, madeDayKey, size, afterBedtime,
   hasNote }`. The note text stays in the `PlanRow`, not in the ledger. Write it inside a transaction with
   `if (!await db.ledger.get(id))`, like `saveLessonDone()`. Never edit or delete it.
4. **Economy.** Nothing changes. `replayFactXp()` returns 0 for this kind. `replayEconomy()` sums only known
   modes and kinds. Check one thing when implementing: the soft-day sum matches on `kind === 'soft'` alone, so
   the new kind must not be named `soft` (`field` is safe). If XP is ever added, it goes in
   `rules.field.xp` with a new `RULES_HISTORY` entry and `effectiveFrom`, so it applies forward only.
5. **Filters.** `src/ui/screens/Mind.tsx` must skip `kind: 'field'` rows in its "Did your plan fire yesterday?"
   card (the Plan screen owns that check). `src/core/hexagon.ts` must leave field rows out of the Wisdom
   ratio in v1, or a "Not this time" would lower a stat. That would be a small loss state.
6. **Plan screen.** `src/ui/screens/Plan.tsx` shows the one-line try and the next-day card. It does not
   change `chooseNowTask()`. On a soft day it shows nothing.
7. **Owner panel.** Add counts to `ownerMetrics()` in `src/core/owner/metrics.ts`: offers, accepted,
   answered, each answer, notes kept. Local only, like the rest of the panel.

### 4.3 Why 0 XP (a trade-off for Jenil)

| | 0 XP (recommended for v1) | Flat 10 XP |
|---|---|---|
| Honesty | Nothing to gain by tapping "Did it". Ticks stay usable as data. | An incentive to over-report a self-check (Blume 2010 already shows self-report inflates). |
| Motivation | Feedback, not payment (Deci et al. 1999: positive feedback d = 0.33). | Completion-contingent reward, d = -0.36 on free choice, smaller for adults. |
| Feel | Might feel less important than XP-paying parts. | Fits "real-world actions carry most of the XP" (`docs/specs/05-economy.md` §1). |
| Rules | Fine. | Fine if fixed, announced, capped once per day and forward-only. Never random. |

Recommendation: ship at 0 XP. If uptake in the kill test is low and the cause looks like "not worth it", try
a flat, announced 10 XP from a new `effectiveFrom`. Jenil decides; it is a product trade-off.

---

## 5. Making it worth doing without guilt, streaks or random rewards

| Lever | How Field try uses it | Guardrail |
|---|---|---|
| It is the point of the lesson | The offer sits on the Done screen as "the part that changes something". | One offer, then it leaves. |
| Tiny and countable | "3 follow-up questions", "1 kind disagreement". | Editors keep a smaller version for every try. |
| Your own setting | Cue chips plus "My own" (if-then plan; trainee-generated scenarios, Taylor 2005). | Settings are plain: class, hostel, internship, family function, WhatsApp group. |
| Something to notice | The fixed `notice` line turns the try into a small experiment. | Sourced claim only; no promises ("you will be liked"). |
| A record that stays | Field notes on the concept card. Like soft-day lanterns, they never go away. | No ratio, no "missed" count anywhere. |
| No streak | Field tries are not in `streak`, `hatTrick`, `mark`, Season SP or quests. | Silverman & Barasch 2022: self-caused breaks hurt most. |
| No punishment | "Didn't come up" and "Not this time" are normal answers. Unanswered tries expire after 3 days (`duePlan` window) with no message. | No "you missed" copy. No notification in v1. |
| No randomness | Same try for the same concept, every time. Re-offer dates are fixed by rule. | No surprise drops, no variable rewards. |
| Night | Not offered or checked after bedtime. | Matches Night mode and the "less time in app" goal. |

Copy rules: short, coach-like, never "you should", never shame. Examples:
- Offer: "Try it today: ask 3 follow-up questions in one conversation."
- Check: "Yesterday's field try: 3 follow-up questions. How did it go?"
- Not this time: "Fair. Next time there's a smaller version: 1 follow-up."
- Didn't come up: "That happens. It'll come back in 2 days."

Risks to watch:
- **Social tries can feel awkward.** Start with low-stakes settings (friends, family) before seniors or strangers.
- **Persuasion or "read people" tries can slide into manipulation.** Editors keep tries to asking, listening and
  noticing. No tries that test, trick or pressure someone (Job 2 covers the ethics).
- **Health and money.** No tries that change sleep, food, medicine or money in ways that need advice. Observe or
  calculate only (for example "Check the interest rate on one account you already have").
- **Privacy.** Notes may name people. They stay on the phone and in backups only. The DPDP notice
  (before 13 May 2027, see `DECISIONS.md`) should say so.

---

## 6. Options compared

| Option | Effort | Transfer support | Risk | Verdict |
|---|---|---|---|---|
| A. Show `concept.quest` text on the Done screen, no tracking | Very low | Weak: no plan, no check, no repeat ("Train and Hope") | None | Fine as a 1-week content test, not the product. |
| **B. Field try on `PlanRow` + one ledger fact (above)** | Low–medium: reuses `duePlan`, `answerPlan`, the plans table | If-then plan, next-day record, reflection, spaced varied repeats | Must filter Mind card and Wisdom stat | **Recommended.** |
| C. Field try as a `TaskRow` | Medium | Same as B | Breaks postpone budget, XP, Hat-trick, Fresh Start (4.2) | No. |
| D. Add life-skill tries to weekly side quests | Low (content only) | Week-long, not tied to the lesson or a cue | Paid 20 XP self-report | Keep side quests as they are; do not use for this. |

---

## 7. Kill test

Run for 4 weeks after release, or until 30 offers, whichever is later. All numbers come from the owner panel
(local). Decide in advance; do not move the bars afterwards.

| Measure | Keep if | Kill or rework if |
|---|---|---|
| Uptake: accepted ÷ offered | ≥ 30% | < 15% |
| Answered at all: answered ÷ accepted | ≥ 60% | < 40% |
| Follow-through: (Did it + Partly) ÷ accepted | ≥ 40% | < 25% |
| "Not this time" ÷ answered | < 30% | > 50% (tries too big or unwanted) |
| Lesson finishing: lessons finished ÷ started, vs the 4 weeks before | No drop over 5 points | Drop of 10 points or more |
| Next-day return after a lesson day, vs before | No drop | Drop of 10 points or more |
| Opens after bedtime | No rise | Any rise linked to field cards |
| Jenil's 2-week check: "Does this feel like homework or guilt?" | No | Yes, twice |

Transfer check, read with care: ticks are self-report and inflate (Blume 2010). As a second signal, compare
the +7-day retention check on scenario items (spec 09 §5) for concepts with a done field try vs concepts without.
This is within one person, small and confounded by choice. Treat it as a direction, not proof. A better test
needs more users and a random split of which concepts carry a try; that waits for Phase 4 and consent.

If killed: remove the offer, keep the stored `PlanRow`s and `field:` facts (never delete ledger rows), and keep
any notes visible on concept cards.

---

## 8. Build order (if Jenil says yes)

1. Write acceptance tests first in `src/core/learn/` (Vitest): offer rules (1 a day, 1 open, not after bedtime,
   not on a soft day), due window, re-offer dates, smaller-version path, and that `deriveEconomy()` totals,
   streak and Hat-trick are unchanged with `field` facts present.
2. Add the `field` block to `rules.config.ts` with bounds in the bounds table.
3. Schema fields + validator rules in `src/data/packs/`; rewrite quests in one pilot concept (conversation).
4. `PlanRow` fields, repo functions next to `answerPlan()`, backup round-trip test.
5. Done-screen offer, Plan line, next-day card, Field notes; filter the Mind card and Wisdom.
6. Playwright at 390×844 and 360×800, light and dark, once offline. Owner-panel counts.
7. Log the decision in `DECISIONS.md`.

---

## 9. Sources

Opened and quoted:
- Baldwin & Ford 1988, Personnel Psychology, abstract via Crossref: https://doi.org/10.1111/j.1744-6570.1988.tb00632.x
- Saks & Belcourt 2006, Human Resource Management, abstract via Crossref: https://doi.org/10.1002/hrm.20135
- Blume, Ford, Baldwin & Huang 2010, Journal of Management, abstract via Crossref: https://doi.org/10.1177/0149206309352880
- Sala & Gobet 2017, Current Directions in Psychological Science: https://pubmed.ncbi.nlm.nih.gov/29276344/
- Sala & Gobet 2020, Psychonomic Bulletin & Review: https://pubmed.ncbi.nlm.nih.gov/31939109/
- Gobet & Sala 2023, Perspectives on Psychological Science: https://pubmed.ncbi.nlm.nih.gov/35939827/
- Barnett & Ceci 2002, Psychological Bulletin: https://pubmed.ncbi.nlm.nih.gov/12081085/
- Salomon & Perkins 1989, Educational Psychologist, abstract on University of Haifa page: https://cris.haifa.ac.il/en/publications/rocky-roads-to-transfer-rethinking-mechanisms-of-a-neglected-phen/
- Stokes & Baer 1977, Journal of Applied Behavior Analysis: https://pubmed.ncbi.nlm.nih.gov/16795561/
- Taylor, Russ-Eft & Chan 2005, Journal of Applied Psychology: https://pubmed.ncbi.nlm.nih.gov/16060787/
- Hassan et al. 2018, Journal of Autism and Developmental Disorders: https://pubmed.ncbi.nlm.nih.gov/29307038/
- Vanselow & Hanley 2014, Journal of Applied Behavior Analysis: https://pubmed.ncbi.nlm.nih.gov/24535891/
- LaBrot et al. 2024, Journal of School Psychology: https://pubmed.ncbi.nlm.nih.gov/39645339/
- Gollwitzer & Sheeran 2006, Advances in Experimental Social Psychology, abstract via KOPS and Semantic Scholar: https://kops.uni-konstanz.de/handle/123456789/10973
- Sheeran, Listrom & Gollwitzer 2024, European Review of Social Psychology, abstract via KOPS: https://kops.uni-konstanz.de/handle/123456789/69905 (doi 10.1080/10463283.2024.2334563)
- Wang, Wang & Gai 2021, Frontiers in Psychology: https://pubmed.ncbi.nlm.nih.gov/34054628/
- Cepeda et al. 2006, Psychological Bulletin: https://pubmed.ncbi.nlm.nih.gov/16719566/
- Lally et al. 2009, European Journal of Social Psychology, abstract via Crossref: https://doi.org/10.1002/ejsp.674
- Mausbach et al. 2010, Cognitive Therapy and Research: https://pmc.ncbi.nlm.nih.gov/articles/PMC2939342/
- Kazantzis et al. 2016, Behavior Therapy: https://pubmed.ncbi.nlm.nih.gov/27816086/
- Harkin et al. 2016, Psychological Bulletin: https://pubmed.ncbi.nlm.nih.gov/26479070/
- Di Stefano, Gino, Pisano & Staats, working paper, abstract via Crossref: https://doi.org/10.2139/ssrn.2414478
- Lafayette College faculty page summarising the Di Stefano field study: https://sites.lafayette.edu/rothm/?p=162
- Ellis & Davidi 2005, Journal of Applied Psychology: https://pubmed.ncbi.nlm.nih.gov/16162059/
- Deci, Koestner & Ryan 1999, Psychological Bulletin: https://pubmed.ncbi.nlm.nih.gov/10589297/
- Silverman & Barasch 2022, Journal of Consumer Research, abstract via Crossref: https://doi.org/10.1093/jcr/ucac029
- Huang, Yeomans, Brooks, Minson & Gino 2017, Journal of Personality and Social Psychology (example try and feedback line): https://pubmed.ncbi.nlm.nih.gov/28447835/

Could not open:
- SSRN page for Di Stefano et al. (403), HBS faculty page and working-paper PDF (403), HBS Working Knowledge
  article (403), HEC Paris page (403). The "23% better" figure in secondary summaries is not used.
- QIC-WD umbrella summary of behaviour-modelling training (503). Used the PubMed abstract instead.
- ASCD "Teaching for Transfer" (Perkins & Salomon 1988): only the title loaded. The 1992 encyclopedia entry
  (hugging and bridging) was not found. "Hugging/bridging" is therefore not quoted.
- Anseel, Lievens & Schollaert 2009 (reflection after feedback): no abstract available. Not used.
- Kapler, Weston & Wiseheart 2015 (spacing for higher-level learning): abstract withheld by the publisher. Not used.
- OpenAlex API returned 429 (rate limit); Crossref and PubMed were used instead.

Inspiration only, not evidence: the YouTube titles in the batch brief.
