# Variety review: Human psychology

File reviewed: `content/topics/topic.psychology.json`.
The file is the same on `origin/main` (78d1a28) and `origin/learn-steps` (a4ffec9),
so this one review covers both.
Date: 2026-10-21. Review only. No app code or content JSON was changed.

Why this review: a learner said the questions for one idea "all feel the same".
Psychology was the pilot for steps (spec 14), so every concept here already has `steps[]`.
But the new rules on `learn-steps` (`src/data/packs/validate.ts`) say a stepped idea needs:
- at least 3 fact-checked claims,
- each step teaches its own claim (no two steps share a `claimId`),
- at most 3 questions per step (target 3/3/2).

Today 9 of 10 concepts break at least one of these rules.

How to read this:
- "Idea tested" is what a learner must know to get the item right.
- "Repeat" means two or more items test the same idea, even in different formats.
- "No claim" means an item tests a fact that is not in any claim of the concept.
- Diagram: flow (A then B then C), compare (two cases side by side), scale (a number line or size).

## Important: how sources were checked in this run

This container could not open web pages. Direct fetches failed
(`getaddrinfo ENOTFOUND` for pubmed, pmc, openstax, apa.org; the proxy refused curl).
Only web search worked. So:
- **No URL in the topic file could be tested for "dead or alive" today.** See "Source URLs" below.
- **Every proposed claim is marked "page not opened".** The evidence shown is what web search
  returned (abstracts, catalog entries, summaries). It is not a quote copied from the page.
- Before any proposed claim goes into the JSON, someone must open the named page and copy the
  exact words. Where search sources disagreed, I say so.
- Where I found nothing I trust, I wrote "no source found".

To fix: allow these hosts in the environment's network settings and re-run the source step:
pubmed.ncbi.nlm.nih.gov, pmc.ncbi.nlm.nih.gov, openstax.org, www.apa.org, web.mit.edu,
doi.org, repositorio.ispa.pt, www.socmot.uni-konstanz.de, dornsife.usc.edu, aeaweb.org.

## Summary

| concept id | claims now | repeats found | claims proposed | ready for 3 steps? |
|---|---|---|---|---|
| habits | 3 | 3 groups, 7 of 8 items (1/4/6, 2/7, 5/8) | 2 (c4, c5) | yes (re-split; c4 better) |
| loss-aversion | 2 | 3 groups, 7 of 8 items (1/2/5, 4/6/8, 3/7) | 2 (c3, c4) | no (needs c3 opened) |
| anchoring | 2 | 3 groups, 7 of 8 items (1/2/6/8, 3/5, 4/7) | 2 (c3, c4) | no (needs c3 opened) |
| confirmation-bias | 2 | 3 groups, 8 of 8 items (1/6/7/8, 2/4/5, 3) | 2 (c3, c4) | no (needs c3 opened) |
| social-proof | 4 (3 distinct) | 2 groups, 5 of 8 items (1/5/8, 4/7) | 1 (c5) + drop c2 | yes (move 1 item) |
| planning-fallacy | 4 (3 distinct) | 2 groups, 5 of 8 items (2/4/5, 1/8) | 0 + merge c2 into c4 | yes (already 2/3/3) |
| sleep-memory | 3 | 2 groups, 6 of 8 items (1/5/8, 2/4/6) | 1 spare (c4) | yes (move 1, add 1 item) |
| variable-rewards | 3 | 3 groups, 7 of 8 items (1/2/8, 4/6, 5/7) | reword c2 | yes (c2 wording weak) |
| if-then-plans | 3 | 2 groups, 4 of 8 items (1/4, 2/5) | 0 | yes (move 1 item) |
| spotlight-effect | 2 | 3 groups, 7 of 8 items (1/4/6, 2/5/8, 3) | 2 (c3, c4) | no (needs c3 opened) |

"Ready" means the concept already has 3 distinct, fact-checked claims, so 3 steps can be
built today by re-tagging items. "No" means it needs a new claim, and that claim's page
was not opened in this run.

Rule breaks found today (validator on `learn-steps`):

| concept | under 3 claims | two steps share a claim | step over 3 items |
|---|---|---|---|
| habits | - | s1, s2 both c1 | - |
| loss-aversion | yes (2) | - (only 2 steps) | s1 = 4, s2 = 4 |
| anchoring | yes (2) | - (only 2 steps) | s1 = 5 |
| confirmation-bias | yes (2) | - (only 2 steps) | s1 = 4, s2 = 4 |
| social-proof | - | - | s2 = 4 |
| planning-fallacy | - | - | - (2/3/3, OK) |
| sleep-memory | - | - | s2 = 4 |
| variable-rewards | - | - | - (3/3/2, OK) |
| if-then-plans | - | - | s1 = 4 |
| spotlight-effect | yes (2) | s1, s3 both c1 | s1 = 4 |

Pattern across the topic (the same cause as "inflation"):
- Four concepts have only 2 claims and only 2 steps, so 8 items sit on 2 facts.
- Every concept has a `fill-the-step` item that just asks for the name ("anchor", "loss",
  "consolidation"). It repeats the `choose` or `explain-it-back` item.
- Every `explain-it-back` item repeats the `predict` item in other words.
- Some claims say the same thing twice (social-proof c2 = c4; planning-fallacy c2 ≈ c4).
  They count toward "3 claims" but do not add a new idea.
- No item relies on ego depletion or power posing. Findings that need care are noted per concept:
  loss aversion (size disputed), Lally (small study, not yet replicated), spotlight (no large
  independent replication found), Asch (conformity fell over the decades).

---

## 1. habits (Habits)

Claims now (3):
- c1: Cues in a stable setting can bring back a learned action.
- c2: In Lally's study, modeled times ranged from 18 to 254 days; one missed chance did not undo habit growth.
- c3: In that study, the typical time to near full habit strength was 66 days.

Steps now: s1 (c1) = 1, 4, 6. s2 (c1) = 5, 8. s3 (c2) = 2, 3, 7.
**Break:** s1 and s2 both teach c1. s2 "repeats make it stronger" has no claim of its own.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| habits-1 | predict | s1 | Dinner and the desk are the cue (c1) |
| habits-2 | scenario | s3 | One missed day does not undo the habit (c2) |
| habits-3 | estimate | s3 | Typical time was 66 days (c3) |
| habits-4 | choose | s1 | Bag on the hook is the cue (c1) |
| habits-5 | why | s2 | New room = old cue gone, so less practice (c1) |
| habits-6 | fill | s1 | A cue is part of the moment before the act (c1) |
| habits-7 | true-not-quite | s3 | No fixed day count for everyone (c2) |
| habits-8 | order | s2 | Cue, then act, then a small lift grows the link (c1; "lift" = no claim) |

Repeats:
- "A cue in the setting starts it": 1, 4, 6.
- "Time varies, no 21-day rule": 7 and the wrong options of 3.
- "Same setting, repeated": 5, 8 both lean on c1 only.
- No claim: the reward "small lift" in 8. Moving to a new place (5) is only implied by c1.

Proposed claims:
- **c4: Early repeats build a habit fastest. Later repeats add less, so habit strength levels off.**
  - Source: Lally et al. 2010, Eur. J. Soc. Psychol. (already in file as `lally`).
    https://repositorio.ispa.pt/server/api/core/bitstreams/370f1dca-cc04-4d3d-a0f0-36d16109ec37/content
  - Search evidence (page not opened): the paper reports automaticity "followed an asymptotic curve",
    with early repetitions giving larger increases than later ones.
  - Care: 96 people took part; the 66-day median comes from the subset whose curves fit well
    (about 39). A 2024 replication preprint notes the study has not been replicated yet.
- **c5: When students moved to a new college, old habits often broke. They held when the setting stayed the same.**
  - Source: Wood, Tam and Guerrero Witt 2005, "Changing circumstances, disrupting habits", JPSP 88(6).
    https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/Wood.Tam_.GuerreroWitt.2005_Changing_circumstances_disrupting_habits.pdf
  - Search evidence (page not opened): students who transferred universities were tracked for exercise,
    newspaper reading and TV. Habits held only when parts of the context did not change
    (for example, still reading the paper with others).
  - Indian fit: a move from home to a hostel.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | A cue starts a habit | c1 | name the cue before a habit | flow (cue -> act -> link) | 1, 4, 8 |
| s2 | Early repeats count most | c4 (or c5) | say why a new habit grows fast, then slows | scale (repeats vs strength curve) | 5 + 1 new (c4) |
| s3 | It takes weeks, and one miss is fine | c2 (c3 as detail) | reject the 21-day rule; keep going after a miss | scale (18 ... 66 ... 254 days) | 2, 3, 7 |

- Leftover: 6 (repeat of 1/4). Drop, or rewrite it to test c4.
- If c4 cannot be confirmed, use c5 for s2: item 5 already fits it.
- Without any new claim, a legal split is s1 c1 (1, 4, 5), s2 c3 (3, 7), s3 c2 (2) + 1 new item.

---

## 2. loss-aversion (Loss aversion)

Claims now (2):
- c1: Prospect theory treats gains and losses relative to a reference point.
- c2: Losses can weigh more than equal gains in choice.

Steps now: s1 (c2) = 1, 2, 3, 7. s2 (c1) = 4, 5, 6, 8.
**Break:** only 2 claims and 2 steps; both steps carry 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| loss-aversion-1 | predict | s1 | Losing one token feels bigger than winning one (c2) |
| loss-aversion-2 | scenario | s1 | Fear of losing the ₹50 she holds (c2) |
| loss-aversion-3 | estimate | s1 | If a loss weighs 2x, you need 20 points to balance 10 (no claim for "2x") |
| loss-aversion-4 | choose | s2 | "Keep five" vs "lose five": only wording changed (c1) |
| loss-aversion-5 | why | s2 | Losing from what you hold feels heavier (c2, tagged to s2) |
| loss-aversion-6 | fill | s2 | Below the start = a loss (c1) |
| loss-aversion-7 | true-not-quite | s1 | "Exactly twice" is an average; people differ (no claim) |
| loss-aversion-8 | match | s2 | 10 -> 11 is a gain, 10 -> 9 is a loss (c1) |

Repeats:
- "A loss feels bigger": 1, 2, 5.
- "Gain or loss depends on the start": 4, 6, 8.
- "About twice, on average": 3, 7. No claim gives this number. Kahneman and Tversky 1979
  (the only source) gives no "2x" figure.

Proposed claims:
- **c3: On average, a loss weighs about twice as much as a gain of the same size. People vary.**
  - Source: Brown, Imai, Vieider and Camerer 2024, "Meta-analysis of Empirical Estimates of Loss Aversion",
    Journal of Economic Literature 62(2): 485-516. https://www.aeaweb.org/doi/10.1257/jel.20221698
    Open copy: https://epub.ub.uni-muenchen.de/75121/1/275.pdf
  - Search evidence (page not opened): 607 estimates from 150 articles; mean loss aversion
    coefficient 1.955, 95% interval about 1.82 to 2.10. Tversky and Kahneman 1992 gave 2.25.
  - Care: Gal and Rucker 2018 (J. Consumer Psychology 28(3)) argue loss aversion is
    over-generalised and depends on the situation. Teach "about twice, on average", never "always".
- **c4: People given a mug asked about twice as much to sell it as others would pay to buy it.**
  - Source: Kahneman, Knetsch and Thaler 1990, "Experimental Tests of the Endowment Effect and the
    Coase Theorem", J. Political Economy 98(6).
    https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Behavioral_Decision_Theory/Kahneman_et_al_1990_Experimental_tests.pdf
  - Search evidence (page not opened): sellers would not sell below about $5.25; buyers would not
    pay above about $2.25-2.75. Secondary sources give other medians ($7 vs $3). Copy the paper's own table.
  - Care: some researchers explain this by ownership, not loss aversion. Teach it as "owning changes value".

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | A loss feels bigger than a gain | c2 | spot the pull of a possible loss | compare (lose ₹50 vs win ₹50) | 1, 2, 5 |
| s2 | It depends on where you start | c1 | reframe one result as gain or loss | scale (start point, up = gain, down = loss) | 4, 6, 8 |
| s3 | About twice, on average | c3 | use "about 2x" and say people differ | scale (1x gain vs 2x loss bar) | 3, 7 |

- c4 (mug) is a spare for a new item, or a later review card. Good Indian swap: a cricket bat
  or a phone you already own.

---

## 3. anchoring (Anchoring)

Claims now (2):
- c1: A first number can pull a later guess toward it.
- c2: An anchor can pull a guess even when the first number is arbitrary.

Steps now: s1 (c1) = 1, 2, 4, 6, 8. s2 (c2) = 3, 5, 7.
**Break:** only 2 claims; s1 carries 5 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| anchoring-1 | predict | s1 | Crossed-out ₹900 sways the fair price (c1) |
| anchoring-2 | scenario | s1 | ₹2,000 vs ₹8,000 first pulls guesses apart (c1) |
| anchoring-3 | estimate | s2 | Random 65 led to typical guess of 45% (c2; figure from `tversky` source, not a claim) |
| anchoring-4 | choose | s1 | Check the same pen at another shop (no claim: how to resist) |
| anchoring-5 | why | s2 | Start from the number and adjust too little (c2) |
| anchoring-6 | fill | s1 | The first number is an "anchor" (c1) |
| anchoring-7 | true-not-quite | s2 | The seller chose the old price (no claim: who sets the anchor) |
| anchoring-8 | explain-it-back | s1 | First number pulls your guess (c1) |

Repeats:
- "First number pulls the guess": 1, 2, 6, 8.
- "Random number still pulls": 3, 5.
- "Check outside the anchor": 4, 7. No claim covers this.

Proposed claims:
- **c3: Even judges gave longer jail terms after they rolled dice that showed a high number.**
  - Source: Englich, Mussweiler and Strack 2006, "Playing Dice With Criminal Sentences",
    Personality and Social Psychology Bulletin 32(2): 188-200. https://journals.sagepub.com/doi/abs/10.1177/0146167205282152
  - Search evidence (page not opened), abstract: participants "assimilated toward" a sentencing demand
    "even if ... they randomly determined this demand themselves by throwing dice (Study 3)", and
    "Expertise and experience did not reduce this effect."
  - Teaches: knowing a lot does not switch anchoring off.
- **c4: Thinking of reasons the answer could be far from the anchor makes its pull smaller.**
  - Source: Mussweiler, Strack and Pfeiffer 2000, "Overcoming the inevitable anchoring effect:
    Considering the opposite compensates for selective accessibility", PSPB 26(9): 1142-1150.
    https://www.london.edu/faculty-and-research/academic-research/o/overcoming-the-inevitable-anchoring-effect--considering-the-opposi
  - Search evidence (page not opened): the title states the finding; summaries say targeted,
    question-specific "consider the opposite" prompts reduced anchoring. It did not remove it.
  - Note: the LBS page lists the wrong journal volume (78). Check the citation on the PDF.
- Replication: anchoring held up in Many Labs 1 (Klein et al. 2014, 36 samples, 6,344 people),
  per search summaries. Safe to teach.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | A first number pulls your guess | c1 | spot the anchor in a price tag | scale (guess slides toward ₹900) | 1, 2, 8 |
| s2 | Even a random number pulls | c2 (c3 as example) | say why a random or dice number still matters | compare (low anchor vs high anchor) | 3, 5 + 1 new (c3, judges) |
| s3 | Check against a second number | c4 | beat an anchor by checking elsewhere | flow (see anchor -> think opposite -> compare shop) | 4, 7 |

- Leftover: 6 (repeat of 8). Drop.

---

## 4. confirmation-bias (Confirmation bias)

Claims now (2):
- c1: People can focus on clues that fit a prior belief while missing other clues.
- c2: A test of an idea is stronger when it can find a case that goes against it.

Steps now: s1 (c1) = 1, 6, 7, 8. s2 (c2) = 2, 3, 4, 5.
**Break:** only 2 claims; both steps carry 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| confirmation-bias-1 | predict | s1 | She recalls the trick papers most (c1) |
| confirmation-bias-2 | scenario | s2 | Check rainy days when sales held up (c2) |
| confirmation-bias-3 | estimate | s2 | About 16% got the card puzzle right (no claim; figure not confirmed) |
| confirmation-bias-4 | choose | s2 | One good chase innings disproves "always flops" (c2) |
| confirmation-bias-5 | why | s2 | A non-red late bus could disprove the claim (c2) |
| confirmation-bias-6 | fill | s1 | Her pile tilts to what she believes (c1) |
| confirmation-bias-7 | true-not-quite | s1 | She dropped the logs that disagree (c1) |
| confirmation-bias-8 | explain-it-back | s1 | We notice what fits and skip the rest (c1) |

Repeats:
- "We notice what fits": 1, 6, 7, 8 (four items, one idea).
- "Look for the case that breaks it": 2, 4, 5.
- No claim: 3. The 16% figure is not in any claim. I could not confirm it in the `wason`
  source (Dawson, Gilovich and Regan 2002) by search. That paper compares threatening vs
  agreeable rules; its per-condition numbers did not show up. **Check the PDF before keeping 3.**

Proposed claims:
- **c3: In a number puzzle, most people only tested cases that fit their guess, so they missed the real rule.**
  - Source: Wason 1960, "On the failure to eliminate hypotheses in a conceptual task",
    Quarterly J. Exp. Psychology 12(3): 129-140. https://bear.warrington.ufl.edu/brenner/mar7588/Papers/wason-qjep1960.pdf
  - Search evidence (page not opened), abstract: of 29 subjects, 6 reached the correct rule with no
    wrong guess first; 13 made one wrong guess; 9 made two or more; 1 reached none.
    The rule was "any ascending sequence" (for 2-4-6).
  - Nice item: "6 of 29" = about 1 in 5 found it first time.
- **c4: When two groups read the same mixed evidence, each rated the study that agreed with it as stronger.**
  - Source: Lord, Ross and Lepper 1979, "Biased Assimilation and Attitude Polarization", JPSP 37(11).
    https://doi.org/10.1037/0022-3514.37.11.2098
  - Search evidence (page not opened): 48 students for and against a policy each read one study
    for and one against. Both sides rated the study that fit their view as more convincing,
    and said they felt more sure afterwards.
  - Care: people reported their own shift; their attitude was not re-measured. Say "said they felt".
  - Keep the topic neutral in items (for example, a cricket captain or a school rule), not the death penalty.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | We notice what fits | c1 | spot a one-sided pile of clues | compare (kept clues vs dropped clues) | 1, 7, 8 |
| s2 | We test only cases that fit | c3 | see why "fits again" proves little | flow (guess -> test fitting case -> wrong rule) | 3 (rewritten to Wason 2-4-6) + 1 new |
| s3 | Hunt for the case that breaks it | c2 | pick the test that could prove a claim wrong | compare (rainy days with good vs bad sales) | 2, 4, 5 |

- Leftover: 6 (repeat of 7). Drop. c4 is a spare for a new item or a later review.

---

## 5. social-proof (Social proof)

Claims now (4, but 3 distinct):
- c1: In Asch's line task, group answers sometimes pulled a person toward a wrong answer.
- c2: Group agreement is social input, not proof that a claim is true.
- c3: Seeing what many others choose can lean a person's own choice toward it.
- c4: A group can agree on a wrong answer, so agreement alone is a clue, not proof.

c2 and c4 say the same thing. Drop c2 (no step uses it).

Steps now: s1 (c3) = 2, 6. s2 (c1) = 1, 3, 5, 8. s3 (c4) = 4, 7.
**Break:** s2 carries 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| social-proof-1 | predict | s2 | Last student moves toward the wrong group (c1) |
| social-proof-2 | scenario | s1 | Cheers make the call feel more certain (c3, partly; "certain" no claim) |
| social-proof-3 | estimate | s2 | About 37% went along (c1; figure from `asch-original`) |
| social-proof-4 | choose | s3 | Whole class agrees, not proven right (c4) |
| social-proof-5 | why | s2 | Fitting in can beat what she sees (c1; motive is no claim) |
| social-proof-6 | fill | s1 | The crowd works as a social cue (c3) |
| social-proof-7 | true-not-quite | s3 | They may have copied each other (c4) |
| social-proof-8 | explain-it-back | s2 | A wrong group sometimes swayed people (c1) |

Repeats:
- "Wrong group pulls people": 1, 5, 8.
- "Agreement is not proof": 4, 7.

Proposed claim:
- **c5: When just one other person gave the right answer, far fewer people went along with the wrong group.**
  - Source: Asch 1955, "Opinions and Social Pressure", Scientific American 193(5): 31-35 (already in file as `asch-original`).
    https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Influence_Compliance/Asch_1955_Opinions_and_social_pressure.pdf
  - Search evidence (page not opened): summaries say yielding fell from about 37% to about 5%
    with a truthful partner; one study guide says "one fourth" of the usual rate. These disagree.
    **Copy the exact figure from the article.** Until then, teach "far fewer", no number.
  - Teaches something new: one ally breaks the pull. Good Indian scene: one friend in a WhatsApp group.
- Care (no new claim needed): Bond and Smith 1996 (Psych. Bulletin 119(1), 133 studies, 17 countries)
  found conformity on this task fell from the 1950s to the 1990s, and was higher in more collectivist
  cultures (search summary). Do not say "37% of people always conform".

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | A crowd's choice is a clue | c3 | spot a crowd nudging a choice | flow (crowd picks -> clue -> you lean) | 2, 6 |
| s2 | Even a wrong crowd can pull | c1 | say about 1 in 3 answers went along | scale (0% ... 37% ... 100%) | 1, 3, 5 |
| s3 | Agreement is not proof | c4 | ask "did they check, or copy?" | compare (checked agreement vs copied agreement) | 4, 7 |

- Leftover: 8 (repeat of 1/5). Rewrite it to test c5 (one ally), or drop it.

---

## 6. planning-fallacy (The planning fallacy)

Claims now (4, 3 distinct):
- c1: People can underguess how long their own tasks will take.
- c2: Plans can miss delays that happened in similar past work.
- c3: In one study, linking past tasks to a new plan made the too-short guesses go away.
- c4: When people plan, they picture the task going smoothly and leave delays out.

c2 and c4 overlap (both "delays get left out"). No step uses c2. Merge c2 into c4 or drop it.

Steps now: s1 (c1) = 1, 8. s2 (c4) = 2, 4, 5. s3 (c3) = 3, 6, 7. **Meets the rule (2/3/3).**

Items:

| id | type | step | idea tested |
|---|---|---|---|
| planning-fallacy-1 | predict | s1 | Chart takes longer than guessed (c1) |
| planning-fallacy-2 | scenario | s2 | She forgot finding past papers, so the guess is short (c4) |
| planning-fallacy-3 | estimate | s3 | Past 3, 4, 5 hours -> guess 4 (c3) |
| planning-fallacy-4 | choose | s2 | Printing images also needs time (c4) |
| planning-fallacy-5 | why | s2 | They left out a step (c4) |
| planning-fallacy-6 | fill | s3 | Look at how long old tasks actually took (c3) |
| planning-fallacy-7 | true-not-quite | s3 | Skips printing and ignores past times (c3 + c4) |
| planning-fallacy-8 | explain-it-back | s1 | Smooth path, so too little time (c1 + c4) |

Repeats:
- "A step got left out": 2, 4, 5 (and half of 7). Three forgotten-step stories in one step.
- "We guess too short": 1, 8.
- Data in teach card, not a claim: thesis 34 days guessed vs about 56 taken (Buehler et al. 1994,
  Study 1: 33.9 vs 55.5 days). Consider adding those numbers to c1.

Proposed claims: none needed. Optional: fold the 34 vs 56 days figure into c1.
Source to re-check: the file links a ResearchGate PDF, which often breaks.
Use the DOI instead: https://doi.org/10.1037/0022-3514.67.3.366.

3-step outline (keep the current one):

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | We guess too little time | c1 | expect a plan to run long | compare (guessed 34 days vs took 56) | 1, 8 |
| s2 | We picture a smooth path | c4 | list the hidden steps before guessing | flow (plan -> hidden step -> delay) | 2, 4, 5 |
| s3 | Past tasks give a better guess | c3 | use past times to set the guess | scale (3, 4, 5 hours -> 4) | 3, 6, 7 |

- For variety, rewrite 4 or 5 so s2 is not three "forgot a step" stories in a row
  (for example: "Which plan pictures a smooth path?").

---

## 7. sleep-memory (Sleep and memory)

Claims now (3):
- c1: Sleep after learning can help later recall.
- c2: Sleep can help new memories in many tasks. Quiet rest can help too.
- c3: After you learn, a new memory can get firm over time (consolidation).

Steps now: s1 (c3) = 2, 4, 6. s2 (c1) = 1, 3, 5, 8. s3 (c2) = 7.
**Break:** s2 carries 4 items; s3 has only 1.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| sleep-memory-1 | predict | s2 | The poem memory can get stronger overnight (c1) |
| sleep-memory-2 | scenario | s1 | Reading the chapter is the learning (c3) |
| sleep-memory-3 | estimate | s2 | 20.4 vs 12.6 word pairs = about 60% more (c1; figure from `sleep-study`) |
| sleep-memory-4 | choose | s1 | Firming up after the lesson helped it last (c3) |
| sleep-memory-5 | why | s2 | The brain keeps working on new practice (c1) |
| sleep-memory-6 | fill | s1 | That later step is "consolidation" (c3) |
| sleep-memory-7 | true-not-quite | s3 | Quiet rest while awake helps too (c2) |
| sleep-memory-8 | explain-it-back | s2 | Sleep can help keep what was learned (c1) |

Repeats:
- "Sleep after learning helps": 1, 5, 8.
- "Consolidation is the later firming": 4, 6 (2 is a different angle: learning comes first).
- Arithmetic check on 3: 20.4 / 12.6 = 1.62, so "about 60%" is right (stored value 61, range 55-67).

Proposed claim (spare, not needed for the rule):
- **c4: After a night without sleep, people remembered fewer new things they learned the next day.**
  - Source: Yoo, Hu, Gujar, Jolesz and Walker 2007, "A deficit in the ability to form new human
    memories without sleep", Nature Neuroscience 10(3): 385-392. https://pubmed.ncbi.nlm.nih.gov/17293859/
  - Search evidence (page not opened), abstract: "a single night of sleep deprivation produces a
    significant deficit in hippocampal activity during episodic memory encoding, resulting in worse
    subsequent retention."
  - Care: the "40% worse" figure is from a Harvard Gazette quote, not the abstract. Do not use it.
  - Fits the app's aim (earlier sleep), but keep it about memory, not health advice.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | Learn first, then it firms up | c3 | tell learning from consolidation | flow (learn -> later firming) | 2, 4, 6 |
| s2 | Sleep helps memories last | c1 | expect better recall after sleep | compare (12.6 awake vs 20.4 sleep) | 1, 3, 5 |
| s3 | Quiet rest helps too | c2 | say sleep is not the only help | compare (rest vs busy break) | 7 + 1 new |

- Move 8 out of s2 (it repeats 1). Rewrite it as the new s3 item, or drop it.
- Optional: rewrite 6 to test c4 if c4 is added as a fourth claim later.

---

## 8. variable-rewards (Variable rewards)

Claims now (3):
- c1: A reward now and then can draw more checks in some cases.
- c2: A study found that likes can shape posts. It did not test one set rule for each feed.
- c3: A variable reward comes after some tries but not others, so you cannot tell which try brings it.

Steps now: s1 (c3) = 3, 4, 6. s2 (c1) = 1, 2, 8. s3 (c2) = 5, 7. **Meets the rule (3/3/2).**

Problem: s3 teaches "uneven rewards are one reason, not the whole story; feeds differ".
c2 says "likes can shape posts". That does not back items 5 and 7 ("people have other reasons too").

Items:

| id | type | step | idea tested |
|---|---|---|---|
| variable-rewards-1 | predict | s2 | Cannot tell when the next good post comes, so he swipes (c1) |
| variable-rewards-2 | scenario | s2 | Cannot predict the next like, so she checks (c1) |
| variable-rewards-3 | estimate | s1 | 1-in-5 chance, 5 swipes -> about 67% (c3; arithmetic: 1 - 0.8^5 = 0.67, correct) |
| variable-rewards-4 | choose | s1 | "Variable" = timing keeps changing (c3) |
| variable-rewards-5 | why | s3 | Not every feed works like a slot machine (c2, weak fit) |
| variable-rewards-6 | fill | s1 | The pattern is "intermittent" (c3) |
| variable-rewards-7 | true-not-quite | s3 | People open feeds for other reasons too (no claim states it) |
| variable-rewards-8 | explain-it-back | s2 | Not knowing when a win comes makes you try again (c1) |

Repeats:
- "Unpredictable, so keep checking": 1, 2, 8.
- "What variable means": 4, 6.
- "Not the whole story": 5, 7.

Proposed change (reword c2 so s3 has a claim that fits):
- **c2 (new wording): Feeds use many hooks to keep you on them, not just surprise rewards.**
  - Source: Montag, Lachmann, Herrlich and Zweig 2019, IJERPH 16(14): 2612 (already in file as `scroll-review`).
    https://pmc.ncbi.nlm.nih.gov/articles/PMC6679162/
  - Search evidence (page not opened), abstract: the authors analysed popular apps and "identified a
    total of six different mechanisms", linked to effects such as mere exposure, endowment, Zeigarnik
    and social comparison. I could not see the list of six by search. **Open the paper and name 2-3 of them.**
  - Keep the Lindström 2021 finding (likes shape how often people post) as c4, a spare.
- Care: Skinner's "pigeon gambler" idea is challenged by newer animal work (search summary).
  Keep the slot-machine comparison as "like", never "the same as".

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | Variable means you cannot tell when | c3 | name a variable reward | scale (swipe 1 ... 5, reward at random spots) | 3, 4, 6 |
| s2 | Not knowing keeps you checking | c1 | explain one more swipe | flow (maybe reward -> check -> maybe reward) | 1, 2, 8 |
| s3 | One pull, not the whole story | c2 (reworded) | name another hook and say people differ | compare (surprise reward vs other hooks) | 5, 7 |

- For variety: rewrite 6 (repeat of 4) to test something else, for example "Which is NOT variable?".

---

## 9. if-then-plans (If-then plans)

Claims now (3):
- c1: An if-then plan links a clear cue to a chosen act.
- c2: Studies find such plans can help goal pursuit compared with a goal alone.
- c3: An if-then plan names a clear moment to act, easier to notice than a vague goal.

Steps now: s1 (c1) = 1, 4, 6, 8. s2 (c3) = 2, 5. s3 (c2) = 3, 7.
**Break:** s1 carries 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| if-then-plans-1 | predict | s1 | Dinner ending is his signal (c1) |
| if-then-plans-2 | scenario | s2 | "Revise more" lacks a when and what (c3) |
| if-then-plans-3 | estimate | s3 | 94 tests, effect about d = 0.65 (c2; figure from `plan-meta`) |
| if-then-plans-4 | choose | s1 | Sitting at the desk tells her to start (c1) |
| if-then-plans-5 | why | s2 | "If I am free" is hard to notice (c3) |
| if-then-plans-6 | fill | s1 | The "then" part is the action (c1) |
| if-then-plans-7 | true-not-quite | s3 | It helps but cannot promise (c2) |
| if-then-plans-8 | explain-it-back | s1 | Pick a moment, decide the act (c1 + c3) |

Repeats:
- "The if-part is the start signal": 1, 4.
- "A vague cue is hard to notice": 2, 5.
- Fewest repeats in the topic. 6 and 8 test different parts (the "then", the whole plan).

Proposed claims: none needed.
Fact note: Gollwitzer and Sheeran 2006 report d = .65 across 94 independent tests (matches item 3).
The two DOI links in the file could not be tested today.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | Link a moment to an action | c1 | write "if X, then I will Y" | flow (cue -> action) | 1, 4, 6 |
| s2 | Pick a moment you will notice | c3 | turn "when I'm free" into "after dinner" | compare (vague goal vs clear cue) | 2, 5, 8 |
| s3 | It helps, but cannot promise | c2 | say "helps on average" | scale (0.2 small, 0.5 medium, 0.65, 0.8 large) | 3, 7 |

- Only change: move 8 from s1 to s2. Then 3/3/2 holds.

---

## 10. spotlight-effect (The spotlight effect)

Claims now (2):
- c1: In a shirt test, wearers guessed too many people took note.
- c2: In a group talk, speakers thought their words stood out more than they did.

Steps now: s1 (c1) = 1, 3, 4, 6. s2 (c2) = 2, 5, 8. s3 (c1) = 7.
**Break:** only 2 claims; s1 and s3 both teach c1; s1 carries 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| spotlight-effect-1 | predict | s1 | She overestimates how many noticed (c1) |
| spotlight-effect-2 | scenario | s2 | A slip feels bigger to her than to them (c2) |
| spotlight-effect-3 | estimate | s1 | Guessed 46%, about 23% did (c1; figure in teach card, not claim) |
| spotlight-effect-4 | choose | s1 | Definition: others notice us less than we think (c1) |
| spotlight-effect-5 | why | s2 | They lived every detail of it (c2; "why" = self-focus, no claim) |
| spotlight-effect-6 | fill | s1 | It is a bad guess about others' attention (c1) |
| spotlight-effect-7 | true-not-quite | s3 | Fewer notice, not zero (c1) |
| spotlight-effect-8 | explain-it-back | s2 | My moment feels bigger to me (c2) |

Repeats:
- "We overestimate who noticed": 1, 4, 6 (and 3 with numbers).
- "My slip looms large to me": 2, 5, 8.
- Self-focus as the reason (5) is in the teach card, not in a claim.

Proposed claims:
- **c3: After a slip in public, people thought others would judge them more harshly than they did.**
  - Source: Savitsky, Epley and Gilovich 2001, "Do others judge us as harshly as we think?
    Overestimating the impact of our failures, shortcomings, and mishaps", JPSP 81(1): 44-56.
    https://doi.org/10.1037/0022-3514.81.1.44
  - Search evidence (page not opened), abstract summary: across 4 studies, people who imagined or had
    social blunders or public failures expected harsh judgment; observers were more charitable.
    In one study, people who did badly on anagrams expected to look less smart; observers' views
    "hardly shifted".
- **c4: Speakers thought their nerves showed more than they did. Telling them this helped them speak better.**
  - Source: Savitsky and Gilovich 2003, "The illusion of transparency and the alleviation of speech anxiety",
    J. Experimental Social Psychology 39(6): 618-625. https://doi.org/10.1016/S0022-1031(03)00056-8
  - Search evidence (page not opened): participants "overestimated the extent to which their nervousness
    was evident"; the effect was "ameliorated by simply assuring speakers" their anxiety was less visible.
  - Care: this is a classroom-style study, not treatment. Say "speakers did better", not "cures anxiety".
- Care on c1: I found no large independent replication of the 2000 shirt study by search.
  The 46% vs 23% figures match across summaries. Teach "about half the guess", keep "in one study".
- Also check: the file links only the PubMed abstract (10707330). The JPSP DOI is
  https://doi.org/10.1037/0022-3514.78.2.211.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | Fewer people notice than we think | c1 | halve the guess of who noticed | scale (guess 46% vs real 23%) | 1, 3, 7 |
| s2 | My slip looms large to me | c2 | say why a slip feels huge to you | compare (my view vs their view) | 2, 5, 8 |
| s3 | Others judge us more kindly | c3 | expect a milder reaction to a mistake | compare (expected judgment vs real) | 2 new (c3; c4 for one) |

- Leftovers: 4, 6 (repeats of 1). Rewrite one as a c3 item; drop the other.
- 7 ("not zero") moves into s1 as its nuance item.

---

## Readability and citations

Every proposed claim scores about 62-90 on a rough Flesch check (simple syllable counter,
not the app's validator). Re-run the validator on the final wording.
DOIs for Lord 1979, Savitsky 2001, Savitsky 2003, Buehler 1994 and Tversky 1974 are from the
standard citations; confirm each resolves when pages can be opened.

## Source URLs

Could not test any URL today (pages unreachable from this container).
The last recorded check is `content/topics/fact-check-2026-10-16.md` (all supported then).
Risk notes for the next check:
- `planning`: ResearchGate PDF link. These often break or need login. Use the DOI.
- `lally`: a repository bitstream link. Works only while the repository keeps that ID.
- `tversky`: a cebma.org PDF copy. Prefer the Science DOI 10.1126/science.185.4157.1124.
- `bias` / `philosophy` (OpenStax): fine as textbooks, but anchoring and confirmation bias
  rely on them for claims. The new claims above give primary studies.
- `plan-study`, `plan-meta`: DOI links; stable.
- Confirmed to exist by search (not opened): PMC6679162 (Montag 2019), the Wason 1960 PDF at UF,
  the Wood 2005 PDF at USC, the Brown 2024 JEL page.

## What to do next

1. Open every "page not opened" source and copy the exact words into the fact-check file.
2. Easy wins first (no new claims): if-then-plans (move 8), social-proof (move 8, drop c2),
   sleep-memory (move 8, add 1 item), planning-fallacy (no change).
3. Then the four 2-claim concepts: loss-aversion, anchoring, confirmation-bias, spotlight-effect.
4. Check confirmation-bias-3 (16%) against the Dawson 2002 PDF, or replace it with the Wason 1960
   "6 of 29" figure.
