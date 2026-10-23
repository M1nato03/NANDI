# A year of data on a slow phone, after day-close and perf fixes 1-5 (cloud job 8, batch 3)

Branch measured: `origin/ship-32` @ `dab36b3`. It contains `efdcb58` (perf fixes 1-5) and the day-close merges.
Report branch: `ideas/cj3-heavy-data`. Date: 23 Oct 2026. No app code was changed.
The job text says "file:line on ship-31". Every file:line below is on **ship-32** (`dab36b3`), the build measured here.
This repeats `ideas/cj2-heavy-data` (ship-27 @ `b17ec40`) with the same generator, measurement script, sizes, throttle, viewport, run count and medians.
Scripts, backups and profiles stayed in `/tmp/cj3/job8-scratch`. The key code is at the end.

## Headline

- **Perf fixes 1, 2, 4 and 5 worked.**
  - At 365 days, idle Plan went from ~100% busy (cj2) to **3%**.
  - Ticking a task shows the done row in **4.6 s** (cj2: 9.0 s).
  - A Learn answer leaves **2.6 s** of main-thread work (cj2: 4.7 s).
  - Cold-open work in the first 20 s halved (13.0 s to 6.3 s).
- **Restore from a backup got 18x slower.** A 365-day backup now takes **212.6 s** to restore at 6x CPU. The ship-27 control took 11.7 s on the same machine at the same load.
  - Cause: `src/data/backup/index.ts:242` writes each day-close row with its own `settings.put`, one transaction per row (364 rows at 365 days).
  - Each commit wakes every live query. The 365-day restore triggered **756 whole-ledger reads**.
  - I tested a one-line `bulkPut` in a scratch build. It brought the restore back to **14.1 s**, with the same rows restored. This needs a fix before release, because restoring onto a new phone is exactly when someone has a year of data.
- **What did not move:**
  - Every write still re-reads whole tables in 6 or more live queries (cj2 cause 6). After one task tap at 365 days: 7 whole-ledger reads, 10 tasks reads, 9 settings reads.
  - The economy is still replayed from day one 3 to 6 times per action (cause 8).
  - Day-close made each replay about **33% heavier** at 365 days (12.2 ms to 16.2 ms in Node). It did not make it shorter.
  - Opening You is about 11% slower than the ship-27 control.
  - Cold open at 180 days is about 1.3-1.5 s slower than the control.

## Setup (what was measured, and how)

| Item | Value |
|---|---|
| Build | `npm ci && npm run build` on ship-32, served by `npx vite preview --port 5408 --strictPort` (production `dist/`, service worker active) |
| Source-mapped build | `vite build --sourcemap` to `/tmp/cj3/job8-scratch/dist-prof` (+ `dist/packs`), served on port 5438 for profiles and call counts |
| Control | The ship-27 build from cj2 (`/tmp/cj2/job9/dist`, `b17ec40`), served on port 5438. It had its own backups, generated with the ship-27 repos by the same generator, today, in the same time zone. |
| Browser | Playwright 1.63, Chromium build 1194 (`/opt/pw-browsers/chromium-1194`), headless (same as cj2) |
| Device | 360x780, `isMobile`, `hasTouch`, DPR 2, locale en-IN (same) |
| Throttle | CDP `Emulation.setCPUThrottlingRate {rate: 6}`, set before navigation (same) |
| Seeding | A backup made by the app's own repos (cj2 generator, unchanged except paths and `TODAY`), restored through the in-app restore picker (same) |
| Steps per run | Fresh copy of the seeded profile, then: cold open, idle 8 s, tick a task, Learn tab, open drop, answer, Next, Back, You, Plan (same) |
| Runs | ship-32: **7 runs** per size in pass 1 (sizes interleaved, as cj2). Then 4 more per size (pass 2), interleaved one-for-one with 4 ship-27 control runs. |
| Machine load | 1-min load **0.94 to 1.74** on 4 CPUs for every timed browser run (cj2: 0.83 to 1.81), listed below |

**One deliberate change: time zone and date.**
- cj2 used `Pacific/Honolulu` so the session ran in local morning (07:49-08:36), away from the shutdown and night routes.
- This session ran 07:41-09:20 UTC, which is 21:41-23:20 in Honolulu. That is the shutdown window and bedtime, where the app takes different routes.
- So I used **`Africa/Abidjan`** (UTC+0, no DST) for both the generator and the browser. Local time was 07:41-09:20, the same morning window as cj2.
- `TODAY` was 2026-10-23 (cj2: 2026-10-22). Everything else is identical.
- The ship-27 control used the same zone and date, so any time-zone effect cancels out between control and ship-32.

**Load, per run (1-min average when the run started):**
- Pass 1, ship-32 (07:41-08:13 UTC):
  - 30 days: 1.11, 1.53, 1.41, 1.33, 1.35, 1.48, 1.22
  - 180 days: 1.42, 1.37, 1.28, 1.08, 1.35, 1.13, 1.12
  - 365 days: 1.25, 1.08, 1.26, 1.21, 1.50, 1.27, 1.34
- Pass 2, A/B interleaved, ship-27 / ship-32 (08:22-08:59 UTC):
  - 30 days: 1.26/1.34, 1.39/1.74, 1.18/1.10, 1.49/1.06
  - 180 days: 1.12/0.99, 1.36/1.21, 1.60/0.97, 1.23/1.50
  - 365 days: 1.12/1.20, 1.01/0.93, 1.00/1.15, 1.52/1.43
- Other jobs pushed the load to 4.8-8.4 at the start of this session (07:04-07:25).
  - Only the first seeding restores and a first Node bench ran then. All of those were re-run below load 2.
  - The high-load values are kept only where marked.
  - The restore profile is the one exception: it ran at load 5.5 falling to 2.9. I use it for shares, not latency.

### Data sizes (generated, then restored)

Same "realistic use" generator as cj2 (90% of days used, 4-6 tasks, Mon/Wed/Fri workouts, daily drop on 85% of days, board on 60%, a shop purchase every 12 days, `reconcileGamify` at day end).
The counts differ a little from cj2. The calendar moved by one day, and ship-32's Learn engine and economy write slightly different facts.

| | 30 days (cj2 → cj3) | 180 days | 365 days |
|---|---|---|---|
| ledger facts | 415 → 388 | 2,226 → 2,324 | 4,719 → 4,454 |
| tasks / taskEvents / focus | 127/329/68 → 137/369/72 | 808/2,239/439 → 859/2,409/481 | 1,647/4,648/901 → 1,642/4,642/897 |
| sessions / sets | 10/210 → 8/168 | 47/963 → 57/1,143 | 116/2,370 → 113/2,289 |
| puzzleRuns / learnDrops / dailyLog | 13/24/25 → 15/23/25 | 102/128/157 → 101/139/169 | 180/287/320 → 187/266/317 |
| **settings rows** (of which day closes) | ~10 → **39 (28)** | ~10 → **191 (179)** | ~10 → **376 (364)** |
| Backup file | 0.45 → 0.43 MB | 2.4 → 2.6 MB | 5.1 → 5.0 MB |
| JSON size of all rows after restore | 0.40 → 0.39 MB | 2.16 → 2.35 MB | 4.54 → 4.50 MB |
| IndexedDB on disk (`du`), after the in-app restore | 2.2 → 2.2 MB | 7.9 → 11.7 MB | 14.9 → **23.0 MB** |
| same, after a restore with the `bulkPut` fix (scratch build) | | 11.0 MB | 16.0 MB |
| `navigator.storage.estimate().usage` | 4.6 → 4.9 MB | 10.4 → 14.5 MB | 17.4 → 25.8 MB |

- On-disk size depends on when LevelDB compacts, so treat it as rough.
- With the fix, 365 days was 16.0 MB on disk (ship-27 control: 14.4 MB). At 180 days it was 11.0 MB (control: 5.3 MB).

### Restore via the picker, at 6x (one run each)

| | 30 days | 180 days | 365 days | load |
|---|---|---|---|---|
| cj2 (ship-27, 22 Oct) | 3.6 s | 8.8 s | 14.1 s | 1.4-2.3 |
| ship-27 control (today) | 3.0 s | 7.6 s | 11.7 s | 0.88-1.14 |
| **ship-32** | **6.1 s** | **58.4 s** | **212.6 s** | 0.79-1.37 |
| ship-32 + `bulkPut` at backup/index.ts:242 (scratch build, not committed) | – | 7.7 s | 14.1 s | 0.77-1.11 |

- The first ship-32 restores ran at load 5.9-8. They took 58.6 s (180 days) and 169 s (365 days), the same order as the low-load re-run.
- I compared the scratch-build restore with the normal ship-32 restore. Both gave the same row counts and JSON bytes for ledger (4,454 / 1,340,615), settings (378 / 93,421) and tasks (1,642 / 773,264).

## Results, side by side with cj2 (6x throttle, medians of 7 runs, [min–max], ms)

"Visible" runs from the real tap (`pointerdown.timeStamp`) to the DOM change a person sees. "Main-thread work" is the total of long tasks (≥ 50 ms) in the 8 s after the tap; for cold open it is the 20 s after navigation. INP is the Event Timing duration of the tap. Same definitions as cj2.

cj3 = ship-32, pass 1 (7 runs).

| Step | 30 d cj2 → cj3 | 180 d cj2 → cj3 | 365 d cj2 (ship-27) | 365 d cj3 (ship-32) | 365 cj3 / cj2 |
|---|---|---|---|---|---|
| Cold open: shell painted (tab bar) | 2,358 → 1,856 | 2,428 → 1,838 | 2,241 [2,034–2,552] | 2,018 [1,554–2,141] | 0.90x |
| **Cold open: Today tasks visible** | 5,366 → 3,860 | 6,130 → 6,156 | 7,948 [6,694–8,480] | 5,943 [5,013–6,416] | 0.75x |
| Cold open: main-thread work in first 20 s | 3,943 → 1,912 | 8,864 → 3,413 | 12,995 [11,868–13,819] | 6,299 [5,146–6,680] | 0.48x |
| **Idle on Plan: main thread busy** (%) | 8 → 2 | 21 → 3 | ~100 [94–101] | **3** [2–9] | 0.03x |
| Idle on Plan: longest long task in 3 s | 92 → 0 | 162 → 0 | 467 [345–682] | 0 [0–156] | – |
| Tick a task: tap INP | 232 → 184 | 312 → 256 | 528 [416–1,032] | 296 [240–344] | 0.56x |
| Tick a task: finish toast appears | 1,111 → 894 | 2,151 → 1,687 | 4,814 [3,941–5,548] | 2,399 [2,201–2,899] | 0.50x |
| **Tick a task: row shows done** | 2,176 → 1,837 | 4,092 → 3,175 | 8,974 [7,210–12,008] | **4,557** [4,280–4,975] | 0.51x |
| Tick a task: main-thread work | 1,292 → 642 | 3,727 → 2,171 | 5,580 [5,143–6,188] | 3,591 [3,356–4,037] | 0.64x |
| Learn tab: Today card visible | 980 → 788 | 1,424 → 1,017 | 3,332 [2,019–4,767] | 1,418 [1,200–1,691] | 0.43x |
| Open today's drop: question visible | 384 → 271 | 558 → 449 | 838 [770–1,131] | 703 [594–1,085] | 0.84x |
| **Answer (Check): feedback visible** | 101 → 97 | 111 → 91 | 135 [104–624] | 92 [76–124] | 0.68x |
| **Answer: main-thread work after the tap** | 475 → 224 | 2,136 → 1,343 | 4,657 [4,044–5,084] | **2,618** [2,163–3,278] | 0.56x |
| Answer: last long task ≥ 100 ms ends | 777 → 99 | 5,990 → 2,860 | 8,163 [7,301–8,512] | 4,474 [4,113–5,731] | 0.55x |
| Next question visible | 769 → 502 | 1,660 → 955 | 3,224 [2,695–5,841] | 1,716 [1,512–1,786] | 0.53x |
| **Open You: week numbers visible** | 819 → 720 | 1,414 → 1,292 | 2,234 [1,973–2,471] | 1,925 [1,626–2,145] | 0.86x |
| Open You: main-thread work | 452 → 263 | 1,032 → 861 | 1,905 [1,700–2,137] | 1,653 [1,387–1,978] | 0.87x |
| Back to Plan: screen swapped | 84 → 61 | 100 → 65 | 90 [70–113] | 71 [38–117] | 0.79x |
| Back to Plan: main-thread work in 8 s | 937 → 303 | 2,014 → 545 | 3,496 [3,097–4,789] | 811 [682–895] | 0.23x |

**This table overstates the gains a little.**
- The same ship-27 build measured today (next table) was already 10-30% faster than in cj2 on load-independent steps. One example: tick a task at 365 days took 6.1 s, against 9.0 s in cj2.
- Its idle Plan at 365 days was 32% busy, not ~100%.
- The Node timings of the same functions match cj2 (for example `chooseNowTask` 29.4 ms against 27.5 ms). So the browser path changed, not the CPU.
  - I did not find the cause. It may be the shifted calendar, the morning route in another zone, or Chrome or disk state on the host.
  - cj2's 100% may also have included cold-open work still running at the 20 s mark. cj2 reported that the cold open never went quiet at 365 days.
- For "what got better or worse", use the control table.

## Same-day A/B: ship-27 control vs ship-32 (4 runs each, interleaved, medians [min–max], ms)

| Step | 30 d ship-27 → ship-32 | 180 d ship-27 → ship-32 | 365 d ship-27 | 365 d ship-32 | 365 32 / 27 |
|---|---|---|---|---|---|
| Cold open: shell painted (tab bar) | 1,934 → 2,003 | 1,738 → 1,837 | 2,030 [1,584–2,467] | 1,925 [1,684–2,099] | 0.95x |
| **Cold open: Today tasks visible** | 3,900 → 4,017 | **4,448 → 5,754** | 6,460 [5,673–7,092] | 6,540 [5,560–8,424] | 1.01x |
| Cold open: main-thread work in first 20 s | 2,654 → 2,068 | 6,856 → 3,618 | 12,038 [11,169–13,051] | 6,653 [5,438–7,126] | 0.55x |
| **Idle on Plan: main thread busy** (%) | 6 → 1 | 16 → 4 | 32 [25–56] | 5 [3–7] | 0.16x |
| Idle on Plan: longest long task in 3 s | 56 → 0 | 152 → 0 | 346 [273–357] | 0 [0–0] | – |
| Tick a task: tap INP | 172 → 176 | 232 → 268 | 400 [312–528] | 260 [232–280] | 0.65x |
| Tick a task: finish toast appears | 868 → 860 | 1,694 → 1,792 | 3,093 [2,619–3,905] | 2,483 [2,277–2,614] | 0.80x |
| **Tick a task: row shows done** | 1,960 → 1,884 | 3,057 → 3,301 | 6,121 [5,938–6,348] | 4,542 [4,248–4,862] | 0.74x |
| Tick a task: main-thread work | 688 → 644 | 3,486 → 2,266 | 4,963 [4,812–5,304] | 3,600 [3,483–3,989] | 0.73x |
| Learn tab: Today card visible | 836 → 820 | 1,114 → 1,122 | 1,490 [1,184–1,660] | 1,703 [1,555–1,864] | 1.14x |
| Open today's drop: question visible | 272 → 342 | 424 → 504 | 712 [640–917] | 750 [552–1,030] | 1.05x |
| **Answer (Check): feedback visible** | 83 → 77 | 82 → 104 | 82 [54–137] | 104 [70–153] | 1.25x |
| **Answer: main-thread work after the tap** | 326 → 212 | 1,830 → 1,320 | 3,605 [3,427–3,864] | 2,746 [2,611–3,438] | 0.76x |
| Answer: last long task ≥ 100 ms ends | 96 → 77 | 5,498 → 2,866 | 6,232 [5,813–7,128] | 4,828 [4,430–5,809] | 0.77x |
| Next question visible | 598 → 446 | 1,370 → 1,137 | 1,887 [1,730–2,170] | 1,668 [1,555–2,079] | 0.88x |
| **Open You: week numbers visible** | 780 → 749 | 1,153 → 1,321 | 1,734 [1,579–1,780] | 1,963 [1,779–2,354] | 1.13x |
| Open You: main-thread work | 272 → 272 | 708 → 938 | 1,436 [1,252–1,498] | 1,670 [1,420–2,171] | 1.16x |
| Back to Plan: screen swapped | 52 → 54 | 65 → 67 | 52 [31–64] | 70 [55–88] | 1.34x |
| Back to Plan: main-thread work in 8 s | 422 → 363 | 1,696 → 562 | 2,862 [2,451–3,159] | 970 [890–1,036] | 0.34x |

With 4 runs, a difference under about 15% is within noise. The Learn tab (1.14x) and feedback (1.25x) rows are examples: pass 1 measured 1,418 and 92 ms for ship-32 at 365 days, both at or below the control.

### What got better, and what got worse (ship-32 vs the same-day ship-27 control)

Better:
- **Idle Plan**: 32% to 5% busy at 365 days, and no long tasks. The 65 s idle profile has 2 long tasks (238 and 140 ms); cj2's had 76 long tasks totalling 29.5 s.
- **Tick a task at 365 days**: the row shows done 26% sooner (6.1 s to 4.5 s), with 27% less work.
- **Learn answer cascade at 365 days**: 24% less work (3.6 s to 2.7 s). The Next question shows 12% sooner.
- **Cold-open work**: about half at 180 and 365 days. **Back to Plan** work fell by 66-67%.

Same:
- Shell paint, cold open to Today at 30 and 365 days, the Learn tab, opening the drop, answer feedback (~0.1 s), and tab swaps (< 0.1 s).

Worse:
- **Restore**: 18x slower at 365 days and 7.7x at 180 days (table above).
- **Cold open to Today at 180 days**: +1.3 s (4,448 to 5,754 ms in pass 2; pass 1 median 6,156). The ranges do not overlap: ship-27 max 4,918, ship-32 min 5,029.
  - Main-thread work before the mark rose only about 0.5 s (about 1.7-2.0 s to 2.1-2.8 s). So most of the delay is waiting, not CPU. I did not trace it to the root.
  - The likely cause is the one readwrite transaction in `reconcileGamify` (`src/data/repos/gamify.ts:37`). It spans ledger, learnDrops, learnConcepts, dailyLog and settings, and now runs two full replays inside it (`:67` deriveEconomy, `:89` closesFor). That holds those stores while readers wait.
  - At 365 days this is hidden, because ship-27's quadratic Now pick was slower still.
- **Open You**: +11-13% visible and +16% work at 365 days. Each replay is heavier with the close rows (cause 8), and You runs 3 of them.

## cj2's causes 1-8 on ship-32

Node timings are unthrottled medians on the generated data. "ship-27 code" is the cj2 worktree run on today's ship-27 data; "ship-32 code" is this build on its own data (09:00 UTC, load 0.8). The micro-bench at 09:14 (load 0.4-0.5) used 41 runs.

| # | cj2 cause | Status on ship-32 | By how much (measured) | file:line on ship-32 |
|---|---|---|---|---|
| 1 | Quadratic Now-task pick, run every second | **Fixed** | `chooseNowTask` 365 d: 29.4 ms (ship-27 code) → **0.23 ms**. The old form on ship-32's data takes 31.2 ms. It no longer appears in any profile. | `src/core/tasks/complete.ts:14-24` (parents `Set` at :17, `dayKey` hoisted at :18); called from `src/ui/screens/Plan.tsx:63` |
| 2 | The 1 s clock re-renders all of Plan | **Fixed** (the derived lists are still not memoised) | Idle Plan 365 d: 32% → 5% (control), ~100% → 3% (cj2). Plan now renders once a minute when no timer runs. | `src/ui/tasks/useTaskBoard.ts:20-37` (the minute gate is at :27-28). The lists are still recomputed on each render: `Plan.tsx:46-48`, `:63-64`, `:74` |
| 3 | EconomyFeedback reads whole tables and derives twice on every change | **Partly fixed** | It returns early before the two derives when no fact was added, and reconciles only when facts or the drop changed. Any action that adds a fact still pays both derives: precise coverage after one task tap counted 2 EconomyFeedback derives. The query still reads 7 tables on every change, including every settings write. | Query `src/ui/shell/EconomyFeedback.tsx:33`; signature and reconcile `:71-72`; early return `:123`; the two derives `:124-125` |
| 4 | `reconcileGamify` does full scans on every write | **Partly fixed, and net CPU about the same** | The badge loop: 18.6 → **1.8 ms** at 365 d. Bursts are coalesced into one run plus one queued run. But each run now also calls `closesFor`, a second full replay (14.9-15.7 ms at 365 d). CPU per run is about 33 ms (ship-27: derive 14 + badges 18.6) against about 34 ms (ship-32: derive 16 + closes 15.7 + badges 1.8). All of it runs inside a readwrite transaction over 5 stores. | Whole ledger `src/data/repos/gamify.ts:43`; settings read twice `:66`, `:83`; replays `:67`, `:89`; badges once `:78`; coalescing `:22-28`; transaction scope `:37` |
| 5 | The app-time write every minute triggers the whole cascade in idle | **Fixed** | Written every 5 min, on hide and at the day roll. The 65 s idle profile at 365 d: 3.8 s busy (6%) against 34.6 s (52%) in cj2. No write landed in that window. | `src/ui/shell/useForegroundMinutes.ts:20-24`, `:36-38` |
| 6 | Several always-mounted readers load the same whole tables | **Not fixed** | Whole-table reads in the 8 s after one task tap at 365 d (one run each): ledger 4 → **7**, tasks 6 → 10, settings 3 → 9, sessions 5 → 8. Dexie code is 24-37% of busy time in the 365-day cold, tap and Learn profiles; "(program)", mostly native IDB and engine time, is another 32-35%. Settings now holds a row per day, and at least 7 live queries read it whole. | `src/ui/shell/TodayDots.tsx:21-28`; `src/ui/courtyard/Courtyard.tsx:24-28`; `src/ui/screens/Plan.tsx:42-44` (all `taskEvents`, 4,642 rows); **also `src/platform/reminderSync.ts:76`**, a liveQuery over tasks, sessions, settings, dailyLog and the whole ledger that reruns `reconcileReminders` (`:35-37`) on every change. cj2 missed it; it is the same on ship-27. |
| 7 | You and Learn re-read and re-derive | **Not fixed** (You slightly worse) | You at 365 d: 1,734 → 1,963 ms visible, 1,436 → 1,670 ms work. Profile: `useEconomy` → `deriveEconomy` 0.57 s inclusive, `hexagon` 0.29 s. `DailyQuests` rendered 7 times in the 9 s You window (1 s timer). | `src/ui/screens/You.tsx:16-20`; `src/ui/screens/EconomyScreens.tsx:21-23` (derive on every render); `src/ui/screens/HexagonCard.tsx:16-20` and `src/core/hexagon.ts:92`; `src/ui/screens/GamifyScreens.tsx:11-13`; `src/ui/screens/Learn.tsx:33-41`; `src/ui/learn/LearnDrop.tsx:36-47` |
| 8 | `deriveEconomy` is linear but heavy, and runs 3-5 times per action | **Not fixed, now heavier** | Day-close did not make it near-constant: it still sorts and replays every fact from day one. 365 d: **16.2 ms** with the 364 close rows, against 12.2 ms with them removed (+33%). 180 d: 13.7 against 7.2 ms (+90%). About 1.8 ms of that is the `value()` lookups (passing settings as a Record gives 14.4 ms); the rest is close handling. Full replays per window at 365 d (precise coverage, `replayEconomy` calls): cold open 3 (2 deriveEconomy + 1 `closesFor`), task tap 4 (2 EconomyFeedback derives, 1 reconcile derive, 1 `closesFor`), Learn tab → answer → next 6 (4 + 2 `closesFor`), You 3. | Sort `src/core/economy/deriveEconomy.ts:312`; day loop `:343`; `value()` scans the settings array `:179-181`, called for every day through `restWeekdayFor` `:330-337` (used at `:410`, `:478`): 2,944 calls and 1.1 M `find` callbacks in one task tap; `readCloses` `:159-171`; `withClosedPurchases` `:198-212`; `shardFloors` `:218-237`; look-ahead replay `:257-260` |

New findings that were not in cj2:

1. **Restore 18x slower: one transaction per close row.**
   - `src/data/backup/index.ts:242`: `for (const [day, value] of mergeCloseMaps(...)) await db.settings.put(...)`.
   - IDB counters during a 365-day restore:
     - 367 readwrite transactions on settings.
     - The live queries re-ran with 756 ledger, 1,127 tasks, 1,138 sessions and 1,494 settings readonly transactions.
   - Fix: one `db.settings.bulkPut(rows)`. Verified in a scratch build:
     - 365 d: 212.6 s → 14.1 s. 180 d: 58.4 s → 7.7 s.
     - Settings readwrite transactions 367 → 5, ledger reads 756 → 30.
     - The same rows were restored.
   - It would help further to pause or debounce the always-mounted live queries during a restore (`restoreActive()` already exists in `src/data/restoreLock.ts`).
2. **The settings table grows by one row a day, and many queries read it whole.**
   - At 365 days there are 376 rows, 364 of them `economy.close:*`.
   - Every whole-settings reader and every `value()` lookup scans them.
   - The rows are small (93 KB at 365 days), but they are read about 9 times per task tap.
3. **On Android only (not measured on the web):**
   - `reconcileNudges` (`src/platform/nudgeSync.ts:12-15`) runs on every change through `startReminderSync` (`src/platform/reminderSync.ts:73-76`).
   - Each run reads settings, tasks, dailyLog, the whole ledger and reminders. It then calls `deriveEconomy` once more (`src/core/nudges.ts:34`).
   - On the web build it returns at `nudgeSync.ts:13`, so the numbers above miss one more replay plus five whole-table reads per write on the phone. That is an **estimate**: on Android, each action costs more than measured here.

## Profiles of the 3 slowest steps at 365 days

Method:
- One run of the source-mapped build on port 5438 with the CDP sampling profiler (500 µs) around each step. Same scripts as cj2.
- Self time is grouped by bucket (`buckets.mjs`). Inclusive time is by original `src/` file:line (`analyze-prof.mjs` from cj2).
- Call counts come from a separate run with CDP precise coverage (`callCount: true`), mapped through the source maps (`cov.mjs`).
- Profiling adds overhead: the profiled cold open showed Today at 7.1 s against an unprofiled median of 5.9-6.5 s. Use these as shares.

The three slowest steps by visible latency are: restore (212.6 s), cold open to Today (6.2 s) and tick a task to the done row (4.6 s). The Learn answer cascade (2.6 s of work) is added because it was a headline in cj2.

| Window (365 d) | Busy | Self time by bucket | Top `src/` inclusive | Call counts and IDB reads |
|---|---|---|---|---|
| **Restore** (07:16, load 5.5 → 2.9) | 190.1 s of 191.6 s | Dexie 65%, (program) 16%, native 9%, app 7%, GC 2% | EconomyFeedback query (`EconomyFeedback.tsx:33`) **53.6 s**; its effect (`:67`) 5.2 s; `reconcileReminders` 3.7 s; `todayDotStatus` 3.1 s; `importBackup` 0.5 s | 367 settings readwrite transactions; 756 ledger, 1,127 tasks, 1,138 sessions and 1,494 settings readonly transactions |
| **Cold open**, 20 s (09:02, load 0.9) | 15.8 s | Dexie 37%, (program) 32%, app 14%, React 7%, GC 4% | Replays (`replayWithCloses`) 0.90 s; `reconcileGamify` transaction body (`gamify.ts:37`) 0.66 s; EconomyFeedback query 0.56 s and effect 0.52 s; Plan render 0.38 s; pack parse (`seed.ts:5`) 0.25 s; `closesFor` 0.23 s | deriveEconomy 2, replayEconomy 3, closesFor 1, reconcileGamify 1. Whole-table reads: ledger 13, tasks 17, settings 29, sessions 15, dailyLog 10 |
| **Tick a task**, 9 s | 8.9 s | (program) 35%, Dexie 24%, app 21%, native 11%, React 6% | Replays 1.15 s (4 replays); reconcile transaction 0.69 s; EconomyFeedback effect 0.68 s, of which its two derives are most; Plan render 0.20 s; TaskList 0.10 s. `chooseNowTask` is gone | deriveEconomy 3, replayEconomy 4, closesFor 1, reconcileGamify 1. Reads: ledger 7, tasks 10, settings 9, sessions 8, dailyLog 5 |
| Learn tab → drop → answer → next, 37 s | 14.0 s | (program) 32%, Dexie 29%, app 18%, native 12%, React 5% | Replays 1.38 s; reconcile transaction 1.20 s; `closesFor` 0.59 s; EconomyFeedback effect 0.47 s; Learn query 0.43 s; Mind 0.39 s; LearnDrop query 0.20 s; TodayDots query 0.17 s | deriveEconomy 4, replayEconomy 6, closesFor 2, reconcileGamify 2. Reads: ledger 22, tasks 17, settings 36, learnDrops 25 |
| Open You, 9 s (for reference) | 3.9 s | (program) 38%, app 27%, Dexie 19%, GC 8% | `YourSeason` → `useEconomy` → deriveEconomy 0.62 s; HexagonCard → `hexagon` 0.31 s | deriveEconomy 3, `hexagon` 1, DailyQuests 7 renders |
| Idle on Plan, 65 s (for reference) | 3.8 s (6%) | (program) 71%, GC 9% | Plan render 0.10 s, Courtyard 0.04 s, the 15 s foreground tick 0.03 s | 2 long tasks (238, 140 ms) |

What the profiles say:
- With the quadratic pick gone, a task tap or an answer now costs about:
  - **whole-table reads by the live queries**: Dexie plus native IDB and "(program)", about 60% of busy time;
  - **3 to 6 full economy replays**: 0.9-1.4 s inclusive per window in the profiled runs;
  - **a reconcile that holds a readwrite transaction** while it does two of those replays.
- Fix order, by expected gain (an **estimate**, not measured, except item 1):
  1. `bulkPut` the closes in restore (measured: 15x on restore).
  2. One shared economy source that derives once per change and is read by EconomyFeedback, YourSeason, HexagonCard, DailyQuests and TodayDots. It cuts 3-6 replays and 3-5 whole-ledger reads per action to 1.
  3. Narrow the always-mounted queries to today's rows: `ledger.where('dayKey').equals(today)` in TodayDots, and events loaded inside `TaskDetail`. Give reminderSync a narrower trigger.
  4. Compute `closesFor` and `deriveEconomy` outside the readwrite transaction in `reconcileGamify`, and write only the result inside it.
  5. Build a `Map` from settings once per replay instead of `value()` scans. Or replay only days after the latest close: the closes exist now, so a replay could start from the last close instead of day one. That is what cj2 hoped day-close would do.

## Caveats

- **Synthetic data.** Same caveats as cj2. Unfinished tasks drift to `someday` (505 of 1,642 at 365 days). There are no Mind mysteries or deck cards, and the Season (2 Nov) is not active yet.
- **Not a phone.** Headless desktop Chromium at 6x on a shared 4-CPU server. Trust the trends and the ratios against the same-day control; treat the absolute ms as indicative.
- **cj2 vs today.** The same ship-27 build ran 10-30% faster today on several steps, and idle Plan at 365 days measured 32%, not ~100%. Both tables are given. Conclusions use the same-day control.
- **Time zone and date.** Africa/Abidjan on 23 Oct instead of Pacific/Honolulu on 22 Oct. The reason is above; the control uses the same.
- **Small control.** 4 control runs per size. Differences under about 15% are within noise.
- **Load.** Every timed browser run, the Node benches and the restores in the tables ran at 1-min load 0.36-1.74. The restore profile ran at load 5.5 → 2.9 and is used for shares only. The first seeding restores and the first Node bench ran at 4.8-8.4 and were replaced.
- **Bucket names.** "(program)" is V8's bucket for time with no JS frame (IDB value cloning, engine work, profiler overhead). It is large in every window here, as it was in cj2.

## How to re-run

```bash
git -C /home/user/NANDI worktree add --no-track -b tmp-heavy /tmp/cj3/job8 origin/ship-32 && cd /tmp/cj3/job8
npm ci && npm run build && npx vite preview --port 5408 --strictPort &
# 1. Backups with the app's own repos (cj2 gen.test.ts; only paths and TODAY changed)
for d in 30 180 365; do TZ=Africa/Abidjan DAYS=$d OUT=/tmp/cj3/job8-scratch/tzA/backup-${d}d.json \
  npx vitest run --config /tmp/cj3/job8-scratch/gen/vitest.gen.config.mts; done
# 2. Seed via the in-app restore picker (prints restore time), then 7 interleaved rounds
cd /tmp/cj3/job8-scratch
for d in 30 180 365; do TZID=Africa/Abidjan TAG=tzA node measure.mjs seed $d 5408; done
TZID=Africa/Abidjan TAG=tzA ./pass.sh p1 7 5408 30 180 365      # one run per size per round, uptime logged
# 3. Same-day control: ship-27 dist on 5438 with ship-27-generated backups (gen27/), then the interleaved A/B
./pass-ab.sh 4 && python3 mdtable.py
# 4. Profiles, call counts and IDB counters (source-mapped build on 5438)
npx vite build --sourcemap --outDir /tmp/cj3/job8-scratch/dist-prof --emptyOutDir && cp -r dist/packs /tmp/cj3/job8-scratch/dist-prof/
TZID=Africa/Abidjan TAG=tzA node measure.mjs profile 365 5438     # prof-tzA-365-{cold,idle65,task,learn,you}.cpuprofile
TZID=Africa/Abidjan TAG=tzA node measure.mjs count 365 5438       # precise-coverage call counts per step
COUNT=1 TZID=Africa/Abidjan TAG=tzA node measure.mjs run 365 1 5408   # IDB transaction counters per step
PROFILE_RESTORE=1 COUNT=1 TZID=Africa/Abidjan TAG=tzAc node measure.mjs seed 365 5408
node buckets.mjs results/prof-tzA-365-task.cpuprofile; node analyze-prof.mjs results/prof-tzA-365-task.cpuprofile 25
node cov.mjs results/cov-tzA-365-task.json 'deriveEconomy.ts:(249|289|307)$'
```

The generator, `measure.mjs`, `summarize.py` and `analyze-prof.mjs` are cj2's, unchanged except for these additions to `measure.mjs`:

```js
const TZID = process.env.TZID ?? 'Pacific/Honolulu';          // browser zone (cj2 hard-coded Honolulu)
const TAG = process.env.TAG ?? 'tzA';                          // backup folder + seed profile name
// COUNT=1: count IndexedDB transactions per store set, per step (reset before each step's tap)
const COUNT = () => {
  const c = window.__idb = { rw: {}, ro: {}, getAll: {}, put: {} };
  const tx = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (names, mode, ...rest) { const k = [].concat(names).sort().join('+');
    const b = mode === 'readwrite' ? c.rw : c.ro; b[k] = (b[k] ?? 0) + 1; return tx.call(this, names, mode, ...rest); };
  // getAll and put wrapped the same way
};
// mode 'count': exact call counts per step with V8 precise coverage
await cdp.send('Profiler.enable'); await cdp.send('Profiler.startPreciseCoverage', { callCount: true, detailed: false });
await cdp.send('Profiler.takePreciseCoverage');               // reset just before the step
const { result } = await cdp.send('Profiler.takePreciseCoverage');   // counts for the step window
// PROFILE_RESTORE=1: Profiler.start before the "Confirm restore" click, stop at "Restore complete"
```

`cov.mjs` (core):

```js
for (const s of scripts) {                       // coverage result, one entry per script
  const text = readFileSync(`${DIR}/${name}`, 'utf8'), sm = new SourceMapConsumer(JSON.parse(readFileSync(`${DIR}/${name}.map`, 'utf8')));
  for (const f of s.functions) { const r = f.ranges[0]; if (!r.count) continue;
    const o = sm.originalPositionFor(lineColOf(text, r.startOffset));   // offset → line/col → src file:line
    counts[`${f.functionName || o.name} ${o.source}:${o.line}`] += r.count; } }
```

`buckets.mjs` (core): each sample's self time goes to idle, (program), GC, Dexie, React, app `src/`, other JS or native, by the source-mapped file of its frame.

Micro-bench (`gen/micro.test.ts`, vitest with jsdom, median of 41 runs after 3 warm-ups):

```ts
r.derive_array      = time(() => deriveEconomy(facts, undefined, settings, TODAY));      // 16.17 ms at 365 d
r.derive_record     = time(() => deriveEconomy(facts, undefined, record, TODAY));        // 14.42 (settings as { key: value })
r.derive_noCloseRows = time(() => deriveEconomy(facts, undefined, noClose, TODAY));      // 12.21 (economy.close:* removed)
r.closesFor_array   = time(() => closesFor(facts, settings, TODAY));                     // 15.66
```

The restore check used this one-line change in a scratch build. It was not committed:

```ts
// src/data/backup/index.ts:242
if (template) await db.settings.bulkPut([...mergeCloseMaps(asMap(restoredCloses), asMap(closes))].map(([day, value]) => ({ ...template, key: closeKey(day), value })));
```

Raw outputs are in `/tmp/cj3/job8-scratch/results/` and were not committed:
- `p1-*.jsonl`, `p2-*.jsonl`, `c27-*.jsonl`, `p1.load`, `ab.load`
- `seed-*.json`, `restore-idb-counts-*.json`, `idbcount*-365.json`
- `bench27.json`, `bench32-low.json`, `micro.json`
- `prof-tzA-*.cpuprofile`, `cov-tzA-365-*.json`, `tables.md`
