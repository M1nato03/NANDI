import { expect, test, type Page } from '@playwright/test';
import { openMore } from '../e2e/helpers/plan';
import { answerRight, seedTaughtTopics, walkLesson } from '../e2e/learn-helpers';

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

  test('read: a chapter mid-way, the quiz check, chapter done', async ({ page }) => {
    await page.clock.setFixedTime(NOON);
    await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
    await walkLesson(page, 'how-things-work', true);
    await expect(page.locator('.step-lesson')).toBeVisible();
    await shot(page, 'read-3-chapter-midway', false);
    await page.goto('/?e2e#read');
    await seedTaughtTopics(page, ['how-things-work']);
    await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
    await expect(page.getByText('Chapter check · three questions')).toBeVisible();
    await shot(page, 'read-4-check-quiz', false);
    for (let question = 0; question < 3; question++) await answerRight(page, 'how-things-work');
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
    await walkLesson(page, 'how-to-win-friends', true);
    await expect(page.locator('.step-lesson')).toBeVisible();
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
      for (let question = 0; question < 3; question++) await answerRight(page, 'history-civilisations');
    }
    await expect(page.locator('.read-done-card')).toContainText('You finished');
    await shot(page, 'read-8-book-done', false);
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
        await expect(page.getByRole('heading', { name: 'Yatra', level: 1 })).toBeVisible({ timeout: 1500 });
        await page.waitForTimeout(800);
        await expect(page.getByRole('heading', { name: 'Yatra', level: 1 })).toBeVisible({ timeout: 100 });
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
    await expect(page.getByRole('heading', { name: 'Breathe with Kachhua' })).toBeVisible();
    await page.getByRole('button', { name: '20 min', exact: true }).click();
    await expect(page.locator('.calm-start')).toHaveText('Start 20 minutes');
    await shot(page, 'calm-setup-paced', false);
    await page.getByRole('button', { name: 'Scan', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Scan', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await shot(page, 'calm-setup-scan', false);
    await page.getByRole('button', { name: 'Quiet', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Quiet', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await shot(page, 'calm-setup-quiet', false);
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
    await page.getByRole('button', { name: 'None', exact: true }).click();
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

  test('night deck', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-26T23:30:00'));
    await page.goto('/?e2e#night');
    await expect(page.getByRole('region', { name: 'Now deck' })).toBeVisible();
    await shot(page, 'night-deck');
  });
});
