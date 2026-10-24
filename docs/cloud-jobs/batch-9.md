# Cloud job batch 9: digest batch 7, Kapi's case types, Nandi's steady diya (idea engine, 25 Oct 2026)

How to run: one cloud session runs EVERY job below as its own subagent, all 4 at once, until all are done.
- Each job pushes its work on its OWN new branch, named below, cut from origin/main unless it says otherwise.
- Never push main or any existing branch. Never open a PR. Never change app code on main.
- Network access is open. Open real sources and quote them with URLs. If a page cannot be opened, say so.
  Use only legal open copies. Never use Sci-Hub or any paywall bypass.
- Plain English, short lines, tables, no praise.
- At the end, list each branch, its commit and a 3-line summary.

NANDI is an offline-first, online-ready learning and habits app for Indian adults aged 18-25 (React + Capacitor).
Read CLAUDE.md on origin/main first. Product rules: no loss states, no guilt, no random rewards, no endless feeds,
no countdowns, XP never goes down, no health or "brain" claims, no firearm content, 18+, personal data stays on
the phone in v1. Every idea needs a v1 that works offline and a v2 for when servers exist.

## Job 1 · Digest batch 7 (branch ideas/cj9-digest)
Batch 7 (docs/cloud-jobs/batch-7.md on origin/ideas/cloud-jobs) produced 8 branches: origin/ideas/cj7-tries-a,
cj7-tries-b, cj7-tries-c, cj7-detective-outline, cj7-scam-outline, cj7-sing-video, cj7-factcheck-drawing,
cj7-talk-fulltext. Read each branch's report under docs/reviews/ and check its claims against its own files.
Write docs/reviews/cj9-digest.md with, per branch, at most 8 lines:
- what it delivered (counts), whether the job's brief was met (MET / PARTLY / NOT MET, with the reason)
- the blind-check or validator result as printed in the report, and whether you could re-run it (re-run where cheap)
- open problems an editor or the builder must fix, ranked, each with file:line
- one verdict: READY FOR EDITORS / NEEDS A FIX FIRST / REDO
Then one table across all 8, and the 5 most important next actions. Keep the whole report under 200 lines.

## Job 2 · Kapi's case types: research and generators (branch ideas/cj9-kapi-cases)
Kapi (Mind) keeps its usual daily logic-grid case. A week adds one other case type per day. Research and prototype:
seating arrangement (linear and circular), blood relation / family tree, direction and route, lock code
(digits right / right place clues), knights and knaves (truth-tellers and liars), and timeline / order puzzles.
- For each type: how Indian exam prep (bank PO, SSC CGL, CAT LRDI) frames it, with 2 quoted public examples
  and URLs; what makes one hard vs easy; what is boring or tricky in a bad way.
- Read src/core/mysteries/ on origin/main (CaseGen, countSolutions, propagate, deduction.ts) and reuse its style.
- Write pure TypeScript generators in content-drafts/kapi-cases/<type>.ts (no app changes) for at least seating,
  family, route and lock, each with a solver that proves exactly one answer. Tests: 300 seeded cases per type,
  the time per case, a difficulty rating, and the share of cases solvable from a single clue (too easy).
- Family puzzles: avoid stereotyped roles; use neutral Indian names; no marriage or caste assumptions.
- Propose a hint ladder per type that never gives the answer in one tap.
Report docs/reviews/cj9-kapi-cases.md.

## Job 3 · Nandi's steady diya: feasibility (branch ideas/cj9-steady-diya)
Idea: during a plank or slow squats the phone rests on the back or chest; a diya flame on screen follows the
motion sensor. Smooth movement keeps it calm, jerky movement makes it flicker. It never goes out.
- DeviceMotion / DeviceOrientation in a Capacitor 8 Android WebView: permission, sample rate, background or
  screen-off behaviour, battery, iOS permission prompt. Compare the web API with @capacitor/motion. Quote docs.
- Propose a jerk metric (derivative of acceleration, smoothing window, thresholds) with sources from movement
  science on smoothness measures (for example spectral arc length, log dimensionless jerk). No health claims.
- Safety: phone falling, holding the breath, people who should not plank. Wording that stays a game, not advice.
- Write a tiny pure TypeScript prototype content-drafts/steady-diya/jerk.ts with tests on synthetic smooth vs
  jerky traces, plus a 1-page HTML demo that runs on a phone browser (content-drafts/steady-diya/demo.html).
- Search for apps or games that already do this (store pages, papers, patents): the 3 closest and what differs.
Report docs/reviews/cj9-steady-diya.md.

## Job 4 · Kolam by the clock: from prototype to spec input (branch ideas/cj9-kolam-clock, base origin/ideas/cj8-kolam)
Kachhua's night game: trace a one-line kolam slowly. The pattern changes with the time: before 21:00 a 5x5,
21:00-23:00 a 4x4, after 23:00 a 3x3; each date has its own seed; full moon draws a silver line; Margazhi
(16 Dec-14 Jan) adds one size up to 5x5. Using content-drafts/kolam/kolam.ts:
- Measure: how many distinct kolams each size gives across 366 date seeds (strict mode), and repeats.
- Add 2-3 more pattern families (for example a lotus or star frame, or a different dot lattice) that keep one
  closed line, with the checker passing on each. Quote the source for each family.
- Propose how this merges with the existing Breath kolam (find it on origin/main) so the app has ONE kolam, not two.
- After-bedtime rules: no XP, nothing new to collect, quiet end screen. Write the exact end-screen copy (2 lines).
Report docs/reviews/cj9-kolam-clock.md.
