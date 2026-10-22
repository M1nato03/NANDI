# 16 · Fresh practice: one idea, used in different ways

Status: urgent rule pass from the idea engine (jenil-8c, was jenil-04), 22 Oct 2026, before `learn-steps` ships.
Evidence: two independent learner walk-throughs of the four converted topics on `learn-steps` (fc35e7c):
`docs/reviews/learner-money-health.md` (branch `ideas/learner-money-health`) and `docs/reviews/learner-body-how.md`
(branch `ideas/learner-body-how`).

## 1. The problem: steps fixed the topic, not the lesson

Spec 14 gave each idea 3 different claims. That fixed repetition **across** an idea. But inside each step, the hook,
the spot, both guided tries, the takeaway and 2–3 practice items all ask the **same fact, the same way, often with
the same numbers**. That is 6–8 hits on one fact per step. Jenil's complaint ("all feel the same, exact
repetition") has moved inside the lesson.

Measured "fresh" scores (5 = no two questions feel the same, 1 = the inflation complaint again):

| Topic | Taught (avg) | Fresh (avg) | Worst |
|---|---|---|---|
| Money and markets | 3.2 | 1.9 | rule-of-72 and upi-scams: 1 |
| Health and nutrition | 2.9 | 1.9 | free-sugars: 1 |
| Body and training | 2.75 | 2.0 | cardio-talk-test: 1 |
| How things work | 3.4 | 2.5 | birds-and-planes and ceiling-fans: 1 |

**Do not ship `learn-steps` to Jenil until this pass is done.** He will read it as the same failure again.

The reviews found eight causes that repeat across topics. Each one gets a rule below. Rules marked **[V]** can be
checked by the validator, so they should be added there. Rules marked **[R]** go in the content brief and the review
checklist.

## 2. Rules

**R1. Each practice item does a different job [V].** Inside a step, the guided tries stay close to the teach card.
Each practice item then carries a `job` field from this list, and no two items in the same step may share a job:
- `reverse`: find the input from the output (e.g. "prices rose 6%; what did ₹100 of shopping cost last year?").
- `misconception`: catch a tempting wrong belief (uses one of the concept's misconceptions).
- `transfer`: the same idea in a new part of life (money → phone plan, gym → study).
- `combine`: use this step together with an earlier step of the same idea.
- `edge`: a case where the idea does **not** apply, or applies differently.
- `recall`: plain recall. At most one per concept, never in step 1.

**R2. No reused numbers or story frames [V].** A practice item may not reuse a number (other than 0, 1, 2, 10, 100)
or a named person from the same step's hook, spot or guided tries. The same core fact may be asked at most **twice per
step**, guided tries included.

**R3. Match items need 3–4 pairs with no shared words [V].** All 12 match items in Money and Health have 2 pairs, so
placing one forces the other, and most pairs share a word. A pair whose two sides share a content word fails.

**R4. Fill-the-step never asks for the idea's own name [V].** The concept title is already on screen. Fill in a reason
or a worked-out number instead. Fail when the correct option contains a word from the concept title.

**R5. The right answer must not look different [V].** Per topic:
- The correct option is the single longest option in **no more than 40%** of questions (today: 44–57%).
- Absolute words (always, never, only, all, nothing, exactly) appear in distractors no more than **1.5×** as often
  as in correct options (today: up to 4×).
Write one distractor at least as long as the answer, with the same "because" shape.

**R6. Hints point, they do not tell [V].** A hint may not share a content word (≥4 letters, not a stop word) with the
correct option. Spec 14 targets 85–95% first-try correct on guided tries; hints that give the answer push it to
~100%. Good: "Look at how many firms one bad year touches." Bad: "It is a meeting for the owners."

**R7. Teach cards explain why, not who said it [V + R].**
- [V] A teach card must contain a reason link: *because, so, which means, that is why, this is why, since*.
- [V] A teach card may not lean on an authority: *says, according to, recommends, the guide, WHO, CDC, NHS*
  (keep the source in the source panel). Today 12 of 24 Health teach cards do this.
- [R] Raise the teach-card limit from 30 to **40 words** so there is room for the "because". Keep Flesch ≥ 70.

**R8. Never test what the step did not teach [R].** Each practice item must be answerable from its own step's teach,
example and guided tries (plus earlier steps of the same idea). The reviews list about 40 items that break this, by id.
Each one needs either a sentence in that step's teach or example, or to move to the step that teaches it. Terms used in
a question (principal, tenure, bond, dividend, active fund, ISO, aperture, REM) must be taught first or swapped for
plain words.

**R9. Indian learner first [R].** Use Indian sources and settings where one exists (RBI, SEBI, NPCI, ICMR-NIN,
IMD heat advice). Otherwise write "health researchers" and keep the US/UK citation in sources. Use °C and kg, never °F
or psi alone. Adult ranges, not teen ranges, for an 18+ app. Add a safety line where harm is possible: heat illness is
an emergency; get a blood test before iron tablets; UPI fraud → call **1930** (National Cyber Crime Helpline).

## 3. How to run the pass
1. Builder adds the [V] rules to `src/data/packs/validate.ts` (with tests), in editorial mode, on `learn-steps`.
2. Re-run the content agents topic by topic (one branch per topic, as now) with this spec plus that topic's learner
   review as the brief. The reviews already name the failing ids and suggest rewrites.
3. History and Psychology are still being converted: brief them with this spec **before** they are written.
4. Gate: validator clean, then one fresh learner walk-through per topic. Ship when every concept scores
   **fresh ≥ 4 and taught ≥ 4**.

## 4. Kill test
After Jenil's next week of use: if he still says any idea "feels the same", pull that concept's practice items with
their `job` tags and check which job repeated. If R1–R6 are all green and he still says it, the cause is the step shape
itself. Then cut to 2 practice items per step and add interleaving: mix in practice items from the previous idea.

## 5. Addendum, 22 Oct morning: the kill condition is met, change the shape

Re-reviews after the rewrite: Money (steps-money2 dfb11bc) fresh 1.9 → **2.7**, Psychology (steps-psych c61a1d2,
written with this spec from the start) **2.4**, History (learn-steps f4ed215) **2.6**. **0 of 28 concepts reach fresh 4**,
while R1–R7 are all green (`docs/reviews/learner-rereview-money-psych.md` on `ideas/learner-rereview-money-psych`;
Codex History re-review in `D:\nandi-gate-logs\idea-engine\`). The reviewers' finding: the same question comes back
with a new name, new numbers and a new `job` label. About a third of `transfer` items stay in the same life area,
`reverse` items swap the unknown in the same sum, and `edge` items are normal cases.

That is §4's kill condition. The cause is not the writers. It is arithmetic: **one claim cannot carry 6–7 different
questions in one sitting.** Today a learner meets each claim as hook + spot + guided 1 + guided 2 + 2–3 practice, back
to back. The validator also demands exactly 8 items per idea, so the writers pad.

### The new shape (replaces the counts in §2 and spec 14 §3)
1. **In the lesson, one claim is asked at most 3 times:** the hook (a guess), the spot (tap the example), and **one**
   guided try. Drop the second guided try.
2. **Your-turn questions in the lesson come from other ideas**, not the one just taught: 2–3 due reviews of earlier
   steps or ideas, mixed in (interleaving). For a brand-new user with nothing due, use the previous step of the same
   idea, or end the lesson after the guided try (the finished-drop rule from qa-live already fills the Mind slot).
3. **The step's own practice items move to later days.** Each is first served at least 1 day after the step is taught,
   mixed with other ideas' items, never two from the same idea in a row (spacing + interleaving).
4. **6 practice items per idea, 2 per step** (was 8, 3/3/2). The validator rule "exactly 8 items" becomes "6 to 8", and
   new or rewritten ideas target 6. Fewer items means no padding.
5. **A real job check for reviewers [R]:** two practice items in one idea fail if a learner could answer both with the
   same sentence. The writer must state, per item, the one sentence that answers it. Duplicates are visible at a glance.

Evidence: interleaving similar ideas helps people tell them apart and remember them (meta-analysis, Brunmair & Richter
2019, Psychological Bulletin, overall g ≈ 0.42); spaced practice beats massed practice for retention (Cepeda et al. 2006,
Psychological Bulletin). Massed practice of one idea feels fluent in the moment, which is exactly the "same question again"
feeling Jenil reported.

### What this means for the work in progress
- **Engine (builder):** flow.ts/steps.ts: 1 guided try; your-turn = due reviews from other ideas; schedule the step's
  practice from the next day; no two same-idea items in a row in any drop. Keep the Mind-slot fix from qa-live.
- **Content:** Health, Body and How things work: rewrite to the new shape directly (2 practice per step, 6 per idea).
  For Money, Psychology and History, cut the weakest 2 practice items per idea using the re-review's named duplicates,
  and drop the second guided try. This is less writing, not more.
- **Gate:** the same learner walk-through, now on a simulated week (day 1 lesson, days 2–7 drops), because freshness is
  felt across the week, not inside one JSON idea.

## 6. Addendum, 23 Oct: the your-turn tail starves the learner (fix before Jenil's week)

Measured by the cloud lesson walk on `origin/learn-steps` (`docs/reviews/cj2-lesson-walk.md` on
`ideas/cj2-lesson-walk`, worst moments 1 and 2): a one-topic learner answers **2 questions in 8 days** (0, 1, 0 … 1).
No topic asked anything about step 3 by day 8, and day 8 **re-asked the exact item from day 2** while 5 other taught
items of that idea were never shown. A day takes about 108 s instead of the planned 4 minutes. The week kill test cannot
work on 2 data points. Cause: the engine reads §5 rule 2 as "one review per earlier idea". A learner in one topic meets
one idea every 3 days, so the tail has 0–1 candidates.

### The tail rule (replaces §5 rule 2 for the count; interleaving stays the preference)
- **Pool:** every practice item of every step taught on an **earlier** day, in any idea or topic. Today's step's own
  items still wait until tomorrow (§5 rule 3).
- **Size:** up to **3** questions after the lesson (setting `learn.tailMax: 3`). Day 1 stays lesson-only.
- **Order of choice:** (1) items answered wrong whose review is due; (2) **never-asked** items, oldest taught step
  first; (3) due spaced reviews of items answered right. An item answered right is never re-asked while a never-asked
  taught item exists (fixes the day 2 → day 8 repeat).
- **Mixing:** prefer different ideas back to back; if only one idea has candidates, allow it. Never two items of the
  **same step** in a row while another step has an item; when the pool holds only that step (day 2), its 2 items may
  run back to back. At most 2 items of one step per day. (Built as `practiceTail` in core/learn/steps.ts, ship-32.)
- Expected for a one-topic learner (2 items per step): day 2 → 2 (s1), day 3 → 2–3 (s2 + review), day 4 onward → 3.
  About **18 questions in 8 days** instead of 2, still about 3–4 minutes a day.

### Lesson fixes from the same walk (content + UI, builder)
- **Scale diagrams:** labels overprint or run off the card. **26 of 35** are flagged by the walk's static check; the 4
  it walked were all broken, and one widened the page to 373 px on a 360 px phone. Draw marks as a short list under the
  bar, and add a validator rule for label length vs spacing.
- **Flows** (48 of 54 wrap with arrows at line ends): draw as a vertical list at phone width.
- **Show me:** at least 3 tappable parts (15 of 162 have 2, a coin flip); chips flow inline like a sentence.
- **Teach cards:** the spec says ≤ 30 words; the validator allows 40 and 116 of 162 are over 30. Set the validator to
  30 and cut (move a second claim into the guided try).
- **Guided tries:** about 14 of 24 walked can be answered with no lesson. Each needs one distractor that states the
  misconception the step fixes. The History d1 try tests a detail (which part of the city), not the idea (a grid shows a
  plan).
- **Copy:** explain "newtons" or avoid it; "middle 66" → "half of people took more than 66 days"; keep "speed times
  speed" everywhere; replace the cricket side-bet example (reads as match-betting) with a non-betting trade.

### Kill test (unchanged in spirit)
Jenil's week on the phone with this tail: guided first-try 85–95%, your-turn about 80%, and his own verdict on
"same question again". If the tail still repeats or feels thin, the next step is more items per step, not more rules.
