# cj7 tries A: twist and transfer tries for Psychology and Money (spec 23 §1)

Branch `ideas/cj7-tries-a`, cut from `origin/ideas/learn-misconceptions` (65ed5ef). Written 24 Oct 2026.
Everything here is a draft for editors. Nothing ships without their sign-off.

## 1. Counts

| Topic | Steps | Guided (kept) | New twist | New transfer | New tries | Wrong options linked to a misconception |
|---|---|---|---|---|---|---|
| psychology | 30 | 30 | 30 | 30 | 60 | 83 (46 twist, 37 transfer) |
| money-markets | 30 | 30 | 30 | 30 | 60 | 73 (43 twist, 30 transfer) |
| **Total** | **60** | 60 | 60 | 60 | **120** | **156 of 240 wrong options** |

Files:
- `content-drafts/tries/psychology.json`, `content-drafts/tries/money-markets.json`: one row per step,
  `{stepId, claimIds, twist, transfer}`.
- `content-drafts/tries/psychology.misconceptions.json`, `content-drafts/tries/money-markets.misconceptions.json`:
  `{stepId, which, optionId, misconceptionId}`.
- `content-drafts/tries/merged/topic.psychology.json`, `content-drafts/tries/merged/topic.money-markets.json`:
  the packs with `guided` holding all 3 tries (guided, twist, transfer, in that order). Nothing else in the packs
  changed (checked by diffing the merged copy with its 2nd and 3rd tries removed against the source: identical).
- `content-drafts/tries/blind-check-input.json` and `blind-check-key.json`: the blind-check set (see §3).

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

Errors found and fixed on the way:

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
- right answer is the longest option in 28 of the 120 new tries (23%); topic-wide after the merge:

| Topic | Right is longest, before | After merge (limit 40%) |
|---|---|---|
| psychology | 25 of 105 (24%) | 41 of 165 (25%) |
| money-markets | 34 of 104 (33%) | 46 of 164 (28%) |

Also run: `npx vitest run src/data/packs scripts` (11 files, 77 passed, 12 skipped) and
`npx tsx scripts/validate-packs.ts` ("Packs valid") with the schema change in place.

## 3. Blind check: NOT run by a separate agent

The job asks a separate subagent, which has not seen the teach cards, to answer every new try 3 times from the stem
and shuffled options. **I could not do this.** This job ran as a subagent with no tool to start another agent, and
answering the tries myself would not be blind (I wrote them). I did not fake a result.

What is ready for whoever runs it:
- `content-drafts/tries/blind-check-input.json`: 360 rows (120 tries x 3 rounds), each `{id, round, stem, options}`
  with the options in a seeded shuffle. No hints, no feedback, no teach cards, no answer marks.
- `content-drafts/tries/blind-check-key.json`: `{id, right}` for scoring. Do not give this file to the blind agent.
- Rule to apply: rewrite every try the blind agent gets right 3 of 3 times AND whose right option is a give-away
  (longest, most hedged, or the only kind-sounding one).

Pre-check done instead (by text rules, not a substitute for the blind run): I listed every try whose right option
was the longest, and flagged those where it was also the only hedged one ("may", "could", "likely", "on average",
"some", "can"). Those 9 were changed before release so a hedge no longer marks the answer:

| Try | Change |
|---|---|
| anchoring-s3 twist | wrong option lengthened and hedged: "Yes; if it had worked, she could have ignored ₹6 lakh fully." |
| confirmation-bias-s2 transfer | wrong option now "A few weeks are too few, so more weeks could settle it." |
| if-then-plans-s3 twist | wrong option now "Yes; plans may help with study goals, but not with sport." |
| if-then-plans-s3 transfer | wrong option now "She will likely answer each guest message from now on, without a miss." |
| risk-return-s3 transfer | wrong option now "Shares can dip, but they tend to recover within a few months." (risk-return-m5) |
| diversification-s3 twist | wrong option now "He could lose a little, unless he holds 50 or more firms." |
| shares-s3 twist | wrong option now "They may get the skipped dividend later, as a debt owed to them." (shares-m2) |
| upi-scams-s2 transfer | wrong option now "Share it, since a real job site may need to check her number." |
| inflation-s1 transfer | right option shortened, a wrong option lengthened |

Tries most at risk of being guessed without the card (my own guess, for the blind run to confirm or clear):
emergency-fund-s1 transfer (job loss), upi-scams-s3 transfer (grandfather, act now), risk-return-s1 transfer
(bakery risk), if-then-plans-s1 transfer (salary plan), social-proof-s1 transfer (lunch box). Each has one
"sounds sensible" right answer. If the blind run gets them 3 of 3, they need a harder wrong option.

## 4. Every try rewritten, and why

No try was rewritten because of a blind-check result (none was run). Rewrites made while drafting:

| What | How many | Why |
|---|---|---|
| Hints reworded | 26 | the hint shared a content word with the right option (R6), or scored under Flesch 60 |
| Wrong options reworded | 26 | absolute words sat mostly in wrong options (validator), see §2 |
| Options or feedback reworded for reading ease | about 11 | Flesch under 60 |
| Give-away pre-check | 9 | see §3 |
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
