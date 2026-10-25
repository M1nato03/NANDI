# Kapi: extra daily case drafts

The existing daily logic-grid case stays in place.
These four generators are pure TypeScript drafts, with no app wiring.
Each uses a seeded random source and counts every legal solution.
The stored difficulty rating is the number of clues and the starting candidate count.
`easy`, `medium`, and `hard` change which true facts are selected.
Route levels also change the maximum leg length.

Possible seven-day extra-case rotation:

| Day | Extra case | Status |
| --- | --- | --- |
| Monday | Seating: row | Generated |
| Tuesday | Family | Generated |
| Wednesday | Route | Generated |
| Thursday | Lock | Generated |
| Friday | Seating: circle | Generated |
| Saturday | Knights and knaves | Design note only |
| Sunday | Timeline | Design note only |

This is a content plan, not a schedule in the app.

## Exam framing

Official exam documents support the broad categories, not each exact puzzle form.
IBPS PO tests Reasoning Ability in its exam structure.
SSC CGL lists relationship concepts, spatial orientation, and coding/decoding.
CAT has a Data Interpretation and Logical Reasoning section.
The type-level comparisons below are **prep-design inferences** from those categories.

Sources: [IBPS PO notification](https://ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XV.pdf),
[SSC CGL syllabus](https://ssc.gov.in/api/attachment/uploads/masterData/Syllabus/CGL-syllabus-169635-.pdf),
[CAT section description](https://iimcat.ac.in/per/g01/pub/756/ASM/WebPortal/1/PDF/Scoring_and_Equating_Process.pdf).

| Type | Bank PO framing | SSC CGL framing | CAT LRDI framing |
| --- | --- | --- | --- |
| Seating | A short arrangement set with linked positions. | A compact ordering or spatial reasoning item. | A small version of a multi-question arrangement set. |
| Family | A blood-relation chain with a named question pair. | A relationship-concept item. | Could be a constraint set; this draft is shorter than a typical set. |
| Route | Directions, turns, and final displacement. | Spatial orientation on a grid. | Could sit inside a map or movement set. |
| Lock | Code elimination from exact feedback. | Coding/decoding and logical elimination. | A small constraint set; richer sets would need more variables. |

| Type | Easier when | Harder when | Boring or unfair when |
| --- | --- | --- | --- |
| Seating | An end or immediate neighbour fixes a block. | Several gap clues must be combined; circle has no natural first seat. | Every clue is a direct neighbour; clockwise or facing direction is unstated. |
| Family | A direct parent link names the question pair. | Generations and sibling links must be combined. | It relies on gender, marriage, caste, or an unmarked family convention. |
| Route | Start direction and each leg are given directly. | Facing changes must be tracked before adding coordinates. | A turn is described without its starting facing, or blocks lack a scale. |
| Lock | An absent clue removes many digits. | Position and membership clues overlap. | “Right” is vague about other digits, repeats, or a leading zero. |

## Test results

Command:
`npx.cmd vitest run content-drafts/kapi-cases --config content-drafts/kapi-cases/vitest.config.ts --configLoader runner --disableConsoleIntercept`

300 seeds per type, across all three levels.
Seating alternates row and circle.
Times include generation and the full solver check, in milliseconds.
P95 is the 285th sorted case.
Single-clue share counts a clue that fixes the asked answer;
for family this checks the relation, not just the whole tree.

| Type | Unique | Mean ms | P95 ms | Max ms | Mean clues | One-clue share |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| family | 300/300 | 2.96 | 4.51 | 13.89 | 2.80 | 0.0% |
| lock | 300/300 | 116.07 | 134.22 | 188.11 | 3.69 | 0.0% |
| seating | 300/300 | 0.87 | 1.29 | 5.71 | 3.52 | 0.0% |
| route | 300/300 | 0.59 | 1.44 | 6.28 | 5.42 | 0.0% |

`npx.cmd tsc -p content-drafts/kapi-cases/tsconfig.json` also passed.
The lock generator is the slowest because it scores many three-digit guesses.
Times are local measurements, not a device performance guarantee.

## Hint ladders

Each step is a separate tap. No step states the answer.

| Type | Tap 1 | Tap 2 | Tap 3 |
| --- | --- | --- | --- |
| Seating | Draw one slot per person; fix the circle anchor at the top. | Place immediate neighbours first. | Test remaining people in open seats against every clue. |
| Family | Draw only named blood links; leave gender unspecified. | Move down one generation for a parent, two for a grandparent. | Trace the question pair on the finished tree. |
| Route | Mark the start as (0, 0), north at the top. | Update facing after each turn. | Add east-west and north-south movement separately. |
| Lock | Remove all three digits from a “nothing right” clue. | Move the one present digit away from its shown slot in a “wrong place” clue. | Check each surviving code against all clues. |

## Sample cases

These are generated with seeds 1 and 2 at `medium` level.
The `review samples` test regenerates and solves all eight.

### Seating: circle, seed 1

At a reading-club table, Nila, Ira, Tashi, Dev, Mei, and Farhan sit
in a circle, facing the centre. List seats clockwise, starting at Nila.

- Mei sits immediately clockwise from Ira.
- Moving clockwise from Farhan to Nila, there is one person between them.
- Moving clockwise from Dev to Mei, there is one person between them.

Answer: Nila, Dev, Ira, Mei, Farhan, Tashi.

### Seating: row, seed 2

At a campus quiz, Zoya, Asha, Farhan, Nila, and Mei sit in one row,
all facing the stage. List seats left to right.

- Zoya and Asha have one person between them.
- Zoya sits at an end of the row.
- Farhan sits immediately left of Zoya.
- Mei and Farhan have one person between them.

Answer: Nila, Mei, Asha, Farhan, Zoya.

### Family: seed 1

Nima, Kavi, Arya, Noor, and Tashi compare their family tree.
Only blood relations are used; gender is unspecified.

- Noor is a grandparent of Nima.
- Tashi is a parent of Arya.

How is Noor related to Arya?
Answer: sibling.

### Family: seed 2

Kiran, Aman, Sai, Tashi, and Iman compare their family tree.
Only blood relations are used; gender is unspecified.

- Aman and Tashi are siblings.
- Tashi is a grandparent of Sai.
- Iman is a parent of Sai.

How is Iman related to Tashi?
Answer: child.

### Route: seed 1

Kapi walks three straight legs on a square grid, turning after legs 1 and 2.
Start at (0, 0). Find the finish and final facing.

- Turn 2 is a left turn.
- Leg 3 is 2 blocks long.
- Turn 1 is a right turn.
- After the first turn, Kapi faces west.
- The whole walk covers 6 blocks.
- Leg 1 is 2 blocks long.

Answer: 2 blocks west, 4 blocks south; facing south.

### Route: seed 2

Kapi walks three straight legs on a square grid, turning after legs 1 and 2.
Start at (0, 0). Find the finish and final facing.

- The first leg heads south.
- Leg 1 is 3 blocks long.
- Leg 2 is 3 blocks long.
- Leg 3 is 2 blocks long.
- After the first turn, Kapi faces east.
- Turn 2 is a right turn.

Answer: 3 blocks east, 5 blocks south; facing south.

### Lock: seed 1

A three-digit lock has distinct digits and no leading zero.
Each line gives exact feedback; unmentioned guessed digits are absent.

- 928: one digit right and well placed.
- 105: one digit right but wrong place.
- 692: one digit right and well placed.
- 941: nothing right.

Answer: 658.

### Lock: seed 2

A three-digit lock has distinct digits and no leading zero.
Each line gives exact feedback; unmentioned guessed digits are absent.

- 630: one digit right but wrong place.
- 768: one digit right and well placed.
- 056: one digit right and well placed.
- 217: one digit right but wrong place.

Answer: 753.

## Design notes only

**Knights and knaves:** A few speakers make short claims.
Each speaker always tells the truth or always lies.
Count all truth assignments and reject any case with two valid worlds.
Keep claims concrete; self-reference loops and ambiguous pronouns are unfair.
Use a hint ladder: name the truth rule, test one speaker, then cross-check all claims.

**Timeline:** Place a few events on ordered days or hours.
Use before/after and exact-gap clues, then count all valid schedules.
The hard step is combining relative and exact gaps.
Avoid hidden calendar facts and dates that need outside knowledge.
Use a hint ladder: draw slots, place fixed gaps, then eliminate open slots.
