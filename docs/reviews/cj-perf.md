# Performance audit: live site (Job 4)

Date: 2026-10-22
Live URL: https://nandi.nandi11.workers.dev
Code: origin/main at `78d1a28`.
The live `index.html` lists the same 47 assets as a local build of `78d1a28`.
Only the entry chunk hash differs (`index-BZnIIrKi.js` live, `index-ComLPxfL.js` local), because of the `__BUILD_COMMIT__`/`__BUILD_DATE__` defines.
So the live numbers and the file:line references below describe the same code.

## Short version

- On a cold first visit the app is slow to paint: the screen stays blank until the JS has run.
  Lighthouse mobile median: LCP 3.78 s, FCP 3.18 s, TBT 0 ms, score 79.
  Playwright on Slow 4G + 4x CPU: FCP 4.0 s, LCP 4.4 s.
- The main cause is one line. `src/data/packs/seed.ts:4-5` uses a top-level `await` to load and validate **all 22 content chunks**.
  An eager import chain pulls it in, so 220 KB (brotli) of lesson text is on the critical path, before React can render the Today screen.
  That is 38% of the first-load bytes.
- Interactions are fine. Opening Learn and answering a question took 32–112 ms per tap. No tap went over 200 ms.
- A repeat visit with the service worker in control is fast: FCP 0.44–0.56 s, LCP 0.62–0.80 s, 0 network bytes.
- Precache: 117 entries, 2,053.77 KiB as reported by the build. That is 113 unique files, 576 KB brotli, and 37% of it is content chunks.

## Method

| Item | Setting |
|---|---|
| Lighthouse | `lighthouse@13` via `npx lighthouse`, default mobile preset (simulated Slow 4G, 4x CPU, Moto G Power viewport), `--chrome-flags="--headless=new --no-sandbox"`, Chromium 1194 from `/opt/pw-browsers` |
| Playwright | `playwright@1.64.1` with `executablePath` set to the same Chromium; viewport 390×844, DPR 2.625, `isMobile`, `hasTouch` |
| Throttle (Playwright) | CDP `Network.emulateNetworkConditions` latency 150 ms, 1.6 Mbps down, 750 Kbps up; `Emulation.setCPUThrottlingRate` 4 |
| Observers | `PerformanceObserver` for `longtask`, `event` (durationThreshold 16), `largest-contentful-paint` and `layout-shift`, installed by `addInitScript` before navigation |
| Traces | Playwright tracing (screenshots + snapshots) of the first load and of the Learn lesson flow, 3 runs each. Traces are kept in `/tmp/cj-perf` and not committed |
| CPU profile | CDP `Profiler` with a 200 µs sampling interval during a throttled cold load |
| Build | `npm ci && npm run build` in a clean worktree of origin/main. Node 22.22 was used; `package.json` asks for Node ≥ 24, and the build passed anyway. A second `vite build --sourcemap` went to a separate directory, analysed with `source-map-explorer` |

**CPU contention.** Another job was running Playwright + axe on the same 4-core machine, and the load average was 2.6–6.1 during my runs.
- My first Lighthouse attempt ran while `npm ci` was also running. Its benchmarkIndex was 1556 and it showed TBT 244 ms. I **discarded** it and re-ran after the build finished.
- The three kept runs had benchmarkIndex 2222, 2422 and 1897. Run 3 is the lowest, but its metrics match run 1, so I kept it.
- Lighthouse's simulated TBT is sensitive to this contention. Treat TBT 0 ms as "low", not "zero".

## 1. Lighthouse, mobile preset, 3 runs

| Run | benchmarkIndex | Score | FCP | LCP | TBT | Speed Index | CLS | TTI | Max potential FID |
|---|---|---|---|---|---|---|---|---|---|
| (discarded, during `npm ci`) | 1556 | 0.77 | 3230 | 3886 | 244 | 3466 | 0.022 | – | – |
| 1 | 2222 | 0.79 | 3206 | 3806 | 0 | 4941 | 0.063 | 3806 | 16 |
| 2 | 2422 | 0.85 | 2805 | 3705 | 12 | 2805 | 0.031 | 3712 | 54 |
| 3 | 1897 | 0.79 | 3181 | 3781 | 0 | 4830 | 0.063 | 3781 | 16 |
| **Median** | 2222 | **0.79** | **3181** | **3781** | **0** | **4830** | **0.063** | **3781** | 16 |

All times are in ms.

Lighthouse diagnostics (run 2):
- **LCP element:** the welcome paragraph `div.welcome-inner > p` ("Swap a little scrolling for things you'll be glad you did…").
- **Request count:** 83 requests and 566 KiB transferred on the first visit. 70 of them are scripts (502 KB).
- **Critical chain:** HTML, then 42 `modulepreload` scripts plus 5 CSS files. Then a **second wave of 22 content chunks starts at about 710 ms**, after the entry module has run far enough to reach the `import.meta.glob` in `seed.ts`. The WOFF2 fonts are discovered late, at about 886–976 ms, because they are only referenced from CSS.
- **Unused JS:** 40 KiB in the entry chunk (45% of it), flagged by `unused-javascript`.
- **Legacy JS:** 10 KiB in `backup-*.js` (Babel class, regenerator and spread helpers from `dexie-export-import`).
- **Render-blocking CSS:** 5 files, 21 KB transferred, estimated saving 80 ms.
- **Bootup time:**

  | Chunk | Contents | Main-thread time | Of which scripting |
  |---|---|---|---|
  | `index-*.js` | react-dom | 502 ms | 462 ms |
  | `jsx-runtime-*.js` | Dexie + React | 351 ms | 307 ms |

- **Long tasks (5):** 137 ms, 78 ms, 75 ms, 74 ms and 73 ms.
- **CLS culprits:** `section.task-list` moved (0.022), and the welcome text was shifted by the DM Sans 400 web font swap (0.009).
- **Passing:** server response 66–70 ms; brotli is on; `/assets/*` uses `max-age=31536000, immutable`; no third parties.

## 2. Playwright, Slow 4G + 4x CPU

### 2a. Cold first load (empty profile, no service worker)

| Run | TTFB | DCL | FCP | LCP | Long tasks (count / sum / max) | Blocking time (sum of time over 50 ms) | CLS | Bytes / requests |
|---|---|---|---|---|---|---|---|---|
| 1 | 445 | 2414 | 4120 | 4528 | 6 / 671 / 183 | 371 | 0.088 | 578 KB / 82 |
| 2 | 330 | 2261 | 3996 | 4336 | 5 / 617 / 235 | 367 | 0.088 | 578 KB / 82 |
| 3 | 423 | 2347 | 4012 | 4408 | 5 / 553 / 173 | 303 | 0.088 | 579 KB / 82 |
| **Median** | 423 | 2347 | **4012** | **4408** | 5 / 617 / 183 | **367** | 0.088 | 578 KB |

All times are in ms. The LCP element was the welcome `<p>` in all 3 runs.

The long tasks cluster at 3.5–4.7 s, which is module evaluation plus the first React render.
- The 3.0–4.0 s window holds one task of 173–235 ms and one of 142–152 ms.
- The welcome "Let's start" button became clickable at 4.5–4.7 s wall time.

CPU profile of the cold load (self time, with 4x throttling):

| Chunk | Contents | Self time |
|---|---|---|
| `index` | react-dom | 319 ms |
| `jsx-runtime` | Dexie, React | 224 ms |
| `dist-B3XCOFc8` | valibot, which `seed.ts` runs over every pack | 69 ms |
| `formatDayKey` | a single function: `new Intl.DateTimeFormat(...)` on every call | 64 ms |

About 750 ms more was "(program)" time: style, layout and parsing.

Service worker:
- It was active, and 113 entries were cached, by the time it was checked (about 9.7 s after navigation).
- CDP network throttling on the page target does **not** throttle the service worker's own fetches, so the install looked instant here.
- On a real Slow 4G link, the 32 precache files the first page did not load (121 KB brotli) download in the background right after load. That takes about 0.6 s of link time.

### 2b. Repeat visit (service worker in control), same throttle

| Run | FCP | LCP | Long tasks | Network bytes |
|---|---|---|---|---|
| 1 | 444 | 620 | 56 | 0 (84 of 84 from SW) |
| 2 | 564 | 772 | 67 / 56 / 71 | 0 |
| 3 | 540 | 796 | 78 | 0 |

The offline-first shell works. The 1.1 s opening animation (`src/ui/cast/OpenMoment.tsx:15`) still covers the screen until about 1.1 s after mount on every open. This is a product choice. It sets the real "can tap" time on repeat visits.

### 2c. Opening a Learn lesson (after welcome, SW in control)

Flow: tap the Learn tab, tap "Start" on Today's drop, pick "Body and training", tap "Start my first drop", then answer the first question.

| Run | Learn tab tap → "Start" visible | "Start" → drop screen | "Start my first drop" → first question | Click event durations (INP proxy), in flow order | Long tasks |
|---|---|---|---|---|---|
| 1 | 402 ms | 533 ms | 210 ms | 112 / 40 / 32 / 32 / 48 | 84 ms |
| 2 | 377 ms | 536 ms | 270 ms | 96 / 48 / 32 / 32 / 40 | 78 ms |
| 3 | 341 ms | 524 ms | 267 ms | 88 / 48 / 32 / 32 / 32 | 64 ms |

INP proxy: the worst tap was 88–112 ms, which is the first tap on the Learn tab: lazy chunk, Suspense, then render. Every other tap was 32–48 ms. All are inside the "good" band (≤ 200 ms).
The wall times above include Playwright overhead and a 300 ms settle wait, so they are upper bounds.

## 3. Build output (origin/main, `npm run build`)

- 95 JS chunks: 1,920,202 B raw, 568,679 B gzip.
- 10 CSS files: 122,248 B raw.
- 3 WOFF2 fonts: 50,188 B.
- 1 worker. `dist/` is 3.2 MB in total.

Sizes below are raw and `gzip -9` in bytes. Live serves brotli, which is about 10% smaller.
Eager chunks are the ones loaded on the first visit: the entry, everything `index.html` modulepreloads, and the content chunks.

| Chunk | Raw | Gzip | Eager on first load? | Main contents |
|---|---:|---:|---|---|
| `index-*.js` | 282,845 | 87,427 | yes (entry) | react-dom 207 KB raw, app shell, `src/ui/shell`, `src/ui/night`, welcome |
| `topic.psychology-*.js` | 170,735 | 38,690 | **yes (via seed.ts)** | content JSON |
| `jsx-runtime-*.js` | 111,598 | 37,034 | yes | Dexie 95 KB raw, React 8 KB, `rules.config.ts` 5 KB, `db.ts` |
| `topic.how-things-work-*.js` | 100,646 | 20,910 | **yes (seed.ts)** | content |
| `topic.money-markets-*.js` | 95,618 | 20,470 | **yes (seed.ts)** | content |
| `topic.history-civilisations-*.js` | 85,196 | 16,629 | **yes (seed.ts)** | content |
| `topic.health-nutrition-*.js` | 79,403 | 15,527 | **yes (seed.ts)** | content |
| `Mind-*.js` | 76,950 | 23,318 | no (lazy) | Mind screen |
| `topic.body-training-*.js` | 75,791 | 16,342 | **yes (seed.ts)** | content |
| `backup-*.js` | 75,134 | 21,279 | **yes (modulepreload)** | dexie-export-import 63 KB raw, `legacy-import.ts` 7 KB, backup |
| `lessons.gita-restless-mind-*.js` | 68,639 | 25,800 | **yes (seed.ts)** | content |
| `puzzle.worker-*.js` | 53,538 | 19,085 | no (worker) | puzzle generator |
| `index-*.css` | 53,139 | 10,723 | yes (render-blocking) | global CSS |
| `Train-*.js` | 50,703 | 14,973 | no (lazy) | Train screen |
| `lessons.charaka-holds-up-*.js` | 47,003 | 17,046 | **yes (seed.ts)** | content |
| `deck.greene-*.js` | 36,919 | 14,054 | **yes (seed.ts)** | content |
| `Storybook-*.js` | 34,421 | 10,694 | yes | courtyard `Scene.tsx` 18.7 KB, `Courtyard.tsx`, `Storybook.tsx` |
| `guard-*.js` | 31,196 | 9,330 | yes | `repos/tasks.ts` 16 KB, PostponeSheet |
| `LearnDrop-*.js` | 29,388 | 9,257 | no (lazy) | drop player |
| `Planner-*.js` | 29,089 | 8,811 | no (lazy) | planner |
| `mysteries-*.js` | 27,579 | 9,270 | no | cases |
| `train-*.js` | 27,208 | 7,998 | yes | core train |
| `Cast-*.js` | 27,100 | 7,594 | yes | `Cast.tsx` |
| `LearnDrop-*.css` | 23,172 | 4,995 | no | – |
| `puzzles-*.js` | 20,843 | 7,582 | yes | core puzzles |
| `Plan-*.js` | 19,861 | 6,484 | yes (route) | Plan screen |
| `AgencyCheck-*.js` | 16,489 | 4,946 | yes (route) | – |
| `Tracks-*.js` | 13,990 | 4,843 | no | – |
| `sound-*.js` | 13,804 | 5,569 | yes | cast sounds |
| `dist-B3XCOFc8.js` | 13,275 | 3,098 | yes | valibot |
| `deriveEconomy-*.js` | 10,517 | 4,181 | yes | – |
| `seed-*.js` | 8,153 | 2,989 | yes | `schemas.ts` + `seed.ts` |
| `dist-B-fBiTU6.js` | 7,759 | 3,117 | yes | @capacitor/core |
| (62 more chunks) | < 10 KB each | | | |

The 22 content chunks (`topic.*`, `lessons.*`, `deck.*`, `mystery-arc.*`, `track.*`, `quests.core`, `winddown.core`) total **788 KB raw, 168 KB brotli**.
On the live first load they were **220 KB transferred** (Lighthouse run 2, 22 requests).

Total first-load JS (Lighthouse): 70 scripts, 502 KB transferred.

## 4. Service-worker precache

| Measure | Value |
|---|---|
| Build log | `precache 117 entries (2053.77 KiB)` |
| Unique URLs | 113. `icon.svg`, `icon-192.png`, `icon-512.png` and `manifest.webmanifest` are each listed twice, once from the `globPatterns` at `vite.config.ts:30` and once from the PWA manifest icons |
| Raw / gzip / brotli | 2,103,062 / 652,233 / 576,666 bytes |
| By type (raw) | JS 1,920 KB, CSS 122 KB, WOFF2 50 KB, PNG 11 KB, HTML 4 KB |
| Content chunks | 788 KB raw (37%), 168 KB brotli |
| Revisioned entries | 9 (html, manifest, icons). The other 108 are hashed and use `revision: null` |
| Not loaded by the first page | 32 files, 121 KB brotli |
| `sw.js` itself | 23 KB (`sw.mjs` 16 KB, 5.5 KB gzip) |

`dist/packs/` (793 KB, 16 pack JSONs) is also deployed, but it is not precached and the app never fetches it at runtime: there is no `/packs` fetch in `src`. It costs nothing on the device. It does mean the content ships in two forms.

## 5. The 10 biggest wins

Ranked by expected effect on a cold first visit on Slow 4G. All file:line references are on origin/main `78d1a28`.

| # | Win | Where | Evidence | Expected effect |
|---|---|---|---|---|
| 1 | **Take `seed.ts` off the startup path.** Its top-level `await Promise.all(import.meta.glob(...))` fetches and valibot-parses all 22 content chunks. Every module that imports it waits, including `main.tsx`. Three steps: (a) import `dailyDropId` from `../learn/dropIds` instead of `../learn/flow`; (b) make `reconcileGamify` load `topics` with `await import()`; (c) make `ContentReview` and `OwnerPanel` lazy, like the other screens | `src/data/packs/seed.ts:4-10`; `src/ui/shell/TodayDots.tsx:6`; `src/data/repos/gamify.ts:5` (used at :35), reached through `src/ui/shell/EconomyFeedback.tsx:12`; `src/ui/shell/AppShell.tsx:28-29` | 220 KB of 579 KB first-load bytes (38%) and a second request wave at about 710 ms. valibot parse is 69 ms self time at 4x | Takes about 1.1 s of transfer off the critical path at 1.6 Mbps. FCP and LCP should drop by roughly 1 s. Content is still precached for offline use |
| 2 | **Paint a static shell from `index.html`.** `#root` is empty, so nothing shows until all JS has run (FCP 4.0 s throttled). Put the Nandi mark and background colour in plain HTML/CSS inside `#root`; React replaces it on mount | `index.html:11` (`<div id="root"></div>`); the same markup as `src/ui/cast/OpenMoment.tsx:19-20` | DCL 2.3 s, FCP 4.0 s (Playwright); Speed Index 4.8 s (LH) | FCP close to HTML arrival (about 0.5–0.7 s throttled). Better Speed Index |
| 3 | **Lazy-load `dexie-export-import`.** `autoBackup.ts` and `useNativeUpdater.ts` import `data/backup` statically, so the 75 KB chunk is modulepreloaded on every open. Use `await import('./backup')` inside `runAutoBackup` and the update flow | `src/data/autoBackup.ts:6`; `src/ui/shell/useNativeUpdater.ts:2`; `src/data/backup/index.ts:1` | 22.8 KB brotli on first load; Lighthouse legacy-JS 10 KiB | About 23 KB and its parse off startup. Backup and restore behaviour is unchanged |
| 4 | **Preload the 3 WOFF2 fonts and add a metric-matched fallback.** They are only found after CSS parses, through `@import`. Emit `<link rel="preload" as="font" crossorigin>` from a small Vite `transformIndexHtml` plugin, and add `size-adjust`/`ascent-override` fallback faces | `src/ui/theme.css:1-3`; `vite.config.ts:23-51` | Fonts start at 886–976 ms (LH); the font is a CLS culprit (0.009); CLS 0.088 in Playwright | About 300–400 ms earlier text in the real font, and lower CLS. Optionally drop or subset Bricolage 800 (22 KB) |
| 5 | **Cache `Intl.DateTimeFormat` objects.** `formatDayKey` builds a new formatter on every call, and it runs on each AppShell render and in 8 TSX call sites. Hoist it to module scope; do the same in two screens | `src/core/time/formatDayKey.ts:6`; `src/ui/screens/EconomyScreens.tsx:62`; `src/ui/screens/Backup.tsx:123` | 64 ms self time in the cold-load profile at 4x CPU, the largest single app function | About 60 ms less main-thread time at startup, and less on each minute tick |
| 6 | **Make screens that Today does not show lazy.** `MeetCast`, `CourtyardScreen`, `StorybookList` and `StorybookScreen` are imported statically, but they are only routed at `you/cast`, `you/courtyard`, `you/stories` and `you/story/*`. Check which parts of `Storybook-*.js` (`Scene.tsx`) the Today courtyard banner needs, and split the rest | `src/ui/shell/AppShell.tsx:39,41-42` (routes at :161-164); `src/ui/shell/EconomyFeedback.tsx:17-18` (`Cast`, `sound`) | Storybook 10.7 KB gzip, Cast 7.6 KB, sound 5.6 KB, all modulepreloaded | Up to about 20 KB gzip and some evaluation off startup |
| 7 | **Scope `EconomyFeedback`'s live query.** It reads the whole `ledger`, `settings`, `tasks`, `sessions` and `puzzleRuns` tables on every DB write, plus a `learnConcepts.toArray()` whose result is thrown away. The ledger is append-only, so this cost grows with every day of use | `src/ui/shell/EconomyFeedback.tsx:31` | Not visible on an empty profile. It scales with data, and the ledger is never pruned by design | Keeps tap latency (INP) flat for long-time users. Read by day or index, and drop the unused `toArray()` |
| 8 | **Register the service worker after first idle, and remove the duplicate precache entries.** `registerSW({ immediate: true })` starts the 113-file install right after load, competing with the first taps on slow links. Wrap it in `requestIdleCallback`, or call it after the welcome screen. Remove the 4 duplicate entries by narrowing `globPatterns` or turning off manifest-icon inclusion | `src/main.tsx:20`; `src/platform/sw-register.ts:44-46`; `vite.config.ts:30` | 121 KB brotli of extra background download on the first visit; 117 entries for 113 URLs | Less network contention in the first seconds; a cleaner manifest. Offline readiness is unchanged once idle |
| 9 | **Merge the render-blocking CSS.** There are 5 stylesheets on the critical path (`guard`, `Cast`, `Storybook`, `index`, `economy`), and they come mostly from the eager imports in wins 1, 3 and 6. Once those are lazy, most of this CSS follows them | `src/ui/App.tsx:2-5`; `src/ui/shell/EconomyFeedback.tsx:19` (`economy.css`) | Lighthouse render-blocking saving 80 ms; 21 KB | About 80 ms on FCP |
| 10 | **Warm the Learn chunks when idle.** The first Learn-tab tap is the slowest interaction (88–112 ms event, 64–84 ms long task, 341–402 ms to render). The `preloadOnIdle` pattern already exists; apply it to `Learn` and `LearnDrop` after Today paints | `src/ui/shell/preloadOnIdle.ts:1`; used at `src/ui/night/NightDeck.tsx:53`; lazy imports at `src/ui/shell/AppShell.tsx:47` | Table 2c | First Learn tap closer to the 32–48 ms of later taps |

## Other notes

- **Opening animation.** `OpenMoment` shows for 1.1 s on every open unless reduced motion is on (`src/ui/cast/OpenMoment.tsx:15`).
  - On repeat visits, the app has painted underneath by about 0.6–0.8 s, so the animation is the slowest part of reaching a usable screen.
  - Ending it as soon as the shell is ready, or only on the first open of the day, is a product call. It is not a code bug.
- **Entry chunk.** react-dom is 207 KB raw and 73% of the entry chunk. No easy cut is possible without changing framework. `unused-javascript` reports 45% of the entry unused at load, which is normal for react-dom.
- **Chunk names.** Rolldown names some shared chunks after their first module, for example `jsx-runtime-*.js` (which is mostly Dexie) and `dist-*.js` (valibot, capacitor). The names are misleading but harmless.
- **Build warnings.** The build warns `COMMONJS_VARIABLE_IN_ESM` for `src/core/puzzles/puzzles.js:1393` and `src/core/mysteries/cases.js:1802`, and that `inlineDynamicImports` is deprecated (the SW build). Neither affects runtime.
- **Headers are good.** Brotli is on, hashed assets are `immutable`, `sw.js` and `index.html` are `no-cache`, TTFB is 66 ms, and there are no third-party requests.

## Limits of this audit

- Lighthouse throttling is simulated (Lantern). Playwright throttling is applied with CDP to the page target only, so service-worker fetches were not throttled.
- The machine was shared with another browser job; see the benchmarkIndex column.
- All runs used a fresh empty profile. A long-time user with a large ledger was not simulated (see win 7).
- No real Android device was tested. A Capacitor WebView loads from local files, so the network items (wins 1, 3, 4, 8) matter less there, but the parse and CPU items still apply.
