# cj7 tries A: twist and transfer tries for Psychology and Money (spec 23 §1)

Branch `ideas/cj7-tries-a`, cut from `origin/ideas/learn-misconceptions` (65ed5ef). Written 24 Oct 2026.
Everything here is a draft for editors. Nothing ships without their sign-off.

## 1. Counts

| Topic | Steps | Guided (kept) | New twist | New transfer | New tries | Wrong options linked to a misconception |
|---|---|---|---|---|---|---|
| psychology | 30 | 30 | 30 | 30 | 60 | 82 (46 twist, 36 transfer) |
| money-markets | 30 | 30 | 30 | 30 | 60 | 73 (43 twist, 30 transfer) |
| **Total** | **60** | 60 | 60 | 60 | **120** | **155 of 240 wrong options** |

Files:
- `content-drafts/tries/psychology.json`, `content-drafts/tries/money-markets.json`: one row per step,
  `{stepId, claimIds, twist, transfer}`.
- `content-drafts/tries/psychology.misconceptions.json`, `content-drafts/tries/money-markets.misconceptions.json`:
  `{stepId, which, optionId, misconceptionId}`.
- `content-drafts/tries/merged/topic.psychology.json`, `content-drafts/tries/merged/topic.money-markets.json`:
  the packs with `guided` holding all 3 tries (guided, twist, transfer, in that order). Nothing else in the packs
  changed (checked by diffing the merged copy with its 2nd and 3rd tries removed against the source: identical).
- `content-drafts/tries/blind-check-input.json`, `blind-check-key.json` and `blind-check-answers.json`: the blind-check
  set and the blind agent's answers (see §3).

The right option sits at a, b and c in turn (40 / 40 / 40 over the 120 tries).

## 2. Validator

Schema change, on this branch only: `src/data/packs/schemas.ts` line 38, `guided` `v.maxLength(2)` -> `v.maxLength(3)`.
**The builder must make this change properly** when spec 23 §1 is built (with StepLesson showing all tries and
hiding the transfer hint). This branch only edits the one number so the drafts can be validated.

`npm ci`, then `validatePack(pack, { allowUnchecked: true, editorial: true })` on each merged copy:

```
topic.money-markets.json: valid (0 errors)
topic.psychology.json: valid (0 errors)
```

These results are after the blind-check rewrites in §4. Errors found and fixed on the way (first draft):

| Error | Fix |
|---|---|
| `compounding-9: reuses 4000 from its step's lesson` (spec 16 R2) | compounding-s1 twist now uses ₹6,000, not ₹4,000 |
| psychology: absolute words sit mostly in wrong options (29 in 330 wrong vs 7 in 165 right) | 16 wrong options reworded without "only / never / every / all / nothing" |
| money-markets: same check (31 in 328 vs 10 in 164) | 10 wrong options reworded the same way |

Extra checks run by a local script (not in the validator) on all 120 tries:
- exactly 3 options, one right, no duplicates
- feedback 8-30 words on every option
- Flesch 60+ on every stem, hint and feedback line, and on option text of 5 words or more
  (1-4 word options like "About ₹2,000." score low on the formula for no real reason)
- the hint shares no content word with the right option (spec 16 R6); 26 hints were reworded for this
- where the right option sits by length in the 120 new tries, before and after the blind-check rewrites:

| Right option is | First draft | Now |
|---|---|---|
| the longest | 28 | 10 |
| in the middle | 45 | 73 |
| the shortest | 47 | 37 |

- right answer is the longest option, topic-wide (validator limit 40%):

| Topic | Source pack | Merged, first draft | Merged, now |
|---|---|---|---|
| psychology | 25 of 105 (24%) | 41 of 165 (25%) | 29 of 165 (18%) |
| money-markets | 34 of 104 (33%) | 46 of 164 (28%) | 40 of 164 (24%) |

Also run: `npx vitest run src/data/packs scripts` (11 files, 77 passed, 12 skipped) and
`npx tsx scripts/validate-packs.ts` ("Packs valid") with the schema change in place.

## 3. Blind check

A separate blind agent, run by the main session, answered every new try 3 times. It saw only
`blind-check-input.json` (stem and shuffled options). It did not see the key, the hints, the feedback, the teach
cards or the repo. Its answers are in `content-drafts/tries/blind-check-answers.json` (`{id, round, chosen}`).
I re-scored them against `blind-check-key.json` and got the same result as the main session.
These files hold the first-draft text the blind agent saw. For a re-run on the rewritten tries, use
`blind-check-input-v2.json` and `blind-check-key-v2.json` (same format, new shuffle). The rewrites have not been
blind-tested yet.

| Topic | Try | Answers | Right | Share right | Tries right 3 of 3 |
|---|---|---|---|---|---|
| psychology | twist | 90 | 90 | 100% | 30 of 30 |
| psychology | transfer | 90 | 90 | 100% | 30 of 30 |
| money-markets | twist | 90 | 90 | 100% | 30 of 30 |
| money-markets | transfer | 90 | 90 | 100% | 30 of 30 |
| **All** | | **360** | **360** | **100%** | **120 of 120** |

The blind agent picked the longest option 26.7% of the time by the main session's count. By a strict character
count it was 84 of 360 answers (23%), which is exactly the 28 tries where the right option was the longest.
Length was not how it found the answers. It got the other 92 tries right as well.

**What this means for editors (a real finding, beyond the give-away rewrites).** A blind agent got every one of the
120 tries right, every time, without the teach card. So these tries are mostly answerable by common sense and careful
reading. They check that a learner can apply an idea in a story, but they do not show that the card was needed.
That breaks the job's "the card must be needed" rule, and spec 23 §2's gate (rewrite a try that 3 of 5 testers get
right without the card) would reject nearly all of them. Note that the tester was a language model, which is
stronger than a typical learner, so a human test may score lower. Still, the give-away rewrites in §4 only remove
surface tells. They do not make the tries need the card. Two causes I can see:
- The wrong options are beliefs that are tempting in real life. Laid side by side with the right one, they read as
  plainly worse, because each one states its own flawed reason ("since the odds are even", "as everyone knows it is
  random").
- The steps' claims are mostly ideas a careful adult can reason out. The tries that depend on a number from a claim
  (18-254 days, the 2%-6% band, about twice, three months of costs, the rule of 72) are the ones most likely to need
  the card for a human, but they were still answerable by elimination or by arithmetic.

What would help, for editors to decide:
- More tries that turn on the claim's specific number or edge (for example "a missed week, unlike one day",
  "under 1% alone", "a dozen across industries"), where the plain-sense answer is wrong.
- Wrong options with no attached reason, so they cannot be ruled out by spotting the faulty "since..." clause.
- A human test with 5 learners before shipping, as spec 23 §2 asks. A model tester is a harsh but cheap first filter.

## 4. Every try rewritten, and why

Rule applied: rewrite every try that was right 3 of 3 (all 120) AND whose right option was a give-away. A give-away
is the right option being the longest (28 tries), the only hedged one (11 tries, hedges like "may", "could",
"about", "a bit", "most"), or the only one that sounds kind next to wrong options that blame the person
(3 more tries, and 5 of the first 39 also had this). **42 tries were rewritten for a give-away.**

The rewrites shortened the right option or added a hedge to a wrong option. Afterwards the right option was the
shortest in 66 of 120 tries, which is a new tell. So a second pass shortened wrong options in 29 tries (19 of them
not otherwise touched), leaving the right option the longest in 10, in the middle in 73 and the shortest in 37.
**61 tries changed in all: 42 give-away rewrites and 19 second-pass length fixes.** No claim, stem or right
answer's meaning changed; 2 hints were reworded where a new right option shared a word with the hint. Wrong-option
misconception links were kept, except one dropped where a blaming option ("She is a weak person...") was replaced.

| Try | Why | What changed |
|---|---|---|
| habits-s1 transfer | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| habits-s2 twist | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| habits-s2 transfer | right option was the only kind-sounding one | 1 wrong option(s) reworded |
| loss-aversion-s1 twist | right option was the only hedged one | 2 wrong option(s) reworded |
| loss-aversion-s1 transfer | second pass only: right option was the shortest | 2 wrong option(s) reworded |
| loss-aversion-s3 twist | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| anchoring-s1 twist | right option was the only hedged one | 2 wrong option(s) reworded |
| anchoring-s1 transfer | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| anchoring-s2 twist | right option was the longest | right: "Guesses moved off the anchor, but not far enough." -> "They adjusted, but too little." |
| anchoring-s2 transfer | second pass only: right option was the shortest | 2 wrong option(s) reworded |
| anchoring-s3 transfer | right option was the only hedged one | right: "Listing reasons two weeks could be wrong." -> "Listing reasons against two weeks." |
| confirmation-bias-s1 twist | right option was the longest | right: "She kept the jams in mind and let smooth days slip." -> "She noticed the jams and skipped the rest."; 1 wrong option(s) reworded |
| confirmation-bias-s1 transfer | right option was the longest | 2 wrong option(s) reworded |
| confirmation-bias-s3 twist | right option was the longest | 1 wrong option(s) reworded |
| confirmation-bias-s3 transfer | right option was the longest | right: "Seasons sown after the first rain that gave a poor crop." -> "Rain-sown seasons with a poor crop." |
| social-proof-s1 transfer | right option was the longest + right option was the only kind-sounding one | right: "He reads their choice as a sign of the right place." -> "Their choice tells him where it goes."; 2 wrong option(s) reworded |
| social-proof-s2 twist | right option was the longest | right: "The group pressure caused most of the errors." -> "The group caused the extra errors."; 2 wrong option(s) reworded |
| social-proof-s2 transfer | right option was the only kind-sounding one | 2 wrong option(s) reworded |
| social-proof-s3 twist | right option was the only hedged one | 1 wrong option(s) reworded |
| social-proof-s3 transfer | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| planning-fallacy-s1 twist | second pass only: right option was the shortest | 2 wrong option(s) reworded |
| planning-fallacy-s1 transfer | right option was the only hedged one | 2 wrong option(s) reworded |
| planning-fallacy-s2 twist | right option was the longest + right option was the only kind-sounding one | right: "It pictures the ideal day, leaving out past delays." -> "It shows the trek going smoothly."; 1 wrong option(s) reworded |
| planning-fallacy-s2 transfer | second pass only: right option was the shortest | 2 wrong option(s) reworded |
| planning-fallacy-s3 transfer | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| sleep-memory-s1 transfer | right option was the only hedged one | 2 wrong option(s) reworded |
| sleep-memory-s2 transfer | right option was the longest | right: "Going to bed at his usual time after practice." -> "Sleeping at his usual time." |
| variable-rewards-s3 twist | right option was the longest | right: "A feed that keeps loading as you scroll." -> "A feed with no end." |
| variable-rewards-s3 transfer | right option was the only hedged one + right option was the only kind-sounding one | 2 wrong option(s) reworded |
| if-then-plans-s1 twist | right option was the longest | 2 wrong option(s) reworded |
| if-then-plans-s2 twist | right option was the longest | right: "The plan made her response to that moment automatic." -> "The cue now starts the act." |
| spotlight-effect-s1 twist | right option was the longest | 1 wrong option(s) reworded |
| spotlight-effect-s2 twist | right option was the longest + right option was the only kind-sounding one | right: "She starts from her own vivid view and adjusts too little." -> "Her own close-up view sets the start."; 2 wrong option(s) reworded |
| spotlight-effect-s2 transfer | right option was the longest | right: "He lived every second of that note; they heard it once." -> "It felt huge from the inside."; hint reworded |
| spotlight-effect-s3 twist | right option was the longest + right option was the only kind-sounding one | right: "He fixes on the slip; she takes in the whole scene." -> "He dwells on one moment."; 1 wrong option(s) reworded |
| spotlight-effect-s3 transfer | right option was the only kind-sounding one | 1 wrong option(s) reworded |
| inflation-s1 twist | right option was the longest | right: "The base is March a year ago, not February." -> "It compares with last March." |
| inflation-s2 twist | right option was the only hedged one | 2 wrong option(s) reworded |
| inflation-s3 twist | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| compounding-s2 transfer | right option was the only hedged one | 2 wrong option(s) reworded |
| compounding-s3 transfer | second pass only: right option was the shortest | 2 wrong option(s) reworded |
| rule-of-72-s3 twist | right option was the longest | right: "Real years swing, so it is a what-if, not a promise." -> "Real returns swing from year to year."; 1 wrong option(s) reworded |
| rule-of-72-s3 transfer | right option was the longest | right: "The rate is not steady, so the rule does not fit." -> "No single rate fits." |
| risk-return-s1 twist | right option was the only hedged one | 2 wrong option(s) reworded |
| risk-return-s1 transfer | right option was the longest | right: "The result is uncertain and could be lower." -> "Her income is not known in advance."; 2 wrong option(s) reworded |
| risk-return-s2 twist | right option was the longest | right: "Investors want a bigger reward for bigger swings." -> "It pays people to bear the swings."; 1 wrong option(s) reworded |
| risk-return-s2 transfer | right option was the longest | right: "The startup, to make up for more risk." -> "The startup." |
| risk-return-s3 twist | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| shares-s1 twist | second pass only: right option was the shortest | 2 wrong option(s) reworded |
| shares-s2 twist | right option was the longest | right: "No; her shares give her a vote at the meeting." -> "No; a few shares still carry a vote."; 1 wrong option(s) reworded |
| emergency-fund-s1 twist | right option was the longest | right: "A bike repair after a crash on the way to work." -> "A repair after a bike crash." |
| emergency-fund-s2 transfer | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| emergency-fund-s3 twist | second pass only: right option was the shortest | 1 wrong option(s) reworded |
| loan-emi-s1 twist | second pass only: right option was the shortest | 2 wrong option(s) reworded |
| loan-emi-s3 transfer | right option was the longest | right: "Each payment is smaller, but total interest is more." -> "He pays interest for longer." |
| index-funds-s1 twist | right option was the only hedged one | 1 wrong option(s) reworded |
| index-funds-s2 twist | second pass only: right option was the shortest | 2 wrong option(s) reworded |
| index-funds-s3 transfer | right option was the longest | right: "A small gap from fees and costs is normal." -> "Costs cause a small, normal gap." |
| upi-scams-s1 transfer | right option was the longest | right: "A QR scan is for paying, not for getting paid." -> "Getting paid needs no scan."; hint reworded |
| upi-scams-s2 twist | right option was the longest | right: "Do not share it, even with bank staff you know." -> "Keep it to yourself." |
| upi-scams-s3 transfer | second pass only: right option was the shortest | 1 wrong option(s) reworded |

First-draft rewrites, before the blind check (kept for the record):

| What | How many | Why |
|---|---|---|
| Hints reworded | 26 | the hint shared a content word with the right option (R6), or scored under Flesch 60 |
| Wrong options reworded | 26 | absolute words sat mostly in wrong options (validator), see §2 |
| Options or feedback reworded for reading ease | about 11 | Flesch under 60 |
| Give-away pre-check | 9 | right option was the longest and the only hedged one |
| Number swapped | 1 | compounding-s1 twist reused 4,000 from a practice item (R2) |

## 5. Steps for editors: situations and fit

I found a new situation for every step, so no step is left blank. These are the ones an editor should look at,
because the fit is weaker or the claim is stretched:

| Step | Try | Concern |
|---|---|---|
| loss-aversion-s3 | transfer | Uses "about twice" to work out a gain that would balance a ₹1,000 loss for a typical owner. That is an inference from claim c3, which reports an average weight. The feedback says people differ. Editors decide if this goes past the claim. |
| social-proof-s2 | transfer | Office meeting, going along to fit in. Same claim angle (c6) as the guided try (music class), in a new place. Allowed under the same-situation rule, but close in shape. |
| diversification-s1, diversification-s3 | transfer | Spreading applied to income sources (ride apps plus tutoring) and to crops. The claims are about holdings, so these are analogies. |
| compounding-s3 | transfer | A jeweller's monthly gold plan used as a SIP analogy. The claim is about SIPs only. |
| rule-of-72-s1 | transfer | Rule of 72 applied to land value at a steady 9%. The claim says "a sum"; editors may prefer money in a deposit. |
| inflation-s1 | transfer | Says one town's market can differ from the all-India figure. That follows from c3 (prices recorded in markets across India), but the "towns differ" step is ours. |
| habits-s3 | twist | Two people, different habit times. The claim's 18-254 day range is across people and acts; we use it for two siblings. |
| sleep-memory-s1 | twist | Has no story. It asks what must come first for sleep to help. Editors may want a situation. |
| variable-rewards-s3 | twist | Has no story. It asks which app feature stretches time without a surprise reward. |
| emergency-fund-s1 | twist | A pick-the-fair-use list, close in form to the emergency-fund-11 match item, though the costs differ. |

Numbers: the rule is "numbers only from the step's claims". I read it as no new statistics. Every statistic in a
try comes from the step's own claims or teach card (18 and 254 days, about twice, the 2%-6% band, 3 months and
6 months, 18% doubles in about 4 years, and so on). Rupee amounts, rates and counts inside a made-up case (for
example ₹6,000 at 10%) are the story's own inputs, as in the existing guided tries. If editors read the rule more
strictly, the money tries with worked sums need new figures.

Same-situation rule: I checked each twist and transfer against the step's hook, Show me, guided try and both practice
items. Each new try uses a situation none of them use. Transfers sit in a different life area from the hook, Show me
and guided try (work, family, farming, small business, travel, health and hobbies), with places across India and a
mix of names and genders.

## 6. Notes for the builder

- `guided` max goes from 2 to 3 in the schema (see §2). On main, StepLesson shows only the first try
  (`StepLesson.tsx:37`).
- The transfer try's `hint` is written, but the app is meant to hide it. The schema has no flag for that. Position 3
  in `guided` is the transfer try in both merged packs.
- Lesson options have no misconception field, so the links live in the two `*.misconceptions.json` sidecars.
  Each `misconceptionId` was checked against its concept's `misconceptions` list.
- Pack versions are not bumped.
