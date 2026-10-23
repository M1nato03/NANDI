# Accessibility re-check after the fixes (cj3 Job 6)

Date: 2026-10-23.
Build: origin/ship-32 `dab36b3`, built with `npm run build` and served with `npx vite preview --port 5406`.
The job text says ship-31. The batch header says to use ship-32 instead, so this check ran on ship-32.
Baseline: the batch-1 audit `docs/reviews/cj-a11y.md` on `ideas/cj-a11y`. That audit ran on the live site at origin/main `78d1a28`.
The fixes it asked for landed in `6f63e15` ("Accessibility audit fixes ...", merged into ship-29).
Code refs below are `file:line` on ship-32 `dab36b3`.

## Method (same as batch 1)

- Playwright 1.55.1 + @axe-core/playwright 4.14.0 (axe-core 4.14.0), headless Chromium 1194. These are the batch-1 versions. Installed in `/tmp`, not in the repo.
- Axe tags: `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`, plus `label-content-name-mismatch` switched on. That rule is experimental, and batch 1 needed it for its #10.
- 4 configs: 360x780 and 1280x800, in light and dark (`colorScheme`). Each config starts from a fresh profile.
- Clock faked to Wed 21 Oct 2026 12:00, then 23:40 for the night routine.
- The batch-1 report has no script pasted, so I rebuilt its walk from the state list it gives. The new scripts are in the appendix.
- **45 states per config, 180 axe runs in all.** Batch 1 had 26 states and 104 runs.
  - first run: hello, hello with the **18+ tick** (new), goals, bedtime
  - Learn: the **step lesson** (new), with hook, hook feedback, idea, show me, show-me feedback, guided try, hint, guided feedback. Then the finish screen, **Ask someone** tapped (new), hub, topic opened, practice drop, practice finish, and the hub on a fresh profile with "Start".
  - Plan: empty, with a task, Move sheet, Task detail sheet, focus screen
  - **Soft day** (new): the sheet, the low-day card, the kind-word card, and the kind word sent
  - Mind: hub, case, case with a mark, daily board (Number Path)
  - Train: assessment, placement
  - You: hub, the **Share my week** sheet (new share), Settings, Backup
  - night: all 6 cards. The night drop had no review items on a fresh profile, so there was no night-drop feedback to check (see Limits).
- Manual checks, the same as batch 1:
  - Tab walks inside every dialog I could open: focus on open, focus kept inside, Escape, focus returned to the opener
  - visible focus at every Tab stop
  - focus hidden under the fixed tab bar: Settings (70 stops) and Backup, at both sizes
  - every visible control under 44 px and under 24 px
  - Number Path focus
  - reduced motion, both the OS setting and the in-app toggle
  - reflow and WCAG 1.4.12 text spacing at 320x640
- New this time: I read the Chromium accessibility tree over CDP (`Accessibility.getFullAXTree`) while a dialog was open. This shows whether the page behind the dialog can still be reached.
- Load: `uptime` load average was 5 to 7 on 4 CPUs, shared with other jobs. Nothing here depends on timing.
- Screenshots: `/tmp/cj3/job6-scratch/shots/<state>-<WxH>-<scheme>.png`. They are not committed.

## Verdict on the 11 batch-1 problems

| # | Batch-1 problem | Now | Evidence |
|---|---|---|---|
| 1 | Modal dialogs do not take focus, do not keep it, Escape does nothing | **PARTLY** | **Keyboard: fixed.** In all 4 configs, Welcome, Move, Task detail, Soft day and Share my week each take focus on open. 0 of 224 Tab stops (56 per config) left a dialog. Escape closes the sheets and returns focus to the opener. The welcome stays open, as asked. **Still open:** the page behind the dialog is not `inert`. While the welcome or the Move sheet is open, the accessibility tree still exposes the tab bar, the Plan heading and Side quests (`ignored: false`). `main#main.inert` is `false`. A TalkBack swipe can still move behind the dialog. |
| 2 | White on orange primary buttons, 3.61:1 | **FIXED** | `--button: #9B5200` (`theme.css:34`, `:51`), used at `redesign.css:4`. Measured white on `#9B5200` = **5.83:1**. Axe found no button-text contrast failure in 180 runs. One new case uses this background with faded text; it is new item N3 below. |
| 3 | Orange eyebrow and pill text, 3.02 to 3.53:1 | **PARTLY** | `redesign.css:19` now uses `--accent-ink`, which gives 5.73 / 6.70:1. But `learn.css:17` `.learn-drop .eyebrow { color: var(--accent) }` overrides it inside Learn: **3.02:1** in the friend's bubble and **3.53:1** on the "Today's idea" card. That covers every step-lesson screen and the finish screen. This is new item N1 below. |
| 4 | Number Path: no visible focus, every empty cell outlined | **FIXED** | 0 `.path-head` cells at the start (it was 25 of 25). Tab to a cell: the focused cell has `solid 3px` in the `--focus` colour and the other cells have none, in all 4 configs. Code: `Boards.tsx:118` and `mind.css:37`. |
| 5 | Focused control hidden under the fixed tab bar | **FIXED** | `html { scroll-padding-bottom: calc(76px + env(safe-area-inset-bottom)) }` at `theme.css:95`. 0 of 336 Settings and Backup Tab stops (84 per config) were covered at all. That includes "Save night plan", "Save reward" and "Ask to keep data on this device". |
| 6 | Green side quest buttons, 3.55:1 | **FIXED** | `quests.css:35` uses `--area-extra-ink #4A5C0E`. Measured **5.64:1** on the `#E0E3C9` mix for "+1", "+5" and "Done". |
| 7 | Learn hub "Start", 4.47:1 | **FIXED** | `learn.css:85`: the background mix went from 20% to 14%. Measured `#0F6E61` on `#DDE8E1` = **4.89:1**. Axe was clean on a fresh hub in all 4 configs. |
| 8 | `role="grid"` with no rows or cells | **FIXED** | All 4 board types are now `role="group"` (`Boards.tsx:51`, `:73`, `:79`, `:117`). 0 `aria-required-children` hits. |
| 9 | `aria-expanded` on the quick add input | **FIXED** | There is no `aria-expanded` in `TaskQuickAdd.tsx`. 0 `aria-allowed-attr` hits. |
| 10 | Accessible name does not contain the visible label | **FIXED** | "Add your own" has no `aria-label` now (`SideQuests.tsx:75`). The Mind chips are `<strong>Case</strong> <span>Not done</span>` with no `aria-label` (`Mind.tsx:430-431`). 0 `label-content-name-mismatch` violations. Axe still asks for a review on two symbol buttons ("×" named "Leave night deck", and case cells showing "×"). A symbol is not a text label, so this is fine. |
| 11 | `aria-label` on a `<p>` | **FIXED** (same pattern elsewhere) | The welcome step dots are `role="img"` (`Welcome.tsx:92`). There is no `aria-label="Active time"` anywhere in `src/ui`. The same pattern (an `aria-label` on a plain `div`, `span` or `strong`) still appears in 6 other places. Axe marks those "needs review"; see N4. |

Totals: 9 fixed, 2 partly fixed, 0 not fixed.

Axe totals: 1 rule (`color-contrast`), 5 distinct failing nodes, 28 node hits in 180 runs. All 28 are in light mode. Batch 1 had 6 rules, 12 distinct failures and 220 hits.
Dark mode: 0 axe failures in 90 runs. Night deck: 0 failures on all 6 cards in all 4 configs.

## New violations, worst first

| # | Problem | WCAG 2.2 | Where | Configs |
|---|---|---|---|---|
| N1 | Orange eyebrows inside Learn lessons: 3.02 and 3.53:1 | 1.4.3 AA | every step-lesson screen, the daily and practice finish | light, both sizes |
| N2 | Side quest titles cut to 2 lines, and the full title is never shown | 1.4.10 AA, 1.4.12 AA | Plan side quests | 360: 1 of 3 cut; 320: 2 of 3; 320 with text spacing: 3 of 3 |
| N3 | Faded hint text on the soft-day option buttons: 4.04:1 | 1.4.3 AA | Soft day card | light |
| N4 | Move sheet "Schedule changed for a real reason?" in orange: 3.53:1 | 1.4.3 AA | Move sheet. Same CSS on the Rituals planner | light |
| N5 | `aria-label` on elements that have no role (6 places) | 4.1.2 A (axe "needs review") | Train days, Learn topic map, You level badge, daily quest counts, focus timer ring, storybook dots | all |
| N6 | Learn topic hooks cut to 3 lines | 1.4.12 AA (minor) | Learn hub topic cards | 320: 3 of 6 cut; with text spacing: 6 of 6 |
| N7 | "Privacy notice" link is 85x17 px | project rule (44 px); passes WCAG 2.5.8 by its spacing exception | Welcome | all |

### N1. Orange eyebrow text inside Learn lessons (light)

- `learn.css:17` sets `.learn-drop .eyebrow { margin-top: 8px; color: var(--accent); font-size: 12px; }`. Its specificity (0,2,0) beats the fixed rule at `redesign.css:19`.
- Measured:
  - "NEW IDEA · HABITS" in the friend's bubble: `#C9700F` on `#F1EADD` = **3.02:1**, 11 px bold (`.learn-ask-bubble > .eyebrow`). The 11 px size comes from `learn.css:176`.
  - "TODAY'S IDEA · A CUE STARTS A HABIT" on the finish card: `#C9700F` on `#FFFCF6` = **3.53:1** (`.step-today > .eyebrow`).
- Hit on 12 of the 45 states: all 8 lesson phases, the finish, Ask someone, the practice lesson and the practice finish. The lesson is the screen a new user sees first when they pick "Learn something".
- Screenshots: `learn-1-lesson-hook-360x780-light.png`, `learn-2-finish-360x780-light.png`.
- Fix: in `learn.css:17`, change `color: var(--accent)` to `var(--accent-ink)`, or delete the `color` declaration. That gives 5.73:1 and 6.70:1. Dark mode is unaffected, because `--accent-ink` equals `--accent` there.

### N2. Side quest titles are cut off with no way to read them

- `quests.css:11`: `.quest-disclosure strong { -webkit-line-clamp: 2; overflow: hidden }`.
- Opening the row (`aria-expanded=true`) shows only "x of y this week" (`SideQuests.tsx:84`). The title stays clamped, so "Keep your scroll app closed after bedtime for 5 nights" reads "Keep your scroll app…".
- The full title is only in the "+1" button's accessible name, so sighted users never see it.
- Measured clipped titles:

  | Width | Normal spacing | WCAG 1.4.12 spacing |
  |---|---|---|
  | 360 | 1 of 3 | 2 of 3 |
  | 320 | 2 of 3 | 3 of 3 |

  WCAG 1.4.10 says content must reflow at 320 CSS px "without loss of information".
- Screenshot: `reflow-clamp-plan-320x640.png`.
- Fix: add `.quest-disclosure[aria-expanded='true'] strong { display: block; -webkit-line-clamp: unset; overflow: visible; }`. Or drop the clamp and let the row grow.

### N3. Soft-day option hints at 4.04:1 (light)

- `soft.css:10`: `.soft-option small { opacity: .75 }`. On the `#9B5200` button, the white text blends to `#E6D4BF` and measures **4.04:1** at 13.3 px.
- Examples: "· 5 min" on "Step outside", and the time hints on the other options.
- Screenshot: `soft-2-low-360x780-light.png`.
- Fix: remove the opacity (5.83:1), or use `opacity: .9`. Keep the lighter weight for hierarchy.

### N4. Orange disclosure text in the Move sheet (light)

- `tasks.css:51`: `.task-sheet summary { color: var(--accent) }`.
- "Schedule changed for a real reason?" measures `#C9700F` on `#FFFCF6` = **3.53:1** at 16 px.
- `tasks.css:71` gives `.planner-screen details > summary` the same colour. I did not walk the Rituals planner, but it uses the same colour on the same surface.
- Screenshot: `plan-3-move-sheet-360x780-light.png`.
- Fix: use `var(--accent-ink)` at `tasks.css:51` and `:71`.

### N5. `aria-label` on elements with no role (same class as batch-1 #11)

Axe "needs review" (`aria-prohibited-attr`). Screen readers ignore these names.

| Where | Element | Fix |
|---|---|---|
| `train/Onboarding.tsx:58`, `train/Dashboard.tsx:50` | `<div class="train-days" aria-label="Training days">` around the day buttons | add `role="group"` |
| `screens/Learn.tsx:100` | `<div class="learn-trail" aria-label="… mastery map">` | add `role="group"` |
| `screens/EconomyScreens.tsx:70` | `<span class="economy-jersey" aria-label="Level 1">1</span>` | `role="img"`, or `aria-hidden="true"` (the heading next to it already says "Level 1") |
| `screens/GamifyScreens.tsx:16` | `<strong aria-label="0 of 1">0 / 1</strong>` | drop the `aria-label` and render "0 of 1" with a visually hidden "of", or keep the slash |
| `screens/Today.tsx:50` | `<div class="timer-ring" aria-label="Focus time …">` | `role="img"` with that label. Keep it out of any live region |
| `courtyard/Storybook.tsx:27` | `<div class="story-dots" aria-label="3 of 7 days">` | `role="img"`. Code only, not walked |

### N6. Learn topic hooks cut to 3 lines

- `learn.css:51` clamps `.learn-topic-hook` to 3 lines.
- Clipped hooks: 1 of 6 at 360, 3 of 6 at 320, and 6 of 6 at 320 with text spacing.
- The hook is a teaser for the next idea, and the full text shows when that lesson opens. So this is minor.
- Fix: clamp at 4 lines, or unclamp when the topic is open (`aria-expanded='true'`).

### N7. Privacy notice link below the project's 44 px rule

- "Privacy notice" on the welcome measures 85x17 px.
- It passes WCAG 2.5.8 (24 px) under the spacing exception: the nearest other target, the 18+ checkbox, is more than 24 px away.
- It is below the 44 px minimum in `CLAUDE.md`.
- Fix: `display: inline-block; min-height: 44px; padding-block: 12px` on `.welcome-privacy a`.

## The remaining part of #1: the background is not inert

- `useModalFocus.ts` handles focus and Escape well. Nothing marks the rest of the page as hidden.
- Measured over CDP with the welcome open:

  | Node | Role | ignored |
  |---|---|---|
  | "Main tabs" | navigation | false |
  | "Plan" | link, heading | false |
  | "Side quests" | region | false |

  `header.topbar`, `main#main` and `nav.tabbar` all have `inert === false`. The Move sheet gave the same result.
- Chromium's tree, which Android TalkBack reads, does not drop content outside the dialog just because the dialog has `aria-modal`.
- Fix:
  - In `useModalFocus`, while a dialog is open, set `inert` on every child of `.app-shell` except the one that contains the dialog. Restore it on close.
  - Or move dialogs into native `<dialog>` with `showModal()`, as batch 1 suggested.
- A unit test can check `document.querySelector('main').inert === true` while the Move sheet is open.

## Manual checks

| Check | Result |
|---|---|
| Dialog focus | Welcome, Move, Task detail, Soft day and Share my week each take focus on open, in 4 of 4 configs. 0 of 224 Tab stops (56 per config) left a dialog. |
| Escape | Move, Task detail, Soft day and Share my week close. Move, Soft day and Share my week return focus to the opener. Task detail return was not measured. The welcome stays open, as intended. Night pause and Unit scene were checked in code only: `useModalFocus()` with no Escape for the night pause. |
| Tap targets | 0 controls under 44 px on 45 states x 4 configs, except "Privacy notice" (N7). The 18+ checkbox target is its label, at ≥ 44 px. |
| Visible focus | Every Tab stop showed a 3 px ring. The 4th Tab stop inside each `<input type=time>` is the picker icon. It reports no outline on the host, but Chrome draws its own ring on the icon (`noring-you-settings-25.png`). That passes. |
| Focus order | DOM order matches visual order on all walked screens. The welcome now starts inside the dialog. Batch 1 needed 39 Tab presses to reach "Let's start". |
| Focus under tab bar | 0 stops hidden, in all configs (see #5). |
| Learn feedback | Feedback is `role="status"`. Focus stays on the chosen answer, and the next Tab goes to "Continue". |
| Reduced motion (OS) | `reduce`: 0 running animations on welcome, lesson, feedback, Plan, Courtyard, Mind, Learn and night. `no-preference`: welcome 1, lesson 3, feedback 4, Plan 1, Courtyard 1. |
| Reduced motion (in-app) | Settings → Motion → Reduced sets `data-motion="reduce"`. Plan, Courtyard, Mind and Learn then had 0 running animations. |
| Reflow + text spacing at 320x640 | No horizontal scroll on 14 screens: welcome, lesson, Plan, Learn, Mind, case, board, Train, You, Settings, Backup, soft day, night 1. Clipped text: side quest titles (N2), topic hooks (N6), and the You "Courtyard" subtitle ellipsis. Batch 1 already noted the subtitle. |
| Dark mode contrast | 0 failures in 90 runs. |
| Night routine | 0 axe failures on all 6 cards, in 4 of 4 configs. |
| Shares | Ask someone, the kind-word card and the Share my week sheet had 0 axe failures. Ask someone showed "Could not share it. Try again." in `role="status"`. That is because headless Chromium has no Web Share and no clipboard permission, so it is not an accessibility fault. |

## Limits

- **Quiz items not reached.** On a fresh profile, every daily and practice drop is one step lesson and then the finish. Quiz items only appear once a step was taught on an earlier day, and the production build has no `?e2e` seeding hook. The lesson's option buttons and feedback panel are the same components quiz items use, and they passed apart from N1. The night drop had no review items, so night-drop feedback was not seen. Batch 1 checked both of those.
- The night pause card (Android only), the Unit scene, the economy reveal and the Plan re-space sheet were not opened. All four use `useModalFocus` in code.
- No real TalkBack run. Name and role findings come from axe, computed names and the Chromium AX tree.
- Axe could not grade text over translucent layers (the top bar, tab bar and Learn hub card) and marked it "needs review", as in batch 1. I did not grade it by hand.
- Only Number Path was opened among the boards. The `role="group"` fix covers all 4 board types in code.

## Fix order

1. N1 and N4: change two `color: var(--accent)` to `var(--accent-ink)` (`learn.css:17`, `tasks.css:51` and `:71`). N3: remove `opacity: .75` (`soft.css:10`). Then re-run axe in light mode; it should be clean.
2. #1 remainder: `inert` on the background while a dialog is open.
3. N2: show the full side quest title when the row is open.
4. N5: add a `role` to the 6 labelled generic elements.
5. N6 and N7: small CSS changes.

## Appendix: scripts (re-runnable)

Setup:
```sh
mkdir -p /tmp/cj3/job6-scratch && cd /tmp/cj3/job6-scratch
npm init -y && npm i playwright@1.55.1 @axe-core/playwright@4.14.0
# in the worktree: npm ci && npm run build && npx vite preview --port 5406 --strictPort
node audit.mjs all all    # 4 configs x 40 states + reduced motion + reflow → results-all.json, extras.json
node supp.mjs             # fresh Learn hub Start, focus screen, Share my week sheet → results-supp.json
node supp2.mjs            # practice drop finish → results-supp2.json
```
Playwright 1.55.1 expects Chromium 1193. The machine has 1194, so the scripts launch it with `executablePath`.

### audit.mjs (main walk, reduced motion, reflow)
```js
// cj3 Job 6: accessibility re-check, repeating the cj-a11y (batch 1) walk on origin/ship-32 plus the new screens.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5406/';
const EXE = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const OUT = '/tmp/cj3/job6-scratch';
mkdirSync(`${OUT}/shots`, { recursive: true });
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
export const CONFIGS = [
  { w: 360, h: 780, scheme: 'light' }, { w: 360, h: 780, scheme: 'dark' },
  { w: 1280, h: 800, scheme: 'light' }, { w: 1280, h: 800, scheme: 'dark' },
];
const only = process.argv[2]; // optional "360x780-light"
export const results = [];
const log = (...a) => console.log(...a);

export async function axe(page, label, cfg) {
  const builder = new AxeBuilder({ page }).withTags(TAGS).options({ rules: { 'label-content-name-mismatch': { enabled: true } } });
  const r = await builder.analyze();
  return {
    violations: r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target.join(' '), html: n.html.slice(0, 160), summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 260) })) })),
    incomplete: r.incomplete.map(v => ({ id: v.id, n: v.nodes.length, targets: v.nodes.slice(0, 6).map(n => n.target.join(' ')) })),
  };
}

// Visible controls under 44 / 24 px. Inside an open modal, only the dialog counts.
export async function targets(page) {
  return page.evaluate(() => {
    const dialog = [...document.querySelectorAll('[role=dialog][aria-modal=true]')].pop();
    const scope = dialog ?? document;
    const sel = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=checkbox], [tabindex]:not([tabindex="-1"])';
    const out = [];
    for (const el of scope.querySelectorAll(sel)) {
      let box = el;
      if (el.matches('input[type=checkbox], input[type=radio]')) box = el.closest('label') ?? el;
      const r = box.getBoundingClientRect();
      const cs = getComputedStyle(box);
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || el.closest('[aria-hidden=true]')) continue;
      if (Math.min(r.width, r.height) < 44) {
        const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
        out.push({ tag: el.tagName.toLowerCase(), cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 40), name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), inline });
      }
    }
    return out;
  });
}

// Tab walk from the current focus. For each stop: inside dialog?, visible focus indicator?, hidden under the fixed tab bar?
export async function tabWalk(page, presses, dialogSel) {
  const stops = [];
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(60);
    stops.push(await page.evaluate((dialogSel) => {
      const el = document.activeElement;
      if (!el || el === document.body) return { body: true };
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const bar = document.querySelector('.tabbar');
      let hidden = 0;
      if (bar && getComputedStyle(bar).position === 'fixed' && !(dialogSel && document.querySelector(dialogSel))) {
        const b = bar.getBoundingClientRect();
        const overlapH = Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top));
        const overlapW = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left));
        hidden = r.width * r.height ? (overlapH * overlapW) / (r.width * r.height) : 0;
        if (el.closest('.tabbar')) hidden = 0;
      }
      // Fully off-screen counts as hidden too (only possible if the page did not scroll it in).
      const offscreen = r.bottom <= 0 || r.top >= innerHeight;
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      const label = el.closest('label');
      const labelRing = label ? getComputedStyle(label).outlineStyle !== 'none' || getComputedStyle(label).boxShadow !== 'none' : false;
      return {
        tag: el.tagName.toLowerCase(), name: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 40),
        cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 30),
        inDialog: dialogSel ? !!el.closest(dialogSel) : null, ring: ring || labelRing, hidden: Math.round(hidden * 100), offscreen,
      };
    }, dialogSel));
  }
  return stops;
}

async function shot(page, name, cfg) {
  await page.screenshot({ path: `${OUT}/shots/${name}-${cfg.w}x${cfg.h}-${cfg.scheme}.png` });
}

export async function record(page, cfg, name, extra = {}) {
  await page.waitForTimeout(700);
  const entry = { cfg: `${cfg.w}x${cfg.h}-${cfg.scheme}`, state: name, url: page.url().replace(BASE, '/'), ...extra };
  try { entry.axe = await axe(page, name, cfg); } catch (e) { entry.axeError = String(e).slice(0, 200); }
  try { entry.small = await targets(page); } catch (e) { entry.smallError = String(e).slice(0, 200); }
  entry.hscroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await shot(page, name, cfg);
  results.push(entry);
  log(`[${entry.cfg}] ${name}: ${entry.axe ? entry.axe.violations.map(v => `${v.id}(${v.nodes.length})`).join(', ') || 'clean' : entry.axeError} small=${entry.small?.length}`);
  return entry;
}

async function step(cfg, name, fn) {
  try { await fn(); } catch (e) { log(`[${cfg.w}x${cfg.h}-${cfg.scheme}] STEP FAILED ${name}: ${String(e).split('\n')[0]}`); results.push({ cfg: `${cfg.w}x${cfg.h}-${cfg.scheme}`, state: name, failed: String(e).split('\n')[0] }); }
}

async function axTreeBehindWelcome(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const live = nodes.filter(n => !n.ignored);
  const names = live.map(n => n.name?.value).filter(Boolean);
  return { tabBarExposed: names.includes('Main tabs'), quickAddExposed: names.some(n => /Add a task/.test(n)), sideQuestsExposed: names.includes('Side quests'), liveNodes: live.length };
}

async function run(cfg) {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: cfg.w, height: cfg.h }, colorScheme: cfg.scheme });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-10-21T12:00:00') });
  await page.goto(BASE);
  const welcome = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await welcome.waitFor();

  // ---------- First run ----------
  await step(cfg, 'firstrun', async () => {
    const focusIn = await welcome.evaluate(n => n.contains(document.activeElement));
    const ax = await axTreeBehindWelcome(page);
    const walk = await tabWalk(page, 10, '.welcome');
    await page.keyboard.press('Escape');
    const stillOpen = await welcome.isVisible();
    await page.evaluate(() => document.activeElement?.blur());
    await record(page, cfg, 'firstrun-1-hello', { focusIn, ax, walk, escapeKeepsOpen: stillOpen });
    await page.getByLabel("I'm 18 or older.").check();
    await record(page, cfg, 'firstrun-1b-hello-18-ticked');
    await page.getByRole('button', { name: "Let's start" }).click();
    await record(page, cfg, 'firstrun-2-goals', { walk: await tabWalk(page, 7, '.welcome') });
    await page.getByRole('button', { name: 'Learn something' }).click();
    await record(page, cfg, 'firstrun-3-bedtime', { walk: await tabWalk(page, 4, '.welcome') });
    await page.locator('.welcome button').last().click();
    await page.locator('.welcome').waitFor({ state: 'detached' });
    await page.waitForTimeout(1200);
  });

  // ---------- Learn: step lesson (new), finish, Ask someone (new), hub ----------
  await step(cfg, 'learn-lesson', async () => {
    const lesson = page.locator('.step-lesson');
    await lesson.waitFor({ timeout: 15000 });
    await record(page, cfg, 'learn-1-lesson-hook', { walk: await tabWalk(page, 8) });
    await lesson.locator('button').filter({ hasNotText: 'Back' }).first().click();
    await page.locator('.learn-feedback').waitFor();
    await record(page, cfg, 'learn-1b-hook-feedback', { feedbackFocused: await page.evaluate(() => !!document.activeElement?.closest('.learn-feedback')) });
    await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
    await record(page, cfg, 'learn-1c-teach');
    await lesson.getByRole('button', { name: 'Continue' }).click();
    await record(page, cfg, 'learn-1d-show');
    await lesson.locator('button').first().click();
    await page.locator('.learn-feedback').waitFor();
    await record(page, cfg, 'learn-1e-show-feedback');
    await page.locator('.learn-feedback').getByRole('button', { name: 'Continue' }).click();
    await record(page, cfg, 'learn-1f-guided');
    const hint = lesson.getByRole('button', { name: 'Show hint' });
    if (await hint.count()) { await hint.click(); await record(page, cfg, 'learn-1g-guided-hint'); }
    await lesson.locator('button').first().click();
    await page.locator('.learn-feedback').waitFor();
    await record(page, cfg, 'learn-1h-guided-feedback');
    await page.locator('.learn-feedback').getByRole('button').last().click();
  });
  await step(cfg, 'learn-finish', async () => {
    await page.locator('.learn-stop').waitFor({ timeout: 15000 });
    await page.waitForTimeout(1500);
    await record(page, cfg, 'learn-2-finish', { walk: await tabWalk(page, 6) });
    const ask = page.getByRole('button', { name: 'Ask someone' });
    if (await ask.count()) { await ask.click(); await page.waitForTimeout(800); await record(page, cfg, 'learn-2b-ask-someone', { status: await page.locator('[role=status]').allInnerTexts() }); }
    else results.push({ cfg: `${cfg.w}x${cfg.h}-${cfg.scheme}`, state: 'learn-2b-ask-someone', failed: 'Ask someone not shown' });
  });
  await step(cfg, 'learn-hub', async () => {
    await page.goto(BASE + '#learn'); await page.locator('.learn-topic-expand').first().waitFor();
    await record(page, cfg, 'learn-3-hub');
    await page.locator('.learn-topic-expand').first().click();
    await record(page, cfg, 'learn-4-topic-open');
    await page.locator('.learn-trail button').filter({ hasText: 'Practice' }).first().click();
    await page.waitForTimeout(1500);
    // A practice drop: answer until a quiz question shows up (or the lesson).
    await record(page, cfg, 'learn-5-practice-first');
  });

  // ---------- Plan ----------
  await step(cfg, 'plan', async () => {
    await page.goto(BASE + '#plan'); await page.getByPlaceholder('Add a task, e.g. call bank 15m').waitFor();
    await page.evaluate(() => document.activeElement?.blur());
    await record(page, cfg, 'plan-1-empty');
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Review notes');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.locator('.task-row').filter({ hasText: 'Review notes' }).first().waitFor();
    await page.evaluate(() => document.activeElement?.blur());
    await record(page, cfg, 'plan-2-with-task');
    const move = page.locator('.task-row').filter({ hasText: 'Review notes' }).getByRole('button', { name: 'Move' }).first();
    await move.click();
    const sheet = page.getByRole('dialog', { name: /Move Review notes/ });
    await sheet.waitFor();
    const focusIn = await sheet.evaluate(n => n.contains(document.activeElement));
    const walk = await tabWalk(page, 14, '[role=dialog]');
    await record(page, cfg, 'plan-3-move-sheet', { focusIn, walk });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closed = (await sheet.count()) === 0;
    const backOnMove = await move.evaluate(n => n === document.activeElement).catch(() => false);
    results.at(-1).escapeCloses = closed; results.at(-1).focusReturns = backOnMove;
    // Task detail sheet
    await page.locator('.task-title-button').filter({ hasText: 'Review notes' }).first().click();
    const detail = page.getByRole('dialog', { name: /Task detail/ });
    await detail.waitFor();
    const dFocus = await detail.evaluate(n => n.contains(document.activeElement));
    const dWalk = await tabWalk(page, 10, '[role=dialog]');
    await record(page, cfg, 'plan-4-task-detail', { focusIn: dFocus, walk: dWalk });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    results.at(-1).escapeCloses = (await detail.count()) === 0;
  });

  // ---------- Soft day (new) and the kind-word share (new) ----------
  await step(cfg, 'soft', async () => {
    const chip = page.getByRole('button', { name: 'Low on energy today?' });
    await chip.click();
    const sheet = page.getByRole('dialog', { name: 'What kind of day is it?' });
    await sheet.waitFor();
    const focusIn = await sheet.evaluate(n => n.contains(document.activeElement));
    const walk = await tabWalk(page, 5, '[role=dialog]');
    await record(page, cfg, 'soft-1-sheet', { focusIn, walk });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    results.at(-1).escapeCloses = (await sheet.count()) === 0;
    results.at(-1).focusReturns = await chip.evaluate(n => n === document.activeElement).catch(() => false);
    await chip.click();
    await sheet.getByRole('button', { name: 'Feeling low' }).click();
    const card = page.getByRole('region', { name: 'Soft day' });
    await card.waitFor();
    await page.evaluate(() => document.activeElement?.blur());
    await record(page, cfg, 'soft-2-low', { walk: await tabWalk(page, 8) });
    await card.getByRole('button', { name: 'Send someone a kind word' }).click();
    await record(page, cfg, 'soft-3-kind-word', { walk: await tabWalk(page, 12) });
    const send = card.getByRole('button', { name: /Send|Share/ }).first();
    if (await send.count()) { await send.click(); await page.waitForTimeout(1500); await record(page, cfg, 'soft-4-kind-word-sent', { walk: await tabWalk(page, 3), status: await page.locator('[role=status]').allInnerTexts() }); }
    const more = card.getByRole('button', { name: 'I feel better, show me more' });
    if (await more.count()) await more.click(); else await card.getByRole('button', { name: 'I feel okay now' }).click();
    await page.waitForTimeout(500);
  });

  // ---------- Mind ----------
  await step(cfg, 'mind', async () => {
    await page.goto(BASE + '#mind'); await page.getByRole('heading', { name: 'Practice boards' }).waitFor();
    await record(page, cfg, 'mind-1-hub', { walk: await tabWalk(page, 8) });
    await page.goto(BASE + '#mind/case'); await page.getByText('Who was where?').waitFor();
    await record(page, cfg, 'mind-2-case');
    await page.locator('.case-grid button').first().click().catch(() => {});
    await record(page, cfg, 'mind-3-case-mark');
    await page.goto(BASE + '#mind/board/daily'); await page.getByRole('group', { name: /board/i }).first().waitFor({ timeout: 20000 });
    const heads = await page.locator('.mind-cell.path-head').count();
    // Tab to the first cell, then compare its outline with an unfocused cell.
    let focusCell = null;
    for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => document.activeElement?.classList.contains('mind-cell'))) { focusCell = i; break; } }
    await page.keyboard.press('ArrowRight');
    const cmp = await page.evaluate(() => {
      const f = document.activeElement; const other = [...document.querySelectorAll('.mind-cell')].find(c => c !== f && !c.classList.contains('path-head'));
      const s = (e) => { const c = getComputedStyle(e); return `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`; };
      return { focused: s(f), other: s(other), focusedName: f.getAttribute('aria-label'), differs: s(f) !== s(other) };
    });
    // Count cells whose focus shows no change.
    const unchanged = await page.evaluate(() => {
      const cells = [...document.querySelectorAll('.mind-cell')]; let same = 0;
      for (const c of cells) { const before = getComputedStyle(c).outline; c.focus(); const after = getComputedStyle(c).outline; if (before === after) same++; }
      return { same, total: cells.length };
    });
    await record(page, cfg, 'mind-4-board', { pathHeads: heads, focusCellAfterTabs: focusCell, focusCompare: cmp, programmaticFocusUnchanged: unchanged });
  });

  // ---------- Train ----------
  await step(cfg, 'train', async () => {
    await page.goto(BASE + '#train'); await page.getByRole('button', { name: 'Start placement' }).waitFor();
    await record(page, cfg, 'train-1-assessment');
    await page.getByRole('button', { name: 'Start placement' }).click();
    await page.getByRole('button', { name: 'Record test' }).waitFor();
    await record(page, cfg, 'train-2-placement');
  });

  // ---------- You, Settings, Backup, weekly share ----------
  await step(cfg, 'you', async () => {
    await page.goto(BASE + '#plan');
    const done = page.locator('.task-row').filter({ hasText: 'Review notes' }).getByRole('button', { name: 'Done' }).first();
    if (await done.count()) { await done.click(); await page.waitForTimeout(1500); }
    const dlg = page.locator('[role=dialog]');
    if (await dlg.count()) { await record(page, cfg, 'plan-5-finish-dialog', { focusIn: await dlg.first().evaluate(n => n.contains(document.activeElement)) }); await page.keyboard.press('Escape'); }
    await page.goto(BASE + '#you'); await page.getByRole('heading', { name: 'You', exact: true, level: 1 }).waitFor(); await page.waitForTimeout(1500);
    await record(page, cfg, 'you-1');
    const share = page.getByRole('button', { name: 'Share my week' });
    if (await share.count()) {
      await share.click();
      const sheet = page.getByRole('dialog', { name: 'Weekly recap preview' }); await sheet.waitFor(); await page.waitForTimeout(2500);
      await record(page, cfg, 'you-1b-recap-share', { focusIn: await sheet.evaluate(n => n.contains(document.activeElement)), walk: await tabWalk(page, 5, '[role=dialog]') });
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      results.at(-1).escapeCloses = (await sheet.count()) === 0;
      results.at(-1).focusReturns = await share.evaluate(n => n === document.activeElement).catch(() => false);
    } else results.push({ cfg: `${cfg.w}x${cfg.h}-${cfg.scheme}`, state: 'you-1b-recap-share', failed: '"Share my week" not shown' });
    await page.goto(BASE + '#you/settings'); await page.getByRole('heading', { name: 'Settings' }).waitFor();
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    await record(page, cfg, 'you-2-settings', { walk: await tabWalk(page, 70) });
    await page.goto(BASE + '#you/backup'); await page.getByRole('heading', { name: 'Backup' }).waitFor();
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    await record(page, cfg, 'you-3-backup', { walk: await tabWalk(page, 14) });
  });

  // ---------- Night (23:40) ----------
  await step(cfg, 'night', async () => {
    await page.clock.setSystemTime(new Date('2026-10-21T23:40:00'));
    await page.goto(BASE + '#night'); await page.locator('.deck-card').waitFor();
    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(600);
      await record(page, cfg, `night-${i}`, i === 1 ? { walk: await tabWalk(page, 12) } : {});
      if (i === 2) {
        // Night drop: answer one item if there is one, to see its feedback.
        const opt = page.locator('.deck-card .learn-drop button').first();
        const txt = await opt.innerText().catch(() => '');
        if (txt && txt !== 'Continue') { await opt.click(); if (await page.locator('.learn-feedback').count()) await record(page, cfg, 'night-2b-drop-feedback'); }
      }
      const next = page.locator('.deck-next');
      if (i === 6) break;
      if (await next.count()) await next.click();
      else await page.getByRole('button', { name: `Go to card ${i + 1}`, exact: false }).click();
    }
  });

  await browser.close();
}

// Reduced motion (OS and in-app) and reflow at 320 px with WCAG 1.4.12 text spacing.
async function extras() {
  const out = { motion: {}, reflow: [] };
  const browser = await chromium.launch({ executablePath: EXE });
  const count = (page) => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);
  for (const reduced of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    await page.clock.install({ time: new Date('2026-10-21T12:00:00') });
    await page.goto(BASE);
    await page.getByRole('dialog', { name: 'Welcome to NANDI' }).waitFor(); await page.waitForTimeout(800);
    const row = { welcome: await count(page) };
    await page.getByLabel("I'm 18 or older.").check(); await page.getByRole('button', { name: "Let's start" }).click();
    await page.getByRole('button', { name: 'Learn something' }).click(); await page.locator('.welcome button').last().click();
    await page.locator('.step-lesson').waitFor(); await page.waitForTimeout(500); row.lesson = await count(page);
    await page.locator('.step-lesson button').filter({ hasNotText: 'Back' }).first().click(); await page.waitForTimeout(200); row.feedback = await count(page);
    for (const r of ['plan', 'you/courtyard', 'mind', 'learn']) { await page.goto(BASE + '#' + r); await page.waitForTimeout(1200); row[r] = await count(page); }
    await page.clock.setSystemTime(new Date('2026-10-21T23:40:00')); await page.goto(BASE + '#night'); await page.waitForTimeout(1200); row.night = await count(page);
    out.motion[reduced ? 'os-reduce' : 'os-no-preference'] = row;
    if (!reduced) {
      await page.clock.setSystemTime(new Date('2026-10-22T12:00:00'));
      await page.goto(BASE + '#you/settings'); await page.getByRole('heading', { name: 'Settings' }).waitFor();
      await page.locator('label').filter({ hasText: 'Motion' }).locator('select').selectOption('reduce');
      await page.waitForTimeout(500);
      const inApp = { dataMotion: await page.evaluate(() => document.documentElement.dataset.motion ?? null) };
      for (const r of ['plan', 'you/courtyard', 'mind', 'learn']) { await page.goto(BASE + '#' + r); await page.waitForTimeout(1200); inApp[r] = await count(page); }
      out.motion['in-app-reduced'] = inApp;
    }
    await ctx.close();
  }
  // Reflow + text spacing at 320x640.
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-10-21T12:00:00') });
  const spacing = '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }';
  const check = async (name) => {
    await page.addStyleTag({ content: spacing }); await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const clipped = [];
      for (const el of document.querySelectorAll('main *, .welcome *, [role=dialog] *')) {
        const cs = getComputedStyle(el); if (!el.textContent?.trim() || el.children.length > 3) continue;
        if ((cs.overflow.includes('hidden') || cs.overflow.includes('clip') || cs.textOverflow === 'ellipsis') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) clipped.push(`${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 30)}: ${el.textContent.trim().slice(0, 40)}`);
      }
      return { hscroll: document.documentElement.scrollWidth > innerWidth, scrollWidth: document.documentElement.scrollWidth, clipped: clipped.slice(0, 8) };
    });
    await page.screenshot({ path: `${OUT}/shots/reflow-${name}-320x640.png` });
    out.reflow.push({ name, ...r });
  };
  await page.goto(BASE); await page.getByRole('dialog', { name: 'Welcome to NANDI' }).waitFor(); await check('welcome');
  await page.getByLabel("I'm 18 or older.").check(); await page.getByRole('button', { name: "Let's start" }).click();
  await page.getByRole('button', { name: 'Learn something' }).click(); await page.locator('.welcome button').last().click();
  await page.locator('.step-lesson').waitFor(); await check('lesson-hook');
  for (const r of ['plan', 'learn', 'mind', 'mind/case', 'mind/board/daily', 'train', 'you', 'you/settings', 'you/backup']) { await page.goto(BASE + '#' + r); await page.waitForTimeout(1500); await check(r.replace(/\//g, '-')); }
  await page.goto(BASE + '#plan'); await page.waitForTimeout(800); await page.getByRole('button', { name: 'Low on energy today?' }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Feeling low' }).click(); await page.waitForTimeout(500); await check('soft-low');
  await page.clock.setSystemTime(new Date('2026-10-21T23:40:00')); await page.goto(BASE + '#night'); await page.waitForTimeout(1500); await check('night-1');
  await browser.close();
  return out;
}

if (process.argv[1].endsWith('audit.mjs')) {
const which = process.argv[3] ?? 'all';
if (which === 'all' || which === 'walk') for (const cfg of CONFIGS) { if (only && only !== 'all' && only !== `${cfg.w}x${cfg.h}-${cfg.scheme}`) continue; await run(cfg); }
writeFileSync(`${OUT}/results-${only ?? 'all'}.json`, JSON.stringify(results, null, 1));
if (which === 'all' || which === 'extras') writeFileSync(`${OUT}/extras.json`, JSON.stringify(await extras(), null, 1));
log('done');
}
```

### supp.mjs (Share my week sheet, focus screen, fresh Learn hub)
```js
// Supplement to audit.mjs: weekly share sheet (needs 2 recap lines), focus screen, Learn hub "Start" on a fresh profile.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { CONFIGS, results, record, tabWalk } from './audit.mjs';
const BASE = 'http://localhost:5406/';
const EXE = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
for (const cfg of CONFIGS) {
  const b = await chromium.launch({ executablePath: EXE });
  try {
  const page = await (await b.newContext({ viewport: { width: cfg.w, height: cfg.h }, colorScheme: cfg.scheme })).newPage();
  await page.clock.install({ time: new Date('2026-10-21T12:00:00') });
  await page.goto(BASE);
  await page.getByLabel("I'm 18 or older.").check(); await page.getByRole('button', { name: "Let's start" }).click();
  await page.getByRole('button', { name: 'Get things done' }).click(); await page.locator('.welcome button').last().click();
  await page.locator('.welcome').waitFor({ state: 'detached' }); await page.waitForTimeout(800);
  await page.goto(BASE + '#learn'); await page.getByRole('button', { name: 'Start', exact: true }).waitFor();
  await record(page, cfg, 'learn-6-hub-fresh-start');
  await page.goto(BASE + '#plan'); await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Review notes');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('button', { name: 'Start focus' }).first().click(); await page.waitForTimeout(800);
  await record(page, cfg, 'plan-6-focus', { walk: await tabWalk(page, 8) });
  await page.clock.fastForward('40:00'); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Finish' }).click(); await page.waitForTimeout(800);
  await page.goto(BASE + '#plan');
  const d = page.locator('.task-row').filter({ hasText: 'Review notes' }).getByRole('button', { name: 'Done' }).first(); if (await d.count()) await d.click();
  await page.waitForTimeout(1000);
  await page.goto(BASE + '#you'); await page.waitForTimeout(1500);
  console.log(await page.locator('.you-week').innerText().catch(()=>'no you-week'));
  const share = page.getByRole('button', { name: 'Share my week' });
  await share.scrollIntoViewIfNeeded(); await share.focus(); await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Weekly recap preview' }); await sheet.waitFor(); await page.waitForTimeout(2500);
  const focusIn = await sheet.evaluate(n => n.contains(document.activeElement));
  const walk = await tabWalk(page, 6, '[role=dialog]');
  await record(page, cfg, 'you-1b-recap-share', { focusIn, walk });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  results.at(-1).escapeCloses = (await sheet.count()) === 0;
  results.at(-1).focusReturns = await share.evaluate(n => n === document.activeElement).catch(() => false);
  } catch (e) { console.log(cfg, 'FAILED', String(e).split('\n')[0]); }
  await b.close();
}
writeFileSync('/tmp/cj3/job6-scratch/results-supp.json', JSON.stringify(results, null, 1));
```

### inert.mjs (is the background still in the accessibility tree?)
```js
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const p = await (await b.newContext({ viewport: { width: 360, height: 780 } })).newPage();
await p.clock.install({ time: new Date('2026-10-21T12:00:00') });
await p.goto('http://localhost:5406/');
await p.getByRole('dialog', { name: 'Welcome to NANDI' }).waitFor(); await p.waitForTimeout(800);
const cdp = await p.context().newCDPSession(p);
const probe = async (label) => {
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const pick = (name) => nodes.filter(n => n.name?.value === name).map(n => ({ role: n.role?.value, ignored: n.ignored, why: (n.ignoredReasons ?? []).map(r => r.name).join(',') }));
  const inertAttr = await p.evaluate(() => ['header.topbar', 'main#main', 'nav.tabbar'].map(s => `${s}:${document.querySelector(s)?.inert}`).join(' '));
  console.log(label, JSON.stringify({ tabs: pick('Main tabs'), plan: pick('Plan').slice(0, 3), sideQuests: pick('Side quests') }), inertAttr);
};
await probe('welcome-open');
await p.getByLabel("I'm 18 or older.").check(); await p.getByRole('button', { name: "Let's start" }).click();
await p.getByRole('button', { name: 'Get things done' }).click(); await p.locator('.welcome button').last().click(); await p.locator('.welcome').waitFor({ state: 'detached' }); await p.waitForTimeout(800);
await p.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Review notes'); await p.getByRole('button', { name: 'Add task', exact: true }).click();
await p.locator('.task-row').filter({ hasText: 'Review notes' }).getByRole('button', { name: 'Move' }).first().click(); await p.waitForTimeout(600);
await probe('move-sheet-open');
await b.close();
```

### clamp.mjs (clamped text at 360/320, with and without WCAG 1.4.12 spacing)
```js
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const spacing = '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }';
for (const [w, h] of [[360, 780], [320, 640]]) for (const sp of [false, true]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.clock.install({ time: new Date('2026-10-21T12:00:00') });
  await p.goto('http://localhost:5406/');
  await p.getByLabel("I'm 18 or older.").check(); await p.getByRole('button', { name: "Let's start" }).click();
  await p.getByRole('button', { name: 'Get things done' }).click(); await p.locator('.welcome button').last().click(); await p.locator('.welcome').waitFor({ state: 'detached' }); await p.waitForTimeout(800);
  const res = {};
  for (const [route, sel] of [['plan', '.quest-disclosure strong'], ['learn', '.learn-topic-hook'], ['you', '.you-link > span:last-child']]) {
    await p.goto('http://localhost:5406/#' + route); await p.waitForTimeout(1200);
    if (sp) await p.addStyleTag({ content: spacing });
    await p.waitForTimeout(300);
    res[route] = await p.evaluate(sel => { const els = [...document.querySelectorAll(sel)]; return `${els.filter(e => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1).length}/${els.length}`; }, sel);
    if (sp && w === 320) { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: `/tmp/cj3/job6-scratch/shots/reflow-clamp-${route}-320x640.png` }); }
  }
  console.log(`${w}x${h} spacing=${sp}`, JSON.stringify(res));
  await p.context().close();
}
await b.close();
```

### supp2.mjs (practice drop through to its finish)

The state names in this script say `learn-7-quiz-question` and `learn-7b-quiz-feedback`. On a fresh profile those screens turned out to be the practice finish and the Learn hub after it. That is why they are reported as "practice finish" above.
```js
// Supplement 2: a practice drop past its lesson, to reach a quiz question and its feedback (batch 1 "question, feedback").
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { CONFIGS, results, record, tabWalk } from './audit.mjs';
const BASE = 'http://localhost:5406/';
const EXE = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
for (const cfg of CONFIGS) {
  const b = await chromium.launch({ executablePath: EXE });
  try {
    const page = await (await b.newContext({ viewport: { width: cfg.w, height: cfg.h }, colorScheme: cfg.scheme })).newPage();
    await page.clock.install({ time: new Date('2026-10-21T12:00:00') });
    await page.goto(BASE);
    await page.getByLabel("I'm 18 or older.").check(); await page.getByRole('button', { name: "Let's start" }).click();
    await page.getByRole('button', { name: 'Get things done' }).click(); await page.locator('.welcome button').last().click();
    await page.locator('.welcome').waitFor({ state: 'detached' }); await page.waitForTimeout(800);
    await page.goto(BASE + '#learn'); await page.locator('.learn-topic-expand').first().click();
    await page.locator('.learn-trail button').filter({ hasText: 'Practice' }).first().click(); await page.waitForTimeout(1200);
    const lesson = page.locator('.step-lesson');
    for (let i = 0; i < 12 && await lesson.count(); i++) {
      const fb = page.locator('.learn-feedback');
      if (await fb.count()) { await fb.getByRole('button').last().click(); await page.waitForTimeout(400); continue; }
      const phase = await lesson.getAttribute('data-lesson-phase');
      if (phase === 'teach') { await lesson.getByRole('button', { name: 'Continue' }).click(); continue; }
      await lesson.locator('button').filter({ hasNotText: /Show hint|Back/ }).first().click(); await page.waitForTimeout(400);
    }
    await page.waitForTimeout(800);
    await record(page, cfg, 'learn-7-quiz-question', { walk: await tabWalk(page, 6) });
    await page.locator('.learn-drop button').filter({ hasNotText: /Leave|Back|hint/i }).first().click(); await page.waitForTimeout(800);
    await record(page, cfg, 'learn-7b-quiz-feedback', { feedback: await page.locator('.learn-feedback').count() });
  } catch (e) { console.log(cfg, 'FAILED', String(e).split('\n')[0]); }
  await b.close();
}
writeFileSync('/tmp/cj3/job6-scratch/results-supp2.json', JSON.stringify(results, null, 1));
```
