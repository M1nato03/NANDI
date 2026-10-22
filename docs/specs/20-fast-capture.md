# 20 · Fast capture: type it the way you'd say it

Status: idea engine (jenil-8c), 22 Oct 2026. Medium (about 1–2 days). Evidence: cloud job 8 of batch 1
(`docs/reviews/cj-planner-speed.md` on `ideas/cj-planner-speed`, which holds the full parser rules, a 23-row table of
real prototype outputs and the competitor quotes). The dropped-task bug it found is already fixed in ship-27
(`tests/e2e/quick-add.spec.ts`). Needs Jenil's yes.

## Today (measured)
- Capturing 6 ordinary tasks ("gym 6pm", "kal subah call mom", "physics assignment fri 11pm", …) takes about
  **40–55 touches** in NANDI. TickTick and Todoist take about **12**, because they read dates and times from the text.
- NANDI reads only a trailing `15m`/`2h`. Every time needs a picker; size, category, Must/Could and repeat sit in the
  open form; a task with no time lands at "today, next hour", so 6 quick lines all pile onto one hour.
- Upcoming rows show a time with no day.
- No competitor documents Hindi or Hinglish dates. "kal subah", "6 baje", "shaam ko" would be ours alone.

## The change
1. **One always-open line** at the top of Plan. Placeholder: `gym 6pm · kal subah call mom`.
2. **A chip shows what NANDI understood** while you type: `Fri 8:00 am · 30 min`. Tapping its ✕ keeps the words as
   plain title text (TickTick's pattern). The chip is the safety net: nothing is guessed silently.
3. **Enter saves, the line clears, focus and keyboard stay.** A polite live region says `Added: call mom · Fri 8:00 am`,
   replaced on every save, never stale.
4. **Paste several lines** → one sheet "Add 6 tasks?" (Add / Cancel); each line goes through the same parser.
5. **Size, category, Must/Could, repeat, exact time** move behind a "More" link and reset after every save.
   Defaults: Could, 30 min, general. A parsed Must still obeys `maxMustsPerDay`.
6. **Upcoming rows show the day** ("Fri 8:00 am") with the existing `formatDayKey`.
7. **A line with no time or day goes to Unplaced** (the existing status), not to the next hour. Morning planning places
   it. (Open question for Jenil, below.)

## The parser: `src/core/tasks/capture.ts`
`parseCapture(text, now) → { title, dayKey?, startAt?, estimateMin? }`. Pure TypeScript, offline, no dependency, no
React or Dexie, tests written first. All word lists and hours live in `rules.config.ts` under `tasks.capture`, logged
in `DECISIONS.md`. The rules (full table in the cloud report):
- Days: `aaj/today/tonight` +0, `kal/tomorrow/tmrw` +1, `parso` +2, counted from the **planning day** (`dayKey`, rolls
  at 04:00), so "kal" typed at 1:30 am means the coming morning. English and Hindi weekdays (`fri`, `shukravar`…).
- Parts of day: `subah/morning` 8, `dopahar/afternoon` 14, `shaam/evening` 18, `raat/night` 21; `ko` dropped.
- Clock: `6pm`, `6:30`, `at 9`, `6 baje`, `saade 6 baje`. A bare number is a time **only** with am/pm, `baje`, `:mm`,
  `at` or a part-of-day word, so `read 50 pages`, `chapter 5`, `room 101` stay as typed.
- A time already past today with no day word moves to tomorrow (the chip shows it). Hours 0–3 belong to the planning
  day before. A day with no time starts at 09:00 (matches the existing Shutdown copy).
- Durations: `15m`, `45 min`, `1.5h`, `2 ghante`; over the max goes to the existing split preview.
- `kal` meaning "yesterday" is ignored: tasks are never in the past, and the chip shows the reading.

## Not doing
No AI or server parsing (offline rule). No reminders added automatically. No points, streaks or randomness for
capturing. No logging of typed text anywhere. Growing the word list from text that failed to parse would need a
device-only list the user can see and clear; not in this spec.

## Open questions for Jenil
1. A task with no time: **Unplaced** (my recommendation) or today at the next hour, as now?
2. "kal" typed after midnight: the coming morning (planning day, my recommendation) or the calendar day after?

## Kill test
- Before release: Jenil types the 6 test tasks on his phone. Target ≤ 10 touches and every chip right.
- Test group, 2 weeks: count wrong chips that people had to ✕ or edit (asked, not logged). If more than 1 in 10 parsed
  lines is wrong, cut the Hindi words back to the 10 most common and retest. If people still use the old pickers
  more than the line, revert to the form.

## Tests
Unit: every row of the cloud report's table, plus `kal` at 03:59 and 04:00, `12 baje` vs `raat 12 baje`, `saade 12`,
`fri` typed on a Friday, a title that is only date words, and one DST time zone. E2E at 360×800: type 6 lines with
Enter only → 6 rows with the right days; paste 6 lines → sheet → 6 rows; ✕ on the chip keeps the words in the title.
