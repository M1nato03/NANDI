# Spec 23 · Learn at Duolingo level, measured

Status: DRAFT for Jenil (idea engine, 24 Oct 2026). Not approved.

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
| Doing vs reading | A new lesson = hook guess, teach card (reading), Show me, **1 guided try**, plus up to 3 practice questions from earlier days. | About 2-5 answers per session. Duolingo is mostly answering. |
| Difficulty band | **118 of 162 guided tries (73%) can be answered without the teach card** (cj3-guided-tries). An Elo model exists (`learn/engine/model.ts` `predictedSuccess`), but `practiceTail` picks by wrong/new/due, never by predicted success. | Too easy. Birdbrain's core idea is not used, although our model can already compute it. |
| Question types | All tap-to-choose variants (predict, scenario, true-not-quite, why, choose), plus a slider estimate, order and match. Match was unanswerable until ship-33. | No build-the-answer, no tap-the-word in a sentence, no fast round, no image hotspot in questions. |
| Mistake help | "See the idea again" opens the teach card. | Close to Smart Tips. It does not target the specific misconception. |
| Volume | 54 concepts, 162 lessons, ~648 items across 6 topics. One lesson a day ≈ **27-30 days per topic**. | A Duolingo course has thousands of lessons. Our topics run out within a season. |
| Stories | Tales (spec 11, W3b) were never built. | Missing. |
| Feel defects | The feedback sheet hid the right answer on 20 lessons (fixed in ship-33). Duplicate ids hid the Health sleep lessons (fixed in ship-33). | Polish problems make a lesson feel cheap. |

## The changes
### 1. More doing per lesson (the biggest gap)
- A new-idea lesson becomes: hook guess -> teach card -> Show me -> **3 tries** of rising difficulty (guided, then a twist,
  then a transfer to a new Indian situation) -> a 2-question mixed recap of earlier ideas.
- Target: **8-12 answers in 3-4 minutes**, with the first tap within 5 seconds of opening.
- The teach card stays at 30 words or fewer. Show me stays. Reading time goes down as a share of the session, not up.
- Content cost: 2 more tries per step (324 new items over the 162 steps). This uses the 111 distractor swaps and
  9 new stems from cj3 first.

### 2. The middle band, offline (our Birdbrain)
- `practiceTail` and the new tries pick from the pool by `predictedSuccess` (the model that already exists), aiming
  at **0.6-0.85**: wrong-and-due items first, then the item closest to 0.75.
- The guided try may sit higher (0.85-0.95, spec 14's "the card should make it easy") **only if** the card is needed:
  a try that 3 of 5 testers answer right without the card is rewritten. That is cj3's rule, made a content gate.
- Owner panel: first-try correct rate per lesson part. Alarm if a topic's practice sits above 90% for a week.

### 3. Four new question types (each fully offline)
| Type | What you do | Why |
|---|---|---|
| Build it | Tap chips in order to build the answer ("₹1,000 · grows 10% · for 2 years = ?" -> chips) | Production beats recognition (generation effect). |
| Tap the word | Tap the one wrong word in a sentence ("Inflation means prices *fall* over time") | Fast, playful, and it finds misconceptions. |
| Quick round | 5 true/not-quite cards in 30 seconds, no timer pressure shown, a combo sound per right answer | Duolingo-like pace once a week, as the Gold review warm-up. |
| Tap the spot | Tap the part of a diagram (the Show me visuals already exist) | Reuses our visuals as questions. |
The pack schema, validator and both grade paths are extended. Every type gets the cj3 match-item style test: every
item is answerable through the UI input model.

### 4. Mistake help that targets the misconception
- Every wrong option already carries `misconceptionTags`. After a wrong pick, show the one-line fix for **that**
  misconception (from the concept's `misconceptions` field) before "See the idea again".
- The 18 misconceptions cj3 found unlisted are added first.

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
| 1 | Answers per session | | 2-5 | 8-12 |
| 2 | Seconds to the first tap | | | ≤ 5 |
| 3 | Share of time reading vs answering | | | answering ≥ 60% |
| 4 | First-try correct on practice | | not banded | 60-85% |
| 5 | Question types seen in one week | | ~6 | ≥ 9 |
| 6 | Lessons left before a topic runs out | thousands | ~27-30 | ≥ 60 |
| 7 | "Felt fun" 1-10 (Jenil) | | | ≥ Duolingo's |
| 8 | "Felt worth my time" 1-10 (Jenil) | | | > Duolingo's |
Kill test: if 1-4 hit target and Jenil's "fun" rating is still well below Duolingo's, the gap is feel (animation,
sound, cast reactions). Then the next spec is a feel pass, not more mechanics.

## Order (each step needs Jenil's yes and its own gate)
1. Scorecard baseline (no code; a cloud job measures the NANDI side, Jenil measures Duolingo).
2. Middle band + cj3 distractor swaps + misconception fixes (2 and 4). Small code, mostly content.
3. More doing per lesson (1).
4. The four new types (3).
5. Volume (5), continuous. Tales (6) after.

## Not doing
No hearts or lives, no timers that punish, no random rewards, no endless feed, no copying Duolingo's names, art or sound
(spec 11 §0). No server-side model: the middle band uses the Elo model already on the phone.
