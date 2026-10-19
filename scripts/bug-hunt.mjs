/** Local two-day browser audit. Run with `node scripts/bug-hunt.mjs`. Never run in CI. */
import { execFileSync, spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = 4189;
const base = `http://127.0.0.1:${port}`;
const out = 'test-results/bug-hunt-2026-10-19';
const buildDir = 'test-results/bug-hunt-dist';
const report = { steps: [], consoleErrors: [], pageErrors: [], failedRequests: [], unhandledPromises: [], overlaps: [], textOverflow: [], horizontalScroll: [], smallTargets: [], lostState: [], notExercised: [] };
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
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 800 }]) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, timezoneId: 'Asia/Kolkata', acceptDownloads: true });
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
      const layout = await page.evaluate(() => {
        const bar = document.querySelector('.tabbar')?.getBoundingClientRect();
        const visible = node => { const box = node.getBoundingClientRect(); const style = getComputedStyle(node); return box.width > 0 && box.height > 0 && box.top < innerHeight && box.bottom > 0 && style.visibility !== 'hidden' && style.display !== 'none'; };
        const controls = [...document.querySelectorAll('main button, main a, main input, main select, main summary')].filter(visible);
        const overlaps = !bar ? [] : controls.filter(node => {
          const box = node.getBoundingClientRect();
          const x = Math.max(0, Math.min(innerWidth - 1, box.left + box.width / 2));
          const y = Math.max(0, Math.min(innerHeight - 1, box.top + box.height / 2));
          return !node.disabled && box.left < bar.right && box.right > bar.left && box.top < bar.bottom && box.bottom > bar.top &&
            !node.closest('.tabbar, [role="dialog"]') && document.elementFromPoint(x, y)?.closest('.tabbar');
        }).map(node => ({ label: node.getAttribute('aria-label') ?? node.textContent?.trim().slice(0, 90), box: node.getBoundingClientRect().toJSON() }));
        const small = controls.filter(node => !node.disabled && !node.closest('.mind-grid, .tabbar') && (node.getBoundingClientRect().width < 44 || node.getBoundingClientRect().height < 44))
          .map(node => ({ label: node.getAttribute('aria-label') ?? node.textContent?.trim().slice(0, 80), width: Math.round(node.getBoundingClientRect().width), height: Math.round(node.getBoundingClientRect().height) }));
        const overflowing = [...document.querySelectorAll('main *')].filter(visible).filter(node => {
          const style = getComputedStyle(node);
          return node.children.length === 0 && node.scrollWidth > node.clientWidth + 2 && style.overflowX !== 'hidden' && style.overflowX !== 'clip';
        }).map(node => ({ text: node.textContent?.trim().slice(0, 90), width: node.clientWidth, scrollWidth: node.scrollWidth }));
        return { overlaps, small, overflowing, scrollWidth: document.documentElement.scrollWidth };
      });
      if (layout.overlaps.length) report.overlaps.push({ viewport: viewport.width, name, overlaps: layout.overlaps });
      if (layout.small.length) report.smallTargets.push({ viewport: viewport.width, name, targets: layout.small });
      if (layout.overflowing.length) report.textOverflow.push({ viewport: viewport.width, name, elements: layout.overflowing });
      if (layout.scrollWidth > viewport.width + 2) report.horizontalScroll.push({ viewport: viewport.width, name, scrollWidth: layout.scrollWidth });
      report.steps.push({ viewport: viewport.width, name, result: 'pass' });
      console.log(`PASS ${viewport.width} ${name}`);
    } catch (error) {
      report.steps.push({ viewport: viewport.width, name, result: 'fail', error: String(error) });
      console.error(`FAIL ${viewport.width} ${name}: ${String(error)}`);
      await page.screenshot({ path: `${out}/${viewport.width}-${name.replace(/[^a-z0-9]+/gi, '-')}.png` }).catch(() => {});
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
    await page.waitForFunction(() => Boolean(document.querySelector('.learn-topic-tile, .learn-drop-head, .learn-stop')));
    const topic = page.locator('.learn-topic-tile').first();
    if (await topic.isVisible()) { await topic.click(); await page.getByRole('button', { name: 'Start my first drop' }).click(); }
    if (!await page.locator('.learn-stop').isVisible()) await page.locator('.learn-drop-head').waitFor();
  };
  const answerLearnItem = async () => {
    for (let attempt = 0; attempt < 16 && !await page.locator('.learn-confidence').isVisible() && !await page.locator('.learn-feedback').isVisible(); attempt++) {
      const option = page.locator('.learn-options button:enabled').first();
      if (!await option.isVisible()) break;
      await option.click();
    }
    if (await page.locator('.learn-confidence').isVisible()) await page.getByRole('group', { name: 'Confidence' }).getByRole('button', { name: 'Sure', exact: true }).click();
    await page.locator('.learn-feedback').waitFor();
  };
  const waitForNudgesOff = async () => page.waitForFunction(() => ['Night deck nudge', 'Morning first step nudge'].every(name => {
    const label = [...document.querySelectorAll('label')].find(node => node.textContent?.includes(name));
    return label?.querySelector('input')?.checked === false && label?.querySelector('input')?.disabled === false;
  }));
  const advanceLearn = async () => {
    await page.waitForFunction(() => { const button = document.querySelector('.learn-feedback button'); return button && !button.disabled; });
    await page.locator('.learn-feedback button').dispatchEvent('click');
    await page.locator('.learn-feedback').waitFor({ state: 'hidden' });
  };
  await page.clock.install({ time: new Date('2026-10-19T12:00:00+05:30') });
  await step('day1-open', async () => { await nav('plan'); await page.getByRole('region', { name: 'Today' }).waitFor(); });
  await step('three-tasks', async () => {
    for (const [index, title] of ['Write outline', 'Review notes', 'Send update'].entries()) {
      await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill(title);
      await page.locator('.task-form').getByLabel('Start time').fill(`2026-10-19T${13 + index}:00`);
      if (index === 0) await page.locator('.task-form').getByLabel('Must', { exact: true }).check();
      await page.getByRole('button', { name: 'Add task', exact: true }).click();
      await page.getByRole('region', { name: 'Today' }).getByText(title).waitFor();
    }
    await page.getByRole('region', { name: 'Now card' }).getByText('Write outline').waitFor();
  });
  await reload('tasks-survive-reload', '.plan-now-card');
  await step('edit-task-detail', async () => {
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Review notes' }).click();
    const detail = page.getByRole('dialog', { name: 'Task detail Review notes' });
    await detail.getByLabel('Title').fill('Review course notes');
    await detail.getByLabel('First step').fill('Open chapter one');
    await detail.getByRole('button', { name: 'Save task' }).click();
    await page.reload();
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Review course notes' }).waitFor();
  });
  await step('checkpoint-proposal-move-respace', async () => {
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Prepare project');
    await page.locator('.task-form').getByLabel('Start time').fill('2026-10-19T16:00');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    const row = page.getByRole('region', { name: 'Today' }).locator('.task-row').filter({ hasText: 'Prepare project' });
    await row.getByRole('button', { name: 'Move' }).click();
    const move = page.getByRole('dialog', { name: 'Move Prepare project' });
    await move.getByLabel('New date and time').fill('2026-10-25T16:00');
    await move.getByRole('button', { name: 'Save new time' }).click();
    await page.locator('.later summary').click();
    await page.getByRole('region', { name: 'Upcoming' }).getByRole('button', { name: 'Prepare project' }).click();
    await page.getByRole('button', { name: 'Add checkpoints' }).click();
    await page.getByRole('button', { name: 'Accept checkpoints' }).click();
    await page.getByRole('status').filter({ hasText: 'Checkpoints added.' }).waitFor();
    await page.reload();
    await page.locator('.later summary').click();
    const checkpoint = page.getByRole('region', { name: 'Upcoming' }).locator('.task-row').filter({ hasText: 'Prepare project · checkpoint 1' });
    await checkpoint.getByRole('button', { name: 'Move' }).click();
    await page.getByRole('dialog', { name: /Move Prepare project/ }).getByLabel('New date and time').fill('2026-10-22T16:00');
    await page.getByRole('button', { name: 'Save new time' }).click();
    await page.getByRole('dialog', { name: 'Re-space checkpoints' }).getByRole('button', { name: 'Re-space' }).click();
    await page.reload();
    await page.locator('.later summary').click();
    await page.getByRole('region', { name: 'Upcoming' }).getByText('Prepare project · checkpoint 3').waitFor();
  });
  await step('focus-reward-setting', async () => {
    await tab('You');
    await page.getByRole('button', { name: /Settings/ }).click();
    await page.getByLabel('Reward after a focus block').check();
    await page.getByLabel('Name your reward').fill('chai');
    await page.getByRole('button', { name: 'Save reward' }).click();
    await nav('plan');
  });
  await step('focus-start-pause-finish', async () => {
    await page.getByRole('button', { name: 'Focus timer' }).click();
    await page.getByRole('region', { name: 'Focus task' }).getByRole('button', { name: 'Start focus' }).click();
    await page.clock.fastForward(65_000);
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('status').filter({ hasText: 'Focus paused.' }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Resume' }).waitFor();
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.clock.fastForward(24 * 60_000);
    await page.getByRole('region', { name: 'Focus task' }).getByRole('button', { name: 'Finish' }).click();
    await page.locator('.task-result').first().waitFor();
    await page.getByRole('status').filter({ hasText: 'Block done. Time for chai.' }).waitFor();
    await dot('Plan', true);
  });
  await offlineReload('offline-task-reload', '.focus-screen');
  await step('full-workout', async () => {
    await tab('Train');
    if (await page.getByRole('button', { name: 'Save assessment' }).count() === 0) {
      await page.getByLabel('Training track').selectOption('gym');
      await page.getByLabel('Gym access').check();
      await page.getByLabel('Dumbbells').check();
      for (const label of ['Goblet Squat', 'Dumbbell Bench Press', 'Seated Cable Row', 'Dumbbell Romanian Deadlift']) {
        const input = page.getByRole('spinbutton', { name: new RegExp(`${label} load for 12 clean reps`) });
        if (await input.count()) await input.fill('8');
      }
      await page.getByRole('button', { name: 'Save assessment' }).click();
    }
    await page.getByRole('button', { name: 'Start session' }).click();
    for (let exercise = 1; exercise <= 5; exercise++) {
      await page.locator('.train-progress').getByText(`Exercise ${exercise} of 5`).waitFor({ state: 'attached' });
      const sets = Number((await page.locator('.train-target').innerText()).match(/^\d+/)?.[0]);
      if (!sets) throw new Error(`No set target for exercise ${exercise}`);
      const warmups = exercise <= 2 ? 2 : 0;
      for (let set = 0; set < sets + warmups; set++) {
        const kg = page.getByRole('spinbutton', { name: 'Kg' });
        if (await kg.count()) {
          const increment = Number(await kg.getAttribute('step'));
          if (!(increment > 0)) throw new Error(`Missing load step on exercise ${exercise}`);
          if (set === 0) { const before = Number(await kg.inputValue()); await page.getByRole('button', { name: 'Increase Kg' }).click(); if (Number(await kg.inputValue()) <= before) throw new Error('Load step did not increase'); }
        }
        await page.getByRole('button', { name: 'Log set' }).click();
      }
      await page.locator('.train-active-set').waitFor({ state: 'hidden' });
      if (exercise < 5) {
        await page.clock.fastForward(500);
        await page.locator('.train-progress').getByText(`Exercise ${exercise + 1} of 5`).waitFor({ state: 'attached' });
      }
      if (exercise === 1) { await page.reload(); await page.locator('.train-progress').getByText('Exercise 2 of 5').waitFor({ state: 'attached' }); }
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
    for (let rung = 1; rung <= 3; rung++) await page.getByRole('button', { name: 'Hint', exact: true }).click();
    await page.getByText(/Move:|conflict|cell|row/i).first().waitFor();
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
    await page.locator('.mind-story-panel').first().waitFor();
    await page.getByRole('button', { name: 'Back to Mind' }).click();
  });
  await step('mind-survives-reload', async () => {
    await page.reload();
    await page.getByRole('button', { name: 'Case: done' }).waitFor();
    await page.getByRole('button', { name: 'Board: done' }).waitFor();
    await page.locator('.mind-story summary').click();
    await page.locator('.mind-story article').first().waitFor();
  });
  await step('practice-par-and-techniques', async () => {
    await page.locator('.mind-techniques summary').click();
    await page.locator('.mind-techniques').getByText(/unlocked/).waitFor();
    for (let attempt = 0; attempt < 6; attempt++) {
      await nav('mind/board/crowns/easy');
      await page.waitForFunction(() => Boolean(window.__nandiMindTest), null, { timeout: 30_000 });
      await page.evaluate(() => window.__nandiMindTest.solveKnownSolution());
      await page.locator('.mind-result').waitFor();
      if (attempt === 5) await page.locator('.mind-result').getByText(/Par \d/).waitFor();
      await nav('mind');
    }
  });
  await step('five-item-learn-drop', async () => {
    await tab('Learn');
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Start' }).click();
    await startDrop();
    for (let item = 0; item < 5; item++) {
      await page.locator('.learn-drop-head').getByText(`${item + 1} / 5`).waitFor();
      await answerLearnItem();
      await page.locator('.learn-feedback').waitFor();
      if (item === 1) { await page.reload(); await page.locator('.learn-feedback').waitFor(); }
      await advanceLearn();
    }
    await page.getByRole('heading', { name: "That's today's drop" }).waitFor();
    await dot('Learn', true);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.reload();
    await page.getByRole('region', { name: 'How your learning is holding' }).waitFor();
  });
  await step('side-quest', async () => {
    await tab('Plan');
    const quest = page.getByRole('region', { name: 'Side quests' });
    await quest.getByRole('button', { name: 'Done', exact: true }).first().click();
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
    await page.getByLabel('Night deck nudge').click();
    await page.getByLabel('Morning first step nudge').click();
    await waitForNudgesOff();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.motion === 'reduce');
    await page.locator('.about-app summary').click();
    await page.getByRole('button', { name: 'Review content' }).click();
    await page.getByRole('heading', { name: 'Review content' }).waitFor();
    await page.locator('.content-review-item').first().getByRole('button', { name: 'Looks right' }).click();
    await page.reload();
    await page.locator('.content-review-item').first().getByText('Looks right').waitFor();
    await nav('you/settings');
    await waitForNudgesOff();
    await page.getByRole('button', { name: /Backup and restore/ }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup' }).click();
    const backupPath = await (await download).path();
    if (!backupPath) throw new Error('Backup was not downloaded');
    await nav('plan');
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Temporary after export');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Temporary after export' }).waitFor();
    await nav('you/backup');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose restore file' }).click();
    await (await chooser).setFiles(backupPath);
    await page.getByRole('button', { name: 'Confirm restore' }).click();
    await page.getByRole('status').filter({ hasText: 'Restore complete' }).waitFor();
    await nav('plan');
    await page.getByRole('region', { name: 'Today' }).getByRole('button', { name: 'Write outline' }).waitFor();
    for (const area of ['Plan', 'Train', 'Learn', 'Mind']) await dot(area, true);
    if (await page.getByRole('button', { name: 'Temporary after export' }).count()) report.lostState.push({ viewport: viewport.width, item: 'Restore kept task created after export' });
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.motion === 'reduce');
    await tab('You');
    await page.getByRole('button', { name: /Settings/ }).click();
    await waitForNudgesOff();
  });
  await page.clock.setFixedTime(new Date('2026-10-19T23:40:00+05:30'));
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
    for (let item = 0; item < 3 && await page.locator('.learn-drop-head').isVisible(); item++) {
      await answerLearnItem();
      await advanceLearn();
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
  await page.clock.setFixedTime(new Date('2026-10-20T01:45:00+05:30'));
  await step('after-bedtime-review-only-and-mind-zero', async () => {
    await nav('mind');
    await page.getByRole('status').filter({ hasText: 'After bedtime, Mind earns 0 XP.' }).waitFor();
    await nav('night');
    await page.getByRole('button', { name: 'Go to card 2: Night drop' }).click();
    await page.locator('.learn-stop, .learn-drop-head').first().waitFor();
    await nav('learn');
    await page.getByRole('heading', { name: 'Learn', exact: true }).waitFor();
    await page.locator('.learn-today').waitFor();
    const due = page.getByRole('button', { name: /Idea checks/ });
    if (await due.count()) {
      await due.click();
      await page.locator('.learn-drop-head, .learn-stop').first().waitFor();
      const modes = await page.evaluate(() => new Promise((resolve, reject) => {
        const open = indexedDB.open('nandi');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result, request = db.transaction('learnDrops').objectStore('learnDrops').getAll();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => { const rows = request.result.filter(row => row.id.startsWith('drop:practice:')); db.close(); resolve(rows.at(-1)?.drop.items.map(item => item.mode) ?? []); };
        };
      }));
      if (modes.some(mode => mode !== 'review')) throw new Error(`New Learn item after bedtime: ${modes.join(',')}`);
    } else report.notExercised.push({ viewport: viewport.width, item: 'After-bedtime Learn reviews', reason: 'No due Learn ideas in this profile' });
  });
  await step('night-closes-at-04', async () => {
    await page.clock.setSystemTime(new Date('2026-10-20T03:59:00+05:30'));
    await nav('night');
    await page.getByRole('article', { name: 'Tonight card' }).waitFor();
    await page.clock.fastForward(2 * 60_000);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForURL(/#plan$/);
  });
  await page.clock.setFixedTime(new Date('2026-10-20T08:30:00+05:30'));
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
  await step('close-recap-sheet', async () => { await page.getByRole('dialog', { name: 'Weekly recap preview' }).getByRole('button', { name: 'Not now' }).click(); });
  await step('day2-economy-and-shop', async () => {
    await tab('You');
    const season = page.getByRole('region', { name: 'Your season' });
    await season.getByText(/day streak/).waitFor();
    await season.getByText(/of 4 Hat-tricks/).waitFor();
    await season.getByText('Season 1 starts Monday 2 Nov').waitFor();
    await season.getByRole('button', { name: 'Shop' }).click();
    await page.getByRole('heading', { name: 'Shop' }).waitFor();
    for (const item of ['Streak freeze', 'Linen theme', 'Soft sounds', 'Paths practice pack']) await page.getByRole('heading', { name: item }).waitFor();
    if (await page.getByRole('button', { name: '50 Shards', exact: true }).isDisabled()) report.notExercised.push({ viewport: viewport.width, item: 'Day 2 freeze purchase', reason: 'Two starting freezes are still ready' });
    if (await page.getByRole('button', { name: '400 Shards', exact: true }).isDisabled()) report.notExercised.push({ viewport: viewport.width, item: 'Day 2 theme purchase', reason: 'The two-day profile has insufficient Shards' });
  });
  await page.clock.setFixedTime(new Date('2026-11-02T09:00:00+05:30'));
  await step('season-one-ladder-and-rival', async () => {
    await nav('you');
    const season = page.getByRole('region', { name: 'Your season' });
    await season.getByRole('button', { name: 'View the ladder' }).click();
    const rank = (await page.locator('.ladder-seat.you strong').innerText()).trim();
    if (!/^#\d+$/.test(rank)) throw new Error(`Invalid season rank: ${rank}`);
    await nav('you');
    await season.getByText(`${rank} of 500`, { exact: false }).waitFor();
    await season.getByText(/sits just above/).waitFor();
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
  await context.close();
  const spare = await browser.newContext({ viewport, isMobile: true, hasTouch: true, timezoneId: 'Asia/Kolkata' });
  const sparePage = await spare.newPage();
  sparePage.setDefaultTimeout(8_000);
  sparePage.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ viewport: viewport.width, profile: 'missed-day', text: message.text() }); });
  sparePage.on('pageerror', error => report.pageErrors.push({ viewport: viewport.width, profile: 'missed-day', error: String(error) }));
  sparePage.on('requestfailed', request => report.failedRequests.push({ viewport: viewport.width, profile: 'missed-day', url: request.url(), error: request.failure()?.errorText }));
  sparePage.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ viewport: viewport.width, profile: 'missed-day', url: response.url(), status: response.status() }); });
  await sparePage.clock.install({ time: new Date('2026-10-19T12:00:00+05:30') });
  try {
    await sparePage.goto(`${base}/?e2e#plan`);
    await sparePage.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Unfinished plan');
    await sparePage.getByRole('button', { name: 'Add task', exact: true }).click();
    await sparePage.clock.setFixedTime(new Date('2026-10-19T23:40:00+05:30'));
    await sparePage.goto(`${base}/?e2e#night`);
    await sparePage.getByRole('button', { name: 'Go to card 5: Phone-down move' }).click();
    await sparePage.getByRole('article', { name: 'Phone-down move card' }).getByRole('button', { name: /do it/ }).click();
    await sparePage.getByRole('region', { name: 'Now deck' }).getByRole('button', { name: 'Next', exact: true }).click();
    await sparePage.getByRole('button', { name: 'Lights-out check-in' }).waitFor();
    await sparePage.clock.setFixedTime(new Date('2026-10-20T08:30:00+05:30'));
    await sparePage.goto(`${base}/?e2e#plan`);
    await sparePage.getByRole('region', { name: 'Last night' }).waitFor();
    await sparePage.getByRole('region', { name: 'Fresh start' }).waitFor();
    await sparePage.getByRole('region', { name: 'Last night' }).getByLabel('Phone-down time').selectOption('23:30');
    await sparePage.getByRole('region', { name: 'Last night' }).getByLabel('Reels time').selectOption('none');
    await sparePage.getByRole('region', { name: 'Last night' }).getByRole('button', { name: 'Save last night' }).click();
    await sparePage.reload();
    if (await sparePage.getByRole('region', { name: 'Last night' }).count()) report.lostState.push({ viewport: viewport.width, item: 'Morning back-fill' });
    report.steps.push({ viewport: viewport.width, name: 'missed-day-fresh-start-and-backfill', result: 'pass' });
  } catch (error) {
    report.steps.push({ viewport: viewport.width, name: 'missed-day-fresh-start-and-backfill', result: 'fail', error: String(error) });
    await sparePage.screenshot({ path: `${out}/${viewport.width}-missed-day.png` }).catch(() => {});
  }
  await spare.close();
  }
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(`Report: ${out}/report.json`);
  process.exitCode = report.steps.some(item => item.result === 'fail') || report.lostState.length || report.pageErrors.length || report.unhandledPromises.length ? 1 : 0;
} finally {
  clearTimeout(watchdog);
  if (browser) await browser.close();
  server.kill();
}
