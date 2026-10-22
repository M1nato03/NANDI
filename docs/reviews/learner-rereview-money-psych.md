# Learner re-review: Money & Markets, Psychology (after the spec 16 rewrite)

Reviewed 2026-10-22. No content was changed.

- **Money:** `content/topics/topic.money-markets.json` on `origin/steps-money2` (`dfb11bc`).
- **Psychology:** `content/topics/topic.psychology.json` on `origin/steps-psych` (`c61a1d2`).
- **Rules used:** `docs/specs/16-fresh-practice.md` (R1–R9) from `origin/ideas/spec-16-fresh-practice`, and the lesson shape in `docs/specs/14-teach-first.md` from `origin/learn-steps`.
- **Baseline:** `docs/reviews/learner-money-health.md` from `origin/ideas/learner-money-health`.

**Method.** I walked every concept in lesson order (hook → teach + visual → spot → guided 1 → guided 2 → takeaway → that step's practice items → next step), reading as a tired 18–25 year old in India on a phone. Facts and maths were not re-checked.

**Scores.**
- **Taught** (1–5): can the learner answer every item from what its step showed?
- **Fresh** (1–5): 5 means no two questions in the concept feel like the same question. A new noun, new numbers or a new format does not make a question different.
- **Ship bar:** fresh ≥ 4 **and** taught ≥ 4 on every concept.

## Verdict

**No concept passes.** Not one of the 20 concepts reaches fresh 4. Money moved from fresh 1.9 to 2.7. Psychology, written with spec 16 as its brief from the start, averages 2.4.

The mechanical rules are now green on both topics:
- Correct answer is the single longest option: Money 35%, Psychology 31% (limit 40%).
- Absolute words in distractors vs correct options: Money 1.08×, Psychology 1.41× (limit 1.5×).
- No duplicate `job` inside a step.
- No hint shares a content word with its answer.
- No reused numbers outside 0/1/2/10/100.
- No `recall` item in a step 1, and at most one per concept.

The validator cannot see the remaining failure: **the same question asked again with a new name, new numbers and a new `job` label.** The `job` field is often a label, not a different task:
- About a third of `transfer` items stay in the same life area and ask the same question.
- Several `reverse` items swap which number is unknown in the same subtraction or division.
- Several `edge` items are cases where the idea applies normally.
- Several `combine` items use only their own step.
- `estimate`/`transfer` items are often percent sums on a figure from the teach card (habits-15, confirmation-bias-12, social-proof-12, sleep-memory-12).

Until a reviewer checks that the label matches the task, R1 can be met without changing what the learner feels.

## Top table

| Topic | Concept | Taught | Fresh | Top remaining issue |
|---|---|---|---|---|
| Money | inflation | 4 | 3 | s2 asks "pay rise vs price rise" 5 times (spot, g2, -9, -13, -14); s1.g1 onions = -12 tomatoes |
| Money | compounding | 4 | 3 | Every s1 item runs at 10% (7 sums); -12 and -13 are both "the later starter ends with less" |
| Money | rule-of-72 | 4 | **2** | -10 is s1.g2 again (rate from years); -13 is s2.g2 again (savings vs debt); -14 is a third rate-from-years item |
| Money | risk-return | 4 | 3 | -15 and -16 are the same "split money by when you need it" item; -12 and -14 are both "it rose a lot, what does that mean?" |
| Money | diversification | 4 | 3 | s3.hook = s3.g2 ("N firms, market falls"); -16 is s3.g1 reversed |
| Money | shares | 4 | **2** | s3.g1, s3.g2 and -15 are one question ("paid ₹X last year; this year?"); "customer vs owner" 5 times (s2.g1, -11, -13, -14, teach) |
| Money | emergency-fund | 4 | 3 | s1 is 6× "planned or surprise?" (hook, g1, g2, -9, -10, -11); -15 = s3.hook (shares vs savings) |
| Money | loan-emi | 4 | **2** | -11 is the s1.g1/spot subtraction again; -14 = -15 (prepay → less interest); "longer = more interest" 5× in s3 |
| Money | index-funds | 4 | 3 | -15 = s2.g1 (which fee trails more); -16 = s3.g2 (name the gap); "tracking error" still the wrong Indian term |
| Money | upi-scams | 4 | 3 | s1 still 5× "PIN to receive = trick"; -14 = s2.g1 = hook; -15 = s3.hook; real scams for this age group still absent |
| Psych | habits | 4 | 3 | -11 is s1.g1 ("name the cue"); -9 is s1.g2 ("cue missing, habit slips"); -13 = s2.hook |
| Psych | loss-aversion | 4 | **2** | s1 is 5× "same-size gain vs loss, which weighs more" (spot, g1, g2, -9, -10); s3.hook = s3.g1; -16 = s3.g2 |
| Psych | anchoring | 4 | **2** | Price-cut anchor 3× in s1 (hook, g1, -10); -15 = s3.g1; -16 = s3.g2; -14 repeats the s2 spot (experts) |
| Psych | confirmation-bias | 4 | 3 | -9 = s1.g1 ("he recalls what fits"); -13 = s2.hook; -12 is a percent sum labelled transfer |
| Psych | social-proof | 4 | 3 | -9 (chai queue) = -11 (busy dhaba) = s1.spot; -13 = s2.g2; -15 pairs repeat s3.g2 and s3.spot |
| Psych | planning-fallacy | 4 | **2** | "It ran long" 5× in s1; s2.spot = s2.g2 (forgot to buy supplies); -15 = s3.hook (average of three past times) |
| Psych | sleep-memory | 3 | **2** | "Never learned it, sleep can't help" 3× (hook, g2, -9); s2 teaches from an 8-person pilot; -16 = s3.g1 |
| Psych | variable-rewards | 4 | 3 | s2.g1 = s2.g2 ("why keep opening packs / tossing rings"); -12 tests probability never taught; -15 pairs endless scroll with autoplay |
| Psych | if-then-plans | 3 | **2** | "Pick the real if-then plan" 5× across s1/s2 (hook, -9, -11, s2.g1, -13); -14's match has no single answer; effect-size jargon in s3 |
| Psych | spotlight-effect | 4 | **2** | "Fewer noticed than you think" 5× in s1; -13 = s2.g1; -16 = s3.spot |

### Averages

| Topic | Taught | Fresh | Concepts at fresh ≥ 4 | Concepts at taught ≥ 4 | Pass |
|---|---|---|---|---|---|
| Money and markets | 4.0 | 2.7 | 0 / 10 | 10 / 10 | 0 / 10 |
| Psychology | 3.8 | 2.4 | 0 / 10 | 8 / 10 | 0 / 10 |
| Old Money (fc35e7c) | 3.2 | 1.9 | 0 / 10 | 2 / 10 | 0 / 10 |

**Closest to passing:** diversification (s1 and s2 practice items are real reverse, transfer and edge jobs; only s3 repeats), emergency-fund s2, confirmation-bias s3, and upi-scams s3. Each needs about two item rewrites to reach fresh 4.

---

## The pattern behind most of the failures

1. **Hook, spot, g1 and g2 are four hits on one fact before any practice.** R2 allows "the same core fact at most twice per step, guided tries included". Almost every step breaks this before its practice starts: the hook asks it, the spot shows it, and g1 and g2 ask it again. The practice items then add a fifth and sixth hit.
   - **Fix at the shape level:** make g2 the "new setting" try that spec 14 §3.5 describes. It should be a different *use* of the idea, not the same question in another place.
2. **The `job` label is applied after the item is written.**
   - `transfer` in a new setting with the same question: habits-9, loss-aversion-9, social-proof-9, spotlight-effect-9, planning-fallacy-9, shares-15.
   - `reverse` that swaps which number is unknown: loan-emi-11, rule-of-72-10.
   - `reverse` that is a naming question: habits-11, social-proof-11, variable-rewards-11, if-then-plans-10.
   - `edge` where the idea applies normally: index-funds-11, anchoring-14, spotlight-effect-14, variable-rewards-13, loss-aversion-11.
   - `combine` that uses only its own step: risk-return-15, emergency-fund-12, emergency-fund-16.
   - **Rule to add to the review checklist:** for each practice item, the reviewer writes the *question it actually asks* in five words. If two items in a concept get the same five words, one is rewritten.
3. **Psychology "fill-the-step/reverse" is one template used five times.** The template is "Working back, X is the ___" (habits-11, anchoring-11, social-proof-11, planning-fallacy-14, variable-rewards-11, if-then-plans-10). The phrase "working back" does not make an item reverse. Only anchoring-11 and planning-fallacy-14 truly infer the cause from the result.
4. **Percent sums on study figures, labelled transfer.** habits-15 (66 days → weeks), confirmation-bias-12 (6/29), social-proof-12 (37% of 12), sleep-memory-12 (20.4 vs 12.6) and if-then-plans-15 (0.65) test arithmetic or recall of a statistic, not the idea. For a tired learner these read as homework.
   - **Fix:** cut them, or keep at most one per topic.
5. **One match type in Psychology has no unique answer.**
   - if-then-plans-14: any vague cue can pair with any clear cue.
   - sleep-memory-15: "night of sleep" and "ten quiet minutes" both fit both "helps memory" lines.
   - upi-scams-10 (Money): "Rupees leave you" and "Starts a payment out" fit both PIN and stranger-QR.
   - R3 says no shared words. It should also say: each left side fits exactly one right side.

---

## Money: what changed since the old review

| Old named problem | Status |
|---|---|
| inflation: why a basket; why the target is not 0%; -15 answer was "India even aims for 4%" | **Fixed** (teach cards and -15 now give the reason) |
| inflation: "fixed rupees buy less" asked 9× | **Mostly fixed** (idle-cash items gone), but "pay vs prices" is still 5× in s2 |
| inflation: nominal pay (-14), "inflation of a toy" (-11/-16), fee guilt (-9), Dadaji joke | **Fixed** |
| compounding: six "10% for two years" sums | **Not fixed**: s1 still has seven sums, all at 10%; -9 is still a two-year 10% sum |
| compounding: Asha in two opposite roles; age-15 start; SIP unexplained and unlinked to compounding | **Fixed** |
| compounding: ₹365 reads as "₹1 a day" | **Not fixed** (s2 hook and teach) |
| rule-of-72: -10 = s1.g2; -13 = s2.g2 | **Not fixed**: new numbers, same questions |
| rule-of-72: "rough guess" untaught; debt "why"; 18% too low for Indian cards | **Fixed** (36–45%) |
| risk-return: -14 = s2.g1; bond undefined; -9 expected value untaught; raffle | **Fixed** |
| risk-return: "money needed soon → savings" 4× | **Not fixed**: now 5× (hook, spot, g1, -15, -16) |
| diversification: US-guide authority; fees untaught; portfolio/takings | **Fixed** |
| diversification: "same industry" 5×; s3 four identical items | **Partly fixed** (s2 better; s3.hook = s3.g2 remains) |
| diversification: point a ₹5,000 learner to one broad fund | **Not fixed** |
| shares: dilution untaught; -12 = s2.g2 recall | **Fixed** |
| shares: six division drills | **Partly** (five remain in s1) |
| shares: customer vs owner 4× | **Not fixed** (5×) |
| shares: AGM unexplained; why people buy shares | **Partly** ("can also gain if the company grows" is one untested clause) |
| emergency-fund: family ₹60,000 target, job loss, flood, guilt; no why for 3 months or for keeping it separate; -12/-13/-14 dupes | **Fixed** (student hostel framing; start small moved into s2) |
| emergency-fund: "is it a surprise?" 6×; s3.hook = s3.g1 = -15 | **Not fixed** |
| emergency-fund: loan-app distractor should say rates are very high | **Partly**: feedback says "debt with interest", not how high |
| loan-emi: principal untaught; RBI decimals; -15 copied the diagram | **Fixed** |
| loan-emi: "interest part shrinks" 4× (s2.hook, spot, g2, -13) | **Not fixed** (same four) |
| loan-emi: "longer = more interest" 6× | **Partly** (5×) |
| index-funds: active fund undefined; why choose an index fund; "weight"; -15 = s3.g1 | **Fixed** |
| index-funds: s3.g2 and -16 both "tracking error" | **Not fixed** |
| index-funds: tracking error vs tracking difference | **Not fixed**: Indian factsheets report the gap the card describes as *tracking difference* |
| upi-scams: 1930 missing; act fast untaught; shame line; screen-share scam | **Fixed** |
| upi-scams: ~10 "prize + PIN" items | **Partly** (5 in s1, plus -12) |
| upi-scams: -15 = s3.hook | **Not fixed** |
| upi-scams: task-scam and "digital arrest" cases | **Not added** |

**Summary: about 60% of the named problems are fixed.** Every fix that needed new teaching landed. Most fixes that needed a *different question* did not: the item was reworded, renumbered or relabelled and still asks the same thing.

---

## Per-concept issues — Money

### inflation (Taught 4 · Fresh 3)
- **Same question:**
  - s1.g1 (onions double) and **inflation-12** (tomatoes +50%) both ask "one item jumps: what does inflation do?"
  - s2.spot, s2.g2, **inflation-9**, **inflation-14** all compare a pay rise with a price rise.
  - s3.spot, s3.g1 and **inflation-15** all answer "falling prices make people wait".
- **Untaught (R8):**
  - **inflation-11** (₹1,080 after 8% → last year) and **inflation-16** (percent-rise steps) need a percent-change method no step shows.
  - Fix: add to the s1 example "₹103 now, ₹100 last May: a 3% rise".
- **Hint gives the answer:** s2.g1 "Work out 100 divided by 125" is the whole calculation. Use "Compare what ₹100 bought then and now."
- **Rewrites:**
  - inflation-12 → transfer that is truly new: "Your ₹299 phone plan cuts data from 2 GB to 1.5 GB a day. Has the price per GB gone up?"
  - inflation-14 → edge: "Prices fall 1% and your stipend stays the same. Does it cover more, less or the same?"
  - inflation-15 → misconception that is new: "A friend says 4% inflation means his ₹100 note is now worth ₹96 in the bank's records." The answer: the note still says ₹100; it is what it buys that drops.

### compounding (Taught 4 · Fresh 3)
- **Same frame:** every s1 question runs at 10% (hook, spot, g1, g2, -9, -10, -11). The jobs differ (reverse, misconception, edge), but the learner sees "10% again" seven times.
- **Same question:** **compounding-12** (Dev starts at 26) and **compounding-13** (starting at 25 vs 22 costs nothing) are both "the later starter ends with less", after s2.spot said the same.
- **s3 hook vs s3.g2:** "What does a SIP fix?" and "Which does a ₹500 SIP set for you?" are the same question.
- **₹365** (s2 hook, teach, visual) still reads as "₹1 a day". Use ₹500.
- **Rewrites:**
  - compounding-9 → "₹2,000 grew to ₹2,880 in two years, gains left in. What yearly rate?" (20%).
  - compounding-10 → use 5% over 4 years.
  - compounding-13 → combine with s1: "Two friends each save ₹5,000 for 30 years at 8%. One spends the interest each year. Who ends with more, and roughly how many times as much?"
  - s3.g2 → "The fund falls 10% in your SIP's first year. What happens to next month's ₹500?" (It still goes in, and buys more units.)

### rule-of-72 (Taught 4 · Fresh 2)
- **Same question:**
  - s1.g2 (which rate doubles in 6 years) and **rule-of-72-10** (rate to double in 3 years): rate from years, twice.
  - **rule-of-72-14** (doubled in 8 years → rate) is the same reverse a third time.
  - s2.g2 (6% savings vs 18% debt) and **rule-of-72-13** (8% savings vs 45% card): "which doubles first".
  - s3.hook, s3.spot and **rule-of-72-16** are three jumpy funds with different percentages.
  - s3.g1 and **rule-of-72-15** are both "when does it work best".
- **Forward 72 ÷ n** appears in hook, spot, g1 and -9: four plain divisions in s1.
- **Giveaways (no one picks these):** -15 b/c, -16 c ("add the three returns and divide by them"), s1.g1 c "About 81", -9 c "216 years".
- **Rewrites:**
  - rule-of-72-10 → combine with compounding: "Why does 72 ÷ rate work at all? Because each year's gain is added to the pot. Which case breaks it: interest paid out each year, or left in?"
  - rule-of-72-13 → reverse with a goal: "You want ₹10,000 to become ₹40,000 in 12 years. What steady rate does that take?" (two doublings → 12%).
  - rule-of-72-15 → transfer that leaves money: "A town's population grows 2% a year. About when will it double?"

### risk-return (Taught 4 · Fresh 3)
- **Same question:**
  - **risk-return-15** (₹20,000 in 6 months vs ₹2 lakh in 28 years) and **risk-return-16** (Tara's ₹50,000 in 2 years from a 40-year goal) are one item. They repeat s3.hook, s3.spot and s3.g1, so the s3 idea is asked 5×.
  - **risk-return-12** (crypto up 40%) and **risk-return-14** (fund paid very high return) both ask "it rose a lot: what does that mean?" They have different right answers, which confuses rather than freshens.
- **Label not real:**
  - -9 `reverse` is a 10%-loss percent sum. It does not reverse the risk idea.
  - -15 `combine` uses only s3.
  - -16 `edge` is a normal application of the idea.
- **Rewrites:**
  - risk-return-9 → a true reverse: "A fund's yearly results over 10 years ranged from −20% to +35%. Is it more likely shares or a savings account?"
  - risk-return-16 → a true edge: "You need ₹15,000 in 3 years and can't afford to lose any. Does 'shares earn the most over time' help you here?"
  - risk-return-14 → transfer: "Two part-time gigs: one pays ₹300 an hour fixed, one ₹0–₹900 in tips. Which would you pick if rent is due Friday, and why?"

### diversification (Taught 4 · Fresh 3)
- s1 and s2 practice items are the best in the topic: -9 is a real reverse, -10 a real transfer, -11 a real edge, and -12 a real reverse.
- **Same question:**
  - s3.hook (30 firms, market falls) and s3.g2 (Dev's 40 firms can never lose) both answer "they fall together".
  - **diversification-16** is s3.g1 reversed.
  - **diversification-15** (fest cyclone) is the same "everything hit at once" frame a fourth time.
- **Still missing:** the practical line for a learner with ₹5,000: "One broad index fund gives a spread you can afford" (link to index-funds).
- **Rewrites:**
  - diversification-16 → combine with s2: "Your mix holds 15 firms in 9 industries. Name one shock it guards against, and one it can't."
  - s3.g2 → misconception: "Gold and shares both fell in the same month. Does that mean diversifying failed?"

### shares (Taught 4 · Fresh 2)
- **Same question:**
  - s3.g1 (₹5 last year), s3.g2 (₹3 last year, now a loss) and **shares-15** (Kiran plans fees around last year's ₹2,000) are all "last year's dividend; can you count on it?"
  - "Customer vs owner" appears in **shares-11**, s2.teach, s2.g1, **shares-13** and **shares-14**. -14 is s2.g1 asked as a why.
  - s1 has five "my shares ÷ all shares" sums (hook, spot, g1, g2, -9).
  - s2.g2 "Where do owners vote? HINT: look back at the card for the name" asks only for a name the hook already gave. That is a recall item inside a guided slot.
- **Label not real:** shares-15 `transfer` stays in investing; "hostel fees" is only a setting.
- **Untaught clause:** s3 teach says "owners can also gain if the company grows", but no item uses it, and that is the reason anyone buys a share.
- **Rewrites:**
  - s3.g2 → "A company paid no dividend for 5 years, but its share price tripled. Did its owners gain?" (teaches price gain).
  - shares-14 → reverse: "Raj gets a notice to vote on a new factory. What must he hold?"
  - shares-15 → a real transfer: "Your friend's family shop gives each partner a share of profit only when the partners agree. How is that like a dividend?"
  - Add "(the AGM, held once a year)" to the s2 teach.

### emergency-fund (Taught 4 · Fresh 3)
- **Same question:**
  - s1 asks "planned or surprise?" six times: hook, g1, g2, **-9**, **-10** and **-11** (a match of the same sort). -9 (forgotten fee) is a good edge; -10 and -11 add nothing.
  - s3.hook (option b: shares) and **emergency-fund-15** (Rahul wants shares) are one item. s3.g1 makes it three.
- **Untaught:** **emergency-fund-16** (refill after use) is a good item, but no teach card says to refill. Add to the s3 teach: "After you use it, top it back up first."
- **Label not real:** -12 `combine` (₹24,000 at ₹1,500/month) uses only s2; -16 `combine` uses no earlier step.
- **Tone:** s1.g2 c "A quick loan from an app": the feedback should say app loans can charge very high interest. That is the real risk for this age group.
- **Rewrites:**
  - emergency-fund-10 → combine with s2: "Your fund has ₹9,000 of a ₹18,000 target. Your phone screen cracks (₹4,000). Use the fund or not, and what next?"
  - emergency-fund-11 → reverse: "Riya spent from her fund three times this year: a fever, a bus pass and a stolen bag. Which one should have come from her budget?"
  - emergency-fund-15 → edge: "Your fund is full at 3 months. Where could extra savings beyond it go?" (This is where longer-term choices like shares fit.)

### loan-emi (Taught 4 · Fresh 2)
- **Same question:**
  - s1.spot (₹5,000 − ₹1,000), s1.g1 (₹8,000 − ₹3,000) and **loan-emi-11** (₹9,000 − ₹6,500) are one subtraction three times. Swapping which part is unknown is not working backwards.
  - **loan-emi-14** (Tara prepays from a scholarship) and **loan-emi-15** (₹10,000 extra, prepay) are the same item.
  - "Interest part shrinks" is s2.hook, s2.spot, s2.g2 and **-13**, the same four the old review named.
  - "Longer = more interest" is s3.hook, spot, g1, g2 and **-16**.
- **Untaught:** **loan-emi-10** (0% EMI plus a ₹1,500 fee) is the most useful item in Money, but no teach card says fees are a cost of borrowing. Add to the s1 teach: "Fees count too: '0% EMI' with a fee is not free."
- **Label not real:** -9 `transfer` (phone loan match) stays in loans; -14 `transfer` stays in loans.
- **Rewrites:**
  - loan-emi-11 → reverse for real: "Your first EMI's interest part was ₹1,000 at 1% a month. How much did you borrow?"
  - loan-emi-13 → combine with s3: "Two loans of ₹1 lakh at 12%, one for 1 year and one for 2. Which has the bigger interest part in month 1?" (Equal, since it is the same balance. This is a real thinking item.)
  - loan-emi-14 → transfer: "A friend lends you ₹2,000 and asks ₹100 a month 'rent' until you repay. What lowers your total cost?"

### index-funds (Taught 4 · Fresh 3)
- **Same question:**
  - **index-funds-15** (0.1% vs 0.9% fund: which trails more) is s2.g1 (1% vs 0.2%: which keeps more).
  - **index-funds-16** (matches "to the last paisa"?) is s3.g2 (name the gap) as a misconception.
  - s1.g1 (firm joins → add it) and **index-funds-11** (firm leaves → sell it) are mirror images. -11 is labelled `edge` but the idea applies normally.
  - **index-funds-14** pair e–f (expense ratio ↔ yearly cost) is s2.g2.
- **Terminology (repeat):** the gap card s3 describes is what Indian factsheets call **tracking difference**. Tracking error is how much that gap varies. A learner who opens a factsheet finds a different number. Fix the term in the s3 teach, g2, -16 and the visual.
- **Rewrites:**
  - index-funds-11 → a real edge: "You want to own only green-energy firms. Does a Nifty 50 index fund do that?" (No. It copies the list, good or bad for your aim.)
  - index-funds-15 → combine with diversification: "Why is one Nifty 50 fund a wider spread than five shares you picked?"
  - index-funds-16 → reverse: "Fund A trailed its index by 0.2% last year, fund B by 1.1%. Which likely has the higher fee?"

### upi-scams (Taught 4 · Fresh 3)
- **Same question:**
  - s1 is "PIN to receive = trick" five times: hook, spot, g2, **-9**, and the core of g1.
  - **upi-scams-12** (three cashback links) is the same trick multiplied by 3.
  - s2.hook (caller wants PIN), s2.g1 (who may know your PIN) and **upi-scams-14** (real bank staff may ask?) are one item three times.
  - **upi-scams-15** (hostel OTP, ₹4,000 gone: what now?) is s3.hook.
- **Ambiguous match:** in **upi-scams-10**, "Rupees leave you" and "Starts a payment out" both fit "Entering your UPI PIN" and "Scanning a stranger's QR code". Reword one right side: "Asks you to approve money going out".
- **Untaught jargon:** "Chakshu" first appears in the s3 *takeaway* and is tested in **upi-scams-16**. No card says what it is. Add to the s3 teach: "Report scam calls and texts, even if no money left, on Chakshu (in the Sanchar Saathi app or site)."
- **Still missing:** the scams this age group actually meets: task or job scams ("₹150 a like, then deposit ₹2,000"), "digital arrest" video calls, and fake loan apps.
- **Rewrites:**
  - upi-scams-12 → "A 'work from home' app paid you ₹150 for liking videos and now asks for a ₹2,000 deposit to unlock bigger tasks. What is happening?"
  - upi-scams-14 → "A video call from 'police' says you are under digital arrest and must pay to clear your name. What do you do?" (Hang up. Police do not do this. Call 1930.)
  - upi-scams-9 → edge: "A friend sends you a UPI collect request to split a dinner bill you agreed on. Is entering your PIN right?"

---

## Per-concept issues — Psychology

### habits (Taught 4 · Fresh 3)
- **Same question:**
  - **habits-11** ("the chai is the ___": Trigger) is "name the cue", the fourth time after hook, spot and s1.g1.
  - **habits-9** (Kunal's train cue gone → forgets) is s1.g2 (Ravi's desk cue missing at home). Both are study habits, so the `transfer` label is not real.
  - **habits-13** (poster: each day adds the same) is s2.hook option c.
- **Label not real:**
  - habits-11 `reverse` asks for a name; it does not work backwards.
  - habits-15 `transfer` converts 66 days to weeks.
- **Rewrites:**
  - habits-11 → a real reverse: "Leo checks Instagram the moment he lies down in bed, every night. What could he change to break the link?" (Move the phone. Change the cue.)
  - habits-9 → a real transfer: "A shop puts the chocolate by the billing counter. How is that using a cue?"
  - habits-15 → cut. Replace with combine s2+s3: "Day 5 of a new habit vs day 80: which miss matters more, and why?"

### loss-aversion (Taught 4 · Fresh 2)
- **Same question:**
  - s1.g1 (2 points), s1.g2 (5 runs), **loss-aversion-9** (8 marks) and **loss-aversion-10** (₹200) all ask "same-size gain vs loss: which weighs more?" They follow s1.spot (₹50), so that is five times.
  - s3.hook and s3.g1 are the same question ("by how much on average?" → about 2×).
  - **loss-aversion-16** (holds for everyone?) is s3.g2 (Kavi: exactly twice?).
- **Giveaway:** s1.g1's stem says "giving up 2 points upsets him more than winning 2 points pleases him" and then asks what that shows. The answer is in the stem.
- **Label not real:** -11 `edge` (bigger stakes, more refuse) is the s1 teach's own sentence, not a case where the idea fails.
- **Rewrites:**
  - s1.g1 → "Varun won't sell a used textbook for ₹200, though he'd never pay ₹200 to buy it. Why?" (Giving it up feels like a loss.)
  - loss-aversion-9 → transfer: "A gym offers 'Lose your ₹500 deposit if you skip a week' or 'Earn ₹500 back if you never skip.' Which pushes harder, and why?"
  - loss-aversion-11 → a true edge: "You lose ₹10 you never knew you had. Does loss aversion bite?" (Little or not at all, since nothing you expected changed.)
  - s3.g1 → cut; -15 already uses the 2×.

### anchoring (Taught 4 · Fresh 2)
- **Same question:**
  - s1.hook (kurta ₹2,000 → ₹1,200), s1.g1 (bag ₹800 → ₹500) and **anchoring-10** (phone ₹30,000 → ₹24,000) are one price-cut anchor three times.
  - **anchoring-9** (Ganga 5,000 vs 1,000 km) is s2.g2 (12 vs 2 sixes): "two groups, who guesses higher".
  - **anchoring-14** (Dr Rao the car expert) repeats s2.spot (legal experts swayed by dice).
  - **anchoring-15** (list the bat's dents) is s3.g1 (list why ₹90,000 is too high).
  - **anchoring-16** (sum up the trick) is s3.g2 (cuts but does not erase).
- **Label not real:**
  - -14 `edge` is a misconception (experts are immune); it carries the m3 tag.
  - -12 `estimate` is recall of a teach number.
  - -15 `transfer` stays in buying.
- **Rewrites:**
  - anchoring-10 → a real transfer: "Your first salary offer is ₹18,000. You ask for more. Why might you name a number before they do?"
  - anchoring-14 → a true edge: "You already know a Coke costs ₹40. A shop shows '₹999' on a random sign. Will it change your guess of the Coke's price?" (Little. A firm known fact resists the anchor.)
  - anchoring-15 → combine s1+s3: "You must guess a flat's rent after the broker says ₹25,000. Write one reason it might be lower; what does that do to your guess?"

### confirmation-bias (Taught 4 · Fresh 3)
- **Same question:**
  - **confirmation-bias-9** (Kabir talks about bad meals) is s1.g1 (Arjun recalls rude moments) and s1.hook.
  - **confirmation-bias-13** (five fits prove it) is s2.hook (fit twice in a row).
  - s3.hook, s3.spot, s3.g1 and s3.g2 are four "find the breaking case" items before practice.
- **Label not real:** **confirmation-bias-12** `transfer` is 6/29 as a percent. Cut it.
- **Strong items:** -14 (UPI slow evenings) and -16 ("usually" claims are not broken by one case) are the best practice items in Psychology.
- **Rewrites:**
  - confirmation-bias-9 → reverse: "Mira's notes list only the days her new diet 'worked'. What belief is she likely testing?"
  - confirmation-bias-12 → transfer: "You think a YouTuber is always right. Which search would test that best: '[name] facts', or '[name] wrong'?"
  - s3.g2 → cut. Use the slot for an edge: "Do you need a breaking case to test 'This chai is hot'?" (No. Just check it.)

### social-proof (Taught 4 · Fresh 3)
- **Same question:**
  - **social-proof-9** (chai queue) and **social-proof-11** (busiest dhaba) are the same food-stall crowd item, after s1.spot (everyone orders dosa).
  - **social-proof-13** (Ira gives the right answer) is s2.g2 (does everyone act like Anu?).
  - In **social-proof-15**, pair e–f (crowd cheers out → third-umpire replay) is s3.g2, and pair a–b (hostel says mess shut → notice board) is s3.spot.
- **Label not real:**
  - -11 `reverse` asks for the teach word "sign".
  - -12 `transfer` is 37% of 12.
- **Rewrites:**
  - social-proof-11 → a real reverse: "An app shows '2,000 people bought this today' on every product. What is it trying to use?"
  - social-proof-12 → edge: "The whole class picks the same answer, and they all worked it out on their own. Is following them now social proof, or good sense?" (When others had their own check, the crowd is a better clue.)
  - social-proof-15 → swap the cricket and hostel pairs for "1,000 reviews of a coaching class → ask a current student" and "a viral 'cure' → ask a doctor".

### planning-fallacy (Taught 4 · Fresh 2)
- **Same question:**
  - s1.hook, s1.spot, s1.g1 (essay 2→5 h), s1.g2 (room 20 min → 1 h) and **planning-fallacy-9** (fest decor) all say "it took longer than planned" five times.
  - s1.g1 gives the answer away: "guesses 2 hours, takes 5: what does this show? → guessed too little".
  - s2.spot (forgot to buy chart paper) and s2.g2 (forgot to buy vegetables) are the same story.
  - **planning-fallacy-12** (fort trip: whose plan counts the queue) is s2.g1 (traffic) again.
  - **planning-fallacy-15** (posters 5, 6, 7 h → 6) is s3.hook (lab reports 2, 3, 4 h → 3) with +3 added.
- **Teach and visual disagree:** the s1 teach says guesses for a friend's task "did not guess short". The visual says the friend's guess "runs long, uses past cases". Use the teach's wording in the visual.
- **Grammar:** s2.g1 c "No, since 15 minutes is enough" does not answer "What is his plan missing?"
- **Rewrites:**
  - s1.g1 → "Priya has 3 days for an essay that took her 5 hours last time. She plans to start the night before. What is the risk?"
  - planning-fallacy-9 → edge: "Your friend asks how long *your* move to a new hostel room will take. You're guessing for yourself. Who is likely closer, you or a friend who watched your last move?"
  - planning-fallacy-15 → combine s2+s3: "Past posters took 5–7 hours, and this one also needs a print-shop trip. What guess fits?"

### sleep-memory (Taught 3 · Fresh 2)
- **Same question:**
  - s1.hook (book under pillow), s1.g2 (Mira skips the lesson) and **sleep-memory-9** (Bunty skips the chapter) are "never learned it, so sleep cannot help" three times.
  - s2.spot (bowling action, sleep, smoother) and s2.g2 (tabla rhythm, sleep, easier) are one story.
  - **sleep-memory-14** (Imran stays up before the viva) is s2.hook and s2.g1 again.
  - **sleep-memory-16** (describe a good break) is s3.g1 (reels or sit quietly).
- **Teaching:**
  - s1.g1 asks for the word "consolidation" with the hint "It is the firming up after learning". That is an R4-style name recall, and the hint gives it.
  - The s2 teach rests on "a small pilot of 8 people". A tired learner is asked to believe an effect from 8 people and is then quizzed on the pilot's numbers (-12, -13).
  - "Since the sleeping brain helps firm up new memories" is circular: it explains sleep helping by sleep helping.
  - Give the why in plain words, e.g. "during sleep the brain replays the day's new learning". Use a larger study as the example and keep the pilot in sources.
- **Ambiguous match:** in **sleep-memory-15**, "A night of sleep after study" and "Ten quiet minutes, eyes shut" both fit both "less forgetting" and "can help a new memory settle".
- **Preachy:** reels appear as the bad choice in s3.g1 and again in -16 a. Once is a fair example; twice reads as a lecture in an app meant to replace scrolling. Keep one.
- **Label not real:** -12 `transfer` is percent arithmetic on figures not in the teach.
- **Rewrites:**
  - sleep-memory-9 → reverse: "Two friends study the same chapter. One remembers it a week later and one doesn't. Both slept 8 hours. What else could differ?" (How well each learned it first.)
  - s2.g2 → transfer: "You learn a new phone keyboard layout at night. When are you most likely to type faster with it?"
  - sleep-memory-12 → cut.
  - sleep-memory-16 → edge: "Does a quiet break help if you didn't take anything in during the lesson?" (No. Combines with s1.)

### variable-rewards (Taught 4 · Fresh 3)
- **Same question:**
  - s1.g1 (gold star every third), s1.g2 (fishing) and **variable-rewards-9** (UPI lucky draw vs every-fifth cashback) all ask "fixed or variable?" three times.
  - **variable-rewards-11** (prizes on tries 3, 9, 17) is the same sorting a fourth time, labelled reverse.
  - s2.g1 (card packs) and s2.g2 (mela ring toss) are one question: "why keep trying? The next could win."
  - **variable-rewards-16** is the s3 takeaway as a misconception.
- **Untaught:** **variable-rewards-12** (1-in-5 per swipe → chance of at least one in five ≈ 67%) needs probability no card teaches. The distractor b ("100%") is the real misconception, so the idea is good, but teach it or cut it.
- **Wrong pairing:** in **variable-rewards-15**, "Endless scroll" ↔ "The next video starts by itself" describes autoplay, not endless scroll. Use "No bottom to the feed". The like-count pair is untaught: the s3 teach names endless scroll and blue ticks only.
- **Label not real:** -13 `edge` (lucky-draw box vs chai machine) is a direct use of the s2 teach.
- **Rewrites:**
  - variable-rewards-11 → reverse: "A game wants you to keep playing for months. Should it give a prize every 10 rounds, or at random? Why?"
  - s2.g2 → transfer to the learner: "You check your exam-result page 30 times a day. Is that a variable reward? What is the 'prize'?"
  - variable-rewards-13 → edge: "Your alarm rings at 6 every day. You never 'check' it. Why not?" (The reward is fixed and known, so there is nothing to hunt.)

### if-then-plans (Taught 3 · Fresh 2)
- **Same question:**
  - s1.hook (Asha's plan vs vague), **if-then-plans-9** (Rohit's call home), **if-then-plans-11** (Kunal's "fitter this year"), s2.g1 (Sonal's water) and **if-then-plans-13** (metro flashcards vs "on the way") all ask "pick or justify the real if-then plan" five times.
  - **if-then-plans-10** (the "if" part of the temple-bell line) is s1.g1 (what is the cue = the if part).
  - s2.hook and s2.g2 are both "which if part is clearest".
- **Hints give the answer:** s1.g1 "The cue is the if part" and s1.g2 "The action is the then part" turn the question into reading a label.
- **No single answer:** **if-then-plans-14** pairs vague cues with clear cues, and any clear cue can replace any vague one. Make it a sort ("vague or clear?") or drop it.
- **Jargon:** the s3 visual and **if-then-plans-15** use effect sizes (0.2 / 0.5 / 0.65 / 0.8). These mean nothing to the learner and are tested as a number. Say "helped a fair amount on average: more than a small nudge, less than a sure thing" and cut -15.
- **Overlap with habits s1:** the if-then cue and the habit cue are taught as the same idea with no link. Add one line to s1: "It works like a habit cue that you choose on purpose."
- **Rewrites:**
  - if-then-plans-9 → edge: "Your if-then plan is 'If I sit at my desk, I study.' Your desk is now covered in laundry. What breaks?" (The cue is gone.)
  - if-then-plans-11 → combine with habits: "After 3 weeks of 'If I finish dinner, I open notes,' it takes no effort. What has the plan turned into?"
  - if-then-plans-13 → reverse: "Riya says 'I always forget to drink water.' Write the if part that would fix it." (Choice: after brushing teeth / when thirsty / when I remember.)

### spotlight-effect (Taught 4 · Fresh 2)
- **Same question:**
  - s1.hook (chai on shirt), s1.spot (haircut), s1.g1 (odd socks), s1.g2 (ringtone) and **spotlight-effect-9** (pimple at viva) all ask "fewer noticed than you think" five times.
  - **spotlight-effect-13** (frozen video face → lived it from the inside) is s2.g1 (debate pause → lived every detail).
  - **spotlight-effect-16** (tray drop, floor wet) is s3.spot (trophy trip, stage slippery).
  - **spotlight-effect-15** (sum up the slip studies) is s3.hook and s3.g1.
- **Label not real:**
  - -14 `edge` (a clever point is overrated too) is a misconception item; it carries the m4 tag, and the idea applies normally.
  - -16 `transfer` is the spot's scene.
  - -10 `reverse` is 12 − 7 on "made-up numbers".
- **Rewrites:**
  - spotlight-effect-9 → reverse: "After a party, Sanjana is sure everyone saw her spill. Next day, two friends can't recall what she wore. What does that suggest about her guess?"
  - spotlight-effect-10 → cut. Replace with a true edge: "You go on stage alone and forget your lines. Does the spotlight effect say few noticed?" (No. When you are the only focus, many do notice. The effect is about overrating, not about nobody seeing.)
  - spotlight-effect-16 → transfer: "You post a story with a typo and want to delete it. What does s3 suggest people who saw it most likely thought?"

---

## What would get each topic over the bar

1. **Shape (both topics):** turn g2 into spec 14's "second example, new setting". It should be a different use of the idea, not the same question in another place, so the hook, spot and g1 carry the core fact at most twice (R2).
2. **Per item:** apply the five-word "question it actually asks" check from the pattern section. Every pair named above fails it.
3. **Validator:** add a match-ambiguity check (each left side fits exactly one right side; reviewer-flagged at minimum).
4. **Cut** every percent-on-a-statistic item labelled transfer or estimate (habits-15, confirmation-bias-12, social-proof-12, sleep-memory-12, if-then-plans-15, and the Money ones that test arithmetic, not the idea: risk-return-9, loan-emi-11).
5. **Money only:**
   - Fix the tracking-difference term.
   - Teach fees as a cost of borrowing, and refilling the fund.
   - Explain Chakshu in a teach card.
   - Add the task-scam and digital-arrest cases.

Re-review after the next pass. The bar stays fresh ≥ 4 and taught ≥ 4 on every concept.
