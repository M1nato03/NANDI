# Clock and time-zone fuzz of the economy (cloud job batch 3, job 5)

Date: 23 Oct 2026. Branch tested: `origin/ship-32` at `dab36b3` (includes the clock fixes `8b25f49`, `8896378`, `3ca8197`, `925f4fe`).
Runner: Linux, 4 shared CPUs (other batch-3 jobs ran at the same time), Node 22.22, vitest 5.0.3, fake-indexeddb.
Nothing in the app was changed. The fuzz ran in a detached copy of the repo at `/tmp/cj3/job5-scratch/repo`,
so the repo's own vitest setup (`src/data/test-setup.ts`, fake-indexeddb) applied. The code is in the appendix.

## Summary

- The cj2 §3.5 bug is fixed. A re-run of its exact steps: 5 XP, then 25 XP, then clock back: **25 XP** (it was 5).
- 1,200 seeded sequences, 100,000 steps. With only clock moves, 04:00 crossings and time-zone changes,
  **total XP, level and every finished day's XP never dropped**. XP and level never dropped in any
  sequence that reconciled after its writes.
- **Shards still drop** with clock or time-zone moves alone: in 109 of 500 clock-only and clock+time-zone sequences.
  They reduce to four causes (A, B, D, E below). The worst: a phone that loses its date (clock back > 120 days)
  shows **0 Shards and no owned items** (measured 188 -> 0, banner lost).
- **Restoring an earlier backup** breaks the promise in most sequences that use it (524 of the 700 sequences in the restore modes fail): finished days
  show 0 XP, Shards drop, items bought today vanish. Four causes (C1-C4). Only the stored peak holds the XP total and level.
- Every failure below has a minimised repro (3 to 11 steps for most) and a hand-written vitest repro with measured numbers.

| # | What breaks | Needs | Shortest repro | Measured | Cause | Severity |
|---|---|---|---|---|---|---|
| A | Season-end Shards vanish | clock back across a season end, or flying west the morning after it | 4 ops | 65 -> 15 | `deriveEconomy.ts:257-259`, `:525`, `:168`; `gamify.ts:85` | High (network time fix, travel) |
| B | Shards minted, then taken away | clock behind, then a purchase | 8 ops | 1 -> 9 -> 1 | `deriveEconomy.ts:263-264`, `:571`, `:230-234`; `economy.ts:9,15` | Medium |
| D | Level-up Shards lost (XP and level held) | clock behind, then activity on a gap day | 11 ops | 60 -> 39 | `gamify.ts:68`; `deriveEconomy.ts:419-423`, `:437-439`, `:274-279` | Medium |
| E | 0 Shards, owned items gone | clock back > 120 days (dead clock battery, factory date) | 6 ops | 188 -> 0, banner lost | `deriveEconomy.ts:259` | High |
| C1 | Item bought today vanishes; today's Shards lost | restore of a backup from earlier today | 3 ops | banner owned -> not owned | `backup/index.ts:225-231`; `gamify.ts:90` | High |
| C2 | Finished days show 0 XP; Shards 29 -> 0 | restore of a backup whose first fact is later than a closed day | 4 ops | day 5 -> 0 | `deriveEconomy.ts:340-341`, `:426-429`, `:229-230` | High |
| C3 | A day kept only by its close is lost for good | restore, then the clock (or time zone) goes back | 6 ops | day 20 -> 0 | `gamify.ts:85` | Medium |
| C4 | XP lost (no peak yet) | write, app killed before reconcile, then restore | 4 ops | 5 -> 0 XP | `gamify.ts:71`; `backup/index.ts:220` | Low |

All "Measured" numbers come from the hand repros in Appendix C (run at 07:28 and 07:31, same numbers; `uptime` load 2.2 and 1.5). Line numbers are on `dab36b3`.

## 1. Method

**What the fuzz drives (real code, no mocks):** `createTaskRepos` (`createTask`, `completeTask`, `recordLightsOut`),
`createTrainRepos().restDayCheck`, `setSoftState` + `doSoftThing`, `putDailyBoardFact` (daily board),
`purchaseShopItem` (a random item from that day's catalogue), `reconcileGamify`, `exportBackup`, `importBackup`.
Each sequence gets a fresh Dexie database on fake-indexeddb.

**Clock:** `vi.useFakeTimers({ toFake: ['Date'] })`, plus an explicit `now` passed to every repo. **Time zone:**
`process.env.TZ` switches at run time. A test checks this: 22:00 UTC reads 18 in New York and 3 in Kolkata. So
`dayKey()` and every `Date` setter see the new zone, as on a phone. Start: 20 Oct 2026, 12:00 Kolkata.

**Operations.** Each op is plain data, so any subset replays exactly:

| Op | Meaning | Weight |
|---|---|---|
| `day` | a normal night passes: next local day at a random hh:mm | 30% |
| `fwd n` | clock jumps forward 1-30 days | 8% |
| `back n` | clock jumps back 1-30 days | 8% |
| `tz` | Asia/Kolkata, Asia/Dubai or America/New_York; same instant | 6% |
| `at 03:4x`, task, `at 04:0x` | cross the 04:00 day boundary with a task just before it | 5% |
| `backup` | `exportBackup` (kept in memory) | 5% |
| `restore` | `importBackup` of any earlier backup | 5% |
| `skipReconcile` | the next write is not followed by `reconcileGamify` (app killed) | 3% |
| `act` | task, rest check, daily board, soft day, buy, lights-out, 1-90 min later | rest |

After every clock change, write and restore, the fuzz reads what the screen would show,
`deriveEconomy(ledger, undefined, settings, dayKey(now))` (as `EconomyScreens.tsx:21-23` does). It reads **twice**:
before `reconcileGamify` (the first frame) and after it.

**Invariants checked at each read:**

| Kind | Rule |
|---|---|
| `xp-drop` | total XP never below the highest shown so far |
| `level-drop` | level never below the highest shown so far |
| `shards-drop` | Shards never below the last shown value, minus the price of a purchase made in this step |
| `owned-lost` | an item once shown as owned stays owned |
| `day-drop` | a day once shown as finished (before today) never shows less XP later, even after the clock went back and forward again |
| `day-rise` | a day that stayed finished the whole time never changes at all (a rise is allowed only after a restore, or after the clock reopened the day) |
| `shards-drop-finished`, `owned-lost-finished` | on a restore: Shards and owned items never below what the last finished day ended with |

**Modes:**
- `clock`: clock moves only, no time zone, no restore.
- `clock-tz`: adds time-zone changes.
- `no-skip`: adds backup and restore.
- `all`: adds killed-before-reconcile.
- `nonempty`: the same as `no-skip`, but a backup of an empty database is not kept, so a restore never brings back a "nothing yet" state.

**Minimising:**
1. Cut the sequence after the first break.
2. Remove chunks of size n/2, n/4, ... 1, while a break of the same kind still happens.
3. Shrink the jump sizes.

181 failures were minimised: every failing seed of `clock` and `clock-tz` (109), and up to 2-4 per kind per run for the restore modes (72).

## 2. Runs (measured)

The final runs took 06:33-06:52, two runs in parallel. `uptime` load average was 1.5 at the start and 6.5 at the peak (shared machine).

| Run | Mode | Seeds | Sequences | Steps each | Steps | Failing sequences | Breaks by kind (sequences) | Longest day range | Time |
|---|---|---|---|---|---|---|---|---|---|
| clock-60 | clock | 1000-1199 | 200 | 60 | 12,000 | 20 | shards-drop 20 | 142 days | 165 s |
| clock-200 | clock | 5000-5049 | 50 | 200 | 10,000 | 31 | shards-drop 31 | 348 days | 336 s |
| clocktz-60 | clock-tz | 1000-1199 | 200 | 60 | 12,000 | 27 | shards-drop 27 | 189 days | 168 s |
| clocktz-200 | clock-tz | 5000-5049 | 50 | 200 | 10,000 | 31 | shards-drop 31 | 345 days | 353 s |
| noskip-60 | no-skip | 1000-1199 | 200 | 60 | 12,000 | 142 | day-drop 90, owned-lost 7, owned-lost-finished 1, shards-drop 136, shards-drop-finished 86 | 189 days | 164 s |
| noskip-200 | no-skip | 5000-5049 | 50 | 200 | 10,000 | 50 | day-drop 49, owned-lost 26, owned-lost-finished 16, shards-drop 50, shards-drop-finished 42 | 326 days | 318 s |
| all-60 | all | 1000-1199 | 200 | 60 | 12,000 | 146 | day-drop 89, owned-lost 7, owned-lost-finished 2, shards-drop 139, shards-drop-finished 85, xp-drop 5 | 170 days | 148 s |
| all-200 | all | 5000-5049 | 50 | 200 | 10,000 | 49 | day-drop 46, owned-lost 23, owned-lost-finished 10, shards-drop 48, shards-drop-finished 45, xp-drop 3 | 328 days | 292 s |
| nonempty-60 | nonempty | 1000-1199 | 200 | 60 | 12,000 | 137 | day-drop 80, owned-lost 8, owned-lost-finished 1, shards-drop 130, shards-drop-finished 78 | 189 days | 160 s |
| **Total** | | | **1,200** | | **100,000** | **633** | | | 35 min |

Never seen in any run: `level-drop`, `day-rise`. `xp-drop` appeared only with `skipReconcile` + restore (C4).
`day-drop` and `owned-lost` appeared only in modes with restore.

**What the 109 clock-only failures minimise to.** The rule: ends in an `act` -> D; contains a buy -> B; clock set
before June -> E; otherwise A. The rule is rough: 2-3 of the "B" ones on 6 Dec are really A, with a purchase the minimiser could not drop.

| Cause | clock | clock-tz | Minimised length (min / median / max ops) |
|---|---|---|---|
| A season-end Shards | 19 | 22 (1 by a time-zone change alone) | 4 / 10 / 36 |
| B look-ahead purchase | 26 | 27 | 8 / 15 / 45 |
| D gap day filled while behind | 3 | 3 | 11 / 19 / 29 |
| E clock back > 120 days | 3 | 6 | 6 / 7 / 8 |

The 72 restore-mode minimisations all reduce to C1-C4, or to the clock shapes above. No other shape was found.

## 3. Findings

### A. A clock set back across a season end hides the season-end Shards

Minimised (seed 1185, clock mode, 4 ops):
`task` -> `fwd 28 days` -> `fwd 28 days` (now 15 Dec) -> `back 10 days` (5 Dec): **Shards 65 -> 15**, on the first frame.

Hand repro A (Appendix C):
- A task on 23 Nov.
- Open on 7 Dec. Season 1 ended on 6 Dec and paid the Bench reward of 50: 65 Shards.
- Clock to 6 Dec 23:00: **15**, before and after reconcile.

Hand repro A-tz, with no clock change at all:
- Open at 08:00 on 7 Dec in Kolkata: 65 Shards.
- The phone switches to America/New_York. The same instant there is 6 Dec 21:30: **15**.

A student who flies west the morning after a season ends sees 50 Shards go.

Cause:
- `deriveEconomy.ts:257-259`: the look-ahead runs only to the latest **fact** day. Season-end Shards are not a
  fact. The replay adds them only when `today` is past the season end (`:525`, `if (season.end >= today) break`).
- The closes of the later days held them. But `readCloses` skips closes dated today or later (`:168`), and
  `reconcileGamify` deletes them (`gamify.ts:85`).

They come back when the date passes 7 Dec again (read from the code, not measured). Until then they cannot be spent.

Fix sketch:
- Store a never-lowered `economy.seenUpTo`: the highest `today` reconcile has run on, at most today + 120.
- Run the look-ahead to `max(latest fact day, seenUpTo)` instead of the latest fact day.
- Keep closes dated today or later instead of deleting them. The real-today view already ignores them, and the
  look-ahead can read them.
- Test: repros A and A-tz keep 65.

### B. A purchase made while the clock is behind spends "tomorrow's" Shards; the close hides the overdraft and mints Shards

Minimised (seed 1001, clock mode, 9 ops; seed 5011 needs 8):
1. A rest check on 21 Oct.
2. A task at 03:48 (still 21 Oct).
3. A rest check at 05:14 (22 Oct).
4. Clock back to 21 Oct.
5. Buy a rest day.
6. The next day.
7. Clock back one day: **9 -> 1**.

Hand repro B (Appendix C), measured:

| Step | Shards shown |
|---|---|
| clock back to 21 Oct, before buying (the look-ahead includes 22 Oct) | 51 |
| buy a rest day (50) on 21 Oct | 1 |
| the real 22 Oct (nothing new earned) | **9** (8 appear from nowhere) |
| the close of 21 Oct stores | `shards: 0` (the true end-of-day balance was -7) |
| clock wrong by a day again | **1** |

Cause:
- Since `925f4fe`, the shop may spend look-ahead Shards (`deriveEconomy.ts:263-264` -> `shop.ts:44`). But the
  purchase is dated the real today (`economy.ts:9,15`). So the replay for that day ends below zero.
- The day snapshot clamps the balance: `balance: Math.max(0, earned - spentSoFar)` (`deriveEconomy.ts:571`). The
  close stores 0 (`closesFor`, `:301`).
- `shardFloors` treats that 0 as a real balance (`:230`, `:234`), so the next day gains the clamped deficit (+8).
- When the clock goes back again, that close is ignored and deleted (the cause of A), and the 8 Shards go.

Fix sketch:
- Date a purchase at `max(dayKey(now), latest fact day)`, the day whose Shards paid for it.
- Keep the signed balance in the day snapshot and clamp only the shown number, so a close never invents Shards.
- Test: repro B never shows 9, and never drops from 9.

### D. Filling a gap day while the clock is behind removes a later day's welcome-back gift and its level-up Shards

Minimised (seed 1116, 11 ops): a 1-Shard drop. Seed 1086 (28 ops) and seed 1115 (31 ops) show the large form: 83 -> 62 and 96 -> 75.

Hand repro D (Appendix C):
1. 9 tasks on 10 Nov (clock ahead).
2. Clock fixed to 8 Nov, and a task. Now 10 Nov follows a missed 9 Nov, so the replay gives 10 Nov the 15 XP welcome-back gift.
3. On the real 9 Nov, one task: **Shards 60 -> 39**. XP (102.5) and level (2) stay, held by the peak.

Cause:
- The welcome-back gift is recorded only for the real today (`gamify.ts:68`). On a look-ahead day it stays
  computed, and it moves when an earlier day gains a mark (`deriveEconomy.ts:419-423`).
- Losing those 15 XP puts the replay back under level 2. Level-up Shards come from the replay's own level
  (`:437-439`). `withPeak` floors XP and level (`:274-279`), but not the 20 Shards the level paid.

Fix sketch:
- Record a welcome-back fact for every day the look-ahead view gives one, not only for today.
- Pay level-up Shards up to `max(replay level, peak level)`, so a level once shown keeps its Shards.

### E. A clock set back more than 120 days shows 0 Shards and drops owned items

Minimised (seed 5046, 6 ops): a rest check, then five `back` jumps (to 19 Jun): **6 -> 0**. Seed 1082 (7 ops): 15 -> 0.

Hand repro E (Appendix C):
- A month of activity, then a banner bought on 7 Dec, with 188 Shards left.
- Clock set to 1 Jan 2026 (a phone that lost its date): **0 Shards, owned items empty**.
- XP 580 and level 3 stay (peak). The setting `economy.banner` still names the banner, so the screen and the owned list disagree.

Cause: `deriveEconomy.ts:259` caps the look-ahead at today + 120 days, so every fact (earnings and purchases) is out of view.

Fix sketch: when the latest fact is more than 120 days ahead, do not cap. Either run the look-ahead to the latest
fact, or freeze the economy screen with a "Your phone's date looks wrong" note. A phone that resets to its factory
date (often 2016 or 1970) is the common case.

### C. Restore of an earlier backup

These all need a restore. The promise in the batch header is about finished days. C1 is about today.

**C1. Items bought and Shards earned today vanish.**

Minimised: `backup` -> `task` -> `restore` (3 ops): Shards 15 -> 0 (XP held by the peak). With a purchase (seed 1061, 16 ops): `cardback:weave` lost.

Hand repro C1:
- Banner bought at 15:00: Shards 210, banner owned.
- Restore the 09:00 backup: **banner not owned**, Shards 360 (refunded), the `economy.banner` setting gone.

Cause: `importBackup` clears and replaces the ledger (`backup/index.ts:225-231`). It carries over only the closes of
finished days (`:239-242`) and the XP peak (`:233-238`). Today has no close (`gamify.ts:90`, `day < today`), so today's facts are simply gone.

Fix sketch (a product decision: it decides what a restore may undo):
- Keep this phone's ledger facts that are missing from the backup. Facts are immutable with idempotent ids, so a union is safe.
- At least keep `purchase` facts and the shop settings they set.

**C2. Closes before the first restored fact are ignored.**

Minimised:
- `backup` (nothing done yet) -> `task` -> `next day` -> `restore` (4 ops): 20 Oct shows 5 -> **0**.
- With a non-empty backup (seed 1006, nonempty mode, 6 ops): lights-out, backup, clock back a day, task, 04:18, restore: 19 Oct shows 5 -> **0**.

Hand repro C2:
- Before the restore: 10 XP, 29 Shards; days 20 Oct: 5, 21 Oct: 5.
- After restoring the install-day backup: XP 10 (peak only), **Shards 0**, and both days are gone from the view.
  Both closes are still stored (`total 5`; `shards` 15 and 29).

Cause: the replay's day range starts at the first fact or at `economyVisibleFrom` (`deriveEconomy.ts:340-341`). Closes
before it never reach `days` (the hold at `:426-429`) or the Shards floor (`:229-230` skips a close with no replayed day).

Fix sketch: start the range at `min(first fact, first close day)`. Test: repro C2 keeps both days and 29 Shards.

**C3. Restore, then the clock (or time zone) goes back: the close that still held a lost day is deleted.**

Hand repro C3: after a restore, 25 Oct is shown at 20 XP from its close. Clock back to 24 Oct, then forward again: **0**.

A time-zone form (seed 1004, nonempty, 6 ops):
1. A soft day, then a backup, then a task.
2. 04:06 in Kolkata, then a switch to Dubai (02:36 there, so the day before).
3. A restore: Shards 16 -> 1.

Cause: `gamify.ts:85` deletes closes dated today or later. After a restore they can be the only record.

Fix sketch: the same as A, keep those closes.

**C4. XP not yet reconciled when a restore runs is lost.**

Minimised (seeds 1078, 1084, 1157, 5034, 5040; 4 ops): `backup` -> `skipReconcile` -> task -> `restore`: XP 5 -> 0.
Hand repro C4: 5 -> 0.

Cause: only `reconcileGamify` raises the peak (`gamify.ts:71`), and `importBackup` reads the stored peak (`backup/index.ts:220`).
In the app the window is short (`EconomyFeedback.tsx:72` reconciles after each change), so this needs a kill or a crash first.

Fix sketch: `importBackup` derives the current view before it clears, and floors the peak with it.

## 4. What holds on ship-32

- cj2 §3.5 steps: 5 -> 25 -> 25 XP, before and after reconcile. Level 1 throughout. Shards 15 -> 17 -> 17.
- Clock moves, 04:00 crossings and three time zones (500 sequences, 44,000 steps) caused no XP drop and no level drop.
  The fuzz saw no owned item lost (hand repro E shows one can be lost after a jump of more than 120 days).
  No finished day's XP went lower or changed.
- 04:00 crossings (in every mode, about 5% of ops): no break traced to the boundary itself. A task at 03:4x lands on the
  previous day and stays there.
- A time-zone change behaves like a clock move of up to 10.5 hours. The only time-zone-only break is A-tz.

## 5. Limits

- Not driven: focus timers and boosts, Learn drops and lessons, side quests, the weekly training bonus, rest-weekday picks,
  away plans, puzzles other than the daily board, and after-bedtime Mind (Mind was always before bedtime here).
- The screen is modelled as `deriveEconomy(...)` with `dayKey(Date.now())`. There is no React and no `EconomyFeedback`
  debounce. Reconcile runs right after each write unless the op says otherwise.
- Backups stay in memory as envelopes. The file picker and the JSON round trip of the Backup screen were not used.
- The minimiser keeps the same *kind* of break, so a minimised repro can show a simpler cause than the original
  sequence did. That is why D and E were split out by hand.
- The timings come from a shared 4-CPU machine. They show only the cost of the fuzz: about 1 s per 60-step sequence.

## 6. Suggested order

1. A + C3: keep closes dated ahead, and run the look-ahead to a stored `seenUpTo`. One change fixes three repros.
2. E: no 120-day cap when the clock is far behind, or a "phone date looks wrong" state.
3. B: date purchases at the look-ahead day, and keep signed day balances.
4. C2: the day range starts at the first close.
5. D: record welcome-back on look-ahead days, and pay level Shards up to the peak level.
6. C1 and C4 need a product decision: should a restore be able to undo today? If not, union the ledgers.
7. Once A-E are fixed, add the fuzz to CI as a small seeded run (for example 20 seeds x 60 steps, about 20 s).

## Appendix A: how to re-run

```sh
git -C <clone> worktree add --detach /tmp/cj3/job5-scratch/repo origin/ship-32
cd /tmp/cj3/job5-scratch/repo && npm ci
# put clockFuzz.test.ts and clockRepros.test.ts (below) in src/data/
FUZZ_MODE=clock FUZZ_SEEDS=200 FUZZ_STEPS=60 FUZZ_BASE=1000 FUZZ_OUT=/tmp/out.json npx vitest run src/data/clockFuzz.test.ts -t fuzz
# modes: clock | clock-tz | no-skip | all; add FUZZ_NONEMPTY=1 for the nonempty run
FUZZ_SEEDS=0 FUZZ_TRACE=1 FUZZ_REPLAY='[{"t":"backup"},{"t":"act","kind":"task","item":0,"mins":5},{"t":"restore","pick":0}]' npx vitest run src/data/clockFuzz.test.ts -t replay --silent=false
FUZZ_SEEDS=0 FUZZ_MINLIST='[{"seed":1185,"mode":"clock","kind":"shards-drop","steps":60}]' FUZZ_OUT=/tmp/min.json npx vitest run src/data/clockFuzz.test.ts -t 'minimise list'
npx vitest run src/data/clockRepros.test.ts --silent=false
```

The minimisation runs used a copy of the file with one change. A `shards-drop` caused by an `act` op is reported as
`shards-drop-act`, so D could be minimised on its own:
```ts
if (v.shards < lastShards - spent) fail(op.t === 'act' ? 'shards-drop-act' : 'shards-drop', `${lastShards} -> ${v.shards} (spent ${spent}, today ${today})`);
```

## Appendix B: the fuzz (`src/data/clockFuzz.test.ts`, as run)

```ts
// @vitest-environment jsdom
// Seeded clock and time-zone fuzz of the economy (cloud job batch 3, job 5). Lives in /tmp only; never committed.
// Drives the real repos, reconcileGamify, exportBackup and importBackup on fake-indexeddb, with a fake phone clock
// and process.env.TZ switched at run time. After every step it checks what deriveEconomy would show.
import 'fake-indexeddb/auto';
import { afterAll, expect, it, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { createDb, type NandiDb } from './db';
import { reconcileGamify } from './repos/gamify';
import { createTaskRepos } from './repos/tasks';
import { createTrainRepos } from './repos/train';
import { purchaseShopItem } from './repos/economy';
import { doSoftThing, setSoftState } from './repos/soft';
import { putDailyBoardFact } from './repos/learn';
import { exportBackup, importBackup, type BackupEnvelope } from './backup';
import { getOrCreateDeviceId } from './device';
import { deriveEconomy, type EconomyView } from '../core/economy/deriveEconomy';
import { catalogue } from '../core/economy/shop';
import { dayKey } from '../core/time';
import type { PuzzleRunRow } from './types';

const ZONES = ['Asia/Kolkata', 'Asia/Dubai', 'America/New_York'] as const;
type Zone = typeof ZONES[number];
type Act = 'task' | 'rest' | 'board' | 'soft' | 'buy' | 'lights';
export type Op =
  | { t: 'day'; hour: number; min: number }            // a normal night passes: next local day at hh:mm
  | { t: 'fwd'; days: number; hour: number }           // phone clock jumps forward n days
  | { t: 'back'; days: number; hour: number }          // phone clock jumps back n days
  | { t: 'tz'; zone: Zone }                            // time zone changes, same instant
  | { t: 'at'; hour: number; min: number }             // clock runs on to the next local hh:mm (03:5x then 04:0x crosses 04:00)
  | { t: 'act'; kind: Act; item: number; mins: number } // one thing done in the app, mins after the last step
  | { t: 'backup' }
  | { t: 'restore'; pick: number }                     // restore one of the backups taken so far (pick mod count)
  | { t: 'skipReconcile' };                            // the next write is not followed by a reconcile (app killed)

export interface Failure { step: number; op: Op; phase: 'pre' | 'post'; kind: string; detail: string }

function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function generate(seed: number, steps: number, opts: { restores: boolean; tz: boolean; skips: boolean }): Op[] {
  const r = mulberry32(seed); const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const ops: Op[] = []; let backups = 0;
  const acts: Act[] = ['task', 'task', 'task', 'rest', 'board', 'soft', 'buy', 'buy', 'lights'];
  while (ops.length < steps) {
    const x = r();
    if (x < 0.30) ops.push({ t: 'day', hour: int(6, 23), min: int(0, 59) });
    else if (x < 0.38) ops.push({ t: 'fwd', days: int(1, 30), hour: int(5, 23) });
    else if (x < 0.46) ops.push({ t: 'back', days: int(1, 30), hour: int(5, 23) });
    else if (x < 0.52 && opts.tz) ops.push({ t: 'tz', zone: ZONES[int(0, 2)]! });
    else if (x < 0.57) { ops.push({ t: 'at', hour: 3, min: int(40, 59) }); ops.push({ t: 'act', kind: 'task', item: int(0, 99), mins: 0 }); ops.push({ t: 'at', hour: 4, min: int(0, 20) }); }
    else if (x < 0.62) { ops.push({ t: 'backup' }); backups++; }
    else if (x < 0.67 && opts.restores && backups > 0) ops.push({ t: 'restore', pick: int(0, 99) });
    else if (x < 0.70 && opts.skips) ops.push({ t: 'skipReconcile' });
    else ops.push({ t: 'act', kind: acts[int(0, acts.length - 1)]!, item: int(0, 99), mins: int(1, 90) });
  }
  return ops.slice(0, steps);
}

let serial = 0;
const START = Date.UTC(2026, 9, 20, 6, 30); // 20 Oct 2026, 12:00 in Kolkata

/** Run one sequence; returns every invariant break (the first few are enough). */
export async function runSequence(ops: Op[], stopAtFirst = true): Promise<{ failures: Failure[]; maxDays: number }> {
  process.env.TZ = 'Asia/Kolkata';
  let now = START;
  vi.setSystemTime(now);
  const db: NandiDb = createDb(`clock-fuzz-${process.pid}-${++serial}`);
  const failures: Failure[] = [];
  try {
    const deviceId = await getOrCreateDeviceId(db, now);
    const tasks = createTaskRepos(db, deviceId), train = createTrainRepos(db, deviceId);
    const backups: BackupEnvelope[] = [];
    let maxXp = 0, maxLevel = 1, lastShards = 0, skip = false, taskN = 0;
    const owned = new Set<string>();
    const finished = new Map<string, { total: number; reopened: boolean }>();
    let restoredSince = false, maxDaysSeen = 0;
    // What the last finished day ended with (the last screen seen on an earlier day), and spends since then.
    let lastCheck = { today: '', shards: 0, owned: [] as string[] }, snap = { shards: 0, owned: [] as string[] }, spentSinceSnap = 0;
    const view = async (): Promise<EconomyView> => deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), dayKey(now));
    const check = async (step: number, op: Op, phase: 'pre' | 'post', spent: number) => {
      const v = await view(); const today = dayKey(now);
      const fail = (kind: string, detail: string) => failures.push({ step, op, phase, kind, detail });
      if (v.totalXp < maxXp) fail('xp-drop', `${maxXp} -> ${v.totalXp} (today ${today})`);
      if (v.level < maxLevel) fail('level-drop', `${maxLevel} -> ${v.level}`);
      if (v.shards < lastShards - spent) fail('shards-drop', `${lastShards} -> ${v.shards} (spent ${spent}, today ${today})`);
      for (const id of owned) if (!v.owned.includes(id)) fail('owned-lost', `${id} (today ${today})`);
      const byDay = new Map(v.days.map(d => [d.dayKey, d.total]));
      for (const [day, rec] of finished) {
        if (day >= today) { rec.reopened = true; continue; }
        const total = byDay.get(day) ?? 0;
        if (total < rec.total) fail('day-drop', `${day}: ${rec.total} -> ${total} (today ${today})`);
        else if (total > rec.total && !rec.reopened && !(op.t === 'restore' || restoredSince)) fail('day-rise', `${day}: ${rec.total} -> ${total} (today ${today})`);
      }
      for (const d of v.days) if (d.dayKey < today) {
        const rec = finished.get(d.dayKey);
        if (!rec) finished.set(d.dayKey, { total: d.total, reopened: false });
        else if (d.total >= rec.total) rec.total = d.total;
      }
      if (lastCheck.today && lastCheck.today < today) { snap = { shards: lastCheck.shards, owned: lastCheck.owned }; spentSinceSnap = 0; }
      spentSinceSnap += spent;
      if (op.t === 'restore') {
        if (v.shards < snap.shards - spentSinceSnap) fail('shards-drop-finished', `${snap.shards} at the end of a finished day -> ${v.shards} (spent since ${spentSinceSnap}, today ${today})`);
        for (const id of snap.owned) if (!v.owned.includes(id)) fail('owned-lost-finished', `${id} (today ${today})`);
      }
      lastCheck = { today, shards: v.shards, owned: [...v.owned] };
      maxXp = Math.max(maxXp, v.totalXp); maxLevel = Math.max(maxLevel, v.level); lastShards = v.shards;
      for (const id of v.owned) owned.add(id);
    };
    const setClock = (local: Date) => { now = local.getTime(); vi.setSystemTime(now); };
    const reconcile = async () => { if (skip) { skip = false; return; } await reconcileGamify(db, now); };
    await reconcile();
    for (let step = 0; step < ops.length; step++) {
      const op = ops[step]!;
      let spent = 0;
      const d = new Date(now);
      switch (op.t) {
        case 'day': d.setDate(d.getDate() + 1); d.setHours(op.hour, op.min, 0, 0); setClock(d); break;
        case 'fwd': d.setDate(d.getDate() + op.days); d.setHours(op.hour, 0, 0, 0); setClock(d); break;
        case 'back': d.setDate(d.getDate() - op.days); d.setHours(op.hour, 0, 0, 0); setClock(d); break;
        case 'tz': process.env.TZ = op.zone; break;
        case 'at': { const next = new Date(now); next.setHours(op.hour, op.min, 0, 0); if (next.getTime() <= now) next.setDate(next.getDate() + 1); setClock(next); break; }
        case 'skipReconcile': skip = true; break;
        default: break;
      }
      if (op.t === 'day' || op.t === 'fwd' || op.t === 'back' || op.t === 'tz' || op.t === 'at') {
        await check(step, op, 'pre', 0);                       // the screen before reconcile has run
        await reconcile();                                      // the app opens or resumes
      } else if (op.t === 'act') {
        setClock(new Date(now + op.mins * 60_000));
        const day = dayKey(now);
        try {
          if (op.kind === 'task') {
            const id = `fz-${++taskN}`;
            await tasks.createTask({ id, title: 'Fuzz task', size: 'S', estimateMin: 15, plannedSize: 'S', dayKey: day, scheduledStart: now, mustOrCould: 'could' }, now);
            await tasks.completeTask(id, now + 60_000);
          } else if (op.kind === 'rest') await train.restDayCheck(now, 20);
          else if (op.kind === 'board') {
            const run = { id: `daily:${day}:crowns`, type: 'crowns', dayKey: day, daily: true, diff: 'easy', result: 'solved', hintsUsed: 0, updatedAt: now, deleted: 0, deviceId } as PuzzleRunRow;
            await db.transaction('rw', db.ledger, () => putDailyBoardFact(db, run, false, now));
          } else if (op.kind === 'soft') { await setSoftState(db, 'tired', now); await doSoftThing(db, 'breathe', now); }
          else if (op.kind === 'lights') await tasks.recordLightsOut(now);
          else if (op.kind === 'buy') {
            const items = catalogue(day); const item = items[op.item % items.length]!;
            const res = await purchaseShopItem(db, item.id, now);
            if (res.ok) spent = item.price;
          }
        } catch { /* a refused action (rest bank full, Must limit) is fine */ }
        await check(step, op, 'pre', spent);                   // the screen right after the write
        spent = 0;
        await reconcile();
      } else if (op.t === 'backup') {
        if (!process.env.FUZZ_NONEMPTY || await db.ledger.count()) backups.push(await exportBackup(db, now));
      } else if (op.t === 'restore') {
        if (backups.length) { await importBackup(db, backups[op.pick % backups.length]!); restoredSince = true; }
        await check(step, op, 'pre', 0);
        await reconcile();                                      // the app reconciles once the restore has finished
      }
      await check(step, op, 'post', spent);
      maxDaysSeen = Math.max(maxDaysSeen, (await view()).days.length);
      if (process.env.FUZZ_TRACE) { const v = await view(); const closes = (await db.settings.toArray()).filter(r => r.key.startsWith('economy.close:')).map(r => r.key.slice(14)).sort();
        if (process.env.FUZZ_DUMP) { console.log('   LEDGER', (await db.ledger.toArray()).map(f => `${f.id}@${f.dayKey}${f.inputs.price ? '$' + f.inputs.price : ''}`).join(' ')); console.log('   CLOSES', JSON.stringify((await db.settings.toArray()).filter(r => r.key.startsWith('economy.close:') || r.key === 'economy.peak').map(r => [r.key.slice(8), r.value]))); }
        console.log(step, JSON.stringify(op), process.env.TZ, new Date(now).toISOString(), 'today', dayKey(now), 'xp', v.totalXp, 'lvl', v.level, 'sh', v.shards, 'owned', v.owned.join('|'), 'facts', (await db.ledger.count()), 'closes', closes.length ? closes[0] + '..' + closes.at(-1) + ' n' + closes.length : '-', 'days', v.days.filter(x => x.total).map(x => x.dayKey.slice(5) + ':' + x.total).join(' ')); }
      if (stopAtFirst && failures.length) break;
    }
    return { failures, maxDays: maxDaysSeen };
  } finally {
    await db.delete();
    process.env.TZ = 'Asia/Kolkata';
  }
}

/** Shortest repro: drop chunks, then single ops, while the same kind of break still happens. */
export async function minimise(ops: Op[], kind: string): Promise<Op[]> {
  const fails = async (candidate: Op[]) => (await runSequence(candidate)).failures.some(f => f.kind === kind);
  let current = ops;
  const first = (await runSequence(current)).failures.find(f => f.kind === kind);
  if (first) current = current.slice(0, first.step + 1);
  for (let chunk = Math.max(1, Math.floor(current.length / 2)); chunk >= 1; chunk = Math.floor(chunk / 2)) {
    for (let i = 0; i < current.length;) {
      const candidate = [...current.slice(0, i), ...current.slice(i + chunk)];
      if (candidate.length && await fails(candidate)) current = candidate; else i += chunk;
    }
  }
  // Simplify numbers: smaller jumps and earlier picks, one field at a time.
  for (let i = 0; i < current.length; i++) {
    const op = current[i]!;
    if ((op.t === 'fwd' || op.t === 'back') && op.days > 1) {
      for (const days of [1, 2, 3, 5, 10]) if (days < op.days) { const c = [...current]; c[i] = { ...op, days }; if (await fails(c)) { current = c; break; } }
    }
  }
  return current;
}

const SEEDS = Number(process.env.FUZZ_SEEDS ?? 40), STEPS = Number(process.env.FUZZ_STEPS ?? 60), BASE = Number(process.env.FUZZ_BASE ?? 1000);
const MODE = process.env.FUZZ_MODE ?? 'all';
const results: unknown[] = [];
afterAll(() => { if (results.length) writeFileSync(process.env.FUZZ_OUT ?? '/tmp/cj3/job5-scratch/fuzz-out.json', JSON.stringify(results, null, 1)); });

it.runIf(!!process.env.FUZZ_REPLAY)('replay', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const ops = JSON.parse(process.env.FUZZ_REPLAY!) as Op[];
  const { failures } = await runSequence(ops, false);
  console.log(JSON.stringify(failures.slice(0, 8), null, 1));
  vi.useRealTimers();
});

it('tz switch works at run time', () => {
  const t = Date.UTC(2026, 9, 23, 22, 0);
  process.env.TZ = 'America/New_York'; const ny = new Date(t).getHours();
  process.env.TZ = 'Asia/Kolkata'; const ist = new Date(t).getHours();
  expect([ny, ist]).toEqual([18, 3]);
});

it(`fuzz ${MODE}: ${SEEDS} seeds x ${STEPS} steps`, async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const opts = MODE === 'clock' ? { restores: false, tz: false, skips: false }
    : MODE === 'clock-tz' ? { restores: false, tz: true, skips: false }
    : MODE === 'no-skip' ? { restores: true, tz: true, skips: false }
    : { restores: true, tz: true, skips: true };
  const started = Date.now.call(globalThis);
  for (let s = 0; s < SEEDS; s++) {
    const seed = BASE + s;
    const ops = generate(seed, STEPS, opts);
    const t0 = performance.now();
    const { failures, maxDays } = await runSequence(ops, false);
    const ms = Math.round(performance.now() - t0);
    const kinds = [...new Set(failures.map(f => f.kind))];
    const entry: Record<string, unknown> = { seed, mode: MODE, steps: ops.length, ms, maxDays, kinds, failures: failures.slice(0, 6), ops };
    if (process.env.FUZZ_MIN === '1') {
      const minimised: Record<string, Op[]> = {};
      for (const kind of kinds) minimised[kind] = await minimise(ops, kind);
      entry.minimised = minimised;
    }
    results.push(entry);
    console.log(JSON.stringify({ seed, ms, maxDays, kinds }));
  }
  void started;
  vi.useRealTimers();
}, 3_600_000);

const optsFor = (mode: string) => mode === 'clock' ? { restores: false, tz: false, skips: false }
  : mode === 'clock-tz' ? { restores: false, tz: true, skips: false }
  : mode === 'no-skip' ? { restores: true, tz: true, skips: false }
  : { restores: true, tz: true, skips: true };
it.runIf(!!process.env.FUZZ_MINLIST)('minimise list', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const list = JSON.parse(process.env.FUZZ_MINLIST!) as { seed: number; mode: string; kind: string; steps?: number }[];
  const out: unknown[] = [];
  for (const job of list) {
    const ops = generate(job.seed, job.steps ?? STEPS, optsFor(job.mode));
    const t0 = performance.now();
    const min = await minimise(ops, job.kind);
    const { failures } = await runSequence(min, false);
    out.push({ ...job, minimised: min, length: min.length, ms: Math.round(performance.now() - t0), failures: failures.filter(f => f.kind === job.kind).slice(0, 3) });
    console.log(JSON.stringify(out.at(-1)));
  }
  writeFileSync(process.env.FUZZ_OUT ?? '/tmp/cj3/job5-scratch/min-out.json', JSON.stringify(out, null, 1));
  vi.useRealTimers();
}, 3_600_000);
```

## Appendix C: hand repros (`src/data/clockRepros.test.ts`) and their measured output

```ts
// @vitest-environment jsdom
// Hand-written shortest repros of the clock-fuzz findings (cloud job batch 3, job 5). /tmp only; never committed.
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createDb, type NandiDb } from './db';
import { reconcileGamify } from './repos/gamify';
import { createTaskRepos } from './repos/tasks';
import { createTrainRepos } from './repos/train';
import { purchaseShopItem } from './repos/economy';
import { exportBackup, importBackup } from './backup';
import { getOrCreateDeviceId } from './device';
import { deriveEconomy } from '../core/economy/deriveEconomy';
import { dayKey } from '../core/time';

let db: NandiDb, n = 0, now = 0;
beforeEach(() => { process.env.TZ = 'Asia/Kolkata'; vi.useFakeTimers({ toFake: ['Date'] }); db = createDb(`repro-${++n}`); });
afterEach(async () => { vi.useRealTimers(); await db.delete(); });
const set = (iso: string) => { now = new Date(iso).getTime(); vi.setSystemTime(now); };   // local time in Asia/Kolkata
const shown = async () => deriveEconomy(await db.ledger.toArray(), undefined, await db.settings.toArray(), dayKey(now));
const repos = async () => { const id = await getOrCreateDeviceId(db, now); return { tasks: createTaskRepos(db, id), train: createTrainRepos(db, id) }; };
let t = 0;
const task = async () => { const { tasks } = await repos(); const id = `r-${++t}`;
  await tasks.createTask({ id, title: 'x', size: 'S', estimateMin: 15, plannedSize: 'S', dayKey: dayKey(now), scheduledStart: now, mustOrCould: 'could' }, now);
  await tasks.completeTask(id, now); await reconcileGamify(db, now); };

it('A: a clock set back one day hides the season-end Shards (50 -> gone)', async () => {
  set('2026-11-23T12:00:00'); await task();                       // one task in season 1
  set('2026-12-07T13:00:00'); await reconcileGamify(db, now);     // season 1 ended 6 Dec; its Shards arrive 7 Dec
  const ahead = await shown();
  set('2026-12-06T23:00:00');                                      // clock set back one day (or a network time fix)
  const before = await shown(); await reconcileGamify(db, now); const after = await shown();
  console.log('A', { ahead: ahead.shards, beforeReconcile: before.shards, afterReconcile: after.shards });
  expect(after.shards).toBeLessThan(ahead.shards);                 // the breach this repro demonstrates
});

it('B: buying with look-ahead Shards overdraws today; the close clamps it to 0, mints Shards, then a clock fix takes them away', async () => {
  const { train } = await repos();
  set('2026-10-21T04:23:00'); await train.restDayCheck(now, 20); await reconcileGamify(db, now);    // day 21 Oct
  set('2026-10-22T03:48:00'); await task();                                                         // still day 21 Oct (before 04:00)
  set('2026-10-22T05:14:00'); await train.restDayCheck(now, 20); await reconcileGamify(db, now);    // day 22 Oct
  set('2026-10-21T07:00:00'); await reconcileGamify(db, now);                                       // clock set back one day
  const beforeBuy = await shown();
  set('2026-10-21T07:47:00'); const bought = await purchaseShopItem(db, 'freeze', now); await reconcileGamify(db, now);
  const afterBuy = await shown();
  set('2026-10-22T17:59:00'); await reconcileGamify(db, now);                                       // 22 Oct again
  const nextDay = await shown();
  const close21 = (await db.settings.get('economy.close:2026-10-21'))?.value as { shards: number };
  set('2026-10-21T06:00:00'); const backPre = await shown(); await reconcileGamify(db, now);         // clock wrong by a day again
  const back = await shown();
  console.log('B', { bought, beforeBuy: beforeBuy.shards, afterBuy: afterBuy.shards, nextDay: nextDay.shards, close21Shards: close21.shards, backBeforeReconcile: backPre.shards, back: back.shards });
  expect(bought.ok).toBe(true);
  expect(back.shards).toBeLessThan(nextDay.shards);
});

it('C1: restoring a backup from this morning removes an item bought this afternoon (and today\'s Shards)', async () => {
  const { train } = await repos();
  for (let day = 2; day <= 30; day++) { set(`2026-11-${String(day).padStart(2, '0')}T10:00:00`); await task(); await task(); await train.restDayCheck(now, 20); }
  set('2026-12-07T09:00:00'); await task();                        // season 1 ended: its Shards are in
  const backup = await exportBackup(db, now);
  set('2026-12-07T15:00:00'); const bought = await purchaseShopItem(db, 'banner:grove', now); await reconcileGamify(db, now);
  const before = await shown();
  await importBackup(db, backup); await reconcileGamify(db, now);
  const after = await shown();
  console.log('C1', { bought, before: [before.shards, before.owned], after: [after.shards, after.owned], banner: (await db.settings.get('economy.banner'))?.value });
  expect(bought.ok).toBe(true);
  expect(after.owned).not.toContain('banner:grove');
});

it('C2: restoring a backup taken before the first activity hides every closed day (XP kept only by the peak)', async () => {
  set('2026-10-20T09:00:00'); await reconcileGamify(db, now);
  const backup = await exportBackup(db, now);                       // install-day backup, nothing done yet
  await task(); set('2026-10-21T09:00:00'); await task(); set('2026-10-22T09:00:00'); await reconcileGamify(db, now);
  const before = await shown();
  await importBackup(db, backup); await reconcileGamify(db, now);
  const after = await shown();
  const closes = (await db.settings.toArray()).filter(r => r.key.startsWith('economy.close:')).map(r => [r.key.slice(14), (r.value as { total: number; shards: number })]);
  console.log('C2', { before: [before.totalXp, before.shards, before.days.map(d => `${d.dayKey}:${d.total}`)], after: [after.totalXp, after.shards, after.days.map(d => `${d.dayKey}:${d.total}`)], closes: JSON.stringify(closes) });
  expect(after.days.find(d => d.dayKey === '2026-10-20')?.total ?? 0).toBeLessThan(before.days.find(d => d.dayKey === '2026-10-20')!.total);
});

it('C3: restore, then clock set back: the close that still held a lost day is deleted for good', async () => {
  set('2026-10-20T09:00:00'); await task();
  const backup = await exportBackup(db, now);
  set('2026-10-25T09:00:00'); await task(); set('2026-10-26T09:00:00'); await reconcileGamify(db, now);   // 25 Oct closed with 5+ XP
  await importBackup(db, backup); await reconcileGamify(db, now);
  const kept = await shown();                                                                        // 25 Oct still shown, from its close
  set('2026-10-24T09:00:00'); await reconcileGamify(db, now);                                       // clock back two days: close 25 Oct deleted
  set('2026-10-26T09:00:00'); await reconcileGamify(db, now);
  const later = await shown();
  console.log('C3', { kept: kept.days.find(d => d.dayKey === '2026-10-25')?.total, later: later.days.find(d => d.dayKey === '2026-10-25')?.total });
  expect(later.days.find(d => d.dayKey === '2026-10-25')?.total ?? 0).toBeLessThan(kept.days.find(d => d.dayKey === '2026-10-25')!.total);
});

it('C4: XP not yet reconciled when a restore runs is lost (no peak yet)', async () => {
  set('2026-10-20T09:00:00'); await reconcileGamify(db, now);
  const backup = await exportBackup(db, now);
  const { tasks } = await repos();
  await tasks.createTask({ id: 'c4', title: 'x', size: 'S', estimateMin: 15, plannedSize: 'S', dayKey: dayKey(now), scheduledStart: now, mustOrCould: 'could' }, now);
  await tasks.completeTask('c4', now);                               // app killed before its reconcile ran
  const before = await shown();
  await importBackup(db, backup); await reconcileGamify(db, now);
  const after = await shown();
  console.log('C4', { before: before.totalXp, after: after.totalXp });
  expect(after.totalXp).toBeLessThan(before.totalXp);
});

it('A-tz: flying Kolkata -> New York the morning the season ends hides the season-end Shards', async () => {
  set('2026-11-23T12:00:00'); await task();
  set('2026-12-07T08:00:00'); await reconcileGamify(db, now);     // 7 Dec in Kolkata: season 1 Shards shown
  const home = await shown();
  process.env.TZ = 'America/New_York';                             // same instant is 6 Dec 21:30 in New York
  const landedPre = await shown(); await reconcileGamify(db, now); const landed = await shown();
  console.log('A-tz', { today: dayKey(now), home: home.shards, landedBeforeReconcile: landedPre.shards, landed: landed.shards });
  expect(landed.shards).toBeLessThan(home.shards);
});

it('D: a later day\'s unrecorded welcome-back gift (and a level-up bonus) vanishes when the clock is behind and an earlier gap day is filled', async () => {
  const results: unknown[] = [];
  for (let k = 9; k <= 9; k++) {
    await db.delete(); db = createDb(`repro-d-${k}-${++n}`); t = 0;
    set('2026-11-10T10:00:00'); for (let i = 0; i < k; i++) await task();   // clock ahead: 10 Nov
    set('2026-11-08T10:00:00'); await task();                              // clock fixed: 8 Nov. 10 Nov now follows a missed 9 Nov
    const before = await shown();
    set('2026-11-09T10:00:00'); await reconcileGamify(db, now);             // the real 9 Nov
    const day9 = await shown();
    const { tasks } = await repos();
    await tasks.createTask({ id: `d${k}`, title: 'x', size: 'S', estimateMin: 15, plannedSize: 'S', dayKey: dayKey(now), scheduledStart: now, mustOrCould: 'could' }, now);
    await tasks.completeTask(`d${k}`, now);
    const pre = await shown(); await reconcileGamify(db, now); const post = await shown();
    results.push({ k, welcome10Nov: before.days.find(d => d.dayKey === '2026-11-10')?.welcome ?? 'n/a', xpShown: [day9.totalXp, post.totalXp], level: [day9.level, post.level], shards: [day9.shards, pre.shards, post.shards] });
  }
  console.log('D', JSON.stringify(results, null, 0));
});

it('cj2 3.5 re-run: clock ahead, earn, clock corrected back: XP stays', async () => {
  set('2026-10-20T10:00:00'); await task(); const a = await shown();
  set('2026-10-23T10:00:00'); await task(); const b = await shown();
  set('2026-10-20T18:00:00'); const cPre = await shown(); await reconcileGamify(db, now); const c = await shown();
  console.log('cj2', { day20: a.totalXp, day23: b.totalXp, backBeforeReconcile: cPre.totalXp, back: c.totalXp, levels: [a.level, b.level, c.level], shards: [a.shards, b.shards, cPre.shards, c.shards] });
  expect(c.totalXp).toBe(b.totalXp);
});

it('E: a clock set back more than 120 days (a phone that lost its date) shows 0 Shards and loses owned items', async () => {
  const { train } = await repos();
  for (let day = 2; day <= 30; day++) { set(`2026-11-${String(day).padStart(2, '0')}T10:00:00`); await task(); await task(); await train.restDayCheck(now, 20); }
  set('2026-12-07T15:00:00'); await reconcileGamify(db, now);
  const bought = await purchaseShopItem(db, 'banner:grove', now); await reconcileGamify(db, now);
  const before = await shown();
  set('2026-01-01T10:00:00'); const pre = await shown(); await reconcileGamify(db, now); const after = await shown();
  console.log('E', { bought, before: [before.totalXp, before.level, before.shards, before.owned], pre: [pre.totalXp, pre.level, pre.shards, pre.owned], after: [after.totalXp, after.level, after.shards, after.owned], banner: (await db.settings.get('economy.banner'))?.value });
  expect(after.owned).not.toContain('banner:grove');
});
```

Output of the last run (07:31, load average 1.5; the 07:28 run gave the same numbers):

```text
A { ahead: 65, beforeReconcile: 15, afterReconcile: 15 }
B {
  bought: { ok: true },
  beforeBuy: 51,
  afterBuy: 1,
  nextDay: 9,
  close21Shards: 0,
  backBeforeReconcile: 9,
  back: 1
}
C1 {
  bought: { ok: true },
  before: [ 210, [ 'banner:grove' ] ],
  after: [ 360, [] ],
  banner: undefined
}
C2 {
  before: [ 10, 29, [ '2026-10-20:5', '2026-10-21:5', '2026-10-22:0' ] ],
  after: [ 10, 0, [ '2026-10-22:0' ] ],
  closes: '[["2026-10-20",{"total":5,"sp":5,"streak":1,"paused":false,"shards":15,"owned":[],"purchases":[]}],["2026-10-21",{"total":5,"sp":5,"streak":2,"paused":false,"shards":29,"owned":[],"purchases":[]}]]'
}
C3 { kept: 20, later: 0 }
C4 { before: 5, after: 0 }
A-tz {
  today: '2026-12-06',
  home: 65,
  landedBeforeReconcile: 15,
  landed: 15
}
D [{"k":9,"welcome10Nov":"n/a","xpShown":[102.5,102.5],"level":[2,2],"shards":[60,39,39]}]
cj2 {
  day20: 5,
  day23: 25,
  backBeforeReconcile: 25,
  back: 25,
  levels: [ 1, 1, 1 ],
  shards: [ 15, 17, 17, 17 ]
}
E {
  bought: { ok: true },
  before: [ 580, 3, 188, [ 'banner:grove' ] ],
  pre: [ 580, 3, 0, [] ],
  after: [ 580, 3, 0, [] ],
  banner: 'banner:grove'
}
 Test Files  1 passed (1)
      Tests  10 passed (10)
```
