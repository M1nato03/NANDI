# cj2 job 2 · Day-close: the Shard bug, the restore race, and the cost

Branch tested: `origin/day-close` at `04796f7` ("Day close: purchases keep their stored price; Web Lock across tabs").
Compared with: `origin/ship-27` at `b17ec40`. Pre-fix check: `1f7767b` (the commit before `51ff25c`, which changed `mergeClose`).
Run on 22 Oct 2026 (container date), Node v22.22.0 (`package.json` asks for Node >= 24; `npm ci` warned EBADENGINE, all tests ran).
Vitest with `fake-indexeddb/auto` (the repo's `src/data/test-setup.ts`), jsdom environment, as `gamify.test.ts` does.
Copies: `/tmp/dc` (day-close), `/tmp/dc27` (ship-27), `/tmp/dc-pre` (1f7767b, node_modules linked from /tmp/dc).
No app code was changed. Test files lived only in the /tmp copies; the code is pasted at the end.

Machine: 4 CPUs, shared with 3-4 other jobs. `uptime` load average during timing runs: 1.5 to 5.8 (1-min).
Timings are noisy. Medians are given with min and max. Phone numbers are ESTIMATES (Node time x 4), not measured.

## Short answer

| Question | Result |
|---|---|
| (1) Late 100-Shard purchase on a day closed at 100 Shards: owned AND charged? | Pre-fix rule `max(shards)`: **FAIL**. Item owned, 100 Shards handed back. Reproduced on the real pre-fix commit 1f7767b too. |
| Fix `max(x - price(y-only), y - price(x-only))` | **PASS** (4/4 scenarios). The day-close branch already ships it (commit 51ff25c), with an extra floor of 0. |
| (2) Can a running reconcile write closes from the old ledger during an import? | Closes: **no**, in every gap tried. Same tab: nothing leaks. Other tab with Web Locks: nothing leaks. Other tab **without** Web Locks: gamify **facts** from the old tables leak into the restored ledger (12 of 20 natural runs). |
| (3) Cost at 365 days | `deriveEconomy`: 34 ms on ship-27, 38-42 ms on day-close, 45-73 ms with 365 closes. `reconcileGamify` per write: **473-479 ms on day-close vs 120-136 ms on ship-27 (3.5-3.9x)**. Phone estimate x4: about 1.9 s vs 0.5 s. `closesFor` is quadratic in days. Closes take **811 KB** of settings after a year. |

## (1) The Shard bug

Setup: `economy.v2From = 2026-10-01`. 20 `badge-tier` facts (5 Shards each) on D = 2026-11-03, so D earns exactly 100 Shards
and no XP. `reconcileGamify` at 11-04 closes D with `shards: 100, purchases: []`. Then a `purchase` fact for `banner:dawn`
(price 100) dated D arrives (as a sync or another phone would write it). `reconcileGamify` runs at 11-05.

Three `mergeClose` rules were swapped in with `vi.mock` (the rest of the code is the day-close branch as is):

- `old`: `shards = max(x.shards, y.shards)` (the rule before 51ff25c)
- `fix`: `shards = max(x.shards - price(y-only), y.shards - price(x-only))` (as proposed, no floor)
- `repo`: the branch as it is: the same formula plus `, 0`

The same file was also run, without the mock, on the real pre-fix commit 1f7767b.

| Scenario | old (mock) | 1f7767b (real) | fix | repo |
|---|---|---|---|---|
| A. late purchase fact on a day closed at 100 | FAIL: owned, Shards 100 (want 0) | FAIL: same | PASS: owned, 0 | PASS |
| B. restore of a backup from a phone that bought on D (its close: 0) | FAIL: owned, 100 | FAIL | PASS | PASS |
| C. late purchase on an older closed day (3 later closes), then a 2nd late one (freeze 50) | FAIL: 200 -> 200 -> 200 (want 100, 50) | FAIL | PASS: 200 -> 100 -> 50 | PASS |
| D. two phones each spend the same 100 on D, one restores the other (observation) | 0 Shards, both items owned | same | same | same |

Why the old rule fails: the merged close unions the purchase ids and keeps the higher, older balance (100). `shardFloor`
then treats the purchase as "known" to that close and does not subtract it again. So the item stays owned and the 100
Shards come back. Scenario C under `old` also shows a mixed state: the later freeze (50) was charged but the banner (100) was not
(closes 11-06 and 11-07 at 150).

Why the fix is right when both closes are honest: if x = Ex - cost(X) and y = Ey - cost(Y), then
x - cost(Y\X) = Ex - cost(X ∪ Y) and y - cost(X\Y) = Ey - cost(X ∪ Y). The max is max(Ex, Ey) - cost(all purchases):
the higher earning, every purchase paid once.

Scenario D note (not a regression; same under all rules): 100 earned, 200 spent on two phones that never saw each other.
After the restore both items are owned and Shards show 0, so one item was free. The floor of 0 (and the replay's
`Math.max(0, balance)`) hides the -100. The phone's own purchase fact is gone from the ledger after the restore (the backup
replaced it); the item stays owned only through the close's `purchases` list, by design. Rare; needs two phones and a restore.
Worth a line in DECISIONS.md if it is the intended trade-off.

Output (verbatim, trimmed to the test lines):

```
--- MERGE=old (day-close 04796f7)
{"merge":"old","scenario":"A","closeBefore":{"shards":100,"purchases":0},"closeAfter":{"shards":100,"purchases":1},"shardsBefore":100,"shardsAfter":100,"owned":["banner:dawn"]}
 × [old] A: late purchase fact (sync) on a day closed at 100 Shards 216ms
{"merge":"old","scenario":"B","otherClose":0,"closeAfter":{"shards":100,"purchases":1},"shardsBefore":100,"shardsAfter":100,"owned":["banner:dawn"]}
{"merge":"old","scenario":"C","before":200,"mid":200,"after":200,"owned":["banner:dawn"],"closes":[["2026-11-03",200],["2026-11-04",200],["2026-11-05",200],["2026-11-06",150],["2026-11-07",150]]}
 × [old] B: restore of a backup whose ledger has the purchase on that day 223ms
 × [old] C: late purchase dated on an older closed day (two later days already closed), then a second one 108ms
{"merge":"old","scenario":"D","closeD":0,"shards":0,"owned":["banner:dawn","cardback:weave"],"ledgerPurchases":["purchase:banner:grove:b"]}
 ✓ [old] D: two phones each spend the same 100 Shards on D, then one restores the other's backup 128ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected 100 to be +0 // Object.is equality
AssertionError: expected 100 to be +0 // Object.is equality
AssertionError: expected 200 to be 100 // Object.is equality
      Tests  3 failed | 1 passed (4)
--- MERGE=fix (day-close 04796f7)
{"merge":"fix","scenario":"A","closeBefore":{"shards":100,"purchases":0},"closeAfter":{"shards":0,"purchases":1},"shardsBefore":100,"shardsAfter":0,"owned":["banner:dawn"]}
 ✓ [fix] A: late purchase fact (sync) on a day closed at 100 Shards 107ms
{"merge":"fix","scenario":"B","otherClose":0,"closeAfter":{"shards":0,"purchases":1},"shardsBefore":100,"shardsAfter":0,"owned":["banner:dawn"]}
{"merge":"fix","scenario":"C","before":200,"mid":100,"after":50,"owned":["banner:dawn"],"closes":[["2026-11-03",100],["2026-11-04",50],["2026-11-05",50],["2026-11-06",50],["2026-11-07",50]]}
 ✓ [fix] B: restore of a backup whose ledger has the purchase on that day 128ms
 ✓ [fix] C: late purchase dated on an older closed day (two later days already closed), then a second one 71ms
{"merge":"fix","scenario":"D","closeD":0,"shards":0,"owned":["banner:dawn","cardback:weave"],"ledgerPurchases":["purchase:banner:grove:b"]}
 ✓ [fix] D: two phones each spend the same 100 Shards on D, then one restores the other's backup 352ms
      Tests  4 passed (4)
--- MERGE=repo (day-close 04796f7)
{"merge":"repo","scenario":"A","closeBefore":{"shards":100,"purchases":0},"closeAfter":{"shards":0,"purchases":1},"shardsBefore":100,"shardsAfter":0,"owned":["banner:dawn"]}
 ✓ [repo] A: late purchase fact (sync) on a day closed at 100 Shards 95ms
{"merge":"repo","scenario":"B","otherClose":0,"closeAfter":{"shards":0,"purchases":1},"shardsBefore":100,"shardsAfter":0,"owned":["banner:dawn"]}
{"merge":"repo","scenario":"C","before":200,"mid":100,"after":50,"owned":["banner:dawn"],"closes":[["2026-11-03",100],["2026-11-04",50],["2026-11-05",50],["2026-11-06",50],["2026-11-07",50]]}
 ✓ [repo] B: restore of a backup whose ledger has the purchase on that day 218ms
 ✓ [repo] C: late purchase dated on an older closed day (two later days already closed), then a second one 56ms
{"merge":"repo","scenario":"D","closeD":0,"shards":0,"owned":["banner:dawn","cardback:weave"],"ledgerPurchases":["purchase:banner:grove:b"]}
 ✓ [repo] D: two phones each spend the same 100 Shards on D, then one restores the other's backup 112ms
      Tests  4 passed (4)
--- pre-fix commit 1f7767b, no mock
{"merge":"repo","scenario":"A","closeBefore":{"shards":100,"purchases":0},"closeAfter":{"shards":100,"purchases":1},"shardsBefore":100,"shardsAfter":100,"owned":["banner:dawn"]}
 × [repo] A: late purchase fact (sync) on a day closed at 100 Shards 129ms
{"merge":"repo","scenario":"B","otherClose":0,"closeAfter":{"shards":100,"purchases":1},"shardsBefore":100,"shardsAfter":100,"owned":["banner:dawn"]}
{"merge":"repo","scenario":"C","before":200,"mid":200,"after":200,"owned":["banner:dawn"],"closes":[["2026-11-03",200],["2026-11-04",200],["2026-11-05",200],["2026-11-06",150],["2026-11-07",150]]}
 × [repo] B: restore of a backup whose ledger has the purchase on that day 174ms
{"merge":"repo","scenario":"D","closeD":0,"shards":0,"owned":["banner:dawn","cardback:weave"],"ledgerPurchases":["purchase:banner:grove:b"]}
 × [repo] C: late purchase dated on an older closed day (two later days already closed), then a second one 62ms
 ✓ [repo] D: two phones each spend the same 100 Shards on D, then one restores the other's backup 120ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected 100 to be +0 // Object.is equality
AssertionError: expected 100 to be +0 // Object.is equality
AssertionError: expected 200 to be 100 // Object.is equality
      Tests  3 failed | 1 passed (4)
```

## (2) Restore / reconcile race

How a restore runs (`src/data/backup/index.ts:213-233`): `duringRestore` raises a flag, waits for any running reconcile,
captures this phone's closes, then calls dexie-export-import `importInto` with `clearTablesBeforeImport: true`.
In `dexie-export-import` 4 (`node_modules/dexie-export-import/dist/dexie-export-import.mjs` around lines 3462-3478) the
tables are cleared **one at a time, each in its own transaction**, in `db.tables` order
(`... ledger, inventory, dailyLog, settings, quests, learnConcepts, learnItems, learnDrops`), and only then are all rows
imported in one `rw` transaction. So there are gaps where the ledger is empty but settings or Learn tables are still the old ones.

`reconcileGamify` does all its reads and writes in one Dexie transaction (`src/data/repos/gamify.ts:24`), so it can never read
the old ledger and write after the clear: IndexedDB runs overlapping `rw` transactions one after another.

Method: wrap tab A's `table.clear()` so that a reconcile fires in a chosen gap; wait up to 300 ms for it. "Other tab" means a
second copy of the modules (`vi.resetModules()`), so it has its own `restoreLock` and its own Dexie connection, like a second
browser tab. Web Locks: jsdom has no `navigator.locks`, so a small FIFO polyfill stands in for it. Compared with a control
(restore, then reconcile, with nothing in between). Phone data: 8 active days, a purchase, closes to 11-08, today's Learn
drop finished in `learnDrops`. Backup: an older build's export (4 days, no closes, no `v2From`).

| Gap the reconcile fires in | Same tab | Other tab, no Web Locks | Other tab, Web Locks |
|---|---|---|---|
| after the closes capture, before the first clear | no diff (returned at once) | no diff | no diff (ran after the restore) |
| after `ledger` cleared (settings, Learn tables still old) | no diff | **leak: `learn-drop:2026-11-10`, `badge-tier:drops:1`** | no diff |
| after `settings` cleared (Learn tables still old) | no diff | **leak: same 2 facts** | no diff |
| after the last clear, before the import transaction | no diff | no diff | no diff |

Natural timing (no forced gap): tab B reconciles every 0-4 ms while tab A restores, 20 runs each. A run counts only if it
matches neither control (restore alone; or the phone opened today first, then restore).

| | Reconciles fired during restores | Runs matching neither control | What differed |
|---|---|---|---|
| Same tab (one reconcile also started just before the restore) | 192 | 0 of 20 | none |
| Other tab, no Web Locks | 138 | **12 of 20** (17 of 20 in an earlier run) | `learn-drop:2026-11-10` and `badge-tier:drops:1` in the restored ledger |

What it means:

- No close computed from the old ledger survived in any run. The old-ledger closes a tab B writes before the `settings` clear are wiped by it.
- Facts do leak. In the gaps, tab B reads the old `learnDrops` (and could read old `learnConcepts`, and old `dailyLog` in the ledger gap)
  and writes `learn-drop`, `badge-tier` (here +5 Shards), and could write `unit-chest` (+25 Shards) or `tomorrow-plan` into the
  already-cleared ledger. The import uses `bulkPut`, so these rows stay. The ledger is append-only, so they stay for good.
- Who can hit it: only the web build, two tabs open, in a browser without `navigator.locks` (Chrome < 69, Firefox < 96,
  Safari < 15.4). The Android app is one WebView, so it cannot. Modern browsers: the Web Lock in `src/data/restoreLock.ts:11-14`
  holds tab B back until the restore ends (shown in the Web Locks column).
- Impact: small (a few Shards or one Learn day the user really earned on this phone). Low priority.
- Smallest fix if wanted: do the clear and the import in one transaction (`importInto(..., { noTransaction: true })` inside a
  `db.transaction('rw', db.tables, ...)` that first clears every table, after the file has been parsed), or have
  `reconcileOnce` return when the ledger is empty but settings still hold closes.
- Test gap: the repo's own lock test (`gamify.test.ts:132-142`) runs where `navigator.locks` is undefined, so the Web Lock path is never exercised by CI.

Output (verbatim):

```
{"hasNavigatorLocks":false,"tableOrder":["tasks","taskEvents","focus","reminders","plans","exercises","ladders","programs","exState","sessions","sets","prs","puzzleRuns","cards","deckProg","lessonProg","ratings","flags","unlocks","packs","ledger","inventory","dailyLog","settings","quests","learnConcepts","learnItems","learnDrops"]}
 ✓ environment 8ms
{"gap":"before-first-clear","tab":"same","locks":false,"order":["fire@before-first-clear","reconcile-finished","cleared:ledger","cleared:settings","cleared:learnDrops","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap before-first-clear, same tab, Web Locks off 357ms
{"gap":"after-ledger-clear","tab":"same","locks":false,"order":["cleared:ledger","fire@after-ledger-clear","reconcile-finished","cleared:settings","cleared:learnDrops","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-ledger-clear, same tab, Web Locks off 273ms
{"gap":"after-settings-clear","tab":"same","locks":false,"order":["cleared:ledger","cleared:settings","fire@after-settings-clear","reconcile-finished","cleared:learnDrops","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-settings-clear, same tab, Web Locks off 203ms
{"gap":"after-last-clear","tab":"same","locks":false,"order":["cleared:ledger","cleared:settings","cleared:learnDrops","fire@after-last-clear","reconcile-finished","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-last-clear, same tab, Web Locks off 191ms
{"gap":"before-first-clear","tab":"other","locks":false,"order":["fire@before-first-clear","reconcile-finished","cleared:ledger","cleared:settings","cleared:learnDrops","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap before-first-clear, other tab, Web Locks off 300ms
{"gap":"after-ledger-clear","tab":"other","locks":false,"order":["cleared:ledger","fire@after-ledger-clear","reconcile-finished","cleared:settings","cleared:learnDrops","restore-finished"],"diffVsControl":["extra ledger fact badge-tier:drops:1","extra ledger fact learn-drop:2026-11-10"]}
 ✓ reconcile in gap after-ledger-clear, other tab, Web Locks off 343ms
{"gap":"after-settings-clear","tab":"other","locks":false,"order":["cleared:ledger","cleared:settings","fire@after-settings-clear","reconcile-finished","cleared:learnDrops","restore-finished"],"diffVsControl":["extra ledger fact badge-tier:drops:1","extra ledger fact learn-drop:2026-11-10"]}
 ✓ reconcile in gap after-settings-clear, other tab, Web Locks off 296ms
{"gap":"after-last-clear","tab":"other","locks":false,"order":["cleared:ledger","cleared:settings","cleared:learnDrops","fire@after-last-clear","reconcile-finished","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-last-clear, other tab, Web Locks off 255ms
{"gap":"before-first-clear","tab":"same","locks":true,"order":["fire@before-first-clear","reconcile-finished","cleared:ledger","cleared:settings","cleared:learnDrops","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap before-first-clear, same tab, Web Locks on 175ms
{"gap":"after-ledger-clear","tab":"same","locks":true,"order":["cleared:ledger","fire@after-ledger-clear","reconcile-finished","cleared:settings","cleared:learnDrops","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-ledger-clear, same tab, Web Locks on 157ms
{"gap":"after-settings-clear","tab":"same","locks":true,"order":["cleared:ledger","cleared:settings","fire@after-settings-clear","reconcile-finished","cleared:learnDrops","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-settings-clear, same tab, Web Locks on 197ms
{"gap":"after-last-clear","tab":"same","locks":true,"order":["cleared:ledger","cleared:settings","cleared:learnDrops","fire@after-last-clear","reconcile-finished","restore-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-last-clear, same tab, Web Locks on 161ms
{"gap":"before-first-clear","tab":"other","locks":true,"order":["fire@before-first-clear","cleared:ledger","cleared:settings","cleared:learnDrops","restore-finished","reconcile-finished"],"diffVsControl":[]}
 ✓ reconcile in gap before-first-clear, other tab, Web Locks on 586ms
{"gap":"after-ledger-clear","tab":"other","locks":true,"order":["cleared:ledger","fire@after-ledger-clear","cleared:settings","cleared:learnDrops","restore-finished","reconcile-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-ledger-clear, other tab, Web Locks on 546ms
{"gap":"after-settings-clear","tab":"other","locks":true,"order":["cleared:ledger","cleared:settings","fire@after-settings-clear","cleared:learnDrops","restore-finished","reconcile-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-settings-clear, other tab, Web Locks on 576ms
{"gap":"after-last-clear","tab":"other","locks":true,"order":["cleared:ledger","cleared:settings","cleared:learnDrops","fire@after-last-clear","restore-finished","reconcile-finished"],"diffVsControl":[]}
 ✓ reconcile in gap after-last-clear, other tab, Web Locks on 542ms
{"tab":"same","naturalRuns":20,"reconcilesFiredDuringRestores":192,"runsMatchingNeitherControl":0,"kinds":{}}
 ✓ natural timing: same tab reconciles every few ms while a restore runs (no Web Locks), 20 runs 1712ms
{"tab":"other","naturalRuns":20,"reconcilesFiredDuringRestores":138,"runsMatchingNeitherControl":12,"kinds":{"extra ledger fact badge-tier:drops:1":12,"extra ledger fact learn-drop:2026-11-10":12}}
 ✓ natural timing: other tab reconciles every few ms while a restore runs (no Web Locks), 20 runs 3665ms
      Tests  19 passed (19)
```

## (3) Cost

Ledger: 365 days from 2026-11-05, 15 facts a day (4 tasks done, 1 train session, 1 daily board, 5 learn answers,
1 learn-drop, 2 cards, 1 lights-out), plus 40 purchases (11 shop items once, 29 freezes, every 9 days) = 5,515 facts.
Shapes copied from the app's writers (`tasks.ts:445`, `train.ts:178`, `learn.ts:26,74`, `learn-engine.ts:52`, `tasks.ts:179`,
`economy.ts:15`). Today = 2027-11-05. Both branches derive the same numbers: 90,885 XP, level 43, 8,178 Shards, 11 items, streak 365.

Day-close with closes: one `closesFor` result written as 365 closes (what a full year of daily reconciles leaves).
Each figure: median of 20 runs (first-ever: 5), in ms. Two rounds per branch, run in opposite orders.

| Measure (ms) | ship-27 r1 | ship-27 r2 | day-close r1 | day-close r2 | Phone est. x4 (day-close / ship-27) |
|---|---|---|---|---|---|
| `deriveEconomy`, no closes | 33.8 (29-55) | 33.5 (29-67) | 37.6 (29-52) | 42.5 (29-131) | ~150-170 / ~135 |
| `deriveEconomy`, 365 closes | n/a | n/a | 45.2 (37-77) | 72.8 (37-119) | ~180-290 |
| `closesFor`, no closes yet | n/a | n/a | 30.4 (29-51) | 32.4 (28-65) | ~120-130 |
| `closesFor`, 365 closes | n/a | n/a | **222.1** (205-316) | **216.0** (196-335) | **~870-890** |
| `reconcileGamify`, steady (same moment again; runs after every write) | 136.1 (102-206) | 120.2 (101-228) | **478.6** (411-604) | **472.6** (403-637) | **~1,900 / ~500** |
| `reconcileGamify`, first open of a new day | 101.3 (86-194) | 111.4 (89-168) | 503.0 (389-655) | 481.3 (395-739) | ~2,000 / ~420 |
| `reconcileGamify`, first ever on a year of data (writes 120 closes) | 124.3 (107-195) | 180.3 (109-270) | 179.6 (164-271) | 219.5 (179-323) | ~800 / ~600 |
| Close rows / their JSON size | 0 | 0 | 365 / **811 KB** | same | |

Load (1-min) at the time: ship-27 r1 1.7-2.0, day-close r1 2.1-1.7, ship-27 r2 2.5-3.6, day-close r2 3.6-5.8.

Where the time goes (day-close only, median of 10, ms; load 1.5-2.3):

| Days | Purchases | Facts | Closes KB | derive, no closes | derive, all closed | closesFor, no closes | closesFor, all closed | closesFor, all closed, purchase lists emptied |
|---|---|---|---|---|---|---|---|---|
| 90 | 10 | 1360 | 40 | 8.9 | 9.4 | 9.1 | **15.6** | 8.2 |
| 180 | 20 | 2720 | 149 | 14.2 | 17.1 | 15.4 | **45.5** | 24.8 |
| 365 | 0 | 5475 | 32 | 31.8 | 29.5 | 27.6 | **67.8** | 78.7 |
| 365 | 40 | 5515 | 595 | 28.5 | 43.3 | 30.1 | **183.2** | 117.3 |
| 365 | 120 | 5595 | 1750 | 27.3 | 37.1 | 27.7 | **480.1** | 256.6 |
| 730 | 80 | 11030 | 2347 | 86.4 | 108.6 | 85.2 | **1445.7** | 747.3 |

- `closesFor` grows with days² (and days² x purchases): 90 days 16 ms, 365 days 183 ms, 730 days 1,446 ms.
  Causes: for every finished day it calls `shardFloor(closes, replay, day)` (`deriveEconomy.ts:172`), which walks every close
  and filters every accepted purchase against a fresh `Set` per close (`deriveEconomy.ts:128-141`); and it rebuilds
  `before` from all closes per day (`deriveEconomy.ts:171`).
- Close size grows with days x purchases, because each close stores every purchase to date (`snap.purchases` =
  all bought up to that day, `deriveEconomy.ts:411-412`): 32 KB with no purchases, 595 KB with 40, 1.75 MB with 120,
  2.3 MB at 2 years. This goes into every backup and into every `useLiveQuery` read of `settings` in
  `src/ui/shell/EconomyFeedback.tsx:32`.
- `reconcileGamify` runs from that same `useLiveQuery` effect (`EconomyFeedback.tsx:67`), so after a year each write
  (a task tick, a learn answer) pays about 0.48 s of Node time (about 1.9 s on a phone, estimate), versus 0.12-0.14 s (about 0.5 s) on ship-27.
  It runs off the main interaction, but it holds a `rw` transaction on ledger and settings that long, so the next write waits.

Cheapest fixes, in order:
1. In `closesFor`, compute the floor and `owned` in one pass over days in order (running values), not per day over all closes. O(days x purchases) or better.
2. Only rebuild candidates from the earliest `dayKey` touched since the last reconcile (plus yesterday); leave older closes alone.
3. Store in each close only the purchases dated that day; derive the cumulative list by a prefix union when reading.
4. Debounce `reconcileGamify` in `EconomyFeedback` (one run per idle second, not per write).

## Files and code

Test code, pasted so it can be re-run. Put the files under `src/data/repos/` in a copy of the branch, then:

```
MERGE=old  npx vitest run src/data/repos/cj2-shard-bug.test.ts --reporter=verbose   # also: fix, repo
npx vitest run src/data/repos/cj2-race.test.ts --reporter=verbose
BRANCH=day-close npx vitest run src/data/repos/cj2-bench.test.ts --reporter=verbose  # same file on ship-27 with BRANCH=ship-27
npx vitest run src/data/repos/cj2-bench-scale.test.ts --reporter=verbose             # day-close only
```

### cj2-shard-bug.test.ts (part 1)

```ts
// @vitest-environment jsdom
// cj2 job 2 (1): a day closes with 100 Shards and no purchase; a 100-Shard purchase dated that day arrives
// later; reconcileGamify runs. Is the item owned AND are the 100 Shards charged (not handed back)?
// MERGE=repo  -> the day-close branch's mergeClose as it is (fix already in, with a floor of 0)
// MERGE=old   -> mergeClose with the pre-51ff25c rule shards = max(x.shards, y.shards)
// MERGE=fix   -> shards = max(x.shards - price(y-only purchases), y.shards - price(x-only purchases)), as proposed
import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';

const MERGE = (process.env.MERGE ?? 'repo') as 'repo' | 'old' | 'fix';
vi.mock('../../core/economy/deriveEconomy', async importOriginal => {
  const real = await importOriginal<typeof import('../../core/economy/deriveEconomy')>();
  const mode = (process.env.MERGE ?? 'repo');
  if (mode === 'repo') return real;
  const mergeClose: typeof real.mergeClose = (a, b) => {
    const merged = real.mergeClose(a, b);
    const x = real.mergeClose(a, undefined), y = real.mergeClose(undefined, b); // asClose() of each side
    if (!merged || !x || !y) return merged;
    const only = (p: typeof x, q: typeof x) => p.purchases.filter(i => !q.purchases.some(o => o.id === i.id));
    const cost = (items: typeof x.purchases) => items.reduce((s, i) => s + i.price, 0);
    merged.shards = mode === 'old' ? Math.max(x.shards, y.shards) : Math.max(x.shards - cost(only(y, x)), y.shards - cost(only(x, y)));
    return merged;
  };
  return { ...real, mergeClose };
});

import { createDb, type NandiDb } from '../db';
import { closeKey, deriveEconomy } from '../../core/economy/deriveEconomy';
import { exportBackup, importBackup } from '../backup';
import { reconcileGamify } from './gamify';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });
const at = (day: string, time = '12:00') => new Date(`${day}T${time}:00`).getTime();
const D = '2026-11-03';
type Close = { shards: number; purchases: { id: string }[]; owned: string[] };
const close = async (db: NandiDb, day: string) => (await db.settings.get(closeKey(day)))?.value as Close | undefined;
const view = async (db: NandiDb, today: string) => deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), today);

/** 20 badge tiers x 5 Shards = exactly 100 Shards earned on D, no XP, no purchase. */
async function seed(db: NandiDb) {
  await db.settings.put({ key: 'economy.v2From', value: '2026-10-01', updatedAt: 1, deleted: 0, deviceId: 'test' });
  for (let i = 0; i < 20; i++) await db.ledger.add({ id: `badge-tier:t${i}`, mode: 'gamify', kind: 'badge-tier', refId: `t${i}`, dayKey: D, inputs: {}, updatedAt: at(D), deleted: 0, deviceId: 'test' });
}
const purchase = { id: 'purchase:banner:dawn:late', mode: 'economy', kind: 'purchase', refId: 'banner:dawn:late', dayKey: D,
  inputs: { itemId: 'banner:dawn', price: 100 }, updatedAt: at(D, '23:00'), deleted: 0 as const, deviceId: 'phone-b' };

it(`[${MERGE}] A: late purchase fact (sync) on a day closed at 100 Shards`, async () => {
  const db = createDb(`cj2-a-${++serial}`); opened.push(db);
  await seed(db);
  await reconcileGamify(db, at('2026-11-04'));
  const c1 = await close(db, D);
  const before = (await view(db, '2026-11-05')).shards;
  await db.ledger.add(purchase);
  await reconcileGamify(db, at('2026-11-05'));
  const c2 = await close(db, D);
  const after = await view(db, '2026-11-05');
  console.log(JSON.stringify({ merge: MERGE, scenario: 'A', closeBefore: { shards: c1?.shards, purchases: c1?.purchases.length },
    closeAfter: { shards: c2?.shards, purchases: c2?.purchases.length }, shardsBefore: before, shardsAfter: after.shards, owned: after.owned }));
  expect(c1?.shards).toBe(100);
  expect(c1?.purchases).toEqual([]);
  expect(after.owned).toContain('banner:dawn');
  expect(after.shards).toBe(before - 100);
});

it(`[${MERGE}] B: restore of a backup whose ledger has the purchase on that day`, async () => {
  // Phone B bought on D and closed D at 0; this phone closed D at 100. This phone restores B's backup.
  const other = createDb(`cj2-b-other-${++serial}`); opened.push(other);
  await seed(other);
  await other.ledger.add(purchase);
  await reconcileGamify(other, at('2026-11-04'));
  const backup = await exportBackup(other, at('2026-11-04', '13:00'));
  const db = createDb(`cj2-b-${++serial}`); opened.push(db);
  await seed(db);
  await reconcileGamify(db, at('2026-11-04'));
  const before = (await view(db, '2026-11-05')).shards;
  await importBackup(db, backup);
  await reconcileGamify(db, at('2026-11-05'));
  const c2 = await close(db, D);
  const after = await view(db, '2026-11-05');
  console.log(JSON.stringify({ merge: MERGE, scenario: 'B', otherClose: (backup.dexie.data.data.find(t => t.tableName === 'settings')!.rows.find(r => r.key === closeKey(D)) as { value: Close }).value.shards,
    closeAfter: { shards: c2?.shards, purchases: c2?.purchases.length }, shardsBefore: before, shardsAfter: after.shards, owned: after.owned }));
  expect(after.owned).toContain('banner:dawn');
  expect(after.shards).toBe(before - 100);
});

it(`[${MERGE}] C: late purchase dated on an older closed day (two later days already closed), then a second one`, async () => {
  const db = createDb(`cj2-c-${++serial}`); opened.push(db);
  await seed(db);
  // 20 more badge tiers on 11-02, so 200 Shards in all: both late purchases (100 + 50) are affordable.
  for (let i = 0; i < 20; i++) await db.ledger.add({ id: `badge-tier:e${i}`, mode: 'gamify', kind: 'badge-tier', refId: `e${i}`, dayKey: '2026-11-02', inputs: {}, updatedAt: at('2026-11-02'), deleted: 0, deviceId: 'test' });
  await reconcileGamify(db, at('2026-11-06')); // closes 11-02 .. 11-05
  const before = (await view(db, '2026-11-07')).shards;
  await db.ledger.add(purchase); // dated 11-03
  await reconcileGamify(db, at('2026-11-07'));
  const mid = (await view(db, '2026-11-07')).shards;
  await db.ledger.add({ ...purchase, id: 'purchase:freeze:late', refId: 'freeze:late', dayKey: '2026-11-04', inputs: { itemId: 'freeze', price: 50 } });
  await reconcileGamify(db, at('2026-11-08'));
  const after = await view(db, '2026-11-08');
  const closes = await Promise.all(['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'].map(async d => [d, (await close(db, d))?.shards]));
  console.log(JSON.stringify({ merge: MERGE, scenario: 'C', before, mid, after: after.shards, owned: after.owned, closes }));
  expect(mid).toBe(before - 100);
  expect(after.shards).toBe(before - 150);
});

it(`[${MERGE}] D: two phones each spend the same 100 Shards on D, then one restores the other's backup`, async () => {
  const other = createDb(`cj2-d-other-${++serial}`); opened.push(other);
  await seed(other);
  await other.ledger.add({ ...purchase, id: 'purchase:banner:grove:b', refId: 'banner:grove:b', inputs: { itemId: 'cardback:weave', price: 100 } });
  await reconcileGamify(other, at('2026-11-04'));
  const backup = await exportBackup(other, at('2026-11-04', '13:00'));
  const db = createDb(`cj2-d-${++serial}`); opened.push(db);
  await seed(db);
  await db.ledger.add({ ...purchase, deviceId: 'phone-a' });
  await reconcileGamify(db, at('2026-11-04'));
  await importBackup(db, backup);
  await reconcileGamify(db, at('2026-11-05'));
  const after = await view(db, '2026-11-05');
  // Observation only: 100 earned, 200 spent across two phones that never saw each other's purchase.
  console.log(JSON.stringify({ merge: MERGE, scenario: 'D', closeD: (await close(db, D))?.shards, shards: after.shards, owned: after.owned,
    ledgerPurchases: (await db.ledger.toArray()).filter(r => r.kind === 'purchase').map(r => r.id) }));
});
```

### cj2-race.test.ts (part 2)

```ts
// @vitest-environment jsdom
// cj2 job 2 (2): can a running reconcileGamify write closes (or facts) from the OLD data during importBackup?
// Tab A runs the restore. "Same tab" reconciles use A's own restoreLock; "other tab" reconciles use a second copy of
// the modules (vi.resetModules), i.e. a second tab with its own restoreLock and its own Dexie connection.
// importInto (dexie-export-import 4) clears the tables one by one, each in its own transaction, then imports all
// tables in one transaction. We fire reconciles in each gap.
import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';
import { createDb, type NandiDb } from '../db';
import { CLOSE_PREFIX } from '../../core/economy/deriveEconomy';
import { exportBackup, importBackup } from '../backup';
import { reconcileGamify } from './gamify';
import type { LedgerRow } from '../types';

let serial = 0;
const opened: NandiDb[] = [];
afterEach(async () => { for (const db of opened.splice(0)) { db.close(); await db.delete(); } });
const at = (day: string, time = '12:00') => new Date(`${day}T${time}:00`).getTime();
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const T = '2026-11-10';
const done = (day: string): LedgerRow => ({ id: `done:${day}`, mode: 'tasks', kind: 'done', refId: day, dayKey: day,
  inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: at(day), deleted: 0, deviceId: 'phone' });

/** The phone: 8 active days, a purchase, closes up to 11-08 (last opened 11-09), today's Learn drop finished. */
async function phone(name: string) {
  const db = createDb(name); opened.push(db);
  await db.settings.put({ key: 'economy.v2From', value: '2026-10-01', updatedAt: 1, deleted: 0, deviceId: 'phone' });
  for (let i = 0; i < 20; i++) await db.ledger.add({ id: `badge-tier:x${i}`, mode: 'gamify', kind: 'badge-tier', refId: `x${i}`, dayKey: '2026-11-02', inputs: {}, updatedAt: at('2026-11-02'), deleted: 0, deviceId: 'phone' });
  for (let d = 2; d <= 9; d++) await db.ledger.add(done(`2026-11-0${d}`));
  await db.ledger.add({ id: 'purchase:banner:dawn:1', mode: 'economy', kind: 'purchase', refId: 'banner:dawn:1', dayKey: '2026-11-04', inputs: { itemId: 'banner:dawn', price: 100 }, updatedAt: at('2026-11-04'), deleted: 0, deviceId: 'phone' });
  await reconcileGamify(db, at('2026-11-09'));
  await db.learnDrops.put({ id: `drop:daily:${T}`, drop: { items: [{ lesson: true }], cursor: 1 }, updatedAt: at(T, '08:00'), deleted: 0, deviceId: 'phone' } as never);
  return db;
}
/** The backup: an older build's export (no v2From, no closes), 4 active days, no purchase. */
async function backupFile() {
  const db = createDb(`cj2-race-bk-${++serial}`); opened.push(db);
  for (let d = 2; d <= 5; d++) await db.ledger.add({ ...done(`2026-11-0${d}`), deviceId: 'old' });
  return exportBackup(db, at('2026-11-06'));
}
async function snapshot(db: NandiDb) {
  const settings = await db.settings.toArray(), ledger = await db.ledger.toArray();
  return {
    v2From: settings.find(r => r.key === 'economy.v2From')?.value,
    closes: Object.fromEntries(settings.filter(r => r.key.startsWith(CLOSE_PREFIX)).map(r => [r.key.slice(CLOSE_PREFIX.length), r.value])),
    ledger: ledger.map(r => r.id).sort(),
  };
}
async function control(preOpen = false) {
  const db = await phone(`cj2-race-ctl-${++serial}`);
  // preOpen: the phone was opened today before the restore, so yesterday (11-09) got its close from the phone's ledger.
  if (preOpen) await reconcileGamify(db, at(T, '07:00'));
  await importBackup(db, await backupFile());
  await reconcileGamify(db, at(T));
  return snapshot(db);
}

type Gap = 'before-first-clear' | 'after-ledger-clear' | 'after-settings-clear' | 'after-last-clear';
/** Wraps A's table.clear() so a reconcile fires in one gap; waits up to 300 ms for it (a lock may hold it back). */
function hookGap(db: NandiDb, gap: Gap, fire: () => Promise<unknown>, log: string[]) {
  const first = db.tables[0]!.name, last = db.tables.at(-1)!.name;
  for (const table of db.tables) {
    const clear = table.clear.bind(table);
    (table as { clear: () => Promise<void> }).clear = async () => {
      const go = async () => { log.push(`fire@${gap}`); const p = fire().then(() => log.push('reconcile-finished')); await Promise.race([p, sleep(300)]); };
      if (gap === 'before-first-clear' && table.name === first) await go();
      await clear(); log.push(`cleared:${table.name}`);
      if ((gap === 'after-ledger-clear' && table.name === 'ledger') || (gap === 'after-settings-clear' && table.name === 'settings') || (gap === 'after-last-clear' && table.name === last)) await go();
    };
  }
}
async function otherTab(name: string) {
  vi.resetModules();
  const dbMod = await import('../db');
  const gamify = await import('./gamify');
  const db = dbMod.createDb(name); opened.push(db);
  return { db, reconcile: (now: number) => gamify.reconcileGamify(db, now) };
}
function diff(a: Awaited<ReturnType<typeof snapshot>>, b: Awaited<ReturnType<typeof snapshot>>) {
  const out: string[] = [];
  if (a.v2From !== b.v2From) out.push(`v2From ${String(a.v2From)} -> ${String(b.v2From)}`);
  for (const id of b.ledger.filter(id => !a.ledger.includes(id))) out.push(`extra ledger fact ${id}`);
  for (const id of a.ledger.filter(id => !b.ledger.includes(id))) out.push(`missing ledger fact ${id}`);
  for (const day of new Set([...Object.keys(a.closes), ...Object.keys(b.closes)])) if (JSON.stringify(a.closes[day]) !== JSON.stringify(b.closes[day])) out.push(`close ${day}: ${JSON.stringify(a.closes[day])} -> ${JSON.stringify(b.closes[day])}`);
  return out;
}
function polyfillLocks() {
  const queues = new Map<string, Promise<unknown>>();
  const locks = { request<T>(name: string, run: () => Promise<T>): Promise<T> {
    const prev = queues.get(name) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(run);
    queues.set(name, next.catch(() => undefined));
    return next;
  } };
  Object.defineProperty(globalThis.navigator, 'locks', { value: locks, configurable: true });
  return () => { delete (globalThis.navigator as { locks?: unknown }).locks; };
}

const gaps: Gap[] = ['before-first-clear', 'after-ledger-clear', 'after-settings-clear', 'after-last-clear'];

it('environment', () => {
  console.log(JSON.stringify({ hasNavigatorLocks: !!(globalThis.navigator as { locks?: unknown })?.locks, tableOrder: createDb('x').tables.map(t => t.name) }));
});

for (const locks of [false, true]) for (const tab of ['same', 'other'] as const) for (const gap of gaps) {
  it(`reconcile in gap ${gap}, ${tab} tab, Web Locks ${locks ? 'on' : 'off'}`, async () => {
    const undo = locks ? polyfillLocks() : () => undefined;
    try {
      const ctl = await control();
      const name = `cj2-race-${++serial}`;
      const db = await phone(name);
      const backup = await backupFile();
      const log: string[] = [];
      const b = tab === 'other' ? await otherTab(name) : { reconcile: (now: number) => reconcileGamify(db, now) };
      hookGap(db, gap, () => b.reconcile(at(T)), log);
      await importBackup(db, backup);
      log.push('restore-finished');
      await sleep(50);
      await reconcileGamify(db, at(T));
      const out = diff(ctl, await snapshot(db));
      console.log(JSON.stringify({ gap, tab, locks, order: log.filter(l => !l.startsWith('cleared:') || /ledger|settings|learnDrops/.test(l)), diffVsControl: out }));
      if (locks || tab === 'same') expect(out).toEqual([]);
    } finally { undo(); }
  });
}

for (const tab of ['same', 'other'] as const) it(`natural timing: ${tab} tab reconciles every few ms while a restore runs (no Web Locks), 20 runs`, async () => {
  const ctl = await control(), ctlPre = await control(true);
  let unexplained = 0; const kinds = new Map<string, number>(); let firedTotal = 0;
  for (let run = 0; run < 20; run++) {
    const name = `cj2-race-nat-${++serial}`;
    const db = await phone(name);
    const backup = await backupFile();
    const b = tab === 'other' ? await otherTab(name) : { reconcile: (now: number) => reconcileGamify(db, now) };
    // Same tab: start one reconcile just BEFORE the restore too, so the restore has to wait for a running one.
    const early = tab === 'same' ? b.reconcile(at(T)) : Promise.resolve();
    let stop = false, fired = 0;
    const restore = importBackup(db, backup); // tab A's restore is in flight before tab B's first reconcile
    const loop = (async () => { while (!stop) { fired++; await b.reconcile(at(T)).catch(() => undefined); await sleep(run % 5); } })();
    await restore; await early;
    stop = true; await loop; firedTotal += fired;
    await reconcileGamify(db, at(T));
    const snap = await snapshot(db);
    const a = diff(ctl, snap), c = diff(ctlPre, snap);
    // A run is explained if it matches either legitimate end state (restore with or without a phone open just before it).
    if (a.length && c.length) { unexplained++; (a.length <= c.length ? a : c).forEach(o => kinds.set(o, (kinds.get(o) ?? 0) + 1)); }
  }
  console.log(JSON.stringify({ tab, naturalRuns: 20, reconcilesFiredDuringRestores: firedTotal, runsMatchingNeitherControl: unexplained, kinds: Object.fromEntries(kinds) }));
});
```

### cj2-bench.test.ts (part 3, both branches)

```ts
// @vitest-environment jsdom
// cj2 job 2 (3): cost of deriveEconomy and reconcileGamify on a 365-day ledger (~15 facts a day, 40 purchases).
// Same file runs on origin/day-close (/tmp/dc) and origin/ship-27 (/tmp/dc27). BRANCH env labels the output.
import 'fake-indexeddb/auto';
import { it } from 'vitest';
import { createDb } from '../db';
import * as econ from '../../core/economy/deriveEconomy';
import { reconcileGamify } from './gamify';
import type { LedgerRow, SettingRow } from '../types';

const BRANCH = process.env.BRANCH ?? '?';
const RUNS = 20;
const START = '2026-11-05', DAYS = 365;
const addDays = (key: string, n: number) => new Date(Date.parse(`${key}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const at = (day: string, time = '12:00') => new Date(`${day}T${time}:00`).getTime();
const TODAY = addDays(START, DAYS); // 2027-11-05, the day after the last active day
const items = ['cardback:weave', 'cardback:orbit', 'cardback:steps', 'banner:dawn', 'banner:grove', 'banner:sky', 'puzzle:paths', 'puzzle:patterns', 'sound:soft', 'theme:linen', 'theme:lagoon'];
const prices: Record<string, number> = { freeze: 50, 'cardback:weave': 100, 'cardback:orbit': 150, 'cardback:steps': 150, 'banner:dawn': 100, 'banner:grove': 150, 'banner:sky': 150, 'puzzle:paths': 150, 'puzzle:patterns': 250, 'sound:soft': 300, 'theme:linen': 400, 'theme:lagoon': 800 };

function ledger(): LedgerRow[] {
  const out: LedgerRow[] = [];
  const f = (day: string, mode: string, kind: string, refId: string, inputs: Record<string, unknown>, time: string) =>
    out.push({ id: `${kind}:${refId}`, mode, kind, refId, dayKey: day, inputs, updatedAt: at(day, time), deleted: 0, deviceId: 'bench' });
  let bought = 0;
  for (let d = 0; d < DAYS; d++) {
    const day = addDays(START, d);
    for (let t = 0; t < 4; t++) f(day, 'tasks', 'done', `${day}-t${t}`, { plannedSize: ['S', 'M', 'L', 'M'][t], isFirstDay: true, wasPlanned: t < 3, postpones: t === 3 ? 1 : 0 }, `0${8 + t}:00`);
    f(day, 'train', 'session', `${day}-s`, { plannedExercises: 4, touchedExercises: 4, plannedSets: 12, workingSets: 12 }, '17:00');
    f(day, 'mind', 'board', `${day}-b`, { daily: true, afterBedtime: false, type: 'crowns', diff: 'easy', hintsUsed: 0 }, '18:00');
    for (let a = 0; a < 5; a++) f(day, 'mind', 'learn-answer', `${day}-a${a}`, { itemId: `i${a}`, conceptId: `c${a}`, correct: a !== 2, score: a !== 2 ? 1 : 0, dropId: `drop:daily:${day}`, afterBedtime: false }, `19:0${a}`);
    f(day, 'gamify', 'learn-drop', day, {}, '19:10');
    for (let c = 0; c < 2; c++) f(day, 'mind', 'card', `${day}:card${c}`, { afterBedtime: false, correct: true }, `20:0${c}`);
    f(day, 'bonuses', 'lightsout', day, { lightsOutAt: at(day, '23:00'), bedtimeTarget: at(day, '23:15'), metTarget: true }, '23:00');
    // 40 purchases spread over the year: the 11 items once each, then freezes.
    if (d % 9 === 4 && bought < 40) {
      const itemId = bought < items.length ? items[bought]! : 'freeze';
      f(day, 'economy', 'purchase', `${itemId}:${at(day, '21:00')}`, { itemId, price: prices[itemId] }, '21:00');
      bought++;
    }
  }
  return out;
}
const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'bench' });
const stats = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return { median: +((s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2).toFixed(2), min: +s[0]!.toFixed(2), max: +s.at(-1)!.toFixed(2), n: s.length }; };
function time(fn: () => unknown, runs = RUNS) { fn(); const xs: number[] = []; for (let i = 0; i < runs; i++) { const t = performance.now(); fn(); xs.push(performance.now() - t); } return stats(xs); }
async function timeAsync(fn: (i: number) => Promise<unknown>, runs = RUNS) { const xs: number[] = []; for (let i = 0; i < runs; i++) { const t = performance.now(); await fn(i); xs.push(performance.now() - t); } return stats(xs); }

it(`bench ${BRANCH}`, async () => {
  const facts = ledger();
  const base = [setting('economy.v2From', '2026-10-01'), setting('economyVisibleFrom', START)];
  const res: Record<string, unknown> = { branch: BRANCH, facts: facts.length, purchases: facts.filter(f => f.kind === 'purchase').length, today: TODAY };
  const plain = econ.deriveEconomy(facts, undefined, base, TODAY);
  res.view = { totalXp: plain.totalXp, level: plain.level, shards: plain.shards, owned: plain.owned.length, streak: plain.streak.days };
  res.deriveNoCloses = time(() => econ.deriveEconomy(facts, undefined, base, TODAY));
  const closesFor = (econ as Record<string, unknown>).closesFor as undefined | ((f: LedgerRow[], s: SettingRow[], t: string) => Map<string, unknown>);
  let withCloses = base;
  if (closesFor) {
    res.closesFor = time(() => closesFor(facts, base, TODAY));
    const closes = [...closesFor(facts, base, TODAY)].map(([day, value]) => setting(`${econ.CLOSE_PREFIX}${day}`, value));
    withCloses = [...base, ...closes];
    res.closeRows = closes.length;
    res.closesJsonBytes = JSON.stringify(closes.map(c => [c.key, c.value])).length;
    res.deriveWith365Closes = time(() => econ.deriveEconomy(facts, undefined, withCloses, TODAY));
    res.closesForWith365Closes = time(() => closesFor(facts, withCloses, TODAY));
    const v = econ.deriveEconomy(facts, undefined, withCloses, TODAY);
    res.viewWithCloses = { totalXp: v.totalXp, level: v.level, shards: v.shards, owned: v.owned.length, streak: v.streak.days };
  }
  // reconcileGamify, steady state: the same moment again (EconomyFeedback runs it after every write).
  const db = createDb(`cj2-bench-${BRANCH}`);
  await db.ledger.bulkAdd(facts);
  await db.settings.bulkPut(withCloses);
  let t = performance.now();
  await reconcileGamify(db, at(TODAY, '09:00'));
  res.reconcileFirstRun = +(performance.now() - t).toFixed(2);
  res.reconcileSteady = await timeAsync(() => reconcileGamify(db, at(TODAY, '09:00')));
  // reconcileGamify on the first open of each new day (closes one more day each time).
  res.reconcileNewDay = await timeAsync(i => reconcileGamify(db, at(addDays(TODAY, i + 1), '09:00')));
  res.ledgerRowsAfter = await db.ledger.count();
  res.closeRowsAfter = (await db.settings.toArray()).filter(r => r.key.startsWith('economy.close:')).length;
  // First run on a fresh database that has a year of ledger and no closes yet (what the update to day-close does once).
  const fresh: number[] = [];
  for (let i = 0; i < 5; i++) {
    const db2 = createDb(`cj2-bench-fresh-${BRANCH}-${i}`);
    await db2.ledger.bulkAdd(facts); await db2.settings.bulkPut(base);
    t = performance.now(); await reconcileGamify(db2, at(TODAY, '09:00')); fresh.push(performance.now() - t);
    await db2.delete();
  }
  res.reconcileFirstEverNoCloses = stats(fresh);
  await db.delete();
  console.log('BENCH ' + JSON.stringify(res));
}, 600_000);
```

### cj2-bench-scale.test.ts (part 3b, day-close only)

```ts
// @vitest-environment jsdom
// cj2 job 2 (3b, day-close only): where closesFor spends its time once every day has a close.
import 'fake-indexeddb/auto';
import { it } from 'vitest';
import { closesFor, CLOSE_PREFIX, deriveEconomy } from '../../core/economy/deriveEconomy';
import type { LedgerRow, SettingRow } from '../types';

const addDays = (key: string, n: number) => new Date(Date.parse(`${key}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const at = (day: string, time = '12:00') => new Date(`${day}T${time}:00`).getTime();
const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'bench' });
const stats = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return +((s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2).toFixed(1); };
function time(fn: () => unknown, runs = 10) { fn(); const xs: number[] = []; for (let i = 0; i < runs; i++) { const t = performance.now(); fn(); xs.push(performance.now() - t); } return stats(xs); }
function ledger(days: number, purchases: number): LedgerRow[] {
  const out: LedgerRow[] = [];
  const f = (day: string, mode: string, kind: string, refId: string, inputs: Record<string, unknown>, time: string) =>
    out.push({ id: `${kind}:${refId}`, mode, kind, refId, dayKey: day, inputs, updatedAt: at(day, time), deleted: 0, deviceId: 'bench' });
  const every = Math.max(1, Math.floor(days / purchases));
  let bought = 0;
  for (let d = 0; d < days; d++) {
    const day = addDays('2026-11-05', d);
    for (let t = 0; t < 4; t++) f(day, 'tasks', 'done', `${day}-t${t}`, { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, `0${8 + t}:00`);
    f(day, 'train', 'session', `${day}-s`, { plannedExercises: 4, touchedExercises: 4, plannedSets: 12, workingSets: 12 }, '17:00');
    f(day, 'mind', 'board', `${day}-b`, { daily: true }, '18:00');
    for (let a = 0; a < 5; a++) f(day, 'mind', 'learn-answer', `${day}-a${a}`, { correct: true, dropId: `drop:daily:${day}`, afterBedtime: false }, `19:0${a}`);
    f(day, 'gamify', 'learn-drop', day, {}, '19:10');
    for (let c = 0; c < 2; c++) f(day, 'mind', 'card', `${day}:card${c}`, { afterBedtime: false, correct: true }, `20:0${c}`);
    f(day, 'bonuses', 'lightsout', day, { metTarget: true }, '23:00');
    if (d % every === every - 1 && bought < purchases) { f(day, 'economy', 'purchase', `freeze:${d}`, { itemId: 'freeze', price: 50 }, '21:00'); bought++; }
  }
  return out;
}
it('scaling of closesFor / deriveEconomy with every day closed', () => {
  const v2 = [setting('economy.v2From', '2026-10-01'), setting('economyVisibleFrom', '2026-11-05')];
  const rows: unknown[] = [];
  for (const [days, purchases] of [[90, 10], [180, 20], [365, 0], [365, 40], [365, 120], [730, 80]] as const) {
    const facts = ledger(days, purchases), today = addDays('2026-11-05', days);
    const closes = [...closesFor(facts, v2, today)].map(([day, value]) => setting(`${CLOSE_PREFIX}${day}`, value));
    const settings = [...v2, ...closes];
    const stripped = [...v2, ...closes.map(c => setting(c.key, { ...(c.value as object), purchases: [] }))];
    rows.push({ days, purchases, facts: facts.length, closesKB: Math.round(JSON.stringify(closes.map(c => c.value)).length / 1024),
      deriveNoCloses: time(() => deriveEconomy(facts, undefined, v2, today)), deriveAllClosed: time(() => deriveEconomy(facts, undefined, settings, today)),
      closesForNoCloses: time(() => closesFor(facts, v2, today)), closesForAllClosed: time(() => closesFor(facts, settings, today)),
      closesForAllClosedPurchasesStripped: time(() => closesFor(facts, stripped, today)) });
  }
  console.log('SCALE ' + JSON.stringify(rows));
}, 600_000);
```

Raw benchmark lines:

```
BENCH {"branch":"ship-27","facts":5515,"purchases":40,"today":"2027-11-05","view":{"totalXp":90885,"level":43,"shards":8178,"owned":11,"streak":365},"deriveNoCloses":{"median":33.81,"min":29.52,"max":55.49,"n":20},"reconcileFirstRun":234.99,"reconcileSteady":{"median":136.08,"min":102.2,"max":206.29,"n":20},"reconcileNewDay":{"median":101.27,"min":85.91,"max":194.26,"n":20},"ledgerRowsAfter":5542,"closeRowsAfter":0,"reconcileFirstEverNoCloses":{"median":124.3,"min":107.47,"max":195.28,"n":5}}
BENCH {"branch":"day-close","facts":5515,"purchases":40,"today":"2027-11-05","view":{"totalXp":90885,"level":43,"shards":8178,"owned":11,"streak":365},"deriveNoCloses":{"median":37.55,"min":28.82,"max":52.08,"n":20},"closesFor":{"median":30.38,"min":28.78,"max":51.37,"n":20},"closeRows":365,"closesJsonBytes":811580,"deriveWith365Closes":{"median":45.18,"min":37.25,"max":77.23,"n":20},"closesForWith365Closes":{"median":222.09,"min":205.24,"max":315.66,"n":20},"viewWithCloses":{"totalXp":90885,"level":43,"shards":8178,"owned":11,"streak":365},"reconcileFirstRun":522.45,"reconcileSteady":{"median":478.62,"min":410.71,"max":604.07,"n":20},"reconcileNewDay":{"median":503.03,"min":388.93,"max":654.71,"n":20},"ledgerRowsAfter":5542,"closeRowsAfter":385,"reconcileFirstEverNoCloses":{"median":179.58,"min":164.19,"max":270.99,"n":5}}
BENCH {"branch":"ship-27","facts":5515,"purchases":40,"today":"2027-11-05","view":{"totalXp":90885,"level":43,"shards":8178,"owned":11,"streak":365},"deriveNoCloses":{"median":33.49,"min":29.25,"max":67.28,"n":20},"reconcileFirstRun":440.66,"reconcileSteady":{"median":120.16,"min":100.89,"max":227.58,"n":20},"reconcileNewDay":{"median":111.38,"min":88.88,"max":167.77,"n":20},"ledgerRowsAfter":5542,"closeRowsAfter":0,"reconcileFirstEverNoCloses":{"median":180.26,"min":109.05,"max":269.89,"n":5}}
BENCH {"branch":"day-close","facts":5515,"purchases":40,"today":"2027-11-05","view":{"totalXp":90885,"level":43,"shards":8178,"owned":11,"streak":365},"deriveNoCloses":{"median":42.46,"min":29.46,"max":130.85,"n":20},"closesFor":{"median":32.43,"min":28.26,"max":64.81,"n":20},"closeRows":365,"closesJsonBytes":811580,"deriveWith365Closes":{"median":72.77,"min":37.32,"max":118.86,"n":20},"closesForWith365Closes":{"median":216,"min":196.03,"max":335.06,"n":20},"viewWithCloses":{"totalXp":90885,"level":43,"shards":8178,"owned":11,"streak":365},"reconcileFirstRun":550.76,"reconcileSteady":{"median":472.59,"min":402.51,"max":636.54,"n":20},"reconcileNewDay":{"median":481.32,"min":395.1,"max":738.78,"n":20},"ledgerRowsAfter":5542,"closeRowsAfter":385,"reconcileFirstEverNoCloses":{"median":219.53,"min":178.76,"max":323.29,"n":5}}
```
