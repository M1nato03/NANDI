# Variety review: Body and training

File reviewed: `content/topics/topic.body-training.json` on `origin/main` (78d1a28).
Date: 2026-10-21. Review only. No app code or content JSON was changed.

Why this review: a learner said the questions for one idea "all feel the same".
The cause is the same here, and worse: every concept in this topic has **1 claim and 8 items**.
So the 8 items keep re-asking one fact, or test things that only the `rule` says.
Target shape (spec 14, inflation on `learn-steps`): 3 steps per concept,
each step teaches a different claim, at most 3 items per step (3/3/2).

## Read this first: sources could not be opened in this run

This run's container had no web access to source sites. Every source host
(pubmed, pmc, nhlbi, cdc, who, nin.res.in, fssai.gov.in, ncbi books) failed:
`curl` got "CONNECT tunnel failed, response 403" from the proxy, and the
fetch tool could not resolve any host. Only web *search* worked.

What that means for this report:
- **Parts 1, 3 and 4 are complete.** They come from the JSON alone
  (items, repeats, items with no claim, step outlines).
- **The link check was not done.** I could not test whether any source URL is dead.
  Nothing below says a link is live or dead.
- **No proposed claim is verified.** For each one I give the best source to open
  and the wording that a search engine showed for it, marked **"lead, not opened"**.
  Search snippets can be wrong, out of date or paraphrased. A writer must open each
  page and copy the exact words before any claim goes into the JSON.
- So the last column of the summary is **"no"** for every concept today.
  "After check" says whether it becomes "yes" once the leads hold up.

To fix this for the next run: add the source hosts to the environment's allowed
domains (cloud environment menu, Edit, Network access), or run this check on a
machine with normal web access.

How to read each section:
- "Idea tested" is what a learner must know to get the item right.
- "Repeat" means two or more items test the same idea, even in different formats.
- "No claim" means the item tests a fact that is in no claim of the concept
  (often it is only in the `rule`, the `hook` or a misconception).
- Proposed claims are plain sentences, about Flesch 60+ (rough count, re-run the validator).
  No medical advice framed as treatment. No firearm content.

## Summary

| concept id | claims now | repeats found | claims proposed | ready for 3 steps? |
|---|---|---|---|---|
| progressive-overload | 1 | 2 groups, 7 of 8 items (1/2/3/4/7, 6/8) | 3 (c2-c4) | no (leads not opened; yes after check) |
| muscle-protein-rest | 1 | 3 groups, 8 of 8 items (1/2/6/8, 4/5, 3/7) | 3 (c2-c4) | no (leads not opened; yes after check) |
| sleep-recovery | 1 (holds 2 ideas) | 3 groups, 6 of 8 items (1/5, 2/6, 8 = 1+2) | split c1 + 2 (c2-c4) | no (leads not opened; yes after check) |
| heat-hydration | 1 (holds 2 ideas) | 3 groups, 7 of 8 items (1/4/5, 2/7, 3/6) | split c1 + 2 (c2-c4) | no (leads not opened; yes after check) |
| warmup-myths | 1 (holds 2 ideas) | 2 groups, 5 of 8 items (1/3/4, 2/7) | split c1 + 2 (c2-c4) | no (leads not opened; yes after check) |
| cardio-talk-test | 1 | 3 groups, 8 of 8 items (1/4/8, 2/6, 5/7) | 3 (c2-c4) | no (leads not opened; yes after check) |
| showing-up | 1 (holds 2 ideas) | 2 groups, 6 of 8 items (1/4/6, 2/3/5) | split c1 + 2 (c2-c4) | no (leads not opened; yes after check) |
| food-labels | 1 | 2 groups, 7 of 8 items (1/3/4/5/8, 6/7) | 2 (c2-c3) + 1 spare | no (leads not opened; yes after check) |

Pattern across the topic:
- Every concept has exactly **1 claim**. Four of those claims pack two ideas into one sentence.
- 23 of 64 items test a fact that is in **no claim** (only in the rule or hook). The fact-check
  marked them "supported", but there is no claim for a step to teach. The proposed claims give most of them a home.
- Every concept ends with an `explain-it-back` or `order`/`match` item that restates earlier items.
- Two estimate items test numbers no claim gives: heat-hydration-3 (1 litre an hour)
  and cardio-talk-test-3 (5 or 6 out of 10).

**Bigger finding, outside variety (needs a developer look):** concept id `sleep-recovery`
and item ids `sleep-recovery-1` ... `-8` exist in **both** this file and
`topic.health-nutrition.json`. If progress, review schedules or the ledger key on
concept or item id alone, the two topics will share (and overwrite) state.
See "Other things found" at the end.

---

## 1. progressive-overload (Progressive overload)

Claims now (1):
- c1: Resistance work can build strength; a rising challenge can support further progress over time. (acsm)

Items:

| id | type | idea tested |
|---|---|---|
| progressive-overload-1 | predict | Easy push-ups: add one more clean rep (c1 + "clean form", no claim) |
| progressive-overload-2 | scenario | Adding a little weight when reps feel smooth = overload (c1) |
| progressive-overload-3 | estimate | Clean extra rep counts; form-breaking weight does not (c1 + form, no claim) |
| progressive-overload-4 | choose | More clean reps at the same weight makes it harder (c1) |
| progressive-overload-5 | why | Same easy set for months stops giving gains: body adapts (c1, partly) |
| progressive-overload-6 | fill-the-step | Practise, adapt, add a small challenge (c1) |
| progressive-overload-7 | true-not-quite | More good reps also count, not only more weight (c1 + form) |
| progressive-overload-8 | order | Clean form, repeat until easier, add one small challenge (c1) |

Repeats:
- "Add a small clean challenge": 1, 2, 3, 4, 7. Five items, one idea.
- "Practise, adapt, then add": 6, 8 (and 5 says the same from the other side).
- No claim: "keep clean form" (1, 3, 7, 8). It is only in the rule and misconception m1.
- Only one distinct idea is taught. Nothing on how often to train or how much work per week.

Proposed claims:
- **c2: Training a muscle on two days a week tends to build more size than one day a week.**
  - Lead, not opened: Schoenfeld, Ogborn & Krieger 2016, "Effects of resistance training frequency
    on measures of muscle hypertrophy", Sports Medicine 46(11). PubMed 27102172 (id to confirm).
  - Search wording (unverified): higher frequency had a larger effect size than lower (0.49 vs 0.30);
    authors suggest training each muscle "at least twice a week".
  - Care: frequency and weekly sets were mixed in those studies. A 2019 update (Schoenfeld, Grgic
    & Krieger) found little difference when weekly sets are equal. Phrase it as "spreading the
    same work over two days" only if the opened source supports that.
- **c3: More hard sets a week tend to bring more muscle growth, up to a point.**
  - Lead, not opened: Schoenfeld, Ogborn & Krieger 2017, "Dose-response relationship between weekly
    resistance training volume and increases in muscle mass", Journal of Sports Sciences 35(11).
  - Search wording (unverified): "Each additional set was associated with an increase in effect size
    (ES) of 0.023 corresponding to an increase in the percentage gain by 0.37%."
  - Care: the paper could not judge above about 10 sets per muscle a week. Keep "up to a point".
- **c4 (home-workout fit): Light loads lifted until the muscle is very tired can build similar muscle size to heavy loads.**
  - Lead, not opened: Schoenfeld et al. 2017, "Strength and hypertrophy adaptations between low- vs.
    high-load resistance training", J Strength Cond Res 31(12). PubMed 28834797.
  - Search did not return the result wording. Status: **no source opened, wording unknown.**
    Keep only if the abstract says hypertrophy is similar and strength favours heavy loads.
  - Why it helps: it explains why push-ups and bucket rows at home still count.

3-step outline:

| step | title | claim | after it, the learner can | diagram |
|---|---|---|---|---|
| s1 | Muscles adapt, so add a little | c1 | spot a small, clean increase vs a sloppy jump | flow: practise → adapt → add a little |
| s2 | More sets a week, more growth | c3 | compare two weekly plans by hard sets | scale: sets per week, low to about 10 |
| s3 | Two days beat one big day | c2 | pick a 2-day split over one all-out day | compare: 1 day vs 2 days a week |

Items that fit: s1 = 1, 3, 7 (s1 keeps the "clean form" idea; add form to c1's text or a claim).
s2 = 2 new items. s3 = 2 new items (showing-up-2 is a near copy; do not reuse it here).
Leftover: 2, 4, 5, 6, 8 repeat s1. Keep 5 or 8 as review; drop or rewrite the rest.
c4 can feed a guided "home workout" example in s1 if it holds up.

---

## 2. muscle-protein-rest (Muscle, protein and rest)

Claims now (1):
- c1: The ISSN stand gives about 1.4 to 2.0 grams of protein per kilogram per day for most exercising people. (issn)

Items:

| id | type | idea tested |
|---|---|---|
| muscle-protein-rest-1 | predict | Dal and curd add protein for new muscle (no claim: "protein = building blocks") |
| muscle-protein-rest-2 | scenario | Training + canteen protein help muscle respond (no claim) |
| muscle-protein-rest-3 | estimate | About 1.7 g per kg a day (c1, midpoint) |
| muscle-protein-rest-4 | choose | Training plus food and rest change muscle (no claim: "rest") |
| muscle-protein-rest-5 | why | Protein cannot replace training (no claim) |
| muscle-protein-rest-6 | fill-the-step | Training is the signal; protein brings building blocks (no claim) |
| muscle-protein-rest-7 | true-not-quite | The range is for people who exercise, not everyone (c1) |
| muscle-protein-rest-8 | match | Resistance work = signal; food protein = parts (no claim) |

Repeats:
- "Training signals, protein supplies parts": 1, 2, 6, 8.
- "You need training, not just food (and rest)": 4, 5.
- "The 1.4-2.0 range": 3, 7.
- No claim: 1, 2, 4, 5, 6, 8. Six items rest only on the rule. Rest and timing are untested by any claim.

Proposed claims:
- **c2: One hard strength session can keep muscle building raised for up to about two days.**
  - Lead, not opened: Davies, Lynch, Kumar & Jakeman 2024, "Characterisation of the Muscle Protein
    Synthetic Response to Resistance Exercise in Healthy Adults", Translational Sports Medicine,
    doi 10.1155/2024/3184356. Free text: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11074832/
  - Search wording (unverified): "a single bout of RE can sustain measurable increases in
    postabsorptive MPS soon after RE cessation and up to 48 h post-RE."
  - Care: the response was smaller in adults over 50 and varied a lot between trials.
  - This is the existing `mps` source. Note the file names its publisher "Sports Medicine";
    search says Translational Sports Medicine. Check when opening.
- **c3: Protein helps most when spread over meals, about 20 to 40 grams at a time.**
  - Lead, not opened: the existing `issn` source, Jäger et al. 2017,
    https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/
  - Search wording (unverified): "General recommendations are 0.25 g of a high-quality protein per kg
    of body weight, or an absolute dose of 20–40 g."
  - The "every 3 to 4 hours" part did not show in search. Leave it out unless the page says it.
- **c4: Extra protein adds to muscle gains only alongside strength training, and gains level off above about 1.6 g per kg a day.**
  - Lead, not opened: Morton et al. 2018, BJSM 52(6):376-384, https://bjsm.bmj.com/content/52/6/376
  - Search wording (unverified): "protein supplementation beyond total protein intakes of 1.62 g/kg/day
    resulted in no further RET-induced gains in FFM."
  - Care: authors were not sure exactly where the level-off sits. Say "about". Indian angle:
    dal, curd, paneer, eggs reach this from food; do not frame it as a supplement push.

3-step outline:

| step | title | claim | after it, the learner can | diagram |
|---|---|---|---|---|
| s1 | Training is the signal to grow | c2 | say why the session, not food alone, starts growth, and that it lasts 1-2 days | flow: hard set → muscle building rises → back to base in ~2 days |
| s2 | How much protein a day | c1 (+ c4 level-off) | place a day's intake on the 1.4-2.0 g/kg range | scale: g per kg per day, 0.8 to 2.0 |
| s3 | Spread protein over meals | c3 | turn a day's total into 3-4 meals of 20-40 g | compare: one big meal vs spread meals |

Items that fit: s1 = 5, 6, 8. s2 = 3, 7, 4 (4 fits if c4 is the claim). s3 = 1, 2 (rewrite them to ask "how much at this meal").
Leftover: none, but 1, 2, 6, 8 overlap. Rewrite 1 and 2 for s3 so they stop repeating 6 and 8.

---

## 3. sleep-recovery (Sleep and recovery)

Claims now (1, holds 2 ideas):
- c1: Adults are advised to get about 7 to 9 hours of sleep; sleep loss can harm exercise output and hunger cues. (hours, sleep, sport)
- Split it: c1a "7 to 9 hours" and c1b "sleep loss can harm output and hunger cues".

Items:

| id | type | idea tested |
|---|---|---|
| sleep-recovery-1 | predict | Short night → usual run feels harder (c1b) |
| sleep-recovery-2 | scenario | Less sleep → more snack cravings (c1b) |
| sleep-recovery-3 | estimate | About 8 hours a night for adults (c1a) |
| sleep-recovery-4 | choose | Recovery = enough sleep and time off hard work (no claim: rest days) |
| sleep-recovery-5 | why | One short night can change effort and recovery (c1b) |
| sleep-recovery-6 | fill-the-step | Sleep keeps hunger signals in balance (c1b) |
| sleep-recovery-7 | true-not-quite | An average effect is not every person's result (no claim) |
| sleep-recovery-8 | explain-it-back | Sleep helps recovery and hunger cues (c1b, restates 1 + 2) |

Repeats:
- "Short sleep hurts the session": 1, 5 (and half of 8).
- "Short sleep shifts hunger": 2, 6 (and half of 8).
- No claim: 4 (time off hard work), 7 (average vs each person).

Proposed claims:
- **c2: After a short night, sports performance drops more in the afternoon than in the morning.**
  - Lead, not opened: the existing `sport` source. Gong et al. 2024, Nature and Science of Sleep 16,
    https://pmc.ncbi.nlm.nih.gov/articles/PMC11246080/
  - Search wording (unverified): overall effect "−0.56"; morning and afternoon subgroup effects
    "−0.30 and −1.11 ... respectively".
  - Care: the larger afternoon drop was linked to cutting sleep at the end of the night. Results
    differ by task; item 7's "average, not each person" point fits here.
- **c3: Cutting sleep can raise the hunger hormone and lower the fullness hormone.**
  - Lead, not opened: Spiegel et al. 2004, Annals of Internal Medicine 141(11), PubMed 15583226.
  - Search wording (unverified): "leptin (decrease, 18%; P = 0.04), elevations in the orexigenic
    factor ghrelin (increase, 28%; P < 0.04)".
  - Care: 12 young men, 2 nights. Other studies found no change. Say "can", not "does".
  - Better: if the NHLBI `sleep` page has a ghrelin/leptin line, cite that instead (it is a public-health page).
- **c4 (student fit, spare): Teens aged 13 to 18 need 8 to 10 hours of sleep a day.**
  - Lead, not opened: AASM pediatric sleep duration consensus, Paruthi et al. 2016,
    https://aasm.org/resources/pdf/pediatricsleepdurationmethods.pdf
  - Search wording (unverified): "Teenagers 13 to 18 years of age should sleep 8 to 10 hours per
    24 hours on a regular basis to promote optimal health."
  - Use only if the app has under-19 learners; otherwise skip.

3-step outline:

| step | title | claim | after it, the learner can | diagram |
|---|---|---|---|---|
| s1 | Adults need 7 to 9 hours | c1a | check a sleep log against the range | scale: hours, 5 to 10, band at 7-9 |
| s2 | A short night costs the next session | c1b + c2 | predict a harder run, worse later in the day | compare: morning vs afternoon after a short night |
| s3 | Short sleep can turn up hunger | c3 | link exam-week cravings to sleep, not willpower | flow: short sleep → hunger hormone up → more snacking |

Items that fit: s1 = 3, 4 (4 needs "rest days" folded into c1a or dropped). s2 = 1, 5, 7. s3 = 2, 6, 8.
Leftover: none. Step 1 has only 2 items; it needs 1 new item.

---

## 4. heat-hydration (Heat and hydration)

Claims now (1, holds 2 ideas):
- c1: Hot exercise can raise heat risk and fluid loss. Feeling dizzy, sick or headachy can be a warning. (heat, signs)
- Split it: c1a "heat raises strain and fluid loss" and c1b "dizzy, sick, headache are warning signs".

Items:

| id | type | idea tested |
|---|---|---|
| heat-hydration-1 | predict | Hot noon run → slower pace, more breaks (no claim: pace/breaks) |
| heat-hydration-2 | scenario | Dizzy and sick at cricket → stop, move somewhere cool (c1b) |
| heat-hydration-3 | estimate | About 1 litre of sweat an hour (no claim; source `cdc-heat-rate` is cited but no claim uses it) |
| heat-hydration-4 | choose | Heat adds strain, so slow down (c1a) |
| heat-hydration-5 | why | App's hot-day mode cuts effort: heat adds load even for fit people (c1a) |
| heat-hydration-6 | fill-the-step | Water replaces some lost fluid (c1a, partly) |
| heat-hydration-7 | true-not-quite | Dizziness is a warning, not "it's working" (c1b) |
| heat-hydration-8 | explain-it-back | Hot-day mode = less strain, more breaks and fluid (c1a, restates 1/4/5) |

Repeats:
- "Heat adds strain, so slow down and rest": 1, 4, 5, 8.
- "Dizzy or sick = stop and cool down": 2, 7.
- "Sweat loses fluid": 3, 6.
- No claim: 1 (pace and breaks are only in the rule), 3 (the 1 litre figure).
- Items 5 and 8 test what the app's hot-day mode does. That is an app fact, not a sourced claim.

Proposed claims:
- **c2: In hot weather, a person can sweat about a litre or more an hour.**
  - Lead, not opened: the existing `cdc-heat-rate` source, CDC Yellow Book, "Heat and Cold Illness in Travelers",
    https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/heat-and-cold-illness-in-travelers.html
  - Search wording (unverified, from the 2016 edition, not the current page): "sweat rates commonly
    reach 1 liter per hour or more, resulting in substantial fluid and sodium loss."
  - Care: confirm the figure is still on the current page. This claim gives item 3 a home.
- **c3: The body gets used to heat over about one to two weeks of gradual exposure.**
  - Lead, not opened: CDC/NIOSH, "Heat stress: acclimatization",
    https://www.cdc.gov/niosh/heat-stress/recommendations/acclimatization.html
  - Search wording (unverified): workers should "gradually increase their exposure time in hot
    environmental conditions over a 7-14 day period".
  - Care: this is workplace guidance. A sports source (e.g. NATA heat acclimatization statement)
    would fit better; not searched. Indian angle: the first hot weeks of April-May are the riskiest.
- **c4: Heat exhaustion signs include heavy sweating, cool clammy skin, dizziness, nausea and headache; move to a cool place and sip water.**
  - Lead, not opened: the existing `signs` source, CDC "Heat Related Illnesses" PDF,
    https://www.cdc.gov/extreme-heat/media/pdf/Heat_Related_Illness.pdf
  - Search wording (unverified, seen on reprints of the CDC sheet, not the CDC file):
    "Heavy sweating; ... cool, pale, clammy skin; fast, weak pulse; muscle cramps; dizziness,
    nausea or vomiting; headache; fainting." and "Move person to a cooler environment ... Offer sips of water."
  - Care: this is first aid, not treatment. Keep the line that heat stroke (confusion, very hot skin)
    is an emergency: get help at once.

3-step outline:

| step | title | claim | after it, the learner can | diagram |
|---|---|---|---|---|
| s1 | Heat makes the same work harder | c1a + c3 | slow down and add breaks on a hot day, more so in the first hot weeks | compare: cool day vs hot day, same run |
| s2 | Sweat takes water away | c2 | estimate fluid lost in an hour and plan drinks | scale: litres per hour, 0 to 1.5 |
| s3 | Know the warning signs | c1b + c4 | spot heat-exhaustion signs and say "stop and cool down" | flow: signs → stop → cool place → sips of water |

Items that fit: s1 = 1, 4, 5. s2 = 3, 6. s3 = 2, 7, 8 (rewrite 8 to sum up signs, not the app mode).
Leftover: none after the rewrite. s2 needs 1 new item.

---

## 5. warmup-myths (Warm-up and injury myths)

Claims now (1, holds 2 ideas):
- c1: A gradual warm-up raises heart rate and breathing; long static holds can slightly reduce later power in tests. (guide, review)
- Split it: c1a "warm-up raises pulse and breathing bit by bit" and c1b "long static holds slightly reduce later power".

Items:

| id | type | idea tested |
|---|---|---|
| warmup-myths-1 | predict | Walk then jog → pulse and breathing rise bit by bit (c1a) |
| warmup-myths-2 | scenario | Long still stretch → jump a little lower (c1b) |
| warmup-myths-3 | estimate | Which of two warm-ups raises pulse step by step (c1a) |
| warmup-myths-4 | choose | Job of an easy warm-up = raise pulse and breathing (c1a) |
| warmup-myths-5 | why | No stretch surely prevents injury or gives the best sprint (no claim: injury) |
| warmup-myths-6 | fill-the-step | Static stretch = holding a pose (no claim: definition) |
| warmup-myths-7 | true-not-quite | Static stretches still help range of motion (no claim) |
| warmup-myths-8 | explain-it-back | Build effort in steps; fit moves to the task (c1a + c1b) |

Repeats:
- "Warm-up raises pulse bit by bit": 1, 3, 4 (and half of 8).
- "Long holds dull power": 2 (and the setup of 7).
- No claim: 5 (injury), 6 (definition), 7 (range of motion).

Proposed claims:
- **c2: Holding a stretch for under a minute per muscle has only a tiny effect on power; a minute or more has a bigger one.**
  - Lead, not opened: the existing `review` source, Behm et al. 2016, APNM 41(1):1-11,
    https://pubmed.ncbi.nlm.nih.gov/26642915/
  - Search wording (unverified): "greater performance deficits with ≥60 s (–4.6%) than with <60 s (–1.1%)
    SS per muscle group."
  - This makes c1b precise and gives a scale diagram.
- **c3: Stretching improves how far a joint can move, but the gain usually lasts under half an hour.**
  - Lead, not opened: same Behm et al. 2016 abstract.
  - Search wording (unverified): "all forms of training induced ROM improvements, typically lasting <30 min."
  - Gives item 7 a home.
- **c4: A set warm-up of running, strength and balance moves cut football injuries by about a third in trials.**
  - Lead, not opened: Thorborg et al. 2017, BJSM 51(7):562-571, "Effect of specific exercise-based
    football injury prevention programmes", PubMed 28087568.
  - Search wording (unverified): "The FIFA 11+ prevention programme has a substantial injury-preventing
    effect, reducing football injuries by 39%".
  - Care: football players in trials, not everyone. Behm 2016 says static stretching alone had no clear
    effect on injury. So the honest line is "a full warm-up programme helped; stretching alone did not
    clearly help". Gives item 5 a home.

3-step outline:

| step | title | claim | after it, the learner can | diagram |
|---|---|---|---|---|
| s1 | Warm up by raising effort in steps | c1a | build a walk → jog → drills warm-up | flow: walk → jog → drills → hard work |
| s2 | Long still holds can dull power | c1b + c2 | keep holds short before a jump or sprint | scale: hold time, 0 to 90 s, mark at 60 s |
| s3 | Stretch for range; warm up for injuries | c3 + c4 | tell what stretching does and does not do | compare: stretching alone vs full warm-up programme |

Items that fit: s1 = 1, 3, 4. s2 = 2, 6, 7. s3 = 5, 8.
Leftover: none. 3 and 4 overlap with 1; rewrite one of them if s1 needs more variety.

---

## 6. cardio-talk-test (Cardio zones and talk test)

Claims now (1):
- c1: CDC uses talk but not sing for moderate effort, and only a few words before a breath for vigorous effort. (cdc)

Items:

| id | type | idea tested |
|---|---|---|
| cardio-talk-test-1 | predict | Can chat, can't sing = moderate (c1) |
| cardio-talk-test-2 | scenario | Only a few words = vigorous (c1) |
| cardio-talk-test-3 | estimate | Talk-not-sing = 5 or 6 out of 10 (no claim) |
| cardio-talk-test-4 | choose | The test reads speech and breath (c1) |
| cardio-talk-test-5 | why | Same speed, different effort for different people (no claim: relative effort) |
| cardio-talk-test-6 | fill-the-step | Moderate → vigorous: speech shrinks to a few words (c1) |
| cardio-talk-test-7 | true-not-quite | Rough clue, not an exact heart rate (no claim) |
| cardio-talk-test-8 | explain-it-back | Speech gets shorter as effort rises (c1) |

Repeats:
- "Talk but not sing = moderate": 1, 4, 8.
- "A few words = vigorous": 2, 6.
- "It is a rough, personal measure": 5, 7.
- No claim: 3, 5, 7.

Proposed claims:
- **c2: On a 0 to 10 effort scale, moderate effort is about 5 or 6, and vigorous starts at about 7 or 8.**
  - Lead, not opened: the existing `cdc` source, https://www.cdc.gov/physical-activity-basics/measuring/
  - Search wording (unverified): "relatively moderate-intensity activity is a level of effort of 5 or 6,
    and relatively vigorous-intensity activity begins at a 7 or 8."
  - Gives item 3 a home.
- **c3: The talk test measures effort for you, so the same pace can be moderate for one person and vigorous for another.**
  - Lead, not opened: same CDC page. Search showed it calls the talk test "a simple way to measure
    relative intensity". The "same pace, different person" sentence was not in the snippet.
    Status: **wording to confirm on the page.** Gives items 5 and 7 a home.
- **c4: WHO advises adults to get 150 to 300 minutes of moderate, or 75 to 150 minutes of vigorous, activity a week.**
  - Lead, not opened: WHO Guidelines on Physical Activity and Sedentary Behaviour 2020,
    https://www.ncbi.nlm.nih.gov/books/NBK566046/ (the existing `who` source in showing-up).
  - Search wording (unverified): "Adults should accumulate at least 150-300 minutes of moderate-intensity
    aerobic physical activity per week, or at least 75-150 minutes of vigorous-intensity".
  - Care: health-nutrition `exercise-heart` c1 already teaches 150-300 minutes. Use it here only
    to say "a vigorous minute counts about double", or skip c4 to avoid a cross-topic repeat.

3-step outline:

| step | title | claim | after it, the learner can | diagram |
|---|---|---|---|---|
| s1 | Talk but not sing = moderate | c1 (moderate half) | name moderate effort from speech | scale: speech, sing → talk → few words |
| s2 | A few words = vigorous | c1 (vigorous half) + c2 | name vigorous effort and give it a 0-10 score | scale: 0 to 10, bands at 5-6 and 7-8 |
| s3 | It reads your effort, not your speed | c3 | explain why two friends at one pace can differ | compare: friend A vs friend B, same speed |

Items that fit: s1 = 1, 4, 8. s2 = 2, 6, 3. s3 = 5, 7.
Leftover: none. c1 is one claim split over two steps; if the validator needs one claim per step,
store c1 as two claims (c1a moderate, c1b vigorous). That is a split, not new content.

---

## 7. showing-up (Habit of showing up)

Claims now (1, holds 2 ideas):
- c1: WHO says some activity is better than none and advises adult muscle-strengthening work on two or more days a week. (who)
- Split it: c1a "some activity is better than none" and c1b "muscle work on 2+ days a week".

Items:

| id | type | idea tested |
|---|---|---|
| showing-up-1 | predict | A short workout in exam week still counts (c1a) |
| showing-up-2 | scenario | Two steady days beat one all-out day (c1b) |
| showing-up-3 | estimate | WHO minimum for muscle work = 2 days (c1b) |
| showing-up-4 | choose | For a beginner: some activity beats none (c1a) |
| showing-up-5 | why | One hard day then nothing misses the weekly pattern (c1b) |
| showing-up-6 | fill-the-step | Some activity beats none (c1a) |
| showing-up-7 | true-not-quite | The guide also asks for heart-pumping activity (no claim) |
| showing-up-8 | explain-it-back | Start small and keep coming back (no claim: habit) |

Repeats:
- "Some beats none": 1, 4, 6. Item 6 is item 4 as a fill-in.
- "Two days a week": 2, 3, 5.
- No claim: 7 (aerobic minutes), 8 (habit advice).

Proposed claims:
- **c2: Activity counts in bouts of any length; WHO dropped the old 10-minute minimum in 2020.**
  - Lead, not opened: WHO 2020 guidelines, https://www.ncbi.nlm.nih.gov/books/NBK566046/ ,
    or Bull et al. 2020, BJSM 54(24):1451-1462.
  - Search wording (unverified, from secondary summaries): the earlier edition required bouts of at least
    10 minutes and the 2020 update removed it ("any bout duration").
  - Fits the app's "a short hostel session still counts" message. Gives item 1 a sharper basis.
- **c3: WHO also says to cut sitting time and swap it for activity of any intensity.**
  - Lead, not opened: same WHO 2020 guideline.
  - Search wording (unverified): "limit their daily sedentary time and replace it with physical activity
    of any intensity".
- **c4 (habit, spare): In one study, a new daily habit took a median of 66 days to become automatic, and missing one day did not undo it.**
  - Already sourced and fact-checked in `topic.psychology.json`, concept `habits`
    (Lally et al. 2010, https://pubmed.ncbi.nlm.nih.gov/17907866/ in that file).
  - Care: using it here repeats Psychology. Prefer a link to that concept over a copy.
  - Gives item 8 a home if used.

3-step outline:

| step | title | claim | after it, the learner can | diagram |
|---|---|---|---|---|
| s1 | Some movement beats none | c1a + c2 | count a 10-minute session as real progress | compare: nothing vs a short session |
| s2 | Muscle work two days a week | c1b | plan two regular strength days | scale: days per week, 0 to 7, mark at 2 |
| s3 | Sit less, move more | c3 | swap one sitting block for a walk | flow: long sit → stand → short walk |

Items that fit: s1 = 1, 4, 6. s2 = 2, 3, 5. s3 = 7 (rewrite toward c3) + 1 new.
Leftover: 8 (no claim unless c4 is linked). 4 and 6 test the same line; rewrite 6 to use c2 (bout length).

---

## 8. food-labels (Food labels in India)

Claims now (1):
- c1: FSSAI rules list a serve size. They also list protein and sugars for a set food amount, such as 100 g or one pack. (fssai)

Items:

| id | type | idea tested |
|---|---|---|
| food-labels-1 | predict | Compare packs by per 100 g (c1) |
| food-labels-2 | scenario | "30 g per serve" is the serving size (c1) |
| food-labels-3 | estimate | Shared base = 100 g (c1) |
| food-labels-4 | choose | Protein per 100 g = protein in a set amount (c1) |
| food-labels-5 | why | Bigger serving hides the real amount; use per 100 g (c1) |
| food-labels-6 | fill-the-step | Total sugars and added sugars are different lines (no claim) |
| food-labels-7 | true-not-quite | Zero added sugar can still have natural sugar (no claim) |
| food-labels-8 | explain-it-back | Compare on the same 100 g base (c1) |

Repeats:
- "Use per 100 g to compare": 1, 3, 4, 5, 8. Five items, one idea.
- "Total vs added sugar": 6, 7.
- No claim: 6, 7.

Proposed claims:
- **c2: FSSAI labels must show added sugars on their own line, apart from total sugars.**
  - Lead, not opened: the existing `fssai` source (Labelling and Display Regulations 2020, compendium VII).
  - Search wording (unverified, from secondary summaries): items to declare include
    "Total Sugars (g), Added Sugars (g)". Search could not show the regulation text.
    Status: **wording to confirm in the regulation.** Gives items 6 and 7 a home.
- **c3: Ingredients are listed from the most to the least by weight.**
  - Lead, not opened: Lok Sabha answer (Ministry of Health) and FSSAI organic labelling note,
    https://jaivikbharat.fssai.gov.in/pdf/Labelling-Organic23052018_byFSSAI.pdf
  - Search wording (unverified): products "shall mention list of ingredients in descending order of
    their composition by weight or volume".
  - Care: health-nutrition `food-label-reading` c2 already teaches this (NHS source). Use the FSSAI
    rule here only if the step stays India-specific; otherwise it is a cross-topic repeat.
- **c4 (spare): WHO advises keeping free sugars under 10% of daily energy.**
  - Already in `topic.health-nutrition.json` (free-sugars). Same cross-topic caution. Not proposed for a step.
- No source found for an India-only third claim in this run (e.g. FSSAI front-of-pack rules);
  search showed only a 2022 draft, which is not in force as far as search showed.

3-step outline:

| step | title | claim | after it, the learner can | diagram |
|---|---|---|---|---|
| s1 | A serving is the maker's choice | c1 (serve size half) | read the serve size line and see it differs by brand | compare: pack A 30 g serve vs pack B 50 g serve |
| s2 | Compare packs per 100 g | c1 (per 100 g half) | compare protein or sugar fairly across packs | compare: two packs on one 100 g base |
| s3 | Added sugar is its own line | c2 | tell total sugar from added sugar | flow: total sugars → minus natural → added sugars |

Items that fit: s1 = 2 + 1 new. s2 = 1, 5, 3. s3 = 6, 7.
Leftover: 4, 8 repeat s2. Keep 8 as review. c3 (ingredient order) could replace s1 if
the team accepts the cross-topic overlap. Like cardio, c1 should be stored as two claims.

---

## Other things found while checking

- **Duplicate ids across topics (needs a developer check).** `sleep-recovery` is a concept id
  in both `topic.body-training.json` and `topic.health-nutrition.json`, and both use item ids
  `sleep-recovery-1` to `-8`. If any store (progress, review schedule, ledger `kind:refId`) keys on
  concept or item id without the topic id, the two will collide. Suggest renaming one
  (e.g. `training-sleep`) with a migration and a backup round-trip test, per CLAUDE.md.
- **Topic overlap with Health and nutrition.** Pairs that teach close ideas:
  sleep-recovery / sleep-recovery, heat-hydration / hydration-cues, food-labels / food-label-reading,
  showing-up / exercise-heart, muscle-protein-rest / protein-foods. When adding steps, keep this
  topic on training (effort, sessions, heat while training) and leave diet facts to Health and nutrition.
- **`mps` source label.** The file calls it "Systematic review and meta-analysis, Sports Medicine"
  (PubMed 38716482). Search shows the paper (Davies et al. 2024) in *Translational Sports Medicine*.
  Not opened; check the PubMed id and the journal name.
- **`acsm` source year.** The file gives a 2026 ACSM stand at PubMed 41843416. Could not open it
  to confirm it exists and says what c1 claims. All of progressive-overload and two items in
  showing-up rest on it, so it is the first link to check.
- **Dead-link check not done.** No source URL in this file could be fetched from this container
  (proxy 403 / no DNS). The editorial review of 2026-10-17d used an older CDC URL
  (`cdc.gov/physicalactivity/basics/measuring/index.html`); the file uses the newer
  `cdc.gov/physical-activity-basics/measuring/`. Search lists both; confirm the newer one loads.
- **App facts used as quiz facts.** heat-hydration-5 and -8 test what the app's hot-day mode does.
  That is fine as a reminder, but it is not a sourced claim and should not count toward the 3 claims.
- **No claim covers "clean form".** It is central to progressive-overload (items 1, 3, 7, 8) but only
  appears in the rule and misconception. Either add it to c1's text or give it its own sourced claim
  (ACSM stand, once opened).

## Sources

Opened in this run: none (network blocked; see top).
Search only (wording above is from search results and must be checked):
- Schoenfeld et al. 2016 (frequency), 2017 (volume), 2017 (low vs high load).
- Jäger et al. 2017, ISSN protein stand (PMC5477153).
- Morton et al. 2018, BJSM 52(6):376.
- Davies et al. 2024, Translational Sports Medicine (PMC11074832).
- Gong et al. 2024, Nature and Science of Sleep (PMC11246080).
- Spiegel et al. 2004, Annals of Internal Medicine.
- AASM pediatric sleep duration consensus 2016.
- CDC Yellow Book heat chapter; CDC/NIOSH acclimatization page; CDC heat-illness sheet (via reprints).
- Behm et al. 2016, APNM; Thorborg et al. 2017, BJSM.
- CDC "How to Measure Physical Activity Intensity".
- WHO 2020 guidelines (NBK566046) and secondary summaries.
- FSSAI labelling rules via Lok Sabha answer and FSSAI organic labelling note.
