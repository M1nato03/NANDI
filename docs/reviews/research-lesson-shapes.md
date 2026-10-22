# Research: how good learning apps keep one lesson from feeling repetitive

Date: 22 Oct 2026. Research only, no app code changed.
Compared against: `docs/specs/16-fresh-practice.md` §5 (branch `ideas/spec-16-fresh-practice`, commit d0827ee).
Question: inside one lesson, how many times do the best apps ask about one new thing, how do they mix in review, and
how do they space it? What should NANDI change?

**Short answer.** Spec 16 §5 is pointed the right way. Duolingo, Khan Academy and the research all keep the number of
back-to-back asks on one new thing low (about 2–3) and push the rest of the practice into later, mixed sessions. Five
changes would make §5 stronger. The most important one is a caution: the interleaving meta-analysis that §5 cites
found **no clear benefit for text-based facts** like NANDI's, and **a cost for word learning**. So mixing should pick
ideas that are easy to confuse with each other, not random ones. Most of the gain NANDI can expect comes from spacing.

---

## 1. What the apps do

### Duolingo

| What | Figure | Source |
|---|---|---|
| New items per lesson | "each lesson only presents 5-7 new words" | [Dear Duolingo: What's the right level of difficulty? (Wilkinson, 2 Apr 2024)](https://blog.duolingo.com/right-level-of-difficulty) |
| How new items appear | "you're taught a handful of new words or structures by seeing them in sentences made up of only familiar words and grammar" | same post |
| Old vs new mix (Stories) | designers "aim for a 90/10 split": 90% known vocabulary and grammar, 10% new | same post |
| Exercises per lesson | "Each Lesson has from 2 to 18 exercises (usually 15)". Community tracker, not official; edited 12 Mar 2025 | [duolingodata.com](https://duolingodata.com/dat/rofen62.html) |
| Same item, harder each time | "In earlier exercises, you might learn to recognize a new word, and eventually you'll be typing it out yourself." | [Duolingo 101 (Blanco, 2 Dec 2024)](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo) |
| Review in the path | "Each unit also includes personalized practice lessons that are unique to each learner." Duolingo "tells you what to review and when" | same post |
| Mistakes | "At the end of a lesson, you'll review any mistakes you made." "We wait until the end of the lesson to take advantage of a little spaced repetition!" Things you got wrong come back sooner | [Dear Duolingo: Why is spaced repetition so important? (Onstwedder, 26 Dec 2023)](https://blog.duolingo.com/spaced-repetition-for-learning) |
| Spacing model | Half-Life Regression cut recall-prediction error "by 45%+" against baselines and raised daily engagement "by 12%" in a live test. Practice sessions "are identical to lessons, except that the exercises are taken from those indexed with words … due for practice" | [Settles & Meeder, ACL 2016](https://research.duolingo.com/papers/settles.acl16.pdf) |
| Difficulty target | The session generator picks from "like 200 challenges" and aims for something "you only have a 70% chance of getting right" | [VentureBeat, 18 Aug 2020](https://venturebeat.com/ai/how-duolingo-uses-ai-in-every-part-of-its-app) |

**What this means.** About 15 exercises cover 5–7 new words, so each new word gets about 2–3 exercises in a lesson.
That figure is our estimate, not one Duolingo publishes. The real trick is that **every exercise also re-uses old
words**: review is built into the sentence, not added as a separate block. A new word also moves from *recognise* to
*produce* across the lesson, so the second ask is a harder task, not just the same task again. In the 2016 design a
lesson "continues until the student masters all of the target words" (Settles & Meeder §2.1). After that, the words
move to the student model and come back in spaced practice sessions.

### Khan Academy

| What | Figure | Source |
|---|---|---|
| Practice exercise | "4-7 questions long and cover a select group of skills in a lesson" | [What types of content can I assign?](https://support.khanacademy.org/hc/en-us/articles/18564282990861-What-types-of-content-can-I-assign-to-my-students) |
| Quiz / unit test / course challenge | quiz ≥ 5 questions (one lesson's skills), unit test ≥ 9 (all of a unit), course challenge 30 (whole course) | same |
| Levels | Familiar = 70–99% on an exercise, Proficient = 100%. **Mastered only on a mixed-skill assessment**: "already at the Proficient and correctly answered questions on this skill on a mixed-skill assessment" | [How do Mastery levels work?](https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work) |
| Mastery Challenge | "always consist of 6 questions that review 3 skills … devoting 2 questions to each skill". Questions are "randomized, which means you won't necessarily answer both questions for each skill one after another". It unlocks only after "more than 12 hours since you last started" one | [What are Mastery Challenges?](https://support.khanacademy.org/hc/en-us/articles/360037494231-What-are-Mastery-Challenges) |
| Why | Teachers wanted to replace the "one and done" experience, so Mastery Challenges give "personalized, spaced repetition of skills they've already practiced" | [Mastery Challenges in course mastery](https://support.khanacademy.org/hc/en-us/articles/360037127892-What-are-Mastery-Challenges-in-course-mastery) |

**What this means.** Khan does use blocked practice right after teaching (4–7 questions on one skill). Math can
support that because every question has new numbers and a real procedure to run. But the top level is earned only in
mixed, spaced review: 2 questions per skill, 3 skills, shuffled, at least 12 hours apart. That is almost the same
shape as §5's drop.

### Brilliant

All quotes are from [How Brilliant teaches math](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/).
This is Brilliant's own page, so it is a claim about their design, not evidence that it works.
- Problem first: "Brilliant often asks a question before presenting a procedure. That first attempt gives the
  explanation a purpose."
- Varying practice: a practice problem "can change the surface details so the learner must recognize the underlying
  idea rather than copy a pattern."
- Mixing: "Mixing related problem types makes the learner decide which strategy applies." Note the word **related**.
- Review: "Review sets that combine material from preceding lessons are rolling out course by course."

Brilliant does not publish a lesson length or problem count. Third-party reviews disagree (5–30 minutes), so they
are not quoted here.

**NANDI's own data shows a warning here.** Brilliant's "change the surface details" is exactly what NANDI's writers
did: new names and new numbers. The re-reviews still rated that **fresh 2.4–2.7** (§5). Changing the surface is not
enough. What changes the feel is a different **decision**: choosing *which* idea applies (Brilliant's "decide which
strategy"), or moving from recognising to producing (Duolingo).

---

## 2. What the research says

### Interleaving: Brunmair & Richter 2019

[Psychological Bulletin 145(11):1029–1052](https://pubmed.ncbi.nlm.nih.gov/31556629/): 59 studies, 238 effect sizes,
158 samples.
- Overall "moderate overall interleaving effect (Hedges' g = 0.42)".
- Paintings g = 0.67, maths g = 0.34. "Results for expository texts and tastes were ambiguous with nonsignificant
  overall effects." **"An advantage of blocking compared with interleaving was found for studies based on words
  (g = -0.39)."**
- Larger effects "for learning material more similar between categories, for learning material less similar within
  categories, and for more complex learning material."
- Their conclusion: interleaving "should be used with caution in certain conditions, especially for expository texts
  and words."

**For NANDI:** a step is one claim stated in words, which is closest to "expository text". The 0.42 in §5 is the
average over all materials. It is not the figure for this kind of content. Interleaving helps when the learner has to
tell **similar** categories apart. That points to mixing ideas that are easy to confuse, not mixing everything.

### Spacing: Cepeda et al. 2006 and 2008

[Cepeda, Pashler, Vul, Wixted & Rohrer 2006, Psychological Bulletin 132(3):354–380](https://pubmed.ncbi.nlm.nih.gov/16719566/):
"839 assessments of distributed practice in 317 experiments located in 184 articles". Table 1 of the
[full text](https://www.evullab.org/pdf/CepedaPashlerVulWixtedRohrer-PB-2006.pdf) gives final-recall % correct, massed
vs spaced:

| Retention interval | Massed | Spaced |
|---|---|---|
| 1 day | 32.9 | 43.0 |
| 2–7 days | 31.1 | 45.4 |
| 8–30 days | 32.8 | 62.2 |
| All intervals (271 comparisons, 14,811 people) | **36.7** | **47.3** |

Not every bin is significant on its own. Only the overall result and the 8–30 day bin are, with p < .05. "The ISI
producing maximal retention increased as retention interval increased."

[Cepeda et al. 2008, Psychological Science 19(11):1095–1102](https://pubmed.ncbi.nlm.nih.gov/19076480/): more than 1,350
people, gaps of up to 3.5 months, tests up to 1 year later. "The optimal gap declined from about 20 to 40% of a 1-week
test delay to about 5 to 10% of a 1-year test delay." For a 1-week goal that means a gap of about **1.5–3 days**. For a
1-year goal it means about **2.5–5 weeks**.

### Fewer asks in one sitting cost nothing; the extra asks belong on a later day

[Rohrer & Taylor 2007, Instructional Science 35:481–498](https://gwern.net/doc/psychology/spaced-repetition/2007-rohrer.pdf):
- Exp. 1 (one type of maths problem, tested 1 week later): Spacers 74%, Massers 49%, **Light Massers (half as many
  massed problems) 46%**. "Despite a twofold difference in the amount of massed practice … there was not detectable
  difference in their test scores."
- Exp. 2 (four problem types): during practice, Blockers 89% vs Mixers 60%. On the test 1 week later, **Mixers 63%
  vs Blockers 20%**.

[Rohrer & Taylor 2006, Applied Cognitive Psychology 20:1209–1224](https://digitalcommons.usf.edu/psy_facpub/1770/):
6 extra problems in the same sitting (overlearning) "had no effect on test scores 1 or 4 weeks later". The spacing
benefit "was nil among students who were tested 1 week later but extremely large among students tested 4 weeks later".

### Massed practice feels better than it is

[Kornell & Bjork 2008, Psychological Science 19(6):585–592](https://pubmed.ncbi.nlm.nih.gov/18578849/): massing
"created a sense of fluent learning". Participants "rated massing as more effective than spacing, even after their own
test performance had demonstrated the opposite." This was replicated in
[Wang et al. 2020, Memory](https://doi.org/10.1080/09658211.2019.1705490).

---

## 3. NANDI §5 next to the others

| | Duolingo | Khan Academy | Brilliant | NANDI §5 |
|---|---|---|---|---|
| Asks on one new thing in the lesson | ~2–3 per new word (estimate), each with a different task | 4–7 (blocked; new numbers each time) | not published | **3** (hook, spot, 1 guided) |
| What the second ask demands | harder (recognise → type) | same skill, new numbers | new surface, same idea | different screen type, same claim |
| Review inside the lesson | built into every sentence (old words carry new ones) | none in the exercise | review sets roll out per course | 2–3 due items from **other** ideas |
| Own practice later | spaced practice sessions by half-life model | Mastery Challenge: 2 per skill, 3 skills, shuffled, ≥ 12 h apart | "returning to important ideas across sessions" | first served ≥ 1 day later, never two from one idea in a row |
| What gets mixed | items due for review | skills worked on across the course | "related problem types" | "other ideas" (no rule for which) |
| Mistakes | redone at end of lesson; come back sooner | can level down | revise in place | teach card again (spec 14) |
| Top status needs | strength from spaced practice | correct on a **mixed** assessment | — | no rule yet |

Where §5 already matches the evidence:
- **Cap of 3 asks per claim.** This matches Duolingo's ratio and Khan's 2-per-skill challenge. Rohrer & Taylor's
  Light Massers show that cutting massed asks costs nothing.
- **Moving the step's own practice to later days.** This is the Cepeda result, and the Duolingo and Khan practice
  design.
- **Never two from the same idea in a row.** This is Khan's shuffled challenge.
- **6 items per idea, not 8.** The overlearning result says the extra same-sitting items were not adding learning.

What §5 leaves open: **which** ideas to mix, **when** exactly each of the 2 practice items comes back, what a second
ask should **demand**, what happens on a **miss**, and how to **measure** a shape that is meant to feel harder.

---

## 4. Recommendations (5)

### 1. Mix ideas that are easy to confuse, not random ones
**Change.** When the drop composer picks the 2–3 "your turn" items from other ideas, it should prefer, in this order:
(a) due items from ideas in the **same topic** that a learner could mix up with today's idea (for example inflation
vs interest, cue vs reward), then (b) any due item from the same topic, then (c) other topics. Writers tag each idea
with 1–2 `neighbours`. Do not mix in an idea that has not been taught yet.
**Evidence.** Brunmair & Richter: bigger effects for material "more similar between categories". Text and words show
no gain or a loss (g = −0.39 for words). Brilliant mixes "related problem types". The project's own
`docs/research/learning-science.md` already says "Mix related problem types once learners can attempt each type."
**Also fix the evidence line in §5.** Say that g = 0.42 is the average over all materials, and that results for text
were not significant. That way nobody expects random mixing to fix freshness.

### 2. Put a step's two practice items on two different days, with a longer second gap
**Change.** Replace "at least 1 day after" with: practice item 1 on **day 1–3** after the step is taught, and practice
item 2 about **5–10 days** later, after item 1. Never serve both on the same day. After that, the normal review
schedule takes over and the gaps keep getting longer.
**Evidence.** Cepeda 2008: the best gap is 20–40% of a 1-week horizon (about 1.5–3 days) and gets longer for longer
horizons. Cepeda 2006 Table 1: spaced recall 47.3% vs massed 36.7% overall. Khan's 12-hour minimum gap. Rohrer &
Taylor 2007 Exp. 1: Spacers 74% vs Massers 49%. Serving both items the next day would just move the massing to day 2.

### 3. Each new ask on the same claim should demand a different decision, not a new surface
**Change.** Tie the item's `job` to its slot:
- In-lesson guided try: recognise (the existing choice question with a hint).
- Practice item 1 (day 1–3): apply it in a new life area, with no hint.
- Practice item 2 (about a week later): **decide between this idea and a neighbour**, or apply it with an earlier
  idea (`combine`). For example: "Which explains this: inflation or interest?"

Keep R5's one-sentence check. Add one line to the reviewer brief: two items on one claim also fail if they ask the
learner to make the same **decision**, even when the sentence that answers them differs.
**Evidence.** Duolingo moves from "recognize" to "typing it out yourself". Brilliant: "decide which strategy applies".
Khan's top level needs a **mixed** assessment. NANDI's own re-reviews found that new names and new numbers alone
stayed at fresh 2.4–2.7.

### 4. On a miss, ask again at the end of the drop with the sibling item, and bring the claim back sooner
**Change.** If a review item is wrong: show the teach card again (spec 14, already planned). Then put the **other**
practice item or the guided try for that claim at the end of the same drop, never the same question. Then schedule
the claim for the next day instead of the longer gap. A correct answer makes the next gap longer.
**Evidence.** Duolingo: "At the end of a lesson, you'll review any mistakes you made … to take advantage of a little
spaced repetition", and wrong items come back sooner. The half-life model (Settles & Meeder) does this at scale.
Re-asking the exact same question is the "exact repetition" Jenil complained about, so use the sibling item.
**Guardrail.** At most one retry per drop. The drop still ends on its stopping screen. A miss never costs XP or
Shards.

### 5. Expect accuracy to drop and the lesson to feel harder, and judge it by a later test
**Change.**
- (a) Change spec 14's kill-test bands for **mixed review** items to about **65–85%** first-try correct. Keep 85–95%
  for in-lesson guided tries. Do not make review items easier when accuracy falls into that band.
- (b) Add a retention check to the gate: accuracy on each step's practice item 2 (about day 7) and on the first
  review after **2–4 weeks**. Compare it with the old shape's 7-day review accuracy. The simulated-week walk-through
  measures freshness, not retention.
- (c) In Jenil's one-week phone test, ask "did it feel like the same question?" and not "did it feel easy?".

**Evidence.** Rohrer & Taylor 2007: Mixers scored 60% vs 89% in practice but 63% vs 20% on the test. Kornell &
Bjork: people rate massed practice as better "even after their own test performance had demonstrated the opposite".
Duolingo targets about a 70% chance of success. Rohrer & Taylor 2006: the spacing benefit was "nil" at 1 week and
"extremely large" at 4 weeks, so a 1-week check alone can miss the gain.

---

## 5. Not recommended

- **Khan-style level-down on a miss.** It breaks the non-negotiable that level never decreases. Change 4 gets the
  learning benefit (a sooner return) with no penalty.
- **Mixing every topic together to maximise variety.** The meta-analysis does not support this for text-based
  material (see change 1). It can also make a drop feel scattered.
- **Extra screens to "use up" the time freed by cutting the second guided try.** A shorter lesson that ends is the
  goal (less time in the app, earlier sleep). The overlearning result says the extra asks would not add learning.

## 6. Limits of this review

- Duolingo's exercises-per-lesson figure comes from a community tracker, not Duolingo. The "2–3 asks per new word"
  ratio is our estimate from 15 exercises and 5–7 new words.
- Brilliant's statements come from its own marketing page. Third-party lesson lengths conflict, so none are used.
- The VentureBeat interview (2020) describes an older Duolingo personalisation share (12% of sessions). It is used
  here only for the 70% difficulty target and the candidate-pool design.
- Spacing and interleaving studies mostly use word lists, maths and visual categories. None tested short
  plain-language claims like NANDI's. The direction is well supported. The exact gaps in change 2 are a starting
  point to tune with change 5(b) data.
