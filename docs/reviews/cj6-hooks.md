# cj6 · Check the 43 hook rewrites

Job 2 of batch 6 (idea engine, 24 Oct 2026). Branch `ideas/cj6-hooks`, based on origin/main `92da451`.
This is a review for editors. No app code and no content JSON were changed.

Inputs read:

- Draft: `content-drafts/hook-rewrites-2026-10-24.md` on `origin/ideas/spec-21-useful-now`
- Concepts: `content/topics/topic.*.json` on `origin/content-walk` (`eb4d352`), all 6 files
- Checklist: §4 of `docs/reviews/cj4-packaging.md` on `origin/ideas/cj4-packaging`
- Checks: `src/data/packs/validate.ts` and `schemas.ts` on origin/main; also `src/ui/screens/Learn.tsx`,
  `src/ui/learn/flow.ts` and `src/core/learn/steps.ts`, to see when a hook's promise is paid off

---

## 1. Short answer

- **The count is 43.** The 6 packs hold 54 concepts. The draft has one row for each of the 43 whose
  current hook is a statement. The other 11 already end in a question: all 8 History concepts,
  plus `ceiling-fans`, `inflation` and `progressive-overload`. All 43 "current hook" cells match
  the pack text exactly.
- **All 43 pass the validator limits.** Length runs from 49 to 98 characters (limit 280). Flesch
  runs from 75.5 to 115.1 (limit 60). None contains a banned word, an advice phrase or an
  absolute ("every", "always" and so on).
- **Verdicts: keep 20, fix 16, replace 7.** The main problems:
  - the answer is obvious, so the guess is not fair either way (rule 3)
  - the wording does not match the claim
  - the lesson never teaches the point the hook asks about: #3 (heart rate in heat), and
    #12 (short bouts), which comes up only in feedback
  - #30 uses a planned bill to test an emergency fund
- **There is a bigger problem than the wording (§4).** The app teaches one step a day. The topic
  card shows an idea's hook from day 1. So a hook that sets up a step-2 or step-3 claim is not
  answered until day 2 or 3. That is the "find out tomorrow" case that rule 1 forbids.
  - Before my fixes: 27 of the 43 draft hooks are answered on day 2 or 3, and 3 are never answered
    by a teach card.
  - After my fixes: 29 are still answered on day 2 or 3.
  - The app also chooses the card's idea by mastery, not by the next lesson. So the card can show
    one idea while the next lesson teaches another.
  - Fixing this means an app change or a placement rule. That is a product choice for Jenil.

---

## 2. How the checks were run

**Length and Flesch.** I used a scratch script (not committed). It takes `fleschReadingEase()`
word for word from origin/main `src/data/packs/validate.ts`, with only the type annotations
removed, and runs it. The repo's formula:

- words = matches of `/[A-Za-z]+(?:'[A-Za-z]+)?/g`
- sentences = number of `[.!?]+` runs (at least 1)
- syllables per word: lower-case the word, strip one final `es` (not after `l`), `ed` or `e`, count
  vowel groups `[aeiouy]+`, and count at least 1
- score = 206.835 − 1.015 × words/sentences − 84.6 × syllables/words
- the validator rejects a hook below 59.5 (60 with a 0.5 tolerance)

Length is the JavaScript `string.length` that `v.maxLength(280)` checks. `content-walk` has the
same `fleschReadingEase()` as main.

**Curly apostrophes.** Six draft hooks use curly apostrophes or quotes (#8, #17, #20, #25, #29,
#42). The repo's regex reads `other’s` as two words, `other` and `s`. With straight apostrophes,
the scores change by 5 points at most (#17: 108.6 → 103.5). None comes near 60. My fixes below use
straight `'`.

**Banned words and advice.** I ran the repo's own `banned` and `advicePattern` regexes on every
draft and fixed hook, plus a rule 5 check for every / anyone / always / fix / hack / secret.
Nothing matched.

**Claim fit.** For each hook I read:

- the claim it names
- every step's teach card, hook, Show me and takeaway
- where needed, the items and misconceptions

**Fair guess.** Rule 3 rests on Kang et al. (2009). I opened the paper
(https://www.cmu.edu/dietrich/sds/docs/loewenstein/WickCandleLearning.pdf):

> "Reported curiosity was indeed an inverted-U-shaped function of P, reaching its maximum when P
> was around .50"

A hook is a fair guess when a learner without the lesson could reasonably pick either answer.
A hook "leans" when its wording points to the answer. It fails when nearly everyone would get it
right.

---

## 3. Verdict per hook

Key to the columns:

- **Chars / F:** the draft hook's length and Flesch score
- **Day:** the lesson day that pays off the hook under the daily path (step 1 = day 1). "—" means
  no teach card teaches it.
- **Fair:** whether the guess is fair either way
- **Rules failed:** numbers from the cj4 §4 checklist

### Body and training (`topic.body-training.json`)

| # | Concept | Draft hook | Chars / F | Claim fit | Day | Fair | Rules failed | Verdict |
|---:|---|---|---|---|---|---|---|---|
| 1 | muscle-protein-rest | After a hostel gym day, does the muscle work end when you stop? | 63 / 96.0 | c3 is taught in s3, but "the muscle work" is vague: it could mean the effort, not muscle building | 3 | Yes | 4 (loose) | **Fix** |
| 2 | sleep-recovery | A late night or a dawn alarm before a match: which costs the game more? | 71 / 95.7 | c3 and s2 match ("waking far too early hurt more than going to bed late") | 2 | Yes, two-way | — | **Keep** |
| 3 | heat-hydration | On an Ahmedabad run, does a hot noon make the heart work harder than a cool dawn at the same pace? | 98 / 84.8 | c4 (heart rate) is in no teach card; s1 says only "the same run is harder" | — | No, nearly everyone says yes | 1, 3, 4 | **Replace** |
| 4 | warmup-myths | At a college race, can a long, still stretch slow the next sprint? | 66 / 102.5 | c3 and s2 match | 2 | Yes | 6/10 in spirit: `hookSourceRefs` is `guide` only, but c3 cites `review` | **Keep**, and set `hookSourceRefs` to `["guide","review"]` (as the draft's note says) |
| 5 | cardio-talk-test | On a run to class, can speech tell if your pace is brisk or hard? | 65 / 107.0 | c1 matches, but the yes/no "can speech tell" points to yes | 1 | Leans | 3 | **Fix** |
| 6 | showing-up | On an exam day, do a few brisk stairs count if there is no time for a long walk? | 80 / 98.5 | c2 says "a few flights of stairs"; "a few brisk stairs" is not the claim | 1 | Yes | 4 (wording) | **Fix** |
| 7 | food-labels | A mango drink shows a big mango. Is its share of fruit on the back label? | 73 / 98.3 | c5 is a rule ("must usually give its percentage"); the hook asks a lookup question about one pack | 2 | Yes | 4 (loose) | **Fix** |

### Health and nutrition (`topic.health-nutrition.json`)

| # | Concept | Draft hook | Chars / F | Claim fit | Day | Fair | Rules failed | Verdict |
|---:|---|---|---|---|---|---|---|---|
| 8 | protein-foods | At the canteen, can dal and rice fill gaps in each other’s protein? | 67 / 89.9 | c2 and s2 match, but the hook says the answer ("fill gaps in each other's") | 2 | No, it leads to yes | 3 | **Fix** |
| 9 | free-sugars | Does a glass of fruit juice count as free sugar if no sugar was put in? | 71 / 95.4 | c1 and s1 match; a glass of juice is not itself "free sugar", the sugar in it is | 1 | Yes | 4 (precision) | **Fix** |
| 10 | hydration-cues | Does tea at the canteen count as fluid, or only plain water? | 60 / 88.9 | c2 and s1 match | 1 | Yes (many think tea dries you out) | — | **Keep** |
| 11 | sleep-recovery | After an exam, is sleep just a pause, or does it help the brain keep what you learnt? | 85 / 94.6 | c6 and s1 match, but "after an exam" is the wrong moment: the learning was before the exam. "Just a pause" points to the other answer | 1 | Leans | 3, 4 (setting) | **Fix** |
| 12 | exercise-heart | Does a brisk walk to the metro count if you split it into short trips? | 70 / 95.7 | c5 is no step's `claimId`; "short bouts add up" appears only in one s1 guided feedback line and one item. "Split a walk into short trips" is odd wording. It also repeats #6 | — (feedback only) | Yes | 1, 4 | **Replace** |
| 13 | iron-and-anaemia | At lunch, can lemon help your body take in iron from dal? | 57 / 88.9 | c1 and s2 match | 2 | Yes | — | **Keep** |
| 14 | food-label-reading | Two snack packs list a serving. Can you use those figures to compare them fairly? | 81 / 92.1 | c1 and s1 match, but "list a serving" is unclear: the point is that each brand picks its own serving size | 1 | Yes | 4 (wording) | **Fix** |
| 15 | fad-diet-claims | A juice detox ad claims fast weight loss. Does the loss tend to last? | 69 / 109.1 | c3 and s2 match; it rightly leaves out the 5 kg figure, which is in no claim | 2 | Yes | — | **Keep** |

### How things work (`topic.how-things-work.json`)

| # | Concept | Draft hook | Chars / F | Claim fit | Day | Fair | Rules failed | Verdict |
|---:|---|---|---|---|---|---|---|---|
| 16 | lift | Can a paper glider stay up with no air moving past its wing? | 60 / 89.5 | c1 and s1, but the question contains the answer ("no air moving past" means no lift). It misses c1's real surprise: moving the wing works as well as wind | 1 | No | 3 | **Fix** |
| 17 | multirotor-turns | A drone’s rotors lie flat. Can it turn on the spot and keep the same lift? | 74 / 108.6 | c2 and s3 match | 3 | Yes | — | **Keep** |
| 18 | battery-flight-time | Can a bigger drone battery make a flight shorter? | 49 / 75.5 | c4 and s3 match; "can" stays within "in the simple model" | 3 | Yes | — | **Keep** |
| 19 | flight-sensors | Under a roof, can a drone sense a tilt even when GPS is lost? | 61 / 95.9 | c1 and s1 match | 1 | Yes | — | **Keep** |
| 20 | birds-and-planes | Can a bird’s wing do the jobs that a plane splits between wing and engine? | 74 / 95.4 | c1 and s2 match | 2 | Yes | — | **Keep** |
| 21 | upi-path | Does a UPI ID hold money like a wallet, or point to a bank account? | 67 / 84.5 | c1 and s1 match | 1 | Yes, two-way | — | **Keep** |
| 22 | phone-camera | In a dark college hall, does raising ISO make a phone sensor catch more light? | 78 / 84.5 | c5 and s3 match; "ISO" is explained in s3 | 3 | Yes | — | **Keep** |
| 23 | sky-colours | At sunset in Mumbai, does sunlight cross more air than it does at noon? | 71 / 89.9 | c2 and s3 match | 3 | Yes | — | **Keep** |
| 24 | pressure-cooker | On a hill, can a pressure cooker get water hotter than an open pot? | 67 / 77.8 | c2 is no step's `claimId`, but s1 (hills boil below 100°C) and s2 (cooker near 121°C) together answer it, and an s2 item asks about Himalayan cookers. In the draft's table, set the claim to c1 + c2 | 2 | Yes | — | **Keep** |

### Money and markets (`topic.money-markets.json`)

| # | Concept | Draft hook | Chars / F | Claim fit | Day | Fair | Rules failed | Verdict |
|---:|---|---|---|---|---|---|---|---|
| 25 | compounding | ₹365 grows at a set 5% a year. Does each year’s gain stay the same? | 67 / 115.1 | Numbers from c3; the "each year's gain" point is c1, taught in s1. But the hook never says the interest stays in. With interest paid out, the gain *does* stay the same, so the honest answer is "it depends" | 1 | Yes | 4 (open to two readings) | **Fix** |
| 26 | rule-of-72 | At a set 4% a year, would 72 ÷ 4 give the exact time to double? | 63 / 103.0 | c3, and s1 says "not exact". But it assumes the learner already knows the rule, and "exact" gives away "no" | 1 | No | 3, 4 | **Replace** |
| 27 | risk-return | A coin flip offers more than a sure prize. Does the bigger prize mean a surer result? | 85 / 93.7 | c2 is no step's `claimId`; no step uses a coin flip. A coin flip is unsure by definition, so the answer is plain | — (partly s1/s2) | No | 1, 3 | **Replace** |
| 28 | diversification | A monsoon hits two cricket shops. Can a mix of both still lose at once? | 71 / 103.3 | c2 is about a whole-market fall (s3), but the scene is a shock to one trade, which is c3/s2. "A mix of both" is unclear. "A monsoon hits two" gives away "yes" | 3 | No | 3, 4 | **Replace** |
| 29 | shares | Can a share give a student a vote at a firm’s meeting? | 54 / 96.0 | c4 and s2 match | 2 | Yes | — | **Keep** |
| 30 | emergency-fund | A hostel bill comes due at once. Would gold be as quick to use as cash in a savings account? | 92 / 99.4 | c4 and s3 match on gold, but a hostel bill is a planned bill. s1 teaches that the fund is "only for surprises, not planned bills", and its example pays hostel rent from the budget | 3 | Yes | 4 (contradicts s1) | **Fix** |
| 31 | loan-emi | Can a smaller EMI on a long loan mean more interest paid in all? | 64 / 83.9 | c3 and s3 match | 3 | Yes | — | **Keep** |
| 32 | index-funds | If a fund copies an index, can it still lag behind that index? | 62 / 89.5 | c5 and s3 match | 3 | Yes | — | **Keep** |
| 33 | upi-scams | A UPI prize asks for a PIN to get paid. Does receiving money need one? | 70 / 92.1 | c3 and s1 match, but "a UPI prize asks" is loose (a message asks). cj4 §6.5 decided that for this safety rule "the rule beats the gap". A topic card that leaves "do you need a PIN?" open is the wrong default for a fraud check | 1 | Yes, but should not be a guess | Safety exception (cj4 §6.5) | **Replace** |

### Psychology (`topic.psychology.json`)

| # | Concept | Draft hook | Chars / F | Claim fit | Day | Fair | Rules failed | Verdict |
|---:|---|---|---|---|---|---|---|---|
| 34 | habits | Riya misses one day of a new habit in exam week. Is she back to zero? | 69 / 98.3 | c2 and s3 match | 3 | Yes | — | **Keep** |
| 35 | loss-aversion | In a fair canteen bet, do people treat a loss like a gain of the same size? | 75 / 100.0 | c2 and s1 match, but "a fair canteen bet" never says what the bet is, and "treat … like" is abstract | 1 | Leans | 4 (wording) | **Fix** |
| 36 | anchoring | Can a random first number sway a later guess, even if it has no link to the task? | 81 / 85.2 | c2 and s2 match | 2 | Yes | — | **Keep** |
| 37 | confirmation-bias | In a card test, which card checks a rule best: one that fits it or one that could break it? | 91 / 101.9 | c2 is taught in s3 with crows and a bus, not cards; no step shows the card task. "A card test" means nothing to the learner | 3 | Yes | 1 (scene not in the lesson), 4 | **Fix** |
| 38 | social-proof | If a whole class gives the wrong line length, will some students still agree? | 77 / 95.9 | c1 and s2 match, but the logic breaks: if the "whole class" answers wrong, every student already agrees. Asch had one real person among a wrong group | 2 | Yes | 4 | **Fix** |
| 39 | planning-fallacy | A student plans an exam task. Would a past task or a neat plan give the better time guess? | 90 / 99.2 | c3 and s3 match; "an exam task" is vague | 3 | Yes | 4 (wording) | **Fix** |
| 40 | sleep-memory | After a study session, does sleep help keep new facts more than the same time awake? | 84 / 84.8 | c1 and s2 match. It overlaps #11 if a learner has both topics; the fix to #11 keeps them apart | 2 | Leans | — | **Keep** |
| 41 | variable-rewards | After dull posts, can one good post make the next swipe seem worth it? | 70 / 102.0 | c1 is about *not knowing* when a reward comes; the hook says one good post causes the pull. Almost everyone would answer yes from experience | 2 | No | 3, 4 | **Fix** |
| 42 | if-then-plans | Is ‘revise more’ as clear a start cue as ‘revise after dinner’? | 63 / 81.9 | c3 and s2 match, but the answer is obvious | 2 | No | 3 | **Replace** (aim at c4, also taught in s2) |
| 43 | spotlight-effect | Riya spills chai before class. Will her classmates judge her slip as harshly as she fears? | 90 / 98.3 | c3 and s3 match. Riya is also the name in #34 and in `loss-aversion-s2`; consider renaming | 3 | Leans | — | **Keep** |

---

## 4. Rule 1 and how the app shows hooks

What the code does (origin/main, the same on content-walk):

- `Learn.tsx` shows `nextIdea.hook` on each topic card. `nextIdea` is the first idea that is not
  yet Strong or Mastered.
- A daily drop teaches one new step at a time:
  - `flow.ts`, `makeDrop`: `input.daily && !input.lessonToday ? lesson()`
  - `steps.ts`, `nextStep`: the first untaught step in catalog order
- So an idea's hook is on the card from day 1. On the daily path, step 2 comes on day 2 and step 3
  on day 3. The Practice button can teach the next step sooner, but that is not the default path.

What this means for the draft. The cj4 rule is "the hook's promise is delivered inside the same
lesson", and cj4 calls a lesson "the same 2-minute lesson". In the app, that is one step.

| When the hook is answered | Draft (43) | After my fixes (43) |
|---|---:|---:|
| Day 1, step 1 | 13 (+ #12, but only in feedback) | 14 |
| Day 2, step 2 | 14 | 17 |
| Day 3, step 3 | 13 | 12 |
| No teach card | 2 (#3, #27) | 0 |

Rewording alone cannot fix this. It would force every hook onto the step-1 claim, and many of the
best surprises sit in step 2 or 3. Jenil has three options:

1. **Show the next step's hook on the card.** Each `step.hook.stem` is already a validated guess
   question that its own lesson answers. Keep the idea hook (this draft) for ideas whose steps are
   all taught.
2. **Hide the idea hook until it is answered.** Show it only once the step that answers it is the
   next lesson.
3. **Add an editorial rule.** The idea hook must set up a step-1 claim, and the validator checks
   it, for example through a `hookStepId` field. Then the 29 day-2/3 hooks need new step-1 text.

Option 1 needs no new copy and closes the gap on the same day.

**App issue found (not fixed).** `src/ui/screens/Learn.tsx`, the `nextIdea` line (mastery-based)
does not match `src/core/learn/steps.ts` `nextStep` (taught-step-based). Once all 3 steps of
idea 1 are taught but it is not yet Strong, the card still shows idea 1's hook while the daily
lesson moves on to idea 2, step 1. So the card can promise something the next lesson does not
teach. I found this by reading the code and did not run the app to confirm it.

---

## 5. Exact text for every fix and replace

Every line below was measured with the repo's `fleschReadingEase()` and `.length`. Every one passes
the repo's banned, advice and rule 5 checks. Numbers appear only where the concept's claims already
have them.

| # | Verdict | New hook | Chars | Flesch | Claim, step (day) | Other change needed |
|---:|---|---|---:|---:|---|---|
| 1 | Fix | After a hostel gym session, does muscle building stop when you leave, or carry on? | 82 | 78.8 | c3, s3 (3) | — |
| 3 | Replace | In an Ahmedabad summer, how much sweat can an hour of hard play take: a cup or up to a litre? | 93 | 84.8 | c3 "sweat may reach 1 litre an hour", s2 (2) | Claim column: c3 |
| 5 | Fix | Hurrying to class, you can talk but not sing. Is that moderate effort or vigorous? | 82 | 80.8 | c1, s1 (1) | — |
| 6 | Fix | No time for a long walk on exam day. Do a few brisk flights of stairs still count? | 82 | 108.4 | c2, s1 (1) | — |
| 7 | Fix | A mango drink shows a big mango on the front. Must the pack say how much mango is inside? | 89 | 94.8 | c5, s2 (2) | — |
| 8 | Fix | In a canteen thali, does the rice help the dal's protein, or does dal do all the work? | 86 | 89.9 | c2, s2 (2) | — |
| 9 | Fix | If no sugar was added, does the sugar in fruit juice still count as free sugar? | 79 | 90.1 | c1, s1 (1) | — |
| 11 | Fix | After a day of classes, is sleep only rest, or does it also help you keep what you learnt? | 90 | 89.6 | c6, s1 (1) | — |
| 12 | Replace | Does a brisk walk to the metro count as exercise for the heart, or only a gym session? | 86 | 80.5 | c2, s1 (1) | Claim column: c2. Its ref `who-pa-facts` is already in `hookSourceRefs` |
| 14 | Fix | Two snack packs give sugar per serving. Is that a fair way to compare them? | 75 | 97.7 | c1, s1 (1) | — |
| 16 | Fix | On a day with no wind, can a thrown paper glider still get lift? | 64 | 95.9 | c1 "it does not matter whether the wing or the air is moving", s1 (1) | — |
| 25 | Fix | ₹365 is saved at a set 5% a year, with the interest left in. Does each year's gain stay the same? | 97 | 103.7 | c1 + c3 numbers, s1 (1) | Claim column: c1 |
| 26 | Replace | At a set 4% a year, does money take about 18 years to double, or longer? | 72 | 89.9 | c3 "about 18 years", s1 example (1) | — |
| 27 | Replace | Over many years, has the safest kind of saving earned the most, or the least? | 77 | 84.5 | c3 "Cash savings are the safest … but earn the least", s2 (2) | Claim column: c3 |
| 28 | Replace | You own shares in twelve cement firms. Is your money spread out, or is it one bet? | 82 | 103.7 | c3 "at least a dozen, across many industries", s2 (2) | Claim column: c3 |
| 30 | Fix | Your laptop breaks before exams. Is gold as quick to use as money in a savings account? | 87 | 83.7 | c4, s3 (3); the laptop matches s1's example | — |
| 33 | Replace | Getting money on UPI never needs your PIN. Can you spot the 'enter PIN to get paid' trick? | 90 | 89.6 | c3, s1 (1) | The rule comes first on purpose (cj4 §6.5). The trick is named, not hidden, so rule 2 holds |
| 35 | Fix | A friend offers a fair 50-50 toss: win or lose the same amount. Do most people take it? | 87 | 103.7 | c2 "turn down a fair 50-50 chance", s1 (1) | — |
| 37 | Fix | To test 'the college bus is late each day', should you count late days or look for an on-time one? | 98 | 96.9 | c2, s3 (3); the bus matches s3's example | No clock time, so rule 6 holds |
| 38 | Fix | Everyone before Tanya calls the shorter line the longest. Do people in her place often go along? | 96 | 73.8 | c1, s2 (2); Tanya is s2's example | — |
| 39 | Fix | Planning a new lab report, which gives the better time guess: past reports or a neat step-by-step plan? | 103 | 85.0 | c3, s3 (3); lab reports are s3's hook | — |
| 41 | Fix | If a reply might or might not be waiting, do people check messages less often, or more? | 87 | 85.1 | c1, s2 (2); messages match s1's example | Does not blame the reader |
| 42 | Replace | A plan to revise 'after dinner' makes that moment easy to spot. Could it make other good moments easier to miss? | 112 | 79.3 | c4 "other cues were more often passed over", taught in s2 ("One catch: other good chances get easier to miss") (2) | Add `plan-study` to `hookSourceRefs` (now `["plan-meta"]`). Claim column: c4 |

---

## 6. Smaller notes for editors

- **Source refs.**
  - Only #4 has no overlap at all between `hookSourceRefs` and the claim's `sourceRefs`.
  - The draft's #42 fix (`plan-study`) is the only other ref change needed.
  - Some hooks have partial overlaps: #9 `who-sugars`, #14 `icmr-label`, #17 `tug`,
    #19 `px4-sensors`, #23 `nasa-light`, #28 `diversify`. These pass the validator and need no change.
- **Indian settings.** No hook says or implies that a study was run in India. The scenes are only
  settings (rule 7).
- **#27 and #28.** The fixes set up claims whose sources are US SEC investor guides
  (investor.gov). The hooks make no India-specific or return promise (rule 8). Keep it that way.
- **Possible validator check.** Rule 3 (a fair guess) cannot be checked by code. A cheap check
  that would catch #8 and #16: flag a hook whose last clause repeats the claim's key phrase.

---

## 7. Sources and gaps

| Source | Status |
|---|---|
| Kang et al. (2009), *The Wick in the Candle of Learning*: https://www.cmu.edu/dietrich/sds/docs/loewenstein/WickCandleLearning.pdf | Opened. PDF text extracted and quoted in §2 |
| St Hilaire, Chan & Ahn (2024), doi 10.3758/s13423-023-02353-8 (the source for rule 4) | **Could not be opened.** Europe PMC returned 503 twice; PubMed asked for cookies; Springer redirected to a login. No verdict above depends on its numbers |
| Repo files listed at the top | Read from git (`git show`) |

The scratch script is in `/tmp/claude-0/-home-user/f9e0373e-95de-5a49-b99b-2324dbe7064d/scratchpad/cj6hooks/` (`measure.mjs`, `lint.mjs`). It is not committed.
