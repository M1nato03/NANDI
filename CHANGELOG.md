# Changelog

## 2026-10-14 — task completion recovery
- Completing a task from shutdown, Plan, Now or Focus closes its running and paused focus timers in the same database transaction. A failed completion keeps both the task and timers open for retry.
- Regression coverage checks timer closure, unchanged unrelated sessions, idempotent completion, rollback and offline shutdown recovery on both phone sizes.


## 2026-10-13 — basic daily routine
- Four permanent pillar entry points in You: Plan, Train, Mind and Learn.
- Now follows morning planning, movement or recovery, meditation, tasks and free-time learning; night offers tomorrow's plan, quiet time and lights-out. Active timers can be resumed first. The deck has a clear ending.
- Short offline meditation with pause/resume, reload recovery, early finish and backed-up history. Updates wait until practice finishes.
- Mind contains meditation, boards and mysteries. Learn contains the existing lessons, reviews and learning tracks. Legacy links still work.
- Factual daily progress replaces the placeholder mastery/rank display. Completing a task from Now also ends its unfinished focus timers; focus timer totals exclude pauses.
- No new app dependencies or database migration. See `docs/basic-app-flow.md` for agreed scope and phone delivery.

## Phase 0 (in progress)

- Added the Vite, React, and TypeScript scaffold with PWA registration and a placeholder icon.
- Added ESLint, Prettier, Vitest, and mobile Chromium Playwright configuration.
- Created the Phase 0 source, content, scripts, and test folders.
- Added backup export, validation, preview, full restore, browser file and storage adapters, and unit and browser round-trip tests.
- Added the five-tab offline shell, Proving Ground themes and bundled fonts, recovery and error ring, Ground backup flow, and main/worker generator check.
- Added an original PWA icon in SVG and PNG, plus browser checks for tab reloads, restore confirmation, and offline use.
- Added a banned-words gate, Workers static-assets hosting headers, and CI checks, deploy, and path-filtered browser tests.

## Phase 1 (in progress)
- Build line on Ground, Update available / Later flow, pending-write guard, offline navigation route, upgrade e2e test, deploy waits for e2e (CI).
- Tasks core (all 16 spec acceptance tests, flat capped Clutch) and first Tasks screens: quick add, Today Now card with focus timer, Today/Upcoming/Unplaced/Someday lists, postpone ladder sheet, split. Focus blocks app updates.
- Mind: playable daily boards (Crowns, Sun & Moon, Number Path, Calcudoku, Mini Sudoku) with rule-based checks, hints, active-time timer, saved progress and a calm stopping point; distinct region colours.
- Planner: morning plan (Unplaced triage, day-horizon line), shutdown check-in, weekly review with export, baseline-week postpone budget; shutdown and bedtime settings.
- Side quests: 3 weekly suggestions + custom quests, totals (km, reps), Monday reset without penalty. Database schema v2 (adds quests) with a tested backup migration.
- Mind Daily Drop: eight-screen Gita and Charaka lessons with saved resume, diagrams, plan check-ins, Greene and lesson-card reviews with SRS and Elo, a first-time intro board, finite daily stop, and night limits.
- Train: rank assessment, Hostel Bodyweight and Gym Foundations plans, transactional set logging, pain stops, rest timer, progression, history, metrics, and backup coverage. Active workouts defer app updates.
- Train: rank assessment, Hostel Bodyweight program by default, one-tap sets, rest timer, pain stop, history and metrics.
- Mind: lessons with diagrams, card reviews with kept legacy schedules, finite Daily Drop with a stopping screen, night 0 XP.
- Offline: fonts and icons now precached.
- Review fixes: atomic puzzle awards, 04:00 week boundaries, replayable ledger facts, economy copy hidden until enabled, lights-out fact, accessibility labels, kinder lesson copy.
- Learning tracks: one active track at a time, daily unit with a 25-minute budget bar, cards into reviews; pilot Drone technology module (4 units).
- Daily mystery case is part of the Daily Drop; focus sessions run 25/5 or 50/10 cycles; full weekly summary export.
- Redesign: Now deck / Plan (one list) / You, new warm dark look.
