import { expect, test, type Page } from '@playwright/test';
import { textAt200 } from './helpers/text';

// Spec 43 (starter): the practice loop on the neutral test fixture (e2e build only, route read/skill-demo). One stage per
// screen, a real stop, specific feedback for near misses, a self-check that is never marked, and the answer saved as
// a private notebook page (no notebook screen yet).
const NOON = new Date('2026-11-03T12:00:00');
const open = async (page: Page, query = '') => {
  await page.clock.setFixedTime(NOON);
  await page.goto(`/?e2e${query}#read/skill-demo`);
  await expect(page.getByRole('region', { name: 'Practice' })).toBeVisible();
};
const rows = (page: Page, table: string) => page.evaluate(async name => {
  const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
  const all = await new Promise<Record<string, unknown>[]>(resolve => { const request = database.transaction(name).objectStore(name).getAll(); request.onsuccess = () => resolve(request.result as never); });
  database.close();
  return all;
}, table);
const practice = (page: Page) => page.getByRole('region', { name: 'Practice' });
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('a choice lesson: worked example, a near miss with its own feedback, a wrong then revised fresh answer, saved', async ({ page }) => {
  await open(page);
  const screen = practice(page);
  await expect(screen.getByRole('heading', { name: 'See one done' })).toBeVisible();
  await expect(screen).toContainText('step 1 of 5');
  await expect(screen).toContainText('Could you send me Monday\'s notes?');
  await screen.getByRole('button', { name: 'Change one part' }).click();
  await expect(screen.getByRole('heading', { name: 'Change one part' })).toBeFocused();
  await expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
  await screen.getByRole('radio', { name: 'I was not well on Monday and Tuesday.' }).click();
  await screen.getByRole('button', { name: 'Check' }).click();
  await expect(screen.getByRole('status')).toHaveText('Nearly. That is the reason, not the ask. Put the ask first, then the reason.');
  await screen.getByRole('button', { name: 'Try a fresh one' }).click();
  await expect(screen.getByRole('heading', { name: 'Your turn' })).toBeVisible();
  await screen.getByRole('radio', { name: 'Sorry to bother you.' }).click();
  await screen.getByRole('button', { name: 'Check' }).click();
  await expect(screen.getByRole('heading', { name: 'Not yet' })).toBeVisible();
  await expect(screen.getByRole('status')).toHaveText('A polite opener is fine later; the ask comes first.');
  await expect(screen).toContainText('A clear answer: Could I borrow the lab key before 3 pm?');
  await screen.getByRole('button', { name: 'Revise my answer' }).click();
  await screen.getByRole('radio', { name: 'Could I borrow the lab key before 3 pm?' }).click();
  await screen.getByRole('button', { name: 'Check' }).click();
  await expect(screen.getByRole('heading', { name: 'Right' })).toBeVisible();
  await expect(screen).not.toContainText('A clear answer:');
  await screen.getByLabel('The ask is in the first line.').check();
  await noSideScroll(page);
  await screen.getByRole('button', { name: 'Save to My work' }).click();
  await expect(screen.getByRole('heading', { name: 'Saved.' })).toBeVisible();
  await expect(screen).toContainText('Use it today: Before you send your next message, move the ask to the first line.');
  // The page, its first version (the baseline) and the finished run, with the retry 3 days on.
  const [pageRow] = await rows(page, 'notebookPages');
  expect(pageRow).toMatchObject({ trackId: 'practice-fixture', lessonId: 'say-1', deleted: 0 });
  const [version] = await rows(page, 'notebookVersions');
  expect(version).toMatchObject({ pageId: pageRow!.id, version: 1, answer: 'Could I borrow the lab key before 3 pm?', status: 'practised' });
  expect(pageRow!.baselineVersionId).toBe(version!.id);
  expect((version!.checklist as { ticked: boolean }[]).map(item => item.ticked)).toEqual([true, false, false]);
  const [run] = await rows(page, 'skillAttempts');
  expect(run).toMatchObject({ status: 'finished', dayKey: '2026-11-03', retryDue: '2026-11-06', change: { result: 'near' }, fresh: { result: 'right' }, pageId: pageRow!.id });
});

test('an order lesson and a phrase lesson check part by part and phrase variants', async ({ page }) => {
  await open(page, '&lesson=say-2');
  let screen = practice(page);
  await screen.getByRole('button', { name: 'Change one part' }).click();
  for (const part of ['Turn left at the notice board.', 'Walk out of the canteen.', 'Enter the second building on the left.']) await screen.getByRole('button', { name: part }).click();
  await screen.getByRole('button', { name: 'Check' }).click();
  await expect(screen.getByRole('status')).toContainText('They cannot turn at the board before they leave the canteen.');
  await open(page, '&lesson=say-3');
  screen = practice(page);
  await screen.getByRole('button', { name: 'Change one part' }).click();
  await screen.getByLabel('Your answer').fill('  room 12. ');
  await screen.getByRole('button', { name: 'Check' }).click();
  await expect(screen.getByRole('status')).toHaveText('Right. Clear. The place is named in full.');
  await screen.getByRole('button', { name: 'Try a fresh one' }).click();
  await screen.getByLabel('Your answer').fill('6');
  await screen.getByRole('button', { name: 'Check' }).click();
  await expect(screen.getByRole('status')).toHaveText('Add "pm", so nobody reads it as 6 in the morning.');
});

test('a self-check is the learner\'s own words: never marked, ticked against the checklist, and saved', async ({ page }) => {
  await open(page, '&variant=1');
  const screen = practice(page);
  await screen.getByRole('button', { name: 'Change one part' }).click();
  await screen.getByRole('radio', { name: 'Could you send me Tuesday\'s notes?' }).click();
  await screen.getByRole('button', { name: 'Check' }).click();
  await screen.getByRole('button', { name: 'Try a fresh one' }).click();
  await expect(screen.getByRole('button', { name: 'Done writing' })).toBeDisabled();
  await screen.getByLabel('In your own words').fill('Could you water my plants on Saturday and Sunday? I am away till Monday.');
  await screen.getByRole('button', { name: 'Done writing' }).click();
  await expect(screen.getByRole('heading', { name: 'Check it yourself' })).toBeVisible();
  await expect(screen).toContainText('NANDI does not mark it');
  await expect(screen).not.toContainText(/Right|Not yet|Nearly/);
  await screen.getByLabel('The ask is in the first line.').check();
  await screen.getByLabel('It says when.').check();
  await screen.getByRole('button', { name: 'Save to My work' }).click();
  await expect(screen.getByRole('heading', { name: 'Saved.' })).toBeVisible();
  const [version] = await rows(page, 'notebookVersions');
  expect(version!.answer).toBe('Could you water my plants on Saturday and Sunday? I am away till Monday.');
  const [run] = await rows(page, 'skillAttempts');
  // The words live on the page only; the run keeps the result.
  expect(run!.fresh).toEqual({ result: 'self' });
});

test('stop for now is on every stage and ends without saving', async ({ page }) => {
  await open(page);
  const screen = practice(page);
  await screen.getByRole('button', { name: 'Change one part' }).click();
  await screen.getByRole('button', { name: 'Stop for now' }).click();
  await expect(page.getByText('Stopped.')).toBeVisible();
  expect(await rows(page, 'notebookPages')).toEqual([]);
  expect((await rows(page, 'skillAttempts')).map(row => row.status)).toEqual(['started']);
});

test('reads at 360 and at 200% text without spilling, with 44px targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const screen = practice(page);
  await screen.getByRole('button', { name: 'Change one part' }).click();
  await textAt200(page);
  await noSideScroll(page);
  for (const target of await screen.getByRole('radio').all()) expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
