# Variety review: Human psychology

File reviewed: `content/topics/topic.psychology.json`.
The file is the same on `origin/main` (78d1a28) and `origin/learn-steps` (a4ffec9),
so this one review covers both.
First written: 2026-10-21 (network blocked). **Sources re-checked: 2026-10-21, network open.**
Review only. No app code or content JSON was changed.

Why this review: a learner said the questions for one idea "all feel the same".
Psychology was the pilot for steps (spec 14), so every concept here already has `steps[]`.
But the new rules on `learn-steps` (`src/data/packs/validate.ts`) say a stepped idea needs:
- at least 3 fact-checked claims,
- each step teaches its own claim (no two steps share a `claimId`),
- at most 3 questions per step (target 3/3/2).

Today 9 of 10 concepts break at least one of these rules. After this source pass,
all 10 can reach 3 opened-and-supported claims (see the summary). Two need a source URL swapped first.

How to read this:
- "Idea tested" is what a learner must know to get the item right.
- "Repeat" means two or more items test the same idea, even in different formats.
- "No claim" means an item tests a fact that is not in any claim of the concept.
- Diagram: flow (A then B then C), compare (two cases side by side), scale (a number line or size).

## How sources were checked in this pass

- Every URL in the topic file was fetched (curl, then WebFetch for the ones curl could not reach).
  PDFs were turned into text with `pdftotext`, and quotes were copied from that text.
- Status labels for URLs in the file:
  - **LIVE+SUPPORTS**: page opened and a sentence on it backs the claim (quoted).
  - **LIVE-BUT-WEAK**: page opened, but it only backs the claim loosely, or text could not be read.
  - **DEAD**: the URL did not give the page today (error code given).
- Paywalled papers: where the publisher page refused us (403), the abstract was read from the
  publisher-supplied record in PubMed (E-utilities), OpenAlex or Semantic Scholar. These are marked
  "abstract via PubMed / OpenAlex / Semantic Scholar". The quote is the paper's own abstract.
- "Search only" means I saw the fact only in search results or secondary write-ups. Those facts are
  **not** counted as supported.
- Quotes keep the source's spelling (British spelling in Lally and Asch).

## Summary

"Supported" counts only claims whose source was opened in this pass and quoted below.

| concept id | claims now | supported now (of existing) | proposed claims (opened + supported) | supported total | ready for 3 steps? |
|---|---|---|---|---|---|
| habits | 3 | 3 (c1, c2, c3) | c4, c5 | 5 | **yes** |
| loss-aversion | 2 | 2 (c1, c2) | c3, c4 | 4 | **yes** |
| anchoring | 2 | 2 (c1, c2; `bias` weak, `philosophy` strong) | c3, c4 | 4 | **yes** (swap c4 URL to DOI) |
| confirmation-bias | 2 | 2 (c1, c2) | c3, c4 | 4 | **yes** |
| social-proof | 4 (3 distinct) | 3 distinct (c1, c3, c4) | c5 | 4 | **yes** |
| planning-fallacy | 4 (3 distinct) | 3 distinct (c1, c3, c4), only via DOI abstract | none | 3 | **yes, after URL swap** (file URL is DEAD) |
| sleep-memory | 3 | 3 (c1, c2, c3) | c4 | 4 | **yes** (item 3 needs a caveat) |
| variable-rewards | 3 | 2 (c1, c3) + c2 fits weakly | c2 reworded, c4 | 4 | **yes** (use reworded c2) |
| if-then-plans | 3 | 3 (c1, c2, c3) via DOI abstracts | none | 3 | **yes** (`konstanz-plan` DEAD today) |
| spotlight-effect | 2 | 2 (c1, c2) | c3 (c4 weak) | 3 | **yes** (c4 not counted) |

Rule breaks found today (validator on `learn-steps`), unchanged by this pass:

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

What changed since the first draft:
- **Item figures confirmed:** confirmation-bias-3 (16%) is in the Dawson 2002 PDF; social-proof-3
  (about 37%) is Asch's own "36.8 per cent"; if-then-plans-3 (d = .65, 94 tests) is in the
  Gollwitzer and Sheeran abstract; anchoring-3 (65 -> 45) is on the OpenStax philosophy page.
- **New cautions found:** sleep-memory-3 (20.4 vs 12.6) comes from a **pilot of 8 people** over 50;
  social-proof c5 should use Asch's "one fourth", not "near zero" (OpenStax) or "about 5%" (search);
  spotlight c4 (speech nerves) had only partial support in a later study.
- **URLs to fix:** `planning` (ResearchGate, 403), `konstanz-plan` (503 / connection reset),
  London Business School page for Mussweiler 2000 (404). DOIs given below.
- Claims are rewritten as one plain sentence each (rough Flesch check in "Readability").

Pattern across the topic (the same cause as "inflation"):
- Four concepts have only 2 claims and only 2 steps, so 8 items sit on 2 facts.
- Every concept has a `fill-the-step` item that just asks for the name ("anchor", "loss",
  "consolidation"). It repeats the `choose` or `explain-it-back` item.
- Every `explain-it-back` item repeats the `predict` item in other words.
- Some claims say the same thing twice (social-proof c2 = c4; planning-fallacy c2 ≈ c4).
  They count toward "3 claims" but do not add a new idea.
- No item relies on ego depletion, power posing, behavioural priming, growth mindset or the
  marshmallow test. See "Replication watch" for what to say if any of these come up later.

---

## 1. habits (Habits)

Claims now (3):
- c1: Cues in a stable setting can bring back a learned action.
- c2: In Lally's study, modeled times ranged from 18 to 254 days; one missed chance did not undo habit growth.
- c3: In that study, the typical time to near full habit strength was 66 days.

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `lally` (repositorio.ispa.pt PDF) | **LIVE+SUPPORTS** (curl reset; opened via WebFetch, 174 KB PDF) | "The time it took participants to reach 95% of their asymptote of automaticity ranged from 18 to 254 days" / "Missing one opportunity to perform the behaviour did not materially affect the habit formation process." / "The median time to reach 95% of asymptote was 66 days, with a range from 18 to 254 days." / "repetition of a behaviour in a consistent context progressively increases the automaticity with which the behaviour is performed when the situation is encountered" | c1, c2, c3 |
| `wood` (PubMed 17907866) | **LIVE+SUPPORTS** (web page gives a bot check to curl; record read via PubMed E-utilities) | "Once a habit is formed, perception of contexts triggers the associated response without a mediating goal." / "habit associations accrue slowly and do not shift appreciably with current goal states or infrequent counterhabitual responses." | c1, c2 (missed chance) |

Care on c3: the 66 days is the median of only **39 of 82** people whose curves fit well
("The model was therefore a good fit for 39 of the 82 participants (48%)."). 96 people started.
Say "in one study, the middle value was 66 days", never "it takes 66 days".

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

Proposed claims (all opened):
- **c4: Early repeats build a habit fastest, and later repeats add less and less.**
  - Source: Lally et al. 2010 (same `lally` PDF). Opened.
  - Quote: "With repetition of a behaviour in a consistent context, automaticity increases following an
    asymptotic curve which can be modelled at the individual level." And, on the curve shape:
    "automaticity increases steadily—but by a smaller amount with each repetition—until it reaches an
    asymptote (plateau)."
  - Care: the second quote is Lally describing Hull's model, which the paper then fits to its data.
- **c5: When students moved to a new college, old habits often broke unless parts of the setting stayed the same.**
  - Source: Wood, Tam and Guerrero Witt 2005, JPSP 88(6): 918-933. https://doi.org/10.1037/0022-3514.88.6.918
    Open PDF (opened, 200): https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/Wood.Tam_.GuerreroWitt.2005_Changing_circumstances_disrupting_habits.pdf
  - Quote (abstract, PubMed 15982113): "the exercising, newspaper reading, and TV watching habits of
    students transferring to a new university were found to survive the transfer only when aspects of
    the performance context did not change (e.g., participants continued to read the paper with others)."
  - Indian fit: a move from home to a hostel, or a new coaching centre.

Replication: Lally 2010 has **not** been replicated yet. A registered multi-site replication
("The Shape of Habits – A Multi-Centre Replication", Peer Community In Registered Reports, 2023)
is planned; the PCI page blocked our fetch (bot wall), so its wording is search only.
Tell the learner: "one study of 96 people, more work under way".

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | A cue starts a habit | c1 | name the cue before a habit | flow (cue -> act -> link) | 1, 4, 8 |
| s2 | Early repeats count most | c4 (or c5) | say why a new habit grows fast, then slows | scale (repeats vs strength curve) | 5 + 1 new (c4) |
| s3 | It takes weeks, and one miss is fine | c2 (c3 as detail) | reject the 21-day rule; keep going after a miss | scale (18 ... 66 ... 254 days) | 2, 3, 7 |

- Leftover: 6 (repeat of 1/4). Drop, or rewrite it to test c4.
- c5 also fits item 5 (new room). Use it if the builder wants c4 for a different step.
- Suggested split of c2 into one-sentence form: "In one study, missing a single day did not slow habit growth much."

---

## 2. loss-aversion (Loss aversion)

Claims now (2):
- c1: Prospect theory treats gains and losses relative to a reference point.
- c2: Losses can weigh more than equal gains in choice.

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `prospect` (web.mit.edu PDF) | **LIVE+SUPPORTS** | "Gains and losses, of course, are defined relative to some neutral reference point." / "A salient characteristic of attitudes to changes in welfare is that losses loom larger than gains. The aggravation that one experiences in losing a sum of money appears to be greater than the pleasure associated with gaining the same amount." | c1, c2 |

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
- "About twice, on average": 3, 7. No claim gives this number. The 1979 paper gives no "2x" figure.

Proposed claims (both opened):
- **c3: In 607 tests, a loss weighed about twice as much as a gain of the same size, on average.**
  - Source: Brown, Imai, Vieider and Camerer 2024, "Meta-analysis of Empirical Estimates of Loss Aversion",
    J. Economic Literature 62(2): 485-516. https://doi.org/10.1257/jel.20221698
    Open copy (opened, 200): https://epub.ub.uni-muenchen.de/75121/1/275.pdf
  - Quote (abstract, via OpenAlex): "We examine 607 empirical estimates of loss aversion from 150 articles
    ... Our analysis indicates that the mean loss aversion coefficient is 1.955 with a 95 percent probability
    that the true value falls in the interval [1.820, 2.102]."
  - Replication care: see "Replication watch". Gal and Rucker 2018 dispute that losses generally loom larger.
    Teach "about twice, on average, in many studies", and keep item 7 ("people differ").
- **c4: People given a mug asked more than twice as much to sell it as others would pay to buy it.**
  - Source: Kahneman, Knetsch and Thaler 1990, "Experimental Tests of the Endowment Effect and the
    Coase Theorem", J. Political Economy 98(6). https://doi.org/10.1086/261737
    PDF (opened): https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Behavioral_Decision_Theory/Kahneman_et_al_1990_Experimental_tests.pdf
  - Quote: "the median selling prices in the mug and pen markets were more than twice the median buying prices".
    Table 2 (mugs): median seller price 5.25 every round; median buyer price 2.75, then 2.25.
  - Care: some researchers explain this by ownership, not loss aversion. Teach it as "owning changes value".
    Indian swap: a cricket bat or a phone you already own.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | A loss feels bigger than a gain | c2 | spot the pull of a possible loss | compare (lose ₹50 vs win ₹50) | 1, 2, 5 |
| s2 | It depends on where you start | c1 | reframe one result as gain or loss | scale (start point, up = gain, down = loss) | 4, 6, 8 |
| s3 | About twice, on average | c3 | use "about 2x" and say people differ | scale (1x gain vs 2x loss bar) | 3, 7 |

- c4 (mug) is a spare for a new item or a later review card.

---

## 3. anchoring (Anchoring)

Claims now (2):
- c1: A first number can pull a later guess toward it.
- c2: An anchor can pull a guess even when the first number is arbitrary.

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `bias` (OpenStax Psych 2e 7.3) | **LIVE-BUT-WEAK** | "An anchoring bias occurs when you focus on one piece of information when making a decision or solving a problem." (No word on a first number pulling a guess.) | c1 loosely |
| `philosophy` (OpenStax Intro Philosophy 2.2) | **LIVE+SUPPORTS** | "Anchoring bias refers to our tendency to rely on initial values, prices, or quantities when estimating the actual value, price, or quantity" / "Even though the initial anchoring value was random, people in the study found it difficult to deviate far from that number. For subjects receiving an initial value of 10, the median estimate of nations was 25, while for subjects receiving an initial value of 65, the median estimate was 45." | c1, c2, item 3 |
| `tversky` (cebma.org PDF) | **LIVE-BUT-WEAK** (PDF opens, but it is a scanned JSTOR copy with no text layer; only the cover page text could be read). Abstract via PubMed 17835457: "adjustment from an anchor, which is usually employed in numerical prediction when a relevant value is available." | c1 |

Fix: point `tversky` at the DOI https://doi.org/10.1126/science.185.4157.1124, and lean on
`philosophy` for the 10 -> 25 / 65 -> 45 figures.

Steps now: s1 (c1) = 1, 2, 4, 6, 8. s2 (c2) = 3, 5, 7.
**Break:** only 2 claims; s1 carries 5 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| anchoring-1 | predict | s1 | Crossed-out ₹900 sways the fair price (c1) |
| anchoring-2 | scenario | s1 | ₹2,000 vs ₹8,000 first pulls guesses apart (c1) |
| anchoring-3 | estimate | s2 | Random 65 led to typical guess of 45% (c2; confirmed on `philosophy` page) |
| anchoring-4 | choose | s1 | Check the same pen at another shop (no claim: how to resist) |
| anchoring-5 | why | s2 | Start from the number and adjust too little (c2) |
| anchoring-6 | fill | s1 | The first number is an "anchor" (c1) |
| anchoring-7 | true-not-quite | s2 | The seller chose the old price (no claim: who sets the anchor) |
| anchoring-8 | explain-it-back | s1 | First number pulls your guess (c1) |

Repeats:
- "First number pulls the guess": 1, 2, 6, 8.
- "Random number still pulls": 3, 5.
- "Check outside the anchor": 4, 7. No claim covers this (c4 below fixes it).

Proposed claims (both opened as abstracts):
- **c3: Even judges gave longer jail terms after they rolled dice that showed a high number.**
  - Source: Englich, Mussweiler and Strack 2006, PSPB 32(2): 188-200. https://doi.org/10.1177/0146167205282152
    (Sage page 403; abstract via PubMed 16382081.)
  - Quote: "they randomly determined this demand themselves by throwing dice (Study 3). Expertise and
    experience did not reduce this effect."
  - Teaches: knowing a lot does not switch anchoring off.
- **c4: Listing reasons why the first number is wrong makes its pull smaller.**
  - Source: Mussweiler, Strack and Pfeiffer 2000, PSPB 26(9): 1142-1150. https://doi.org/10.1177/01461672002611010
    (The London Business School page named in the first draft now gives **404**. Use the DOI.)
  - Quote (abstract via OpenAlex): "Considering the opposite (i.e., generating reasons why an anchor is
    inappropriate) fulfills this objective and consequently proves to be a successful corrective strategy."
    and "listing arguments that speak against a provided anchor value reduces the effect."
  - Care: "reduces", not "removes".
- Replication: anchoring held up in Many Labs 1. Klein et al. 2014, Social Psychology 45(3): 142-152,
  open PDF opened at https://repository.ubn.ru.nl//bitstream/handle/2066/131506/131506.pdf.
  Quote: "In the aggregate, 10 effects replicated consistently." Anchoring was among "the largest
  effects – anchoring and allowed-forbidden". Safe to teach.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | A first number pulls your guess | c1 | spot the anchor in a price tag | scale (guess slides toward ₹900) | 1, 2, 8 |
| s2 | Even a random number pulls | c2 (c3 as example) | say why a random or dice number still matters | compare (low anchor vs high anchor) | 3, 5 + 1 new (c3, judges) |
| s3 | Argue against the anchor | c4 | weaken an anchor by listing why it is off, then checking elsewhere | flow (see anchor -> list reasons it is wrong -> compare shop) | 4, 7 |

- Leftover: 6 (repeat of 8). Drop.

---

## 4. confirmation-bias (Confirmation bias)

Claims now (2):
- c1: People can focus on clues that fit a prior belief while missing other clues.
- c2: A test of an idea is stronger when it can find a case that goes against it.

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `bias` (OpenStax Psych 2e 7.3) | **LIVE+SUPPORTS** | "The confirmation bias is the tendency to focus on information that confirms your existing beliefs. For example, if you think that your professor is not very nice, you notice all of the instances of rude behavior" | c1 |
| `wason` (Dawson, Gilovich and Regan 2002, web.mit.edu PDF) | **LIVE+SUPPORTS** | "any rule that follows the form 'if p then q' is tested by turning over p and not-q, the only two cards that can falsify the rule." / "the correct response is to seek information that potentially disconfirms the rule." | c2 |

Item 3 check (16%): **confirmed** in the Dawson PDF: "In the absence of a subjectively threatening task
rule, only 16% of participants arrived at the correct solution. In contrast, 52% of participants in the
critical 'threat' group did so". The same paper says the usual rate is "only around 20%". Fine to keep
item 3 if the stem says "in one study, with a rule that did not threaten them".

Steps now: s1 (c1) = 1, 6, 7, 8. s2 (c2) = 2, 3, 4, 5.
**Break:** only 2 claims; both steps carry 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| confirmation-bias-1 | predict | s1 | She recalls the trick papers most (c1) |
| confirmation-bias-2 | scenario | s2 | Check rainy days when sales held up (c2) |
| confirmation-bias-3 | estimate | s2 | About 16% got the card puzzle right (no claim; figure confirmed in `wason`) |
| confirmation-bias-4 | choose | s2 | One good chase innings disproves "always flops" (c2) |
| confirmation-bias-5 | why | s2 | A non-red late bus could disprove the claim (c2) |
| confirmation-bias-6 | fill | s1 | Her pile tilts to what she believes (c1) |
| confirmation-bias-7 | true-not-quite | s1 | She dropped the logs that disagree (c1) |
| confirmation-bias-8 | explain-it-back | s1 | We notice what fits and skip the rest (c1) |

Repeats:
- "We notice what fits": 1, 6, 7, 8 (four items, one idea).
- "Look for the case that breaks it": 2, 4, 5.

Proposed claims (both opened):
- **c3: In a number puzzle, only 6 of 29 people found the rule without a wrong guess first.**
  - Source: Wason 1960, Q. J. Exp. Psychology 12(3): 129-140. https://doi.org/10.1080/17470216008416717
    PDF (opened): https://bear.warrington.ufl.edu/brenner/mar7588/Papers/wason-qjep1960.pdf
  - Quote: "Six out of 29 subjects reached the correct conclusion without previous incorrect ones, 13 reached
    one incorrect conclusion, nine reached two or more incorrect conclusions, and one reached no conclusion."
    The rule was "three numbers in increasing order of magnitude" (start: 2, 4, 6). The paper says "use of
    confirming evidence alone will almost certainly lead to erroneous conclusions".
  - Nice item: "6 of 29" is about 1 in 5. Could replace item 3 if the builder wants one card puzzle, not two.
- **c4: When two groups read the same mixed evidence, each found the study that agreed with it more convincing.**
  - Source: Lord, Ross and Lepper 1979, JPSP 37(11). https://doi.org/10.1037/0022-3514.37.11.2098
    (APA page needs login; abstract via OpenAlex.)
  - Quote: "both proponents and opponents of capital punishment rated those results and procedures that
    confirmed their own beliefs to be the more convincing and probative ones, and they reported corresponding
    shifts in their beliefs".
  - Care: belief shifts were self-reported. In items, use a neutral topic (a cricket captain, a school rule),
    not the death penalty.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | We notice what fits | c1 | spot a one-sided pile of clues | compare (kept clues vs dropped clues) | 1, 7, 8 |
| s2 | We test only cases that fit | c3 | see why "fits again" proves little | flow (guess -> test fitting case -> wrong rule) | 3 (keep, or rewrite to 2-4-6) + 1 new |
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

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `asch` (OpenStax Psych 2e 12.4) | **LIVE+SUPPORTS** | "The Asch effect is the influence of the group majority on an individual's judgment." / "with informational social influence, people conform because" they think the group is right. | c1, c3 |
| `asch-original` (Asch 1955, web.mit.edu PDF) | **LIVE+SUPPORTS** | "the minority subjects swung to acceptance of the misleading majority's wrong judgments in 36.8 per cent of the selections." / the subject finds himself "in a minority of one, opposed by a unanimous and arbitrary majority" | c1, c4, item 3 |

Note a conflict: OpenStax says "If there is at least one dissenter, conformity rates drop to near zero".
Asch's own article says it fell to one fourth (quote in c5). Use Asch.

Steps now: s1 (c3) = 2, 6. s2 (c1) = 1, 3, 5, 8. s3 (c4) = 4, 7.
**Break:** s2 carries 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| social-proof-1 | predict | s2 | Last student moves toward the wrong group (c1) |
| social-proof-2 | scenario | s1 | Cheers make the call feel more certain (c3, partly; "certain" no claim) |
| social-proof-3 | estimate | s2 | About 37% went along (c1; Asch: "36.8 per cent") |
| social-proof-4 | choose | s3 | Whole class agrees, not proven right (c4) |
| social-proof-5 | why | s2 | Fitting in can beat what she sees (c1; OpenStax "normative social influence") |
| social-proof-6 | fill | s1 | The crowd works as a social cue (c3) |
| social-proof-7 | true-not-quite | s3 | They may have copied each other (c4) |
| social-proof-8 | explain-it-back | s2 | A wrong group sometimes swayed people (c1) |

Repeats:
- "Wrong group pulls people": 1, 5, 8.
- "Agreement is not proof": 4, 7.

Proposed claim (opened):
- **c5: When one other person gave the right answer, people went along with the wrong group only a quarter as often.**
  - Source: Asch 1955 (`asch-original`, opened).
  - Quote: "The presence of a supporting partner depleted the majority of much of its power. Its pressure on
    the dissenting individual was reduced to one fourth: that is, subjects answered incorrectly only one
    fourth as often as under the pressure of a unanimous majority".
  - Teaches something new: one ally breaks the pull. Indian scene: one friend in a WhatsApp group.
- Care (no new claim needed): Bond and Smith 1996, Psych. Bulletin 119(1): 111-137,
  https://doi.org/10.1037/0033-2909.119.1.111 (abstract via OpenAlex): "The literature search produced 133
  studies drawn from 17 countries. An analysis of U.S. studies found that conformity has declined since the
  1950s." and "Collectivist countries tended to show higher levels of conformity than individualist countries."
  Do not say "37% of people always conform". Say "in Asch's 1950s study".

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

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `planning` (ResearchGate PDF) | **DEAD** (HTTP 403, ResearchGate block page, 20 KB HTML) | - | - |
| replacement: DOI https://doi.org/10.1037/0022-3514.67.3.366 | resolves to APA PsycNet (login); abstract via OpenAlex: **SUPPORTS** | "Ss' predictions of their completion times were too optimistic for a variety of academic and nonacademic tasks." / "people focus on plan-based scenarios rather than on relevant past experiences while generating their predictions" / "Think-aloud procedures revealed that Ss focused primarily on future scenarios" / "In Study 4, the optimistic bias was eliminated for Ss instructed to connect relevant past experiences with their predictions." | c1, c2, c3, c4 |

**Swap the `planning` URL to the DOI before building.** c4's "leave delays out" goes a little past the
abstract. Safer wording: "When people plan, they think about how the task will go and forget how past tasks went."

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

Proposed claims: none needed.
- The teach card's thesis figure (34 days guessed vs about 56 taken; Study 1: 33.9 vs 55.5) is
  **search only**. The paper's full text was not reachable (APA login; no open copy listed by Unpaywall).
  **No source found** that we could open. Keep it out of claims until someone with access copies Table 1.

3-step outline (keep the current one):

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | We guess too little time | c1 | expect a plan to run long | compare (guess vs real time, no numbers until sourced) | 1, 8 |
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

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `sleep-review` (Rasch and Born 2013, PMC3768102) | **LIVE+SUPPORTS** | "Over more than a century of research has established the fact that sleep benefits the retention of memory." / "Sleep after learning reduced the amount of forgetting." / "current theories highlight an active role for sleep in which memories undergo a process of system consolidation during sleep." | c1, c2 (sleep part), c3 |
| `sleep-rest` (Wamsley 2019, PMC7024394) | **LIVE+SUPPORTS** | "Recent studies show that brief periods of rest after learning facilitate consolidation of new memories." / "experimentally introducing brief periods of quiet waking rest following learning benefits memory, in comparison to equivalent periods of time spent engaged in sensorimotor or cognitive tasks" | c2 (rest part) |
| `sleep-study` (Atherton et al. 2014, PMC4007033) | **LIVE-BUT-WEAK** for item 3 | "the A–B pair score at 12 h was significantly greater in the sleep condition (20.38 ± 1.61) than the wake condition (12.63 ± 1.74) (p = .008)." **But** this is the pilot: "We tested eight healthy participants in our pilot study." Mean age 59. | item 3 |

c2 is two sentences. One-sentence form: "Sleep helps new memories, and quiet rest while awake can help too."

Item 3 caution: the 20.4 vs 12.6 result is from **8 people over 50**. The item already says "small sleep study"
and its feedback says "one small study". Keep that, and add "8 people" to the stem, or move it to a spare.

Steps now: s1 (c3) = 2, 4, 6. s2 (c1) = 1, 3, 5, 8. s3 (c2) = 7.
**Break:** s2 carries 4 items; s3 has only 1.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| sleep-memory-1 | predict | s2 | The poem memory can get stronger overnight (c1) |
| sleep-memory-2 | scenario | s1 | Reading the chapter is the learning (c3) |
| sleep-memory-3 | estimate | s2 | 20.4 vs 12.6 word pairs = about 60% more (c1; pilot of 8, see above) |
| sleep-memory-4 | choose | s1 | Firming up after the lesson helped it last (c3) |
| sleep-memory-5 | why | s2 | The brain keeps working on new practice (c1) |
| sleep-memory-6 | fill | s1 | That later step is "consolidation" (c3) |
| sleep-memory-7 | true-not-quite | s3 | Quiet rest while awake helps too (c2) |
| sleep-memory-8 | explain-it-back | s2 | Sleep can help keep what was learned (c1) |

Repeats:
- "Sleep after learning helps": 1, 5, 8.
- "Consolidation is the later firming": 4, 6 (2 is a different angle: learning comes first).
- Arithmetic check on 3: 20.38 / 12.63 = 1.61, so "about 60%" is right.

Proposed claim (spare, opened):
- **c4: After one night without sleep, people remembered less of what they learned the next day.**
  - Source: Yoo, Hu, Gujar, Jolesz and Walker 2007, Nature Neuroscience 10(3): 385-392.
    https://pubmed.ncbi.nlm.nih.gov/17293859/ (abstract via PubMed E-utilities)
  - Quote: "a single night of sleep deprivation produces a significant deficit in hippocampal activity during
    episodic memory encoding, resulting in worse subsequent retention."
  - Care: do not use the "40% worse" figure from press coverage; it is not in the abstract.
    Keep it about memory, not health advice.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | Learn first, then it firms up | c3 | tell learning from consolidation | flow (learn -> later firming) | 2, 4, 6 |
| s2 | Sleep helps memories last | c1 | expect better recall after sleep | compare (12.6 awake vs 20.4 sleep, "8 people") | 1, 3, 5 |
| s3 | Quiet rest helps too | c2 | say sleep is not the only help | compare (rest vs busy break) | 7 + 1 new |

- Move 8 out of s2 (it repeats 1). Rewrite it as the new s3 item, or drop it.

---

## 8. variable-rewards (Variable rewards)

Claims now (3):
- c1: A reward now and then can draw more checks in some cases.
- c2: A study found that likes can shape posts. It did not test one set rule for each feed.
- c3: A variable reward comes after some tries but not others, so you cannot tell which try brings it.

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `apa-learning` (APA TOPSS lesson plan PDF) | **LIVE+SUPPORTS** | Variable-ratio: "The number of target responses required for reinforcement varies around some average, and the organism never knows exactly how many responses are required for the next reinforcement." / "This schedule produces a consistent, high rate of response very resistant to extinction." / "Slot machines are based on this schedule (VR)" | c1, c3 |
| `social-reward` (Lindström et al. 2021, PMC7910435) | **LIVE+SUPPORTS** for "likes shape posts"; weak for s3 items | "social media users spaced their posts to maximize the average rate of accrued social rewards" / "an online experiment (n = 176), mimicking key aspects of social media, verifies that social rewards causally influence behavior" | c2 (first half), c4 |
| `scroll-review` (Montag et al. 2019, PMC6679162) | **LIVE+SUPPORTS** (for reworded c2) | "a total of six different mechanisms are highlighted" / Table 1 rows include "Endless scrolling/streaming", "Endowment effect/ mere-exposure effect", "Social pressure" (WhatsApp ticks that turn blue), "Show users of an app what they like", the "Like" button, and the "Zeigarnik effect". | reworded c2 |

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

Proposed change (opened):
- **c2 (new wording): Apps use several hooks besides surprise rewards, such as endless scroll and blue read ticks.**
  - Source: Montag, Lachmann, Herrlich and Zweig 2019, IJERPH 16(14): 2612 (`scroll-review`, opened).
  - Quote: Table 1 lists "Endless scrolling/streaming" ("the next video begins ... which makes it hard to stop
    watching") and "Social pressure" ("If the recipient reads the message, the grey ticks turn blue. As both sides
    know about these rules, social pressure emerges.").
  - Care: the paper itself says "it is very hard to understand such an effect on the level of a" single feature.
    Say "can keep you on", not "makes you addicted".
- **c4 (spare): In a study of over a million posts, people posted more often when they got more likes.**
  - Source: Lindström et al. 2021 (`social-reward`, opened). Quote: "We analyze over one million posts from over
    4000 individuals" and users "spaced their posts to maximize the average rate of accrued social rewards".
- Care: the APA lesson says slot machines run on a VR schedule. Keep feeds as "like a slot machine", never
  "the same as". The Lindström abstract notes the "Skinner Box" picture had "scant" evidence before their study.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | Variable means you cannot tell when | c3 | name a variable reward | scale (swipe 1 ... 5, reward at random spots) | 3, 4, 6 |
| s2 | Not knowing keeps you checking | c1 | explain one more swipe | flow (maybe reward -> check -> maybe reward) | 1, 2, 8 |
| s3 | One pull, not the whole story | c2 (reworded) | name another hook, like blue ticks | compare (surprise reward vs other hooks) | 5, 7 |

- For variety: rewrite 6 (repeat of 4) to test something else, for example "Which is NOT variable?".

---

## 9. if-then-plans (If-then plans)

Claims now (3):
- c1: An if-then plan links a clear cue to a chosen act.
- c2: Studies find such plans can help goal pursuit compared with a goal alone.
- c3: An if-then plan names a clear moment to act, easier to notice than a vague goal.

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `konstanz-plan` (socmot.uni-konstanz.de) | **DEAD today** (curl: connection reset, 3 tries; WebFetch: HTTP 503). May be a server outage; re-test before deleting. | - | - |
| `plan-study` (Parks-Stamm et al. 2007, DOI) | DOI resolves to Guilford (403 to us); abstract via OpenAlex: **SUPPORTS** | "implementation intentions (i.e., if–then plans) facilitate goal striving by two processes: increasing the activation of the anticipated situational cue (the if–process) and automating the goal–directed response to that cue (the then–process" | c1, c3 |
| `plan-meta` (Gollwitzer and Sheeran 2006, DOI) | DOI resolves to Elsevier; abstract via Semantic Scholar: **SUPPORTS** | "an implementation intention that spells out the when, where, and how of goal striving in advance ('If situation Y is encountered, then I will initiate goal-directed behavior X!'). Findings from 94 independent tests showed that implementation intentions had a positive effect of medium-to-large magnitude (d = .65) on goal attainment." Also: "Implementation intention formation both enhanced the accessibility of specified opportunities" | c1, c2, c3, item 3 |

An open copy of `plan-meta` exists at KOPS Konstanz (https://kops.uni-konstanz.de/bitstreams/d4f710b4-a505-49ef-a831-5b8d7675100b/download);
it opens (200) but is a scan without a text layer. If `konstanz-plan` stays down, drop it; c1-c3 stand on the two DOIs.

Steps now: s1 (c1) = 1, 4, 6, 8. s2 (c3) = 2, 5. s3 (c2) = 3, 7.
**Break:** s1 carries 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| if-then-plans-1 | predict | s1 | Dinner ending is his signal (c1) |
| if-then-plans-2 | scenario | s2 | "Revise more" lacks a when and what (c3) |
| if-then-plans-3 | estimate | s3 | 94 tests, effect about d = 0.65 (c2; confirmed in `plan-meta` abstract) |
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
Care: d = .65 is an average across studies, and later meta-analyses of specific areas report smaller effects
(not opened in this pass). Item 7 ("helps but cannot promise") already says the right thing.

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

Source URLs in the file:

| source | URL status | supporting sentence (copied) | backs |
|---|---|---|---|
| `spotlight-paper` (PubMed 10707330) | **LIVE+SUPPORTS** (web page: 429 / bot check to curl; record read via PubMed E-utilities) | "participants who were asked to don a T-shirt depicting either a flattering or potentially embarrassing image overestimated the number of observers who would be able to recall what was pictured on the shirt." / "participants in a group discussion overestimated how prominent their positive and negative utterances were to their fellow discussants." | c1, c2 |

Item 3 (46% guessed vs about 23% noticed): **not in the abstract**. Full text is behind APA login and Unpaywall
lists no open copy. The figures appear only in secondary write-ups (search only). Until someone copies them from
Study 1, keep the item's wording loose ("about half as many as guessed") or mark it unverified.

Steps now: s1 (c1) = 1, 3, 4, 6. s2 (c2) = 2, 5, 8. s3 (c1) = 7.
**Break:** only 2 claims; s1 and s3 both teach c1; s1 carries 4 items.

Items:

| id | type | step | idea tested |
|---|---|---|---|
| spotlight-effect-1 | predict | s1 | She overestimates how many noticed (c1) |
| spotlight-effect-2 | scenario | s2 | A slip feels bigger to her than to them (c2) |
| spotlight-effect-3 | estimate | s1 | Guessed 46%, about 23% did (c1; figures search only) |
| spotlight-effect-4 | choose | s1 | Definition: others notice us less than we think (c1) |
| spotlight-effect-5 | why | s2 | They lived every detail of it (c2; abstract: people "anchor on their own rich phenomenological experience") |
| spotlight-effect-6 | fill | s1 | It is a bad guess about others' attention (c1) |
| spotlight-effect-7 | true-not-quite | s3 | Fewer notice, not zero (c1) |
| spotlight-effect-8 | explain-it-back | s2 | My moment feels bigger to me (c2) |

Repeats:
- "We overestimate who noticed": 1, 4, 6 (and 3 with numbers).
- "My slip looms large to me": 2, 5, 8.

Proposed claims:
- **c3: After a slip in public, people thought others would judge them more harshly than they did.** (opened)
  - Source: Savitsky, Epley and Gilovich 2001, JPSP 81(1): 44-56. https://doi.org/10.1037/0022-3514.81.1.44
    (APA login; abstract via OpenAlex.)
  - Quote: "Actors who imagined committing one of several social blunders (Study 1), who experienced a public
    intellectual failure (Studies 2 and 3), or who were described in an embarrassing way (Study 4) anticipated
    being judged more harshly by others than they actually were."
  - Keep it about everyday slips (a wrong answer in class, a dropped tiffin), not anxiety treatment.
- **c4: Speakers thought their nerves showed more than they did.** **LIVE-BUT-WEAK, not counted.**
  - Source: Savitsky and Gilovich 2003, JESP 39(6): 618-625. https://doi.org/10.1016/S0022-1031(03)00056-8.
    ScienceDirect gave 403; no abstract in OpenAlex or Semantic Scholar (publisher elided it). Not opened.
  - Secondary, peer-reviewed description (opened): MacInnis, Mackinnon and MacIntyre 2010, Current Research in
    Social Psychology 15(4), https://crisp.org.uiowa.edu/sites/crisp.org.uiowa.edu/files/2020-04/15.4.pdf:
    "Results showed that participants overestimated the extent by which their nervousness was evident to their
    partner. Further, the effects of this illusion were ameliorated by simply assuring speakers that their anxiety
    was not as visible to the audience as speakers tend to believe."
  - Replication care, same paper's own study: "a substantial minority of participants (36%) thought that the
    audience would rate them as more anxious than they actually were." So the effect held on average but not for
    most people. Drop the "telling them helped them speak better" half. Use c3 instead.
- Replication: no large independent replication of the 2000 shirt study was found (search only). Teach it as
  "in one study" and keep item 7 ("fewer notice, not zero").
- Fix: the file links only the PubMed abstract. Add the DOI https://doi.org/10.1037/0022-3514.78.2.211.

3-step outline:

| step | title | claim | after it, the learner can | diagram | items |
|---|---|---|---|---|---|
| s1 | Fewer people notice than we think | c1 | expect fewer people to notice than you fear | scale (guess vs real, numbers only once verified) | 1, 3, 7 |
| s2 | My slip looms large to me | c2 | say why a slip feels huge to you | compare (my view vs their view) | 2, 5, 8 |
| s3 | Others judge us more kindly | c3 | expect a milder reaction to a mistake | compare (expected judgment vs real) | 2 new (c3) |

- Leftovers: 4, 6 (repeats of 1). Rewrite one as a c3 item; drop the other.
- 7 ("not zero") moves into s1 as its nuance item.

---

## Replication watch

None of these are in the topic file today. If a future item touches them, use the "say instead" line.

| finding | what replications found (opened, quoted) | say instead |
|---|---|---|
| Ego depletion ("willpower runs out like fuel") | Hagger et al. 2016, Perspectives on Psych. Science 11(4), PubMed 27474142: "Multiple laboratories (k = 23, total N = 2,141) ... the size of the ego-depletion effect was small with 95% confidence intervals (CIs) that encompassed zero (d = 0.04". | "A large test in 23 labs found almost no effect, so do not plan around 'running out' of willpower." (Also: the app bans the word "Ego" in copy; call it "the fuel idea of willpower".) |
| Power posing | Ranehill et al. 2015, Psych. Science 26(5), PDF at zne.uzh.ch (opened): "our results showed a significant effect of power posing on self-reported feelings of power. However, we found no significant effect of power posing on hormonal levels or in any of the three behavioral tasks." | "A pose may make you feel more confident, but a larger study found no change in hormones or choices." |
| Behavioural priming | Doyen et al. 2012, PLoS ONE, PubMed 22279526: "our first experiment failed to show priming ... we obtained a walking speed effect, but only when experimenters believed participants would indeed walk slower." Klein et al. 2014 (opened): "flag priming influencing conservatism and currency priming influencing system justification – did not replicate." | "Claims that a hidden word changes how you act have often failed to repeat; anchoring, by contrast, held up." |
| Growth mindset | Sisk et al. 2018, Psych. Science 29(4), PubMed 29505339: "Overall effects were weak for both meta-analyses. However, ... students with low socioeconomic status or who are academically at risk might benefit". | "Believing you can improve helps some students a little; it is not a big boost for everyone." |
| Marshmallow test (causal claims) | Watts, Duncan and Quan 2018, Psych. Science 29(7), PubMed 29799765: the link "was only half the size of those reported in the original studies and was reduced by two thirds in the presence of controls for family background, early cognitive ability, and the home environment." | "Waiting longer as a child was only weakly linked to later results once home life was counted." |
| Loss aversion size | Gal and Rucker 2018, J. Consumer Psych. 28(3), https://doi.org/10.1002/jcpy.1047 (abstract via OpenAlex): "current evidence does not support that losses, on balance, tend to be any more impactful than gains." Against this, Brown et al. 2024 (above) find a mean of 1.955. | "In many studies a loss weighs about twice a gain, but it depends on the situation and the person." |
| Habit in 66 days (Lally) | Lally 2010 itself: good fit for "39 of the 82 participants". Multi-site replication planned, not reported (search only). | "In one study the middle time was 66 days, and it ranged from 18 to 254." |
| Asch conformity rate | Bond and Smith 1996 (above): "conformity has declined since the 1950s". | "In Asch's 1950s study, about 1 in 3 answers went with the wrong group." |
| Spotlight / illusion of transparency | No independent shirt replication found (search only). MacInnis et al. 2010: only "36%" overestimated how anxious they looked. | "In one study, people guessed about twice as many noticed as really did." (once the 46/23 figures are copied) |
| Sleep word-pair figure | Atherton 2014 pilot: "eight healthy participants". | "In a small pilot of 8 people ..." |

## Readability

Every proposed claim was checked with a rough Flesch Reading Ease counter (vowel-group syllables,
not the app's validator). All score 60 or more. One-sentence claims proposed in this pass:

| claim | Flesch (rough) |
|---|---|
| habits c4: Early repeats build a habit fastest, and later repeats add less and less. | ~70 |
| habits c5: When students moved to a new college, old habits often broke unless parts of the setting stayed the same. | ~72 |
| loss-aversion c3: In 607 tests, a loss weighed about twice as much as a gain of the same size, on average. | ~85 |
| loss-aversion c4: People given a mug asked more than twice as much to sell it as others would pay to buy it. | ~85 |
| anchoring c3: Even judges gave longer jail terms after they rolled dice that showed a high number. | ~68 |
| anchoring c4: Listing reasons why the first number is wrong makes its pull smaller. | ~75 |
| confirmation-bias c3: In a number puzzle, only 6 of 29 people found the rule without a wrong guess first. | ~75 |
| confirmation-bias c4: When two groups read the same mixed evidence, each found the study that agreed with it more convincing. | ~71 |
| social-proof c5: When one other person gave the right answer, people went along with the wrong group only a quarter as often. | ~68 |
| sleep-memory c4: After one night without sleep, people remembered less of what they learned the next day. | ~68 |
| variable-rewards c2: Apps use several hooks besides surprise rewards, such as endless scroll and blue read ticks. | ~68 |
| spotlight-effect c3: After a slip in public, people thought others would judge them more harshly than they did. | ~80 |

Re-run the app's validator on final wording.

## Source URLs (status table)

| source id | URL in file | status today | action |
|---|---|---|---|
| `lally` | repositorio.ispa.pt bitstream | LIVE+SUPPORTS (curl reset; WebFetch OK) | keep; add DOI 10.1002/ejsp.674 as backup |
| `wood` | PubMed 17907866 | LIVE+SUPPORTS | keep |
| `prospect` | web.mit.edu PDF | LIVE+SUPPORTS | keep |
| `bias` | OpenStax Psych 2e 7.3 | LIVE+SUPPORTS for confirmation bias; LIVE-BUT-WEAK for anchoring | keep; do not rely on it alone for anchoring |
| `philosophy` | OpenStax Intro Philosophy 2.2 | LIVE+SUPPORTS | keep |
| `tversky` | cebma.org PDF | LIVE-BUT-WEAK (scan, no text) | swap to DOI 10.1126/science.185.4157.1124 |
| `wason` | web.mit.edu PDF (Dawson 2002) | LIVE+SUPPORTS | keep |
| `asch` | OpenStax Psych 2e 12.4 | LIVE+SUPPORTS | keep; note its "near zero" conflicts with Asch's "one fourth" |
| `asch-original` | web.mit.edu PDF | LIVE+SUPPORTS | keep |
| `planning` | ResearchGate PDF | **DEAD** (403) | swap to DOI 10.1037/0022-3514.67.3.366 |
| `sleep-review` | PMC3768102 | LIVE+SUPPORTS | keep |
| `sleep-rest` | PMC7024394 | LIVE+SUPPORTS | keep |
| `sleep-study` | PMC4007033 | LIVE-BUT-WEAK (figure is a pilot of 8) | keep, add "8 people" |
| `apa-learning` | apa.org PDF | LIVE+SUPPORTS | keep |
| `social-reward` | PMC7910435 | LIVE+SUPPORTS | keep |
| `scroll-review` | PMC6679162 | LIVE+SUPPORTS | keep |
| `konstanz-plan` | socmot.uni-konstanz.de | **DEAD today** (reset / 503) | re-test; else drop |
| `plan-study` | doi.org/10.1521/SOCO.2007.25.2.248 | resolves (paywall); abstract supports | keep |
| `plan-meta` | doi.org/10.1016/S0065-2601(06)38002-1 | resolves (paywall); abstract supports | keep |
| `spotlight-paper` | PubMed 10707330 | LIVE+SUPPORTS | keep; add DOI 10.1037/0022-3514.78.2.211 |

New sources to add with the proposed claims (all opened in this pass, at least to the abstract):
Wood, Tam and Guerrero Witt 2005; Brown et al. 2024; Kahneman, Knetsch and Thaler 1990; Englich et al. 2006;
Mussweiler et al. 2000 (DOI, not the LBS page); Wason 1960; Lord, Ross and Lepper 1979; Bond and Smith 1996;
Yoo et al. 2007; Savitsky, Epley and Gilovich 2001; Klein et al. 2014.

## What to do next

1. Swap the three bad URLs: `planning` -> DOI, `tversky` -> DOI, Mussweiler LBS page -> DOI. Re-test `konstanz-plan`.
2. Easy wins first (no new claims): if-then-plans (move 8), social-proof (move 8, drop c2),
   sleep-memory (move 8, add 1 item, add "8 people" to item 3), planning-fallacy (no change).
3. Then the four 2-claim concepts, using the opened claims above: loss-aversion (c3), anchoring (c3/c4),
   confirmation-bias (c3), spotlight-effect (c3).
4. Still unverified (search only, keep out of claims): Buehler thesis 33.9 vs 55.5 days; spotlight 46% vs 23%;
   Lally replication status. Someone with APA access can copy the first two from the papers' tables.
