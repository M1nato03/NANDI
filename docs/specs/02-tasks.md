# 02 · Tasks: a planner that is firm about postponing, not too strict

Evidence: `docs/research-brief.md`, section "Postponing costs a decision, never points".

**Design principle:** the *friction* stays firm, the *emotion* stays soft. Postponing always requires a decision, never costs XP, and never triggers shame. The evidence behind each part:

- **Specific date-and-time plans:** implementation intentions, d ≈ .65 across 94 studies. Writing a date *and time* beat writing a date alone.
- **Concrete first steps:** concrete framing nearly halved delay (12.5 vs 20.5 days).
- **Calibrated estimates:** linking past durations to new estimates removed the planning fallacy.
- **Choice and self-forgiveness:** both help. Punishment (Habitica) and broken-streak shame backfire.
- **Money stakes:** 11% uptake and 66% forfeiture, so excluded.

## 1. Concepts and fields

| Field | Meaning |
|---|---|
| `size` | S ≤15 min · M 16–45 · L 46–90 (`RULES.tasks.sizeMinutes`). A task estimated over **90 min can't be saved unsplit**: it becomes 2+ subtasks of 25–60 min |
| `estimateMin` | His estimate; defaults to the size midpoint |
| `plannedSize` | Size when the task was first scheduled. **XP uses this**, so resizing later can't farm XP |
| `category` | One of: study · project · admin · personal · trading · health · general (default). Editable list in settings. Used for estimate calibration |
| `mustOrCould` | **Max 3 Musts per dayKey**; unlimited Coulds |
| `scheduledStart/End` | A time slot (ms). No slot means unplaced |
| `dayKey` | `dayKey(scheduledStart)` if scheduled, otherwise `dayKey(createdAt)`. Indexed for "today" queries |
| `place` | Optional, e.g. "library". Used in the shutdown plan |
| `firstStep` | Optional at creation; **required at the 2nd postpone** (≤10 min, ≤120 chars) |
| `postponeCount` | Shown on the task card as small pips |
| `firstScheduledDayKey` | Set on first scheduling. Gives the ×1.5 bonus if done on that day |
| `status` | planned · unplaced · done · someday · dropped |
| `parentId` | Set on subtasks from a split |
| `checkpointOf` | Multi-day work (assignment, exam prep) gets 3–4 evenly spaced checkpoint tasks proposed |

The day boundary is **4:00 am** (`dayKey`). There is **no silent rollover and no "postpone all" button.** At the boundary, a planned task that wasn't done moves to the **Unplaced tray** (`status: 'unplaced'`, slot cleared, `postponeCount` unchanged). It's triaged in the next morning plan or shutdown.

## 2. What counts as a postpone (definitions for `postponeGate()`)

- **Postpone:** moving a scheduled task's slot to a **later dayKey**, or clearing its slot, at any time.
- **Postpone:** **re-placing a task from the Unplaced tray**, because it missed its slot.
- **Postpone:** moving a slot later **within the same dayKey after the slot has started** (the 3 pm → 6 pm → 9 pm slide).
- **Not a postpone:**
  - moving a slot **within the same dayKey before the slot has started** (free rescheduling);
  - scheduling a task that was **never scheduled** (first placement);
  - moving it **earlier**.
- **Real-reason move** (class moved, illness, travel; max 2 a week): doesn't count as a postpone at all. `postponeCount` and the budget are unchanged, and `firstScheduledDayKey` moves to the new day, so the ×1.5 stays possible. It needs a one-tap reason from those three.
- **Split:** see section 4. It's offered at postpone #3 and is available any time.
- **The #3 choice sheet:** it appears when he attempts a 3rd postpone.
  - **Split** counts as postpone #3 (budget and count).
  - **Do 10 min now** isn't a postpone; the task starts now and the count stays at 2.
  - **Move to Someday** isn't a postpone and uses no budget; the task leaves the plan.
  - **Postpone anyway** counts as #3 and needs a reason.

## 3. The postpone ladder

```
 Task scheduled for a slot, not done
   │  4:00 am boundary → Unplaced tray (not itself a postpone). No silent rollover, no "postpone all".
   ▼
 POSTPONE #1 ─ must pick a new DATE + TIME (3 suggested free slots, or pick)        counts toward the weekly budget
 POSTPONE #2 ─ same, plus SHRINK IT: "What's a first step that takes ≤10 min?"      counts
 POSTPONE #3 ─ choice sheet, never a block:
                [ Split into 2–3 ]   [ ▶ Do 10 min now ]   [ Move to Someday ]
                small link: "Postpone anyway" → always needs a one-tap reason     counts
 POSTPONE #4 ─ moves to Someday automatically; the weekly review lists it
 UNPLACED OR PAST-DUE AND UNTOUCHED 14 DAYS ─ moves to Someday automatically (future-dated tasks are never retired)
```

- **Weekly budget:** a starting value of **5 counted postpones**, reset Monday 04:00. From the 6th in a week, every postpone also needs a one-tap reason (underestimated · blocked · low energy · avoided it) and the Shrink step if there's no `firstStep` yet. **No XP is ever lost.**
- **During the baseline week:** the ladder steps (date+time, shrink, choice sheet) are active, but **budget enforcement is off**. Postpones are counted to set the budget.
- **Setting the budget from the baseline:** `budget = clamp(round(baselineWeeklyPostpones × 0.67), 5, 12)`.
- **Auto-raise** (keeps it "not too strict" automatically): if the budget was exceeded in **3 or more of the last 4 weeks**, raise it by 2, up to the automatic maximum of 12. **The lookback restarts after a raise.** Tell him neutrally: "Budget raised to 9. Plans should fit real life."
- **Stepping down:** at a season start, if he was under budget in ≥3 of the last 4 weeks, offer (don't force) "Lower the budget by 1?".
- **Bounds:** a `rules` pack can set the budget between 3 and 15. Automatic logic stays within 5–12.
- **Economic effect of postponing:** the task loses its ×1.5 first-day bonus. A task done after ≥2 postpones may earn the unannounced Clutch flat bonus (changed 2026-10-08 by the owner). So postponing never pays.
- **Checkpoints:** postponing one moves only that checkpoint, then offers "Re-space the remaining checkpoints?".

## 4. Splitting

- **At creation (estimate > 90 min):** the work is saved as 2+ subtasks of 25–60 min. They share an XP pool of `round(xpBySize.L × estimateMin / 90)`, divided pro-rata by estimate. Inflating an estimate gains almost nothing, and the estimate-vs-actual display exposes it.
- **Splitting an already-scheduled task** (at postpone #3, or any time later):
  - The subtasks **share the parent's XP pro-rata by estimate**, so their total equals the parent's size XP.
  - They **inherit `firstScheduledDayKey`**, so splitting can't regain a lost ×1.5.
  - **Ladder position:** subtasks of a split made at the #3 sheet start with `postponeCount = 2`, so their next postpone shows the choice sheet again and the one after goes to Someday. Subtasks of a split made earlier inherit the parent's count.
  - Clutch on a subtask is the flat clutch bonus (changed 2026-10-08 by the owner).
  - The parent becomes a container: it's done when all its subtasks are done or dropped.

## 5. Screens

1. **Today / Now card (home):**
   - One task with a **shrinking ring countdown** for its block and its first-step line.
   - Once time runs out, an **overtime counter in a different colour** ("planned 30m, took 48m").
   - Buttons: ▶ Start focus · ✓ Done · ⤳ Postpone · ⋯.
   - A **Next strip** with the next 1–2 blocks.
   - A day-horizon line: "3h 40m planned · 2h 50m left before shutdown (23:15)".
2. **Morning plan (≤3 min):**
   - Triage Unplaced.
   - Pick ≤3 Musts and give each a start time (suggest free slots).
   - A **capacity bar**: sum of estimates × his overrun ratio, against free hours (4 h class day / 6 h weekend by default). Warn if over; never block.
   - Skippable. If skipped, a one-tap minimum: "Pick your one Must."
3. **Tasks list:** Today · Upcoming · Unplaced · Someday. Quick add (title + size + optional time) from anywhere with one tap.
4. **Task detail:** fields, history (postpones with reasons), subtasks, Split, Real-reason move.
5. **Focus timer:**
   - **One live timer.** Starting another pauses the first and counts a **switch**.
   - Presets 25/5 (long break 15–20 after four) and 50/10; +10 extend.
   - Optional keep-awake. Exact end alarm in the APK.
   - **Temptation bundle** (opt-in): he names a reward (a song, chai, a short walk) that the app suggests only after a completed block. Short-video and social apps are excluded as rewards.
6. **Shutdown (≤3 min):**
   - Nudge at `min(shutdown setting, bedtime − 15 min)` (default 23:15).
   - Steps:
     1. Close today (done / move / drop for each open item).
     2. Set **tomorrow's first task with time + place**.
     3. Optional bedtime if-then ("If I'm in bed with the phone after 12:30, I put it on the charger across the room").
   - Ends with "Shutdown complete." and starts wind-down (see `05-economy.md` §9).
7. **Weekly review (≤10 min, Sunday or Monday):**
   - Someday items moved this week; postpone count and reason mix; estimate ratio per category.
   - Revive or delete Someday items.
   - Preview the week's checkpoints.
8. **Fresh-start screen:** after a missed day, a two-tap screen ("Yesterday didn't go to plan. That's data, not a verdict.") with "Plan today" and "Pick one Must". Never a red overdue pile, never a failure-framed push.

## 6. Other rules (in `rules.config.ts`)

| Mechanic | Value |
|---|---|
| Max estimate before a split | 90 min; subtasks 25–60 |
| Musts per day | ≤3 |
| Capacity warning | estimates × overrun ratio > free hours (4 h / 6 h) |
| Focus | 25/5, long break 15 after 4, +10 extend, 50/10 preset |
| Live timers | 1 (starting another pauses the first and logs a switch) |
| Estimate calibration | At completion: "Planned 30m · Took 48m (1.6×)". After ≥5 timed tasks in a category, suggest an adjusted estimate |
| Tasks streak | **None.** Show "Planned 5 of the last 7 days" and focus minutes this week |
| Reminders | At block start (exact in the APK); optional 5-min pre-reminder. Outside the engagement-push budget |
| Quick win | Created and done within 30 min: 5 XP instead of size XP (max 5/day) |

## 7. Metrics captured (for the weekly summary)

- Start adherence (focus started within ±15 min of the planned start).
- % done on the first scheduled day.
- Postpones per week, the share reaching #3, the reason mix, budget overruns.
- Estimate ratio per category.
- Switches per focus block.
- Rituals completed (plan, shutdown, review), stored in `dailyLog`.

## 8. Copy

- Postpone #1: "When will you do it? Pick a time."
- Postpone #2: "Make it smaller. First 10 minutes?"
- Postpone #3: "This one keeps slipping. Split it, do 10 minutes now, or park it in Someday. All fine."
- Over budget: "Six this week. Quick reason?" (four chips)
- Overtime: "+18 min over plan. Keep going or wrap up?"
- Done on first day: "Said it, did it. ×1.5."

## 9. Acceptance tests (write these first in Vitest)

1. `dayKey` of 00:30 on 4 Oct is `2026-10-03`; of 04:00 on 4 Oct it is `2026-10-04`.
2. At the boundary, an undone planned task becomes unplaced with `postponeCount` unchanged.
3. Re-placing from Unplaced counts as a postpone. First placement of a never-scheduled task doesn't. A same-day move before the slot starts doesn't.
4. Postpone #1 without a new date+time is rejected.
5. Postpone #2 requires a `firstStep` of 1–120 chars.
6. Postpone #3 returns the choice sheet, and "Postpone anyway" always requires a reason.
7. Postpone #4 sets `someday`.
8. **14-day rule:** an unplaced task untouched for 14 days → `someday`. A task scheduled 3 weeks ahead is never retired early.
9. **Budget:**
   - the 6th counted postpone in a week requires a reason;
   - real-reason moves (≤2/week) count neither as postpones nor against the budget, and keep ×1.5 eligibility;
   - the Monday 04:00 reset works;
   - no enforcement during the baseline week.
10. **Auto-raise:**
    - overruns in 3 of the last 4 weeks → budget +2 (max 12) and the lookback restarts;
    - 2 of 4 → no change.
11. A task estimated over 90 min can't be saved unsplit.
12. A 4th Must on the same day is refused, with the option to make it a Could.
13. Starting focus on B while A runs pauses A and increments `switches`.
14. **Split after postpone #3:** subtask XP sums to the parent's size XP. They inherit `firstScheduledDayKey` (no ×1.5) and start at `postponeCount = 2`.
    - Splitting at creation: a 100-min estimate gives a pool of 39 XP; a 180-min estimate gives 70.
    - A same-day move after the slot started counts as a postpone.
    - "Do 10 min now" and "Move to Someday" don't.
15. XP uses `plannedSize`. ×1.5 only when done on `firstScheduledDayKey`.
16. There is no code path that removes XP because of a postpone.
