# Fact check: Psychology topic (cloud job 2)

- **Scope:** `content/topics/topic.psychology.json` on `origin/steps-psych` at `c61a1d2`, version 1.0.0. That is 10 concepts, 44 listed claims, 30 steps and 80 items.
- **Checked:** every hook, rule, claim, misconception, step (hook, teach, visual, example, guided tries, takeaway), item (stem, options, feedback, estimate ranges) and quest.
- **Independence:** this check is separate from the builder's `factCheck` blocks, which mark every claim and item "supported". The content was not changed.
- **Date:** 2026-10-22.
- **Verdicts:**
  - SUPPORTED: the exact quote was found this session.
  - PARTLY: the claim goes beyond the quote, or the source says something different.
  - NOT SUPPORTED: no cited source says it.
  - SOURCE DEAD: the page could not be opened by any route.
- **Severity:** HIGH means fix before release. MED means a wrong or unbacked teaching point. LOW means wording or a weak spot.

## Summary

| Concept | Claims | Supported | Problems (total: High/Med/Low) |
|---|---|---|---|
| habits | 6 | 6 | 3 (0/1/2) |
| loss-aversion | 3 | 3 | 4 (0/2/2) |
| anchoring | 4 | 3 (1 PARTLY) | 5 (0/2/3) |
| confirmation-bias | 4 | 4 | 5 (0/1/4) |
| social-proof | 4 | 3 (1 PARTLY) | 3 (**1**/1/1) |
| planning-fallacy | 5 | 5 | 3 (0/1/2) |
| sleep-memory | 4 | 4 | 5 (**1**/1/3) |
| variable-rewards | 5 | 5 | 4 (0/1/3) |
| if-then-plans | 4 | 4 | 2 (0/1/1) |
| spotlight-effect | 5 | 5 | 3 (0/0/3) |
| **Total** | **44** | **42 (2 PARTLY)** | **37 (2/11/24)** |

- **Arithmetic:** all of it recomputes correctly. That covers 66/7, 6/29, 37% of 12, 20.4/12.6, 1 − 0.8⁵, 12 − 7, the gaps 3/6/8, ₹300 × 2, and every scale-mark position.
- **No claim is NOT SUPPORTED and no source is dead.** Several direct links fail, but every source was reached another way (see "Source access").
- **Therapy or diagnosis wording:** none found. A grep for anxiety, depression, therapy, trauma, disorder, addiction, diagnosis and treatment found nothing in the learner-facing text.
  - Two cited sources use clinical words: Montag et al. ("addictive", "disorder") and Savitsky et al. ("social anxiety"). The content keeps those words out. Keep it that way.

## Fix before release (HIGH)

1. **social-proof: the teaching point contradicts its own cited source.**
   - The concept teaches Asch's line study as "social proof": we follow the crowd because we "take it as a sign it is right".
   - The cited OpenStax page says the opposite about Asch: "Since the line judgment task was unambiguous, participants did not need to rely on the group for information. Instead, participants complied to fit in and avoid ridicule, an instance of normative social influence." ([OpenStax Psychology 2e 12.4](https://openstax.org/books/psychology-2e/pages/12-4-conformity-compliance-and-obedience))
   - Asch himself reports both motives. Some yielders concluded "I am wrong, they are right." Others "yielded in order 'not to spoil your results.'" ([Asch 1955](https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Influence_Compliance/Asch_1955_Opinions_and_social_pressure.pdf))
   - **Affected:** the rule, claim c3, s1 teach ("This pull is called social proof"), s2 guided 1 (Kabir nods along), and item 14. Item 14's only correct answer is "He takes their answer as a clue to what is right", which is the reading OpenStax rejects for Asch. No option offers "to fit in".
   - **Fix, option 1:** rename the concept "Going along with a group" and teach both motives: fitting in, and doubting yourself.
   - **Fix, option 2:** keep "social proof" but back the crowd-as-a-clue steps (s1, items 9 and 11) with an informational-influence source. The same OpenStax page has one (the smoke-in-the-cinema example). Keep Asch only for "a group can pull you even when you can see the answer".
   - **Item 14 rewrite:** correct option "He wants to fit in, and he may start to doubt himself."
2. **sleep-memory: two tries teach a motor-skill sleep boost that a meta-analysis rejects.**
   - The s2 example says Gautam "sleeps, and the next morning his action feels smoother".
   - s2 guided 2 says of Tushar's tabla rhythm, "Sleep firmed up the new skill", and its feedback says "Studies find sleep after practice can help."
   - Pan & Rickard (2015) pooled 34 articles and 1,296 subjects on motor sequence learning: "With those variables accounted for, there was no evidence that sleep enhances learning … We conclude that sleep does not enhance motor learning and that the role of sleep in the stabilization of memory cannot be conclusively determined" ([PubMed 25822130](https://pubmed.ncbi.nlm.nih.gov/25822130/)).
   - No cited source backs a motor claim. Claim c1 and the Atherton pilot are about word pairs.
   - **Fix:** change both tries to facts or words. Examples: Gautam learns the bowling rules; Tushar learns the names of ten ragas. The lesson is then "he forgets less". Do not say a skill gets "smoother" after sleep.

## Replication and evidence-strength check

The topic avoids the best-known replication failures:

- **Not used anywhere:** ego depletion, power posing, behavioural priming, the marshmallow test and growth mindset. A grep for willpower, mindset, pose, prime, marshmallow, self-control, ego and deplet found only two "willpower" mentions, and both are framed as the wrong answer (habits-10, variable-rewards-14).
- **Priming:** Many Labs 1 found that "flag priming influencing conservatism and currency priming influencing system justification – did not replicate" ([Klein et al. 2014](https://research.unipd.it/bitstream/11577/2688304/1/ManyLabs.2014.SP.fulltext.pdf)). Keep priming out.

| Concept | Evidence status | Source opened |
|---|---|---|
| anchoring | Robust for explicit high/low anchors. Many Labs 1: "The original studies produced underestimates of some effects (e.g., anchoring-and-adjustment …)". All cited studies used a comparison question or a stated demand, not a number merely flashed (see AN2). | Klein et al. 2014 |
| loss-aversion | Contested. Gal & Rucker: "current evidence does not support that losses, on balance, tend to be any more impactful than gains." Kermer et al.: the asymmetry "was thus more a property of affective forecasts than a property of affective experience." The meta-analysis mean of about 2 is for coefficients taken from choices. | [Gal & Rucker 2018 (OpenAlex abstract)](https://api.openalex.org/works/doi:10.1002/jcpy.1047); [Kermer et al. 2006](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01760.x/) |
| social-proof (Asch) | Replicated, but with variation. "An analysis of U.S. studies found that conformity has declined since the 1950s … Collectivist countries tended to show higher levels of conformity than individualist countries." | [Bond & Smith 1996 (OpenAlex abstract)](https://api.openalex.org/works/doi:10.1037/0033-2909.119.1.111) |
| sleep-memory (facts, words) | Robust but moderate. "We found a moderate overall sleep benefit in episodic memory (g = 0.44) … When accounting for selective reporting bias … reduced but still significant (g = 0.28)." | [Berres & Erdfelder 2021, PubMed 35404637](https://pubmed.ncbi.nlm.nih.gov/35404637/) |
| sleep-memory (motor skills) | Enhancement is not supported (see HIGH 2). | Pan & Rickard 2015 |
| if-then-plans | Robust, but the newer pooled range is wider and lower. "Across 642 independent tests … effective for cognitive, affective, and behavioural outcomes (.27 ≤ d ≤ .66)." | [Sheeran, Listrom & Gollwitzer 2025](https://kops.uni-konstanz.de/handle/123456789/69905) |
| confirmation-bias (2-4-6 task) | The finding holds, but the reading is debated. "Many phenomena labeled 'confirmation bias' are better understood in terms of a general positive test strategy … [which] can be a very good heuristic." | [Klayman & Ha 1987 (OpenAlex abstract)](https://api.openalex.org/works/doi:10.1037/0033-295X.94.2.211) |
| habits | One study. A good model fit for only 39 of 82 people, mostly postgraduates. Times past 84 days are model projections (see HB1). | Lally et al. 2010 |
| variable-rewards → apps | Lab schedules are well established. Direct evidence for app use is limited to posting behaviour (Lindström). Montag's link to scrolling is an argument, not a test. | OpenStax 6.3; Lindström 2021; Montag 2019 |
| spotlight-effect | Original studies used small student samples. No large replication was found in this session (one web search turned up only secondary write-ups). | Search only |
| planning-fallacy | Not searched for replications in this session. | none |

## Source access

| Source id | Direct link | How it was read |
|---|---|---|
| lally | curl: connection reset | Opened as a PDF through WebFetch, then pdftotext |
| wood, wood-move, tversky, judges, spotlight-paper, harsh | PubMed served a bot check (HTTP 203) | Same PMIDs through NCBI E-utilities |
| prospect, wason, wason-246, asch-original | OK (PDF) | pdftotext |
| philosophy, bias, asch, operant | OK (OpenStax HTML) | Text extracted |
| loss-meta | DOI → AEA, HTTP 403 | Abstract via OpenAlex; full working paper ([LMU CRC TRR 190 DP 275](https://epub.ub.uni-muenchen.de/75121/1/275.pdf)) |
| opposite | DOI → SAGE, HTTP 403 | Abstract via OpenAlex only |
| planning | DOI → APA, Incapsula block | Abstract via OpenAlex only. The full text was not opened. |
| plan-study | DOI → Guilford, HTTP 403 | Abstract via OpenAlex only |
| plan-meta | DOI → Elsevier redirect page | Scanned author PDF from [Uni Konstanz](https://www.socmot.uni-konstanz.de/sites/default/files/06_Gollwitzer_Sheeran_Implementation_Intentions_And_Goal.pdf); page 1 read as an image |
| sleep-review | PMC page: reCAPTCHA for curl; E-utilities: publisher blocks full text | Read through WebFetch (PMC HTML) |
| sleep-rest, sleep-study, social-reward, scroll-review | PMC page: reCAPTCHA for curl | Full text through Europe PMC or NCBI E-utilities |

**Weak sources:**

- **tversky:** cited as a PubMed abstract that contains no numbers. The 10→25 / 65→45 figures come only from an OpenStax philosophy textbook, which gets the unit wrong (AN1).
- **planning:** only the abstract can be reached. The 34/56-day figures are not in it (PF1).
- **sleep-study:** an n = 8 pilot inside a study of epilepsy patients. It is used for the topic's only sleep figure (SL2).

---

## habits

| Claim | Verdict | Quote |
|---|---|---|
| c1 cues in a stable setting trigger a learned act | SUPPORTED | "Once a habit is formed, perception of contexts triggers the associated response without a mediating goal." Also: "(e.g., physical settings, preceding actions)" ([Wood & Neal 2007](https://pubmed.ncbi.nlm.nih.gov/17907866/)) |
| c2 18–254 days; one miss did not undo | SUPPORTED | "ranged from 18 to 254 days"; "Missing one opportunity to perform the behaviour did not materially affect the habit formation process." ([Lally et al. 2010](https://repositorio.ispa.pt/server/api/core/bitstreams/370f1dca-cc04-4d3d-a0f0-36d16109ec37/content)) |
| c3 median 66 days, among 39 | SUPPORTED | "The median time to reach 95% of asymptote was 66 days"; "The model was therefore a good fit for 39 of the 82 participants (48%)." (Lally) |
| c4 early repeats add most | SUPPORTED | "Early repetitions result in larger increases in automaticity than those later in the habit formation process" (Lally) |
| c5 transfer students | SUPPORTED | Habits "were found to survive the transfer only when aspects of the performance context did not change" ([Wood, Tam & Witt 2005](https://pubmed.ncbi.nlm.nih.gov/15982113/)) |
| c6 a whole week missed | SUPPORTED | "(Armitage, 2005) … lapses in performing the behaviour were negative predictors of future performance. However … a lapse was defined as not attending for a week." (Lally) |

**Problems:**

- **HB1 (MED).** Locations: the hook, the rule, s3 teach, the s3 visual and the s3 hook.
  - The content gives 18–254 days and 66 days as if they were observed. The study ran 84 days, and Lally calls 66 "the average modelled time to plateau". High values came from "participants not reaching a plateau within the 84 days and the fitted curve estimating a high value".
  - Participants were "predominantly postgraduate students".
  - Fix: "In one 12-week study, the estimated time for a habit to feel automatic ranged from 18 to 254 days (middle: 66)."
- **HB2 (LOW).** s3 teach: "A whole week off can set it back."
  - This comes second-hand through Lally's summary of Armitage (2005), which was about gym attendance.
  - Item 16 already says "earlier work". Say the same in the teach card: "In an earlier gym study, a whole week off made later visits less likely."
- **HB3 (LOW).** Items habits-14 (Mehul's changing spots vs Pia's one room) and the s1 hook (phone at the door) are inferred.
  - Every Lally participant used one fixed context, so no study here compares one setting with many.
  - This is fine as reasoning from Wood & Neal. Do not present it as a study result.

## loss-aversion

| Claim | Verdict | Quote |
|---|---|---|
| c1 reference point | SUPPORTED | "the reference point was taken to be the status quo, or one's current assets … there are situations in which gains and losses are coded relative to an expectation or aspiration level" ([Kahneman & Tversky 1979](https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Behavioral_Decision_Theory/Kahneman_Tversky_1979_Prospect_theory.pdf)) |
| c2 people dislike fair 50-50 bets, more so at higher stakes | SUPPORTED | "most people find symmetric bets of the form (x,.50; -x,.50) distinctly unattractive. Moreover, the aversiveness of symmetric fair bets generally increases with the size of the stake." |
| c3 607 estimates, 150 papers, about 2x, varies | SUPPORTED | "We examine 607 empirical estimates of loss aversion from 150 articles … the mean loss aversion coefficient is 1.955" (JEL abstract via OpenAlex); "While there is a wide degree of heterogeneity across estimates" (working paper) |

**Problems:**

- **LA1 (MED).** The content turns a choice finding into a claim about feelings and how long they last.
  - Locations: the hook ("losing ₹100 often feels worse"), s1 teach ("stings more … pleases"), the s1 example (Sahil "is upset all evening"), s1 guided 2 ("Which moment stays with her longer?"), item 9 ("dwell on at home") and item 10 feedback.
  - Prospect theory measured choices.
  - Kermer et al. (2006) measured feelings directly: "when people actually gambled, losses did not have as much of an emotional impact as they predicted … People … overestimated their tendency to dwell on losses."
  - Gal & Rucker (2018) dispute loss aversion as a general rule.
  - Fix: teach it as choices and expectations. Rule: "In choices, people often act as if a loss counts about twice a same-size gain." Recast the Sahil and Anjali tries as choices, for example "Would she take a 50-50 bet of +5 / −5 runs?" Item 9: "Which change would he work harder to avoid?"
- **LA2 (MED).** Item 14 (early-bird notice vs late-fee notice) claims a behaviour effect that no cited source tests.
  - A field study does back it, for junior researchers only. Gächter et al. found: "while the behaviour of junior experimental economists is affected by the description of the decision task they face, this is not the case for the more senior members" ([CeDEx DP 2007-01](https://www.nottingham.ac.uk/cedex/documents/papers/2007-01.pdf)). The manipulation was a "penalty" vs a "discount" of $50 for registration.
  - Fix: add this source and keep "likely".
- **LA3 (LOW).** Item 12, option a feedback: "paying ₹45 lands above what was expected" is backwards. The fare fell below the old ₹60. Fix: "From a start of ₹60, paying ₹45 costs less than before."
- **LA4 (LOW).** s2 guided 2 (card surcharge vs cash discount) is a framing example that the 1979 paper does not discuss. It is acceptable as an illustration of reference points, but no source is cited for it.

## anchoring

| Claim | Verdict | Quote |
|---|---|---|
| c1 a first number pulls the estimate; adjustment is too small | SUPPORTED | "you will have a hard time discounting it in your subsequent calculations; the initial value 'anchors' subsequent estimates" ([OpenStax Philosophy 2.2](https://openstax.org/books/introduction-philosophy/pages/2-2-overcoming-cognitive-biases-and-engaging-in-critical-reflection)); "adjustment from an anchor … lead to systematic and predictable errors" ([Tversky & Kahneman 1974 abstract](https://pubmed.ncbi.nlm.nih.gov/17835457/)) |
| c2 10→25, 65→45 | PARTLY | OpenStax: "For subjects receiving an initial value of 10, the median estimate of nations was 25, while for subjects receiving an initial value of 65, the median estimate was 45." The numbers match, but OpenStax gives a count of nations while the content says a percentage (see AN1). |
| c3 experienced judges; dice | SUPPORTED | "the sentencing decisions of experienced legal professionals are influenced by irrelevant sentencing demands even if they are blatantly determined at random … they randomly determined this demand themselves by throwing dice (Study 3). Expertise and experience did not reduce this effect." ([Englich et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16382081/)) |
| c4 listing reasons against weakens it | SUPPORTED | "Results of two studies, however, demonstrate that anchoring can be reduced by applying a consider-the-opposite strategy." (Mussweiler et al. 2000, abstract via OpenAlex) |

**Problems:**

- **AN1 (MED).** The unit does not match the cited source. Locations: c2, s2 teach, the s2 visual ("Middle guess of a percentage") and item 12 (unit "percent").
  - The cited OpenStax page says "estimate the number of African nations" and "median estimate of nations was 25".
  - The original 1974 study asked for a percentage; secondary sources say so. The cited PubMed abstract has no numbers, and the full Science paper could not be opened (UBC and Caltech copies returned 503 or reset).
  - Fix: cite the full 1974 paper (a page or PDF that opens) and keep "percentage". Or drop the unit and say "a guess about the UN".
- **AN2 (MED).** Flashed or incidental anchors go beyond every cited study. Locations: s2 guided 1 (a number flashed before a quiz), s2 guided 2 (a random number on the scoreboard), item 13 (a lucky-draw slip before guessing a fridge's price).
  - In every cited study, people compared the number with the answer or were handed it as a demand. OpenStax: "Subjects were asked whether the number of nations was higher or lower than the random number."
  - No source opened this session shows that a number merely seen, without that comparison step, pulls a later guess.
  - Fix: add the comparison step to each stem, for example "…asks whether the tower is taller or shorter than 900 m, then asks its height."
- **AN3 (LOW).** c3 and misconception m3 say "experienced judges". The abstract says "experienced legal professionals" and "legal experts". Use "legal experts".
- **AN4 (LOW).** Several feedback lines are untested: "Looking longer keeps the number in mind" (s3 hook b), "Repeating the number keeps it in mind, so the pull stays" (s3 guided 1 b, item 15 b), and "Waiting lets the seller set the next number too" (item 15 c). Fix: "That does not bring reasons against the number to mind."
- **AN5 (LOW).** Item 14 (an expert car pricer) cites only `judges`. Mussweiler et al. Study 1 tested "experts as participants" in "a real-world setting". Add `opposite` to its `sourceRefs`.

## confirmation-bias

| Claim | Verdict | Quote |
|---|---|---|
| c1 focus on what fits | SUPPORTED | "The confirmation bias is the tendency to focus on information that confirms your existing beliefs." ([OpenStax Psychology 2e 7.3](https://openstax.org/books/psychology-2e/pages/7-3-problem-solving)) |
| c2 test p and not-q | SUPPORTED | "any rule that follows the form 'if p then q' is tested by turning over p and not-q, the only two cards that can falsify the rule." ([Dawson et al. 2002](https://web.mit.edu/curhan/www/docs/Articles/biases/Dawson_Gilovich_Regan_Motivated_Reasoning_and_Wason_Selection_Task.pdf)) |
| c3 6 of 29 | SUPPORTED | "Six out of 29 subjects reached the correct conclusion without previous incorrect ones" ([Wason 1960](https://bear.warrington.ufl.edu/brenner/mar7588/Papers/wason-qjep1960.pdf)) |
| c4 about 1 in 5 | SUPPORTED | "the success rate in the typical study is only around 20%" (Dawson et al.) |

**Problems:**

- **CB1 (MED).** Item 10 (Diya's horoscope app) is culturally loaded. Astrology is part of family and religious practice for many Indian learners, so calling a horoscope "weak proof" can read as an attack on belief, and that pulls attention away from the bias. Fix: use neutral content with the same logic, for example "Diya's 'lucky day' app" or "a friend who says he can sense when someone will call".
- **CB2 (LOW).** The hook says people "turned a card that could prove the rule right".
  - No card can prove the rule right, and the q card cannot break it. The source says only that "The two most common errors are the unnecessary inclusion of the q card and failure to name the not-q card". It does not say "most people".
  - Fix: "In Wason's card task, people often turned a card that could only agree with the rule and skipped the one that could break it."
- **CB3 (LOW).** Item 15's logic: crowds coming in a week with no ad do not show that ads bring no crowds. Fix the correct option to "Compare crowds in weeks with and without the ad."
- **CB4 (LOW).** s3 hook "every crow is black": India's common house crow has a grey neck, so some learners may find the premise already false. This is general knowledge and was not checked against a source this session. Consider "every swan is white" or a made-up rule.
- **CB5 (LOW).** No nuance is given. Klayman & Ha (1987): "the positive test strategy can be a very good heuristic for determining the truth or falsity of a hypothesis under realistic conditions." One line in s2 teach would keep the lesson from sounding as if testing fitting cases is always wrong.

## social-proof

| Claim | Verdict | Quote |
|---|---|---|
| c1 36.8%, under 1% alone, 12 of 18 | SUPPORTED | "wrong judgments in 36.8 per cent of the selections"; "individuals matching the lines will make mistakes less than 1 per cent of the time"; "There are 18 trials in each series, and on 12 of these the majority responds erroneously." ([Asch 1955](https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Influence_Compliance/Asch_1955_Opinions_and_social_pressure.pdf)) |
| c3 people take the group as a guide to what is right | PARTLY | Asch: one group "quickly reached the conclusion: 'I am wrong, they are right.'" OpenStax, for Asch: "participants did not need to rely on the group for information … an instance of normative social influence." |
| c4 a group can agree on a wrong answer | SUPPORTED | Asch: the majority "responds erroneously" and unanimously |
| c5 about a quarter never went along | SUPPORTED | "about one quarter of the subjects were completely independent and never agreed with the erroneous judgments of the majority" |

**Problems:**

- **SP1 (HIGH).** See "Fix before release" item 1.
- **SP2 (MED).** The everyday crowd-choice tries rest on no cited source: the s1 example (everyone orders dosa), s1 guided 2 (10 crore views), item 9 (chai stall queue) and item 11 (busiest dhaba). Asch tested line judgments made aloud in a group, not picking a stall or a song. Fix: cite an informational-influence source for these (option 2 of SP1), or move them out of an Asch-backed step.
- **SP3 (LOW).** The s2 hook and teach present "about a third" as a general fact.
  - The participants were "a total of 123 subjects from three institutions of higher learning" in 1950s America. Bond & Smith (1996) found US conformity "has declined since the 1950s" and varies by culture.
  - Fix: "In Asch's 1950s study…". Do not add any claim that Indians, or any group, conform more.

## planning-fallacy

| Claim | Verdict | Quote ([Buehler et al. 1994 abstract](https://doi.org/10.1037/0022-3514.67.3.366), read via OpenAlex) |
|---|---|---|
| c1 own tasks guessed too short | SUPPORTED | "Ss' predictions of their completion times were too optimistic for a variety of academic and nonacademic tasks." |
| c3 linking past tasks removed the bias | SUPPORTED | "In Study 4, the optimistic bias was eliminated for Ss instructed to connect relevant past experiences with their predictions." |
| c4 focus on the plan, not on the past | SUPPORTED | "people focus on plan-based scenarios rather than on relevant past experiences" |
| c5 observers guessed long | SUPPORTED | "observer Ss overestimated others' completion times and made greater use of relevant past experiences." |
| c6 external, one-off causes | SUPPORTED | "Ss attributed their past prediction failures to relatively external, transient, and specific factors." |

**Problems:**

- **PF1 (MED).** s1 hook feedback: "they guessed 34 days and took about 56".
  - These numbers are not in the cited abstract, and the full paper was blocked (Incapsula). Web summaries give 33.9 and 55.5 days for 37 thesis students, but these are secondary sources.
  - Fix: confirm against the full text, or say "In one study of student theses, finishing took weeks longer than the guess."
- **PF2 (LOW).** Item 13 (order: list the missed steps, add time for each) and the s2 framing teach "unpacking" the task. That is not what Buehler tested; his fix was linking past experiences. Fix: make step b "Recall how long similar posters really took", or cite a source for unpacking.
- **PF3 (LOW).** Item 9 applies the finding to a fest team. Buehler studied individuals. Say "Guesses for our own tasks, alone or in a team, often run short" only with a source for groups; otherwise make the item about one student.

## sleep-memory

| Claim | Verdict | Quote |
|---|---|---|
| c1 sleep reduced forgetting vs time awake | SUPPORTED | "Sleep after learning reduced the amount of forgetting." This credits Jenkins & Dallenbach's comparison with an equal waking interval ([Rasch & Born 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3768102/), read via WebFetch) |
| c2 quiet waking rest helped | SUPPORTED | "brief periods of quiet waking rest following learning benefits memory, in comparison to equivalent periods of time spent engaged in sensorimotor or cognitive tasks" ([Wamsley 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC7024394/)) |
| c3 consolidation | SUPPORTED | "During consolidation, the labile memory trace is gradually stabilized" (Rasch & Born) |
| c4 pilot: 8 people, age 59, 20.4 vs 12.6 | SUPPORTED | "We tested eight healthy participants in our pilot study"; "The mean age … was 59 ± 1.65 years"; "the A–B pair score at 12 h was significantly greater in the sleep condition (20.38 ± 1.61) than the wake condition (12.63 ± 1.74)" ([Atherton et al. 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4007033/)) |

**Problems:**

- **SL1 (HIGH).** See "Fix before release" item 2. The motor-skill tries are the s2 example and s2 guided 2.
- **SL2 (MED).** The topic's only sleep figure (s2 teach, items 12 and 13) comes from an n = 8 pilot run to set up a study of epilepsy patients ("we piloted our task to ensure that we had a robust sleep effect in healthy over 50s").
  - Item 13 handles the small sample well, but a stronger source exists. Berres & Erdfelder (2021) pooled 823 effect sizes: "a moderate overall sleep benefit in episodic memory (g = 0.44)", and g = 0.28 after a bias correction.
  - Fix: use the meta-analysis in s2 teach. Keep the pilot only as the worked percentage example, if at all.
- **SL3 (LOW).** Item 11 (cramming until 3 a.m.): "His new formulas have had little time to firm up" is an inference that no cited source tests. Fix: "He has had little sleep after learning, so he gets less of sleep's help against forgetting."
- **SL4 (LOW).** Rest lengths: Wamsley reports "a 15min period of eyes-closed rest". The content uses "ten minutes" (s3 hook, item 15) and "five minutes" (s3 guided 1). Reels are not tested in any cited study. Fix: "10 to 15 minutes". Keep reels only as "a busy task".
- **SL5 (LOW).** The s1 example ("notes on the Mughals"): Mughal history is a live syllabus dispute in India. This is general knowledge and was not checked against a source this session. Optional: swap to a neutral subject such as "notes on photosynthesis".

## variable-rewards

| Claim | Verdict | Quote |
|---|---|---|
| c1 high steady rate; slow to fade | SUPPORTED | "The variable ratio schedule is unpredictable and yields high and steady response rates"; "In a variable ratio schedule, the point of extinction comes very slowly" ([OpenStax Psychology 2e 6.3](https://openstax.org/books/psychology-2e/pages/6-3-operant-conditioning)) |
| c2 endless scroll, blue ticks | SUPPORTED | "Elements used to prolong usage time … Endless scrolling/streaming"; "If the recipient reads the message, the grey ticks turn blue. As both sides know about these rules, social pressure emerges." ([Montag et al. 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6679162/)) |
| c3 the number of responses varies | SUPPORTED | "In a variable ratio reinforcement schedule, the number of responses needed for a reward varies." |
| c4 continuous reinforcement teaches fastest | SUPPORTED | "This reinforcement schedule is the quickest way to teach someone a behavior" |
| c5 over a million posts; many motives | SUPPORTED | "We analyze over one million posts from over 4000 individuals … social media users spaced their posts to maximize the average rate of accrued social rewards"; "a variety of motives might lead people to use social media" ([Lindström et al. 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC7910435/)) |

**Problems:**

- **VR1 (MED).** The content mixes two reward schedules.
  - The s2 hook ("pull down to refresh … for new likes") and item 14 (Zoya refreshing for likes) use variable-ratio facts, including s2 teach's "the hardest kind of habit to fade".
  - Likes arrive over time, not per refresh, which is closer to a variable-interval schedule. OpenStax says that schedule "produces a moderate, steady response rate", and it keeps "most resistant to extinction" for variable ratio.
  - Lindström studied when people post, not how often they refresh.
  - Fix: keep swiping through a feed as the main example (each swipe may show a good post, which is close to variable ratio). For likes, say "a similar pull: you cannot tell when the next like comes." Move "hardest to fade" to the gambling line only.
- **VR2 (LOW).** The concept hook cites only `operant`. Montag gives the direct link: "the user finds from time to time something rewarding (e.g., a funny or interesting video), hence intermittent conditioning principles are observed here". Add `scroll-review`.
- **VR3 (LOW).** Item 13 (a chai machine that paid every time vs a lucky-draw box) rests on the partial-reinforcement extinction effect. OpenStax does not compare continuous reinforcement directly; it says only "in the other reinforcement schedules, extinction may come quickly". The item is acceptable, but its support is indirect.
- **VR4 (LOW).** s2 guided 2 (mela ring toss) is partly skill, not pure chance. A raffle or a lucky-draw slip fits the lesson better.

## if-then-plans

| Claim | Verdict | Quote |
|---|---|---|
| c1 when, where, how; if Y then X | SUPPORTED | "an implementation intention that spells out the when, where, and how of goal striving in advance ('If situation Y is encountered, then I will initiate goal-directed behavior X!')" ([Gollwitzer & Sheeran 2006](https://www.socmot.uni-konstanz.de/sites/default/files/06_Gollwitzer_Sheeran_Implementation_Intentions_And_Goal.pdf), p. 69) |
| c2 94 tests, medium-to-large | SUPPORTED | "Findings from 94 independent tests showed that implementation intentions had a positive effect of medium-to-large magnitude (d = .65) on goal attainment." |
| c3 cue easier to spot, response automatic | SUPPORTED | "increasing the activation of the anticipated situational cue (the if–process) and automating the goal–directed response to that cue" (Parks-Stamm et al. 2007, abstract via OpenAlex) |
| c4 other cues passed over | SUPPORTED | "When implementation intentions achieved their effects by facilitating cue identification (the if–process), alternative cues were disregarded (Study 1)." |

**Problems:**

- **IT1 (MED).** s3 teach, the s3 visual and item 15 present d = 0.65 as "the" effect.
  - That figure is from 2006. The 2025 meta-analysis of 642 tests gives ".27 ≤ d ≤ .66" across outcomes, with larger effects "when plans had a contingent (if-then) format, participants were highly motivated to pursue the goal, and plans were rehearsed."
  - Fix: "In a 2006 review of 94 tests the effect was medium to large (0.65); a larger 2025 review found small to medium-large effects, biggest when people really wanted the goal and rehearsed the plan." Item 15 can stay if it says "In a 2006 review".
- **IT2 (LOW).** Item 12 (Isha waits for the 8 p.m. bell) carries a lab finding about cue detection into daily life. The "might" keeps it fair; no change is needed beyond keeping "might".

## spotlight-effect

| Claim | Verdict | Quote |
|---|---|---|
| c1 T-shirt wearers overestimated | SUPPORTED | "participants who were asked to don a T-shirt depicting either a flattering or potentially embarrassing image overestimated the number of observers who would be able to recall what was pictured on the shirt" ([Gilovich et al. 2000](https://pubmed.ncbi.nlm.nih.gov/10707330/)) |
| c2 good and bad remarks | SUPPORTED | "participants in a group discussion overestimated how prominent their positive and negative utterances were" |
| c3 expected harsher judgment | SUPPORTED | Actors "anticipated being judged more harshly by others than they actually were." ([Savitsky et al. 2001](https://pubmed.ncbi.nlm.nih.gov/11474724/)) |
| c4 anchor on one's own view | SUPPORTED | "people appear to anchor on their own rich phenomenological experience and then adjust--insufficiently" |
| c5 focus on the mishap | SUPPORTED | "inordinately focused on their misfortunes and by their resulting failure to consider the wider range of situational factors" |

**Problems:**

- **SE1 (LOW).** s1 hook feedback: "people guessed twice as many noticed their shirt as really did". The ratio is not in the cited abstract. Secondary write-ups give about 46% guessed vs about 23% actual; the full text was not opened. Fix: say "far more" unless the full text is checked.
- **SE2 (LOW).** "Others usually judge our slips more kindly than we fear" (s3 takeaway) generalises from student lab studies. No large replication was found this session. Keep "in studies" in the takeaway: "In studies, others judged slips more kindly than people feared."
- **SE3 (LOW).** The s3 example ("most just notice the stage is slippery") and item 16 ("Onlookers more likely think the floor is wet") state what onlookers think. The source says only that actors fail to consider situational factors. Fix: "onlookers may also notice the slippery stage".

---

## Notes for the builder

- The builder's `factCheck.checker` lines say several sources were checked from abstracts only: Buehler, Mussweiler, Parks-Stamm, Gollwitzer & Sheeran, and the PubMed items. Yet items rely on numbers that are not in those abstracts (PF1, SE1, AN1). Mark such items `partly` until the full text is read.
- Every sleep, habit and spotlight tip stays educational and makes no health promise. Keep it that way when fixing SL1 and SL2.
- Do not "fix" SP3 by adding culture comparisons. The Bond & Smith finding is a group average and is easy to misread as a stereotype.
