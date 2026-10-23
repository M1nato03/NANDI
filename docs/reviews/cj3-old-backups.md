# Real backups from older builds (cloud job batch 3, job 4)

Restore target: **origin/ship-32** (`dab36b3`), not ship-31. The batch header says to use ship-32 wherever a job says ship-31.
Old builds: origin/ship-22 (`88150d5`), origin/ship-25 (`b0af52e`), origin/ship-27 (`b17ec40`).
Read first: ideas/cj2-test-gaps §3.2.

All data here is synthetic. The three backup files were written by each old build's real Backup screen
("Export backup", saved from the browser download) and are in `docs/reviews/cj3-old-backups/`.

## Summary

- **Fresh install (6 pairs): no shown number dropped, nothing lost.** Tasks, Learn progress, settings, owned items,
  streak and every ledger fact came back. ship-25 and ship-27 backups restore with exactly the same XP, level, Shards
  and per-day XP. A ship-22 backup comes back **higher**: +45 XP and +5 Shards, because ship-32 scores ship-22's old
  days with a newer Learn rule that is not gated by a cutoff date.
- **Install with its own 5 days (3 pairs): FAIL.** The restore keeps XP and level (peak + held closes), but **Shards drop**:
  the phone showed 111 before the restore and 104 / 87 / 84 after. For ship-25 and ship-27 the closed day 19 Nov also
  drops from 99 to 87 / 84 Shards. A rest day bought that day (50 Shards) is gone. The 5 days of tasks, Learn and
  Mind are replaced; the screen warns "This replaces current app data", so that part is by design.
- The §3.2 hazard (XP jumps between first paint and reconcile because `economy.v2From` is missing) **does not reproduce
  on ship-32**. A missing cutoff now means old rules, and a restore keeps this phone's cutoffs.
- Found on the way, in every build: a solved daily **case is also paid as a daily board** (+10 XP) on the next app
  start; and **every Learn "match" item can never be answered right**.

## 1. Pass/fail per pair

"Same" means the number equals what the old build showed for the same moment. "No drop" means no number shown by
ship-32 (from first paint, after a reload, and the next morning) is below what was on screen before.

| Backup from | Restored into | When | XP | Level | Shards | Streak | Rest days | Owned | Tasks | Learn | Settings | Ledger | No drop | Same numbers | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ship-22 | fresh ship-32 | Sun 15 Nov 21:30 | 497 → **542** | 3 → 3 | 69 → **74** | 6 → 6 | 4 → 4 | same | same | same | same | 64 → 64 | PASS | **FAIL** | **FAIL** (higher) |
| ship-22 | fresh ship-32 | Fri 20 Nov 20:00 | 497 → **542** | 3 → 3 | 69 → **74** | 6 → 6 | 0 → 0 | same | same¹ | same | same | 64 → 64 | PASS | **FAIL** | **FAIL** (higher) |
| ship-22 | ship-32 with 5 own days | Fri 20 Nov 20:00 | own 130 → 642 | own 2 → 4 | own **111 → 104** | own 5 → 6 | own **5 → 0** | kept | own 5 gone² | own gone² | same | 64 → 64 | **FAIL** | **FAIL** | **FAIL** |
| ship-25 | fresh ship-32 | Sun 15 Nov 21:30 | 550 → 550 | 3 → 3 | 57 → 57 | 6 → 6 | 4 → 4 | same | same | same | same | 61 → 61 | PASS | PASS | **PASS** |
| ship-25 | fresh ship-32 | Fri 20 Nov 20:00 | 550 → 550 | 3 → 3 | 57 → 57 | 6 → 6 | 0 → 0 | same | same¹ | same | same | 61 → 61 | PASS | PASS | **PASS** |
| ship-25 | ship-32 with 5 own days | Fri 20 Nov 20:00 | own 130 → 650 | own 2 → 4 | own **111 → 87** | own 5 → 6 | own **5 → 0** | kept | own 5 gone² | own gone² | same | 61 → 61 | **FAIL** | n/a | **FAIL** |
| ship-27 | fresh ship-32 | Sun 15 Nov 21:30 | 527 → 527 | 3 → 3 | 54 → 54 | 6 → 6 | 4 → 4 | same | same | same | same | 60 → 60 | PASS | PASS | **PASS** |
| ship-27 | fresh ship-32 | Fri 20 Nov 20:00 | 527 → 527 | 3 → 3 | 54 → 54 | 6 → 6 | 0 → 0 | same | same¹ | same | same | 60 → 60 | PASS | PASS | **PASS** |
| ship-27 | ship-32 with 5 own days | Fri 20 Nov 20:00 | own 130 → 627 | own 2 → 4 | own **111 → 84** | own 5 → 6 | own **5 → 0** | kept | own 5 gone² | own gone² | same | 60 → 60 | **FAIL** | n/a | **FAIL** |

¹ The one open task ("Buy notebook", planned 15 Nov) shows as unplaced on 20 Nov once Plan opens. Both builds roll
open tasks forward this way; it is not a restore effect.
² For the "own 5 days" rows the backup's tasks, Learn rows and settings all came back exactly (same as the fresh rows).
"own gone" means the install's own rows were replaced, as the preview card says.

Also measured on every pair:
- XP, level and Shards were **steady from first paint**: 12 samples 120 ms apart right after "Restore complete", then 8
  after a reload. Each pair showed one value only (for example `542/3/74/6` for ship-22).
- The next morning (no new activity) showed the same XP, level and Shards.
- A second export from ship-32 right after the restore had the same row count per table as the live database.
- Settings shown on the ship-32 Settings screen after every restore: Theme dark, Motion reduced, Bedtime target 22:45,
  card back "weave" in use, interests [reading], Learn topic as chosen. The weekly rest day (Sunday) shows on 15 Nov and
  is blank on 20 Nov, because old builds stored it per week only (`economy.restWeekday:2026-11-09`). The old build shows
  the same blank in a new week.
- Owned items: "Weave card back · Owned" in the ship-32 shop after every restore.

## 2. Exact diffs for every FAIL

### 2.1 ship-22 backup, fresh install: +45 XP, +5 Shards

Per-day XP, computed with each build's own `deriveEconomy` on the same facts (old code on the exported data, ship-32 code
on the restored data):

| Day | ship-22 showed | ship-32 shows | Part that changed |
|---|---|---|---|
| Mon 9 Nov | 129 | 144 | Mind 45 → 60 |
| Tue 10 Nov | 110 | 125 | Mind 10 → 25 |
| Fri 13 Nov | 144 | 159 | Mind 45 → 60 |
| other days | same | same | — |
| **Total** | **497** | **542** | Shards 69 → 74 (0.1 Shard per XP) |

Cause: ship-25 added "a finished teach-first daily drop counts" (commits `f38f3cd`, `a29b2e6`). ship-22's rule was
`learnDrop = learn-drop fact in mode mind || 5+ answers` (ship-22 `src/core/economy/deriveEconomy.ts:88`). A first-week
teach-first drop has a lesson and 2 answers, so ship-22 paid 0 for it. ship-32 adds `dropFinished`
(`src/core/economy/deriveEconomy.ts:368-370`) and pays 15 XP. This rule is not behind `economy.v2From` or `v3From`, so it
applies backwards to every older day. The same jump happens to a ship-22 user who upgrades in place, not only on restore.

Nothing drops, so the forward-only promise holds. But CLAUDE.md says rule changes apply forward from `effectiveFrom`; this one does not.

Fix sketch: gate `dropFinished` like the other fixes (`v2(key) && dropFinished`), or add a `RULES_HISTORY` entry with its own
`effectiveFrom`. If raising old days is acceptable, say so in DECISIONS.md and drop this FAIL.

### 2.2 Install with 5 own days, then restore: Shards drop

Same story for all three backups; ship-27 numbers shown. The install ran Mon 16 – Fri 20 Nov on ship-32: first run, a
lesson, 5 tasks, 3 drops, a case, 2 boards, and a Rest day bought on 20 Nov for 50 Shards.

| Shown on the You screen | before restore | after restore |
|---|---|---|
| XP / level | 130 / 2 | 627 / 4 |
| **Shards** | **111** | **84** (ship-22: 104, ship-25: 87) |
| Streak | 5 | 6 |
| **Rest days banked** | **5** (4 + 1 bought today) | **0** |

Day closes (`economy.close:<day>` in settings), before → after:

| Day | XP | Shards ship-22 | Shards ship-25 | Shards ship-27 | Streak |
|---|---|---|---|---|---|
| 16 Nov | 20 → 20 | 22 → 76 | 22 → 59 | 22 → 56 | 1 → 6 |
| 17 Nov | 55 → 55 | 60 → 101 | 60 → 84 | 60 → 82 | 2 → 6 |
| 18 Nov | 5 → 5 | 61 → 102 | 61 → 85 | 61 → 82 | 3 → 6 |
| **19 Nov** | 20 → 20 | 99 → 104 | **99 → 87** | **99 → 84** | 4 → 6 |

- XP and level are kept: the phone's closes add 100 "held" XP for 16–19 Nov, and `economy.peak` keeps the higher value.
- Shards are not kept. `mergeCloseMaps` (`src/core/economy/deriveEconomy.ts:134`) takes
  `max(phone close − purchases the phone did not know, backup side − purchases the backup did not know)`. The phone's
  close (99) is charged for the backup's two 15 Nov purchases (150 Shards), which takes it to 0. So the backup side
  (84) wins, and a finished day's Shards drop from 99 to 84.
- The Rest day bought today is lost: the `purchase:freeze:…` fact is gone and today has no close to carry it
  (`src/data/backup/index.ts:242` merges closes of finished days only). The phone had already paid the 50 Shards.

This is a product trade-off for Jenil, because both options can be argued:
(a) a full restore replaces the phone's economy too, so the preview card should say the Shards will change; or
(b) the phone's finished-day closes are a floor, so do not charge the backup's purchases against them. That risk is
spending the same Shards twice. A middle option: the phone's floor counts only Shards the phone earned after the
backup's last day.
Whatever is chosen, the purchase made on the restore day should either survive or be refunded.

## 3. The §3.2 hazard on ship-32: not reproduced

- ship-22 has no `economy.v2From`. A fresh ship-32 install writes `economy.v2From` and `economy.v3From` = today on its first
  reconcile (`src/data/repos/gamify.ts:41-42`), before the person reaches the restore screen through "I have a backup to
  restore". `importBackup` keeps this phone's cutoffs (`src/data/backup/index.ts:203, 219, 232`). A missing cutoff
  already means "old rules" (`deriveEconomy.ts:320-321`). So backup days are scored with pre-v2 rules before and after
  reconcile, and the samples from first paint never moved.
- Side effect: a ship-25 or ship-27 backup carries `economy.v2From = 2026-11-09`. After the restore it is replaced by the
  phone's date, so the backup's days now replay under pre-v2 rules although they were scored under v2 on the old phone.
  In this week that changed nothing: replaying the restored ship-27 data with the backup's own v2From gives the same
  527 XP / 54 Shards. Only two rules differ before v2: a perfect drop finished after bedtime (`deriveEconomy.ts:373`) and an
  uncapped Focus boost (`:401`). Both can only raise XP, never lower it. This was not exercised; a fixture with a Focus
  boost and a late perfect drop would cover it.

## 4. Found on the way

1. **A solved daily case is also paid as the daily board (+10 XP), in all four builds.** `reconcileSolvedBoards`
   (`src/data/repos/puzzleRuns.ts:58`) picks every `daily && solved` puzzle run, and case runs are saved with
   `daily: true, type: 'mystery'` (`src/data/repos/mysteries.ts:15`). On the next app start it writes
   `board:daily:2026-11-09:mystery` (seen in every backup), and `dailyBoard` pays `mind.dropBoardXp`.
   Visible effect: in a first ship-22 run where the old app was never restarted after the case, the restored ship-32
   showed **522 XP at first paint and 542 after a reload**. Fix: filter `row.type !== 'mystery'` in
   `reconcileSolvedBoards` (and in `putDailyBoardFact`). Already-written facts stay (ledger is facts only); decide with a
   RULES_HISTORY entry whether they keep paying.
2. **No Learn "match" item can be answered right (all builds; 14 items in ship-32 content).** Content stores each pair
   both ways (`a→b` and `b→a`; the validator requires one answer per option, `src/data/packs/validate.ts:218`). The UI
   waits for `item.answer.length` (4) pairs before Check (`src/ui/learn/LearnDrop.tsx:182`), but disables every option
   used as a left side (`:259`). After `a→b` the reverse `b→a` cannot be entered, so a person can finish only with wrong
   pairs. The ship-22 run got stuck on `compounding-8` ("Match each amount to its job in a savings account."). Items in
   ship-32: showing-up-14, free-sugars-14, indus-cities-16, silk-road-ideas-15, printing-and-reading-16,
   mughal-revenue-14, company-trade-rule-15, birds-and-planes-14, shares-13, emergency-fund-11, upi-scams-10,
   confirmation-bias-11, social-proof-15, sleep-memory-15.
3. **A failed lazy chunk shows a blank page.** 3 times across all runs (several hundred page loads; the count is an estimate), under load,
   `Failed to fetch dynamically imported module …/mystery-arc.missing-measure-….js` left an empty screen (no message, no
   retry) until reload. Seen on `vite preview` only; on the APK the assets are local, so this is low risk.
4. Old builds score teach-first first-week drops at 0 Learn-drop XP (see 2.1). A ship-22 user saw that live at the time.

## 5. How it was run

- Worktrees: `git worktree add --detach /tmp/cj3/job4-shipNN origin/ship-NN` for 22, 25, 27; the report branch
  `ideas/cj3-old-backups` from origin/ship-32. `npm ci` and `npm run build` in each (all exit 0), then
  `VITE_E2E=1 npx vite build --outDir dist-e2e` (plus `dist/packs`). The e2e build is used only for the
  `__nandiMindTest.solveKnownSolution()` board hook, the same one `tests/e2e/mind.spec.ts` uses. Everything else went
  through the normal UI.
- Served one at a time with `vite preview --outDir dist-e2e --strictPort` on 5422 / 5425 / 5427 / 5429; all stopped at
  the end. Chromium from /opt/pw-browsers, Playwright 1.63, 390×844 mobile, time zone UTC.
  A fresh browser context per scenario (each has its own empty IndexedDB).
- Every screen open is a fresh page load, like reopening the app. A hash-only `goto` would keep the old document and
  skip start-up work such as `reconcileSolvedBoards`; the first attempt did that and gave different numbers (see 4.1).
- The week, run by each old build (`page.clock.setFixedTime`, all steps OK on the final runs):

| Day | What was done |
|---|---|
| Mon 9 Nov | First run (ship-22: two goals; 25/27: 18+ tick, one goal), bedtime 23:00, first lesson drop; 2 tasks added, 1 done; Train placement + workout; daily case solved |
| Tue 10 | Learn drop; 2 tasks added, 3 done (incl. a carried one); Board (a warm-up/practice board where offered); side quest done |
| Wed 11 | nothing (missed day) |
| Thu 12 | Soft day: Tired → Stretch in bed → Done → Close for today |
| Fri 13 | Learn drop with one wrong answer; task added + done; workout; case solved |
| Sat 14 | Board; task added + done; Learn opened at 23:40, after bedtime (no new drop offered) |
| Sun 15 | Learn drop; 2 tasks added, 1 left open; workout; daily board (Crowns hard); bought Rest day (50) and Weave card back (100); Settings: theme dark, motion reduced, bedtime 22:45, rest day Sunday, interest Reading; 21:00 export via Backup screen |
| Fri 20 | Old build reopened with no activity, numbers read (baseline for the 20 Nov restores) |

- The ship-32 install with its own days (16–20 Nov): first run with the 18+ tick, lesson drop, 5 tasks done, 3 drops, a case,
  2 boards, and Rest day bought on 20 Nov. Train did not start on ship-32 (the driver's "Start session" did not match its
  new Train screen), so that install has no workout. Its data is replaced by the restore anyway.
- Restore: fresh install opens with `?e2e&welcome` → "I have a backup to restore" → "Choose restore file" → preview → "Confirm restore" →
  "Restore complete. Your data is ready." For the 5-day install: You → Backup → same steps.
- Numbers were read from the You screen (`Level N`, `N XP in all`, `N day streak`, `N rest days banked`, Shards). Shop
  "Owned" labels and Settings form values were read from their screens. Rows were read from IndexedDB directly. Per-day XP comes from each
  build's own `deriveEconomy` run with tsx on those rows. Old builds' replay matched their own screens (ship-22: 497).
- Load: the machine is shared with other jobs. `uptime` at 07:20 UTC: load 2.80 / 4.83 / 5.56; at 07:44: 1.19 / 1.46 / 2.71.
  No timings are reported.

### Files in `docs/reviews/cj3-old-backups/`

| File | What |
|---|---|
| `nandi-ship-22.json`, `nandi-ship-25.json`, `nandi-ship-27.json` | Real exports from each old build's Backup screen (ppFormatVersion 2, Dexie v3, synthetic data). ship-22 has no `economy.v2From`; 25/27 have `economy.v2From = 2026-11-09`; none has closes, peak or `v3From`. |
| `nandi-ship-NN.expect.json` | What that build showed at export and on 20 Nov, per-day XP by its own code, owned items, row counts, and the action log. Ready for the `restore-old-builds.spec.ts` sketched in cj2 §3.2. |

## 6. Key code (run from /tmp/cj3/job4-scratch/run, not committed)

Fresh app start per screen, and reveal cards tapped away (`drive.mjs`):
```js
async go(hash) {
  const url = `${this.base}?e2e${hash ? '#' + hash : ''}`;
  const same = this.page.url().startsWith(`${this.base}?e2e`) && !this.page.url().includes('welcome');
  await this.page.goto(url);
  if (same) await this.page.reload();               // a hash-only goto keeps the old document
  for (let i = 0; i < 3; i++) {                     // blank page after a failed lazy chunk: reload (section 4.3)
    try { await this.page.locator('main').first().waitFor({ state: 'visible', timeout: 10_000 }); break; }
    catch { await this.page.reload(); }
  }
  await this.page.waitForTimeout(700); await this.dismiss();   // "Skip reveal", "Done for today" → Close
}
```

Daily case solved through the UI. Each build's own `cases.js` is used to know the answer; then the grid is filled
(✓ = two taps) and the accusation made:
```js
const G = (await import(`./cases-${this.build}.mjs`)).default;    // src/core/mysteries/cases.js minus its CJS line
const title = (await p.locator('main h1').first().innerText()).trim();
const C = [undefined, 'easy', 'medium', 'hard'].map(diff => G.daily(dayKey, diff)).find(c => c.title === title);
for (let s = 0; s < C.n; s++) {
  await tapTwice('Who was where?', `${C.S[s].n}, ${C.P[C.sol.sp[s]].s}`);
  await tapTwice('Who had what?', `${C.S[s].n}, ${C.I[C.sol.si[s]].n}`);
}
await p.getByRole('combobox', { name: 'Who' }).selectOption(C.S[C.culprit].n);
await p.getByRole('combobox', { name: 'Object' }).selectOption(C.I[C.sol.si[C.culprit]].n);
await p.getByRole('combobox', { name: 'Where' }).selectOption(C.P[C.sol.sp[C.culprit]].s);
await p.getByRole('button', { name: 'Accuse' }).click();          // then puzzleRuns[daily:<day>:mystery].result must be 'solved'
```

Learn drops: a loop that reads the shown stem, looks it up in that build's `content/topics/*.json` (hooks, guided tries,
items, example spots), taps the right option (or a wrong one on purpose), then Check/Continue. It stops on the stopping
screen, or reports `match-stuck` (section 4.2).

Restore and first-paint sampling (`restore.mjs`):
```js
result.restore = await d.restore(backup);   // Choose restore file → preview → Confirm restore → status text
await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
for (let i = 0; i < 12; i++) { const y = parseYou(await page.getByRole('main').innerText());
  out.push([y.totalXp, y.level, y.shards, y.streak]); await page.waitForTimeout(120); }
await page.reload();  /* 8 more samples */  /* then re-export, then next morning */
```

Per-day replay with each build's own code (`perday.mts`, run with that worktree's tsx):
```ts
const { deriveEconomy } = await import(`${root}/src/core/economy/deriveEconomy.ts`);
const v = deriveEconomy(db.ledger, undefined, db.settings, today);
console.log(JSON.stringify({ totalXp: v.totalXp, level: v.level, shards: v.shards, owned: v.owned,
  days: v.days.map(d => ({ day: d.dayKey, total: d.total, mind: d.mind, held: d.held /* … */ })) }));
```

Run order: `node week.mjs 22 5422 nandi-ship-22` (likewise 25, 27), then
`node restore.mjs out/nandi-ship-NN.json {fresh-same|fresh-later|own5} 5429 r-NN-<scenario>`, then `node compare.mjs NN <scenario>`.
