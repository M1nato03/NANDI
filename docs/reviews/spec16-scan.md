# Spec 16 validator scan (R1-R7)

Branch `ideas/spec16-validator`, cut from `origin/learn-steps` (c61a1d2). Scan of `content/topics/topic.*.json` with `validatePack(pack, { editorial: true })`; each error is grouped by the spec 16 rule that raised it. No content JSON was edited.

## What changed in the validator

R1-R7 were already on `learn-steps` (03adff6, `src/data/packs/fresh.ts`, called from `validate.ts` in editorial mode; teach cards already capped at 40 words). This branch closes the gaps against the brief:

- R5: `every` added to the absolute words (was always, never, only, all, nothing, exactly).
- Tests: R5 absolute-word check, R2 free numbers (0, 1, 2, 100), R7 `WHO` and a passing `which means` card, and the 40-word teach limit (41 fails, 40 passes).
- `fresh.test.js` fixture fixed: since 3a45abd the rule reads `concept.hook` and `concept.claims`, which the fixture lacked, so all 8 fresh tests were failing on `learn-steps`.

Known differences from the brief, kept as built: R2 also counts numbers in the lesson's option texts (not only stems) and skips an idea's own people and places (named in its teach, rule or claims) plus common places, days and months; R5 absolute check fires only when wrong options hold more than 2 absolute words; R7 authority list also catches `said`.

## Violations per topic

| Topic | R1 | R2 | R3 | R4 | R5 | R6 | R7 | Total |
|---|---|---|---|---|---|---|---|---|
| body-training | 64 | 18 | 1 | 1 | 2 | 16 | 21 | 123 |
| health-nutrition | 64 | 22 | 7 | 1 | 2 | 15 | 25 | 136 |
| history-civilisations | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| how-things-work | 80 | 2 | 4 | 0 | 2 | 21 | 19 | 128 |
| money-markets | 80 | 21 | 6 | 2 | 2 | 12 | 23 | 146 |
| psychology | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

R5 is one check per topic, so it scores at most 2 (longest-answer share, absolute-word ratio).

Topics that fail: Body and training, Health and nutrition, How things work, Money and markets (no practice `job` tags yet, so every item fails R1), and History, which fails only R5 because `every` now counts. Psychology is clean.

## body-training

**R1 · practice jobs: 64**

- `progressive-overload-9: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `progressive-overload-10: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `progressive-overload-11: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `progressive-overload-12: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `progressive-overload-13: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`

**R2 · reused number/name: 18**

- `progressive-overload-14: reuses 6 from its step's lesson`
- `progressive-overload-15: reuses 60 from its step's lesson`
- `muscle-protein-rest-12: reuses 5 from its step's lesson`
- `sleep-recovery-9: reuses 6 from its step's lesson`
- `sleep-recovery-10: reuses 8, 5, 6, 12 from its step's lesson`

**R3 · match pairs: 1**

- `muscle-protein-rest-9: a match needs 3-4 pairs (has 2)`

**R4 · fill names the idea: 1**

- `progressive-overload-9: fill-the-step answer repeats the idea's title`

**R5 · answer stands out: 2**

- `topic: the right answer is the longest option in 47% of questions (at most 40%)`
- `topic: absolute words (always, never, only, every...) sit mostly in wrong options (49 in 244 wrong vs 1 in 122 right)`

**R6 · hint gives answer: 16**

- `progressive-overload.step.progressive-overload-s2.guided.1: hint gives the answer away ("weight")`
- `progressive-overload.step.progressive-overload-s3.guided.0: hint gives the answer away ("minute")`
- `progressive-overload.step.progressive-overload-s3.guided.1: hint gives the answer away ("jump")`
- `muscle-protein-rest.step.muscle-protein-rest-s1.guided.1: hint gives the answer away ("part")`
- `muscle-protein-rest.step.muscle-protein-rest-s2.guided.1: hint gives the answer away ("meal", "spread")`

**R7 · teach card reason/authority/40 words: 21**

- `progressive-overload.step.progressive-overload-s1: teach card needs a reason link (because, so, which means, since)`
- `progressive-overload.step.progressive-overload-s2: teach card needs a reason link (because, so, which means, since)`
- `progressive-overload.step.progressive-overload-s3: teach card needs a reason link (because, so, which means, since)`
- `muscle-protein-rest.step.muscle-protein-rest-s1: teach card needs a reason link (because, so, which means, since)`
- `muscle-protein-rest.step.muscle-protein-rest-s2: teach card needs a reason link (because, so, which means, since)`

## health-nutrition

**R1 · practice jobs: 64**

- `protein-foods-12: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `protein-foods-13: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `protein-foods-14: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `protein-foods-9: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `protein-foods-10: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`

**R2 · reused number/name: 22**

- `protein-foods-11: reuses 0.83, 50 from its step's lesson`
- `protein-foods-16: reuses 4, 9 from its step's lesson`
- `free-sugars-11: reuses 2000, 25 from its step's lesson`
- `free-sugars-15: reuses 50 from its step's lesson`
- `free-sugars-10: reuses 80, 8, 40 from its step's lesson`

**R3 · match pairs: 7**

- `protein-foods-16: a match needs 3-4 pairs (has 2)`
- `free-sugars-16: a match needs 3-4 pairs (has 2)`
- `sleep-recovery-16: a match needs 3-4 pairs (has 2)`
- `iron-and-anaemia-9: a match needs 3-4 pairs (has 2)`
- `food-label-reading-15: a match needs 3-4 pairs (has 2)`

**R4 · fill names the idea: 1**

- `free-sugars-14: fill-the-step answer repeats the idea's title`

**R5 · answer stands out: 2**

- `topic: the right answer is the longest option in 45% of questions (at most 40%)`
- `topic: absolute words (always, never, only, every...) sit mostly in wrong options (75 in 236 wrong vs 7 in 118 right)`

**R6 · hint gives answer: 15**

- `protein-foods.step.protein-foods-s1.guided.0: hint gives the answer away ("body")`
- `protein-foods.step.protein-foods-s1.guided.1: hint gives the answer away ("enzyme", "haemoglobin")`
- `protein-foods.step.protein-foods-s2.guided.1: hint gives the answer away ("cereal", "part")`
- `free-sugars.step.free-sugars-s1.guided.1: hint gives the answer away ("added")`
- `free-sugars.step.free-sugars-s2.guided.1: hint gives the answer away ("gram", "kcal")`

**R7 · teach card reason/authority/40 words: 25**

- `protein-foods.step.protein-foods-s3: teach card needs a reason link (because, so, which means, since)`
- `free-sugars.step.free-sugars-s1: teach card needs a reason link (because, so, which means, since)`
- `free-sugars.step.free-sugars-s2: teach card needs a reason link (because, so, which means, since)`
- `free-sugars.step.free-sugars-s2: teach card leans on an authority; keep the source in the sources`
- `free-sugars.step.free-sugars-s3: teach card needs a reason link (because, so, which means, since)`

## history-civilisations

**R5 · answer stands out: 1**

- `topic: absolute words (always, never, only, every...) sit mostly in wrong options (14 in 238 wrong vs 2 in 119 right)`

## how-things-work

**R1 · practice jobs: 80**

- `lift-9: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `lift-10: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `lift-11: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `lift-12: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `lift-13: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`

**R2 · reused number/name: 2**

- `battery-flight-time-9: reuses 50, 200 from its step's lesson`
- `flight-sensors-13: reuses 5 from its step's lesson`

**R3 · match pairs: 4**

- `multirotor-turns-14: a match needs 3-4 pairs (has 2)`
- `birds-and-planes-15: a match needs 3-4 pairs (has 2)`
- `upi-path-16: a match needs 3-4 pairs (has 2)`
- `phone-camera-16: a match needs 3-4 pairs (has 2)`

**R5 · answer stands out: 2**

- `topic: the right answer is the longest option in 59% of questions (at most 40%)`
- `topic: absolute words (always, never, only, every...) sit mostly in wrong options (60 in 302 wrong vs 7 in 151 right)`

**R6 · hint gives answer: 21**

- `lift.step.lift-s2.guided.1: hint gives the answer away ("flat", "wing")`
- `multirotor-turns.step.multirotor-turns-s3.guided.1: hint gives the answer away ("total")`
- `battery-flight-time.step.battery-flight-time-s1.guided.1: hint gives the answer away ("faster")`
- `battery-flight-time.step.battery-flight-time-s2.guided.0: hint gives the answer away ("time")`
- `battery-flight-time.step.battery-flight-time-s2.guided.1: hint gives the answer away ("power")`

**R7 · teach card reason/authority/40 words: 19**

- `lift.step.lift-s1: teach card needs a reason link (because, so, which means, since)`
- `lift.step.lift-s2: teach card needs a reason link (because, so, which means, since)`
- `multirotor-turns.step.multirotor-turns-s1: teach card needs a reason link (because, so, which means, since)`
- `battery-flight-time.step.battery-flight-time-s1: teach card needs a reason link (because, so, which means, since)`
- `battery-flight-time.step.battery-flight-time-s3: teach card needs a reason link (because, so, which means, since)`

## money-markets

**R1 · practice jobs: 80**

- `inflation-11: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `inflation-12: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `inflation-16: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `inflation-9: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`
- `inflation-13: needs a practice job (reverse, misconception, transfer, combine, edge, recall)`

**R2 · reused number/name: 21**

- `inflation-9: reuses 5 from its step's lesson`
- `inflation-10: reuses 7, 5 from its step's lesson`
- `inflation-15: reuses 4 from its step's lesson`
- `compounding-10: reuses 1000 from its step's lesson`
- `compounding-12: reuses 20, 30 from its step's lesson`

**R3 · match pairs: 6**

- `diversification-14: a match needs 3-4 pairs (has 2)`
- `shares-13: a match needs 3-4 pairs (has 2)`
- `emergency-fund-11: a match needs 3-4 pairs (has 2)`
- `loan-emi-9: a match needs 3-4 pairs (has 2)`
- `index-funds-14: a match needs 3-4 pairs (has 2)`

**R4 · fill names the idea: 2**

- `diversification-11: fill-the-step answer repeats the idea's title`
- `emergency-fund-10: fill-the-step answer repeats the idea's title`

**R5 · answer stands out: 2**

- `topic: the right answer is the longest option in 46% of questions (at most 40%)`
- `topic: absolute words (always, never, only, every...) sit mostly in wrong options (53 in 296 wrong vs 7 in 148 right)`

**R6 · hint gives answer: 12**

- `rule-of-72.step.rule-of-72-s3.guided.1: hint gives the answer away ("share", "return", "fixed")`
- `risk-return.step.risk-return-s1.guided.1: hint gives the answer away ("result")`
- `risk-return.step.risk-return-s2.guided.0: hint gives the answer away ("risk")`
- `risk-return.step.risk-return-s2.guided.1: hint gives the answer away ("return")`
- `risk-return.step.risk-return-s3.guided.1: hint gives the answer away ("time")`

**R7 · teach card reason/authority/40 words: 23**

- `inflation.step.inflation-s1: teach card needs a reason link (because, so, which means, since)`
- `inflation.step.inflation-s2: teach card needs a reason link (because, so, which means, since)`
- `inflation.step.inflation-s3: teach card needs a reason link (because, so, which means, since)`
- `compounding.step.compounding-s2: teach card needs a reason link (because, so, which means, since)`
- `compounding.step.compounding-s3: teach card needs a reason link (because, so, which means, since)`

## psychology

Clean on R1-R7.

## Checks run

- `npm ci`: ok. `npm run typecheck`: ok. `npm run lint`: ok.
- `vitest run src/data/packs`: 40/40 pass.
- `npm run validate-packs`: fails, 534 errors, all from the rules above (no other rule fails). `scripts/topic-quality.test.ts > passes the pack validator` fails for the same reason, as expected.
- Full `vitest run`: 3 failures. Besides the validator test, `estimate.test.ts` (loan-emi-12 slider step) and `teachFirst.test.ts` also fail on `learn-steps` without this change; they are not spec 16.
