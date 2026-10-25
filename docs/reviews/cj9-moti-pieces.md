# Moti haveli recall pieces review

Draft source: `content/topics/topic.psychology.json` and `content/topics/topic.money-markets.json`. Each item uses one existing step takeaway verbatim and the selected step's `claimId`. Each decoy points to a misconception on the same concept; its `fix` is copied from that misconception's correction. This is editorial draft content for A1, not a change to the packs.

## Coverage

| Topic | Concepts | Eligible | Drafted | Skipped |
| --- | ---: | ---: | ---: | ---: |
| Human psychology | 10 | 10 | 10 | 0 |
| Money and markets | 10 | 10 | 10 | 0 |
| **Total** | **20** | **20** | **20** | **0** |

**Skipped concepts:** none. Every concept has at least one step takeaway and at least two misconceptions. No takeaway required editing, so there are no `edited`/`original` fields.

## Five sample items

The slot number is zero based. The complete 20-item draft, including every `fix`, is in `content-drafts/moti/recall-pieces.json`.

### 1. Habits

- Takeaway: “Give it weeks, and do not worry about one missed day.”
- Pieces: `Give it weeks, and` / `do not worry about` / `one missed day.`
- Decoys: slot 0 `Give it exactly 21 days, and` (`habits-m1`, fix: “Habit time varies by person and act; there is no fixed day count.”); slot 1 `expect progress to vanish after` (`habits-m2`, fix: “One missed chance did not wipe out habit growth in the study.”)
- Claim: `habits-c2`

### 2. Confirmation bias

- Takeaway: “To test an idea, look for the case that could break it.”
- Pieces: `To test an idea,` / `look for the case` / `that could break it.`
- Decoys: slot 2 `that seems to fit once.` (`confirmation-bias-m1`, fix: “One fitting case may fit more than one idea.”); slot 1 `ignore any case` (`confirmation-bias-m2`, fix: “A case against an idea can test it well.”)
- Claim: `confirmation-bias-c2`

### 3. Variable rewards

- Takeaway: “Variable means the reward comes, but you cannot tell when.”
- Pieces: `Variable means` / `the reward comes,` / `but you cannot tell when.`
- Decoys: slot 2 `after every single try.` (`variable-rewards-m1`, fix: “A good result can come after dull ones, with no set gap.”); slot 2 `after every fifth try.` (`variable-rewards-m4`, fix: “A reward after every fifth try is fixed; on a variable schedule, the number of tries keeps changing.”)
- Claim: `variable-rewards-c3`

### 4. Compounding

- Takeaway: “Gains you leave in start to earn gains too.”
- Pieces: `Gains you leave in start` / `to earn` / `gains too.`
- Decoys: slot 0 `Only the original amount starts` (`compounding-m1`, fix: “When gains stay in the pot, later gains can build on them too.”); slot 0 `Past gains never start` (`compounding-m4`, fix: “Compound growth includes gains on past gains as well as on the starting amount.”)
- Claim: `compounding-c1`

### 5. UPI scams

- Takeaway: “Your PIN approves payments. Receiving money never needs it.”
- Pieces: `Your PIN approves payments.` / `Receiving money` / `never needs it.`
- Decoys: slot 2 `always needs it.` (`upi-scams-m1`, fix: “To get money, a person need not key in a UPI PIN.”); slot 2 `requires a QR scan and PIN.` (`upi-scams-m5`, fix: “A QR scan and UPI PIN can make a payment; getting money needs neither.”)
- Claim: `upi-scams-c3`

## Takeaways that were hard to split

- `sleep-memory`: “Learn first; the memory firms up later.” is short. The middle piece, `the memory`, is a noun phrase; each piece still has at least two words and the line stays verbatim.
- `rule-of-72`: “Years to double is about 72 divided by the rate.” has a formula that reads across the second and third pieces. `by the rate.` stays together to preserve the divisor.
- `upi-scams`: the pack's takeaway is two sentences. The first piece is the first sentence; the second and third pieces form the second sentence.

## Validation

Node validation of the draft against both source packs: **PASS (0 errors)**. It found 20 eligible concepts and 20 drafted items (10 per topic), with 0 skipped. Checks covered exact piece joining, three pieces of 2–7 words, two distinct valid misconception IDs per concept, valid slots, nonmatching decoys, decoy lengths, fixes drawn from the cited corrections, and source takeaway/claim IDs. All 40 reconstructed decoy sentences were also read in their slots.
