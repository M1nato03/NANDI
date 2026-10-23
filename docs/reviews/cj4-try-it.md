# cj4 · Try-it tracks: how NANDI hands people a hobby

Job 7 of batch 4 (idea engine). Date: 2026-10-23. Branch `ideas/cj4-try-it`, based on `origin/main` at `a6c21b7`.
Status: proposal. Nothing here is built. Build only after Jenil says yes.

Jenil's ask (24 Oct): on low-energy days and normal days, give people something interesting to do **off** the
phone, such as drawing, singing or videography, with real-life practice. "The real-life application learning is
what will make us stand out."

## 0. Summary

- **Format.** One 2-minute Learn step (one idea) → one 10-20 minute off-phone quest, with a 5-minute small version →
  an optional one-tap self-check the next day. Seven of these make a starter track.
- **Fits what exists.** Most of the parts are already in the code: Learn steps (`topicStepSchema`), weekly side
  quests (`src/core/quests`), the fixed-choice soft day (`src/core/soft/soft.ts`), first-run interests
  (`src/core/adaptive/day.ts`). Content packs already carry an optional `quest` on each concept, filled in 48
  concepts, and no screen shows it yet.
- **XP.** A Try-it day itself earns 0 XP. Rewards come only from paths that already exist and are already capped: the
  lesson (15 XP, one paid lesson a day) and one weekly side quest (20 XP once per ISO week). Most new XP Try-it can
  add: **20 XP a week**.
- **Saved.** Photos, drawings and recordings stay in the phone's own gallery and recorder. NANDI never opens the
  camera or microphone for this. NANDI keeps only "done", small/full, an optional one-line note (80 characters at most),
  the self-check tap and an asked "time off the phone" band.
- **Evidence.** Drawing and singing ideas rest on peer-reviewed lab work. The videography ideas rest on university
  teaching guides, plus one experiment on audio quality. No source shows visible progress in exactly 7 days for any of the three. The
  copy must not promise it.
- **Found on the way:** custom side quests are unlimited and each pays 20 XP. That can be farmed. Fix it before Try-it
  sends more people to the quest list (§6.3).

## 1. What exists today (read on origin/main)

| Part | Where | What it does | Numbers |
|---|---|---|---|
| Weekly side quests | `src/core/quests/index.ts` | `Quest` has `kind: 'once' \| 'total'`, `target`, `step`, `tapIds`, `status`. `selectWeekly(pack, week, previous, count = 3)` picks 3 by a fixed hash of the ISO week, skipping last week's picks. `applyTap` applies each `tapId` once. `archivePast` archives unfinished quests at the week change, with progress kept and no penalty. `completionFactId` = `quest:<questId>:<isoWeek>`. | 3 a week; the week changes Monday 04:00 (`weekKey`) |
| Quest repo | `src/data/repos/quests.ts` | `award()` writes one ledger fact `{ mode: 'quests', kind: 'quest' }` if the id is not there yet. `swap()` allows one swap a week. `addCustom()` has no count limit (title ≤ 120 chars). | — |
| Quest XP | `src/core/economy/awards.ts` `calculateQuestXp`, `replayFactXp`; `deriveEconomy.ts` | Pays `RULES.quests.sideQuestXp` once per `quest:<id>:<week>` fact, replayed under the rules of that day. Quest XP joins the day total and Season points (`closesFor`: sp = total − held − soft − welcome, capped by `season.spDailyCap` 300). There is no separate daily cap on quest XP. | `quests.sideQuestXp` **20**, bounds **[0, 50]** |
| Quest content | `content/quests/quests.core.json` | 6 `creativity` quests already, e.g. "Make 5 quick sketches", "Take 10 photos on one theme", "Edit a 30-second video", "Record a minute of sounds from one place". The UI hint for this category is "Make something with your hands.", 15 min (`src/ui/quests/SideQuests.tsx`). | — |
| Learn steps | `src/core/learn/steps.ts`; schema `topicStepSchema` in `src/data/packs/schemas.ts` | One step = `hook` → `teach` → `visual` → `example` (2-5 parts, tap the one that shows the idea) → `guided` (1-2) → `takeaway`. `nextStep` teaches a concept's steps in order. `practiceTail` brings items back on later days. A concept has 2-3 steps (`steps` min 2, max 3). Lesson fact id `learn-lesson:<stepId>` (`src/data/repos/learn-engine.ts`). | `mind.lessonXp` **15**, `mind.lessonsPaidPerDay` **1**, `mind.lessonsPerCoursePerDay` **1**, `mind.dailyCap` **80**; Mind after bedtime earns 0 |
| Concept quest | `topicConceptSchema.quest` (`{ title, detail, sourceRefs }`) | Filled in 48 concepts in `content/topics/*.json` (e.g. Psychology: "Spot a cue"). The only code that reads it is `src/data/packs/validate.ts:152`, which checks its sources. No screen shows it. | — |
| Interests | `src/core/adaptive/day.ts` `INTERESTS`, setting `adaptive.interests` | 10 interests, each with a version that has a clear end. `art` = "Sketch for 20 minutes" (night: true). `music` = "Play one album". There is no singing or video interest. `boundedSuggestion` feeds one idea into the App pause swaps and the Done-for-today card. | — |
| Soft days | `src/core/soft/soft.ts`, spec `docs/specs/15-soft-days.md` | `SOFT_OPTIONS` fixed per state, "never random, never more than three". Doing one writes `soft` and marks the day. Quests, season, ladder and shop are hidden on a soft day. | `soft.dayXp` **10**, `soft.welcomeBackXp` **15** |
| Plan tasks | `src/core/tasks`, `RULES.tasks` | An S task (0-15 min) pays 10 XP. A planned task done fills the Hat-trick task slot. `validReward()` (`src/core/tasks/complete.ts`) rejects self-rewards that name a feed app (`rewardBlockedWords`: instagram, reels, youtube …). | `tasks.xpBySize.S` **10**, `tasks.dailyCap` **200**, `bonuses.hatTrickXp` **30** |
| Ledger rules | `CLAUDE.md`, `DECISIONS.md` | Facts only, idempotent `kind:refId` ids, never mutated. XP is never removed; level and Shards never go down. Rule changes apply forward from `effectiveFrom`. No variable-ratio rewards. Nothing leaves the phone. | — |

## 2. The "Try it" format

One Try-it day has three parts. Each part has a hard stop.

| Part | Length | Where | What the person does | Ends with |
|---|---|---|---|---|
| 1. Idea | about 2 min | Learn step, same shape as spec 14 | Hook guess → teach card (≤ 30 words) → "Show me" → one guided try → takeaway | "Now put the phone down. Your quest:" + quest card |
| 2. Quest | 10-20 min (small: 5 min) | Off the phone: paper, voice, the phone's own camera app | The task on the quest card. NANDI shows no timer screen, so it does not hold the screen. | The person comes back whenever they like and taps **Done** (or **Small one done**). There is an optional one-line note. Then one question: "About how long were you off the phone?" |
| 3. Self-check | 1 tap | Next planning day (the day turns at 04:00), on the Try-it card | A question about yesterday's own work, e.g. "Which of your 3 bottles looks most like the bottle?" There is no right answer and no score. | "Saved. Day 2 is ready when you are." with **Close for today**. Nothing starts on its own. |

Rules for the format:
- **One Try-it day per planning day**, at most. This matches `mind.lessonsPerCoursePerDay` 1, so a track cannot become a
  binge.
- **No deadline.** Day 3 can come a week after day 2. The card says "Day 3 of 7", which is a position, not a streak.
  There is no "you missed" copy and nothing counts gaps.
- **The quest is the point; the lesson is the doorway.** A person may tap **Skip to the quest**. Skipping the
  lesson does not block the quest.
- **Self-check is optional.** If it is not answered within 3 days, it quietly goes away. Nothing marks it as missed.
- **No in-app timer for the quest.** A timer screen keeps the phone in the hand and on. The quest card states the
  minutes, and the person is trusted.
- **Night.** After bedtime the lesson part is not offered (Mind earns 0 then anyway). Only drawing's small version
  shows, because it is quiet and needs no screen. If it is done, it counts but is not celebrated, which matches the
  rule for Tasks and Train at night.

### 2.1 Content shape (proposal, schema change in packs only)

Add an optional `tryIt` object to `topicStepSchema`. The existing concept-level `quest` stays as it is.

```
tryIt: {
  title,            // "Draw your water bottle from 3 angles"
  minutes,          // 10..20 (bounded in RULES.tryIt)
  small,            // the 5-minute version, plain text
  needs,            // "paper and a pen" | "your voice" | "the phone camera" (shown on the card; never "buy")
  check: { stem, options },   // next-day self-check, 2-4 options + "Not sure"
  safety?,          // e.g. "Ask before you film anyone."
  sourceRefs        // ≥ 1, same accuracy gate as every claim
}
```

A 7-day track = one topic module with 3 concepts of 3 + 2 + 2 steps, which fits the current `steps` min 2 / max 3.
`validate-packs` checks: minutes in bounds, `sourceRefs` resolve, no gear-buying words, banned-words and copy-lint.
No Dexie migration: Try-it facts go in the existing `ledger` table and the quest row in the existing `quests` table.

## 3. Discovery without a feed

| Way in | When | What it shows | Limit |
|---|---|---|---|
| First run | The interests step that already exists (`INTERESTS`) | Add two interests: `sing` ("Singing", small version "Hum one song") and `video` ("Making videos", small version "Film 5 still shots"). Choosing `art`, `sing` or `video` puts that track first in the pick. | None are pre-ticked |
| **Pick of 3** | A "Try something new" card on Plan, once there is no active track | Exactly 3 tracks (drawing, singing, videography), in a fixed order with interests first. Each shows its first quest and "needs: paper and a pen". | 3 only. No "more", no scroll, no "because you liked". One track active at a time. |
| A finished creativity side quest | After "Make 5 quick sketches", "Take 10 photos on one theme" or "Edit a 30-second video" is done | One line under the finish: "There is a 7-day drawing starter, if you want it." | Shown once per track, ever |
| App pause swap | Night pause over a feed app (opt-in, DECISIONS 2026-10-20) | If a track is active, `boundedSuggestion` offers that day's quest ("Draw your mug, looking up often. 10 min.") instead of the generic line. | One line, same as today |
| Soft day | Only for someone who **already** has an active track | Tired → option 3 "Do one tiny task" pre-fills the track's 5-minute version. The person can still type their own. | The list stays fixed at 3 (spec 15). A soft day never introduces a new hobby, because it is meant to be small. |
| Plan | Optional "Add to today's plan" on the quest card | Creates an S task with the quest title | Off by default |

Why 3: it matches the 3 side quests a week (`selectWeekly` count 3) and the soft-day maximum of 3. The evidence that
fewer options help is weak. In a meta-analysis of choice overload, Scheibehenne, Greifeneder & Todd (2010) report:
"we found a mean effect size of virtually zero but considerable variance between studies"
(https://ideas.repec.org/a/oup/jconrs/v37y2010i3p409-425.html). So 3 is a design choice for calm and consistency,
not a number from research.

## 4. Low-energy days

| Track | Full quest | Small quest (5 min) | Fit on a tired day |
|---|---|---|---|
| Drawing | 10-20 min, sitting | One object, one angle | Good: quiet, seated, needs no light setup |
| Singing | 10-15 min | Hum one line of a song you know, quietly | Good if humming. A hostel at night: humming only. |
| Videography | 15-20 min, moving around | One 10-second still shot from where you sit | Weak: needs light and moving. The small version is the only one offered on a soft day. |

- **Small counts as done.** It writes the same fact with `size: 'small'`, taps the weekly quest the same way, and moves
  to the next day. There is no "half done" label.
- **Never a new lesson on a soft day.** Only the active track's small quest shows, through the soft card (§3).
- **Evidence that the first session should feel good, not hard.** Woolley & Fishbach (2017): "immediate rewards (e.g.,
  enjoyment) predicted current persistence at New Year's resolutions whereas delayed rewards did not"
  (https://pubmed.ncbi.nlm.nih.gov/27899467/). This is why day 1 of every track is easy and finishes in one sitting.
- **Beginners are not at a disadvantage.** In a 45-minute art-making study, "There were no significant differences in
  outcomes based on prior experiences with art making, media choice, or gender" (Kaimal, Ray & Muniz 2016,
  https://pubmed.ncbi.nlm.nih.gov/27695158/). That study measured cortisol. NANDI copy must **not** say drawing lowers
  stress (no health promises). The study is used here only to say that beginners can take part.
- **Creative days and the next day.** In a 13-day diary study of 658 young adults, people reported "higher activated
  PA and flourishing following days when they reported more creative activity than usual" (Conner, DeYoung & Silvia
  2018, https://experts.umn.edu/en/publications/everyday-creative-activity-as-a-path-to-flourishing/). This is
  correlational, and Job 6 covers the wellbeing evidence in depth.

## 5. What is saved, and what is not

| Item | Where it lives | NANDI stores | Leaves the phone? |
|---|---|---|---|
| Drawing | Paper. Optional photo in the phone's own gallery | Nothing | No |
| Singing recording | Phone's own voice recorder | Nothing | No |
| Video clips | Phone's own camera roll | Nothing | No |
| Quest done | Ledger fact `tryit-done`, id `tryit:<trackId>:<stepId>` | `size: 'full' \| 'small'`, `offPhone` band (asked), `note` ≤ 80 chars, `afterBedtime` | No. It is in the backup file like every ledger row. |
| Self-check | Ledger fact `tryit-check`, id `tryit-check:<stepId>` | `pick` (an option id or `skip`) | No |
| Active track | Settings row `tryit.active` = `{ trackId, startedOn }` | Track id and start day | No |

- NANDI asks for **no** camera, microphone or storage permission for Try-it. The quest card says "Use your camera
  app", "Use your voice recorder". It does not open them.
- Both fact ids are idempotent, so a second tap or a sync never doubles a fact. Facts are never edited. A changed note
  is a new `tryit-note` fact; the latest one is shown.
- A note is personal data. Add one line to the DPDP notice (due before 13 May 2027, see DECISIONS 2026-10-22). There is
  no AI, so nothing reads or judges a drawing or a voice.
- Sharing is never asked for and never rewarded (the same rule as spec 15 E).

## 6. Rewards and caps

### 6.1 Rewards

| Moment | Reward | Rule it follows |
|---|---|---|
| Lesson step done | 15 XP if it is the day's first paid lesson | Existing `mind.lessonXp` 15, `lessonsPaidPerDay` 1, `mind.dailyCap` 80, 0 after bedtime |
| Quest done (full or small) | **0 XP.** A calm finish line: "Done. That was 15 minutes of your own." | New kind; `replayFactXp` already returns 0 for an unknown mode, so no economy code changes |
| Weekly Try-it side quest | 20 XP once, when 3 Try-it days are done in the ISO week | Existing `quests.sideQuestXp` 20, paid once per `quest:<id>:<week>` |
| Self-check | 0 XP. It just saves. | — |
| Day 7 done | A fixed finish: "Seven tries done. Day 1 and day 7 are in your gallery. Put them side by side." plus **You can stop here.** | Optional (ask Jenil): one fixed courtyard object per finished track, derived from facts and never removed (spec 12 style) |

There are no random rewards, no mystery boxes and no rare drops. Every amount is fixed and shown before it is earned.
Nothing is taken away when someone stops a track. A track can be paused or dropped with one tap ("Stop this track"),
with no confirm dialog that asks "Are you sure?".

### 6.2 How it fits the side-quest and XP caps

The Try-it weekly quest is an ordinary `Quest` row: `sourceId: 'tryit-<trackId>'`, `kind: 'total'`, `target: 3`,
`unit: 'Try-it days'`, `step: 1`, `custom: false`, `id: 'tryit-<trackId>:<isoWeek>'`. Each `tryit-done` fact calls
`applyTap(quest, factId, 1)`, so the fact id is the `tapId` and a repeat tap does nothing. When a track starts in a
week whose 3 suggestions include an untouched one, that one is set to `swapped`. This does not use the person's own
weekly swap. If none is untouched, the Try-it quest waits until next Monday's pick, and the track still runs. Unfinished
Try-it quests archive at the week change like any quest (`archivePast`), with no penalty.

| Window | Most XP from Try-it | Notes |
|---|---|---|
| One day | 15 (lesson) | Only if no other lesson was paid that day. The quest itself is 0. |
| One ISO week | 20 (side quest) + lessons already inside `mind.dailyCap` | **New XP that did not exist before: 20 a week at most** |
| One 7-day track | ≤ 7 × 15 lesson XP (shared with other topics' lesson slot) + 20 or 40 quest XP (1 or 2 ISO weeks) | A track that spans a Monday can fill 2 weekly quests only if 3 days fall in each week |
| Optional plan task | + 10 (S task), inside `tasks.dailyCap` 200 | Off by default. If on, it fills the Hat-trick task slot like any planned task. |

What Try-it does **not** do:
- It does not mark the day for the streak by itself. The marking paths stay as they are in `deriveEconomy` (`mark`
  = planned task, body, Mind slot or soft). One reason is that a hobby should not become streak homework. The other
  is that the soft day already covers the "I only did something small" day.
- It is not a Hat-trick slot.
- It does not enter the daily-quest pool in `gamify.ts`.

New rules block in `src/core/rules.config.ts` (numbers only, no XP):
`tryIt: { questTarget: 3, minutesMin: 10, minutesMax: 20, smallMinutes: 5, noteMaxChars: 80, checkOpenDays: 3, tracksActive: 1, picks: 3 }`,
with `RULES_BOUNDS` entries (e.g. `tryIt.questTarget` [1, 7], `tryIt.tracksActive` [1, 1], `tryIt.picks` [1, 3]).

### 6.3 Gap found: custom side quests can be farmed

`addCustom()` has no limit. Each custom quest has a fresh ULID `id`, so `completionFactId` is unique, and
`calculateQuestXp` pays `sideQuestXp` 20 for each. Ten one-tap custom "once" quests = 200 XP and the same in Season
points, in a minute. DECISIONS (2026-10-11) chose "unlimited custom quests", but it does not say they all pay. Fix
before Try-it ships: pay at most N custom completions per ISO week (proposal: `quests.paidCustomPerWeek: 3`; the rest
are done but unpaid, and the copy says so plainly). Apply it forward from its `effectiveFrom` so no past XP changes.

## 7. 7-day starters: DRAFT FOR EDITORS

Everything in this section is a **DRAFT FOR EDITORS**. The content team rewrites it into NANDI's pack format and runs
the accuracy gate (spec 09). Teach lines are drafts of the ≤ 30-word card.

Evidence grade: **A** = experiment or meta-analysis directly on the claim. **B** = peer-reviewed but indirect, lab-only
or a review. **C** = university teaching guide or named expert practice, not tested. **D** = no source found.

**No source shows visible progress in 7 days for any of the three hobbies.** What exists:
- Drawing: an art course improved figure drawing over a term. Schlegel et al. (2015) report that "the art students
  improved in their ability to sketch human figures from observation" (https://pubmed.ncbi.nlm.nih.gov/25463452/).
  Gaze frequency changed accuracy within one session (Cohen 2005, below).
- Singing: slowing down changed accuracy at once (Dalla Bella 2007). One 20-minute training session helped too
  (Berglin et al. 2022).
- Videography: no outcome studies, only teaching practice.

So day 7 copy says "put them side by side", never "see how much better you got".

### 7.1 Drawing (needs: any paper and a pen or pencil)

| Day | Idea (teach draft) | Off-phone quest: full / small | Next-day self-check | Source | Grade |
|---|---|---|---|---|---|
| 1 | **Draw what you see, not what you know.** Most drawing mistakes start in the eye, not the hand. Our idea of "a bottle" takes over from the bottle in front of us. | Draw your water bottle from 3 angles: standing, from above, lying down. 15 min. / Small: one angle, 5 min. | "Which of the 3 looks most like the bottle?" (1 / 2 / 3 / not sure) | Chamberlain & Wagemans 2016 review, building on Cohen & Bennett 1997: "accurate perception of the subject and of the drawing is at the heart of drawing proficiency". It also names "negative categorical schemas, which distort the drawn image by replacing perceptual content with labels or canonical percepts" (https://research.gold.ac.uk/20010) | B |
| 2 | **Look little, look often.** Glance at the object for every line. Short looks, many times. In experiments, more glances meant more accurate drawings. | Draw a mug or a slipper. Make a small tick at the edge of the page each time you look up. Aim for 30 ticks. 10-15 min. / Small: 10 ticks. | "Did looking up more feel slower, easier, or both?" | Cohen 2005: "Experiments 2, 3, and 4 demonstrated that gaze frequency directly influences drawing accuracy" (https://pubmed.ncbi.nlm.nih.gov/16396008/) | A (lab) |
| 3 | **Check the drawing, not only the object.** We also misjudge our own drawing. Hold it next to the object, step back, fix one thing. | Redraw yesterday's object. Then hold the page beside it at arm's length and fix the one part that looks most off. 15 min. / Small: just the check-and-fix on yesterday's drawing. | "What did you fix: size, angle, or shape?" | Chamberlain & Wagemans 2016: "misperception of one's drawing plays a greater role than Cohen and Bennett (1997) … initially concluded" (https://research.gold.ac.uk/20010) | B |
| 4 | **Big shape first.** Draw the outside shape first, then the parts inside it. Splitting what you see into simple shapes helps. | Draw a shoe or a chair 3 times, 3-4 min each, outline first every time. / Small: one outline. | "Which of the 3 outlines is closest?" | Chamberlain & Wagemans 2016 on "positive pictorial schemas, which help the artist to segment the visual scene in systematic ways that aid depiction" (https://research.gold.ac.uk/20010). Indirect: the review does not test this exercise. | B/C |
| 5 | **Angles fool everyone.** Our eyes bend slopes and corners. Hold a pen at arm's length along an edge and copy that slant. | Draw the corner of a door frame or a bed, checking each slope with the pen. 15 min. / Small: one corner. | "Was the real angle steeper or flatter than you first drew it?" | That angle errors follow perception biases: Cohen (2015), "Observational drawing biases are predicted by biases in perception", cited in the Chamberlain & Wagemans reference list. Only the title was read; the paper was not opened. The pen-at-arm's-length check: **no study found.** | C/D |
| 6 | **Test a myth.** A popular trick says copy a picture upside down. One study found it did not improve accuracy. Try both and see. | Copy a simple line picture (a textbook diagram, a logo) once upright and once upside down. 15 min. / Small: half of each. | "Which copy is closer to the original?" | Chamberlain & Wagemans 2016: studies "found either no impact of inverting an image on drawing accuracy (Cohen & Earls, 2010), or a small positive effect when observers with artistic expertise were asked to judge the drawings" (https://research.gold.ac.uk/20010) | B |
| 7 | **Same bottle, one week on.** Draw day 1's bottle again, using looks, checks and big shapes. Put both side by side. | Redraw the bottle from the angle you liked on day 1. 15 min. / Small: 5 min. | "Which one looks more like the bottle?" (day 1 / day 7 / about the same) | Progress over a term: Schlegel et al. 2015 (above). Over one week: no source. | C |

### 7.2 Singing (needs: your voice. Hostel: hum, and pick a time when others are awake.)

| Day | Idea (teach draft) | Off-phone quest: full / small | Next-day self-check | Source | Grade |
|---|---|---|---|---|---|
| 1 | **You are probably not tone deaf.** About 1 in 6 students call themselves tone deaf, yet tests found many hear pitch fine. Singing in tune is about linking ear and voice. | Hum or sing a song you know well, twice. Record it in your phone's voice recorder (not NANDI). 10 min. / Small: hum one line. | "Listen once. Which part felt easiest?" (start / middle / end / none) | Cuddy et al. 2005: "Nearly 17% of over 2,000 first-year psychology students at Queen's University self-reported tone deafness" and "many individuals who consider themselves "tone-deaf" may not, in fact, have perceptual difficulties" (https://pubmed.ncbi.nlm.nih.gov/16597781/). Pfordresher & Brown 2007: "10-15% of the participants imitated pitch at least one semitone off"; the cause is a "mismapping of pitch onto action" (https://researchconnect.buffalo.edu/en/publications/poor-pitch-singing-in-the-absence-of-tone-deafness/) | A |
| 2 | **Slow down.** Casual singers slip most when they go fast. At a slow tempo, most sang about as accurately as professionals. | Sing yesterday's song at half speed, 3 times. 10 min. / Small: one slow verse. | "Slow or normal: which felt surer?" | Dalla Bella, Giguère & Peretz 2007: "The variance in singing proficiency was largely due to tempo differences" and, at a slow tempo, "most of the occasional singers sang as accurately as the professional singers" (https://pubmed.ncbi.nlm.nih.gov/17348539/) | A |
| 3 | **Match your own voice first.** Copying your own recorded note is easier than copying a synthetic tone. Start with you. | Hum one easy note for 3 seconds and record it. Play it, then hum to match. 5 rounds. 10 min. / Small: 2 rounds. | "Did your match get closer by round 5?" (yes / no / not sure) | Hutchins & Peretz 2012: "nonmusicians were better at matching their own voice than a synthesized voice timbre" (https://pubmed.ncbi.nlm.nih.gov/21875245/). The same paper found that "singers do not improve over multiple sung responses, or with the aid of a visual representation of pitch", so round 5 may not beat round 1, and the check says that is normal. | B |
| 4 | **Known songs first.** Familiar tunes are easier than new ones. Build on a song you already know by heart. | Pick a song you knew as a child or from a film. Sing verse 1, slowly. 10 min. / Small: 2 lines. | "Known song or new song: which was easier?" | Pfordresher et al. 2010: "performance differences across groups of singers were greater for the imitation of unfamiliar tone sequences than for the recall of familiar melodies" (https://pubmed.ncbi.nlm.nih.gov/20968388/) | B |
| 5 | **Try one line without the track.** For some beginners, singing over a full track makes pitch harder, not easier. | Sing one line alone, then the same line along with the song. 3 times each. 10 min. / Small: once each. | "Alone or with the track: which felt surer?" | Pfordresher & Brown 2007 (summary page): poor-pitch singers were hindered rather than helped by accompaniment (https://researchconnect.buffalo.edu/en/publications/poor-pitch-singing-in-the-absence-of-tone-deafness/). Lab task, poor-pitch singers only. | B |
| 6 | **Same note, three times.** Most people wobble a little on repeated notes. That is normal. Aim to land one note the same way 3 times. | Hum the first note of your song 3 times, record, listen. Repeat with the second note. 10 min. / Small: one note. | "Were the three the same?" (same / close / different) | Pfordresher et al. 2010: "a majority of participants could justifiably be categorized as imprecise singers" (https://pubmed.ncbi.nlm.nih.gov/20968388/) | B |
| 7 | **Day 1 and day 7.** Record the day 1 song again: slow, known, in a key that feels easy. Listen to both once. | Record the song. 10 min. / Small: one verse. | "Which felt surer to sing?" (day 1 / day 7 / same). It asks how it felt, not whether it was in tune, because people judge voice pitch less well than tones (Hutchins & Peretz 2012, Exp. 5). | One 20-min feedback session: "There was a general improvement from pretest to posttest across all groups", but "the effect of training was only significant for participants who received visual feedback training" (Berglin, Pfordresher & Demorest 2022, https://researchconnect.buffalo.edu/en/publications/the-effect-of-visual-and-auditory-feedback-on-adult-poor-pitch-re/). Over one week: no source. | C |

Not built on purpose: a live pitch-tracker screen. Berglin et al. (2022) found visual feedback helped in one session,
while Hutchins & Peretz (2012) found a visual pitch display did not help in their tasks. Either way, a pitch tracker
keeps the phone in front of the face, which defeats the point of an off-phone quest.

### 7.3 Videography (needs: the phone camera you have. NANDI does not open the camera.)

The camera app is one swipe from a feed app. Every quest card says: "Camera app only. Close it after the last shot."
The App pause still runs as usual.

| Day | Idea (teach draft) | Off-phone quest: full / small | Next-day self-check | Source | Grade |
|---|---|---|---|---|---|
| 1 | **Hold still.** Shaky shots are the first thing viewers notice. Rest the phone on something solid and hold each shot 10 seconds. | Film 5 shots of your room or street, phone resting on a stack of books or a bottle, 10 seconds each, no moving. 15 min. / Small: one 10-second shot from where you sit. | "Which shot is steadiest? What held the phone?" | Baruch College (CUNY) Advanced Video Journalism: "Record a steady shot for at least ten seconds before you stop recording" (https://blogs.baruch.cuny.edu/advancedvideojournalism/?p=22). University of Reading: "Use a tripod to secure your phone in place and make your shots stable and balanced" (https://www.reading.ac.uk/research-innovation-hub/communications-engagement-and-impact/research-communications/filming-on-your-phone) | C |
| 2 | **Light in front.** Put the brightest light in front of your subject, not behind. A window behind turns faces dark. | Film an object, or a friend who said yes, once facing a window and once with the window behind. 3 pairs. 15 min. / Small: one pair. | "Which version shows the face or object better?" | Reading: "Position your subject so that the brightest light is shining on them head on, not from behind" (URL above) | C |
| 3 | **Walk closer, don't zoom.** Digital zoom blurs the picture. Move your feet instead. | Film one thing 3 ways: wide, after walking closer, then a close-up of a detail. 10-15 min. / Small: wide and close. | "Zoomed or walked closer: which is sharper?" | Reading: "it's better to physically move closer to your subject instead of using the digital zoom on your phone, which lowers the quality of the image" (URL above) | C |
| 4 | **Sound counts.** When audio is poor, people judge the speaker and the content as worse. Film where it is quiet, with the phone near the voice. | Say one sentence to the camera in a noisy spot and in a quiet one, at an arm's length and at a hand's length. 10 min. / Small: one noisy, one quiet. | "Which one would you rather listen to?" | Newman & Schwarz 2018, two experiments (reported by ANU via ScienceDaily): "Those who listened to the poorer quality audio consistently evaluated the scientists as less intelligent" (https://www.sciencedaily.com/releases/2018/04/180413093842.htm). Reading: "Try to find a quiet place to film" (URL above) | A (on how viewers judge); C (the tip itself) |
| 5 | **Five shots show an action.** To show someone doing something, film hands, face, a medium shot, over the shoulder, and one creative angle. | Film someone making chai or tying laces. **Ask first.** Or film your own hands, with the phone propped up. 20 min. / Small: hands + face only. | "Which of the 5 tells the most?" | Baruch College Multimedia Reporting (2017): "Close-up on the hands." "Close-up on the face." "Medium shot." "Over the shoulder shot." "One additional creative angle.", "a useful framework for thinking about depicting an activity clearly and engagingly with video" (https://blogs.baruch.cuny.edu/multimediafall2017/?p=572) | C |
| 6 | **Thirds is a habit, not a law.** A study of highly rated photos and paintings found the rule of thirds played little or no role. Try both and pick. | Shoot the same subject centred and on a third line, 3 pairs. 10 min. / Small: one pair. | "Which of each pair do you like more?" (No right answer.) | Amirshahi et al. 2014: "aesthetic rating scores correlated only weakly with subjective ROT scores and not at all with calculated ROT values" and "the rule of thirds seems to play only a minor, if any, role in large sets of high-quality photographs and paintings" (Art & Perception 2: 163-182, PDF at https://uniklinikum-jena.de/anatomie1_media/Inhalte/AmirshahiARTP2014-font-1.pdf) | B |
| 7 | **Edit in the camera.** Plan 6 shots, then film them in order, so the clip needs no editing app. Hold, light in front, closer, quiet. | Film a 30-60 second clip of one routine (making tea, packing a bag) as 6 held shots in order. Watch it once. 20 min. / Small: 3 shots. | "Which shot would you keep for next time?" | Combines days 1-5. No outcome study found. This also replaces the existing pack quest "Edit a 30-second video" with a version that needs no editing app. | C |

Safety and consent for videography: never film people without asking. Do not film in shared washrooms or in other
people's rooms. Posting anything is never asked for. Anything shown in "Show me" uses a drawn example, not a real person.

### 7.4 Gear and paid courses

None of the 21 quests needs anything bought. Paper, a pen, a voice and the phone already owned are enough. The pack
validator should reject words like "buy", "tripod kit", "ring light", "course", "subscribe", and links to shops or paid
classes. The Videography day 1 copy says "a stack of books", not "a tripod". The Reading guide recommends a tripod, and
the copy deliberately does not pass that on.

## 8. Kill test

Measured on the phone and shown in the owner panel (local numbers only, the same model as spec 15 §6). Two weeks for
Jenil and any testers. With so few people, read these as direction, not proof.

**Asked, not tracked.** After each quest NANDI asks once: "About how long were you off the phone?" The answers are
**Under 10 min · 10-20 · 20-40 · 40+ · I kept using it**. That is the only time measure. NANDI must not use the App
pause's Usage access for this; that permission was granted for the night pause only. Self-reports are rough. In a
meta-analysis of 106 effect sizes, "self-reported media use correlates only moderately with logged measurements"
(Parry et al. 2021, https://pubmed.ncbi.nlm.nih.gov/34002052/). So compare each person with themselves over time, and
do not read the answers as minutes.

| # | Question | Measure | Keep if | Cut or change if |
|---|---|---|---|---|
| 1 | Do people actually leave the phone? | Share of done quests answered 10-20 or more | ≥ 60% | < 40%, or "I kept using it" > 20%. The quests have become screen tasks; rewrite them or drop videography first. |
| 2 | Does the app stay short? | Median minutes in NANDI on a Try-it day minus the person's median on other days | ≤ +3 min (the lesson is about 2) | > +5 min. Try-it has become a session. Cut the lesson to the teach card only. |
| 3 | Do they reach day 7? | Starters who finish day 7 within 14 days of day 1 | ≥ 40% | < 25% reach day 4. Day 1-3 quests are too long or too hard; try the small versions as the default. |
| 4 | Do they come back to the hobby? | On day 14 (or 7 days after day 7), one question: "Did you draw / sing / film this week without NANDI asking?" (yes / a bit / no) | ≥ 30% yes or a bit | < 15%. The track is a checklist, not a hobby. Keep only the pick of 3 and the App pause swap. |
| 5 | Does it push out the plan? | Planned tasks done per active day, Try-it days vs other days | No drop beyond normal week-to-week change | Planned-task completion drops on Try-it days. Show the pick of 3 only after Plan's first task is done. |
| 6 | Does it feel like homework? | Jenil, after one full track: "Did this feel like something you wanted to do, or a chore?" | "Wanted to" | "Chore". Remove the weekly quest XP link and keep the track reward-free. |
| 7 | Do the self-checks help? | Self-check answer rate | ≥ 50% | < 25%. Drop the self-check; keep "put them side by side" on day 7 only. |

## 9. What to build, if Jenil says yes

1. Fix the custom-quest farm (§6.3) with a forward-only rule.
2. `topicStepSchema.tryIt` (optional) and its validator checks; one pack topic "Try it" with 3 modules (drawing,
   singing, videography), each 3 concepts of 3 + 2 + 2 steps.
3. `RULES.tryIt` numbers and their `RULES_BOUNDS`.
4. Core (test-first, Vitest): `src/core/tryit/` with `nextTryDay`, `selfCheckDue`, `tryItQuestFor(week)`, and the
   kill-test numbers. Pure functions over ledger rows, no Dexie.
5. Repo: write `tryit-done` / `tryit-check` facts; tap the weekly quest in the same Dexie transaction as the fact.
6. UI: the pick-of-3 card, the quest card (with small version), the next-day check, and the day-7 finish. No timer
   screen.
7. Interests `sing` and `video`; the App pause swap uses the active quest.
8. Backup round-trip test with Try-it facts and a `tryit.active` settings row. No Dexie version bump is needed.

**Product trade-offs for Jenil:**
- Should a track take one of the week's 3 side-quest slots, or sit beside them?
- Should a finished track add a courtyard object?
- Should singing and video be added to first-run interests?

## 10. Sources that could not be opened, or were read second-hand

| Source | What happened | How it is used |
|---|---|---|
| Cohen & Bennett 1997, JEP:HPP 23(3) | Original not opened | Only through the Chamberlain & Wagemans 2016 review (opened: Goldsmiths accepted manuscript PDF) |
| Cohen & Earls 2010, Psychology of Aesthetics 4(3) | Original not opened | Only through the same review |
| Cohen 2015, angle illusions | Only the title, in the review's reference list | Day 5 drawing, graded C/D |
| Pfordresher & Brown 2007, Music Perception 25(2), PDF at acsu.buffalo.edu | HTTP 503 | Abstract read on the University at Buffalo research page instead |
| University of Exeter "Filming with your phone" PDF | HTTP 404 | Not used |
| Berkeley Advanced Media Institute mobile media agenda PDF | Opened. It only lists topics ("Three pillars of good visual shots: stability, composition and lighting"). | Not quoted as guidance |
| Amirshahi et al. 2014, Jena bibliography page | Page empty | The PDF on uniklinikum-jena.de was opened and quoted |
| PubMed web pages | Cookie wall | Abstracts read through the NCBI E-utilities API (same records, same PMIDs) |
| Newman & Schwarz 2018, Science Communication 40(2) | Journal page not opened | ScienceDaily / ANU release quoted |

YouTube channels and self-help blogs were not used as evidence. The Singing Carrots blog showed up in one search; it
reports its own uncontrolled app data, and it was not used.
