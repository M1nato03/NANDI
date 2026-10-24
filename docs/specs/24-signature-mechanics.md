# Spec 24 · A signature mechanic for every mode

Status: PICKS APPROVED by Jenil (24 Oct 2026, "yeah go ahead with them"). Decisions 2-3 (ethics fixes, calm XP and name) are still open; recommended defaults are marked. Decision 4 settled 24 Oct.
Offline-first, online-ready: each mechanic has a v1 that works with no network and a v2 for when there are servers.

Jenil (24 Oct): Learn takes from Duolingo (spec 23). Every other mode should feel unique too: Mind could take from
Matiks, or NANDI could invent its own mechanic. The research is cloud batch 5. These 7 reports on branches
ideas/cj5-* hold every quote, source, table and the full designs:
- mind
- train
- calm
- focus
- invent
- ethics
- online
This spec picks one or two mechanics per mode. Every mechanic below must pass cj5-ethics' 15-line checklist with
YES on every line before it is built.

## The picks
| Mode | Mechanic | Original? | v1 (offline, now) | v2 (online) | Report |
|---|---|---|---|---|---|
| **Mind** | **Pace line** | Pacer idea from games | On a board, a quiet line shows how your own best run went, or how a friend went on the exact board they sent. No countdown, nothing to lose. One optional field on `puzzleRuns` plus one segment in the spec 19 link (this also makes "your friend's time" true). | Live friend duels and a weekly contest. The server checks each grid with the rule checker (under 0.25 ms), and never regenerates a board. Never rank daily boards publicly, because future boards can be computed from the bundle. | cj5-mind §7 #1 |
| **Mind** | **Prove it** | Yes, none found | After naming the culprit, tap the fewest clues that prove it. The phone checks the proof set by logic, with no stored answer. This makes NANDI's cases its own (Mentalist or Drishyam deduction, in our own stories). | Optional: compare your proof with how others proved board #N (see Chaupal). | cj5-mind §7 #2 |
| **Train** | **Taal week** | Yes | The week is one rhythm cycle. Session days are claps and rest days are rest beats; rest beats fill on their own. A readiness check can turn a clap into a rest beat or the minimum session, so the cycle still closes. Bests count only inside the plan ("clean bests"), so going past the plan never pays. | Friends see each other's cycle close (opt-in), with no ranking. | cj5-train §7 #1 |
| **Calm** (new) | **Breath kolam** | Yes | A short paced-breath sit with Kachhua, guided by text, haptics and an optional synthesized tone. Each out-breath draws one loop of today's dot pattern. Calm days grow one kolam at the courtyard doorstep, counted by days, never minutes. 0 XP. It lives inside existing moments (the soft day, the pause card, the night deck), not as a new tab: standalone breathing apps had a median 30-day retention of 0% (Baumel 2019). | Optional guided audio, and a group sit at a fixed time. | cj5-calm §4 |
| **Calm** | **Park it** | No (a known technique) | At night, write up to 5 specific lines for tomorrow (about 3 minutes). They land in Plan as tomorrow's tasks. This has the most direct falling-asleep evidence found (Scullin 2018, one small trial), so the copy makes no sleep claim. | — | cj5-calm §5 |
| **Focus / Plan** | **Phone ki chhutti** | Yes | Pick a rough window for tomorrow ("after dinner, 21:00-22:00"). Nothing is blocked and there is no timer. At the next open, NANDI reads Android's own usage events for that window (Usage Access is already granted for App pause, so no new permission). If the chosen apps stayed under a small grace, it is a Mor practice day and one marigold joins the toran over the courtyard gate. A missed window writes `kept: false` and changes nothing. The window ramps like bedtime does. | Focus together: friends set the same window, and each sees whether the others kept it. No ranking. | cj5-focus §5 #1 |
| **Across modes** | **Week case** | Yes, none found | On Sunday, Kapi builds a small logic case from your own week: deduce which day each friend was busy. It uses the cross-mode ledger, the six friends and the case engine that proves uniqueness. It is a 3-minute weekly review that is also a puzzle. | Swap week cases with a friend (with consent; only the puzzle, never the raw data). | cj5-invent §5 #1 |
Next in line (not in v1): Chaupal (compare your start with the solver's, and later with everyone's), Aangan katha
(a weekly story written from your real Field tries and Try-it days), and the split-case co-op (two phones, half
the clues each).

**Ruled out by the research:**
- A Storm-style rated speed round. It is an endless feed in disguise. The kind version is a fixed 5 boards a day,
  played once, with the count as the hard stop.
- Any "makes you smarter" copy (Simons 2016; Sala & Gobet 2019).
- Group streaks, Shard gifts, "everyone's tree dies".
- Calm claims about sleep, anxiety, heart-rate variability or "stress".

## Ethics fixes to existing mechanics (cj5-ethics; each one needs Jenil's yes)
| Mechanic | Checklist result | Fix |
|---|---|---|
| **Focus boost** | FAIL: a countdown, 2x XP, it pulls you into the app, and it can open after shutdown (bug fixed in ship-35 item 51) | Replace it with a **focus token**. Three daily quests earn one token, spent on one planned task's focus session, which doubles that task's XP. No countdown, never after shutdown, and it keeps until the end of the next day. Old boost facts keep paying for past days. Fallback if unused: a flat +15 XP. |
| **Season ladder** | FAIL: made-up people shown as real, no way to hide it, comparison with strangers | **Honest ladder.** "500 seats · the other 499 are pace markers, not people." A setting hides the ladder. Past seasons keep every tier. Real leagues (v2) are a separate board of real, opted-in people, never mixed with markers. |
| **Streak** | Needs a fix: repair costs more than a normal day, and there is no lifetime count | **Kind repair:** within 48 h, any 2 marked days reconnect the run, soft days included. Show "18 day run · 142 days practised in all"; the lifetime count never falls. |
| Shop, daily quests, courtyard | Small fixes | Prices into RULES (ship-35). The courtyard ignores Mind after bedtime (ship-35). |

## Going online (cj5-online), the order
1. **Replies to share links** (no account, no personal data): a friend's solve comes back to the sender. $0 up to
   about 16,000 daily users on Workers Free.
2. **Anonymous item calibration**, with consent and an open receipt (spec 23 v2). $0; the fitting runs in CI.
3. **Accounts with Google sign-in** ($0) plus an email-link fallback. Phone OTP is about $0.07 per SMS in India; only
   if asked. A DPDP notice, consent and deletion come first.
4. **Sync last:** spec 22's merge, ordered by a hybrid logical clock plus a server sequence. D1 Free lasts to about
   600-1,000 heavy users, then Workers Paid at $5 a month.
The first hard limit is server CPU, not money: hard boards take 33-53 ms to generate against a 10 ms free limit, so
the server only ever checks.

## Build order (each step needs Jenil's yes and the full gate)
1. Ethics fixes: honest ladder (copy and a setting), focus token, kind repair. Small, and they remove real dark-pattern risk before any friend uses NANDI.
2. Phone ki chhutti (Focus). It is NANDI's mission, and it reuses App pause's permission.
3. Pace line + Prove it (Mind).
4. Taal week (Train), after ship-35's Train fixes (rep PRs, minimum session, rest day).
5. Breath kolam + Park it (Calm), inside the soft day and night deck.
6. Week case (cross-mode).
v2 items wait for servers, in the order above.

## Kill tests
Each report sets its own, before launch, never moved afterwards. The common shape: 4 weeks on the owner panel. Kill
or rework if people use it less than the report's floor, or if it raises opens after bedtime, or if Jenil says it
feels like pressure.

## Decisions for Jenil
1. Are these picks right? (Mind: pace line + Prove it. Train: Taal week. Calm: breath kolam + Park it. Focus: Phone ki chhutti. Across modes: Week case.)
2. Ethics fixes: focus token instead of the boost, the honest ladder, kind repair. Yes or no on each?
3. Calm: 0 XP (recommended) or a flat 5 XP before bedtime? Name it "kolam", "rangoli" or "dot pattern"?
4. Chhutti: **SETTLED 24 Oct (Jenil: "10 and option A read through phone app usage")**: 10 XP per measured kept window; self-reported windows stay 0 XP. Measurement uses app usage, with the per-phone lock self-test (log items 59-63). Jenil accepts the documented residual: an app that calls setShowWhenLocked() at runtime and stays open over the lock.
