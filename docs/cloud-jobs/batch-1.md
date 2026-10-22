# Cloud job batch 1 (idea engine, 22 Oct 2026)

How to run: one cloud session reads this file and runs EVERY job below as its own subagent, in parallel where the
session allows (at least 3 at a time). Each job works from a fresh checkout of origin/main unless it says otherwise,
writes ONE report file, and pushes it on its OWN new branch named below. Never push main or any existing branch, never
open a PR, never change app code or content JSON. Network access is open: open real sources and quote them with URLs;
if a page cannot be opened, say so instead of guessing. Plain English, short lines, tables where useful, no praise.
NANDI = offline learning + habits app for Indian adults 18+ (React 19 + Vite + TS + Dexie, Android via Capacitor);
live web build https://nandi.nandi11.workers.dev . Hard rules: no dark patterns, guilt, loss states, random rewards,
endless feeds; no firearm content; offline-first. At the end, the main session lists each job's branch + commit + 3-line summary.

## Job 1 · Fact check History (branch ideas/cj-factcheck-history)
File: content/topics/topic.history-civilisations.json on origin/learn-steps. For every concept: open each cited source
and quote the sentence that supports each claim (SUPPORTED / PARTLY / NOT SUPPORTED / SOURCE DEAD); check every date,
number and name in hooks, teach cards, examples, guided tries, items, options and feedback; flag anything no claim backs,
any Eurocentric or politically loaded framing for an Indian learner, and weak sources (prefer NCERT, ASI, UNESCO, museum
and university pages). Report docs/reviews/cj-factcheck-history.md with a top table (concept | claims | supported | problems).

## Job 2 · Fact check Psychology (branch ideas/cj-factcheck-psychology)
File: content/topics/topic.psychology.json on origin/steps-psych. Same method as job 1. Also flag findings with
replication problems (ego depletion, power posing, priming, marshmallow-test causal claims, some growth-mindset
effects) and any wording that reads as therapy or diagnosis. Prefer peer-reviewed papers, meta-analyses, APA, NIH.
Report docs/reviews/cj-factcheck-psychology.md.

## Job 3 · Accessibility audit of the live site (branch ideas/cj-a11y)
Use Playwright + @axe-core/playwright (install in /tmp, not in the repo) at 360x780 and 1280x800, light and dark
(prefers-color-scheme). Walk: first run, Plan, Learn lesson, Mind case + board, Train, You, night routine. Report every
WCAG 2.2 AA violation (rule, element, screen, screenshot name) plus manual checks: focus order, visible focus, tap targets
>= 44 px, text contrast on coloured buttons, screen-reader names for icon buttons, reduced motion. Report
docs/reviews/cj-a11y.md, worst first, with the fix for each.

## Job 4 · Performance audit of the live site (branch ideas/cj-perf)
Run Lighthouse (npx lighthouse in /tmp) mobile preset 3 times on the live URL, plus a Playwright trace of the first run
and of opening a Learn lesson on a throttled "Slow 4G, 4x CPU" profile. Report LCP, INP proxy (long tasks), TBT, JS bundle
sizes per chunk (read dist output by building origin/main with npm ci && npm run build), service-worker precache size,
and the 10 biggest wins with file:line where possible. Report docs/reviews/cj-perf.md.

## Job 5 · Indian competitor teardown, 2026 (branch ideas/cj-competitors-india)
Apps: Duolingo (India), Seekho, Kuku FM, Headway, Imprint, Brilliant, Finch, Habitica, TickTick, Structured, LinkedIn
Games (Queens/Zip), NYT Games. For each: what a new user does in the first 2 minutes, the daily loop, streak/rest rules,
how they avoid repetition, what users praise and hate (Play Store / App Store reviews from 2025-2026, quote 3 each),
pricing in India, and one thing NANDI should copy and one it should never copy (given NANDI's hard rules). Report
docs/reviews/cj-competitors-india.md with a summary table.

## Job 6 · Word of mouth for Indian 18-25s (branch ideas/cj-word-of-mouth)
Research what makes Indian college students and young workers recommend an app to friends (surveys, case studies:
CRED, Zepto, Duolingo India, Wordle/Queens sharing, Finch). Use Berger's STEPPS, referral research, and WhatsApp-first
sharing behaviour in India. Recommend at most 5 NANDI mechanics that fit the hard rules (no paid referrals, no guilt, no
random rewards), each with evidence, the simplest build, and a kill test. NANDI already has: a puzzle share card, a
challenge-a-friend link, and (coming) a kind-word card on low days. Report docs/reviews/cj-word-of-mouth.md.

## Job 7 · Daily puzzle shareability (branch ideas/cj-puzzle-share)
NANDI's Mind mode has daily boards (Crowns, Number Path, Sudoku, Sun & Moon, Calcudoku) and a daily logic case. Study how
Wordle, Connections, LinkedIn Queens/Zip/Tango and NYT Games make a daily puzzle worth sharing (spoiler-free share grid,
same puzzle for everyone, streaks, time). Read NANDI's share code (src/core/puzzles/share.ts, src/ui/screens/Mind.tsx) on
origin/main and recommend the smallest changes that would make one NANDI result worth posting in a WhatsApp group.
Report docs/reviews/cj-puzzle-share.md.

## Job 8 · Planner speed benchmark (branch ideas/cj-planner-speed)
Compare how fast a busy student can capture and plan 6 tasks in TickTick, Todoist, Structured, Google Tasks and NANDI
(read NANDI's src/ui/tasks/*, src/ui/screens/Plan.tsx, Today.tsx on origin/main; the live QA found quick-add dropped the
2nd and 3rd task and a 9-field form). Count taps per step from each app's docs/videos/reviews. Recommend NANDI's
fastest capture flow (natural-language time parsing in English and Hinglish, e.g. "gym 6pm", "kal subah call mom") with
the simplest build. Report docs/reviews/cj-planner-speed.md.
