# NANDI · Phase 0 plan (Foundation)

## Context
Jenil is replacing night-time Instagram with his own offline app. It was called "Prime Pocket" in the handover pack and is now **NANDI**, for both the app and the repo. The full brief and specs are in `D:\NANDI` (HANDOVER.md, CLAUDE.md, docs/specs/01–07). The private GitHub repo `M1nato03/NANDI` already exists and holds the pack (.gitignore committed first, so his personal export is never committed).

Phase 0 builds the foundation every later feature stands on: the scaffold, time rules, local database, **backup/restore before any feature**, legacy import, the ported puzzle and mystery generators, lessons and deck as validated JSON packs, one rules file, and an installable 5-tab shell on Cloudflare. Feature screens (tasks, training, the Daily Drop) are Phase 1. The handover schedules Phase 0 for 5–11 Oct.

## Decisions taken now (logged in DECISIONS.md as the first rows)
1. **Rename**: Prime Pocket → NANDI everywhere in code and copy.
   - Backup file `nandi-backup-YYYY-MM-DD.json`, envelope `app: 'nandi'`, weekly file `nandi-week-*.json`.
   - Add `nandi-week-*.json` to .gitignore.
   - Docs keep their original wording.
2. **Versions** (checked on npm today): Vite 8.3, React 19.3, **TypeScript 6.0.x, not 7.0**. typescript-eslint 8.71 supports only TS <6.1. Also Dexie 4.4, dexie-export-import 4.4, dexie-react-hooks 4.4, Valibot 1.5, vite-plugin-pwa 2.0, Vitest 5, Playwright 1.63, ulidx, fake-indexeddb, tsx, wrangler 4.
3. **Hosting**: Cloudflare Workers static assets.
   - `wrangler.jsonc` with SPA fallback; `public/_headers` per spec 01 §8.
   - Deployed from GitHub Actions with a Cloudflare API token stored as a repo secret.
   - URL: `nandi.<account>.workers.dev`.
4. **Banned-words check is case-sensitive with word boundaries** ("Blue Lock", "Ego", "Egoist", "Queens", "Tango", "Zip", "KenKen").
   - The Charaka lesson's lowercase "ego" (4 times) is ordinary English and passes.
   - "zip" in code (e.g. zip files) is not flagged.
   - It scans `src/` and `content/` only.
5. **Placement overlap fix** (03-train §1): "≥12 → test up" overlapped "stop at 5–12". The stop band becomes **5–11**; 12 or more moves up. This is a wording fix, not a meaning change. It goes into rules.config now and is used in Phase 1.
6. **Line endings LF** via `.gitattributes` (already committed).
7. **One agent at a time** (Jenil's standing rule). I do the build myself, plus ONE fresh review subagent before closing the phase. This replaces the handover's "parallel subagents".

## Build order (test-first for everything in `src/core`)
1. **Scaffold**
   - Vite + React 19 + TS strict + `allowJs`, ESLint (typescript-eslint, react-hooks), Prettier, Vitest (+ fake-indexeddb), Playwright, vite-plugin-pwa (`injectManifest`, `registerType: 'prompt'`).
   - Folder layout per 01-architecture §3.
   - Fill in the `CLAUDE.md` Commands section, `DECISIONS.md`, `CHANGELOG.md`, `KNOWLEDGE.md`.
2. **`src/core/time`**: `dayKey()` with the 4 am boundary, a night-timeline helper (minutes after noon), and timer maths from absolute timestamps. Tests: 00:30 → previous day, 03:59, 04:00, and spec 05 §12 test 14.
3. **`src/core/rules.config.ts`**: every constant from 05-economy §2 and 02-tasks §6, plus the placement band.
   - Add `RULES_BOUNDS`, a `rulesHistory` type and `effectiveFrom`.
   - Tests: shape, bounds and worked numbers that need no economy code yet:
     - level curve: 4,500 → L10, 122,500 → L50;
     - rank formula: 250 SP → #452, 3,500 → #193, 7,000 → #1, 700-SP seed → #401;
     - creation-split pool: 100 min → 39, 180 min → 70.
4. **`src/data/db.ts`**: Dexie schema v1 with all tables from 01 §4, ULID ids for entity rows, and `updatedAt`/`deleted`/`deviceId` on every row. Thin repositories per table group.
5. **Backup** (`src/data/backup/`):
   - Export envelope `{app, ppFormatVersion, appVersion, exportedAt, deviceId, dexie}`.
   - Envelope migrators (pure functions), Valibot validation, preview (counts per table, date range).
   - Import with `clearTablesBeforeImport`; a restore keeps this device's `deviceId`, `lastBackupAt` and `retired`.
   - `platform/files.ts`: Web Share with files, falling back to `<a download>`. The Capacitor branch arrives in Phase 2.
   - `platform/storage.ts`: `navigator.storage.persist()` + `estimate()`.
   - Vitest round-trip (export → wipe → import → deep-equal) and a Playwright round-trip.
6. **Legacy import** (`src/data/legacy-import.ts`), reached only through the restore file picker, which detects top-level `cards` + `progress`.
   - Mapping per legacy/README: cards → `cards` (deckId `greene`), ratings, item SRS → `deckProg`, cases → `puzzleRuns` (source `legacy`), hidden/flags → `flags`.
   - Keep `b:99` retired items, treat a missing `last` as absent, keep the stored dayKeys.
   - CI tests against the committed **fixture** only. The real file is never imported in code.
7. **Port the generators unchanged**: `puzzles.js` → `src/core/puzzles/`, `cases.js` → `src/core/mysteries/`.
   - Append only `export default PZ;` / `export default CaseGen;` and keep the existing CommonJS line.
   - Convert `test_pz.js` (40 seeds × 5 types × 3 levels) and `test_cases.js` (300 × 3) to Vitest with the same checks. Number Path stays uniqueness-only.
8. **Packs**
   - Valibot schemas for the pack envelope, `lessons` and `deck` (07 §2.1–2.2), shared by the app and CI.
   - `scripts/convert-legacy.ts` (Node `vm`, one-off) writes three files:
     - `content/lessons/lessons.gita-restless-mind.json`;
     - `content/lessons/lessons.charaka-holds-up.json`;
     - `content/deck/deck.greene.json` (law → topic, `cls` → `tint`).
   - The 40 Greene card texts come from the legacy export. They're generic study text (checked), but the converter reads the export locally and commits only the text, never SRS state.
   - `scripts/validate-packs.ts`: schema checks plus the old `test_lessons.js` checks (answer index in range, unique options, 2 story beats, 2 cards, length limits, Charaka needs grade + sci).
   - `scripts/build-packs.ts` writes `dist/packs/v/<id>@<ver>.json` and `index.json` with sha256. The packs are also bundled as the offline seed.
9. **App shell**
   - 5 tabs (Today, Tasks, Train, Mind, Ground) as placeholders, the dark-first Proving Ground colour tokens (06 §2) and self-hosted OFL fonts.
   - A global error boundary with an error ring.
   - Ground → **Backup screen**: export, share, restore with preview, legacy import, persist status, last-backup date.
   - A **Mind → "Generator check"** debug page that renders one board per type and today's case as plain text, to prove the port runs in the browser and in a Web Worker.
   - PWA manifest and icon (an original lime-slash mark; a placeholder is fine for now).
10. **CI** (GitHub Actions):
    - On push: typecheck, lint + banned-words, Vitest, validate-packs, build, deploy to Cloudflare.
    - Playwright only on `src/`/`tests/` changes, at 390×844 and 360×800, light/dark, plus one offline run.
11. **Cloudflare sign-up** (Jenil, guided step by step):
    - Make a free account.
    - Create an API token from the "Edit Cloudflare Workers" template.
    - Run `gh secret set CLOUDFLARE_API_TOKEN` and paste the token.
    - Then first deploy, install the PWA on the Nothing phone, and walk through the device checklist's PWA items.
12. **Review**: one fresh subagent checks the code against HANDOVER §2 non-negotiables and the Phase 0 exit checks. I fix what it finds, then run the validation gate (MET / NOT MET with evidence).

Commits are small and conventional, each ending with the Co-Authored-By line. Each step is pushed when green.

## Exit checks (HANDOVER Phase 0) and how each is proven
- **Backup round-trip passes on the phone**: Vitest round-trip + Playwright round-trip + a manual export → clear → restore on the Nothing phone, with counts compared.
- **Legacy cards and decks load**: the fixture import test in CI, then a hand import of his real export on the phone showing 40 cards, 10 reviewed, 8 items, 2 cases.
- **All generator and lesson tests green in CI**: the GitHub Actions run link.
- **PWA installs on the Nothing phone**: installed from the workers.dev URL; airplane-mode cold start loads every tab.

## Needs Jenil (none of these block starting)
- **During Phase 0**: the Cloudflare sign-up (about 5 minutes) and one phone test session.
- **By 12 Oct (Phase 1)**:
  1. 2–3 study-block topics.
  2. The **Clutch bonus**. As written, a second postpone pays +25% over finishing after one postpone (L: 35 → 44). My recommendation is to make Clutch a 0-XP "cleared a stubborn one" stamp. This changes an economy rule's meaning, so it's his call.

## Risks
- **Number Path hard** is p95 246 ms in Node on the laptop, against a 300 ms phone budget. Measure it in the Worker on the phone; if it's over, show a skeleton and pre-generate the daily board.
- **Cloudflare token** is typed on a machine that wasn't reinstalled. GitHub tokens were rotated today. The token is scoped to Workers only and can be revoked.
- **Disk**: D: has 7.1 GB free (the repo plus node_modules needs about 0.6 GB). The Playwright browser goes on C: (17 GB free).
- **vite-plugin-pwa 2.0 / Vite 8** are new majors. If `injectManifest` breaks, write a hand-rolled service worker with workbox-precaching and log it.
