# Spec 23 · Learn at Duolingo level, measured

Status: DRAFT v2 for Jenil (idea engine, 24 Oct 2026; numbers corrected after Codex A's code check). Not approved.

Jenil (24 Oct): Phase 1 says learning should be at least at Duolingo's level by now. He judges it at about 50%.
Spec 11 built the pull mechanics: quests, badges, combo, focus boost, trail, Gold review, the cast and the owner
panel are all on main. So what is missing is no longer a features list. It is how a lesson **feels while you do it**,
and how much there is to learn. This spec names the measured gaps, fixes them, and replaces "50%" with a scorecard
we can re-run.

## What Duolingo does that we can measure (sources)
- Lessons are **learn by doing**: interactive exercises, not reading ([Duolingo method](https://blog.duolingo.com/duolingo-teaching-method)).
  A lesson takes about 3-4 minutes (a secondhand estimate, not official).
- **Difficulty stays in the middle band.** Birdbrain predicts whether you will get each exercise right, and the session
  generator avoids exercises that are too easy or too hard ([Birdbrain](https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain),
  [IEEE Spectrum](https://spectrum.ieee.org/duolingo), [Bicknell interview](https://indiaai.gov.in/article/duolingo-s-klinton-bicknell-on-ai-creating-high-quality-learning-experiences)).
- **Smart Tips** appear in a lesson after certain mistakes (same sources).
- **Path order uses spaced repetition**: new material mixed with review. The daily aim is 15 minutes of learning, not
  a session count ([time spent learning well](https://blog.duolingo.com/time-spent-learning-well)).

## Where NANDI stands (measured on main a6c21b7 and batch 3, 23 Oct)
| Area | NANDI now | Gap |
|---|---|---|
| Doing vs reading | A new lesson = hook guess, teach card (reading), Show me tap, **1 guided try** (the schema allows 2, but `StepLesson.tsx:37` shows only the first), plus 0-3 questions from earlier days. A practice-only drop asks 5. | **3-6 answers** in a new-lesson session. Duolingo is mostly answering. |
| Difficulty band | **118 of 162 guided tries (73%) can be answered without the teach card** (cj3-guided-tries). An Elo model exists (`learn/engine/model.ts` `predictedSuccess`), but `practiceTail` picks by wrong/new/due, never by predicted success. | Too easy. Birdbrain's core idea is not used, although our model can already compute it. |
| Question types | The schema has 10 practice types, all present in the packs. Most are tap-to-choose (predict, scenario, true-not-quite, why, choose; even "fill the step" is a choice). Also a slider estimate, order and match (match was unanswerable until ship-33). How many types a learner meets per week is not measured yet. | No build-the-answer, no tap-the-word, no quick round, no tap-the-spot. |
| Mistake help | "See the idea again" opens the teach card. Only **219 of 600** wrong practice options carry an option-level misconception id; the field is optional. | Close to Smart Tips, but not aimed at the specific mistake, and the data to aim it is two-thirds missing. |
| Volume | 54 concepts, 162 lessons (steps), 324 practice items across 6 topics. One new lesson a day = **24 or 30 days per topic**. | A Duolingo course has thousands of lessons. Our topics run out within a season. |
| Stories | Tales (spec 11, W3b) were never built. | Missing. |
| Feel defects | The feedback sheet hid the right answer on 20 lessons, and duplicate ids hid the Health sleep lessons (both fixed in ship-33). **No mid-lesson resume:** lesson answers live in component state and are saved only at the end (`learn-engine.ts:58`), so closing the app partway restarts the lesson, despite spec 09's resume promise. | Polish problems make a lesson feel cheap. |

## The changes
### 1. More doing per lesson (the biggest gap)
- A new-idea lesson becomes: hook guess -> teach card -> Show me -> **3 tries** of rising difficulty (guided with a hint,
  then a twist, then a transfer to a new Indian situation with the hint hidden) -> a **3-question** mixed recap of earlier ideas.
- Target: **8-10 answers in 3-4 minutes**, with the first tap within 5 seconds of opening.
- Code: `guided` max goes from 2 to 3, StepLesson sequences all tries, and the transfer try hides the hint.
- **Rule decision needed:** spec 16's code rule allows at most 3 tests of one claim, *counting* the hook and Show me.
  Three tries break it. Proposal: the twist and transfer tries must test a **different claim of the same step** or a new
  situation, and the rule becomes "at most 3 tests of one claim *with the same situation*".
- The teach card stays at 30 words or fewer. Show me stays. Reading time goes down as a share of the session, not up.
- Content cost: 2 more tries per step (324 new items over the 162 steps). This uses the 111 distractor swaps and
  9 new stems from cj3 first.

### 2. The middle band, offline (our Birdbrain)
- `practiceTail` keeps its eligibility rules, its tier order (wrong -> never asked -> spaced right), spacing and
  interleaving (spec 16 §6). **Inside each tier**, it ranks eligible items by how close `predictedSuccess` is to 0.75.
  The band must never pull an untaught or same-day step forward.
- The three new-lesson tries are a fixed, tested easy-to-transfer progression, not picked by the model: guided items
  have no item ratings yet.
- The guided try may sit higher (0.85-0.95, spec 14's "the card should make it easy") **only if** the card is needed:
  a try that 3 of 5 testers answer right without the card is rewritten. That is cj3's rule, made a content gate.
- Owner panel: first-try correct rate per lesson part. Alarm if a topic's practice sits above 90% for a week.

### 3. Three new question types and one session format (each fully offline)
| Type | What you do | Why |
|---|---|---|
| Build it | Tap chips in order to build the answer ("₹1,000 · grows 10% · for 2 years = ?" -> chips) | Production beats recognition (generation effect). |
| Tap the word | Tap the one wrong word in a sentence ("Inflation means prices *fall* over time") | Fast, playful, and it finds misconceptions. |
| Quick round (a session format, not an item type) | 5 existing true/not-quite items back to back, no timer shown, a combo sound per right answer | Duolingo-like pace once a week, as the Gold review warm-up. |
| Tap the spot | Tap the part of a diagram (the Show me visuals already exist) | Reuses our visuals as questions. |
Each new type needs a schema, a UI input, grading and a validator answerability check: Build it needs chip ids and
sequence grading; Tap the word needs token boundaries in the stem; Tap the spot needs answer regions, which the
current diagram schema lacks. Every type gets the cj3 match-item style test: every item is answerable through the UI
input model.

### 4. Mistake help that targets the misconception
- Every wrong option already carries `misconceptionTags`. After a wrong pick, show the one-line fix for **that**
  misconception (from the concept's `misconceptions` field) before "See the idea again".
- Content work first: give **every** wrong option a misconception id (381 of 600 have none) and add the 18
  misconceptions cj3 found unlisted. Then make the field required in the validator.

### 4b. Resume a lesson mid-way
- Save each lesson answer as it happens (a draft row, cleared at the finish), so closing the app mid-lesson resumes at
  the same screen, as spec 09 promised. No XP is paid until the lesson finishes, as now.

### 5. Volume
- Each topic doubles to about 20 concepts (60 lessons, about 2 months) over Season 1 and 2, on the existing editorial
  and fact-check pipeline. The cloud credit can draft and fact-check; editors approve.
- The life-skill tracks (spec 21, from batch 4) count toward volume. They are the content most likely to feel worth it.

### 6. Tales
- One 2-minute illustrated story per topic per month, with the cast and 3 questions inside (spec 11 W3b). It is built
  after 1-4, because a story with weak questions is still a weak lesson.

## The scorecard (replaces "50%")
Run it on the same phone, one Duolingo lesson against one NANDI new-idea lesson and one NANDI practice session. It is
re-run after each change ships. A cloud job can do the NANDI half automatically; Jenil does the Duolingo half
(10 minutes) and gives both the 1-10 ratings.
| # | Measure | Duolingo (Jenil measures) | NANDI now | Target |
|---|---|---|---|---|
| 1 | Answers per new-lesson session | | 3-6 | 8-10 |
| 2 | Seconds to the first tap | | | ≤ 5 |
| 3 | Share of time reading vs answering | | | answering ≥ 60% |
| 4 | First-try correct on practice | | not banded | 60-85% |
| 5 | Question types seen in one week | | not measured | ≥ 8 |
| 6 | Lessons left before a topic runs out | thousands | 24-30 | ≥ 60 |
| 7 | "Felt fun" 1-10 (Jenil) | | | ≥ Duolingo's |
| 8 | "Felt worth my time" 1-10 (Jenil) | | | > Duolingo's |
Kill test: if 1-4 hit target and Jenil's "fun" rating is still well below Duolingo's, the gap is feel (animation,
sound, cast reactions). Then the next spec is a feel pass, not more mechanics.

## Order (each step needs Jenil's yes and its own gate)
1. Scorecard baseline (no code; a cloud job measures the NANDI side, Jenil measures Duolingo).
2. Middle band + cj3 distractor swaps + misconception tagging + mid-lesson resume (2, 4, 4b). Small code, mostly content.
3. More doing per lesson (1).
4. The four new types (3).
5. Volume (5), continuous. Tales (6) after.

## Online later (offline-first, online-ready; Jenil 24 Oct)
- **Item difficulty from all learners.** One person's answers cannot rate an item well; Birdbrain's edge is millions
  of answers. v2 (with consent): upload anonymous (itemId, right/wrong, seconds) and fit item ratings across learners.
  The ratings ship back inside content packs, and the phone keeps choosing offline with them.
- **Lessons without an app update.** The pack updater (postponed to Phase 4) becomes worth building once other people use NANDI.
- **Friend practice.** v2: a weekly friend quiz on concepts you both learned (fixed reward, no league pressure).
- Learning must still work fully offline. Online only makes it better.

## Not doing
No hearts or lives, no timers that punish, no random rewards, no endless feed, no copying Duolingo's names, art or sound
(spec 11 §0). No server-side model in v1: the middle band uses the Elo model already on the phone (v2 calibrates item ratings online, above).
