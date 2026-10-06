# Prime Pocket

Personal, offline-first Android app for Jenil: **Tasks** (planner, firm about postponing but not too strict), **Train** (beginner workouts), and **Mind** (daily mystery, logic puzzles, Gita/Charaka lessons, people-reading deck). All three share one reward economy and one original theme, "The Proving Ground". It replaces night-time Instagram scrolling, so success means less scrolling and earlier sleep, not more time in the app.

Full context: `HANDOVER.md`. Specs: `docs/specs/`. Evidence: `docs/research-brief.md`. Decisions log: `DECISIONS.md`.

## Non-negotiables
- No AI or network dependency at runtime. Claude only writes content packs (`content/`) and reads exported summaries.
- Data lives on the device (Dexie/IndexedDB). Backup export and restore must always work. Never ship a migration without a backup round-trip test.
- Postponing costs a decision, never points. No punishment, no money stakes, no shame copy.
- No variable-ratio rewards, no infinite feeds, no autoplay. Daily content ends on a stopping screen. Night mode: Mind earns 0 XP after bedtime (Tasks/Train still count, uncelebrated).
- XP is never removed. Level and Shards never decrease. The ledger stores facts only; rule changes apply forward from `effectiveFrom`.
- Every tunable number lives in `src/core/rules.config.ts`.
- Original theme only. Never use "Blue Lock", "Ego" or "Egoist", franchise characters or logos. Puzzle names are Crowns, Sun & Moon, Number Path, Calcudoku (never Queens, Tango, Zip, KenKen).
- No medical claims. Keep Charaka evidence grades and the "educational, not medical advice" footer.
- Puzzles: unique solution, solvable by logic (Number Path: uniqueness only until its logic solver exists; see `04-mind.md`). Check the player's grid against the rules, never the stored solution.

## Layout
```
src/core/      pure TS, no React/Dexie: time, tasks, train, puzzles, mysteries, economy, rules.config.ts
src/data/      Dexie schema + migrations, repositories, backup export/import, pack store + validators
src/platform/  Notifier (Web | Capacitor), wake lock, vibrate, share, storage persist
src/ui/        React screens: Today, Tasks, Train, Mind, Ground
content/       JSON content packs → validated in CI → deployed to /packs/
android/       Capacitor project (Phase 2)
legacy/        original prototype code, kept for reference until fully ported
```

## Rules for working here
- Write `src/core` logic test-first with Vitest, from the acceptance tests in the specs. Keep core free of framework code.
- Screens: run Playwright at 390×844 and 360×800 in light and dark (and once offline). Look at the screenshots before calling a screen done. No horizontal scroll; tap targets ≥ 44 px; respect `prefers-reduced-motion` and the in-app motion toggle.
- Entity rows use ULID `id`s; state rows use natural keys (see `01-architecture.md` §4). Every row carries `updatedAt`, `deleted` and `deviceId`. Days and due dates use `dayKey()` strings with the 4:00 am boundary.
- Ledger entries use idempotent IDs (`kind:refId`). Never mutate or delete ledger rows.
- Timers store absolute timestamps and recompute on `visibilitychange` and `pageshow`.
- Content packs are untrusted input: validate with the shared Valibot schemas, never `eval`, and render text as plain text or sanitised markdown. (The only code evaluation allowed is the one-off `scripts/convert-legacy.ts`, which uses Node `vm` on the legacy JS.)
- `legacy/data/` is personal data: git-ignored, never bundled, imported only through the in-app restore picker.
- Secrets never go in `VITE_*` variables or the repo. Keystores, `.env` files and backup files go in `.gitignore`. Never change the signing key or `server.androidScheme`/`hostname`; either loses his data.
- New dependency → one line in `DECISIONS.md` saying why.
- Small conventional commits. Update `CHANGELOG.md` per phase.
- Copy is short, plain and coach-like. Never shaming, never "you should".
- Ask Jenil only about product trade-offs, anything that could lose data, or paid services. Otherwise decide, log it in `DECISIONS.md`, and keep going.

## Commands
dev: `npm.cmd run dev` (Windows)
build: `npm.cmd run build`
test: `npm.cmd run test`
e2e: `npx.cmd playwright install chromium` once, then `npm.cmd run build` and `npm.cmd run e2e`
lint: `npm.cmd run lint`
banned-words: `npm.cmd run banned-words`
typecheck: `npm.cmd run typecheck`
validate-packs: `npm.cmd run validate-packs`
deploy: `npx wrangler deploy` (normally run by CI after a push to `main`)
android build: Phase 2
