# cj10 fact-check: Moti's recall pieces

Job 2 of batch 10. Draft: `content-drafts/moti/recall-pieces.json` (branch `ideas/cj9-moti-pieces`).
Spec: `docs/specs/26-moti-haveli-kachhua-kolam.md` §A1. Packs: `topic.psychology.json`, `topic.money-markets.json`.
Corrected copy: `content-drafts/moti/recall-pieces.checked.json`.

Checks: (1) takeaway true to the cited claim and its source; (2) 3 pieces join exactly and each is a real chunk;
(3) each decoy is that idea's misconception (id exists), fits its slot, tempts, is clearly false, fix line accurate;
(4) money items: no return promise, no product advice, not advice; (5) wording rules.

## Result

| Verdict | Count | Items |
|---|---:|---|
| PASS | 9 | habits, confirmation-bias, social-proof, variable-rewards, if-then-plans, risk-return, shares, index-funds, upi-scams |
| FIX | 11 | loss-aversion, anchoring, planning-fallacy, sleep-memory, spotlight-effect, inflation, compounding, rule-of-72, diversification, emergency-fund, loan-emi |
| DROP | 0 | none |

Checked file validation (Python, against both packs): parses as JSON; 20 items; every `pieces` joins with
single spaces to `takeaway`; 3 pieces each; every `claimId` and `misconceptionId` exists on its concept; every
`fix` equals that misconception's `correction` in the pack; no "wrong", "should" or "your brain" in any
takeaway, piece, decoy or fix. All 40 decoy sentences were rebuilt and read in their slots.

Edited takeaways carry `"edited": true` and `"original"` (the pack line), as the cj9 report anticipated.
Because these 4 edits change the line away from the pack's step `takeaway`, editors should change the pack
step line too, or the haveli line will differ from the lesson line. This job did not touch `content/`.

## Sources that could not be opened

| Source | URL | What happened | Effect |
|---|---|---|---|
| Brown et al. 2024 (JEL) | https://doi.org/10.1257/jel.20221698 | 403 at pubs.aeaweb.org | Used the authors' open working paper instead (below). |
| Gollwitzer & Sheeran 2006 | https://doi.org/10.1016/S0065-2601(06)38002-1 | Paywalled; not opened | if-then checked against Parks-Stamm 2007 (open copy). |
| NPCI Fraud Awareness | https://www.npci.org.in/fraud-awareness | Page renders by script; no text | UPI checked against the RBI release. |
| NPCI UPI Safety Shield | https://npci.org.in/what-we-do/upi/upi-safety-shield | Same; text seen only in a search snippet | Not quoted as verified. |
| PubMed pages | pubmed.ncbi.nlm.nih.gov | Cookie wall | Abstracts read through NCBI E-utilities (same text). |
| Investor.gov pages | investor.gov | 403 to the fetch tool | Opened with a normal browser user agent via curl. |

Open copies used (legal, author or institution hosted):
- Lally et al. 2010: https://repositorio.ispa.pt/server/api/core/bitstreams/370f1dca-cc04-4d3d-a0f0-36d16109ec37/content
- Brown, Imai, Vieider, Camerer, working paper 2021: https://epub.ub.uni-muenchen.de/75121/1/275.pdf
- Dawson, Gilovich, Regan 2002: https://web.mit.edu/curhan/www/docs/Articles/biases/Dawson_Gilovich_Regan_Motivated_Reasoning_and_Wason_Selection_Task.pdf
- Buehler, Griffin, Ross 1994: https://bear.warrington.ufl.edu/brenner/mar7588/Papers/buehler-et-al-1994.pdf
- Parks-Stamm, Gollwitzer, Oettingen 2007: https://www.socmot.uni-konstanz.de/sites/default/files/07_ParksStamm_Gollwitzer_Oettingen_Action_control_by_imp.pdf
- RBI "I Can Do": https://www.rbi.org.in/FinancialEducation/content/I%20Can%20Do_RBI.pdf

---

## Psychology

### 1. habits — PASS

| Check | Result |
|---|---|
| 1 Source | Lally 2010 abstract: "The time it took participants to reach 95% of their asymptote of automaticity ranged from 18 to 254 days" and "Missing one opportunity to perform the behaviour did not materially affect the habit formation process." Matches "Give it weeks" and "one missed day". |
| 2 Pieces | `Give it weeks, and` / `do not worry about` / `one missed day.` Joins. Fine. |
| 3 Decoys | m1 slot 0 "Give it exactly 21 days, and…": real myth, tempting, clearly false (18 to 254). m2 slot 1 "…expect progress to vanish after one missed day.": matches m2. Fix lines match Lally. |
| 5 Wording | OK. |

### 2. loss-aversion — FIX

| Check | Result |
|---|---|
| 1 Source | Working paper abstract (https://epub.ub.uni-muenchen.de/75121/1/275.pdf): "We examine 607 empirical estimates of loss aversion from 150 articles … the mean loss aversion coefficient is between 1.8 and 2.1." The paper studies "heterogeneity of reported estimates across studies". Claim c3 says "The figures varied from study to study." The draft's "people differ" is about persons; the cited claim is about studies. |
| Fix | Takeaway → "On average a loss weighs about twice a gain; estimates vary." Last piece `estimates vary.` Meaning kept, now matches c3. |
| 3 Decoys | m1 "the same as a gain;" and m2 "everyone feels it identically." both still read as clear misreadings. Fix lines unchanged. |

### 3. anchoring — FIX

| Check | Result |
|---|---|
| 1 Source | OpenStax (https://openstax.org/books/introduction-philosophy/pages/2-2-overcoming-cognitive-biases-and-engaging-in-critical-reflection): "the experimenters spun a wheel of fortune … that produced a random number between 0 and 100"; "For subjects receiving an initial value of 10, the median estimate of nations was 25, while for subjects receiving an initial value of 65, the median estimate was 45." The source says "random", the draft says "made-up". |
| Fix 1 | Takeaway → "Even a random number can tug your guess toward it." (matches the step title "Even a random number pulls"). |
| 3 Decoys | m1 decoy "Only a fair number can…" does not express m1 ("First means fair" = treating the first number as the fair value); it claims unfair numbers have no pull, which is m2's idea. |
| Fix 2 | Replace with m5 ("An anchor fixes the answer"), slot 2: "exactly onto it." → "Even a random number can tug your guess exactly onto it." Fix: m5 correction. m2 decoy reworded to "A random number can never" (was "never can"). |

### 4. confirmation-bias — PASS

| Check | Result |
|---|---|
| 1 Source | Dawson et al. 2002: "any rule that follows the form 'if p then q' is tested by turning over p and not-q, the only two cards that can falsify the rule." and "the appropriate strategy for solving the four-card Wason selection task is to seek disconfirmation". |
| 2 Pieces | Clean chunks. |
| 3 Decoys | m1 "…that seems to fit once." and m2 "…ignore any case that could break it." Both fit, tempt, and are clearly false. |

### 5. social-proof — PASS

| Check | Result |
|---|---|
| 1 Source | OpenStax Psychology 2e 12.4 (https://openstax.org/books/psychology-2e/pages/12-4-conformity-compliance-and-obedience): people conform "because they believe the group is competent and has the correct information", especially when "the task or situation is ambiguous". "can pull" is a fair hedge. |
| 3 Decoys | m2 "cannot influence" and m3 "only a weak person's pick." Both fine. m3 names a stereotype only to correct it; the fix line rejects it. |
| Note | Takeaway drops "when unsure". Still true because of "can". |

### 6. planning-fallacy — FIX

| Check | Result |
|---|---|
| 1 Source | Buehler et al. 1994: "In Study 4, the optimistic bias was eliminated for Ss instructed to connect relevant past experiences with their predictions." But also: "although the completion estimates were less biased in the recall-relevant condition … they were not more strongly correlated with actual completion times, nor was the absolute prediction error any smaller." |
| Problem | Draft "Past tasks show how long the next one may take." claims accuracy. The source shows the average too-short bias went away, not that guesses became accurate. Claim c3 says only "removed the too-short bias". |
| Fix | Takeaway → "Linking past tasks to a new plan can end too-short guesses." Pieces `Linking past tasks` / `to a new plan` / `can end too-short guesses.` |
| 3 Decoys | Re-slotted to fit: m2 slot 2 "does nothing for guesses."; m3 slot 2 "is pointless, since delays are flukes." (Buehler: Ss "attributed their past prediction failures to relatively external, transient, and specific factors"). Fix lines unchanged. Minor: m2's fix ("can show steps a new plan has missed") is a fair gloss, not a quote. |
| Pack note | The pack step `planning-fallacy-s3` takeaway has the same overreach. |

### 7. sleep-memory — FIX

| Check | Result |
|---|---|
| 1 Source | Rasch & Born 2013 (https://pmc.ncbi.nlm.nih.gov/articles/PMC3768102/): "Memory functions comprise three major subprocesses, i.e., encoding, consolidation, and retrieval." and "During consolidation, the labile memory trace is gradually stabilized." Takeaway holds. No health claim. |
| 3 Decoys | m2 decoy "Skip learning first;" does not mention sleep, so it does not carry m2 ("Sleep teaches unseen material") and is not tempting. |
| Fix | m2 decoy → "Let sleep do the learning;" (slot 0). m4 "firms up at once." stays. |

### 8. variable-rewards — PASS

| Check | Result |
|---|---|
| 1 Source | OpenStax Psychology 2e 6.3 (https://openstax.org/books/psychology-2e/pages/6-3-operant-conditioning): variable ratio, "Reinforcement is delivered after an unpredictable number of responses"; fixed ratio, "after a predictable number of responses". |
| 3 Decoys | m1 "after every single try." (continuous) and m4 "after every fifth try." (fixed). Both clearly not variable. The comma before "after" is fine. |

### 9. if-then-plans — PASS

| Check | Result |
|---|---|
| 1 Source | Parks-Stamm et al. 2007: "implementation intention participants achieved a better identification performance for those five–letter words (planned cues) … but were worse in the identification of other five–letter words (alternative cues)." Supports "a clear moment is easy to notice" (vs a mere goal) and m3's fix. Gollwitzer & Sheeran 2006 not opened (paywall). |
| 3 Decoys | m1 "a broad wish names the moment." and m3 "one named cue never hides chances." Both fit and are false per the source. |
| Note | "easy to notice / easy to miss" is absolute; the study is comparative. Acceptable at this level. |

### 10. spotlight-effect — FIX

| Check | Result |
|---|---|
| 1 Source | Savitsky, Epley, Gilovich 2001 (abstract via https://pubmed.ncbi.nlm.nih.gov/11474724/): "Four studies demonstrate that these fears are commonly exaggerated"; actors "anticipated being judged more harshly by others than they actually were." "usually" ≈ "commonly". Takeaway holds. |
| 3 Decoys | m1 decoy "notice every slip and judge" built "Others usually notice every slip and judge more kindly than we fear." The second half is the true idea, so the sentence is not clearly false. |
| Fix | m1 decoy → slot 2 "with all eyes on them." → "Others usually judge our slips with all eyes on them." Gilovich et al. 2000 (https://pubmed.ncbi.nlm.nih.gov/10707330/): "people overestimate the extent to which their actions and appearance are noted by others". m3 decoy stays. |

## Money

### 11. inflation — FIX

| Check | Result |
|---|---|
| 1 Source | IMF (https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/inflation): "If nominal incomes do not increase as much as prices, purchasing power and real (inflation-adjusted) income fall." Takeaway holds. |
| 3 Decoys | m2 "you buy the same goods." is ambiguous: a person can still buy the same goods by spending more, so it is not clearly false. |
| Fix | m2 decoy → "you can buy just as much." m3 "any raise puts you ahead." stays. |
| 4 Money | No promise, no product. OK. |

### 12. compounding — FIX

| Check | Result |
|---|---|
| 1 Source | Investor.gov (https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/small-savings-add-big-money): "With compound interest, you earn interest on the money you save and on the interest that money earns." Takeaway holds. |
| 2 Pieces | `Gains you leave in start` / `to earn` breaks "start to earn"; `to earn` is not a chunk. |
| Fix | Pieces → `Gains you leave in` / `start to earn` / `gains too.` Decoys re-fit: m1 slot 0 "Only the sums you put in" ("Only the sums you put in start to earn gains too."); m4 slot 2 "nothing of their own." Fix lines unchanged. |
| 4 Money | Describes a mechanism; no promised return. OK. |

### 13. rule-of-72 — FIX

| Check | Result |
|---|---|
| 1 Source | FINRA (https://syndication.finra.org/content/financial-education-kids-creating-path-financial-fluency): "Teach kids the Rule of 72, which can help them estimate how long it will take to double their money." "Divide 72 by the interest rate received on savings or investments." |
| 2 Pieces | `is about 72 divided` / `by the rate.` splits "divided by". |
| Fix | Pieces → `Years to double` / `is about 72` / `divided by the rate.` Decoys re-fit: m1 slot 1 "is exactly 72"; m2 slot 2 "divided by any market rate." |
| 3 Note | m2's fix ("Market gains can vary; the shortcut needs a steady assumed rate") is not on the FINRA page. Investor.gov (https://www.investor.gov/introduction-investing): "Markets fluctuate over time, and individual investments may lose value." Supports the first half; the second half is plain maths. Acceptable. |
| 4 Money | "estimate" keeps it a what-if. OK. |

### 14. risk-return — PASS

| Check | Result |
|---|---|
| 1 Source | Investor.gov asset guide (https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset): "Stocks have historically had the greatest risk and highest returns among the three major asset categories." "What is Risk?" (https://www.investor.gov/introduction-investing/investing-basics/what-risk): "as investment risks rise, investors seek higher returns to compensate themselves for taking such risks." |
| 3 Decoys | m1 "guarantees gains without" and m2 "rules out all losses despite". Fit; clearly false. |
| 4 Money | "A chance of more gain" is not a promise. OK. |

### 15. diversification — FIX

| Check | Result |
|---|---|
| 1 Source | Investor.gov asset guide: "the stock portion of your investment portfolio won't be diversified … if you only invest in only four or five individual stocks." "You'll need at least a dozen carefully selected individual stocks to be truly diversified." "One way of diversifying … is to identify and invest in a wide range of companies and industry sectors." Takeaway holds and avoids the firm count. |
| 3 Decoys | m1 "one firm alone across" built "one firm alone across many different industries", which reads like a conglomerate and is muddled. |
| Fix | m1 decoy → slot 1 "one strong firm, not" → "A real spread means one strong firm, not many different industries." m3 "just one industry." stays. |
| 4 Money | Definition, not a buy list. OK. |

### 16. shares — PASS

| Check | Result |
|---|---|
| 1 Source | SEBI (https://investor.sebi.gov.in/understandings_shares.html): "Shares are like owning a piece of a company." "The more shares you have, the bigger piece you own." |
| 3 Decoys | m1 "Each share is a loan;" and m4 "your count alone guarantees". Fit and tempt. |
| 5 Note | "more shares means" is informal; the teach line uses "mean". Left as is (pack line). |

### 17. emergency-fund — FIX

| Check | Result |
|---|---|
| 1 Source | RBI "I Can Do" p. "Where to save?": "Money in the emergency fund should be kept in a savings account—separate from your other savings accounts—that is easily accessible." Takeaway content holds. |
| 4 Money | "Keep it in a separate savings account…" is a direct instruction with no source named. Out of context it reads as advice. "it" also has no noun. |
| Fix 1 | Takeaway → "An RBI guide puts the fund in a separate savings account you can reach fast." Pieces `An RBI guide puts the fund in` / `a separate savings account` / `you can reach fast.` Meaning kept; now attributed, like claim c4 ("The guide says…"). |
| 3 Decoys | m1 decoy "even if you cannot reach it." does not carry m1 ("Any savings will do", hard-to-sell assets). |
| Fix 2 | m1 decoy → slot 1 "gold or land" → "An RBI guide puts the fund in gold or land you can reach fast." Tempting, clearly false (the step teaches that gold or land need a buyer). m4 "only if it pays the most." stays. |

### 18. loan-emi — FIX

| Check | Result |
|---|---|
| 1 Source | RBI housing loan FAQ (https://www.rbi.org.in/Scripts/FS_FAQs.aspx?Id=77&fn=2754): "The longer the tenure of the loan, the lesser will be your monthly EMI outflow." "But longer tenures mean payment of larger interest towards the loan and make it more expensive." |
| 3 Decoys | m4 decoy "always raises the rate" built "A longer loan always raises the rate but raises the total interest." Two "raises", and it drops the EMI half. Not a clean sentence. |
| Fix | m4 decoy → slot 2 "but raises the interest rate." → "A longer loan lowers each EMI but raises the interest rate." Close to the truth, so tempting; the source ties the extra cost to more interest paid, not a higher rate. m2 "and cuts the total interest." stays. |

### 19. index-funds — PASS

| Check | Result |
|---|---|
| 1 Source | SEBI (https://investor.sebi.gov.in/index_mutual_fund.html): index funds "aim to replicate the performance of a specific stock market index"; tracking error is "The slight difference between the fund's performance and the index it tracks due to expenses or operational inefficiencies." |
| 3 Decoys | m1 "only rises with its index," and m3 "with no gap at all." Fine. |
| 4 Money | No product named, no return promised. |
| Note | SEBI says "difference", the takeaway says "minus". Since the cause is expenses, "minus" is fair. |

### 20. upi-scams — PASS

| Check | Result |
|---|---|
| 1 Source | RBI release (https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=53185): "Transactions involving receipt of money do not require scanning barcodes / QR codes or entering MPIN." NPCI pages could not be opened (script-rendered). |
| 3 Decoys | m1 "always needs it." and m5 "requires a QR scan and PIN." Fit; clearly false per RBI. |
| Note | "Your PIN approves payments" is not in claim c3. A search snippet of NPCI's UPI Safety Shield reads "Enter UPI PIN ONLY to deduct money from your account. UPI PIN is NOT required for receiving money." Editors may add that page as a source once it can be checked. |

---

## List of fixes applied in the checked file

| # | Item | Change |
|---|---|---|
| 1 | loss-aversion | Takeaway "…people differ." → "…estimates vary." (edited) |
| 2 | anchoring | Takeaway "made-up" → "random" (edited); m1 decoy replaced by m5 "exactly onto it." (slot 2); m2 decoy "A random number can never" |
| 3 | planning-fallacy | Takeaway → "Linking past tasks to a new plan can end too-short guesses." (edited); both decoys re-fit to slot 2 |
| 4 | sleep-memory | m2 decoy → "Let sleep do the learning;" |
| 5 | spotlight-effect | m1 decoy → "with all eyes on them." (slot 2) |
| 6 | inflation | m2 decoy → "you can buy just as much." |
| 7 | compounding | Re-split pieces; m1 decoy "Only the sums you put in"; m4 decoy "nothing of their own." (slot 2) |
| 8 | rule-of-72 | Re-split pieces; m1 "is exactly 72"; m2 "divided by any market rate." |
| 9 | diversification | m1 decoy → "one strong firm, not" |
| 10 | emergency-fund | Takeaway attributed to the RBI guide (edited); m1 decoy → "gold or land" (slot 1) |
| 11 | loan-emi | m4 decoy → "but raises the interest rate." (slot 2) |

## For the editors

- Four takeaways now differ from the pack step lines (loss-aversion-s3, anchoring-s2, planning-fallacy-s3,
  emergency-fund-s3). Update those steps or revert the edits; the haveli line and lesson line should match.
- Sources to add or repair: an open link for Brown et al. 2024 (the LMU working paper above), and NPCI's UPI
  Safety Shield page for "PIN approves payments".
