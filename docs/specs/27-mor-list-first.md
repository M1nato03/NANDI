# 27. Mor's list first: Plan becomes a plain to-do list

Status: APPROVED by Jenil, 25 Oct 2026 ("Yes to spec 27").
Idea engine, 25 Oct 2026. Sources: Jenil's notes of 25 Oct, the Codex audit of Plan
(D:\nandi-gate-logs\idea-engine\codex-mor-audit.md), and the round-3 demo
(https://claude.ai/artifact/LVWKWGavbn6VpE6uxRvWEA, Mor tab).

## Why

Jenil, 25 Oct:
- "I used the move task feature and it didn't work."
- "Some of the features of Mor for tasks are too complex."
- "Just keep them like a to-do list primarily. They can add time if they want. After they start the session,
  also start a focus timer. When that ends you will know how long the task was."
- On the demo: put the time option "in the panel where the task is added/named, not on the top. It seems like
  it's forcing me to work those specific hours or minutes, or even that work."

The audit found 20 Plan features. A new user sees most of them at once. The postponing rules (first step,
weekly budget, real-reason exceptions, fourth move to Someday) block moves without saying why.

This spec changes the CLAUDE.md line "firm about postponing but not too strict" to:
"a plain to-do list; Mor helps, never blocks".

## The first screen

Three lists only: **Today**, **Tomorrow**, **Later**. "Done" folds under Today.

Each task row has exactly three controls:

| Control | What it does |
|---|---|
| ○ (circle) | Marks the task done. |
| **Start** | Starts the focus timer for this task (see below). |
| **Tomorrow →** (on Today rows) / **← Today** (on Tomorrow and Later rows) | Moves the task at once. A toast says where it went, with **Undo**. |

Everything else (edit, steps, repeat, category, place, split, history, drop, another date) sits behind a tap
on the task name, in its detail sheet. Nothing about it appears on the first screen.

## Adding a task

- One field: "Add a task". Enter adds it to Today (or to the list the field sits under).
- The time option lives **inside the add panel**, never as a separate row above the list:
  after you type a name, a small "+ time" chip appears at the end of the field. It is empty by default.
  Tapping it shows 15 / 30 / 60 / other. It is never pre-selected and never shown as a goal.
- A task with no time shows no time anywhere. No size (Small / Medium / Large), no priority, no category at
  the add step. They stay available in the detail sheet.
- Wording rule: never "you must", "planned for", "scheduled", or a clock time on the first screen unless the
  user typed one.

## Start = focus timer

- **Start** opens the focus timer for that task. It counts up, so nothing ends on its own and there is no
  countdown.
- **Done** ends it and marks the task done. **Stop for now** ends the timer, keeps the task on Today, and still
  records the minutes worked.
- The real minutes are saved on the task (`actualMinutes`, summed across sessions). This is the only source
  of "real times". There is no estimate game and no accuracy score.
- One task can be in focus at a time. Moving a task that is in focus first stops its timer (this also fixes
  audit cause 2).

## What Mor says

- Mor speaks after a timed task, once, in one line: "Noted: 'Revise chapter 4' took 42 minutes."
  If the user had set a time: "…took 42 minutes. You set 30." No judgement words (late, over, under, failed).
- After 5 or more timed tasks, the Today header may show one plain line: "Your timed tasks so far: about
  40 minutes each." It is optional and tappable to hide.
- Mor never comments on undone tasks, moved tasks, or how many moves were made.

## Moving tasks

- **Tomorrow →** moves the task to tomorrow with no time. If the task had a time slot, it keeps its length but
  loses the clock time.
- "Another day…" in the detail sheet opens a date picker. The 04:00 day boundary is stated under the picker:
  "Times before 4 am count as the night before."
- No move is ever refused. The postponing ladder, weekly move budget, real-reason exceptions and the automatic
  fourth move to Someday are removed. Instead, after a task has moved 3 times, its detail sheet offers one
  optional line: "Make it smaller?" (split) or "Move it to Later?". Nothing happens unless the user taps.
- Every move shows a toast with Undo, and the moved task visibly lands in its new list.

## Mor is alive on this screen

Jenil, 25 Oct: "there should be animations for all the mascots, be it minor or major depending on the need."
Mor sits in the Plan header and reacts. Use the existing Cast poses (idle, cheer, think, rest) plus small CSS
transforms; no new art is needed for v1.

| Moment | Size | Animation |
|---|---|---|
| Plan opens | minor | Mor blinks and settles (idle). |
| Task added | minor | Mor nods once. |
| Task done | minor | Mor hops (cheer), one feather flick. |
| Task moved | minor | Mor glances toward the Tomorrow list as the row slides there. |
| Start | minor | Mor turns to watch the timer (think) and stays quiet while it runs. |
| Timed task finished | major | Mor fans its tail (cheer, scaled up for about 1 s) as the "Noted…" line appears. |
| Nothing left today | major | Mor rests (rest pose), with a slow breathing loop. |

Every animation honours prefers-reduced-motion (swap to a pose change with no movement), runs at most once
per action, never loops except the slow rest breathing, and never blocks a tap.

## Kept, but out of the way

Morning plan, Shutdown, Weekly review, steps and checkpoints, repeat, reminders, and the capacity line all move
behind a "More" entry on Plan. Soft days stay as they are, plus a "See my tasks" link (audit cause 6).

## Data

- Add `actualMinutes` (number, default 0) and keep the existing focus records. No migration of old data is
  needed beyond defaulting the field.
- Existing postpone events stay in history; the gate code is retired (kept in git, removed from the path).
- Online-ready (v2): `actualMinutes` and moves sync like other task fields; nothing new is needed now.

## Tests

- Add a task with no time: no time shows anywhere.
- Add with "+ time": the chip shows in the add panel only and never pre-selects.
- Start → Done saves actual minutes; Stop for now saves minutes and keeps the task.
- Tomorrow → moves at once, with a toast and Undo, and the task appears under Tomorrow.
- Moving a task in focus stops its timer and the Now card no longer shows it.
- A fourth move works like the first (no refusal, no Someday).
- 360 px with root font-size 20 px: rows wrap, nothing is clipped.

## Out of scope

Mor's tarazu (the balance scale) is parked. It can come back later as an optional "What fits tomorrow?" view
built on `actualMinutes`, after Jenil sees the simple list working.
