# CJ2 Job 1 · 365-day economy simulation

Branch: `ideas/cj2-economy-sim`, cut from `origin/ship-27` at `b17ec40`.
Date run: 22 Oct 2026. Nothing in the app was changed. The scripts are pasted at the end so the run can be repeated.

## What was run

- `/tmp/cj2/job1-scratch/sim.ts` (tsx). It builds synthetic ledgers for 6 personas plus 6 "gaming probes".
  Each run covers 365 days, from Thu 5 Nov 2026 to Thu 4 Nov 2027, in the IST time zone.
  At the end of every day it calls the real `deriveEconomy(facts, RULES_HISTORY, settings, today)` on the ledger so far (the prefix up to that day).
- Fact shapes are copied from the writers in `src/data/repos/*`:
  - `done:` (tasks.ts completeTask)
  - `train-session:`, `train-week:…:two|three`, `train-rest:`, `train-pr:` (train.ts)
  - `learn-lesson:` and `learn-answer:` with `dropId` and `afterBedtime` (learn-engine.ts)
  - `board:` and `card:` (learn.ts), `mystery:` (mysteries.ts), `lightsout:` (tasks.ts)
  - `soft-start:` and `soft:` (soft.ts), `quest:…:YYYY-Www` (quests.ts), `purchase:` (economy.ts)
- The gamify facts (`learn-drop`, `perfect-drop`, `daily-quest`, `focus-boost`, `badge-tier`, `welcome-back`, `monthly-challenge`, `tomorrow-plan`, `gold-review`) are written the way `reconcileGamify` (gamify.ts) writes them. The sim calls the real `completedQuests`, `dailyQuests`, `badges`/`badgeTier`, `perfectDrop` and `monthlyQuestCount`. Daily quests are reconciled after every event, so the focus-boost window gets real timestamps.
- Purchases go through the real `catalogue(day)` and `purchaseDecision(...)` (shop.ts). Persona f tries every item in the season's catalogue, rest days included, after each day.
- Settings: `economy.v2From` and `economyVisibleFrom` are both set to the install day, as `reconcileGamify` and AppShell write them for a new install.
- Anomaly checks run every day:
  - Did any past day's total change against what was shown at the end of that day?
  - Did total XP, level or earned Shards drop?
  - Did the balance fall by more than that day's spend?
  - Within one season: did SP drop, did the rank get worse, did the target move?
- `/tmp/cj2/job1-scratch/micro.ts` holds 8 small, hand-built ledgers (T1–T7, plus T1b) that isolate each finding.

What is estimated, not measured:
- The activity mixes are made up. Details are in the persona table and the code.
- Unit chests: the sim assumes one module mastered per 60 drop days, at most 6. Real mastery comes from BKT state, which the sim does not model.
- Learn drops: day 1–10 is a lesson plus 3 scored items, after that a lesson plus 5. Answers are right 75–85% of the time.
- Only end-of-day views are checked. Mid-day views, sync and import are not.

Timings: 4-CPU shared VM, with other cloud jobs starting partway through (load average 0.8 at the start, 5.6 by the end).
- Full run of 12 personas: 4 min 19 s.
- `deriveEconomy` on one full year (5–9.5k facts), median of 9 calls: 16–54 ms per call.
- Persona f took 166 s because every purchase check runs `deriveEconomy` again.

## Personas

| id | who | daily mix (estimate) |
|---|---|---|
| a | Keen daily user | 5 tasks (mostly planned, about 70% first-day), training Mon/Wed/Fri (80% full) or a 15-min walk check, a daily Learn drop at 21:00 (85% right), board 80%, case 60%, 12 cards on half the days, track lesson Mon/Wed/Fri, plan tomorrow, lights-out on target 80%, side quest most Saturdays, Gold review on Sundays after day 45 |
| b | Weekdays only | Mon–Fri: 3 tasks, training Mon/Wed/Fri, Learn, board, case, plan. Sat/Sun nothing. Rest weekday = Sunday, set **every week** |
| b2 | Weekdays only, real UI | Same as b, but the rest weekday is picked once. Ground.tsx:53 saves it under a per-week key, so it only lasts that one week |
| c | Tired often | Soft day (one gentle thing) every Tue and Thu, plus half of Saturdays. Other days: 3 tasks, training Mon/Fri, Learn |
| d | 3-week lapse | Persona a, but nothing at all on days 36–56 (10 Dec – 30 Dec) |
| e | Night owl | Tasks 22:30–01:00, training at 21:00, Learn/board/case/cards at 02:00 (after the 01:30 bedtime, so `afterBedtime: true`), lights-out missed |
| f | Shopper | Persona a's activity, and buys every item `purchaseDecision` allows as soon as it is affordable |
| g1 | Probe: task farmer | 20 tiny first-day S tasks a day, nothing else |
| g2 | Probe: every other day | Persona a's day on even days, blank days in between |
| g3 | Probe: soft only | One soft-day gentle thing every day, nothing else |
| g4 | Probe: focus hoarder | Persona a's exact activity, but every task is ticked off in the minute after the Focus boost starts |
| g5 | Probe: sandbagger | Persona a in odd seasons; in even seasons, one small task a day |

## Results per persona (measured)

### XP and level at day 7 / 30 / 90 / 180 / 365

| id | d7 | d30 | d90 | d180 | d365 | avg XP/day |
|---|---|---|---|---|---|---|
| a keen | 1,630 · L6 | 7,254 · L12 | 21,861 · L21 | 43,839 · L30 | 89,571 · L42 | 245 |
| b weekdays | 1,088 · L5 | 4,985 · L10 | 13,979 · L17 | 27,608 · L24 | 56,021 · L33 | 153 |
| b2 weekdays (UI) | same XP as b | | | | | 153 |
| c tired | 732 · L4 | 4,109 · L9 | 11,579 · L15 | 23,176 · L22 | 46,734 · L31 | 128 |
| d lapse | 1,769 · L6 | 7,830 · L13 | 17,582 · L19 | 39,764 · L28 | 85,525 · L41 | 234 |
| e night owl | 824 · L4 | 3,826 · L9 | 11,721 · L15 | 23,196 · L22 | 45,948 · L30 | 126 |
| f shopper | same as a | | | | | 245 |
| g1 farmer | 1,400 · L5 | 6,000 · L11 | 18,000 · L19 | 36,000 · L27 | 73,000 · L38 | 200 (flat) |
| g2 alt days | 1,036 · L5 | 3,864 · L9 | 11,782 · L15 | 23,408 · L22 | 48,429 · L31 | 133 |
| g3 soft only | 70 · L1 | 300 · L3 | 900 · L4 | 1,800 · L6 | 3,650 · L9 | 10 |
| g4 hoarder | 1,837 · L6 | 8,327 · L13 | 25,278 · L22 | 50,260 · L32 | 102,241 · L45 | 280 |
| g5 sandbagger | 1,630 · L6 | 7,254 · L12 | 14,994 · L17 | 24,721 · L22 | 48,937 · L31 | 134 |

### Days to reach each level

| id | L5 | L10 | L15 | L20 | L25 | L30 | L35 | L40 |
|---|---|---|---|---|---|---|---|---|
| a / f | 5 | 19 | 44 | 79 | 123 | 179 | 245 | 319 |
| b / b2 | 7 | 28 | 68 | 124 | 196 | 280 | – | – |
| c | 10 | 35 | 81 | 149 | 233 | 338 | – | – |
| d | 5 | 18 | 63 | 96 | 139 | 196 | 260 | 335 |
| e | 8 | 36 | 81 | 148 | 234 | 346 | – | – |
| g4 | 4 | 17 | 38 | 68 | 106 | 156 | 215 | 281 (L45 at 354) |

How the pace changes:
- Level L starts at 50·L·(L−1) XP, so each level costs 100 XP more than the one before.
- For the keen user, the gap between levels grows from 1 day (L2–5) to about 16 days (L40→41). For the tired user (c) it grows to about 24 days.
- The pace slows steadily. It never stalls and never explodes.
- `level.softCap: 50` in rules.config.ts is never read anywhere in `src` (checked with grep). It is dead config.

### Streak and rest bank

| id | streak d365 | streak resets in the year | rest-bank days used | days with Gold |
|---|---|---|---|---|
| a, f, c, e, g1, g3, g4, g5 | 365 | 0 | 0 (bank stays full at 12 from day 61) | 359 |
| b (rest weekday set weekly) | 3 | 4 (74→1, 100→1, 52→1, 76→1) | 48 | **0** |
| b2 (rest weekday picked once) | 3 | **27** (e.g. 18→1, 14→1, 4→1) | 48 | **0** |
| d lapse | 309 | 1 (35→0 after the 8 banked days ran out) | 8 | 333 |
| g2 alt days | 3 | 12 (always 5→1) | 50 | 0 |

The rest bank adds 4 days a month and holds 12 at most. A weekday-only user needs about 4.3 days a month for Saturdays alone, even with Sunday as the chosen rest day. The bank therefore runs dry every 3–4 months and the streak resets.

### Shards balance curve (end of every 30th day)

| id | d30 | d60 | d90 | d120 | d180 | d240 | d300 | d365 | earned/day |
|---|---|---|---|---|---|---|---|---|---|
| a | 1,675 | 3,332 | 5,129 | 6,686 | 9,609 | 12,401 | 15,501 | 19,086 | 52.3 |
| b | 1,262 | 2,206 | 3,517 | 4,527 | 6,497 | 8,389 | 10,361 | 12,549 | 34.4 |
| c | 1,056 | 1,942 | 2,979 | 3,861 | 5,604 | 7,128 | 8,832 | 10,706 | 29.3 |
| d | 1,737 | 2,301 | 4,203 | 5,725 | 8,791 | 11,603 | 14,763 | 18,140 | 49.7 |
| e | 1,233 | 2,373 | 3,858 | 5,012 | 7,278 | 9,237 | 11,526 | 14,237 | 39.0 |
| f (after buying) | 225 | 532 | 2,029 | 3,586 | 6,509 | 9,301 | 12,401 | 15,986 | 52.3 |
| g3 | 70 | 170 | 300 | 400 | 580 | 710 | 890 | 1,125 | 3.1 |

Where the keen user's 19,086 Shards come from (exact, from the facts):

| source | Shards | share |
|---|---|---|
| XP × 0.1 | 8,957 | 47% |
| Daily quests (8 each) | 6,184 | 32% |
| Season-end awards | 2,700 | 14% |
| Level-ups (20 each) | 820 | 4% |
| Badge tiers | 275 | 1% |
| Unit chests (estimated) | 150 | 1% |

What the shopper (f) bought:
- Item 1 on day 7. Then 8 rest days (400 Shards) in week 1 to fill the bank.
- 5 items by day 26, 8 by day 33, 9 by day 50.
- **All 11 cosmetic items (2,700 Shards) by day 61** (4 Jan 2027, the first day of Season 3, when its catalogue appeared).
- Every item can be reached. After day 61 there is nothing left to buy: the rest bank stays full, so freeze purchases are refused. The balance grows to 15,986 by day 365.

### Season SP, rank and tier

Season 1 runs 2 Nov – 6 Dec 2026 (35 days, target 8,750). All personas start on 5 Nov, 3 days late. From Season 2 on, each season's target is fitted to the user's own median day in the season before.

| id | final tiers S1–S12 | Apex | season-end Shards / yr |
|---|---|---|---|
| a keen | Elite ×8, Ace ×2, Apex ×2 (S1 #43 Elite) | 2 | 2,700 |
| b weekdays | Challenger (S1 #167), Contender ×10, Elite ×1 | 0 | 1,800 |
| c tired | Challenger (S1 #204), Contender ×11 | 0 | – |
| d lapse | Elite ×8, Ace ×2, Challenger (lapse season), **Apex in the season after the lapse** | 1 | – |
| e night owl (126 XP/day) | Challenger (S1), **Apex ×5**, Ace ×3, Elite ×2, Contender ×1 | **5** | 2,900 |
| g1 farmer | Contender (S1), Elite ×11 | 0 | – |
| g2 alt days (133 XP/day) | Challenger ×3, Contender ×2, **Apex ×7** | **7** | – |
| g3 soft only | Bench ×12 (soft XP is kept out of SP) | 0 | 600 |
| g4 hoarder | Elite ×7, Contender ×4, Apex ×1 | 1 | – |
| g5 sandbagger | Elite (S1), Bench ×6 (quiet seasons), **Apex ×6 (every keen season)** | **6** | – |

Day-1 rank of every new season, for every persona: #332 to #417 (Bench). For example, the keen user goes from #1 Apex on 4 Jul 2027 to #393 the next day.

## Anomalies

The everyday prefix check found **no past-day total that changed, and no drop in XP, level or earned Shards in any persona over 365 days**. Within a season, SP never dropped, the rank never got worse and the target never moved. The anomalies below came from the probes and the micro checks. Each line gives the measured evidence.

### A. Breaks the forward-only promise

1. **XP drops when a short workout follows a walk check on the same day** (T6).
   - The walk check earns 10 XP. A session that touches 1 of 5 exercises (1 of 15 sets) earns `round(60 × 1/15) = 4`.
   - `deriveEconomy.ts:79` sets the rest XP to 0 whenever any session exists. Measured: total XP went **10 → 4**.
   - `startSession` (train.ts:87) does not block a session after a rest check. Only the reverse is blocked (train.ts:233).
   - Smallest fix, at deriveEconomy.ts:79–81: `train = min(cap, max(bestSession, rest) + prs)`.
2. **A freeze purchase the balance cannot pay still adds a rest day** (T2).
   - Measured: 3 freeze facts with 0 Shards gave rest bank 4 → 7, with balance still 0.
   - Cause: `deriveEconomy.ts:199–200` counts freeze facts before the balance check in the purchase loop.
   - The shop UI cannot do this. Sync, import or a hand-edited backup could.
   - Fix: add the rest day inside the purchase loop (deriveEconomy.ts:241), only when the price was actually paid.

### B. Rewards that cannot be reached, or promises that cannot be kept

3. **The repair promise can be impossible to keep** (T1b).
   - Case: Saturday missed, Sunday marked without a Hat-trick, Monday a Hat-trick. Monday evening shows `paused: true, canRepair: true`, so EconomyScreens.tsx:76 says "Two Hat-trick days in 48 h reconnect your run."
   - But no day is left in the window: Tuesday starts a fresh streak (measured: streak 1).
   - Cause: the formula at `deriveEconomy.ts:248` counts today as a day still to come even after today's Hat-trick has been counted.
4. **The chosen rest weekday uses up the repair window** (T1).
   - Case: Saturday missed (bank empty), Sunday is the chosen rest day, then Hat-tricks on Monday and Tuesday. The run is **not** restored: streak 1 on Tuesday.
   - The only way to repair is to do a Hat-trick on the rest day itself. Measured: a Sunday + Monday Hat-trick restores the run to 4.
   - Cause: `i - breakAt <= 2` (deriveEconomy.ts:202) counts calendar days, rest weekday included.
5. **Gold cannot be reached by anyone who takes 2 days off a week** (b, b2, g2: 0 Gold days in 365).
   - Every rest-bank day resets the Gold count (`markedDays = 0`), and the chosen rest weekday adds nothing to it.
   - So 5 marked days a week can never reach 7. This is a product trade-off for Jenil.
6. **The weekly rest day lasts only the week it was picked** (b vs b2).
   - Ground.tsx:53 and :112 save `economy.restWeekday:<this Monday>`. `deriveEconomy` also reads a global `economy.restWeekday` (lines 138 and 197), but nothing ever writes it.
   - Measured, weekday-only user over a year: **27 streak resets** with the real picker, against 4 if they re-pick every week.
   - Fix: when the user picks, also write `economy.restWeekday`, and keep the per-week key for one-off changes.
7. **The welcome-back gift pays more than the gentle thing** (T3, g2).
   - Skipping a day and returning gives +15 (`soft.welcomeBackXp`). Doing the soft-day gentle thing on that day gives +10, and no gift the next day.
   - Measured over 3 days: soft day 200 XP, skipped day **205 XP**. Persona g2 got the gift on 182 days.
   - The gift also fires when a banked rest day covered the gap, so the streak never broke.
   - Smallest fix: give the gift only after ≥ 2 unmarked days, or only when the streak was actually paused. Season SP is not affected (soft and welcome XP are kept out of SP).

### C. Gaming a rule pays

8. **Focus hoarding: +14% XP for the same activity** (g4).
   - Holding task check-offs until the 15-minute Focus boost starts doubles them, up to the tasks area's capped total (deriveEconomy.ts:114–126).
   - Same facts as persona a, different order. Focus XP for the year: **13,665 vs 995**. Total XP: 102,241 vs 89,571 (L45 vs L42). Best single day: 520 vs 382.
   - Smallest fix: a flat cap on the boost (for example `gamify.focusMaxXp: 30`). Honest use averaged 22 XP per boost day.
9. **Season sandbagging: a quiet season makes the next one an easy Apex** (g5, g2, T4).
   - The target is `median × days / 0.863` of the season before (deriveEconomy.ts:167–178). Doing 1–15 XP a day for a season sets the next target to 32–487 SP, which one or two normal days clear (T4).
   - If the median is exactly 0, the target falls back to 250/day (7,000–8,750). So the curve jumps: the target is 7,000 after a fully idle season, but only 32 after a season with 1 XP every day.
   - Measured:
     - g5 reaches **Apex in all 6 of its keen seasons**, with half the yearly XP of persona a, who reaches Apex twice.
     - g2 (every other day) reaches Apex 7 times out of 12.
     - The night owl (126 XP/day) reaches Apex 5 times, against 2 for the keen user (245 XP/day).
   - Why the night owl does better: rank measures how far the season's mean sits above the user's own median, not how much they do. Flat, low days with a few bigger ones (the weekly training bonus) beat steady high days.
   - Smallest fix: never let the target fall below 75% of the previous season's target. For example add `season.targetFloorPct: 75` in rules.config.ts. Job 3 (late entry) touches the same block.
10. **Mind after bedtime earns 0 XP but still earns Shards** (e, T5).
    - Daily quests count Mind facts flagged `afterBedtime` ("drop", "combo", "learn-three", "board", "case"). They pay 8 Shards each and can start a Focus boost.
    - T5: a day of Mind only, all after bedtime, gives 0 XP and 24 Shards.
    - The night owl earned **3,040 Shards (21% of all its Shards) from Mind quests done after bedtime**. That is more Shards per XP than any other persona (0.31 vs 0.21).
    - Fix: make Mind quest counters skip `afterBedtime` rows (gamify.ts:7 `matching`, and the `learn-drop` count). Or have reconcileGamify skip Mind quests after bedtime.
11. **The quick-win cap works backwards** (T7).
    - A task created and done within 30 minutes earns 5 XP in place of its size XP, for at most 5 a day (awards.ts:49). The 6th quick task of the day then earns full size XP.
    - Measured: 5 quick M tasks = 25 XP, 6 = 45 XP.
    - The spec (02-tasks §135) is ambiguous on this. Minor.
12. **Task farming is bounded but still matches the keen user's season tier** (g1).
    - 20 trivial first-day tasks a day hit the 200 XP cap every day.
    - The farmer finished Elite in 11 of 12 seasons, with no training and no Mind. That is as high as the keen user's usual tier.
    - Tasks are self-reported, so the cap is the only guard. No fix is proposed. The point is that a one-mode user ranks like an all-round user.

### D. Pace and balance

13. **Shards pile up with nothing to buy.**
    - The keen user earns about 52 a day and owns the whole shop (2,700) by day 61. After that the balance climbs to about 16,000 by day 365.
    - Daily quests (24 a day at most) are a third of all earnings.
    - Nothing here breaks a rule, but Shards stop meaning anything after month 2. Because Shards never decrease, this can only be tuned going forward: lower `gamify.dailyQuestShards` from an `effectiveFrom` date, or add more items per season.
14. **The rank falls overnight at every season change.**
    - The day-1 rank is #332–417 for every persona, even straight after #1 Apex. The 10% seed is about 750 SP against a target of about 7,500.
    - The forward-only promise does not cover rank, but this reads as a loss. See Job 3.
15. **The season-end toast can show decimal SP.**
    - The seed is 10% of last season, so SP values like 1,084.7 appear (measured).
    - EconomyFeedback.tsx:90 prints `${past.season.sp}` without rounding.
16. **The soft-only user keeps a 365-day streak and Gold on 359 days** with one tap a day (g3, 10 XP a day, Bench every season).
    - This matches spec 15 (one gentle thing keeps the day). The cost is that streak and Gold say nothing about effort. Season rank does reflect effort.

## Smallest fixes, in order

1. deriveEconomy.ts:79–81: `max(bestSession, rest)`. This is a forward-only breach.
2. Ground.tsx:112: also write `economy.restWeekday`. This removes most streak resets for weekday users.
3. deriveEconomy.ts:248: `canRepair` must not count today once today's Hat-trick is in. Also skip the chosen rest weekday in the 48 h window (line 202).
4. gamify.ts: Mind quests ignore `afterBedtime` facts.
5. rules.config.ts: add `gamify.focusMaxXp` (≈30) and `season.targetFloorPct` (≈75), dated by `effectiveFrom`.
6. deriveEconomy.ts:199–200: only paid freezes add rest days.
7. For Jenil to decide:
   - Should Gold allow 2 days off a week?
   - Should the welcome gift need ≥ 2 missed days?
   - Should daily-quest Shards be lowered once the shop is bought out?

## Re-running

```
cd /tmp/cj2/job1 && npm ci
TZ=Asia/Kolkata npx tsx /tmp/cj2/job1-scratch/sim.ts      # all personas; ONLY=a,b DAYS=90 to narrow
node /tmp/cj2/job1-scratch/report.mjs                     # seasons, level days, streak drops, shard curves
TZ=Asia/Kolkata npx tsx /tmp/cj2/job1-scratch/micro.ts    # T1–T7
```

Raw output of the run is in the "Output" section below.

## Output (measured)

### sim.ts (full run; persona b2 was added afterwards and run separately, its numbers are in the tables above)
```

== a Keen daily user (9528 facts, run 13089 ms, derive@365 median 34.4 ms)
day 7 2026-11-11: XP 1630 L6 shards 518 (earned 518) owned 0 streak 7 rest 4/used 0 paused false gold true | S1 SP 1630 target 8750 rank 347 Bench
day 30 2026-12-04: XP 7254 L12 shards 1675 (earned 1675) owned 0 streak 30 rest 8/used 0 paused false gold true | S1 SP 7199 target 8750 rank 65 Contender
day 90 2027-02-02: XP 21861 L21 shards 5129 (earned 5129) owned 0 streak 90 rest 12/used 0 paused false gold true | S4 SP 1084.7 target 7984 rank 377 Bench
day 180 2027-05-03: XP 43839 L30 shards 9609 (earned 9609) owned 0 streak 180 rest 12/used 0 paused false gold true | S7 SP 948.3 target 9676 rank 402 Bench
day 365 2027-11-04: XP 89571 L42 shards 19086 (earned 19086) owned 0 streak 365 rest 12/used 0 paused false gold true | S13 SP 1690.1 target 10325 rank 360 Bench
anomalies 0 []

== b Weekdays only (rest weekday = Sunday) (6328 facts, run 9679 ms, derive@365 median 32.2 ms)
day 7 2026-11-11: XP 1088 L5 shards 396 (earned 396) owned 0 streak 6 rest 3/used 1 paused false gold false | S1 SP 1073 target 8750 rank 386 Bench
day 30 2026-12-04: XP 4985 L10 shards 1262 (earned 1262) owned 0 streak 26 rest 4/used 4 paused false gold false | S1 SP 4925 target 8750 rank 167 Challenger
day 90 2027-02-02: XP 13979 L17 shards 3517 (earned 3517) owned 0 streak 1 rest 4/used 12 paused false gold false | S4 SP 800.4 target 5956 rank 378 Bench
day 180 2027-05-03: XP 27608 L24 shards 6497 (earned 6497) owned 0 streak 78 rest 3/used 25 paused false gold false | S7 SP 629.6 target 7242 rank 410 Bench
day 365 2027-11-04: XP 56021 L33 shards 12549 (earned 12549) owned 0 streak 3 rest 4/used 48 paused false gold false | S13 SP 1133.4 target 6430 rank 352 Bench
anomalies 0 []

== c Tired often (soft days 2-3x a week) (5567 facts, run 7296 ms, derive@365 median 48.7 ms)
day 7 2026-11-11: XP 732 L4 shards 297 (earned 297) owned 0 streak 7 rest 4/used 0 paused false gold true | S1 SP 702 target 8750 rank 415 Bench
day 30 2026-12-04: XP 4109 L9 shards 1056 (earned 1056) owned 0 streak 30 rest 8/used 0 paused false gold true | S1 SP 4009 target 8750 rank 212 Challenger
day 90 2027-02-02: XP 11579 L15 shards 2979 (earned 2979) owned 0 streak 90 rest 12/used 0 paused false gold true | S4 SP 584.9 target 4738 rank 385 Bench
day 180 2027-05-03: XP 23176 L22 shards 5604 (earned 5604) owned 0 streak 180 rest 12/used 0 paused false gold true | S7 SP 546.5 target 6674 rank 414 Bench
day 365 2027-11-04: XP 46734 L31 shards 10706 (earned 10706) owned 0 streak 365 rest 12/used 0 paused false gold true | S13 SP 771.3 target 5619 rank 376 Bench
anomalies 0 []

== d 3-week lapse in month 2, then returns (9154 facts, run 11507 ms, derive@365 median 32.9 ms)
day 7 2026-11-11: XP 1769 L6 shards 533 (earned 533) owned 0 streak 7 rest 4/used 0 paused false gold true | S1 SP 1754 target 8750 rank 338 Bench
day 30 2026-12-04: XP 7830 L13 shards 1737 (earned 1737) owned 0 streak 30 rest 8/used 0 paused false gold true | S1 SP 7680 target 8750 rank 45 Elite
day 90 2027-02-02: XP 17582 L19 shards 4203 (earned 4203) owned 0 streak 34 rest 8/used 8 paused false gold true | S4 SP 1222.9 target 8195 rank 369 Bench
day 180 2027-05-03: XP 39764 L28 shards 8791 (earned 8791) owned 0 streak 124 rest 12/used 8 paused false gold true | S7 SP 930 target 9473 rank 402 Bench
day 365 2027-11-04: XP 85525 L41 shards 18140 (earned 18140) owned 0 streak 309 rest 12/used 8 paused false gold true | S13 SP 1669.4 target 10122 rank 359 Bench
anomalies 0 []

== e Night owl (Mind after bedtime) (8864 facts, run 10301 ms, derive@365 median 20.9 ms)
day 7 2026-11-11: XP 824 L4 shards 384 (earned 384) owned 0 streak 7 rest 4/used 0 paused false gold true | S1 SP 824 target 8750 rank 405 Bench
day 30 2026-12-04: XP 3826 L9 shards 1233 (earned 1233) owned 0 streak 30 rest 8/used 0 paused false gold true | S1 SP 3826 target 8750 rank 221 Challenger
day 90 2027-02-02: XP 11721 L15 shards 3858 (earned 3858) owned 0 streak 90 rest 12/used 0 paused false gold true | S4 SP 654.8 target 3927 rank 358 Bench
day 180 2027-05-03: XP 23196 L22 shards 7278 (earned 7278) owned 0 streak 180 rest 12/used 0 paused false gold true | S7 SP 452.8 target 5761 rank 416 Bench
day 365 2027-11-04: XP 45948 L30 shards 14237 (earned 14237) owned 0 streak 365 rest 12/used 0 paused false gold true | S13 SP 818.8 target 4057 rank 338 Bench
anomalies 0 []

== f Keen + buys every shop item when affordable (9547 facts, run 165623 ms, derive@365 median 38.7 ms)
day 7 2026-11-11: XP 1630 L6 shards 18 (earned 518) owned 1 streak 7 rest 12/used 0 paused false gold true | S1 SP 1630 target 8750 rank 347 Bench
day 30 2026-12-04: XP 7254 L12 shards 225 (earned 1675) owned 5 streak 30 rest 12/used 0 paused false gold true | S1 SP 7199 target 8750 rank 65 Contender
day 90 2027-02-02: XP 21861 L21 shards 2029 (earned 5129) owned 11 streak 90 rest 12/used 0 paused false gold true | S4 SP 1084.7 target 7984 rank 377 Bench
day 180 2027-05-03: XP 43839 L30 shards 6509 (earned 9609) owned 11 streak 180 rest 12/used 0 paused false gold true | S7 SP 948.3 target 9676 rank 402 Bench
day 365 2027-11-04: XP 89571 L42 shards 15986 (earned 19086) owned 11 streak 365 rest 12/used 0 paused false gold true | S13 SP 1690.1 target 10325 rank 360 Bench
anomalies 0 []

== g1 Probe: task farmer (20 tiny first-day tasks, nothing else) (7463 facts, run 7437 ms, derive@365 median 45.2 ms)
day 7 2026-11-11: XP 1400 L5 shards 302 (earned 302) owned 0 streak 7 rest 4/used 0 paused false gold true | S1 SP 1400 target 8750 rank 362 Bench
day 30 2026-12-04: XP 6000 L11 shards 975 (earned 975) owned 0 streak 30 rest 8/used 0 paused false gold true | S1 SP 6000 target 8750 rank 117 Contender
day 90 2027-02-02: XP 18000 L19 shards 3178 (earned 3178) owned 0 streak 90 rest 12/used 0 paused false gold true | S4 SP 960 target 6491 rank 370 Bench
day 180 2027-05-03: XP 36000 L27 shards 5946 (earned 5946) owned 0 streak 180 rest 12/used 0 paused false gold true | S7 SP 760 target 8114 rank 405 Bench
day 365 2027-11-04: XP 73000 L38 shards 11650 (earned 11650) owned 0 streak 365 rest 12/used 0 paused false gold true | S13 SP 1360 target 8114 rank 358 Bench
anomalies 0 []

== g2 Probe: every other day (keen days, blank days between) (4963 facts, run 5765 ms, derive@365 median 18.0 ms)
day 7 2026-11-11: XP 1036 L5 shards 344 (earned 344) owned 0 streak 4 rest 1/used 3 paused false gold false | S1 SP 991 target 8750 rank 392 Bench
day 30 2026-12-04: XP 3864 L9 shards 1003 (earned 1003) owned 0 streak 1 rest 4/used 4 paused false gold false | S1 SP 3581 target 8750 rank 234 Challenger
day 90 2027-02-02: XP 11782 L15 shards 3001 (earned 3001) owned 0 streak 1 rest 4/used 12 paused false gold false | S4 SP 609.6 target 3246 rank 346 Bench
day 180 2027-05-03: XP 23408 L22 shards 5903 (earned 5903) owned 0 streak 2 rest 3/used 25 paused false gold false | S7 SP 361.1 target 4300 rank 412 Bench
day 365 2027-11-04: XP 48429 L31 shards 11671 (earned 11671) owned 0 streak 3 rest 2/used 50 paused false gold false | S13 SP 710.2 target 3590 rank 340 Bench
anomalies 0 []

== g3 Probe: soft day every day, nothing else (730 facts, run 2408 ms, derive@365 median 15.2 ms)
day 7 2026-11-11: XP 70 L1 shards 7 (earned 7) owned 0 streak 7 rest 4/used 0 paused false gold true | S1 SP 0 target 8750 rank 500 Bench
day 30 2026-12-04: XP 300 L3 shards 70 (earned 70) owned 0 streak 30 rest 8/used 0 paused false gold true | S1 SP 0 target 8750 rank 500 Bench
day 90 2027-02-02: XP 900 L4 shards 300 (earned 300) owned 0 streak 90 rest 12/used 0 paused false gold true | S4 SP 0 target 7000 rank 500 Bench
day 180 2027-05-03: XP 1800 L6 shards 580 (earned 580) owned 0 streak 180 rest 12/used 0 paused false gold true | S7 SP 0 target 8750 rank 500 Bench
day 365 2027-11-04: XP 3650 L9 shards 1125 (earned 1125) owned 0 streak 365 rest 12/used 0 paused false gold true | S13 SP 0 target 8750 rank 500 Bench
anomalies 0 []

== g4 Probe: focus hoarder (keen activity, tasks held for the boost window) (9528 facts, run 15008 ms, derive@365 median 41.6 ms)
day 7 2026-11-11: XP 1837 L6 shards 538 (earned 538) owned 0 streak 7 rest 4/used 0 paused false gold true | S1 SP 1723 target 8750 rank 341 Bench
day 30 2026-12-04: XP 8327 L13 shards 1802 (earned 1802) owned 0 streak 30 rest 8/used 0 paused false gold true | S1 SP 7688 target 8750 rank 45 Elite
day 90 2027-02-02: XP 25278 L22 shards 5440 (earned 5440) owned 0 streak 90 rest 12/used 0 paused false gold true | S4 SP 1145 target 9363 rank 386 Bench
day 180 2027-05-03: XP 50260 L32 shards 10241 (earned 10241) owned 0 streak 180 rest 12/used 0 paused false gold true | S7 SP 999.7 target 10223 rank 402 Bench
day 365 2027-11-04: XP 102241 L45 shards 20013 (earned 20013) owned 0 streak 365 rest 12/used 0 paused false gold true | S13 SP 1770 target 10933 rank 361 Bench
anomalies 0 []

== g5 Probe: season sandbagger (keen in odd seasons, 1 small task/day in even seasons) (5338 facts, run 6145 ms, derive@365 median 21.2 ms)
day 7 2026-11-11: XP 1630 L6 shards 518 (earned 518) owned 0 streak 7 rest 4/used 0 paused false gold true | S1 SP 1630 target 8750 rank 347 Bench
day 30 2026-12-04: XP 7254 L12 shards 1675 (earned 1675) owned 0 streak 30 rest 8/used 0 paused false gold true | S1 SP 7199 target 8750 rank 65 Contender
day 90 2027-02-02: XP 14994 L17 shards 3793 (earned 3793) owned 0 streak 90 rest 12/used 0 paused false gold true | S4 SP 694.4 target 7481 rank 406 Bench
day 180 2027-05-03: XP 24721 L22 shards 5951 (earned 5951) owned 0 streak 180 rest 12/used 0 paused false gold true | S7 SP 334 target 609 rank 173 Challenger
day 365 2027-11-04: XP 48937 L31 shards 11462 (earned 11462) owned 0 streak 365 rest 12/used 0 paused false gold true | S13 SP 993 target 609 rank 1 Apex
anomalies 0 []
```

### micro.ts
```
T1 Saturday break + Sunday rest weekday: can Mon+Tue Hat-tricks repair it?
  rest=Sun, today 2026-11-08                 XP 95 shards 9 streak 1 rest 0 paused true restored false canRepair true gold false
  rest=Sun, today 2026-11-09                 XP 205 shards 40 streak 1 rest 0 paused true restored false canRepair true gold false
  rest=Sun, today 2026-11-10                 XP 300 shards 70 streak 1 rest 0 paused false restored false canRepair false gold false
  rest=Sun, today 2026-11-11                 XP 395 shards 79 streak 2 rest 0 paused false restored false canRepair false gold false
  same, but Hat-trick ON the Sunday rest day XP 395 shards 79 streak 4 rest 0 paused false restored true canRepair false gold false
  no rest weekday: Sat miss, Sun+Mon Hat-tricks XP 395 shards 79 streak 4 rest 0 paused false restored true canRepair false gold false

T2 a freeze purchase fact the balance cannot pay still adds a rest day
  no purchase, day 1                         XP 0 shards 0 streak 0 rest 4 paused false restored false canRepair false gold false
  3 freeze facts, 0 Shards to pay            XP 0 shards 0 streak 0 rest 7 paused false restored false canRepair false gold false

T3 skip a day vs do the soft-day gentle thing (D1 and D3 identical Hat-trick days)
  soft day on D2                             XP 200 shards 40 streak 3 rest 4 paused false restored false canRepair false gold false
  skipped D2                                 XP 205 shards 40 streak 2 rest 3 paused false restored false canRepair false gold false
  D3 welcome gift: soft 0 | skipped 15

T4 next-season target after a quiet season: median 0 vs a little every day
  S2 every day =   0 XP -> S3 target  7000 SP; Apex needs SP >= target (= 29 keen days at 245/day)
  S2 every day =   1 XP -> S3 target    32 SP; Apex needs SP >= target (= 1 keen days at 245/day)
  S2 every day =   5 XP -> S3 target   162 SP; Apex needs SP >= target (= 1 keen days at 245/day)
  S2 every day =  10 XP -> S3 target   325 SP; Apex needs SP >= target (= 2 keen days at 245/day)
  S2 every day =  15 XP -> S3 target   487 SP; Apex needs SP >= target (= 2 keen days at 245/day)
  S2 every day =  50 XP -> S3 target  1623 SP; Apex needs SP >= target (= 7 keen days at 245/day)
  S2 every day = 100 XP -> S3 target  3246 SP; Apex needs SP >= target (= 14 keen days at 245/day)
  S2 every day = 245 XP -> S3 target  6491 SP; Apex needs SP >= target (= 27 keen days at 245/day)

T5 Mind done after bedtime: 0 XP, but daily quests still pay Shards
  2026-11-08 quests case,board,drop: Mind XP 0, day XP 0, Shards 24 (3 quests x 8 = 24)

T1b no rest weekday: Sat missed, Sun marked (soft day, no Hat-trick), Mon Hat-trick. What does Monday evening promise?
  today 2026-11-09                           XP 215 shards 41 streak 1 rest 0 paused true restored false canRepair true gold false
  today 2026-11-10                           XP 310 shards 71 streak 1 rest 0 paused false restored false canRepair false gold false

T6 rest check first (10 XP), then a short session the same day (1 of 15 sets): does XP drop?
  after walk check: train XP 10, total XP 10 | after short session: train XP 4, total XP 4

T7 quick-win cap: six M tasks, each created and done within 10 minutes
  5 quick M tasks -> tasks XP 25 (M task = 20 XP)
  6 quick M tasks -> tasks XP 45 (M task = 20 XP)
```

## Code

### /tmp/cj2/job1-scratch/sim.ts
```ts
// 365-day economy simulation for NANDI (origin/ship-27). Run: cd /tmp/cj2/job1 && TZ=Asia/Kolkata npx tsx /tmp/cj2/job1-scratch/sim.ts
import { deriveEconomy, addEconomyDays, seasonFor, weekStart } from '/tmp/cj2/job1/src/core/economy/deriveEconomy';
import { RULES, RULES_HISTORY } from '/tmp/cj2/job1/src/core/rules.config';
import { completedQuests, dailyQuests, badges, badgeTier, perfectDrop, monthlyQuestCount } from '/tmp/cj2/job1/src/core/economy/gamify';
import { catalogue, purchaseDecision, SHOP_ITEMS } from '/tmp/cj2/job1/src/core/economy/shop';
import type { LedgerRow, SettingRow } from '/tmp/cj2/job1/src/data/types';
import { writeFileSync } from 'node:fs';

const START = '2026-11-05', DAYS = Number(process.env.DAYS ?? 365);
const IST = 5.5 * 3600e3;
const at = (day: string, hour: number) => Date.parse(`${day}T00:00:00Z`) - IST + Math.round(hour * 3600e3);
const weekday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 Sun
const isoWeek = (day: string) => { const d = new Date(`${day}T12:00:00Z`); const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() + 3 - wd); const y = d.getUTCFullYear(); const f = new Date(Date.UTC(y, 0, 4)); return `${y}-W${String(1 + Math.round((d.getTime() - f.getTime()) / 604_800_000)).padStart(2, '0')}`; };
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

type Ev =
  | { h: number; t: 'task'; size: 'S' | 'M' | 'L'; firstDay: boolean; postpones?: number; quick?: boolean; planned?: boolean }
  | { h: number; t: 'session'; full: boolean } | { h: number; t: 'rest' } | { h: number; t: 'pr' }
  | { h: number; t: 'drop'; scored: number; p: number; lesson: boolean; after?: boolean }
  | { h: number; t: 'board'; after?: boolean; hints?: number } | { h: number; t: 'mystery'; after?: boolean; revealed?: boolean }
  | { h: number; t: 'cards'; n: number; after?: boolean } | { h: number; t: 'lesson'; after?: boolean }
  | { h: number; t: 'plan' } | { h: number; t: 'lightsout'; met: boolean } | { h: number; t: 'soft' }
  | { h: number; t: 'sidequest' } | { h: number; t: 'gold' };
type Ctx = { i: number; day: string; wd: number; r: () => number };
type Persona = { id: string; name: string; seed: number; plan: (c: Ctx) => Ev[]; buy?: boolean; restWeekday?: number; restOnce?: boolean };

// ---------- activity building blocks ----------
const tasks = (c: Ctx, n: number, h0: number, step = 1.5, firstP = 0.7): Ev[] => Array.from({ length: n }, (_, k) => {
  const x = c.r(); const size = x < 0.45 ? 'S' : x < 0.85 ? 'M' : 'L';
  const quick = c.r() < 0.1; const postpones = c.r() < 0.1 ? 2 : 0;
  return { h: h0 + k * step, t: 'task', size, firstDay: !quick && postpones === 0 && c.r() < firstP, postpones, quick, planned: !quick } as Ev;
});
const trainDay = (c: Ctx, h: number, days: number[]): Ev[] => days.includes(c.wd)
  ? [{ h, t: 'session', full: c.r() < 0.8 }, ...(c.i < 70 && c.r() < 0.5 ? [{ h: h + 0.01, t: 'pr' } as Ev] : [])]
  : [{ h, t: 'rest' }];
const mind = (c: Ctx, h: number, p: number, after = false, extras = true): Ev[] => [
  { h, t: 'drop', scored: c.i < 10 ? 3 : 5, p, lesson: true, after },
  ...(extras && c.r() < 0.8 ? [{ h: h + 0.3, t: 'board', after, hints: c.r() < 0.3 ? 1 : 0 } as Ev] : []),
  ...(extras && c.r() < 0.6 ? [{ h: h + 0.6, t: 'mystery', after, revealed: c.r() < 0.15 } as Ev] : []),
  ...(extras && c.r() < 0.5 ? [{ h: h + 0.9, t: 'cards', n: 12, after } as Ev] : []),
  ...(extras && [1, 3, 5].includes(c.wd) ? [{ h: h + 1.0, t: 'lesson', after } as Ev] : []),
];
const keenDay = (c: Ctx): Ev[] => [
  ...tasks(c, 5, 10), ...trainDay(c, 18, [1, 3, 5]), ...mind(c, 21, 0.85),
  { h: 23, t: 'plan' }, { h: 25.25, t: 'lightsout', met: c.r() < 0.8 },
  ...(c.wd === 6 && c.r() < 0.8 ? [{ h: 12, t: 'sidequest' } as Ev] : []),
  ...(c.i > 45 && c.wd === 0 ? [{ h: 20, t: 'gold' } as Ev] : []),
];

const personas: Persona[] = [
  { id: 'a', name: 'Keen daily user', seed: 1, plan: keenDay },
  { id: 'b', name: 'Weekdays only (rest weekday = Sunday)', seed: 2, restWeekday: 0, plan: c => c.wd === 0 || c.wd === 6 ? [] : [
    ...tasks(c, 3, 17), ...trainDay(c, 19, [1, 3, 5]), ...mind(c, 21.5, 0.8), { h: 23, t: 'plan' }, { h: 25.25, t: 'lightsout', met: c.r() < 0.6 }] },
  { id: 'b2', name: 'Weekdays only, rest weekday picked once (first week only, as the Ground picker stores it)', seed: 2, restWeekday: 0, restOnce: true, plan: c => c.wd === 0 || c.wd === 6 ? [] : [
    ...tasks(c, 3, 17), ...trainDay(c, 19, [1, 3, 5]), ...mind(c, 21.5, 0.8), { h: 23, t: 'plan' }, { h: 25.25, t: 'lightsout', met: c.r() < 0.6 }] },
  { id: 'c', name: 'Tired often (soft days 2-3x a week)', seed: 3, plan: c => {
    const soft = [2, 4].includes(c.wd) || (c.wd === 6 && c.r() < 0.5);
    if (soft) return [{ h: 20, t: 'soft' }];
    return [...tasks(c, 3, 11, 2, 0.5), ...trainDay(c, 18, [1, 5]), ...mind(c, 21, 0.75), { h: 25.25, t: 'lightsout', met: c.r() < 0.5 }];
  } },
  { id: 'd', name: '3-week lapse in month 2, then returns', seed: 4, plan: c => (c.i >= 35 && c.i < 56) ? [] : keenDay(c) },
  { id: 'e', name: 'Night owl (Mind after bedtime)', seed: 5, plan: c => [
    ...tasks(c, 4, 22.5, 0.75), ...trainDay(c, 21, [2, 4, 6]), ...mind(c, 26, 0.8, true), { h: 25.9, t: 'plan' }, { h: 27.5, t: 'lightsout', met: false }] },
  { id: 'f', name: 'Keen + buys every shop item when affordable', seed: 1, buy: true, plan: keenDay },
  // ---- gaming probes ----
  { id: 'g1', name: 'Probe: task farmer (20 tiny first-day tasks, nothing else)', seed: 7, plan: c => Array.from({ length: 20 }, (_, k) => ({ h: 9 + k * 0.5, t: 'task', size: 'S', firstDay: true, postpones: 0, planned: true }) as Ev) },
  { id: 'g2', name: 'Probe: every other day (keen days, blank days between)', seed: 1, plan: c => c.i % 2 === 0 ? keenDay(c) : [] },
  { id: 'g3', name: 'Probe: soft day every day, nothing else', seed: 8, plan: () => [{ h: 20, t: 'soft' }] },
  { id: 'g4', name: 'Probe: focus hoarder (keen activity, tasks held for the boost window)', seed: 1, plan: c => {
    const evs = keenDay(c); const nonTask = evs.filter(e => e.t !== 'task' && e.t !== 'lightsout' && e.t !== 'plan');
    // everything except tasks happens 08:00-09:00; tasks are dumped after quests complete (re-timed by the executor, see HOARD)
    return [...nonTask.map((e, k) => ({ ...e, h: 8 + k * 0.05 })), { h: 9.5, t: 'plan' }, ...evs.filter(e => e.t === 'task').map((e, k) => ({ ...e, h: 30 + k * 0.01 })), ...evs.filter(e => e.t === 'lightsout')];
  } },
  { id: 'g5', name: 'Probe: season sandbagger (keen in odd seasons, 1 small task/day in even seasons)', seed: 1, plan: c => seasonFor(c.day).index % 2 === 0 ? keenDay(c) : [{ h: 10, t: 'task', size: 'S', firstDay: true, postpones: 0, planned: true }] },
];

const price = (id: string) => SHOP_ITEMS.find(x => x.id === id)!.price;
type Snap = { d: number; day: string; xp: number; level: number; shards: number; earned: number; owned: number; streak: number; rest: number; restUsed: number; paused: boolean; gold: boolean; sp: number; target: number; rank: number; tier: string; dayTotal: number; season: number; cleanWeeks: number };

function run(p: Persona) {
  const r = rng(p.seed);
  const facts: LedgerRow[] = []; const known = new Set<string>();
  const settings: SettingRow[] = [
    { key: 'economy.v2From', value: START, updatedAt: 0, deleted: 0, deviceId: 'sim' },
    { key: 'economyVisibleFrom', value: START, updatedAt: 0, deleted: 0, deviceId: 'sim' },
  ];
  const add = (f: Omit<LedgerRow, 'deleted' | 'deviceId'>) => { if (known.has(f.id)) return false; facts.push({ ...f, deleted: 0, deviceId: 'sim' }); known.add(f.id); return true; };
  const snaps: Snap[] = []; const anomalies: string[] = []; const shown = new Map<string, number>();
  let uid = 0, step = 0, dropDays = 0, chests = 0; const sessionDaysByWeek = new Map<string, Set<string>>();
  const focusDoubled: number[] = []; let prev: Snap | undefined;
  for (let i = 0; i < DAYS; i++) {
    const day = addEconomyDays(START, i), wd = weekday(day);
    if (p.restWeekday != null && (!p.restOnce || i === 0)) settings.push({ key: `economy.restWeekday:${weekStart(day)}`, value: p.restWeekday, updatedAt: 0, deleted: 0, deviceId: 'sim' });
    const evs = p.plan({ i, day, wd, r }).sort((a, b) => a.h - b.h);
    const today: LedgerRow[] = [];
    const reconcileQuests = (now: number) => {
      const todayFacts = facts.filter(f => f.dayKey === day);
      for (const q of completedQuests(todayFacts, day)) if (add({ id: `daily-quest:${day}:${q.id}`, kind: 'daily-quest', refId: `${day}:${q.id}`, dayKey: day, mode: 'gamify', inputs: {}, updatedAt: now })) {}
      if (dailyQuests(day).every(q => known.has(`daily-quest:${day}:${q.id}`))) add({ id: `focus-boost:${day}`, kind: 'focus-boost', refId: day, dayKey: day, mode: 'gamify', inputs: {}, updatedAt: now });
    };
    let hoardShift = 0;
    for (const e of evs) {
      // probe g4: tasks are fired the minute after the boost appears (or at 22:00 if no boost)
      let h = e.h;
      if (h >= 30) { const boost = facts.find(f => f.id === `focus-boost:${day}`); h = boost ? (boost.updatedAt - at(day, 0)) / 3600e3 + 0.02 + hoardShift : 22 + hoardShift; hoardShift += 0.02; }
      const now = at(day, h); const id = () => `${p.id}${++uid}`;
      const after = 'after' in e && e.after === true;
      switch (e.t) {
        case 'task': { const tid = id(); add({ id: `done:${tid}`, mode: 'tasks', kind: 'done', refId: tid, dayKey: day, updatedAt: now, inputs: { plannedSize: e.size, wasPlanned: e.planned !== false, isFirstDay: e.firstDay, postpones: e.postpones ?? 0, clutchStamp: (e.postpones ?? 0) >= 2, createdToDoneMin: e.quick ? 12 : 600 } }); break; }
        case 'session': { const sid = id(); const ws = e.full ? 15 : 10; const xp = e.full ? 60 : 40;
          add({ id: `train-session:${sid}`, mode: 'train', kind: 'session', refId: sid, dayKey: day, updatedAt: now, inputs: { xp, plannedExercises: 5, touchedExercises: 5, plannedSets: 15, workingSets: ws, safety: false } });
          const week = weekStart(day); const set = sessionDaysByWeek.get(week) ?? new Set(); set.add(day); sessionDaysByWeek.set(week, set);
          const target = 3;
          if (set.size >= 2) add({ id: `train-week:${week}:two`, mode: 'train', kind: 'weekly', refId: week, dayKey: day, updatedAt: now, inputs: { milestone: 2, target, xp: 30 } });
          if (set.size >= 3) { const two = facts.find(f => f.id === `train-week:${week}:two`); add({ id: `train-week:${week}:three`, mode: 'train', kind: 'weekly', refId: week, dayKey: day, updatedAt: now, inputs: { milestone: 3, target, priorDayKey: two?.dayKey, xp: 30 } }); }
          break; }
        case 'pr': { const pid = id(); add({ id: `train-pr:${pid}`, mode: 'train', kind: 'pr', refId: pid, dayKey: day, updatedAt: now, inputs: { prKind: 'ladderStep', value: 2 } }); break; }
        case 'rest': add({ id: `train-rest:${day}`, mode: 'train', kind: 'rest', refId: day, dayKey: day, updatedAt: now, inputs: { minutes: 15 } }); break;
        case 'drop': {
          const dropId = `drop:daily:${day}`; let t = now; const results: boolean[] = [];
          if (e.lesson) { add({ id: `learn-lesson:step${++step}`, mode: 'learn', kind: 'learn-lesson', refId: `step${step}`, dayKey: day, updatedAt: t, inputs: { conceptId: 'c', dropId, afterBedtime: after, hookCorrect: true, spotCorrect: true, guidedFirstTry: [true] } }); t += 60e3; }
          for (let k = 0; k < e.scored; k++) { const ok = r() < e.p; results.push(ok); const cursor = k + (e.lesson ? 1 : 0);
            add({ id: `learn-answer:${dropId}:${cursor}`, mode: 'mind', kind: 'learn-answer', refId: `${dropId}:${cursor}`, dayKey: day, updatedAt: t, inputs: { itemId: `i${cursor}`, conceptId: 'c', correct: ok, score: ok ? 1 : 0, confidence: 'sure', dropId, afterBedtime: after } }); t += 40e3; reconcileQuests(t); }
          add({ id: `learn-drop:${day}`, kind: 'learn-drop', refId: day, dayKey: day, mode: 'gamify', inputs: {}, updatedAt: t });
          if (e.scored >= 3 && perfectDrop(facts, dropId, e.scored)) add({ id: `perfect-drop:${day}`, kind: 'perfect-drop', refId: day, dayKey: day, mode: 'gamify', inputs: {}, updatedAt: t });
          dropDays++; break; }
        case 'board': { const bid = id(); add({ id: `board:${bid}`, dayKey: day, mode: 'mind', kind: 'board', refId: bid, updatedAt: now, inputs: { daily: true, afterBedtime: after, type: 'sudoku', diff: 'easy', hintsUsed: e.hints ?? 0 } }); break; }
        case 'mystery': { const mid = id(); add({ id: `mystery:${mid}`, dayKey: day, mode: 'mind', kind: 'mystery', refId: mid, updatedAt: now, inputs: { daily: true, afterBedtime: after, result: e.revealed ? 'revealed' : 'solved', hintsUsed: 0, tries: 1 } }); break; }
        case 'cards': for (let k = 0; k < e.n; k++) add({ id: `card:${day}:card${k}`, dayKey: day, mode: 'mind', kind: 'card', refId: `${day}:card${k}`, updatedAt: now + k * 5e3, inputs: { afterBedtime: after, correct: r() < 0.8 } }); break;
        case 'lesson': { const lid = id(); add({ id: `lesson:${lid}`, dayKey: day, mode: 'mind', kind: 'lesson', refId: lid, updatedAt: now, inputs: { courseId: 'track', afterBedtime: after } }); break; }
        case 'plan': add({ id: `tomorrow-plan:${day}`, kind: 'tomorrow-plan', refId: day, dayKey: day, mode: 'gamify', inputs: {}, updatedAt: now }); break;
        case 'lightsout': add({ id: `lightsout:${day}`, dayKey: day, mode: 'bonuses', kind: 'lightsout', refId: day, updatedAt: now, inputs: { lightsOutAt: now, bedtimeTarget: now, metTarget: e.met } }); break;
        case 'soft': add({ id: `soft-start:${day}:${id()}`, mode: 'soft', kind: 'soft-start', refId: day, dayKey: day, updatedAt: now - 60e3, inputs: { state: 'tired' } });
          add({ id: `soft:${day}`, mode: 'soft', kind: 'soft', refId: day, dayKey: day, updatedAt: now, inputs: { choice: 'breathe', state: 'tired' } }); break;
        case 'sidequest': { const qid = id(); const wk = isoWeek(day); add({ id: `quest:${qid}:${wk}`, mode: 'quests', kind: 'quest', refId: qid, dayKey: day, updatedAt: now, inputs: { target: 1, progress: 1, questKind: 'once' } }); break; }
        case 'gold': add({ id: `gold-review:concept${dropDays}`, mode: 'gamify', kind: 'gold-review', refId: `concept${dropDays}`, dayKey: day, updatedAt: now, inputs: { correct: 5, total: 5 } }); break;
      }
      reconcileQuests(now + 1000);
    }
    // end-of-day reconcile: unit chests (ESTIMATE: one module mastered per 60 drop days, max 6 modules), badges, monthly
    const endNow = at(day, 27.9);
    while (chests < Math.min(6, Math.floor(dropDays / 60))) { chests++; add({ id: `unit-chest:module${chests}`, kind: 'unit-chest', refId: `module${chests}`, dayKey: day, mode: 'gamify', inputs: {}, updatedAt: endNow }); }
    for (const b of badges) for (let tier = 1; tier <= badgeTier(b, facts); tier++) add({ id: `badge-tier:${b.id}:${tier}`, kind: 'badge-tier', refId: `${b.id}:${tier}`, dayKey: day, mode: 'gamify', inputs: {}, updatedAt: endNow });
    if (monthlyQuestCount(facts, day.slice(0, 7)) >= 20) add({ id: `monthly-challenge:${day.slice(0, 7)}`, kind: 'monthly-challenge', refId: day.slice(0, 7), dayKey: day, mode: 'gamify', inputs: {}, updatedAt: endNow });
    // shopping (persona f): try every item in this season's catalogue, in catalogue order, as the shop would allow
    if (p.buy) for (let pass = 0; pass < 3; pass++) for (const item of catalogue(day)) {
      const dec = purchaseDecision(item.id, facts, settings, day);
      if (dec.ok) { const ref = `${item.id}:${endNow + ++uid}`; add({ id: `purchase:${ref}`, mode: 'economy', kind: 'purchase', refId: ref, dayKey: day, updatedAt: endNow + uid, inputs: { itemId: item.id, price: item.price } }); }
    }
    const v = deriveEconomy(facts, RULES_HISTORY, settings, day);
    if (v.days.at(-1)?.welcome) add({ id: `welcome-back:${day}`, kind: 'welcome-back', refId: day, dayKey: day, mode: 'gamify', inputs: {}, updatedAt: endNow });
    const spent = facts.filter(f => f.kind === 'purchase').reduce((s, f) => s + Number(f.inputs.price), 0);
    const earned = p.buy ? deriveEconomy(facts.filter(f => f.kind !== 'purchase'), RULES_HISTORY, settings, day).shards : v.shards;
    if (v.days.at(-1)?.focus) focusDoubled.push(v.days.at(-1)!.focus);
    const s: Snap = { d: i + 1, day, xp: v.totalXp, level: v.level, shards: v.shards, earned, owned: v.owned.length, streak: v.streak.days, rest: v.streak.restDays, restUsed: v.streak.restDaysUsed, paused: v.streak.paused, gold: v.streak.gold, sp: v.season.sp, target: v.season.target, rank: v.season.rank, tier: v.season.tier, dayTotal: v.days.at(-1)!.total, season: v.season.index, cleanWeeks: v.cleanWeek.streak };
    // ---- anomaly checks ----
    for (const dd of v.days) { const was = shown.get(dd.dayKey); if (was != null && was !== dd.total) anomalies.push(`${day}: past day ${dd.dayKey} total changed ${was} -> ${dd.total}`); }
    shown.set(day, s.dayTotal);
    if (prev) {
      if (s.xp < prev.xp) anomalies.push(`${day}: XP dropped ${prev.xp} -> ${s.xp}`);
      if (s.level < prev.level) anomalies.push(`${day}: level dropped`);
      if (s.earned < prev.earned) anomalies.push(`${day}: earned Shards dropped ${prev.earned} -> ${s.earned}`);
      if (!p.buy && s.shards < prev.shards) anomalies.push(`${day}: Shards dropped ${prev.shards} -> ${s.shards}`);
      if (p.buy) { const spentToday = facts.filter(f => f.kind === 'purchase' && f.dayKey === day).reduce((a, f) => a + Number(f.inputs.price), 0); if (s.shards < prev.shards - spentToday) anomalies.push(`${day}: balance fell more than today's spend`); }
      if (s.season === prev.season && s.sp < prev.sp) anomalies.push(`${day}: season SP dropped ${prev.sp} -> ${s.sp}`);
      if (s.season === prev.season && s.rank > prev.rank) anomalies.push(`${day}: rank worsened ${prev.rank} -> ${s.rank}`);
      if (s.season === prev.season && s.target !== prev.target) anomalies.push(`${day}: season target moved ${prev.target} -> ${s.target}`);
    }
    snaps.push(s); prev = s;
    (s as any).spent = spent;
  }
  return { p, snaps, anomalies, facts, settings, focusDoubled };
}

const only = process.env.ONLY?.split(',');
const out: any[] = [];
for (const p of personas.filter(x => !only || only.includes(x.id))) {
  const t0 = performance.now();
  const res = run(p);
  const ms = performance.now() - t0;
  // time a single deriveEconomy at day 365 (median of 9)
  const last = res.snaps.at(-1)!.day; const times: number[] = [];
  for (let k = 0; k < 9; k++) { const a = performance.now(); deriveEconomy(res.facts, RULES_HISTORY, res.settings, last); times.push(performance.now() - a); }
  times.sort((a, b) => a - b);
  const levelDays: Record<number, number> = {}; for (const s of res.snaps) if (levelDays[s.level] == null) levelDays[s.level] = s.d;
  const seasons: any[] = []; for (const s of res.snaps) { const prevS = res.snaps[s.d - 2]; if (prevS && prevS.season !== s.season) seasons.push({ season: prevS.season + 1, end: prevS.day, sp: prevS.sp, target: prevS.target, rank: prevS.rank, tier: prevS.tier, shardsJump: s.earned - prevS.earned }); }
  const ls = res.snaps.at(-1)!; seasons.push({ season: ls.season + 1, end: ls.day + ' (in progress)', sp: ls.sp, target: ls.target, rank: ls.rank, tier: ls.tier });
  out.push({ id: p.id, name: p.name, runMs: Math.round(ms), deriveMedianMs: +times[4]!.toFixed(1), facts: res.facts.length, snaps: res.snaps, anomalies: res.anomalies, levelDays, seasons, focusDays: res.focusDoubled.length, focusXp: res.focusDoubled.reduce((a, b) => a + b, 0), owned: deriveEconomy(res.facts, RULES_HISTORY, res.settings, last).owned, comp: (() => {
    const fv = deriveEconomy(res.facts, RULES_HISTORY, res.settings, last); const c: Record<string, number> = {};
    c.fromXp = Math.floor(fv.totalXp * RULES.shards.perXp); c.levelUp = (fv.level - 1) * RULES.shards.levelUpBonus;
    for (const f of res.facts) if (['daily-quest', 'badge-tier', 'unit-chest'].includes(f.kind)) c[f.kind] = (c[f.kind] ?? 0) + (f.kind === 'daily-quest' ? 8 : f.kind === 'badge-tier' ? 5 : 25);
    const mindQ = ['drop', 'combo', 'learn-three', 'learn-perfect', 'board', 'board-clean', 'case', 'gold'];
    c.mindQuestShards = res.facts.filter(f => f.kind === 'daily-quest' && mindQ.includes(f.refId.split(':')[1]!)).length * 8;
    c.welcomeDays = fv.days.filter(d => d.welcome > 0).length; c.softDays = fv.days.filter(d => d.soft > 0).length; c.hatTricks = fv.days.filter(d => d.hatTrick).length;
    c.seasonAwards = fv.shards + res.facts.filter(f => f.kind === 'purchase').reduce((a, f) => a + Number(f.inputs.price), 0) - c.fromXp - c.levelUp - (c['daily-quest'] ?? 0) - (c['badge-tier'] ?? 0) - (c['unit-chest'] ?? 0);
    return c; })() });
  console.log('composition', JSON.stringify(out.at(-1).comp));
  const pick = (d: number) => res.snaps[d - 1];
  console.log(`\n== ${p.id} ${p.name} (${res.facts.length} facts, run ${Math.round(ms)} ms, derive@365 median ${times[4]!.toFixed(1)} ms)`);
  for (const d of [7, 30, 90, 180, 365].filter(d => d <= DAYS)) { const s = pick(d)!; console.log(`day ${d} ${s.day}: XP ${s.xp} L${s.level} shards ${s.shards} (earned ${s.earned}) owned ${s.owned} streak ${s.streak} rest ${s.rest}/used ${s.restUsed} paused ${s.paused} gold ${s.gold} | S${s.season + 1} SP ${s.sp} target ${s.target} rank ${s.rank} ${s.tier}`); }
  console.log('anomalies', res.anomalies.length, res.anomalies.slice(0, 8));
}
writeFileSync('/tmp/cj2/job1-scratch/out.json', JSON.stringify(out));
```

### /tmp/cj2/job1-scratch/report.mjs
```js
import { readFileSync } from 'node:fs';
const out = JSON.parse(readFileSync('/tmp/cj2/job1-scratch/out.json', 'utf8'));
for (const r of out) {
  console.log(`\n## ${r.id} ${r.name}`);
  console.log('levelDays', Object.entries(r.levelDays).filter(([l]) => [2,3,5,10,15,20,25,30,35,40,45].includes(+l)).map(([l, d]) => `L${l}@d${d}`).join(' '));
  console.log('seasons'); for (const s of r.seasons) console.log(`  S${s.season} end ${s.end} SP ${Math.round(s.sp)} target ${s.target} rank ${s.rank} ${s.tier} shardsNextDay ${s.shardsJump ?? ''}`);
  const sn = r.snaps; const breaks = []; let pausedDays = 0;
  for (let i = 1; i < sn.length; i++) { if (sn[i].streak < sn[i-1].streak) breaks.push(`${sn[i].day}:${sn[i-1].streak}->${sn[i].streak}`); if (sn[i].paused) pausedDays++; }
  console.log('streak drops', breaks.length, breaks.slice(0, 12).join(' '), '| paused days', pausedDays, '| rest used', sn.at(-1).restUsed, '| gold days', sn.filter(s => s.gold).length);
  console.log('shards (balance) by month:', sn.filter((s, i) => i % 30 === 29 || i === sn.length - 1).map(s => `d${s.d}:${s.shards}`).join(' '));
  console.log('avg XP/day', Math.round(sn.at(-1).xp / sn.length), 'avg earned shards/day', (sn.at(-1).earned / sn.length).toFixed(1), 'focus days', r.focusDays, 'focus XP', r.focusXp, 'owned', r.owned.join(','));
  if (r.id === 'f') { let o = 0; for (const s of sn) if (s.owned !== o) { console.log(`  owned ${s.owned} on ${s.day} (d${s.d}) bal ${s.shards}`); o = s.owned; } }
  const dt = sn.map(s => s.dayTotal); const max = Math.max(...dt); console.log('day total min/median/max', Math.min(...dt), dt.slice().sort((a,b)=>a-b)[dt.length>>1], max);
}
```

### /tmp/cj2/job1-scratch/micro.ts
```ts
// Targeted checks behind the simulation findings. Run: cd /tmp/cj2/job1 && TZ=Asia/Kolkata npx tsx /tmp/cj2/job1-scratch/micro.ts
import { deriveEconomy, addEconomyDays } from '/tmp/cj2/job1/src/core/economy/deriveEconomy';
import { RULES_HISTORY } from '/tmp/cj2/job1/src/core/rules.config';
import { dailyQuests } from '/tmp/cj2/job1/src/core/economy/gamify';
import type { LedgerRow, SettingRow } from '/tmp/cj2/job1/src/data/types';
const at = (day: string, h: number) => Date.parse(`${day}T00:00:00+05:30`) + h * 3600e3;
const F = (id: string, day: string, mode: string, kind: string, inputs: Record<string, unknown> = {}, h = 12): LedgerRow => ({ id, dayKey: day, mode, kind, refId: id.split(':').slice(1).join(':'), inputs, updatedAt: at(day, h), deleted: 0, deviceId: 't' });
const S = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 0, deleted: 0, deviceId: 't' });
const hat = (day: string) => [F(`done:t${day}`, day, 'tasks', 'done', { plannedSize: 'M', wasPlanned: true, isFirstDay: true, postpones: 0, createdToDoneMin: 600 }, 10),
  F(`train-rest:${day}`, day, 'train', 'rest', { minutes: 15 }, 18), F(`mystery:m${day}`, day, 'mind', 'mystery', { daily: true, afterBedtime: false, result: 'solved' }, 21)];
const v = (facts: LedgerRow[], settings: SettingRow[], day: string) => deriveEconomy(facts, RULES_HISTORY, settings, day);
const line = (label: string, x: ReturnType<typeof v>) => console.log(label.padEnd(44), `XP ${x.totalXp} shards ${x.shards} streak ${x.streak.days} rest ${x.streak.restDays} paused ${x.streak.paused} restored ${x.streak.restored} canRepair ${x.streak.canRepair} gold ${x.streak.gold}`);

console.log('T1 Saturday break + Sunday rest weekday: can Mon+Tue Hat-tricks repair it?');
{ // 2026-11-02 Mon. Mon-Thu unmarked drain the 4-day bank, Fri Hat-trick, Sat missed, Sun = chosen rest day, Mon+Tue Hat-tricks.
  const base = [S('economy.v2From', '2026-11-02'), S('economyVisibleFrom', '2026-11-02')];
  const withRest = [...base, S('economy.restWeekday:2026-11-02', 0)];
  const facts = [...hat('2026-11-06'), ...hat('2026-11-09'), ...hat('2026-11-10'), ...hat('2026-11-11')];
  for (const d of ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11']) line(`  rest=Sun, today ${d}`, v(facts.filter(f => f.dayKey <= d), withRest, d));
  const facts2 = [...hat('2026-11-06'), ...hat('2026-11-08'), ...hat('2026-11-09'), ...hat('2026-11-10')];
  line('  same, but Hat-trick ON the Sunday rest day', v(facts2, withRest, '2026-11-10'));
  line('  no rest weekday: Sat miss, Sun+Mon Hat-tricks', v(facts2, base, '2026-11-10'));
}
console.log('\nT2 a freeze purchase fact the balance cannot pay still adds a rest day');
{ const base = [S('economyVisibleFrom', '2026-11-05')];
  const buy = (n: number) => Array.from({ length: n }, (_, k) => F(`purchase:freeze:${k}`, '2026-11-05', 'economy', 'purchase', { itemId: 'freeze', price: 50 }, 9));
  line('  no purchase, day 1', v([], base, '2026-11-05'));
  line('  3 freeze facts, 0 Shards to pay', v(buy(3), base, '2026-11-05'));
}
console.log('\nT3 skip a day vs do the soft-day gentle thing (D1 and D3 identical Hat-trick days)');
{ const base = [S('economy.v2From', '2026-11-05'), S('economyVisibleFrom', '2026-11-05')];
  const d1 = hat('2026-11-05'), d3 = hat('2026-11-07');
  const soft = [F('soft-start:2026-11-06:x', '2026-11-06', 'soft', 'soft-start', { state: 'tired' }, 19), F('soft:2026-11-06', '2026-11-06', 'soft', 'soft', { choice: 'breathe' }, 20)];
  const a = v([...d1, ...soft, ...d3], base, '2026-11-07'), b = v([...d1, ...d3], base, '2026-11-07');
  line('  soft day on D2', a); line('  skipped D2', b);
  console.log('  D3 welcome gift: soft', a.days.at(-1)!.welcome, '| skipped', b.days.at(-1)!.welcome);
}
console.log('\nT4 next-season target after a quiet season: median 0 vs a little every day');
{ // Season 2 = 2026-12-07..2027-01-03 (28 days). Season 3 starts 2027-01-04.
  const base = [S('economy.v2From', '2026-11-05'), S('economyVisibleFrom', '2026-11-05')];
  for (const perDay of [0, 1, 5, 10, 15, 50, 100, 245]) {
    const facts: LedgerRow[] = [];
    if (perDay) for (let d = '2026-12-07'; d <= '2027-01-03'; d = addEconomyDays(d, 1)) facts.push(F(`done:x${d}`, d, 'tasks', 'done', { plannedSize: 'S', xpShare: perDay, postpones: 0 }, 10));
    const x = v(facts, base, '2027-01-04');
    console.log(`  S2 every day = ${String(perDay).padStart(3)} XP -> S3 target ${String(x.season.target).padStart(5)} SP; Apex needs SP >= target (= ${Math.ceil(x.season.target / 245)} keen days at 245/day)`);
  }
}
console.log('\nT5 Mind done after bedtime: 0 XP, but daily quests still pay Shards');
{ const base = [S('economy.v2From', '2026-11-05'), S('economyVisibleFrom', '2026-11-05')];
  // pick a day whose 3 quests are all Mind quests a late learner can finish
  const mindQ = new Set(['drop', 'combo', 'learn-three', 'board', 'case', 'board-clean']);
  let day = '2026-11-05'; for (let i = 0; i < 400 && !dailyQuests(day).every(q => mindQ.has(q.id)); i++) day = addEconomyDays(day, 1);
  const drop = `drop:daily:${day}`; const facts: LedgerRow[] = [];
  for (let k = 1; k <= 5; k++) facts.push(F(`learn-answer:${drop}:${k}`, day, 'mind', 'learn-answer', { correct: true, dropId: drop, afterBedtime: true }, 26 + k / 60));
  facts.push(F(`learn-drop:${day}`, day, 'gamify', 'learn-drop', {}, 26.2), F(`board:b${day}`, day, 'mind', 'board', { daily: true, afterBedtime: true, hintsUsed: 0 }, 26.3), F(`mystery:c${day}`, day, 'mind', 'mystery', { daily: true, afterBedtime: true, result: 'solved' }, 26.4));
  const quests = dailyQuests(day).map(q => q.id);
  for (const q of quests) facts.push(F(`daily-quest:${day}:${q}`, day, 'gamify', 'daily-quest', {}, 26.5));
  facts.push(F(`focus-boost:${day}`, day, 'gamify', 'focus-boost', {}, 26.5));
  const x = v(facts, [...base, S('economyVisibleFrom', day)], day);
  console.log(`  ${day} quests ${quests.join(',')}: Mind XP ${x.days.at(-1)!.mind}, day XP ${x.days.at(-1)!.total}, Shards ${x.shards} (3 quests x 8 = 24)`);
}
console.log('\nT1b no rest weekday: Sat missed, Sun marked (soft day, no Hat-trick), Mon Hat-trick. What does Monday evening promise?');
{ const base = [S('economy.v2From', '2026-11-02'), S('economyVisibleFrom', '2026-11-02')];
  const soft = [F('soft:2026-11-08', '2026-11-08', 'soft', 'soft', { choice: 'breathe' }, 20)];
  const facts = [...hat('2026-11-06'), ...soft, ...hat('2026-11-09'), ...hat('2026-11-10')];
  for (const d of ['2026-11-09', '2026-11-10']) line(`  today ${d}`, v(facts.filter(f => f.dayKey <= d), base, d));
}
console.log('\nT6 rest check first (10 XP), then a short session the same day (1 of 15 sets): does XP drop?');
{ const base = [S('economy.v2From', '2026-11-05'), S('economyVisibleFrom', '2026-11-05')];
  const rest = F('train-rest:2026-11-05', '2026-11-05', 'train', 'rest', { minutes: 15 }, 9);
  const sess = F('train-session:s1', '2026-11-05', 'train', 'session', { xp: 4, plannedExercises: 5, touchedExercises: 1, plannedSets: 15, workingSets: 1, safety: false }, 19);
  const a = v([rest], base, '2026-11-05'), b = v([rest, sess], base, '2026-11-05');
  console.log(`  after walk check: train XP ${a.days.at(-1)!.train}, total XP ${a.totalXp} | after short session: train XP ${b.days.at(-1)!.train}, total XP ${b.totalXp}`);
}
console.log('\nT7 quick-win cap: six M tasks, each created and done within 10 minutes');
{ const base = [S('economy.v2From', '2026-11-05'), S('economyVisibleFrom', '2026-11-05')];
  const facts = Array.from({ length: 6 }, (_, k) => F(`done:q${k}`, '2026-11-05', 'tasks', 'done', { plannedSize: 'M', wasPlanned: false, isFirstDay: false, postpones: 0, createdToDoneMin: 10 }, 9 + k));
  for (const n of [5, 6]) console.log(`  ${n} quick M tasks -> tasks XP ${v(facts.slice(0, n), base, '2026-11-05').days.at(-1)!.tasks} (M task = 20 XP)`);
}
```
