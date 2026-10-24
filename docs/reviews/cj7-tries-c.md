# cj7 Job 3 · Twist and transfer tries: Health and nutrition, History and civilisations

Status: DRAFT for content editors. Nothing here ships without editor sign-off.
Branch `ideas/cj7-tries-c`, cut from `origin/ideas/learn-misconceptions` (65ed5ef).
Spec: `docs/specs/23-learn-to-duolingo-level.md` §1 (branch `ideas/spec-23-learn-duolingo-level`).

## 1. Counts

| Topic | Steps | Twist tries | Transfer tries | New tries | Wrong options linked to a misconception |
|---|---|---|---|---|---|
| health-nutrition | 24 | 24 | 24 | 48 | 59 of 96 |
| history-civilisations | 24 | 24 | 24 | 48 | 52 of 96 |
| **Total** | **48** | **48** | **48** | **96** | **111 of 192** |

Files:
- `content-drafts/tries/health-nutrition.json`, `content-drafts/tries/history-civilisations.json`: one row per step,
  `{stepId, claimIds, twist:{stem,hint,options}, transfer:{stem,hint,options}}`.
  `claimIds[0]` is the claim the twist tests and `claimIds[1]` the claim the transfer tests. Options use the lesson
  option shape `{id, text, correct, feedback}`.
- `content-drafts/tries/<topic-id>.misconceptions.json`: `{stepId, which, optionId, misconceptionId}`.
- `content-drafts/tries/merged/topic.health-nutrition.json`, `.../topic.history-civilisations.json`: the packs with
  `guided` = [existing guided try, twist, transfer]. Nothing else in the packs changed.
- `content-drafts/tries/blind-check-input.json` and `blind-check-key.json`: input for the main session's blind check
  (each try 3 times, options shuffled differently each round). See §4.
- `content-drafts/tries/blind-runs/`: questions, answers and keys from the three blind passes run for this job.

Schema: on this branch only, `guided` in `src/data/packs/schemas.ts` goes from `v.maxLength(2)` to `v.maxLength(3)`.
**The builder must make this change properly** (spec 23 §1): StepLesson has to play all three tries in order and hide
the transfer hint, and the validator should know which try is the transfer. This branch only lifts the cap so the
merged copies validate.

## 2. How the tries were written

- Twist (hint shown): a different claim of the same step, or the same claim in a new situation, with a harder case
  (working back from a number, two errors at once, a cue other than the obvious one, a part-vs-whole judgement).
- Transfer (hint written, app will hide it): the step's idea in an Indian life area different from the hook, the
  Show me and the guided try (work, shops, sport, festivals, village health work, family records, housing society,
  transport, an app maker, a hostel warden, a college canteen contract).
- Only the step's teach card, Show me and claims are tested. Story numbers (minutes, grams, bar weights, a 1965
  photo, a 1,000 zat noble) are scenario quantities; every fact-number comes from a claim (0.83 g/kg, 54 g at 65 kg,
  50 g / 12 teaspoons, up to 40 g per can, 4 g per spoon of ketchup, 150-300 minutes, 75 vigorous = 150 moderate,
  30 minutes, 8 hours, 400 g, half a kilo a week, 10% fruit, a third dug, 1200s and 1377, 1757/1764/1765/1858,
  26 November 1949 and 26 January 1950).
- No authority words ("says", "according to", "recommends", "the guide") anywhere in the new text.
- Feedback is 8-30 words and gives the reason. Stems, hints and feedback all score Flesch 60 or more.
- Same-situation rule: no claim is tested more than 3 times in one situation. Close calls are listed in §6.
- Names, places and work vary across the regions (Sana, Gita in a Bihar village, a Rajasthan farmer, Tenzin in
  Sikkim, a Gurugram call centre, Usha at her shop, a Patna bank clerk, a Ganpati procession, a Kolkata dance
  teacher, a Lucknow wedding caterer, an Odisha health worker, a Kerala aunt, a Pune housing society, and so on).

## 3. Validator output

`npm ci`, then `validatePack(pack, { allowUnchecked: true, editorial: true })` from `src/data/packs/validate.ts`
on each merged copy (and on the unchanged base packs as a control):

```
content-drafts/tries/merged/topic.health-nutrition.json: 0 errors
content/topics/topic.health-nutrition.json: 0 errors
content-drafts/tries/merged/topic.history-civilisations.json: 0 errors
content/topics/topic.history-civilisations.json: 0 errors
```

Errors found and fixed on the way (first run: 27 in Health, 17 in History):
- R6 "hint gives the answer away" (hint shares a content word with the right option): 39 hints reworded.
- R2 "item reuses a number from its step's lesson": the new tries had put 0.83, 4, 11, 30, 40, 15 and 400 into the
  lesson, which made 6 existing practice items fail. The tries were changed (bedtimes moved to 10 pm, bar weights
  changed, Rina's runs 45 minutes, "half the daily aim" in words), not the items.
- R5 absolute words sitting mostly in wrong options: 44 wrong options reworded to drop "only / all / nothing /
  never / every".

My own extra checks (not in the validator): 3 options and exactly one right in every try; feedback 8-30 words;
Flesch 60+ on stem, hint and feedback; no authority words; right-is-longest share per topic.

| Topic | Right option is the longest (all items, hooks excluded, plus all tries) | In the 48 new tries |
|---|---|---|
| health-nutrition | 10.2% of 118 questions | 2 of 48 (4%) |
| history-civilisations | 15.2% of 112 questions | 0 of 48 |

Right option position by length in the new tries (to check that shortness did not become the new give-away):
Health 17 shortest / 29 middle / 2 longest; History 16 shortest / 32 middle / 0 longest. About a third shortest,
which is chance level for 3 options.

Exemption: some option texts score below Flesch 60 because they are only names or dates ("Kharosthi.",
"26 November 1949.", "Plassey, Buxar, then the diwani."). The validator does not score option text; editors may
want a rule that skips name-and-date options.

## 4. Blind check

**Official check: PENDING.** The main session will run its own blind check from
`content-drafts/tries/blind-check-input.json` (288 rows: 96 tries x 3 rounds, stem and shuffled options only) and
score it with `blind-check-key.json`. Rewrites from that check will follow on this branch.

**Preliminary check run for this job.** I had no Agent tool, so I ran the blind solver as three separate
`claude -p` processes with tools turned off, started in an empty folder, given only the stems and the options in a
fresh shuffle (question order shuffled too). They never saw teach cards, hints, feedback or the packs. Each pass =
3 independent runs.

| Pass | Text | Share right | Tries right 3/3 | 3/3 and a give-away |
|---|---|---|---|---|
| 1 | first draft | 277/288 = 96.2% | 89 | 26 (24 longest or most hedged, 2 the only kind or safe-sounding option) |
| 2 | after round-1 rewrites | 275/288 = 95.5% | 88 | 11 (longest) |
| 3 | final text | 273/288 = 94.8% | 89 | 0 |

By kind (pass 3): twist 138/144, transfer 135/144.

Read this with care: the solver is a large language model with wide general knowledge (it knows Kharosthi, Jikji,
Plassey and the WHO sugar limit). A share near 95% says the facts are well known to a model, not that an Indian
18-25 learner can answer without the card. It is a ceiling, not a measure of "card needed". cj3's human rule
(3 of 5 testers answer right without the card) still has to be run by editors.

Tries the solver got wrong in every pass (the card is clearly needed, or the item needs an editor look):
- `food-label-reading-s2.twist` (0/3 each pass): picks "You cannot tell from the list alone". The card says the list
  runs most to least, so the key stands.
- `free-sugars-s2.transfer` (0/3 each pass): picks "Far past it; the limit is about 3 teaspoons". Editor note: claim
  c5 (India's guide, sugar under 5% of energy, about 6 teaspoons) is stricter than the WHO 10% figure the step
  teaches. Ritu's 12 teaspoons sit at the WHO limit but past India's. Consider naming the 10% limit in the stem or
  moving this try off the 12-teaspoon edge.
- `free-sugars-s3.transfer` (0-2/3): picks "About half of it" for two cans of soda; the card's "up to 40 g" is needed.
- `protein-foods-s3.twist` and `exercise-heart-s3.transfer` (1-2/3): need the per-kg figure and the "vigorous counts
  double" rule.

Full per-try table (right answers out of 3 runs):

| Try | Pass 1 (first draft) | Pass 2 (after round-1 rewrites) | Pass 3 (final text) |
|---|---|---|---|
| ashoka-edicts-s1.transfer | 3/3 | 3/3 | 3/3 |
| ashoka-edicts-s1.twist | 3/3 | 3/3 | 3/3 |
| ashoka-edicts-s2.transfer | 3/3 | 3/3 | 3/3 |
| ashoka-edicts-s2.twist | 3/3 | 3/3 | 3/3 |
| ashoka-edicts-s3.transfer | 3/3 | 3/3 | 3/3 |
| ashoka-edicts-s3.twist | 3/3 | 3/3 | 3/3 |
| company-trade-rule-s1.transfer | 3/3 | 3/3 | 3/3 |
| company-trade-rule-s1.twist | 3/3 | 3/3 | 3/3 |
| company-trade-rule-s2.transfer | 3/3 | 3/3 | 3/3 |
| company-trade-rule-s2.twist | 3/3 | 3/3 | 3/3 |
| company-trade-rule-s3.transfer | 2/3 | 3/3 | 3/3 |
| company-trade-rule-s3.twist | 3/3 | 3/3 | 3/3 |
| exercise-heart-s1.transfer | 3/3 | 2/3 | 3/3 |
| exercise-heart-s1.twist | 3/3 | 3/3 | 3/3 |
| exercise-heart-s2.transfer | 3/3 | 3/3 | 3/3 |
| exercise-heart-s2.twist | 3/3 | 3/3 | 3/3 |
| exercise-heart-s3.transfer | 2/3 | 2/3 | 1/3 |
| exercise-heart-s3.twist | 3/3 | 3/3 | 3/3 |
| fad-diet-claims-s1.transfer | 3/3 | 3/3 | 3/3 |
| fad-diet-claims-s1.twist | 3/3 | 3/3 | 3/3 |
| fad-diet-claims-s2.transfer | 3/3 | 3/3 | 3/3 |
| fad-diet-claims-s2.twist | 3/3 | 3/3 | 3/3 |
| fad-diet-claims-s3.transfer | 3/3 | 3/3 | 3/3 |
| fad-diet-claims-s3.twist | 3/3 | 3/3 | 3/3 |
| food-label-reading-s1.transfer | 3/3 | 3/3 | 3/3 |
| food-label-reading-s1.twist | 3/3 | 3/3 | 3/3 |
| food-label-reading-s2.transfer | 3/3 | 3/3 | 3/3 |
| food-label-reading-s2.twist | 0/3 | 0/3 | 0/3 |
| food-label-reading-s3.transfer | 3/3 | 3/3 | 3/3 |
| food-label-reading-s3.twist | 3/3 | 3/3 | 3/3 |
| free-sugars-s1.transfer | 3/3 | 3/3 | 3/3 |
| free-sugars-s1.twist | 3/3 | 3/3 | 3/3 |
| free-sugars-s2.transfer | 0/3 | 0/3 | 0/3 |
| free-sugars-s2.twist | 3/3 | 3/3 | 3/3 |
| free-sugars-s3.transfer | 2/3 | 2/3 | 0/3 |
| free-sugars-s3.twist | 3/3 | 3/3 | 3/3 |
| hydration-cues-s1.transfer | 3/3 | 3/3 | 3/3 |
| hydration-cues-s1.twist | 3/3 | 2/3 | 2/3 |
| hydration-cues-s2.transfer | 3/3 | 3/3 | 3/3 |
| hydration-cues-s2.twist | 3/3 | 3/3 | 3/3 |
| hydration-cues-s3.transfer | 3/3 | 3/3 | 3/3 |
| hydration-cues-s3.twist | 3/3 | 3/3 | 3/3 |
| independence-constitution-s1.transfer | 3/3 | 3/3 | 3/3 |
| independence-constitution-s1.twist | 2/3 | 2/3 | 3/3 |
| independence-constitution-s2.transfer | 3/3 | 3/3 | 3/3 |
| independence-constitution-s2.twist | 3/3 | 3/3 | 3/3 |
| independence-constitution-s3.transfer | 3/3 | 3/3 | 2/3 |
| independence-constitution-s3.twist | 3/3 | 3/3 | 3/3 |
| indian-place-value-s1.transfer | 3/3 | 3/3 | 3/3 |
| indian-place-value-s1.twist | 3/3 | 3/3 | 3/3 |
| indian-place-value-s2.transfer | 3/3 | 3/3 | 3/3 |
| indian-place-value-s2.twist | 3/3 | 3/3 | 3/3 |
| indian-place-value-s3.transfer | 3/3 | 3/3 | 3/3 |
| indian-place-value-s3.twist | 3/3 | 3/3 | 3/3 |
| indus-cities-s1.transfer | 3/3 | 3/3 | 3/3 |
| indus-cities-s1.twist | 3/3 | 3/3 | 3/3 |
| indus-cities-s2.transfer | 3/3 | 3/3 | 3/3 |
| indus-cities-s2.twist | 3/3 | 3/3 | 3/3 |
| indus-cities-s3.transfer | 3/3 | 3/3 | 3/3 |
| indus-cities-s3.twist | 3/3 | 3/3 | 3/3 |
| iron-and-anaemia-s1.transfer | 3/3 | 3/3 | 3/3 |
| iron-and-anaemia-s1.twist | 3/3 | 3/3 | 3/3 |
| iron-and-anaemia-s2.transfer | 3/3 | 3/3 | 3/3 |
| iron-and-anaemia-s2.twist | 3/3 | 3/3 | 3/3 |
| iron-and-anaemia-s3.transfer | 3/3 | 3/3 | 3/3 |
| iron-and-anaemia-s3.twist | 3/3 | 3/3 | 3/3 |
| mughal-revenue-s1.transfer | 2/3 | 3/3 | 3/3 |
| mughal-revenue-s1.twist | 3/3 | 3/3 | 3/3 |
| mughal-revenue-s2.transfer | 3/3 | 3/3 | 3/3 |
| mughal-revenue-s2.twist | 3/3 | 3/3 | 3/3 |
| mughal-revenue-s3.transfer | 3/3 | 3/3 | 3/3 |
| mughal-revenue-s3.twist | 3/3 | 3/3 | 3/3 |
| printing-and-reading-s1.transfer | 3/3 | 3/3 | 3/3 |
| printing-and-reading-s1.twist | 3/3 | 3/3 | 3/3 |
| printing-and-reading-s2.transfer | 3/3 | 3/3 | 3/3 |
| printing-and-reading-s2.twist | 3/3 | 3/3 | 3/3 |
| printing-and-reading-s3.transfer | 3/3 | 3/3 | 3/3 |
| printing-and-reading-s3.twist | 3/3 | 3/3 | 3/3 |
| protein-foods-s1.transfer | 3/3 | 3/3 | 3/3 |
| protein-foods-s1.twist | 3/3 | 3/3 | 3/3 |
| protein-foods-s2.transfer | 3/3 | 3/3 | 3/3 |
| protein-foods-s2.twist | 3/3 | 3/3 | 3/3 |
| protein-foods-s3.transfer | 3/3 | 3/3 | 3/3 |
| protein-foods-s3.twist | 3/3 | 1/3 | 1/3 |
| silk-road-ideas-s1.transfer | 3/3 | 3/3 | 3/3 |
| silk-road-ideas-s1.twist | 3/3 | 3/3 | 3/3 |
| silk-road-ideas-s2.transfer | 3/3 | 3/3 | 3/3 |
| silk-road-ideas-s2.twist | 3/3 | 3/3 | 3/3 |
| silk-road-ideas-s3.transfer | 3/3 | 3/3 | 3/3 |
| silk-road-ideas-s3.twist | 3/3 | 3/3 | 3/3 |
| sleep-recovery-s1.transfer | 3/3 | 3/3 | 3/3 |
| sleep-recovery-s1.twist | 3/3 | 3/3 | 3/3 |
| sleep-recovery-s2.transfer | 3/3 | 3/3 | 3/3 |
| sleep-recovery-s2.twist | 3/3 | 3/3 | 3/3 |
| sleep-recovery-s3.transfer | 3/3 | 3/3 | 3/3 |
| sleep-recovery-s3.twist | 3/3 | 3/3 | 3/3 |

## 5. Every try rewritten after the blind check, and why

Rule applied: rewrite a try the solver got right 3/3 AND whose right option is a give-away (longest, most hedged,
or the only one that sounds kind or safe). The fix makes the right option shorter or plain, or gives the wrong
options the same length, hedging or warmth. 26 tries were rewritten after pass 1 and 11 after pass 2. The pass-1
fixes overshot (the right option became the shortest in 34 of 48 Health tries), so 15 more tries were rebalanced.
48 tries changed in all; the right answer and its claim stayed the same in every one.

| Try | Why | Right option before | Right option after | Wrong options changed |
|---|---|---|---|---|
| protein-foods-s1.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | Dal, milk and peanuts. | Dal, milk, peanuts and roasted chana. | 0 |
| protein-foods-s2.twist | length balance (right option had become the shortest after the round-1 fixes) or option readability | Yes; the rice and dal in it cover each other. | (same) | 1 |
| protein-foods-s3.twist | length balance (right option had become the shortest after the round-1 fixes) or option readability | About 65 kg. | About 65 kg, using the per-kg figure. | 0 |
| protein-foods-s3.transfer | round 1: 3/3 and give-away ['longest', 'hedged'] | Athletes may need more than the healthy adult figure. | Athletes may need more. | 1 |
| free-sugars-s1.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | The whole orange slices. | The whole oranges, cut into slices. | 0 |
| free-sugars-s2.twist | length balance (right option had become the shortest after the round-1 fixes) or option readability | About half of it. | About half of the day's limit. | 0 |
| free-sugars-s3.twist | length balance (right option had become the shortest after the round-1 fixes) or option readability | About 12 g. | About 12 g, near three teaspoons. | 0 |
| hydration-cues-s1.twist | round 1: 3/3 and give-away ['hedged'] | About there, since coffee and milk count. | At the mark, since coffee and milk count. | 0 |
| hydration-cues-s1.transfer | round 2: 3/3 and give-away ['longest'] | Pee and sweat still take water out. | Pee and sweat still take water out each day. | 1 |
| hydration-cues-s2.twist | round 1: 3/3 and give-away ['longest', 'hedged'] | She may be low on fluid, even without thirst. | She may be low on fluid, thirst or not. | 2 |
| hydration-cues-s2.transfer | round 1: 3/3 and give-away ['longest', 'hedged'] | It usually means she is drinking enough. | It is a sign she drinks enough. | 0 |
| hydration-cues-s3.twist | round 2: 3/3 and give-away ['longest'] | Yes; heat and sweat raise it. | Yes; heat and sweat raise it on their own. | 1 |
| hydration-cues-s3.transfer | round 1: 3/3 and give-away ['only safe-sounding option'] | Get urgent help now. | (same) | 2 |
| sleep-recovery-s1.twist | round 1: 3/3 and give-away ['hedged'] | He may find it harder to focus. | (same) | 2 |
| sleep-recovery-s2.transfer | round 1: 3/3 and give-away ['longest', 'hedged']; round 2: 3/3 and give-away ['longest'] | The first few hours after he falls asleep. | The early hours of his sleep, near bedtime. | 1 |
| sleep-recovery-s3.twist | round 1: 3/3 and give-away ['hedged']; round 2: 3/3 and give-away ['longest'] | By about half past nine. | By half past nine, or a bit before. | 1 |
| exercise-heart-s1.twist | length balance (right option had become the shortest after the round-1 fixes) or option readability | Inside the 150 to 300 minute range. | Inside the weekly range of 150 to 300. | 0 |
| exercise-heart-s1.transfer | round 1: 3/3 and give-away ['longest', 'hedged'] | It counts, and his week reaches about 300 minutes. | It counts, and it reaches 300 minutes. | 0 |
| exercise-heart-s2.twist | round 1: 3/3 and give-away ['longest'] | Below moderate, since she can still sing. | (same) | 2 |
| exercise-heart-s3.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | Both of them reach the aim. | Both reach it, Rina by counting double. | 0 |
| iron-and-anaemia-s1.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | Less haemoglobin, so less oxygen reaches the legs. | Less haemoglobin, so less oxygen gets to the legs and arms. | 0 |
| iron-and-anaemia-s2.twist | round 1: 3/3 and give-away ['longest'] | Palak dal with lemon, and tea an hour later. | (same) | 2 |
| iron-and-anaemia-s3.twist | round 1: 3/3 and give-away ['hedged'] | Another cause may be behind it. | (same) | 2 |
| iron-and-anaemia-s3.transfer | round 1: 3/3 and give-away ['hedged'] | Not always; malaria can be the cause. | No; malaria is one more cause. | 0 |
| food-label-reading-s1.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | Bar A, at 25 g per 100 g. | Bar A, which has 25 g per 100 g. | 0 |
| food-label-reading-s2.transfer | round 2: 3/3 and give-away ['longest'] | Wheat flakes, then sugar. | Wheat flakes, with sugar next in line. | 1 |
| food-label-reading-s3.twist | round 2: 3/3 and give-away ['longest'] | Water and sugar. | Water and sugar, then a little juice. | 1 |
| food-label-reading-s3.transfer | round 1: 3/3 and give-away ['longest', 'hedged'] | Read the back list; the aloe may be a small part. | Check the back list for the aloe. | 2 |
| fad-diet-claims-s2.twist | round 1: 3/3 and give-away ['longest', 'hedged'] | She may feel weak or dizzy, or get a headache. | She may feel weak, faint or get a headache. | 2 |
| fad-diet-claims-s2.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | There is no strong proof for detox. | There is no strong proof that detox works. | 0 |
| fad-diet-claims-s3.transfer | round 1: 3/3 and give-away ['longest'] | It rewards very fast loss, and slow is safer. | It rewards the fastest loss. | 0 |
| indus-cities-s1.transfer | round 1: 3/3 and give-away ['hedged'] | Someone likely planned the layout. | People planned the layout before building. | 0 |
| indus-cities-s2.twist | round 1: 3/3 and give-away ['longest'] | Two: drains ran along every lane, and most had brick covers. | Two: lanes had drains, mostly covered. | 0 |
| indus-cities-s3.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | What the photos and objects show. | What the photos and objects themselves show. | 0 |
| ashoka-edicts-s1.twist | length balance (right option had become the shortest after the round-1 fixes) or option readability | Rocks and pillars across the empire held them. | Rocks and pillars across the empire held his words. | 0 |
| ashoka-edicts-s3.twist | round 1: 3/3 and give-away ['only kind option']; round 2: 3/3 and give-away ['longest'] | Treat those who work for you kindly. | Be kind to servants and respect elders. | 2 |
| ashoka-edicts-s3.transfer | round 1: 3/3 and give-away ['longest']; round 2: 3/3 and give-away ['longest'] | Respect each other's faith and festivals. | Respect each other's faiths and festivals. | 2 |
| silk-road-ideas-s3.twist | round 1: 3/3 and give-away ['longest', 'hedged'] | Hun invasions seem to have driven them out. | (same) | 2 |
| indian-place-value-s3.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | They began in India. | They began in India, then went west. | 0 |
| printing-and-reading-s1.twist | round 2: 3/3 and give-away ['longest'] | His type was made of baked clay. | His type was small pieces of baked clay. | 1 |
| printing-and-reading-s3.twist | round 1: 3/3 and give-away ['longest'] | Swap in any other 'e', since all match. | Swap in any other 'e'. | 0 |
| printing-and-reading-s3.transfer | round 1: 3/3 and give-away ['hedged'] | Readers gain first; others need lessons. | Readers gain; others need lessons. | 0 |
| mughal-revenue-s2.twist | round 1: 3/3 and give-away ['longest'] | The jagir was never his land to sell. | It was not his land to sell. | 0 |
| mughal-revenue-s2.transfer | round 2: 3/3 and give-away ['longest'] | A jagir. | A jagir, income rights over a place. | 1 |
| mughal-revenue-s3.transfer | length balance (right option had become the shortest after the round-1 fixes) or option readability | It works where houses are measured. | It works only where houses are measured. | 0 |
| company-trade-rule-s2.transfer | round 1: 3/3 and give-away ['longest'] | It is no longer needed to buy goods. | It is no longer needed for goods. | 0 |
| independence-constitution-s1.transfer | round 1: 3/3 and give-away ['longest'] | Most members picked by the provincial assemblies. | Picked by the assemblies of the provinces. | 0 |
| independence-constitution-s3.transfer | round 2: 3/3 and give-away ['longest'] | Adopted first, in force later. | It was adopted, then in force two months on. | 0 |

## 6. Steps without a fair new situation, and close calls for editors

No step was left without a twist and a transfer. These are the ones where the new situation is weakest or the
same-situation count is close; editors may prefer to cut or replace them:

| Step | Try | Concern |
|---|---|---|
| fad-diet-claims-s2 | twist, transfer | "Weight comes back after a detox" is already tested 3 times (hook, Show me, Tara item), so neither new try uses it. The twist tests c6 (no-food days bring weakness) and the transfer tests "no proof", both close to the Kunal item. A truly new detox situation was not found. |
| fad-diet-claims-s1 | transfer | "One food has everything" already has 3 tests (hook powder, Show me smoothie, milk item); the transfer tests mixing food groups in a hostel mess instead. |
| iron-and-anaemia-s1 | transfer | Uses an analogy (fewer water tankers, less water) rather than a real health situation, because breathless-and-tired is already the Nisha item. |
| iron-and-anaemia-s3 | transfer | Malaria as a cause is also item iron-and-anaemia-14 (a different situation, so 2 tests). |
| printing-and-reading-s3 | transfer | "Books do not teach reading": guided (50 books), Delhi library item, and now village tablets = 3 tests, the maximum. |
| mughal-revenue-s2 | twist | "A jagir is not land" is the 4th test of that claim across steps (hook, guided, cousin's notes item), each in a different situation, so it passes the rule, but it is well worn. |
| mughal-revenue-s3 | transfer | Zabt needs records: Show me, guided and the forest item test it too, each in a different situation. |
| hydration-cues-s3 | transfer | The red-flag claim (c6) is also item hydration-cues-14; the procession is a new situation. |
| indus-cities-s1 | twist, transfer | "A grid shows a plan" is close to common sense; the solver got both right 3/3 with no give-away left. A fact a learner could not guess is hard to find in this claim. |
| silk-road-ideas-s3 | transfer | Dosa in Delhi assumes the learner knows dosa began in the south (common knowledge, but not from the card). |
| sleep-recovery-s1 | twist | Tests c6's "even one hour" which is in the claim but not on the teach card (the card says "short nights cost you"). |
| protein-foods-s3 | transfer | "Athletes may need more" is on the teach card; the 1.4-2.0 g figure is in c6 but not used. |
| company-trade-rule-s1 | twist | "The charter gave trade, not rule" is the m1 misconception; the teach card implies it but does not say it outright. |

## 7. Notes for the builder

- `guided` max 3, StepLesson must play guided -> twist -> transfer and hide the transfer hint (spec 23 §1).
- The validator's R6 hint check, R2 number check and R5 absolute-word check all now see the 3 tries; they caught
  real problems here and should stay on.
- Lesson options have no misconception field; the sidecar files hold the 111 links until one exists.
