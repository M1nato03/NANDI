# cj8 · Teach Chiku: content prototype (Psychology)

Cloud job batch 8, job 2. Branch `ideas/cj8-teach-chiku`, based on `origin/ideas/learn-misconceptions` (65ed5ef).
Draft only. No app code changed.

## What is here
| File | What |
|---|---|
| `content-drafts/teach-chiku/psychology.json` | 10 Chiku maps, one per Psychology concept |
| `content-drafts/teach-chiku/concept.teach.map.schema.json` | Proposed JSON Schema (`concept.teach.map`) |
| `content-drafts/teach-chiku/reasoner.ts` | Pure TS reasoner, no imports, no app code |
| `content-drafts/teach-chiku/reasoner.test.ts` | 122 Vitest tests |

Source of every claim: `content/topics/topic.psychology.json` on the base branch.
I did not re-open the papers. Each link quotes a claim whose `factCheck` verdict is `supported`;
the test checks that the claim id exists, the quote is word-for-word in the claim, and the verdict is `supported`.

## Test result
`npx vitest run --root content-drafts/teach-chiku` → **1 file, 122 tests, all passed** (about 0.3 s).
- `tsc --strict` on both files: 0 errors. ESLint on the folder: clean. `npm run banned-words`: clean.
- The pack also validates against the JSON Schema (Python `jsonschema`, draft 2020-12).
  The schema caught one node label over 60 characters; it was shortened.
- The repo's `vitest.config.ts` only includes `src/` and `scripts/`, so `npm run test` does not run these tests.
  That is on purpose for a draft. Use the `--root` command above.

## How Chiku reasons
| Rule | Detail |
|---|---|
| Links | `sets-off` (+), `more-likely` (+), `less-likely` (−), `example-of` (A inherits what B does, so +) |
| Effect question | "If A goes up (or is removed), what happens to B?" Chiku walks every simple path A → B and multiplies signs. |
| Verdicts | `more`, `less`, `no-change` (no path), `unsure` (paths disagree). Loops are skipped. |
| Causes question | "What in your map leads to B?" Every node whose effect on B is `more`. |
| Trace | Each answer lists the link ids it used, so the app can light up the exact links. |
| Wrong map | The correct map plus `add` links and minus `remove` link ids. Kinds: `extra-link`, `missing-link`, `swapped-link`. |

Same map plus same question gives the same answer and trace. No randomness, no network.

What Chiku says is built from the trace, e.g.
"Less likely. Because "Guessing time for someone else's task" makes more likely "Linking past tasks to the plan",
then "Linking past tasks to the plan" makes less likely "A too-short time guess"."

## Schema proposal (`concept.teach.map`)
Pack: `{ schema: "concept.teach.map", version, topicId, maps[] }`. One map:

| Field | Shape | Rule |
|---|---|---|
| `conceptId` | id | Must match a concept in the topic pack |
| `nodes[]` | `{ id, label }` | 3-6 nodes, label ≤ 60 chars |
| `links[]` | `{ id, from, to, relation, support[] }` | The correct map. `support` = `{ claimId, quote }`, non-empty |
| `wrongMaps[]` | `{ misconceptionId, kind, add[], remove[], refutedBy[] }` | 1-2. `misconceptionId` must exist in the concept. `refutedBy` non-empty |
| `questions[]` | `{ id, ask, query, support[], expect }` | Exactly 2. `expect` has `correct` plus one key per wrong map |
| `query` | `{kind:"effect", from, change:"up"\|"down", to}` or `{kind:"causes", to}` | |
| answer | `{kind:"effect", verdict, paths[][]}` or `{kind:"causes", nodes[]}` | Checked by the reasoner in CI |

Cross-field checks the JSON Schema cannot express live in `checkPack()` and the test:
link ends are real nodes, `remove` ids are real links, every question has an answer for every variant,
claim ids are real and quotes are exact, each wrong map changes at least one answer, and the changed answer
uses or loses one of the wrong map's links. In the app this would be a Valibot schema plus these checks.

## The 10 maps
Claim quotes below are exact text from the claim. Link ids in brackets.

### habits
| Link | Claim |
|---|---|
| [l1] Stable cue **sets off** the learned act | habits-c1 "Cues in a stable setting, like a place or an act just before, can bring back a learned action with little thought."; habits-c5 "kept old habits mainly when parts of the old setting stayed the same" |
| [l2] Early repeats in the same setting **make more likely** the act feels automatic | habits-c4 "Early repeats in the same setting add the most to how automatic an act feels" |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| habits-m2 One miss resets all (extra) | Missing one day **makes less likely** automatic | habits-c2 "one missed chance did not undo habit growth" |
| habits-m3 Goal replaces cue (swapped) | Goal **sets off** act, cue link removed | habits-c5, habits-c1 |

| Question | Correct | m2 | m3 |
|---|---|---|---|
| q1 Arun misses one day. Less automatic? | no change | **less** [w1] | no change |
| q2 Kunal's train cue is gone, goal stays. Act? | less [l1] | less [l1] | **no change** (no path) |

### loss-aversion
| Link | Claim |
|---|---|
| [l1] Higher start point **makes more likely** the same result is seen as a loss | loss-aversion-c1 "Gains and losses are judged from a reference point, which is often where you start or what you expected." |
| [l2] Seen as a loss **sets off** extra felt weight | loss-aversion-c2 "A loss tends to weigh more than a gain of the same size" |
| [l3] Extra felt weight **makes more likely** turning down a fair 50-50 bet | loss-aversion-c2 "most people turn down a fair 50-50 chance to win or lose the same amount" |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| loss-aversion-m3 Wording never matters (missing) | l1 removed | loss-aversion-c1 |
| loss-aversion-m4 One differing study disproves the average (extra) | One study with a smaller gap **makes less likely** the pooled average holds | loss-aversion-c3 "The figures varied from study to study."; "a loss weighed about twice a gain of the same size, on average" |

| Question | Correct | m3 | m4 |
|---|---|---|---|
| q1 Amit frames a coin flip from a higher start point. Turn it down? | more [l1 l2 l3] | **no change** | more |
| q2 A new study finds a smaller gap. Average stops holding? | no change | no change | **less** [w1] |

### anchoring
| Link | Claim |
|---|---|
| [l1] First number **sets off** pull toward it | anchoring-c1 "A first number can pull a later estimate toward it" |
| [l2] Pull **makes more likely** a guess near the anchor | anchoring-c1 "because people adjust away from it too little" |
| [l3] A number known to be random **is an example of** a first number | anchoring-c2 "a random first number of 10 led to a median guess of 25"; anchoring-c3 (dice) |
| [l4] Listing reasons it is wrong **makes less likely** the pull | anchoring-c4 "listing reasons why an anchor was wrong made its pull smaller" |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| anchoring-m2 Random has no pull (missing) | l3 removed | anchoring-c2, anchoring-c3 |
| anchoring-m3 Experts are immune (extra) | Expertise **makes less likely** the pull | anchoring-c3 "Experienced judges leaned toward a sentence demand even when they set it themselves by rolling dice." |

| Question | Correct | m2 | m3 |
|---|---|---|---|
| q1 A random 65. Guess moves toward it? | more [l3 l1 l2] | **no change** | more |
| q2 A 20-year judge. Expertise keeps her away? | no change | no change | **less** [w1 l2] |

### confirmation-bias
| Link | Claim |
|---|---|
| [l1] Holding a belief **makes more likely** noticing cases that fit | confirmation-bias-c1 "People tend to focus on information that fits what they already believe" |
| [l2] Holding a belief **makes less likely** noticing cases that do not fit | confirmation-bias-c1 "and pass over what does not" |
| [l3] Checking cases that could prove it false **makes more likely** a proper test | confirmation-bias-c2 "is tested properly by checking the cases that could prove it false" |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| confirmation-bias-m3 Many fits prove a rule (extra) | Fitting cases **make more likely** the rule is shown true | confirmation-bias-c3 "cases that fit a guess can fit other rules too" |
| confirmation-bias-m2 Disproof is useless (missing) | l3 removed | confirmation-bias-c2 |

| Question | Correct | m3 | m2 |
|---|---|---|---|
| q1 Ten more fitting cases. Rule shown true? | no change | **more** [w1] | no change |
| q2 Meera checks cases that could prove it false. Better test? | more [l3] | more | **no change** |

### social-proof
| Link | Claim |
|---|---|
| [l1] A group giving one answer **makes more likely** going along | social-proof-c1 "people went along with a wrong group in 36.8% of answers" |
| [l2] Being unsure **makes more likely** going along | social-proof-c3 "When people are unsure, they may follow a group" |
| [l3] Wish to fit in **makes more likely** going along | social-proof-c6 "people who went along mostly did it to fit in and avoid ridicule" |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| social-proof-m1 Crowd proves truth (extra) | Group answer **makes more likely** it is right | social-proof-c4 "A group can agree on a wrong answer, so agreement alone is a clue, not proof." |
| social-proof-m2 No one is swayed (missing) | l1 removed | social-proof-c1 |

| Question | Correct | m1 | m2 |
|---|---|---|---|
| q1 Six classmates say B. B more likely right? | no change | **more** [w1] | no change |
| q2 Asch's group answers wrong. Pull? | more [l1] | more | **no change** |

### planning-fallacy
| Link | Claim |
|---|---|
| [l1] Guessing for your own task **makes more likely** picturing how it will go | planning-fallacy-c4 "When people plan, they think about how the task will go" |
| [l2] Picturing how it will go **makes more likely** a too-short guess | planning-fallacy-c4 "pay little heed to how past tasks went"; planning-fallacy-c1 "People's guesses of how long their own tasks would take were too short" |
| [l3] Linking past tasks **makes less likely** a too-short guess | planning-fallacy-c3 "asking people to link past tasks to a new plan removed the too-short bias" |
| [l4] Guessing for someone else **makes more likely** linking past tasks | planning-fallacy-c5 "used past cases more" |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| planning-fallacy-m2 Past tasks do not help (missing) | l3 removed | planning-fallacy-c3 |
| planning-fallacy-m5 Others' tasks take less time (swapped) | Someone else's task **makes more likely** a too-short guess; l4 removed | planning-fallacy-c5 "People guessing how long someone else's task would take guessed long, not short" |

| Question | Correct | m2 | m5 |
|---|---|---|---|
| q1 Dev looks at his last three essays. Guess too short? | less [l3] | **no change** | less |
| q2 Dev guesses for his friend's essay. Too short? | less [l4 l3] | **no change** | **more** [w1] |

### sleep-memory
| Link | Claim |
|---|---|
| [l1] Studying **sets off** a memory of the lesson | sleep-memory-c3 "After you learn, a new memory is firmed up over time." |
| [l2] Sleep after studying **makes less likely** forgetting | sleep-memory-c1 "Sleep after learning reduced forgetting, compared with the same length of time awake." |
| [l3] Staying awake instead **makes more likely** forgetting | sleep-memory-c1; sleep-memory-c5 "people who slept after learning recalled more than people who stayed awake for the same time" |
| [l4] Quiet rest right after **makes less likely** forgetting | sleep-memory-c2 "A brief spell of quiet rest while awake after learning helped memory more than spending that time on other tasks." |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| sleep-memory-m2 Sleep teaches unseen material (extra) | Sleep **sets off** a memory of the lesson | sleep-memory-c3, sleep-memory-c1 (both say "after learning") |
| sleep-memory-m3 Staying up beats sleeping (swapped) | Staying awake **makes less likely** forgetting; l3 removed | sleep-memory-c1, sleep-memory-c5 |

| Question | Correct | m2 | m3 |
|---|---|---|---|
| q1 Asha never opened chapter 5 but sleeps. Memory of it? | no change | **more** [w1] | no change |
| q2 Asha stays up instead of sleeping. Forget more? | more [l3] | more | **less** [w2] |

### variable-rewards
| Link | Claim |
|---|---|
| [l1] Reward after an unknown number of tries **makes more likely** checking again | variable-rewards-c1 "people keep responding at a high, steady rate because they never know when the next reward is coming" |
| [l2] Same **makes more likely** a slow fade when rewards stop | variable-rewards-c1 "the habit is slow to fade" |
| [l3] Reward after every try **makes more likely** learning a new act fast | variable-rewards-c4 "A reward after every try is the quickest way to teach a new behaviour." |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| variable-rewards-m5 Surprise rewards teach fastest (swapped) | Unknown gap **makes more likely** learning fast; l3 removed | variable-rewards-c4 |
| variable-rewards-m4 A skipped reward is variable (extra) | Every fifth try **is an example of** an unknown gap | variable-rewards-c3 "the number of tries needed for a reward keeps changing" |

| Question | Correct | m5 | m4 |
|---|---|---|---|
| q1 (causes) What teaches a new act fastest? | every try | **unknown gap** | every try |
| q2 Reward every fifth try. High steady checking? | no change | no change | **more** [w2 l1] |

### if-then-plans
| Link | Claim |
|---|---|
| [l1] If-then plan **makes more likely** spotting the named moment | if-then-plans-c3 "make the named moment easier to spot" |
| [l2] Plan **makes more likely** responding with little thought | if-then-plans-c3 "the response to it more automatic" |
| [l3] Plan **makes more likely** reaching the goal | if-then-plans-c2 "if-then plans had a medium-to-large effect on reaching goals, on average" |
| [l4] Spotting the named moment **makes less likely** noticing other cues | if-then-plans-c4 "When a plan worked by sharpening the cue, other cues were more often passed over." |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| if-then-plans-m1 A wish is a plan (extra) | A broad goal **is an example of** an if-then plan | if-then-plans-c1 "An if-then plan spells out the when, where and how in advance" |
| if-then-plans-m3 A sharp cue has no cost (missing) | l4 removed | if-then-plans-c4 |

| Question | Correct | m1 | m3 |
|---|---|---|---|
| q1 Plan is "study more". Moment easier to spot? | no change | **more** [w1 l1] | no change |
| q2 "If I sit on the 8:10 bus, I open my notes." Notice other cues? | less [l1 l4] | less | **no change** |

### spotlight-effect
| Link | Claim |
|---|---|
| [l1] A public slip **sets off** your own vivid view | spotlight-effect-c4 "People seem to start from their own rich view of a moment"; spotlight-effect-c2 |
| [l2] A good remark **sets off** your own vivid view | spotlight-effect-c2 "speakers thought their good and bad remarks stood out more to others than they did"; spotlight-effect-c4 |
| [l3] Vivid view **makes more likely** guessing more people noticed | spotlight-effect-c4 "adjust too little for how others see it"; spotlight-effect-c1 "guessed that more people could recall it than really could" |
| [l4] A slip **sets off** dwelling on the mishap | spotlight-effect-c5 "The fear of harsh judgment came partly from people dwelling on their own mishap" |
| [l5] Dwelling **makes more likely** expecting harsher judgment than you get | spotlight-effect-c5; spotlight-effect-c3 "After a public slip, people expected others to judge them more harshly than others really did." |

| Wrong map | Wrong link | Refuted by |
|---|---|---|
| spotlight-effect-m4 Only embarrassing moments (missing) | l2 removed | spotlight-effect-c2 |

| Question | Correct | m4 |
|---|---|---|
| q1 Neha makes a sharp point. Guesses more noticed? | more [l2 l3] | **no change** |
| q2 Neha trips on stage. Expects harsher judgment? | more [l4 l5] | more |

## Coverage
| Count | Value |
|---|---|
| Maps | 10 of 10 concepts |
| Nodes per map | 5-6 |
| Correct links | 35 |
| Wrong maps | 19 (8 extra-link, 7 missing-link, 4 swapped-link) |
| Questions | 20; 58 answers checked (correct + each wrong map) |
| Wrong maps that change at least one answer | 19 of 19 (tested) |

## Weak spots (for an editor)
| Where | Issue | Suggested fix |
|---|---|---|
| Signs only | The reasoner has no sizes. "A loss weighs about twice a gain" cannot be a link, so loss-aversion-m1 (Equal feel), m2 (Always true), anchoring-m4 (One trick erases it) and if-then-plans-m2 (A plan guarantees action) were left out. | v2: add an optional `strength: "small" \| "large" \| "removes"` to links. Not needed for v1. |
| planning-fallacy l2 | "Picturing → too short" joins two claims (c4 and c1). The paper's own reasoning supports it, but no single claim says it. | Add a claim to the topic pack, or keep both quotes and mark it as a joined link. |
| sleep-memory-m2 | No claim says "sleep does not create a memory". The refutation rests on c1 and c3 saying "after learning". The misconception's own correction says it plainly. | Add a claim, or allow `refutedBy` to cite the misconception's `correction`. |
| loss-aversion q2 | "Does one study make the pooled average stop holding?" Strictly, one more study shifts a pooled average a little. "No change" means "it still holds", which is what c3 supports. | Reword the node in a real editor pass. |
| Missing-link wrong maps | 7 of 19 are "you left a link out", not "you drew a wrong link". They make a visible mistake ("no change"), but feel less dramatic. | In the game, show a ghost of the missing link when Chiku says "No change". |
| Spotlight | Only one wrong map. m3 (Others judge us harshly) needs a node for the real judgment, which would make 7 nodes. | Accept one, or allow 7 nodes. |
| No source re-check | I relied on the topic pack's fact-check, not on reopening the papers. | The test pins every quote to a `supported` claim, so a later claim edit breaks the build. |

## Product rule check
| Rule | Status |
|---|---|
| No loss state | A wrong map gives a wrong Chiku answer and a lit-up trace; nothing is taken away. |
| No randomness | Deterministic walk. Same map, same answer. |
| No health or brain claims | sleep-memory copy talks about forgetting a lesson, not health. Claims are the pack's own. |
| Offline | Pure TS, no imports, no network. |
| 18+ adults, Indian names | Names in questions: Arun, Kunal, Amit, Meera, Dev, Asha, Rohan, Neha. |

## Next steps (each needs Jenil's yes)
1. Editor pass on the weak spots above.
2. Port the schema to Valibot in `src/data/` and the reasoner to `src/core/learn/`, test-first.
3. Decide the UI: the learner drags links from the node palette; Chiku answers the 2 questions; wrong links glow on the trace.
