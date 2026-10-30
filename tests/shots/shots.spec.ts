import { expect, test, type Page } from '@playwright/test';
import { openMore } from '../e2e/helpers/plan';
import { answerRight, seedTaughtTopics, walkIdea } from '../e2e/learn-helpers';

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

  // Spec 37: Yatra is home: morning and night, a running focus, and scrolled to the doors.
  test('yatra home: morning, night, focus strip, doors', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-28T08:30:00') });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Good morning.', level: 1 })).toBeVisible();
    await page.waitForTimeout(800);
    await shot(page, 'home-1-morning', false);
    await page.getByRole('heading', { name: 'Whenever you feel ready' }).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 200));
    await shot(page, 'home-4-doors', false);
    await shot(page, 'home-5-full');
    await page.goto('/#plan');
    await page.getByLabel('Add a task').fill('Write the report');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Start: Write the report' }).click();
    await expect(page.getByRole('region', { name: 'Focus' })).toBeVisible();
    await page.clock.fastForward(24 * 60_000 + 10_000);
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Yatra' }).click();
    await expect(page.locator('.yatra-focus-strip')).toBeVisible();
    await page.waitForTimeout(800);
    await shot(page, 'home-3-focus', false);
    // The focus ends before the evening, so the night shot is the plain home.
    await page.locator('.yatra-focus-strip').click();
    await page.getByRole('region', { name: 'Focus' }).getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('region', { name: 'Focus' })).toHaveCount(0);
    await page.clock.setSystemTime(new Date('2026-10-28T22:10:00'));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Good evening.', level: 1 })).toBeVisible();
    await expect(page.locator('.yatra-quiet')).toHaveText('The friends are by the fire tonight.');
    await page.waitForTimeout(800);
    await shot(page, 'home-2-night', false);
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
        await expect(page.getByRole('heading', { name: /^Good (morning|afternoon|evening|night)/, level: 1 })).toBeVisible({ timeout: 1500 });
        await page.waitForTimeout(800);
        await expect(page.getByRole('heading', { name: /^Good (morning|afternoon|evening|night)/, level: 1 })).toBeVisible({ timeout: 100 });
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
    await card.getByRole('button', { name: 'Do my 2-min thing' }).click();
    await page.clock.fastForward(37_000);
    await shot(page, 'p39-8-act-timer', false);
    await card.getByRole('button', { name: 'I did it' }).click();
    await expect(card).toContainText('2 minutes back.');
    await shot(page, 'p39-9-done', false);
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
    await card.getByRole('button', { name: 'Do my 2-min thing' }).click();
    await expect(card.getByRole('button', { name: 'I did it' })).toBeVisible();
    await shot(page, 'p39b-2-act-i-did-it-at-start', false);
    await card.getByRole('button', { name: 'Not now' }).click();
    await expect(card).toHaveCount(0);
    // "Do it in NANDI" with nothing else on: today's Read drop.
    await opens();
    await card.getByRole('button', { name: 'Do it in NANDI' }).click();
    await expect(page).toHaveURL(/#read\/drop$/);
    await shot(page, 'p39b-3-in-nandi-read-drop', false);
    // With a task planned for today: its focus.
    await page.goto('/?e2e#plan/focus');
    await page.getByLabel('Add a task').fill('Email Riya the slides');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.goto('/?e2e#you');
    await opens();
    await card.getByRole('button', { name: 'Do it in NANDI' }).click();
    await expect(page).toHaveURL(/#plan\/focus$/);
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
    await welcome.getByRole('button', { name: 'Start an easy first workout' }).click();
    await expect(page).toHaveURL(/#yatra\/train\/workout$/);
    await expect(page.getByText('Current exercise')).toBeVisible();
    await shot(page, 'fix-2-get-fit-workout', false);
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
});
