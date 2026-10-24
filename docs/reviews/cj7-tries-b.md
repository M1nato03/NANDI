# cj7 tries b: twist and transfer tries for How things work and Body training

Draft for human editors (cloud job batch 7, Job 2). Nothing here ships without editor sign-off.
Base: `origin/ideas/learn-misconceptions` (65ed5ef). Spec: 23 §1, "More doing per lesson".

## 1. Counts

| Topic | Steps | New tries | Twist | Transfer | Wrong options tagged to a misconception |
|---|---|---|---|---|---|
| how-things-work | 30 | 60 | 30 | 30 | 66 of 120 |
| body-training | 24 | 48 | 24 | 24 | 58 of 96 |
| **Total** | **54** | **108** | 54 | 54 | 124 of 216 |

Files:
- `content-drafts/tries/how-things-work.json`, `content-drafts/tries/body-training.json`: one row per step,
  `{stepId, claimIds, twist, transfer}`.
- `content-drafts/tries/*.misconceptions.json`: sidecar, `{stepId, which, optionId, misconceptionId}`.
- `content-drafts/tries/merged/topic.*.json`: the packs with `guided` = [guided, twist, transfer].
- `content-drafts/tries/blind-check-input.json` and `blind-check-key.json`: blind-check input and key, kept for a re-run (see §4).

The right option's position is rotated (a, b, c) across the tries.

## 2. Schema change (builder must make it properly)

On this branch only, `guided` in `src/data/packs/schemas.ts` goes from `v.maxLength(2)` to `v.maxLength(3)`, so the
merged packs parse. Spec 23 §1 makes this change. The builder has to make it properly: `StepLesson.tsx` sequences
all three tries, the transfer try hides its hint, and the schema test is updated. Existing tests in
`src/data/packs`, `scripts/packs.test.js` and `scripts/topic-quality.test.ts` still pass (69 passed, 12 skipped).

## 3. Validator

`validatePack(pack, { allowUnchecked: true, editorial: true })` on the originals and the merged copies:

```
original topic.how-things-work.json: 0 errors
merged topic.how-things-work.json: 0 errors
original topic.body-training.json: 0 errors
merged topic.body-training.json: 0 errors
```

Errors found and fixed along the way:
- Spec 16 R2: four practice items "reused" numbers that my tries had put in the step's lesson
  (`sleep-recovery-12` 11 and 7, `warmup-myths-12` 4.6, `cardio-talk-test-11` 7, `food-labels-13` 8). Fixed by
  changing the numbers in the tries.
- R6: 22 hints shared a content word with the right option. All rewritten.
- R5 absolute words: my first draft put "only / nothing / all" in many wrong options, which would have broken the
  body-training ratio. Removed (wrong options now 3/336 and 4/268; right options 13/168 and 6/134).

My extra checks (not in the validator; script in the job scratchpad):
- Flesch 60 or more on every stem, hint, feedback line and every option of more than 4 words. Short label options
  ("Moderate.", "About 60%.") score low on the formula, as the existing guided options do; left as they are.
- Feedback 8-30 words and explains why; no feedback repeats its option.
- No "says", "according to", "recommends", "the guide" or "should" in any try. No copy-lint phrases (lost, fail).
- Right option longest: new tries 0 of 60 and 0 of 48. Whole topic (items, hooks, guided and the new tries):
  how-things-work 16/168 = 10%, body-training 33/134 = 25% (was 38% before the tries). Both under 40%.

## 4. Blind check

**Status: done.** This is the blind check for this job; no other run is planned. The files
`content-drafts/tries/blind-check-input.json` (324 rows: 108 tries x 3 rounds, shuffled options only) and
`blind-check-key.json` are kept so anyone can re-run it.

How the check ran: three separate `claude -p` processes, each started in an empty folder holding only a quiz
file. Each process saw only the stems and the options, shuffled in its own order, and never saw the teach cards,
hints, feedback or this repo. Each answered all 108 tries once, so each try was answered 3 times.

| Round | Tries | Answers right | how-things-work | body-training | 3 of 3 | 2 of 3 | 1 of 3 | 0 of 3 |
|---|---|---|---|---|---|---|---|---|
| 1 (first draft) | 108 | 316/324 = 98% | 154/162 = 95% | 162/162 = 100% | 101 | 6 | 1 | 0 |
| 2 (after rewrites) | 108 | 310/324 = 96% | 157/162 = 97% | 153/162 = 94% | 97 | 8 | 3 | 0 |

Below 3/3 in round 2: lift-s1.twist (1), food-labels-s2.transfer (1), food-labels-s3.transfer (1),
food-labels-s2.twist (2), muscle-protein-rest-s2.twist (2), battery-flight-time-s3.transfer (2),
flight-sensors-s2.twist (2), progressive-overload-s1.twist (2), progressive-overload-s3.twist (2),
lift-s2.transfer (2), multirotor-turns-s3.twist (2).

How to read this: the blind checker is a general model that already knows school physics, sports science and
food-label rules. A share this high means "a well-read adult can answer it without the card", not "a learner
can". So this check cannot show whether the card is needed for an 18-25 learner. Spec 23's tester rule
(3 of 5 people right without the card) still has to be run with people.

### Tries rewritten (right 3 of 3 in round 1 and the right option a give-away)

Rule applied: right 3/3 AND the right option was the longest, the only hedged one, or the only kind-sounding one.
The fix shortens the right option, lengthens a wrong option with a tempting reason, removes the hedge (or moves a
hedge onto a wrong option), or adds a wrong option that sounds just as kind. The last column is round 2.

| Try | Round 1 | Why | Right option before | Right option after | Round 2 |
|---|---|---|---|---|---|
| `lift-s3.twist` | 3/3 | right option was the longest | It climbs, with about four times the lift it needs. | It climbs, with four times the lift. | 3/3 |
| `multirotor-turns-s1.twist` | 3/3 | right option was the longest | It climbs, since its push now beats its weight. | It climbs, as push now beats weight. | 3/3 |
| `battery-flight-time-s3.transfer` | 3/3 | right option was the longest | No: the cost comes from weight, which has not changed. | No, its weight is unchanged. | 2/3 |
| `flight-sensors-s2.transfer` | 3/3 | right option was the longest | Tall walls get in the way of the signals from space. | The walls block and bounce the signals. | 3/3 |
| `birds-and-planes-s3.twist` | 1/3 | right option was the longest | A big burst going down, then almost none going up. | A big burst going down, then almost none going up. | 3/3 |
| `upi-path-s2.twist` | 3/3 | right option was the longest | From her bank account into the tailor's bank account. | Bank account to bank account. | 3/3 |
| `upi-path-s3.transfer` | 3/3 | right option was the longest | None of it; each parent approves on their phone. | Nothing; the parents approve. | 3/3 |
| `sky-colours-s2.transfer` | 3/3 | right option was the longest | Big cloud drops scatter every colour; air scatters mostly blue. | Big drops scatter all colours; air, mostly blue. | 3/3 |
| `sky-colours-s3.transfer` | 3/3 | right option was the longest | Low down, its light crosses far more air, losing blue. | Its low light crosses more air. | 3/3 |
| `pressure-cooker-s1.transfer` | 3/3 | right option was the longest | Shimla's lower air pressure lets water boil cooler. | Lower air pressure up there. | 3/3 |
| `pressure-cooker-s2.twist` | 3/3 | right option was the longest | It falls back toward 100°C, so food cooks slower. | It drops back toward 100°C. | 3/3 |
| `pressure-cooker-s2.transfer` | 3/3 | right option was the longest | Its water boils hotter, near 121°C, so chana softens sooner. | Its water boils near 121°C. | 3/3 |
| `pressure-cooker-s3.twist` | 3/3 | right option was the longest | No, each release lets steam out, so it holds steady. | No, it holds steady. | 3/3 |
| `pressure-cooker-s3.transfer` | 3/3 | right option was the longest; right option was the only hedged one | Froth may have blocked the vent, so steam cannot escape. | That froth has blocked the vent. | 3/3 |
| `progressive-overload-s1.twist` | 3/3 | right option was the longest | Just for the cousin, who is not used to that much. | Just for the cousin. | 2/3 |
| `progressive-overload-s2.twist` | 3/3 | right option was the longest | His usual sets now feel easy, with good form. | His usual sets feel easy. | 3/3 |
| `progressive-overload-s3.twist` | 3/3 | right option was the longest | Big, since her recent amount is close to zero. | Big, next to almost nothing. | 2/3 |
| `muscle-protein-rest-s1.transfer` | 3/3 | right option was the longest | It is not used to build muscle without training. | It is not used for muscle. | 3/3 |
| `muscle-protein-rest-s2.twist` | 3/3 | right option was the longest | Above the basic need, below where gains stopped. | Above the need, below the cap. | 2/3 |
| `muscle-protein-rest-s3.twist` | 3/3 | right option was the only hedged one | His rise tends to be smaller. | His rise is smaller. | 3/3 |
| `muscle-protein-rest-s3.transfer` | 3/3 | right option was the longest; right option was the only hedged one | Muscle building may still be raised from Saturday. | Building is still switched on. | 3/3 |
| `sleep-recovery-s2.twist` | 3/3 | right option was the longest; right option was the only hedged one | Yes, even one short night tended to lower play. | Yes, even one night lowered play. | 3/3 |
| `sleep-recovery-s3.transfer` | 3/3 | right option was the longest | Too little sleep has tipped his hunger signals up. | Short sleep shifts hunger hormones. | 3/3 |
| `warmup-myths-s1.twist` | 3/3 | right option was the longest | A few minutes of easy jogging, then walking. | Easy jogging, then walking. | 3/3 |
| `warmup-myths-s3.twist` | 3/3 | right option was the longest | It can stay inside a warm-up that ends with active moves. | Keep it, followed by active moves. | 3/3 |
| `cardio-talk-test-s3.transfer` | 3/3 | right option was the longest | Dance at a pace she can talk through, adding time later. | A pace she can talk through. | 3/3 |
| `showing-up-s1.twist` | 3/3 | right option was the only kind-sounding one; a kind-sounding wrong option added | Yes, some movement beats sitting. | Yes, some movement beats sitting. | 3/3 |
| `showing-up-s3.twist` | 3/3 | right option was the longest | Shrink the daily step so restarts are easy. | A smaller daily step. | 3/3 |
| `showing-up-s3.transfer` | 3/3 | right option was the only kind-sounding one; a kind-sounding wrong option added | It carries on if he writes again the next night. | It carries on if he writes again the next night. | 3/3 |
| `food-labels-s1.transfer` | 3/3 | right option was the longest | Pack B, since every gram of its sugar was added. | Pack B, with 8 g added. | 3/3 |
| `food-labels-s2.twist` | 3/3 | right option was the longest | No, a serving-suggestion picture is left out. | No, serving suggestions are left out. | 2/3 |

Notes:
- `birds-and-planes-s3.twist` was 1/3 in round 1 and was not on the list. It became 3/3 in round 2 because one
  wrong option was shortened by the absolute-word fix, which left the right option longest by one character.
  After round 2 I lengthened a wrong option ("A big burst going up, since raising the heavy wings is hard.").
  Its round 2 score is for the wording before that change.
- `showing-up-s1.twist` and `showing-up-s3.transfer`: the right text stayed; a wrong option was replaced by a
  kind-sounding misconception ("Yes, but just if it lasts 10 minutes or more.", "It carries on, as long as he
  makes up the missed night.").
- The rest of the 3/3 tries do not have a give-away right option, so I left them as they are (the rule asks for
  both). They are still answerable from general knowledge; see the note above.

## 5. Where a fair new situation was hard (for editors)

I did not leave any step without tries, but these need an editor's eye:
- **Pressure cooker s2, s3 transfers** stay in a kitchen (a Kolkata street vendor; a hostel mess). The idea is
  bound to cooking, so the "different life area" is a different setting (work, not home cooking). s1 transfer
  moved to a Shimla school lab.
- **Multirotor, battery, birds** transfers stay with drones or birds, as the claims are about them. The life area
  changes (farming, a wedding, flood relief, a wildlife survey, a railway platform, a school robotics club). The two
  exceptions apply the idea outside drones: `multirotor-turns-s3.transfer` (a swivel chair and a bicycle wheel) and
  `lift-s2.transfer` (a ceiling fan pulling less on its rod). Editors may judge both as going a step past the card.
- **Phone camera s2 transfer** (an art-class mosaic of the filter grid) is a near repeat of the 48-million estimate
  item in a new setting. No better situation found that stays inside the card.
- **Sky colours s2 transfer** sits close to the guided try (clouds white); it adds the comparison with the blue sky
  seen from a plane.

## 6. Other notes for editors

- **Numbers not in the step's claims.** Several tries use worked numbers. Derived from claims: lift (half the speed
  gives a quarter), battery (half the weight needs a bit over a third), protein (80 kg x 1.6 = 128 g; 1 g per kilo),
  stretching ("about four times" = 4.6 / 1.1), %RDA (40% of 50 g = 20 g; 10 g x 3 = 60%). Example label numbers,
  like the guided tries already use: food-labels s1 (14 g / 8 g; 10 g / 8 g), clock times in sleep-recovery s1 and
  s2, the 40 and 200 minutes in progressive-overload s3 (both taken from its teach card), and 150 minutes in s3 twist.
- **Beyond the card, small inferences.** lift-s1.twist (a tailwind on landing) and multirotor-turns-s2.twist (a
  tilted drone sinks if total push stays the same) are inferences from the claim, not lines in the source.
  ceiling-fans-s1.twist (a fan cannot chill a cold drink below room heat) likewise.
- **Health copy.** Body-training tries make no outcome promises. Heat tries repeat the claim's own steps (stop,
  cool, sip; get medical help after vomiting). `sleep-recovery-s1.transfer` (a farmer at harvest) only says short
  nights cut into repair time.
- **Same-situation rule.** I counted each claim's tests by situation (hook, Show me, guided, items, tries). No
  claim has more than 3 tests in one situation by my count. Editors may still see two tries as close to an existing
  item: `pressure-cooker-s2.transfer` (vendor, pressure raises the boil) and item 11; `heat-hydration-s1.transfer`
  (heatwave site work) and item 10.
- **"says" in existing items.** Some existing items use "Isha says". The tries avoid it.
