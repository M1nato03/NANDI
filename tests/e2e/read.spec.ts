import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { answerRight, seedTaughtTopics, walkLesson } from './learn-helpers';
import { fixtureTopic } from '../../src/core/learn/engine/fixtures/topic';

// Spec 33 Phase 1: the book engine. Read replaces Learn and Mind; the six topics are NANDI Originals in chapters.
const NOON = new Date('2026-10-27T12:00:00');
const pack = (topicId: string) => JSON.parse(readFileSync(`content/topics/topic.${topicId}.json`, 'utf8')) as { body: { book: { title: string }; modules: { id: string; title: string; concepts: { id: string; title: string; recall?: { pieces: string[] } }[] }[] } };
const ledgerIds = (page: Page, prefix: string) => page.evaluate(async start => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ id: string }[]>(resolve => { const request = database.transaction('ledger').objectStore('ledger').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.map(row => row.id).filter(id => id.startsWith(start)).sort();
}, prefix);
const dropIds = (page: Page) => page.evaluate(async () => {
  const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const rows = await new Promise<{ id: string; drop: { chapter?: { moduleId: string } } }[]>(resolve => { const request = database.transaction('learnDrops').objectStore('learnDrops').getAll(); request.onsuccess = () => resolve(request.result); });
  database.close();
  return rows.filter(row => row.drop.chapter).map(row => `${row.id.split(':').slice(0, 2).join(':')}|${row.drop.chapter!.moduleId}`).sort();
});

test('Read: the tabs are Plan, Read, Yatra and You; Continue sits above the fold; no Games fold', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#read');
  await expect(page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link')).toHaveText(['Yatra', 'Plan', 'Read', 'You']);
  await expect(page.getByRole('navigation', { name: 'Today status' }).getByRole('button')).toHaveText(['Plan', 'Read', 'Night']);
  await expect(page.getByRole('heading', { name: 'Your books', level: 1 })).toBeVisible();
  const resume = page.getByRole('region', { name: 'Continue' });
  await expect(resume).toContainText(pack('psychology').body.book.title);
  await expect(resume.getByRole('button', { name: 'Start' })).toBeVisible();
  const box = (await resume.getByRole('button', { name: 'Start' }).boundingBox())!;
  expect(box.y + box.height).toBeLessThan(page.viewportSize()!.height - 64);
  await expect(page.getByRole('region', { name: 'NANDI Originals' }).getByRole('button')).toHaveCount(6);
  // The first classic (spec 33 §6): How to Win Friends, public domain in India.
  await expect(page.getByRole('region', { name: 'Classics' }).getByRole('button', { name: /^How to Win Friends/ })).toBeVisible();
  // Spec 34: Kapi's shelf moved to Yatra; Read has no Games fold.
  await expect(page.locator('details.read-games')).toHaveCount(0);
});

/** A move inside the open page (no reload): the app routes on the hash, and the caller waits on the new screen. */
async function openHash(page: Page, hash: string) {
  await page.evaluate(next => { location.hash = `#${next}`; }, hash);
  await expect(page).toHaveURL(new RegExp(`#${hash.replaceAll('/', '\\/')}$`));
}

test('old Learn and Mind links still open, now inside Read', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  for (const [from, to] of [['learn', 'read'], ['learn/drop', 'read/drop'], ['mind', 'yatra/mind'], ['mind/practice', 'yatra/mind/practice'], ['you/learn', 'read']] as const) {
    await page.goto(`/?e2e#${from}`);
    await expect(page).toHaveURL(new RegExp(`#${to.replaceAll('/', '\\/')}$`));
  }
  await page.goto('/?e2e#you');
  await expect(page.getByRole('button', { name: /^Train \(paused\)/ })).toHaveCount(0);
});

test('a chapter reads its lessons as the day\'s drop, then its quiz check, then the done card; a second chapter keeps its own drop', async ({ page }) => {
  test.setTimeout(150_000); // nine lessons and three questions
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#read/book/how-things-work');
  const book = pack('how-things-work');
  await expect(page.getByRole('heading', { name: book.body.book.title, level: 1 })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Chapters' }).getByRole('button', { name: /^Chapter \d: .*, Not started$/ })).toHaveCount(3);
  await page.getByRole('button', { name: 'Start · Chapter 1' }).click();
  await expect(page).toHaveURL(/#read\/chapter\/how-things-work\/how-things-work-ch1$/);
  await walkLesson(page, 'how-things-work', true);
  // Half-read: the book page shows it in progress, and Continue goes back to where it stopped.
  await page.goto('/?e2e#read/book/how-things-work');
  await expect(page.getByRole('button', { name: /^Chapter 1: Things that fly, In progress$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Continue · Chapter 1' }).click();
  for (let lesson = 0; lesson < 8; lesson++) await walkLesson(page, 'how-things-work', true);
  await expect(page.getByText('Chapter check · three questions')).toBeVisible();
  for (let question = 0; question < 3; question++) await answerRight(page, 'how-things-work');
  const done = page.locator('.read-done-card');
  await expect(done).toContainText('Chapter 1 done');
  await expect.poll(() => ledgerIds(page, 'chapter:')).toEqual(['chapter:how-things-work:how-things-work-ch1']);
  // The first chapter of the day was the day's drop; the next one today keeps its own id (one drop's XP a day).
  await done.getByRole('button', { name: 'Next chapter' }).click();
  await walkLesson(page, 'how-things-work', true);
  expect(await dropIds(page)).toEqual(['drop:chapter|how-things-work-ch2', 'drop:check|how-things-work-ch1', 'drop:daily|how-things-work-ch1']);
});

test('a finished book offers the next one; the recall and Chiku checks finish their chapters too', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#read');
  await seedTaughtTopics(page, ['history-civilisations', 'money-markets', 'psychology']);
  // Quiz checks, both chapters: the book is finished.
  for (const chapter of ['history-civilisations-ch1', 'history-civilisations-ch2']) {
    await openHash(page, `read/chapter/history-civilisations/${chapter}`);
    await expect(page.getByText('Chapter check · three questions')).toBeVisible();
    for (let question = 0; question < 3; question++) await answerRight(page, 'history-civilisations');
  }
  await expect(page.locator('.read-done-card')).toContainText(`You finished ${pack('history-civilisations').body.book.title}.`);
  await expect(page.getByRole('button', { name: /^Next book: / })).toBeVisible();
  // Recall: Moti's haveli rebuilds the chapter's idea from its three pieces.
  const money = pack('money-markets').body.modules[0]!;
  const idea = money.concepts.find(concept => concept.recall)!;
  await openHash(page, 'read/chapter/money-markets/money-markets-ch1');
  await page.getByRole('button', { name: idea.title, exact: true }).click();
  for (const piece of idea.recall!.pieces) await page.locator('.haveli-tiles').getByRole('button', { name: piece, exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('.read-done-card')).toContainText('Chapter 1 done');
  // Chiku: the chapter's scene (skipping it still finishes the chapter; nothing is lost).
  await openHash(page, 'read/chapter/psychology/psychology-ch1');
  await page.locator('.chiku-skip').click();
  await expect(page.locator('.read-done-card')).toContainText('Chapter 1 done');
  await expect.poll(() => ledgerIds(page, 'chapter:')).toEqual(['chapter:history-civilisations:history-civilisations-ch1', 'chapter:history-civilisations:history-civilisations-ch2', 'chapter:money-markets:money-markets-ch1', 'chapter:psychology:psychology-ch1']);
  await page.goto('/?e2e#read');
  await expect(page.getByRole('region', { name: 'Finished' })).toContainText(pack('history-civilisations').body.book.title);
});

test('after bedtime no new chapter starts; the rest waits for tomorrow', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-28T02:30:00')); // after the default bedtime (01:30)
  // After shutdown the app opens on the night deck (once its settings load); leaving it for a chapter shows the
  // chapter waiting.
  await page.goto('/?e2e#night');
  // The deck is ready once its settings loaded; leaving it then holds, and the chapter opens from there.
  await page.getByRole('button', { name: 'Leave night deck' }).click();
  await expect(page).not.toHaveURL(/#night$/);
  await openHash(page, 'read/chapter/how-things-work/how-things-work-ch1');
  await expect(page.locator('.read-wait')).toContainText('The rest of this chapter opens tomorrow.');
  await expect(page.locator('.step-lesson')).toHaveCount(0);
});

test('a private book imports on You, shows on its own shelf, survives a reload, and Remove deletes it', async ({ page }) => {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#you');
  const mine = { ...fixtureTopic, body: { ...fixtureTopic.body, book: { ...fixtureTopic.body.book!, title: 'My Seed Notes', rights: 'private' } } };
  await page.locator('.you-private-import input[type=file]').setInputFiles({ name: 'mine.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(mine)) });
  await expect(page.getByRole('region', { name: 'Private books' })).toContainText('My Seed Notes is on your Private shelf.');
  // A bundled book (not private) is refused.
  await page.locator('.you-private-import input[type=file]').setInputFiles({ name: 'open.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixtureTopic)) });
  await expect(page.getByRole('region', { name: 'Private books' })).toContainText('Only a book marked private can be imported here.');
  await page.goto('/?e2e#read');
  await expect(page.getByRole('region', { name: 'Private' })).toContainText('My Seed Notes');
  await page.reload();
  await page.getByRole('region', { name: 'Private' }).getByRole('button', { name: /^My Seed Notes/ }).click();
  await expect(page.getByText('Private copy on this phone')).toBeVisible();
  await page.goto('/?e2e#you');
  await page.getByRole('button', { name: 'Remove My Seed Notes' }).click();
  await page.getByRole('button', { name: 'Remove it' }).click();
  await page.goto('/?e2e#read');
  await expect(page.getByRole('region', { name: 'Library' })).not.toContainText('My Seed Notes');
});
