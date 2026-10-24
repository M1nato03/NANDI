# cj6 · Drawing starter in pack format

Job 4 of research batch 6. Date: 2026-10-24. Branch `ideas/cj6-drawing-starter`, based on `origin/main` at `92da451`.
Status: **DRAFT FOR EDITORS.** Nothing is built and nothing goes into `content/`.

Input: §7.1 of `docs/reviews/cj4-try-it.md` (branch `ideas/cj4-try-it`) and `docs/reviews/cj4-hobbies.md` (branch `ideas/cj4-hobbies`).
Output: `content-drafts/topic.try-drawing.json`. This report.

## 0. Summary

- The draft passes `validatePack(pack, { allowUnchecked: true, editorial: true })` with **0 errors**. Without
  `allowUnchecked`, it shows the 3 expected "missing fact-check verdict" errors. No fact-check has been done yet.
- **A 7-day track cannot pass the editorial checks.** Once you add the editorial checks, every idea needs exactly 3
  steps. So the draft has **9 steps**: days 1-7, plus 2 extra steps written only to meet the rule. Today's engine teaches
  one step a day per course, so this pack would run as a 9-day track. I bent the content to fit, and §3 says how.
- There is no field for a quest on each step. So each idea's `quest` carries 3 days of quests, their small versions and
  their next-day self-checks, as plain text.
- 9 validator rules do not fit a hobby track. 4 checks a hobby track needs are missing. Both lists are in §5.
- I re-read every source. That changed 4 of cj4's day rows (§4): day 3 (the sources disagree), day 5 (wrong
  citation; the evidence is mixed), day 6 (faces only, one short try; a third study found a small gain) and day 7 (the
  abstract gives no duration).
- No health claims. The visible copy has no "stress", "brain", "cortisol", "relax", "calm", "therapy" or
  "mindful". Kaimal 2016 (cortisol) is not used.

## 1. What the draft contains

One topic, `try-drawing`, has one module, `drawing-starter`. It has 3 ideas (concepts), each with 3 steps and 6 practice
items (18 in all), and covers all 10 item types. Needs: any paper and a pen or pencil. Nothing has to be bought.

| Try-it day | Step | Idea | Teach card (as drafted) | Sources | Grade (cj4 scale) |
|---|---|---|---|---|---|
| 1 | `dws-s1` | Draw what you see | "What you know about a thing can take over from what you see. So a bottle turns into the bottle shape in your head. Draw the one in front of you." | cw16 | B |
| 2 | `dws-s2` | Draw what you see | "Glance at the object for every line or two. Short looks leave less to hold in memory, so less may get bent out of shape. More looks went with more accurate drawings." | cohen05 | A (lab) |
| 3 | `dws-s3` | Draw what you see | "We can misjudge our own drawing, not only the object. So hold the page next to the object, step back, and fix the one part that looks most off." | cw16, cb97 | B (the sources disagree, see §4) |
| 4 | `dss-s4` | Drawing shapes and slants | "Start with the outside shape, then place the parts inside it. Splitting what you see into simple shapes gives each part a place, so details do not drift." | cw16 | B/C (indirect) |
| 5 | `dss-s5` | Drawing shapes and slants | "In some studies, people who misjudged a slope by eye drew it wrong too, so check slopes. Hold a pen along the edge at arm's length and copy that slant." | cw16 | B for the angle link (mixed); D for the pen check |
| 6 | `dss-s6` | Drawing shapes and slants | "In two face tests, copying from an upside-down picture did not make drawings more accurate. Both gave only one short try, so test the trick yourself." | cw16, ost16 | B |
| 7 | `dpw-s7` | Drawing past the first week | "Draw day 1's bottle again and put both side by side. Skill in studies grew over months, so a week is a first look, not a finish line." | schlegel15, cw16 | C (no one-week source) |
| extra A | `dpw-s8` | Drawing past the first week | "In one drawing course, time was the most common reason people quit, so keep sessions short. The small version still counts as a session." | vj25 | B (one small study, adults 65-87) |
| extra B | `dpw-s9` | Drawing past the first week | "In studies of long-term goals, enjoying the task now predicted sticking with it, while later rewards did not. So pick things you like looking at." | wf17 | B (goals in general, not drawing) |

The quests are cj4's §7.1 quests word for word, with two changes. Day 6 says "a textbook diagram" instead of "a logo",
so there are no brands. Extra days A and B are new.

- Extra A: "draw any object for 5 minutes, then stop. Small version: 2 minutes."
- Extra B: "pick something you like looking at, such as a plant, your bike or a chai cup".

The draft has no `askLine`. That field is the "send a friend" line, and cj4 §5 says a Try-it never asks you to share.

Indian scenes in the items: hostel mess, college library, college classroom, exam break, exam week in the hostel and
a college art club. None of them says a study was run in India. Every study cited was run elsewhere (USA, Belgium review,
older adults online).

## 2. Validation

Run from the worktree (Linux):

```
cd /home/user/wt-cj6-drawing-starter
npm ci
python3 /tmp/claude-0/-home-user/f9e0373e-95de-5a49-b99b-2324dbe7064d/scratchpad/cj6-drawing/build.py content-drafts/topic.try-drawing.json
npx tsx /tmp/claude-0/-home-user/f9e0373e-95de-5a49-b99b-2324dbe7064d/scratchpad/cj6-drawing/check.mts content-drafts/topic.try-drawing.json
```

`build.py` writes the JSON. `check.mts` is a throwaway script that is not committed. Its core line is:

```ts
import { validatePack } from '/home/user/wt-cj6-drawing-starter/src/data/packs/validate.ts';
const errors = validatePack(pack, { allowUnchecked: true, editorial: true });
```

The script also runs, on the draft text, the same checks CI runs on `content/`: `findCopyIssues` (copy-lint),
`findBannedWords`, and the `topic-quality.test.ts` rules (3+ options on every choice question, and no wrong-feedback
opener used more than 3 times). It also scans for a list of health and gear words.

Final output:

```
validatePack(full, { allowUnchecked: true, editorial: true }) -> 0 error(s)
copy-lint hits: 0 []
banned-words hits: 0 []
health/gear words in visible copy: []
choice items with <3 options: []
wrong-feedback openers used >3 times: []
teach Flesch (min): 83.5
```

The errors on the way there, all fixed:
- 2 Flesch-below-60 failures: the `dws-4` stem and the `dss-s6` example.
- The R5 bias: the right answer was the longest option in 42% of questions. It is now 26%.
- The absolute-word bias: 9 absolute words in wrong options and 0 in right ones.

Without `allowUnchecked` (strict), there are 3 errors, all expected: `<idea>: missing fact-check verdict`, one per idea.

**Proof that 7 days cannot pass.** I ran the same pack twice more, with the extra steps cut:

```
validatePack(drop-s9, ...)     -> 2 error(s)
  draw-past-week-one: needs 6 to 8 items
  draw-past-week-one: needs at least 2 level-3 items
validatePack(drop-s8-s9, ...)  -> 1 error(s)
  body.modules.0.concepts.2.steps: Invalid length: Expected >=2 but received 1
```

The numbers behind it:
- `fresh.ts` R1 needs exactly 2 items per step.
- `validate.ts:103` needs 6-8 items per idea. So with editorial checks, every idea has exactly 3 steps.
- The schema allows 2-3 steps. 7 = 3 + 2 + 2 is the only split, and both 2-step ideas fail.
- With 2 ideas there are only 6 steps. That cannot work either: each idea must hold an estimate and 2 scenario or predict
  items, which leaves 6 free slots for 7 item types still needed.
- So the smallest passing shape is 3 ideas × 3 steps = 9 steps.

No id in the draft is used in any pack under `content/` (`grep` on the `dws-`, `dss-` and `dpw-` prefixes and the 3
concept ids).

## 3. Where content was bent to satisfy a rule that does not fit

| Rule | What I did to pass | Cost |
|---|---|---|
| 6-8 items per idea + exactly 2 per step (§2) | Added steps `dpw-s8` "Short sessions count" and `dpw-s9` "Draw what you enjoy", each with a quest | A 7-day starter becomes 9 days in today's engine. Both extras use sources cj4 already quoted, but they are not in cj4 §7.1. |
| `quest` lives on the idea, not on the step | Each `quest.detail` lists 3 days: full, small and the next-day self-check | The app cannot show "today's" quest on its own. The text is long (about 110-130 words per quest). |
| Every question needs exactly one right option | The self-checks ("Which of the 3 looks most like the bottle?") moved into the quest text as "Next day, ask yourself: …" | The one-tap self-check from cj4 §2 cannot be built from this pack. |
| Each idea needs an `estimate` item that names the idea | The 3 estimates ask for study numbers: 33% (r² = .33, Cohen 2005), 15 minutes (Ostrofsky 2016 time limit), 47% (Vodyanyk & Jaeggi drop-out) | They are true and sourced, but they are trivia. They teach nothing you use with a pencil. |
| All 10 item types per module | Added an `order` item (chair, outline first), a `match` (habit ↔ error) and a `fill-the-step` | These are fine, but they add screen time to a lesson meant to take about 2 minutes. |
| 2 Indian scenarios or predictions per idea, matched by keyword (`hostel`, `college`, `exam`, …) | Stems say "In the hostel mess", "At the college library", "Before her exam break" | The setting words are there to pass a regex. "a steel tumbler" or "chai" would be just as Indian, but the regex does not count them. |
| ≥ 2 level-3 items per idea | 6 items rated level 3, for example "Why does a newer review still say to check your drawing?" | Hard questions in a hobby starter work against "fun first" (Woolley & Fishbach 2017). |
| Right answer longest in ≤ 40% of questions; absolute words balanced | Lengthened 5 wrong options and removed "only", "every" and "all" from 7 wrong options | Harmless; wording only. |

Nothing true was made false to pass a rule. The extras and the estimates are padding, and they are labelled as padding
in the pack `changelog`.

## 4. Source check (all opened by me; quotes are from what I read)

| id | Source | What I read | Quote used | Effect on the draft |
|---|---|---|---|---|
| cw16 | Chamberlain & Wagemans 2016, *Neuroscience and Biobehavioral Reviews* 65 (accepted manuscript) | Full PDF, [research.gold.ac.uk/20010](https://research.gold.ac.uk/20010/) | "accurate perception of the subject and of the drawing is at the heart of drawing proficiency"; "negative categorical schemas, which distort the drawn image by replacing perceptual content with labels or canonical percepts, and positive pictorial schemas, which help the artist to segment the visual scene in systematic ways that aid depiction" | Days 1 and 4 |
| cw16 | same | same | "Perdreau and Cavanagh (2015) recently found that individuals who could identify changes in both their drawing and the to-be-drawn object subsequently produced better drawings. This suggests that misperception of one's drawing plays a greater role than Cohen and Bennett (1997) … initially concluded" | Day 3. Worded "may matter more than first thought". |
| cw16 | same | same | "Ostrofsky, Kozbelt and Jones (2015) found that there was a correlation between perceptual reproduction of angles embedded in triangles … and quadrilaterals … and errors made when drawing the same angles." Then: "Evidence for a connection between strength of visual illusions and drawing errors is inconclusive." | Day 5. cj4 called this "Cohen (2015)". The review's reference list has "Ostrofsky, J., Kozbelt, A., & Cohen, D. J. (2015). Observational drawing biases are predicted by biases in perception", and its main text says "Ostrofsky, Kozbelt and Jones". Day 5 now says "in some studies", and claim `dss-c2` says the wider link "is mixed". |
| cw16 | same | same | "two studies … found either no impact of inverting an image on drawing accuracy (Cohen & Earls, 2010), or a small positive effect when observers with artistic expertise were asked to judge the drawings (Kozbelt, Seidel, ElBassiouny, Mark, & Owen, 2010)" | Day 6. Claim `dss-c3` now adds "A third study found a small gain when art experts judged the drawings." |
| cw16 | same | same | "Schlegel et al. (2015) found no change in susceptibility to the Muller-Lyer illusion after three months of training in observational drawing and painting." | Day 7: the source for "about three months" |
| cohen05 | Cohen 2005, *Perception & Psychophysics* 67(6) | Abstract via NCBI E-utilities, PMID [16396008](https://pubmed.ncbi.nlm.nih.gov/16396008/) | "Experiment 1 revealed a positive relation between gaze frequency and drawing accuracy (r2 = .33). Experiments 2, 3, and 4 demonstrated that gaze frequency directly influences drawing accuracy. High gaze frequencies may facilitate drawing accuracy by (1) allowing the artist to hold less information in working memory, (2) reducing memory distortion…" | Day 2. The memory part is a proposed reason ("may"), so the teach card says "less **may** get bent". The `dws-4` estimate uses r² = .33. |
| cb97 | Cohen & Bennett 1997, *JEP: HPP* 23(3) | Abstract via E-utilities, PMID 9180037 ([Europe PMC](https://europepmc.org/article/MED/9180037)) | "(a) motor coordination is a very minimal source of drawing inaccuracies … (c) the artist's misperception of his or her work is not a source of drawing inaccuracies. These results suggest that the artist's misperception of the object is the major source of drawing errors." | Idea 1's hook and item `dws-2`. Point (c) disagrees with day 3, so item `dws-5` teaches the disagreement instead of hiding it. |
| ost16 | Ostrofsky, Kozbelt, Cohen, Conklin & Thomson 2016, *Empirical Studies of the Arts* | Full PDF, [stockton.edu](https://oudev.stockton.edu/social-behavioral-sciences/documents/ostrofsky2016inversion.pdf) | "This result fails to empirically validate the effectiveness of drawing models upside-down for the purposes of facilitating drawing accuracy." "One hundred and twenty-six undergraduate psychology students … no prior formal training in drawing." "Participants were given a 15-minute time limit to create each drawing." Limits: "a narrow focus on face stimuli" and "only a single 10- or 15-minute attempt" | Day 6 says faces only and one short try. The `dss-5` estimate uses 15 minutes. |
| schlegel15 | Schlegel et al. 2015, *NeuroImage* 105 | Abstract only, via E-utilities, PMID [25463452](https://pubmed.ncbi.nlm.nih.gov/25463452/) | "the art students improved in their ability to sketch human figures from observation" | Day 7. The abstract does not state the length; that comes from cw16. The paper is a brain-imaging study, and the draft uses none of its brain findings. |
| vj25 | Vodyanyk & Jaeggi 2025, *Research on Aging* | Full text XML, [Europe PMC PMC12102519](https://europepmc.org/article/PMC/PMC12102519) | "10 online lessons and daily practice in which participants acquired drawing techniques that improved their drawing skills by > 0.5 SD (d = 1.27)"; "Participants selected a 10- or 5-week schedule"; "the attrition of the treatment group was 47% (i.e., 15 dropouts). The most common reasons for dropout included time commitment ( n = 7)"; "One participant felt that 10–15 minutes of practice would have been more enjoyable" | Extra A, claims `dpw-c2` and `dpw-c4`, and the `dpw-3` estimate. Ages 65-87 are stated in the claim. The paper's title says "cognitive aging"; the draft makes no thinking-skill claim. |
| wf17 | Woolley & Fishbach 2017, *PSPB* 43(2) | Abstract via E-utilities, PMID [27899467](https://pubmed.ncbi.nlm.nih.gov/27899467/) | "immediate rewards (e.g., enjoyment) predicted current persistence at New Year's resolutions whereas delayed rewards did not" | Extra B. The copy says "studies of long-term goals", not "hobbies". |
| — | Kaimal, Ray & Muniz 2016 (cj4 §4) | Abstract, PMID 27695158 | The outcome is cortisol: "art making resulted in statistically significant lowering of cortisol levels" | **Not used.** It is a stress claim. |

The day-4 claim (`dss-c1`) is the review's account of "positive pictorial schemas". The review does not test
"outline first" as an exercise, so it stays indirect (B/C). The pen-at-arm's-length check on day 5 has no study behind
it. The draft gives it as a "try this" action and never as a finding.

## 5. Validator rules that do not fit a hobby (Try-it) track

The proposal is to let a topic say what it is. One way is `topic.format: 'try-it'` (or ids starting `topic.try-`). The
rules below would then change for those packs only.

| # | Rule today (file) | Problem for Try-it | Proposed change | Reason |
|---|---|---|---|---|
| 1 | 6-8 items per idea (`validate.ts:103`) **and** exactly 2 per step (`fresh.ts`, R1) | A 2-step idea can never pass, so `steps` min 2 is dead under editorial checks. A 7-day track cannot be built. | Items per idea = 2 × steps, so 4-6. This affects every pack, not only Try-it. | The schema allows 2 steps, and the two checks between them forbid it. cj4 §2.1 planned 3 + 2 + 2. |
| 2 | All 10 item types in each module (`validate.ts:79-82`) | Forces `order`, `match` and `estimate` into a lesson meant to last about 2 minutes | Try-it: at least 4 types per module, and `estimate` is not required | The quest is the point; the lesson is the doorway (cj4 §2). More question types mean more time on screen. |
| 3 | Each idea needs an `estimate` that names the idea (`validate.ts:108`, `:213`) | Hobby ideas have no natural quantity. The only numbers are study trivia (r², a time limit, a drop-out rate). | Try-it: no estimate required | An estimate should use the idea. These only recall a paper. |
| 4 | 2 Indian scenarios or predictions per idea, by keyword regex (`validate.ts:109`) | Pushes "hostel", "college" or "exam" into stems that are about a bottle on a desk | Try-it: 1 per idea, and widen the regex (for example `chai`, `tumbler`, `steel`, `kurta`, `rangoli`, `mess`) | Home objects are the setting of a drawing quest. The regex counts place words only. |
| 5 | `quest` exists only on the idea (`schemas.ts`, `topicConceptSchema.quest`) | There is one quest for 3 days, with no minutes, small version, needs, safety or self-check field | Add an optional `tryIt` on `topicStepSchema` as in cj4 §2.1: `{ title, minutes, small, needs, check: { stem, options }, safety?, sourceRefs }`. Check `minutes` against `RULES.tryIt` bounds. | The app needs today's quest and its 5-minute version as separate fields, not prose. |
| 6 | Every question needs exactly one right option (`validate.ts:219`, `oneRight`) | The next-day self-check has no right answer by design ("Which of the 3 looks most like the bottle?") | `tryIt.check.options` have no `correct` flag. Require 2-4 options plus "Not sure". | A self-check that marks you right or wrong becomes a score, which cj4 §2 rules out. |
| 7 | ≥ 2 level-3 items per idea (`validate.ts:113`) | Hard items in a starter work against "fun first" | Try-it: ≥ 1 level-3 item | Woolley & Fishbach 2017: "immediate rewards (e.g., enjoyment) predicted current persistence" |
| 8 | ≥ 3 claims per stepped idea, one claim per step (`validate.ts:177`, `:182`) | Fine for days 1-6. Day 7 ("same bottle, one week on") teaches no new claim; it is a redo. | Try-it: allow a `review: true` step that reuses an earlier claim, with no new practice items | Day 7 is the point of the track, but the rule forces a new claim onto it. |
| 9 | `askLine` allowed on any idea (`schemas.ts`, `askLineProblems`) | It is a "send this to a friend" line | Try-it: forbid `askLine` | cj4 §5: "Sharing is never asked for and never rewarded." |

Checks a hobby track needs that do not exist yet:

| # | Missing check | Proposal |
|---|---|---|
| A | No gear or purchase words | Reject `buy`, `order online`, `tripod`, `ring light`, `kit`, `course`, `subscribe`, `class fee`, and shop URLs in any Try-it text (cj4 §7.4) |
| B | No health-claim words | Reject `stress`, `anxiety`, `cortisol`, `brain`, `heal`, `therapy`, `mindful`, `relax` in Try-it copy (CLAUDE.md: no medical claims) |
| C | `quest.title` and `quest.detail` are not read-checked | Run `checkText` (Flesch, banned words, advice) on quest text, as for claims. Today only `advicePattern` runs on `detail` (`validate.ts:154`). |
| D | No minutes bounds | When `tryIt` exists, check `minutes` against `RULES.tryIt.minutesMin/minutesMax` (10-20) and require a small version |

Engine notes (not validator): `mind.lessonsPerCoursePerDay` 1 means each step takes its own day, so 9 steps run as
9 days. `practiceTail` would bring these items back on later days, which a hobby track may not want.

## 6. Sources that could not be opened, or were read second-hand

| Source | What happened | How it is used |
|---|---|---|
| Cohen & Earls 2010; Kozbelt et al. 2010; Perdreau & Cavanagh 2015; Ostrofsky, Kozbelt & (Jones or Cohen) 2015 | Not opened. I read them only through the Chamberlain & Wagemans review, which is how cj4 used them too. | Days 3, 5 and 6, always worded as "a review", "some studies" or "a later study" |
| Schlegel et al. 2015 full text | Not opened (Elsevier). Abstract only. | Day 7; the length comes from the review |
| PubMed web pages | Not loaded. I read the same records through NCBI E-utilities `efetch` (PMIDs 16396008, 25463452, 27899467, 9180037, 27695158). | — |

## 7. App bugs

None found in app code. One rule conflict, unfixed: `validatePack` (`src/data/packs/validate.ts:103`, 6-8 items per
idea) and `freshPracticeErrors` (`src/data/packs/fresh.ts`, exactly 2 items per step) together reject every 2-step idea
that the schema (`topicConceptSchema.steps`, min 2) allows. A smaller issue: the estimate fallback
`new RegExp(words(concept.title)[0])` (`validate.ts:213`) has no word boundary. So a title starting "Draw" also matches
"drawer" and "withdraw".
