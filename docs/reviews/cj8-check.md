# cj8 Job 1 · Originality and evidence for the six friend games

Batch 8, Job 1. Branch `ideas/cj8-check`, based on origin/main `b53d7f4`. Written 24 Oct 2026.
Report only: no app code or content changed.

Inputs read: `CLAUDE.md` (origin/main), `docs/specs/24-signature-mechanics.md` (ideas/spec-24-signature),
`docs/reviews/cj5-ethics.md` (ideas/cj5-ethics, the 15-line checklist).

## 0. Summary

| Game | Friend | Closest prior art | Novelty | Fun | Kindness | Evidence | Build cost | Verdict |
|---|---|---|---|---|---|---|---|---|
| Teach Chiku | Chiku | Betty's Brain (2005) is the same mechanic | 2 | 3 | 4 | 4 | 4 | Build, but call it "Betty's Brain for adults", not original |
| The haveli and the matka | Moti | Lociform, memoryOS (palace + SRS); Duolingo word bank | 3 | 3 | 3 | 3 | 4 | Build the matka first; the haveli is a skin |
| Kapi's prank + workshop | Kapi | One Lie app; knights-and-knaves; NANDI's own card `mm-4` | 3 | 4 | 4 | 2 | 3 | Build; generator + "answers still possible" counter is the new part |
| Bol sets | Nandi | RepsByBeat; tempo notation (3-1-2-0); US 7,824,309 | 4 | 4 | 3 | 2 | 3 | Build with self-paced default; weakest evidence |
| Mor's tarazu | Mor | TODO Better, Amazing Marvin, DayCraft | 2 | 2 | 3 | 4 | 2 | Build as a quiet layer on Plan, not a "game" |
| The slow kolam | Kachhua | ustwo PAUSE (2015); NANDI's own Breath kolam (spec 24) | 3 | 3 | 4 | 2 | 3 | Merge with Breath kolam; do not ship two kolams |

Scale: 1 low to 5 high. Build cost: 1 = cheap, 5 = expensive.

Citation corrections (details in §2):
1. The matka's sealed guess is the **memory design**: Fischhoff & Beyth 1975 and Fischhoff 1977, not Fischhoff 1975 (which used a hypothetical design).
2. "Siromoney" is two different works: Siromoney, Siromoney & Krithivasan 1974 (array grammars) and G. Siromoney 1978 (Kalakshetra Quarterly). Cite them separately.
3. Ascher 2002 start page is 56 (Crossref). End page differs between citing papers (61, 63). Use "90(1): 56ff" until checked.
4. Terry et al. "2020" was published online in 2019; print is 2020 (146(2): 91-117). Keep 2020.

Checklist result: no game passes all 15 lines as described. Every NO has a small fix (§3). With the fixes, all six can pass.

## 1. Originality: the 3 closest per game

Method: web search of store pages, games, research prototypes and patents (Google/USPTO via web search).
Quotes are only text seen on the page. "Not opened" means the page failed and nothing from it is quoted.

### 1.1 Teach Chiku (learner builds a cause map; Chiku answers only from it)

| # | Prior art | Quote | What differs in Teach Chiku |
|---|---|---|---|
| 1 | **Betty's Brain** (Vanderbilt/Stanford). Biswas et al. 2005, Applied Artificial Intelligence 19:363-392. Open copy: https://archive.isis.vanderbilt.edu/sites/default/files/Biswas__G_3_0_2005_Learning_b.pdf | "One of our agents, Betty, described next, makes her qualitative reasoning visible through a dynamic, directed graph called a concept map." (p. 369) | Almost nothing in the core loop. Differences: 3-6 nodes not a full ecosystem; tempting wrong links come from the pack's `misconceptions`; adults 18-25; phone, offline. |
| 2 | **Axiom Flow** (Product Hunt, launched 2026). https://www.producthunt.com/products/axiom-flow/launches/axiom-flow-2 | "Axiom Flow is an edtech platform where you master topics by teaching an AI student named Sam." "Sam generates thoughts filled with misconceptions, and your job is to correct them through conversation." "Then send Sam to a mock exam to see how well you truly understand." | Axiom uses an LLM and free chat. Chiku uses no AI at runtime; its answers are a deterministic walk of the map, so every mistake can be traced to one link. |
| 3 | **TeachYou / AlgoBo** (research prototype). https://arxiv.org/html/2309.14534v1 | "AlgoBo, an LLM-based tutee chatbot that can simulate misconceptions and unawareness prescribed in its knowledge state." "AlgoBo's questions led to knowledge-dense conversations (effect size=0.73)." | LLM, programming domain, lab study. Chiku is rule-based and offline. |

Also: Biswas et al. 2005 (p. 368) describe an older simulated tutee, DENISE, that built "a causal structure, but this structure was not made visible to the user".
Patents: a web search of Google Patents found none for teachable agents over concept maps.

**Novelty: 2.** The mechanic is Betty's Brain. NANDI's real additions are misconception-seeded wrong links and the phone size.

### 1.2 The haveli and the matka (memory palace review from word pieces; weekly sealed guess)

| # | Prior art | Quote | What differs |
|---|---|---|---|
| 1 | **Lociform: Memory Palace** (iOS). https://apps.apple.com/app/id6800037106 | "Put each thing you need to remember at a stop along a route." "Spaced repetition built on FSRS-6, showing the real interval on every button" "Made for ordered lists of separate items." | Lociform stores lists. The haveli stores concept takeaways, and recall is a rebuild with misconception decoys. |
| 2 | **memoryOS** (iOS/Android). https://apps.apple.com/ph/app/id1553283646 | "an educational 3D game of Virtual Mind Palaces" "utilizes scientifically proven memory techniques, spaced repetition and patented game mechanics" | 3D palaces for memory training in general. The haveli is a light 2D map over existing NANDI concepts. |
| 3 | **Duolingo word bank** (rebuild a sentence from tiles). Duolingo fan wiki https://duolingo.fandom.com/wiki/Exercise returned HTTP 402: **not opened, not quoted.** | — | Duolingo's spare tiles are random words. Moti's spare pieces are the pack's own misconceptions, so picking one is a diagnosable error. |

Sealed guess (matka): no app found that seals a user's guess before a lesson and reveals it later to show hindsight bias.
Searches returned only advice pages on writing predictions down. **This half is the original part.**
Patents: a web search found no memory palace + spaced repetition patent. memoryOS claims "patented game mechanics" but gives no number.

**Novelty: 3** (haveli 2, matka 4).

### 1.3 Kapi's prank + riddle workshop (exactly one false clue; user-made cases with a live counter)

| # | Prior art | Quote | What differs |
|---|---|---|---|
| 1 | **One Lie: Brain Trivia Game** (iOS). https://appgoblin.info/apps/6781483700 | "you're shown five surprising facts, and exactly one of them is a lie." "Build and protect daily streaks" | Trivia, not deduction: you need outside facts. Kapi's lie is found by logic alone. One Lie also uses streak protection, which NANDI avoids. |
| 2 | **Knights and Knaves** (Smullyan 1978). https://en.wikipedia.org/wiki/Knights_and_Knaves | "Knights and Knaves is a type of logic puzzle where some characters can only answer questions truthfully," "others only falsely." "The name was coined by Raymond Smullyan in his 1978 work What Is the Name of This Book?" | Classic, hand-written. Kapi's cases are generated on a grid with a proof that exactly one world has exactly one false clue. |
| 3 | **WHO IS LYING?** (WEEGOON). https://www.bluestacks.com/apps/puzzle/who-is-lying-on-pc.html | "Every case features two conflicting claims—study the clues, connect the dots, and decide who's bluffing." | Two-claim picture puzzles, no generator, no logic proof. |

Internal prior art: NANDI already ships a one-liar card. `content/deck/deck.greene.json`, card `mm-4` "The midnight Maggi":
"Exactly one of them is lying, and the liar is the one who ate it." The prank is a generator version of this card.

Workshop: **Thonky Sudoku solution counter** (https://www.thonky.com/sudoku/solution-count): "click the Count Solutions button to find out if the puzzle has a unique solution, multiple solutions, or no solutions."
Setter tools count solutions on demand. A *live* "answers still possible" counter for a beginner, on clue cards, shared by link, was not found.

**Novelty: 3.**

### 1.4 Bol sets (tabla bols as rep tempo: DHA slow full rep, TI quick half rep, NA hold)

| # | Prior art | Quote | What differs |
|---|---|---|---|
| 1 | **RepsByBeat** (iOS). https://apps.apple.com/app/id1218293851 | "Workouts consisting of REPETITIONS of exercise routines that are timed BY musical rhythmic BEATS." Pace "from the basic slow beat to the advanced fast beat." | One beat per rep, pace only. Bols give each rep a *type* (slow full, quick half, hold) and the user can compose and share them. |
| 2 | **Lifting tempo notation** (NASM). https://www.nasm.org/resource-center/blog/training/tempo-training-using-lifting-tempo-to-drive-adaption | "Tempo is typically written as a four-digit code: eccentric lowering phase (pause at bottom)" "concentric lifting phase (pause at top)." "For example, a 3-1-2-0 squat means:" | Same idea (a code for rep timing) as numbers. Bols make it a spoken rhythm. |
| 3 | **US 7,824,309** "Method and apparatus for pacing human body exercises using audible cues". https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7824309 | Title only. **Claims not opened**; a search summary says it plays tones and voice cues in fixed tempos per phase. | Check its claims, filing date and status before shipping audio pacing; none of these were checked. |

Tabla apps (e.g. **Dha: Learn Tabla**, https://mwm.ai/apps/dha-tabla-bols-taal/6776352646: "Pick a taal, set your tempo and Sa, and practise with tabla, tanpura and lehra that return to sam every cycle.") teach music, not exercise.
No app found that maps tabla bols to rep types. **Novelty: 4.**

### 1.5 Mor's tarazu (plan on a balance weighted by your own guess-to-actual ratio)

| # | Prior art | Quote | What differs |
|---|---|---|---|
| 1 | **TODO Better**. https://www.todobetter.it.com/about | "You create tasks, estimate how long they'll take, and track your actual work time." "Over time, the system uses your real data to suggest better estimates and catch plans that don't add up." | Same loop. Tarazu adds the balance picture and makes estimating the skill shown to the user. |
| 2 | **Amazing Marvin, time estimates**. https://amazingmarvin.com/features/time-estimates | "Compare estimates vs. actual time. Get better at predicting how long things take over time. Learn your real capacity." "Based on your actual pace (learns from your history)" | Same goal and same claim of learning. Tarazu is offline and free. |
| 3 | **DayCraft** (iOS). https://apps.apple.com/qa/app/daycraft-todo-list-tasks/id6467500588 | "set estimated durations for tasks." "predicts when you'll finish your work based on your current pace." "these estimates will automatically adjust to become even more accurate" | Same. |

**Novelty: 2.** The ratio is common. Only the balance scale and the kind framing are NANDI's.

### 1.6 The slow kolam (trace a sikku kolam; the line grows only while the finger moves slowly)

| # | Prior art | Quote | What differs |
|---|---|---|---|
| 1 | **PAUSE** by ustwo + PauseAble (iOS, 2015). https://techcrunch.com/2015/10/08/pause-ustwo/ | "put their finger on the screen to touch a small, amorphous blob, and move it around very gently." "As they move the undulating blob it swells in size." They "are schooled to slow down (if they go too fast)." | Same slow-finger rule. PAUSE grows a blob and then runs a timer (1-30 min); the kolam draws a real single-line figure and ends when the loop closes. |
| 2 | **One Line Touch Draw Shape Game** (iOS). https://apps.apple.com/us/app/id6738304927 | "Simply trace the displayed shapes without lifting your finger or overlapping lines." | One-stroke tracing, no speed rule, no kolam. |
| 3 | **Kolam simulation research**: Bharathi, Sharma & Nagaraj 2023, arXiv 2307.02144 | "Single loop Kolams are mathematical closed loop patterns drawn over a grid of dots and conforming to certain heuristics." | Generates single-loop kolams; no tracing, no speed rule. |

Kolam drawing apps exist (Kolam Studio, `com.braindots.kolamstudio`); its pages returned 403 / truncated, so **not quoted**.
Patents: a search found speed-gated touch patents (e.g. US 2019/0187797 changes vibration by finger speed during tracing), not a speed-gated drawing game. Claims not opened.

**Internal overlap (important):** spec 24 already picks **Breath kolam** for Kachhua/Calm ("Each out-breath draws one loop of today's dot pattern"). Two kolam games for one friend would split one idea.
Fix: make the slow trace the *touch mode* of Breath kolam (breath paces the line, or finger pace does), one pattern store, one count.

**Novelty: 3.**

## 2. Evidence check

| Claim used | Correct citation | Opened? | Quote | Fit to NANDI | Correction |
|---|---|---|---|---|---|
| Teachable agents (Chiku) | Biswas G., Leelawong K., Schwartz D., Vye N. & TAG-V (2005). Learning by teaching: a new agent paradigm for educational software. *Applied Artificial Intelligence* 19:363-392. doi 10.1080/08839510590910200 | Yes, Vanderbilt PDF (scan) | "This paper discusses Betty's Brain, a teachable agent in the domain of river ecosystems that combines learning by teaching with self-regulation mentoring to promote deep learning and understanding." "Results indicate that the addition of the self-regulated Betty and the self-regulation mentor better prepared students to learn new concepts later, even when they no longer had access to the SRL environment." | Mechanic matches. Population was school children. The gain in this paper is tied to the *self-regulation mentor*, not the map alone. | Citation fine. Do not say "proven for adults". |
| Protégé effect (Chiku) | Chase C.C., Chin D.B., Oppezzo M.A. & Schwartz D.L. (2009). Teachable agents and the protégé effect: increasing the effort towards learning. *J. Science Education and Technology* 18(4):334-352. doi 10.1007/s10956-009-9180-4 | Abstract via ERIC EJ855299 (https://api.ies.ed.gov/eric/?search=id:EJ855299). Stanford record returned 503. | "Two studies demonstrate the "protege effect": students make greater effort to learn for their TAs than they do for themselves." "These beneficial effects were most pronounced for lower achieving children." "Perhaps having a TA invokes a sense of responsibility that motivates learning, provides an environment in which knowledge can be improved through revision, and protects students' egos from the psychological ramifications of failure." | 8th and 5th graders. The effect needs the learner to feel Chiku is *theirs*: name, face, and Chiku's mistakes owned by Chiku. Supports kindness (failure lands on the agent). | Citation fine. |
| Generation effect (Moti) | Slamecka N.J. & Graf P. (1978). The generation effect: delineation of a phenomenon. *JEP: Human Learning and Memory* 4(6):592-604 | Yes, open copy https://andymatuschak.org/prompts/Slamecka1978.pdf | "In all cases, performance in the generate condition was superior to that in the read condition. This held for measures of cued and uncued recognition, free and cued recall, and confidence ratings." | Subjects *produced* a word from a rule and a first letter. Picking word pieces from a bank is partly recognition. The fit is partial. | Citation fine. Design fix: make the first piece typed or the takeaway rebuilt with fewer, larger pieces, so it is closer to generating than picking. |
| Method of loci (Moti) | Dresler M., Shirer W.R., Konrad B.N., et al. (2017). Mnemonic training reshapes brain networks to support superior memory. *Neuron* 93(5):1227-1235.e6. doi 10.1016/j.neuron.2017.02.003. PMC5439266 | Yes, PMC | "six weeks (40 x 30 minutes) of mnemonic training in the method of loci" "These effects persisted at the four-month follow-up" "51 participants (aged 24±3.0 years, all male)" | Training was on word lists, 20 hours in total, all male. NANDI's rooms hold concepts in seconds per day. The paper's title is a brain claim, which product rules forbid in copy. | Citation fine. Never quote the title in the app. |
| Hindsight bias (matka) | Fischhoff B. (1975). Hindsight ≠ foresight: the effect of outcome knowledge on judgment under uncertainty. *JEP: Human Perception and Performance* 1(3):288-299. doi 10.1037/0096-1523.1.3.288 | Metadata via Crossref. Full text and abstract not found open. Described in Blank H., Musch J. & Pohl R.F. (2007), Hindsight bias: on being wise after the event, *Social Cognition* 25(1):1-9 (open copy https://iphils.uj.edu.pl/~a.trybus/classes/logic/cs/20.Pohl.Hindsight.Bias.pdf; references checked there) | Blank et al.: "people judge event outcomes as more probable from a hindsight perspective if they are presented as the factual outcomes, as compared to judging the same outcomes as possibilities in foresight". "Another core manifestation of hindsight bias was first demonstrated by Fischhoff and Beyth (1975) when they compared people's foresight predictions ... to their recollections of these predictions in hindsight." "A further study by Fischhoff (1977) showed similar memory distortions for newly acquired factual knowledge." | The matka seals *your own* guess and asks you to recall it. That is the memory design. | **Correct:** cite Fischhoff & Beyth (1975), "I knew it would happen": remembered probabilities of once-future things, *Organizational Behavior and Human Performance* 13:1-16, and Fischhoff (1977), *JEP:HPP* 3:349-358, for facts. Keep Fischhoff 1975 as background only. |
| Planning fallacy (tarazu) | Buehler R., Griffin D. & Ross M. (1994). Exploring the "planning fallacy": why people underestimate their task completion times. *JPSP* 67(3):366-381. doi 10.1037/0022-3514.67.3.366 | Yes, open copy https://bear.warrington.ufl.edu/brenner/mar7588/Papers/buehler-et-al-1994.pdf | "In Study 4, the optimistic bias was eliminated for Ss instructed to connect relevant past experiences with their predictions." "respondents predicted, on average, that they would finish in 33.9 days, but they actually took 55.5 days" | Good fit: the tarazu shows your past actuals at the moment you plan. Caveat: tasks lasted days to weeks, not 30-minute blocks. | Citation fine. Add Roy, Christenfeld & McKenzie (2005), *Psych. Bulletin* 131(5):738-756 (Europe PMC abstract): "People appear to underestimate future event duration because they underestimate past event duration." This supports using *measured* actuals from the focus timer, not remembered ones. |
| Music in exercise (bol sets) | Terry P.C., Karageorghis C.I., Curran M.L., Martin O.V. & Parsons-Smith R.L. (2020). Effects of music in exercise and sport: a meta-analytic review. *Psychological Bulletin* 146(2):91-117. doi 10.1037/bul0000216 | Abstract via Europe PMC (PMID 31804098); accepted manuscript via Brunel https://bura.brunel.ac.uk/bitstream/2438/19875/1/FullText-AAM.pdf | "A multilevel meta-analysis of 139 studies" "Performance effects were moderated by study domain (exercise > sport) and music tempo (fast > slow-to-medium)." AAM: "performance benefits when applying music synchronously (g = 0.44) or asynchronously (g = 0.31)" "The absence of a differential effect on performance between synchronous and asynchronous music was inconsistent with claims previously made in the literature" "Synchronous music studies are relatively rare" | Weak fit. The paper is about listening to music, mostly endurance. Moving *in time* with a beat was not better than background music. Bols are a tempo cue for slow reps, the opposite of "fast tempo helps". | Citation fine (online 2019). Use it only for "music can make exercise feel better" (affect g = 0.48), never for "beats make you stronger". |
| Kolam mathematics (slow kolam) | Ascher M. (2002). The kolam tradition. *American Scientist* 90(1): 56ff. doi 10.1511/2002.13.56 | **Not opened** (americanscientist.org 503; JSTOR not tried). Crossref confirms title, volume, issue, start page 56. | None quoted. | Background for the art form only. | Pages: Bharathi et al. 2023 cite "90(1):56–63"; Chakraborty & Manna (arXiv 2507.02874) cite "55-63". Use start page 56. |
| Kolam mathematics (slow kolam) | Siromoney G., Siromoney R. & Krithivasan K. (1974). Array grammars and kolam. *Computer Graphics and Image Processing* 3(1):63-82. Also: Siromoney G. (1978). South Indian kolam patterns. *Kalakshetra Quarterly* 1(1):9-14 | **Not opened** (ScienceDirect 403). Citations as given in Bharathi et al. 2023 (arXiv 2307.02144) and arXiv 2507.02874 reference lists. | None quoted. | Array grammars generate kolams; they do not cover tracing or speed. | **Correct:** "Siromoney" alone is ambiguous. Cite the 1974 paper (with all three authors) for generation, and the 1978 piece for the tradition. |

Note for Job 5: Bharathi et al. 2023 also say: "In drawing single-loop Kolams, the artist has to make the correct decision about the direction of the loop in the vicinity of each point in the grid, failing which the Kolam cannot be completed and must be fully erased and re-drawn."
A tracing game must never copy that "erase and redraw" rule: it would be a loss state.

## 3. cj5-ethics checklist per game

Lines (short form): 1 fixed reward · 2 no false urgency/countdown · 3 made-up people labelled · 4 a miss costs nothing · 5 kind repair + lifetime count · 6 no shame copy · 7 "No" as easy as "Yes" · 8 asks once · 9 pays for real skill · 10 it ends · 11 night is calm · 12 person chooses, can switch off · 13 builds competence · 14 relatedness optional, no strangers · 15 no money, no data, no account.

Y = YES, N = NO. "Y (n/a)" = the line does not apply and nothing in the game breaks it.

| # | Chiku | Moti | Kapi | Bol | Tarazu | Kolam |
|---|---|---|---|---|---|---|
| 1 | Y | Y | Y | Y | Y | Y (0 XP) |
| 2 | Y | Y | Y | **N** | Y | Y |
| 3 | Y | Y | Y | Y | Y | Y (n/a) |
| 4 | Y | **N** | Y | **N** | **N** | Y |
| 5 | Y (n/a) | Y (n/a) | Y (n/a) | Y (n/a) | Y (n/a) | Y (n/a) |
| 6 | **N** | **N** | Y | Y | **N** | Y |
| 7 | Y | Y | Y | Y | Y | Y |
| 8 | Y | Y | Y | Y | Y | Y |
| 9 | Y | Y | Y | Y | **N** | Y (n/a) |
| 10 | **N** | **N** | Y | Y | Y | Y |
| 11 | **N** | **N** | **N** | Y | Y | **N** |
| 12 | Y | Y | Y | **N** | Y | **N** |
| 13 | Y | Y | Y | Y | Y | Y |
| 14 | Y | Y | Y | **N** | Y | Y |
| 15 | Y | Y | **N** | Y | Y | Y |
| NOs | 3 | 4 | 2 | 4 | 3 | 2 |

### Fixes for each NO

| Game | Line | Problem | Fix |
|---|---|---|---|
| Chiku | 6 | A wrong answer can read as "you taught it wrong". | Chiku owns the step: "I followed *stress → sleep less*. Was that link right?" Never "your map is wrong". Chase 2009 found the agent shields the learner from failure; keep it that way. |
| Chiku | 10 | Fix-map / retest can loop. | One map per concept per day, 2 test questions, then a stop screen. Retests inside the map are free but the day ends. |
| Chiku | 11 | Learn after bedtime. | After bedtime: 0 XP, no new map, existing map viewable uncelebrated (CLAUDE.md night rule). |
| Moti | 4 | Palace apps often dim or dust overdue rooms. | Rooms never fade, crack or empty. Overdue items wait at the door with no change of state. |
| Moti | 6 | The reveal "you thought you knew" can shame. | Copy blames the mind, not the person: "Most people remember their first guess as closer than it was. Here is yours, sealed on Monday." No score for the gap. |
| Moti | 10 | A review queue can grow without end. | Cap haveli reviews per day (number in `rules.config.ts`), then a stop screen. Leftovers roll over silently. |
| Moti | 11 | Review after bedtime. | Same night rule as Chiku. |
| Kapi | 11 | Workshop building at night. | After bedtime the workshop saves drafts only; no XP, no sharing prompt. |
| Kapi | 15 | Shared links could carry free text: real names, insults, private details. | Clue cards from a fixed vocabulary and the preset cast only. No free text in a link in v1. Link holds only the puzzle. |
| Bol | 2 | A scrolling beat track pushes the next rep like a timer. | The track starts on tap, pauses on tap, and waits at the end of each rep in the default mode. No "get ready" countdown. |
| Bol | 4 | Rhythm games score misses and break combos. | No hit/miss judgement, no combo, no accuracy %. A rep counts when the person marks it. |
| Bol | 12 | Needs sound and a fixed tempo. | Audio-off mode (haptic + visual), a self-paced mode, and "plain set" always one tap away. |
| Bol | 14 | Shared bols could push a friend past their plan (unsafe, and a duty to keep up). | A received bol is clamped to the receiver's plan reps and tempo limits (Job 4's rule). No "beat my bol". |
| Tarazu | 4 | An accuracy number ("Mor's eye") can fall. | Show the ratio as a plain fact ("your 30-min guesses usually take 42"). Mor's eye = lifetime count of "close calls" (within a band), which never falls. |
| Tarazu | 6 | "You always underestimate" shames. | Name the bias, not the person: "Almost everyone guesses short. Mor adds your usual extra." Quote Buehler in the info sheet. |
| Tarazu | 9 | If accuracy pays XP, people stop the timer at the guess or pad guesses. | No XP for accuracy. XP stays on the task. The ratio only informs the plan. |
| Kolam | 11 | Kachhua is the night friend; growth or a count after bedtime breaks the night rule and adds screen time. | 0 XP. After bedtime nothing is added to a collection. One kolam per night, about 2 minutes, ends on a lights-out screen. |
| Kolam | 12 | "Only slow" excludes tremor, motor or one-handed use. | Speed threshold adjustable; "draw it for me" plays the line at a calm pace; any touch pace allowed in accessibility mode. |

## 4. Scores and kill tests

| Game | Novelty | Fun | Kindness | Evidence | Build cost | Why these scores |
|---|---|---|---|---|---|---|
| Teach Chiku | 2 | 3 | 4 | 4 | 4 | Strongest evidence (two papers on the exact mechanic), but children only. Needs a map per concept and a linking UI that works at 360 px. |
| Haveli + matka | 3 | 3 | 3 | 3 | 4 | Matka is new; haveli is a skin on review. Generation fit is partial; loci evidence is for word lists. Art cost is high. |
| Kapi's prank | 3 | 4 | 4 | 2 | 3 | Case engine and solution counter exist on main. No learning evidence claimed, and none needed for a puzzle. |
| Bol sets | 4 | 4 | 3 | 2 | 3 | Most original. Evidence is indirect. Audio sync on Android web views is the cost risk (Job 4). |
| Mor's tarazu | 2 | 2 | 3 | 4 | 2 | Good evidence, many apps do it. Cheap if timer actuals exist (Job 6). |
| Slow kolam | 3 | 3 | 4 | 2 | 3 | PAUSE did the slow finger; kolam tracing on a dot grid with a closed-loop end is new. Overlaps Breath kolam. |

Kill tests: set now, measured on the owner panel for 4 weeks after launch, never moved.
Common to all: kill or rework if it raises opens after bedtime, or if Jenil says it feels like pressure.

| Game | Kill if |
|---|---|
| Teach Chiku | Fewer than 40% of started maps reach both test questions, **or** fewer than half of wrong-map answers are followed by a link edit (the trace is not teaching). |
| Haveli + matka | Haveli review does not beat the plain review screen on 7-day recall of the same items (item-level A/B), **or** the weekly sealed guess is skipped more than 70% of weeks. |
| Kapi's prank | More than 30% of generated cases fall to one direct contradiction (Job 3 measure), **or** in a blind test 5 players do not rate prank cases above normal cases, **or** under 10% of players ever open the workshop. |
| Bol sets | Median beat offset on the test phones is over 80 ms with no fix, **or** sets finished per week fall versus plain sets, **or** any user reports pain linked to a bol. |
| Mor's tarazu | The median gap between guess and actual (in log terms) does not shrink over 4 weeks, **or** the share of tasks that get timed drops (people avoid the timer). |
| Slow kolam | Median session over 3 minutes, **or** it is not used more than Breath kolam alone after the merge, **or** opens after bedtime rise. |

## 5. Pages that failed

| Page | Result |
|---|---|
| https://purl.stanford.edu/zm369yx3532 (Chase 2009) | 503; abstract taken from ERIC instead |
| https://link.springer.com/article/10.1007/s10956-009-9180-4 | Redirect to login; not followed |
| https://www.americanscientist.org/article/the-kolam-tradition (Ascher 2002) | 503 |
| https://www.sciencedirect.com/science/article/pii/S0146664X74800199 (Siromoney 1974) | 403 |
| https://www.cmi.ac.in/gift/Kolam.htm | 404 |
| https://apps.dtic.mil/sti/tr/pdf/AD0780971.pdf (Fischhoff report) | 403 |
| https://duolingo.fandom.com/wiki/Exercise | 402 |
| https://chrome-stats.com/d/com.braindots.kolamstudio and its Play page | 403 / truncated |
| https://apps.apple.com/lc/app/timeboxer-time-estimator/id6720741072 | 404 |
| https://api.openalex.org | 429 (rate limit); Europe PMC and Crossref used instead |

No paywall bypass was used. Every quote above was read on the page linked next to it.
