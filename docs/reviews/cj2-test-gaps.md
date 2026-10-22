# Test gaps (cloud job batch 2, job 8)

Date: 22 Oct 2026. Branch tested: `origin/ship-27` at `b17ec40`.
Runner: Linux, 4 shared CPUs, Node 22.22 (repo asks for Node 24; `npm ci` warns but works).
Nothing in the repo was changed. Probe scripts lived in `/tmp`; their code is at the end.

## Summary

- Unit coverage (measured, v8): **all of `src/` 50.3% statements, 41.9% branches, 40.3% functions, 52.0% lines**.
  `src/core` 86.6% statements, `src/data` 71.7%, `src/platform` 45.1%, `src/ui` 11.2% (UI is mostly covered by e2e, which these numbers do not count).
- The two repos that write economy facts, `src/data/repos/gamify.ts` (`reconcileGamify`, `saveGoldReview`) and `src/data/repos/economy.ts` (`purchaseShopItem`, `recordMorningBackfill`), have **0% unit coverage**. They are only exercised through e2e.
- Measured in the browser: when the phone clock runs ahead and is then corrected, **XP shown on You drops** (25 XP to 5 XP). That breaks the "XP never drops" promise. No test covers clock moves.
- No e2e test uses the keyboard, two tabs, a backup from a real older build, very long titles, or a storage-full error. A simulated quota error shows the user raw error text.

## 1. How coverage was run

```sh
git worktree add -b ideas/cj2-test-gaps /tmp/cj2/job8 origin/ship-27
cd /tmp/cj2/job8 && npm ci
npm i --no-save @vitest/coverage-v8@5.0.3        # same version as vitest; package files untouched
npx vitest run --maxWorkers=2 --testTimeout=60000 \
  --coverage --coverage.provider=v8 --coverage.reportOnFailure --coverage.include='src/**' \
  --coverage.reporter=json-summary --coverage.reporter=json --coverage.reporter=text-summary \
  --coverage.reportsDirectory=/tmp/cj2/job8-cov
```

Result: 121 files, 540 passed, 12 skipped, 0 failed, 151 s.

Load note. The first run used default workers and the 5 s default timeout. One test failed by timeout:
`src/core/puzzles/pathLogic.test.ts` › "solves every generated board by logic alone…" took 20.6 s under coverage while other jobs shared the machine.
Run alone without coverage, the whole file passes in 6.3 s. The rerun above used 2 workers and a 60 s timeout.
**Finding:** this test has no explicit timeout. It sits close to the 5 s default on a normal laptop and will flake on a busy CI runner or with coverage on. Give it `{ timeout: 60_000 }` or split it per difficulty.

### Coverage by area (measured)

| Area | Files | Statements | Branches | Functions | Lines |
|---|---|---|---|---|---|
| src/core | 100 | 86.6% (4511/5211) | 79.0% | 85.7% | 91.0% |
| src/data | 30 | 71.7% (1447/2019) | 60.9% | 72.0% | 77.7% |
| src/platform | 12 | 45.1% (162/359) | 46.3% | 40.7% | 51.2% |
| src/ui | 112 | 11.2% (650/5806) | 8.2% | 8.8% | 13.7% |
| **all src** | 259 | **50.3%** (6770/13463) | **41.9%** | **40.3%** | **52.0%** |

Files with no statements (barrels, `.d.ts`, `types.ts`) are left out of the list below.

## 2. The 20 least-covered files in src/core and src/data

The list is sorted by statement coverage. Line numbers point to code that never ran in any unit test.

| # | File | Stmts | Branch | What is untested | Risk |
|---|---|---|---|---|---|
| 1 | src/data/repos/gamify.ts | 0% (0/62) | 0% | All of `reconcileGamify` (L13-47) and `saveGoldReview` (L50-58). | **High.** It writes badge, quest, chest, welcome-back and focus-boost facts, and sets `economy.v2From` (L18), which changes how every earlier day is scored. Only e2e covers it. It also imports `topics` from `src/ui/learn/flow` (L6), so the data layer depends on the UI layer. |
| 2 | src/data/backup/e2e-hook.ts | 0% (0/52) | 0% | Test hook only, compiled in when `VITE_E2E=1`. | Low. Not in the shipped build. |
| 3 | src/data/repos/economy.ts | 0% (0/40) | 0% | `purchaseShopItem` (L8-23): balance check, purchase fact, theme/banner setting. `recordMorningBackfill` (L25-42): time validation, 03:59/04:00 next-day roll (L31), no double lights-out fact. | **High.** Shards spend and the lights-out record. A wrong check means a double purchase or a lost lights-out. |
| 4 | src/data/repos/owner.ts | 0% (0/8) | 0% | `recordOwnerOpen`, `readPinHash`, `savePinHash`. | Low-medium. A bad PIN read would lock the owner panel. |
| 5 | src/core/economy/trainAwards.ts | 0% (0/5) | n/a | Whole file. It is only re-exported from `core/economy/index.ts`, and nothing imports that barrel. | None: dead code. Delete it, or test it if it is meant to be used. |
| 6 | src/data/repos/mind.ts | 0% (0/1) | n/a | `createMindRepos`. Only reachable from the unused barrel. | None: dead code. |
| 7 | src/core/puzzles/share.ts | 18.8% | 25% | `shareTile` (L11-25), the shared result grid. | Medium. A spoiler or wrong grid goes out to friends. The share flow is the one place data leaves the phone by design. |
| 8 | src/core/tasks/plannerCopy.ts | 30.8% | 58% | `minutesInWords`, `weekInWords`, `moveReasonInWords`. | Low-medium. These are user copy: a wrong plural or "0 minutes" reads badly, and shame-free wording is a hard rule. |
| 9 | src/core/weeklySummary.ts | 57.6% | 25.4% | `median` and most per-area aggregations (L145-437). | Medium. This is the exported summary Claude reads. Wrong numbers feed wrong advice. |
| 10 | src/data/repos/train.ts | 59.4% | 43.6% | `addPr`, `history`, `updateProgram`, `recordRetest`, `setEffort`, `setRestEnd`, `restDayCheck`. | Medium. PRs and rest-day checks write XP facts. |
| 11 | src/data/repos/tasks.ts | 63.8% | 55.5% | `setPriority`, `setPlace`, `setFirstStep`, `editTask`, `addCheckpoints`, `respaceRemainingCheckpoints`, and focus `pause/extend/resume/finish` (L591-635), `listForDay`. | **High.** The focus timer and task edits are core daily paths. e2e touches some of them, but none of the edge cases (finish while paused, double finish, extend after finish). |
| 12 | src/core/economy/ladder.ts | 65.2% | 50% | `rivalName`, and `seatThreshold` when seat ≥ seats. | Low. |
| 13 | src/core/mysteries/deduction.ts | 66.7% | 64% | L7, L9, L25-26 (guard branches). | Low-medium. |
| 14 | src/core/economy/creationSplit.ts | 66.7% (2/3) | 75% | One guard. | Low. |
| 15 | src/core/economy/levelCurve.ts | 66.7% (2/3) | 75% | The RangeError guard for negative or NaN XP. | Low. |
| 16 | src/core/economy/gamify.ts | 69.3% | 72% | `dayCombo` (L18-24), `completedQuests` (L55), quest predicates (L69-81). | Medium. These decide which quests and badges `reconcileGamify` writes as permanent facts. |
| 17 | src/core/tasks/focus.ts | 70% | 71% | `resumeFocus` (L100-106), `finishFocus` (L108-118), break-phase branch (L43-52). | Medium-high. Overtime is computed from wall-clock time (see §3.5). |
| 18 | src/data/repos/quests.ts | 72.7% | 35.2% | `addCustom` (L57-67), `tap` (L69-77). | Medium. Quest taps write facts. |
| 19 | src/core/economy/seasonRank.ts | 72.7% | 75% | The RangeError guards. | Low. |
| 20 | src/data/repos/learn.ts | 75% | 71.6% | `seedDeckCards`, `loadLessonDraft`, `answerPlan`, `hideReview`. | Medium. A lost lesson draft means lost progress mid-lesson. |

Also worth a look: `src/data/backup/index.ts` is at 90.7%. Several of its validation errors never run: duplicate table (L132), unknown table (L138), row-count mismatch (L140), missing table (L144), and the future-version error (L79).

## 3. E2E audit: user paths with no test

Suite: 47 spec files, about 108 tests, two phone sizes (390×844, 360×800). No project sets `timezoneId`, so every e2e test runs in the runner's own time zone.

I ran short Playwright probes against an e2e build (`VITE_E2E=1 vite build`) at 360×800. "Measured" below means a probe produced the result. Everything else is read from the code.

### 3.1 Keyboard-only use: no test

`grep keyboard. / press('Tab') / toBeFocused` over tests/e2e finds nothing.

Measured on Plan, by pressing Tab 40 times from page load:
- Focus walks 34 controls before it reaches the tab bar (stop 35). There is no skip link.
- One `<input type="time">` ("Start time") takes 7 Tab stops, and computed style shows `outline: none` with no box-shadow on it.
- The last stop is a `div role=button` "Skip opening animation" (`src/ui/cast/OpenMoment.tsx:19`). It was still in the tab order after the opening should have ended. Check whether it stays mounted.

Risk: medium. People with a broken touch screen, or on a laptop with the web build, cannot easily use Plan. Focus can also land on something invisible.

Sketch:
```ts
test('keyboard only: add a task, finish it, reach every tab', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00'));
  await page.goto('/#plan');
  await page.keyboard.press('Tab');                      // first stop should be a skip link
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').focus();
  await page.keyboard.type('Call bank 15m'); await page.keyboard.press('Enter');
  const done = page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Done' }).last();
  await done.focus(); await page.keyboard.press('Enter');
  for (const name of ['Plan', 'Train', 'Learn', 'Mind', 'You']) {
    const tab = page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name });
    await tab.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('main').getByRole('heading', { name, exact: true })).toBeVisible();
  }
  // every focused control shows a ring
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement!);
      return s.outlineStyle !== 'none' || s.boxShadow !== 'none'; });
    expect(ring).toBe(true);
  }
  // dialogs: Escape closes and focus returns to the opener (night deck, level reveal, task detail)
});
```

### 3.2 Restoring a backup made by an older build: only synthetic

What exists:
- Unit: `backup.test.ts` "restores a v1 backup into v2". This is a v3 export with fields edited down, not a file an old build wrote.
- e2e: legacy prototype fixture (`phase0-review.spec.ts:41`).
- e2e: `upgrade.spec.ts`. Build A and build B are the same code with a different version string. No schema or data shape changes between them.

What is missing:
- A real `ppFormatVersion 2` / Dexie v2 file (with quests, without the learn tables).
- A file from before `economy.v2From` existed.
- A file from a newer build (the future-version error at `index.ts:79` is never run).

Risk: **high.** Restore is a non-negotiable. A file that validates can still carry old row shapes (ledger `inputs`, settings values) that today's `deriveEconomy` reads differently.

One concrete hazard, from reading the code:
1. `importBackup` clears settings.
2. A backup from before the economy fixes has no `economy.v2From`, so `deriveEconomy` treats it as `0000-00-00` (`deriveEconomy.ts:67`) and scores every past day with the new rules.
3. Then `reconcileGamify` sets v2From to today (`gamify.ts:18`) and past days switch back to the old rules.

So the XP and level shown can jump between first paint and the reconcile. This is not measured. The test below would catch it.

Sketch, in two parts:
```ts
// scripts/make-backup-fixtures.ts (run once per release, output committed to tests/fixtures/backups/)
// For each release tag: git worktree add /tmp/old <tag>; build; serve; seed 14 days via the UI;
// export through the real Backup screen; save nandi-<tag>.json plus a sidecar
// { counts, totalXp, level, shards, streak } read from the You screen of THAT build.

// tests/e2e/restore-old-builds.spec.ts
for (const file of fs.readdirSync('tests/fixtures/backups').filter(f => f.endsWith('.json'))) {
  test(`restores ${file} with the same numbers`, async ({ page }) => {
    const expected = JSON.parse(fs.readFileSync(`tests/fixtures/backups/${file}.expect`, 'utf8'));
    await page.clock.setFixedTime(new Date(expected.exportedAtLocal));
    await page.goto('/#you');
    await restoreThroughPicker(page, `tests/fixtures/backups/${file}`);   // same steps as phase0-review.spec
    const seen: number[] = [];                                        // sample XP from first paint onwards
    for (let i = 0; i < 10; i++) { seen.push(await readTotalXp(page)); await page.waitForTimeout(100); }
    expect(Math.min(...seen)).toBe(expected.totalXp);                 // never shows less, even for a frame
    expect(await readLevel(page)).toBe(expected.level);
    expect(await readShards(page)).toBe(expected.shards);
    // and a second round trip on the new build gives the same counts
  });
}
// unit: validateBackup({ ...v3, ppFormatVersion: 3 }) -> success false, readable "newer app" error, DB untouched
```

### 3.3 After-bedtime screens: partly covered

Covered: night deck (`night-deck.spec.ts`), courtyard sleeps (`courtyard.spec.ts:68`), night learn drop (`learn-gaps.spec.ts`), first run at night (`welcome.spec.ts:104`), share hidden (`mind-depth.spec.ts:64`), phone-down check-in (`bug-hunt-night.spec.ts`).

Not covered:
- A task or Train session finished after bedtime still counts but shows no celebration: no XP toast, no level reveal, no combo (CLAUDE.md rule).
- A Mind puzzle solved after bedtime earns 0 XP, and the UI does not show "+XP" for it.
- Train and You screens after bedtime.
- Nothing buzzes or vibrates after bedtime.

Measured: at 02:00 the app opens on the night deck. Pressing "×" left it open in my probe, so I could not reach the task list. Night Plan is unmeasured.

Risk: medium. A stray toast after bedtime breaks the night rule and invites more screen time.

Sketch:
```ts
test('after bedtime: a finished task counts but is not celebrated', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T21:00:00') });
  await page.goto('/#plan');
  await seed(page, [fact('2026-10-20', 'train', 'session', { xp: 95 })]);   // 5 XP from level 2
  await addTask(page, 'Pack bag 5m');                                        // added before bed
  await page.clock.setFixedTime(new Date('2026-10-21T01:45:00'));            // past bedtime, before 04:00
  await page.goto('/#plan');
  await finishTask(page, 'Pack bag');
  await expect(page.locator('.economy-toast')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Season progress' })).toHaveCount(0);
  await page.addInitScript(() => { (window as any).__vib = 0; navigator.vibrate = () => { (window as any).__vib++; return true; }; });
  expect(await page.evaluate(() => (window as any).__vib ?? 0)).toBe(0);
  await page.clock.setFixedTime(new Date('2026-10-21T09:00:00')); await page.reload();
  await expect(page.getByRole('main')).toContainText('Level 2');            // it still counted
});
// Same pattern for: a Mind board solved at 01:00 shows no "+XP" and You totals do not move.
```

### 3.4 The 04:00 day boundary: unit-tested, thin in e2e

Covered:
- Unit: `dayKey.test.ts` (03:59 vs 04:00, month edge), `nightTimeline.test.ts`, `timer.test.ts`.
- e2e: `night-deck.spec.ts:87` jumps to 04:05 and fires `pageshow` by hand.

Measured: with the app open on Plan from 03:50 and the fake clock run 20 minutes with no visibility event, the screen moved from "Tonight" to the new day's Plan by itself. Good.

Not covered:
- A task finished at 03:59 lands on yesterday and one at 04:00 on today, through the UI. This affects the streak and the Hat-trick.
- A focus session running across 04:00.
- The morning back-fill at "03:45", which must store the next calendar date (`economy.ts:31`).
- A streak and rest-bank change exactly at 04:00.

Risk: medium-high. Students are often up around 03:00-04:00, and the streak depends on the day key.

Sketch:
```ts
test('03:59 counts for yesterday, 04:00 for today', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-21T03:58:00') });
  await page.goto('/#plan');
  await addAndFinish(page, 'Late one 5m');                                   // dayKey 2026-10-20
  await page.clock.runFor(2 * 60_000);                                        // 04:00, no reload
  await addAndFinish(page, 'Early one 5m');                                  // dayKey 2026-10-21
  const days = await page.evaluate(() => (window as any).__nandiTest.ledgerDays());   // small hook addition
  expect(days).toEqual({ '2026-10-20': 1, '2026-10-21': 1 });
});
// unit (vitest, no browser): recordMorningBackfill(db, '2026-10-20', '03:45', 'none') writes
// lightsOutAt = new Date(2026, 9, 21, 3, 45) and only one lightsout fact when called twice.
```

### 3.5 Phone clock moved back or forward: no test, and a real bug

Measured, with fake time:
1. On 20 Oct, finish a task: You shows "Level 1, 5 XP in all".
2. Move the clock to 23 Oct and finish a task: You shows "25 XP in all".
3. Move the clock back to 20 Oct and reload: You shows **"5 XP in all"**.

Cause: `deriveEconomy` drops facts dated after today (`src/core/economy/deriveEconomy.ts:59`, `fact.dayKey <= today`). The total runs only up to today (L73). Shards and level come from the same view, so they can drop too.

This matters in real life. Phones move clocks by hand, after a dead battery, when the SIM time zone fixes itself, or in "set date to skip" tricks. The forward-only promise says XP, level and Shards never drop.

Other clock risks, from reading the code (not measured):
- Clock jumps forward while a focus timer runs: `finishFocus` records the whole jump as `overtimeMs` (`core/tasks/focus.ts:108-118`). "Time on screen" and calibration then take in hours of fake overtime.
- `core/time/timer.ts` `pauseTimer` throws a RangeError if the clock is before the start. It is not used by the UI today.
- A task scheduled "today" while the clock was ahead stays future-dated after the fix. The probe saw it still listed on Plan, so it is not lost.

Risk: **high** (a promise breach that the user can see).

Sketch:
```ts
// unit, src/core/economy/deriveEconomy.test.ts
it('never shows less XP, level or Shards after the clock moves back', () => {
  const facts = [done('2026-10-20'), done('2026-10-23'), done('2026-10-23')];
  const ahead = deriveEconomy(facts, undefined, [], '2026-10-23');
  const back  = deriveEconomy(facts, undefined, [], '2026-10-20');
  expect(back.totalXp).toBeGreaterThanOrEqual(ahead.totalXp);   // fails today: future facts are dropped
  expect(back.level).toBeGreaterThanOrEqual(ahead.level);
  expect(back.shards).toBeGreaterThanOrEqual(ahead.shards);
});
// e2e: the probe in the appendix (clock.spec.ts), turned into expect(xpAfterBack).toBe(xpAhead).
// e2e: start focus at 10:00, setFixedTime +3 h, finish -> overtime is capped (e.g. at the extend limit) and flagged.
```
Fix direction, for the owner to decide: take `today = max(dayKey(now), latest fact dayKey)` for totals, or keep a "high-water" today in settings. Streak and season views may need the real date, so test both.

### 3.6 First load offline: not testable on web, untested on the APK

Covered: `shell.spec.ts` "offline reload still opens every tab". This loads online first, then goes offline. `upgrade.spec.ts` "precache opens lazy screens after the first visit goes offline".

Not covered:
- The APK cold start in airplane mode (Capacitor serves the bundled assets, so it should work, but no test proves it).
- On web, a first visit where the service worker installs but a lazy chunk or `/packs/*.json` fails half-way: the next offline open must not show a blank Learn or Mind.
- Content packs missing offline: Learn and Mind should show a calm "comes back when you are online once" state, not an error.

Risk: medium. The app is "offline-first", and India has patchy data.

Sketch:
```ts
test('packs fail on first visit: next offline open is calm, not blank', async ({ page, context }) => {
  await page.route('**/packs/**', route => route.abort());        // first visit: packs never arrive
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true); await page.unroute('**/packs/**'); await page.reload();
  for (const name of ['Learn', 'Mind']) {
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name }).click();
    await expect(page.getByRole('main')).not.toBeEmpty();
    await expect(page.getByRole('main')).not.toContainText(/Error|undefined|NaN/);
  }
});
// APK: a manual check in the release checklist (airplane mode, clear recents, cold open) until
// an Android emulator job exists.
```

### 3.7 Two tabs open at once: no test

Measured: a task added in tab A showed in tab B after 115 ms (Dexie live queries work across tabs).

Not covered:
- Both tabs running a focus timer on the same task.
- Both tabs running `reconcileGamify` at the same time. IndexedDB runs readwrite transactions on the same stores one after another, so the second tab should see the first tab's facts. But `purchaseShopItem` uses `${itemId}:${now}` as its ID, so two taps in two tabs could buy twice if the balance check is not inside the same transaction in both. Nothing tests this.
- A restore in tab A while tab B keeps writing.
- A new build with a Dexie upgrade while an old tab is open. The upgrade can be blocked by `versionchange`. There is no `versionchange` or `blocked` handler in `src` (grep). Dexie's default behaviour here is not verified.

Risk: medium on web, low on the APK (one WebView).

Sketch:
```ts
test('two tabs: same day reconcile writes each award once and no error shows', async ({ context }) => {
  const [a, b] = [await context.newPage(), await context.newPage()];
  for (const p of [a, b]) { await p.clock.setFixedTime(new Date('2026-10-20T12:00:00')); await p.goto('/#plan'); }
  await Promise.all([finishAllQuestTasks(a), finishAllQuestTasks(b)]);       // both trigger reconcile
  const ids = await a.evaluate(() => (window as any).__nandiTest.ledgerIds());
  expect(new Set(ids).size).toBe(ids.length);
  for (const p of [a, b]) expect(await p.evaluate(() => (window as any).__nandiTest.errorRing())).toEqual([]);
});
test('restore in tab A: tab B shows the restored data and does not write old rows back', async () => { /* … */ });
```

### 3.8 Very long titles: no test

Measured at 360 px: a 240-letter unbroken word and a 140-character sentence as task titles caused no sideways scroll on Plan or Today (`scrollWidth` 360 = `clientWidth` 360).

Not measured:
- Task detail sheet, Now card, focus screen, weekly review, share card text, notification text.
- Custom quest titles and reminder text.
- A Hindi or emoji title (grapheme widths).

Risk: low-medium.

Sketch:
```ts
const long = 'Supercalifragilistic'.repeat(12);
for (const where of ['#plan', '#today', 'task detail', 'focus', '#you weekly', 'custom quest', 'reminder']) {
  test(`long title fits: ${where}`, async ({ page }) => {
    /* add task / quest / reminder with `long`, open the screen */
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw);
    // buttons in the row stay >= 44 px tall and are not pushed off-screen
  });
}
// plus: 'नमस्ते 🙏🏽'.repeat(30) as a title.
```

### 3.9 Low storage / quota errors: no test, raw error shown

No code handles `QuotaExceededError` (grep in src finds none). The Backup screen shows usage and quota only (`src/ui/screens/Backup.tsx:137`).

Measured: after Plan loaded, I made `IDBObjectStore.put` and `.add` throw `QuotaExceededError`, then added a task.
- The typed text stayed in the box (good).
- No task was added (correct).
- The status line showed **"Simulated quota QuotaExceededError: Simulated quota"**. That is raw technical text, with no plain next step such as "Phone storage is full. Your data is safe. Free some space or export a backup."

Other risks (not measured):
- A quota error inside `importBackup` after `clearTablesBeforeImport` has cleared the tables. Is the old data gone with the new data half-written? There is no test.
- The auto-backup file write failing on a full disk. `autoBackup.test.ts` covers a generic failure, not ENOSPC wording.
- `navigator.storage.persist()` refused: the browser may evict all data. Is that told anywhere?

Risk: **high** for the restore case (possible data loss), medium otherwise.

Sketch:
```ts
// unit (fake-indexeddb): quota during restore leaves the old data or a clear error, never half of each
it('a quota error mid-restore keeps the previous data', async () => {
  const db = freshDb(); await seedTasks(db, 50);
  const backup = await exportBackup(db, 1000);
  let n = 0; const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...a) { if (++n > 20) throw new DOMException('full', 'QuotaExceededError'); return put.apply(this, a); };
  await expect(importBackup(db, backup)).rejects.toThrow();
  IDBObjectStore.prototype.put = put;
  expect(await db.tasks.count()).toBe(50);          // likely FAILS today: the clear is not in one transaction with the puts
});
// e2e: the quota probe below plus expect(status).toHaveText(/storage is full/i) and not /Exception|Error:/.
```

### 3.10 Also found while auditing

| Gap | Risk | Note |
|---|---|---|
| No e2e project runs in `Asia/Kolkata` | Medium | Tests run in the runner's time zone. Add a project with `timezoneId: 'Asia/Kolkata'` so 04:00 and bedtime are checked in the users' real zone. |
| `pathLogic.test.ts` slow test has no timeout | Low | Failed at 5 s under coverage and load (measured 20.6 s). |
| Dead code: `core/economy/trainAwards.ts`, `data/repos/mind.ts`, the `core/economy/index.ts` barrel | Low | They lower coverage and confuse readers. |
| `data/repos/gamify.ts` imports from `ui/learn/flow` | Low | Data depends on UI, which makes it harder to unit-test in isolation. |

## 4. Suggested order

1. Clock moved back (§3.5): a unit test that fails today, then a fix.
2. Quota during restore (§3.9): a unit test with fake-indexeddb.
3. Real older-build backup fixtures (§3.2).
4. Unit tests for `reconcileGamify` and `purchaseShopItem` (§2 rows 1 and 3): double purchase, same-id race, v2From.
5. Keyboard, after-bedtime no-celebration, and 04:00 e2e tests.
6. The rest.

## Appendix: probe code (run from /tmp, not committed)

`/tmp/cj2/job8-probe/pw.config.ts`:
```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '/tmp/cj2/job8-probe', timeout: 90_000, workers: 1,
  use: { baseURL: 'http://localhost:4391', browserName: 'chromium', viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
  webServer: { command: 'npx vite preview --outDir dist-e2e --port 4391 --strictPort', cwd: '/tmp/cj2/job8', url: 'http://localhost:4391', reuseExistingServer: false },
});
```
Run: `VITE_E2E=1 npx vite build --outDir dist-e2e && npx playwright test --config /tmp/cj2/job8-probe/pw.config.ts --reporter=line`
(symlink `/tmp/cj2/job8-probe/node_modules` to the worktree's `node_modules`).

Clock-back probe (`clock.spec.ts`):
```ts
const xpLine = async (page) => { await page.goto('/#you');
  await expect(page.getByRole('main')).toContainText('XP in all');
  return (await page.getByRole('main').innerText()).match(/Level \d+\s*\n?\s*[\d,]+ XP in all/)?.[0]; };
test('clock ahead, earn, then clock corrected back', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00')); await page.goto('/#plan');
  const add = async (t) => { await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(t);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Done' }).last().click();
    await page.waitForTimeout(600); };
  await add('Real day task');            console.log(await xpLine(page));   // Level 1 5 XP in all
  await page.clock.setFixedTime(new Date('2026-10-23T10:00:00')); await page.goto('/#plan'); await page.reload();
  await add('Clock-ahead task');         console.log(await xpLine(page));   // Level 1 25 XP in all
  await page.clock.setFixedTime(new Date('2026-10-20T18:00:00')); await page.reload();
  console.log(await xpLine(page));                                          // Level 1 5 XP in all  <- drop
});
```

Quota probe:
```ts
await page.evaluate(() => { const fail = () => { throw new DOMException('Simulated quota', 'QuotaExceededError'); };
  IDBObjectStore.prototype.put = fail; IDBObjectStore.prototype.add = fail; });
// add a task, then read [role=alert],[role=status],.toast
// -> ["Simulated quota QuotaExceededError: Simulated quota"], box keeps "Quota task 10m", task not listed
```

04:00 probe: `page.clock.install({ time: 03:50 })`, open `/#plan`, `page.clock.runFor(20 min)`, read `main`. The screen moved from "Tonight" to the new day's Plan with no event.

Two-tab probe: two pages in one context, add a task in A, `expect(B.getByText(...)).toBeVisible()`. It was seen after 115 ms.

Keyboard probe: 40 × `keyboard.press('Tab')`, recording `document.activeElement` and its computed outline and box-shadow.

Long-title probe: add a 240-character word and a 140-character sentence, then compare `scrollWidth` with `clientWidth` on `#plan` and `#today` (both 360/360).
