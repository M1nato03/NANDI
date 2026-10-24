# Cloud job batch 7: tries for every step, the next tracks, the open source checks (idea engine, 24 Oct 2026)

How to run: one cloud session runs EVERY job below as its own subagent, at least 3 at a time, until all 8 are done.
- Each job pushes its work on its OWN new branch, named below, cut from the base branch it names.
- Never push main or any existing branch. Never open a PR. Never change app code on main.
- Network access is open. Open real sources and quote them with URLs. If a page cannot be opened, say so.
  Use only legal open copies (publisher open access, author pages, PubMed Central, SSRN, arXiv, PsyArXiv).
  Never use Sci-Hub or any paywall bypass.
- Write in plain English, with short lines and tables, and no praise.
- At the end, list each branch, its commit and a 3-line summary.

NANDI is an offline-first, online-ready learning and habits app for Indian adults aged 18-25 (React + Capacitor).
Read CLAUDE.md on origin/main first. Everything here is a DRAFT for human editors. Nothing ships without their sign-off.
Product rules for all content: no guilt, no shame, no fear-selling, no outcome promises for health, body or money,
no firearm content, no stereotypes, sourced facts only, no copying text from sources (paraphrase and cite).

## Jobs 1-3 · Twist and transfer tries for every step (spec 23 §1)
Spec: docs/specs/23-learn-to-duolingo-level.md on ideas/spec-23-learn-duolingo-level, section "1. More doing per lesson".
Base branch: origin/ideas/learn-misconceptions (the newest content). Every one of the 162 steps has exactly 1 guided try.
Each job writes 2 more tries per step for its topics:

| Job | Branch | Topics (content/topics/) | Steps | New tries |
|---|---|---|---|---|
| 1 | ideas/cj7-tries-a | topic.psychology.json, topic.money-markets.json | 60 | 120 |
| 2 | ideas/cj7-tries-b | topic.how-things-work.json, topic.body-training.json | 54 | 108 |
| 3 | ideas/cj7-tries-c | topic.health-nutrition.json, topic.history-civilisations.json | 48 | 96 |

The three tries of a step, in order:
1. **Guided** (exists, keep it): the hint is shown.
2. **Twist**: a harder case of the same step. It must test a DIFFERENT claim of the same step, or the same claim in a
   NEW situation. Hint shown.
3. **Transfer**: the step's idea in a new Indian life situation, in a different life area from the hook, the Show me
   and the guided try. The hint is written but the app will hide it. It is the hardest of the three.

Rules (all of them are checked by the validator or the editors):
- **Same-situation rule (approved 24 Oct):** at most 3 tests of one claim with the same situation, counting the hook,
  the Show me, the tries and the step's practice items. A new name on the same situation is the same situation.
- Test only what the step's teach card and its claim say. No new facts. Numbers only from the step's claims.
- The card must be needed: a try that a person could answer right by common sense alone, without the card, is
  rewritten.
- 3 options, exactly one right. Feedback 8-30 words, and it explains why. Flesch reading ease 60 or more.
- The right answer may be the longest option in at most 40% of a topic's questions (all items and tries together).
- No authority words in teach-like text ("says", "according to", "recommends", "the guide").
- Indian situations: vary names, regions, genders, cities and villages, work and study. No stereotypes.
- Wrong options are tempting beliefs a learner really holds. Where a wrong option matches one of the concept's
  `misconceptions`, list its id in a sidecar file (lesson options have no misconception field yet).

Output, per topic:
- `content-drafts/tries/<topic-id>.json`: one row per step, `{stepId, claimIds, twist:{stem,hint,options}, transfer:{stem,hint,options}}`.
- `content-drafts/tries/<topic-id>.misconceptions.json`: `{stepId, which: "twist"|"transfer", optionId, misconceptionId}`.
- A merged copy of the pack with `guided` holding all 3 tries, at `content-drafts/tries/merged/<topic file name>`.

Validation:
- On your branch only, change `guided` in src/data/packs/schemas.ts from `v.maxLength(2)` to `v.maxLength(3)`.
  Spec 23 §1 makes this change; say in the report that the builder must make it properly.
- `npm ci`, then call validatePack from src/data/packs/validate.ts on each merged copy with
  `{ allowUnchecked: true, editorial: true }`. Fix every error.
- **Blind check.** A separate subagent that has NOT seen the teach cards answers every new try 3 times, given only the
  stem and the options in a shuffled order. Report the share it gets right. Rewrite every try it gets right 3 times out
  of 3 AND whose right option is a give-away (longest, most hedged, or the only one that sounds kind). Report which
  you rewrote.

Report `docs/reviews/cj7-tries-<a|b|c>.md`: counts, the validator output, the blind-check table, every try you
rewrote and why, and every step where you could not find a fair new situation (leave those for editors; do not force one).

## Job 4 · Track 2 outline: "Think like a detective" (branch ideas/cj7-detective-outline)
Spec 21 Part A, track 2 (docs/specs/21-useful-now.md on ideas/spec-21-useful-now). Format: copy the shape of
docs/reviews/cj4-pilot-outline.md (branch ideas/cj4-pilot-outline), which became the "Talk to anyone" draft.
- 8 ideas on inference: base rates, other explanations, what would change my mind, evidence that fits many stories,
  the question behind a claim, and similar. Start from the evidence in docs/reviews/cj4-evidence.md (branch
  ideas/cj4-evidence): Morewedge et al. 2015 and Sellier et al. 2019 on short debiasing training that transfers.
- For each idea: the claim, the paper with a quote and URL, the evidence grade (strong, moderate, mixed, weak), the
  setting the study ran in, 3 steps (hook, teach, Show me comparing a weak and a good example, guided try), and one
  Field try (a small real-world action, spec 21 Part B).
- Our own stories in Indian settings. Films and TV shows only as inspiration, never their plots, names or lines.
- No "you are irrational" framing. The hook names a situation, not a flaw in the reader.
Report docs/reviews/cj7-detective-outline.md.

## Job 5 · Track 3 outline: "Spot the scam, earn safely" (branch ideas/cj7-scam-outline)
Spec 21 Part A, track 3. Same format as Job 4.
- Scams young Indians meet: task scams (like and review jobs), pay-to-work, fake job offers, fake loan apps, UPI
  collect requests, "digital arrest" calls, OTP sharing, investment groups on WhatsApp and Telegram.
- Sources: MHA/I4C (cybercrime.gov.in, the 1930 helpline), RBI (including its "BE(A)WARE" booklet and Sachet),
  CERT-In, NPCI, SEBI investor alerts, and reputable Indian news only for dates and examples. Quote each with a URL.
- Each idea: the warning sign, what to do, and where to report. Check every helpline, portal and URL is current.
- No income promises. No "earn ₹X from home". Earning-safely ideas only say how to check an offer.
- No fear-selling: calm, practical, no shame for people who were scammed.
Report docs/reviews/cj7-scam-outline.md.

## Job 6 · Singing and videography starters in pack format (branch ideas/cj7-sing-video)
Do for singing and videography what cj6-drawing-starter did for drawing. Read docs/reviews/cj6-drawing-starter.md and
content-drafts/topic.try-drawing.json on branch ideas/cj6-drawing-starter first, and copy their approach.
- Source: the 7-day starters in docs/reviews/cj4-try-it.md §7 (branch ideas/cj4-try-it) and the sources cj4-hobbies
  and cj4-try-it quoted. Use only those.
- Files: content-drafts/topic.try-singing.json and content-drafts/topic.try-video.json. Each Try-it day is one step;
  the off-phone quest goes in the concept's `quest` field.
- NANDI never opens the camera or microphone. Quests use the phone's own camera or recorder app, or none.
- Honest hook from spec 21: "Think you can't sing? Most people sing in tune at a slow tempo." Check that claim against
  its source and correct it if the source says something narrower.
- No "brain-boosting" or "lowers stress" claims.
- Validate with `{ allowUnchecked: true, editorial: true }` and fix every error. Where a rule does not fit a hobby
  track, do what cj6-drawing-starter did and list it in the report, adding to its §5 list rather than repeating it.
Report docs/reviews/cj7-sing-video.md.

## Job 7 · Fact-check the drawing starter (branch ideas/cj7-factcheck-drawing)
File: content-drafts/topic.try-drawing.json on ideas/cj6-drawing-starter. Do exactly what cj6-factcheck-talk did for
the Talk draft (docs/reviews/cj6-factcheck-talk.md on ideas/cj6-factcheck-talk). For EVERY claim, teach card, Show me,
try, feedback line, misconception, quest and item, give one verdict:
- supported, quoted from the source
- goes past the source (say how)
- wrong
- wording risk (guilt, pressure, stereotype, health or talent promise)
Flag every number. Check the quests are safe, free (₹0), and doable in a hostel room. Give exact rewrites.
Report docs/reviews/cj7-factcheck-drawing.md.

## Job 8 · Full-text check of the Talk sources read as abstracts (branch ideas/cj7-talk-fulltext)
File: content-drafts/topic.talk-to-anyone.json on ideas/spec-21-useful-now, and the editor note
content-drafts/talk-to-anyone-factcheck-applied.md next to it.
These sources were read as abstracts only: Brooks, Gino and Schweitzer 2015 (advice seeking); Liu et al. 2023
(reaching out); Fischer et al. 2011 (bystander effect review); Kardas, Kumar and Epley 2022 (deep conversations);
Weger, Castle and Emmett 2010 (paraphrasing).
- Find a legal full text of each. If none, say so and stop for that paper.
- For each pack line that cites the paper, quote the passage (with page or section) that supports it, or say it does
  not.
- **The reach-out estimate.** The validator needs one estimate item for the reach-out concept, and there is no honest
  number yet. Find a number in the full texts that a learner can guess (for example a rating gap, a share of people,
  a count of studies or participants). Write the claim (with its quote) and the estimate item in the pack's schema,
  with the answer and a fair range. If no fair number exists, say so; the fallback is a validator rule change.
Report docs/reviews/cj7-talk-fulltext.md, with a patch file content-drafts/talk-fulltext.patch.json listing exact
text changes `{id, field, old, new, quote, url}`.
