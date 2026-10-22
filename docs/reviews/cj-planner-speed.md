# Planner capture speed benchmark (cloud job 8, 22 Oct 2026)

Question: how many taps does a busy student need to capture and plan 6 tasks in TickTick, Todoist,
Structured, Google Tasks and NANDI? What is the fastest capture flow NANDI can build simply?

Code read on `origin/main` at `78d1a28`. Live site driven with Playwright (Chromium, 390×844, touch, Asia/Kolkata).

## Short answer

- NANDI today needs about **40–55 touches** for the 6 tasks. TickTick and Todoist need about **12**.
  Google Tasks and Structured (Android) need about **30–40** (estimates).
- **The quick-add bug is reproduced.** If you press Enter, task 1 saves, and tasks 2 and 3 are silently not saved.
  Root cause: after a save the form unmounts, but the input keeps focus, so `onFocus` never fires again
  ([details below](#root-cause-of-the-dropped-tasks-reproduced)).
- Recommended flow: **one always-open line, Enter saves and keeps focus**, plus a small pure-TS parser
  `src/core/tasks/capture.ts` for English and Hinglish times. That brings the 6 tasks to **7 taps**
  (1 to focus, then 6 Enters), or **3–4 taps** by pasting a list. No new dependency is needed.

## The test scenario

The same 6 tasks for every app, typed on a phone at 3:20 pm on a Thursday:

| # | What the student types (NL-capable apps) | Meaning |
|---|---|---|
| 1 | `gym 6pm` | today 6 pm |
| 2 | `maths revision 7pm 45m` | today 7 pm, 45 min |
| 3 | `kal subah call mom` / `call mom tomorrow 8am` | tomorrow 8 am |
| 4 | `physics assignment fri 11pm` | Friday 11 pm |
| 5 | `buy notebook` | no date |
| 6 | `group study sat 4pm 90m` | Saturday 4 pm, 90 min |

"Plan" here means seeing them in time order on the right days afterwards.

How I counted: one tap = one touch on a control, including Enter/Go/Send. Typing letters is not counted.
A scroll needed to reach a button counts as 1. When a help page names the steps, the count comes from that page.
Picker taps (date or time wheels) are **estimates**, marked "est."

## Results

| App | Typed dates/times parsed? | Taps per timed task | Taps for all 6 | After capture ("plan") | Source of count |
|---|---|---|---|---|---|
| **TickTick** | Yes, "Smart Recognition" (English examples) | 2 (+, send) | **12** | List/calendar view, about 1 tap | Help page, below |
| **Todoist** | Yes, natural language (English examples) | 2 (Add, submit) | **12**, or about 7 if Quick Add stays open (not documented) | Today/Upcoming, about 1 tap | Help pages, below |
| **Structured (Android)** | Help page says natural language is **iOS only** | about 5–7 est. (plus, date, duration, time wheel, Create Task) | **about 28–38 est.** | Timeline, 0 taps | Help page, below |
| **Google Tasks** | Not documented; help shows only a date/time picker | about 6–8 est. (Add task, Add date/time, date, time, Done, Save) | **about 32–42 est.** | List sorted by date, about 1–2 taps est. | Help page, below |
| **NANDI today** | Only a trailing `15m`/`2h` estimate (`TaskQuickAdd.tsx:25`) | 3 measured + 3–6 picker est. + 1 scroll | **about 40–55** (19 measured + picker + scroll) | Today list sorted, but Upcoming is folded under "Later" and shows the time with no day | Code + live run |
| **NANDI proposed** | English + Hinglish, offline | 1 (Enter) | **7** (or 3–4 by paste) | Same lists, with the day shown | Design below |

None of the four competitors documents Hindi or Hinglish date words. I did not test them in the apps.

### Competitor steps, with quotes

**TickTick** ([Add Tasks help page](https://help.ticktick.com/articles/7055782422935240704); the page is a JS app, so I read it with curl):
- Mobile: "Click the "+" icon that is visible everywhere, enter the task, and click the icon to easily create the task."
- Dates: "TickTick supports recognizing dates and times in tasks. You only need to add dates and time in the task
  content, and we will automatically set the reminder time for you". Example given: "Meeting at 9 tomorrow".
- Undo a wrong parse: "press the "Delete" key on the keyboard or click on the "recognized time" to cancel recognition."
- Batch: "Copy multiple lines of text and the app will prompt "Batch Add Tasks" when opened. Select "OK" to create
  multiple tasks." The page does not say whether dates inside pasted lines are parsed.
- Feature history: smart date parsing shipped in 2.7.0 ([TickTick blog, 2016](https://blog.ticktick.com/2016/04/12/ticktick-270-a-new-breakthrough-with-city/)).

**Todoist**:
- Open: "Tap or drag the Dynamic Add button to any spot in your project or display."
  ([Quick Add](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz)).
  Then "Enter the task name and add any details." and "Tap the submit button to save the task."
  ([Dynamic Add button](https://todoist.com/help/articles/use-the-dynamic-add-button-in-todoist-ysybl2M1)).
- Dates: "using natural language like tomorrow at 4 PM or every other Tuesday starting March 3"
  ([Quick Add](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz);
  [Dates and time](https://www.todoist.com/help/articles/introduction-to-dates-and-time-q7VobO)).
  The dates page notes "Dates in Czech and Turkish aren't supported yet." It lists no Hindi.
- Paste a list: "Paste your list in the task name field." Then "You'll see a pop-up asking, "Add X tasks?""
  ([Add or manage multiple tasks](https://todoist.com/hc/en-us/articles/6246468182684)).
- Not documented: whether Quick Add stays open after submit. So the 6-task count is 7 to 12.

**Structured** ([How to Create, Edit & Delete Tasks](https://help.structured.app/en/articles/338050)):
- "tap on the large plus symbol in the lower-right corner. Alternatively, you can tap on Add Task in a free time slot."
- Date defaults to the day you are viewing ("Tap the date to change the day"). Duration "is set to 15 minutes",
  changed "using the Duration slider". Time is a scroll wheel by default.
- "When you are finished creating your task, tap on Create Task".
- "On iOS, Structured also supports natural language input." So on Android, each timed task goes through the pickers.
  The tap count is an estimate from these steps.

**Google Tasks** ([Add or edit a task, Android](https://support.google.com/tasks/answer/7675838?hl=en&co=GENIE.Platform%3DAndroid)):
- "Tap Add task. Enter a title. … To add a date and time or repeat a task, tap Add date/time Done. Tap Save."
- The page does not mention typed dates. I found no Google source that says Tasks parses them, so I treat it as "no".
  The picker sub-steps (day, time, OK) are estimates.

### NANDI today, counted from the code and the live site

The capture box is `TaskQuickAdd`. It appears on Plan (`src/ui/screens/Plan.tsx:88`), the Tasks screen
(`src/ui/screens/Tasks.tsx:34`) and the Morning plan (`src/ui/screens/Planner.tsx:138`).
`src/ui/screens/Today.tsx` is the Focus screen and has no capture.

**The 9-field form.** Tapping the box opens a card with 9 controls after the title:
Size, Minutes, Category, Priority (2 radios), Place it (3 radios), Repeat and Start time
(`TaskQuickAdd.tsx:72-79`), then "Add task" (`:80`). On the live site at 390×844, the input sits at y 583–631.
The form runs from y 651 to 1469, and "Add task" is at y 1401. So the whole form opens **below the fold**,
and the user must scroll to save. This was measured before the keyboard opens; the keyboard makes it worse.

**The 6-task run (live, best path the UI allows).** For each task: tap the input, type, tap Start time
(or "Unplaced"), tap "Add task".

| Task | Direct taps (measured) | Native date-time picker (est.) | Scroll to "Add task" (est.) |
|---|---|---|---|
| Gym 6pm | 3 | 3–6 | 1 |
| Maths revision 45m 7pm | 3 | 3–6 | 1 |
| Call mom tomorrow 8am | 3 | 3–6 (date change too) | 1 |
| Physics assignment Fri 11pm | 3 | 3–6 | 1 |
| Buy notebook (Unplaced) | 3 | 0 | 1 |
| Group study Sat 4pm | **4** (Place it stayed on "Unplaced", so 1 extra tap) | 3–6 | 1 |
| **Total** | **19** | **15–30** | **6** |

So the total is about 40–55 touches. A typed "6pm" does nothing; only the `datetime-local` picker
(`TaskQuickAdd.tsx:79`) sets a time.

Other problems found in the same run:

| Problem | Evidence | Effect |
|---|---|---|
| Estimate carries over to the next task | `onBlur` copies the parsed `45m` into `estimate` (`TaskQuickAdd.tsx:68`). The reset after save clears only the title and repeat (`:50`). Live: "Call mom", "Physics assignment" and "Buy notebook" were all saved as **45 min**. | Wrong durations, so the day-capacity maths is off. |
| Placement carries over | `schedule` is not reset (`:18`, `:50`). After "Unplaced", Start time is hidden for the next task. | Extra tap; easy to park a timed task by mistake. |
| Start time carries over | `slot` is set once at mount (`:20`). | The next timed task defaults to the previous task's time, not the next free hour. |
| "Task added." stays on screen | The message from `act` (`useTaskBoard.ts:37`) is shown by `Plan.tsx:90` and stays after the failed Enters. | The user believes tasks 2 and 3 were saved. |
| Upcoming has no day | `TaskList.tsx:16` shows only `toLocaleTimeString`. Live: "Call mom · 8:00 AM" with no "tomorrow". Upcoming sits inside the folded "Later" card (`Plan.tsx:94`). | Planning needs a tap, and the day is still unclear. |
| `tomorrowSlot` ignores the 4 am day | `Planner.tsx:24-29` adds one calendar day. At 1:30 am that gives the day after the next planning day. | Shutdown's "tomorrow" can be off by a day after midnight. |

## Root cause of the dropped tasks (reproduced)

Live repro: tap the box, then type `Maths revision 45m` + Enter, `Gym 30m` + Enter, `Call mom 15m` + Enter.

| After | Form mounted | Input value | Input focused | Status line |
|---|---|---|---|---|
| Task 1 | no | `""` | yes | "Task added." |
| Task 2 | no | `"Gym 30m"` | yes | "Task added." (stale) |
| Task 3 | no | `"Gym 30mCall mom 15m"` | yes | "Task added." (stale) |

Only "Maths revision" was saved.

Cause, step by step:
1. The input lives **outside** the form and joins it by `form="plan-add-form"`. The form only opens from
   `onFocus={() => setOpen(true)}` (`TaskQuickAdd.tsx:68`).
2. The form is rendered only while `open` is true (`:69`).
3. After a save, `setOpen(false)` unmounts the form (`:50`), but focus stays in the input.
4. The input is already focused, so no new `focus` event fires and `open` stays false.
   Its `form` attribute now points at an element that does not exist. The input has no form owner,
   so Enter does nothing, silently.
5. The title is not cleared, so the next task is appended to it ("Gym 30mCall mom 15m").

Why CI missed it: `tests/e2e/planner.spec.ts:37-42` adds several tasks, but it clicks the input and then the
"Add task" button each time. Clicking the button moves focus away, so the next click fires `focus` again.
The keyboard-only path is never tested.

Smallest fix: wrap the input in its own always-mounted `<form>`. After a save, keep it open and keep focus.
Add an e2e test that adds 3 tasks with Enter only, then checks for 3 rows.

## Does `src/core` already parse dates or times?

No. I searched for parse/chrono/natural and for Hindi words:

- `src/core/time/dayKey.ts:2` gives the 4:00 am planning day. Reuse it.
- `src/core/time/nightTimeline.ts:4` (`minutesAfterNoon`) parses `"HH:MM"` settings strings only.
- The only text parsing is in the UI, the trailing-duration regex `/^(.*?)\s+(\d+)(m|h)$/i` (`TaskQuickAdd.tsx:25`).
  It should move into core.
- A library does not fit. `chrono-node` 2.10.3 is about 3.2 MB unpacked, and its README lists English plus
  `fi, fr, id, it, ja, nl, ru, uk, vi` and partial `de, es, pt, sv, zh`, but no Hindi
  ([README](https://github.com/wanasit/chrono/blob/master/README.md)). A small hand-written parser is simpler.

## Recommendation: the fastest capture flow with the simplest build

### Flow (7 taps for 6 tasks)

1. One line at the top of Plan, always inside its own `<form>`. Placeholder: `gym 6pm · kal subah call mom`.
2. While typing, one chip under the line shows the reading, e.g. `Fri 8:00 am · 30 min`.
   The chip has an ✕ that keeps the words as plain title text. TickTick uses the same pattern ("click on the
   recognized time to cancel recognition").
3. Enter saves the task. The line clears and **keeps focus and the keyboard**. A polite live region says
   `Added: call mom · Fri 8:00 am`, and the message is replaced on every save, never left stale.
4. Pasting several lines opens one sheet: "Add 6 tasks?" with Add / Cancel. Each line goes through the same parser.
   Todoist and TickTick both do this.
5. Size, category, Must/Could, repeat and an exact time move behind a "More" link. They open only on request and
   **reset after every save**. Defaults: Could, 30 min, general.
6. Upcoming rows show the day ("Fri 8:00 am"), using the existing `formatDayKey` in `src/core/time/formatDayKey.ts`.

Keep the non-negotiables: a parsed Must still obeys `maxMustsPerDay`. Nothing here adds points, streaks or randomness.

### Parser: `src/core/tasks/capture.ts`

`parseCapture(text: string, now: number): { title; dayKey?; startAt?; estimateMin? }`. Pure TS, offline, no
React or Dexie, tests written first. All word lists and default hours go in `rules.config.ts` under
`tasks.capture`. It uses `dayKey()` from `src/core/time/dayKey.ts`.

Rules, kept small on purpose:

| Rule | Detail |
|---|---|
| Day words | `aaj/today/tonight` = +0, `kal/tomorrow/tmrw/tmr` = +1, `parso` = +2, counted from the **planning day** `dayKey(now)`. So "kal" said at 1:30 am means the coming morning. |
| Weekdays | English (`fri`, `friday`) and Hindi (`somvar`, `mangalvar`, `budhvar`, `guruvar`, `shukravar`, `shanivar`, `ravivar`, with -war spellings). Each means the next one, today included. |
| Parts of day | `subah/morning` 8, `dopahar/afternoon` 14, `shaam/evening` 18, `raat/night/tonight` 21. An optional `ko` after the word is dropped. |
| Clock | `6pm`, `6:30`, `6.30pm`, `at 9`, `6 baje`, `saade 6 baje` (6:30). A bare number counts as a time **only** with am/pm, `baje`, `:mm`, `at`, or a part-of-day word, so `read 50 pages` and `chapter 5` stay as typed. |
| am or pm | `subah` keeps the hour as written. `dopahar/shaam` add 12. `raat` reads 7–11 as pm and 12–3 as late night. With no hint: on today, the next future match; on later days, 1–6 means pm and 7–12 means as written. |
| 4:00 am boundary | Hours 0–3 belong to the planning day before. So `raat 1 baje` stays on today's `dayKey` but lands at 1 am on the next calendar date. |
| Past times | If there is no day word and the time has passed today, it moves to tomorrow ("gym 6pm" typed at 7 pm). With an explicit `aaj` it stays, and the chip says the time has passed. |
| Day without time | Placed at 9:00, matching the Shutdown copy "Leave time blank to start at 9:00 AM" (`Planner.tsx`). |
| Duration | `15m`, `45 min`, `1h`, `1.5h`, `2 ghante` set the estimate. Anything over `maxEstimateMin` (90) goes to the existing split preview. |
| Nothing found | Title only. Placement follows the product default (see open questions). |

### Example inputs and outputs

These rows are the real output of a ~65-line prototype of these rules, run in Node with TZ=Asia/Kolkata.
The prototype was not committed; only this report was.

| Input | Typed at | Title | dayKey | Start | Minutes |
|---|---|---|---|---|---|
| `gym 6pm` | Thu 3:20 pm | gym | 2026-10-22 | Thu 22 Oct, 6:00 pm | — |
| `gym 6pm` | Thu 7:10 pm | gym | 2026-10-23 | Fri 23 Oct, 6:00 pm | — |
| `gym 6 baje` | Thu 7:10 pm | gym | 2026-10-23 | Fri 23 Oct, 6:00 pm | — |
| `kal subah call mom` | Thu 3:20 pm | call mom | 2026-10-23 | Fri 23 Oct, 8:00 am | — |
| `kal subah call mom` | **Fri 1:30 am** (still Thu's dayKey) | call mom | 2026-10-23 | Fri 23 Oct, 8:00 am | — |
| `maths revision 7 baje 45m` | Thu 3:20 pm | maths revision | 2026-10-22 | Thu 22 Oct, 7:00 pm | 45 |
| `parso shaam 5 baje group study` | Thu 3:20 pm | group study | 2026-10-24 | Sat 24 Oct, 5:00 pm | — |
| `shaam ko 6 baje walk` | Thu 7:10 pm | walk | 2026-10-23 | Fri 23 Oct, 6:00 pm | — |
| `aaj raat 11 baje journal` | Thu 3:20 pm | journal | 2026-10-22 | Thu 22 Oct, 11:00 pm | — |
| `raat 1 baje sleep` | Thu 3:20 pm | sleep | **2026-10-22** | Fri 23 Oct, 1:00 am | — |
| `dopahar 2 baje lunch with Riya` | Thu 3:20 pm | lunch with Riya | 2026-10-23 | Fri 23 Oct, 2:00 pm (2 pm today had passed) | — |
| `saade 6 baje tuition` | Thu 3:20 pm | tuition | 2026-10-22 | Thu 22 Oct, 6:30 pm | — |
| `physics assignment fri 11pm` | Thu 3:20 pm | physics assignment | 2026-10-23 | Fri 23 Oct, 11:00 pm | — |
| `shanivar 4 baje cricket` | Thu 3:20 pm | cricket | 2026-10-24 | Sat 24 Oct, 4:00 pm | — |
| `tomorrow 9:30 lab` | Thu 3:20 pm | lab | 2026-10-23 | Fri 23 Oct, 9:30 am | — |
| `tonight laundry 1h` | Thu 3:20 pm | laundry | 2026-10-22 | Thu 22 Oct, 9:00 pm | 60 |
| `revise chapter 5 kal 2 ghante` | Thu 3:20 pm | revise chapter 5 | 2026-10-23 | Fri 23 Oct, 9:00 am | 120 → split preview |
| `meet at 9` | Thu 7:10 pm | meet | 2026-10-22 | Thu 22 Oct, 9:00 pm | — |
| `call bank 15m` | Thu 3:20 pm | call bank | — | — | 15 |
| `read 50 pages` | Thu 3:20 pm | read 50 pages | — | — | — |
| `room 101 cleanup` | Thu 7:10 pm | room 101 cleanup | — | — | — |
| `call 9` | Thu 7:10 pm | call 9 | — | — | — |
| `kal` | Thu 3:20 pm | kal (whole text kept, since nothing else is left) | 2026-10-23 | Fri 23 Oct, 9:00 am | — |

Edge cases for the test file: a title that is only date words; `kal` at 3:59 am and at 4:00 am; `12 baje`
vs `raat 12 baje`; `saade 12`; `fri` typed on a Friday; a DST-free zone (IST) plus one DST zone, for safety.

### Build order (small, each step testable)

1. **Bug fix first, on its own:** always-mounted `<form>`, keep focus after a save, reset every per-task field
   (estimate, placement, slot) after a save, replace the stale status. Add the Enter-only e2e test
   (3 tasks → 3 rows) at 390×844 and 360×800.
2. `src/core/tasks/capture.ts` with Vitest cases from the table above (written first). Move the regex from
   `TaskQuickAdd.tsx:25` into it.
3. `rules.config.ts`: add `tasks.capture` (word lists, part-of-day hours, `dayOnlyHour: 9`). Log the change in `DECISIONS.md`.
4. UI: the chip with ✕, "More" disclosure, multi-line paste sheet, the day on Upcoming rows.
5. Fix `tomorrowSlot` (`Planner.tsx:24`) to use dayKey + 1.

Expected result: 6 tasks in 7 taps, against about 40–55 today, and no lost tasks.

## Open questions for Jenil (product trade-offs)

1. **Tasks with no time:** today they default to "today at the next hour" (`TaskQuickAdd.tsx:18`, `model.ts:38`).
   With fast capture, 6 plain lines would all land at the same hour. My suggestion is that a task with no time
   goes to **Unplaced**, and the Morning plan places it.
2. **"kal" after midnight:** the parser treats `kal` at 1:30 am as "after I sleep", using the 4 am day.
   Some people mean the calendar day after that. The chip shows the result either way.
3. **Hinglish scope:** start with the word list above. Grow it from real typed text that fails to parse,
   kept on the device only and never sent anywhere.

## Sources

- TickTick, Add Tasks: https://help.ticktick.com/articles/7055782422935240704
- TickTick 2.7.0 smart date parsing (2016): https://blog.ticktick.com/2016/04/12/ticktick-270-a-new-breakthrough-with-city/
- Todoist, Quick Add: https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz
- Todoist, Dynamic Add button: https://todoist.com/help/articles/use-the-dynamic-add-button-in-todoist-ysybl2M1
- Todoist, Dates and time: https://www.todoist.com/help/articles/introduction-to-dates-and-time-q7VobO
- Todoist, Add or manage multiple tasks: https://todoist.com/hc/en-us/articles/6246468182684
- Structured, How to Create, Edit & Delete Tasks: https://help.structured.app/en/articles/338050
- Google Tasks, Add or edit a task (Android): https://support.google.com/tasks/answer/7675838?hl=en&co=GENIE.Platform%3DAndroid
- chrono-node README (locales): https://github.com/wanasit/chrono/blob/master/README.md
- NANDI live build: https://nandi.nandi11.workers.dev (driven 22 Oct 2026, 15:20 IST)

Not opened or not usable: no video timings were used. Todoist's help pages do not say whether Quick Add stays
open after submit. Google's help does not describe typed-date parsing either way.
