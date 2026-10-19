# Changelog

## 2026-10-19

- Added the visible economy to You: daily XP replay, levels, Season 1 rank and ladder, forgiving streaks, Clean Week, Shards, fixed-price shop, cosmetic themes, and practice packs.
- Added morning lights-out back-fill, an opt-in early streak reminder, Learn drop Mind-slot credit, and calm progress feedback.
- Completed the Plan tab's Now card, fresh start, task detail, estimate calibration, optional focus reward, checkpoints, and seven-day planning line.
- Added pure planner helpers and unit and browser coverage for these flows.

## 2026-10-17

- Replaced the day Now deck and three-tab navigation with Plan, Train, Learn, Mind, and You tabs. Feature content now lives in its own tab; the top bar shows four daily status dots.
- Moved the five-item daily drop to Learn, courses and tracks into its collapsed Courses section, and removed feature tiles from You and the Learn card from Mind.
- Gave the night deck its own `#night` overlay route with a Close action to Plan. Legacy links redirect to their feature routes, and notifications and the widget open Plan or Night as appropriate.

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
- Teaching engine core (spec 09): adaptive mastery, FSRS scheduling per concept, Elo item difficulty, accuracy-gated topic packs, visible 7/30-day retention checks. Back navigation everywhere.
- Night plan (if-then), nights back on plan, weekly "What your time became" recap card with Share, copy-lint check.
- Android app part 1: Capacitor shell, notifications, native backups, CI-built APK, opt-in late-night pause.
