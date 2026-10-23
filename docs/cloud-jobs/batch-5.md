# Cloud job batch 5: a signature mechanic for every mode (idea engine, 24 Oct 2026)

Jenil's idea (24 Oct): Learn takes inspiration from Duolingo (spec 23). Every other mode should get its own
signature mechanic too, so that each part of NANDI feels unique:
- Mind and puzzles could take ideas from Matiks.
- Train, Plan, and calm or meditation could take ideas from the best app in each area.
- Or NANDI could invent a new mechanic that only NANDI has.

How to run: one cloud session runs EVERY job below as its own subagent, at least 3 at a time, until all 6 are done.
- Each job writes ONE report under docs/reviews/ and pushes it on its OWN new branch, named below.
- Never push main or any existing branch. Never open a PR. Never change app code or content JSON.
- Network access is open. Open real sources and quote them with URLs. If a page cannot be opened, say so.
- App store pages, company blogs and reviews show WHAT a mechanic is. Evidence for WHY it works comes from
  peer-reviewed papers, meta-analyses, or named researchers. Never copy names, art, sounds, characters or text.
- Write in plain English, with short lines and tables, and no praise.
- At the end, list each branch, its commit and a 3-line summary.

NANDI is an offline learning and habits app for Indian adults aged 18-25 (React + Capacitor). Read on origin/main:
- CLAUDE.md, DECISIONS.md, docs/specs/11-beat-duolingo.md and docs/specs/12-courtyard.md
- src/core/economy (XP, Shards, the season ladder), src/core/puzzles, src/core/mysteries and src/core/courtyard

Its modes are Plan (tasks, focus timer), Train (workouts), Learn (2-minute lessons), Mind (daily puzzle boards and
mystery cases), Night (wind-down, lights-out, App pause) and the courtyard (friends whose corners grow with practice days).

Hard rules:
- no dark patterns, no guilt, no loss states, no random or variable rewards, no endless feeds, no punishing timers
- no health promises, no firearm content
- nothing leaves the phone (no accounts until 2027)
- XP, level and Shards never go down

Every job must test each mechanic against these rules. Rewrite it so it passes, or reject it.

For every mechanic, every job fills in this table:

| App | Mechanic | What the user does and sees | Why it works (evidence, quoted) | Dark-pattern risk | Works offline? | NANDI version that passes the rules | Kill test |

Each job ends with 3 ranked proposals for its mode, and at least one must be an ORIGINAL mechanic. Before calling
it original, search the web and app stores for it, and say what came closest.

## Job 1 · Mind and puzzles (branch ideas/cj5-mind)
Study these:
- Matiks (live 1v1 maths duels, speed, memory and puzzle games, daily challenges, weekly contests, ratings)
- Lichess Puzzle Storm and Puzzle Racer, and Chess.com Puzzle Rush and puzzle ratings
- NYT Games (one shared daily puzzle, the spoiler-free share grid, Connections, Spelling Bee ranks)
- Brilliant (interactive problem solving)
- Sudoku.com
- Elevate or Lumosity
Evidence to cover:
- skill ratings (Elo or Glicko) and the desirable difficulty they target
- speed vs accuracy
- the brain-training transfer debate (e.g. Simons et al. 2016), so no "makes you smarter" copy
Questions:
- How can Matiks-style duels work offline? Options: a duel against your own past best (a "ghost"), or a friend's run
  shared through the existing day-bound share link (spec 19) and raced asynchronously. No timer that punishes.
- Is a rated speed round (Storm-like) a kind version of an endless feed, or one in disguise? Where is the hard stop?
- Which mechanic makes NANDI's mystery cases (Mentalist or Drishyam-style deduction) unique?
Report docs/reviews/cj5-mind.md.

## Job 2 · Train (branch ideas/cj5-train)
Study these:
- Strava (segments, personal records, local legends, kudos)
- Apple Fitness rings ("close your rings")
- Nike Training Club
- Fitbod (the muscle recovery map)
- Zombies, Run! (story-driven workouts)
- Pokémon GO (walking as play)
- Indian apps such as Cult.fit or HealthifyMe, if their pages open
Evidence to cover:
- the goal-gradient effect, self-monitoring meta-analyses, exercise adherence in young adults
- the harms of streaks and badges in fitness, e.g. over-training or injury when rest is punished
Questions:
- What makes a home or hostel workout with no gym feel like a game without pushing someone past safe limits?
- Can NANDI's existing PRs, readiness and rest-day bank become one signature mechanic?
Report docs/reviews/cj5-train.md.

## Job 3 · Calm, meditation and sleep (branch ideas/cj5-calm)
NANDI has Night mode (wind-down, lights-out, App pause), but no calm or meditation practice.
Study these:
- Headspace, Calm, Medito (free), Insight Timer, Balance (adaptive plans), Finch (the self-care pet)
- Breathwrk, Sleep Cycle
- Indian apps such as Level SuperMind, if their pages open
Evidence to cover:
- brief mindfulness and breathing for 18-25s, using meta-analyses (e.g. Balban et al. 2023 on cyclic sighing vs mindfulness)
- what the evidence does NOT support
- retention problems in meditation apps (published engagement studies)
- risks (meditation adverse effects, anxiety; no therapy claims)
Propose a calm practice that fits NANDI's soft days and night routine, works offline, and needs no audio downloads.
Text and haptic guidance are acceptable, and so is synthesized sound. Cover how it shows in the courtyard. Kachhua
the tortoise already looks after sleep.
Report docs/reviews/cj5-calm.md.

## Job 4 · Plan and focus: off-phone time as the game (branch ideas/cj5-focus)
Study these:
- Forest (a tree grows while the phone is left alone)
- Focus Friend (a character knits while you stay off the phone)
- Structured and Tiimo (visual day plans)
- Todoist Karma
- Habitica
- the Pomodoro apps
Evidence to cover:
- implementation intentions
- time-blocking studies
- whether commitment devices work
- the effect of phone presence on attention (including the failed "brain drain" replications)
Question: NANDI's mission is less scrolling. What signature mechanic makes time AWAY from the phone the thing that
grows, while staying within an offline Capacitor app's limits?
- Check what Android allows: a foreground service, Usage Access (already used by App pause), and screen-off detection.
- Never use Accessibility.
Report docs/reviews/cj5-focus.md.

## Job 5 · Invent: mechanics only NANDI has (branch ideas/cj5-invent)
Generate 15 original mechanic concepts that use what makes NANDI different:
- one ledger across all modes
- the courtyard and its six friends, with Indian roots
- offline and private
- real-world practice: the Field try and Try-it from batch 4
- seasons
Examples to push past:
- a weekly "mela" where the week's real practice decides what appears in the courtyard
- a story where your actual days write the next chapter
- friends that teach each other what you learned
For each concept, give:
- a one-paragraph pitch
- which modes it ties together
- what makes it hard to copy
- the closest existing app (search for it)
- dark-pattern risk
- build size (S/M/L)
- how it would be tested with Jenil and 5 friends in 2 weeks
Score each concept on novelty, fit, kindness, fun and evidence. Pick the top 3.
Report docs/reviews/cj5-invent.md.

## Job 6 · The line between fun and manipulation (branch ideas/cj5-ethics)
Build the checklist that every mechanic in jobs 1-5 must pass. Sources:
- India's Guidelines for Prevention and Regulation of Dark Patterns, 2023 (CCPA)
- the EU DSA dark-pattern articles
- research on streak anxiety, loss aversion in apps, and variable-ratio rewards (Skinner; loot-box studies)
- self-determination theory: autonomy, competence and relatedness (Ryan and Deci; Rigby on games)
- "humane technology" design guides
Output:
- a 12-15 line yes/no checklist with the source for each line
- the checklist applied to NANDI's EXISTING mechanics: streak with the rest-day bank, the season ladder, the shop,
  the Hat-trick, daily quests, combo, focus boost, badges, the courtyard. Flag any that fail, with a fix.
Report docs/reviews/cj5-ethics.md.
