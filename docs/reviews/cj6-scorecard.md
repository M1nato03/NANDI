# cj6 · Scorecard, the NANDI half (spec 23)

Batch 6, job 3. Measured on `origin/main` at 92da451, 24 Oct 2026.
Spec: `docs/specs/23-learn-to-duolingo-level.md` on `ideas/spec-23-learn-duolingo-level`.
Screenshots: `docs/reviews/cj6-scorecard/` (18 PNGs, 360x800, light).

## Short answer
- A new-lesson session gives **3 answers on day 1 and 5-6 on later days** (target 8-10).
- Before the first tap you read **33-54 words**. That is about **8-14 s** at an average adult reading speed (target ≤ 5 s). The app itself is fast: the first question is on screen 0.1-0.16 s after "Start".
- **About 70% of the words in a session sit on question screens**, so the "answering ≥ 60%" target is met on words. (A script can't measure time; see "What could not be measured as written".)
- A fixed "knows the card" player is right 100% of the time. A fixed "always tap the first option" player is right 18-56% on practice. The real band is unknown. **The first option is the right one more often than chance** (47% vs 33%), because the option shuffle is weak. That is a real bug (see "Bugs found").
- No practice-only drop can be reached in the first week during the day. "Practice this idea" teaches the next lesson first. The only practice-only session was the night drop: 0 questions on day 4, 2 questions on day 5.
- The packs hold 24-30 lessons per topic, and every topic uses all 10 item types.

## The spec 23 table, NANDI column filled
The Duolingo column is left blank for Jenil.

| # | Measure | Duolingo (Jenil measures) | NANDI now (measured 24 Oct, main 92da451) | Target |
|---|---|---|---|---|
| 1 | Answers per new-lesson session | | **3** on day 1 (hook, Show me, 1 guided try). **5-6** on days 2-5 (the same 3, plus 2-3 recap questions). Median 5. | 8-10 |
| 2 | Seconds to the first tap | | App: **0.10-0.16 s** from "Start" to the first answer screen. **1.5 s** if you tap within the 1.1 s opening splash. Reading: **33-54 words** before the first tap, **≈ 8-14 s** at 238 wpm (an estimate, not timed). | ≤ 5 |
| 3 | Share of time reading vs answering | | Measured on **words**, not time. Answering **57-72%** per lesson session (Show me counted as reading, as the job asked), or **74-84%** if Show me counts as answering. Over the 5 days: **69-74%**. Night drop: 100%. | answering ≥ 60% |
| 4 | First-try correct on practice | | "Knows the card": **100%** (8/8 and 9/9). "Always first option": **56%** (5/9) on the practice route and **18%** (2/11) on the daily route. A real learner's band is still unmeasured, and nothing is banded. | 60-85% |
| 5 | Question types seen in one week | | Over **5 days** (not 7): **5-7 item types** plus 3 lesson formats (hook, Show me, guided try), so **8-10 in all**. There are **4 input models**: tap to choose, tap the part, put in order, slider. Match never came up. | ≥ 8 |
| 6 | Lessons left before a topic runs out | thousands | **30** lessons each in Psychology, Money and How things work, and 24 each in the other three topics (162 in all). At one lesson a day this is 24-30 days per topic. With 3 topics chosen, about 85 lessons were left after day 5. | ≥ 60 |
| 7 | "Felt fun" 1-10 (Jenil) | | Jenil rates this. | ≥ Duolingo's |
| 8 | "Felt worth my time" 1-10 (Jenil) | | Jenil rates this. | > Duolingo's |

Estimated session length, all words read at 238 wpm: **45 s** for the day-1 lesson and **83-111 s** for later lesson sessions. Duolingo's lesson takes about 3-4 minutes (spec 23's secondhand figure). This is a reading-speed floor. It adds no time for thinking or tapping.

## How it was measured
- **Build:** `npm ci`, `npm run build` (production, no `VITE_E2E`, so no test hook), served with `npx vite preview --port 4636`.
- **Browser:** Playwright 1.63 Chromium, 360x800, `isMobile`, touch, light mode, time zone Asia/Kolkata. Service worker blocked so a reload never swaps builds mid-run. A **fresh browser context** for each run, so each run starts with empty IndexedDB.
- **Clock:** `page.clock.setFixedTime`, as the repo's e2e tests do. Day 1 = Mon 26 Oct 2026, 12:00 IST. Each later day = +24 h, then a reload.
- **Learner path (the real UI, no seeding):**
  - Day 1: the first-run Welcome. Tick 18+, then "Learn something", bedtime 23:00, then "Start your first lesson". The app starts Psychology.
  - Day 2: Learn screen, then "Add to my drops" on Money and markets, then Today's drop "Start".
  - Day 3: the same with How things work.
  - The daily drop teaches the next untaught step **in catalog order** (`nextStep` in `src/core/learn/steps.ts`). The packs load alphabetically: how-things-work, money-markets, psychology. So adding a topic each day made the day's lesson come from the new topic, and the recap came from the earlier days. This gave one new-idea lesson per named topic, each with a real recap tail.
  - Days 4 and 5, two variants:
    - **Practice variant** (what the job asked): at 12:00, Learn showed no "Idea checks" entry on either day (no idea was due). So the scripted learner used the only daytime practice entry, the mastery map's "Practice this idea: Habits". At 23:15 the same day the learner opened the night deck's "Night drop" card.
    - **Daily variant** (what a returning learner usually taps): Today's drop "Start" on days 4 and 5.
- **Two fixed strategies, each run separately:**
  - *Knows the card* picks the right option everywhere: the hook guess, the Show me part, the guided try, every question. Order and match items get the right sequence. Estimate items get the right value.
  - *Always first option* taps the top option on screen. Show me: the first part. Order and match: the top free button each time. Estimate: the slider's left end.
- **Counted per screen:** words visible before the tap (the ask bubble, stem and options, or the whole teach card) and words in the result sheet after the tap. Right or wrong is read from the sheet title on screen ("Exactly." or "Spot on." means right), not from the pack. Item type comes from the pack, matched by stem.
- Reading-speed source: Brysbaert (2019), J. Memory and Language 109, 104047. Abstract, read from the PDF ([gwern copy](https://www.gwern.net/doc/psychology/linguistics/2019-brysbaert.pdf); the [ScienceDirect page](https://www.sciencedirect.com/science/article/abs/pii/S0749596X19300786) returned 403):
  - "the average silent reading rate for adults in English is 238 words per minute (wpm) for non-fiction and 260 wpm for fiction."
  - "Reading rates are lower for children, old adults, and readers with English as second language."
  - So for most Indian 18-25 readers of these English cards, the second estimates are **too low, not too high**.

## Per session
"Answering share" counts words on question screens. The figure in brackets counts Show me as answering. "First-try right" covers every answer in the session; the practice-only figure is in brackets.

### Practice variant: the 3 lessons, then daytime practice and the night drop on days 4-5
| Day | Session | Opened by | Answers (hook/show/guided/questions) | App ms to first answer screen | Words before first tap | Est. s to first tap | Words reading / question | Answering share | Types seen (knows run) | First-try right, knows | First-try right, first option |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | New-idea lesson 1 (Psychology) | Welcome, then "Learn something" | 3 (1/1/1/0) | 155 | 36 | 9.1 | 77 / 103 | 57% (74%) | hook, Show me, guided | 3/3 | 2/3 |
| 2 | New-idea lesson 2 (Money) | Add Money, then Today's drop | 5 (1/1/1/2) | 108 | 40 | 10.1 | 108 / 251 | 70% (82%) | + predict, why | 5/5 | 3/5 (practice 1/2) |
| 3 | New-idea lesson 3 (How things work) | Add How things work, then Today's drop | 5 (1/1/1/2); first-option run: 6 | 120 | 37 | 9.3 | 100 / 231 | 70% (84%) | + estimate, order (first-option run also predict) | 5/5 | 2/6 (practice 1/3) |
| 4 | Daytime practice | Mastery map, "Practice this idea: Habits" | 4 (1/1/1/1). It taught Habits step 2 first. | 91 | 34 | 8.6 | 102 / 197 | 66% (82%) | + why | 4/4 | 4/4 (practice 1/1) |
| 4 | Night drop | Night deck, card 2, 23:15 | **0**: "Nothing to review tonight." | – | – | – | 0 / 0 | – | – | – | – |
| 5 | Daytime practice | Mastery map, "Practice this idea: Habits" | 4 (1/1/1/1). It taught Habits step 3 first. | 100 | 33 | 8.3 | 113 / 184 | 62% (75%) | + scenario | 4/4 | 2/4 (practice 1/1) |
| 5 | Night drop | Night deck, card 2, 23:15 | 2 (0/0/0/2) | 320 | 33 (58 in the first-option run) | 8.3 | 0 / 124 | 100% | estimate, order | 2/2 | 1/2 |
| | **5 days** | | 23 (knows) / 24 (first) | | | | 500 / 1090 | **69%** (knows), 71% (first) | 8 (knows), 7 (first) | 23/23 | 14/24 (practice **5/9**) |

### Daily variant: the same 3 lessons, then the daily drop on days 4-5
| Day | Session | Answers | App ms to first answer screen | Words before first tap | Est. s | Words reading / question | Answering share | Types seen (knows run) | First-try right, knows | First-try right, first option |
|---|---|---|---|---|---|---|---|---|---|---|
| 1-3 | Same as above | 3 / 5 / 5 (first-option run: 6 on day 3) | 95-137 | 36-40 | 9-10 | same | same | same | same | same |
| 4 | Daily drop | 5 (1/1/1/2); first-option run: 6 | **1509** (the tap waited out the 1.1 s splash) | 54 | 13.6 | 115 / 294 | 72% (83%) | + true-not-quite, scenario | 5/5 | **0/6** |
| 5 | Daily drop | 6 (1/1/1/3) | **1501** (same reason) | 40 | 10.1 | 121 / 318 | 72% (84%) | + scenario, predict, choose | 6/6 | 1/6 (practice 0/3) |
| | **5 days** | 24 / 26 | | | | 521 / 1197 | **70%** (knows), 74% (first) | **10** (knows: 3 lesson formats + 7 item types), 8 (first) | 24/24 | 8/26 (practice **2/11**) |

The 4th and 5th lessons in the daily variant were How things work (`lift-s2`, `lift-s3`), not Money or Psychology. With several topics chosen, the daily lesson goes through the first topic in catalog order until it runs out. How things work comes first, so its 30 lessons all come before Money's next one.

## Lessons and item types per topic (built packs, `dist/packs/v`)
| Topic | Concepts | Lessons (steps) | Guided tries per lesson | Practice items | Distinct item types | Item types (count) |
|---|---|---|---|---|---|---|
| Body and training | 8 | 24 | 1 | 48 | 10 | scenario 10, true-not-quite 8, estimate 8, predict 7, why 6, choose 3, fill-the-step 2, explain-it-back 2, order 1, match 1 |
| Health and nutrition | 8 | 24 | 1 | 48 | 10 | scenario 12, true-not-quite 8, estimate 8, why 5, choose 5, predict 4, fill-the-step 3, match 1, order 1, explain-it-back 1 |
| History and civilisations | 8 | 24 | 1 | 48 | 10 | predict 8, scenario 8, estimate 8, true-not-quite 7, match 5, choose 4, order 3, why 3, explain-it-back 1, fill-the-step 1 |
| How things work | 10 | 30 | 1 | 60 | 10 | scenario 15, estimate 10, why 9, predict 9, true-not-quite 8, choose 5, explain-it-back 1, match 1, fill-the-step 1, order 1 |
| Money and markets | 10 | 30 | 1 | 60 | 10 | scenario 11, estimate 11, fill-the-step 10, predict 9, true-not-quite 6, choose 5, match 3, order 2, why 2, explain-it-back 1 |
| Psychology | 10 | 30 | 1 | 60 | 10 | predict 10, scenario 10, estimate 10, why 8, choose 5, explain-it-back 4, fill-the-step 4, order 2, match 3, true-not-quite 4 |
| **All** | **54** | **162** | **1** | **324** | 10 each | |

- Every step now has exactly **one** guided try (0 of 162 have a second), so `StepLesson.tsx`'s `slice(0, 1)` hides nothing today.
- Order and match are rare: 2-8 per topic, 24 of the 324 items (10 order, 14 match). That is why a week of play met order twice and match never.
- 10 item types, but 7 of them are the same input: tap one option. A learner meets 4 input models at most.

## What could not be measured as written, and what was measured instead
| Spec / job wording | Problem | Measured instead |
|---|---|---|
| "2 practice drops on later days" | No practice-only daytime drop exists for this learner in week 1. The daily drop always teaches a lesson while an untaught step is left. "Practice this idea" teaches the idea's next step first (`makeDrop` in `src/ui/learn/flow.ts`). "Idea checks" shows only when an idea is due, and none was on days 4-5. Spec 23's "a practice-only drop asks 5" happens only once every step of the chosen topics is taught. | (a) Daytime "Practice this idea": a lesson plus 1 question. (b) The night drop: 0 and 2 questions. (c) As a separate variant, the daily drop on days 4-5. |
| "Seconds to the first tap" | A script taps as soon as a button appears. Its timings are machine speed, not a person. | App latency (ms from the tap on Start to the first answer screen), plus words before the first tap converted at 238 wpm. Jenil's stopwatch on both apps is still the real number. |
| "Share of time reading vs answering" | Same reason: there is no human time. | Share of **words** on teach and Show me screens vs question screens (stems, options and result sheets). The Show me tap is counted as reading, as the job asked. The bracketed figure counts it as answering. Row 1 counts the Show me tap as an answer, as spec 23's "3-6" does. |
| "First-try correct on practice" | Fixed strategies give a ceiling (100%) and a floor, not a learner's rate. The floor is also lifted by the shuffle bug below. | Both strategies are reported. The 60-85% band needs Jenil's own answers, or the owner panel's first-try figure once it exists. |
| "Question types seen in one week" | The job plays 5 days. | Types over 5 days, both counts: pack item types and input models. |

## Bugs found (not fixed: this job changes no app code)
1. **The option shuffle leaks the answer by position.**
   - Where: `orderOptions` in `src/core/learn/engine/session.ts` (practice items) and `shuffled` in `src/ui/learn/StepLesson.tsx` (hook and guided try).
   - Packs list the right option first: 216 of 245 choice items, and all 162 hooks. Option ids are `a`, `b`, `c`, so the keys differ only in their last character, and the FNV-style hash keeps much of that order.
   - Practice choice items: the right option shows first in **46.9%** of seeds, against 33.3% by chance (245 items, about 100 seeds each).
   - Hooks: right option shown first in **79 of 162**, where chance predicts 54. Guided tries: **73 of 162**, against 54.
   - Order items are shown already in the right order in **25%** of seeds for 3-step items (chance 16.7%) and **12.5%** for 4-step items (chance 4.2%).
   - When the seed comes from a whole-minute time (`now % 1_000_000`), `inflation-16` and `indian-place-value-15` show already solved 98-100% of the time. That is why the first-option player "solved" every order item in this run. Real taps rarely fall on a whole minute, but every fixed-clock test does.
   - Effect: a learner who always taps the top option scores well above chance. That inflates row 4 and weakens "Guess first".
2. **The opening splash eats the first tap.**
   - Where: `OpenMoment` in `src/ui/cast/OpenMoment.tsx`. It shows for 1.1 s on each cold open, and a tap on it only closes it.
   - Seen as the 1.5 s first-answer latency on the days-4-5 daily drops, and in `knows-d4-open-splash.png`.
   - This is by design, not a crash. But it adds 1.1 s, plus one wasted tap, to "seconds to the first tap" for anyone who taps straight away.

Also seen (not bugs):
- A missed item comes back first every day until it is answered right. In the first-option run, `habits-9` was asked on days 2, 3, 4 and 5.
- No horizontal scroll in any session. No page errors.

## Screenshots (`docs/reviews/cj6-scorecard/`)
| File | Shows |
|---|---|
| knows-d1-hook.png, knows-d1-hook-fb.png | Day 1 hook guess and its result sheet |
| knows-d1-teach.png | The teach card (the only pure reading screen) |
| knows-d1-show.png | Show me: "Tap the cue." |
| knows-d1-guided.png | The one guided try. Its right option, "The desk cue.", repeats the card's word "cue". |
| first-d1-guided-fb.png | The same try missed by the first-option player |
| knows-d1-stop.png | Day 1 stopping screen ("1 new idea.") |
| knows-d2-learn-screen.png | Learn screen, Money added to drops |
| knows-d2-q1-fb.png | Day 2 recap question, right |
| knows-d3-q2.png | Order item ("Put in order"). Here it is shown already in the right order (bug 1). |
| first-d3-q1-fb.png | A recap miss: "Right answer" plus "See the idea again" |
| knows-d4-open-splash.png | The 1.1 s opening splash (bug 2) |
| knows-d4-q1.png, knows-d4-stop.png | Day 4 "Practice this idea": the 1 question after the lesson, and its stop screen ("1 new idea · 1 question") |
| knows-d4n-stop.png | Day 4 night drop: "Nothing to review tonight." |
| knows-d5n-stop.png | Day 5 night drop: 2 questions |
| knows-daily-d5-q2.png | Day 5 daily drop: the same Kunal item as day 2, back after 3 days |
| first-daily-d5-q1-fb.png | Day 5 daily drop miss on a true-not-quite item |

## Re-running it
The scripts were kept out of the repo, as the job asked. They are reproduced below so the next run measures the same way:

1. `npm ci && npm run build`, then `npx vite preview --port 4636`.
2. `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node measure.cjs http://localhost:4636 dist/packs/v ./shots ./results.json`. It needs `@playwright/test` from the worktree's `node_modules`; the `createRequire` path at the top points there.
3. `node count.mjs dist/packs/v` for the pack counts. `npx tsx first-check.ts` and `npx tsx order-check.ts` for the shuffle figures.

<details><summary>measure.cjs</summary>

```js
// cj6 scorecard: drives the production build at 360x800 with a fresh profile and a fixed clock.
// Usage: node measure.cjs <baseURL> <packDir> <shotDir> <outJson>
const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const req = createRequire('/home/user/wt-cj6-scorecard/package.json');
const { chromium } = req('@playwright/test');

const [baseURL, packDir, shotDir, outJson] = process.argv.slice(2);
const WPM = 238; // Brysbaert 2019, silent reading of non-fiction in English

// ---- packs ----
const packs = fs.readdirSync(packDir).filter(f => f.startsWith('topic.')).map(f => JSON.parse(fs.readFileSync(path.join(packDir, f), 'utf8')));
const hookByStem = new Map(), guidedByStem = new Map(), itemsByStem = new Map();
for (const pack of packs) for (const module of pack.body.modules) for (const concept of module.concepts) {
  for (const step of concept.steps ?? []) {
    hookByStem.set(step.hook.stem, { step, concept, topic: pack.body.topic.id });
    step.guided.forEach((g, i) => guidedByStem.set(g.stem, { step, guided: g, index: i, concept, topic: pack.body.topic.id }));
  }
  for (const item of concept.items) itemsByStem.set(item.stem, [...(itemsByStem.get(item.stem) ?? []), { item, concept, topic: pack.body.topic.id }]);
}

const words = text => (text ?? '').split(/\s+/).filter(Boolean).length;
const secs = n => +(n / WPM * 60).toFixed(1);

async function screenKey(page) {
  return page.evaluate(() => {
    if (document.querySelector('.learn-stop')) return 'stop';
    const lesson = document.querySelector('.step-lesson');
    const h = document.querySelector('.step-lesson h2, .learn-drop h2');
    const fb = document.querySelector('.learn-feedback');
    const head = document.querySelector('.learn-drop-head');
    return `${lesson ? lesson.getAttribute('data-lesson-phase') : 'q'}|${h ? h.textContent : ''}|${fb ? 'fb' : ''}|${head ? head.textContent : ''}`;
  });
}
async function waitChange(page, prev) {
  await page.waitForFunction(prevKey => {
    const key = (() => {
      if (document.querySelector('.learn-stop')) return 'stop';
      const lesson = document.querySelector('.step-lesson');
      const h = document.querySelector('.step-lesson h2, .learn-drop h2');
      const fb = document.querySelector('.learn-feedback');
      const head = document.querySelector('.learn-drop-head');
      return `${lesson ? lesson.getAttribute('data-lesson-phase') : 'q'}|${h ? h.textContent : ''}|${fb ? 'fb' : ''}|${head ? head.textContent : ''}`;
    })();
    return key !== prevKey && !key.startsWith('q||');
  }, prev, { timeout: 15000 });
}
async function settle(page, log) {
  let last = await screenKey(page), same = 0;
  const seen = [last];
  for (let i = 0; i < 60 && same < 3; i++) { await page.waitForTimeout(100); const k = await screenKey(page); same = k === last ? same + 1 : 0; if (k !== last) seen.push(k); last = k; }
  if (log && seen.length > 1) log.push(seen.map(k => k.slice(0, 80)));
}
const hscroll = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

async function shot(page, name, state) {
  if (!state.shots.has(name)) return;
  // Let the sheet and finish animations settle so the picture shows the resting screen.
  if (name.endsWith('-fb') || name.endsWith('-stop')) await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(shotDir, `${state.prefix}-${name}.png`) });
  state.taken.push(`${state.prefix}-${name}.png`);
}

/** Plays whatever the drop shows until its stopping screen. */
async function playSession(page, session, strategy, state, shotTag) {
  const t0 = session._t0;
  const sessionWall = performance.now();
  let firstTapDone = false;
  const markFirstTap = (wordsBefore) => {
    if (firstTapDone) return; firstTapDone = true;
    session.appMsToFirstTappable = Math.round(session._firstVisible - t0);
    session.wordsBeforeFirstTap = wordsBefore;
    session.estSecondsToFirstTap = secs(wordsBefore);
  };
  let guard = 0;
  while (guard++ < 40) {
    await page.waitForFunction(() => document.querySelector('.learn-stop') || document.querySelector('.step-lesson .learn-q') || document.querySelector('.learn-drop .learn-q'), null, { timeout: 15000 });
    if (!session._firstVisible) session._firstVisible = performance.now();
    session.unsettled = session.unsettled ?? [];
    await settle(page, session.unsettled);
    if (await page.locator('.learn-stop').count()) break;
    if (await hscroll(page)) session.horizontalScroll = true;
    const key = await screenKey(page);
    const lesson = page.locator('.step-lesson');
    if (await lesson.count()) {
      const phase = await lesson.getAttribute('data-lesson-phase');
      const q = page.locator('.step-lesson .learn-q');
      const before = words(await q.innerText());
      if (phase === 'teach') {
        session.screens.push({ kind: 'teach', reading: true, wordsBefore: before, wordsAfter: 0 });
        await shot(page, `${shotTag}-teach`, state);
        await page.locator('.step-continue').click();
        await waitChange(page, key);
        continue;
      }
      if (phase === 'show') {
        const h = (await page.locator('.step-lesson .learn-ask').innerText()).trim();
        const parts = page.locator('.step-part');
        // find step by the concept title + example ask; easier: by current hook seen earlier
        const step = session._step;
        await shot(page, `${shotTag}-show`, state);
        markFirstTap(before);
        if (strategy === 'first') await parts.first().click();
        else await page.getByRole('button', { name: step.example.spot.trim(), exact: true }).click();
        const sheet = page.locator('.learn-feedback');
        await sheet.waitFor();
        const title = (await sheet.locator('.learn-sheet-title').innerText()).trim();
        const after = words(await sheet.innerText());
        session.screens.push({ kind: 'show', type: 'show me (tap the part)', reading: true, answer: true, correct: title === 'Spot on.', wordsBefore: before, wordsAfter: after, ask: h });
        await shot(page, `${shotTag}-show-fb`, state);
        await sheet.getByRole('button').click();
        await waitChange(page, key);
        continue;
      }
      // hook or guided-N
      const stem = (await page.locator('.step-lesson h2').innerText()).trim();
      let options, kind, type;
      if (phase === 'hook') {
        const ref = hookByStem.get(stem); if (!ref) throw new Error(`unknown hook ${stem}`);
        session._step = ref.step; session.lessonStep = ref.step.id; session.lessonTopic = ref.topic; session.lessonConcept = ref.concept.id;
        options = ref.step.hook.options; kind = 'hook'; type = 'hook guess (tap to choose)';
      } else {
        const ref = guidedByStem.get(stem); if (!ref) throw new Error(`unknown guided ${stem}`);
        options = ref.guided.options; kind = 'guided'; type = 'guided try (tap to choose)';
      }
      await shot(page, `${shotTag}-${kind}`, state);
      markFirstTap(before);
      const opts = page.locator('.step-lesson .learn-options button');
      if (strategy === 'first') await opts.first().click();
      else await page.locator('.step-lesson .learn-options').getByRole('button', { name: options.find(o => o.correct).text, exact: true }).click();
      const sheet = page.locator('.learn-feedback');
      await sheet.waitFor();
      const title = (await sheet.locator('.learn-sheet-title').innerText()).trim();
      const after = words(await sheet.innerText());
      session.screens.push({ kind, type, reading: false, answer: true, correct: title === 'Exactly.', wordsBefore: before, wordsAfter: after, optionCount: await opts.count() });
      await shot(page, `${shotTag}-${kind}-fb`, state);
      await sheet.getByRole('button').click();
      await waitChange(page, key);
      continue;
    }
    // A practice question.
    const q = page.locator('.learn-drop .learn-q');
    const drop = page.locator('.learn-drop');
    const stem = (await page.locator('.learn-drop h2').innerText()).trim();
    const eyebrow = (await page.locator('.learn-drop .learn-ask-bubble .eyebrow').innerText()).trim();
    const refs = itemsByStem.get(stem) ?? [];
    const ref = refs.find(r => r.concept.title === eyebrow) ?? refs[0];
    if (!ref) throw new Error(`unknown item ${stem}`);
    const { item } = ref;
    const shown = await drop.locator('.learn-options button').allInnerTexts().catch(() => []);
    if (process.env.DEBUG) console.log('Q', JSON.stringify({ stem, eyebrow, refs: refs.map(r => r.concept.title + ':' + r.item.id), type: item.type, opts: item.options.map(o => o.text), shown }));
    const before = words(await q.innerText());
    await shot(page, `${shotTag}-q${session.screens.filter(s => s.kind === 'question').length + 1}`, state);
    markFirstTap(before);
    const tapId = id => drop.locator('.learn-options').getByRole('button', { name: item.options.find(o => o.id === id).text, exact: true }).click();
    const check = page.getByRole('button', { name: /^Check/ }).first();
    let taps = 0;
    if (strategy === 'first') {
      if (item.type === 'estimate') {
        const slider = page.locator('.learn-estimate input[type=range]');
        await slider.fill((await slider.getAttribute('min')));
        taps++;
        if (!(await check.isVisible())) { await page.getByRole('button', { name: 'A little more' }).click(); taps++; }
      } else if (item.type === 'order' || item.type === 'match') {
        for (let i = 0; i < 12 && !(await check.isVisible()); i++) {
          await drop.locator('.learn-options button:not([disabled]):not(.selected)').first().click(); taps++;
        }
      } else { await drop.locator('.learn-options button').first().click(); taps++; }
    } else {
      if (item.type === 'order') for (const id of item.answer) { await tapId(id); taps++; }
      else if (item.type === 'match') {
        const pairs = item.answer.filter((pair, index, all) => !all.slice(0, index).some(seen => seen.left === pair.right && seen.right === pair.left));
        for (const pair of pairs) { await tapId(pair.left); await tapId(pair.right); taps += 2; }
      } else if (item.type === 'estimate') { await page.locator('.learn-estimate input[type=range]').fill(String(item.answer.value)); taps++; }
      else { await tapId(item.options.find(o => o.correct).id); taps++; }
    }
    const checkLabel = (await check.innerText()).trim();
    await check.click(); taps++;
    const sheet = page.locator('.learn-feedback');
    await sheet.waitFor();
    await sheet.getByRole('button', { name: 'Next' }).waitFor();
    await page.waitForFunction(() => !document.querySelector('.learn-feedback button:last-of-type')?.hasAttribute('disabled'));
    const title = (await sheet.locator('.learn-sheet-title').innerText()).trim();
    const after = words(await sheet.innerText());
    session.screens.push({ kind: 'question', type: item.type, itemId: item.id, topic: ref.topic, step: item.step, reading: false, answer: true, correct: title === 'Exactly.', wordsBefore: before, wordsAfter: after, taps, checkLabel, ideaAgainOffered: (await sheet.getByRole('button', { name: 'See the idea again' }).count()) > 0 });
    await shot(page, `${shotTag}-q${session.screens.filter(s => s.kind === 'question').length}-fb`, state);
    await sheet.getByRole('button', { name: 'Next' }).click();
    await waitChange(page, key);
  }
  session.botWallSeconds = +((performance.now() - sessionWall) / 1000).toFixed(1);
  session.stopText = (await page.locator('.learn-stop').innerText()).replace(/\s+/g, ' ').trim();
  await shot(page, `${shotTag}-stop`, state);
  if (await hscroll(page)) session.horizontalScroll = true;
  delete session._t0; delete session._firstVisible; delete session._step;
  summarise(session);
}

function summarise(s) {
  const answers = s.screens.filter(x => x.answer);
  const readingWords = s.screens.filter(x => x.reading).reduce((n, x) => n + x.wordsBefore + x.wordsAfter, 0);
  const questionWords = s.screens.filter(x => !x.reading).reduce((n, x) => n + x.wordsBefore + x.wordsAfter, 0);
  // Variant: Show me counted as a question screen (it is a tap with right/wrong).
  const readingWordsTeachOnly = s.screens.filter(x => x.kind === 'teach').reduce((n, x) => n + x.wordsBefore, 0);
  s.summary = {
    answers: answers.length,
    answersByKind: Object.fromEntries(['hook', 'show', 'guided', 'question'].map(k => [k, answers.filter(a => a.kind === k).length])),
    firstTryCorrect: `${answers.filter(a => a.correct).length}/${answers.length}`,
    practiceFirstTryCorrect: `${answers.filter(a => a.kind === 'question' && a.correct).length}/${answers.filter(a => a.kind === 'question').length}`,
    lessonFirstTryCorrect: `${answers.filter(a => a.kind !== 'question' && a.correct).length}/${answers.filter(a => a.kind !== 'question').length}`,
    typesSeen: [...new Set(answers.map(a => a.type))],
    readingWords, questionWords,
    readingShare: +(readingWords / (readingWords + questionWords || 1)).toFixed(2),
    answeringShare: +(questionWords / (readingWords + questionWords || 1)).toFixed(2),
    answeringShareShowMeAsQuestion: +((questionWords + readingWords - readingWordsTeachOnly) / (readingWords + questionWords || 1)).toFixed(2),
    estReadingSeconds: secs(readingWords), estQuestionSeconds: secs(questionWords), estTotalSeconds: secs(readingWords + questionWords),
  };
}

async function run(strategy, prefix, shots, later = 'practice') {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, timezoneId: 'Asia/Kolkata', serviceWorkers: 'block', colorScheme: 'light' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const state = { prefix, shots: new Set(shots), taken: [] };
  const sessions = [];
  const day = n => new Date(`2026-10-${25 + n}T12:00:00+05:30`); // day 1 = Mon 26 Oct 2026, 12:00 IST

  // Day 1: fresh install, welcome, "Learn something" -> first lesson (Psychology starter).
  await page.clock.setFixedTime(day(1));
  await page.goto(baseURL + '/');
  const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await welcome.getByLabel("I'm 18 or older.").check();
  await welcome.getByRole('button', { name: "Let's start" }).click();
  await welcome.getByRole('button', { name: 'Learn something' }).click();
  await welcome.getByLabel('Bedtime').fill('23:00');
  let s = { day: 1, name: 'New-idea lesson 1 (Psychology)', path: 'First run: Welcome -> "Learn something" -> Start your first lesson', strategy, screens: [] };
  s._t0 = performance.now();
  await welcome.getByRole('button', { name: 'Start your first lesson' }).click();
  await playSession(page, s, strategy, state, 'd1');
  sessions.push(s);

  // Days 2 and 3: add the next topic from the Learn screen; the daily drop teaches its first step (catalog order) then the recap tail.
  for (const [d, topic, name] of [[2, 'Money and markets', 'Money'], [3, 'How things work', 'How things work']]) {
    await page.clock.setFixedTime(day(d));
    await page.goto(baseURL + '/#learn'); await page.reload();
    const card = page.locator('.learn-map-topic').filter({ hasText: topic });
    await card.getByRole('button', { name: 'Add to my drops' }).click();
    await page.getByText('Topics updated.').waitFor();
    if (d === 2) await shot(page, 'd2-learn-screen', state);
    s = { day: d, name: `New-idea lesson ${d} (${name})`, path: `Learn -> "${topic}" Add to my drops -> Today's drop Start`, strategy, screens: [] };
    s._t0 = performance.now();
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Start' }).click();
    await playSession(page, s, strategy, state, `d${d}`);
    sessions.push(s);
  }

  // Days 4 and 5: a practice-only session from the Learn screen.
  const entries = {};
  for (const d of [4, 5]) {
    await page.clock.setFixedTime(day(d));
    await page.goto(baseURL + '/#learn'); await page.reload();
    await page.getByRole('region', { name: 'Today' }).waitFor();
    const today = page.getByRole('region', { name: 'Today' });
    entries[d] = (await today.innerText()).replace(/\s+/g, ' ');
    await shot(page, `d${d}-learn-screen`, state);
    const checks = today.getByRole('button', { name: /Idea checks/ });
    if (later === 'daily') {
      s = { day: d, name: `Daily drop day ${d}`, path: "Learn -> Today's drop Start", strategy, screens: [] };
      s._t0 = performance.now();
      await today.getByRole('button', { name: 'Start' }).click();
      await playSession(page, s, strategy, state, `d${d}`);
      sessions.push(s);
      continue;
    }
    if (await checks.count()) {
      s = { day: d, name: `Practice drop ${d - 3}`, path: `Learn -> "${(await checks.innerText()).trim()}"`, strategy, screens: [] };
      s._t0 = performance.now();
      await checks.click();
    } else {
      // No due-review entry: practise a taught idea from the mastery map.
      const card = page.locator('.learn-map-topic').filter({ hasText: 'Human psychology' });
      await card.locator('.learn-topic-expand').click();
      const btn = card.getByRole('button', { name: /^Practice this idea/ }).first();
      s = { day: d, name: `Practice drop ${d - 3}`, path: `Learn -> Human psychology -> ${await btn.getAttribute('aria-label')}`, strategy, screens: [] };
      s._t0 = performance.now();
      await btn.click();
    }
    await playSession(page, s, strategy, state, `d${d}`);
    sessions.push(s);
    // Same day, 23:15 (bedtime 23:00): the night drop, the only practice-only drop this learner can reach.
    await page.clock.setFixedTime(new Date(`2026-10-${25 + d}T23:15:00+05:30`));
    await page.goto(baseURL + '/#night'); await page.reload();
    const deck = page.getByRole('region', { name: 'Now deck' });
    await deck.waitFor();
    for (let i = 0; i < 3 && !(await page.getByRole('article', { name: 'Night drop card' }).isVisible()); i++) await deck.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('article', { name: 'Night drop card' }).waitFor();
    s = { day: d, name: `Night drop ${d - 3}`, path: 'Night deck (#night, 23:15) -> card 2 "Night drop"', strategy, screens: [] };
    s._t0 = performance.now();
    await shot(page, `d${d}n-card`, state);
    await playSession(page, s, strategy, state, `d${d}n`);
    sessions.push(s);
  }
  await browser.close();
  return { strategy, later, sessions, entries, errors, shots: state.taken };
}

(async () => {
  fs.mkdirSync(shotDir, { recursive: true });
  const out = [];
  out.push(await run('knows', 'knows', ['d1-hook', 'd1-hook-fb', 'd1-teach', 'd1-show', 'd1-guided', 'd1-stop', 'd2-learn-screen', 'd2-hook', 'd2-q1', 'd2-q1-fb', 'd2-stop', 'd3-q2', 'd3-stop', 'd4-learn-screen', 'd4-q1', 'd4-stop', 'd4n-q1', 'd4n-q1-fb', 'd4n-stop', 'd5n-stop']));
  out.push(await run('first', 'first', ['d1-guided-fb', 'd3-q1-fb', 'd4n-q1-fb', 'd5n-stop']));
  out.push(await run('knows', 'knows-daily', ['d4-stop', 'd5-q2'], 'daily'));
  out.push(await run('first', 'first-daily', ['d5-q1-fb'], 'daily'));
  fs.writeFileSync(outJson, JSON.stringify(out, null, 1));
  for (const r of out) {
    console.log(`== ${r.strategy} ${r.later} errors=${r.errors.length}`, r.errors.slice(0, 3));
    for (const s of r.sessions) console.log(`D${s.day} ${s.name} | ${s.path}\n  `, JSON.stringify(s.summary), `firstTap appMs=${s.appMsToFirstTappable} words=${s.wordsBeforeFirstTap} est=${s.estSecondsToFirstTap}s hscroll=${!!s.horizontalScroll}\n   stop: ${s.stopText}`);
    console.log('entries', r.entries);
  }
})().catch(e => { console.error(e); process.exit(1); });
```

</details>

<details><summary>count.mjs</summary>

```js
import { readFileSync, readdirSync } from 'node:fs';
const dir = process.argv[2];
const rows = [];
for (const f of readdirSync(dir).filter(f => f.startsWith('topic.'))) {
  const p = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const concepts = (p.body.modules ?? []).flatMap(m => m.concepts);
  const steps = concepts.flatMap(c => c.steps ?? []);
  const items = concepts.flatMap(c => c.items ?? []);
  const types = {};
  for (const i of items) types[i.type] = (types[i.type] ?? 0) + 1;
  const stepless = concepts.filter(c => !c.steps?.length).length;
  const guided = steps.reduce((s, x) => s + (x.guided?.length ?? 0), 0);
  const guided2 = steps.filter(x => (x.guided?.length ?? 0) >= 2).length;
  const wrongOpts = items.flatMap(i => i.options.filter(o => !o.correct && i.type !== 'order' && i.type !== 'match' && i.type !== 'estimate'));
  const tagged = wrongOpts.filter(o => o.misconceptionIds?.length).length;
  rows.push({ f, kind: p.kind, modules: p.body.modules?.length, concepts: concepts.length, stepless, steps: steps.length, guided, stepsWith2Guided: guided2, items: items.length, distinctTypes: Object.keys(types).length, types, itemsWithStep: items.filter(i => i.step).length, wrongChoiceOpts: wrongOpts.length, wrongTagged: tagged });
}
console.log(JSON.stringify(rows, null, 1));
```

</details>

<details><summary>first-check.ts</summary>

```js
import { orderOptions } from '/home/user/wt-cj6-scorecard/src/core/learn/engine/session';
const hash = (value: string) => { let h = 2166136261; for (const char of value) h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0; return h; };
const shuffled = <T extends { id: string }>(options: readonly T[], seed: string): T[] => [...options].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`));
import { readFileSync } from 'node:fs';
const topics = ['money-markets','psychology','how-things-work','history-civilisations','health-nutrition','body-training'];
const concepts = topics.flatMap(t => JSON.parse(readFileSync(`/home/user/wt-cj6-scorecard/content/topics/topic.${t}.json`, 'utf8')).body.modules.flatMap((m: any) => m.concepts));
const choice = concepts.flatMap((c: any) => c.items).filter((i: any) => !['order', 'match', 'estimate'].includes(i.type));
let hit = 0, total = 0, chance = 0, listedFirst = 0;
for (const item of choice) { if (item.options[0].correct) listedFirst++; for (let s = 0; s < 1_000_000; s += 9973) { total++; chance += 1 / item.options.length; const first = orderOptions(item, s)[0]; if (item.options.find((o: any) => o.id === first).correct) hit++; } }
console.log('practice choice items', choice.length, 'right option listed first in pack', listedFirst, 'right shown first', (hit / total * 100).toFixed(1) + '%', 'chance', (chance / total * 100).toFixed(1) + '%');
const steps = concepts.flatMap((c: any) => c.steps ?? []);
let h = 0, g = 0, hc = 0, gc = 0, hl = 0;
for (const step of steps) {
  if (step.hook.options[0].correct) hl++;
  if (shuffled(step.hook.options, `${step.id}:hook`)[0].correct) h++; hc += 1 / step.hook.options.length;
  if (shuffled(step.guided[0].options, `${step.id}:0`)[0].correct) g++; gc += 1 / step.guided[0].options.length;
}
console.log('steps', steps.length, 'hook right listed first', hl, 'hook right shown first', h, 'chance', hc.toFixed(1), 'guided right shown first', g, 'chance', gc.toFixed(1));
```

</details>

<details><summary>order-check.ts</summary>

```js
import { orderOptions } from '/home/user/wt-cj6-scorecard/src/core/learn/engine/session';
import { readFileSync } from 'node:fs';
const topics = ['money-markets','psychology','how-things-work','history-civilisations','health-nutrition','body-training'];
const items = topics.flatMap(t => JSON.parse(readFileSync(`/home/user/wt-cj6-scorecard/content/topics/topic.${t}.json`, 'utf8')).body.modules.flatMap((m: any) => m.concepts).flatMap((c: any) => c.items)).filter((i: any) => i.type === 'order');
let same = 0, total = 0;
for (const item of items) for (let s = 0; s < 1_000_000; s += 997) { total++; if (orderOptions(item, s).join() === item.answer.join()) same++; }
console.log('order items', items.length, 'seeds tried', total, 'shown in the right order', same, (same / total * 100).toFixed(1) + '%');
for (const d of [27, 28, 29, 30]) { const now = Date.parse(`2026-10-${d}T12:00:00+05:30`); const i = items.find((x: any) => x.id === 'inflation-16'); console.log(d, now % 1_000_000, orderOptions(i, now % 1_000_000).join()); }
const n = Date.parse('2026-10-30T23:15:00+05:30'); console.log('night30', orderOptions(items.find((x: any) => x.id === 'inflation-16'), n % 1_000_000).join());
for (const item of items) { let same = 0, total = 0; for (let s = 0; s < 1_000_000; s += 997) { total++; if (orderOptions(item, s).join() === item.answer.join()) same++; } console.log(item.id, item.options.length, (same / total * 100).toFixed(1) + '%'); }
// Real seeds the app uses: now % 1e6 for a drop made at a whole minute.
for (const item of items) { let same = 0, total = 0; for (let m = 0; m < 24 * 60; m++) { total++; if (orderOptions(item, (Date.parse('2026-10-27T00:00:00Z') + m * 60000) % 1_000_000).join() === item.answer.join()) same++; } console.log('minute seeds', item.id, (same / total * 100).toFixed(1) + '%'); }
```

</details>

