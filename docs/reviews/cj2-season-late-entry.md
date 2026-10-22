# Season late entry (cloud job batch 2, job 3)

Base: `origin/ship-27` at `b17ec40`. Run on 22 Oct 2026.
Branch: `ideas/cj2-season-late-entry`. No app code changed. The script and the patched copy lived in `/tmp`; key code is pasted below.

## Short answer

- A season is one calendar month (first Monday to the day before the next first Monday). Season 1 is 2 Nov to 6 Dec 2026 (35 days).
  So 15 Dec is late in **Season 2**, and 1 Feb 2027 is **day 1 of Season 4**. Neither of them is in Season 1.
- Everyone starts at **#500 of 500, Bench**, whatever day they install. The target does not shrink for a late joiner, so the **best possible rank drops by about 13 places for every day missed**.
  From 8 Nov, Apex can't be reached even at the 300 SP daily cap. From 12 Nov Elite can't, from 20 Nov Contender can't, and from 30 Nov you can't leave Bench at all.
- Late joiners also get fewer season-end Shards for the same daily effort (Bench 50 vs Apex 300).
- Two messages read as "you are behind":
  1. On first open, a new install from Season 2 onward gets a full-screen reveal: "Season N · Bench, 0 SP this season, +50 Shards". It is about a season they were never in.
  2. The ladder shows the top 10 seats with SP numbers that a late joiner can't reach.
- **Smallest fair rule:** measure each season over **the days you had in it**. Late joiners get a pro-rated target (250 SP × days had), the median used for the next season's target counts only days you were here, and seasons that ended before you arrived give no award and no reveal.
  The change is three lines in `deriveEconomy.ts` plus one guard in `EconomyFeedback.tsx`. It is measured as a no-op for anyone who joined before a season began (0 of 480 compared days differ).

Numbers below are **measured**: real `deriveEconomy` output from `origin/ship-27`, run on synthetic ledgers. The paces themselves (what a "normal" or "keen" person does each day) are **assumptions**, defined in the Method section.

## 1. How the season rules work today

| What | Where | Value |
|---|---|---|
| Season dates | `src/core/economy/deriveEconomy.ts:14` `seasonFor` | From the first Monday of a month to the day before the next first Monday (28 or 35 days) |
| Season 1 | `deriveEconomy.ts:162-163` | Index 0, from 2 Nov 2026. Before that, `active=false` |
| SP per day | `deriveEconomy.ts:165` | Day XP minus soft-day and welcome-back XP, capped at `spDailyCap` 300 |
| Target, first season / no history | `deriveEconomy.ts:167-168, 175` | `targetPerDay` 250 × **full season days** (8,750 for Season 1, 7,000 for a 28-day season) |
| Target, later seasons | `deriveEconomy.ts:169-177` | Median daily SP over **all calendar days** of the previous season × days ÷ 0.863, so your own median pace lands at #50 |
| Rank | `deriveEconomy.ts:179`, `seasonRank.ts:12` | `500 − floor(499 × min(1, SP/target)^0.7)` |
| Tiers | `rules.config.ts:151` | Bench 500–301 · Challenger 300–151 · Contender 150–51 · Elite 50–11 · Ace 10–2 · Apex 1 |
| Seed | `deriveEconomy.ts:181` | 10% of last season's SP, capped at 10% of the new target |
| Season-end Shards | `rules.config.ts:172`, `deriveEconomy.ts:230-236` | Bench 50 · Challenger 100 · Contender 150 · Elite 200 · Ace 250 · Apex 300 |
| Join day | `AppShell.tsx:108-113` | `economyVisibleFrom` = the first day the app runs. **Not used by any season maths.** |

Spec: `docs/specs/05-economy.md` §5. It says "No defeat states. Rank changes read as progress". It does not mention late joiners.

## 2. Answers by install date (current rules)

Paces: **normal** is about 106 SP a day (a Clean Week: 4 Hat-trick days, 3 lighter days). **Keen** is about 254 SP a day (the spec's worked 245 XP day every day, plus the weekly Train bonus). **Max** is 300 SP every day, the cap.
"Weeks" means weeks from install day until the tier is first reached. "never" means not reached by the end of that season.

| Install | Season (days had) | Start | Pace | Target | End SP | End rank | Shards | Challenger | Contender | Elite | Ace | Apex |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 Nov (baseline) | S1 (35/35) | #500 Bench | normal | 8,750 | 3,725 | #226 Challenger | 100 | 3.1 wk | never | never | never | never |
| | | | keen | 8,750 | 8,875 | **#1 Apex** | 300 | 1.4 | 3.0 | 4.3 | 4.9 | 5.0 |
| **5 Nov** | S1 (32/35) | #500 Bench | normal | 8,750 | 3,295 | #249 Challenger | 100 | 3.3 | never | never | never | never |
| | | | keen | 8,750 | 8,110 | #27 Elite | 200 | 1.4 | 3.0 | 4.3 | **never** | **never** |
| | | | max | 8,750 | 9,600 | #1 Apex | 300 | 1.1 | 2.6 | 3.7 | 4.1 | 4.3 |
| **20 Nov** | S1 (17/35) | #500 Bench | normal | 8,750 | 1,760 | **#338 Bench** | 50 | never | never | never | never | never |
| | | | keen | 8,750 | 4,315 | #196 Challenger | 100 | 1.4 | never | never | never | never |
| | | | max | 8,750 | 5,100 | #159 Challenger | 100 | 1.1 | never | never | never | never |
| **15 Dec** | S2 (20/28) | #500 Bench | normal | 7,000 | 2,085 | #287 Challenger | 100 | 2.6 | never | never | never | never |
| | | | keen | 7,000 | 5,080 | #102 Contender | 150 | 1.1 | 2.4 | never | never | never |
| | | | max | 7,000 | 6,000 | #53 Contender | 150 | 1.0 | 2.1 | never | never | never |
| **1 Feb 2027** | S4 (28/28) | #500 Bench | normal | 7,000 | 2,980 | #226 Challenger | 100 | 2.4 | never | never | never | never |
| | | | keen | 7,000 | 7,100 | #1 Apex | 300 | 1.1 | 2.4 | 3.4 | 3.9 | 4.0 |

**Can they reach the top?**
- 5 Nov: only at the daily cap every day (300 SP). At a keen pace they top out at #27 Elite.
- 20 Nov: no. The best possible is #159 Challenger.
- 15 Dec: no. The best possible in Season 2 is #53 Contender.
- 1 Feb: yes. It is day 1 of a season, so it is not a late entry.

**Latest install day that can still reach each tier in Season 1** (worked out from the formula, 8,750 target):

| Tier | At max (300/day) | At 250/day | At 106/day |
|---|---|---|---|
| Apex | 7 Nov | 2 Nov | never |
| Ace | 8 Nov | 2 Nov | never |
| Elite | 11 Nov | 6 Nov | never |
| Contender | 19 Nov | 15 Nov | never |
| Challenger | 29 Nov | 27 Nov | 14 Nov |
| Bench only | from 30 Nov | from 28 Nov | from 15 Nov |

Each day missed costs about 12–15 places of ceiling.

### Knock-on effect on the next season's target (non-monotonic)
The Season 2 re-fit takes the median over all 35 calendar days of Season 1. Days before the install count as **zero**:

| Install (normal pace) | S2 target | Rank after S2 week 1 |
|---|---|---|
| 2 Nov | 3,246 | #271 Challenger |
| 5 Nov (3 zero days push the median down to a light day) | **1,460** | **#147 Contender** |
| 20 Nov (18 of 35 days are zero, so the median is 0 and the default applies) | **7,000** | **#380 Bench** |

Same person, same habits. The next season is easier or harder only because of the install date. A 15 Dec normal joiner gets the same 1,460 target for Season 3.

## 3. Messages that read as "you are behind"

| # | Where | What a late joiner sees | Reads as loss? |
|---|---|---|---|
| 1 | `src/ui/shell/EconomyFeedback.tsx:81-91` | On first open (before shutdown time), a 15 Dec install gets a full-screen reveal: **"Season 1 · Bench" / "0 SP this season · +50 Shards" / "Next season · Season 2"**. A 1 Feb install gets "Season 3 · Bench / 0 SP this season". Measured: `deriveEconomy` for the day before the season gives Bench and 0 SP. The reveal path comes from reading the code; I did not drive it in a browser. Welcome (`AppShell.tsx:190`) renders in the same tree, so the reveal is likely waiting under or after it. | **Yes.** The first thing a new user is told is that they finished last in something they never joined. "Next season · Season 2" is also wrong, since Season 2 is the current one. |
| 2 | `deriveEconomy.ts:230-236` | The same user is credited Bench 50 Shards for every season that ended before install. Measured: a 15 Dec install has 50 Shards on first open, and a 1 Feb install has **150**. | Not a loss, but it is unearned. It also feeds message 1. |
| 3 | `EconomyScreens.tsx:87` with `ladder.ts:15-25` | The ladder always lists seats #1–#10 with SP thresholds from the full-season target (#1 = 8,750 SP). After 7 Nov those numbers can't be reached even at the cap. | **Implicitly.** It shows a goal that is already out of reach. |
| 4 | `EconomyScreens.tsx:73` | "#500 of 500 · Bench" on install day. Every new user starts there by design (`06-theme.md` "starts as candidate #500"). For a late joiner it stays low longer. | Mild. It is literally last place. |
| 5 | `EconomyScreens.tsx:73` | "+0 places this week" on install day, on Monday mornings and after a quiet week. | Mild. A zero count reads as a stall. |
| 6 | `rules.config.ts:151` | The lowest tier is called "Bench". In sport, "on the bench" means not picked. It is the end-of-season headline for anyone who joins after about 28 Nov. | Judgement call: a mild loss word. |

I found no copy that says "late", "behind", "days left" or "missed". The problem is the numbers, not the words.

## 4. How others treat late joiners (official pages)

| Product | Season shape | Late joiner | Source |
|---|---|---|---|
| **Duolingo leagues** | Weekly. "Every Sunday (based on your timezone), a new weekly league begins." "each week, you're matched with people who have similar study habits to you and who are in a similar time zone." | A late joiner is at most a few days behind, never weeks, and is grouped with people like them. | https://blog.duolingo.com/duolingo-leagues-leaderboards/ (opened). The Help Center page https://www.duolingo.com/help/leaderboards-and-league renders with JavaScript and returned only the word "Duolingo" to WebFetch and curl, so I could not quote it. |
| **Clash Royale** | Same calendar as NANDI: "Each season starts on the first Monday of every month". Ranked: "At the end of each season, players are reset to Master 1. However, you'll receive a Win Multiplier based on how far you progressed during the previous season". Seasonal Trophy Road: "Your Seasonal Trophy count is reset. Your Trophy Road progress remains unchanged." | **Catch-up by days, not by start date.** Pass Royale Lucky Loop: "The number of extra Crown milestones is equal to the number of days in that season … This doesn't mean you need to rush to finish the pass! All the extra milestones from previous days will be available for you to complete as soon as you finish the main reward track." The pass is sold with a warning: "It expires at the end of each season, so be sure to get it with enough time to complete it before purchasing." | https://support.supercell.com/clash-royale/en/articles/seasons.html · https://support.supercell.com/clash-royale/en/articles/ranked-3.html · https://support.supercell.com/clash-royale/en/articles/seasonal-trophy-road-2-2.html · https://support.supercell.com/clash-royale/en/articles/pass-royale-11.html. These pages render with JavaScript; I read the article text from the JSON embedded in the page via curl. |
| **Fortnite Battle Pass** | Season-long pass, with levels from XP. | Epic's help pages say a late pass purchase still unlocks the rewards for levels already earned, and that "Supercharged XP" is a temporary catch-up boost that turns on automatically after missed days or quests and ends once you've caught up. | **Could not open.** Every epicgames.com/help and fortnite.com page returned HTTP 403 (a Cloudflare challenge) to WebFetch and curl: https://www.epicgames.com/help/c-202300000001636/c-202300000001721/if-i-buy-the-battle-pass-later-will-i-get-the-rewards-for-my-already-earned-levels-a202300000011985 · https://www.epicgames.com/help/en-US/c-Category_Fortnite/c-Fortnite_Gameplay/why-am-i-not-getting-supercharged-xp-in-fortnite-a000094114 · https://www.fortnite.com/battle-pass. The wording in this row comes from search-engine extracts of those pages, **not verified on the page**. |

What they have in common:
- Duolingo keeps the window short, so late entry hardly matters.
- Clash Royale and Fortnite let a latecomer catch up on what the calendar gave everyone.
- None of them ranks a newcomer against a full-length target they could not have met.

Two of these mechanisms are off-limits for NANDI:
- Fortnite's XP boost makes the same action pay more on some days.
- Clash Royale's Lucky Loop pays out random chests.

Both clash with "no random rewards" and with stable, predictable XP. The part worth copying is the principle: **measure people over the time they actually had.**

## 5. Recommendation: "a season counts the days you had in it"

The rule (one sentence for the spec): *Your season is measured over the days you were here. A late joiner's target is 250 SP × the days left when they arrived. The next season's target uses your median over the days you were here. A season that ended before you arrived gives no award and no reveal.*

The code was tried on a copy in `/tmp`, not committed:

```diff
--- src/core/economy/deriveEconomy.ts (origin/ship-27)
+++ patched copy
@@ -164,17 +164,25 @@
   const seasonSp = ...
+  // LATE ENTRY: a season is measured over the days you had in it. joinDay = the first day of this economy.
+  const joinDay = start;
+  const daysHad = (season: ReturnType<typeof seasonFor>) => Math.max(1, Math.round((atUtc(season.end) - atUtc(season.start > joinDay ? season.start : joinDay)) / MS_DAY) + 1);
   const targetFor = (season: ReturnType<typeof seasonFor>) => {
-    if (season.index <= 0) return RULES.season.targetPerDay * season.days;
+    const own = daysHad(season);
+    if (season.index <= 0) return RULES.season.targetPerDay * own;
     const prior = seasonFor(addEconomyDays(season.start, -1));
-    const values = Array.from({ length: prior.days }, (_, index) => {
-      const key = addEconomyDays(prior.start, index);
+    // Median over the days you were here, not the calendar days before you installed.
+    const from = prior.start > joinDay ? prior.start : joinDay;
+    const had = Math.round((atUtc(prior.end) - atUtc(from)) / MS_DAY) + 1;
+    if (had < 7) return RULES.season.targetPerDay * own;
+    const values = Array.from({ length: had }, (_, index) => {
+      const key = addEconomyDays(from, index);
       return daySp(days.find(day => day.dayKey === key));
     }).sort((a, b) => a - b);
     const middle = ...
-    if (!middle) return RULES.season.targetPerDay * season.days;
+    if (!middle) return RULES.season.targetPerDay * own;
     const fractionAt50 = ...
-    return Math.max(1, Math.round(middle * season.days / fractionAt50));
+    return Math.max(1, Math.round(middle * own / fractionAt50));
   };
@@ -231,6 +239,7 @@
     if (season.end >= today) break;
+    if (season.end < joinDay) continue; // LATE ENTRY: no award for a season that ended before you arrived
```

Plus one UI guard, not tried here. In `EconomyFeedback.tsx:83`, show the previous-season reveal only if `economyVisibleFrom` (or the first ledger day) is on or before `addEconomyDays(season.start, -1)`.

The ladder needs no change. `seatThreshold` already reads `view.season.target`, so the seat numbers become reachable on their own.

### Measured effect (same personas, patched copy)

| Install | Pace | Target | End rank (before → after) | Shards (before → after) | Weeks to Apex after | S2 target before → after |
|---|---|---|---|---|---|---|
| 2 Nov | all | 8,750 | unchanged | unchanged | 5.0 (keen) | unchanged |
| 5 Nov | normal | 8,000 | #249 → #232 Challenger | 100 → 100 | never | 1,460 → 3,246 |
| 5 Nov | keen | 8,000 | #27 Elite → **#1 Apex** | 200 → 300 | 4.6 | 7,952 → 7,952 |
| 20 Nov | normal | 4,250 | #338 Bench → **#231 Challenger** | 50 → 100 | never | 7,000 → 3,246 |
| 20 Nov | keen | 4,250 | #196 → **#1 Apex** | 100 → 300 | 2.4 | 7,000 → 7,952 |
| 15 Dec | normal | 5,000 | #287 → #230 Challenger | 100 → 100 | never | (S3) 1,460 → 3,246 |
| 15 Dec | keen | 5,000 | #102 Contender → **#1 Apex** | 150 → 300 | 2.9 | (S3) 7,952 → 7,952 |
| 1 Feb | all | 7,000 | unchanged | unchanged | 4.0 (keen) | 4,057 / 9,939 unchanged |

First open, after the patch: a 15 Dec install has 0 Shards (was 50), and a 1 Feb install has 0 (was 150).

What this fixes:
- **End rank now depends on pace, not on install date.** At normal pace every install date ends at #226–#232. At keen pace every one reaches Apex.
- **The next season's target is the same for the same habits** (3,246 normal, 7,952 keen), whatever the install date.

### Why it doesn't punish early joiners
- **Measured:** for an install on 20 Oct 2026, I compared `season`, `shards` and `totalXp` from the original and the patched code on every day from 20 Oct 2026 to 28 Mar 2027, at 3 paces (the normal one includes a 3-week break). **0 of 480 days differ.** The rule only changes seasons that begin before the person's first day.
- An early joiner's rank and Shards are untouched. A late joiner earns the same tier for the same daily pace, not a higher one.
- Gaming check: the only way to move `joinDay` later is to wipe the app's data, which loses all XP, level, streak and Shards. Restoring a backup brings the old `economyVisibleFrom` back (it is a settings row). There is no shortcut.
- Unit tests: in a copy of the repo with the patched file, `vitest run src/core/economy src/data src/ui` passed (8 + 38 files, 51 + 155 tests). The full `src/core` run had 1 failure, `src/core/puzzles/pathLogic.test.ts`, an 8.1 s timeout under parallel load. **The same test also failed in the unpatched run** and passes alone, so it is not caused by this change.

### Forward-only note (must read before shipping)
`deriveEconomy` recomputes every past season's award with the current formula (`deriveEconomy.ts:230-236`). Changing the target formula therefore changes past awards.
- **Ship before Mon 2 Nov 2026:** no season has ended and no late joiner exists yet, so nothing can drop.
- **Ship after that:** gate the rule with `effectiveFrom` (apply it only to seasons whose `start ≥ effectiveFrom`). Otherwise the 5 Nov normal joiner's Season 2 target rises from 1,460 to 3,246, and their Season 2 award and rank could fall. That breaks "Shards never decrease".
- The award skip for seasons before `joinDay` is safe only if it ships before 7 Dec (the first season end). Later, the Bench 50 is already in some balances and must stay.

### Smaller copy fixes (same PR or next)
- Hide "+0 places this week" when the number is 0 (`EconomyScreens.tsx:73`).
- Consider renaming "Bench" to a starting-line word, for example "Entry" or "Trials". That is a product call for Jenil, and `banned-words` should be rechecked.

## 6. Other findings (not late-entry, worth knowing)

1. **A normal Clean-Week pace never gets past Challenger in a first season**, whatever the install date: #226 at about 106 SP a day. The default target (250 a day) is 2.4× the app's own headline goal. From the second season the re-fit puts the same person at about #50.
   That is by design (`05-economy.md` §5). But every new user's first season is judged at a keen pace. Pro-rating does not change this; a lower `targetPerDay` for a first season would.
2. **The median re-fit is jumpy.** With a weekly rhythm, the median lands either on a light day (45) or a Hat-trick day (100+), so the next target swings about 2× on small habit changes. Examples: 1,460 vs 3,246 above, and 4,057 for a 1 Feb normal joiner.
3. **Rank resets hard at a season change.** The 2 Nov keen persona goes from #1 Apex on 6 Dec to #380 Bench on 7 Dec, then #274 after a week. The season-end reveal frames it, but the You card shows only the new number the next morning.

## Method

- Personas build ledger facts with the same `mode`/`kind`/`inputs` shapes the repos write. Sources: `tasks.ts:433-452` (`done`), `train.ts:178` (`session`), `train.ts:218-223` (`weekly`), `gamify.ts:31` (`learn-drop`), `learn-engine.ts:52` (`learn-answer`).
- Settings: `economyVisibleFrom` = install day, as `AppShell.tsx:112` writes on first run.
- For every day from install to the end of the season (plus 7 days of the next), the script appends that day's facts and calls the real `deriveEconomy(facts, undefined, settings, day)`.
- Not modelled: quests and focus boosts (they raise XP, but the keen pace is already near the 300 cap), soft days, purchases, rest days.

Run:
```
cd /tmp/cj2/job3 && npm ci
./node_modules/.bin/tsx /tmp/cj2/job3-sim/sim.mts                    # original rules
SRC=/tmp/cj2/job3-sim/patched/src COMPARE=1 ./node_modules/.bin/tsx /tmp/cj2/job3-sim/sim.mts   # patched copy + early-joiner check
```

Script (`/tmp/cj2/job3-sim/sim.mts`), key parts:

```ts
const SRC = process.env.SRC ?? '/tmp/cj2/job3/src';
const { deriveEconomy, seasonFor, addEconomyDays } = await import(`${SRC}/core/economy/deriveEconomy.ts`);
import { RULES } from '/tmp/cj2/job3/src/core/rules.config.ts';
import type { LedgerRow } from '/tmp/cj2/job3/src/data/types.ts';

let serial = 0;
const row = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}, refId?: string): LedgerRow => {
  serial++; const ref = refId ?? `r${serial}`;
  return { id: `${kind}:${ref}`, dayKey, mode, kind, refId: ref, inputs, updatedAt: Date.parse(`${dayKey}T10:00:00Z`) + serial, deleted: 0, deviceId: 'sim' };
};
const task = (d: string, size: 'S' | 'M' | 'L') => row(d, 'tasks', 'done', { plannedSize: size, wasPlanned: true, isFirstDay: true, postpones: 0 });
const session = (d: string) => row(d, 'train', 'session', { plannedExercises: 2, touchedExercises: 2, plannedSets: 6, workingSets: 6, safety: false });
const restCheck = (d: string) => row(d, 'train', 'rest', { minutes: 12 });
const drop = (d: string) => [
  ...Array.from({ length: 5 }, () => row(d, 'mind', 'learn-answer', { dropId: `drop:daily:${d}`, afterBedtime: false, correct: true })),
  row(d, 'gamify', 'learn-drop', {}, d),
];
const weekly = (d: string, milestone: number, prior?: string) => row(d, 'train', 'weekly', { milestone, target: 3, priorDayKey: prior }, `${d}:${milestone}`);
const dow = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();

// Normal = a Clean Week: 3 workouts + 1 rest-day check (4 Hat-trick days), a task and a Learn drop daily. ~106 SP/day.
function normalDay(d: string): LedgerRow[] {
  const w = dow(d), out: LedgerRow[] = [...drop(d), task(d, 'M')];
  if (w === 1 || w === 3 || w === 5) out.push(task(d, 'S'), session(d));
  if (w === 2) out.push(task(d, 'S'), restCheck(d));
  if (w === 3) out.push(weekly(d, 2));
  if (w === 5) out.push(weekly(d, 3, addEconomyDays(d, -2)));
  return out;
}
// Keen = the spec's worked 245 XP Hat-trick day, every day, plus the weekly Train bonus. ~254 SP/day.
function keenDay(d: string): LedgerRow[] {
  const w = dow(d);
  const out = [task(d, 'M'), task(d, 'S'), { ...task(d, 'L'), inputs: { plannedSize: 'L', wasPlanned: true, isFirstDay: false, postpones: 1 } }, session(d),
    row(d, 'mind', 'mystery', { result: 'solved', afterBedtime: false }), row(d, 'mind', 'board', { daily: true }), row(d, 'mind', 'lesson'),
    ...Array.from({ length: 10 }, () => row(d, 'mind', 'card')), row(d, 'bonuses', 'lightsout', { metTarget: true })];
  if (w === 3) out.push(weekly(d, 2));
  if (w === 5) out.push(weekly(d, 3, addEconomyDays(d, -2)));
  return out;
}
// Max = at or above the 300 SP daily cap.
function maxDay(d: string): LedgerRow[] {
  return [...Array.from({ length: 8 }, () => task(d, 'L')), session(d), row(d, 'mind', 'mystery', { result: 'solved' }), row(d, 'mind', 'board', { daily: true }),
    row(d, 'mind', 'lesson'), ...Array.from({ length: 20 }, () => row(d, 'mind', 'card')), row(d, 'mind', 'board', { daily: false }), row(d, 'bonuses', 'lightsout', { metTarget: true })];
}

function run(install: string, pace: 'normal' | 'keen' | 'max') {
  const s = seasonFor(install), settings = { economyVisibleFrom: install }, facts: LedgerRow[] = [];
  const reached: Record<string, string> = {};
  for (let d = install; d <= s.end; d = addEconomyDays(d, 1)) {
    facts.push(...PACES[pace](d));
    const v = deriveEconomy(facts, undefined, settings, d);
    for (const t of TIERS) if (!reached[t] && tierOrder.indexOf(v.season.tier) >= tierOrder.indexOf(t)) reached[t] = d;
  }
  // ...then 7 days into the next season to read its re-fit target and rank.
}

// First open: shards, rank and the previous-season reveal values (EconomyFeedback.tsx:81-91).
const past = deriveEconomy([], undefined, { economyVisibleFrom: i }, addEconomyDays(seasonFor(i).start, -1)); // -> Bench, 0 SP

// Early-joiner check: install 20 Oct 2026, every day to 28 Mar 2027, 3 paces (normal has a 3-week break),
// compare JSON of [season, shards, totalXp] from original vs patched deriveEconomy. Result: 0 of 480 differ.
```

Raw output (original rules, per row): `{"install":"2026-11-20","pace":"normal","target":8750,"endSp":1760,"endRank":338,"endTier":"Bench","shardsAward":50,"next":{"season":2,"target":7000,"week1Rank":380}}`. The first-open lines were:
```
first-open 2026-12-15: shards=50 rank=#500 Bench target=7000 reveal="Season 1 · Bench" "0 SP this season"
first-open 2027-02-01: shards=150 rank=#500 Bench target=7000 reveal="Season 3 · Bench" "0 SP this season"
```
