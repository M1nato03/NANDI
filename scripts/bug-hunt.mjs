/** Local two-day browser audit. Run with `node scripts/bug-hunt.mjs`. Never run in CI. */
import { execFileSync, spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = 4189;
const base = `http://127.0.0.1:${port}`;
const out = 'test-results/bug-hunt-2026-10-19';
const buildDir = 'test-results/bug-hunt-dist';
const report = { steps: [], consoleErrors: [], pageErrors: [], failedRequests: [], unhandledPromises: [], overlaps: [], lostState: [] };
await mkdir(out, { recursive: true });
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', buildDir], {
  env: { ...process.env, VITE_E2E: '1' }, stdio: 'inherit', timeout: 900_000,
});
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', buildDir, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
const watchdog = setTimeout(() => { server.kill(); console.error('Audit exceeded 900 seconds'); process.exit(124); }, 900_000);
let browser;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(base)).ok) break; } catch { /* preview is starting */ }
    if (server.exitCode !== null) throw new Error(`Preview exited: ${server.exitCode}`);
    if (attempt === 99) throw new Error('Preview did not start');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  try { browser = await chromium.launch({ headless: true }); }
  catch { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Asia/Kolkata', acceptDownloads: true });
  await context.addInitScript(() => {
    addEventListener('unhandledrejection', event => {
      const detail = String(event.reason?.stack ?? event.reason);
      console.error(`UNHANDLED_PROMISE: ${detail}`);
    });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8_000);
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const item = { url: page.url(), source: message.location().url, text: message.text() };
    report.consoleErrors.push(item);
    if (item.text.includes('UNHANDLED_PROMISE:')) report.unhandledPromises.push(item);
  });
  page.on('pageerror', error => report.pageErrors.push({ url: page.url(), error: String(error.stack ?? error) }));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() }); });
  const step = async (name, action) => {
    try {
      await action();
      await page.locator('.app-shell').waitFor();
      const overlaps = await page.evaluate(() => {
        const bar = document.querySelector('.tabbar')?.getBoundingClientRect();
        if (!bar) return [];
        return [...document.querySelectorAll('main button')].filter(node => {
          const box = node.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && box.top < innerHeight && box.bottom > 0 && !node.disabled &&
            box.left < bar.right && box.right > bar.left && box.top < bar.bottom && box.bottom > bar.top;
        }).map(node => ({ label: node.textContent?.trim(), box: node.getBoundingClientRect().toJSON() }));
      });
      if (overlaps.length) report.overlaps.push({ name, overlaps });
      report.steps.push({ name, result: 'pass' });
      console.log(`PASS ${name}`);
    } catch (error) {
      report.steps.push({ name, result: 'fail', error: String(error) });
      console.error(`FAIL ${name}: ${String(error)}`);
      await page.screenshot({ path: `${out}/${name.replace(/[^a-z0-9]+/gi, '-')}.png` }).catch(() => {});
    }
  };
  const reload = async (name, selector) => step(name, async () => {
    await page.reload();
    await page.locator(selector).waitFor({ timeout: 30_000 });
  });
  const offlineReload = async (name, selector) => step(name, async () => {
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 30_000 });
    await context.setOffline(true);
    try { await page.reload(); await page.locator(selector).waitFor({ timeout: 30_000 }); }
    finally { await context.setOffline(false); }
  });
  const nav = async route => page.goto(`${base}/?e2e#${route}`);
  const tab = async name => {
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name, exact: true }).click();
    await page.waitForURL(new RegExp(`#${name.toLowerCase()}$`));
  };
  const dot = async (area, done) => page.getByRole('navigation', { name: 'Today status' }).getByRole('button', { name: `${area}: ${done ? 'done' : 'not done'}` }).waitFor();
  const startDrop = async () => {
    await page.waitForFunction(() => Boolean(document.querySelector('.learn-topic-tile, .learn-drop-head')));
    const topic = page.locator('.learn-topic-tile').first();
    if (await topic.isVisible()) { await topic.click(); await page.getByRole('button', { name: 'Start my first drop' }).click(); }
    await page.locator('.learn-drop-head').waitFor();
  };
  await page.clock.install({ time: new Date('2026-10-17T12:00:00+05:30') });
  await step('day1-open', async () => { await nav('plan'); await page.getByRole('region', { name: 'Today' }).waitFor(); });
  await step('three-tasks', async () => {
    for (const title of ['Write outline', 'Review notes', 'Send update']) {
      await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
      await page.getByRole('button', { name: 'Add task', exact: true }).click();
      await page.getByRole('region', { name: 'Today' }).getByText(title).waitFor();
    }
  });
  await reload('tasks-survive-reload', 'text=Write outline');
  await step('focus-start-pause-finish', async () => {
    await page.getByRole('button', { name: 'Focus timer' }).click();
    await page.getByRole('region', { name: 'Focus task' }).getByRole('button', { name: 'Start focus' }).click();
    await page.clock.fastForward(65_000);
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('status').filter({ hasText: 'Focus paused.' }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Resume' }).waitFor();
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.clock.fastForward(60_000);
    await page.getByRole('region', { name: 'Focus task' }).getByRole('button', { name: 'Finish' }).click();
    await page.getByRole('status').filter({ hasText: 'Planned' }).waitFor();
    await dot('Plan', true);
  });
  await offlineReload('offline-task-reload', '.focus-screen');
  await step('full-workout', async () => {
    await tab('Train');
    await page.getByRole('button', { name: 'Start placement' }).waitFor();
    if (await page.getByRole('button', { name: 'Start placement' }).isVisible()) {
      await page.getByRole('button', { name: 'Start placement' }).click();
      for (let i = 0; i < 7; i++) {
        if (i === 4 || i === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
        await page.getByRole('button', { name: 'Record test' }).click();
      }
    }
    await page.getByRole('button', { name: 'Start session' }).click();
    for (let exercise = 1; exercise <= 7; exercise++) {
      await page.getByText(`Exercise ${exercise} of 7`).waitFor();
      const sets = Number((await page.locator('.train-target').innerText()).match(/^\d+/)?.[0]);
      if (!sets) throw new Error(`No set target for exercise ${exercise}`);
      for (let set = 0; set < sets; set++) await page.getByRole('button', { name: 'Log set' }).click();
      if (exercise === 1) { await page.reload(); await page.getByText('Exercise 2 of 7').waitFor(); }
    }
    await page.getByRole('button', { name: 'Finish session' }).click();
    await page.getByRole('heading', { name: 'Session finished' }).waitFor();
    await dot('Train', true);
  });
  await step('workout-survives-reload', async () => {
    await page.reload();
    await page.getByRole('button', { name: 'View history' }).click();
    await page.getByRole('heading', { name: 'History' }).waitFor();
  });
  await step('daily-board', async () => {
    await tab('Mind');
    await page.getByRole('button', { name: 'Board: not done' }).click();
    await page.locator('.mind-grid').waitFor({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__nandiMindTest));
    await page.evaluate(() => window.__nandiMindTest.solveKnownSolution());
    await page.locator('.mind-board[data-save-state="saved"]').waitFor();
    await page.getByRole('button', { name: 'Back to Mind' }).click();
    if (await page.getByRole('button', { name: 'Board: not done' }).isVisible()) {
      await page.getByRole('button', { name: 'Board: not done' }).click();
      await page.locator('.mind-grid').waitFor({ timeout: 30_000 });
      await page.waitForFunction(() => Boolean(window.__nandiMindTest));
      await page.evaluate(() => window.__nandiMindTest.solveKnownSolution());
      await page.locator('.mind-board[data-save-state="saved"]').waitFor();
      await page.getByRole('button', { name: 'Back to Mind' }).click();
    }
    await dot('Mind', true);
  });
  await step('daily-case', async () => {
    await page.getByRole('button', { name: 'Case: not done' }).click();
    await page.waitForFunction(() => Boolean(window.__nandiCaseTest), null, { timeout: 30_000 });
    await page.evaluate(() => window.__nandiCaseTest.solveTodaysCase());
    await page.locator('.mind-case[data-save-state="saved"]').waitFor();
    await page.getByRole('button', { name: 'Back to Mind' }).click();
  });
  await step('mind-survives-reload', async () => {
    await page.reload();
    await page.getByRole('button', { name: 'Case: done' }).waitFor();
    await page.getByRole('button', { name: 'Board: done' }).waitFor();
  });
  await step('five-item-learn-drop', async () => {
    await tab('Learn');
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Start' }).click();
    await startDrop();
    for (let item = 0; item < 5; item++) {
      await page.locator('.learn-drop-head').getByText(`${item + 1} / 5`).waitFor();
      for (let attempt = 0; attempt < 12 && !await page.locator('.learn-feedback').isVisible(); attempt++) {
        await page.locator('.learn-options button:enabled').first().click();
      }
      await page.locator('.learn-feedback').waitFor();
      if (item === 1) { await page.reload(); await page.locator('.learn-feedback').waitFor(); }
      await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
    }
    await page.getByRole('heading', { name: "That's today's drop" }).waitFor();
    await dot('Learn', true);
  });
  await step('side-quest', async () => {
    await tab('Plan');
    const quest = page.getByRole('region', { name: 'Side quests' });
    const row = quest.locator('.quest-row').first();
    await row.waitFor();
    const once = row.getByRole('button', { name: 'Done' });
    if (await once.isVisible()) await once.click();
    else {
      const button = row.getByRole('button', { name: /^Add / });
      for (let i = 0; i < 20 && await button.isEnabled(); i++) await button.click();
    }
    await quest.locator('.quest-check').first().waitFor();
    await page.reload();
    await page.getByRole('region', { name: 'Side quests' }).locator('.quest-check').first().waitFor();
  });
  await step('plan-rituals', async () => {
    await page.getByRole('button', { name: 'Morning plan' }).click();
    await page.getByRole('region', { name: 'Time for today' }).waitFor();
    await nav('plan');
    await page.getByRole('button', { name: 'Shutdown' }).click();
    await page.getByRole('region', { name: 'Close today' }).waitFor();
    await nav('plan');
    await page.getByRole('button', { name: 'Weekly review' }).click();
    await page.getByRole('region', { name: 'This week, in words' }).waitFor();
  });
  await step('settings-and-backup', async () => {
    await tab('You');
    await page.getByRole('button', { name: /Settings/ }).click();
    await page.getByLabel('Motion').selectOption('reduce');
    await page.getByLabel('Theme').selectOption('dark');
    await page.getByLabel('Night deck nudge').uncheck();
    await page.getByLabel('Morning first step nudge').uncheck();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.motion === 'reduce');
    await page.getByRole('button', { name: /Backup and restore/ }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup' }).click();
    await (await download).path();
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.motion === 'reduce');
    await tab('You');
    await page.getByRole('button', { name: /Settings/ }).click();
    if (await page.getByLabel('Night deck nudge').isChecked()) report.lostState.push('Night deck nudge');
    if (await page.getByLabel('Morning first step nudge').isChecked()) report.lostState.push('Morning first step nudge');
  });
  await page.clock.setFixedTime(new Date('2026-10-17T23:40:00+05:30'));
  await step('night-deck-start', async () => { await nav('plan'); await page.reload(); await page.getByRole('article', { name: 'Tonight card' }).waitFor(); if (!page.url().endsWith('#night')) throw new Error('Night did not open at shutdown'); });
  await step('night-leave-and-return', async () => {
    await page.getByRole('button', { name: 'Leave night deck' }).click();
    await page.waitForURL(/#plan$/);
    await nav('night');
    await page.getByRole('article', { name: 'Tonight card' }).waitFor();
  });
  await step('night-drop', async () => {
    await page.getByRole('region', { name: 'Now deck' }).getByRole('button', { name: 'Next', exact: true }).click();
    await startDrop();
    for (let item = 0; item < 3; item++) {
      await page.locator('.learn-drop-head').getByText(`${item + 1} / 3`).waitFor();
      for (let attempt = 0; attempt < 12 && !await page.locator('.learn-feedback').isVisible(); attempt++) await page.locator('.learn-options button:enabled').first().click();
      await page.locator('.learn-feedback').getByRole('button', { name: 'Next' }).click();
    }
    await page.locator('.learn-stop').getByRole('button', { name: 'Continue' }).click();
  });
  await step('night-puzzle', async () => {
    await page.getByRole('article', { name: 'Think card' }).waitFor();
    await page.getByRole('article', { name: 'Think card' }).getByRole('button', { name: 'Play' }).click();
    await page.locator('.mind-grid').waitFor({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__nandiMindTest));
    await page.evaluate(() => window.__nandiMindTest.solveKnownSolution());
    await page.locator('.mind-board[data-save-state="saved"]').waitFor();
    await nav('night');
    await page.getByRole('button', { name: 'Go to card 4: Today, in words' }).click();
  });
  await step('tomorrows-step', async () => {
    await page.getByLabel('Name one small step').fill('Open the notes');
    await page.getByRole('article', { name: 'Today, in words card' }).getByRole('button', { name: 'Save' }).click();
    await page.reload();
    await page.getByRole('article', { name: 'Today, in words card' }).getByText('Open the notes').waitFor();
  });
  await step('phone-down-and-lights-out', async () => {
    await page.getByRole('region', { name: 'Now deck' }).getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('article', { name: 'Phone-down move card' }).getByRole('button', { name: /do it/ }).click();
    await page.getByRole('region', { name: 'Now deck' }).getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Lights-out check-in' }).click();
    await page.reload();
    await page.getByText('Check-in saved.').waitFor();
  });
  await offlineReload('offline-night-reload', '.deck-night');
  await step('night-last-card-close', async () => {
    await page.getByRole('article', { name: /tonight card/ }).getByRole('button', { name: 'Close' }).click();
    await page.waitForURL(/#plan$/);
  });
  await step('night-closes-at-04', async () => {
    await page.clock.setSystemTime(new Date('2026-10-18T03:59:00+05:30'));
    await nav('night');
    await page.getByRole('article', { name: 'Tonight card' }).waitFor();
    await page.clock.fastForward(2 * 60_000);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForURL(/#plan$/);
  });
  await page.clock.setFixedTime(new Date('2026-10-18T08:30:00+05:30'));
  await step('day2-feature-homes', async () => { await nav('plan'); await page.getByRole('heading', { name: 'Plan', exact: true }).waitFor(); for (const name of ['Train', 'Learn', 'Mind', 'You']) { await tab(name); await page.getByRole('heading', { name, exact: true }).waitFor(); } });
  await step('day2-reviews-due', async () => { await tab('Mind'); await page.getByRole('heading', { name: 'Card reviews' }).waitFor(); });
  await step('day2-recap', async () => { await tab('You'); await page.getByRole('button', { name: 'Share my week' }).click(); await page.getByRole('dialog', { name: 'Weekly recap preview' }).waitFor(); });
  await step('offline-day2-recap', async () => {
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 30_000 });
    await context.setOffline(true);
    try {
      await page.reload();
      await page.getByRole('button', { name: 'Share my week' }).click();
      await page.getByRole('dialog', { name: 'Weekly recap preview' }).waitFor();
    } finally { await context.setOffline(false); }
  });
  await step('legacy-route-redirects', async () => {
    const redirects = {
      now: 'plan', 'now/focus': 'plan/focus', today: 'plan/focus', tasks: 'plan', 'tasks/plan': 'plan/morning',
      'tasks/shutdown': 'plan/shutdown', 'tasks/review': 'plan/review', 'tasks/quest/sample': 'plan/quest/sample',
      ground: 'you/settings', 'ground/backup': 'you/backup', 'ground/night': 'you/night',
      'you/settings': 'you/settings', 'you/train': 'train', 'you/train/history': 'train/history',
      'you/train/workout': 'train/workout', 'you/train/settings': 'train/settings', 'you/train/retest': 'train/retest',
      'you/train/finish': 'train/finish', 'you/learn': 'learn', 'you/learn/drop': 'learn/drop',
      'you/mind': 'mind', 'you/mind/board/daily': 'mind/board/daily', 'you/mind/board/crowns/easy': 'mind/board/crowns/easy',
      'you/mind/practice': 'mind/practice', 'you/mind/case': 'mind/case', 'you/mind/generator': 'mind/generator',
      'you/mind/reviews': 'mind/reviews', 'you/mind/lesson': 'learn/lesson', 'you/mind/unit': 'learn/unit',
    };
    for (const [oldRoute, destination] of Object.entries(redirects)) {
      await nav(oldRoute);
      await page.waitForURL(new RegExp(`#${destination}$`));
    }
  });
  await step('notification-and-widget-destinations', async () => {
    for (const destination of ['plan', 'night']) {
      await nav(destination);
      await page.waitForURL(new RegExp(`#${destination}$`));
      await page.getByRole('heading', { name: destination === 'night' ? 'Tonight' : 'Plan', exact: true }).waitFor();
    }
  });
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(`Report: ${out}/report.json`);
  process.exitCode = report.steps.some(item => item.result === 'fail') || report.lostState.length || report.pageErrors.length || report.unhandledPromises.length ? 1 : 0;
  await context.close();
} finally {
  clearTimeout(watchdog);
  if (browser) await browser.close();
  server.kill();
}
