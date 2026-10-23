# cj5 · Invent: mechanics only NANDI has

Job 5 of cloud batch 5 (idea engine, 24 Oct 2026). Branch `ideas/cj5-invent`, based on `origin/main` at `55fd409`.
Review only. No app code or content JSON changed. Nothing here is built. Build only after Jenil says yes.

Ask: 15 original mechanic concepts that use what makes NANDI different. At least 5 need v2 (friends, real
people or many learners), each with a v1 offline form. Score each on novelty, fit, kindness, fun and evidence.
Pick the top 3.

---

## 0. Summary

- **15 concepts**, 6 of them need v2 to reach their full form (C6, C7, C8, C10, C11, C12). Two more (C9, C13)
  work fully in v1 and grow in v2. Every one has a v1 that runs with no network.
- **Top 3** (§5):
  1. **Week case.** On Sunday, Kapi builds a small logic case from your own week. You deduce which day each
     friend was busy. It is original: I searched and found no app that builds a logic puzzle from your own data.
  2. **Chaupal.** After today's board, compare how you started with how the solver started (v1), and later with
     how everyone who played board #N started (v2). Closest: the NYT's WordleBot.
  3. **Aangan katha.** A weekly courtyard story where your real Field tries and Try-it days become the plot.
     Closest: Zombies, Run! and a small 2020 app, The Paradime.
- **Rejected or rewritten on the way** (§6): group streaks, Shard gifts, "everyone's tree dies", ritu-only
  exclusives, rest-timer flashcards, a real-world clue inside a case.
- **Repo notes** (§7): spec 21 (Field try) is not on any branch, only in the batch 4 review. There are two
  `seasonFor()` functions that number seasons differently. No confirmed bug.

---

## 1. What NANDI has that other apps do not (read on `origin/main` 55fd409)

| Asset | Where | What a mechanic can use |
|---|---|---|
| One ledger across all modes | `LedgerRow` in `src/data/types.ts` (`dayKey`, `mode`, `kind`, `refId`, `inputs`); idempotent ids `kind:refId`; never mutated | Any mechanic can be **derived** from facts. Nothing new is stored, so backups need no change. |
| Six areas, six friends | `AREAS` and `areaOf()` in `src/core/courtyard/courtyard.ts`: Nandi Train, Mor Plan, Chiku Learn, Moti Remember, Kapi Mind, Kachhua Sleep | A practice day per area. `STAGE_DAYS` = `[3, 7, 14, 30, 60]`. Counts days, never XP, so it cannot be farmed. |
| A courtyard with Indian roots | `TREE_OBJECTS` (neem sapling to lights in the neem), corner objects (mudgar clubs, marigold pot, woven cot) | Scenes, objects and places that Western apps do not have. |
| A weekly storybook | `buildStorybook()` in `src/core/courtyard/storybook.ts`: cover, one page per area, a soft page, a close page; lines picked by week, never random | A ready "week story" frame. |
| Deterministic puzzles and cases | `dailyBoard()`, `boardNumber()` (`RULES.mind.boardNumberEpoch` `'2026-10-23'`) in `src/core/puzzles/daily.ts`; `CaseGen.generate`, `countSolutions`, `propagate` in `src/core/mysteries/cases.d.ts` | The same board for everyone; a solver can check uniqueness and logic. |
| Named techniques per move | `usedTechnique()` in `src/core/puzzles/deduction.ts`; `techniquesSeen` on `PuzzleRunRow`; `techniqueCards` in `src/core/puzzles/techniques.ts` | NANDI knows *how* a player started a board, not only how fast. |
| Seasons | `seasonFor()` in `src/core/economy/deriveEconomy.ts` (season starts on the first Monday of a month; Season 1 from 2 Nov 2026); mystery arcs `RULES.mind.arcCount` 4, `arcChapters` 5 | A month-long frame with a story arc. |
| Real-world practice | Field try (`docs/reviews/cj4-transfer.md` on `ideas/cj4-transfer`): one countable try, next-day check, 0 XP, `PlanRow` + ledger fact `field:<planId>`. Try-it (`docs/reviews/cj4-try-it.md` on `ideas/cj4-try-it`): 7-day hobby tracks, facts `tryit:<trackId>:<stepId>`, 0 XP | Records of things done **off** the phone. No other learning app has these. |
| Offline and private | CLAUDE.md non-negotiables; `docs/reviews/online-ready-2026-10-24.md` on `ideas/online-ready` | Privacy can be a feature, not only a limit. |
| Soft days | `src/core/soft/soft.ts`: fixed choices, lanterns that "never go away"; `soft.dayXp` 10 | The tone every mechanic below copies. |

Numbers used below, from `src/core/rules.config.ts`: `mind.sideBoardXp` 10, `mind.sideBoardsMaxPerDay` 1,
`mind.dailyCap` 80, `mind.cardXp` 1, `quests.sideQuestXp` 20, `season.seats` 500, `season.spDailyCap` 300,
`streak.restBankMonthly` 4. Mind earns 0 XP after bedtime (CLAUDE.md).

---

## 2. The 15 concepts at a glance

"v2 needed" = the concept's main value needs real people, a server or many learners.

| # | Concept | Modes it ties together | v2 needed? | Build |
|---|---|---|---|---|
| C1 | Week kolam | All six areas, courtyard | No | S–M |
| C2 | **Week case** | Mind + all areas + storybook | No (v2 adds a pair case) | M |
| C3 | Ritu wheel | Courtyard, seasons, one host area | No (v2 adds a shared count) | S–M |
| C4 | Sunday haat | All areas, week to week | No | M |
| C5 | **Aangan katha** | Learn (Field try), Try-it, all areas, seasons | No (v2 adds crossovers) | L |
| C6 | Sikhao: teach it on | Learn, Remember, shares | **Yes** | v1 S, v2 M |
| C7 | Saathi try | Learn (Field try), Try-it, Train | **Yes** | M |
| C8 | Field almanac | Learn, Try-it, Plan | **Yes** | v1 S, v2 M |
| C9 | Aangan visits | Courtyard, Night | Grows in v2 | M |
| C10 | Lantern relay | Night, Plan, courtyard | **Yes** | v1 S, v2 M |
| C11 | Circle of six | All areas, seasons | **Yes** | L |
| C12 | **Chaupal** | Mind, techniques, shares | **Yes** (v1 useful alone) | M |
| C13 | Antakshari chain | Learn, Remember, Mind, Train, Plan, Sleep | Grows in v2 | M |
| C14 | Sangam scenes | All areas, courtyard | No | M |
| C15 | Bahi: the book that only grows | All areas, seasons | No | S–M |

---

## 3. The concepts

Each concept has: pitch, modes, why it is hard to copy, the closest app I found by searching, dark-pattern risk
(and the rewrite that makes it pass), v1, v2, build size, a 2-week test with Jenil and 5 friends, and scores.

Storage rule for every v1: new facts go in the existing `ledger` table with an idempotent id and an
`inputs.source: 'local'` field, as the online-ready review proposes (its build-now step 4). v2 writes the same
shape with `source: 'remote'`. Derived things store nothing. So v2 needs no Dexie migration.

The 5 friends do not have v2 servers. Every v2 test below is a **Wizard-of-Oz** test: Jenil plays the server by
hand over WhatsApp. Any export a friend sends Jenil is personal data: ask each friend first, in writing.

### C1 · Week kolam

**Pitch.** Every Monday the courtyard floor gets a fresh dot grid: 7 columns (days) by 6 rows (areas). Each
practice day draws a loop around its dot in that friend's colour. Loops join where neighbouring dots both have
loops, so the week makes a pattern that is only yours, drawn by fixed rules from the ledger. Empty dots stay as
clean dots: in kolam a dot grid is the start of a drawing, not a gap. A soft day adds a small lantern in the
centre. On Sunday night the kolam is set and goes on a shelf of the last 8 weeks, like the storybooks.

- **Kolam** is "drawn around a grid pattern of dots"; in Tamil Nadu, Telangana and Andhra Pradesh women draw
  kolams "every day at the break of dawn" (Wikipedia, https://en.wikipedia.org/wiki/Kolam).
- **Modes:** all six areas, the courtyard, soft days.
- **Hard to copy:** it needs one ledger across six life areas, plus the cultural form. A single-habit tracker has
  one row, not a pattern.
- **Closest app (searched):** Pixelist: "Over time, the micro-details of daily checkins ("pixels") will form
  interesting large-scale images" (https://apps.apple.com/us/app/pixelist-habit-tracker/id1317636216). Research:
  UbiFit Garden, "a stylized, aesthetic representation of physical activities and goal attainment (e.g., a
  garden)" (https://www.consolvo.org/ubifit).
- **Dark-pattern risk:** perfection-seeking ("a full kolam"). **Rewrite:** there is no "full" state and no score.
  The drawing rules mirror sparse weeks so that 3 loops look planned, not missing. No "complete the pattern"
  copy. It is never shown after bedtime as a prompt.
- **v1:** pure function `kolamFor(facts, weekStart)` beside `deriveCourtyard()`. SVG, theme tokens, reduced
  motion respected. Nothing stored.
- **v2:** sync across devices (derived, so nothing to add). Optional "send as image", 0 XP, no link to stats.
- **Build:** S–M (SVG generator plus tests that the same facts always draw the same kolam).
- **2-week test:** each Sunday ask the 6 people: "Did you look at it? Did it change anything you did?" Count kolam
  opens on the phone. **Kill** if fewer than 3 of 6 open it in both weeks, or anyone says they did something late
  "to finish the pattern".
- **Scores (1–5):** novelty 3, fit 5, kindness 5, fun 3, evidence 3.

### C2 · Week case (Kapi's case about your own week)

**Pitch.** On Sunday, Kapi offers one optional case: a small logic grid built from your own week. The categories
are a few days, the friends, and what each did. The clues come from your ledger, for example: "Kapi solved a
puzzle the day after Nandi trained" or "Kachhua's on-time night came before Mor's busiest day". You deduce which
day each thing happened, with the same grid and marks as a normal case. When solved, the grid turns into your week
laid out, and the storybook opens. It is reflection that feels like a puzzle, and it ends on a stop screen.

- **Modes:** Mind (the case engine), every area (the facts), the storybook.
- **Hard to copy:** it needs (a) a ledger across life areas and (b) an offline case engine that can prove a
  unique, logic-only solution. NANDI has both: `CaseGen.countSolutions()` and `CaseGen.propagate()` in
  `src/core/mysteries/cases.d.ts`, and `availableCaseDeductions()` in `src/core/mysteries/deduction.ts`.
- **Closest app (searched):** none found. The nearest is a 2016 University of Stuttgart master's thesis
  prototype that, by the search summary, collects personal data and lets users "quiz themselves" about it. I could
  not open the thesis page (bot wall), so I do not quote it. No commercial app turned up. Logic-grid apps use fixed,
  hand-made cases.
- **Dark-pattern risk:** feeling watched; highlighting gaps ("no training on Thursday"). **Rewrite:** clues state
  only things that happened, never absences. Only area-days are used, never task titles or notes. A week with too
  few facts for a unique case quietly shows the storybook instead, with no "not enough" message. Hidden after
  bedtime, like shares (`night === 'day'`).
- **v1:** `weekCase(facts, weekStart)` builds 3×3 or 4×4 clues from `deriveCourtyard(..., weekStart)` area-days,
  keeps the case only if `countSolutions(clues, n) === 1` and `propagate(...).solved` (logic alone), and checks the
  player's grid against the rules, like every case. It pays as the day's side board (`mind.sideBoardXp` 10, at most
  `sideBoardsMaxPerDay` 1, inside `mind.dailyCap` 80, 0 after bedtime). Fact id `weekcase:<weekStart>`.
- **v2:** a **pair case**: two friends who opt in each give 3 clues from their own week, area-days only, and
  solve one joint grid on their own time. This shares personal data, so it needs accounts, consent and the DPDP
  notice.
- **Build:** M (clue templates, generator, uniqueness tests, the reveal).
- **2-week test:** 2 Sundays, 6 people. Measure solve rate and minutes. Ask: "Did you notice anything about your
  week?" and "Did it feel like being watched?" **Kill** if the median solve is over 6 minutes, or 2 or more say
  "watched".
- **Scores:** novelty 5, fit 5, kindness 4, fun 4, evidence 3.

### C3 · Ritu wheel

**Pitch.** The old Indian calendar has six ritus, two months each. NANDI has six friends. Each ritu, one friend
hosts the courtyard and their corner gets a ritu scene: Mor dances in the Varsha rains, Kapi uses the telescope
under clear Sharad skies, Nandi trains in cool Hemant, Moti keeps keepsakes in Shishir, Chiku reads in Vasant,
Kachhua rests in the Grishma shade. The host offers one fixed ritu practice for its area (for Nandi: 20 training or
rest-check days). Reaching it adds a ritu keepsake that stays forever.

- Ritus: "There are six ritus (also transliterated ritu) or seasons"; Wikipedia lists Vasanta March & April,
  Grishma May & June, Varsha July & August, Sharada late September to mid-November, Hemanta late November &
  December, Shishira January & February (https://en.wikipedia.org/wiki/Ritu_(season)).
- **Modes:** courtyard, seasons (one ritu = two economy seasons), the host's area.
- **Hard to copy:** six friends map to six ritus. Western apps use four seasons and have no cast of six.
- **Closest app (searched):** Animal Crossing: New Horizons, where "Weather also adjusts to the seasons of the
  Northern or Southern Hemisphere" and some content is "season-dependent and only appear[s] for a limited time of
  the year" (https://en.wikipedia.org/wiki/Animal_Crossing:_New_Horizons).
- **Dark-pattern risk:** limited-time scarcity and FOMO. Regional weather differs (monsoon timing). Spotlighting
  one area could push training past rest. **Rewrite:** days toward a keepsake count across years, so a missed ritu
  just waits for next year. There is no countdown and no "ends soon". The Train goal counts rest checks, so rest
  days count. Copy says "in the old calendar", not "the weather now". No festival or religious images, no
  panchang or astrology. Use fixed month pairs, not lunar dates.
- **v1:** `rituFor(day)` mapped to two economy seasons; keepsake derived from area-days in that ritu's months
  across all years; `ritu.keepsakeDays` in `rules.config.ts`. Nothing stored.
- **v2:** a shared count, anonymous and opt-in, with no ranks: "This Hemant, NANDI learners trained on 12,400
  days." This is an honest replacement for invented pace-setters.
- **Build:** S–M (six scenes, six keepsakes).
- **2-week test:** the ritu now is Hemant (host Nandi). Show the scene to 6 people. Compare Train days and rest
  checks with their 2 weeks before. **Kill** if Train days rise while rest checks fall (an over-training sign), or 2
  or more say they felt pushed.
- **Scores:** novelty 4, fit 4, kindness 4, fun 3, evidence 2.

### C4 · Sunday haat (this week seeds next week)

Pushes past the "weekly mela" example. A mela that only decorates the courtyard is a badge wall. Here each stall
hands you something **for a different area next week**.

**Pitch.** On Sunday, a small haat opens in the courtyard. A stall opens for each area you practised that week.
Each stall hands one fixed, useful thing to another friend's area for next week, so the six areas feed each other
in a ring: Nandi's stall gives Kachhua a new 2-minute stretch for the night routine; Kachhua's gives Mor an
"early first step" chip on Plan; Mor's gives Chiku the order of next week's lessons; Chiku's gives Kapi a practice
board on the technique you met; Kapi's gives Moti a review of that technique card; Moti's gives Nandi a form-cue
recap before the next workout. The walk is at most 6 taps, then a stop screen.

- **Modes:** all six areas, week to week.
- **Hard to copy:** it needs one ledger and items that live inside other modes. A single-purpose app has nothing to
  hand across.
- **Closest app (searched):** Habit Tracker: IsleGrow, "Finish all your tasks, and we'll build a new house on your
  island—one for each successful day" and "If you miss a day, the house remains unfinished"
  (https://apps.apple.com/app/id6596765665). Habit Island (spend gems on buildings) showed only in a search summary;
  its page had no data.
- **Dark-pattern risk:** items as completion-contingent rewards (Deci et al. 1999 below); a "closed stall" as a
  loss. **Rewrite:** stall menus are fixed and listed in advance ("Nandi's stall: a stretch for the night").
  Closed stalls are not drawn; the haat is as big as your week. Items are useful, not collectable, and not
  counted.
- **v1:** `haatFor(facts, weekStart)` returns open stalls; a chosen item writes `haat:<weekStart>:<area>` with the
  item id. Items are pack content, validated like any pack.
- **v2:** new stall menus per ritu through the pack updater (postponed to Phase 4, DECISIONS 2026-10-21).
- **Build:** M.
- **2-week test:** 2 Sundays. Count items taken and items used the next week. **Kill** if fewer than 30% of taken
  items are used, or Sunday opens move past bedtime.
- **Scores:** novelty 4, fit 4, kindness 4, fun 4, evidence 2.

### C5 · Aangan katha (your real tries write the chapter)

Pushes past "a story where your days write the next chapter". The storybook already turns area-days into lines,
and mystery arcs already reveal a panel per solved case (`revealedPanels()` in `src/core/mysteries/arc.ts`). The
push: **what you did off the phone becomes the plot.**

**Pitch.** Each season has a courtyard serial, one chapter a week, read on Sunday. Each chapter has fixed beats
written by editors. Which version of a beat you get depends on your week: if you did a Field try such as "ask 3
follow-up questions", Chiku asks a stranger at the mela three questions and learns where the lost kite went. If the
try "didn't come up", the stranger appears next chapter instead. A Try-it drawing day puts a drawing on the
courtyard wall in the story. A quiet week gives a calm chapter that is just as good, never a lesser one.

- **Modes:** Learn (Field try), Try-it hobbies, all areas, seasons.
- **Hard to copy:** it needs records of real-world tries plus a cast plus hand-written variants. That is a content
  moat, not a code moat.
- **Closest apps (searched):** Zombies, Run!: players "listen to various audio narrations to uncover the story",
  and "Expanding the base can influence story events and availability of missions"
  (https://en.wikipedia.org/wiki/Zombies,_Run!). The Paradime 2.0 (2020): "Habits in real world linked with
  stories in fictional world"; "Change your behaviour, change the climax of the story"
  (https://www.hunted.space/product/the-paradime/launches/the-paradime-2-0). Life Chapter (beta) uses AI to write a
  year chapter (search summary only); NANDI has no runtime AI.
- **Dark-pattern risk:** the story held hostage ("do X or you can't read"); cliffhangers at night. **Rewrite:**
  every week gives a whole chapter. Practice changes the version, never access. No tease or cliffhanger copy, and
  no chapter after bedtime. One chapter a week, so it is not a feed. Field-try notes never appear; only the result
  kind (did it / partly / didn't come up) does.
- **v1:** `chapterFor(facts, seasonStart, week)` picks beat variants by rule from facts. Content in a new pack type
  `katha`, validated with Valibot. Nothing stored except a read fact `katha:<season>:<week>` (0 XP).
- **v2:** crossover chapters: friends who opt in appear as guest characters when both did the same area that week.
  Needs accounts and consent.
- **Build:** L (mostly writing: about 4 chapters × 3–4 beats × 3 variants per season).
- **2-week test:** Wizard-of-Oz. Jenil hand-assembles 2 chapters per friend from the weekly summary export (with
  consent) and sends them as images. Ask: "Did something you did show up? Did you do a try to see it in the
  story?" **Kill** if fewer than 3 of 6 read week 2, or 2 or more say they did a try only for the story and did not
  enjoy it.
- **Scores:** novelty 4, fit 5, kindness 4, fun 5, evidence 3.

### C6 · Sikhao: teach it on (v2 needed)

Pushes past "friends that teach each other what you learned": here the **learner writes** the explanation and the
friend is checked on it.

**Pitch.** After a lesson, "Teach it". v1: you pick the simplest way to say the idea (the existing
`explain-it-back` format), then get a Field try: "Explain it to one person today", with the idea's `askLine`
(spec 19 E). v2: you send a teach card by link: your one-line explanation (chips plus own words) and the idea's 2
pack items. The friend plays it without an account. They see their own result. You see only "Riya tried your
card", never a score. Chiku's corner gets one teacher's slate the first time, never a count.

- **Modes:** Learn, Remember (your own +7-day check on that idea), shares.
- **Hard to copy:** a deterministic item bank that plays from a link with no account, plus teach-first lessons.
- **Closest apps (searched):** QuizPilot advertises "sharing quizzes and flashcards with friends"
  (search summary of https://mwm.ai/apps/quizpilot-your-study-copilot/6760037594; page not opened). GuideUs lets
  friends "take quizzes in real-time, and compare scores" (search summary). I found no app where one learner writes
  the explanation and a friend is then checked on it.
- **Dark-pattern risk:** spam; exposing a friend's score; free text from strangers. **Rewrite:** one teach card a
  day; no score to the sender; no counts; no reminder. v1 keeps own words on the phone. v2 free text goes to
  accepted friends only, with report and block (moderation, job 7).
- **v1:** `PlanRow` field try as in cj4-transfer §4.2, with `kind: 'field'` and a concept id. Fact
  `field:<planId>`. 0 XP.
- **v2:** teach-card link `#learn/teach/<conceptId>/<cardId>`; a small Worker stores the card text for accepted
  friends only (personal data: account, consent, deletion).
- **Build:** v1 S, v2 M.
- **2-week test:** v1 only. 6 people, Field try "explain it to one person". Ask each receiver (with the sender's
  permission) "did it make sense?" Compare +7-day checks for taught vs untaught ideas (direction only; small and
  self-chosen). **Kill** if fewer than 1 in 10 lessons lead to a teach try, or receivers say it felt like a test.
- **Scores:** novelty 3, fit 4, kindness 4, fun 3, evidence 5.

### C7 · Saathi try: the same try, together (v2 needed)

**Pitch.** Two friends pick the same Field try or Try-it day. Each answers the next day as usual. Answers are shown
to both only after both answered, or when the 3-day check window ends, so nobody waits on the other and nobody sees
"pending". There is no shared streak and nothing breaks. v1: tries made for two people in one room, such as "Teach
your roommate one stretch" or "Make chai together and ask 3 questions".

- **Modes:** Learn (Field try), Try-it, Train (partner stretch), Plan.
- **Hard to copy:** it needs a library of real-world tries and a deliberate no-streak social design.
- **Closest apps (searched):** TinyAct: "Both of you must check in every day to keep your shared streak alive" and
  "If one person skips, both lose the streak" (https://apps.apple.com/app/tinyact/id6758723462). Duolingo Friends
  Quests: "we'll pair you randomly with one of your Duolingo friends and assign you a random challenge"; "you have
  five days"; "remind them to do their daily lesson" (https://blog.duolingo.com/friends-quests/). Saathi try is the
  opposite: chosen partner, fixed try, no deadline pressure, no reminders.
- **Dark-pattern risk:** social pressure; shame when a friend sees "Not this time". **Rewrite:** each person
  chooses what to show; the default shows only "answered". No nudges, no streak, no count of pairs.
- **v1:** a `together: true` flag on the try content; same `PlanRow` and `field:` fact. 0 XP.
- **v2:** a pairing code in the share link; a Worker holds `{tryId, answeredAt, shownAnswer}` until both answer.
  Answers are personal data: account and consent.
- **Build:** M.
- **2-week test:** Wizard-of-Oz. Jenil forms 3 pairs. Each pair takes the same try in the app and tells each other
  the answer on WhatsApp the next day. **Kill** if any pair reports guilt or pressure, or follow-through is not
  higher than their solo tries.
- **Scores:** novelty 3, fit 5, kindness 4, fun 4, evidence 4.

### C8 · Field almanac (v2 needed)

**Pitch.** v1: your own almanac. Across all your Field tries and Try-it days, which cue chips fired ("at lunch:
4 of 5 did it"), which settings worked, and which small versions you used. It shows what worked, framed as "your
best cue". v2: with consent, anonymous answers (try id, cue chip id, result; no notes, no free text) build a
shared almanac: "People who tried this at lunch said it came up most." It shows only after your own first try, and
never ranks you. It also tells editors which tries nobody does, so they get rewritten. That is calibration from
many learners, for real-world practice.

- **Modes:** Learn, Try-it, Plan (cues are plans).
- **Hard to copy:** no other app has a bank of real-world tries with fixed cue chips. The data is the moat.
- **Closest app (searched):** Lift (now Coach.me): "Every Lift habit is supported by a community of people who are
  trying to achieve the same habit" and "The people leaving notes are there for information sharing"
  (https://blog.coach.me/?p=635). Its notes are free text, not counted cues.
- **Dark-pattern risk:** social comparison; a descriptive norm that backfires; small groups that reveal one
  person. **Rewrite:** show only "what helped", never "how many did it"; show a cell only with at least 50
  answers; no free text; never shown before your own try.
- **v1:** derived from `PlanRow` (`ifText` = cue, `fired`) and `field:` facts. Nothing stored.
- **v2:** opt-in upload of `{tryId, cueId, result, weekKey}` with no device id; k-anonymous counts back in packs.
- **Build:** v1 S, v2 M.
- **2-week test:** v1 only. Does seeing "your best cue" change the cue picked next time? **Kill** if fewer than 1
  almanac open per person per week, or nobody ever picks the suggested cue.
- **Scores:** novelty 4, fit 4, kindness 4, fun 2, evidence 4.

### C9 · Aangan visits (StreetPass for the courtyard; grows in v2)

**Pitch.** Offline and private, turned into play. Two friends in the same room open "Visit" and type each other's
short code (about 10 letters, shown on screen). The code carries only courtyard stages (6 friends plus the tree)
and one fixed gift the visitor picks: a marigold for Mor, a chalk for Kapi, and so on. The host's courtyard keeps a
small chalk mark with the visitor's 3-letter name. One visit per visitor per week. Nothing is counted or ranked and
no reply is needed. v2: the same visit from far away, through friends lists.

- **Modes:** courtyard (all areas), Night (no visits after bedtime).
- **Hard to copy:** an exchange that needs no server. Most social features need accounts first.
- **Closest (searched):** Nintendo StreetPass: "Nintendo 3DS family systems bring players together in a new way
  with the StreetPass feature"; nearby systems swap data such as Miis and high scores
  (https://en-americas-support.nintendo.com/app/answers/detail/a_id/404/~/streetpass-feature-overview). Finch: by
  search summaries, friends can "visit your friends' 'trees'" and send "good vibes"; the Bustle review I opened
  confirms only "become friends with other birds by simply sending your IRL friends a code"
  (https://www.bustle.com/wellness/finch-app-review-features-price).
- **Dark-pattern risk:** comparing courtyards; gift reciprocity pressure. **Rewrite:** visit mode shows the scene
  with no numbers and no side-by-side view. No "visit back" prompt, no notification. A typed code avoids opening the
  camera, which matches Try-it's no-camera rule.
- **v1:** fact `visit:<codeHash>:<isoWeek>`, `mode: 'courtyard'`, `kind: 'visit'`,
  `inputs: { stages, gift, name3, source: 'local' }`. The stages are activity data, so the code is shown only when
  the owner taps "Show my code".
- **v2:** the same fact with `source: 'remote'`, delivered through a friends list (account, consent).
- **Build:** M.
- **2-week test:** 6 friends, in person. Count visits. Ask: "Did seeing their courtyard make you feel behind?"
  **Kill** if 2 or more say yes, or there is less than 1 visit per person.
- **Scores:** novelty 4, fit 5, kindness 4, fun 4, evidence 3.

### C10 · Lantern relay (v2 needed)

**Pitch.** v1: after an on-time lights-out (`lightsout` with `metTarget`), Kachhua takes one line from you, "first
step tomorrow", and hands it back in the morning on Plan as a lit lantern. v2: once a night, you may pass a
lantern to one friend: no text, just a fixed chip such as "Good night" or "You've got this tomorrow". It arrives at
the friend's morning, never at night. It shows in their courtyard with no notification, no reply and no count.

- **Modes:** Night (Sleep), Plan, courtyard.
- **Hard to copy:** it is tied to the lights-out fact and the 4:00 am day boundary, and it is slow on purpose.
- **Closest (searched):** Finch "good vibes" sent to friends' pets (search summaries of user posts; no official
  page found); Strava kudos.
- **Dark-pattern risk:** a reason to open the phone at night; obligation; "nobody sent me one". **Rewrite:** the
  pass is one tap inside the lights-out flow that is already open. No inbox, no list of who did not send. Delivery
  only after the friend's day starts. No sleep claims anywhere in the copy.
- **v1:** fact `lantern:<dayKey>` with the line kept in a settings row `night.lantern:<dayKey>` (text stays out of
  the ledger, like Field-try notes).
- **v2:** a Worker queue keyed by friend id, delivered after the recipient's 04:00 boundary. Account and consent.
- **Build:** v1 S, v2 M.
- **2-week test:** v1 for 2 weeks; v2 as Wizard-of-Oz (Jenil forwards "lanterns" at 8 am on WhatsApp). **Kill** if
  opens after bedtime rise, or on-time lights-out falls, against the 2 weeks before.
- **Scores:** novelty 3, fit 4, kindness 5, fun 3, evidence 3.

### C11 · Circle of six (v2 needed)

**Pitch.** Six real friends form a circle. Each adopts one courtyard friend to look after (not to do alone). A
shared circle courtyard grows by **distinct days** on which anyone in the circle practised that area, with the same
`STAGE_DAYS` table, so nobody can grind and nobody can break it. Nothing goes backward and nobody's own numbers are
shown. When a stage is reached, the adopter picks the next object from two fixed options. A weekly circle page
says "This week the circle trained on 5 days".

- **Modes:** all areas, seasons.
- **Hard to copy:** six friends map to six people; days-not-points; no shared streak.
- **Closest (searched):** Duolingo Friends Quests (above, random pair and a 5-day deadline). Habitica: damage from
  missed Dailies "is inflicted on the entire party" (community wiki, search summary,
  https://habitica.fandom.com/wiki/FAQ). Forest: "Plant together: plant a tree with your friends. If anyone uses
  his/her phone, everyone's tree will die" (https://www.producthunt.com/p/forest).
- **Dark-pattern risk:** free-riding guilt, pressure on the least active, exclusion. **Rewrite:** no per-person
  attribution anywhere; no circle-vs-circle ranking; leaving is one tap with no message to the others; a quiet
  member is just quiet.
- **v1:** "tending" solo: you pick the friend you look after this season (settings row `courtyard.tending`), and
  its corner shows a small sign. The circle itself cannot exist offline.
- **v2:** a circle of up to 6 accounts; the server unions area-days from each member's synced ledger. Needs accounts,
  sync and consent.
- **Build:** L.
- **2-week test:** Wizard-of-Oz. Each Sunday each friend sends their storybook image to Jenil, who draws a circle
  courtyard by hand and posts it. **Kill** if 2 or more feel watched, or anyone asks to leave.
- **Scores:** novelty 4, fit 4, kindness 3, fun 4, evidence 3.

### C12 · Chaupal: how others started today's board (v2 needed)

**Pitch.** A chaupal is the village square where people talk over the day. After you solve today's board (#N, the
same for everyone), open the chaupal. v1: see your first three techniques next to the solver's first three for this
board: "You started with Adjacency elimination. The solver started with One-cell region. Both work." Tap one to try
that start on a practice copy. v2: see how everyone who solved board #N started: "Most solvers began with the
two-row regions; 1 in 5 began in the corner." No times, no ranks, no names. Only after you solve, so no spoilers.
One board a day, so it ends.

- **Modes:** Mind, technique cards, shares (board number).
- **Hard to copy:** it needs a logic solver that names a technique for each move. NANDI has `usedTechnique()` and
  already stores the order of first use in `PuzzleRunRow.techniquesSeen`, so v1 needs no new data and v2 needs no
  migration.
- **Closest (searched):** NYT WordleBot: "For every turn, you'll see a ranked list of the most popular guesses
  along with the percentage of readers who picked them" (https://beebom.com/puzzle/wordle-bot-explained/). The
  Discover Magazine article on WordleBot data returned an empty page.
- **Dark-pattern risk:** comparison ("I started the wrong way"). **Rewrite:** every logic start is shown as valid;
  no "best" label; no percentages about you; never before you solve.
- **v1:** derived: `techniquesSeen.slice(0, 3)` vs the solver's first steps from `availableDeductions()` on the
  empty board.
- **v2:** opt-in upload of `{boardNumber, type, firstTechniques}` only, no device id; daily counts on a Worker.
  No personal data beyond a choice of technique; still ask consent.
- **Build:** M.
- **2-week test:** v1 for 2 weeks. Ask: "Did you try the other start the next day?" Measure opens and minutes.
  **Kill** if fewer than 30% of solves open it, or it adds more than 1 minute to the median Mind session.
- **Scores:** novelty 4, fit 4, kindness 5, fun 4, evidence 4.

### C13 · Antakshari chain (grows in v2)

**Pitch.** In antakshari, each song starts where the last ended. Here, once a day and optionally, the six friends
ask one short question each, and each question starts from the last answer's topic. Chiku asks a due Learn item;
Moti a retention item; Kapi "Which technique cracked yesterday's board?"; Nandi "What is one form cue for your
squat?"; Mor "What first step did you write for today's top task?"; Kachhua "What bedtime did you pick?". Six
links, then a stop screen. v2: a friend chain on the day's shared idea, passed by link between 2–4 friends, that
closes after 7 days.

- **Modes:** Learn, Remember, Mind, Train, Plan, Sleep.
- **Hard to copy:** questions from six life areas in one chain need one ledger and six item sources.
- **Closest (searched):** e-Antakshari: "play Antakshari virtually with your friends & family" in game rooms
  (search summary of https://apps.apple.com/in/app/eantakshari/id1523283923); WordsMate async turns (search
  summary).
- **Dark-pattern risk:** "a test of my life"; v2 waiting-for-your-turn pressure. **Rewrite:** the personal links
  (Mor, Kachhua) can be turned off; no "your turn" nudges; the v2 chain closes on its own with no "broken" message.
  0 new XP; due Learn and retention items pay as they already do.
- **v1:** derived from existing schedules (`cardBoxIntervalsDays`, item intervals) plus form cues; fact
  `chain:<dayKey>`.
- **v2:** link chain; a Worker holds link order only.
- **Build:** M.
- **2-week test:** finish rate and session length. **Kill** if the median session grows by 3 minutes or more, or
  fewer than 40% finish.
- **Scores:** novelty 3, fit 3, kindness 4, fun 3, evidence 4.

### C14 · Sangam scenes (two friends meet)

**Pitch.** When two areas are practised on the same day, those two friends share a small scene that evening:
Nandi and Kachhua stretch beside the lantern; Kapi shows Chiku a puzzle. There are 15 pairs, each with a few fixed
scenes. A scene once seen stays in a Sangam album.

- **Modes:** all six areas.
- **Hard to copy:** cast relationships plus a cross-mode ledger.
- **Closest (searched):** Habit-chi: "The more you stick with it, the more your Habit-chi's affection grows—and it
  evolves", and "Skip your habits and your Habit-chi might run away!" (https://apps.apple.com/app/id6755858049).
  Habits with Henry unlocks pets with more habits (search summary). No app found where characters meet when two
  different habits are done.
- **Dark-pattern risk:** collection compulsion; cramming two areas late at night. **Rewrite:** no "7 of 15"
  counter and no locked silhouettes. The scene shows only in day or evening; a pair finished after bedtime shows the
  next morning, uncelebrated. Whole days only, never "within an hour" (see Etkin & Mogilner below).
- **v1:** derived from `deriveCourtyard()` per day; pair order fixed. Nothing stored.
- **v2:** a visiting friend's Nandi can join your scene after a C9 visit.
- **Build:** M (art).
- **2-week test:** multi-area days vs the 2 weeks before; facts after bedtime. **Kill** if facts after bedtime rise.
- **Scores:** novelty 3, fit 4, kindness 4, fun 4, evidence 2.

### C15 · Bahi: the book that only grows

**Pitch.** A bahi-khata is the red cloth account book Indian traders keep. NANDI's ledger already works like one:
entries are only added, never erased. Show it as a bahi: each day one line in a friend's voice, each season a page.
At season end you tie the page with a red thread and pick up to three lines to carry forward ("I trained on cold
mornings"). They open the next season's page.

- **Modes:** all areas, seasons.
- **Hard to copy:** the append-only ledger is a rule here (CLAUDE.md: "Never mutate or delete ledger rows").
- **Closest (searched):** Day One "On This Day": "Revisit past entries, photos & videos, and locations from over
  the years" (https://dayoneapp.com/features/on-this-day/).
- **Dark-pattern risk:** rumination; a thin season looks thin. **Rewrite:** no line counts; a quiet season gets one
  kind page; carrying lines forward is optional. Keep it secular: no account-book worship imagery.
- **v1:** derived pages; carried lines in a settings row `bahi.carry:<seasonIndex>`.
- **v2:** sync and a print-ready year export. v2 adds nothing new socially.
- **Build:** S–M.
- **2-week test:** tie a practice page at the end of week 2. **Kill** if nobody picks a line, or anyone says it made
  them feel worse.
- **Scores:** novelty 3, fit 4, kindness 4, fun 2, evidence 2.

---

## 4. The required table, one row per mechanic

"App" is the closest existing app from §3. Evidence quotes are from sources I opened (§8).

| App | Mechanic | What the user does and sees | Why it works (evidence, quoted) | Dark-pattern risk | NANDI v1 (offline) | NANDI v2 (online) | Kill test |
|---|---|---|---|---|---|---|---|
| Pixelist; UbiFit Garden | C1 Week kolam | Each practice day draws a loop on a 7×6 dot grid; kept on a shelf | Harkin 2016: monitoring "promoted goal attainment (d+ = 0.40)", larger "when the information was physically recorded". Consolvo: with the garden display, participants "maintained their physical activity level over time" | Perfection-seeking | Derived SVG, nothing stored | Sync only | < 3 of 6 open it in both weeks |
| None found (research prototype) | C2 Week case | Solve a logic grid made from your own week | Symons & Johnson 1997: "self-referent encoding strategies yielding superior memory relative to both semantic and other-referent encoding" | Feeling watched; gaps | `weekCase()` with `countSolutions === 1`; side-board XP | Pair case (accounts, consent) | Median solve > 6 min, or 2+ feel watched |
| Animal Crossing NH | C3 Ritu wheel | Six ritus, one host friend each; a keepsake per ritu | Dai, Milkman & Riis 2014: goal behaviour increases "following temporal landmarks (e.g., the outset of a new week, month, year, or semester…)" | Scarcity, over-training | Days count across years; no countdown | Anonymous shared count | Train days up while rest checks down |
| IsleGrow | C4 Sunday haat | Open stalls hand items to other areas for next week | Dai et al. 2014 (new week as a landmark). No direct study of cross-area carry-over found | Rewards as payment; closed stalls | Fixed stall menus; `haat:` facts | Stall menus by pack update | < 30% of items used |
| Zombies, Run!; The Paradime | C5 Aangan katha | Weekly chapter whose version depends on your real tries | Milkman et al. 2014: with gym-only audiobooks, people "visited the gym 51% … more frequently", "but treatment effects declined over time". Green & Brock 2000: transportation "augmented story-consistent beliefs" | Story as hostage; night cliffhangers | Beat variants by rule; 0 XP | Friend crossovers | < 3 of 6 read week 2 |
| QuizPilot (nearest) | C6 Sikhao | Explain an idea to a person; v2 send a teach card | Kobayashi 2019, 28 studies: "0.35 for preparing‐to‐teach and 0.56 for teaching with preparing‐to‐teach"; larger for interactive teaching | Spam, score exposure, free text | Field try "explain to one person" | Teach-card link, friends only | < 1 in 10 lessons lead to a teach |
| TinyAct; Duolingo Friends Quests | C7 Saathi try | Same try for two; answers shown after both answer | Carr & Walton 2014 (via GovExec): cues of working together made people persist "48 to 64 percent longer". Harkin 2016: larger effects "when the outcomes were reported or made public" | Pressure, shame | Two-person tries in one room | Paired reveal on a Worker | Any pair reports guilt |
| Lift / Coach.me | C8 Field almanac | See which cues worked for you; v2 for many learners | Sheeran, Listrom & Gollwitzer 2025, 642 tests: effects "larger when plans had a contingent (if-then) format"; they built "a taxonomy of plan cues" (paraphrase). Schultz et al.: a descriptive norm "was shown to increase consumption for low-consuming households" (a backfire to design around) | Comparison, small cells | Derived from `PlanRow` | k-anonymous cue counts | Nobody picks the suggested cue |
| StreetPass; Finch | C9 Aangan visits | Type a friend's code in person; leave a fixed gift | Ryan, Rigby & Przybylski 2006: "autonomy, competence, and relatedness independently predict enjoyment and future game play" | Comparing courtyards; reciprocity | `visit:` fact by typed code | Remote visits via friends | 2+ feel behind |
| Finch good vibes | C10 Lantern relay | One-line first step back in the morning; v2 pass a lantern to a friend | Kumar & Epley 2018: expressers "underestimated how positive recipients would feel". Scullin et al. 2018 (lab, 57 adults): to-do-list writers "fell asleep significantly faster" (not used as a claim) | Night opens, obligation | `lantern:` fact; text in settings | Morning delivery queue | Opens after bedtime rise |
| Habitica; Forest; Duolingo Friends Quests | C11 Circle of six | Six friends, one shared courtyard grown by distinct days | Carr & Walton 2014 (as above). Silverman & Barasch 2022: broken-streak effect "amplified when consumers attribute a break in the streak to themselves" (why no group streak) | Free-riding guilt | Solo "tending" | Circle on a server | 2+ feel watched |
| NYT WordleBot | C12 Chaupal | Compare your first techniques with the solver's, later with everyone's | Rittle-Johnson & Star 2009: knowledge and flexibility "were best supported by comparing solution methods" | Comparison, spoilers | `techniquesSeen` vs solver | Anonymous first-technique counts | < 30% of solves open it |
| e-Antakshari | C13 Antakshari chain | Six linked questions from six areas, then stop | Adesope et al. 2017: "practice tests are more beneficial for learning than restudying". Brunmair & Richter 2019: interleaving "g = 0.42", but "used with caution … for expository texts and words" | Life-quiz feel; turn pressure | Derived chain; 0 new XP | Friend link chain | Session +3 min |
| Habit-chi | C14 Sangam scenes | Two friends share a scene on a two-area day | Etkin & Mogilner 2016: variety helps over a day and not over an hour; "variety is the spice of life"—but not of an hour | Collection, late cramming | Derived by day | Visitor joins scene | Facts after bedtime rise |
| Day One | C15 Bahi | The ledger as a red account book; carry 3 lines into the next season | Dai et al. 2014: landmarks "relegate past imperfections to a previous period" | Rumination | Derived pages; carry row | Sync, year export | Nobody picks a line |

A general point for all 15: most new moments pay **0 XP**. Deci, Koestner & Ryan 1999: completion-contingent
rewards "significantly undermined free-choice intrinsic motivation (d = … -0.36)", while "Positive feedback
enhanced both free-choice behavior (d = 0.33) and self-reported interest (d = 0.31)". They also found tangible
rewards "more detrimental for children than college students", so this is a product choice, not a ban. Only C2
pays, through the existing side-board slot.

---

## 5. Scores and the top 3

Scores 1–5. **Novelty** = how far from the closest app I found. **Fit** = uses NANDI's own assets (§1) and the
mission (less scrolling, earlier sleep). **Kindness** = passes the hard rules with little rewriting. **Fun** = my
judgement of wanting to do it again, to be checked in the 2-week test. **Evidence** = how direct the opened
sources are.

| # | Concept | Novelty | Fit | Kindness | Fun | Evidence | Total | Build |
|---|---|---|---|---|---|---|---|---|
| C2 | Week case | 5 | 5 | 4 | 4 | 3 | **21** | M |
| C12 | Chaupal | 4 | 4 | 5 | 4 | 4 | **21** | M |
| C5 | Aangan katha | 4 | 5 | 4 | 5 | 3 | **21** | L |
| C7 | Saathi try | 3 | 5 | 4 | 4 | 4 | 20 | M |
| C9 | Aangan visits | 4 | 5 | 4 | 4 | 3 | 20 | M |
| C1 | Week kolam | 3 | 5 | 5 | 3 | 3 | 19 | S–M |
| C6 | Sikhao | 3 | 4 | 4 | 3 | 5 | 19 | S / M |
| C4 | Sunday haat | 4 | 4 | 4 | 4 | 2 | 18 | M |
| C8 | Field almanac | 4 | 4 | 4 | 2 | 4 | 18 | S / M |
| C10 | Lantern relay | 3 | 4 | 5 | 3 | 3 | 18 | S / M |
| C11 | Circle of six | 4 | 4 | 3 | 4 | 3 | 18 | L |
| C3 | Ritu wheel | 4 | 4 | 4 | 3 | 2 | 17 | S–M |
| C13 | Antakshari chain | 3 | 3 | 4 | 3 | 4 | 17 | M |
| C14 | Sangam scenes | 3 | 4 | 4 | 4 | 2 | 17 | M |
| C15 | Bahi | 3 | 4 | 4 | 2 | 2 | 15 | S–M |

Ties at 21 are ranked by smaller build first, then kindness.

### Proposal 1 · Week case (ORIGINAL)

- **Searched first.** Queries for a logic puzzle built from your own data or diary found no app. The closest is a
  2016 Stuttgart thesis prototype that lets users quiz themselves on collected personal data (search summary only;
  the page was blocked). Logic-grid apps use fixed cases. So this is original as far as I could find.
- **Why first.** It uses three things only NANDI has together: the cross-mode ledger, the six friends, and an
  offline case engine that proves uniqueness and logic. It turns the week's review into a 3-minute puzzle that
  ends. It needs no network, no new table and no new XP path.
- **Build order:** acceptance tests in `src/core/mysteries/` (same facts → same case; `countSolutions === 1`;
  `propagate().solved`; no clue mentions an absence; a thin week returns `null`); clue templates as pack content;
  Sunday card on Plan, hidden after bedtime; reveal into the storybook; owner-panel counts.

### Proposal 2 · Chaupal

- **Searched first.** Closest: WordleBot's ranked popular guesses per turn. NANDI's version compares **methods**
  (named techniques), not words or luck, and shows every logic start as valid.
- **Why second.** v1 is almost free: the data (`techniquesSeen`) is already stored and the solver is already
  there. It teaches technique names, which is near transfer inside the puzzle type, not a "makes you smarter"
  claim. v2 is the cleanest "many learners" feature in the batch, because it needs no personal data beyond a
  consented, anonymous technique id per board number.
- **Build order:** `firstTechniques(run)` and `solverStart(board)` with tests; after-solve card; practice-copy
  button; later a Worker with daily counts.

### Proposal 3 · Aangan katha

- **Searched first.** Closest: Zombies, Run! (story during runs, base progress changes events) and The Paradime
  (habits change the climax). Neither uses records of social or creative tries off the phone, and both let real
  behaviour gate content. NANDI's version never gates: practice changes the version, not the access.
- **Why third.** It is the strongest "only NANDI" story because it makes Field tries and Try-it visible in the
  courtyard. It is the most expensive (content). Start with one season's 4 chapters for the conversation and
  drawing tries only.
- **If build time is the limit,** swap it for C9 Aangan visits (20 points, M), which also makes "offline and
  private" a feature.

---

## 6. Rejected or rewritten on the way

| Idea | Rule it broke | What happened |
|---|---|---|
| Group streak with friends (TinyAct style) | Loss state; social guilt (Silverman & Barasch 2022: self-blamed breaks hurt most) | Rejected. C11 counts distinct days and can never break. |
| "Everyone's tree dies if one person leaves" (Forest's Plant Together) | Loss state, shared punishment | Rejected. C11 and C7 have nothing to lose. |
| Gift Shards to a friend (a "shagun" envelope) | Turns the economy into money-like transfers; reciprocity pressure; farming | Rejected. C9 gifts are fixed objects that cost nothing. |
| Ritu-only exclusive items | Fake scarcity | Rewritten (C3): days count across years. |
| Flashcards during workout rest timers | More screen time in the hand; breaks the rest | Rejected. |
| A real-world clue inside a mystery case ("count the windows in your corridor") | A case must have one checkable solution; NANDI checks the grid against rules, not a stored answer | Rejected. |
| A league ranked by practice days | Still a leaderboard; invented rivals already need a pace-setter label (online-ready review) | Rewritten as C11 (cooperative) and C3 v2 (anonymous count). |
| Random daily stall items at the haat | Variable reward | Rewritten (C4): menus fixed and shown in advance. |

Hard-rule check for the 15 kept concepts: none uses random or variable rewards; none has a loss state, a decay or a
"you missed" line; none is an endless feed (each ends: one case, one chapter, one chain, one haat a week); none has
a punishing timer; none makes a health promise (C10 cites a sleep study but its copy makes no claim); no firearm
content; personal data goes online only in v2, with an account, consent and the DPDP notice; XP, level and Shards
never go down (only C2 pays, through an existing capped slot). No Duolingo names, art or copy; no franchise
words.

---

## 7. Repo notes (found while reading, not fixed)

| Note | Where | Why it matters |
|---|---|---|
| Spec 21 (life skills and Field try) is not on any branch. `git ls-tree` across all `origin/*` found only specs 22 (`ideas/spec-22-merge-restore`) and 23 (`ideas/spec-23-learn-duolingo-level`). | — | C5–C8 depend on Field try. Today its only design is `docs/reviews/cj4-transfer.md`. |
| Two `seasonFor()` functions number seasons differently. `src/core/economy/deriveEconomy.ts` gives Nov 2026 index 0 ("Season 1 is index zero"). `src/core/mysteries/arc.ts` adds `+ 1`, so Nov 2026 is index 1 and `arcIndex` 1. | both files | Probably intended (Oct had arc 0), but not a confirmed bug. C3 and C15 should use one shared season function so a ritu and a season cannot disagree. |
| The ladder shows invented rivals as names (`rivalName()` in `src/core/economy/ladder.ts`, shown in `src/ui/screens/EconomyScreens.tsx`). | — | Already flagged by the online-ready review. C3 v2 offers an honest replacement. |

No real bug confirmed in the code I read.

---

## 8. Sources

### Opened and quoted (evidence)
- Harkin et al. 2016, Psychological Bulletin (PubMed abstract via E-utilities): https://pubmed.ncbi.nlm.nih.gov/26479070/
- Consolvo et al. 2008, "Activity Sensing in the Wild: A Field Trial of UbiFit Garden", CHI (PDF, abstract read): https://makeabilitylab.cs.washington.edu/media/publications/Consolvo_ActivitySensingInTheWildAFieldTrialOfUbifitGarden_CHI2008.pdf
- Consolvo's UbiFit project page (named researcher, summary of the 3-month field experiment): https://www.consolvo.org/ubifit
- Symons & Johnson 1997, Psychological Bulletin: https://pubmed.ncbi.nlm.nih.gov/9136641/
- Dai, Milkman & Riis 2014, Management Science (abstract via Crossref): https://doi.org/10.1287/mnsc.2014.1901
- Milkman, Minson & Volpp 2014, Management Science (abstract via Crossref): https://doi.org/10.1287/mnsc.2013.1784
- Green & Brock 2000, Journal of Personality and Social Psychology: https://pubmed.ncbi.nlm.nih.gov/11079236/
- Kobayashi 2019, Japanese Psychological Research (abstract on MetaTOC): https://metatoc.com/papers/112234-learning-by-preparing-to-teach-and-teaching-a-meta-analysis (doi 10.1111/jpr.12221)
- Sheeran, Listrom & Gollwitzer 2025, European Review of Social Psychology (abstract on KOPS): https://kops.uni-konstanz.de/handle/123456789/69905
- Schultz, Nolan, Cialdini, Goldstein & Griskevicius 2018 reprise of their 2007 study, Perspectives on Psychological Science: https://pubmed.ncbi.nlm.nih.gov/29592653/
- Ryan, Rigby & Przybylski 2006, Motivation and Emotion (full PDF): https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf
- Kumar & Epley 2018, Psychological Science: https://pubmed.ncbi.nlm.nih.gov/29949445/
- Scullin et al. 2018, Journal of Experimental Psychology: General: https://pubmed.ncbi.nlm.nih.gov/29058942/
- Silverman & Barasch 2022, Journal of Consumer Research (abstract via Crossref): https://doi.org/10.1093/jcr/ucac029
- Rittle-Johnson & Star 2009, Journal of Educational Psychology (author manuscript, Harvard DASH): https://dash.harvard.edu/server/api/core/bitstreams/7312037c-9058-6bd4-e053-0100007fdf3b/content
- Adesope, Trevisan & Sundararajan 2017, Review of Educational Research (abstract via Crossref): https://doi.org/10.3102/0034654316689306
- Brunmair & Richter 2019, Psychological Bulletin: https://pubmed.ncbi.nlm.nih.gov/31556629/
- Etkin & Mogilner 2016, Journal of Consumer Research (abstract on IDEAS/RePEc; only the closing line quoted): https://ideas.repec.org/a/oup/jconrs/v43y2016i2p210-229..html
- Deci, Koestner & Ryan 1999, Psychological Bulletin: https://pubmed.ncbi.nlm.nih.gov/10589297/
- Carr & Walton 2014, Journal of Experimental Social Psychology: **read only through a news summary** (GovExec): https://www.govexec.com/management/2017/09/working-alone-together-can-be-good-motivation/140925/

### Opened and quoted (what apps do, not why)
- Pixelist: https://apps.apple.com/us/app/pixelist-habit-tracker/id1317636216
- IsleGrow: https://apps.apple.com/app/id6596765665
- The Paradime 2.0: https://www.hunted.space/product/the-paradime/launches/the-paradime-2-0
- Zombies, Run! (Wikipedia): https://en.wikipedia.org/wiki/Zombies,_Run!
- Duolingo Friends Quests: https://blog.duolingo.com/friends-quests/
- TinyAct: https://apps.apple.com/app/tinyact/id6758723462
- Forest 4.0 on Product Hunt: https://www.producthunt.com/p/forest
- Lift / Coach.me blog: https://blog.coach.me/?p=635
- Nintendo StreetPass support page: https://en-americas-support.nintendo.com/app/answers/detail/a_id/404/~/streetpass-feature-overview
- Bustle Finch review: https://www.bustle.com/wellness/finch-app-review-features-price
- Animal Crossing: New Horizons (Wikipedia): https://en.wikipedia.org/wiki/Animal_Crossing:_New_Horizons
- Beebom on WordleBot: https://beebom.com/puzzle/wordle-bot-explained/
- Habit-chi: https://apps.apple.com/app/id6755858049
- Day One On This Day: https://dayoneapp.com/features/on-this-day/
- Kolam (Wikipedia): https://en.wikipedia.org/wiki/Kolam
- Ritu (Wikipedia): https://en.wikipedia.org/wiki/Ritu_(season)

### Could not open, or read only through search summaries
| Source | What happened | How it is used |
|---|---|---|
| Carr & Walton 2014 abstract (ScienceDirect) | HTTP 403; Crossref and Semantic Scholar have no abstract | Only the GovExec news summary is quoted, and labelled as such |
| Stanford news release on Carr & Walton | HTTP 403 | Not used |
| University of Stuttgart thesis (personal-data quiz prototype) | Bot-protection page ("Access Denied") | Named as the closest prior work from the search summary only; not quoted |
| Discover Magazine on WordleBot data | Page body empty | Not used; Beebom quoted instead |
| Habit Island (hunted.space) | "No data available for this product" | Mentioned from the search summary only |
| Finch official help pages | Not found; only reviews and user posts | "Good vibes" and "visit trees" come from search summaries; only the Bustle line is quoted |
| Habitica party damage | Community wiki, read through a search summary | Quoted as a search summary, not as an official rule |
| QuizPilot, GuideUs, e-Antakshari, WordsMate, Habits with Henry, Life Chapter | Read through search summaries, store pages not opened | Named as closest apps only; not used as evidence |
| Fiorella & Mayer 2013; Chase et al. 2009 (protégé effect); Rittle-Johnson & Star 2007 | Abstracts elided by the publisher or not found | Not used; Kobayashi 2019 and Rittle-Johnson & Star 2009 used instead |
| Goal Questers listing ("65% … 95%", attributed to an ASTD study) | Seen in a search summary | Not used: the figure has no primary source I could find |
