import { expect, test, type Page } from '@playwright/test';
import { seedTaughtTopics } from './learn-helpers';
import { seedRecapWeek } from './recap-seed';

// Not covered here: groups 1-5 belong to stage 2; rows 202-249 are proposed.
// Rows 84-85, 89-90, 95, 98-100, 104, 111, 119,
// 129, 139, 156-157, 176, 178-179,
// 181, 192-195, 199-201 need prior progress, a native host, a file, a PIN,
// or an entry that is absent from the stage-1 door; see g1-report.md.
const NOON = new Date('2026-11-06T12:00:00');
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Main tabs' });
async function door(page: Page, id: 'read' | 'remember' | 'play' | 'train' | 'sleep') {
  await tabs(page).getByRole('link', { name: 'Grow' }).click();
  await page.getByTestId(`door-${id}`).click();
}
async function you(page: Page) { await tabs(page).getByRole('link', { name: 'You' }).click(); }
async function cold(page: Page) {
  await page.clock.setFixedTime(NOON);
  await page.goto('/?e2e#yatra');
}
type Fact = { id: string; dayKey: string; mode: string; kind: string; refId: string; inputs: Record<string, unknown>; updatedAt: number; deleted: 0; deviceId: string };
const fact = (kind: string, refId: string, dayKey: string, mode: string, inputs: Record<string, unknown> = {}): Fact => ({
  id: `${kind}:g1-${refId}`, dayKey, mode, kind, refId, inputs,
  updatedAt: new Date(`${dayKey}T12:00:00`).getTime(), deleted: 0, deviceId: 'g1-e2e',
});
async function seedFacts(page: Page, rows: Fact[]) {
  await page.evaluate(async facts => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('ledger', 'readwrite');
      for (const row of facts) tx.objectStore('ledger').put(row);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    database.close();
  }, rows);
  await page.reload();
}

test('G1 group 6: Grow Read', async ({ page }) => {
  await cold(page);
  await page.clock.setFixedTime(new Date('2026-11-09T12:00:00'));
  await page.reload();
  await door(page, 'read');
  // row 78: Read Continue
  await expect(page.getByRole('region', { name: 'Continue' })).toBeVisible();
  // row 80: Library shelves
  await expect(page.getByRole('region', { name: 'Library' })).toBeVisible();
  const book = page.locator('.read-book-tile').first();
  await book.click();
  // row 81: Book overview
  await expect(page.locator('.read-book-page .read-blurb')).toBeVisible();
  // row 82: Book chest
  await expect(page.locator('.learn-trail-chest')).toContainText('Book chest');
  const ideas = page.locator('.read-chapter-ideas').first();
  await ideas.locator('summary').click();
  // row 86: Idea practice
  await expect(ideas.getByRole('button', { name: /^Practice this idea:/ }).first()).toBeVisible();
  await page.locator('.read-chapter-open').first().click();
  // row 83: Chapter reader
  await expect(page.locator('.read-chapter-head')).toBeVisible();
  await seedTaughtTopics(page, ['psychology', 'money-markets']);
  await page.evaluate(async at => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('learnConcepts', 'readwrite');
      tx.objectStore('learnConcepts').put({ id: 'inflation', mastery: 0.97, attempts: 8,
        memory: { stability: 30, difficulty: 5, interval: 30, lastReview: at - 86_400_000, dueAt: at + 86_400_000 },
        activeMisconceptions: [], updatedAt: at, deleted: 0, deviceId: 'g1-e2e' });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    database.close();
  }, new Date('2026-11-09T12:00:00').getTime());
  await page.reload();
  await door(page, 'read');
  await page.getByRole('region', { name: 'Library' }).getByRole('button', { name: /^Why We Do What We Do ·/ }).click();
  for (const summary of await page.locator('.read-chapter-ideas > summary').all()) await summary.click();
  // row 87: Teach Chiku after a taught idea
  await page.getByRole('button', { name: /^Teach Chiku:/ }).first().click();
  await expect(page.getByRole('region', { name: 'Teach Chiku' })).toBeVisible();
  await door(page, 'read');
  await page.getByRole('region', { name: 'Library' }).getByRole('button', { name: /^Money, Plainly ·/ }).click();
  const inflation = page.locator('.read-chapter').filter({ hasText: 'Inflation' });
  await inflation.locator('.read-chapter-ideas > summary').click();
  // row 88: Gold review after mastery
  await inflation.locator('.learn-trail-node').filter({ hasText: 'Inflation' }).getByRole('button', { name: 'Gold review' }).click();
  await expect(page.locator('.learn-drop-head')).toContainText('1 / 5');
  // A question drop hides the tab bar, so leave it by route.
  await page.goto('/?e2e#grow/read');
  await expect(page.getByRole('region', { name: 'Library' })).toBeVisible();
  await page.getByRole('button', { name: /Short courses/ }).click();
  // row 93: Short courses doorway
  await expect(page.locator('.mind-courses')).toBeVisible();
  await page.locator('.mind-courses > summary').click();
  // row 94: Legacy daily lesson
  await expect(page.getByRole('heading', { name: "Today’s lesson" })).toBeVisible();
  // row 96: Learning tracks
  await expect(page.getByRole('region', { name: 'Learning tracks' })).toBeVisible();
  await page.getByRole('region', { name: 'Learning tracks' }).getByRole('button', { name: 'Pick this track' }).first().click();
  await expect(page.getByRole('region', { name: 'Learning tracks' }).getByRole('button', { name: 'Park track' })).toBeVisible();
  // row 97: Track unit player
  await page.getByRole('button', { name: 'Start today’s unit' }).click();
  await expect(page.getByRole('region', { name: 'Track unit' })).toBeVisible();
  await page.goto('/?e2e#grow/read');
  await expect(page.getByRole('region', { name: 'Library' })).toBeVisible();
  await page.getByRole('button', { name: /Short courses/ }).click();
  await page.locator('.mind-courses > summary').click();
  await page.getByRole('button', { name: 'Start lesson', exact: true }).click();
  await expect(page.locator('.mind-lesson')).toBeVisible();
});

test('G1 group 7: Grow Remember', async ({ page }) => {
  await cold(page);
  await seedFacts(page, [
    fact('learn-lesson', 'habits-s1', '2026-10-26', 'learn', { hookCorrect: true, conceptId: 'habits' }),
    fact('learn-lesson', 'habits-s2', '2026-10-27', 'learn', { hookCorrect: false, conceptId: 'habits' }),
    fact('learn-lesson', 'habits-s3', '2026-10-28', 'learn', { hookCorrect: true, conceptId: 'habits' }),
  ]);
  await page.clock.setFixedTime(new Date('2026-11-08T12:00:00'));
  await page.reload();
  await door(page, 'remember');
  // row 79: Review with Moti
  await expect(page.getByRole('region', { name: 'Review with Moti' })).toBeVisible();
  // row 91: Haveli, after all three habits steps have been taught.
  await page.getByRole('button', { name: /^Haveli/ }).click();
  await expect(page.getByRole('region', { name: "Moti’s haveli" })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  // row 92: Matka, on Sunday with earlier first guesses.
  await page.getByRole('button', { name: /^Matka/ }).click();
  await expect(page.getByRole('region', { name: "Moti’s matka" })).toBeVisible();
  await door(page, 'remember');
  // row 117: Card reviews (moved here from Play)
  await expect(page.getByRole('region', { name: 'Card reviews' })).toBeVisible();
  // row 118: People-reading deck switch
  await expect(page.getByRole('button', { name: 'Turn on the deck' })).toBeVisible();
  await page.getByRole('button', { name: 'Turn on the deck' }).click();
  await expect(page.getByRole('button', { name: 'Practice people-reading deck' })).toBeVisible();
  // row 160: Learning holding moved here.
  await expect(page.getByRole('region', { name: 'How your learning is holding' })).toBeVisible();
});

test('G1 group 8: Grow Play', async ({ page }) => {
  await cold(page);
  await seedFacts(page, [fact('purchase', 'paths-pack', '2026-11-05', 'economy', { itemId: 'puzzle:paths', price: 400 })]);
  await door(page, 'play');
  // row 101: Today's mystery case
  await expect(page.getByRole('region', { name: "Today’s case" })).toBeVisible();
  // row 106: Daily puzzle shelf
  await expect(page.getByRole('region', { name: "Kapi’s shelf" })).toBeVisible();
  // row 116: Case story so far
  await expect(page.locator('.mind-story > summary')).toContainText('Story so far');
  // row 113: Practice boards
  await page.locator('.mind-more > summary').click();
  await expect(page.getByRole('heading', { name: 'Practice boards' })).toBeVisible();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  // row 114: Purchased puzzle packs
  await expect(page.locator('.mind-practice-pack')).toContainText('Paths practice pack');
  await door(page, 'play');
  // row 115: Technique cards
  await page.locator('.mind-more > summary').click();
  await page.locator('.mind-techniques > summary').click();
  await expect(page.locator('.mind-technique-locked').first()).toBeVisible();
  // row 107: Board how-to
  await page.getByRole('region', { name: "Kapi’s shelf" }).getByRole('button', { name: /^How to play / }).first().click();
  await expect(page.getByRole('button', { name: 'Skip how-to' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip how-to' }).click();
  await door(page, 'play');
  await page.getByRole('region', { name: "Kapi’s shelf" }).locator('.mind-shelf-tile').first().click();
  if (await page.getByRole('button', { name: 'Skip how-to' }).isVisible()) await page.getByRole('button', { name: 'Skip how-to' }).click();
  // row 108: Puzzle player
  await expect(page.locator('.mind-board .mind-grid')).toBeVisible();
  // row 110: Puzzle check and hint
  await expect(page.getByRole('button', { name: 'Hint', exact: true })).toBeVisible();
  await page.waitForFunction(() => Boolean((window as Window & { __nandiMindTest?: unknown }).__nandiMindTest));
  await page.evaluate(() => (window as Window & { __nandiMindTest?: { solveKnownSolution: () => void } }).__nandiMindTest!.solveKnownSolution());
  // row 112: Puzzle result sharing
  await expect(page.locator('.mind-result').getByRole('button', { name: 'Share result' })).toBeVisible();
  await door(page, 'play');
  await page.locator('.mind-more > summary').click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.locator('.mind-practice-options').getByRole('heading', { name: 'Mini Sudoku' }).locator('..').getByRole('button', { name: 'easy' }).click();
  if (await page.getByRole('button', { name: 'Skip how-to' }).isVisible()) await page.getByRole('button', { name: 'Skip how-to' }).click();
  // row 109: Puzzle pencil notes
  await expect(page.getByRole('button', { name: /^Notes: / })).toBeVisible();
  await door(page, 'play');
  await page.getByRole('button', { name: /Open the case|Continue the case/ }).click();
  if (await page.getByRole('button', { name: 'Skip how-to' }).isVisible()) await page.getByRole('button', { name: 'Skip how-to' }).click();
  // row 102: Case clue grid
  await expect(page.locator('.mind-case')).toBeVisible();
  // row 103: Case accusation
  await expect(page.getByRole('heading', { name: 'Name the culprit' })).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__nandiCaseTest));
  await page.evaluate(() => window.__nandiCaseTest!.solveTodaysCase());
  // row 105: Case result sharing
  await expect(page.getByRole('button', { name: 'Share result' })).toBeVisible();
  await door(page, 'remember');
  // row 117: Card reviews moved to Remember
  await expect(page.getByRole('region', { name: 'Card reviews' })).toBeVisible();
  // row 118: People-reading deck switch moved to Remember
  await expect(page.getByRole('button', { name: 'Turn on the deck' })).toBeVisible();
});

test('G1 group 9: Grow Train', async ({ page }) => {
  await cold(page);
  await door(page, 'train');
  // row 120: Training rank check
  await expect(page.getByText('A rank check · about 10 minutes')).toBeVisible();
  // row 121: Start easy training
  await expect(page.getByRole('button', { name: /Start easy/ })).toBeVisible();
  // row 122: Training track and equipment
  await expect(page.getByLabel('Training track')).toBeVisible();
  // row 123: Training schedule
  await expect(page.getByRole('heading', { name: 'Training days' })).toBeVisible();
  // Choose equipment here: Settings reads the select value after an async wait.
  await page.getByLabel('Barbell').selectOption('20');
  await expect(page.getByLabel('Barbell')).toHaveValue('20');
  // row 130: Hot-day workout advice, enabled in the starting setup.
  await page.getByLabel('Hot-day mode').check();
  await page.getByRole('button', { name: 'Start placement' }).click();
  for (let pattern = 0; pattern < 7; pattern++) {
    if (pattern === 4 || pattern === 5) await page.getByRole('spinbutton', { name: 'Clean seconds' }).fill('30');
    await page.getByRole('button', { name: 'Record test' }).click();
  }
  // row 124: Today's workout
  await expect(page.getByRole('button', { name: 'Start session' })).toBeVisible();
  // row 125: Readiness check
  await expect(page.getByRole('button', { name: 'Not much sleep' })).toBeVisible();
  await page.getByRole('button', { name: 'Not much sleep' }).click();
  // row 126: Minimum session
  await expect(page.getByRole('button', { name: 'Minimum session' })).toBeVisible();
  // row 133: Training progression
  await expect(page.getByRole('heading', { name: 'Progression' })).toBeVisible();
  // row 134: Training consistency
  await expect(page.getByRole('heading', { name: 'Consistency' })).toBeVisible();
  // row 135: Weekly hard sets
  await expect(page.getByRole('heading', { name: 'Weekly hard sets' })).toBeVisible();
  // row 136: Rest-day check
  await expect(page.getByRole('heading', { name: 'Rest-day check' })).toBeVisible();
  // row 132: Workout history
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
  await door(page, 'train');
  // row 138: Training settings
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Training settings' })).toBeVisible();
  // row 140: Plate calculator, with the barbell saved during onboarding.
  await expect(page.getByLabel('Barbell')).toHaveValue('20');
  await expect(page.getByRole('heading', { name: 'Plate calculator' })).toBeVisible();
  await expect(page.getByLabel('Hot-day mode')).toBeChecked();
  await door(page, 'train');
  await page.getByRole('button', { name: 'Not much sleep' }).click();
  await page.getByRole('button', { name: 'Minimum session' }).click();
  // row 127: Workout set logger
  await expect(page.getByRole('button', { name: 'Log set' })).toBeVisible();
  // row 131: Pain stop
  await expect(page.getByRole('button', { name: 'Pain or discomfort?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hot-day mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Log set' }).click();
  // row 128: Workout rest clock
  await expect(page.getByRole('timer', { name: /^Rest / })).toBeVisible();
  await page.clock.setFixedTime(new Date('2027-01-01T12:00:00'));
  await page.reload();
  await door(page, 'train');
  // row 137: Re-test ladder steps at the eight-week mark
  await expect(page.getByRole('button', { name: 'Re-test ladder steps' })).toBeVisible();
});

test('G1 group 10: Grow Calm & Sleep and Night', async ({ page }) => {
  await cold(page);
  await door(page, 'sleep');
  // row 149: Night kolam
  await page.getByTestId('kolam-link').click();
  await expect(page.locator('.kolam-screen')).toBeVisible();
  await door(page, 'sleep');
  await page.getByTestId('calm-link').click();
  // row 141: Calm sitting
  await expect(page.getByRole('heading', { name: 'Calm', exact: true })).toBeVisible();
  // row 143: Calm method and length
  await expect(page.getByRole('button', { name: 'Quiet', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Other', exact: true })).toBeVisible();
  // row 144: Calm sounds
  await page.getByRole('button', { name: 'River', exact: true }).click();
  await expect(page.getByRole('button', { name: 'River', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // row 145: Personal Calm sound
  await page.getByLabel('Add your sound').setInputFiles('public/calm/river.ogg');
  await page.locator('.calm-own-more').first().click();
  await expect(page.getByRole('dialog', { name: /Your sound/ })).toBeVisible();
  await page.getByRole('dialog', { name: /Your sound/ }).getByRole('button', { name: 'Remove' }).click();
  // row 146: Breath and bells
  await page.locator('.calm-settings > summary').click();
  await expect(page.getByLabel('Interval bell')).toBeVisible();
  await page.getByRole('button', { name: /^Start / }).click();
  // row 142: Playback controls
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  // row 147: Calm dim screen
  // The 200 ms UI tick reads Date.now(); advance the fixed wall clock too.
  await page.clock.setFixedTime(new Date(NOON.getTime() + 21_000));
  await expect(page.getByRole('button', { name: 'Wake the screen' })).toBeVisible();
  await page.getByRole('button', { name: 'Wake the screen' }).click();
  await page.getByRole('button', { name: 'Stop' }).click();
  await door(page, 'sleep');
  // row 187: Shutdown and bedtime now live here.
  await expect(page.getByRole('region', { name: 'Shutdown and bedtime' })).toBeVisible();
  // row 188: Long-term bedtime goal
  await expect(page.getByLabel('Long-term bedtime goal')).toBeVisible();
  // row 150: Night review and drop, reached from Calm & Sleep (stage 2 (ii): the Night dot is gone).
  await page.getByTestId('night-link').click();
  await expect(page.getByRole('heading', { name: 'Tonight' })).toBeVisible();
  // row 148: Night plan
  await expect(page.getByRole('article', { name: 'Tonight card' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Night plan setting' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to card 2: Night drop' }).click();
  await expect(page.getByRole('article', { name: 'Night drop card' })).toBeVisible();
  // row 151: Night puzzle
  await page.getByRole('button', { name: 'Go to card 3: Think' }).click();
  await expect(page.locator('.deck-puzzle')).toBeVisible();
  // row 152: Today in words
  await page.getByRole('button', { name: /Go to card 4:/ }).click();
  await expect(page.getByRole('heading', { name: 'What today held' })).toBeVisible();
  // row 153: Park tomorrow
  await expect(page.getByLabel('Write it so tomorrow-you knows the first move')).toBeVisible();
  // row 154: Phone-down move
  await page.getByRole('button', { name: /Go to card 5:/ }).click();
  await expect(page.getByRole('button', { name: 'Another idea' })).toBeVisible();
  // row 155: Lights-out check-in
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lights-out check-in' })).toBeVisible();
});

test('G1 group 11: You', async ({ page }) => {
  await cold(page);
  await seedRecapWeek(page, '2026-11-05');
  await seedFacts(page, [
    fact('done', 'old-task', '2026-10-20', 'tasks', { plannedSize: 'M', wasPlanned: true }),
    fact('done', 'this-task', '2026-11-05', 'tasks', { plannedSize: 'M', wasPlanned: true }),
    fact('learn-drop', 'this-drop', '2026-11-05', 'gamify'),
    fact('badge-tier', 'first-badge', '2026-11-05', 'gamify'),
  ]);
  await you(page);
  // row 161: Level and XP
  await expect(page.getByRole('region', { name: 'Your season' }).getByRole('progressbar', { name: 'XP to next level' })).toBeVisible();
  // row 162: Useful week target
  await expect(page.getByRole('region', { name: 'This week' }).getByRole('button', { name: /^Change your weekly target/ })).toBeVisible();
  // row 163: Banked rest days
  await expect(page.getByRole('region', { name: 'This week' })).toContainText('rest days banked');
  // row 167: Plan days away
  await expect(page.getByRole('button', { name: 'Plan days away' })).toBeVisible();
  // row 170: Week in words
  await expect(page.getByRole('region', { name: 'Your week' })).toBeVisible();
  // row 171: Week's receipt
  await expect(page.getByRole('region', { name: 'Your week' }).getByRole('button', { name: 'Share my week' })).toBeVisible();
  // row 168: the W1 dailies, renamed "Small steps today" (spec 660, Jenil 8 Nov)
  await expect(page.getByRole('region', { name: 'Small steps today' })).toBeVisible();
  // row 169: Badges and monthly challenge → spec 660 §3.1b/c: ended; earned badges are read-only in You › history
  await expect(page.getByRole('button', { name: /^Badges/ })).toHaveCount(0);
  await page.getByTestId('history-link').click();
  await expect(page.getByRole('region', { name: 'Badges you earned' })).toBeVisible();
  await you(page);
  // row 172: Six stats
  await expect(page.getByRole('region', { name: 'Your six stats' })).toBeVisible();
  // row 174: Private books
  await expect(page.getByRole('region', { name: 'Private books' })).toBeVisible();
  // row 173: Backup nudge, after the first week without a backup
  await expect(page.getByRole('region', { name: 'Backup copy' })).toBeVisible();
  // row 175: What NANDI helps with
  await page.getByRole('button', { name: /What NANDI helps with/ }).click();
  await expect(page.getByRole('heading', { name: 'What NANDI helps with' })).toBeVisible();
  await you(page);
  // row 25: Useful-day record
  await page.getByTestId('useful-days-link').click();
  await expect(page.locator('.useful-days')).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-12-07T12:00:00'));
  await page.reload();
  // row 26: Past season results become available after the first season ends.
  await page.getByRole('button', { name: /Past seasons/ }).click();
  await expect(page.getByRole('heading', { name: 'Past seasons' })).toBeVisible();
  await you(page);
  // rows 164-165: Season ladder and Hide ladder rank → spec 660 §3.2: the ladder went; you/season opens You
  await expect(page.getByRole('button', { name: 'View the ladder' })).toHaveCount(0);
  // row 166: Shards shop → spec 660 §3.1: closed; the Shards kept are read-only in You › history
  await page.getByTestId('history-link').click();
  await expect(page.getByRole('heading', { name: /^Shards kept: \d/ })).toBeVisible();
  await you(page);
  await page.getByTestId('door-link-remember').click();
  // row 160: Learning holding moved from You to Remember
  await expect(page.getByRole('region', { name: 'How your learning is holding' })).toBeVisible();
});

test('G1 group 12: You Settings and widget', async ({ page }) => {
  await cold(page);
  await you(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByTestId('bedtime-link').click();
  // row 187: Shutdown and bedtime moved to Calm & Sleep.
  await expect(page.getByRole('region', { name: 'Shutdown and bedtime' })).toBeVisible();
  // row 188: Long-term bedtime goal moved with it.
  await expect(page.getByLabel('Long-term bedtime goal')).toBeVisible();
  await you(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  // row 182: Focus reward
  await expect(page.getByRole('region', { name: 'Plan settings' }).getByLabel('Reward after a focus block')).toBeVisible();
  // row 183: Theme and reduced motion
  await expect(page.getByLabel('Theme')).toBeVisible();
  await expect(page.getByLabel('Motion')).toBeVisible();
  // row 184: Opening breath
  await expect(page.getByLabel('Breath when you open NANDI')).toBeVisible();
  // row 185: Check-off sounds
  await expect(page.getByLabel('Soft check-off sounds')).toBeVisible();
  // row 186: Offline interests
  await expect(page.getByRole('region', { name: 'What you enjoy' })).toBeVisible();
  // row 189: Weekly rest day
  await expect(page.getByLabel('Weekly rest day')).toBeVisible();
  // row 190: Night deck nudge
  await expect(page.getByLabel('Night deck nudge')).toBeVisible();
  // row 191: Morning first-step nudge
  await expect(page.getByLabel('Morning first step nudge')).toBeVisible();
  // row 196: About and privacy
  await page.locator('.about-app > summary').click();
  await expect(page.getByRole('link', { name: 'Privacy notice' })).toBeVisible();
  // row 197: Content review
  await page.getByRole('button', { name: 'Review content' }).click();
  await expect(page.getByRole('heading', { name: /Review content/ })).toBeVisible();
  await you(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.locator('.about-app > summary').click();
  // row 198: Puzzle generator check
  await page.getByRole('button', { name: 'Puzzle generator check' }).click();
  await expect(page.getByRole('heading', { name: /Generator/ })).toBeVisible();
  await you(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  // row 177: Backup export
  await page.getByRole('button', { name: 'Backup and restore' }).click();
  await expect(page.getByRole('button', { name: 'Export backup' })).toBeVisible();
  // row 180: Persistent storage request
  await expect(page.getByRole('button', { name: 'Ask to keep data on this device' })).toBeVisible();
});
