# Accessibility audit of the live site (Job 3)

Date: 2026-10-22. Site: https://nandi.nandi11.workers.dev (ETag `6c093caba0b20be240cba831da58af5d`).
Code refs are `file:line` on origin/main `78d1a28`. Every behaviour I checked on the live site matched that code.

## Method

- Playwright 1.55.1 + @axe-core/playwright 4.14.0 (axe-core 4.14.0), Chromium 1194, headless.
- Axe tags: `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`.
- 4 configs: 360x780 and 1280x800, light and dark (`colorScheme`). Fresh profile per config. Clock faked to 12:00, then 23:40 for the night routine.
- 26 states per config, 104 axe runs in all:
  - first run: hello, goals, bedtime
  - Learn: topic pick, first drop item, question, feedback, Learn hub
  - Plan: empty, with a task, Move sheet
  - Mind: hub, case, case with a mark, daily board (Number Path)
  - Train: assessment, placement
  - You: hub, Settings
  - night: all 6 cards, plus the night drop feedback
- Manual checks on each state:
  - full Tab walk: focus order, whether focus leaves an open dialog, and whether each stop shows a visible change
  - size of every visible control
  - computed names of icon buttons
  - text contrast on solid-colour buttons
  - reduced motion: OS setting and the in-app toggle
  - focus hidden under the fixed tab bar
  - reflow and text spacing at 320 px
- Screenshots are in `/tmp/cj-a11y/shots/` (not committed). Names follow `<state>-<WxH>-<scheme>.png`, e.g. `plan-3-postpone-sheet-360x780-light.png`.

## Summary

| # | Problem | WCAG 2.2 | Level | Where | Configs |
|---|---|---|---|---|---|
| 1 | Modal dialogs do not take focus, do not keep it, and Escape does nothing | 2.4.3, 2.4.11 | A, AA | Welcome, Move sheet, 8 other dialogs | all 4 |
| 2 | White on orange primary buttons: 3.61:1 | 1.4.3 | AA | almost every screen | light |
| 3 | Orange eyebrow/pill text: 3.02 to 3.53:1 | 1.4.3 | AA | 18 of 20 day states | light |
| 4 | Number Path board: no visible focus, every empty cell outlined | 2.4.7 | AA | Mind board | all 4 |
| 5 | Focused control hidden under the fixed tab bar | 2.4.11 | AA | Settings, Backup | 360 and 1280 |
| 6 | Green side quest buttons: 3.55:1 | 1.4.3 | AA | Plan | light |
| 7 | Learn hub "Start" button: 4.47:1 | 1.4.3 | AA | Learn hub | light |
| 8 | `role="grid"` with no rows or cells | 1.3.1 | A | all 5 board types | all 4 |
| 9 | `aria-expanded` on a text input | 4.1.2 | A | Plan quick add | all 4 |
| 10 | Accessible name does not contain the visible label | 2.5.3 | A | Plan, Mind hub | all 4 |
| 11 | `aria-label` on a `<p>` (ignored by screen readers) | 4.1.2 | A | Welcome steps, board/case timer | all 4 |

Axe totals: 6 rules, 12 distinct failures, 220 node hits. Contrast accounts for 148 of the hits, all in light mode.
Dark mode had no contrast failures. The night deck had zero axe failures in all 4 configs.

Sources quoted below:
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- ARIA APG modal dialog: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- MDN `<dialog>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- WCAG technique C43: https://www.w3.org/WAI/WCAG22/Techniques/css/C43

---

## 1. Modal dialogs do not manage focus (worst)

WCAG 2.4.3: "focusable components receive focus in an order that preserves meaning and operability."
WCAG 2.4.11: "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content."
APG: "When a dialog opens, focus moves to an element inside the dialog." Tab "moves focus to the next tabbable element inside the dialog". Escape "Closes the dialog."

What happened:

- **Welcome** (`firstrun-1-hello-*.png`):
  - Focus starts on `<body>`.
  - The first 38 Tab presses land on the hidden Plan screen behind the full-screen overlay: today dots, courtyard, quick add fields, quests, tab bar. Every one of them is invisible to the user.
  - Tab 39 finally reaches "Let's start".
  - Escape does nothing.
- **Move sheet** (`plan-3-postpone-sheet-*.png`, `plan-sheet-after-tabs-360x780-light.png`):
  - After tapping "Move", focus stays on the Move button behind the sheet.
  - 12 Tab presses never enter the sheet. They end on "Rituals" in the page below.
  - Escape does not close the sheet.
- The background is never made `inert`. It relies on `aria-modal` only, and screen reader support for that varies on Android.
- No dialog in `src/ui` handles Escape, moves focus, or returns focus to the trigger. Grep finds no `Escape`, no `inert` and no dialog `focus()`.

Affected dialogs:
- `src/ui/welcome/Welcome.tsx:63`
- `src/ui/tasks/PostponeSheet.tsx:43`
- `src/ui/tasks/TaskDetail.tsx:28`
- `src/ui/tasks/TaskQuickAdd.tsx:82`
- `src/ui/screens/Plan.tsx:103`
- `src/ui/shell/EconomyFeedback.tsx:156`
- `src/ui/shell/FinishMoment.tsx:11`
- `src/ui/cast/UnitScene.tsx:12`
- `src/ui/screens/RecapShare.tsx:40`
- `src/ui/screens/NightPauseCard.tsx:53`

Fix:
- Add one shared `Modal` component built on native `<dialog>` with `showModal()`. MDN: "Everything outside the modal dialog is inert", and "a dialog invoked by the `showModal()` method can be dismissed by pressing the Esc key."
- On open, focus the heading (`tabIndex={-1}`) or the first control. On close, return focus to the trigger.
- Wire `onCancel`:
  - Escape closes the sheets.
  - The welcome should stay put (it has no close action), so it calls `preventDefault()`.
  - The night pause card also calls `preventDefault()`.
- Stopgap if `<dialog>` is too big a change now: in `AppShell.tsx:187`, set `inert` on `header.topbar`, `main#main` and the `TabBar` while `welcomeNeeded` is true. Put a `useEffect` in each sheet that focuses the sheet and listens for Escape.

## 2. White on orange primary buttons fail contrast (light)

WCAG 1.4.3: text needs "a contrast ratio of at least 4.5:1".

- Measured `#FFFFFF` on `#C9700F` = **3.61:1**. The text is 16 px semi-bold, which is not "large text".
- Seen on:
  - first run: Let's start, Next, Start a 2-minute drop
  - Plan: Add task, Start focus, Save new time
  - Learn feedback: Next
  - Mind: Practice, Accuse
  - Train: 3 days, Mon/Wed/Fri, Start placement, Record test
  - Settings: Save night plan
- Screenshots: `firstrun-1-hello-360x780-light.png`, `train-1-assessment-360x780-light.png`, `plan-2-with-task-360x780-light.png`.
- Source:
  - `src/ui/redesign.css:4` sets `button { background: var(--accent); color: var(--on-accent) }`.
  - The light tokens at `src/ui/theme.css:34` and `src/ui/theme.css:51` set `--accent: #C9700F; --on-accent: #FFFFFF`.

Fix:
- In both light blocks, set `--accent: #9B5200`. That is the existing `--area-do` and gives 5.83:1 with white.
- If the brighter orange must stay for decoration, add `--button: #9B5200` instead and use it in `redesign.css:4`.
- Dark mode passes (dark ink on `#FFB25B`). Leave it as is.

## 3. Orange eyebrow and pill text fails contrast (light)

- `.eyebrow` and `.pill` use `color: var(--accent)` (`#C9700F`), 12 px bold:
  - on `--bg` `#F6F1E7`: **3.21:1**
  - on `--surface-1` `#FFFCF6`: **3.53:1**
  - on `--surface-2` `#F1EADD`: **3.02:1**
- Hits every light day screen. Examples: "Make room for what matters", "Your tasks", "Today", "Inflation" in the drop bubble, "Now" on the focus card.
- Screenshots: `learn-2-lesson-first-360x780-light.png`, `plan-1-empty-360x780-light.png`, `you-1-360x780-light.png`.
- Source: `src/ui/redesign.css:19`.

Fix: use `color: var(--accent-ink)` at `redesign.css:19`. `#8A4A06` measures 6.09 / 6.70 / 5.73:1 on those three backgrounds. Fix 2 alone (`--accent: #9B5200`) would also pass, but only at 4.88:1 on surface-2, so make this change as well.

## 4. Number Path board: focus is invisible and every empty cell is outlined

WCAG 2.4.7: "the keyboard focus indicator is visible."

- At the start, every empty cell gets the class `path-head`. `state.path` is empty, so `order` is -1 for every cell and `state.path.length - 1` is also -1.
- `.mind-cell.path-head` draws a 3 px teal outline (`src/ui/mind/mind.css:35`). Its specificity (0,2,0) beats `button:focus-visible` (`src/ui/redesign.css:7`).
- Result:
  - The whole grid looks highlighted.
  - The focused cell looks the same as all the others. 25 of 25 cells showed no change on focus, in every config.
  - The real path head is not distinguishable.
- Screenshots: `mind-4-board-360x780-light.png`, `mind-board-focus-360x780-light.png` (focus is on cell "2"; nothing marks it).
- Source: `src/ui/mind/Boards.tsx:118`.

Fix:
- `Boards.tsx:118`: change the class test to `order >= 0 && order === state.path.length - 1 ? 'path-head' : ''`.
- `mind.css`, after line 35: add `.mind-grid .mind-cell:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; z-index: 2; }`. Focus then wins over `path-head`, `conflict` and `hint-focus` too.
- Arrow keys already move between cells (checked), so no other keyboard work is needed.

## 5. Focused controls end up under the fixed tab bar

WCAG 2.4.11 again. The tab bar is `position: fixed`, 64 px tall (`src/ui/theme.css:133`, `src/ui/redesign.css:268`). The page has no `scroll-padding`.

Tabbing forward, Chrome scrolls the focused control only to the bottom of the viewport, which puts it behind the bar:
- Settings, 360x780: "Replacement action" and "Save reward" 100% hidden. A text input 62% hidden.
- Settings, 1280x800: "Save night plan" 100% hidden.
- Backup, 1280x800: "Ask to keep data on this device" 100% hidden. Screenshot: `focus-obscured-backup-1280x800-light.png`.

Fix (technique C43, "Using CSS scroll-padding to un-obscure content"):
- In `theme.css`: `html { scroll-padding-bottom: calc(76px + env(safe-area-inset-bottom)); }`.
- The top bar is `position: relative` (`redesign.css:266`), so no top padding is needed.
- The existing `scroll-margin-bottom` on `.learn-feedback` (`redesign.css:418`) can stay.

## 6. Side quest buttons fail contrast (light)

- "Done", "+1", "+5": `#657D13` on `#E0E3C9` = **3.55:1** (16 px).
- Screenshot: `plan-1-empty-360x780-light.png`.
- Source: `src/ui/quests/quests.css:35`.

Fix: add a light-only ink token, e.g. `--area-extra-ink: #4A5C0E` (5.66:1 on that background), and use it for `color` at `quests.css:35`.

## 7. Learn hub "Start" button just under 4.5:1 (light)

- `#0F6E61` on `#CFE0D8` = **4.47:1**.
- Screenshot: `learn-5-hub-360x780-light.png`.
- Source: `src/ui/learn/learn.css:84`.

Fix: set `color: #0C5E53` (5.58:1), or mix 14% instead of 20% for the background.

## 8. Board grids have `role="grid"` but no rows or cells

WCAG 1.3.1: relationships must be "programmatically determined".

- Axe `aria-required-children` (critical) on `.mind-grid`: the grid's children are plain `<button>`s.
- A screen reader announces a grid and then finds no rows or cells.
- Source: `src/ui/mind/Boards.tsx:51`, `:73`, `:79`, `:117` (Sudoku/Calcudoku, Crowns, Sun & Moon, Number Path).

Fix, either:
- simplest: change to `role="group"` and keep the `aria-label`. Cell names already say "Row 1, column 2".
- full pattern: wrap each row in `<div role="row" style={{display:'contents'}}>`, give each cell `role="gridcell"`, and put the button inside or make the cell itself focusable.

## 9. `aria-expanded` on the quick add text input

- Axe `aria-allowed-attr` (critical). The textbox role does not allow `aria-expanded`.
- Shows on Plan and behind the welcome overlay.
- Source: `src/ui/tasks/TaskQuickAdd.tsx:68` (`aria-expanded={open}`).

Fix: remove it. If the extra fields that open on focus need announcing, add a "More options" disclosure button with `aria-expanded` and `aria-controls`.

## 10. Accessible name does not contain the visible label

WCAG 2.5.3: "the name contains the text that is presented visually." Voice control users say what they see.

- "Add your own" has `aria-label="Add custom quest"`. Source: `src/ui/quests/SideQuests.tsx:75`. Fix: drop the `aria-label`, or use "Add your own quest".
- The Mind hub chips are named "Case: not done" / "Board: not done". Their visible text is "Case" + "Not done" with no space between the elements, so axe flags it.
  - Source: `src/ui/screens/Mind.tsx:415-416`.
  - Fix: drop `aria-label` and render `<strong>Case</strong> <span>Not done</span>` (with the space), so the name comes from the content.

## 11. `aria-label` on a `<p>` element

`aria-label` is not allowed on a generic `<p>`, so screen readers drop it.

- Welcome step dots: `<p className="welcome-steps" aria-label="Step 1 of 3">`. Axe `aria-prohibited-attr`.
  - Source: `src/ui/welcome/Welcome.tsx:65`.
  - Fix: `role="img"` on the `<p>`, or visually hidden text "Step 1 of 3" inside it, with the dots `aria-hidden`.
- Timers: `<p aria-label="Active time">`. Axe "needs review".
  - Source: `src/ui/screens/Mind.tsx:393`, `src/ui/mind/CaseScreen.tsx:322`.
  - Fix: remove the `aria-label`. The visible "Time 0:03" is clear. Keep it out of any live region so it does not read every second.

---

## Manual checks that passed

| Check | Result |
|---|---|
| Tap targets ≥ 44 px | 0 visible controls under 44×44 on all 26 states × 4 configs. So 2.5.8 (24 px minimum) passes with margin. |
| Visible focus | 3 px outline on every Tab stop except the Number Path cells (#4). Night deck uses `#9FA8FF`. Train equipment checkboxes show the ring on the label (`train-check-focus-360x780-light.png`). |
| Focus order within screens | DOM order matches visual order. No upward jumps except tab bar to top. Order: 4 header status dots, then content, then 5 tab links. |
| Icon button names | Night close "×" → "Leave night deck". Task circle → "Done". "+1"/"+5" → "Add 1 to ...". Back → "Back to Plan/Mind/You". Status dots → "Plan: not done". No unnamed visible icon button found. |
| Live feedback | Learn and night drop feedback use `role="status"` (`LearnDrop.tsx:282`, `StepLesson.tsx:77,83`). |
| Reduced motion (OS) | With `prefers-reduced-motion: reduce`: 0 running animations on welcome, drop, feedback, Plan, Courtyard, Mind, night. Without it: 1 to 10 (cast arrive, courtyard drift, blink, shake, bounce). Global rule at `theme.css:151`. |
| Reduced motion (in-app) | Settings → Motion → Reduced sets `data-motion="reduce"`. Plan, Courtyard, Learn and the drop then had 0 running animations. |
| Reflow and text spacing | At 320×640 with WCAG 1.4.12 spacing forced, no horizontal scroll on any screen and no clipped text, except the existing ellipsis on the You "Courtyard" card subtitle. |
| Dark mode contrast | 0 contrast failures on all states at both sizes. |
| Night routine | 0 axe failures on all 6 cards and the drop feedback, in all 4 configs. |

## Limits

- Axe could not decide contrast for text over gradients or translucent layers. The tab bar, top bar and courtyard banner were "needs review" on most screens; I did not grade them by hand.
- Only the daily board (Number Path) was opened. The other 4 board types share #8. The #4 bug is Number Path only.
- No real screen reader (TalkBack) run. Name and role findings come from axe and computed names.
- Checkbox and toggle focus was checked on Train only.

## Fix order

1. #1: one shared `<dialog>` Modal. Fixes 10 dialogs at once.
2. #2, #3, #6, #7: token and colour changes in `theme.css`, `redesign.css`, `quests.css`, `learn.css`. Re-run axe in light mode afterwards.
3. #4: one-line class fix plus one CSS rule.
4. #5: one `scroll-padding-bottom` line.
5. #8 to #11: small attribute changes.
