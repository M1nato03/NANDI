# Track 2 outline: "Think like a detective" (cj7, Job 4)

> **DRAFT FOR EDITORS.** Nothing here is pack-ready. The content team rewrites it into the topic pack format
> (`hook`, `teach`, `example.parts` + `spot`, `guided[]`, `takeaway`, `quest`, spaced `items`) and runs the
> usual fact-check. All names and scenes are made up. No film or TV plot, name or line is used.

Date: 24 Oct 2026. Branch: `ideas/cj7-detective-outline`. Spec: 21 Part A, track 2 (`docs/specs/21-useful-now.md`
on `ideas/spec-21-useful-now`). Shape copied from `docs/reviews/cj4-pilot-outline.md` (`ideas/cj4-pilot-outline`).
Starting evidence: `docs/reviews/cj4-evidence.md` §7 (`ideas/cj4-evidence`).

## Summary

- 8 ideas on inference. Each has a source we opened and quoted. 2 are strong (thinking in "out of 100"; reading
  lies from faces is close to chance). 5 are moderate (base rates, other explanations, the clue that splits two
  stories, a reason against, hindsight). Checking a claim at its source is mixed: it worked for US college
  students and an educated online sample in India, but not for a rural Indian sample or in an hour-long Indian
  field training.
- The two anchor papers hold up, with limits editors need to state:
  - Morewedge et al. 2015: one game or video session cut bias, and effects lasted 2-3 months. But the sessions were
    about 30-60 minutes, there was no untrained control group (game vs video, before vs after), and the samples were
    paid adults in Pittsburgh.
  - Sellier et al. 2019: trained students chose the biased case answer less often weeks later. The published
    figure is **19%** less likely (PubMed abstract, after a 2020 corrigendum). The accepted manuscript on City's
    repository still says 29%. Use 19%. Training was by volunteer sign-up and timing, not random assignment.
  - Neither paper tested 2-minute lessons. "Short daily steps with practice and feedback carry some of this
    effect" is our inference. Say "in studies, a single training session..." and never "this lesson removes bias".
- Almost every study is from the US, UK, Israel or Germany. The one study run in India (Guess et al. 2020) is
  also the one that shows the most limits. Indian scenes below are practice settings, not proof.

## Track at a glance

| # | Idea | Main source (opened) | Evidence | Main setting |
|---|---|---|---|---|
| 1 | Start with "how often does this usually happen?" | Mellers et al. 2014, Psych Sci; Morewedge et al. 2015 | Moderate | Late trains, a friend's silence |
| 2 | Turn the % into "out of 100" | Hoffrage et al. 2000, Science; McDowell & Jacobs 2017, Psych Bull | Strong | College plagiarism check |
| 3 | Find two other explanations | Lord, Lepper & Preston 1984, JPSP; Sanna, Schwarz & Stocker 2002 | Moderate | Hostel, group project |
| 4 | Look for the clue that splits the stories | Sellier, Scopelliti & Morewedge 2019, Psych Sci | Moderate | Laptop that won't charge, PG Wi-Fi |
| 5 | Ask "what would change my mind?" | Koriat, Lichtenstein & Fischhoff 1980, JEP:HLM | Moderate | Exam-date rumour, elective pick |
| 6 | Once you know the ending, clues look obvious | Fischhoff 1975 (reprinted 2003); Sanna et al. 2002 | Moderate | Cricket match, placement results |
| 7 | Ask the question behind a forward | Brodsky et al. 2021; Guess et al. 2020 (US and India); Badrinathan 2021 (India) | Mixed | Family WhatsApp group |
| 8 | Nervous is not the same as guilty | Bond & DePaulo 2006, PSPR; Hartwig & Bond 2011, Psych Bull | Strong | Trip money, a missing charger |

Evidence key (same as cj4-pilot-outline): **Strong** = several studies or a meta-analysis with a direct test of
the claim. **Moderate** = solid studies, but the setting or the step we teach goes past what was tested.
**Mixed** = studies disagree, or it worked in some samples and not others. **Weak** = inferred from a nearby finding.

## Why this track can work: the two anchor papers

| Claim | Source quote | Source |
|---|---|---|
| A single session cut bias, with medium to large effects. | "We report the results of two longitudinal experiments that found medium to large effects of one-shot debiasing training interventions." | Morewedge, Yoon, Scopelliti, Symborski, Korris & Kassam (2015), *Policy Insights from the Behavioral and Brain Sciences* 2(1), 129-140. https://doi.org/10.1177/2372732215600886 (read from the accepted manuscript: https://openaccess.city.ac.uk/id/eprint/12324/1/Debiasing_Decisions_PIBBS.pdf) |
| Practice with feedback beat watching. | "Games, which provided personalized feedback and practice, produced larger effects than did videos." | Same |
| It carried over to problems not taught. | "Debiasing effects were domain-general: bias reduction occurred across problems in different contexts, and problem formats that were taught and not taught in the interventions." | Same |
| The sessions were not 2 minutes. | "short, one-shot training interventions (i.e., approximately 30 and 60 minutes, respectively)" | Same, method |
| The game was a detective story. | "the player searches for a missing neighbor (i.e., Terry Hughes) and exonerates her of criminal activity" | Same, Experiment 1 |
| Training transferred to a real course case weeks later. | "Trained participants were 19% less likely to choose the inferior hypothesis-confirming solution than untrained participants." | Sellier, Scopelliti & Morewedge (2019), *Psychological Science* 30(9), 1371-1379. https://pubmed.ncbi.nlm.nih.gov/31347444/ (corrigendum: https://pubmed.ncbi.nlm.nih.gov/32423341/) |
| Who and how. | "We gave graduate students in three professional programs (N = 290) a one-shot training intervention that reduces confirmation bias in laboratory experiments." | Same |
| Not randomised. | "Natural variance in the training schedule assigned participants to receive training before or after solving an unannounced business case" | Same |
| The raw numbers. | "trained participants were significantly less likely to choose the hypothesis-confirming decision to race (58.8%) than untrained controls (72.2%)" | Sellier et al., accepted manuscript: https://openaccess.city.ac.uk/id/eprint/22233/1/DebiasingTrainingTransfers_InPress.pdf |
| Session length. | "played for 80-100 minutes" | Same |
| The authors' own guess at why. | "Providing intensive practice and feedback is another possibility." | Same, discussion |

**What this means for the track.** Every step ends in a try with feedback (the guided try), and every Show me
compares a weak and a good version (spec 21 Part A). The Mind daily mystery can reuse the same moves, one per case.
A 2-minute step is far shorter than 30-100 minutes, so the copy never promises the studies' effect sizes.

## Format used below

Each idea has 3 steps. Each step has:

| Part | Maps to pack field | Rule |
|---|---|---|
| Hook | `steps[].hook` | Names a situation, never a flaw in the reader. 3 options, one correct. Answered in the same step. |
| Teach | `steps[].teach` | 30 words or fewer; word count shown |
| Show me | `steps[].example` | A weak and a good version side by side; `spot` = the part to tap in the good one |
| Guided try | `steps[].guided[]` | 3 options; one distractor is a named misconception |

Each idea then has one **Field try** (spec 21 Part B, `concept.quest` plus `cues`, `smaller`, `notice`,
`settings`). It is skippable, has no timer, and gets 0 XP in v1.

---

## 1. Start with "how often does this usually happen?"

### Evidence

| Claim | Source quote | Source |
|---|---|---|
| Shortcuts usually work but slip in predictable ways. | Heuristics "are highly economical and usually effective, but they lead to systematic and predictable errors." | Tversky & Kahneman (1974), *Science* 185, 1124-1131. https://pubmed.ncbi.nlm.nih.gov/17835457/ |
| Forecasters trained to use reference classes ("how often do cases like this happen?") were more accurate. | "Probability training corrected cognitive biases, encouraged forecasters to use reference classes, and provided forecasters with heuristics, such as averaging when multiple estimates were available." | Mellers et al. (2014), *Psychological Science* 25(5), 1106-1115. https://pubmed.ncbi.nlm.nih.gov/24659192/ |
| Training was one of three things that helped. | "Results showed that probability training, team collaboration, and tracking improved both calibration and resolution." | Same |
| Base-rate neglect was among the problems a single session reduced. | "Representativeness questions were based on conjunction fallacy, base rate neglect, gambler's fallacy, perceptions of random sequences, and sample size neglect paradigms" ... "Training effectively reduced bias due to overreliance on representativeness immediately and three months later" | Morewedge et al. 2015, accepted manuscript (link above) |

**Strength: moderate.** Mellers is a large two-year tournament, but probability training had several parts, so the
effect of "reference classes" alone is not isolated. Morewedge measured base-rate neglect inside a wider scale.
Setting: US online forecasters (Mellers); paid Pittsburgh adults (Morewedge).

**Guardrail (from cj4-evidence §7).** Base rates are about **events and situations** (trains, exam results,
deliveries, replies), never about groups of people. No step uses caste, religion, region, gender or looks as a
"base rate".

### Step 1.1

**Hook.** The 6:10 local shows "running late". What is the best first question?
- a) "Why is it always me?"
- b) **"How late does this train usually run?"** (correct)
- c) "What did the last person on the platform say?"

**Teach (28 words)**
> Before the details, ask how often this kind of thing usually happens. That number, the base rate, is your
> starting guess. Details then move it up or down.

**Show me.** Ask: "Tap where Sneha starts from the usual."

| Weak | Good |
|---|---|
| 1. Display: "Running late." | 1. Display: "Running late." |
| 2. Sneha: "Something big must have happened." | 2. Sneha: "This one is late most weekdays, about 10 minutes." **(spot)** |
| 3. She books a cab in a panic. | 3. "Display says 25. That's more than usual, so I'll check the app." |

Feedback: "The good version starts from what usually happens, then lets the new detail (25 minutes) move the guess."

**Guided try.** Your PG's water tank is empty at 7 am. Which first thought uses a base rate?

| Option | Correct | Feedback |
|---|---|---|
| a) "It's empty about once a week, after the motor trips." | Yes | That is how often it happens. Start there. |
| b) "Someone must be wasting water on purpose." | No, **misconception: "A vivid story beats how often things happen."** | A story feels sure, but the usual rate is the better first guess. |
| c) "I can't guess anything without more facts." | No | You can. The base rate is a guess you already have. |

### Step 1.2

**Hook.** Your friend Kabir has not replied in two days. Which question helps most first?
- a) "What did I say wrong?"
- b) **"How often does Kabir go quiet for two days?"** (correct)
- c) "Who else has he replied to?"

**Teach (26 words)**
> For a person you know, the base rate is their own usual pattern. "How often does this happen with them?" comes
> before "what does it mean?"

**Show me.** Ask: "Tap the line that checks the usual pattern."

| Weak | Good |
|---|---|
| 1. Day 2, no reply. | 1. Day 2, no reply. |
| 2. "He's upset with me." | 2. "He goes quiet most exam weeks. This is exam week." **(spot)** |
| 3. Types a long apology. | 3. Sends: "All the best for Friday. Chai after?" |

Feedback: "His own pattern is the base rate. The good version reads the silence against it."

**Guided try.** A senior says, "This professor fails half the class." Which question checks the base rate?

| Option | Correct | Feedback |
|---|---|---|
| a) "What fraction failed in the last three years, from the results list?" | Yes | That is the real rate, not one story. |
| b) "Which of my friends failed?" | No | Your friends are a small, picked sample. |
| c) "The senior sounded very sure, so it's true." | No, **misconception: "Sure-sounding means accurate."** | How sure someone sounds is not a rate. |

### Step 1.3

**Hook.** A new momo stall near campus has 5 one-star reviews. What do you check first?
- a) **How many reviews it has in total.** (correct)
- b) How angry the one-star reviews sound.
- c) Whether your friend liked it.

**Teach (29 words)**
> Pick the right comparison group, the "reference class": stalls with this many reviews, trains on this route,
> exams from this professor. Then ask what usually happens in that group.

**Show me.** Ask: "Tap where Ananya picks a fair comparison."

| Weak | Good |
|---|---|
| 1. "5 one-star reviews!" | 1. "5 one-star reviews." |
| 2. "That's a lot. Avoid." | 2. "Out of 400 reviews. Most stalls this busy have a few." **(spot)** |
| 3. Walks past. | 3. "Average is 4.3. I'll try one plate." |

Feedback: "Five bad reviews mean something different out of 10 than out of 400."

**Guided try.** You hear two bikes were stolen from your hostel this month. Which question picks a reference class?

| Option | Correct | Feedback |
|---|---|---|
| a) "How many bikes are parked here, and how many go missing in a normal month?" | Yes | That compares this month with the usual. |
| b) "Two is scary. Stop parking here." | No, **misconception: "A count on its own tells me the risk."** | A count needs "out of how many" and "compared with when". |
| c) "Only careless people lose bikes." | No | That judges people, not the situation. |

### Field try

- **Try it today:** next time something goes wrong (a delay, a late reply, a closed shop), say one line first:
  "How often does this usually happen?"
- **Cues:** "On my commute", "When a message is late", "At the canteen", or my own.
- **Smaller version:** think of one thing that went wrong yesterday and guess how often it happens.
- **Notice:** did the usual rate change what you did next?
- **Settings for re-offers:** commute, hostel or PG, college notices.
- **Next-day line (sourced):** "Forecasters trained to ask how often similar things happen were more accurate
  (Mellers et al. 2014)."

---

## 2. Turn the % into "out of 100"

### Evidence

| Claim | Source quote | Source |
|---|---|---|
| Probabilities confuse most people, experts too, and natural frequencies help. | "Most people, experts included, have difficulties understanding and combining statistical information effectively. Hoffrage et al. demonstrate that these difficulties can be considerably reduced by communicating the information in terms of natural frequencies rather than in terms of probabilities." | Hoffrage, Lindsey, Hertwig & Gigerenzer (2000), *Science* 290, 2261-2262. https://pubmed.ncbi.nlm.nih.gov/11188724/ |
| A meta-analysis of 20 years of studies backs it. | "The present meta-analysis reviews 20 years of research" ... "35 articles representing 226 performance estimates" | McDowell & Jacobs (2017), *Psychological Bulletin* 143(12), 1273-1312. https://pubmed.ncbi.nlm.nih.gov/29048176/ |
| Pictures help, with either format. | "Short menu formats (less computationally complex representations showing joint-events) and visual aids demonstrated some of the strongest moderation effects, improving performance for both conditional probability and natural frequency formats." | Same |
| Picture arrays draw attention to the "out of how many". | "Adding icon arrays to the numerical information, however, drew participants' attention to the denominators and helped them make more accurate assessments of treatment risk reduction." | Garcia-Retamero, Galesic & Gigerenzer (2010), *Medical Decision Making* 30(6), 672-684. https://pubmed.ncbi.nlm.nih.gov/20484088/ |

**Strength: strong.** A meta-analysis of many studies. Setting: mostly lab tasks with medical and legal examples,
Germany and US. Our lessons move the method to non-medical scenes (a plagiarism checker, a spam filter). That
move is reasonable, but not what was tested. No health examples in this track: they invite medical claims.

### Step 2.1

**Hook.** Your college's plagiarism checker flags your honest essay. The checker is "95% accurate". How worried
should you be?
- a) Very. 95% means it's almost surely right.
- b) **It depends on how many essays are really copied.** (correct)
- c) Not at all. Checkers are useless.

**Teach (28 words)**
> A "% accurate" number is hard to use. Turn it into people: out of 100 essays, how many are copied, and how many
> honest ones get flagged too?

**Show me.** Ask: "Tap the line that turns % into a count."

| Weak | Good |
|---|---|
| 1. "Flagged. 95% accurate." | 1. "Flagged. 95% accurate." |
| 2. "So 95% chance I'm in trouble." | 2. "Say 2 in 100 essays are copied, and it wrongly flags 5 in 100 honest ones." **(spot)** |
| 3. Panics before the viva. | 3. "So about 7 flags per 100, and 5 are honest. A flag is weaker proof than it sounds." |

Feedback: "Counting essays shows most flags here land on honest work. The numbers are made up for practice."

**Guided try.** A spam filter catches 99 in 100 scam texts and wrongly blocks 1 in 100 normal texts. You get 1
scam a day and 100 normal texts. What happens in your blocked folder?

| Option | Correct | Feedback |
|---|---|---|
| a) About 1 scam and 1 normal text, so half of it is real messages. | Yes | Count both groups. The normal texts are many, so their 1% adds up. |
| b) It's all scams, because the filter is 99% right. | No, **misconception: "High accuracy means a flag is almost surely right."** | How often the thing is rare matters as much as the accuracy. |
| c) Can't tell without a computer. | No | Two quick counts out of 100 are enough. |

### Step 2.2

**Hook.** A coaching ad says "80% of our toppers studied with us." What is missing?
- a) The toppers' photos.
- b) **How many students joined and did not top.** (correct)
- c) The brand of the notes.

**Teach (25 words)**
> "Out of how many?" A count of winners means little without everyone who tried. Ask for the whole group, then
> picture it as 100 people.

**Show me.** Ask: "Tap the question that asks for the whole group."

| Weak | Good |
|---|---|
| 1. "80% of toppers came from here!" | 1. "80% of toppers came from here." |
| 2. "So joining makes me likely to top." | 2. "How many students joined in total?" **(spot)** |
| 3. Pays the fee. | 3. "If 8 toppers came from 4,000 students, that's 2 in 1,000." |

Feedback: "The good version asks for the denominator, the whole group, before judging."

**Guided try.** "3 people in our colony got cheated by a fake courier call." Which question turns this into a rate?

| Option | Correct | Feedback |
|---|---|---|
| a) "Out of how many households, and over how long?" | Yes | That gives you the denominator and the time. |
| b) "3 is scary enough, no need to count." | No, **misconception: "The number on top is the whole story."** | The top number needs the bottom number. |
| c) "Which families were careless?" | No | That blames people. The rate is about the calls. |

Editor note: Track 3 (scams) teaches what to do about fake calls. Here the call is only a counting example.

### Step 2.3

**Hook.** You read "the risk doubled". What do you ask?
- a) "Is it dangerous?"
- b) **"Doubled from how many out of 100, to how many?"** (correct)
- c) "Who said it?"

**Teach (27 words)**
> "Doubled" can mean 1 in 1,000 becoming 2 in 1,000, or 20 in 100 becoming 40. Ask for both counts before you
> decide how big it is.

**Show me.** Ask: "Tap the line that asks for both counts."

| Weak | Good |
|---|---|
| 1. News: "Late fees doubled for metro cards." | 1. News: "Late fees doubled for metro cards." |
| 2. "Huge. I'm cancelling mine." | 2. "Doubled from what to what?" **(spot)** |
| 3. Cancels. | 3. "₹10 to ₹20, only after 30 days. I'll set a reminder instead." |

Feedback: "A doubling of a small number can stay small. Both counts tell you the size."

**Guided try.** "Students who skip breakfast are twice as likely to miss the 9 am class." What would you want to know?

| Option | Correct | Feedback |
|---|---|---|
| a) How many in each group miss class, out of 100. | Yes | Two counts show how big the gap is. |
| b) Nothing. Twice is a lot. | No, **misconception: "A ratio tells me the size."** | Twice of a small number is still small. |
| c) Whether breakfast causes it. | Partly | A good next question (idea 3), but first see how big the gap is. |

### Field try

- **Try it today:** find one % or "times more" claim (a notice, an ad, a news line) and rewrite it as "out of 100"
  on paper.
- **Cues:** "Reading a notice", "Seeing an ad", "In class", or my own.
- **Smaller version:** take the plagiarism-check example and sketch 100 dots, shading the flagged ones.
- **Notice:** did the claim look bigger or smaller once it was counts?
- **Settings for re-offers:** ads, exam notices, prices.
- **Next-day line (sourced):** "Across 35 papers, counts like 'out of 100' and pictures made these problems easier
  (McDowell & Jacobs 2017)."

---

## 3. Find two other explanations

### Evidence

| Claim | Source quote | Source |
|---|---|---|
| Many biases come from not thinking of what goes against the current belief. | "several biases in social judgment result from a failure--first noted by Francis Bacon--to consider possibilities at odds with beliefs and perceptions of the moment." | Lord, Lepper & Preston (1984), *JPSP* 47(6), 1231-1243. https://pubmed.ncbi.nlm.nih.gov/6527215/ |
| A concrete "consider the opposite" step beat "try to be fair". | "the induction of a consider-the-opposite strategy had greater corrective effect than more demand-laden alternative instructions to be as fair and unbiased as possible." | Same |
| Two alternatives work; ten can backfire. | "Listing many counterfactual thoughts was experienced as difficult and consistently increased the hindsight bias" ... "No significant hindsight effects were obtained when participants listed only a few counterfactual thoughts, a task subjectively experienced as easy." | Sanna, Schwarz & Stocker (2002), *J Exp Psych: Learning, Memory, and Cognition* 28(3), 497-502. https://pubmed.ncbi.nlm.nih.gov/12018501/ |

**Strength: moderate.** Two experiments (Lord) plus two (Sanna), US students, lab tasks. The number "two" is from
Sanna (2 vs 10), applied here beyond hindsight. Abstracts only; effect sizes not checked.

### Step 3.1

**Hook.** Your group-project partner hasn't sent her slides, and it's the night before. What helps most?
- a) Trying hard to be fair to her.
- b) **Listing two other reasons the slides could be late.** (correct)
- c) Assuming the worst, so you're ready.

**Teach (27 words)**
> Your first explanation arrives fast and feels true. Before acting, name two other explanations. In studies,
> this concrete step worked better than just trying to be fair.

**Show me.** Ask: "Tap the line with the other explanations."

| Weak | Good |
|---|---|
| 1. 10 pm, no slides from Riya. | 1. 10 pm, no slides from Riya. |
| 2. "She doesn't care about this project." | 2. "Maybe she's on the late shift at her internship. Or she sent it to the other group." **(spot)** |
| 3. Posts an angry line in the group. | 3. Messages her: "Got your part? Can't find it." |

Feedback: "Two other stories made a calm question possible. The angry post would be hard to take back."

**Guided try.** A junior in your club skips the meet for the third time. Which thought follows the method?

| Option | Correct | Feedback |
|---|---|---|
| a) "Maybe the timing clashes with his class, or he's unsure he's welcome." | Yes | Two other explanations, each easy to check. |
| b) "I'll remind myself not to judge." | No, **misconception: "Telling myself to be fair is enough."** | In studies, a concrete step beat a general wish to be fair. |
| c) "Let me think of ten possible reasons." | No | Listing many felt hard and backfired in one study. Two is enough. |

### Step 3.2

**Hook.** The canteen's paneer tasted different today. Two friends say the cook changed. What do you do first?
- a) **Think of other reasons the taste could change.** (correct)
- b) Agree, since two people said it.
- c) Ask the manager to fire someone.

**Teach (29 words)**
> When others agree with your first story, it feels settled. Agreement is not proof. The other explanations still
> need a turn: a new supplier, a new recipe, your mood.

**Show me.** Ask: "Tap where Imran opens up other stories."

| Weak | Good |
|---|---|
| 1. "Paneer's different." | 1. "Paneer's different." |
| 2. Friends: "New cook." "Yes, new cook." | 2. Imran: "Could be a new cook, or a new paneer supplier, or less salt." **(spot)** |
| 3. Everyone repeats it all week. | 3. He asks at the counter. "Same cook, new dairy." |

Feedback: "One question at the counter split the stories. The group was sure and wrong."

**Guided try.** Your phone battery drains fast this week. Which is "two other explanations"?

| Option | Correct | Feedback |
|---|---|---|
| a) "The battery is dying. Definitely." | No, **misconception: "My first explanation is the only one."** | It might be, but it's one story. |
| b) "A new app running in the background, or I'm on video calls more." | Yes | Two others, both easy to check in settings. |
| c) "Phones are made to fail." | No | That's a belief, not a checkable explanation. |

### Step 3.3

**Hook.** In a detective story, when do the best detectives list other suspects?
- a) Only after the first suspect is cleared.
- b) **Right at the start, while every story is still open.** (correct)
- c) Never. They trust their gut.

**Teach (27 words)**
> Make the list early. Once you've picked a story, new facts start to look like they fit it. Two other
> explanations at the start keep options open.

**Show me.** Ask: "Tap the early list."

| Weak | Good |
|---|---|
| 1. Hostel room: Rohit's earphones are gone. | 1. Hostel room: Rohit's earphones are gone. |
| 2. "My roommate was here all day." | 2. "Left in the library? In my bag? Borrowed by my roommate?" **(spot)** |
| 3. Every small thing the roommate does now looks suspicious. | 3. Checks the bag and the library desk first. Found in the bag pocket. |

Feedback: "Listing three places early kept an innocent roommate out of trouble."

**Guided try.** Your mother's call goes unanswered by your brother. She thinks something is wrong. Which reply fits?

| Option | Correct | Feedback |
|---|---|---|
| a) "Maybe he's in class, or his phone's on silent. Let's try again at 6." | Yes | Two others, said gently, plus a plan. |
| b) "You're overthinking, Mummy." | No | That dismisses her. Offering other stories does more. |
| c) "Something must have happened." | No, **misconception: "The scariest story is the most likely."** | Scary stories come to mind first, not because they are likely. |

Editor note: this step uses a worried parent. Keep it light. No emergency or harm scenes; if a real emergency
is possible, the lesson is not the place for it.

### Field try

- **Try it today:** when something annoys you about someone today, write two other explanations before you reply.
- **Cues:** "When a message bugs me", "In a group project", "At home", or my own.
- **Smaller version:** recall one annoyance from this week and name one other explanation.
- **Notice:** did your reply change?
- **Settings for re-offers:** group project, family chat, hostel.
- **Next-day line (sourced):** "In two experiments, 'consider the opposite' did more than 'be fair' (Lord, Lepper
  & Preston 1984)."

---

## 4. Look for the clue that splits the stories

### Evidence

| Claim | Source quote | Source |
|---|---|---|
| A one-shot training that teaches looking for disconfirming evidence transferred to a real course case. | "Trained participants were 19% less likely to choose the inferior hypothesis-confirming solution than untrained participants." ... "Analysis of case write-ups suggests that a reduction in confirmatory hypothesis testing accounts for their improved decision making in the case." | Sellier, Scopelliti & Morewedge (2019), https://pubmed.ncbi.nlm.nih.gov/31347444/ |
| What the training taught. | "explaining the greater value of searching for hypothesis-disconfirming evidence rather than confirming evidence." | Sellier et al., accepted manuscript, https://openaccess.city.ac.uk/id/eprint/22233/1/DebiasingTrainingTransfers_InPress.pdf |
| One taught move: change one thing and hold the rest. | "Participants are taught to test whether the outcome will replicate when they remove the focal variable and hold the other factors constant" | Same |
| Why the case was hard: the clue that settles it needs a comparison. | "Only if students continued to compare the two exhibits do the dangers of racing become fully clear." | Same |
| The same training reduced confirmation bias on untaught facets too. | "Debiasing effects were domain-general" | Morewedge et al. 2015 (link above) |

**Strength: moderate.** One field study (N = 290), not randomised, business-school students in Europe, plus lab
work. The "clue that fits many stories" framing is our plain-language version of looking for evidence that can
tell hypotheses apart.

### Step 4.1

**Hook.** Your laptop won't charge. The charger light is on. What does the light tell you?
- a) The laptop is broken.
- b) **Not much. It fits "laptop problem" and "cable problem" both.** (correct)
- c) The socket is broken.

**Teach (26 words)**
> Some clues fit every story, so they settle nothing. Look for the clue that one story predicts and the other
> doesn't. That clue does the work.

**Show me.** Ask: "Tap the test that splits the stories."

| Weak | Good |
|---|---|
| 1. Laptop not charging. Light on. | 1. Laptop not charging. Light on. |
| 2. "Light's on, so the charger's fine. Must be the laptop." | 2. "Try a friend's charger on my laptop." **(spot)** |
| 3. Books a repair for ₹2,000. | 3. Friend's charger works. "It's my cable. ₹400." |

Feedback: "The friend's charger gives different results under each story. The light gave the same result under both."

**Guided try.** Your PG Wi-Fi is slow. Which check splits "the router" from "my phone"?

| Option | Correct | Feedback |
|---|---|---|
| a) Ask a roommate if theirs is slow too. | Yes | If theirs is fine, it points to your phone. If not, the router. |
| b) Restart your phone five times. | No, **misconception: "More checks of the same kind = more proof."** | Repeating one check can't separate the two stories. |
| c) Notice that videos buffer. | No | Buffering fits both stories. |

### Step 4.2

**Hook.** You think the new study spot in the library makes you sleepy. What test is fairest?
- a) Sit there more and see if you feel sleepy.
- b) **Change only the spot for a few days, keeping your sleep and lunch the same.** (correct)
- c) Ask friends if the spot feels sleepy.

**Teach (26 words)**
> To test one cause, change only that one thing and keep the rest the same. If the result moves, that thing
> mattered. If not, look elsewhere.

**Show me.** Ask: "Tap the fair test."

| Weak | Good |
|---|---|
| 1. "The library corner makes me sleepy." | 1. "The library corner makes me sleepy." |
| 2. Moves spot, starts coffee, and sleeps earlier, all in one week. | 2. Same sleep, same lunch. Swaps only the spot for 3 days. **(spot)** |
| 3. Feels better. "It was the spot!" | 3. Still sleepy at 3 pm in both spots. "It's the time, not the spot." |

Feedback: "Changing three things at once can't tell you which one mattered."

**Guided try.** Your plant on the hostel balcony is drooping. You suspect too much water. Which test is fair?

| Option | Correct | Feedback |
|---|---|---|
| a) Water less for a week, same spot, same sun. | Yes | One change, the rest held still. |
| b) Water less, move it inside, and repot it. | No, **misconception: "Fixing everything at once shows the cause."** | It may fix it, but you won't know why. |
| c) Look up "drooping plant" and pick the top answer. | No | That gives a story, not a test. |

### Step 4.3

**Hook.** You're sure your cousin is upset with you. You notice he was short with you at dinner. How strong is that clue?
- a) Strong. It proves it.
- b) **Weak, if he'd also be short when tired or stressed.** (correct)
- c) It means nothing at all.

**Teach (28 words)**
> Ask of each clue: "Would I see this even if my story were wrong?" If yes, it fits many stories and counts for
> little. Seek clues that wouldn't.

**Show me.** Ask: "Tap the clue that would split the stories."

| Weak | Good |
|---|---|
| 1. "He was short at dinner." | 1. "He was short at dinner." |
| 2. "And he didn't laugh at my joke. Proof." | 2. "If he's upset with me, he'd skip my birthday call on Sunday. If he's just tired, he'd still call." **(spot)** |
| 3. Avoids him for a week. | 3. He calls on Sunday. "Okay, he was just tired." |

Feedback: "A short reply and no laugh fit 'upset' and 'tired' both. The call was the clue that could tell them apart."

**Guided try.** You suspect a classmate copied your idea. Which clue would actually help?

| Option | Correct | Feedback |
|---|---|---|
| a) "His project is also about water saving." | No, **misconception: "Any clue that fits my story supports it."** | Many people pick that topic. It fits both stories. |
| b) "His draft has my exact table, with my typo." | Yes | That's hard to explain unless it came from your work. |
| c) "He avoided eye contact." | No | That fits many stories. See idea 8. |

Editor note: the copied-idea scene must end in a calm next step (ask, or talk to the guide), not an accusation.

### Field try

- **Try it today:** when you're sure why something happened, name one check that would come out differently if
  you were wrong, and do it.
- **Cues:** "When a device acts up", "When I'm sure about someone's mood", "In the lab", or my own.
- **Smaller version:** think of a clue you trusted this week. Would you have seen it even if you were wrong?
- **Notice:** did the check confirm your story, or change it?
- **Settings for re-offers:** gadgets, study habits, family.
- **Next-day line (sourced):** "Weeks after one training session on seeking disconfirming evidence, students
  chose the biased case answer less often (Sellier et al. 2019)."

---

## 5. Ask "what would change my mind?"

### Evidence

| Claim | Source quote | Source |
|---|---|---|
| Confidence runs high because we defend the answer we picked. | "The present studies investigated the possibility that assessment of confidence is biased by attempts to justify one's chosen answer. These attempts include selectively focusing on evidence supporting the chosen answer and disregarding evidence contradicting it." | Koriat, Lichtenstein & Fischhoff (1980), *JEP: Human Learning and Memory* 6(2), 107-118. https://doi.org/10.1037/0278-7393.6.2.107 (read from the author-hosted PDF: https://newiipdm.haifa.ac.il/wp-content/uploads/2015/05/1980-Koriat-Lichtenstein-Fischhoff-JEPHLM.pdf) |
| Listing reasons for and against made confidence better matched to accuracy. | "This procedure produced a marked improvement in the appropriateness of confidence judgments." | Same |
| Only the reason against helped. | "Only the listing of contradicting reasons improved the appropriateness of confidence." | Same, Experiment 2 |

**Strength: moderate.** Two experiments, paid University of Oregon volunteers (73 and 200), two-choice trivia
questions, 1980. Clear and simple, but old and lab-only. "What would change my mind?" is our everyday wording of
"list a contradicting reason".

### Step 5.1

**Hook.** A friend is sure the exam is on Monday, "100%". What one question checks that?
- a) "Are you really sure?"
- b) **"What's one reason it might not be Monday?"** (correct)
- c) "Who else thinks so?"

**Teach (29 words)**
> Once we pick an answer, we mostly see reasons for it. Name one reason it could be wrong. In a classic study,
> only that reason made confidence better matched.

**Show me.** Ask: "Tap the reason against."

| Weak | Good |
|---|---|
| 1. "Exam's Monday. Pakka." | 1. "Exam's Monday. Pakka." |
| 2. "Everyone in the group said so." | 2. "Though the timetable PDF was the old one." **(spot)** |
| 3. Plans the weekend around it. | 3. Opens the new notice. "Tuesday. Good thing I checked." |

Feedback: "One reason against sent her to the source. 'Everyone said so' only added more of the same."

**Guided try.** You're 90% sure a shop is open on Sunday. Which thought follows the method?

| Option | Correct | Feedback |
|---|---|---|
| a) "It was open last Sunday, and the Sunday before." | No, **misconception: "More reasons for = more accurate."** | Reasons for raised confidence without making it more accurate. |
| b) "Though it's a festival weekend, so it might shut." | Yes | One reason against. Now check or adjust your 90%. |
| c) "I'll just go and see." | Partly | Going works, but naming a reason against tells you whether the trip is worth it. |

### Step 5.2

**Hook.** You're choosing an elective. You've picked one and keep finding reasons it's great. What's missing?
- a) More reviews of it.
- b) **Asking what would make you pick a different one.** (correct)
- c) Nothing. Reasons for are what matter.

**Teach (27 words)**
> Before deciding, finish the line: "I'd change my mind if..." If nothing could change it, you haven't weighed it
> yet. Then go and check that one thing.

**Show me.** Ask: "Tap the 'I'd change my mind if' line."

| Weak | Good |
|---|---|
| 1. "Data Viz elective. Seniors loved it." | 1. "Data Viz elective. Seniors loved it." |
| 2. "And it sounds useful. And my friend's in it." | 2. "I'd change my mind if it clashes with my internship days." **(spot)** |
| 3. Signs up. Clash found in week 2. | 3. Checks the slot. It clashes. Picks the evening section. |

Feedback: "The good version names the one fact that would flip the choice, then checks it."

**Guided try.** You want to buy a used scooter from a senior. Which "I'd change my mind if" is most useful?

| Option | Correct | Feedback |
|---|---|---|
| a) "...if the RC papers aren't in his name." | Yes | A clear, checkable deal-breaker. |
| b) "...if I get a bad feeling." | No | A feeling is hard to check. Name a fact. |
| c) "Nothing would change it. I've decided." | No, **misconception: "Being decided means I'm right."** | Deciding is fine. Naming a deal-breaker first is cheap. |

### Step 5.3

**Hook.** You and a friend disagree about whether the new metro line will open this year. What makes the talk useful?
- a) Repeating your reasons more firmly.
- b) **Each saying what would change their mind.** (correct)
- c) Dropping it to stay friends.

**Teach (27 words)**
> In a disagreement, ask each other: "What would change your mind?" It turns a fight about who's right into a
> search for the fact that settles it.

**Show me.** Ask: "Tap where they find the settling fact."

| Weak | Good |
|---|---|
| 1. Arjun: "It'll open by Diwali." Zoya: "No way." | 1. Arjun: "It'll open by Diwali." Zoya: "No way." |
| 2. Both repeat themselves, louder. | 2. Zoya: "What would change your mind?" Arjun: "If the safety check isn't done." **(spot)** |
| 3. Silence on the bike home. | 3. They look it up together. Check pending. Arjun: "Fair, maybe next year." |

Feedback: "Naming what would change a mind gave them one fact to check instead of a contest."

**Guided try.** A cousin says a new phone brand is "the best". Which reply opens the talk?

| Option | Correct | Feedback |
|---|---|---|
| a) "What would make you pick a different brand?" | Yes | It invites them to name what matters, without attacking. |
| b) "That brand is rubbish." | No | That starts a fight, not a search. |
| c) "You just like it because it's popular." | No, **misconception: "Telling them why they're biased will change their mind."** | Naming someone's bias tends to close the talk. |

Editor note: this links to Track 1, idea 5 ("Disagree kindly"). Cross-link in the pack.

### Field try

- **Try it today:** before one decision today, finish the line "I'd change my mind if..." and check that one thing.
- **Cues:** "Before I buy something", "When I'm sure of a rumour", "Before I reply in an argument", or my own.
- **Smaller version:** write one "I'd change my mind if" about something you believe about tomorrow's plan.
- **Notice:** did the check hold, or did you change course?
- **Settings for re-offers:** purchases, college news, disagreements.
- **Next-day line (sourced):** "Writing one reason against a chosen answer made people's confidence fit better
  (Koriat, Lichtenstein & Fischhoff 1980)."

---

## 6. Once you know the ending, clues look obvious

### Evidence

| Claim | Source quote | Source |
|---|---|---|
| Knowing the outcome makes it seem more likely than it was, and changes which details seem relevant. | "receipt of such outcome knowledge was found to increase the postdicted likelihood of reported events and change the perceived relevance of event descriptive data, regardless of the likelihood of the outcome and the truth of the report." | Fischhoff (1975), *JEP: Human Perception and Performance*; reprinted in *Quality and Safety in Health Care* (2003) 12(4), 304-311. https://pmc.ncbi.nlm.nih.gov/articles/PMC1743746/ (abstract on PubMed: https://pubmed.ncbi.nlm.nih.gov/12897366/) |
| People don't notice it. | "Judges were, however, largely unaware of the effect that outcome knowledge had on their perceptions." | Same |
| So they overrate what they, and others, would have known. | "they overestimated what they would have known without outcome knowledge (Experiment 2), as well as what others (Experiment 3) actually did know without outcome knowledge." | Same |
| Thinking of a few other endings is easy and does not backfire; many does. | "No significant hindsight effects were obtained when participants listed only a few counterfactual thoughts" | Sanna, Schwarz & Stocker (2002), https://pubmed.ncbi.nlm.nih.gov/12018501/ |

**Strength: moderate.** A classic, widely cited effect; we read the abstracts. Sanna's fix is one paper with two
studies. Setting: US students reading historical and other event reports. The step "write a guess before the
result" is our practical form, close to Mellers et al.'s "tracking" of forecasts.

### Step 6.1

**Hook.** After the match, a friend says, "I knew they'd lose in the last over." Had he?
- a) Yes. He said so after.
- b) **Hard to say. Knowing the ending makes it feel predictable.** (correct)
- c) No. Nobody can predict cricket.

**Teach (26 words)**
> Once you know how something ended, the clues pointing to it look obvious, and you forget the ones that didn't.
> In studies, people rarely noticed this.

**Show me.** Ask: "Tap the line that keeps the ending out."

| Weak | Good |
|---|---|
| 1. Match ends. India loses by 4 runs. | 1. Before the last over, Dev types in the group: "60-40 we win." **(spot)** |
| 2. Dev: "Obviously. The bowling was weak all day." | 2. India loses by 4 runs. |
| 3. Forgets he cheered the 18th over. | 3. Dev: "I had us at 60-40. Close call, not obvious." |

Feedback: "The written guess before the end keeps a record that hindsight can't rewrite."

**Guided try.** Placement results are out. A friend didn't get picked. Someone says, "Clearly her interview was
weak." What fits the research?

| Option | Correct | Feedback |
|---|---|---|
| a) "Before results, most of us thought she'd get it." | Yes | That remembers what people knew before the outcome. |
| b) "Yes, the signs were all there." | No, **misconception: "If it looks obvious now, it was obvious then."** | Knowing the result changes which signs feel important. |
| c) "Results are random." | No | Not random, just less predictable than they look after. |

### Step 6.2

**Hook.** You want to learn from a group project that went badly. What's the trap?
- a) Talking about it at all.
- b) **Thinking the problems were obvious from day one.** (correct)
- c) Blaming the deadline.

**Teach (24 words)**
> To learn from a result, ask: "What did we actually know back then?" Judge the decision by that, not by how it
> turned out.

**Show me.** Ask: "Tap the line that judges by what they knew then."

| Weak | Good |
|---|---|
| 1. Project got a C. | 1. Project got a C. |
| 2. "We should have known Karan wouldn't deliver." | 2. "In week 1, Karan had the best track record. Picking him was fair then." **(spot)** |
| 3. "Never trust anyone again." | 3. "Next time: a check-in at the halfway mark." |

Feedback: "The good version keeps a fair decision fair, and finds the one change that would help."

**Guided try.** You took a shortcut home, and it had a jam. Which thought is fair?

| Option | Correct | Feedback |
|---|---|---|
| a) "The map showed it clear when I chose. Bad luck this time." | Yes | Judged by what you knew then. |
| b) "My fault. I knew it would jam." | No, **misconception: "A bad result means a bad decision."** | A good decision can still meet bad luck. |
| c) "Shortcuts never work." | No | One jam is not a rule. See idea 1. |

### Step 6.3

**Hook.** You want to know how good your guesses really are. What helps?
- a) Remembering your good calls.
- b) **Writing guesses down before results, then checking.** (correct)
- c) Asking friends how good your guesses are.

**Teach (27 words)**
> Memory edits old guesses to match the ending. A note written before the result can't be edited. Write the guess,
> add how sure you are, check later.

**Show me.** Ask: "Tap the written guess."

| Weak | Good |
|---|---|
| 1. "I'm good at guessing cut-offs." | 1. Notes app, before results: "Cut-off 92. 70% sure." **(spot)** |
| 2. Remembers the one year he got it right. | 2. Result: cut-off 94. |
| 3. Forgets the two years he didn't. | 3. "Off by 2. I'll guess a bit higher next time." |

Feedback: "A guess with a confidence number, written first, gives you honest feedback."

**Guided try.** You want to check your sense of whether trains will be late. Which plan works?

| Option | Correct | Feedback |
|---|---|---|
| a) Each morning for a week, note "late or on time, how sure", then check. | Yes | Written first, checked after. |
| b) Think back at the end of the week. | No, **misconception: "I'll remember my guesses fairly."** | Memory shifts guesses toward what happened. |
| c) Ask the station master. | No | Useful for facts, but it doesn't test your guesses. |

### Field try

- **Try it today:** before one result today (a match, a test score, a delivery time), write your guess and how
  sure you are. Check it later.
- **Cues:** "Before a match", "Before results", "Before a delivery", or my own.
- **Smaller version:** guess what time you'll fall asleep tonight; check in the morning.
- **Notice:** was the ending as obvious as it felt afterwards?
- **Settings for re-offers:** sports, results, travel times.
- **Next-day line (sourced):** "People who knew an outcome overestimated what they would have known without it
  (Fischhoff 1975)."

Editor note: the smaller version must not push the learner to stay up. Offer it only before bedtime-mode starts.

---

## 7. Ask the question behind a forward

### Evidence

| Claim | Source quote | Source |
|---|---|---|
| Fact-checkers leave the post to check it elsewhere ("lateral reading"). | "Lateral reading requires users to leave the information (website) to find out whether someone has already fact-checked the claim, identify the original source, or learn more about the individuals or organizations making the claim." | Brodsky et al. (2021), *Cognitive Research: Principles and Implications* 6, 23. https://pmc.ncbi.nlm.nih.gov/articles/PMC8012470/ |
| A course on it helped US college students. | "At posttest, students in DPI sections were more likely to use lateral reading to fact-check and correctly evaluate the trustworthiness of information than controls." | Same |
| But lasting effects are unknown. | "Further research is needed to determine whether improvements in lateral reading are maintained over time" | Same |
| Short tips helped in the US and an educated online sample in India. | "the intervention improved discernment between mainstream and false news headlines among both a nationally representative sample in the United States (by 26.5%) and a highly educated online sample in India (by 17.5%)." | Guess et al. (2020), *PNAS* 117(27), 15536-15545. https://pmc.ncbi.nlm.nih.gov/articles/PMC7355018/ |
| One tip used. | "[b]e skeptical of headlines," ... "If shocking claims in the headline sound unbelievable, they probably are." | Same |
| It faded in India and did not work in a rural sample. | "This increase in discernment remained measurable several weeks later in the United States (but not in India). However, we find no effects among a representative sample of respondents in a largely rural area of northern India, where rates of social media use are far lower." | Same |
| It also lowered trust in real news a little. | "exposure to this intervention reduced the perceived accuracy of both mainstream and false news headlines, but effects on the latter were significantly larger." | Same |
| An hour-long in-person training in India did not help on average. | "Receiving this hour-long media literacy intervention did not significantly increase respondents' ability to identify misinformation on average." | Badrinathan (2021), *American Political Science Review*. https://doi.org/10.1017/S0003055421000459 (abstract read via Crossref: https://api.crossref.org/works/10.1017/s0003055421000459; Cambridge page returned an error) |

**Strength: mixed.** Positive in US college courses and in an educated online Indian sample (closest to NANDI's
users), but the Indian effect faded within weeks and two Indian field samples showed no average gain. Teach it
as a habit to practise, not a shield. Badrinathan also found a backfire among some partisans, so **no political
or religious examples** in this idea.

### Step 7.1

**Hook.** The family WhatsApp group shares "Banks closed for 5 days from Monday!" What's the first useful question?
- a) "Who forwarded it?"
- b) **"Where did this come from first?"** (correct)
- c) "How many people shared it?"

**Teach (24 words)**
> Behind every forward is a question: who first said this, and how would they know? Leave the message and look
> for the original source.

**Show me.** Ask: "Tap where Pooja leaves the forward to check."

| Weak | Good |
|---|---|
| 1. Forward: "Banks closed 5 days!" | 1. Forward: "Banks closed 5 days!" |
| 2. Reads it again. "Looks official, has a logo." | 2. Opens the bank's own site and searches "holiday list". **(spot)** |
| 3. Forwards to her hostel group. | 3. "Two days, not five. Saturday and Sunday." Posts the link, calmly. |

Feedback: "Looking harder at the forward itself can't tell you much. Going to the source can."

**Guided try.** A forward says a famous cricketer died. What do you do?

| Option | Correct | Feedback |
|---|---|---|
| a) Search the news for the name and see if any known outlet reports it. | Yes | Checking elsewhere is what fact-checkers do. |
| b) Check if the image looks real. | No, **misconception: "I can spot fakes by looking closely."** | Looking closer at the post itself tells you less than checking elsewhere. |
| c) Forward with "Is this true?" | No | That spreads it further while you wait. |

### Step 7.2

**Hook.** A post says, "Scientists say a new planet will be visible from India on Friday night." What question helps?
- a) **"Which scientists, and where is it published?"** (correct)
- b) "Does the post have many likes?"
- c) "Does it sound scientific?"

**Teach (27 words)**
> "Experts say" is a claim about a source. Ask who exactly, and find them. If you can't find the expert or the
> study, treat it as unconfirmed.

**Show me.** Ask: "Tap the step that finds who said it."

| Weak | Good |
|---|---|
| 1. "Scientists say..." | 1. "Scientists say..." |
| 2. "Sounds right. Lots of shares." | 2. Searches the claim plus "fact check". **(spot)** |
| 3. Plans a rooftop night with friends. | 3. Finds the original article: it needs a telescope, and it's a faint dot. |

Feedback: "Shares measure spread, not truth. Finding the source told her who was behind it."

Editor note: the planet scene is made up. Editors pick a real, checkable sky event for the final copy, or keep
it clearly fictional. No health claims in this idea.

**Guided try.** A reel says a new government scheme pays ₹5,000 to every student. What's the best check?

| Option | Correct | Feedback |
|---|---|---|
| a) Look for the scheme on an official government site or a known news outlet. | Yes | Leave the reel, find the source. |
| b) Read the comments. | No | Comments are other people guessing. |
| c) It has an official-looking logo, so it's real. | No, **misconception: "A logo means it's official."** | Logos are easy to copy. Track 3 covers this more. |

### Step 7.3

**Hook.** After learning to doubt forwards, a friend now doubts everything, including real news. What went wrong?
- a) Nothing. Doubting everything is safest.
- b) **Checking became doubting. The aim is to sort, not to reject.** (correct)
- c) He checked too many things.

**Teach (29 words)**
> In one study, tips lowered trust in false news a lot, and in real news a little. The goal is sorting: check the
> source, then trust what holds up.

**Show me.** Ask: "Tap where Nikhil sorts instead of rejecting."

| Weak | Good |
|---|---|
| 1. News: "Exam postponed by a week." | 1. News: "Exam postponed by a week." |
| 2. "Everything's fake these days." | 2. Checks the university notice page. It's there. **(spot)** |
| 3. Misses the new date. | 3. "Real. Updating my plan." |

Feedback: "Checking ends in a decision: trust it or not. Doubting everything throws out the true news too."

**Guided try.** Which habit matches the research best?

| Option | Correct | Feedback |
|---|---|---|
| a) Check surprising claims at the source, and trust the ones that hold up. | Yes | Sorting, not rejecting. |
| b) Never believe anything online. | No, **misconception: "More doubt is always safer."** | It also throws away real news. |
| c) Trust forwards from family, doubt the rest. | No | Family forward what they receive too. Check the source, not the sender. |

### Field try

- **Try it today:** the next surprising forward you get, find where it came from first before you react or share.
  Then close the app.
- **Cues:** "In the family group", "In a college group", "On a reel", or my own.
- **Smaller version:** pick one forward from this week and ask: who said this first?
- **Notice:** was the source what the forward claimed?
- **Settings for re-offers:** family group, college group, news apps.
- **Next-day line (sourced):** "In a US college course, students taught to check claims elsewhere did it more and
  judged trustworthiness better (Brodsky et al. 2021)."

Editor note: "Then close the app" matters. NANDI replaces night scrolling; this try must not become a reason to
stay in WhatsApp. Daytime offer only.

---

## 8. Nervous is not the same as guilty

### Evidence

| Claim | Source quote | Source |
|---|---|---|
| People spot lies only slightly better than chance. | "people achieve an average of 54% correct lie-truth judgments, correctly classifying 47% of lies as deceptive and 61% of truths as nondeceptive." | Bond & DePaulo (2006), *Personality and Social Psychology Review* 10(3), 214-234. https://pubmed.ncbi.nlm.nih.gov/16859438/ |
| This is a large evidence base. | "synthesizing research results from 206 documents and 24,483 judges" | Same |
| Truthful people can look deceptive when they want to be believed. | "people appear deceptive when motivated to be believed" | Same |
| The behaviour itself is a weak signal. | "limitations in lie detection accuracy are mainly attributable to weaknesses in behavioral cues to deception." | Hartwig & Bond (2011), *Psychological Bulletin* 137(4), 643-659. https://pubmed.ncbi.nlm.nih.gov/21707129/ |
| Eye contact is not the cue people think. | "Contrary to self-reports, eye contact is only weakly correlated with deception judgments (r = -.15)." | Same |
| Snap face judgments get more confident, not better. | "this result suggests that additional time may simply boost confidence in judgments." | Willis & Todorov (2006), *Psychological Science* 17(7), 592-598. https://pubmed.ncbi.nlm.nih.gov/16866745/ |

**Strength: strong.** Two meta-analyses with thousands of judges. Setting: mostly lab studies with strangers in
the US and Europe. The lesson teaches **checking facts instead of reading faces**, which follows from the finding;
it does not teach lie-spotting.

**Guardrail (from cj4-evidence §7).** No "spot the liar" games about friends or family. Fiction shows a
detective reading a face and being right; this idea says what research found instead.

### Step 8.1

**Hook.** ₹200 is missing from the trip fund. When you ask, Tanmay stammers and looks away. What does that tell you?
- a) He took it.
- b) **Very little. Honest people get nervous when questioned too.** (correct)
- c) He's hiding something else.

**Teach (26 words)**
> Across hundreds of studies, people judged lies right only 54% of the time, barely above a coin toss. Nervous
> looks fit guilty and innocent people both.

**Show me.** Ask: "Tap where Megha checks facts instead of faces."

| Weak | Good |
|---|---|
| 1. ₹200 missing. Tanmay stammers. | 1. ₹200 missing. Tanmay stammers. |
| 2. "See? He can't even look at me." | 2. Opens the UPI history for the fund. **(spot)** |
| 3. Tells the group. Trust breaks. | 3. "Oh. The toll payment. I forgot to log it." |

Feedback: "The stammer fit both stories (see idea 4). The payment log split them."

**Guided try.** Your younger brother says he finished homework, but he's fidgeting. What fits the research?

| Option | Correct | Feedback |
|---|---|---|
| a) "Show me the notebook?" | Yes | A fact to check, asked plainly. |
| b) "You're fidgeting, so you're lying." | No, **misconception: "Fidgeting gives liars away."** | Behaviour is a weak signal. Many honest people fidget. |
| c) Stare at him until he admits it. | No | Pressure makes honest people look nervous too. |

### Step 8.2

**Hook.** In shows, the detective reads a lie from the eyes. In studies, how did eye contact do?
- a) It was the best clue.
- b) **It was only weakly linked to lie judgments.** (correct)
- c) Liars always avoid eye contact.

**Teach (26 words)**
> Fiction detectives read faces. Real research found body cues are weak signals. A good real-life detective asks:
> "What can I check?" not "How do they look?"

**Show me.** Ask: "Tap the checkable fact."

| Weak | Good |
|---|---|
| 1. A seller on a resale app is selling a "new, sealed" phone. | 1. A seller on a resale app is selling a "new, sealed" phone. |
| 2. Video call: "He looks honest, steady eyes." | 2. "Can you show the IMEI on the box and the bill?" **(spot)** |
| 3. Pays in advance. | 3. Checks the IMEI matches. Meets in a public place to buy. |

Feedback: "Steady eyes are not evidence. A matching IMEI and bill are."

Editor note: link to Track 3 (scams) for resale safety steps; keep this step about evidence, not scams.

**Guided try.** A new flatmate seems "shifty" to you. Which response fits the research?

| Option | Correct | Feedback |
|---|---|---|
| a) Notice that "shifty" is an impression, and wait for facts. | Yes | Impressions form fast and feel sure. Facts come slower. |
| b) Trust your gut. First impressions are usually right. | No, **misconception: "Quick reads of people are accurate."** | More time looking raised confidence, not accuracy. |
| c) Warn the others. | No | That spreads an impression as if it were a fact. |

### Step 8.3

**Hook.** A friend gives a long, detailed excuse for being late. Another gives a short one. Who is more likely lying?
- a) The long one. Too many details.
- b) The short one. Hiding something.
- c) **You can't tell from the style.** (correct)

**Teach (24 words)**
> No single style marks a liar. If it matters, look for a fact that can be checked. If it doesn't matter, let it
> go.

**Show me.** Ask: "Tap the line that decides whether to check at all."

| Weak | Good |
|---|---|
| 1. Varun: "Auto broke down, then the signal..." | 1. Varun: "Auto broke down, then the signal..." |
| 2. "Too detailed. Classic liar." | 2. "Does it matter? We're just getting chai." **(spot)** |
| 3. Cold for the whole evening. | 3. "No harm done." Orders two cutting chais. |

Feedback: "Not every claim needs checking. When nothing rides on it, letting it go keeps the friendship."

**Guided try.** Which of these is the most useful habit from this idea?

| Option | Correct | Feedback |
|---|---|---|
| a) Learn the body signs of lying. | No, **misconception: "Training my eye will make me a lie detector."** | Even average accuracy across studies was 54%. The signals are weak. |
| b) When it matters, find a checkable fact; when it doesn't, let it go. | Yes | Facts over faces. |
| c) Assume people are lying until proven honest. | No | That breaks trust and is wrong most of the time. |

### Field try

- **Try it today:** the next time you catch yourself thinking "they look like they're lying", ask: "What could I
  check, and does it matter?"
- **Cues:** "In a group money split", "When buying second-hand", "At home", or my own.
- **Smaller version:** recall a time someone looked nervous but was telling the truth.
- **Notice:** what did you check, or did you let it go?
- **Settings for re-offers:** money splits, resale apps, family.
- **Next-day line (sourced):** "Across 206 documents and 24,483 judges, people spotted lies 54% of the time (Bond &
  DePaulo 2006)."

---

## Cross-cutting risks for editors

| Risk | What to do |
|---|---|
| Studies are from the US, UK, Israel, Germany. India appears only in Guess 2020 and Badrinathan 2021, both with limits. | Say "in studies" in copy. Indian scenes are practice settings, not proof. |
| Session length. The anchor trainings were 30-100 minutes; ours are 2-minute steps. | Never quote the 19% or the effect sizes as what NANDI does. "In one study, a single training session..." is fine. |
| Stereotyping through base rates. | Base rates for events only (idea 1 guardrail). Validator flag for caste, religion, region, gender words near "usually" or "base rate". |
| Accusation. Detective framing can turn into suspicion of friends and family. | Every people scene ends in a calm check or letting go. No "spot the liar" games. Ideas 3, 4 and 8 model an innocent outcome. |
| "You are irrational" framing. | Hooks name a situation (a late train, a forward, a missing ₹200), never a flaw. Teach cards say "people", "studies", "memory", not "you are biased". |
| Media literacy backfire and over-doubt. | Idea 7 step 3 teaches sorting, not rejecting. No political or religious examples. |
| Health creep. Base-rate research uses medical tests. | No medical examples in this track. Plagiarism, spam and prices instead. |
| Films and TV. | Detective shows can inspire tone only (the slow reveal, the clue board). No plots, character names or lines. Step 8.2 contrasts "in shows" with research without naming a show. |
| Night use. | Field tries are daytime offers. Idea 6's smaller version is offered only before bedtime mode. |
| Guilt copy. | No "you should". Reflections ask what happened, not whether the learner did well. Every Field try is skippable at no cost. |

## Myths not to teach

| Myth | What the evidence says | Source |
|---|---|---|
| "A good detective reads lies from the eyes." | 54% accuracy across 24,483 judges; eye contact weakly linked. | Bond & DePaulo 2006; Hartwig & Bond 2011 |
| "Just try to be unbiased." | A concrete step ("consider the opposite") did more than "be fair". | Lord, Lepper & Preston 1984 |
| "List every possibility." | Listing 10 alternatives backfired; 2 did not. | Sanna, Schwarz & Stocker 2002 |
| "95% accurate means a flag is 95% likely right." | Depends on how common the thing is; counts out of 100 make this visible. | Hoffrage et al. 2000; McDowell & Jacobs 2017 |
| "Bias training never leaves the classroom." | One field study says it can (19%). Still one study, not randomised. | Sellier et al. 2019 |
| "Media-literacy tips protect people." | Helped some samples, faded in India, null in rural and in-person Indian samples. | Guess et al. 2020; Badrinathan 2021 |
| "I knew it all along." | Outcome knowledge changes what seems predictable, and people don't notice. | Fischhoff 1975 |

## Links to Mind

| Mind feature | Idea it can reuse |
|---|---|
| Daily mystery: "solution" screen | Add one "other explanation we ruled out, and the clue that did it" line (ideas 3, 4). |
| Daily mystery: before reveal | Optional "your guess and how sure" (idea 6), never scored for confidence. |
| People-reading deck | Add the 54% finding as a card; keep the deck about reading situations, not lie-spotting (idea 8). |

## Reserve ideas (not in the 8)

| Idea | Why held back |
|---|---|
| Small samples swing more (law of large numbers training, Fong, Krantz & Nisbett 1986) | Strong classic on transfer to everyday problems, but we could not open it (see below). Add once a legal copy is read. |
| Anchoring: the first number sticks (in Morewedge Exp 2) | Fits bargaining scenes, but better placed in a money or negotiation track. |

## Sources

### Opened and quoted

| Source | Where we read it |
|---|---|
| Morewedge et al. 2015, *PIBBS* | Accepted manuscript PDF, City Research Online (full text) |
| Sellier, Scopelliti & Morewedge 2019, *Psych Sci* | PubMed abstract (published 19% figure); accepted manuscript PDF, City Research Online (full text, says 29%); PubMed corrigendum record (no text) |
| Tversky & Kahneman 1974, *Science* | PubMed abstract |
| Mellers et al. 2014, *Psych Sci* | PubMed abstract |
| Hoffrage et al. 2000, *Science* | PubMed abstract |
| McDowell & Jacobs 2017, *Psych Bull* | PubMed abstract |
| Garcia-Retamero, Galesic & Gigerenzer 2010, *Med Decis Making* | PubMed abstract |
| Lord, Lepper & Preston 1984, *JPSP* | PubMed abstract |
| Sanna, Schwarz & Stocker 2002, *JEP:LMC* | PubMed abstract |
| Koriat, Lichtenstein & Fischhoff 1980, *JEP:HLM* | Author-hosted PDF, University of Haifa lab site (full text) |
| Fischhoff 1975, reprinted 2003 | PubMed abstract; PMC record |
| Brodsky et al. 2021, *Cogn Res* | PubMed abstract; PMC full text |
| Guess et al. 2020, *PNAS* | PubMed abstract; PMC full text |
| Badrinathan 2021, *APSR* | Abstract via Crossref API |
| Bond & DePaulo 2006, *PSPR* | PubMed abstract |
| Hartwig & Bond 2011, *Psych Bull* | PubMed abstract |
| Willis & Todorov 2006, *Psych Sci* | PubMed abstract |

### Could not open (not used as evidence)

| Source | Problem |
|---|---|
| Fong, Krantz & Nisbett 1986, *Cognitive Psychology* 18 ("statistical training on everyday problems") | Michigan Deep Blue PDF behind a bot check (403 and challenge page); ScienceDirect 403; no abstract in Crossref or Semantic Scholar. Moved to reserve. |
| Badrinathan 2021, Cambridge article page | HTTP 500. Used the Crossref abstract. |
| Michigan Deep Blue record page for Fong et al. | 403 |

Methods and effect sizes were checked only where we had full text (Morewedge, Sellier, Koriat, Guess, Brodsky).
For the rest, claims stay within the abstract wording.
