/** Local-only visual tour. Run with: node_modules/.bin/tsx.cmd scripts/ux-tour.ts before|after */
import { mkdir, readFile } from 'node:fs/promises';
import { chromium, type Page } from '@playwright/test';
import { createServer } from 'vite';
import { PROGRAMS } from '../src/core/train/programs';

const phase = process.argv[2] === 'after' ? 'after' : 'before';
const root = `.ux-audit/${phase}`;
const at = '2026-10-17T12:00:00+05:30';
const base = 'http://127.0.0.1:4187';
const routes = [
  ['now-day', 'now'], ['plan', 'plan'], ['plan-morning', 'plan/morning'],
  ['plan-shutdown', 'plan/shutdown'], ['plan-review', 'plan/review'],
  ['you', 'you'], ['you-settings', 'you/settings'], ['you-learn', 'you/learn'],
  ['you-mind', 'you/mind'], ['you-mind-practice', 'you/mind/practice'],
  ['you-mind-case', 'you/mind/case'], ['you-mind-board', 'you/mind/board'],
  ['you-mind-reviews', 'you/mind/reviews'], ['you-train', 'you/train'],
  ['you-train-history', 'you/train/history'], ['you-train-metrics', 'you/train'],
  ['you-train-session', 'you/train/workout'], ['you-night', 'you/night'],
  ['you-backup', 'you/backup'],
] as const;

async function seed(page: Page) {
  await page.evaluate(async ({ planned, topicIds }) => {
    const today = '2026-10-17';
    const tomorrow = '2026-10-18';
    const now = new Date('2026-10-17T12:00:00+05:30').getTime();
    const meta = { updatedAt: now, deleted: 0, deviceId: 'ux-tour' };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const rows: Record<string, Record<string, unknown>[]> = {
      tasks: [
        { id: 'ux-task-1', title: 'Write the project outline', status: 'planned', dayKey: today, size: 'M', plannedSize: 'M', estimateMin: 35, postponeCount: 0, mustOrCould: 'must', scheduledStart: now + 3600000, firstStep: 'Open the notes', ...meta },
        { id: 'ux-task-2', title: 'Reply to the team', status: 'planned', dayKey: today, size: 'S', plannedSize: 'S', estimateMin: 15, postponeCount: 0, mustOrCould: 'could', scheduledStart: now + 7200000, ...meta },
        { id: 'ux-task-3', title: 'Read for twenty minutes', status: 'done', dayKey: today, size: 'S', plannedSize: 'S', estimateMin: 20, postponeCount: 0, doneAt: now - 3600000, ...meta },
        { id: 'ux-task-4', title: 'Prepare Monday notes', status: 'planned', dayKey: tomorrow, size: 'M', plannedSize: 'M', estimateMin: 30, postponeCount: 0, scheduledStart: now + 86400000, ...meta },
      ],
      programs: [{ id: 'train-program', track: 'bodyweight', equipment: { gym: false, dumbbells: false, resistanceBand: false, sturdyAnchor: false, barbell: null }, days: [1, 3, 5], weeklyTarget: 3, startedAt: now - 864000000, placement: { squat: 1, hinge: 1, 'push-up': 1, row: 1, 'core-anti-ext': 1, 'core-anti-rot': 1, 'core-ext': 1 }, ...meta }],
      sessions: [
        { id: 'ux-session-done', dayKey: '2026-10-15', status: 'completed', templateKey: 'hostel-bodyweight', startedAt: now - 172800000, endedAt: now - 172500000, ...meta },
        { id: 'ux-session-active', dayKey: today, status: 'active', templateKey: 'hostel-bodyweight', startedAt: now - 900000, planned, ...meta },
      ],
      puzzleRuns: [
        { id: 'ux-sudoku', type: 'sudoku', dayKey: '2026-10-15', diff: 'easy', result: 'solved', solveMs: 125000, finishedAt: now - 172800000, ...meta },
        { id: 'ux-crowns', type: 'crowns', dayKey: '2026-10-16', diff: 'easy', result: 'solved', solveMs: 182000, finishedAt: now - 86400000, ...meta },
        { id: `daily:${today}:mystery`, type: 'mystery', dayKey: today, result: 'solved', daily: true, finishedAt: now - 7200000, solveMs: 205000, tries: 1, hintsUsed: 0, ...meta },
      ],
      quests: [
        { id: 'ux-quest-1', sourceId: 'solo-walk', week: '2026-W42', title: 'Take a solo walk without your phone', kind: 'once', target: 1, unit: '', step: 1, progress: 1, tapIds: ['ux-walk'], status: 'done', custom: false, ...meta },
        { id: 'ux-quest-2', sourceId: 'library', week: '2026-W42', title: 'Visit a library or bookshop and pick one book', kind: 'once', target: 1, unit: '', step: 1, progress: 0, tapIds: [], status: 'active', custom: false, ...meta },
      ],
      dailyLog: ['2026-10-14', '2026-10-15', '2026-10-16', today].map((dayKey, index) => ({ dayKey, planDone: true, shutdownDone: index < 3, bedtimeTarget: now - (3 - index) * 86400000 - 3600000, lightsOutAt: now - (3 - index) * 86400000 - 4200000, ...meta })),
      settings: [
        { key: 'night.plan', value: { cue: 'getting into bed with my phone', action: 'read 5 pages' }, ...meta },
        { key: 'planner.bedtime', value: '23:00', ...meta },
        { key: 'planner.shutdown', value: '22:00', ...meta },
        { key: 'learn.selectedTopics', value: topicIds, ...meta },
      ],
      ledger: ['2026-10-14', '2026-10-15', '2026-10-16'].flatMap((dayKey, day) => topicIds.map((topic, index) => ({ id: `ux-learn-${day}-${index}`, dayKey, mode: 'learn', kind: 'learn-answer', refId: topic, inputs: { topic, correct: true }, ...meta }))),
    };
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(Object.keys(rows), 'readwrite');
      for (const [name, items] of Object.entries(rows)) for (const item of items) transaction.objectStore(name).put(item);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, { planned: PROGRAMS['hostel-bodyweight']!.exercises, topicIds: await Promise.all(['how-things-work', 'money-markets', 'psychology'].map(async slug => {
    const pack = JSON.parse(await readFile(`content/topics/topic.${slug}.json`, 'utf8')) as { body: { topic: { id: string } } };
    return pack.body.topic.id;
  })) });
}

const server = await createServer({ server: { host: '127.0.0.1', port: 4187, strictPort: true }, configFile: 'vite.config.ts' });
await server.listen();
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const scheme of ['dark', 'light'] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: scheme, timezoneId: 'Asia/Kolkata' });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(at));
    await page.goto(`${base}/?e2e#now`);
    await page.locator('.topbar').waitFor();
    await seed(page);
    const folder = `${root}/${scheme}`;
    await mkdir(folder, { recursive: true });
    const errors: string[] = [];
    for (const [name, route] of routes) {
      try {
        await page.goto(`${base}/?e2e#${route}`);
        await page.locator('.topbar').waitFor();
        if (name === 'you-mind-case') await page.locator('.mind-case h1').waitFor({ timeout: 30_000 });
        if (name === 'you-mind-board') await page.locator('.mind-grid, .mind-result').first().waitFor({ timeout: 30_000 });
        if (name === 'you-mind-reviews') await page.locator('.mind-review h1').waitFor({ timeout: 30_000 });
        await page.waitForTimeout(450);
        if (name === 'you-train-metrics') await page.getByRole('heading', { name: 'Progression' }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${folder}/${name}.png`, fullPage: name !== 'you-train-metrics', animations: 'disabled' });
        console.log(`${scheme} ${name}`);
      } catch (error) { errors.push(`${scheme} ${name}: ${String(error)}`); }
    }
    await page.clock.setFixedTime(new Date('2026-10-17T23:30:00+05:30'));
    await page.goto(`${base}/?e2e#now`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${folder}/now-night.png`, fullPage: true, animations: 'disabled' });
    await page.clock.setFixedTime(new Date(at));
    await page.goto(`${base}/?e2e#you`);
    await page.getByRole('button', { name: 'Share my week' }).click();
    await page.getByRole('dialog', { name: 'Weekly recap preview' }).getByRole('img').waitFor({ timeout: 20_000 });
    await page.screenshot({ path: `${folder}/recap-share.png`, animations: 'disabled' });
    await context.close();
    if (errors.length) throw new Error(errors.join('\n'));
  }
} finally { await browser.close(); await server.close(); }
