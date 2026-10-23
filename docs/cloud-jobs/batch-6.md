# Cloud job batch 6: check the drafts, measure Learn (idea engine, 24 Oct 2026)

How to run: one cloud session runs EVERY job below as its own subagent, at least 3 at a time, until all 5 are done.
- Each job writes ONE report under docs/reviews/ and pushes it on its OWN new branch, named below.
- Never push main or any existing branch. Never open a PR. Never change app code or content JSON on main.
- Network access is open. Open real sources and quote them with URLs. If a page cannot be opened, say so.
- Write in plain English, with short lines and tables, and no praise.
- At the end, list each branch, its commit and a 3-line summary.

NANDI is an offline-first, online-ready learning and habits app for Indian adults aged 18-25 (React + Capacitor).
Read CLAUDE.md on origin/main first. Specs live on these branches:
- ideas/spec-21-useful-now
- ideas/spec-23-learn-duolingo-level
- ideas/spec-24-signature

## Job 1 · Fact-check the "Talk to anyone" draft (branch ideas/cj6-factcheck-talk)
File: content-drafts/topic.talk-to-anyone.json on ideas/spec-21-useful-now. It is an AI-made draft for editors:
4 concepts, 12 steps, 24 items. Its sources are the papers named in docs/reviews/cj4-pilot-outline.md (branch
ideas/cj4-pilot-outline).
For EVERY claim, teach card, Show me, guided try, feedback line, misconception and item, give one verdict:
- supported, quoted from the paper
- goes past the paper (say how)
- wrong
- wording risk (guilt, manipulation, stereotype, advice)
Flag every number, and every "studies found" that the paper does not say. Check that the Indian scenes do not claim
the studies tested Indian settings. Give exact rewrites for each problem.
Report docs/reviews/cj6-factcheck-talk.md.

## Job 2 · Check the 43 hook rewrites (branch ideas/cj6-hooks)
File: content-drafts/hook-rewrites-2026-10-24.md on ideas/spec-21-useful-now. It covers 43 proposed question hooks
for the concepts on branch content-walk.
For each hook, check:
- that it sets up a claim the concept really teaches (read origin/content-walk content/topics/*.json)
- that it passes the 10-rule honest-hook checklist in docs/reviews/cj4-packaging.md §4
- that it is 280 characters or fewer, with Flesch reading ease of 60 or more
- that the answer stays a fair guess either way
Give a verdict per hook (keep, fix, replace), with exact text for fix and replace.
Report docs/reviews/cj6-hooks.md.

## Job 3 · Scorecard, the NANDI half (branch ideas/cj6-scorecard)
Spec 23's scorecard (docs/specs/23-learn-to-duolingo-level.md on ideas/spec-23-learn-duolingo-level), measured on
origin/main.
Run a production build, then use Playwright at 360x800 with a fresh profile and a fixed clock. Play:
- 3 new-idea lessons (Psychology, Money, How things work)
- 2 practice drops on later days (fake the clock forward)
Measure, per session:
- answers given
- seconds to the first tap
- the share of time reading vs answering (time on teach and Show me screens vs question screens)
- question types seen
- first-try correct when playing with a fixed strategy (always pick the first option, and separately a "knows the
  card" strategy that picks the right option)
Also count, from the packs: lessons per topic, and the number of distinct item types per topic.
Fill in the spec 23 table, NANDI column only. Jenil does the Duolingo column by hand.
Report docs/reviews/cj6-scorecard.md, with screenshots in docs/reviews/cj6-scorecard/.

## Job 4 · Drawing starter in pack format (branch ideas/cj6-drawing-starter)
Turn the 7-day drawing starter in docs/reviews/cj4-try-it.md §7 (branch ideas/cj4-try-it) into a DRAFT topic pack.
Follow the schema in src/data/packs/schemas.ts on origin/main, and place it at
content-drafts/topic.try-drawing.json on the new branch. Each Try-it day is one step; put the off-phone quest in
the concept's `quest` field.
Run the repo validator on it with editorial checks. Install with npm ci, then call validatePack from
src/data/packs/validate.ts with { allowUnchecked: true, editorial: true }. Fix every error.
Use only the sources cj4-hobbies and cj4-try-it quoted. No "lowers stress" or "brain" claims.
List in the report any validator rule that does not fit a hobby track. For example, if Try-it should not need all
10 item types, propose the rule change with a reason.
Report docs/reviews/cj6-drawing-starter.md.

## Job 5 · Phone ki chhutti on Android: prove it works (branch ideas/cj6-chhutti-android)
Spec 24's first mechanic reads Android usage events for a past window (docs/reviews/cj5-focus.md §4-5, branch
ideas/cj5-focus). The app already reads usage for App pause: android/app/src/main/java/app/nandi/personal/NightPauseService.java on origin/main.
Answer from the official Android docs (quote them):
- How far back does UsageStatsManager.queryEvents keep events on Android 10-15? Is there an OEM difference
  (Xiaomi, Samsung, Nothing OS)?
- Which events mark an app moving to the foreground and the background (ACTIVITY_RESUMED/PAUSED vs
  MOVE_TO_FOREGROUND), and how is screen-off time counted?
- What happens across a reboot, or when the user revokes Usage Access?
- Does reading past events need anything beyond PACKAGE_USAGE_STATS? Any Play policy limit on using it for this
  purpose? Quote the Play policy.
Then write the exact algorithm, in pseudocode, for "minutes in chosen apps between from and to on day D", including
gaps and overlapping sessions. Add 8 test cases with expected minutes.
Report docs/reviews/cj6-chhutti-android.md.
