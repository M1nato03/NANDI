import { expect, test, type Page } from '@playwright/test';
import { answerRight, answerWrong, walkLesson } from './learn-helpers';

// Spec 36 v2: effort pays in Train, Mind and Read. The economy itself is unit-tested; this checks the real screens agree.
const WEDNESDAY = new Date('2026-11-04T10:00:00');
const totalXp = async (page: Page) => {
  await page.goto('/?e2e#you');
  const text = await page.getByText(/^[\d,]+ XP in all$/).innerText();
  return Number(text.replace(/[^\d]/g, ''));
};

test('a new chapter pays for the ideas it taught and the right first answers, and says so', async ({ page }) => {
  test.setTimeout(150_000); // the chapter walks every one of its lessons
  // Reduced motion: with the clock installed, animation frames wait on it, so a moving button never settles.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: WEDNESDAY });
  const before = await totalXp(page);
  await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
  await expect(page.locator('.step-lesson').or(page.getByText('Chapter check · three questions'))).toBeVisible();
  let steps = 0;
  while (await page.locator('.step-lesson').isVisible()) { await walkLesson(page, 'how-things-work', true); steps += 1; }
  await answerRight(page, 'how-things-work');
  // The middle question is answered wrong when it is a choice question (an order or match question is answered right).
  const right = (await answerWrong(page, 'how-things-work')) ? 2 : 3;
  await answerRight(page, 'how-things-work');
  const pay = Math.min(40, 5 + 5 * steps + 5 * right);
  await expect(page.locator('.read-earned')).toHaveText(`${steps} new ${steps === 1 ? 'idea' : 'ideas'}, ${right} right · +${pay} XP`);
  // Its toast carries the same number: the drop's 15 never paid first, so the whole pay arrives with the chapter.
  await expect(page.locator('.economy-toast')).toContainText(`+${pay} XP today`);
  // The chapter was read as the day's drop, so it pays in place of the drop's 15, never on top.
  await expect.poll(() => totalXp(page)).toBe(before + pay);
  // Opening the finished chapter again pays nothing more.
  await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
  await expect(page.locator('.read-done-card')).toBeVisible();
  expect(await totalXp(page)).toBe(before + pay);
});
