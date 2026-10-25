# cj10 fact-check: Chiku scenes (Psychology pilot)

Job 1 of `docs/cloud-jobs/batch-10.md` (25 Oct 2026).
Draft checked: `content-drafts/chiku/psychology.scenes.json` (10 scenes, branch `ideas/cj9-chiku-scenes`).
Spec: `docs/specs/30-teach-chiku-one-card.md` (branch `ideas/spec-30-chiku`).
Pack: `content/topics/topic.psychology.json`.
Corrected copy: `content-drafts/chiku/psychology.scenes.checked.json` (same shape, every FIX applied).

## Result

| Verdict | Count | Scenes |
|---|---|---|
| PASS | 0 | none |
| FIX | 10 | all ten |
| DROP | 0 | none |

The checks:
1. The right card is the cause the cited claims support (source quoted).
2. Each wrong card is a real misconception of that idea (the id exists, the text means the same thing).
3. The new day separates the cards: the truth follows from the right card, each wrong card predicts something else, and the source supports the truth.
4. Chiku's "why" lines restate the card fairly.
5. Wording rules; prop and act from the fixed lists; ages and names respectful.

Checks that passed for all ten, draft and checked copy alike:
- Every `misconceptionId` exists in the pack under the same idea. Every `claimId` exists.
- Every prop is on the spec's list of 24. Every act is on the spec's list of 10.
- No "wrong", "should" or "your brain". No banned franchise or puzzle words.
- Ages are 18 to 25. Names are varied and neutral. No stereotypes.
- Each wrong card's guess gives a different answer from the truth.

Problem that showed up in most scenes: the ask is "Why did X do Y?", but the wrong cards don't answer it. "One check erases the pull" or "The crowd proves it" can't be the reason someone checked. Then the wrong card isn't tempting and the game becomes a word match. The spec's own example uses wrong cards that are real rival causes ("Wanting to revise"). Where this happened, the ask or the card was changed so all three cards answer the question.

Note for the builder: in all ten drafts the right card is listed first. The spec says the app rotates its position. The checked copy keeps the data order.

## How sources were opened

| Source id | What was read | Opened? |
|---|---|---|
| `lally` | PDF at the pack URL, via WebFetch (curl got "connection reset"). Text pulled with pdftotext. | Yes |
| `wood`, `wood-move`, `tversky`, `judges`, `spotlight-paper`, `harsh` | The pubmed.ncbi.nlm.nih.gov pages showed only a "Cookies must be enabled" wall. Abstracts read from NCBI's public E-utilities instead: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=<PMID>&rettype=abstract&retmode=text` | Abstract only |
| `opposite`, `planning`, `plan-study` | The DOI goes to a paywalled publisher page. Abstracts read from OpenAlex: `https://api.openalex.org/works/https://doi.org/<DOI>` | Abstract only |
| `plan-meta` (Gollwitzer & Sheeran 2006) | No open abstract found. OpenAlex has none, and the publisher is paywalled. | **Not opened** |
| `prospect`, `wason`, `wason-246`, `asch-original` | Open PDFs at the pack URLs. Text pulled with pdftotext. | Yes |
| `philosophy`, `asch`, `operant` | OpenStax pages | Yes |
| `sleep-review`, `sleep-rest` | PMC full text | Yes |
| Gilovich 2000 full text (for the real numbers) | Not found as a legal open copy. The figures come from a secondary source, Cornell Alumni Magazine. | Full text **not opened** |

No Sci-Hub, mirror or paywall bypass was used.

---

## 1. habits: FIX

Claims: `habits-c1`, `habits-c5`.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK | "The train leaving" is the cue in a stable setting (c1). |
| 2 Wrong cards | Fix | `habits-m1` ("One fixed day count") is real, but the card said "Thirty days" while the ask said "30 rides". Days and rides don't match. `habits-m3` ("Goal replaces cue") matches. |
| 3 New day | OK, with a note | Taking the bus removes the train cue, so the habit is less likely. The truth is one person's likely outcome, not a certainty. Wood 2005 also says intentions can then take over. The pack's own item `habits-9` frames it the same way ("less likely"). |
| 4 Why lines | Fix | The m1 line said "ride count" but the card said days. |
| 5 Wording, props, acts | Fix | "Opens her flashcards" and "left her flashcards in her pocket" don't fit the phone acts. Changed to "flashcard app" and "phone", as in the spec example. |

Quotes:
- Wood & Neal 2007, https://pubmed.ncbi.nlm.nih.gov/17907866/ (abstract via E-utilities): "Habits emerge from the gradual learning of associations between responses and the features of performance contexts that have historically covaried with them (e.g., physical settings, preceding actions). Once a habit is formed, perception of contexts triggers the associated response without a mediating goal."
- Wood, Tam & Witt 2005, https://pubmed.ncbi.nlm.nih.gov/15982113/ (abstract via E-utilities): "the exercising, newspaper reading, and TV watching habits of students transferring to a new university were found to survive the transfer only when aspects of the performance context did not change" and "In some cases, the disruption in habits also placed behavior under intentional control so that participants acted on their current intentions."
- Lally et al. 2010, https://repositorio.ispa.pt/server/api/core/bitstreams/370f1dca-cc04-4d3d-a0f0-36d16109ec37/content : "As behaviours are repeated in consistent settings they then begin to proceed more efficiently and with less thought as control of the behaviour transfers to cues in the environment that activate an automatic response: a habit." Also "18 to 254 days", which is what refutes m1.

Fixes:
- Ask: "After 30 days of train rides, Noor, 20, opens her flashcard app as the train leaves."
- m1 card: "30 days locked it in". m1 why: "Your card says 30 days locked it in. Her 30 days are done."
- Question: "Will she open her flashcard app as usual?"
- Right why: "Your card says the train starts it. No train today."
- Truth: "On the bus, Noor's phone stayed in her pocket. She forgot the app."

## 2. loss-aversion: FIX

Claims: `loss-aversion-c1`, `loss-aversion-c2`.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK | "No loss from her start": outcomes are judged from a reference point (c1). |
| 2 Wrong cards | OK | `m1` "Gains and losses feel equal" matches "Equal feel". `m3` "The starting point changes nothing" matches "Wording never matters" (same result, different start point). |
| 3 New day | Fix | The draft caption framed the toss as end states ("leave her with $20 or $0"). Kahneman & Tversky show that framing decides whether a choice reads as gain or loss. The truth (she refuses) only follows if the toss is framed as losing the $10 she was handed. Reworded to "could win her $10 more or lose that $10". |
| 4 Why lines | Fix | "Losing it weighs heavily" overstates c2 ("weighs more than a gain of the same size"). The line also didn't restate the card (judging from the start). |
| 5 Wording | Fix | "Why does it feel easy to accept?" The pack's 22 Oct fix moved this idea from feelings to choices. Now "Why is yes an easy choice?". The money is a free cafe toss, with no stake and no advice. |

Quotes (Kahneman & Tversky 1979, https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Behavioral_Decision_Theory/Kahneman_Tversky_1979_Prospect_theory.pdf):
- "Gains and losses, of course, are defined relative to some neutral reference point. The reference point usually corresponds to the current asset position ... However, the location of the reference point, and the consequent coding of outcomes as gains or losses, can be affected by the formulation of the offered prospects, and by the expectations of the decision maker."
- "losses loom larger than gains. The aggravation that one experiences in losing a sum of money appears to be greater than the pleasure associated with gaining the same amount ... most people find symmetric bets of the form (x,.50; -x,.50) distinctly unattractive."
- Problems 11 and 12 ("In addition to whatever you own, you have been given 1,000 / 2,000") show that the same final states get different choices depending on how they are framed.

Fixes:
- Ask: "A cafe offers Leila, 22, a free coin toss: win $20 or get $0. Why is yes an easy choice?"
- Caption: "New day: The cafe hands Leila $10 first. The toss could win her $10 more or lose that $10."
- Right why: "Your card says she judges from her start. Today the toss can take $10 from it, and a loss weighs more than a same-size gain."
- m3 why: "Your card says the starting point changes nothing. She said yes to a toss before."

Note: c2 says "most people". The truth is one person's typical choice. `loss-aversion-m2` ("Always true") is not on the cards, so this is acceptable.

## 3. anchoring: FIX

Claims: `anchoring-c1`, `anchoring-c4`. Added `anchoring-c2` (the random-number study backs the random wheel).

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK | A first number pulls a later judgement (c1). |
| 2 Wrong cards | Fix | `m2` and `m4` are real. But "Random numbers have no pull" and "One check erases the pull" didn't answer "Why did she raise her bid?". The tag wasn't random and she didn't check it. Reworded so each is a rival reason: "Only real prices pull offers" (m2) and "Questioning it would erase the pull" (m4). The day 1 ask now says she does not question the tag. |
| 3 New day | Fix | The question referred to "her earlier $50 plan", but day 1 never mentioned a plan. The $50 plan now starts in day 1. The separation is good: a random wheel (m2) plus two reasons against it (m4) still leave a pull, smaller than day 1 ($55 against $70). |
| 4 Why lines | OK, reworded | Right why now names the card plus the random number. |
| 5 Wording | Fix | "Bid" at a shop changed to "offer". Note: the sources study estimates (country counts) and sentences. Applying them to a price offer is a step beyond them. The pack already does this in its own s1 tag item. |

Quotes:
- OpenStax, https://openstax.org/books/introduction-philosophy/pages/2-2-overcoming-cognitive-biases-and-engaging-in-critical-reflection : "Anchoring bias refers to our tendency to rely on initial values, prices, or quantities when estimating"; "For subjects receiving an initial value of 10, the median estimate of nations was 25, while for subjects receiving an initial value of 65, the median estimate was 45."; "Even though the initial anchoring value was random, people in the study found it difficult to deviate far from that number."
- Tversky & Kahneman 1974, https://pubmed.ncbi.nlm.nih.gov/17835457/ (abstract via E-utilities): "adjustment from an anchor, which is usually employed in numerical prediction when a relevant value is available."
- Englich, Mussweiler & Strack 2006, https://pubmed.ncbi.nlm.nih.gov/16382081/ (abstract via E-utilities): "experienced legal professionals are influenced by irrelevant sentencing demands even if they are blatantly determined at random."
- Mussweiler, Strack & Pfeiffer 2000, https://doi.org/10.1177/01461672002611010 (abstract via OpenAlex): "listing arguments that speak against a provided anchor value reduces the effect" and "the effects of anchoring and considering the opposite are additive." The abstract says "reduces", not "removes". The truth ("shrank the pull, but it was still there") keeps to that.

Fixes:
- Ask: "Maya, 24, plans to offer $50 for a used desk. She sees a $100 tag, does not question it, and offers $70. Why?"
- Cards: "First numbers pull offers" / "Only real prices pull offers" (m2) / "Questioning it would erase the pull" (m4).
- Caption: "New day: For another desk, a random wheel lands on $100. Maya lists two reasons it is too high."
- Question: "Will she still offer more than her $50 plan?"
- Truth: "Maya offered $55. Her reasons shrank the pull, but it was still there."

## 4. confirmation-bias: FIX

Claims: `confirmation-bias-c2`, `confirmation-bias-c3`.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK | An "every bus" rule is tested by a case that could prove it false (c2). |
| 2 Wrong cards | Fix | `m1` and `m3` are real, but "Many matches prove it" doesn't answer "Why test it?". Ask changed to "What can show if he is right?", which all three cards answer. |
| 3 New day | Fix | In the draft, the m1 and m3 guesses had Omar keep his guess after a clear early bus. Those misconceptions are about what proves a rule, not about ignoring a counterexample. The draft new day didn't give the m1/m3 holders anything to count. The new day now shows two more late buses and then one early bus. Card m1/m3 holders count matches and say the guess holds. The right card says one early bus breaks an "every" rule. That truth is logic, as c2 states. |
| 4 Why lines | Fix | Rewritten to match the new cards. |
| 5 Wording | OK | |

Quotes:
- Dawson, Gilovich & Regan 2002, https://web.mit.edu/curhan/www/docs/Articles/biases/Dawson_Gilovich_Regan_Motivated_Reasoning_and_Wason_Selection_Task.pdf : "any rule that follows the form 'if p then q' is tested by turning over p and not-q, the only two cards that can falsify the rule." and "confirmation bias leads people to turn over cards that could confirm the rule, when the correct response is to seek information that potentially disconfirms the rule."
- Wason 1960, https://bear.warrington.ufl.edu/brenner/mar7588/Papers/wason-qjep1960.pdf : "use of confirming evidence alone will almost certainly lead to erroneous conclusions because (i) the correct concept is entailed by many more obvious ones" and "Six out of 29 subjects reached the correct conclusion without previous incorrect ones".

Fixes:
- Ask: "Omar, 21, has seen three late buses. He guesses every bus on his route is late. What can show if he is right?"
- Cards: "Watching for an early bus" / "One late bus proves it" (m1) / "Many late buses prove it" (m3).
- Caption: "New day: Omar sees two more late buses, then one early bus." Question: "Does his every-bus-is-late guess still hold?" Truth `no`.
- Truth caption: "One early bus shows not every bus is late. Omar crossed out his guess."

## 5. social-proof: FIX

Claims: `social-proof-c4`, `social-proof-c5`.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK, reworded | c4 says "agreement alone is a clue, not proof". The card now says that directly: "A clue, but not proof". |
| 2 Wrong cards | Fix | `m1` and `m4` are real. As answers to "Why check?" they weren't reasons. "Everyone follows the crowd" also clashed with day 1, where Eva checks the sign. Ask changed to "What does a whole group agreeing tell her?" Cards: "Proof that it is right" (m1) and "Something everyone follows" (m4). |
| 3 New day | OK, with a note | Clear sign against a group: the right card predicts she goes with the sign. m1 and m4 predict she follows the group. Asch's data support "most answers held out" but not "she certainly holds out": yielding was 36.8% of answers, and about a quarter never yielded. The truth is the more common outcome, not a law. "Another group" changed to "a group of strangers", which is closer to Asch's setup. |
| 4 Why lines | Fix | Rewritten to match the new cards. |
| 5 Wording | OK | The `skip` act for "stays with the group" is a loose fit, but it is on the list. |

Quotes:
- Asch 1955, https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Influence_Compliance/Asch_1955_Opinions_and_social_pressure.pdf : "the minority subjects swung to acceptance of the misleading majority's wrong judgments in 36.8 per cent of the selections. Of course individuals differed in response. At one extreme, about one quarter of the subjects were completely independent and never agreed with the erroneous judgments of the majority."
- OpenStax Psychology 2e 12.4, https://openstax.org/books/psychology-2e/pages/12-4-conformity-compliance-and-obedience : "the confederates identified a line segment that was obviously shorter than the target line—a wrong answer" and "people conform because they believe the group is competent and has the correct information."

Fixes:
- Ask: "Eva, 19, sees her friends all point to platform 2. What does a whole group agreeing tell her?"
- Cards: "A clue, but not proof" / "Proof that it is right" (m1) / "Something everyone follows" (m4).
- Caption: "...but a group of strangers points to platform 2." Question: "Will Eva walk to platform 3?"
- Truth: "Eva read the sign and walked to platform 3."

## 6. planning-fallacy: FIX

Claims: `planning-fallacy-c3`, `planning-fallacy-c4`. Added `planning-fallacy-c1` (own guesses run short), which is what the new truth rests on.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK | "Past tasks show missed time" matches c3 and the m2 correction ("Past task times can show steps a new plan has missed"). |
| 2 Wrong cards | Fix | `m1` and `m2` are real. "Past tasks cannot help" can't be why Theo added an hour after checking the past. Ask changed to "Which idea helps his plan?", which all three cards answer. |
| 3 New day | Fix | In the draft, the truth was Theo's own choice ("he started early"), which followed from whichever card he held. It wasn't a fact about the world. c4 also says people seldom use the past unless prompted, so the source doesn't back "he started early" by default. New truth: a 2-hour plan with no slack runs long again. That follows from c1 ("too optimistic") and from the right card. m1 and m2 both predict 2 hours is enough. |
| 4 Why lines | Fix | Rewritten for the new question. |
| 5 Wording | OK | Acts: `open-book` = still working, `close-book` = done. |

Quote (Buehler, Griffin & Ross 1994, https://doi.org/10.1037/0022-3514.67.3.366, abstract via OpenAlex): "Ss' predictions of their completion times were too optimistic for a variety of academic and nonacademic tasks. Think-aloud procedures revealed that Ss focused primarily on future scenarios ... In Study 4, the optimistic bias was eliminated for Ss instructed to connect relevant past experiences with their predictions."

Fixes:
- Ask: "Theo, 20, plans a new poster. His last one ran an hour over, in the printer line. Which idea helps his plan?"
- Cards: "Past tasks show missed time" / "The smooth plan is normal" (m1) / "Past tasks cannot help" (m2).
- Caption: "New day: Theo makes the poster on a 2-hour plan with no time for the printer line." Question: "Will the poster take longer than 2 hours?"
- Truth: "The printer line took an hour again. The poster took 3 hours."

## 7. sleep-memory: FIX (small)

Claims: `sleep-memory-c1`, `sleep-memory-c2`.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK | Quiet rest (c2) and sleep (c1) after learning both help keep it. |
| 2 Wrong cards | OK | `m3` "Staying up works better" and `m5` "Busy breaks help more" match. |
| 3 New day | OK | Sleep against chores. The right card predicts sleep; m3 and m5 predict staying up. |
| 4 Why lines | Fix | The right "why" said "sleep" while the card says "rest". The line now links the two. |
| 5 Wording | Fix | The truth said "then recalled the new words at the quiz". With no comparison, that hints at a promised result. Trimmed to "then took the quiz". No health claim. |

Quotes:
- Rasch & Born 2013, https://pmc.ncbi.nlm.nih.gov/articles/PMC3768102/ : "Over more than a century of research has established the fact that sleep benefits the retention of memory." Section II.A, on Jenkins and Dallenbach: "Sleep after learning reduced the amount of forgetting".
- Wamsley 2019, https://pmc.ncbi.nlm.nih.gov/articles/PMC7024394/ : "Recent studies show that brief periods of rest after learning facilitate consolidation of new memories", "in comparison to equivalent periods of time spent engaged in sensorimotor or cognitive tasks."

Fixes:
- Right why: "Your card says rest helps keep new learning. Sleep after learning can cut forgetting."
- Truth: "Inez slept after studying, then took the quiz."

## 8. variable-rewards: FIX

Claims: `variable-rewards-c1`, `variable-rewards-c3`.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK | "The next prize is uncertain" matches c1 ("never know when the next reward is coming"). |
| 2 Wrong cards | Fix | `variable-rewards-m3` is "It is just willpower": checking is a matter of willpower, and the correction is "whatever their willpower". The draft card "Only willpower keeps him going" turned that into willpower driving the play, which is a different idea. Card now: "It all comes down to willpower". `m6` "Steady prizes last longer" matches. |
| 3 New day | Fix | The draft's "tired" setup didn't separate m3: on the willpower view, tired could mean more tries or fewer. New setup: Sam is rested and calm. The willpower view predicts he stops. The right card predicts he tries again. The truth (another try after three empty ones) is backed by the high, steady rate and slow extinction. Note: OpenStax does not mention willpower. That point comes from the pack's own m3 correction, not from a quote. |
| 4 Why lines | Fix | Right why now restates c3 ("never knows which try will pay"). |
| 5 Wording | OK | Arcade coin, no gambling or money advice. The truth shows the pull, not a reward for it. |

Quote (OpenStax Psychology 2e 6.3, https://openstax.org/books/psychology-2e/pages/6-3-operant-conditioning): variable ratio is reinforcement "after an unpredictable number of responses"; it gives a "High and steady response rate"; "the point of extinction comes very slowly"; the gambler "never knows when the next reinforcement is coming."

Fixes:
- Ask: "...a prize box that pays after a changing number of tries."
- m3 card: "It all comes down to willpower".
- Caption: "New day: Sam is rested and calm. His first three tries win nothing, and the next prize has no set turn."
- Whys: "Your card says he never knows which try will pay. That keeps tries going after empty ones." / "Your card says it comes down to willpower. He is rested today, so he stops." / "Your card says uneven prizes fade faster than steady ones. Three empty tries end it."

## 9. if-then-plans: FIX (small)

Claims: `if-then-plans-c1`, `if-then-plans-c3`, `if-then-plans-c4`.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | OK | The named bus is the "if" cue (c1, c3). |
| 2 Wrong cards | OK | `m1` "A wish is enough" matches "A wish is a plan". `m3` "One sharp cue costs nothing" matches. |
| 3 New day | OK | No bus, but another good chance (a free hour). c4 and Parks-Stamm: other cues were passed over. The m1 and m3 guesses predict she uses the hour. Good separation. |
| 4 Why lines | Fix | The m1 why said "She still wants to write", but day 1 never said why she opens the notebook. Day 1 now says "to study", and the why matches. |
| 5 Wording | Fix | "canceled" changed to "cancelled", to match the spec and the money pack. |

Quotes:
- Parks-Stamm, Gollwitzer & Oettingen 2007, https://doi.org/10.1521/SOCO.2007.25.2.248 (abstract via OpenAlex): if-then plans work "by two processes: increasing the activation of the anticipated situational cue (the if–process) and automating the goal–directed response to that cue" and "When implementation intentions achieved their effects by facilitating cue identification (the if–process), alternative cues were disregarded (Study 1)."
- Gollwitzer & Sheeran 2006 (`plan-meta`), https://doi.org/10.1016/S0065-2601(06)38002-1 : **not opened**, no legal open copy found. c1 (the if-then format) is also given in the Parks-Stamm abstract above.

## 10. spotlight-effect: FIX

Claims: `spotlight-effect-c1`, `spotlight-effect-c4`.

| Check | Result | Reason |
|---|---|---|
| 1 Right card | Fix | "Her own view feels larger" was vague: larger than what? It also didn't separate from m2. "Fewer than she thinks" fits both "some" and "none". New card: "Some, but fewer than she thinks", which joins c1 with the m2 correction ("Some people may take note. The guess is often too high"). |
| 2 Wrong cards | Fix | `m1` and `m2` are real, but they weren't reasons to "check". Ask changed to "How many really did?". |
| 3 New day | OK after fix | All six (m1), none (m2), some (right). Truth: one of six recalled it. That is close to the real rate: under a quarter recalled, against a guess of about half. |
| 4 Why lines | Fix | Right why restated for the new card. |
| 5 Wording | OK | |

Quotes:
- Gilovich, Medvec & Savitsky 2000, https://pubmed.ncbi.nlm.nih.gov/10707330/ (abstract via E-utilities): "participants who were asked to don a T-shirt depicting either a flattering or potentially embarrassing image overestimated the number of observers who would be able to recall what was pictured on the shirt" and "people appear to anchor on their own rich phenomenological experience and then adjust--insufficiently--to take into account the perspective of others."
- Secondary, because the full paper wasn't opened. Cornell Alumni Magazine, https://cornellalumnimagazine.com/things-that-make-you-go-hmm : "The average answer was about half; the reality was less than a quarter."

Fixes:
- Ask: "At a workshop, Zoya, 25, feels sure all six classmates noticed her bright shirt. How many really did?"
- Cards: "Some, but fewer than she thinks" / "All six noticed it" (m1) / "Nobody ever notices" (m2).
- Right why: "Your card says some notice, but fewer than her own view suggests."
- Truth: "One classmate recalled the shirt, so Zoya wrote 'some noticed'."

---

## All fixes in one list

| Scene | Fields changed |
|---|---|
| habits | ask, m1 card, question, all 3 whys, truth caption |
| loss-aversion | ask, caption, right and m3 whys |
| anchoring | claimIds (+c2), ask, m2 and m4 cards, caption, question, all 3 whys, truth caption |
| confirmation-bias | ask, all 3 cards, caption, question (answers flipped: truth now `no`), all 3 whys, truth caption |
| social-proof | ask, all 3 cards, caption, all 3 whys, truth caption |
| planning-fallacy | claimIds (+c1), ask, m1 card, caption, question, all 3 whys, truth caption |
| sleep-memory | right why, truth caption |
| variable-rewards | ask, m3 card, caption, all 3 whys |
| if-then-plans | ask, caption spelling, m1 why |
| spotlight-effect | ask, all 3 cards, all 3 whys, truth caption |

The checked file was checked by a script. It parses as JSON. Its keys match the draft. Every id exists in the pack. Each scene has 1 right card. Props and acts come from the spec lists. The right guess matches the truth and both wrong guesses differ from it. It contains no "wrong", "should" or "your brain".

Open items for the editor:
- The `plan-meta` abstract couldn't be opened.
- The Gilovich figures come from a secondary source.
- Scenes 1, 2, 5 and 8 show one person's likely outcome. The sources report averages and shares, not certainties.
