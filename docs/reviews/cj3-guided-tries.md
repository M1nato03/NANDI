# Cloud job 2 (batch 3) · Guided tries that teach

Branch `ideas/cj3-guided-tries`. Base `origin/ship-32` at `dab36b3` (contains `efdcb58`; no content changes after it).
Date: 23 Oct 2026. Everything below is a **PROPOSAL** for the content editors. No content JSON was changed.

## What was asked, and what I did
- Read first: `ideas/cj2-lesson-walk`, finding 8. It said "about 14 of the 24 guided tries I walked can be answered with no lesson at all", and asked for one distractor per try that states the misconception the step fixes.
- Counted the guided tries in `content/topics/*.json` on ship-32: **162 guided tries**. That is 162 steps with exactly 1 try each:
  Psychology 30, Money 30, How things work 30, Health 24, Body 24, History 24. Every try has 3 options.
- Read every try with its step's teach card, takeaway, and the concept's `misconceptions` field.
  Before writing new stems, I also read the step's hook, example and practice items, so that a proposal does not repeat them.
- Judged each try: could a typical 18 to 22 year old Indian student answer it correctly **without the teach card**?
  - **yes**: most would get it right with no lesson, from the stem, weak wrong options, school knowledge or plain maths.
  - **maybe**: some would; it needs a guess, a school fact many have forgotten, or there is a real trap.
  - **no**: the card's idea or number is needed.
  - The hint is not counted. It sits behind "Show hint".
  - This is my judgement from reading, not a measured first-try rate (see "Limits").
- For each **yes**:
  - I named the misconception the step fixes. I used the concept's `misconceptions` id where one fits. Where none fits, the label says "Not listed", with a suggestion to add it.
  - I proposed ONE replacement distractor, with a feedback line in the same voice. The distractor is kept close in length to the other options.
- I wrote a new stem only where the stem tests a detail (a word, a number, a picture, plain maths) or gives the answer away, **and** a new stem would not repeat the step's own hook, example or items.
  - My first draft had 33 new stems. Checked against each step's hook, example and items, 24 of them repeated one of those. Spec 16 wants every question to use the idea in a new way.
  - So I dropped those 24 and proposed a distractor on the old stem instead. The overlap is named in the note under that step.
  - **9 new stems** are left. Each comes with 3 options and a hint. The feedback lines for their options are still to be written.

## Headline
- **118 of 162 guided tries (73%) can be answered without the teach card** (yes). 31 more are maybe. Only 13 truly need the card.
  - This backs cj2 finding 8 (14 of 24, 58%) across the whole bundle. Spec 14 wants 85 to 95% first-try correct *after* the card.
  - Most "yes" tries will sit near 100% and teach little. Watch `guidedFirstTry` in the owner panel after the change.
- **Why they are easy** (my main reason per try, 118 yes):

  | Reason | Tries |
  |---|---|
  | Everyday, school or common knowledge is enough (K) | 46 |
  | The stem or an option gives it away (S) | 33 |
  | The wrong options are weak or absurd (W) | 28 |
  | Plain maths; the idea is not needed (M) | 11 |

  - Examples of each:
    - K: the parked plane makes no lift.
    - S: "Kavi says his friend must feel losses *exactly* twice"; "He did not think about traffic. What is his plan missing?"
    - W: "A glass of cola" as a protein source; "Kings bathed there each morning".
    - M: 40 ÷ 50 for the sugar can; 45 × 0.
- **By topic.**
  - Psychology is the easiest: 26 of 30. In 15 of those 26, the stem or an option gives the answer away.
  - Money: 24 of 30.
  - How things work has the most real traps: 8 maybe and 4 no.
  - History has the most detail tries: picture boxes, a city name, a number of years. Most of these are maybe, because the guess is a coin flip.
- **The common fix:** make one wrong option the misconception the card corrects.
  - 111 tries get a replacement distractor. 7 more "yes" tries get a new stem instead, since their stem was the problem. 2 non-yes detail tries also get new stems. That makes 9 new stems.
- **18 misconceptions** used in the proposals are not in their concept's `misconceptions` field. Each is marked "Not listed" in the tables. Adding them would let the editors track them.
  - Examples: "a 25% price rise cuts what money buys by 25%"; "adults need a full 8 hours"; "too late to report a scam after a month".

## Checks run on the proposals (measured)
- **The repo's own validator.**
  - I applied all 111 distractors (with their feedback) and all 9 new stems (with their hints and placeholder feedback) to *copies* of the 6 topic packs in `/tmp`.
  - Then I ran `validateAll()` from `scripts/validate-packs.ts`, which has the editorial rules on: spec 16 R1 to R7, Flesch, banned words, advice, absolute-word balance, and right answer longest ≤ 40%.
  - Result: **`Packs valid.`, 0 errors.** Baseline ship-32 is also valid.
- **What the first draft broke, and how it was fixed.**
  - A new Body stem reused the number 20 from practice item `progressive-overload-13` (R2).
  - Body's right answer was the longest option in 41% of questions (limit 40%).
  - In Psychology, Money, Health and History, absolute words (always, only, every, nothing…) sat mostly in wrong options (R5).
  - I reworded until all of these passed. So no proposal adds "always/only/every/nothing" to a wrong option.
- **Copy lint** (`scripts/copy-lint.ts` words: fail, lost, addiction, you should…): 0 hits in the 258 proposed texts. One first-draft distractor used "lost" and one used "failed"; both were reworded.
- **Option order is not a clue.** In the JSON the right option is always `a` (162 of 162). `StepLesson.tsx:6-8` shuffles options with a stable seed, so position gives nothing away on screen.
- **Option length.**
  - By word count, the right option is uniquely the longest in 35 of 162 tries (measured on ship-32). That is below chance, so length is not the clue either.
  - Each proposed distractor is at most 4 words longer than its longest sibling; the script checks this.
- **Existing absolute words.** At least one current wrong option contains an absolute word (every, always, never, no one, nothing, none, all, any, full, just, only) in 29 of 162 tries. These are the easiest options to reject.

## How to use this
- Each row is a self-contained proposal: "Replace c (old text) with **new text**", plus a feedback line.
- Keep the right option and the stem as they are, unless a new stem is listed under the topic.
- Several proposals give two options the same first word (for example two "Om…" or two "No…" options). That is on purpose: the learner has to read the reason, not the first word. Each such case has a note.
- New stems need their hint (given) and feedback lines (to write). The validator run used placeholder feedback for them.
- `cj2 #15` (the cricket side bet in `loss-aversion-s1` reads like match-betting) still applies. It is a stem-setting change, so I did not rewrite it here.

## Limits
- No real learners. The verdicts are one reader's judgement for an 18 to 22 year old who finished Class 12 in India. Treat "yes / maybe / no" as an estimate.
  - The 85 to 95% target can only be checked with `guidedFirstTry` data.
- I did not fact-check the existing content; batch 3 job 3 does that.
  - New feedback lines only restate the step's own teach card, claims or existing feedback.
  - Two need a source check before use: `emergency-fund-s1` (penalty to break a fixed deposit) and `upi-scams-s3` (reporting later can still help).
- The validator run proves the proposals pass the machine rules. It does not prove they read well on a 360 px screen.

## Summary per topic

| Topic | Guided tries | Yes (answerable without the card) | Maybe | No | Yes because: stem/option gives it (S) · weak wrong options (W) · prior knowledge (K) · plain maths (M) | Distractor proposals | New stems proposed | Misconceptions to add to the field |
|---|---|---|---|---|---|---|---|---|
| Psychology | 30 | 26 (87%) | 4 | 0 | S 15 · W 5 · K 6 · M 0 | 24 | 3 | 1 |
| Money | 30 | 24 (80%) | 6 | 0 | S 8 · W 4 · K 9 · M 3 | 22 | 2 | 2 |
| Health | 24 | 16 (67%) | 4 | 4 | S 3 · W 3 · K 6 · M 4 | 15 | 1 | 7 |
| Body | 24 | 19 (79%) | 2 | 3 | S 4 · W 6 · K 7 · M 2 | 18 | 1 | 2 |
| History | 24 | 15 (62%) | 7 | 2 | S 2 · W 7 · K 4 · M 2 | 14 | 2 | 3 |
| How things work | 30 | 18 (60%) | 8 | 4 | S 1 · W 3 · K 14 · M 0 | 18 | 0 | 3 |
| **All** | **162** | **118 (73%)** | **31** | **13** | **S 33 · W 28 · K 46 · M 11** | **111** | **9** | **18** |

_Measured on the packs: right option uniquely longest in 35 of 162 guided tries; at least one distractor uses an absolute word (every, always, never, no one, nothing, none, all, any, full, just, only) in 29 of 162._

## Psychology (30 guided tries: 26 yes, 4 maybe, 0 no)

All items are **PROPOSALS** for the content editors. "Replace c" means: swap option c (a wrong option) for the new text.

| Step | Guided try (stem · right answer) | Without the card? | Why | Misconception the step fixes | Proposed distractor | Its feedback |
|---|---|---|---|---|---|---|
| `habits-s1` | Ravi studies well at the library desk, but not at home. What might be missing at home? · _The desk cue._ | **yes (S)** | Stem says he studies well only at the library; "wish" and "books" are ruled out by the stem itself. | habits-m3 Goal replaces cue | Replace c ("His books.") with **"A firmer study goal for home."** | A goal helps, but a habit is set off by a cue. The desk is the cue home lacks. |
| `habits-s2` | Asha's rope routine now starts without effort. She wants a new stretching habit. Should she expect that one to begin fully automatic? · _No, it needs its own early repeats._ | **yes (K)** | Common sense says a new act starts from scratch; both "yes" options sound like wishful thinking. | habits-m4 Every repeat adds the same | Replace c ("Yes, once she has one habit, new ones start easy.") with **"No, but each week will add the same ease."** | Early repeats add the most; later weeks add less and less. |
| `habits-s3` | Kiran has meditated daily for three weeks, but it still takes effort. What does this show? · _It can take a couple of months._ | **yes (W)** | The kind answer is clear by tone; "doing it wrong" and "not going to form" read as harsh. | habits-m1 One fixed day count (the 21-day myth) | Replace c ("This habit is not going to form.") with **"The usual 21 days are up, so it will not form."** | There is no fixed 21 days. In one study the middle time was about two months. |
| `loss-aversion-s1` | Before a friendly cricket match, Anjali's captain offers a side bet on a coin toss: win 5 bonus runs or lose 5 runs. Will she likely take it? · _Probably not; a loss of 5 weighs more._ | **yes (K)** | Most people feel they would turn down a 50/50 bet; option a even states the reason. | loss-aversion-m1 Equal feel | Replace c ("Yes, as gains count for more.") with **"Yes, winning 5 and losing 5 feel the same."** | On paper they are equal, but in choices a loss usually counts for more. |
| `loss-aversion-s2` | One canteen says “Pay ₹5 extra by card.” Another says “Get ₹5 off with cash.” The prices end up the same. What differs? · _Just the start point in the wording._ | **yes (S)** | The stem says the prices end up the same, which rules out b; c (food) is off topic. | loss-aversion-m3 Wording never matters | Replace c ("The food on the menu.") with **"No real difference; the price matches."** | The cost matches, but one reads as a loss and one as a gain. The start point differs. |
| `loss-aversion-s3` | Kavi says his friend must feel losses exactly twice as much as gains. What is wrong? · _Twice is an average; people differ._ | **yes (S)** | "Exactly" and "must" in the stem flag the error; b and c have no support in the stem. | loss-aversion-m2 Always true | Replace c ("It should be three times.") with **"He is right; studies say twice."** | Twice is pooled over many studies. One person can be above or below it. |
| `anchoring-s1` | Two shops sell the same shoes for ₹1,500. One tag says “was ₹2,500”; the other shows just ₹1,500. Why might the first feel like the better deal? · _The old price sets a high starting point._ | **yes (S)** | Stem says the shoes and price are the same; the "was ₹2,500" trick is familiar from sale tags. | anchoring-m1 First means fair | Replace b ("Its shoes must be better made.") with **"The old price shows what they are worth."** | The old price is a starting point, not proof of value. Both shops charge ₹1,500. |
| `anchoring-s2` | Before a GK quiz, a screen asks if a tower is taller or shorter than a random 900 metres. Then Tara guesses 800 metres. Why so high? · _The random figure pulled her guess up._ | **yes (S)** | "Why so high?" plus "a random 900" points straight at the anchor. | anchoring-m2 Random has no pull | Replace b ("She knew the real height.") with **"She knew 900 was random, so it had no pull."** | Knowing a number is random does not stop its pull. It still set her start. |
| `anchoring-s3` | Meena listed reasons against an anchor. Her guess moved closer to fair, but not all the way. What does this show? · _It cuts the pull but does not erase it._ | **yes (S)** | The stem already says the guess moved closer but not all the way; it is reading, not the idea. | anchoring-m4 One trick erases it | Replace b ("The trick made no difference.") with **"One more round of reasons will clear it."** | Listing reasons shrinks the pull; it does not erase it. |
| `confirmation-bias-s1` | Sneha thinks her team plays better in white jerseys. She looks up only the wins in white. What is missing? · _The matches in white they did not win._ | **yes (S)** | The stem says she looks up "only the wins"; the missing losses are plain logic. | confirmation-bias-m3 Many fits prove a rule | Replace b ("More wins in white.") with **"Wins in white from more seasons."** | More wins only add to the side she counts. The white-jersey losses could test her idea. |
| `confirmation-bias-s2` | The secret rule is any three rising numbers. Ravi guesses add 2 and tests just 20, 22, 24. Why does he stay wrong? · _His tests fit both, so they cannot tell them apart._ | **maybe** | Needs the student to see 20, 22, 24 fit both rules; "too few numbers" is a real trap. |  |  |  |
| `confirmation-bias-s3` | Dev says phones that cost more always have better cameras. Which phone could prove him wrong? · _A costly phone with a weak camera._ | **maybe** | A logic step many get wrong; "cheap phone, weak camera" is a good trap. |  |  |  |
| `social-proof-s1` | A song has 10 crore views. Before playing it, Bhavna already expects it to be good. Why? · _Many others chose it._ | **yes (S)** | "Before playing it" rules out b; the view count is the only clue in the stem. | social-proof-m3 Crowds sway the weak | Replace c ("She knows the singer well.") with **"She is the type who follows the crowd."** | Anyone can take a crowd's pick as a clue. It is not about her being easily led. |
| `social-proof-s2` | In a music class, everyone calls a note higher than it is. Anu hears it clearly but agrees. Does everyone act like Anu? · _No, some stay with what they hear._ | **yes (W)** | "Everyone" and "no one" are easy to reject; the try tests that people differ, not the pull itself. | social-proof-m1/m2 (people go along with a plainly wrong crowd) | See new stem below |  |
| `social-proof-s3` | In a group project, everyone agrees the answer is 42 without working it out. What does their agreement show? · _Only that they agree._ | **yes (S)** | "Without working it out" in the stem gives the answer. | social-proof-m1 Crowd proves truth | Replace c ("That 42 is wrong.") with **"That 42 is checked, since they agree."** | Agreement is not a check. No one worked it out. |
| `planning-fallacy-s1` | Aman plans to clean his hostel room in 20 minutes. It takes an hour. Why is this common? · _Most people guess short on their own chores._ | **yes (W)** | b is silly and c clashes with "common"; a is the only option that explains "common". | planning-fallacy-m4 Only careless people guess short | Replace b ("Rooms get messier each minute.") with **"He is just bad at planning."** | Careful planners guess short too. Guesses for our own tasks tend to run short. |
| `planning-fallacy-s2` | Harsh plans to reach the station in 15 minutes. He did not think about traffic. What is his plan missing? · _Traffic delays._ | **yes (S)** | The stem names the answer ("He did not think about traffic"). | planning-fallacy-m1 Best case is normal | See new stem below |  |
| `planning-fallacy-s3` | A cricket club’s last two match teas took 2 hours to set up. This time they plan 30 minutes. What would give a better guess? · _The 2 hours it took before._ | **yes (K)** | "Look at what happened before" is everyday sense; b and c are weak. | planning-fallacy-m3 Past delays were one-offs | Replace b ("Hoping it goes faster.") with **"A fresh plan, as last time was bad luck."** | Calling past delays bad luck keeps them out of the plan. The 2 hours is the better guide. |
| `sleep-memory-s1` | Faisal learns ten new Hindi words today. Over the next days the words feel steadier. What is that later step called? · _Consolidation._ | **maybe** | Tests the word "consolidation"; some Class 11-12 biology students know it, most do not. |  | See new stem below |  |
| `sleep-memory-s2` | Sara learns a list of capitals at night, then sleeps. Ali learns it in the morning and stays awake all day. Who may recall more after the same gap? · _Sara._ | **yes (K)** | "Sleep helps memory" is common belief among students. | sleep-memory-m1 Sleep is only a pause | Replace c ("Neither can recall anything.") with **"Both the same."** | Sleep is not only a pause. The sleeping brain helps firm up new memories. |
| `sleep-memory-s3` | Between two exams, Rhea naps for a bit, then rests with her eyes closed. Which can help her new memories? · _Both the nap and the quiet rest._ | **maybe** | "Both" is the inclusive guess, but "just the nap" is a real belief. |  |  |  |
| `variable-rewards-s1` | A teacher gives a gold star after every third homework. Is that a variable reward? · _No, it is fixed._ | **yes (K)** | Plain English: "every third" is fixed, not variable. | Not listed: "a reward that skips some tries is variable" (suggest adding to the misconceptions field) | Replace b ("Yes, stars are variable.") with **"Yes, as it does not come each time."** | Not every time is not the same as variable. You know it comes every third time, so it is fixed. |
| `variable-rewards-s2` | In a cricket card game, rare cards turn up in random packs. Omkar keeps opening packs. Why? · _The next one could be the lucky one._ | **yes (W)** | b contradicts "rare cards in random packs" and c is not in the stem. | variable-rewards-m3 It is just weak will | Replace c ("He has to open every pack.") with **"He just has weak willpower."** | Most people keep trying when a reward could come any time. It is the not knowing, not weak will. |
| `variable-rewards-s3` | Tanmay keeps opening a cricket score app during a match. What is the most likely reason? · _He wants to know who is winning._ | **yes (K)** | Wanting the score is the obvious reason; c is silly. | variable-rewards-m3 It is just weak will (m2 is already option b) | Replace c ("The app forces him.") with **"Weak will; he cannot stop himself."** | It is not about weak will. He wants the latest score, one of many reasons we open apps. |
| `if-then-plans-s1` | Tara’s plan: “If I tie my shoes after school, then I go for a run.” Which part is the action? · _Going for a run._ | **yes (S)** | Reading: the "then" part says "go for a run". | if-then-plans-m1 A wish is a plan | Replace c ("Getting out of school.") with **"Wanting to get fit."** | That is the goal behind it. The then part names the action: the run. |
| `if-then-plans-s2` | Sonal says, “I will drink more water.” Which line turns it into an if-then plan? · _“If I sit down for lunch, then I drink a glass of water.”_ | **yes (S)** | Only option a has the "If ... then" shape the stem asks for. | if-then-plans-m1 A wish is a plan (a vague cue) | Replace c ("“I will try hard.”") with **""If I feel like it, then I drink water.""** | It has an if, but "feel like it" is no clear moment. A cue like lunch is easy to notice. |
| `if-then-plans-s3` | Two cricket teams set a goal to practise catching. One team also adds if-then plans. Which team is likely to practise more? · _The team with if-then plans._ | **yes (S)** | "One team also adds if-then plans" signals the answer. | if-then-plans-m1 A wish is a plan | Replace c ("No difference.") with **"The same; a clear goal is already a plan."** | A goal names no moment. Across 94 tests, adding if-then plans helped on average. |
| `spotlight-effect-s1` | On a train, Ayesha’s phone rings loudly with a funny ringtone. She thinks the whole coach will remember. What is going on? · _She guesses more noticed than really did._ | **yes (S)** | "She thinks the whole coach will remember" signals an overestimate. | spotlight-effect-m2 Nobody ever notices | Replace c ("No one could hear it.") with **"Nobody noticed, so she can forget it."** | Some may notice. The point is she guesses too many will remember. |
| `spotlight-effect-s2` | Mohan drops an easy catch in a friendly match and thinks the whole team will talk about it. What is going on? · _To him it looms larger than to them._ | **yes (W)** | c contradicts the stem; a is the only sensible reading. | spotlight-effect-m4 Only embarrassing moments | Replace c ("He did not really drop it.") with **"Slips stand out to others; good plays do not."** | Others notice slips less than we think, and good moments loom large to us too. |
| `spotlight-effect-s3` | Why might onlookers go easy on someone who flubs a hard quiz question? · _They see how hard the question was._ | **yes (S)** | The stem says "a hard quiz question", which gives option a. | spotlight-effect-m3 Others judge us harshly | Replace c ("They have short memories.") with **"They do not; onlookers judge slips harshly."** | We expect harsh judging, but onlookers were kinder than people expected. |

### Psychology: new stems and notes (PROPOSALS)

- **`habits-s2` note.** Two "No" options: the learner must read past the first word, which is the point.
- **`loss-aversion-s1` note.** cj2 #15 still applies: the cricket side bet reads like match-betting. Swap the setting when this is edited.
- **`anchoring-s2` note.** The new b gives a wrong reason: knowing a number is random does not cancel its pull.
- **`anchoring-s3` note.** Optional: end the stem at "Her guess moved closer to fair." so the learner has to judge "all the way" alone. A first-draft new stem repeated practice item anchoring-16, so this keeps the stem and proposes a distractor instead.
- **`social-proof-s2` new stem.** The current stem tests the side detail (a quarter never gave in), not the idea that a wrong crowd pulls even when the answer is plain.
  - Stem: "In a music class, everyone calls a note higher than it is. Anu hears it clearly but agrees. Why?"
  - Hint: "The note was plain to her. What else could she want?"
  - a (right): "To fit in with the group."
  - b: "The group is usually right, so she switched."
  - c: "She is the weak-willed type."
- **`social-proof-s3` note.** Optional: drop "without working it out" from the stem so the learner has to notice it.
- **`planning-fallacy-s2` new stem.** The current stem tells the learner what was left out.
  - Stem: "Harsh plans 15 minutes to the station: 10 to ride, 5 to park. What is his plan missing?"
  - Hint: "Picture the trip going less than smoothly."
  - a (right): "Time for delays, like traffic or a red light."
  - b: "No gap; 10 plus 5 is 15."
  - c: "A faster bike."
- **`sleep-memory-s1` new stem.** The current stem tests a term, not the idea (learn first; sleep cannot store what was never taken in, sleep-memory-m2). The hook already uses "never opens the book", so this asks for a contrast instead.
  - Stem: "Faisal reads ten new words carefully and skims ten more without taking them in. After a good sleep, which feel steadier?"
  - Hint: "Sleep firms up what was taken in first."
  - a (right): "The ten he read carefully."
  - b: "All twenty, as sleep stores both."
  - c: "The skimmed ten, as they are newer."
- **`if-then-plans-s3` note.** "Cannot promise" is already in the example (Govind) and item if-then-plans-16. A first-draft new stem repeated the example, so this keeps the stem and proposes a distractor instead.

## Money (30 guided tries: 24 yes, 6 maybe, 0 no)

All items are **PROPOSALS** for the content editors. "Replace c" means: swap option c (a wrong option) for the new text.

| Step | Guided try (stem · right answer) | Without the card? | Why | Misconception the step fixes | Proposed distractor | Its feedback |
|---|---|---|---|---|---|---|
| `inflation-s1` | Onions double in price, but most other prices barely move. What happens to inflation? · _It goes up a little._ | **yes (K)** | "Most other prices barely move" makes "a little" the sensible pick; onion news is familiar. | inflation-m1 One price is the index | Replace c ("It falls.") with **"It jumps, as onions matter most."** | Onions matter, but they are one item in a big basket, so the overall rise is small. |
| `inflation-s2` | A ₹100 basket of shopping now costs ₹125. How much of it does ₹100 buy? · _Four fifths of it._ | **yes (M)** | 100 ÷ 125 is Class 8 maths; "the whole basket" and "1.25 baskets" are easy to rule out. | Not listed: "a 25% price rise cuts what money buys by 25%" (near inflation-m2; suggest adding) | Replace c ("One and a quarter baskets.") with **"Three quarters, as prices rose by a quarter."** | Close, but 100 divided by 125 is 0.8, so it buys four fifths, not three quarters. |
| `inflation-s3` | Inflation comes in at 7% this year. Where is that against the RBI's band? · _Above the 6% upper limit._ | **yes (S)** | Option a quotes the 6% limit, so 7% is plainly above it. | inflation-m4 The goal is zero inflation | Replace c ("Below the lower limit.") with **"Inside the band, close to the top."** | The band runs from 2% to 6%. At 7%, inflation is above it. |
| `compounding-s1` | ₹500 grew to ₹550 in year one, with the gain left in. In year two it earns 10% again. How big is the new gain? · _₹55._ | **maybe** | Class 9 simple interest makes ₹50 a real trap, but the stem hints "gain left in". |  |  |  |
| `compounding-s2` | Over 30 years at 5%, which five years add the most rupees? · _The last five years._ | **maybe** | Many know "compounding grows later"; "every span the same" is a real linear trap. |  |  |  |
| `compounding-s3` | Your SIP buys fewer fund units this month than last month, though you paid the same ₹500. Which part stayed fixed? · _The ₹500 and the date._ | **yes (S)** | The stem says "though you paid the same ₹500", which gives option a. | compounding-m2 SIP means sure gain | Replace c ("The return the fund will earn.") with **"The 12% a year that SIPs give."** | No SIP fixes a return. Only the sum and the date stay set; the fund's price moves. |
| `rule-of-72-s1` | At 8% a year, money doubles in about 9 years. About what is ₹5,000 worth after 18 years? · _About ₹20,000._ | **yes (S)** | The stem gives the 9-year doubling, so the rule itself is never used; 18 years = two doublings. | rule-of-72-m1 Exact clock (and straight-line growth) | See new stem below |  |
| `rule-of-72-s2` | Which grows faster: savings at 6% or a debt at 18%? · _The 18% debt._ | **yes (K)** | A higher rate grows faster; no rule needed. | rule-of-72-m3 Debt stays the same size | Replace c ("Both grow the same.") with **"The savings; debt stays put."** | Unpaid interest is added to a debt, so it grows like savings do, only faster here. |
| `rule-of-72-s3` | Which case suits the rule of 72 best? · _A deposit at a fixed 6%._ | **yes (S)** | The word "fixed" in a, against "rose last year" and "changes monthly", gives it away. | rule-of-72-m2 Any market rate is fixed | Replace c ("A fund whose return changes monthly.") with **"An index fund that averaged 12% for ten years."** | An average hides up and down years, so the rule is only a what-if here. |
| `risk-return-s1` | Which of these has the least risk of giving back less than you put in? · _Cash in a bank savings account._ | **yes (K)** | Bank savings as safest is common knowledge. | risk-return-m3 Big names cannot fall | Replace c ("A share a friend says will double.") with **"Shares of a big, famous company."** | Big, famous firms' shares can fall too. Cash savings hold their value best. |
| `risk-return-s2` | Bonds usually swing less than shares. What do they usually give up? · _Some return._ | **yes (W)** | "Swing less" rules out b; "give up no return" is odd; the trade-off is a known idea. | risk-return-m1 High means sure (calm and high returns go together) | Replace c ("They give up no return.") with **"None; calm pays more."** | Calmer things usually earn less. More reward tends to come with bigger swings. |
| `risk-return-s3` | Raj, 22, saves for a goal 30 years away. What does the long wait give him? · _Time to ride out ups and downs._ | **yes (W)** | b and c are absolutes ("promise", "no reason"); a is the sensible middle. | risk-return-m2 No loss is possible | Replace c ("No reason to think about risk.") with **"A sure gain, as markets rise in the long run."** | Time gives room to wait out dips, but losses are still possible. |
| `diversification-s1` | Meera puts ₹10,000 into one firm. Om splits ₹10,000 over five firms. One firm in each mix halves. Who has more left? · _Om, with about ₹9,000 left._ | **yes (K)** | "Eggs in one basket" plus easy maths; b and c are weak. | diversification-m2 Many means no loss | Replace b ("Meera, since one firm is easier to watch.") with **"Om, with his full ₹10,000 safe."** | Om still loses ₹1,000. A spread makes a loss smaller, not zero. |
| `diversification-s2` | Sana holds five tech shares. Riya holds twelve shares in banks, food, power and medicine. Whose mix is closer to a real spread? · _Riya's._ | **yes (K)** | Twelve firms in four industries beats five in one by plain sense. | diversification-m3 Many names means a spread | Replace c ("Both are the same, since both hold shares.") with **"Both, since each holds five or more firms."** | Count is not enough. Five firms in one industry can all fall together. |
| `diversification-s3` | Which trouble can a wide spread protect you from best? · _A fire at one firm's factory._ | **maybe** | Many think a spread guards against a crash too; "one factory fire" needs the idea. |  |  |  |
| `shares-s1` | A firm has 200 shares. Asha owns 20 and Vikram owns 50. Who owns more of the firm? · _Vikram, with a quarter._ | **yes (M)** | Comparing 50 with 20 out of 200 needs no lesson. | shares-m4 Your count alone sets your slice (here: price paid sets it) | Replace c ("Both own the same.") with **"Can't tell without the price each paid."** | Price paid does not set the slice. 50 of 200 shares is a quarter; 20 is a tenth. |
| `shares-s2` | Arjun buys a phone from a firm. Zoya buys one share of the same firm. Who can vote at its general meeting? · _Zoya._ | **yes (K)** | Share = owner, owner = vote is widely known. | shares-m3 Customers are owners | Replace b ("Arjun.") with **"Arjun, who paid more."** | Paying more as a customer buys a phone, not a part of the firm. Only owners vote. |
| `shares-s3` | Last year a firm paid ₹3 a share. This year it made a loss. What can you count on? · _No set payout; it may pay less, or nothing._ | **yes (S)** | "Made a loss" makes "no set payout" the cautious, obvious pick. | shares-m2 Dividend is owed | Replace c ("A bigger payout to make up for the loss.") with **"Some payout; owners are owed a share."** | Nothing is owed. The company decides each year, and may pay nothing. |
| `emergency-fund-s1` | A sudden fever means a clinic bill this week. What helps you pay it without new debt? · _Your emergency fund._ | **yes (S)** | "Sudden" matches "emergency fund"; c contradicts "without new debt". | emergency-fund-m1 Any savings will do | Replace c ("A quick loan from an app.") with **"Your 3-year fixed deposit."** | Breaking a locked deposit can cost a penalty and take time. The fund is kept ready for this. |
| `emergency-fund-s2` | You cannot save three months of costs right now. What is a good first step? · _Start small and add a bit from each pay or stipend._ | **yes (W)** | Starting small is the obvious coach answer; b and c sound like giving up. | emergency-fund-m3 A tiny cushion is enough | Replace c ("Skip it until you earn more.") with **"Save ₹1,000 once, and then stop."** | A start is good, but keep adding until you reach three months of costs. |
| `emergency-fund-s3` | Why keep the fund apart from your everyday account? · _So it does not get used up on daily things._ | **yes (K)** | "So it does not get used up" is common sense. | emergency-fund-m4 Best return beats easy reach | Replace b ("So it earns a much higher rate.") with **"So it can sit in shares and grow faster."** | Shares can be down just when a surprise comes. Keep the fund in savings you can reach fast. |
| `loan-emi-s1` | What does the word 'equated' in EMI tell you? · _Every payment is the same size._ | **yes (S)** | "Equated" looks like "equal"; the hint says to look inside the word. | loan-emi-m1 EMI is all principal | Replace c ("Extra interest is added.") with **"Each payment goes fully to the loan."** | Equated means equal payments. Part of each one pays interest; the rest cuts the loan. |
| `loan-emi-s2` | You owe ₹50,000 at 1% interest a month. What is this month's interest? · _₹500._ | **yes (M)** | 1% of ₹50,000 is plain percent maths. | loan-emi-m3 Interest stays on the first amount | See new stem below |  |
| `loan-emi-s3` | At the same rate, which term gives the least total interest? · _The shortest term._ | **yes (K)** | Longer borrowing costs more interest is common sense. | loan-emi-m2 Small EMI means cheap loan | Replace b ("The longest term.") with **"The longest, as its EMIs are smallest."** | Small EMIs feel cheap, but interest runs for more months, so the total is highest. |
| `index-funds-s1` | A company joins the index. What does the index fund do? · _Adds that company too._ | **maybe** | Needs to know an index fund copies a list; the name helps, the hint gives it away. |  |  |  |
| `index-funds-s2` | Fund X charges 1% a year and Fund Y charges 0.2%. Both follow the same index. Which keeps more of the index's return? · _Fund Y._ | **yes (K)** | Lower fee, more kept: no lesson needed. | index-funds-m4 Someone picks the holdings | Replace c ("Both keep the same.") with **"Fund X, for better picks."** | Both just follow the same index. No one picks, so the extra fee only takes more out. |
| `index-funds-s3` | The market index falls 15%. What happens to an index fund that follows it? · _It falls about 15% too._ | **maybe** | Those who know "it follows the index" get it; "spread means safe" is a real trap. |  |  |  |
| `upi-scams-s1` | You are getting a ₹500 refund. What do you need to type in? · _Nothing, since money coming in needs no PIN._ | **maybe** | Many know from bank warnings; the scam works because many do not. |  |  |  |
| `upi-scams-s2` | A caller asks you to install a screen-sharing app to 'fix' your refund. What is the safe move? · _Refuse and hang up._ | **yes (S)** | "The safe move" plus a stranger installing an app: a is obvious. | upi-scams-m2 Official tone proves safety | Replace c ("Install it if he knows your name.") with **"Install it if he calls from the bank's number."** | A caller's number can be faked, and real bank staff never ask you to install apps. |
| `upi-scams-s3` | Your friend was tricked last month and feels too ashamed to report it. What helps most? · _Report it anyway; scammers do this for a living._ | **yes (W)** | b and c are plainly unhelpful; a is the only constructive option. | Not listed: "too late to report" (suggest adding) | Replace b ("Wait until it happens again.") with **"Leave it; a month is too late to report."** | Sooner is better, but reporting later can still help stop the scammer. |

### Money: new stems and notes (PROPOSALS)

- **`inflation-s3` note.** Also shorten option a to "Above the band." so it no longer states the 6% limit.
- **`compounding-s3` note.** "SIPs give 12%" is a common social-media claim, so this distractor is plausible.
- **`rule-of-72-s1` new stem.** The current stem hands over the doubling time, so the try never asks for 72 ÷ rate. 9% avoids the hook's 6%.
  - Stem: "At 9% a year, about how long until ₹5,000 becomes ₹10,000?"
  - Hint: "Divide 72 by the rate."
  - a (right): "About 8 years."
  - b: "About 11 years, since 100 ÷ 9 is 11."
  - c: "8 years to the day; the rule is precise."
- **`diversification-s1` note.** Two "Om" options: the right one has the right amount.
- **`diversification-s2` note.** Optional: give Sana 15 tech shares, so "more names" points the wrong way.
- **`shares-s1` note.** The dilution half of the card is already practice item shares-10. A first-draft new stem repeated shares-10, so this keeps the stem and proposes a distractor instead.
- **`loan-emi-s1` note.** The stem tests a word, not the two parts of an EMI, but the example (Sunil) and item loan-emi-11 already do that sum. A first-draft new stem repeated the example, so this keeps the stem and proposes a distractor instead.
- **`loan-emi-s2` new stem.** The current stem is a percent sum; it never asks "on what amount?", which is the idea.
  - Stem: "You borrowed ₹50,000 at 1% a month and have paid it down to ₹30,000. What is this month's interest?"
  - Hint: "Work out 1% of what is still owed."
  - a (right): "₹300."
  - b: "₹500, on the first amount."
  - c: "₹30."

## Health (24 guided tries: 16 yes, 4 maybe, 4 no)

All items are **PROPOSALS** for the content editors. "Replace c" means: swap option c (a wrong option) for the new text.

| Step | Guided try (stem · right answer) | Without the card? | Why | Misconception the step fixes | Proposed distractor | Its feedback |
|---|---|---|---|---|---|---|
| `protein-foods-s1` | Sahil eats no meat and wants more protein at dinner. Which add-on fits best? · _A bowl of chana._ | **yes (W)** | Chana against ghee and cola: everyone knows which is the protein (cj2 #8). | protein-foods-m1 Plant foods lack protein | Replace c ("A glass of cola.") with **"None; he needs eggs or meat for protein."** | Pulses like chana are rich plant protein. Meat is not the only source. |
| `protein-foods-s2` | Which of these dishes pairs a cereal with a pulse? · _Khichdi of rice and moong dal._ | **yes (K)** | Spotting rice + moong dal as cereal + pulse is general knowledge. | Not listed: "any protein food is the cereal's pulse partner" (near m2) | Replace c ("Bread with jam.") with **"Rice with paneer curry."** | Paneer is a milk food, not a pulse. Rice with moong dal is the cereal and pulse pair. |
| `protein-foods-s3` | Ankit weighs 80 kg and is healthy. About what is his daily protein need? · _About 66 g._ | **no** | Needs the 0.83 g figure; gym lore of "1 g per kg" makes 80 g a strong trap. |  |  |  |
| `free-sugars-s1` | Jaggery is stirred into a sweet. Does its sugar count as free sugar? · _Yes, it was added._ | **no** | Jaggery is widely seen as the healthy sugar; "No, jaggery is natural" will catch many. |  |  |  |
| `free-sugars-s2` | Why is there a limit on free sugars at all? · _It is linked to tooth decay._ | **yes (K)** | Sugar and tooth decay is common knowledge; b and c are odd. | free-sugars-m4 The limit is a target | Replace c ("Sugar stops the body using protein.") with **"So people eat enough sugar for energy."** | The limit is a ceiling, not a goal. Less is even better. |
| `free-sugars-s3` | One can holds up to 40 g of free sugar. What share of a 50 g limit is that? · _About 80%._ | **yes (M)** | 40 ÷ 50 is plain maths; the idea that drinks hide sugar is in the example, not the try. | free-sugars-m3 Skipping sweets means little sugar | Replace c ("About 8%.") with **"Little; it is a drink."** | Drink sugar counts. 40 out of 50 is 80% of the limit. |
| `hydration-cues-s1` | A friend says her cup of milk must be ignored when she checks her daily fluid. How would you correct her? · _Milk counts towards her fluid, like water._ | **yes (S)** | "How would you correct her?" tells the learner she is wrong, ruling out b. | hydration-cues-m1 Only plain water counts | Replace c ("Milk counts when it is served cold.") with **"Milk is a food, so it does not count as fluid."** | Milk is mostly water. Like water and lower-sugar tea, it adds to the day's fluid. |
| `hydration-cues-s2` | Which of these is a cue that the body is short of fluid? · _A dry mouth._ | **yes (K)** | Dry mouth as a thirst sign is everyday knowledge. | Not listed: "sweating means you are short of water" (suggest adding) | Replace c ("Peeing more often than usual.") with **"Sweating a lot during the day."** | Sweat is how water leaves, not a sign you are short. Thirst, a dry mouth and dark pee are. |
| `hydration-cues-s3` | Two friends rest indoors, then one walks three hours in the sun. Who likely needs more fluid? · _The walker._ | **yes (K)** | Three hours in the sun needs more water: no lesson needed. | hydration-cues-m2 Eight glasses fits everyone | Replace c ("Both need the same amount.") with **"Both; eight glasses covers anyone."** | Eight glasses is a rough guide. Heat and long activity raise the need. |
| `sleep-recovery-s1` | Lights out at 11 pm, alarm at 6 am. Does that reach the adult need? · _Yes, about 7 hours._ | **yes (M)** | Counting 11 to 6 is clock maths, and "7 or more" is widely known. | Not listed: "adults need a full 8 hours" (suggest adding) | Replace c ("No, adults need 10 or more.") with **"No, adults need a full 8 hours."** | Adults need 7 or more hours, and 11 pm to 6 am gives 7. |
| `sleep-recovery-s2` | In which part of the night is deep sleep longest? · _The first half._ | **no** | When deep sleep peaks is not common knowledge. |  |  |  |
| `sleep-recovery-s3` | Coffee at 4 pm can still be acting at about what time? · _Around midnight._ | **maybe** | Some know caffeine lasts hours; "around 6 pm" is a fair trap. |  |  |  |
| `exercise-heart-s1` | Kunal walks briskly for 20 minutes every day. Where does his week land? · _Just under 150 minutes._ | **yes (M)** | 20 × 7 = 140, and options a and b give away the 150 to 300 band. | exercise-heart-m1 Only hard sprints count | Replace c ("About 20 minutes in all.") with **"Nowhere; a walk is not real exercise."** | A brisk walk counts. 20 minutes a day adds up to 140 a week. |
| `exercise-heart-s2` | Which of these is a moderate effort for most people? · _A friendly game of badminton._ | **yes (S)** | "Friendly" against "running" and "fast" gives it away. | Not listed: "if you can still sing, it is moderate" (the talk test itself) | Replace c ("Skipping rope fast.") with **"A brisk walk where you can still sing."** | If you can sing, the effort is light. Moderate lets you talk but not sing. |
| `exercise-heart-s3` | Rahul jogs 25 minutes, three times a week. How does that compare with 150 moderate minutes? · _It matches it._ | **no** | Needs "vigorous counts double"; without it, "half" is the natural answer. |  |  |  |
| `iron-and-anaemia-s1` | If there is less haemoglobin in the blood, how much oxygen gets to the body? · _Less of it arrives._ | **yes (K)** | Haemoglobin carries oxygen is Class 10 biology; the hint repeats it. | Not listed: "the body makes up for less haemoglobin" (suggest adding) | Replace c ("It stays the same.") with **"The same; faster breathing makes up for it."** | Breathing harder cannot add carriers, so less oxygen gets moved. |
| `iron-and-anaemia-s2` | Which side helps the body take in iron from a bowl of rajma? · _Orange slices._ | **maybe** | Vitamin C helping iron is half-known; tea holding iron back is not, and chai with meals is common. |  |  |  |
| `iron-and-anaemia-s3` | Two friends both have anaemia. Will the cause be the same? · _Not always; causes differ._ | **yes (W)** | "Malaria for both" is absurd, so "not always" wins by elimination. | iron-and-anaemia-m2 All anaemia is low iron | Replace c ("Yes, it is malaria for both.") with **"Most likely; anaemia means low iron."** | Low iron is the top food cause, but B12, malaria, heavy periods and thalassaemia cause it too. |
| `food-label-reading-s1` | Why is a per-serving number hard to compare across brands? · _Each brand sets its own serving._ | **yes (S)** | The stem already says per-serving is hard to compare; only the reason is asked. | food-label-reading-m4 Per serving means per pack | Replace c ("The numbers are printed too small.") with **"Each pack is one serving, and packs differ."** | A pack often holds several servings. The trouble is each brand picks its own serving size. |
| `food-label-reading-s2` | A chips pack lists potato, oil, salt. Which is there least of? · _Salt._ | **yes (K)** | Salt is the smallest part of chips by everyday sense, whatever the list order. | food-label-reading-m2 First ingredient is smallest (and m3 front claims) | See new stem below |  |
| `food-label-reading-s3` | A 'sugar free' cookie lists maltitol near the top. What does that tell you? · _It still has a sweetener._ | **maybe** | Few know maltitol is a sweetener, but "sugar free still sweet" is half-known. |  |  |  |
| `fad-diet-claims-s1` | About how much of a day's plate should be vegetables and fruit? · _About half._ | **yes (W)** | "Tenth" and "garnish" are weak, so "half" wins; it tests a number, not the idea. | Not listed: "cereals should fill most of the plate" (suggest adding) | Replace c ("Just a garnish on top.") with **"About a quarter; cereals fill half."** | Vegetables, fruits, greens and tubers make up about half the plate. |
| `fad-diet-claims-s2` | Why does the scale drop at first on a juice-only plan? · _She eats very little._ | **maybe** | "Toxins leave the body" is a common belief; a is the sensible pick for others. |  |  |  |
| `fad-diet-claims-s3` | At half a kilo a week, about how long would 5 kg take? · _About 10 weeks._ | **yes (M)** | 5 ÷ 0.5 is plain maths; the red-flag idea is in the hook, example and items. | Not listed: maths slip "dividing by a half halves it" | Replace c ("About 50 weeks.") with **"About 2.5 weeks."** | That halves 5. Dividing 5 by 0.5 gives 10 weeks. |

### Health: new stems and notes (PROPOSALS)

- **`protein-foods-s2` note.** A first-draft new stem repeated the hook (dal and rice), so this keeps the stem and proposes a distractor instead.
- **`free-sugars-s3` note.** A first-draft new stem repeated the example (Dev and the cola), so this keeps the stem and proposes a distractor instead.
- **`hydration-cues-s1` note.** Optional: ask "Is she right?" instead of "How would you correct her?" so the stem does not give it away.
- **`sleep-recovery-s1` note.** The stem tests clock maths more than what sleep does; fine as a warm-up, weak as teaching.
- **`iron-and-anaemia-s1` note.** "Women need more iron" is already item iron-and-anaemia-10. A first-draft new stem repeated iron-and-anaemia-10, so this keeps the stem and proposes a distractor instead.
- **`food-label-reading-s1` note.** A first-draft new stem repeated the hook (two biscuit packs), so this keeps the stem and proposes a distractor instead.
- **`food-label-reading-s2` new stem.** The current stem can be answered from kitchen sense, so list order is never used. Same mechanic as the hook, but the name pulls the other way (m3), which the hook does not test.
  - Stem: "A "multigrain" biscuit lists: refined wheat flour, sugar, oil, oats, ragi. What is it mostly?"
  - Hint: "The list runs from most to least."
  - a (right): "Refined wheat flour."
  - b: "Oats and ragi, as the name says."
  - c: "Ragi, the last one listed."
- **`fad-diet-claims-s1` note.** The idea ("no one food does it all") is in the hook, the example and item fad-diet-claims-10. A first-draft new stem repeated the hook and the example, so this keeps the stem and proposes a distractor instead.
- **`fad-diet-claims-s3` note.** A first-draft new stem repeated the hook (an ad promising fast loss), so this keeps the stem and proposes a distractor instead.

## Body (24 guided tries: 19 yes, 2 maybe, 3 no)

All items are **PROPOSALS** for the content editors. "Replace c" means: swap option c (a wrong option) for the new text.

| Step | Guided try (stem · right answer) | Without the card? | Why | Misconception the step fixes | Proposed distractor | Its feedback |
|---|---|---|---|---|---|---|
| `progressive-overload-s1` | Kunal has done the same 12 squats every day for three months, and he has stopped getting stronger. Why? · _His legs caught up, and nothing new is asked of them._ | **yes (K)** | Gym lore ("plateau, add more") is common; b and c sound wrong (cj2 #8). | progressive-overload-m3 Strength work needs weights | Replace c ("He needs a few months of full rest to grow.") with **"Bodyweight squats can do no more; he needs a gym."** | Body weight can still be the load. He needs a bit more than usual: more reps, slower, or one leg. |
| `progressive-overload-s2` | Sana can do 12 clean lunges. Which change grows the work? · _Hold a water bottle in each hand._ | **yes (W)** | Half depth and fewer reps are plainly less work. | progressive-overload-m3 Strength work needs weights | Replace c ("Do 6 lunges instead, but much faster.") with **"Wait until she can buy dumbbells."** | She can grow the work now with bottles, extra clean reps or one more day. |
| `progressive-overload-s3` | Ravi runs 50 minutes a week. Which next week is the smallest jump for him? · _55 minutes._ | **yes (S)** | "Smallest jump" = smallest number; the relative-jump idea is never used. | progressive-overload-m2 Bigger jumps work faster (size is relative to your usual) | See new stem below |  |
| `muscle-protein-rest-s1` | Kiran drinks a protein shake daily but never trains. What is he missing? · _The training signal._ | **yes (S)** | "Never trains" in the stem gives the answer. | Not listed: "protein alone builds muscle" (near m1; suggest adding) | Replace c ("More rest days, so the shake can work.") with **"No gap; protein by itself builds muscle."** | Without strength work the body does not use protein for muscle. Training gives the signal. |
| `muscle-protein-rest-s2` | Meena weighs 70 kg and trains. Above about what daily amount does extra protein stop adding muscle? · _About 112 g._ | **no** | Needs the 1.6 g figure; the hint and option b (58 g) help only with the card. |  |  |  |
| `muscle-protein-rest-s3` | Rhea trained her legs hard on Monday. Is Tuesday a good day for another hard leg session? · _Better to rest them while the building goes on._ | **yes (K)** | "Rest day for the same muscle" is common gym lore. | muscle-protein-rest-m2 More protein, more muscle | Replace b ("Yes, sore legs grow faster with more work.") with **"Yes, if she eats extra protein to recover."** | Extra protein does not speed it up. Building goes on for up to two days, so rest or train arms. |
| `sleep-recovery-s1` | Rhea sleeps from 1 am to 7 am before a match. Is she in the adult range? · _No, that is one short of 7._ | **yes (M)** | Clock maths; option a even states "one short of 7". | sleep-recovery-m2 Any amount of sleep is enough | Replace b ("Yes, that is close enough to count.") with **"Yes, 6 hours is fine for young people."** | Adults, young ones included, are advised 7 to 9 hours. 6 falls short. |
| `sleep-recovery-s2` | Which short-sleep pattern hurt sport most in the review? · _Waking up much earlier than usual._ | **no** | Most would pick "a whole night with no sleep"; the review finding is not known. |  |  |  |
| `sleep-recovery-s3` | Leptin helps you feel full. What happens to it after short sleep? · _It goes down._ | **maybe** | Some know short sleep makes you hungry; the hint gives the direction. |  |  |  |
| `heat-hydration-s1` | Practice is fixed at 4 pm in May. What can still be changed? · _Start slower and build up over the session._ | **yes (K)** | Starting slow in May heat is sensible to most. | heat-hydration-m1 Heat is a bonus workout | Replace b ("Little, since the time cannot move.") with **"Push harder; heat builds toughness."** | Heat adds strain, not a bonus. Start slow and build up. |
| `heat-hydration-s2` | Which plan fits a 2-hour hot match? · _Sips at every break, and a salty snack after._ | **yes (K)** | Sipping at breaks is common sense; no water is plainly unsafe. | heat-hydration-m2 Gulp it all at the end (force down big amounts) | Replace c ("No water, so you stay light and quick.") with **"Force down a litre at each break."** | Do not force big amounts. Sip at breaks, and replace salt with food. |
| `heat-hydration-s3` | A teammate seems confused on a hot field. What comes first? · _Call an ambulance and move them somewhere cool._ | **maybe** | Most would call for help, but "give cold water" is the natural instinct. |  |  |  |
| `warmup-myths-s1` | Which is a warm-up for push-ups? · _A few push-ups against a wall._ | **yes (W)** | No stretching option is offered, so the common myth is never tested. | warmup-myths-m2 A warm-up means stretching | Replace b ("Ten minutes lying on the floor.") with **"Holding a long chest stretch for a minute."** | A warm-up is mainly the move done easier. Wall push-ups raise heart rate and breathing bit by bit. |
| `warmup-myths-s2` | Rahul holds each stretch for 45 seconds. Which group is that? · _Under 60 seconds, the smaller drop._ | **yes (S)** | 45 is under 60, and the options state the 60-second line. | warmup-myths-m1 One stretch fixes all (here: short holds cost nothing) | Replace c ("Too short to count as a stretch.") with **"Under 60 seconds, so it has no effect."** | Short holds cost much less, but holds under 60 seconds still cut results by about 1.1% on average. |
| `warmup-myths-s3` | What does stretching most clearly give, by the review? · _A short-term gain in how far you can move._ | **yes (W)** | "Full protection" and "much more power" are overclaims, so a wins. | Not listed: "stretching prevents injury" (the step's own myth; suggest adding) | Replace b ("Full protection from injury in sport.") with **"Fewer injuries in sport."** | The review found no clear drop in injuries. Range gains are what showed clearly. |
| `cardio-talk-test-s1` | During sprints, Leela can only say 'wait' and 'go'. Which effort is it? · _Vigorous._ | **yes (S)** | "During sprints" gives the answer. | cardio-talk-test-m2 Talking means too easy (any talk = moderate) | Replace b ("Moderate.") with **"Moderate, as she talks."** | A word or two before a breath is vigorous. Moderate lets you hold a chat. |
| `cardio-talk-test-s2` | Pooja rates a brisk walk a 6. Which effort band is that? · _Moderate._ | **yes (K)** | A brisk walk at 6 of 10 is "moderate" by plain sense. | cardio-talk-test-m1 One speed fits all | Replace c ("Rest.") with **"Light, for anyone."** | The scale is your own. If Pooja rates it a 6, it is moderate for her. |
| `cardio-talk-test-s3` | Om starts jogging and gets a sharp pain in his knee. What should he do? · _Stop and rest it, and see a doctor if it stays._ | **yes (K)** | Stopping for sharp pain is obvious. | cardio-talk-test-m3 Start hard to catch up | Replace c ("Speed up to finish the session sooner.") with **"Rest today, then do double tomorrow."** | A big jump raises injury risk. Rest, then go back at a moderate effort. |
| `showing-up-s1` | On a packed day, which of these adds to Arav's weekly total? · _Three 5-minute brisk walks._ | **yes (W)** | Planning and sitting are plainly not movement. | showing-up-m2 Short bouts do not count | Replace c ("Sitting through a 3-hour lecture.") with **"None; bouts under 10 minutes do not count."** | The 10-minute minimum was dropped. Brisk bouts of any length count. |
| `showing-up-s2` | Sana keeps forgetting her stretches. Which cue would help most? · _Right after she brushes her teeth at night._ | **yes (K)** | A daily routine cue is the obvious pick. | habits-m3 Goal replaces cue (from Psychology; not in this concept's list) | Replace c ("On days she feels full of energy.") with **"A goal: flexible by June."** | A goal is good, but it names no moment. A daily cue like brushing does the reminding. |
| `showing-up-s3` | Dev missed three days of his habit during a fever. What is the best restart? · _His usual short walk, at the usual cue._ | **yes (W)** | b and c sound like overreactions; a is the gentle answer. | showing-up-m3 One miss ruins a habit | Replace c ("Waiting until next month to start fresh.") with **"Start a fresh 21-day count from zero."** | Gains pick up again when he goes back. There is no count to restart. |
| `food-labels-s1` | A pack shows 12 g total sugars and 5 g added sugars. How much sugar was already in the food? · _7 g._ | **yes (M)** | "Total" includes "added" by plain English; 12 - 5 is easy. | food-labels-m2 No added sugar means no sugar (total = added) | Replace b ("17 g.") with **"None; total is added."** | Total sugars count the food's own sugar too. 12 minus 5 leaves 7 g. |
| `food-labels-s2` | A kesar badam milk shows almonds on the front. Where do you check how much almond it holds? · _The almond % on the back._ | **yes (W)** | A picture's size and a brand name plainly do not give amounts. | food-labels-m1 A picture shows the amount (and front claims) | Replace c ("The brand name on the cap.") with **"The "loaded with almonds" line on the front."** | Front words sell. The % on the label gives the real share. |
| `food-labels-s3` | A serving has 5 g added sugar. What %RDA should the label show? · _10%._ | **no** | Needs the 50 g reference; "5%" is a natural trap. |  |  |  |

### Body: new stems and notes (PROPOSALS)

- **`progressive-overload-s3` new stem.** "Smallest jump" lets the learner pick the smallest number. Asking for a gentle step makes the reason in b (minutes, not share) the trap. Keeps the current numbers, so it does not repeat the hook (40 vs 200).
  - Stem: "Ravi runs 50 minutes a week. Which next week is a gentle step for him?"
  - Hint: "Work out each rise as a share of 50."
  - a (right): "55 minutes."
  - b: "65 minutes; 15 extra is small for anyone."
  - c: "75 minutes."
- **`sleep-recovery-s1` note.** Applies to the body-training copy of sleep-recovery (the health topic has its own step of the same id).
- **`warmup-myths-s2` note.** Two "under 60" options: the right one says "smaller drop", the new one says "no effect".
- **`food-labels-s1` note.** A first-draft new stem repeated the hook and item food-labels-9, so this keeps the stem and proposes a distractor instead.

## History (24 guided tries: 15 yes, 7 maybe, 2 no)

All items are **PROPOSALS** for the content editors. "Replace c" means: swap option c (a wrong option) for the new text.

| Step | Guided try (stem · right answer) | Without the card? | Why | Misconception the step fixes | Proposed distractor | Its feedback |
|---|---|---|---|---|---|---|
| `indus-cities-s1` | In which part of Mohenjo-daro do the right-angle streets lie? · _The lower town._ | **no** | Tests where the grid lies, a detail the hint links to a mound the card never names (cj2 #9). |  | See new stem below |  |
| `indus-cities-s2` | Diggers clear a narrow back lane in Mohenjo-daro but have not reached its drain yet. What should they expect to find? · _A drain, since every street and lane had one._ | **yes (S)** | Option a states the fact ("every street and lane had one"); Indus drains are school history. | indus-cities-m4 Old drains were open ditches | Replace c ("A well, since lanes held water, not drains.") with **"An open ditch, since old drains had no covers."** | Most drains here were baked brick with covers on top, not open ditches. |
| `indus-cities-s3` | The Great Bath has steps at each end. What can we say for sure? · _People could walk down into the pool._ | **yes (S)** | "For sure" rules out the two guesses (cj2 #8). | indus-cities-m1 A bath proves a palace (or a known use) | Replace b ("Kings bathed there each morning.") with **"It was used for holy bathing rites."** | That is a common guess, but no text we can read says so. The steps only show people could go in. |
| `ashoka-edicts-s1` | Why put a stone message beside a travelled route instead of inside a palace? · _So passers-by could see it._ | **yes (W)** | "So only the king could read it" contradicts a roadside stone (cj2 #8). | ashoka-edicts-m1 Edicts stayed at court (placed only at a few spots) | Replace c ("Because stone was cheaper beside roads.") with **"To mark the borders of his empire."** | They stood near towns and routes across the empire, not just at the edges, so many people passed them. |
| `ashoka-edicts-s2` | An edict is found in Afghanistan. Which scripts could it use? · _Greek or Aramaic._ | **no** | School history ties Ashoka to Brahmi; Greek and Aramaic in Afghanistan is new to most. |  |  |  |
| `ashoka-edicts-s3` | Few people could read the edicts. Who else carried dhamma's message out? · _Special officers sent by Ashoka._ | **yes (W)** | "Special officers sent by Ashoka" sounds official; b and c are odd. | ashoka-edicts-m2 Every subject read the text | Replace c ("Schools that taught each edict.") with **"No one; the stones alone were enough."** | Most people could not read, so stones alone could not reach them. Officers spread the message. |
| `silk-road-ideas-s1` | In the example, in which order did the cloth travel? · _Sea, then river, then mountain passes._ | **maybe** | Refers to "the example", so it tests recall; "sea first" is guessable from "lands". |  |  |  |
| `silk-road-ideas-s2` | Trade through Gandhara slows sharply for years. What would you expect for new Buddhist art? · _Less money to make it._ | **yes (K)** | Less trade, less money is plain logic; b is silly. | Not listed: "art was paid by faith, not trade" (near m3; suggest adding) | Replace b ("More art than ever before, to cheer people up.") with **"About the same; monks made art for faith."** | Faith gave the reason, but trade wealth paid the carvers. Less trade, less to spend. |
| `silk-road-ideas-s3` | Why were Buddhist centres built at desert oases? · _Traders rested there on their way._ | **yes (W)** | The hint and a match ("rest"); b and c are plainly wrong. | Not listed: "monks built far from people" (near m3; suggest adding) | Replace b ("Oases were empty and far from any visitors.") with **"Monks wanted to be far from people."** | Many centres stood where traders stopped, so people and ideas passed through. |
| `indian-place-value-s1` | The Babylonians used place value for over 1,000 years with no zero sign. What trouble would they meet? · _Some numbers would look alike._ | **yes (W)** | b and c are absurd for a counting people; a wins by elimination. | indian-place-value-m2 Placeholder and number are the same story (what a placeholder does) | Replace b ("They could not count past ten.") with **"They could not write any large numbers."** | They wrote big numbers with place value. The trouble was telling 61 from 601. |
| `indian-place-value-s2` | Using Brahmagupta's rule, what is 45 times 0? · _0._ | **yes (M)** | 45 × 0 is primary-school maths. | indian-place-value-m2 Placeholder and number are the same story (zero is not a number) | Replace c ("450.") with **"No answer, since zero is not a number."** | Brahmagupta treated zero as a number, so 45 times 0 is 0. |
| `indian-place-value-s3` | Fibonacci called 0 a sign, not a number. What does that show? · _Europe was slow to treat zero as a number._ | **yes (W)** | b contradicts "brought to Europe"; c is odd. Tests Fibonacci's view, a detail. | indian-place-value-m3 Our digits began in Arabia | Replace c ("Europe dropped zero soon after.") with **"Europe got zero late, from Arabia, where it began."** | Zero did reach Europe late, but through Arabic books from India, where it began. |
| `printing-and-reading-s1` | A printer must make 20 different pages. Which choice needs the least carving? · _One set of movable type, reset for each page._ | **yes (W)** | Option c is impossible and b plainly needs more carving. | printing-and-reading-m3 Movable type replaced blocks everywhere | Replace c ("One woodblock for all 20 pages.") with **"Woodblocks, as China kept using them."** | Blocks stayed common in China for other reasons, like the many characters. For 20 pages, reset type needs least carving. |
| `printing-and-reading-s2` | Where was Jikji printed? · _Cheongju, Korea._ | **maybe** | Pure recall of a city name; "Jikji" may sound Korean to some. |  |  |  |
| `printing-and-reading-s3` | A town gets 50 printed books, but few people there can read. What changes at once? · _Only the readers gain right away._ | **yes (W)** | "By the next morning" and "nobody" are absurd (cj2 #8). | printing-and-reading-m2 One press made everyone literate | Replace b ("Everyone in the town can read by the next morning.") with **"More people can read, now that books exist."** | Books help readers, but they do not teach reading. Learning takes teaching and time. |
| `mughal-revenue-s1` | Besides a court rank, what else did a mansab bring? · _A duty to keep horsemen._ | **maybe** | Some recall "mansabdari = army ranks" from school; the hint ("the army") gives it away. |  |  |  |
| `mughal-revenue-s2` | Some nobles were paid in cash. Which group was larger? · _Those paid through jagirs._ | **maybe** | A coin flip without the picture; "most" is guessable. |  |  |  |
| `mughal-revenue-s3` | How many years did Todar Mal's survey cover? · _Ten._ | **maybe** | Recall of a number; "ten" is the middle guess and the hint says "decade". |  |  |  |
| `company-trade-rule-s1` | What did the charter stop? · _Other English companies trading with the East._ | **maybe** | Some know the English monopoly; "Dutch and Portuguese ships" is a fair trap. |  |  |  |
| `company-trade-rule-s2` | After the diwani, what paid for the Company's cloth buying in India? · _Revenue collected in India._ | **yes (K)** | The "drain of wealth" story is school history; the hint says "new money". | company-trade-rule-m2 Diwani was a trade licence | Replace c ("Loans from France.") with **"Profits from its new trade licence."** | The diwani was the right to collect Bengal's tax, not a trade licence. That tax paid for the cloth. |
| `company-trade-rule-s3` | What new title did the Governor-General get in 1858? · _Viceroy._ | **yes (K)** | "Viceroy" is well known from school; the hint defines it. | Not listed: "the Company kept ruling after 1858" (near m1) | Replace c ("Nawab.") with **"Chairman of the East India Company."** | In 1858 the Company's powers moved to the Crown, so the new title, Viceroy, stood for the Crown. |
| `independence-constitution-s1` | How were most Assembly members chosen? · _By members of the provincial assemblies._ | **maybe** | Some recall indirect election from Class 11 polity; many would guess "direct vote". |  |  |  |
| `independence-constitution-s2` | Of 7,635 changes put forward, 2,473 were debated and decided. About what share is that? · _About a third._ | **yes (M)** | 2,473 of 7,635 is a rounding sum. | independence-constitution-m1/m3 One author; passed unchanged | See new stem below |  |
| `independence-constitution-s3` | Why was 26 January picked as the day the Constitution came into force? · _Congress had asked people to mark it since 1929._ | **yes (K)** | 26 January as Purna Swaraj Day is school knowledge. | independence-constitution-m2 Adoption and start were the same day (m2 is already c) | Replace b ("It was the day the Assembly first met.") with **"It was the day India won independence."** | Independence came on 15 August 1947. The January date came from Congress's call of 1929. |

### History: new stems and notes (PROPOSALS)

- **`indus-cities-s1` new stem.** Tests a place detail instead of the idea (a grid shows a plan; indus-cities-m3). cj2 #9 suggested this reverse case; the straight case is already the hook and item indus-cities-9.
  - Stem: "A dig finds a town with winding lanes and odd corners. What does that suggest?"
  - Hint: "A neat grid does not happen by chance. What about the opposite?"
  - a (right): "It likely grew bit by bit, without one plan."
  - b: "It was planned, like Mohenjo-daro."
  - c: "It must be newer than Mohenjo-daro."
- **`ashoka-edicts-s3` note.** The step title is "What dhamma asked", but the hook and item ashoka-edicts-15 already test that. A first-draft new stem repeated the hook, so this keeps the stem and proposes a distractor instead.
- **`silk-road-ideas-s1` note.** Recall of the example. The hook ("one long road?") and items 9-10 already cover the idea, so a fresh stem would repeat them. Lowest-cost fix: drop "In the example," so it reads as a new trip.
- **`indian-place-value-s2` note.** A first-draft new stem repeated item indian-place-value-14 (the two jobs of zero), so this keeps the stem and proposes a distractor instead.
- **`indian-place-value-s3` note.** A first-draft new stem repeated the hook ("Why both names?"), so this keeps the stem and proposes a distractor instead.
- **`printing-and-reading-s1` note.** A first-draft new stem repeated item printing-and-reading-10, so this keeps the stem and proposes a distractor instead.
- **`printing-and-reading-s2` note.** Detail recall ("Where was Jikji printed?"). The idea (metal type in Asia first) is already items 12 and 14, so a new stem would repeat them. Consider an edge case instead, e.g. Jikji is not the first metal-type book, only the oldest that survives.
- **`mughal-revenue-s2` note.** Detail (which box in the picture is bigger). The idea (revenue, not land) is item mughal-revenue-13, so a new stem would repeat it. Consider asking why holders being moved shows a jagir was not owned.
- **`mughal-revenue-s3` note.** Detail (how many years). "Where zabt fails" is item mughal-revenue-15. Consider asking why ten years of records beat one good year.
- **`company-trade-rule-s3` note.** A first-draft new stem repeated the hook (word for word), so this keeps the stem and proposes a distractor instead.
- **`independence-constitution-s2` new stem.** The current stem is a share sum; the idea (draft, then debate and changes) is untested.
  - Stem: "A friend says Dr Ambedkar alone wrote the Constitution and it passed as drafted. What is closer to the truth?"
  - Hint: "Recall the thousands of proposals."
  - a (right): "His team drafted it; the Assembly debated and changed it."
  - b: "That is right; the draft passed unchanged."
  - c: "Britain wrote it, and the Assembly signed."
- **`independence-constitution-s2` note.** Close to the hook ("Was that the final text?"), but it adds the two named misconceptions (m1 one author, m4 Britain wrote it), which the hook does not test.

## How things work (30 guided tries: 18 yes, 8 maybe, 4 no)

All items are **PROPOSALS** for the content editors. "Replace c" means: swap option c (a wrong option) for the new text.

| Step | Guided try (stem · right answer) | Without the card? | Why | Misconception the step fixes | Proposed distractor | Its feedback |
|---|---|---|---|---|---|---|
| `lift-s1` | A plane sits parked in calm air with its engines off. How much lift do its wings make? · _None, or almost none._ | **yes (K)** | A parked plane makes no lift is everyday sense (cj2). | lift-m1 Shape alone lifts | Replace c ("About half of its weight.") with **"Some; the curved wing shape makes lift."** | Shape alone does nothing in still air. Lift needs air moving past. |
| `lift-s2` | A wing is set to turn air upward instead of down. Which way does the force on the wing point? · _Downward._ | **maybe** | Class 9 action-reaction gets it; "wings always lift" pulls toward b. |  |  |  |
| `lift-s3` | A plane flies at three times its slowest speed. How much more lift can its wings make, all else equal? · _Nine times._ | **no** | Needs "speed times speed"; "three times" is the natural guess. |  |  |  |
| `multirotor-turns-s1` | All four rotors slow down by the same amount. What does a hovering drone do? · _It sinks, still level._ | **yes (K)** | Less push, it sinks: plain intuition. | multirotor-turns-m1 Hovering takes no push | Replace c ("It spins slowly in place.") with **"It hovers on; a hover needs little push."** | A hover needs push equal to the weight. Less push than weight means it sinks. |
| `multirotor-turns-s2` | A drone needs to roll to its right. Which rotors should push harder? · _The left rotors._ | **maybe** | Spatial reasoning; many will say "the right rotors". |  |  |  |
| `multirotor-turns-s3` | All four rotors on a test drone spin the same way. What happens to its body? · _It keeps turning the opposite way._ | **maybe** | Reaction twist is counter-intuitive; "four twists balance" is a real trap. |  |  |  |
| `battery-flight-time-s1` | A team wants its drone to fly twice as long. Which plan works? · _Double the energy, or halve the power._ | **yes (K)** | Bigger battery or less use is intuitive; b and c are plainly worse. | battery-flight-time-m4 More power means longer flight | Replace c ("Halve the energy and double the power.") with **"Fit stronger motors that use more power."** | More power spends the battery faster, so the flight gets shorter. |
| `battery-flight-time-s2` | A drone's weight doubles, then doubles again. About how much more hover power does it need in all? · _About 8 times._ | **no** | Needs the "nearly 3 times" figure from the card. |  |  |  |
| `battery-flight-time-s3` | A drone weighs 3 kg in all, and 1 kg of that is battery. Is it past the peak? · _No, it is still below the peak._ | **no** | Needs the two-thirds peak from the card. |  |  |  |
| `flight-sensors-s1` | A drone speeds up from rest. Which sensor feels the change in its motion? · _The accelerometer._ | **yes (K)** | "Accelerometer" names acceleration; Class 9 physics. | flight-sensors-m1 GPS senses all turns | Replace c ("The GPS.") with **"The GPS, as it tracks each move."** | GPS gives position. The on-board accelerometer feels a speed change at once. |
| `flight-sensors-s2` | A drone flies between tall buildings. What happens to its GPS fix? · _It gets less accurate._ | **yes (K)** | Maps go wrong between tall buildings: common experience. | flight-sensors-m2 One sensor is perfect | Replace c ("It stays just as good.") with **"Just as good, as GPS comes from space."** | Buildings block and bounce the signals from space, so the fix gets worse. |
| `flight-sensors-s3` | A drone's barometer reads the same pressure as one on the ground beside it. Where is the drone? · _About at ground level._ | **yes (W)** | Same reading, same place; c (below ground) is absurd. | flight-sensors-m3 Pressure is the same at every height | Replace c ("Far below the ground.") with **"Can't tell from pressure."** | Pressure drops as you climb, so equal readings mean about equal height. |
| `birds-and-planes-s1` | A plane's engine stops high in the sky. What can its wings still do? · _Keep making lift as it glides down._ | **maybe** | Many know gliders; "drops like a stone" is a common fear. |  |  |  |
| `birds-and-planes-s2` | Why can't a bird just hold its wings still, like a plane, to take off? · _Nothing else would drive it ahead._ | **maybe** | "Wings too small" is a plausible guess without the card. |  |  |  |
| `birds-and-planes-s3` | A small parrot tires on a long flight. Which half of its flap is wearing it out? · _The downstroke._ | **yes (K)** | The downstroke pushing on the air is intuitive; the hint repeats it. | Not listed: "both halves of a flap work equally" (suggest adding) | Replace c ("Gliding between flaps.") with **"Both halves, about equally."** | The upstroke is a light reset. The downstroke uses nearly all the power. |
| `ceiling-fans-s1` | A fan blows on a dry steel spoon in a warm room. Does the spoon get colder than the room? · _No, it stays at room heat._ | **no** | "Fans make things cold" is a common belief; b will catch many. |  |  |  |
| `ceiling-fans-s2` | Why does a fan feel cooler on wet skin just after a bath? · _More water dries off, taking more heat._ | **yes (K)** | Evaporation cools is Class 9 science; b is silly. | ceiling-fans-m1 Fan makes cold air | Replace b ("Wet skin makes the fan spin faster.") with **"The fan blows colder air on wet skin."** | The air is the same room air. Drying water takes heat from your skin. |
| `ceiling-fans-s3` | Two rooms are both at 34°C. In which one does a fan cool you better? · _The room with drier air._ | **yes (K)** | Sticky monsoon nights are common experience in India. | ceiling-fans-m4 A fan works the same in any weather | Replace b ("The room with damper air.") with **"The damper room, as moist air feels cooler."** | Damp air slows the drying of sweat, so the breeze takes less heat. |
| `upi-path-s1` | Asha shares her UPI ID with you. What does that save you from typing? · _Her account number and IFSC code._ | **yes (K)** | Most students use UPI daily and know it replaces account number and IFSC. | upi-path-m1 ID is a wallet | Replace c ("The amount you want to send her.") with **"Her UPI wallet number."** | A UPI ID holds no money. It just points to her bank account. |
| `upi-path-s2` | Ravi's UPI app is made by a company that is not his bank. Can he still pay by UPI? · _Yes, any UPI app works with his bank._ | **yes (K)** | GPay or PhonePe with any bank is everyday experience. | upi-path-m2 App alone moves cash | Replace c ("Just for small sums, on weekdays.") with **"Yes, as the app itself sends the money."** | The app only sends the request. NPCI carries it, and the banks move the money. |
| `upi-path-s3` | Why does UPI check your own phone as well as your PIN? · _Your PIN alone is useless on another phone._ | **yes (W)** | b and c are weak; two checks is the obvious reason. | Not listed: "a PIN works from any phone" (suggest adding) | Replace c ("So your PIN can be shorter and easier.") with **"So you can pay from any phone with it."** | Your PIN works only on your own phone, so a thief would need both. |
| `phone-camera-s1` | One sensor spot gets twice as much light as the spot next to it, in the same time. What about its signal? · _About twice as big._ | **yes (K)** | More light, more signal is intuitive. | phone-camera-m2 Lens records the image | Replace c ("About half as big.") with **"The same; the lens records it, not the spot."** | The lens only aims light. Each sensor spot records it, so more light gives a bigger signal. |
| `phone-camera-s2` | A spot under a red filter reads bright. What did it see? · _Lots of red light._ | **yes (S)** | A red filter lets red through is obvious. | phone-camera-m3 Each pixel sees every colour | Replace c ("Very little light of any colour.") with **"Bright light of many colours."** | A red filter lets mostly red through, so each spot sees one colour. Software fills in the rest. |
| `phone-camera-s3` | Same dark room. Instead of a high ISO, the phone keeps its shutter open longer. What is the risk? · _Blur if your hand moves._ | **yes (K)** | Night mode says "hold still": common phone experience. | phone-camera-m4 A longer shot is always better | Replace c ("Colours swap between red and blue.") with **"None; a longer shot is sharper."** | A longer shot gathers light, but any shake while it is open smears the photo. |
| `sky-colours-s1` | Which colour of light has the longer wavelength? · _Red._ | **yes (K)** | Red has the longest wavelength is Class 10 physics (VIBGYOR). | Not listed: "blue is long, since blue fills the sky" (links to s2) | Replace b ("Blue.") with **"Blue, as blue light travels farthest."** | Blue waves are short, which is why air scatters them. Red has the longer wavelength. |
| `sky-colours-s2` | Why do clouds look white, not blue? · _Their big droplets scatter every colour._ | **maybe** | Why clouds are white is not widely known; "white dust" may tempt some. |  |  |  |
| `sky-colours-s3` | Smoke or dust fills the air at sunset. What can happen to the colours? · _The sunset can look even redder._ | **maybe** | Many have seen orange smoggy sunsets; "stays the same" tempts others. |  |  |  |
| `pressure-cooker-s1` | An open pot of water is boiling hard. You turn the flame up. What happens to the water's temperature? · _It stays about the same._ | **maybe** | Class 9 boiling point helps, but "more flame, hotter" is a common belief. |  |  |  |
| `pressure-cooker-s2` | Which is hotter: an open pot boiling on a big flame, or a cooker boiling on a low flame? · _The cooker._ | **yes (K)** | Every Indian kitchen knows the cooker is hotter and faster. | pressure-cooker-m2 More flame raises an open boil | Replace b ("The open pot.") with **"The pot, on its big flame."** | A big flame cannot push an open boil past 100°C. The cooker's pressure makes it hotter. |
| `pressure-cooker-s3` | Cooking is done, but the cooker is still under pressure. What is the safe step? · _Wait until the pressure has fully dropped._ | **yes (W)** | Forcing or shaking a hot cooker is plainly unsafe. | pressure-cooker-m3 The whistle only says food is done | Replace c ("Tap and shake the cooker hard to free the lid.") with **"Open it once the whistles have stopped."** | The whistle stopping does not mean the pressure is gone. Wait until it has fully dropped. |

### How things work: new stems and notes (PROPOSALS)

- **`upi-path-s2` note.** Two "Yes" options: the wrong one gives the wrong reason.
- **`sky-colours-s1` note.** A first-draft new stem repeated item sky-colours-9 (a prism adds colours), so this keeps the stem and proposes a distractor instead.


## Scripts (in /tmp, not in the repo)
Run from the worktree root on `origin/ship-32` after `npm ci`. Machine: 4 shared CPUs. `uptime` at install: load average 3.91, 2.78, 1.41. No timings are reported.

1. `dump.py`: lists every guided try with its teach card and the concept's misconceptions. This is what I read.

```python
import json,glob,sys,os
out=sys.argv[1]; os.makedirs(out,exist_ok=True); tot=0
for f in sorted(glob.glob('content/topics/topic.*.json')):
    d=json.load(open(f)); tid=d['body']['topic']['id']; lines=[]; n=0
    for m in d['body']['modules']:
        for c in m['concepts']:
            lines.append(f"\n######## CONCEPT {c['id']} — {c['title']}")
            for mc in c.get('misconceptions',[]): lines.append(f"  MISC {mc['id']}: {mc['name']} -> {mc['correction']}")
            for s in c.get('steps',[]):
                lines.append(f"\n== STEP {s['id']} — {s['title']}\n  TEACH: {s['teach']}")
                for g in s.get('guided',[]):
                    n+=1; lines.append(f"  GUIDED STEM: {g['stem']}\n    HINT: {g.get('hint','')}")
                    for o in g['options']: lines.append(f"    {o['id']}{'*' if o.get('correct') else ' '} {o['text']}   || fb: {o.get('feedback','')}")
    open(f"{out}/{tid}.txt",'w').write('\n'.join(lines)); print(tid,'guided',n); tot+=n
print('total guided',tot)   # -> 162
```

2. The judgements are Python dicts, one `j(step_id, verdict, why, misconception, replaces, distractor, feedback, stem=…, opts=…)` per try.
   The tables above are generated from them, so the tables are the data.
   `gen.py` joins them with the packs, checks that every one of the 162 tries has exactly one judgement, and writes the tables.
   It also checks each proposal against the rules ported from `validate.ts` and `copy-lint.ts`:

```python
banned = re.compile(r'\b(?:' + '|'.join(['Blue'+' Lock','E'+'go','Eg'+'oist','Que'+'ens','Tan'+'go','Z'+'ip','Ken'+'Ken']) + r')\b', re.I)
advice = re.compile(r"\b(?:you should|we recommend|must)\s+(?:buy|sell|invest|take|stop taking|consult|sue)\b|(?:^|[.!?]\s+)(?:buy|sell|invest)\s+(?:stocks?|shares?|funds?|medicine)\b", re.I)
copy   = re.compile(r'\b(?:addiction|fail|fails|failed|failing|failure|lost|you should|streak broken)\b', re.I)
# plus: Flesch >= 60 for new stems (port of fleschReadingEase), exactly one right option, the replaced option is a wrong one,
# distractor length <= longest sibling + 4 words, and every named misconception id exists in that concept.
```

3. `apply.py` writes edited **copies** of the packs. It never touches the repo files.

```python
import json, glob, os, sys
from judge_psych_money import J; import judge_fix; from hints import H
out = sys.argv[1]; os.makedirs(f'{out}/topics', exist_ok=True)
for f in sorted(glob.glob('content/topics/topic.*.json')):
    d = json.load(open(f)); t = d['body']['topic']['id']
    for m in d['body']['modules']:
        for c in m['concepts']:
            for s in c['steps']:
                key = f'{t}:{s["id"]}' if f'{t}:{s["id"]}' in J else s['id']   # sleep-recovery-s1..3 exist in Health and Body
                r = J[key]; g = s['guided'][0]
                if r['dist']:
                    o = next(o for o in g['options'] if o['id'] == r['rep']); o['text'] = r['dist']; o['feedback'] = r['fb']
                elif r['stem']:
                    g['stem'] = r['stem']; g['hint'] = H[key]
                    g['options'] = [{'id': 'abc'[i], 'text': x, 'correct': ok, 'feedback': 'Right. Feedback to write.' if ok else 'Feedback to write.'}
                                    for i, (x, ok) in enumerate(r['opts'])]
    json.dump(d, open(f'{out}/topics/{os.path.basename(f)}', 'w'), ensure_ascii=False, indent=1)
```

4. `check.ts` runs the repo's own validator (editorial rules on) over the edited copies:

```ts
import { validateAll } from '/tmp/cj3/job2/scripts/validate-packs';
validateAll(process.argv[2]!).then(errors => { console.log(errors.length ? errors.join('\n') : 'Packs valid.'); console.log('errors:', errors.length); });
```

```
python3 apply.py /tmp/cj3/job2-scratch/simall && npx tsx check.ts /tmp/cj3/job2-scratch/simall
applied distractors 111 new stems 9
Packs valid.
errors: 0
```
