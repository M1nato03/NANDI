# cj5 · Calm, meditation and sleep: a signature mechanic

Batch 5, job 3. Branch `ideas/cj5-calm`, based on `origin/main` at 55fd409.
Review only. No app code or content changed. Every number from the app is quoted from the files named.

## 0. Short answer

- **#1 (ORIGINAL): the breath kolam.** A short paced-breath sit with Kachhua, guided by text, haptics and an optional
  synthesized tone. On each guided out-breath, one loop of today's dot pattern (kolam) is drawn. The pattern is fixed
  by date and shown before you start. Calm days grow one kolam at the courtyard doorstep, by days and never by minutes.
  It pays 0 XP by default.
- **#2: Park it.** At night, put tomorrow on paper: up to 5 specific lines, about 3 minutes. They land in Plan as
  tomorrow's tasks. This is the most direct sleep-onset evidence found (Scullin 2018), from one small trial.
- **#3: The listening sit.** An unguided 2-5 minute sit with one cue a minute, for people who dislike controlling
  their breath. The evidence is weak, so this ranks third.
- **What the evidence does not support:** sleep, anxiety, heart-rate-variability or "stress relief" claims for a
  few minutes a day. NANDI makes none of these claims.
- **Retention warning:** in real usage data, standalone breathing apps had a median 30-day retention of 0.0%
  (Baumel 2019). So calm must sit inside moments NANDI already has (the soft day, the pause card, the night deck),
  not become a new destination.

## 1. What exists today (read on main)

| Piece | Where | What it does now |
|---|---|---|
| Soft-day breath | `src/ui/soft/SoftDay.tsx` `Breathe`; `soft.css` `.soft-breath` | A CSS circle on a 10 s loop (grow 0-45 %, hold 45-55 %, shrink 55-100 %), so about 4.5 s in, 1 s full and 4.5 s out, or 6 breaths a minute. No timer and no haptics. "Done" ends it at any time and writes `soft` `{ choice: 'breathe' }` (`doSoftThing`, id `soft:<day>`). |
| Soft-day rules | `src/core/soft/soft.ts`; `RULES.soft` | `dayXp: 10`, `welcomeBackXp: 15`, `careLowDays: 4`, `careWindowDays: 14`, `from: '2026-10-22'`. A soft day marks the day (`deriveEconomy.ts` `mark: … \|\| soft > 0`). Its XP stays out of the Season (`daySp`). |
| Pause card breath | `src/ui/screens/NightPauseCard.tsx`; `src/core/nightPause.ts` `pauseCardCopy` | "Take one breath", with a countdown of `RULES.night.pauseBreathSeconds` = **5** s. Then 3 swaps; at night these are "Open my night deck", a suggestion or one review card, and "Put the phone down". Window: `pauseLeadMin` = **30** min before bedtime until 04:00. |
| Night deck | `src/ui/night/NightDeck.tsx` `NIGHT_CARDS` | 6 cards: Tonight, Night drop, Think, Today in words (incl. "Tomorrow's first step", **one** task), Phone-down move, stopping card with the lights-out check-in. |
| Phone-down moves | `content/winddown/winddown.core.json`; `src/core/winddown.ts` `selectWinddownMove` | 24 offline moves on a fixed 24-night cycle, with at most 3 swaps. Some are calm already: "Take 10 slow breaths by the window", "Sit quietly for 10 minutes", "Listen to the evening sounds for 5 minutes". |
| Night plan | `src/core/nightPlan.ts` | If-then plan ("If I reach for one more scroll, then I open my night deck."), `nightsBackOnPlan`. |
| Courtyard | `src/core/courtyard/courtyard.ts` `deriveCourtyard`, `STAGE_DAYS = [3, 7, 14, 30, 60]` | 6 friends, 6 areas. Kachhua = Sleep = `lightsout` with `metTarget`. Kachhua's stage objects: mat, pillow, woven cot, **a lantern**, blanket. Soft days add `lanterns` (a string in Kachhua's corner) and count as active days for the neem tree. |
| Storybook | `src/core/courtyard/storybook.ts` | Sleep lines per band, and a soft-day page (`SOFT_ONE`, `SOFT_MANY`). |
| Night XP rule | `deriveEconomy.ts` `beforeBed`; `gamify.ts` `matching` | Facts with `inputs.afterBedtime === true` pay no Mind XP. Tasks and Train still count. |
| Sound | `src/ui/cast/sound.ts` `playCastSound` | Our own synthesized sine notes. Muted when reduced motion is on **and whenever `.deck-night` is on screen**. |
| Haptics | `src/platform/haptics.ts` `tapHaptic` | `navigator.vibrate(pattern)`, falling back to Capacitor `Haptics.impact`. Returns early when motion is reduced (in the app or on the phone). |
| Wake lock | `src/platform/awake.ts` `keepScreenAwake` | `@capacitor-community/keep-awake` 8.0.1, or the web `wakeLock`. Used for workouts. |

Ledger rows are free-form (`LedgerRow { mode: string; kind: string; inputs }` in `src/data/types.ts`), and backup does
not allow-list kinds. A new `calm` kind therefore needs no Dexie migration and travels in backups and in the spec-22
union merge unchanged.

## 2. Evidence (opened sources, quoted)

| Claim | What the source says (quoted) | Source |
|---|---|---|
| 5 minutes a day of structured breathing helped mood a little more than mindfulness | Balban et al. 2023, remote RCT, 108 adults, 5 min/day for 28 days. "the cyclic sighing group had a significantly higher increase in positive affect than those in the mindfulness meditation group." "There were no differences between the two groups in state anxiety and negative affect changes." "The breathwork group had a significantly higher reduction in respiratory rate than the mindfulness meditation group." The page also reports no significant changes in HRV, resting heart rate or sleep. | https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947/ (the Cell Press page returned 403) |
| Its limits | "the findings of this study are limited to 4 weeks with no additional follow up." "sample size in each group was relatively small" "The remote nature of the study limited the monitoring of how closely participants followed the instructions" | same |
| Breathwork across trials: a small to medium effect, with caveats | Fincham et al. 2023, 12 RCTs, 785 adults: "significant small-to-medium mean effect size, g = − 0.35 [95% CI − 0.55, − 0.14]" for stress. "Most studies were deemed as being at moderate risk of bias." They call for care "to avoid a miscalibration between hype and evidence" and say "further research needed to gauge the safety profile of fast-paced breathwork in particular". | https://pmc.ncbi.nlm.nih.gov/articles/PMC9828383/ |
| Slow breathing changes heart-rate measures during and after practice | Laborde et al. 2022: "223 studies were suitable for inclusion". "Results indicate increases in vmHRV with VSB, DURING, IM-AFTER1, and AFTER-INT." VSB "could be advised as a low-tech and low-cost technique" "with few adverse effects expected." | https://eprints.bournemouth.ac.uk/38169/ |
| Brief mindfulness has a small effect, and a smaller one in students | Schumer, Lindsay & Creswell 2018, 65 RCTs: "(g=.21, p<.001)"; "community samples (g=.41, p<.001) produced larger training effects compared to student samples (g=.14, p=.001)"; after correcting for publication bias the effect "was significantly reduced (g=.04)." | https://pmc.ncbi.nlm.nih.gov/articles/PMC6441958 |
| Mindfulness against active controls | Goldberg et al. 2021/22, 44 meta-analyses: "MBIs showed superiority to passive controls across most PICOS". "Effects were typically smaller and less often statistically significant when compared to active controls." | https://pmc.ncbi.nlm.nih.gov/articles/PMC8364929 |
| People do about half of what an app asks | Huberty et al. 2019 (Calm app, stressed students): "Participants were asked to meditate using Calm at least 10 minutes per day." They averaged 37.9 min/week (about 54 % of 70), and "Over half of the participants (23/41, 56%) completed more than 30 minutes per week". | https://pmc.ncbi.nlm.nih.gov/articles/PMC6614998/ |
| A to-do list before bed: faster sleep onset in one lab study | Scullin et al. 2018: "Fifty-seven healthy young adults (18–30)" "completed a writing assignment for five minutes prior to overnight polysomnography recording". "Participants in the to-do list condition fell asleep significantly faster than those in the completed-list condition" (results section: 15.82 vs 25.09 min). | https://pmc.ncbi.nlm.nih.gov/articles/PMC5758411/ |
| A vibration pacer slows breathing, but anxiety did not follow | Miri, Gross et al. (Stanford, VibroAffect): the pacer "led to a slower rate of breathing", but "these changes were not related to changes in skin conductance or self-reported anxiety." The page says the paper "is under preparation for submission" (not yet peer reviewed). | https://wehab.stanford.edu/research/vibroaffect |
| Rewards for simply doing an activity can lower interest in it | Deci, Koestner & Ryan 1999, 128 studies: "engagement-contingent, completion-contingent, and performance-contingent rewards significantly undermined free-choice intrinsic motivation (d = −0.40, −0.36, and −0.28, respectively)". "Positive feedback enhanced both free-choice behavior (d = 0.33) and self-reported interest (d = 0.31)." | https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf (PDF page 1, read) |

### 2a. Retention in meditation and breathing apps

| Finding (quoted) | Source |
|---|---|
| "The medians of app 15-day and 30-day retention rates were 3.9% (IQR 10.3%) and 3.3% (IQR 6.2%), respectively." | Baumel et al. 2019, JMIR, 93 Android apps with ≥10,000 installs — https://pmc.ncbi.nlm.nih.gov/articles/PMC6785720 |
| "On day 30, peer support (median 8.9%, n=2), mindfulness/meditation (median 4.7%, IQR 6.2%)" "had significantly higher retention rates than breathing exercise apps (median 0.0%, IQR 0.0%" | same |
| "only a small portion of users actually used the apps for a long period of time." | same |

What this means for NANDI: a breathing screen on its own is the weakest kind of app for retention. NANDI already has
moments when a calm minute is useful: a tired day, the pause card, and the end of the night deck. Calm must live
inside those moments. Its success is judged by whether those moments end better, not by calm minutes.

### 2b. Risks (adverse effects, anxiety, sleep tracking)

| Finding (quoted) | Source | Design rule it creates |
|---|---|---|
| "The total prevalence of adverse events was 8.3% (95% CI 0.05–0.12)"; "3.7% … for experimental and 33.2% … for observational studies." "The most common AEs were anxiety (33%, 18), depression (27%, 15) and cognitive anomalies (25%, 14)". They "may occur in individuals with no previous history of mental health problems." | Farias et al. 2020, systematic review — https://pureportal.coventry.ac.uk/en/publications/adverse-events-in-meditation-practices-and-meditation-based-thera/ (PubMed showed a cookie wall) | A visible Stop at all times. One line before the first sit: "If this feels bad, stop and breathe normally." A short default length. |
| "A higher proportion than hypothesized reported occurrence of MRAE (general item = 32.3%, 1+ specific item = 50.0%) and MRAE duration ≥1 month (10.4%)." "Anxiety, traumatic re-experiencing, and emotional sensitivity were the most common MRAE." "Participants reporting MRAE were equally glad to have practiced meditation as those not reporting MRAE." | Goldberg, Lam, Britton & Davidson 2021, Psychotherapy Research (PDF abstract read) — https://doi.org/10.1080/10503307.2021.1933646 | Be "transparent and realistic" (their conclusion). No promises. Offer a non-breath option (#3) for people who find breath focus uncomfortable. |
| Fast breathwork safety is unclear (Fincham, above). | — | **No** cyclic hyperventilation, no long breath holds, no "energising" fast breathing. Only slow paces. |
| Orthosomnia: patients "preoccupied or concerned with improving or perfecting their wearable sleep data"; trackers can feed a "perfectionistic quest for the ideal sleep". | Baron et al. 2017, J Clin Sleep Med — https://pmc.ncbi.nlm.nih.gov/articles/PMC5263088/ | No sleep score, no sleep-stage guesses, no mic tracking. Keep the plain lights-out check-in. |

### 2c. What the evidence does NOT support (so NANDI never says it)

- That a few minutes of breathing or mindfulness improves **sleep**. Balban found no sleep changes, and Scullin's
  result came from one lab night with 57 people.
- That it lowers **anxiety more than other calm activities**. There was no difference between breathing and mindfulness
  (Balban), and effects are smaller against active controls (Goldberg).
- That it changes **HRV or heart rate** in daily life. There was no significant change after 28 days (Balban). Laborde
  pooled lab measures, which are not an outcome a person feels.
- That a **haptic pacer** calms you. It slowed breathing, but self-reported anxiety did not follow (VibroAffect,
  not yet peer reviewed).
- That brief mindfulness works well **for students**. g = .14, and after correcting for publication bias the overall
  effect was g = .04 (Schumer).
- Anything **long-term**. The trials ran 4 weeks or less.

Allowed copy is about the activity, not an outcome: "Slow, even breathing for one minute." "A quiet minute before
sleep." Banned in calm copy (add to the copy lint later): treat, cure, heal, therapy, anxiety relief, stress relief,
fall asleep faster, better sleep. Under every calm screen: "A breathing exercise, not medical advice." The care card
(spec 15 F, Tele-MANAS 14416) stays the only path for repeated low days.

## 3. Apps studied: every mechanic against the hard rules

| App | Mechanic | What the user does and sees | Why it works (evidence, quoted) | Dark-pattern risk | NANDI v1 (offline) | NANDI v2 (online) | Kill test |
|---|---|---|---|---|---|---|---|
| Headspace | Short sessions | "From quick 3-minute mental resets to longer sessions" (App Store, 4.8 from 974K ratings, $12.99/month) — https://apps.apple.com/us/app/headspace-meditation-sleep/id493145008 | Asked for 10 min/day, people did ~38 min/week (Huberty). The tested dose was 5 min (Balban). | Low | **Keep.** Lengths 1 / 3 / 5 min only, 1 min by default on a soft day. | Same | If the median sit ends before half its length, drop the 5-minute choice. |
| Calm | One daily session ("Daily Calm") | "Daily Calm with Tamara Levitt…" (App Store, 4.8 from 2M) — https://apps.apple.com/us/app/calm/id571800810 | No outcome evidence found for "one a day". It is a format. | Low if it ends on a stop. | **Rewrite:** one dated kolam per day, ending on a stopping screen. No "next session" button. | Same | — |
| Calm | Sleep Stories (audio) | "100+ exclusive Sleep Stories, new content added every month" | None found for brief use. | Medium: needs audio downloads; an endless library at bedtime. | **Reject for v1** (no audio downloads; reading in bed means screen time). | Possible with streamed audio and screen off, if Jenil wants it. | — |
| Calm / Medito / Breathwrk | Streaks, "mindful minutes" totals | "Daily Streaks & Mindful Minutes" (Calm); "Streak tracking & gentle reminders" (Medito); "tracking streaks… Streaks & Levels" (Breathwrk) | Against: engagement-contingent rewards lowered free-choice interest, d = −0.40 (Deci 1999). | **High:** a calm streak turns a rest into a duty; minutes invite farming. | **Reject.** No calm streak and no minute totals. Growth counts days only (as in spec 12). A calm sit is not a streak mark (soft days already are). | Same | — |
| Medito | Free, non-profit, offline downloads | "100 % free & non‑profit"; "Offline mode — download sessions and practise anywhere" (App Store, 4.9 from 4.3K) — https://apps.apple.com/us/app/medito-meditation-sleep/id1500780518 | — (a model, not an effect) | None | **Keep the spirit:** calm is free, offline and generated on the phone. Nothing is downloaded. | — | — |
| Insight Timer | A plain timer with bells | "The world's most popular meditation Timer" (App Store, 4.9 from 448K); site: "Free meditation timer with customizable intervals, bells, and ambient sounds." — https://insighttimer.com/ | Brief mindfulness, small effect (Schumer). | Low | **Proposal #3**: a listening sit with one synthesized bell. | — | Used on fewer than 10 % of calm days after 2 weeks → fold into the menu or cut. |
| Insight Timer | Community and groups | "Community groups and features"; "Join 30 million people today" | Not found for this mechanic. | Medium: a live count of strangers is social proof and pressure. | Not possible offline. | **Rewrite:** friends-only "sit together" at an agreed time. No stranger counts. | — |
| Balance | Daily plan adapted to answers | "Each day, you'll answer questions about your meditation experience, goals, and preferences." (App Store, 4.9 from 121K) — https://apps.apple.com/us/app/balance-meditation-sleep/id1361356590 | Not found for adaptation itself. | Low; questions every day are friction. | **Rewrite, no questionnaire:** after 3 finished 1-minute sits, offer "Try 3 minutes?" once. It never raises the length on its own. | Pace defaults tuned by anonymous, consented "how did that feel" taps. | Fewer than 1 in 3 people accept the offer → remove it. |
| Finch | A self-care pet that you energise | "Take care of your pet by taking care of yourself!"; a reviewer: "I feel so responsible for this dang bird" (App Store, 4.9 from 767K) — https://apps.apple.com/app/id1528595748 | Not found for the pet mechanic. | **High:** responsibility for a creature becomes guilt. | **Reject** pet needs and energy. Kachhua hosts but never needs anything (spec 12 §5). | — | — |
| Breathwrk | Haptic breath guidance | "customizable sounds, visuals, haptic vibrations, and breath coaches" (App Store, 4.8 from 18K) — https://apps.apple.com/us/app/breathwrk-breathing-exercises/id1481804500 | A vibration pacer "led to a slower rate of breathing" (VibroAffect). Slow breathing raises vmHRV during practice (Laborde). | Low | **Keep**, with an eyes-closed mode (haptic only, screen near black). | — | Haptic mode chosen on fewer than 20 % of sits → keep it but stop leading with it. |
| Breathwrk | Energising, fast and hold techniques | "FOCUSING AND ENERGIZING EXERCISES"; "SLEEP EXERCISES (4-7-8)"; no safety warning found on the listing | Fast breathwork safety is "further research needed" (Fincham). | **Medium (safety)** | **Reject** fast breathing and long holds. Only slow paces: even, long out-breath, sigh. | — | — |
| Sleep Cycle | Microphone tracking and smart alarm | "patented sound technology"; "Wake up gently during your lightest sleep phase"; "Sleep goal and score" (App Store, 4.7 from 31K) — https://apps.apple.com/us/app/sleep-cycle-tracker-sounds/id320606217 | Against: orthosomnia (Baron 2017). | **High:** the mic is personal data; a score feeds perfectionism. | **Reject.** NANDI never opens the mic. The lights-out check-in stays self-report. | — | — |
| Swa:aha (was Level SuperMind; Google Play best app India 2023) | Hindi + English meditations, coins, leagues | "Hindi + English language"; a reviewer complains of "those coin points and random ppl showing up on my screen with League contest" (App Store, 4.7 from 546) — https://apps.apple.com/app/id1623828602; rebrand report 26 Jun 2026 — https://indiantelevision.com/mam/level-supermind-sheds-its-skin-and-emerges-as-swaaha/ | Against points for engagement (Deci 1999). | **High:** competition inside calm. | **Reject** leagues and coins in calm. **Keep** Hindi as a later copy option (text only, so cheap). | — | — |
| Lungy | Exhale-driven visuals | The mic detects each out-breath and drives a visual (review: https://www.tapsmart.com/apps/lungy-review/?amp=1) | Not found. | Medium: uses the mic, and rates "performance". | **Reject the mic.** Take the idea of a breath that draws something → #1, driven by the pacer, not by measurement. | — | — |

## 4. Proposal #1 (ORIGINAL): the breath kolam

### 4.1 What the person does and sees

1. Kachhua sits by a faint grid of dots: today's kolam, shown in full outline **before** the sit starts.
   Pick **1 · 3 · 5 min**, a **pace** and a **guide** (all remembered).
   - Paces (slow only): **Even** 5 s in / 5 s out (6 a minute; the soft-day circle already uses this pace).
     **Long out** 4 s in / 6 s out. **Sigh**: a breath in, a short second breath in, then a long slow breath out
     (cyclic sighing, as in Balban).
   - Guides: **See** (circle and words), **Feel** (eyes closed, haptics only, screen near black) and
     **Hear** (a quiet synthesized tone that rises and falls). They can be combined.
2. During the sit: one word on screen ("In", "Out"), with **Stop** always visible. With each guided out-breath, the
   line loops around one more dot. The pacer drives the line; nothing is measured, so there is nothing to do
   wrong.
3. At the end: the finished kolam and "That's today's kolam. You can stop here." with **Close**. One optional tap:
   **Calmer · Same · Not good**. "Not good" shows "Thanks for saying. Stopping is always fine. Normal breathing is
   fine." and the next sit offers the listening sit (#3) first.
4. Stopping early keeps the part already drawn. A part kolam is still a kolam; nothing is lost or greyed out.

Haptic language (Feel): 1 short pulse = breathe in, 2 short pulses = breathe out, a long soft pulse = the end.
Pulses are scheduled from absolute timestamps and recomputed on `visibilitychange`/`pageshow` (CLAUDE.md timer rule).

### 4.2 Where it shows up (no new destination; see Baumel)

| Moment | Today | With the breath kolam |
|---|---|---|
| Soft day, tired: "Breathe with Kachhua · 1 min" | CSS circle, Done | The same option runs a 1-minute kolam. It still writes `soft` `{ choice: 'breathe' }` (marks the day, 10 XP as now) and also a `calm` fact. |
| Pause card (day) | 5 s breath, then 3 swaps | The second swap becomes "1 slow minute with Kachhua" when no suggestion is set. |
| Pause card (night) | middle swap = suggestion or review card | The middle swap becomes "1 minute, eyes closed" (Feel guide). The first and last swaps stay. |
| Night deck stopping card | Lights-out check-in, Close | After the check-in, a quiet text link "Breathe in the dark · 1 min". Feel guide, black screen. At the end NANDI shows "Good night" and nothing else. |
| Plan | — | No new card, no quest and no reminder. A "Sit with Kachhua" row in the You menu only. |

After bedtime (`inputs.afterBedtime: true`) a sit is **uncelebrated**, the same rule as Tasks and Train: no finish
animation, no tone unless chosen, no XP. It still counts as a calm day for the kolam.

### 4.3 The courtyard

- **The doorstep kolam.** A kolam on the courtyard's front step grows with **calm days** (days with at least one
  `calm` fact), using the same `STAGE_DAYS` = 3, 7, 14, 30, 60: 3×3 dots → 5×5 → 7×7 → colour fill → a flower
  border. A real kolam is washed away each day. This one stays, deliberately: nothing in the courtyard shrinks
  (spec 12 §2).
- **No new friend and no new area.** Kachhua hosts the sit, but the kolam belongs to the doorstep, like the neem
  belongs to the middle. So Kachhua's Sleep stays an honest count of on-time nights, and the soft-day lanterns stay
  separate.
- A calm day counts as an **active day** for the neem tree (as soft days already do in `deriveCourtyard`).
- Scene line on a calm day: "Kachhua sat by the kolam with you today." At night every friend sleeps, as now.
- Storybook page (hand-written, by band like the others): "You sat with Kachhua on {n} days. The kolam by the door
  has grown." It shows no minutes and no paces.

### 4.4 Hard-rule check

| Rule | Pass? | Why |
|---|---|---|
| No variable or random reward | Pass | The pattern is chosen by date (`selectKolam(day)`, a fixed cycle like `selectWinddownMove`) and shown before the sit. No rare patterns. The same length always draws the same amount. |
| No loss states | Pass | Stopping early keeps the drawing. Missed days change nothing. The doorstep never shrinks. |
| No guilt | Pass | No calm streak, no reminder, no "Kachhua misses you". |
| No endless feed | Pass | One stop screen. No "sit again" on it; another sit needs the menu. |
| No punishing timer | Pass | The timer guides; it never judges. There is no score and no accuracy. |
| No health promises | Pass | The copy list in §2c, the footer line and the banned words. |
| XP never goes down | Pass | XP is never removed. |
| Night rule | Pass | 0 XP after bedtime, uncelebrated, black screen, ends itself. |

### 4.5 Data (v1 stored so v2 needs no migration)

- Ledger row per sit: `id: 'calm:<ulid>'`, `mode: 'calm'`, `kind: 'calm'`, `refId: <ulid>`, `dayKey` (4:00 boundary,
  credited to the day it started, like `doSoftThing`), with `inputs: { pace, plannedSec, sitSec, guides, patternId,
  afterBedtime, entry: 'soft'|'pause'|'night'|'menu', source: 'local' }`. It is a new ledger kind; the backup and the
  spec-22 merge carry it as-is.
- The feel tap is a **separate fact** `calm-feel:<sitUlid>` `{ feel }`, because ledger rows are never mutated. It is
  mood-like personal data: it stays on the phone, and the DPDP notice line from spec 15 is extended to cover it.
- Pattern pack: `content/calm/kolam.core.json`, a fixed cycle of dot-grid patterns given as numbers only (grid size,
  loop list). It is validated with the shared Valibot schemas and drawn as SVG from numbers, never from markup
  (content packs are untrusted).
- `RULES.calm` (new block in `rules.config.ts`): `minutes: [1, 3, 5]`, `paces: { even: [5, 5], longOut: [4, 6],
  sigh: [2, 1, 6] }`, `xp: 0`, `countsAsMark: false`, `offerLongerAfter: 3`, `haptic: { inMs: 40, outMs: [40, 120, 40],
  endMs: 300 }`, `toneHz: [196, 262]`, `toneGain: 0.01`. All are tunable, as CLAUDE.md requires.
- Derivation: `calmDays(facts)` and `kolamStage` sit beside `lanterns` in `CourtyardState`. Nothing new is stored
  for the courtyard.

### 4.6 Android and offline limits

- Haptics: Capacitor `Haptics.vibrate({ duration })` (docs: "Duration of the vibration in milliseconds", default 300 —
  https://capacitorjs.com/docs/apis/haptics), or `navigator.vibrate(pattern)` as `tapHaptic` does now.
- **Watch-out 1:** `tapHaptic` returns early when motion is reduced. A Feel guide built on it would go silent for
  exactly the people who turned motion off and need the non-visual guide most. Calm haptics need their own setting.
- **Watch-out 2:** `playCastSound` is muted whenever `.deck-night` is on screen and when motion is reduced. The breath
  tone needs its own opt-in path (off by default at night).
- **Screen off:** hidden pages get timers checked "once per second", and after 5 minutes "once per minute" (Chrome:
  https://developer.chrome.com/blog/timer-throttling-in-chrome-88). So v1 keeps the screen on but near black
  (`keepScreenAwake`). If the page is hidden, guidance pauses ("Paused. Tap to go on.") and never catches up. A true
  screen-off haptic sit would need a native foreground service; leave that to v2 and only if testers ask.
- No mic, no audio files, no network. Sound is synthesized with Web Audio, as `sound.ts` already does.

### 4.7 v2 online

- **Sit together (friends only):** one friend picks a time; each phone gets the same seed and start time. Afterwards
  the friends' loops are joined into one shared kolam on each doorstep, one colour per friend. Joining late is fine
  and missing it changes nothing. There is no "X is waiting" message and no count of strangers. The server stores a
  room code, a seed and a start time (KV, or a Durable Object alarm). There are no scores, so there is nothing to
  cheat.
- **Pace calibration from many learners:** an opt-in, anonymous `{ pace, minutes, feel }` from each sit. Aggregate
  "Not good" rates by pace pick the defaults, and a pace with a high "Not good" rate is removed for everyone.
  Consent is asked separately from the account.
- **Sync:** `calm` and `calm-feel` facts sync as ledger rows. `calm-feel` syncs only with an account and consent.
- Optional streamed voice guidance, only if Jenil wants it later. The core sit never needs it.

### 4.8 Kill test (Jenil + 5 friends, 2 weeks, owner panel)

1. **Finish rate:** sits finished / started ≥ **70 %**. Lower means the lengths or paces feel like work.
2. **Safety:** "Not good" ≤ **10 %** of rated sits. If a pace goes above that, remove the pace. If one person taps
   "Not good" twice in a row, their next sit leads with #3.
3. **Night:** on nights with an after-lights-out sit, NANDI closes within **1 minute** of the sit ending (median).
   If not, the sit is keeping the phone in hand: remove the night-deck link.
4. **Pause card:** "Put the phone down" plus calm sits must not fall below today's "Put the phone down" rate. If they
   do, calm is replacing putting the phone down: revert the swap.
5. **Kolam:** ask testers "Did the drawing help, or distract?" If most say distract, keep the paced breath and
   drop the drawing (the breath engine stays).
6. **Jenil's verdict** after 3 tired nights: "Did you put the phone down sooner?"

Build size: **M** (breath engine and guides; SVG kolam renderer; one pack; courtyard object; 3 entry points;
storybook lines; owner-panel numbers).

### 4.9 Originality search (what came closest)

Searched the web and app-store listings for kolam or rangoli breathing apps, apps that draw with each breath, and
breath-driven drawing games:

| Closest found | How close | Difference |
|---|---|---|
| Spirograph Breathing Coach — https://apps.apple.com/us/app/id6456407996 | "See your breath come to life on the screen!" | The listing does not say the drawing is kept, or that anything grows over days. No cultural pattern. |
| Lungy — https://www.tapsmart.com/apps/lungy-review/?amp=1 | Out-breath drives a visual | Uses the mic and rates "breathing performance"; nothing is kept. |
| Simple Kolam & Rangoli Designs (Play, via chrome-stats) — https://chrome-stats.com/d/com.simplekolam.android | A daily kolam with a tracing canvas | Not a breath practice; daily notifications and share feed. |
| Breathe Easy, Meditio, Lines of Zen (store listings in search results) | A pulsing shape; drawing as meditation | No paced-breath drawing kept as a record. |

Nothing found combines: a fixed dated pattern, drawn by the pacer (not measured), haptic eyes-closed guidance, and a
lasting doorstep that grows by days. The search cannot prove that no such app exists.

**Cultural note for Jenil:** Wikipedia describes kolam as drawn "in front of their home entrance every day at the break
of dawn" and links it to Lakshmi (https://en.wikipedia.org/wiki/Kolam). It is a household art, but it has religious
ties. User-facing name options: "kolam", "rangoli", or a neutral "dot pattern". The copy stays non-religious.

## 5. Proposal #2: Park it (put tomorrow on paper)

- **What:** on the night deck's "Today, in words" card, "Tomorrow's first step" (one task today) becomes **"Park
  tomorrow"**: up to **5** lines, about **3 minutes**, with the hint "Write it so tomorrow-you knows the first move:
  'Email Riya the slides'". Scullin found that more specific lists went with faster sleep onset; that detail is
  from press coverage I did not verify in the paper, so the hint is a nudge, not a claim. Each line becomes a
  tomorrow `could` task through the existing `repos.createTask` (`size: 'S'`, `estimateMin: 15`, as `saveTomorrow`
  does now).
- **Finish:** "It's written down. It can wait till morning." Then on to the phone-down card.
- **Evidence:** Scullin 2018, as quoted in §2. One lab study of 57 healthy 18-30s, so no sleep claim in copy.
- **Courtyard:** nothing new, on purpose. Planning is not practice; Mor grows on tasks **done**, as now.
- **Hard rules:** no XP for creating tasks (tasks pay when done), so it cannot be farmed. The 5-line cap and the
  3-minute guide keep bedtime from turning into work. After bedtime it is allowed and uncelebrated (Tasks rule).
- **v1 data:** existing task rows plus a `source: 'park'` field on the task for the kill test. Sync-ready already.
- **v2:** nothing new needed; it syncs with tasks.
- **Kill test:** (1) used on ≥ 3 of 7 nights by testers; (2) ≥ 40 % of parked items are done or deliberately moved
  next day; (3) median time on the card ≤ 3 min, otherwise cap it at 3 lines; (4) Jenil: "Did writing it down make it
  easier to stop?"
- **Build size:** S. **Original?** No. It comes from evidence, not from an app.

## 6. Proposal #3: The listening sit

- **What:** a 2 / 3 / 5 minute unguided sit. A synthesized soft bell (or a long pulse) at the start and end, and one
  text cue a minute: "One sound far away." "One sound close by." "Your breath, just as it is." The screen dims. It
  is for people who dislike breath control (§2b), and it is what "Not good" leads to.
- **Evidence:** weak. Brief mindfulness gives g = .14 in students and g = .04 after publication-bias correction
  (Schumer). Balban's mindfulness group improved too, with no difference from breathwork on anxiety.
- **Courtyard:** writes the same `calm` fact with `pace: 'quiet'`, so it grows the same doorstep kolam (a calm day is
  a calm day). The loops draw slowly with time, one per cue.
- **Hard rules:** same as #1. No streak, 0 XP, a stop screen.
- **v2:** the same "sit together"; the bell rings on every friend's phone at the agreed time.
- **Kill test:** chosen on fewer than 10 % of calm days after 2 weeks (excluding sits that "Not good" led to) →
  keep it only as the safety alternative.
- **Build size:** S (it reuses #1's engine). **Original?** No (Insight Timer's timer and bells).

## 7. Ranking

| Rank | Proposal | Evidence | Fit with NANDI | Kindness | Original | Size |
|---|---|---|---|---|---|---|
| 1 | Breath kolam | Moderate for slow breathing as an activity; none for outcomes NANDI would claim | Strong: soft day, pause card, night deck, courtyard | High (no score, no streak) | **Yes** | M |
| 2 | Park it | One RCT (n = 57) on the exact behaviour | Strong: night deck plus Plan | High | No | S |
| 3 | Listening sit | Weak (small, bias-corrected near zero) | Medium; safety alternative to #1 | High | No | S |

## 8. Product questions for Jenil

1. **XP for calm.** Recommended: **0 XP** (Deci 1999: rewards for simply doing it lower free-choice interest, d =
   −0.40). The alternative is a flat 5 XP before bedtime. A soft-day breath still pays its 10 XP either way.
2. **Name:** "kolam", "rangoli" or "dot pattern" (see the cultural note in §4.9).
3. **Night-deck link** after the lights-out check-in: on or off at launch? (Kill test 3 decides later.)
4. **Hindi copy** for the calm cues: now or later (text only, cheap).

## 9. Sources that could not be opened

- Balban et al. 2023 on cell.com: HTTP 403. Read on PMC instead.
- medito.org: DNS failure (twice). Used the App Store listing instead. The Medito Play page came back truncated.
- Flett et al. 2019 (Headspace vs Smiling Mind, Mindfulness): Springer login redirect, and the Otago news page
  returned 403. **Not quoted.**
- Huberty et al. 2019 on mhealth.jmir.org: empty page. Read on PMC instead.
- Goldberg et al. Clinical Psychological Science (sagepub, doi 10.1177/2167702621996340): HTTP 403. **Not quoted.**
  The 2021 Psychotherapy Research paper was read instead.
- Farias et al. 2020 on PubMed: cookie wall. Read on the Coventry portal instead.
- Deci, Koestner & Ryan 1999 on the ubalt.edu copy: HTTP 404. Read the Colorado PDF copy instead.
- The Scullin "more specific lists, faster sleep" detail came from search-result press coverage only. It is not
  quoted as a finding above.

## 10. Code notes (no fixes made)

- **No real bug found** in the code read for this job (`soft.ts`, `SoftDay.tsx`, `courtyard.ts`, `nightPause.ts`,
  `nightPlan.ts`, `winddown.ts`, `NightDeck.tsx`, `haptics.ts`, `sound.ts`, `awake.ts`).
- **Design traps for any calm build:** `src/platform/haptics.ts` `tapHaptic` drops all haptics under reduced motion,
  and `src/ui/cast/sound.ts` `playCastSound` is muted on `.deck-night` and under reduced motion (§4.6).
- **Tunables outside `rules.config.ts`** (CLAUDE.md: "Every tunable number lives in `src/core/rules.config.ts`"):
  `STAGE_DAYS = [3, 7, 14, 30, 60]` in `src/core/courtyard/courtyard.ts`; the 30-minute lead in
  `src/core/nightPlan.ts` `planLeadsNow` (`30 * 60_000`); `DAY_LIMIT_CHOICES` in `src/core/nightPause.ts`. These are
  minor rule deviations, not bugs.
