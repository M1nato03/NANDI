# Cloud job batch 8: check and prototype the six invented friend games (idea engine, 25 Oct 2026)

How to run: one cloud session runs EVERY job below as its own subagent, at least 3 at a time, until all 6 are done.
- Each job writes ONE report under docs/reviews/ (plus any files named below) and pushes it on its OWN new branch.
- Never push main or any existing branch. Never open a PR. Never change app code on main.
- Network access is open. Open real sources and quote them with URLs. If a page cannot be opened, say so.
  Use only legal open copies. Never use Sci-Hub or any paywall bypass.
- Plain English, short lines, tables, no praise. At the end, list each branch, its commit and a 3-line summary.

NANDI is an offline-first, online-ready learning and habits app for Indian adults aged 18-25 (React + Capacitor),
with six friend characters. Jenil asked for games that stand out, not multiple-choice questions with a skin.
The idea engine invented one game per friend (table below). Read
CLAUDE.md on origin/main and docs/specs/24-signature-mechanics.md on ideas/spec-24-signature first.

| Friend | Game | One line |
|---|---|---|
| Chiku (Learn) | Teach Chiku | The learner builds a small cause map; Chiku answers test questions by reasoning only from that map, so a wrong map makes a visible, traceable mistake. |
| Moti (Memory) | The haveli and the matka | Ideas live in rooms of a haveli (memory palace); review = rebuild the idea's takeaway from word pieces where the decoys are the pack's misconceptions. Weekly: Moti asks what you think you guessed before a lesson, then reveals the sealed guess (hindsight bias). |
| Kapi (Mind) | Kapi's prank + riddle workshop | Cases where exactly one clue is false (the only world with exactly one false clue is the answer); and making your own case from clue cards with a live "answers still possible" counter, shared by link. |
| Nandi (Train) | Bol sets | A set becomes a tabla-style bol (DHA full slow rep, TI quick half rep, NA hold at the bottom) scrolling on a beat; users can compose bols and share them. |
| Mor (Plan) | Mor's tarazu | Plan tomorrow on a balance scale weighted by each person's real time (a learned guess-to-actual ratio from the focus timer); the skill that grows is estimating well. |
| Kachhua (Night) | The slow kolam | Trace a single-line (sikku) kolam with one finger; the line grows only while the finger moves slowly. |

Product rules for every job: no loss states, no guilt, no random rewards, no endless feeds, no countdowns, XP never
goes down, no health or "brain" claims, no firearm content, 18+, personal data stays on the phone in v1.

## Job 1 · Originality and evidence for all six (branch ideas/cj8-check)
For each game:
- Search app stores (web search of store pages is fine), games, research prototypes and patents for the same
  mechanic. List the 3 closest, with quotes and URLs, and say exactly what differs.
- Check the evidence named for it, with quotes from the source: Biswas et al. 2005 and Chase et al. 2009
  (teachable agents, protégé effect); Slamecka and Graf 1978 (generation effect); Dresler et al. 2017 (method of
  loci); Fischhoff 1975 (hindsight bias); Buehler, Griffin and Ross 1994 (planning fallacy); Terry et al. 2020
  (music in exercise meta-analysis); Ascher 2002 and Siromoney (kolam mathematics). Correct any citation that is wrong.
- Run cj5-ethics' 15-line checklist (docs/reviews/cj5-ethics.md on ideas/cj5-ethics) on each game. YES or NO per line, with the fix for each NO.
- Score novelty, fun, kindness, evidence and build cost (1-5), and give a kill test for each.
Report docs/reviews/cj8-check.md.

## Job 2 · Teach Chiku: content prototype (branch ideas/cj8-teach-chiku)
Base: origin/ideas/learn-misconceptions. Pick the 10 Psychology concepts (content/topics/topic.psychology.json).
For each concept, write a draft "Chiku map":
- 3-6 nodes (short phrases), the correct links (from, to, relation: sets off, makes more likely, makes less likely,
  is an example of), and 1-2 tempting wrong links taken from the concept's `misconceptions`.
- 2 test questions per map that Chiku answers by following links, with the answer Chiku gives for the correct map
  AND for each tempting wrong map (so the mistake is visible and traceable).
- Every link must be supported by the concept's claims and sources; quote the claim id.
Propose a JSON schema for this (`concept.teach.map`), place the drafts at content-drafts/teach-chiku/psychology.json,
and write a tiny pure TypeScript reasoner (no app changes; put it in content-drafts/teach-chiku/reasoner.ts) with
tests showing each map's answers. Report docs/reviews/cj8-teach-chiku.md.

## Job 3 · Kapi's prank: generator feasibility (branch ideas/cj8-prank)
Read src/core/mysteries/ on origin/main (CaseGen, countSolutions, propagate, deduction.ts).
- Define a "one-lie case": exactly one world violates exactly one clue, and no world satisfies every clue.
- Write a prototype generator in content-drafts/prank/prank.ts (no app changes) that makes one-lie cases for 3x3 and
  4x4, with tests: 300 seeded cases each, the time per case, and how often the lie is a direct contradiction (too easy).
- Propose how a hint works ("suppose clue 3 is false: what follows?") and how difficulty is rated.
- Also the riddle workshop: which clue cards make good user-made cases, and how to stop a user case from being trivial.
Report docs/reviews/cj8-prank.md.

## Job 4 · Bol sets: safe tempo and the vocabulary (branch ideas/cj8-bol)
Read src/core/train on origin/main (the moves, levels and ladders).
- Propose the bol vocabulary (at most 6 syllables) and what each means per move type (push, squat, pull, core), with
  tempo limits per level. Quote exercise-science sources on tempo, holds and time under tension, and on safe ranges
  for beginners. No health promises.
- Write 12 sample bols (beginner to advanced) for 4 moves, and the rule that keeps any user-written bol inside the
  plan's reps and tempo limits.
- Check how music and rhythm games handle beat sync on Android web views (latency) and what the app should do when
  audio is off.
Report docs/reviews/cj8-bol.md.

## Job 5 · The slow kolam: real sikku patterns (branch ideas/cj8-kolam)
- Research how single-line (sikku / pulli) kolams are formed on dot grids, with quotes: Ascher, Siromoney and
  later work on kolam generation (for example array grammars, L-systems, the "kolam as Eulerian path" papers).
- Write a prototype in content-drafts/kolam/kolam.ts (no app changes) that generates valid single-line kolams on
  3x3, 4x4 and 5x5 dot grids and outputs SVG path data, with a checker that the line is one closed curve that goes
  around every dot. Put 5 sample SVGs in content-drafts/kolam/.
- Propose the tracing rule (how slow is slow, on 360 px phones) and an accessible "draw it for me" option.
- Cultural check: kolam is a living tradition (mainly Tamil Nadu); say how to present it respectfully, without
  religious claims.
Report docs/reviews/cj8-kolam.md.

## Job 6 · The matka and the tarazu: data and honesty (branch ideas/cj8-matka-tarazu)
Read src/data (Dexie tables, the ledger) and src/core/learn on origin/main.
- Matka: which first guesses are already stored (hook answers, estimate items)? What must be stored from now on?
  Write the exact reveal copy so it explains hindsight bias without shaming. Quote Fischhoff 1975 and one later
  replication.
- Tarazu: which task minutes and focus-timer actuals exist? Propose the guess-to-actual ratio (median of the last N
  timed tasks, bounds, cold start), the "Mor's eye" accuracy measure, and why it can never be gamed into a loss.
  Quote Buehler, Griffin and Ross 1994 and one paper on reference-class forecasting or unpacking.
Report docs/reviews/cj8-matka-tarazu.md.
