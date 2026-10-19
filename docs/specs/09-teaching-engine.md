# 09 · Teaching engine (replaces the "lesson reader" model)

Status: approved direction, 2026-10-11 (Jenil). Offline-first: no AI at runtime. Content is written ahead of
time and must pass an accuracy gate. First topics: **Money and markets**, **Human psychology**,
**How things work**. Learning lives in the Learn tab of the five-tab layout; owner tools live in Settings.

## 1. Goal

Teach real understanding in 3–8 minute bursts with less friction than Duolingo and more accuracy than an AI chat.
Success is measured, not felt:
- **Retention:** recall of a concept 7 and 30 days after its first answer (scheduled checks independent of FSRS),
  target ≥ 80%. The Learn tab shows the 30-day recalled share once checks exist.
- **Transfer:** correct answers on *new* scenario questions the learner has never seen, target ≥ 70%.
- **Calibration:** confidence vs accuracy gap, shrinking over time. The Learn tab can show the number of certain
  answers and correct rates for certain and guess answers. The Learn tab shows the sure-answer correct rate after 20 sure answers.
- **Friction:** median time from opening the app to the first answer < 5 s; zero typing in the default path.

## 2. What the learning science says we must do (and Duolingo mostly doesn't)

| Principle | How the engine applies it |
|---|---|
| Retrieval practice beats re-reading | Every unit starts with a question, not text. Explanations come after an attempt. |
| Generation / prediction effect | "Guess first" items: predict the outcome before seeing it, even when the learner can't know yet. |
| Spaced repetition | FSRS-style scheduler per *concept* (not per card), so one concept can be tested by many different items. |
| Interleaving | Mix items across concepts only after each has been attempted or has mastery above zero. Keep new items in a drop within one newly unlocked concept; reviews may come from other started concepts. |
| Desirable difficulty | Adaptive target: the next item is chosen so predicted success is ~75–85%. |
| Concrete → abstract | Each concept is introduced through one vivid real example, then the general rule, then a second example from a different domain. |
| Elaboration | "Why?" items: pick the reason, or spot the flaw in a wrong explanation. |
| Worked example → faded | Multi-step skills (e.g. compound interest) show a full worked example, then the same with one step blank, then two. |
| Confidence calibration | Optional confidence tap (Sure / Fairly sure / Guessing), with Fairly sure selected by default; confident misses are re-scheduled sooner and highlighted kindly. |
| Real-world transfer | Each module ends with a side quest that uses the idea outside the app (pairs with Side quests). |

## 3. The content model

```
Topic (e.g. Money and markets)
 └─ Module (e.g. "How money grows")          — 5–8 concepts, ~1 week
     └─ Concept (e.g. "Compounding")          — the unit of mastery and scheduling
         ├─ prerequisites: [conceptId…]       — a small knowledge graph
         ├─ hook: one vivid real example (≤ 280 chars)
         ├─ rule: the general idea in plain words (≤ 280 chars)
         ├─ items: 8–20 practice items of mixed types (§4), each tagged with difficulty seed and misconception
         ├─ misconceptions: named wrong ideas with a short correction
         ├─ sources: [ {title, author/publisher, year, url} ] — every factual claim traces to one
         └─ quest: optional real-world side quest
```
Everything is a validated JSON pack (Valibot), versioned, bundled offline and updatable through the existing pack
pipeline. Concepts are shared across topics (e.g. "loss aversion" is in psychology and in markets) so practice in one
place strengthens the other.

## 4. Item types (all answerable by tapping)

1. **Predict** — "What happens next?" before the explanation.
2. **Choose** — single best answer with plausible distractors drawn from named misconceptions.
3. **Why** — pick the reason; or **Spot the flaw** in a short wrong explanation.
4. **Order** — put steps or events in order (drag or tap-to-place).
5. **Match** — pair terms with examples.
6. **Estimate** — slide to a number (e.g. "₹10,000 at 12% for 10 years ≈ ?"); scored by closeness.
7. **Scenario** — a short real-life situation; choose what a person should expect or do.
8. **Fill the step** — faded worked examples.
9. **True / not quite** — a claim with a twist, for fast reviews.
10. **Explain it back** (optional) — choose the best of three explanations written for a friend.

Every item has: stem, options, the correct answer, per-option feedback (why each wrong option is wrong), the concept
id, a difficulty seed, misconception tags and a source reference.

## 5. The adaptive core (pure TypeScript in `src/core/learn/engine/`)

- **Learner model per concept:** mastery `p(known)` (Bayesian Knowledge Tracing-style update after each answer, with
  slip and guess parameters per item type) plus an FSRS memory state (stability, difficulty, last review).
- **Item difficulty:** an Elo-style rating per item, updated from answers (seeded from the pack), so difficulty
  calibrates itself with use.
- **Next-item choice:** among concepts that are due or newly unlocked (all prerequisites ≥ 0.8 mastery), pick the
  item whose predicted success is closest to the target band (75–85%), excluding the last 3 item types used and
  any item seen in the last 2 days, preferring items that target the learner's active misconceptions. A concept is
  started after an answer or when its stored mastery is above zero. In a drop, new items stay within the first new
  concept selected; only started concepts are interleaved as reviews.
- **Retention checks:** record the first answer time per concept, then offer one check item at +7 days and one at
  +30 days, even when FSRS says the concept is not due. Put at most two checks in a drop and record each result as
  a retention fact. `retentionSummary(state, now)` returns `checked7`, `recalled7`, `checked30`, and `recalled30`
  from completed check facts. Checks count toward the drop size and daily budget.
- **Calibration:** confident misses are due sooner. `calibration(state)` returns `confidentAnswers`,
  `confidentCorrectRate`, and `unsureCorrectRate` from answer facts; certain means confident, guess means unsure,
  and a rate with no answers is zero.
- **Session composer:** a "drop" is 6–10 items, ~5 minutes: about 60% reviews and 40% new. It never exceeds the daily
  budget from the learning-tracks rules, and it ends on a stopping screen. A busy day shrinks it to 3 items.
- **Mastery map:** each concept shows Not started / Learning / Strong / Mastered (mastery ≥ 0.95 and FSRS
  stability ≥ 21 days). This is visible, but never an infinite feed.
- **Night mode:** after bedtime, reviews only, no new concepts.
- **Determinism:** all functions are pure and take time and random seeds as arguments; everything is unit-tested
  with worked examples.

## 6. Accuracy gate (content can't ship without it)

1. **Draft:** a model writes a concept from the pack template, with a source for every factual claim.
2. **Automatic checks** in CI: schema, exactly one correct answer, distractors that differ, every claim linked to a
   source, reading level (target: Flesch ≥ 60), banned words, no medical, legal or financial *advice*
   ("this is how it works", never "you should buy").
3. **Independent fact check:** a different model with web access (Gemini) checks each claim against its source and
   current reality, and writes a verdict per claim (supported / unsupported / outdated). Anything not "supported"
   blocks the pack.
4. **Owner spot check:** Jenil reviews 5 ISO-week-seeded items per module in Settings → About → Review content.
   Rejected items go back to step 1.
5. **Live signal:** items with abnormal error rates or many "this seems wrong" flags are pulled for re-check.
India-specific facts (taxes, regulations, rates) carry an `asOf` date and expire into re-check after 12 months.

## 7. Friction rules

- No sign-up, no placement test before the first item; the engine learns from the first answers.
- One tap per answer; feedback appears in place; "Next" is the same button position every time.
- Sessions resume exactly where they stopped (saved after every answer, through `trackWrite`).
- No hearts, no lives, no punishment for wrong answers; mistakes are the most useful items.
- Streaks stay forgiving (freezes, earn-back) and XP follows the existing economy rules (hidden in the baseline).

## 8. First content (pilot)

One deep module per chosen topic, 6 concepts each, ~12 items per concept:
- **Money and markets — "How money grows":** inflation, compounding, the rule of 72, risk vs return,
  diversification, what a stock actually is. No investment advice.
- **Human psychology — "Why we do what we do":** habits (cue-routine-reward), loss aversion, anchoring,
  confirmation bias, social proof, the planning fallacy.
- **How things work — "Things that fly and spin":** lift, how a multirotor turns, batteries and flight time,
  sensors (IMU/GPS), why planes don't flap, how a ceiling fan moves air (merges the drone pilot module).

## 9. Acceptance tests (write first)

1. A correct answer raises concept mastery; a wrong one lowers it; repeated correct answers converge toward ≥ 0.95.
2. A concept with an unmastered prerequisite is never offered as new.
3. The next item's predicted success is inside 75–85% whenever such an item exists.
4. No item type appears more than 2 times in a row; no item repeats within 2 days.
5. A confident miss schedules the concept sooner than an unsure miss.
6. A drop never exceeds the daily budget and always ends on the stopping screen.
7. After bedtime, a drop contains only reviews.
8. FSRS intervals grow after successful reviews and shrink after lapses (worked numbers).
9. A pack with a claim lacking a source, two correct options or an unsupported fact-check verdict fails validation.
10. Resuming mid-drop after closing the app returns to the same item with the same options.
11. A drop interleaves reviews from started concepts, while all new items in that drop belong to one new concept;
    a concept with positive mastery counts as started even if its attempt count is zero.
12. Worked dates show a check at 7 days and another at 30 days regardless of FSRS due dates, no more than two
    checks per drop, stored retention facts, and correct checked/recalled counts.
13. Certain and guess answers yield separate correct rates and a count of certain answers, including confident misses.
