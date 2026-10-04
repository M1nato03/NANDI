# 01 · Architecture

Evidence and sources: `docs/research-brief.md`, section "A web codebase in an Android shell".

## 1. Shape

One web codebase, two shells:

- **Capacitor Android APK** is the daily driver from Phase 2. Only it can fire exact reminders while the app is closed.
- **Installed PWA** (Chrome WebAPK) is the preview and development channel, and the Phase 0–1 driver.

The APK's WebView and Chrome's PWA are **different origins with separate storage**. Data moves between them only through backup export and import. Make the switch in Phase 2, before months of history build up. After the migration, the PWA shows a "This copy is retired; use the app" banner and becomes read-only, so two copies never diverge.

```
             ┌──────────────────────── src/ (one codebase) ────────────────────────┐
             │ ui/ (React) → core/ (pure TS rules) → data/ (Dexie) → platform/ (adapters) │
             └───────────────┬───────────────────────────────────────┬─────────────┘
                     vite build                               npx cap sync android
                             ▼                                        ▼
              Cloudflare static hosting                    Capacitor APK (sideloaded)
              PWA + /packs/ (content)  ◀── fetch packs (absolute PACKS_ORIGIN) ── WebView https://localhost
```

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Build | Vite | |
| UI | React 19, TypeScript strict, `allowJs: true` | Preact is an acceptable swap. Don't use Svelte (AI agents mix Svelte 4 and 5 syntax) |
| State | Local component state + Dexie live queries (`dexie-react-hooks`) | No Redux. A small context for settings/theme is fine |
| Storage | Dexie, `dexie-export-import`, `ulid` (or `ulidx`) | |
| Validation | Valibot | Shared by the app, CI and the backup importer |
| PWA | vite-plugin-pwa, `strategies: 'injectManifest'`, `registerType: 'prompt'` | A custom service worker handles `notificationclick`. **Register the service worker only when `!Capacitor.isNativePlatform()`**; in the APK a worker could serve a stale bundle after an update |
| Native | `@capacitor/core`, `@capacitor/android`, `@capacitor/local-notifications`, `@capacitor/share`, `@capacitor/filesystem`, `@capacitor/haptics`, a keep-awake plugin (verify the current community plugin) | See section 6 |
| Tests | Vitest (+ fake-indexeddb), Playwright (Chromium mobile profiles at **390×844 and 360×800**, dark and light, offline) | |
| Lint/format | ESLint (typescript-eslint, react-hooks), Prettier, plus a **banned-words check** in CI | The check scans `src/` and `content/` with word boundaries for the franchise and trademark names listed in `06-theme.md` §6. Don't scan the docs, which name them on purpose |
| Fonts | SIL OFL fonts, self-hosted in the build (no Google Fonts at runtime, so it works offline) | See `06-theme.md` |

## 3. Repo layout

```
src/
├─ core/                 pure TypeScript. No React, no Dexie, no DOM. 100% unit-tested.
│  ├─ time/                dayKey(), night-timeline compare (minutes after noon), week/season calendars, timer maths
│  ├─ tasks/               postponeGate(), split rules, budget + auto-raise, capacity, estimate calibration
│  ├─ train/               progression engine, ladders, placement, plate maths, warm-up ramp, XP eligibility
│  ├─ puzzles/             seeded generators (ported legacy), counters, logic solvers = grader = hint engine
│  ├─ mysteries/           logic-grid case generator (ported legacy cases.js)
│  ├─ learn/               lesson flow state machine, SRS scheduling, Elo ratings
│  ├─ economy/             award rules over ledger facts, caps, level curve, season rank, streak + Clean Week, Shards, hexagon
│  └─ rules.config.ts      ← every tunable number (+ RULES_BOUNDS, rules history with effectiveFrom)
├─ data/
│  ├─ db.ts                Dexie schema + versions + upgrade functions
│  ├─ repos/               one module per table group
│  ├─ backup/              export, envelope migrators, validate, preview, import
│  ├─ legacy-import.ts     maps a user-picked legacy-export.json → schema (never bundled)
│  └─ packs/               pack schemas (Valibot), store, updater
├─ platform/
│  ├─ notifier.ts          interface + WebNotifier + CapacitorNotifier
│  ├─ files.ts             share/download/pick file: web vs Capacitor
│  ├─ awake.ts             screen wake lock: Web Wake Lock vs native keep-awake
│  ├─ haptics.ts           navigator.vibrate patterns (declare VIBRATE in the APK) with Capacitor Haptics as fallback
│  └─ storage.ts           persist() request + estimate
├─ workers/
│  └─ puzzle.worker.ts     generation off the main thread
├─ ui/                   React: app shell, tabs, screens, components, theme tokens
└─ sw.ts                 custom service worker (precache app shell; packs/index.json is network-first, never precached)
content/                 JSON packs (source of truth) → scripts/build-packs.ts → dist/packs/
scripts/                 validate-packs.ts, build-packs.ts (sha256 + index.json), convert-legacy.ts (Node vm, one-off)
tests/e2e/               Playwright specs
android/                 Capacitor project (Phase 2)
legacy/                  prototype code, kept until fully ported. legacy/data/ is git-ignored
```

## 4. Data model (Dexie v1)

**Row metadata:**

- **Entity rows** (tasks, sessions, sets, focus, plans, reminders, prs, puzzleRuns, flags, inventory, unlocks) use `id` = a ULID string.
- **State rows** use **natural keys**: exState, cards, deckProg, lessonProg, ratings, dailyLog, settings, packs.
- **Ledger rows** use idempotent IDs.
- **All rows** also carry `updatedAt` (ms), `deleted` (0|1) and `deviceId`, so sync-by-file can merge them later.
- **All "day" fields** are `dayKey` strings (`YYYY-MM-DD`), and **due dates are dayKey strings** too (matching the legacy data).

Only indexes go in `stores()`; the other fields are described in comments. Dexie drops indexes you leave out of a later version, so always restate the full store list when you bump the version.

```ts
db.version(1).stores({
  // ── Tasks ──
  tasks:      'id, status, dayKey, scheduledStart, category, parentId, updatedAt',
  //  title, notes, size, estimateMin, plannedSize, category, mustOrCould, scheduledStart|null, scheduledEnd, place?, firstStep?,
  //  postponeCount, firstScheduledDayKey, status, doneAt?, parentId?, checkpointOf?, xpShare? (for split subtasks)   — see 02-tasks §1
  taskEvents: 'id, taskId, kind, at',      // kind: created|scheduled|postponed|realReasonMove|shrunk|split|started|switched|done|someday|dropped; reason?, budgetCounted?
  focus:      'id, taskId, startedAt',     // plannedMs, pauses:[{at,resumeAt}], endedAt, overtimeMs, switches
  reminders:  'id, refType, refId, at',    // notifId (int32, stable hash), channel, status:'scheduled'|'fired'|'cancelled'
  plans:      'id, lessonId, madeDayKey',  // if-then plans from lessons: ifText, thenText, fired:null|'yes'|'partly'|'no'|'na'
  // ── Train ──
  exercises:  'id, pattern, source',       // name, equipment[], cues[], image?, licence, attribution, custom:boolean
  ladders:    'id, pattern',               // steps:[{exerciseId, sets:3, repMin:5, repMax:8, holdS?}]
  programs:   'id, track',                 // track:'gym'|'bodyweight'; templates:[{key, slots:[...]}] (or read from program packs)
  exState:    'id',                        // natural key = exerciseId|ladderId; loadKg, ladderStep, successStreak, failStreak, lastIncreaseAt
  sessions:   'id, dayKey, status',        // templateKey, status:'completed'|'minimum'|'partial'|'safety'|'skipped', heatMode, readiness, startedAt, endedAt
  sets:       'id, sessionId, exerciseId', // type:'warmup'|'working', loadKg, reps, durationS, effort:'easy'|'solid'|'near', painFlag, completedAt
  prs:        'id, exerciseId, kind',      // kind: load|repsAtLoad|e1rm|ladderStep|hold; value, setId, at
  // ── Mind ──
  puzzleRuns: 'id, type, dayKey, seed',    // type: sudoku|crowns|sunmoon|path|calc|mystery; diff, daily, intro?, solveMs, hintsUsed, hintRungs[],
                                           // techniquesSeen[], result:'solved'|'revealed'|'abandoned', tries?, source:'app'|'legacy'
  cards:      'id, deckId, due',           // natural key (e.g. 'l4-1', 'gita-g2-1'); packId, itemId, box(0–6), due(dayKey), reviews, last?  — text comes from the pack
  deckProg:   'id, due',                   // natural key = item id; b, n, c, due(dayKey), last; b:99 + due '9999-12-31' = retired mini-mystery
  lessonProg: 'id, packId',                // natural key = lessonId; doneDayKey, guessOk, conf, transferOk, whyOk
  ratings:    'id',                        // 'people'|'detective'; value (Elo, clamped 400–2400), n
  flags:      'id, refId',                 // hidden/flagged items or cards: refId, kind, note?, at
  unlocks:    'id, kind',                  // technique cards and other non-purchased unlocks: kind, refId, at
  packs:      'id, kind, version',         // natural key = packId; validated pack JSON + sha256 + installedAt
  // ── Economy & self-report ──
  ledger:     'id, dayKey, mode, kind',    // APPEND-ONLY FACTS. id = kind + ':' + refId. inputs only (plannedSize, firstDay, shareOfSets, beforeBedtime…). No xp stored
  inventory:  'id, kind',                  // purchased cosmetics/packs/freezes; price, at
  dailyLog:   'dayKey',                    // reelsBucket, wellbeingMinutes?, lightsOutAt, bedtimeTarget, agency1to5?, agencyOpenedInstead?,
                                           // appMinutes (foreground, excluding workout & focus timers), planDone, shutdownDone, reviewDone, nightOverrides
  settings:   'key'                        // deviceId, bedtime, goalBedtime, dropTime, shutdownTime, equipment, track, weeklyTarget, motion, sound, haptics,
                                           // lastBackupAt, economyVisibleFrom, rulesHistory, errorRing (last 50), legacyDays?, retired (PWA after migration)
});
```

**`dayKey(ts)`** = the local calendar date of `ts − 4 h`, as `YYYY-MM-DD`. 00:30 on 4 Oct belongs to `2026-10-03`. All "today" logic in all three modes uses it.

**Ledger IDs** are idempotent, for example `task-done:<taskId>`, `session:<sessionId>`, `pr:<prId>`, `drop-board:<dayKey>:<type>`, `hattrick:<dayKey>`, `lightsout:<dayKey>`, `weekly-train:<isoWeek>`. Ledgers from two devices merge by set union. Because XP is derived from facts in dayKey order, caps and merges stay consistent.

**Timers** store `startedAt`, `durationMs` and pauses. The remaining time is computed on every `visibilitychange` and `pageshow`.

## 5. Backup and restore (Phase 0, before features)

**Export file:**

- `prime-pocket-backup-YYYY-MM-DD.json` = `{ app: 'prime-pocket', ppFormatVersion, appVersion, exportedAt, deviceId, dexie: <dexie-export-import JSON> }`.
- Our field is named `ppFormatVersion` so it doesn't clash with dexie-export-import's own `formatVersion`.
- The UI states plainly that the backup file is plaintext personal data.

**Sharing the file:**

- Web build: Web Share API (check `navigator.canShare({files})`, only from a tap), with `<a download>` as the fallback.
- APK: `navigator.share` with files and `<a download>` aren't reliable in an Android WebView. Use `@capacitor/filesystem` to write the file, then `@capacitor/share`. Hide this behind `platform/files.ts`.

**Restore order:**

1. Pick the file.
2. Parse it.
3. **Run the envelope migrators** (pure functions, one per `ppFormatVersion` bump) so old files are upgraded first.
4. Validate.
5. Show a **preview** (counts per table, date range).
6. Confirm.
7. Import with `acceptVersionDiff`, either `clearTablesBeforeImport` (full restore) or merge by `updatedAt` (sync by file, later).

**Restore rules:**

- A full restore **keeps the current device's `deviceId`, `lastBackupAt` and `retired` settings**.
- **Legacy import uses the same file picker** (it auto-detects the legacy shape; see `legacy/README.md`). **Never `import` the legacy JSON statically.** It's personal data and must never be bundled into the public build. `legacy/data/` is git-ignored.

**Persistence and nag:**

- Call `navigator.storage.persist()` on first run and after install. Show the result and `storage.estimate()` on the Backup screen.
- Store `lastBackupAt`. After `RULES.backup.nagAfterDays` (7), show a quiet banner on Ground. It never blocks anything.
- In the APK, offer an automatic weekly backup file if feasible.

**Tests:** a Vitest round-trip with fake-indexeddb (export, wipe, import, deep-equal), a Playwright round-trip, and a manual round-trip on the phone.

## 6. Platform adapters

**Notifier** (picked at startup with `Capacitor.isNativePlatform()`):

```ts
interface Notifier {
  requestPermission(): Promise<'granted'|'denied'|'prompt'>;
  schedule(r: {id: string; at: number; title: string; body: string; channel: 'tasks'|'rest'|'planning'}): Promise<void>;
  cancel(id: string): Promise<void>;
  listPending(): Promise<string[]>;
}
```

- **CapacitorNotifier:**
  - Create the channels on first run.
  - Request `POST_NOTIFICATIONS` at runtime, at the first reminder setup rather than at launch. Declare `USE_EXACT_ALARM` in the manifest.
  - Schedule with `allowWhileIdle: true`.
  - Map ULIDs to a stable int32 `notifId` and store it in `reminders`.
  - If the exact permission is missing, the plugin silently falls back to inexact alarms. Detect this and tell him in Settings.
- **WebNotifier:** best effort only. Show notifications with `registration.showNotification()` while the app is open (`new Notification()` throws on mobile). The UI should say "Reminders are exact only in the installed app."
- **Rescheduling:** reschedule all future reminders on every launch, on resume, and after any task edit. Test reboot survival (device checklist).
- **Rest timer backstop:** schedule a `rest` notification when a rest period starts; cancel it if he skips or adjusts.

**Wake lock:** the Screen Wake Lock API on the web, re-requested on `visibilitychange`. In the APK, a native keep-awake plugin if the WebView lacks Wake Lock. Never use the silent-audio hack.

**Haptics:** pattern vibration (e.g. `[20,40,20]`) uses `navigator.vibrate`, which needs a recent tap; in the APK, declare the `VIBRATE` permission and verify it works in the WebView. Fall back to Capacitor Haptics impact styles (light, medium, heavy) if patterns don't work. Respect the in-app haptics toggle.

## 7. Content packs (summary; full schemas in `07-content-packs.md`)

- **Source:** `content/<kind>/<packId>.json`.
- **CI:**
  - `validate-packs` runs the same Valibot schemas the app uses.
  - `build-packs` writes immutable files to **`dist/packs/v/<packId>@<version>.json`** and the catalogue to `dist/packs/index.json` (id, kind, version, schema major, minAppVersion, url, sha256, bytes).
- **Bundled seed:** the current packs are **also bundled into the app build** as a seed, so a fresh install works offline on first launch.
- **Updater (on launch at most once a day, and from a manual "Check for content" button):**
  1. Fetch `${PACKS_ORIGIN}/packs/index.json`, network-first and never from the service-worker precache.
  2. For each newer pack: download it, check the sha256, run schema validation, and check `minAppVersion`.
  3. Store it in Dexie. **Keep the old version until the new one passes.**
- **`PACKS_ORIGIN`:**
  - Web build: the page's own origin.
  - APK: the **absolute** hosted origin (e.g. `https://prime-pocket.<account>.workers.dev`), set at build time. Otherwise `/packs/index.json` would resolve to the bundled seed inside the APK and never update.
- **CORS:** the APK's origin (`https://localhost`) differs, so `/packs/*` must send `Access-Control-Allow-Origin: *`. CapacitorHttp is an alternative. Don't serve packs from `raw.githubusercontent.com` (unpublished rate limits).

## 8. Hosting, headers, CI, signing

- **Repo:** **private** GitHub repo `prime-pocket` (confirm the name with Jenil). It holds personal context (HANDOVER §1). If the repo is ever made public, strip personal docs first.
- **Hosting:** Cloudflare (Workers static assets, or Pages if simpler; both free and both support a headers file; verify at setup). Fallback: GitHub Pages. That needs a public repo on the free plan, or GitHub Pro (included in the free GitHub Student Developer Pack, which also raises Actions minutes).
- **Headers:**
  - `no-cache` for `/sw.js`, `/index.html`, `/manifest.webmanifest` and `/packs/index.json`;
  - `public, max-age=31536000, immutable` for `/assets/*` and `/packs/v/*`;
  - `Access-Control-Allow-Origin: *` on `/packs/*`.
  - The separate `/packs/v/` prefix stops caching rules overlapping.
- **GitHub Actions (mind the free minutes on a private repo):**
  - **On push to `main`:** install, typecheck, lint plus the banned-words check, Vitest, validate-packs, build, then deploy to Cloudflare (API token in repo secrets).
  - **Playwright:** runs on pushes that touch `src/` or `tests/` (path filters).
  - **Content-only pushes** (`content/**`) run validate, build and deploy only.
  - **Android job** (on a tag `v*` or manual dispatch): `npx cap sync android`, `./gradlew assembleDebug` signed with the shared keystore, then upload the APK as a workflow artifact.
- **Signing and data safety (critical):**
  - Android refuses an update signed with a different key, and **uninstalling wipes the APK's data**. So:
    1. Generate **one keystore once**. Store it base64-encoded in GitHub secrets **and keep a copy in Jenil's password manager**, because secrets can't be read back.
    2. Point the Gradle `signingConfig` for debug and release at that keystore, for **both CI and local builds**. A laptop's default `~/.android/debug.keystore` would produce an APK that can't update the CI-built one.
    3. **Pin `server.androidScheme` and `server.hostname`** in `capacitor.config.ts`, with a `// NEVER CHANGE: IndexedDB is tied to this origin` comment. A changed origin orphans all data.
    4. **Export a backup before every APK update** (a checklist item and an in-app reminder on version change).
  - Never commit the keystore or `.env` files.
- **Installing:** over USB with `adb install -r` (exempt from Android's coming developer-verification rules), or from the downloaded artifact. Set the app's battery use to **Unrestricted**.

## 9. Budgets and quality bars

- Cold start to interactive in under 2 s on the Nothing phone (the APK).
- Puzzle generation runs in a Web Worker; p95 for the hardest type is under 300 ms on the phone. Show a skeleton while generating.
- 60 fps on scroll and animations. Animate only transform and opacity.
- An offline reload works for every screen.
- Accessibility:
  - AA contrast;
  - all controls labelled;
  - tap targets ≥ 44 px;
  - no horizontal scroll at 360 px;
  - reduced motion honoured.
- **Errors:** a global React error boundary with a "copy error details" button; a local ring buffer (last 50) in `settings.errorRing`, optionally included in the weekly summary. **No remote telemetry.**

## 10. Security and privacy

- No accounts, no analytics, no third-party SDKs.
- Never put secrets in `VITE_*` variables (Vite inlines them into the bundle). Keystores and `.env` files go in `.gitignore`.
- Packs are untrusted input: validate them, never `eval`, and render lesson text as plain text or sanitised markdown. The one exception is `scripts/convert-legacy.ts`, a one-off Node build step that evaluates the legacy JS with `vm` to produce packs.

## 11. Sync (later, optional)

1. **Sync by file:** export on device A, import on device B with per-record last-write-wins by `updatedAt`, tombstones respected, and the ledger merged by set union.
2. **If he wants automatic sync:** a Cloudflare Worker + D1 (free, never pauses), about 150 lines with a server-issued checkpoint. Or Dexie Cloud (free for 3 users and 100 MB). Avoid Supabase's free tier (it pauses after 7 inactive days) and PocketBase (pre-1.0, needs a server).
