import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { walkIdea } from './learn-helpers';

const pack = JSON.parse(readFileSync('content/topics/topic.how-things-work.json', 'utf8')) as { body: { modules: { concepts: { steps?: unknown[] }[] }[] } };

// Spec 36 v2: effort pays in Train, Mind and Read. The economy itself is unit-tested; this checks the real screens agree.
const WEDNESDAY = new Date('2026-11-04T10:00:00');
const totalXp = async (page: Page) => {
  await page.goto('/?e2e#you');
  const text = await page.getByText(/^[\d,]+ XP in all$/).innerText();
  return Number(text.replace(/[^\d]/g, ''));
};

test('spec 41: an idea-sitting pays its share of the chapter (the day\'s drop never less than 15), and says so', async ({ page }) => {
  test.setTimeout(150_000);
  // Reduced motion: with the clock installed, animation frames wait on it, so a moving button never settles.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: WEDNESDAY });
  const before = await totalXp(page);
  await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
  const first = pack.body.modules[0]!.concepts.find(concept => concept.steps?.length)!;
  await walkIdea(page, 'how-things-work');
  // The first sitting was the day's drop: its chapter pay (5 base + 5 a step), never less than the drop's 15.
  const pay = Math.max(15, 5 + 5 * first.steps!.length);
  await expect(page.locator('.idea-end .read-earned')).toHaveText(`+${pay} XP`);
  await expect.poll(() => totalXp(page)).toBe(before + pay);
  // A second sitting the same day pays its steps, with no second drop.
  const second = pack.body.modules[0]!.concepts.filter(concept => concept.steps?.length)[1]!;
  await page.goto('/?e2e#read/chapter/how-things-work/how-things-work-ch1');
  await walkIdea(page, 'how-things-work');
  const more = Math.min(40 - (5 + 5 * first.steps!.length), 5 * second.steps!.length);
  await expect.poll(() => totalXp(page)).toBe(before + pay + more);
});
