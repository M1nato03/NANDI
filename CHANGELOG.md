# Changelog

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
