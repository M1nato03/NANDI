import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openMore } from '../e2e/helpers/plan';
import { answerRight, seedTaughtTopics, walkIdea } from '../e2e/learn-helpers';
import { textAt200 } from '../e2e/helpers/text';
import { seedRecapWeek } from '../e2e/recap-seed';

// The 360x800 review set (item 140): each main screen with seeded data, reduced motion so a frame is stable.
// Run with `npm run shots`; add a shot here when a change touches a screen that is not in the set.
const out = process.env.SHOTS_DIR ?? 'shots-out';
const themes = process.env.SHOTS_THEME === 'both' ? ['light', 'dark'] as const : process.env.SHOTS_THEME === 'dark' ? ['dark'] as const : ['light'] as const;
const NOON = new Date('2026-10-26T12:00:00');

async function planWithTasks(page: Page) {
  await page.clock.install({ time: NOON });
  await page.goto('/#plan');
  await page.getByLabel('Add a task').fill('Call the bank');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await openMore(page);
  await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Finish the redesign');
  await page.getByLabel('Minutes').fill('150');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Split preview' });
  await preview.getByLabel('Number of steps').selectOption('3');
  await preview.getByRole('button', { name: 'Save' }).click();
  await page.reload(); // More starts closed again, as on a fresh open
  await expect(page.locator('.mor-parent')).toHaveCount(1);
  await expect(page.locator('details.plan-more')).not.toHaveAttribute('open');
}

async function seedDueIdeas(page: Page, ids: string[], at: number) {
  await page.evaluate(async ({ ids, at }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('learnConcepts', 'readwrite');
      for (const id of ids) transaction.objectStore('learnConcepts').put({ id, mastery: 0.5, attempts: 3, firstLearnedAt: at - 3 * 86_400_000, memory: { stability: 2, difficulty: 5, interval: 2, lastReview: at - 2 * 86_400_000, dueAt: at - 3_600_000 }, activeMisconceptions: [], updatedAt: at, deleted: 0, deviceId: 'shots' });
      transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, { ids, at });
}

for (const theme of themes) test.describe(theme, () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' }); });
  const shot = (page: Page, name: string, fullPage = true) => page.screenshot({ path: `${out}/${theme}/${name}.png`, fullPage });

  test('plan: a plain and a stepped task, the mark-all check, a move, and the steps in Details', async ({ page }) => {
    await planWithTasks(page);
    await shot(page, 'plan-0-top', false);
    await shot(page, 'plan-1-tasks');
    await page.locator('.mor-parent').getByRole('button', { name: /^Done: / }).click();
    await shot(page, 'plan-2-mark-all');
    await page.locator('.mor-parent').getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Tomorrow: Call the bank' }).click();
    await expect(page.locator('.mor-toast')).toBeVisible();
    await shot(page, 'plan-3-moved');
    await page.locator('.mor-parent .task-title-button').click();
    await expect(page.getByRole('region', { name: 'Steps' })).toBeVisible();
    await shot(page, 'plan-5-steps-in-details', false);
  });

  // Item 183: More starts closed at the bottom of Plan; the tab bar spans the width on every tab.
  test('plan: More closed and open, and the tab bar on each tab', async ({ page }) => {
    await planWithTasks(page);
    await shot(page, 'plan-6-more-closed');
    await openMore(page);
    await shot(page, 'plan-7-more-open');
    for (const tab of ['plan', 'read', 'yatra', 'you']) {
      await page.goto(`/#${tab}`);
      const bar = (await page.getByRole('navigation', { name: 'Main tabs' }).boundingBox())!;
      await page.screenshot({ path: `${out}/${theme}/tabbar-${tab}.png`, clip: { x: 0, y: bar.y - 8, width: 360, height: bar.height + 8 } });
    }
  });

  test('plan: a running focus', async ({ page }) => {
    await planWithTasks(page);
    await page.getByRole('button', { name: 'Start: Call the bank' }).click();
    await expect(page.getByRole('region', { name: 'Focus' })).toBeVisible();
    await page.clock.runFor(125_000);
    await shot(page, 'plan-4-focus');
  });

  // Spec 45b: Home as a notebook page: useful days and a task, a running focus, a Book check, a new phone, night,
  // each friend's tap, and 200% text with the next move still reachable.
  // 47-L1: the You season card's pace-setter line and the ladder's header, inside Season 1 with some SP; and at 200% text.
  test('ladder L1 pace-setters', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-08T12:00:00') });
    await page.goto('/#you');
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => {
        const transaction = database.transaction('ledger', 'readwrite');
        let n = 0;
        for (const day of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']) for (let i = 0; i < 6; i++) { n += 1; transaction.objectStore('ledger').put({ id: `done:l1-${n}`, dayKey: day, mode: 'tasks', kind: 'done', refId: `l1-${n}`, inputs: { plannedSize: 'L', wasPlanned: true }, updatedAt: new Date(`${day}T12:00:00`).getTime() + n, deleted: 0, deviceId: 'shots' }); }
        transaction.oncomplete = () => resolve();
      });
      database.close();
    });
    await page.reload();
    const card = page.locator('.economy-season-card');
    await expect(card.locator('.economy-rival')).toBeVisible();
    await card.scrollIntoViewIfNeeded();
    await shot(page, 'l1-1-you-card', false);
    await page.getByRole('button', { name: 'View the ladder' }).click();
    await expect(page.locator('.ladder-pace')).toBeVisible();
    await shot(page, 'l1-2-ladder', false);
    await page.reload();
    await expect(page.locator('.ladder-pace')).toBeVisible();
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await shot(page, 'l1-4-ladder-200-text', false);
    await page.goto('/#you');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await page.locator('.economy-rival').scrollIntoViewIfNeeded();
    await shot(page, 'l1-3-you-card-200-text', false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test('47b useful days', async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install({ time: new Date('2026-11-04T12:00:00') });
    const seedDone = (days: string[]) => page.evaluate(async list => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => {
        const transaction = database.transaction('ledger', 'readwrite');
        let n = 0;
        for (const day of list) for (let i = 0; i < 4; i++) { n += 1; transaction.objectStore('ledger').put({ id: `done:u-${day}-${n}`, dayKey: day, mode: 'tasks', kind: 'done', refId: `u-${day}-${n}`, inputs: { plannedSize: 'L', wasPlanned: true }, updatedAt: new Date(`${day}T12:00:00`).getTime() + n, deleted: 0, deviceId: 'shots' }); }
        transaction.oncomplete = () => resolve();
      });
      database.close();
    }, days);
    // An empty week first.
    await page.goto('/?e2e#you');
    const week = page.getByRole('region', { name: 'This week', exact: true });
    await expect(week).toBeVisible();
    await page.locator('.economy-season-card').scrollIntoViewIfNeeded();
    await shot(page, 'u1-you-empty-week', false);
    // Three useful days of four, with the picker open and a change pending.
    await seedDone(['2026-11-02', '2026-11-03', '2026-11-04']);
    await page.reload();
    await expect(week.getByRole('heading')).toHaveText('3 of your 4');
    await page.locator('.economy-season-card').scrollIntoViewIfNeeded();
    await shot(page, 'u2-you-season-and-week', false);
    await week.scrollIntoViewIfNeeded();
    await shot(page, 'u3-you-week', false);
    await week.getByRole('button', { name: /^Change your weekly target/ }).click();
    await week.getByRole('radio', { name: '5' }).check();
    await week.locator('.useful-target-form').scrollIntoViewIfNeeded();
    await shot(page, 'u4-target-picker', false);
    await week.getByRole('button', { name: 'Set target' }).click();
    await expect(week).toContainText('5 from Mon 9 Nov');
    await week.scrollIntoViewIfNeeded();
    await shot(page, 'u5-target-pending', false);
    await page.getByRole('button', { name: 'How the ladder works' }).first().click();
    await expect(page.getByRole('dialog', { name: 'How the ladder works' })).toBeVisible();
    await shot(page, 'u6-ladder-how', false);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'View the ladder' }).click();
    await page.getByRole('group', { name: 'On your You page' }).scrollIntoViewIfNeeded();
    await shot(page, 'u7-ladder-choice', false);
    await page.getByRole('radio', { name: 'Keep rank tucked away' }).check();
    await page.goBack();
    await page.locator('.economy-season-card').scrollIntoViewIfNeeded();
    await shot(page, 'u8-you-rank-tucked', false);
    await page.goto('/?e2e#yatra/days');
    await expect(page.locator('.useful-days-facts')).toBeVisible();
    await shot(page, 'u9-record');
    await page.goto('/?e2e#yatra');
    await expect(page.locator('button.home-week')).toBeVisible();
    await shot(page, 'u10-home-line', false);
    await page.goto('/?e2e#you');
    await textAt200(page);
    await page.getByRole('region', { name: 'This week', exact: true }).scrollIntoViewIfNeeded();
    await shot(page, 'u11-you-week-200', false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto('/?e2e#yatra/days');
    await textAt200(page);
    await shot(page, 'u12-record-200', false);
  });

  test('47c season result', async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install({ time: new Date('2026-12-07T10:00:00') });
    await page.goto('/?e2e#you');
    const put = (store: string, rows: Record<string, unknown>[]) => page.evaluate(async ({ store, rows }) => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction(store, 'readwrite'); for (const row of rows) transaction.objectStore(store).put(row); transaction.oncomplete = () => resolve(); });
      database.close();
    }, { store, rows });
    const days = Array.from({ length: 19 }, (_, i) => new Date(Date.UTC(2026, 10, 2 + i * 2)).toISOString().slice(0, 10));
    let n = 0;
    await put('ledger', days.flatMap(day => Array.from({ length: 8 }, () => ({ id: `done:r-${++n}`, dayKey: day, mode: 'tasks', kind: 'done', refId: `r-${n}`, inputs: { plannedSize: 'L', wasPlanned: true }, updatedAt: new Date(`${day}T12:00:00`).getTime() + n, deleted: 0, deviceId: 'shots' }))));
    const flag = (key: string, value: unknown) => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 'shots' });
    await put('settings', [flag('welcome.done', '2026-11-01'), flag('notebook.breath.opening', 'off')]);
    await page.goto('/?e2e');
    await page.reload();
    const result = page.getByRole('dialog', { name: 'Season 1 result' });
    await expect(result).toBeVisible();
    await shot(page, 'r1-result', false);
    await textAt200(page);
    await shot(page, 'r2-result-200', false);
    await result.getByRole('button', { name: 'See your useful days' }).click();
    await page.getByRole('button', { name: /^Past seasons/ }).scrollIntoViewIfNeeded();
    await shot(page, 'r3-record-past-link', false);
    await page.getByRole('button', { name: /^Past seasons/ }).click();
    await expect(page.getByRole('heading', { name: 'Past seasons', level: 1 })).toBeVisible();
    await shot(page, 'r4b-past-seasons-200');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Past seasons', level: 1 })).toBeVisible();
    await shot(page, 'r4-past-seasons');
    // Rank tucked away, on a fresh open of the next result (the flag cleared for the shot).
    await put('settings', [flag('season.rankShown', false), { ...flag('useful.resultShown:2026-11-02', null), deleted: 1 }]);
    await page.goto('/?e2e');
    await page.reload();
    await expect(result).toBeVisible();
    await shot(page, 'r5-result-tucked', false);
  });

  test('covers fix', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install({ time: new Date('2026-11-04T12:00:00') });
    // The phone's larger text (Android text zoom) stood in by larger cover titles, there from the first frame.
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('zoom-shot')) return;
      const css = '.read-library .book-cover .book-cover-title { font-size: 20px; } .read-continue .cover-thumb .book-cover-title { font-size: 13px; }';
      const add = () => { if (!document.head) return false; const style = document.createElement('style'); style.textContent = css; document.head.append(style); return true; };
      if (!add()) { const watch = new MutationObserver(() => { if (add()) watch.disconnect(); }); watch.observe(document, { childList: true, subtree: true }); }
    });
    await page.goto('/?e2e#read');
    const library = page.getByRole('region', { name: 'Library' });
    await expect(library).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await library.scrollIntoViewIfNeeded();
    await shot(page, 'c1-library', false);
    await page.getByRole('region', { name: 'Classics' }).scrollIntoViewIfNeeded();
    await shot(page, 'c2-classics', false);
    await page.evaluate(() => sessionStorage.setItem('zoom-shot', '1'));
    await page.reload();
    await expect(library).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('region', { name: 'Classics' }).scrollIntoViewIfNeeded();
    await shot(page, 'c3-classics-phone-text-larger', false);
    await page.evaluate(() => sessionStorage.removeItem('zoom-shot'));
    await page.reload();
    await textAt200(page);
    await page.getByRole('region', { name: 'Classics' }).scrollIntoViewIfNeeded();
    await shot(page, 'c4-classics-200', false);
  });

  test('spec 45b home', async ({ page }) => {
    test.setTimeout(180_000);
    const WED = new Date('2026-10-28T08:30:00');
    const meta = { updatedAt: 1, deleted: 0, deviceId: 'shots' };
    const put = (store: string, rows: Record<string, unknown>[]) => page.evaluate(async ({ store, rows }) => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction(store, 'readwrite'); for (const row of rows) transaction.objectStore(store).put(row); transaction.oncomplete = () => resolve(); });
      database.close();
    }, { store, rows });
    const at = (day: string, hour: number) => new Date(`2026-10-${day}T${hour}:00:00`).getTime();
    const settle = async () => { await page.waitForTimeout(600); };
    await page.clock.install({ time: WED });
    // A new phone: no useful day yet, and Read is the move.
    await page.goto('/#yatra');
    await expect(page.locator('.next-move')).toBeVisible();
    await settle();
    await shot(page, '45b-4-home-new', false);
    // Two useful days this week (planned tasks done, Calm, ideas), and a task for today.
    await put('ledger', [
      { id: 'c1', mode: 'calm', kind: 'session', refId: 'c1', dayKey: '2026-10-26', inputs: { minutes: 12 }, ...meta },
      { id: 'c2', mode: 'calm', kind: 'session', refId: 'c2', dayKey: '2026-10-27', inputs: { minutes: 10 }, ...meta },
      { id: 'i1', mode: 'read', kind: 'idea', refId: 'i1', dayKey: '2026-10-27', inputs: {}, ...meta },
      { id: 'i2', mode: 'read', kind: 'idea', refId: 'i2', dayKey: '2026-10-27', inputs: {}, ...meta },
      { id: 'done:d1', mode: 'tasks', kind: 'done', refId: 'd1', dayKey: '2026-10-26', inputs: { wasPlanned: true }, ...meta },
      { id: 'done:d2', mode: 'tasks', kind: 'done', refId: 'd2', dayKey: '2026-10-27', inputs: { wasPlanned: true }, ...meta },
    ]);
    await put('tasks', [{ id: 'd1', title: 'Pay the hostel fee', status: 'done', dayKey: '2026-10-26', ...meta }, { id: 'd2', title: 'Email the professor', status: 'done', dayKey: '2026-10-27', ...meta }]);
    await page.reload(); // raw IndexedDB writes are not seen by Dexie's live queries
    await put('focus', [{ id: 'f1', taskId: 'old', startedAt: at('27', 10), endedAt: at('27', 10) + 95 * 60_000, ...meta }]);
    await page.goto('/#plan');
    await page.getByLabel('Add a task').fill('Call the bank');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.goto('/#yatra');
    await expect(page.locator('.next-move')).toContainText('Call the bank');
    await settle();
    await shot(page, '45b-1-home', false);
    await shot(page, '45b-1b-home-full');
    // One tap on the line opens the record.
    await page.locator('.home-week').click();
    await expect(page.locator('.useful-days-list > li')).toHaveCount(2);
    await settle();
    await shot(page, '45b-8-useful-days-record', false);
    // Each friend's tap: the reaction where it stands, then its area, once.
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' });
    for (const [name, hash] of [['Plan, Mor at the map', 'plan'], ['Read, Chiku on the reading rock', 'read'], ['Train, Nandi by the pack', 'yatra/train'], ['Play, Kapi in the branches', 'yatra/mind'], ['Calm, Kachhua by the fire', 'yatra/calm']] as const) {
      await page.goto('/#yatra');
      const friend = page.getByRole('button', { name });
      await expect(friend).toBeVisible();
      await page.waitForTimeout(1300); // the walk-in step ends
      await friend.click();
      await page.waitForTimeout(120);
      await shot(page, `45b-5-tap-${hash.replace('/', '-')}`, false);
      await page.clock.runFor(400);
      await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    }
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    // A running focus takes the move.
    await page.goto('/#plan');
    await page.getByRole('button', { name: 'Start: Call the bank' }).click();
    await expect(page.getByRole('region', { name: 'Focus' })).toBeVisible();
    await page.clock.fastForward(24 * 60_000 + 10_000);
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Yatra' }).click();
    await expect(page.locator('.next-move')).toContainText('Working on');
    await settle();
    await shot(page, '45b-2-home-focus', false);
    await page.locator('.next-move-go').click();
    await page.getByRole('region', { name: 'Focus' }).getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('region', { name: 'Focus' })).toHaveCount(0);
    // Yesterday's chapter waits for its Book check.
    await put('ledger', [{ id: 'ch1', mode: 'read', kind: 'chapter', refId: 'richest-man-in-babylon:babylon-2', dayKey: '2026-10-27', inputs: { checkLater: true }, ...meta }]);
    await page.goto('/#yatra');
    await expect(page.locator('.next-move')).toContainText('Book check');
    await settle();
    await shot(page, '45b-3-home-book-check', false);
    // 200% text: the page scrolls and the next move is still there.
    await page.clock.runFor(10_000); // the finished focus's toast clears first
    await expect(page.locator('.economy-toast')).toHaveCount(0, { timeout: 15_000 });
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await settle();
    await shot(page, '45b-6-home-200-text', false);
    await page.locator('.next-move-go').scrollIntoViewIfNeeded();
    await shot(page, '45b-6b-home-200-text-move', false);
    // Night at camp.
    await page.clock.setSystemTime(new Date('2026-10-28T22:10:00'));
    await page.goto('/#plan');
    await page.goto('/');
    await expect(page.locator('.trek-scene.is-night')).toBeVisible();
    await settle();
    await shot(page, '45b-7-home-night', false);
  });

  // Spec 36 v2: Train done with 6 sets, a hard board with 1 hint, a chapter done (ideas and right answers), You after a heavy day.
  test('effort v2: train done, hard board with a hint, chapter done, you after a heavy day', async ({ page }) => {
    test.setTimeout(180_000);
    await page.clock.install({ time: new Date('2026-11-04T10:00:00') });
    // Train: placement, then six sets a minute apart, then finish.
    await page.goto('/#train');
    await page.getByRole('button', { name: 'Start placement' }).click();
    for (let pattern = 0; pattern < 7; pattern++) {
      if (pattern === 4 || pattern === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
      await page.getByRole('button', { name: 'Record test' }).click();
    }
    await page.getByRole('button', { name: 'Start session' }).click();
    for (let set = 0; set < 6; set++) {
      const log = page.getByRole('button', { name: 'Log set' });
      if (!(await log.isVisible())) await page.getByRole('button', { name: 'Next exercise' }).click();
      await page.getByRole('button', { name: 'Log set' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Set saved' })).toBeVisible();
      await page.clock.fastForward(60_000);
    }
    await page.getByRole('button', { name: 'Finish session' }).click();
    await expect(page.getByRole('heading', { name: 'Session saved' })).toBeVisible();
    // Six sets of a longer plan is a session stopped early: 8 a set, and what the whole plan pays (spec 36 v2 review).
    await expect(page.locator('.train-earned')).toHaveText('6 sets logged · +48 XP');
    await expect(page.locator('.train-next')).toHaveText(/^The full plan pays \+\d+ next time\.$/);
    await shot(page, 'v2-1-train-done', false);
    // Mind: three earlier Sun and moon solves, so on a Wednesday (not its featured day) its board is hard; one hint, then solved.
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction('puzzleRuns', 'readwrite');
        for (const day of ['2026-10-31', '2026-11-01', '2026-11-02']) tx.objectStore('puzzleRuns').put({ id: `daily:${day}:sunmoon:easy`, dayKey: day, type: 'sunmoon', diff: 'easy', daily: true, shelf: true, result: 'solved', deleted: 0, updatedAt: 1, deviceId: 'shots' });
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
      });
      database.close();
    });
    await page.goto('/?e2e#yatra/mind/shelf/sunmoon');
    await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
    const howTo = page.getByRole('button', { name: /^(Start|Play|Got it)/ });
    if (await howTo.first().isVisible().catch(() => false)) await howTo.first().click();
    await page.getByRole('button', { name: 'Hint' }).click();
    await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
    await expect(page.locator('.mind-earned')).toHaveText('Hard board, 1 hint · +25 XP');
    await shot(page, 'v2-2-board-hard-hint', false);
    // Read (spec 41): the chapter one idea a sitting, to its done card.
    await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
    await expect(page.locator('.idea-sitting')).toBeVisible();
    while (await page.locator('.idea-sitting').or(page.locator('.idea-end')).first().isVisible()) {
      if (await page.locator('.idea-end').isVisible()) await page.getByRole('button', { name: 'One more idea' }).click();
      await walkIdea(page, 'how-things-work');
    }
    await expect(page.locator('.read-done-card .read-earned')).toBeVisible();
    await shot(page, 'v2-3-chapter-done', false);
    // You after a heavy day: two more chapters and a case on top.
    await page.goto('/#you');
    await expect(page.getByRole('region', { name: 'Your season' })).toBeVisible();
    await page.waitForTimeout(600);
    await shot(page, 'v2-4-you-heavy-day');
  });

  // Spec 33: Read, a book, a chapter mid-way, each check kind, chapter done and book done.
  test('read: home with idea checks due, then a book page', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#read');
    await seedTaughtTopics(page, ['money-markets']);
    await seedDueIdeas(page, ['inflation', 'compounding'], NOON.getTime());
    await page.reload();
    await expect(page.getByRole('region', { name: 'Review with Moti' })).toBeVisible();
    await shot(page, 'read-1-home');
    await page.goto('/?e2e#read/book/psychology');
    await page.locator('.read-chapter-ideas summary').first().click();
    await shot(page, 'read-2-book');
  });

  test('read: a chapter mid-way (an idea done), chapter done', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
    await walkIdea(page, 'how-things-work');
    await expect(page.locator('.idea-end')).toBeVisible();
    await shot(page, 'read-3-chapter-midway', false);
    await page.goto('/?e2e#read');
    await seedTaughtTopics(page, ['how-things-work']);
    await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
    await expect(page.locator('.read-done-card')).toBeVisible();
    await shot(page, 'read-7-chapter-done', false);
  });

  test('read: the Classics shelf and How to Win Friends mid-chapter', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#read');
    await page.getByRole('region', { name: 'Classics' }).scrollIntoViewIfNeeded();
    await shot(page, 'read-9-classics-shelf', false);
    await page.goto('/?e2e#read/book/how-to-win-friends');
    await shot(page, 'read-10-htwf-book');
    await page.goto('/?e2e#read/chapter/how-to-win-friends/htwf-1');
    await walkIdea(page, 'how-to-win-friends');
    await expect(page.locator('.idea-end')).toBeVisible();
    await shot(page, 'read-11-htwf-midway', false);
  });

  test('read: the recall and Chiku checks, and book done', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#read');
    await seedTaughtTopics(page, ['money-markets', 'psychology', 'history-civilisations']);
    await page.goto('/?e2e#read/chapter/money-markets/money-markets-ch1');
    await page.getByRole('button', { name: 'Inflation', exact: true }).click();
    await shot(page, 'read-5-check-recall', false);
    await page.goto('/?e2e#read/chapter/psychology/psychology-ch1');
    await expect(page.locator('.chiku-skip')).toBeVisible();
    await shot(page, 'read-6-check-chiku', false);
    for (const chapter of ['history-civilisations-ch1', 'history-civilisations-ch2']) {
      await page.goto(`/?e2e#read/chapter/history-civilisations/${chapter}`);
      await expect(page.locator('.read-done-card')).toBeVisible();
    }
    await expect(page.locator('.read-done-card')).toContainText('You finished');
    await shot(page, 'read-8-book-done', false);
  });

  // Spec 38: Calm on the phone's player (the e2e stand-in): the setup line, a call's pause, the done line after.
  test('spec 38 calm locked', async ({ page }) => {
    await page.clock.install({ time: NOON });
    await page.goto('/#plan');
    await page.evaluate(() => sessionStorage.setItem('nandi.e2eCalm', JSON.stringify({ on: true })));
    await page.goto('/#yatra/calm');
    await expect(page.locator('.calm-under')).toBeVisible();
    await page.clock.runFor(1000);
    // No sound and no interval bells: nothing to play, so the sit stays in the app and says so.
    await shot(page, 's38-0-setup-no-sound-stays-in-app', false);
    await page.getByRole('button', { name: 'River', exact: true }).click();
    await expect(page.locator('.calm-under')).toContainText('You can lock your phone');
    await shot(page, 's38-1-setup-lock-line', false);
    await page.getByRole('button', { name: 'Quiet', exact: true }).click();
    await page.getByRole('button', { name: '10 min', exact: true }).click();
    await page.locator('.calm-start').click();
    await page.clock.fastForward(2 * 60_000);
    await page.evaluate(() => { const fake = JSON.parse(sessionStorage.getItem('nandi.e2eCalm')!); fake.sit.journal.push({ type: 'paused', at: Date.now(), reason: 'call' }); fake.sit.status = 'paused'; fake.sit.pausedFor = 'call'; sessionStorage.setItem('nandi.e2eCalm', JSON.stringify(fake)); });
    await expect(page.getByText('Paused for a call. The clock waits.')).toBeVisible();
    if (await page.locator('.calm-dim').count()) await page.locator('.calm-dim').click();
    await shot(page, 's38-2-paused-for-a-call', false);
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.clock.fastForward(9 * 60_000);
    await expect(page.locator('.calm-phase')).toHaveText('10 quiet minutes, together.');
    await shot(page, 's38-3-done-after-locked-sit', false);
  });

  // Spec 45a: the square breath before the first page (in, hold, out, holds off, the One more round offer), Calm's
  // Square and Slow, a route fading in, 200% text, and reduced motion at two phases.
  test('spec 45a breath', async ({ page }) => {
    const MORNING = new Date('2026-10-31T09:00:00');
    const put = (rows: [string, unknown][]) => page.evaluate(async entries => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction('settings', 'readwrite'); for (const [key, value] of entries) transaction.objectStore('settings').put({ key, value, updatedAt: Date.now(), deleted: 0, deviceId: 'shots' }); transaction.oncomplete = () => resolve(); });
      database.close();
    }, rows);
    const breath = page.getByRole('dialog', { name: 'Breathe with the square.' });
    const open = async () => { await page.goto('/?e2e'); await expect(page.locator('html')).toHaveAttribute('data-opening-breath', 'shown'); await expect(breath).toBeVisible(); };
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' });
    await page.clock.install({ time: MORNING });
    await page.goto('/?e2e#you');
    // The first visit installs the offline worker, which reloads the page once; let that happen first.
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller, undefined, { timeout: 15_000 }).catch(() => undefined);
    await put([['welcome.done', '2026-10-30'], ['notebook.breath.opening', 'every']]);
    await open();
    await page.clock.runFor(2_000); await page.waitForTimeout(400);
    await shot(page, '45a-1-opener-in', false);
    await page.clock.runFor(4_000); await page.waitForTimeout(400);
    await shot(page, '45a-2-opener-hold', false);
    await page.clock.runFor(6_000); await page.waitForTimeout(400);
    await shot(page, '45a-3-opener-out', false);
    await breath.getByRole('button', { name: 'Holds: on' }).click();
    await page.clock.runFor(2_000); await page.waitForTimeout(400);
    await shot(page, '45a-4-opener-holds-off', false);
    await page.clock.runFor(21_000); await page.waitForTimeout(300);
    await expect(breath.getByRole('button', { name: 'One more round' })).toBeVisible();
    await shot(page, '45a-5-one-more-round', false);
    // 200% text on the opening page, holds on: in, then hold (the page scrolls; Skip follows the cue).
    await put([['notebook.breath.holds', true]]);
    await open();
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await page.clock.runFor(1_000); await page.waitForTimeout(300);
    await shot(page, '45a-6a-opener-200-text-in', false);
    await page.clock.runFor(5_000); await page.waitForTimeout(300);
    await shot(page, '45a-6b-opener-200-text-hold', false);
    await breath.evaluate(node => node.scrollTo(0, node.scrollHeight));
    await shot(page, '45a-6c-opener-200-text-scrolled', false);
    await breath.getByRole('button', { name: 'Skip →' }).click();
    await expect(breath).toHaveCount(0);
    // Calm: Square and Slow.
    await put([['notebook.breath.opening', 'off'], ['notebook.breath.holds', true]]);
    await page.goto('/?e2e#yatra/calm');
    await page.reload(); // drops the 200% style
    await page.getByRole('button', { name: 'Square' }).click();
    await expect(page.getByRole('button', { name: 'Square' })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.calm-start-bar').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400); // the chips' colour change settles
    await shot(page, '45a-7-calm-square-setup', false);
    await page.getByRole('button', { name: /^Start/ }).click();
    await page.clock.runFor(6_500); await page.waitForTimeout(400);
    await shot(page, '45a-8-calm-square-running', false);
    await page.getByRole('button', { name: 'Stop' }).click();
    await page.getByRole('button', { name: 'Slow' }).click();
    await expect(page.getByRole('button', { name: 'Slow' })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.calm-start-bar').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await shot(page, '45a-9-calm-slow-setup', false);
    await page.getByRole('button', { name: /^Start/ }).click();
    await page.clock.runFor(2_000); await page.waitForTimeout(300);
    await shot(page, '45a-10-calm-slow-running', false);
    await page.getByRole('button', { name: 'Stop' }).click();
    await page.getByRole('button', { name: 'Square' }).click();
    await expect(page.getByRole('button', { name: 'Square' })).toHaveAttribute('aria-pressed', 'true');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await shot(page, '45a-11-calm-square-setup-200-text', true);
    await page.getByRole('button', { name: /^Start/ }).click();
    await page.clock.runFor(1_000); await page.waitForTimeout(300);
    await shot(page, '45a-12-calm-square-running-200-text', true);
    await page.getByRole('button', { name: 'Stop' }).click();
    // A route change: Plan, then Read just after the tap (fading in), then Read settled.
    await page.goto('/?e2e#plan');
    await page.reload();
    await expect(page.locator('#main h1')).toBeVisible();
    await shot(page, '45a-13-route-before', false);
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Read' }).click();
    await page.waitForTimeout(90);
    await shot(page, '45a-14-route-fading-in', false);
    await page.waitForTimeout(500);
    await shot(page, '45a-15-route-after', false);
    // Reduced motion: nothing moves; the darker side, the words and Skip are there.
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await put([['notebook.breath.opening', 'every']]);
    await open();
    await page.clock.runFor(1_000);
    await shot(page, '45a-16-reduced-in', false);
    await page.clock.runFor(10_500);
    await shot(page, '45a-17-reduced-out', false);
  });

  // a11y batch 2: the spot targets (outlined to show their 44 px boxes), 200% text, the reminders-off card, a full phone.
  test('a11y batch 2', async ({ page }) => {
    await page.clock.install({ time: NOON });
    await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
    await walkIdea(page, 'how-things-work');
    await page.getByRole('button', { name: 'One more idea' }).click();
    for (let screen = 0; screen < 6 && !(await page.locator('.step-example').count()); screen++) {
      await page.clock.runFor(1000);
      if (await page.locator('.learn-options').count()) await page.locator('.learn-options button').first().click();
      await page.locator('.idea-sitting').getByRole('button', { name: /^(Continue|Finish the idea)$/ }).first().click();
    }
    await page.clock.runFor(1000);
    await page.addStyleTag({ content: '.step-example .step-part { outline: 2px dashed #d0021b; outline-offset: 0; }' });
    await shot(page, 'a2-1-spot-44px-outlined', false);
    // 200% text: the focus strip and the trek's caption and signs.
    await page.goto('/?e2e#plan/focus');
    await page.getByLabel('Add a task').fill('Write the long quarterly report for the regional office');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Start focus' }).click();
    await page.goto('/?e2e#yatra');
    await expect(page.locator('.yatra-focus-strip')).toBeVisible();
    await page.addStyleTag({ content: '.trek-place b { font-size: 20px !important; } .trek-caption b { font-size: 20px !important; } .trek-caption span { font-size: 32px !important; } .yatra-focus-strip { font-size: 32px !important; } .deck-context { font-size: 28px !important; }' });
    await page.clock.runFor(1000);
    await shot(page, 'a2-2-yatra-200-text', false);
    // The reminders-off card under Plan's lists (a timed task today, notifications off).
    await page.evaluate(() => sessionStorage.setItem('nandi.e2eNotify', 'denied'));
    await page.evaluate(async at => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction('tasks', 'readwrite'); transaction.objectStore('tasks').put({ id: 'shot-timed', title: 'Call the bank', status: 'planned', dayKey: '2026-10-26', size: 'S', estimateMin: 15, mustOrCould: 'must', scheduledStart: at, updatedAt: at, deleted: 0, deviceId: 'shots' }); transaction.oncomplete = () => resolve(); });
      database.close();
    }, NOON.getTime() + 3_600_000);
    await page.goto('/?e2e#plan');
    await expect(page.locator('.reminders-off')).toBeVisible();
    await page.locator('.reminders-off').scrollIntoViewIfNeeded();
    await shot(page, 'a2-3-reminders-off', false);
    // A full phone: the line at the top, and Backup's answer to "Ask to keep data".
    await page.evaluate(() => window.dispatchEvent(new Event('nandi:storage-full')));
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, 'a2-4-storage-full-line', false);
    await page.getByRole('button', { name: /out of room for NANDI's data/ }).click();
    await page.getByRole('button', { name: 'Ask to keep data on this device' }).click();
    await page.getByRole('button', { name: 'Ask to keep data on this device' }).scrollIntoViewIfNeeded();
    await shot(page, 'a2-5-keep-data-answer', false);
  });

  // Spec 41: one idea a sitting. Babylon has its extra screens (story, example, plan); the rest use the fallback.
  test('spec 41 sittings', async ({ page }) => {
    test.setTimeout(240_000);
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    // An advancing clock, so each sitting has its own time (pay follows the order they were read in).
    await page.clock.install({ time: NOON });
    await page.goto('/?e2e#read/chapter/richest-man-in-babylon/babylon-1');
    // The clock is installed, so let each screen's entrance finish before its picture.
    await walkIdea(page, 'richest-man-in-babylon', async screen => { await page.clock.runFor(1000); await shot(page, `s41-1-screen-${screen}`, false); });
    await expect(page.locator('.idea-end')).toBeVisible();
    await shot(page, 's41-2-idea-end', false);
    // The second idea (an even one) tries spot-the-part, and asks nothing from an earlier day yet (same day).
    await page.getByRole('button', { name: 'One more idea' }).click();
    await walkIdea(page, 'richest-man-in-babylon', async screen => { if (screen === 3 || screen === 4) { await page.clock.runFor(1000); await shot(page, `s41-3-idea2-screen-${screen}`, false); } });
    while (await page.locator('.idea-end').isVisible()) {
      await page.getByRole('button', { name: 'One more idea' }).click();
      await walkIdea(page, 'richest-man-in-babylon');
    }
    // Chapter 1 ends with Teach Chiku (its own check, as before), then its done card.
    await expect(page.locator('.chiku-skip')).toBeVisible();
    await shot(page, 's41-4-last-idea-then-chiku', false);
    await page.locator('.chiku-skip').click();
    await expect(page.locator('.read-done-card')).toBeVisible();
    await shot(page, 's41-4b-chapter-done', false);
    // Chapter 2 has a quiz: done after its last idea, and its three questions wait for tomorrow.
    await page.goto('/?e2e#read/chapter/richest-man-in-babylon/babylon-2');
    await walkIdea(page, 'richest-man-in-babylon');
    await page.getByRole('button', { name: 'One more idea' }).click();
    await walkIdea(page, 'richest-man-in-babylon');
    await expect(page.locator('.read-done-card')).toBeVisible();
    await shot(page, 's41-4c-quiz-chapter-done', false);
    // The next day: the Book check on Yatra, its questions, then "Did you try it?".
    await page.clock.setSystemTime(new Date(NOON.getTime() + 86_400_000));
    await page.goto('/?e2e#yatra');
    await expect(page.getByRole('button', { name: /Book check/ })).toBeVisible();
    await shot(page, 's41-5-yatra-book-check', false);
    await page.getByRole('button', { name: /Book check/ }).click();
    await expect(page.getByText('1 / 3')).toBeVisible();
    await shot(page, 's41-6-book-check-question', false);
    for (let question = 0; question < 3; question++) await answerRight(page, 'richest-man-in-babylon');
    await expect(page.getByRole('heading', { name: 'Did you try it?' })).toBeVisible();
    await shot(page, 's41-7-did-you-try-it', false);
    // An earlier day's question (screen 5) in chapter 3's first idea.
    await page.goto('/?e2e#read/chapter/richest-man-in-babylon/babylon-3');
    await walkIdea(page, 'richest-man-in-babylon', async screen => { if (await page.getByText('From an earlier day').isVisible()) await shot(page, `s41-8-earlier-day-${screen}`, false); });
    // At and past the chapter's cap: How to Win Friends chapter 2 (18 steps), every idea in one day.
    await page.goto('/?e2e#read/chapter/how-to-win-friends/htwf-2');
    await expect(page.locator('.idea-sitting')).toBeVisible();
    let idea = 0;
    while (await page.locator('.idea-sitting').or(page.locator('.idea-end')).first().isVisible()) {
      if (await page.locator('.idea-end').isVisible()) {
        await shot(page, `s41-9-htwf2-idea-${idea}-end`, false);
        await page.getByRole('button', { name: 'One more idea' }).click();
      }
      await walkIdea(page, 'how-to-win-friends');
      idea += 1;
    }
    await shot(page, 's41-10-htwf2-done', false);
  });

  for (const route of ['read', 'you', 'yatra', 'yatra/mind', 'yatra/train', 'yatra/calm', 'you/courtyard', 'you/cast'] as const) test(`tab: ${route}`, async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto(`/?e2e#${route}`);
    await expect(page.locator('main')).toBeVisible();
    await page.waitForTimeout(600);
    await shot(page, route.replace('/', '-'));
  });

  // Spec 34 slice 3: the trek by day, a gate's postcard, the journal, the sky at night, a camp day, and Calm at camp.
  test('yatra: trek day, postcard, journal, night sky, camp day, night calm', async ({ page }) => {
    const fact = (kind: 'train' | 'mind' | 'calm', n: number, day = '2026-10-28') => ({ id: `shot-${kind}-${n}-${day}`, dayKey: day, mode: kind === 'mind' ? 'mind' : kind, kind: kind === 'mind' ? 'board' : 'session', refId: `r${n}`, inputs: {}, updatedAt: new Date(`${day}T09:00:00`).getTime() + n * 60_000, deleted: 0, deviceId: 'shots' });
    const seed = async (facts: ReturnType<typeof fact>[], startDay: string) => {
      await page.evaluate(async ({ facts, startDay }) => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
        await new Promise<void>((resolve, reject) => {
          const transaction = database.transaction(['ledger', 'settings'], 'readwrite');
          transaction.objectStore('ledger').clear();
          for (const row of facts) transaction.objectStore('ledger').put(row);
          transaction.objectStore('settings').put({ key: 'yatra.startDay', value: startDay, updatedAt: 1, deleted: 0, deviceId: 'shots' });
          transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
        });
        database.close();
      }, { facts, startDay });
    };
    const open = async (hash = 'yatra') => {
      await page.reload();
      await expect(async () => {
        const leave = page.getByRole('button', { name: 'Leave night deck' });
        if (await leave.isVisible()) await leave.click();
        await page.evaluate(target => { if (location.hash !== `#${target}`) location.hash = target; }, hash);
        await expect(page.locator('main h1').first()).toBeVisible({ timeout: 1500 });
        await page.waitForTimeout(800);
        expect(await page.evaluate(() => location.hash)).toBe(`#${hash}`);
      }).toPass({ timeout: 20_000 });
      await page.waitForTimeout(700);
    };
    await page.clock.install({ time: new Date('2026-10-29T12:00:00') });
    await page.goto('/?e2e#plan');
    // Day two: Chika reached yesterday, one stretch toward Balu Ka Ghera today (a Mind session opens its gate).
    await seed([fact('train', 1), fact('mind', 2), fact('calm', 3), fact('mind', 4, '2026-10-29')], '2026-10-28');
    await open();
    await expect(page.getByRole('dialog', { name: /postcard$/ })).toBeVisible();
    await shot(page, 'yatra-trek-postcard', false);
    await page.getByRole('button', { name: 'Keep in the journal' }).click();
    await page.getByRole('dialog', { name: /postcard$/ }).waitFor({ state: 'detached' }).catch(() => undefined);
    if (await page.getByRole('dialog', { name: /postcard$/ }).isVisible()) await page.getByRole('button', { name: 'Keep in the journal' }).click();
    await shot(page, 'yatra-trek-day');
    await open('yatra/journal');
    await shot(page, 'yatra-trek-journal');
    await page.clock.setSystemTime(new Date('2026-10-29T23:45:00'));
    await open();
    await page.locator('.trek-scroll').evaluate(node => { node.scrollLeft = 0; });
    await page.waitForTimeout(300);
    await shot(page, 'yatra-trek-night-sky');
    await open('yatra/calm');
    await page.getByRole('button', { name: '3 min', exact: true }).click();
    await page.getByRole('button', { name: 'Start 3 minutes' }).click();
    await page.clock.runFor(5_000);
    await shot(page, 'yatra-trek-night-calm');
    // A camp day: nothing yet today, mid-leg.
    await page.clock.setSystemTime(new Date('2026-10-31T12:00:00'));
    await seed([fact('train', 1, '2026-10-30')], '2026-10-30');
    await open();
    await shot(page, 'yatra-trek-camp-day');
  });

  // Item 198: tonight's stars over the camp, a Train stretch's footprints by day, and a 4-star constellation forming.
  test('yatra: night at camp, train footprints, a constellation forming', async ({ page }) => {
    const fact = (kind: 'train' | 'mind' | 'calm', n: number, day = '2026-10-28') => ({ id: `shot2-${kind}-${n}-${day}`, dayKey: day, mode: kind === 'mind' ? 'mind' : kind, kind: kind === 'mind' ? 'board' : 'session', refId: `r${n}`, inputs: {}, updatedAt: new Date(`${day}T09:00:00`).getTime() + n * 60_000, deleted: 0, deviceId: 'shots' });
    const seed = async (facts: ReturnType<typeof fact>[]) => {
      await page.evaluate(async facts => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
        await new Promise<void>((resolve, reject) => {
          const transaction = database.transaction(['ledger', 'settings'], 'readwrite');
          transaction.objectStore('ledger').clear();
          for (const row of facts) transaction.objectStore('ledger').put(row);
          transaction.objectStore('settings').put({ key: 'yatra.startDay', value: '2026-10-28', updatedAt: 1, deleted: 0, deviceId: 'shots' });
          transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
        });
        database.close();
      }, facts);
    };
    const open = async () => {
      await page.reload();
      await expect(async () => {
        const leave = page.getByRole('button', { name: 'Leave night deck' });
        if (await leave.isVisible()) await leave.click();
        await page.evaluate(() => { if (location.hash !== '#yatra') location.hash = 'yatra'; });
        await expect(page.locator('.notebook-home h1')).toBeVisible({ timeout: 1500 });
        await page.waitForTimeout(800);
        await expect(page.locator('.notebook-home h1')).toBeVisible({ timeout: 100 });
      }).toPass({ timeout: 20_000 });
      const card = page.getByRole('button', { name: 'Keep in the journal' });
      await page.waitForTimeout(1200);
      if (await card.isVisible()) await card.click();
      await page.waitForTimeout(700);
    };
    await page.clock.install({ time: new Date('2026-10-28T12:00:00') });
    await page.goto('/?e2e#plan');
    // Item 203: day one at Jobra, all three friends in view.
    await seed([]);
    await open();
    await shot(page, 'yatra-trek-day-one', false);
    // A Train stretch by day: footprints on the path.
    await seed([fact('train', 1), fact('calm', 2)]);
    await open();
    await shot(page, 'yatra-trek-day-train', false);
    // Three sessions reach Chika today; by night their stars hang over the camp.
    await seed([fact('train', 1), fact('mind', 2), fact('calm', 3)]);
    // Item 203: the hour before dusk is warm; from 19:00 the stars are out.
    await page.clock.setSystemTime(new Date('2026-10-28T18:30:00'));
    await open();
    await shot(page, 'yatra-trek-dusk', false);
    await page.clock.setSystemTime(new Date('2026-10-28T19:30:00'));
    await open();
    await shot(page, 'yatra-trek-night-camp', false);
    // A fourth star after camp joins the leg: four stars, joined, the name written in.
    await seed([fact('train', 1), fact('mind', 2), fact('calm', 3), fact('train', 4)]);
    await open();
    await page.waitForTimeout(1500);
    await shot(page, 'yatra-trek-constellation', false);
  });

  // Spec 35: Calm setup for each way, the Other sheet, the sound row with Your sound, a running quiet sit, the dim
  // screen and done.
  test('yatra: calm setup, other lengths, sounds, quiet sit, dim, done', async ({ page }) => {
    await page.clock.install({ time: NOON });
    await page.goto('/#yatra/calm');
    await expect(page.getByRole('heading', { name: 'Calm', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '20 min', exact: true }).click();
    await expect(page.locator('.calm-start')).toHaveText('Start 20 minutes');
    await shot(page, 'calm-setup-paced', false);
    await page.getByRole('button', { name: 'Scan', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Scan', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await shot(page, 'calm-setup-scan', false);
    await page.getByRole('button', { name: 'Quiet', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Quiet', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await shot(page, 'calm-setup-quiet', false);
    // The sound row slides: its start, middle and end show all nine recorded sounds.
    const row = page.locator('.calm-sounds');
    for (const [name, at] of [['calm-sounds-1', 0], ['calm-sounds-2', 0.5], ['calm-sounds-3', 1]] as const) {
      await row.evaluate((node, part) => { node.scrollLeft = (node.scrollWidth - node.clientWidth) * part; }, at);
      await page.waitForTimeout(150);
      await shot(page, name, false);
    }
    // For review only: the whole row wrapped, so every chip is in one picture (the app keeps one sliding row).
    await row.evaluate(node => { node.style.flexWrap = 'wrap'; (document.querySelector('.calm-start-bar') as HTMLElement).style.visibility = 'hidden'; });
    await row.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await row.screenshot({ path: `${out}/${theme}/calm-sounds-all.png` });
    await row.evaluate(node => { node.style.flexWrap = ''; (document.querySelector('.calm-start-bar') as HTMLElement).style.visibility = ''; });
    await row.evaluate(node => { node.scrollLeft = 0; });
    await page.locator('.calm-other').click();
    await page.getByRole('dialog', { name: 'Other lengths' }).getByLabel(/^Custom/).fill('25');
    await shot(page, 'calm-other-sheet', false);
    await page.getByRole('dialog', { name: 'Other lengths' }).getByRole('button', { name: 'Use 25 min' }).click();
    const samples = 44_100 * 3, header = Buffer.alloc(44), data = Buffer.alloc(samples * 2);
    header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8); header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(44_100, 24);
    header.writeUInt32LE(88_200, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
    await page.getByLabel('Add your sound').setInputFiles({ name: 'Morning raga.mp3', mimeType: 'audio/wav', buffer: Buffer.concat([header, data]) });
    await expect(page.getByRole('button', { name: 'Morning raga', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await shot(page, 'calm-sound-row', false);
    await page.locator('.calm-settings summary').click();
    await page.locator('.calm-settings').scrollIntoViewIfNeeded();
    await shot(page, 'calm-settings-open', false);
    await page.locator('.calm-settings summary').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole('button', { name: 'River', exact: true }).click();
    await page.locator('.calm-start').click();
    await page.clock.runFor(4_000);
    await shot(page, 'calm-running-quiet', false);
    await page.clock.runFor(20_000);
    await expect(page.locator('.calm-dim')).toBeVisible();
    await shot(page, 'calm-dim', false);
    await page.locator('.calm-dim').click();
    await page.clock.fastForward(25 * 60_000);
    await expect(page.locator('.calm-phase')).toHaveText('25 quiet minutes, together.');
    await shot(page, 'calm-done', false);
  });

  // Item 214: the focus card with Pause, paused, and after Stop for now then Start again (carries on from 10:00).
  test('plan: focus card running, paused, restarted', async ({ page }) => {
    await page.clock.install({ time: NOON });
    await page.goto('/#plan');
    await page.getByLabel('Add a task').fill('Write the report');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    const row = page.getByRole('region', { name: 'Today', exact: true }).locator('.mor-row').filter({ hasText: 'Write the report' });
    const focus = page.getByRole('region', { name: 'Focus' });
    await row.getByRole('button', { name: 'Start' }).click();
    await page.clock.fastForward(4 * 60_000);
    await shot(page, 'focus-running', false);
    await focus.getByRole('button', { name: 'Pause' }).click();
    await expect(focus).toContainText('Paused');
    await shot(page, 'focus-paused', false);
    await focus.getByRole('button', { name: 'Resume' }).click();
    await page.clock.fastForward(6 * 60_000);
    await focus.getByRole('button', { name: 'Stop for now' }).click();
    await row.getByRole('button', { name: 'Start' }).click();
    await expect(focus.locator('.mor-clock')).toHaveText(/^10:0\d$/);
    await shot(page, 'focus-restarted', false);
  });

  // Spec 36: the focus card earning XP, paused by the guard, asking "Still working?", and with the focus check off.
  test('plan: effort pays focus card', async ({ page }) => {
    await page.clock.install({ time: NOON });
    await page.goto('/#plan');
    const guard = (look: Record<string, unknown>) => page.evaluate(value => sessionStorage.setItem('nandi.e2eGuard', JSON.stringify(value)), look);
    const look = () => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    const focus = page.getByRole('region', { name: 'Focus' });
    const begin = async (title: string) => {
      await page.getByLabel('Add a task').fill(title);
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('region', { name: 'Today', exact: true }).locator('.mor-row').filter({ hasText: title }).getByRole('button', { name: 'Start' }).click();
      await expect(focus.locator('.mor-earned, .mor-guard-off')).toBeVisible();
    };
    await guard({ usageAllowed: true });
    await begin('Revise physics');
    await page.clock.fastForward(52 * 60_000);
    await look();
    await expect(focus.locator('.mor-earned')).toHaveText('+36 XP so far');
    await shot(page, 'effort-earning', false);
    await page.clock.fastForward(9 * 60_000);
    await expect(focus.getByRole('alert')).toBeVisible();
    await shot(page, 'effort-still-working', false);
    await focus.getByRole('button', { name: "I'm still working" }).click();
    const startedAt = await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      const rows = await new Promise<{ startedAt: number; endedAt?: number }[]>(resolve => { const request = database.transaction('focus').objectStore('focus').getAll(); request.onsuccess = () => resolve(request.result); });
      database.close();
      return rows.find(row => row.endedAt == null)!.startedAt;
    });
    await guard({ usageAllowed: true, pausedAt: startedAt + 70 * 60_000, pausedApp: 'com.instagram.android' });
    await page.clock.fastForward(12 * 60_000);
    await look();
    await expect(focus).toContainText('Paused: you opened Instagram');
    await shot(page, 'effort-paused-by-guard', false);
    await focus.getByRole('button', { name: 'Done' }).click();
    await guard({ usageAllowed: false });
    await begin('Tidy the room');
    await page.clock.fastForward(10 * 60_000);
    await look();
    await expect(focus.locator('.mor-guard-off')).toBeVisible();
    await shot(page, 'effort-check-off', false);
  });

  test('night deck', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-26T23:30:00'));
    await page.goto('/?e2e#night');
    await expect(page.getByRole('region', { name: 'Now deck' })).toBeVisible();
    await shot(page, 'night-deck');
  });

  test('pause card', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-04T12:00:00') });
    await page.goto('/?e2e#plan');
    await expect(page.getByRole('button', { name: /^Pause card/ })).toContainText('Off');
    await shot(page, 'p39-0-plan-row-off');
    await page.getByRole('button', { name: /^Pause card/ }).click();
    await page.getByLabel('Instagram').check();
    await page.getByLabel('YouTube').check();
    await shot(page, 'p39-1-apps');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'do 10 squats' }).click();
    await shot(page, 'p39-2-line');
    await page.getByRole('button', { name: 'Next' }).click();
    await shot(page, 'p39-3-when');
    await page.getByRole('button', { name: 'Next' }).click();
    await shot(page, 'p39-4-see-it-once');
    await page.getByRole('button', { name: 'Turn it on' }).click();
    await shot(page, 'p39-5-manage-on');
    await page.goto('/?e2e#plan');
    await shot(page, 'p39-6-plan-row-on');
    // The phone reports Instagram at the front.
    await page.evaluate(() => { sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'open' })); window.dispatchEvent(new Event('nandi:night-pause')); });
    const card = page.getByRole('dialog', { name: 'Pause card' });
    await expect(card).toBeVisible();
    await shot(page, 'p39-7-card', false);
    await card.getByRole('button', { name: /^Start the 2 minutes: / }).click();
    await page.clock.fastForward(37_000);
    await shot(page, 'p39-8-act-timer', false);
    await card.getByRole('button', { name: 'I did it' }).click();
    await expect(card.getByRole('heading')).toHaveText(/^Done: /);
    await shot(page, 'p39-9-done', false);
  });

  // Spec 45c: the five areas from Home's friends, at 360x800 (baseline and after).
  test('45c areas', async ({ page }) => {
    test.setTimeout(180_000);
    await page.clock.install({ time: new Date('2026-11-04T10:00:00') });
    await page.goto('/#plan');
    await page.getByLabel('Add a task').fill('Call the bank');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('.mor-row, .task-row').first()).toBeVisible();
    for (const [route, name] of [['plan', '45c-a1-plan'], ['read', '45c-a2-read'], ['read/drop', '45c-a3-sitting'], ['yatra/train', '45c-a4-train'], ['yatra/mind', '45c-a5-play'], ['yatra/calm', '45c-a6-calm'], ['you', '45c-a7-you']] as const) {
      await page.goto(`/#${route}`);
      await page.waitForTimeout(900);
      await shot(page, name, false);
    }
    // A chapter's first sitting, page by page, then its end card.
    await page.goto('/?e2e#read/book/richest-man-in-babylon');
    await page.getByRole('button', { name: 'Start · Chapter 1' }).click();
    await walkIdea(page, 'richest-man-in-babylon', async screen => { await page.waitForTimeout(400); await shot(page, `45c-s${screen}-sitting-page`, false); });
    await expect(page.locator('.idea-end')).toBeVisible();
    await shot(page, '45c-s9-sitting-end', false);
    // Each area at 200% text.
    for (const [route, name] of [['plan', '45c-t1-plan-200'], ['read', '45c-t2-read-200'], ['yatra/train', '45c-t3-train-200'], ['yatra/mind', '45c-t4-play-200'], ['yatra/calm', '45c-t5-calm-200']] as const) {
      await page.goto(`/#${route}`);
      await textAt200(page);
      await page.waitForTimeout(400);
      await shot(page, name, false);
    }
  });

  // Spec 45c: a real level rise opens the level page (Motion off in this set, so the friends stand still).
  test('45c level page', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-03T12:00:00') });
    await page.goto('/#plan');
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction('ledger', 'readwrite'); transaction.objectStore('ledger').put({ id: 'train-session:l2', mode: 'train', kind: 'session', refId: 'l2', dayKey: '2026-11-03', inputs: { xp: 95 }, updatedAt: Date.now(), deleted: 0, deviceId: 'shots' }); transaction.oncomplete = () => resolve(); });
      database.close();
    });
    await page.reload();
    await page.getByLabel('Add a task').fill('Write first note');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: /^Done/ }).first().click();
    const level = page.getByRole('dialog', { name: 'Level 2' });
    await expect(level).toBeVisible();
    await shot(page, '45c-l1-level-page', false);
    await textAt200(page);
    await expect(level).toBeVisible();
    await shot(page, '45c-l2-level-page-200', false);
    await level.getByRole('button', { name: 'Continue' }).click();
    await page.goto('/#you');
    await page.reload(); // drop the 200% style
    await page.waitForTimeout(600);
    await shot(page, '45c-l3-you-progress', false);
  });

  // Spec 45c decision 8: the Pause slip, its act view, and the slip at 200% text.
  test('45c pause slip', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-04T12:00:00') });
    await page.goto('/?e2e#plan/pause');
    await page.getByLabel('Instagram').check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'drink a glass of water' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Turn it on' }).click();
    await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
    const card = page.getByRole('dialog', { name: 'Pause card' });
    const opens = async () => {
      await page.evaluate(() => { sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'limit' })); window.dispatchEvent(new Event('nandi:night-pause')); });
      await expect(card).toBeVisible();
    };
    await opens();
    await shot(page, '45c-p1-slip', false);
    await card.getByRole('button', { name: /^Start the 2 minutes: / }).click();
    await expect(card.getByRole('button', { name: 'I did it' })).toBeVisible();
    await shot(page, '45c-p2-act', false);
    await card.getByRole('button', { name: 'Not now' }).click();
    await expect(card).toHaveCount(0);
    await opens();
    await card.getByRole('button', { name: 'I did it' }).click();
    await expect(card.getByRole('heading')).toHaveText('Done: Drink a glass of water.');
    await shot(page, '45c-p3-done', false);
    await card.getByRole('button', { name: 'Back to my day' }).click();
    await expect(card).toHaveCount(0);
    await opens();
    await textAt200(page);
    await expect(card).toBeVisible();
    await shot(page, '45c-p4-slip-200-text', false);
    await card.getByRole('button', { name: 'Not now' }).scrollIntoViewIfNeeded();
    await shot(page, '45c-p5-slip-200-text-end', false);
  });

  test('pause card 39b', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-04T12:00:00') });
    await page.goto('/?e2e#plan/pause');
    await page.getByLabel('Instagram').check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'drink a glass of water' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await shot(page, 'p39b-0-when-default-10', false);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Turn it on' }).click();
    await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
    const card = page.getByRole('dialog', { name: 'Pause card' });
    const opens = async () => {
      await page.evaluate(() => { sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'limit' })); window.dispatchEvent(new Event('nandi:night-pause')); });
      await expect(card).toBeVisible();
    };
    await opens();
    await shot(page, 'p39b-1-card-three-ways', false);
    await card.getByRole('button', { name: /^Start the 2 minutes: / }).click();
    await expect(card.getByRole('button', { name: 'I did it' })).toBeVisible();
    await shot(page, 'p39b-2-act-i-did-it-at-start', false);
    await card.getByRole('button', { name: 'Not now' }).click();
    await expect(card).toHaveCount(0);
    // Spec 52 D: the in-app way names Home's next move; with nothing else on, the chapter Continue offers.
    await opens();
    await card.getByRole('button', { name: /^Read on: / }).click();
    await expect(page).toHaveURL(/#read\/chapter\/psychology\/psychology-ch1$/);
    await shot(page, 'p39b-3-in-nandi-read-drop', false);
    // With a task planned for today: its focus.
    await page.goto('/?e2e#plan/focus');
    await page.getByLabel('Add a task').fill('Email Riya the slides');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.goto('/?e2e#you');
    await opens();
    await card.getByRole('button', { name: 'Start: Email Riya the slides' }).click();
    await expect(page).toHaveURL(/#plan$/);
    await shot(page, 'p39b-4-in-nandi-task-focus', false);
    // A card that was on "every open": moved once to after 10 min a day, and Plan says so.
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction('settings', 'readwrite'); const store = transaction.objectStore('settings'); store.put({ key: 'night.pause.dayMode', value: 'open', updatedAt: 1, deleted: 0, deviceId: 'e2e' }); store.delete('pause.modeNote'); transaction.oncomplete = () => resolve(); });
      database.close();
    });
    await page.goto('/?e2e#plan/pause');
    await page.reload();
    await expect(page.locator('.pause-switched')).toBeVisible();
    await shot(page, 'p39b-5-plan-switched-to-10', false);
  });

  test('opens log', async ({ page }) => {
    const noon = new Date('2026-11-04T12:00:00');
    await page.clock.install({ time: noon });
    await page.goto('/?e2e#plan/pause');
    await page.getByLabel('Instagram').check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('group', { name: 'Quick picks' }).getByRole('button', { name: 'do 10 squats' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Turn it on' }).click();
    await expect(page.getByRole('heading', { name: 'On', exact: true })).toBeVisible();
    // No usage log yet (Usage access not given).
    await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ usageAllowed: false })));
    await page.reload();
    await expect(page.locator('.pause-opens')).toContainText('Usage access');
    await page.locator('.pause-opens').scrollIntoViewIfNeeded();
    await shot(page, 'p39-10-opens-empty', false);
    // The phone's usage log: `days` days before the card (the screen on at 20:00 the day before each), then a morning.
    const usage = (days: number) => {
      const events: { type: string; at: number; pkg?: string; cls?: string }[] = [];
      const open = (start: number, minutes: number) => events.push({ type: 'fg', at: start, pkg: 'com.instagram.android', cls: 'Main' }, { type: 'bg', at: start + minutes * 60_000, pkg: 'com.instagram.android', cls: 'Main' });
      for (let back = days; back >= 0; back -= 1) {
        const day = new Date(noon); day.setDate(day.getDate() - back);
        const before = new Date(day); before.setDate(before.getDate() - 1);
        events.push({ type: 'on', at: before.setHours(20, 0, 0, 0) });
        for (const hour of back ? [8, 10, 13, 15, 18, 21, 22] : [9, 11]) open(new Date(day).setHours(hour, 0, 0, 0), back ? 12 : 6);
      }
      return events;
    };
    await page.evaluate(async events => { await new Promise<void>(resolve => { indexedDB.open('nandi').onsuccess = event => { const database = (event.target as IDBOpenDBRequest).result; const transaction = database.transaction('settings', 'readwrite'); transaction.objectStore('settings').delete('pause.opens'); transaction.oncomplete = () => { database.close(); resolve(); }; }; }); sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ usage: events })); }, usage(2));
    await page.reload();
    await expect(page.locator('.pause-opens')).toContainText('Not enough days yet');
    await page.locator('.pause-opens').scrollIntoViewIfNeeded();
    await shot(page, 'p39-11-opens-few-days', false);
    await page.evaluate(async events => { await new Promise<void>(resolve => { indexedDB.open('nandi').onsuccess = event => { const database = (event.target as IDBOpenDBRequest).result; const transaction = database.transaction('settings', 'readwrite'); transaction.objectStore('settings').delete('pause.opens'); transaction.oncomplete = () => { database.close(); resolve(); }; }; }); sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ usage: events })); }, usage(7));
    await page.reload();
    await expect(page.locator('.pause-opens')).toContainText('7 opens · 1 h 24 min');
    await page.locator('.pause-opens').scrollIntoViewIfNeeded();
    await shot(page, 'p39-12-opens-full', false);
    // Day 11 of the card: the week before, the card's last 7 days and some "Open anyway" minutes, as Jenil sees it in 2 weeks.
    const stored = (busy: number, minutes: number, anyway = 0) => ({ apps: { 'com.instagram.android': { opens: busy, ms: minutes * 60_000 } }, anyway: { count: anyway, ms: anyway * 7 * 60_000 }, whole: true, covered: true });
    const days: Record<string, unknown> = {};
    for (let back = 1; back <= 17; back += 1) {
      const key = new Date(Date.UTC(2026, 10, 4 - back)).toISOString().slice(0, 10);
      days[key] = back > 10 ? stored(14 + (back % 3), 105 + back) : stored(8 + (back % 2), 50 + back, back % 3 === 0 ? 1 : 0);
    }
    await page.evaluate(async value => { await new Promise<void>(resolve => { indexedDB.open('nandi').onsuccess = event => { const database = (event.target as IDBOpenDBRequest).result; const transaction = database.transaction('settings', 'readwrite'); transaction.objectStore('settings').put({ key: 'pause.opens', value, updatedAt: 1, deleted: 0, deviceId: 'e2e' }); transaction.oncomplete = () => { database.close(); resolve(); }; }; }); }, { since: '2026-10-25', days });
    await page.reload();
    await expect(page.locator('.pause-opens')).toContainText('Last 7 days · a day');
    await expect(page.locator('.pause-opens')).toContainText('7 min on average · 2 times');
    await page.locator('.pause-opens').scrollIntoViewIfNeeded();
    await shot(page, 'p39-13-opens-compare', false);
  });

  test('a11y batch 1', async ({ page }) => {
    /** Every ledger write fails, as a full or broken store would (until the next page load). */
    const breakLedger = () => page.evaluate(() => {
      const store = IDBObjectStore.prototype as unknown as Record<string, unknown>;
      for (const name of ['add', 'put'] as const) {
        const original = store[name] as (this: IDBObjectStore, ...args: unknown[]) => IDBRequest;
        store[name] = function (this: IDBObjectStore, ...args: unknown[]) { if (this.name === 'ledger') throw new DOMException('Test', 'QuotaExceededError'); return original.apply(this, args); };
      }
    });
    // C12: the light shop themes' muted text, before (the old tone forced back) and after, on the same Plan rows.
    if (theme === 'light') {
      await planWithTasks(page);
      for (const [name, old] of [['linen', '#75634f'], ['lagoon', '#536f6b']] as const) {
        await page.evaluate(async value => {
          const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
          await new Promise<void>(resolve => { const transaction = database.transaction('settings', 'readwrite'); transaction.objectStore('settings').put({ key: 'economy.theme', value: `theme:${value}`, updatedAt: 1, deleted: 0, deviceId: 'shots' }); transaction.oncomplete = () => { database.close(); resolve(); }; });
        }, name);
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-economy-theme', name);
        const rows = page.locator('.mor-list').first();
        await page.addStyleTag({ content: `:root { --ink-3: ${old} !important; }` }).then(tag => tag.evaluate(node => (node as Element).setAttribute('id', 'old-ink')));
        await rows.screenshot({ path: `${out}/${theme}/a11y-c12-${name}-before.png` });
        await page.evaluate(() => document.getElementById('old-ink')?.remove());
        await rows.screenshot({ path: `${out}/${theme}/a11y-c12-${name}-after.png` });
      }
      await page.evaluate(async () => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
        await new Promise<void>(resolve => { const transaction = database.transaction('settings', 'readwrite'); transaction.objectStore('settings').delete('economy.theme'); transaction.oncomplete = () => { database.close(); resolve(); }; });
      });
    } else {
      await page.clock.install({ time: NOON });
    }
    // C8: a tap to a new screen moves focus to its heading with no ring; the keyboard way shows the ring.
    await page.goto('/#plan');
    await page.getByRole('button', { name: /^Pause card/ }).click();
    await expect(page.getByRole('heading', { name: 'Pause card', level: 1 })).toBeFocused();
    await shot(page, 'a11y-c8-tap-no-ring', false);
    await page.goto('/#plan');
    await page.getByRole('button', { name: /^Pause card/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Pause card', level: 1 })).toBeFocused();
    await shot(page, 'a11y-c8-keyboard-ring', false);
    // C1: a Calm sit that could not be saved, and C11-wrap: every length on screen.
    await page.goto('/#yatra/calm');
    await expect(page.getByRole('group', { name: 'How long' })).toBeVisible();
    await expect(page.locator('.calm-start')).toBeVisible();
    await shot(page, 'a11y-calm-lengths-wrap', false);
    await page.getByRole('button', { name: 'Quiet', exact: true }).click();
    await page.locator('.calm-start').click();
    await page.clock.fastForward(61_000);
    await breakLedger();
    if (await page.locator('.calm-dim').count()) await page.locator('.calm-dim').click();
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.getByText('Your sit could not be saved.')).toBeVisible();
    await shot(page, 'a11y-c1-calm-unsaved', false);
    // C3: a chapter that could not be saved.
    await page.goto('/?e2e#read');
    await seedTaughtTopics(page, ['psychology']);
    await page.goto('/?e2e#read/chapter/psychology/psychology-ch1');
    await expect(page.locator('.chiku-skip')).toBeVisible();
    await breakLedger();
    await page.locator('.chiku-skip').click();
    await expect(page.getByText('This chapter could not be saved on this phone.')).toBeVisible();
    await shot(page, 'a11y-c3-chapter-unsaved', false);
  });

  test('hunt fixes', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-30T12:00:00'));
    // A workout stopped with no set logged counts nowhere: both Train cards agree.
    await page.goto('/?e2e#yatra/train');
    await page.getByRole('button', { name: 'Start easy, skip the test' }).click();
    await page.getByRole('button', { name: 'Finish session' }).click();
    await expect(page).toHaveURL(/train\/finish$/);
    await page.goto('/?e2e#yatra/train');
    await expect(page.getByText('A fresh week. Start with one session.')).toBeVisible();
    // Right after a finish the old "Session in progress" card shows for a moment (noted in the hunt list).
    await expect(page.getByText('Session in progress')).toHaveCount(0);
    await shot(page, 'hunt-1-train-zero-sets');
    // Backup: this phone's own last backup, and which backup a restore brought back.
    await page.goto('/?e2e#you/backup');
    await shot(page, 'hunt-2-backup-none', false);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup' }).click();
    const path = await (await download).path();
    await page.evaluate(() => new Promise(resolve => { const request = indexedDB.deleteDatabase('nandi'); request.onsuccess = request.onerror = request.onblocked = () => resolve(null); }));
    await page.goto('/?e2e#you/backup');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose restore file' }).click();
    await (await chooser).setFiles(path);
    await page.getByLabel('Restore preview').getByRole('button', { name: 'Confirm restore' }).click();
    await expect(page.getByRole('main').getByRole('status')).toContainText('Restored · backup from');
    await shot(page, 'hunt-3-restored');
  });

  test('small fixes', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-30T12:00:00'));
    // The focus screen with nothing due.
    await page.goto('/?e2e#plan/focus');
    await expect(page.getByRole('heading', { name: 'Nothing due right now.' })).toBeVisible();
    await shot(page, 'fix-1-focus-nothing-due');
    // Welcome, Get fit: straight into the easy first workout.
    await page.goto('/?e2e&welcome');
    const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
    await welcome.getByLabel("I'm 18 or older.").check();
    await welcome.getByRole('button', { name: "Let's start" }).click();
    await welcome.getByRole('button', { name: 'Get fit' }).click();
    await welcome.getByRole('button', { name: 'Continue' }).click();
    await welcome.getByRole('button', { name: 'Start an easy first workout' }).click();
    await expect(page).toHaveURL(/#yatra\/train\/workout$/);
    await expect(page.getByText('Current exercise')).toBeVisible();
    await shot(page, 'fix-2-get-fit-workout', false);
  });

  test('43 skill practice', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
    const screen = page.getByRole('region', { name: 'Practice' });
    const open = async (query: string) => { await page.goto(`/?e2e${query}#read/skill-demo`); await expect(screen).toBeVisible(); };
    await open('');
    await shot(page, 'p1-worked', false);
    await screen.getByRole('button', { name: 'Change one part' }).click();
    await screen.getByRole('radio', { name: 'I was not well on Monday and Tuesday.' }).click();
    await screen.getByRole('button', { name: 'Check' }).click();
    await shot(page, 'p2-change-near-miss', false);
    await screen.getByRole('button', { name: 'Try a fresh one' }).click();
    await screen.getByRole('radio', { name: 'Sorry to bother you.' }).click();
    await shot(page, 'p3-fresh-choice', false);
    await screen.getByRole('button', { name: 'Check' }).click();
    await shot(page, 'p4-feedback-wrong', false);
    await screen.getByRole('button', { name: 'Revise my answer' }).click();
    await screen.getByRole('radio', { name: 'Could I borrow the lab key before 3 pm?' }).click();
    await screen.getByRole('button', { name: 'Check' }).click();
    await screen.getByLabel('The ask is in the first line.').check();
    await shot(page, 'p5-feedback-right');
    await screen.getByRole('button', { name: 'Save to My work' }).click();
    await expect(screen.getByRole('heading', { name: 'Saved.' })).toBeVisible();
    await shot(page, 'p6-saved', false);
    await open('&lesson=say-2');
    await screen.getByRole('button', { name: 'Change one part' }).click();
    await screen.getByRole('button', { name: 'Walk out of the canteen.' }).click();
    await shot(page, 'p7-order-half-built', false);
    await open('&lesson=say-3');
    await screen.getByRole('button', { name: 'Change one part' }).click();
    await screen.getByLabel('Your answer').fill('12');
    await screen.getByRole('button', { name: 'Check' }).click();
    await shot(page, 'p8-phrase-near-miss', false);
    await open('&variant=1');
    await screen.getByRole('button', { name: 'Change one part' }).click();
    await screen.getByRole('radio', { name: 'Could you send me Tuesday\'s notes?' }).click();
    await screen.getByRole('button', { name: 'Check' }).click();
    await screen.getByRole('button', { name: 'Try a fresh one' }).click();
    await screen.getByLabel('In your own words').fill('Could you water my plants on Saturday and Sunday? I am away till Monday.');
    await shot(page, 'p9-own-words', false);
    await screen.getByRole('button', { name: 'Done writing' }).click();
    await shot(page, 'p10-self-check');
    await open('');
    await screen.getByRole('button', { name: 'Change one part' }).click();
    await textAt200(page);
    await shot(page, 'p11-change-200pct');
  });

  test('46a minutes record', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-20T12:00:00') });
    const phone = (allowed: boolean) => page.evaluate(ok => {
      const day = new Date(2026, 10, 19).getTime();
      sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ usageAllowed: ok, phoneLog: { logStart: day - 86_400_000, events: [{ type: 'off', at: day - 3_600_000 }], installed: [], cross: [], bootCount: 1, bootWallMs: 1 } }));
    }, allowed);
    await page.goto('/?e2e#you');
    await expect(page.getByText(/XP in all$/)).toBeVisible();
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction('settings', 'readwrite'); transaction.objectStore('settings').put({ key: 'night.pause.apps', value: ['com.instagram.android'], updatedAt: 1, deleted: 0, deviceId: 'shots' }); transaction.oncomplete = () => resolve(); });
      database.close();
    });
    await phone(true);
    await page.goto('/?e2e#you/settings');
    await page.reload();
    const record = page.getByRole('region', { name: 'Daily minutes record' });
    await record.scrollIntoViewIfNeeded();
    await shot(page, 'm1-settings-granted', false);
    await record.getByText("What's kept").click();
    await record.scrollIntoViewIfNeeded();
    await shot(page, 'm2-whats-kept', false);
    await record.getByRole('button', { name: 'Stop and delete the record' }).click();
    await record.scrollIntoViewIfNeeded();
    await shot(page, 'm3-confirm', false);
    await record.getByRole('button', { name: 'Delete it' }).click();
    await expect(record.getByRole('status')).toBeVisible();
    // What's kept is still open from m2, so the off state shows its words.
    await expect(record.locator('details')).toHaveAttribute('open', '');
    await record.scrollIntoViewIfNeeded();
    await shot(page, 'm4-deleted-off', false);
    await record.getByRole('button', { name: 'Keep a record again' }).click();
    await phone(false);
    await page.reload();
    await record.scrollIntoViewIfNeeded();
    await expect(record).toContainText('paused');
    await shot(page, 'm5-settings-revoked', false);
    await phone(true);
    await page.reload();
    await textAt200(page);
    await record.getByText("What's kept").click();
    await record.scrollIntoViewIfNeeded();
    await shot(page, 'm6-200pct', false);
  });

  test('46b phone audit', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-20T12:00:00') });
    await page.goto('/?e2e#you');
    await expect(page.getByText(/XP in all$/)).toBeVisible();
    // 30 finished days: Instagram 12 min and YouTube 5 a day; 18 Nov unknown (the log went quiet); Usage access off 14-15 Nov.
    await page.evaluate(async () => {
      const ig = 'com.instagram.android';
      const catalog = ['com.google.android.youtube', 'com.snapchat.android', 'com.android.chrome', 'org.mozilla.firefox', 'com.microsoft.emmx', 'com.brave.browser',
        'com.sec.android.app.sbrowser', 'com.opera.browser', 'com.opera.mini.native', 'in.mohalla.video', 'com.eterno.shortvideos', 'in.mohalla.sharechat'];
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => {
        const transaction = database.transaction(['settings', 'phoneUsageMinutes'], 'readwrite');
        transaction.objectStore('settings').put({ key: 'night.pause.apps', value: [ig], updatedAt: 1, deleted: 0, deviceId: 'shots' });
        for (let back = 30; back >= 1; back -= 1) {
          const start = new Date(2026, 10, 20 - back), end = new Date(2026, 10, 21 - back);
          const dayKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
          for (const packageName of [ig, ...catalog]) {
            const reason = dayKey === '2026-11-14' || dayKey === '2026-11-15' ? 'no_access' : dayKey === '2026-11-18' && packageName === ig ? 'event_gap' : undefined;
            transaction.objectStore('phoneUsageMinutes').put({ id: `${dayKey}|${packageName}`, dayKey, packageName, group: packageName === ig ? 'picked' : 'substitute',
              foregroundMs: reason ? null : packageName === ig ? 12 * 60_000 : packageName === catalog[0] ? 5 * 60_000 : 0, ...(reason ? { reason } : {}),
              source: 'usage-events', fromMs: start.getTime(), toMs: end.getTime(), offsetStartMin: 330, offsetEndMin: 330, catalogId: 'scroll-2026-11-01',
              setId: `scroll-2026-11-01|${ig}`, installed: packageName === ig, crossCheckMs: null, measuredAt: end.getTime(), updatedAt: end.getTime(), deleted: 0, deviceId: 'shots' });
          }
        }
        transaction.oncomplete = () => resolve();
      });
      database.close();
    });
    // Dexie's live queries do not see a raw IndexedDB write; the reload makes the app read the seeded days and apps.
    await page.reload();
    await page.goto('/?e2e#you/owner');
    await page.getByLabel('PIN').fill('2468');
    await page.getByRole('button', { name: 'Save PIN' }).click();
    await page.getByRole('button', { name: 'Phone minutes audit' }).click();
    const audit = page.getByRole('region', { name: 'Phone minutes audit' });
    await expect(audit.locator('.phone-audit-days > li')).toHaveCount(30);
    await shot(page, 'a1-top', false);
    const gap = audit.locator('.phone-audit-days > li').filter({ hasText: '2026-11-18' });
    await gap.locator(':scope > details > summary').click();
    await gap.scrollIntoViewIfNeeded();
    await shot(page, 'a2-unknown-day-open', false);
    await audit.locator('.phone-audit-days > li').filter({ hasText: '2026-11-15' }).scrollIntoViewIfNeeded();
    await shot(page, 'a3-access-off-days', false);
    await audit.getByRole('button', { name: 'Export 30-day audit CSV' }).click();
    await audit.getByRole('group', { name: 'Before the file is made' }).scrollIntoViewIfNeeded();
    await shot(page, 'a4-export-warning', false);
    await audit.getByRole('button', { name: 'Don’t make it' }).click();
    await audit.getByRole('button', { name: 'Mark the audit passed' }).click();
    await audit.getByRole('group', { name: 'Before marking the audit passed' }).scrollIntoViewIfNeeded();
    await shot(page, 'a5-pass-confirm', false);
    await audit.getByRole('button', { name: 'Mark passed' }).click();
    await expect(audit).toContainText('Audit passed on');
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, 'a6-passed', false);
    await textAt200(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, 'a7-200pct', false);
  });

  test('51 htwf games', async ({ page }) => {
    test.setTimeout(240_000);
    await page.clock.setFixedTime(new Date('2026-11-03T12:00:00'));
    const ideas = ['genuine-interest', 'smile', 'names', 'listening', 'others-interests', 'sincere-importance', 'arguments', 'respect-opinions', 'admit-error', 'friendly-start', 'yes-yes', 'let-them-talk'];
    for (const [index, idea] of ideas.entries()) {
      await page.goto(`/?e2e&concept=htwf-${idea}#learn/chiku-demo`);
      const stage = page.getByRole('region', { name: 'Teach Chiku' });
      await expect(stage).toBeVisible({ timeout: 15_000 });
      const tag = `g${String(index + 1).padStart(2, '0')}-${idea}`;
      await shot(page, `${tag}-1-cards`, false);
      // The template's old m2 card ("Make them agree at once") is the one each idea now writes for itself.
      const cards = page.getByRole('group', { name: 'Your cards' }).getByRole('button');
      await cards.nth(2).click();
      for (let i = 0; i < 5 && await stage.getAttribute('data-beat') !== 'done'; i++) await page.locator('.chiku-stage').click();
      await expect(stage).toHaveAttribute('data-beat', 'done');
      await shot(page, `${tag}-2-end`, false);
    }
  });

  test('566 side quests on plan', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-05T11:00:00'));
    await page.goto('/?e2e#plan');
    const quests = page.getByRole('region', { name: 'Side quests' });
    await quests.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await shot(page, 'p566-01-plan-side-quests', false);
    await page.locator('details.plan-more > summary').click();
    await page.locator('details.plan-more > summary').scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await shot(page, 'p566-02-more-open', false);
  });

  test('park it', async ({ page }) => {
    // A moving clock, so the two lines are parked a moment apart and keep their order.
    await page.clock.install({ time: new Date('2026-10-26T22:30:00') });
    await page.goto('/?e2e#night');
    await page.getByRole('button', { name: 'Go to card 4: Today, in words' }).click();
    const words = page.getByRole('article', { name: 'Today, in words card' });
    await shot(page, 'park-1-empty');
    for (const line of ['Email Riya the slides', 'Pay the rent']) {
      await words.getByRole('textbox').fill(line);
      await words.getByRole('button', { name: 'Park', exact: true }).click();
      await expect(words.getByRole('list', { name: 'Parked for tomorrow' })).toContainText(line);
    }
    await shot(page, 'park-2-two-lines');
    await words.getByRole('button', { name: 'That’s all' }).click();
    await shot(page, 'park-3-written');
  });

  test('52 two to start', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-04T12:00:00'));
    const put = (rows: [string, unknown][]) => page.evaluate(async entries => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction('settings', 'readwrite'); for (const [key, value] of entries) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'shots' }); transaction.oncomplete = () => resolve(); });
      database.close();
    }, rows);
    const facts = (rows: { day: string; mode?: string; kind?: string }[]) => page.evaluate(async list => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction('ledger', 'readwrite'); list.forEach((row, i) => transaction.objectStore('ledger').put({ id: `shots52:${i}`, dayKey: row.day, mode: row.mode ?? 'tasks', kind: row.kind ?? 'done', refId: `shots52-${i}`, inputs: { plannedSize: 'M', wasPlanned: true }, updatedAt: new Date(`${row.day}T12:00:00`).getTime() + i, deleted: 0, deviceId: 'shots' })); transaction.oncomplete = () => resolve(); });
      database.close();
    }, rows);
    // Home as an install from before spec 52 sees it (size 'all'): compare with main's p45b home.
    await page.goto('/?e2e#yatra');
    await expect(page.locator('.next-move-go')).toBeVisible();
    await shot(page, 'p52-01-home-existing-install', false);
    // Welcome's pick screen at 0, 1 and 2 picks, at 3-4 things, and at 200% text.
    await page.evaluate(() => indexedDB.deleteDatabase('nandi'));
    await page.goto('/?e2e&welcome');
    await page.reload();
    const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
    await welcome.getByLabel("I'm 18 or older.").check();
    await welcome.getByRole('button', { name: "Let's start" }).click();
    // Reduced motion gives every property a 0.01 ms transition (theme.css), so a shot taken in the click's own frame can
    // catch a step dash still on its old colour: wait two frames before each Welcome shot.
    const settled = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await settled();
    await shot(page, 'p52-02-welcome-0-picks', false);
    await welcome.getByRole('button', { name: 'Learn something', exact: true }).click();
    await settled();
    await shot(page, 'p52-03-welcome-1-pick', false);
    await welcome.getByRole('button', { name: 'Sharpen my mind', exact: true }).click();
    await welcome.getByRole('button', { name: 'Get fit', exact: true }).click();
    await settled();
    await shot(page, 'p52-04-welcome-2-picks-third-refused', false);
    await welcome.getByRole('button', { name: '3-4 things' }).click();
    await welcome.getByRole('button', { name: 'Get fit', exact: true }).click();
    await welcome.getByRole('button', { name: 'Get things done', exact: true }).click();
    await settled();
    await shot(page, 'p52-05-welcome-3-4-things', false);
    await textAt200(page);
    await settled();
    await shot(page, 'p52-06-welcome-200pct', false);
    await page.getByRole('button', { name: 'Continue' }).scrollIntoViewIfNeeded();
    await settled();
    await shot(page, 'p52-06b-welcome-200pct-end', false);
    // Home for learn+mind, train+plan, sleep alone.
    await page.goto('/?e2e#plan');
    await page.reload();
    await expect(page.locator('.plan-screen')).toBeVisible();
    for (const [name, goals] of [['learn-mind', ['learn', 'mind']], ['train-plan', ['train', 'plan']], ['sleep', ['sleep']]] as const) {
      await put([['profile.goals', goals], ['profile.size', 'two'], ['profile.adultConfirmedAt', '2026-10-20T12:00:00.000Z']]);
      await page.goto('/?e2e#yatra');
      await page.reload();
      await expect(page.locator('.next-move-go')).toBeVisible();
      await shot(page, `p52-07-home-${name}`, false);
    }
    // The ten-day offer (learn+mind, ten days of tasks done: Plan is offered).
    await put([['profile.goals', ['learn', 'mind']], ['profile.size', 'two']]);
    await facts(Array.from({ length: 10 }, (_, i) => ({ day: `2026-10-${21 + i}` })));
    await page.reload();
    await expect(page.getByRole('region', { name: 'Add one more thing' })).toBeVisible();
    await shot(page, 'p52-08-ten-day-offer', false);
    // You's row and its screen.
    await page.goto('/?e2e#you');
    await page.getByRole('button', { name: /^What NANDI helps with/ }).scrollIntoViewIfNeeded();
    await shot(page, 'p52-09-you-row', false);
    await page.getByRole('button', { name: /^What NANDI helps with/ }).click();
    await shot(page, 'p52-10-you-helps', false);
    // The pause card with a named move.
    await put([['pause.card.on', true], ['pause.act', 'do 10 squats'], ['night.pause.apps', ['com.instagram.android']], ['night.pause.dayMode', 'open']]);
    await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
    await page.goto('/?e2e#yatra');
    await page.reload();
    await page.evaluate(() => { sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'open' })); window.dispatchEvent(new Event('nandi:night-pause')); });
    await expect(page.getByRole('dialog', { name: 'Pause card' }).getByRole('button', { name: /^Read on: / })).toBeVisible();
    await shot(page, 'p52-11-pause-card-named-move', false);
    // The pause offer after the first finish (a new install on a phone, the card not set up).
    await page.evaluate(() => indexedDB.deleteDatabase('nandi'));
    await page.goto('/?e2e#plan');
    await page.reload();
    await expect(page.locator('.plan-screen')).toBeVisible();
    await put([['profile.goals', ['plan']], ['profile.size', 'two']]);
    await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
    await page.reload();
    await page.getByPlaceholder('Add a task', { exact: true }).fill('Call the bank');
    await page.getByPlaceholder('Add a task', { exact: true }).press('Enter');
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: /^Done/ }).first().click();
    await expect(page.getByRole('dialog', { name: 'Want NANDI to catch you when you open Instagram or YouTube?' })).toBeVisible({ timeout: 6000 });
    await shot(page, 'p52-12-pause-offer-after-first-finish', false);
  });

  // Spec 53: the week's receipt on Home (Sunday evening), its sheet (and at 200% text), You's card, and the cards at
  // full size: a full week, a two-line week, a long-number week, and a full week still open on a Thursday ("so far").
  test('53 receipt', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    });
    await page.clock.setFixedTime(new Date('2026-11-08T18:05:00'));
    await page.goto('/?e2e#yatra');
    await seedRecapWeek(page, '2026-11-05');
    const link = page.getByRole('button', { name: "Your week's receipt is ready" });
    await expect(link).toBeVisible();
    const move = await page.locator('.next-move').boundingBox();
    console.log(`spec 53 shots [${theme}]: next-move card top y=${Math.round(move!.y)}, bottom y=${Math.round(move!.y + move!.height)}; receipt link y=${Math.round((await link.boundingBox())!.y)}`);
    await shot(page, 'p53-01-home-sunday-link', false);
    await link.click();
    const sheet = page.getByRole('dialog', { name: "Your week's receipt" });
    await expect(sheet.getByRole('img')).toBeVisible({ timeout: 20_000 });
    await shot(page, 'p53-03-sheet', false);
    await textAt200(page);
    await shot(page, 'p53-04-sheet-200pct', false);
    await page.goto('/?e2e#you');
    await page.reload();
    const week = page.getByRole('region', { name: 'This week in words' });
    // Wait for You's week card before scrolling to it (dark p53-05 once caught the top of You instead).
    await expect(week.getByRole('button', { name: 'Share my week' })).toBeVisible();
    await week.scrollIntoViewIfNeeded();
    await expect(week).toBeInViewport();
    await shot(page, 'p53-05-you-week', false);
    await page.waitForFunction(() => Boolean(window.__nandiReceiptTest));
    const base = { from: '2026-11-02', to: '2026-11-09', tasks: 0, focusMinutes: 0, longestFocusMinutes: 0, workouts: 0, sideQuests: 0, concepts: 0, nights: 0, chapters: 0, realMs: 0 };
    const full = { ...base, chapters: 2, concepts: 9, workouts: 3, focusMinutes: 250, tasks: 11, nights: 4, sideQuests: 1, longestFocusMinutes: 52, realMs: 400 * 60_000 };
    const cards: [string, Record<string, unknown>, number | undefined][] = [
      ['p53-card-1-full-week', full, undefined],
      ['p53-card-2-two-lines', { ...base, tasks: 2, workouts: 1, realMs: 20 * 60_000 }, undefined],
      ['p53-card-3-long-numbers', { ...base, chapters: 14, concepts: 128, workouts: 12, focusMinutes: 750, tasks: 312, nights: 7, longestFocusMinutes: 185, realMs: 9_999 * 60_000 }, undefined],
      ['p53-card-4-full-week-so-far-thursday', full, new Date('2026-11-05T12:00:00').getTime()],
    ];
    for (const [name, data, now] of cards) {
      const image = await page.evaluate(([week, at]) => window.__nandiReceiptTest!.png(week, at), [data, now] as const);
      expect([image.width, image.height]).toEqual([1080, 1920]);
      writeFileSync(`${out}/${theme}/${name}.png`, Buffer.from(image.dataUrl.split(',')[1]!, 'base64'));
    }
  });

  // Spec 54: the jar on Home (no plan, a plan, the payout), the plan sheet (and at 200%), the finish line at +5 and at
  // the cap, the pause card's two taps (and at 200%), You's reasons line, and the payout image at full size.
  test('54 jar', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
      const seen: string[] = [];
      (window as Window & { jarLines?: string[] }).jarLines = seen;
      new MutationObserver(() => document.querySelectorAll('.finish-jar').forEach(node => { if (!seen.includes(node.textContent ?? '')) seen.push(node.textContent ?? ''); })).observe(document, { childList: true, subtree: true, characterData: true });
    });
    const noon = new Date('2026-11-05T12:00:00');
    await page.clock.setFixedTime(noon);
    const seed = (settings: [string, unknown][], ledger: Record<string, unknown>[] = []) => page.evaluate(async ([rows, facts]) => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction(['settings', 'ledger'], 'readwrite'); for (const [key, value] of rows) transaction.objectStore('settings').put({ key, value, updatedAt: 1, deleted: 0, deviceId: 'shots' }); for (const fact of facts) transaction.objectStore('ledger').put(fact); transaction.oncomplete = () => resolve(); });
      database.close();
    }, [settings, ledger] as const);
    const session = (n: number) => ({ id: `shots54-${n}`, mode: 'train', kind: 'session', refId: `s${n}`, dayKey: '2026-11-05', inputs: { workingSets: 6, status: 'completed' }, updatedAt: noon.getTime() - 3_600_000 + n, deleted: 0, deviceId: 'shots' });
    await page.goto('/?e2e#yatra');
    await seed([['yatra.startDay', '2026-11-03'], ['yatra.jarFrom', '2026-11-03']], [session(1)]);
    // One 50-minute focus this week, so Home's top line (the receipt's measured time) shows.
    await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction('focus', 'readwrite'); transaction.objectStore('focus').put({ id: 'shots54-focus', taskId: 'shots54-task', startedAt: new Date('2026-11-05T09:00:00').getTime(), endedAt: new Date('2026-11-05T09:50:00').getTime(), updatedAt: 1, deleted: 0, deviceId: 'shots' }); transaction.oncomplete = () => resolve(); });
      database.close();
    });
    await page.reload();
    await expect(page.locator('.next-move-go')).toBeVisible();
    await expect(page.locator('.home-real')).toHaveText('This week: 50 m of real things');
    await shot(page, 'p54-00-home-header', false);
    await shot(page, 'p54-01-home-no-plan', false);
    await page.getByRole('button', { name: 'Add a plan to a camp ahead' }).scrollIntoViewIfNeeded();
    await shot(page, 'p54-02-home-no-plan-scrolled', false);
    await page.getByRole('button', { name: 'Add a plan to a camp ahead' }).click();
    const sheet = page.getByRole('dialog', { name: 'A plan for a camp ahead' });
    await sheet.getByLabel("What it's for").fill('movie night with Dev');
    await shot(page, 'p54-03-plan-sheet', false);
    await textAt200(page);
    await shot(page, 'p54-04-plan-sheet-200pct', false);
    await page.reload();
    await page.getByRole('button', { name: 'Add a plan to a camp ahead' }).click();
    await page.getByRole('dialog', { name: 'A plan for a camp ahead' }).getByLabel("What it's for").fill('movie night with Dev');
    await page.getByRole('dialog', { name: 'A plan for a camp ahead' }).getByRole('button', { name: 'Save' }).click();
    await page.getByRole('region', { name: 'Your plan on the trail' }).scrollIntoViewIfNeeded();
    await shot(page, 'p54-05-home-with-plan', false);
    // The cap: six sessions today, then the day's first idea (only the day's first idea ends in a finish moment).
    await page.goto('/?e2e#yatra');
    await seed([], [2, 3, 4, 5, 6].map(session));
    await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
    await page.reload();
    await walkIdea(page, 'how-things-work');
    await expect.poll(() => page.evaluate(() => (window as Window & { jarLines?: string[] }).jarLines ?? [])).toContain('Trail done for today.');
    await shot(page, 'p54-07-finish-line-cap', false);
    // +5 on the next day's first idea.
    await page.clock.setFixedTime(new Date('2026-11-06T12:00:00'));
    await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
    await page.reload();
    await walkIdea(page, 'how-things-work');
    await expect.poll(() => page.evaluate(() => (window as Window & { jarLines?: string[] }).jarLines ?? [])).toContain('+5 min into the jar · idea read');
    await shot(page, 'p54-06-finish-line-plus-5', false);
    // The payout card.
    await page.goto('/?e2e#yatra');
    await seed([['yatra.plan', { line: 'movie night with Dev', camp: 1, setAt: noon.getTime() - 86_400_000, needMinutes: 30 }]]);
    await page.reload();
    const payout = page.getByRole('region', { name: 'Plan reached' });
    await payout.scrollIntoViewIfNeeded();
    await shot(page, 'p54-08-payout-card', false);
    await payout.getByRole('button', { name: 'Share' }).click();
    const share = page.getByRole('dialog', { name: 'Share this camp' });
    await expect(share.getByRole('img')).toBeVisible({ timeout: 20_000 });
    await shot(page, 'p54-09-payout-share-sheet', false);
    const saved = page.waitForEvent('download');
    await share.getByRole('button', { name: 'Save image' }).click();
    await (await saved).saveAs(`${out}/${theme}/p54-card-payout.png`);
    // The pause card's two taps after "Open anyway".
    await seed([['pause.card.on', true], ['pause.act', 'do 10 squats'], ['night.pause.apps', ['com.instagram.android']], ['night.pause.dayMode', 'open']]);
    await page.evaluate(() => sessionStorage.setItem('nandi.e2ePause', '{}'));
    await page.reload();
    await page.evaluate(() => { sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'open' })); window.dispatchEvent(new Event('nandi:night-pause')); });
    const card = page.getByRole('dialog', { name: 'Pause card' });
    await card.getByRole('button', { name: 'Open Instagram anyway' }).click();
    await card.getByRole('group', { name: /^Why\?/ }).getByRole('button', { name: 'Quick check' }).click();
    await expect(card.getByRole('group', { name: /^Why\?/ }).getByRole('button', { name: 'Quick check' })).toHaveAttribute('aria-pressed', 'true');
    await expect(card.getByRole('group', { name: 'How long?' }).getByRole('button', { name: '10 min' })).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await shot(page, 'p54-10-pause-taps', false);
    await card.getByRole('button', { name: 'Open for 10 min' }).click();
    await expect(card).toHaveCount(0);
    await page.goto('/?e2e#you');
    await page.reload();
    await expect(page.locator('.you-reasons')).toBeVisible();
    await page.locator('.you-reasons').scrollIntoViewIfNeeded();
    await shot(page, 'p54-12-you-reasons', false);
    // The two taps again at 200% text (nothing opened this time).
    await page.evaluate(() => { sessionStorage.setItem('nandi.e2ePause', JSON.stringify({ pendingPackage: 'com.instagram.android', pendingReason: 'open' })); window.dispatchEvent(new Event('nandi:night-pause')); });
    await card.getByRole('button', { name: 'Open Instagram anyway' }).click();
    await textAt200(page);
    await shot(page, 'p54-11-pause-taps-200pct', false);
  });

  // Spec 55: a crew on two phones (two contexts), the texts that travel in chats (saved as plain text, as a chat shows
  // them), Home's crew bar with the daily send line, the crew screen, the filled jar and its image, and the browser page.
  test('55 crew', async ({ browser }, info) => {
    test.setTimeout(180_000);
    const made = new Date('2026-11-01T10:00:00'), later = new Date('2026-11-05T12:00:00');
    const phone = async (at: Date) => {
      const use = info.project.use;
      const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, baseURL: use.baseURL, storageState: use.storageState, colorScheme: theme, reducedMotion: 'reduce' });
      const p = await context.newPage();
      await p.addInitScript(() => {
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
        const outbox: string[] = [];
        (window as Window & { outbox?: string[] }).outbox = outbox;
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { outbox.push(text); } } });
      });
      await p.clock.setFixedTime(at);
      await p.goto('/?e2e#yatra/crew');
      return p;
    };
    const sent = async (p: Page) => { await expect.poll(async () => (await p.evaluate(() => (window as Window & { outbox?: string[] }).outbox ?? [])).length).toBeGreaterThan(0); return (await p.evaluate(() => (window as Window & { outbox?: string[] }).outbox ?? [])).at(-1)!; };
    const paste = async (p: Page, text: string) => { await p.goto('/?e2e#yatra/crew'); await p.getByRole('button', { name: 'Paste a crew link' }).click(); await p.getByLabel('Crew link').fill(text); await p.getByRole('button', { name: 'Use this link' }).click(); };
    const seed = (p: Page, days: string[], perDay: number) => p.evaluate(async ([list, count]) => {
      const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
      await new Promise<void>(resolve => { const transaction = database.transaction(['ledger', 'settings'], 'readwrite'); transaction.objectStore('settings').put({ key: 'yatra.jarFrom', value: '2026-11-01', updatedAt: 1, deleted: 0, deviceId: 'shots' }); for (const day of list) for (let n = 0; n < count; n++) transaction.objectStore('ledger').put({ id: `shots55-${day}-${n}`, mode: 'train', kind: 'session', refId: `${day}-${n}`, dayKey: day, inputs: { workingSets: 6, status: 'completed' }, updatedAt: new Date(`${day}T15:00:00`).getTime() + n, deleted: 0, deviceId: 'shots' }); transaction.oncomplete = () => resolve(); });
      database.close();
    }, [days, perDay] as const);
    // Two frames first, so a focus ring or a colour is never caught mid-transition (reduced motion's 0.01 ms).
    const snap = async (p: Page, name: string) => { await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); await p.screenshot({ path: `${out}/${theme}/${name}.png` }); };
    const texts: string[] = [];

    const riya = await phone(made);
    // Yatra with no crew: the quiet way in.
    await riya.goto('/?e2e#yatra');
    await riya.getByRole('button', { name: 'Fill a jar with friends' }).scrollIntoViewIfNeeded();
    await snap(riya, 'p55-00-yatra-no-crew');
    await riya.getByRole('button', { name: 'Fill a jar with friends' }).click();
    await riya.getByLabel('What the crew fills up for').fill('Sunday chai at the hill point');
    await riya.getByRole('group', { name: 'How big a jar' }).getByRole('button', { name: '5 h', exact: true }).click();
    await riya.getByLabel('Your first name').fill('Riya');
    await snap(riya, 'p55-01-make-crew');
    await textAt200(riya);
    await snap(riya, 'p55-01b-make-crew-200pct');
    await riya.reload();
    await riya.getByLabel('What the crew fills up for').fill('Sunday chai at the hill point');
    await riya.getByRole('group', { name: 'How big a jar' }).getByRole('button', { name: '5 h', exact: true }).click();
    await riya.getByLabel('Your first name').fill('Riya');
    await riya.getByRole('button', { name: 'Make the crew' }).click();
    await riya.getByRole('button', { name: 'Invite a friend' }).click();
    const invite = await sent(riya); texts.push(`Invite (Riya → chat):\n${invite}`);

    const visitor = await phone(made);
    await visitor.goto(invite.match(/https:\/\/\S+#crew\/\S+/)![0].replace('https://nandi.nandi11.workers.dev/', '/?e2e'));
    await expect(visitor.getByText('Have the app?')).toBeVisible();
    await snap(visitor, 'p55-08-browser-copy-first');

    const dev = await phone(made);
    await paste(dev, invite);
    await expect(dev.getByRole('heading', { name: /^Join the / })).toBeVisible();
    await dev.getByLabel('Your first name').fill('Dev');
    await snap(dev, 'p55-02-join');
    await dev.getByRole('button', { name: 'Join' }).click();
    await dev.getByRole('button', { name: 'Send it to the crew' }).click();
    const joined = await sent(dev); texts.push(`Joined (Dev → chat):\n${joined}`);
    await paste(riya, joined);
    await expect(riya.getByText('2 walking')).toBeVisible();

    await dev.clock.setFixedTime(later);
    await seed(dev, ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'], 6);
    await dev.goto('/?e2e#yatra');
    await dev.reload();
    await dev.locator('.crew-bar').scrollIntoViewIfNeeded();
    await snap(dev, 'p55-04-home-crew-bar-send-line');
    await dev.getByRole('button', { name: 'Send' }).click();
    const add = await sent(dev); texts.push(`Add (Dev → chat):\n${add}`);

    await riya.clock.setFixedTime(later);
    await paste(riya, add);
    await expect(riya.getByText('4 h of 5 h')).toBeVisible();
    await snap(riya, 'p55-03-crew-screen');
    await riya.getByRole('button', { name: 'Leave crew' }).scrollIntoViewIfNeeded();
    await snap(riya, 'p55-03b-crew-screen-leave');
    await riya.getByRole('button', { name: 'Leave crew' }).click();
    await expect(riya.getByRole('dialog', { name: 'Leave the crew?' })).toBeVisible();
    await snap(riya, 'p55-03c-leave-confirm');
    await riya.getByRole('button', { name: 'Stay' }).click();
    await seed(riya, ['2026-11-05'], 6);
    await riya.goto('/?e2e#yatra/crew');
    await riya.reload();
    await expect(riya.getByRole('heading', { name: /^The crew filled 5 h/ })).toBeVisible();
    await snap(riya, 'p55-05-crew-filled');
    await riya.getByRole('button', { name: 'Share' }).click();
    const sheet = riya.getByRole('dialog', { name: 'Share the crew jar' });
    await expect(sheet.getByRole('img')).toBeVisible({ timeout: 20_000 });
    await snap(riya, 'p55-06-crew-share-sheet');
    const saved = riya.waitForEvent('download');
    await sheet.getByRole('button', { name: 'Save image' }).click();
    await (await saved).saveAs(`${out}/${theme}/p55-card-crew-filled.png`);
    writeFileSync(`${out}/${theme}/p55-chat-texts.txt`, `${texts.join('\n\n')}\n`);
  });
});
