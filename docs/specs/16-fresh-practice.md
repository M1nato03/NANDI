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
