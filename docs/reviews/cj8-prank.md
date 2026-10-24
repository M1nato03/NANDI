# cj8-prank · Kapi's prank: generator feasibility

Cloud job batch 8, job 3. Branch `ideas/cj8-prank`, cut from `origin/main`.
Draft only. No app code changed.

Files:
- `content-drafts/prank/prank.ts`: generator, one-lie checker, hint, difficulty rating, workshop checker.
- `content-drafts/prank/prank.test.ts`: 11 tests, 300 seeded cases per size.
- This report.

Read first: `CLAUDE.md` (main), `docs/specs/24-signature-mechanics.md` (ideas/spec-24-signature),
`src/core/mysteries/cases.js` (CaseGen, `holds`, `countSolutions`, `propagate`), `deduction.ts`, `casePlay.ts`.

## Verdict

Feasible, and cheap. The generator makes a valid one-lie case for every one of 600 seeds.
About half of naive cases are too easy (the lie clashes head-on with one clue). The generator now rejects those.
A 4x4 case takes 5 ms median and 18 ms at p95 on the test box. A 3x3 case takes about 0.5 ms.

## 1. Definition

A **world** is one full answer: each suspect gets one place and one item (3x3: 36 worlds, 4x4: 576).

A **one-lie case** is a clue list where:
1. no world satisfies every clue, and
2. exactly one world violates exactly one clue.

That world is the answer. The clue it violates is Kapi's prank.

The same rule, said the way a player meets it ("drop clue k and look at the rest"):

| Clue k | The other clues have |
|---|---|
| the lie | exactly one world (the answer) |
| any true clue | no world at all (they clash) |

Why they match: a world that fits every clue except k violates exactly one clue.
Rule 2 allows only one such world, and rule 1 rules out a world that fits all clues.
So for every k but the lie, "everything except k" has no world.

A useful consequence for writers: the lie must still clash with the truths after any single true clue is taken away.
So every case needs a backup. If "Pooja had the lunch box" (lie) clashes only through clue A, then removing A
would leave a second valid reading. The hand-made test case shows this: drop its backup clue and two worlds
each miss one clue, so it stops being a one-lie case.

Checked in code by brute force over all worlds (`checkLie`, `isOneLie`). It never trusts a stored answer.

## 2. Generator (`generatePrank`)

| Step | What it does |
|---|---|
| 1 | Pick a random answer world from the seed (same mulberry32 RNG as CaseGen). |
| 2 | Pick the lie: one clue that is false in that world, weighted by kind. |
| 3 | Add true clues in weighted random order until the set is a one-lie case for that world. |
| 4 | Drop each true clue that is not needed (still a one-lie case without it). |
| 5 | Reject if there are too many clues (3x3: over 9; 4x4: over 12). |
| 6 | Reject if the lie is a direct contradiction (it clashes with a single other clue). |
| 7 | Logic gate, using CaseGen's own one-step solver (`propagate`, with the third grid): "suppose the lie is false" must solve the grid, and "suppose clue k is false" must reach a clash for every other k. |
| 8 | Shuffle, dress with a CaseGen theme, write clue text. |

Clue kinds are CaseGen's: `sp±` (was / was not at), `si±` (had / did not have), `ip±` (whoever had X was / was not at),
`or`, `ori` (either A or B was at / had). "Suppose clue k is false" adds the clue's opposite;
the opposite of an `or` is two "was not" clues.

## 3. Measured results

Run: `npx vitest run --root . --config <out-of-repo config> content-drafts/prank`, Node 22.22.0, 4-core cloud Linux box.
The repo's `vitest.config.ts` only includes `src/**` and `scripts/**`, so a plain
`npx vitest run content-drafts/prank` finds no test files. I used a one-line config outside the repo
(`export default { test: { environment: 'node', include: ['content-drafts/**/*.test.ts'] } }`) instead of editing app config.
Result: **11 of 11 tests pass**.

### How often the lie is a direct contradiction (raw generator, steps 6 and 7 off)

| Size | Cases | Direct (too easy) | Share |
|---|---|---|---|
| 3x3 | 300 | 143 | 47.7% |
| 4x4 | 300 | 157 | 52.3% |

By kind of lie (direct / total):

| Lie kind | 3x3 | 4x4 |
|---|---|---|
| `ip+` whoever had X was at Y | 45/50 | 37/43 |
| `si+` A had X | 40/58 | 37/51 |
| `sp+` A was at Y | 28/43 | 36/59 |
| `ip-` | 14/30 | 8/13 |
| `or` | 6/35 | 17/37 |
| `ori` | 1/32 | 11/41 |
| `sp-` | 6/26 | 6/30 |
| `si-` | 3/26 | 5/26 |

Positive lies are direct most of the time. "Not" lies and either-or lies hide well.
Next tuning step: lower the positive-lie weights. That would cut wasted attempts by roughly half.

### Filtered generator (shipping settings: no direct lies, logic gate on)

| | 3x3 | 4x4 |
|---|---|---|
| Cases made | 300 / 300 | 300 / 300 |
| Time per case, mean | 0.64 ms | 6.86 ms |
| median | 0.53 ms | 5.27 ms |
| p95 | 1.36 ms | 18.02 ms |
| max | 2.28 ms | 40.34 ms |
| Attempts in total | 620 | 742 |
| Attempts per case, median / max | 2 / 10 | 2 / 12 |
| Rejected: direct lie | 260 | 374 |
| Rejected: a wrong guess does not clash by one-step logic | 55 | 55 |
| Rejected: too many clues | 5 | 13 |
| Rejected: lie found but grid not solvable by logic | 0 | 0 |
| Clue count (lie included) | 5-9, mode 8 | 7-12, mode 9 |
| Needs the third grid to finish | 81.7% | 95.0% |

Time includes the rating. Max times move by a few ms between runs (timer noise); the medians are stable.
For comparison, spec 24 quotes 33-53 ms for hard plain cases on the server, so a 4x4 prank is in the same range or cheaper.

Every one of the 600 filtered cases passed, in the test, all of:
- `isOneLie` finds the same lie and the same world the generator built;
- the answer world breaks only the lie;
- the hint for the lie says "fits", and "suppose clue k is false" clashes for every other k;
- every clue has text.

### Fewest true clues needed to expose the lie ("core")

| Core | 3x3 | 4x4 |
|---|---|---|
| 2 | 196 | 167 |
| 3 | 90 | 87 |
| 4 | 14 | 40 |
| 5+ | 0 | 6 |

### Samples (from the test log)

3x3, "The class trip money". Clue 6 is the lie.
1. Either Sister Mary or Pooja had the geometry box.
2. Pooja was not in the classroom.
3. Whoever had the sports bag was not in the staff room.
4. Sister Mary did not have the geometry box.
5. Aarav did not have the lunch box.
6. Pooja had the lunch box. **(prank)**
7. Whoever had the lunch box was in the classroom.

Clue 6 clashes with 2 + 7 together (core 2), and with 1 + 4 (Pooja must have the geometry box). That is the backup.

4x4, "The snapped sitar strings": 10 clues, the lie is "Whoever had the pliers was on the stage."

## 4. Hint: "suppose clue 3 is false: what follows?"

`hint(case, k)` runs CaseGen's solver on "all clues except k, plus the opposite of k".
It shows at most two facts that follow, then one of three endings.

| Outcome | Copy |
|---|---|
| clash | "Suppose clue 1 is false. Then Pooja had the lunch box, and Sister Mary had the sports bag. Keep going: the other clues stop fitting together." |
| fits | "Suppose clue 6 is false. Then Pooja had the geometry box, and Aarav had the sports bag. Everything else fits. Try finishing the grid." |
| open | "Suppose clue k is false. ... Nothing clashes yet. Try another clue." (never produced by the filtered generator, kept for user-made cases) |

Hint ladder (proposed, no loss state, no XP change, no timer):
1. Tap a clue card, then "Suppose this is false". The two facts appear as pencil marks, not as answers.
2. If it clashes, the card dims (it is true), with the copy above. It does not count as a mistake.
3. Second hint: Kapi points at the two or three clues in the smallest clash (the core).
4. After the lie is found, the existing grid nudges (`deduction.ts`) take over on the other clues.

Gap: `propagate` returns `bad: true` but not where the clash happened. To say "two people end up in the canteen",
it would need to return the clashing cell. That is a small change to `cases.js`, left out here (no app changes).

## 5. Difficulty rating (`rate`)

| Signal | Why it matters | Weight |
|---|---|---|
| Core size (1-4) | how many clues you must hold at once to see the lie | x2 |
| Wrong guesses that need the third grid to clash | each dead end costs real work | +1 each |
| Finishing needs the third grid | same as CaseGen's medium/hard rule | +2 |
| Solver steps to finish, per 10 | length | +1 |

Bands are cut at the score tertiles of the 300 seeded cases per size:

| Size | easy | medium | hard |
|---|---|---|---|
| 3x3 | score ≤ 9 (81) | 10-12 (110) | ≥ 13 (109) |
| 4x4 | ≤ 12 (94) | 13-17 (103) | ≥ 18 (103) |

These cut-offs belong in `rules.config.ts` if this is built. Suggested use: 3x3 easy on weekdays,
4x4 on the weekend case day, matching `RULES.mind.caseDiffByWeekday`. Validate with real solve times on the
owner panel before trusting the bands; this is a proxy, not a measured human difficulty.

## 6. Riddle workshop (user-made cases)

`workshopCheck(clues, n, mode)` gives the live counter and the reasons a case is not ready.
It counts by brute force: 0.14 ms per full check on 3x3, 0.80-1.00 ms on 4x4, so it can run on every card drop.

| Mode | "Answers still possible" counts |
|---|---|
| plain | worlds that fit every clue (starts at 36 or 576) |
| prank | (world, lie) pairs where the world misses exactly one clue; shown as "Every clue can be true at once" while any world fits all |

### Which clue cards make good cases

| Card | Verdict | Reason (from the measured data and the solver) |
|---|---|---|
| "A was not at Y" / "A did not have X" | Best, use freely | Each removes one cell. Lies of this kind were direct only 6/26 to 6/30 times. |
| "Either A or B was at Y / had X" | Best | Needs a second step; either-or lies were direct 1/32 (3x3 ori) to 17/37 (4x4 or). |
| "Whoever had X was (not) at Y" | Good, it uses the third grid | Makes cases need linking. As a lie, the "was" form is the worst (45/50 direct), so warn when it is chosen as the prank. |
| "A was at Y" / "A had X" | Limit to one per case | Names an answer outright. As a lie it was direct 28/43 to 40/58 times. |

### Rules that stop a user case being trivial

| Rule | Check | Copy shown |
|---|---|---|
| One answer | counter = 1 | (counter turns to "1 answer") |
| Every card earns its place | removing any card leaves the counter at 1 → flag those cards | "Some clues change nothing. Remove them." |
| Solvable by logic, no guessing | `propagate(..., cross)` solves it (prank: after the lie is removed) | "The solver needs a guess here. Add a clue." |
| Not handed out | plain: fewer than n positive "A was at Y" / "A had X" facts placed straight from cards | "The clues name too many answers outright." |
| Prank is hidden | the lie has no single-card clash (core ≥ 2) | "The prank clashes with one clue head-on. Hide it better." |
| Prank mode has a prank | some world must not fit all cards | "Every clue can be true at once. Make one clue the prank." |

All tested: an empty plain set shows all worlds; naming every answer outright is flagged; adding the lie's direct
opposite to a good case makes it not ready.

Sharing by link: the case is just the clue list (kind + indexes) and the theme key, so it fits spec 19's link format.
The receiver re-checks it with `isOneLie` before showing it. Untrusted input: clue text is rebuilt from indexes, never taken from the link.

## 7. Product rules check

| Rule | Status |
|---|---|
| No loss state | A wrong "suppose" is a clash card, not a fail. No lives, no attempts counter. |
| No countdown | None. The pace line from spec 24 could apply later, optional. |
| No random rewards | Cases are seeded; XP would be the same flat Mind case amount. |
| No endless feed | One prank case per day (or per weekly slot), then the stopping screen. |
| Night mode | Mind earns 0 XP after bedtime, unchanged. |
| No brain claims | Copy says "find the prank", nothing about getting smarter. |
| Check against rules, not a stored answer | `isOneLie` and `propagate` check the clue list itself. |
| Original theme | Uses CaseGen's own themes and names. |

## 8. Limits and open points

- Timing is from one cloud box; phones will be slower. Even at 5x, a 4x4 p95 is about 90 ms, fine for an offline daily generate.
- The rating is a proxy. No human solve times yet.
- The logic gate uses CaseGen's one-step solver only. 55 attempts per size were rejected because a wrong guess
  needs deeper reasoning to clash. Those cases are valid, just not "solvable by one-step logic".
- `propagate` cannot yet say where a clash happened (see section 4).
- Lie-kind weights are untuned; lowering positive-lie weights should halve wasted attempts.

## Kill test

Before launch, fixed: over 4 weeks on the owner panel, kill or rework if fewer than 1 in 3 started prank cases
reach the found-the-lie step without the second hint, or if prank cases raise opens after bedtime.
