# Cloud job 11 · Walking the new lessons as a learner

Branch `ideas/cj2-lesson-walk`. Batch 2, job 11. Date: 22 Oct 2026.

## Which build I walked, and why
- `origin/ship-27` (b17ec40) has the step-lesson engine (spec 14: `StepLesson.tsx`, `core/learn/steps.ts`).
  But only Psychology (10 ideas, 27 steps) and one Money idea (inflation, 3 steps) have steps there.
  The other 4 topics have no lessons at all, so there was nothing to walk in them.
- `origin/learn-steps` (cfbf387, ship-27 + 46 commits) has the spec 16 §5 lessons for all 6 topics:
  162 steps, each with 1 guided try, and 6 to 8 practice items per idea.
- So I walked **origin/learn-steps**. Every finding below is about that build. Most also hold for ship-27's Psychology.
  The exception is the practice tail: spec 16 changed it.

## Method
- Production build (`npx vite build`, no `VITE_E2E`), served with `vite preview` on port 5311. Headless Chromium 1194.
  Viewport 360×800 (a common budget Android size), touch on, light theme, `Asia/Kolkata`, `en-IN`.
- Each of the 6 topics was walked by a brand-new learner in a fresh browser context, with a real first run:
  - 18+ tick.
  - Psychology: the goal "Learn something" (it always opens Psychology).
  - Other topics: the goal "Get things done", then the Learn tab, Start, the topic picker, then "Start my first drop".
- The clock was mocked with `page.clock.setFixedTime`, at 7:30 pm IST on these days:
  - day 1: Thu 5 Nov 2026
  - day 2: 6 Nov
  - day 3: 7 Nov
  - day 8: 12 Nov (days 4–7 skipped, a learner who drifts off and comes back)
- Each day after day 1: open the app, tap the Learn tab, tap Start, then play the whole drop.
- Answers were mixed on purpose:
  - Hook guess wrong on days 1 and 3.
  - Show-me tap wrong on day 3.
  - Guided try wrong on day 2.
  - Every third practice question wrong (answered with "Check · Guessing").
  - Hint opened on days 1 and 8.
  - "See the idea again" opened once after a wrong answer.
- **291 screenshots**, one per screen state (before and after each answer). They are in `docs/reviews/cj2-lesson-walk/`.
  Names are `<topic>-d<day>-<nn>-<screen>.png`. They were reduced to 128-colour PNG8 (17 MB → 6.4 MB).
  `sheets/teach-a|b|c.png` are contact sheets of all 24 teach cards.
- Load: the machine is shared (4 CPUs). The load average was **4.3–7.6** during the walks and about 1.8 during the final check.
  The script's own timings are inflated by that load and are not human timings (see "Taps and time").
- Scripts are at the end of this file. Run `node walk.cjs [topic…]` with the preview server on :5311.

## The worst 15 moments (worst first)

| # | Topic · day · screen | Screenshot | What goes wrong | Fix |
|---|---|---|---|---|
| 1 | All 6 topics · days 1–8 · end of drop | `psychology-d3-10-stop.png`, `*-d1-*-stop.png` | **Too little practice.** In 8 days a one-topic learner answers **2 questions in total**: 0 on day 1, 1 on day 2, 0 on day 3 and 1 on day 8. Every day's "Your turn" leads to 1 question or straight to "Done". No topic asked any question about step 3 by day 8. Only 2 of 6 topics asked anything about step 2. The learner gets 4 lessons and almost no use of what they learned. The spec 14 aim of "your turn near 80%" cannot even be measured with this little data. | The tail takes "at most one question per idea" (`src/ui/learn/flow.ts:84-86`). While the learner has met fewer than 3 ideas, allow 2–3 items from the earlier steps of the same idea. Aim for 3 questions from day 2 on. |
| 2 | Psychology, Health, Body, History · day 8 · question | `psychology-d8-11-q-predict.png` (also asked on `psychology-d2-10-q-predict.png`) | **The same question twice.** Day 8 repeats the exact item from day 2 (`habits-9`, `protein-foods-9`, `progressive-overload-9`, `indus-cities-9`). Meanwhile 5 other taught items of that idea were never shown. Money and How things work did pick a different item. | When choosing a review item, prefer items of taught steps that have never been asked over re-asking one already answered. |
| 3 | Money · day 3 · teach card | `money-markets-d3-05-teach.png` | **The diagram cannot be read.** The scale labels run into one string: "2%: lower limit4%: target6%: upper limit", printed over the bar. Health day 3 is the same: the labels "54 g: the daily need" and "60 to 70 g…" overprint each other (`health-nutrition-d3-05-teach.png`). | Draw the scale marks as a short list under the bar, or put them above and below the bar in turn. Add a validator rule for mark spacing and label length (`src/ui/learn/learn.css:262`, `StepLesson.tsx:21`). |
| 4 | How things work · day 3 · teach card | `how-things-work-d3-05-teach.png`, `how-things-work-d3-PROBLEM-1.png` | **The scale label is cut off and the page gets wider.** "2x speed: 4x l…" runs off the card. The layout viewport grew to **373 px on a 360 px phone** (measured `innerWidth`). Playwright's mouse click on Continue then hit the wrong spot and timed out. A touch tap still worked. This breaks the "no horizontal scroll" rule. Body day 3 (`body-training-d3-05-teach.png`) spills off both sides ("10%: 200 to 220 minutes, safer" / "50%: 40 to 60 minut…"). | Same fix as #3. Keep each mark's label inside the bar (`clamp` instead of a plain `translateX(-50%)`). A static estimate flags **26 of 35** scale diagrams in the packs (list below). |
| 5 | All topics · last answer of the drop · feedback sheet | `psychology-d8-13-fb-wrong.png`, `psychology-d8-14-idea-again.png`, `money-markets-d2-12-fb-right.png` | **A reward toast covers the explanation.** The finish toast ("A new badge tier", "+30 XP · Welcome back. Here is a small gift…") lands on top of the feedback sheet. On day 8 it covers the "Right answer" line and the "See the idea again" diagram, just after a wrong answer. Seen on **18 of 24** final feedback screens. The XP number in the welcome-back toast also changed while it was showing (+13…17, then +30). | Hold the finish and welcome-back toasts until the stop screen, or show them at the top. Never show them over a sheet with `role=status` (`src/ui/screens/economy.css:48`, `src/ui/shell/EconomyFeedback.tsx:131-153`). |
| 6 | All topics · day 2 · stop screen | `psychology-d2-13-stop.png` | **A promised reward is never paid.** The screen says "Perfect drop · +10 XP" after a drop with **1 question**. The ledger writes a `perfect-drop` only when there are at least 3 scored questions (`src/data/repos/gamify.ts:42-44`). Checked in IndexedDB: the line was shown and **0 `perfect-drop` facts** were written. This happened in 6 of 6 topics. | Use the same rule on screen: `questions >= 3 && perfectDrop(...)` (`src/ui/learn/LearnDrop.tsx:239`). |
| 7 | All topics · every lesson screen | `psychology-d1-04-hook.png` | **Navigation and headings take half the screen.** The question starts at **y = 380 of 800 px** (measured). Above it sit the top bar, a Back pill, "TODAY / Today's drop / New idea", the bar, and a mascot bubble that says "Guess first" / "The idea" / "Pick the best answer". On a 360×800 phone the answer sheet then covers the options. | In a lesson, drop the page heading and Back pill (`src/ui/screens/Learn.tsx:72`). Shrink the mascot row to one line. |
| 8 | Health d1, History d3/d8, Body d1/d2, Money d1 · guided try | `health-nutrition-d1-07-guided.png`, `history-civilisations-d3-08-guided.png` | **Guided tries are too easy.** In my reading, about 14 of the 24 guided tries I walked can be answered with no lesson at all. Examples: "A bowl of chana / A spoon of ghee / A glass of cola"; "Kings bathed there each morning"; "So only the king could read it". The kill test wants 85–95% first-try correct. These will sit near 100% and teach nothing. | Give each guided try one distractor that sounds right (the misconception the step fixes). Watch `guidedFirstTry` in the owner panel. |
| 9 | History · day 1 · guided try | `history-civilisations-d1-07-guided.png`, `-08-guided-hint.png` | **The try tests a detail, not the idea.** It asks "In which part of Mohenjo-daro do the right-angle streets lie?" The idea of the step is that a grid shows a plan. The hint ("Look away from the high mound in the west") points at a mound the teach card never mentions. | Ask the learner to use the idea, e.g. "A dig finds a town with winding lanes and odd corners. What does that suggest?" |
| 10 | Most topics · teach card | `money-markets-d1-04-teach.png`, `how-things-work-d2-05-teach.png` | **Teach cards are longer than spec.** Median 33 words. **116 of 162** are over the spec 14 limit of 30 words, but the validator allows 40 (`src/data/packs/validate.ts:161`). At 38–39 words (inflation-s1, lift-s2, lift-s3) Continue sits at the bottom edge of a 360×800 screen. | Cut to 30 words or fewer, and set the validator to 30. Move the second claim of the card ("The 'air on top must catch up' story is wrong") into the guided try. |
| 11 | Money, How, Health, Body, History · day 1 · first run | `psychology-d1-02-welcome-pick.png`, `money-markets-d1-01-topic-picker.png` | **There is no topic choice on the way in.** "Learn something" always opens Psychology. A learner who wants Money has to pick another goal, find the Learn tab, tap Start and use the picker. That is **16 taps on day 1 vs 12**. The picker shows only 3 of the 6 topics above the tab bar. | After "Learn something", show the 6 topics as a single tap, with Psychology first and marked "good place to start". |
| 12 | Psychology d1, Money d1, How d8, Body d1, History d2/d8 · teach card | `psychology-d1-06-teach.png`, `money-markets-d1-04-teach.png` | **Flow diagrams wrap badly.** "Cue → Act →" ends a line with an arrow, and "Little thought needed" drops to the next line. Longer flows stack into 3 rows with arrows at the line ends. 48 of 54 flows have more than 34 characters of node text (an estimate of how many wrap at 360 px). | At phone width, draw flows as a vertical list with a down arrow between nodes (`StepLesson.tsx:13-14`, `learn.css:252`). |
| 13 | Psychology d1/d3/d8 · Show me | `psychology-d1-07-show.png`, `history-civilisations-d3-06-show.png` | **Show me can be a coin flip.** "Tap the cue" offers 2 chips: "After brushing his teeth," / "Arun does ten push-ups." That is a 50% guess. **15 of 162** examples have only 2 parts. Chips also break a sentence mid-phrase and centre the overflow, so a chip can show "it," alone on a line. The sentence reads like a list of options, not a story. | Use at least 3 parts per example. Left-align chips and let them flow inline like a sentence. |
| 14 | How d8 hook, Psychology d3 teach, How d3 feedback · wording | `how-things-work-d8-04-hook-right.png`, `psychology-d3-05-teach.png` | **Jargon jumps in without warning.** "A drone that weighs 2 newtons" opens a lesson for non-science students. "Habits were estimated to take 18 to 254 days… **middle 66**" ("middle" for median is unclear). The lift-s3 feedback says "speed squared" after the teach card carefully said "speed times speed". | Use "a drone as heavy as a small apple" or explain newtons once. Write "half of people took more than 66 days". Keep "speed times speed" everywhere. |
| 15 | Psychology · day 8 · hook and guided try | `psychology-d8-03-hook.png`, `psychology-d8-08-guided.png` | **The example is culturally off.** The loss-aversion lesson is all money bets: a coin toss for ₹100, then "Anjali's captain offers a side bet on a coin toss" before a cricket match. In India a cricket side bet sounds like match-betting. That is an odd fit for an app that avoids random-reward mechanics. | Use a non-betting even trade, e.g. swapping a ₹100 movie voucher for a 50/50 chance at a ₹200 one, or a lost vs found ₹100 note. |

Smaller things noticed:
- **"1 questions" label.** The finish stats always say "questions", including "1 questions" (`LearnDrop.tsx:238`).
- **"Your turn" on day 3.** The day-3 guided feedback button reads "Done", which is right. On days 2 and 8 it reads "Your turn" and leads to a single question.
- **Feedback sheet hides your pick.** After a wrong hook or guided pick, the sticky sheet covers the third option and part of the learner's own pick (`psychology-d2-09-guided-wrong.png`). The ✓ on the right answer stays visible, which is enough.
- **Tight estimate tolerance.** "About what did it cost last May?" accepts ₹990–₹1,010 on a ₹604–₹1,204 slider (±1%). It is reachable with the +/− buttons but hard by dragging (`money-markets-d2-10-q-estimate.png`).
- **Two-chip example again.** In the `habits-s3` Show me, "Tap what happened after the miss" has 2 chips, and the answer is the only sentence that mentions "after".
- **Repeated names.** Meera, Kunal, Sana and Ravi recur across topics and sometimes in the same week. This does no harm, but it reads as recycled.
- **"Pain means rest."** It is tacked onto the end of the `progressive-overload-s3` teach card as a fourth claim. It is fine as advice, but it makes the card longer than the limit.

## Judged per lesson, as an 18–22 year old Indian student

The table below covers every lesson walked. "OK" means it worked for me.

| Topic · day · step | Hook clear? | Teach fits a phone? | Guided try teaches? | Items test what was taught? | Notes |
|---|---|---|---|---|---|
| Psychology 1 · habits-s1 | Yes, relatable (phone on getting home) | Yes, 27 words | Weak: desk cue is easy | No item (day 1) | Show me is 2 chips; flow wraps |
| Psychology 2 · habits-s2 | Abstract ("week one or week ten") | Yes, 26 words; scale labels sit on the bar | Yes: a new act starts low | 1 item on s1, fair transfer (Dadar train → bus) | Good item |
| Psychology 3 · habits-s3 | Yes (21-day myth) | 37 words, "middle 66" unclear | Easy but on point | None | Show me 2 chips |
| Psychology 8 · loss-aversion-s1 | Clear | 36 words | Yes, but a cricket side bet | Same item as day 2 | See #2, #15 |
| Money 1 · inflation-s1 | Clear, a little textbook | 38 words, long flow | Easy (onions) | None | Good Indian framing (onions, basket) |
| Money 2 · inflation-s2 | Clear (₹2,000 pocket money) | 32 words | Needs 100÷125, which was not taught | 1 slider item on s1 (±1% tolerance) | Fraction step is a jump |
| Money 3 · inflation-s3 | Trivia guess (RBI target) | Diagram unreadable (#3) | Easy once the band is read | None | |
| Money 8 · compounding-s1 | Clear with numbers | 23 words, good | Yes (₹55) | 1 new item on s2 | Best lesson of the walk |
| How 1 · lift-s1 | Clear (kite) | 33 words | Easy (parked plane) | None | |
| How 2 · lift-s2 | Clear (card in front of a fan) | 39 words, two claims | Yes: tests the reversed case | 1 item on s1, good misconception item | Good |
| How 3 · lift-s3 | Clear | 39 words; label cut off, page 373 px wide (#4) | Yes (3× → 9×) | None | |
| How 8 · multirotor-turns-s1 | "newtons" jars (#14) | 32 words | OK | 1 new item on s2 | |
| Health 1 · protein-foods-s1 | Too easy (milk vs cucumber vs pickle) | 35 words | Too easy (chana/ghee/cola) | None | |
| Health 2 · protein-foods-s2 | Clear (dal + rice) | 35 words, "building blocks" is fine | Easy (khichdi) | 1 item on s1, fair | Culturally strong |
| Health 3 · protein-foods-s3 | Guessable by elimination | Diagram overprinted (#3) | Yes (80 kg × 0.83) | None | |
| Health 8 · free-sugars-s1 | Clear | 37 words | Yes: jaggery myth, the best guided try | Same item as day 2 | |
| Body 1 · progressive-overload-s1 | Too easy | 35 words | Easy | None | |
| Body 2 · progressive-overload-s2 | Clear, no-equipment framing | 32 words | Easy (water bottles) | 1 item on s1, fair (school bag) | |
| Body 3 · progressive-overload-s3 | Good maths hook | Diagram spills off both sides (#4) | Yes (55 min) | None | |
| Body 8 · muscle-protein-rest-s1 | Clear | 31 words | Easy | Same item as day 2 | |
| History 1 · indus-cities-s1 | Clear | 33 words | Tests trivia (#9) | None | |
| History 2 · indus-cities-s2 | Clear | 32 words, long flow | Easy but on point | 1 item on s1, good transfer (Delhi colony) | |
| History 3 · indus-cities-s3 | Clear | 29 words | Easy (the steps of the bath) | None | |
| History 8 · ashoka-edicts-s1 | Clear | 29 words | Too easy | Same item as day 2 | |

Overall:
- **Hooks.** The hooks are relatable and Indian in setting: Dadar trains, a hostel mess, khichdi, a katori of rajma, onions, ₹ pocket money.
- **No length clue.** The right answer is the uniquely longest option in only 42 of 162 hooks and 39 of 162 guided tries, below the one-in-three chance level. So option length gives nothing away.
- **The teach → show → try shape works.** Each lesson is short and clear.
- **The weak part is what follows.** There is almost no practice, and the guided tries are too easy.

## Taps and time per lesson

Measured taps and time from the script. Human time is an **estimate**: words on screen read at 180 wpm, plus 1.5 s per tap.
The script time includes my own 450 ms pause before every screenshot (about 2.7 s per lesson) and the shared-machine load.

| Topic | Day | Step | Teach words | Words read in the lesson | Lesson taps | Questions | Taps from Learn tab | Taps incl. opening the app | Script s (lesson) | Est. human s (lesson) | Est. human s (whole day) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| psychology | 1 | habits-s1 | 27 | 155 | 7 | 0 | 8 | 12* | 4.7 | 62 | 81 |
| psychology | 2 | habits-s2 | 26 | 196 | 6 | 1 | 10 | 12 | 4.0 | 74 | 121 |
| psychology | 3 | habits-s3 | 37 | 187 | 6 | 0 | 7 | 9 | 4.1 | 71 | 92 |
| psychology | 8 | loss-aversion-s1 | 36 | 230 | 7 | 1 | 12 | 14 | 4.6 | 87 | 137 |
| money-markets | 1 | inflation-s1 | 38 | 193 | 7 | 0 | 8 | 16* | 4.6 | 75 | 102 |
| money-markets | 2 | inflation-s2 | 32 | 189 | 6 | 1 | 10 | 12 | 4.1 | 72 | 111 |
| money-markets | 3 | inflation-s3 | 34 | 173 | 6 | 0 | 7 | 9 | 4.1 | 67 | 86 |
| money-markets | 8 | compounding-s1 | 23 | 186 | 7 | 1 | 12 | 14 | 4.9 | 73 | 114 |
| how-things-work | 1 | lift-s1 | 33 | 180 | 7 | 0 | 8 | 16* | 4.6 | 71 | 95 |
| how-things-work | 2 | lift-s2 | 39 | 203 | 6 | 1 | 10 | 12 | 4.0 | 77 | 128 |
| how-things-work | 3 | lift-s3 | 39 | 190 | 6 | 0 | 7 | 9 | 10.9† | 72 | 91 |
| how-things-work | 8 | multirotor-turns-s1 | 32 | 180 | 7 | 1 | 12 | 14 | 4.7 | 71 | 113 |
| health-nutrition | 1 | protein-foods-s1 | 35 | 168 | 7 | 0 | 8 | 16* | 4.6 | 67 | 95 |
| health-nutrition | 2 | protein-foods-s2 | 35 | 206 | 6 | 1 | 10 | 12 | 4.1 | 78 | 124 |
| health-nutrition | 3 | protein-foods-s3 | 34 | 180 | 6 | 0 | 7 | 9 | 4.0 | 69 | 92 |
| health-nutrition | 8 | free-sugars-s1 | 37 | 180 | 7 | 1 | 12 | 14 | 4.5 | 71 | 118 |
| body-training | 1 | progressive-overload-s1 | 35 | 220 | 7 | 0 | 8 | 16* | 4.9 | 84 | 110 |
| body-training | 2 | progressive-overload-s2 | 32 | 206 | 6 | 1 | 10 | 12 | 3.9 | 78 | 127 |
| body-training | 3 | progressive-overload-s3 | 34 | 193 | 6 | 0 | 7 | 9 | 4.0 | 73 | 96 |
| body-training | 8 | muscle-protein-rest-s1 | 31 | 202 | 7 | 1 | 12 | 14 | 4.6 | 78 | 126 |
| history-civilisations | 1 | indus-cities-s1 | 33 | 180 | 7 | 0 | 8 | 16* | 4.7 | 71 | 97 |
| history-civilisations | 2 | indus-cities-s2 | 32 | 191 | 6 | 1 | 10 | 12 | 4.0 | 73 | 115 |
| history-civilisations | 3 | indus-cities-s3 | 29 | 185 | 6 | 0 | 7 | 9 | 4.0 | 71 | 91 |
| history-civilisations | 8 | ashoka-edicts-s1 | 29 | 201 | 7 | 1 | 12 | 14 | 4.6 | 78 | 121 |

\* Day 1 includes the first run (18+ tick, goal, bedtime). Psychology's path is 4 taps shorter, see #11.
† Includes a 6 s click retry caused by the page-width bug (#4).

Averages over the 24 lessons:
- 6.5 taps per lesson
- about 190 words to read
- an estimated **74 s per lesson** and **108 s per day**

Spec 14 aimed for about 2 minutes per lesson and 4 minutes per drop. The lesson itself is about right. A day is half the planned length because the review questions are missing (#1).

## Static checks behind #4, #10, #12 and #13 (estimates, all 162 steps)
- **Scale diagrams.** The rule assumes 290 px of bar and 6.6 px per character at 12 px bold. A label is flagged if it runs past the card edge, or if two neighbouring labels need more room than the gap between them.
  - **26 of 35 are flagged:** progressive-overload-s3, muscle-protein-rest-s2, cardio-talk-test-s2, food-labels-s3, protein-foods-s3, free-sugars-s2, hydration-cues-s1, hydration-cues-s2, exercise-heart-s1, fad-diet-claims-s3, printing-and-reading-s2, mughal-revenue-s1, company-trade-rule-s3, independence-constitution-s3, lift-s3, battery-flight-time-s3, flight-sensors-s3, pressure-cooker-s1, inflation-s3, compounding-s2, diversification-s2, emergency-fund-s2, index-funds-s3, anchoring-s2, social-proof-s2, if-then-plans-s3.
  - **Checked against screenshots:** all 4 flagged diagrams I walked were broken. The 2 unflagged ones I walked (habits-s2, habits-s3) were readable.
- **Teach cards.** Median 33 words, max 40. 116 of 162 are over 30 words.
- **Flows.** 48 of 54 have more than 34 characters across their nodes, so they likely wrap at 360 px.
- **Show me.** 15 of 162 examples have only 2 tappable parts.

## Not covered
- Dark mode, 390×844 and offline. One viewport only; the job asked for the learner walk, not a screen audit.
- Days 4–7. They were skipped on purpose: day 8 is a learner coming back after a gap.
- Practice drops, Idea checks and Gold review. Only the daily drop was walked.
- Night drop and after-bedtime behaviour. Every walk was at 7:30 pm.
- No real people. Guided-try ease (#8) is my judgement from reading the 24 items, not a measured first-try rate.

## Scripts (in /tmp, not in the repo)
- Build and serve, from the worktree on `origin/learn-steps`:

```
npm ci
npx vite build
npx vite preview --port 5311 --strictPort
```

- Chromium: `executablePath: '/opt/pw-browsers/chromium'` (chromium-1194). Playwright 1.63 from the repo's `node_modules`.
- Compressing screenshots: `convert in.png -strip -colors 128 -define png:compression-level=9 PNG8:out.png`.

### walk.cjs (the walker)
```js
// Job 11 lesson walk. Run: node walk.cjs [topicId ...]   (preview server on :5311, build of origin/learn-steps)
const { chromium } = require('/tmp/cj2/job11/node_modules/playwright');
const fs = require('fs');
const ROOT = '/tmp/cj2/job11';
const OUT = '/tmp/cj2/job11-scratch/shots';
const BASE = 'http://localhost:5311/';
const TOPICS = { 'psychology': 'Human psychology', 'money-markets': 'Money and markets', 'how-things-work': 'How things work',
  'health-nutrition': 'Health and nutrition', 'body-training': 'Body and training', 'history-civilisations': 'History and civilisations' };
// Day 1 = Thu 5 Nov 2026, 7:30 pm IST; days 4-7 skipped (a learner who drops off and returns on day 8).
const DAYS = [[1, '2026-11-05'], [2, '2026-11-06'], [3, '2026-11-07'], [8, '2026-11-12']];
const pack = id => JSON.parse(fs.readFileSync(`${ROOT}/content/topics/topic.${id}.json`, 'utf8'));
const words = s => (s.match(/[A-Za-z0-9₹%'’-]+/g) || []).length;

async function walkTopic(browser, topic) {
  const p = pack(topic);
  const concepts = p.body.modules.flatMap(m => m.concepts);
  const steps = concepts.flatMap(c => (c.steps || []).map(s => ({ ...s, concept: c.id })));
  const allItems = concepts.flatMap(c => c.items);
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, timezoneId: 'Asia/Kolkata', locale: 'en-IN' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const log = [];
  let n = 0, taps = 0, day = 0, dayLog;
  let answerCount = 0;
  const problems = [];
  const tap = async loc => {
    taps++;
    try { await loc.click({ timeout: 6000 }); return; } catch (e) {
      const box = await loc.boundingBox();
      const diag = box && await page.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y); return { at: [Math.round(x), Math.round(y)], hit: el ? el.tagName + '.' + el.className : null, vw: innerWidth, sw: document.documentElement.scrollWidth, sx: scrollX }; }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      const before = await page.evaluate(() => document.querySelector('.step-lesson')?.getAttribute('data-lesson-phase') ?? 'none');
      await page.screenshot({ path: `${OUT}/${topic}-d${day}-PROBLEM-${problems.length + 1}.png` });
      if (box) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(800);
      const after = await page.evaluate(() => document.querySelector('.step-lesson')?.getAttribute('data-lesson-phase') ?? 'none');
      const touchWorked = after !== before;
      if (!touchWorked) await loc.dispatchEvent('click');
      problems.push({ day, n, box, diag, touchWorked, msg: e.message.split('\n').filter(l => l.includes('intercepts')).slice(0, 1).join('') });
      console.log('CLICK PROBLEM', topic, day, JSON.stringify(problems.at(-1)));
    }
  };
  const shot = async (label, extra = {}) => {
    await page.waitForTimeout(450); // let slide/feedback animations settle
    n++;
    const name = `${topic}-d${day}-${String(n).padStart(2, '0')}-${label}.png`;
    await page.screenshot({ path: `${OUT}/${name}` });
    const info = await page.evaluate(() => {
      const main = document.querySelector('.learn-drop') || document.querySelector('main') || document.body;
      const sheet = document.querySelector('.learn-feedback button');
      const r = sheet && sheet.getBoundingClientRect();
      return { text: main.innerText, scrollH: document.documentElement.scrollHeight, innerH: innerHeight, hScroll: document.documentElement.scrollWidth > innerWidth,
        sheetBtnBottom: r ? Math.round(r.bottom) : null, scrollY: Math.round(scrollY), dialogs: [...document.querySelectorAll('[role=dialog],[role=status],.toast,.economy-toast')].map(e => e.className + ':' + e.innerText.slice(0, 120)) };
    });
    const row = { topic, day, n, name, label, taps, t: Date.now(), ...info, ...extra };
    log.push(row); dayLog.screens.push(row);
    return row;
  };
  const lessonPhase = () => page.evaluate(() => document.querySelector('.step-lesson')?.getAttribute('data-lesson-phase') ?? 'none');
  const advance = async loc => { const before = await lessonPhase(); await tap(loc); await page.waitForFunction(b => (document.querySelector('.step-lesson')?.getAttribute('data-lesson-phase') ?? 'none') !== b, before, { timeout: 15000 }); };
  const optionBtn = text => page.locator('.learn-drop').getByRole('button', { name: text, exact: true });

  for (const [d, date] of DAYS) {
    day = d; n = 0;
    dayLog = { topic, day, date, screens: [], items: [], lesson: null, start: Date.now() };
    const tapsStart = taps;
    await page.clock.setFixedTime(new Date(`${date}T19:30:00+05:30`));
    if (d === 1) {
      await page.goto(BASE);
      const w = page.getByRole('dialog', { name: 'Welcome to NANDI' });
      await w.waitFor();
      if (topic === 'psychology') await shot('welcome-hello');
      await tap(w.getByLabel("I'm 18 or older.")); await tap(w.getByRole('button', { name: "Let's start" }));
      if (topic === 'psychology') {
        await shot('welcome-pick');
        await tap(w.getByRole('button', { name: 'Learn something' }));
        await shot('welcome-bedtime');
        await tap(w.getByRole('button', { name: 'Start your first lesson' }));
      } else {
        // Learn something always opens Psychology; someone who wants another topic picks another goal, then opens Learn.
        await tap(w.getByRole('button', { name: 'Get things done' }));
        await tap(w.getByRole('button', { name: 'Add your first task' }));
        await page.waitForTimeout(500);
        await tap(page.getByRole('navigation', { name: 'Main tabs' }).getByText('Learn', { exact: true }));
        await page.getByRole('heading', { name: 'Learn', exact: true }).waitFor();
        await tap(page.locator('.learn-today-status').first().getByRole('button'));
        await page.getByRole('heading', { name: 'What do you want to get sharp at?' }).waitFor();
        await tap(page.getByRole('button', { name: new RegExp(TOPICS[topic]) }));
        await shot('topic-picker');
        await tap(page.getByRole('button', { name: 'Start my first drop' }));
        await page.locator('.learn-pick').waitFor({ state: 'detached' });
      }
    } else {
      await page.goto(BASE);
      await page.waitForTimeout(1200);
      await shot('app-open');
      await tap(page.getByRole('navigation', { name: 'Main tabs' }).getByText('Learn', { exact: true }));
      await page.getByRole('heading', { name: 'Learn', exact: true }).waitFor();
      await shot('learn-tab');
      await tap(page.locator('.learn-today-status').first().getByRole('button'));
    }
    const dropStart = Date.now(); const dropTapsStart = taps;
    let ideaAgainShown = false, safety = 0;
    for (;;) {
      if (++safety > 60) throw new Error('loop guard');
      await page.locator('.step-lesson, .learn-stop, .learn-drop h2').first().waitFor({ timeout: 15000 });
      if (await page.locator('.learn-stop').isVisible()) { await page.waitForTimeout(900); await shot('stop'); break; }
      const lesson = page.locator('.step-lesson');
      if (await lesson.count()) {
        const phase = await lesson.getAttribute('data-lesson-phase');
        if (phase === 'hook') {
          const stem = await lesson.locator('h2').innerText();
          const step = steps.find(s => s.hook.stem === stem);
          if (!step) throw new Error('unknown hook ' + stem);
          dayLog.lesson = { step: step.id, title: step.title, concept: step.concept, start: Date.now(), taps0: taps, results: {} };
          await shot('hook');
          const right = d === 2 || d === 8; // a guess: wrong on days 1 and 3
          const opt = step.hook.options.find(o => o.correct === right);
          await tap(optionBtn(opt.text)); dayLog.lesson.results.hook = right;
          await shot(`hook-${right ? 'right' : 'wrong'}`);
          await advance(page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }));
          continue;
        }
        const step = steps.find(s => s.id === dayLog.lesson.step);
        if (phase === 'teach') { await shot('teach'); await advance(lesson.getByRole('button', { name: 'Continue' })); continue; }
        if (phase === 'show') {
          await shot('show');
          const right = d !== 3;
          const part = right ? step.example.spot : step.example.parts.find(x => x !== step.example.spot);
          await tap(page.locator('.step-part', { hasText: part.trim() }).first()); dayLog.lesson.results.spot = right;
          await shot(`show-${right ? 'right' : 'wrong'}`);
          await advance(page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }));
          continue;
        }
        if (phase && phase.startsWith('guided')) {
          await shot('guided');
          if (d === 1 || d === 8) { await tap(page.getByRole('button', { name: 'Show hint' })); await shot('guided-hint'); }
          const right = d !== 2;
          const g = step.guided[0];
          await tap(optionBtn(g.options.find(o => o.correct === right).text)); dayLog.lesson.results.guided = right;
          await shot(`guided-${right ? 'right' : 'wrong'}`);
          dayLog.lesson.ms = Date.now() - dayLog.lesson.start; dayLog.lesson.taps = taps - dayLog.lesson.taps0;
          await advance(page.locator('.learn-feedback').getByRole('button', { name: /^(Your turn|Done|Continue)$/ }));
          continue;
        }
        throw new Error('unknown phase ' + phase);
      }
      // A question
      if (await page.locator('.learn-feedback').isVisible()) throw new Error('unexpected feedback state');
      const stem = await page.locator('.learn-drop h2').first().innerText();
      const item = allItems.find(i => i.stem === stem);
      if (!item) { await shot('unknown'); throw new Error('unknown item ' + stem); }
      answerCount++;
      const right = answerCount % 3 !== 2; // every third item answered wrong
      await shot(`q-${item.type}`);
      const t0 = Date.now(), k0 = taps;
      const tapId = id => tap(optionBtn(item.options.find(o => o.id === id).text));
      if (item.type === 'order') { const ids = right ? item.answer : [...item.answer].reverse(); for (const id of ids) await tapId(id); }
      else if (item.type === 'match') { const rights = item.answer.map(x => x.right); const pairs = right ? item.answer : item.answer.map((x, i) => ({ left: x.left, right: rights[(i + 1) % rights.length] })); for (const pr of pairs) { await tapId(pr.left); await tapId(pr.right); } }
      else if (item.type === 'estimate') { const r = page.locator('.learn-estimate input[type=range]'); const v = right ? item.answer.value : Number(await r.getAttribute('max')); await r.fill(String(v)); taps++; }
      else await tapId(item.options.find(o => o.correct === right).id);
      await shot(`q-${item.type}-picked`);
      const check = right ? page.getByRole('button', { name: /^Check( · I'm sure)?$/ }).first() : page.getByRole('button', { name: /^Check( · Guessing)?$/ }).last();
      await tap(check);
      await page.locator('.learn-feedback').waitFor();
      const got = (await page.locator('.learn-feedback .learn-sheet-title').innerText()).trim();
      await shot(`fb-${right ? 'right' : 'wrong'}`);
      if (!right && !ideaAgainShown && await page.getByRole('button', { name: 'See the idea again' }).count()) {
        await tap(page.getByRole('button', { name: 'See the idea again' })); ideaAgainShown = true; await shot('idea-again');
      }
      dayLog.items.push({ id: item.id, type: item.type, step: item.step, concept: item.conceptId, job: item.job, intendedRight: right, sheet: got, ms: Date.now() - t0, taps: taps - k0 + 1 });
      await tap(page.locator('.learn-feedback').getByRole('button', { name: 'Next' }));
      await page.locator('.learn-feedback').waitFor({ state: 'detached' });
    }
    dayLog.dropMs = Date.now() - dropStart; dayLog.dropTaps = taps - dropTapsStart; dayLog.dayTaps = taps - tapsStart;
    dayLog.ms = Date.now() - dayLog.start; dayLog.errors = [...errors]; errors.length = 0; dayLog.problems = problems.filter(x => x.day === d);
    fs.writeFileSync(`/tmp/cj2/job11-scratch/log-${topic}-d${d}.json`, JSON.stringify(dayLog, null, 1));
    console.log(topic, 'day', d, 'lesson', dayLog.lesson && dayLog.lesson.step, 'items', dayLog.items.map(i => `${i.id}(${i.concept})${i.intendedRight ? '+' : '-'}`).join(' '), 'taps', dayLog.dropTaps, 'ms', dayLog.dropMs, dayLog.errors.length ? 'ERR ' + dayLog.errors.join('|') : '');
  }
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const list = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TOPICS);
  for (const t of list) {
    try { await walkTopic(browser, t); } catch (e) { console.log('FAIL', t, e.message.slice(0, 1500)); }
  }
  await browser.close();
})();
```

### verify.cjs (perfect-drop ledger check and screen geometry)
```js
// Verify: (1) chrome height above the lesson question at 360x800, (2) whether a perfect-drop fact is written on a 1-question drop.
const { chromium } = require('/tmp/cj2/job11/node_modules/playwright');
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('/tmp/cj2/job11/content/topics/topic.psychology.json'));
const cs = p.body.modules.flatMap(m => m.concepts); const steps = cs.flatMap(c => c.steps); const items = cs.flatMap(c => c.items);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, timezoneId: 'Asia/Kolkata' });
  const page = await ctx.newPage();
  const btn = t => page.locator('.learn-drop').getByRole('button', { name: t, exact: true });
  const walk = async () => {
    const lesson = page.locator('.step-lesson'); await lesson.waitFor();
    const stem = await lesson.locator('h2').innerText(); const s = steps.find(x => x.hook.stem === stem);
    const geo = await page.evaluate(() => { const h = document.querySelector('.step-lesson h2').getBoundingClientRect(); const opts = [...document.querySelectorAll('.learn-options button')].map(e => Math.round(e.getBoundingClientRect().bottom)); return { questionTop: Math.round(h.top), lastOptionBottom: Math.max(...opts) }; });
    console.log('geometry', s.id, JSON.stringify(geo));
    await btn(s.hook.options.find(o => o.correct).text).click(); await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
    await lesson.getByRole('button', { name: 'Continue' }).click();
    await page.locator('.step-part', { hasText: s.example.spot.trim() }).click(); await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
    await page.locator('[data-lesson-phase=guided-1]').waitFor();
    await btn(s.guided[0].options.find(o => o.correct).text).click(); await page.locator('.learn-feedback').getByRole('button', { name: /Your turn|Done/ }).click();
    await page.waitForTimeout(500);
  };
  await page.clock.setFixedTime(new Date('2026-11-05T19:30:00+05:30'));
  await page.goto('http://localhost:5311/');
  const w = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await w.getByLabel("I'm 18 or older.").check(); await w.getByRole('button', { name: "Let's start" }).click();
  await w.getByRole('button', { name: 'Learn something' }).click(); await w.getByRole('button', { name: 'Start your first lesson' }).click();
  await walk();
  await page.clock.setFixedTime(new Date('2026-11-06T19:30:00+05:30'));
  await page.goto('http://localhost:5311/#learn/drop'); await page.reload();
  await walk();
  const stem = await page.locator('.learn-drop h2').first().innerText(); const it = items.find(i => i.stem === stem);
  await btn(it.options.find(o => o.correct).text).click(); await page.getByRole('button', { name: /^Check/ }).first().click();
  await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
  await page.locator('.learn-stop').waitFor(); await page.waitForTimeout(1500);
  const shown = await page.locator('.learn-perfect').count();
  const ledger = await page.evaluate(async () => { const db = await new Promise(r => { const o = indexedDB.open('nandi'); o.onsuccess = () => r(o.result); }); return await new Promise(r => { const q = db.transaction('ledger').objectStore('ledger').getAll(); q.onsuccess = () => r(q.result.map(x => x.kind)); }); });
  console.log('stop screen shows Perfect drop line:', shown, '| perfect-drop facts in ledger:', ledger.filter(k => k === 'perfect-drop').length, '| ledger kinds:', [...new Set(ledger)].join(','));
  await b.close();
})();
```

### stats.cjs (taps, words and time estimates)
```js
const fs=require('fs');const W=s=>(String(s).match(/\S+/g)||[]).length;
const order=['psychology','money-markets','how-things-work','health-nutrition','body-training','history-civilisations'];
const rows=[];let all=[];
for(const t of order){const p=JSON.parse(fs.readFileSync(`/tmp/cj2/job11/content/topics/topic.${t}.json`));const cs=p.body.modules.flatMap(m=>m.concepts);const steps=cs.flatMap(c=>c.steps);const items=cs.flatMap(c=>c.items);
 for(const d of [1,2,3,8]){const l=JSON.parse(fs.readFileSync(`log-${t}-d${d}.json`));const s=steps.find(x=>x.id===l.lesson.step);
  const v=s.visual;const vt=v.kind==='flow'?v.nodes.join(' '):v.kind==='compare'?[v.left.title,...v.left.lines,v.right.title,...v.right.lines].join(' '):[v.label,v.min,v.max,...v.marks.map(m=>m.text)].join(' ');
  const g=s.guided[0];
  const lw=W(s.hook.stem)+s.hook.options.reduce((a,o)=>a+W(o.text),0)+W(s.hook.options[0].feedback)+W(s.title)+W(s.teach)+W(vt)+W(s.example.ask)+W(s.example.parts.join(' '))+W(s.example.feedback)+W(g.stem)+g.options.reduce((a,o)=>a+W(o.text),0)+W(g.options[0].feedback)+(d===1||d===8?W(g.hint):0);
  const iw=l.items.reduce((a,x)=>{const i=items.find(y=>y.id===x.id);return a+W(i.stem)+i.options.reduce((b,o)=>b+W(o.text),0)+W(i.options[0].feedback);},0);
  const stopw=W(s.takeaway)+W(vt)+20;
  const estLesson=Math.round(lw/180*60+l.lesson.taps*1.5);const estDay=Math.round((lw+iw+stopw)/180*60+l.dayTaps*1.5);
  rows.push({t,d,step:s.id,teachW:W(s.teach),lessonWords:lw,lessonTaps:l.lesson.taps,questions:l.items.length,dropTaps:l.dropTaps,dayTaps:l.dayTaps,botLessonS:(l.lesson.ms/1000).toFixed(1),botDayS:(l.ms/1000).toFixed(1),estLessonS:estLesson,estDayS:estDay});}}
console.log('topic|day|step|teach words|lesson words|lesson taps|questions|taps from Learn tab|taps incl. app open|bot lesson s|bot day s|est. human lesson s|est. human day s');
for(const r of rows)console.log([r.t,r.d,r.step,r.teachW,r.lessonWords,r.lessonTaps,r.questions,r.dropTaps,r.dayTaps,r.botLessonS,r.botDayS,r.estLessonS,r.estDayS].join('|'));
const avg=k=>(rows.reduce((a,r)=>a+Number(r[k]),0)/rows.length).toFixed(1);
console.log('AVG lessonWords',avg('lessonWords'),'lessonTaps',avg('lessonTaps'),'estLessonS',avg('estLessonS'),'estDayS',avg('estDayS'),'botLessonS',avg('botLessonS'),'questions total',rows.reduce((a,r)=>a+r.questions,0));
```
