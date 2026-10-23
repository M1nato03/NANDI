# cj5 · Plan and focus: off-phone time as the game (batch 5, job 4)

Branch `ideas/cj5-focus`, based on origin/main `55fd409`. Research only: no app code or content changed.

Question: NANDI's mission is less scrolling. What signature mechanic makes time AWAY from the phone the thing
that grows, inside an offline Capacitor app's limits, without Accessibility?

## Short answer

- **Signature mechanic (original): "Phone ki chhutti" (a day off for the phone).** In the morning plan you
  pick one rough window ("after dinner, 21:00–22:00"). NANDI does not block anything and runs no timer.
  The next time you open NANDI, it reads Android's own usage events for that window and writes one fact:
  how many minutes went to your chosen scroll apps. If that stayed under a small grace, the phone got its
  chhutti: Mor's corner counts the day, and one marigold is added to a toran (garland) over the courtyard gate.
- It needs **no new foreground service and no new permission.** Usage Access is already granted for App pause.
  It reads events after the fact, so the hard Android limits on live background work do not apply.
- **#2** is a kind Forest: a "phone down" option on the existing focus timer. Picking the phone up pauses the
  bud. Nothing withers. **#3** is a morning mirror that turns yesterday's real scroll hour into tomorrow's
  if-then plan.

## 1. What NANDI already has (read on main)

| Piece | Where | What it does now | Numbers (rules.config.ts) |
|---|---|---|---|
| Focus timer | `src/core/tasks/focus.ts` `focusPhase`, `startFocus`, `pauseFocus`, `finishFocus`; UI `src/ui/screens/Today.tsx` at `plan/focus` | One live timer. A switch pauses the other one and counts `switches`. Absolute timestamps, recomputed on `visibilitychange`/`pageshow` (`useTaskBoard.ts:38-39`) | `tasks.focus`: workMin 25, breakMin 5, longBreakMin 15, longBreakEvery 4, extendMin 10, presetLong [50, 10]; `tasks.liveTimers` 1 |
| Focus in the economy | `deriveEconomy.ts` | Focus minutes earn **no XP** and are **not** a courtyard practice day. They only show in `steadyLine` ("N focus min this week") and in the recap | none |
| "Focus boost" | `src/core/economy/gamify.ts` `focusBoost`; `deriveEconomy.ts:388-401` | Not about the focus timer. After all 3 daily quests, the next 15 minutes earn 2× XP | `gamify.focusMinutes` 15, `gamify.focusMultiplier` 2 |
| Temptation bundle | `Today.tsx:48` | Names a reward after a finished block; `tasks.rewardBlockedWords` keeps Reels/Shorts out | list of 11 words |
| App pause, core | `src/core/nightPause.ts` `shouldShowNightPause`, `pauseWindowActive`, `pauseCardCopy`; `DAY_MODES` off / open / limit | Night window from bedtime − 30 min to 04:00; by day either every open or after a daily limit | `night.pauseLeadMin` 30, `pauseDayLimitMin` 30, `pauseSnoozeMin` 10, `pauseTestMin` 2 |
| App pause, Android | `android/.../NightPauseService.java`, `NightPausePlugin.java`, `NightPauseBootReceiver.java`; JS bridge `src/platform/nightPause.ts`, `nightPauseSync.ts` | Opt-in `specialUse` foreground service. Polls `UsageStatsManager.queryEvents` every 1.5 s while watching with the screen on, 30 s otherwise, 5 min with the screen off. Registers `ACTION_SCREEN_ON/OFF` at runtime. Brings NANDI to the front with "Display over other apps", otherwise a heads-up notice. Day-limit time is summed from `ACTIVITY_RESUMED`/`PAUSED` since 04:00 | target and compile SDK 36, minSdk 24 (`android/variables.gradle`) |
| Night self-report | `src/data/repos/economy.ts` `recordMorningBackfill` | Morning question: phone-down time and a Reels range (`none`, `under-15`, `15-60`, `over-60`) into `dailyLog` | `night.morningBackfill` true |
| Courtyard | `src/core/courtyard/courtyard.ts` `areaOf`, `deriveCourtyard`, `STAGE_DAYS` | Mor (Plan) grows on days with a `tasks done` fact. Stages at 3/7/14/30/60 days. Soft days add lanterns. Nothing shrinks | `STAGE_DAYS` [3, 7, 14, 30, 60] |

Gaps that matter for this job:
- Spec 02 §5.5 asks for "Optional keep-awake. Exact end alarm in the APK." The focus screen has neither.
  `keepScreenAwake` is used only in `src/ui/train/Workout.tsx:62`. No focus code schedules a notification.
  So a person who puts the phone down is not told that the block ended.
- Time off the phone earns nothing today. Only tasks done grow Mor.
- "Focus boost" works against the mission. It is a 15-minute countdown to do more in the app right after the
  quests are done. It also shares the word "focus" with the timer, which confuses the two. (Job 6 owns the
  verdict. A suggested fix is in §7.)

## 2. Evidence (opened and quoted)

### Implementation intentions (if-then plans)
- Sheeran, Listrom and Gollwitzer, "The when and how of planning: Meta-analysis … in 642 tests",
  *European Review of Social Psychology* 36(1), 2025, doi 10.1080/10463283.2024.2334563
  (https://kops.uni-konstanz.de/handle/123456789/69905): "forming implementation intentions proved effective
  for cognitive, affective, and behavioural outcomes (.27 ≤ d ≤ .66)." "Effect sizes were larger when plans had
  a contingent (if-then) format". Per the abstract, effects were also larger with rehearsal and high motivation.
- Wang, Wang and Gai 2021, *Frontiers in Psychology*, doi 10.3389/fpsyg.2021.565202 (MCII): "effective for goal
  attainment with a small to medium effect size (g = 0.336)" … "because of some publication bias, the actual
  effect sizes may be smaller."
- Caution for 18–25s on a phone: Cooke, McEwan and Norman 2023, *Drug and Alcohol Review*, doi 10.1111/dar.13553:
  stronger effects for "community (d+ = -0.38 …) versus university (d+ = -0.04 …) samples" and for "paper
  (d+ = -0.26 …) versus online (d+ = -0.04 …) mode of delivery". That is alcohol, not phones, but it is the
  same age group and the same delivery mode. So an if-then line typed into an app may be weak on its own.
  NANDI should tie it to a cue it can check, and get the person to say or rehearse it.

### Time-blocking
- No trial of time-blocking itself was found. The closest evidence is about time management in general.
- Claessens, van Eerde, Rutte and Roe 2007, *Personnel Review*, 32 studies
  (https://cris.maastrichtuniversity.nl/en/publications/a-review-of-the-time-management-literature/): "time
  management behaviours relate positively to perceived control of time, job satisfaction, and health, and
  negatively to stress. The relationship with work and academic performance is not clear."
- Aeon, Faber and Panaccio 2021, *PLOS ONE*, doi 10.1371/journal.pone.0245066: "time management is moderately
  related to job performance, academic achievement, and wellbeing." This is mostly correlational.
- Tonietto and Malkoc 2016, *Journal of Marketing Research* 53(6), doi 10.1509/jmr.14.0591
  (PDF: https://www.business.rutgers.edu/sites/default/files/documents/tonietto-the-calendar-mindset.pdf):
  "scheduling a leisure activity (vs. experiencing it impromptu) makes it feel less free-flowing and more
  work-like." "maintaining the free-flowing nature of the activity by 'roughly scheduling' (without prespecified
  times) eliminates this effect".
  **Design rule:** an off-phone window is leisure, so give it a rough label ("after dinner"), not a 21:00 alarm.
  NANDI still stores clock bounds so it can measure the window, but the person sees and chooses the label.

### Do commitment devices work?
- Bryan, Karlan and Nelson 2010, *Annual Review of Economics* 2:671-698
  (https://ideas.repec.org/a/anr/reveco/v2y2010p671-698.html): "we distinguish between what we call hard and soft
  commitments and identify how soft commitments, in particular, can help with various dilemmas".
- Hoong 2021, *European Economic Review* 140, doi 10.1016/j.euroecorev.2021.103924
  (https://ideas.repec.org/a/eee/eecrev/v140y2021ics0014292121002269.html), 629 people: individuals "spend more
  time on phones and Facebook than they predict and profess to desire" and "significantly reduce use after
  adopting these limits."
- Allcott, Gentzkow and Song 2022, *American Economic Review*, doi 10.1257/aer.20210867: "Temporary incentives to
  reduce social media use have persistent effects, suggesting social media are habit forming. Allowing people to
  set limits on their future screen time substantially reduces use".
- When they fail: John 2020, *Management Science* 66(2), doi 10.1287/mnsc.2018.3236
  (https://poverty-action.org/publication/when-commitment-fails-%E2%80%93-evidence-field-experiment): "55 percent of
  clients default, and incur monetary losses" … "partial sophisticates adopt weak commitments and then default".
  **Design rule:** no stakes, no loss on a miss, and start small, so a missed window costs nothing.
- Restriction vs flexibility: Kim, Jung, Ko and Lee 2019, "GoalKeeper", *Proc. ACM IMWUT* 3(1), doi 10.1145/3314403
  (abstract via https://api.crossref.org/works/10.1145/3314403): "restrictive mechanisms are more effective than
  non-restrictive mechanisms such as warning. However, we found that restrictive mechanisms caused more
  frustration and pressure to the users, mainly due to diversity of usage contexts and needs."
  **Design rule:** do not block. Count only the chosen scroll apps, so calls, maps and UPI payments never count.
- Friction, which App pause already uses: Grüning, Riedel and Lorenz-Spreen 2023, *PNAS*, doi 10.1073/pnas.2213114120,
  280 people over 6 weeks: "one sec decreased users' actual opening of target apps by 57% after six consecutive
  weeks." "providing the additional option to dismiss the consumption attempt had the strongest effect" … "the
  deliberation message was not effective." This is the best evidence NANDI has for App pause. It also suggests the
  "Back to my day" choice does more work than the lead text.

### Phone presence and attention ("brain drain")
- Ward et al. 2017, *J. Assoc. for Consumer Research*, doi 10.1086/691462. The publisher page returned 403, so it is
  described here only through the papers that test it.
- Failed direct replication: Ruiz Pardo and Minda 2022, *Acta Psychologica*, doi 10.1016/j.actpsy.2022.103717
  (pre-registered): "the 'brain drain' effect did not replicate: there was no difference between smartphone
  location conditions on performance on either the o-span task or the go/no-go task."
- Meta-analysis (preprint, not peer reviewed): Parry 2022, PsyArXiv, doi 10.31234/osf.io/tnyda, k = 56: "only a
  single statistically significant pooled effect was found. Working memory capacity was negatively impacted …
  while results for the remaining cognitive functions produced null summary effects" and there is "generally poor
  statistical power in the domain."
- Meta-analysis: Böttger, Poschik and Zierer 2023, *Behavioral Sciences*, doi 10.3390/bs13090751, 22 studies: "a
  significant overall negative effect of smartphone use and presence", with high heterogeneity. It pools use and
  presence together.
- **Copy rule:** never say "your phone in the room drains your brain" or "focus better". Behaviour claims are fine
  ("out of reach, it gets picked up less"). Cognitive claims are not.

### Pomodoro breaks
- Biwer, Wiradhany, Oude Egbrink and de Bruin 2023, *British Journal of Educational Psychology*, doi 10.1111/bjep.12593,
  87 students, 24/6 vs 12/3 vs self-paced breaks: self-paced breaks "associated with higher levels of fatigue and
  distractedness, and lower levels of concentration and motivation", "no difference … in invested mental effort or
  task completion."
- Smits, Wenzel and de Bruin 2025, *Behavioral Sciences*, doi 10.3390/bs15070861: "Pomodoro breaks led to a faster
  increase in fatigue" … "these differences did not result in overall differences in fatigue or motivation" …
  "no differences were found in productivity levels, task completion, and flow."
- Reading: fixed breaks are a fine default (NANDI's 25/5). They are not magic, so keep 50/10 and +10.

## 3. Mechanic table (every app studied)

App pages show WHAT a mechanic is. The evidence column only quotes papers from §2. Where nothing was opened, it says so.

| App | Mechanic | What the user does and sees | Why it works (evidence, quoted) | Dark-pattern risk | NANDI v1 (offline) | NANDI v2 (online) | Kill test |
|---|---|---|---|---|---|---|---|
| Forest (forestapp.cc) | Tree grows during a timer | "Your tree grows in real time as you focus." "Use other apps and your tree dies." | Commitment: limits "substantially reduce use" (Allcott 2022). Restriction works but brings "more frustration and pressure" (GoalKeeper 2019) | **Loss state** (a dead tree). Fails the hard rules as is | Rewritten as **#2**: the bud **pauses** when the phone is picked up and resumes after. No death and no wither art | Rooms (see the next row, rewritten) | Off-phone minutes per block do not beat timer-only blocks within 2 weeks |
| Forest | Plant Together | "everyone plants the same tree … If anyone gives up, the whole forest falls." | None opened for group loss | **Group loss and social pressure**. One person's slip punishes friends. Fails | Rejected for v1 | Rewritten: same start time, **separate buds**; the room shows only a rising total of phone-down minutes, never who stopped | Any tester feels blamed or blames a friend in the exit chat |
| Forest | Coins buy real trees (Pro/Plus) | "spend their earned coins to trigger a real tree being planted" | None opened | Paid tier and money link. NANDI rules: no money stakes | Rejected | Rejected (paid services need Jenil's call; out of scope) | n/a |
| Focus Friend (NBC News) | A character knits while you stay off | "If the user picks up their phone in the middle, the bean gets distracted and drops their knitting needles." "socks … can be exchanged for bean room decor." | Fixed exchange is predictable; no paper opened on characters | Mild loss (dropped work) and a pet the user may feel guilty about. Decor shop is fine (fixed prices) | Mor's marigold opens during #2; on pickup Mor **waits**, never drops anything. No new pet. Decor stays in the existing Shards shop | Friends see each other's corner (job 5 / courtyard visits) | Testers say Mor "looks sad" or they feel watched |
| Structured (structured.app) | Visual day timeline | "Structured combines all your tasks and to-dos into a single visual timeline." | Time management relates to "perceived control of time … and negatively to stress" (Claessens 2007) | Low. Risk of over-planning | Plan already has blocks and a Next strip. Add the chhutti window as a dark "rest" band on the day strip | Sync the plan across devices (Phase 4) | People skip the band, or add it and never keep it |
| Tiimo (tiimoapp.com) | Icons, colours, countdown | "a visual timeline you can actually follow"; "a countdown that keeps you anchored" | Fixed breaks gave "mood benefits" (Biwer 2023) | A countdown can feel like pressure. Fine if calm and no red | The focus ring already counts down; add an icon per window label (dinner, class, gym) | None needed | n/a (cosmetic) |
| Todoist Karma (help article) | Points, goals, streaks | "You lose Karma points when you have tasks that are five or more days overdue." Also "Vacation mode" and days off | None opened for Karma | **Points go down**. Fails "XP never goes down" | Reject the loss. NANDI already has the good parts: rest-day bank and days away (`streak.restBankMonthly` 4, `awayMaxDays` 14) | n/a | n/a |
| Habitica (wiki via API) | RPG health and party damage | Missed Dailies lose HP; at 0 HP you lose "one Level … all of your Gold … one piece of Equipment"; "Incomplete Dailies will cause damage to the player and their party" | None opened | **Loss, punishment and group blame**. Fails | Rejected | Rejected | n/a |
| Pomodoro apps (Cirillo's page did not open; Wikipedia used for WHAT) | 25/5 cycles, long break after 4 | "setting the timer (typically for 25 minutes), working on the task" … "until four pomodori are completed" | Biwer 2023 and Smits 2025 (above): fixed breaks are at least as good as self-paced; not magic | Low. A punishing "you broke your pomodoro" would fail | Already built (`RULES.tasks.focus`). Add the missing end notice and the optional keep-awake (spec 02 §5.5) | None needed | n/a |
| Lock&Stock (Wikipedia) | Keys per locked minute | "A student earns one key for every minute they are away from their phones." "only work on campuses." | Incentives "have persistent effects" (Allcott 2022) | Minutes as currency invite farming (lock the phone while asleep). Brand-discount rewards are money-like | Use **days, not minutes**: one chhutti counts once per day (like spec 12 growth). No discounts | n/a | Testers plan chhuttis only in hours they never use the phone (check the mirror data) |
| one sec (PNAS) and NANDI App pause | Friction before a chosen app | Pop-up, short wait, option to dismiss | "decreased users' actual opening of target apps by 57%" (Grüning 2023) | Low when the bypass is always there (NANDI: "Go anyway", 10-min snooze) | Already built. During a chhutti window, App pause can use the window as a reason (see #1) | none | n/a |
| OffScreen (App Store via search; the listing itself was not opened) | Passive stats incl. "Best Break" | Pickups, first/last pickup, best break | People "spend more time on phones … than they predict" (Hoong 2021) | Stats can shame. A falling chart reads as failure | **#3** morning mirror: one line, no chart, no score | none (stays on the phone) | Testers find it judgy, or skip it 5 days in a row |
| Opal / Digital Wellbeing / AppBlock (search summary) | Scheduled blocking | Apps blocked on a schedule | Restriction works, but "more frustration and pressure" (GoalKeeper 2019) | Coercive and easy to resent | Rejected as a NANDI feature (people can still use the system Focus mode) | n/a | n/a |
| Mohityanchi Vadgaon village (xatakaon.com; not an app) | Shared daily off hour | Siren "every evening at 7 p.m.", devices off "for an hour and a half every night" | Real-world precedent only, no study | A group norm can turn into pressure | Inspiration for the chhutti name and the shared hour | **#1 v2**: an opt-in shared chhutti hour for a friend circle | Friends feel obliged and stop opening the app that evening |

## 4. Android: what is allowed, what NANDI does, what the mechanics need

Never Accessibility. Nothing below uses it.

| Capability | Android says (developer.android.com, quoted) | NANDI today | Needed here |
|---|---|---|---|
| Usage Access | "declaring the permission implies intention to use the API and the user of the device still needs to grant permission through the Settings application" (UsageStatsManager) | Granted through `openUsageSettings`; checked with `usageAllowed` (AppOps) | Same grant. No new permission |
| Event history | `queryEvents`: "Events are only kept by the system for a few days." "if the user's device is not in an unlocked state … then null will be returned." | Reads 10-minute lookbacks and since-04:00 totals | Read each window at the next open. If NANDI was not opened for a few days, fall back to self-report. Handle `null` |
| Screen on/off in the event log | `SCREEN_INTERACTIVE`: "turned on for full user interaction, not ambient display"; `SCREEN_NON_INTERACTIVE`: "completely turned off or turned on only in a non-interactive state like ambient display"; `KEYGUARD_HIDDEN`: "typically happens when the user unlocks". Added in API 28 | Not used | Count "screen dark" minutes after the fact on API 28+. On API 24–27 show only chosen-app minutes |
| Screen-off broadcast | `ACTION_SCREEN_OFF`: "You cannot receive this through components declared in manifests, only by explicitly registering for it with Context.registerReceiver()." | Registered inside `NightPauseService.onCreate` | Live screen-off needs a running process. The proposals avoid that by reading the event log afterwards |
| Foreground service type | `specialUse`: "These values and corresponding use cases are reviewed when you submit your app in the Google Play Console." | `specialUse` with subtype "Optional local bedtime app pause" | Nothing new for #1 and #3. For #2 live nudges, reuse the App pause service and widen its subtype text (see cj2-play-store B6) |
| Short service | "Can only run for a short period of time (about 3 minutes)." | not used | Not suitable for 25-minute blocks |
| Starting a service from the background | "Apps that target Android 12 (API level 31) or higher can't start foreground services while the app is running in the background, except for a few special cases" | Started from `configure`/`test` while NANDI is open, and from boot | Start any focus-bound watching from the focus screen while NANDI is visible |
| Boot start (Android 15) | BOOT_COMPLETED receivers "are not allowed to launch" dataSync, camera, mediaPlayback, phoneCall, mediaProjection, microphone | `specialUse` from `NightPauseBootReceiver` is not on that list | No change |
| Overlay exemption (Android 15) | "The app now needs to have the SYSTEM_ALERT_WINDOW permission and also have a visible overlay window." | The overlay permission is used to bring NANDI to the front (`showPause`) | Do not rely on the overlay to start services in the background |
| Activity from the background | Allowed when "The app has the SYSTEM_ALERT_WINDOW permission granted by the user." (background-starts page) | Same | Same; the existing pause card path |
| End-of-block signal | Exact alarms only "if a user-facing function in your app requires precisely-timed actions" (alarms page). cj2-play-store B2: remove `USE_EXACT_ALARM` | Focus has no end notice | Use a normal local notification at the block end. A few seconds late is fine, or use `SCHEDULE_EXACT_ALARM` if granted |
| Do Not Disturb | `setInterruptionFilter`: "Only available if policy access is granted"; on Android 15+ it "will instead activate or deactivate an AutomaticZenRule associated to the app" | not used | Optional, later: "Silence notifications during this block" behind a separate grant. Not needed for v1 |
| Web / PWA build | No access to other apps | `nightPauseAvailable()` is false on web | Self-report only ("Did the phone get its chhutti? Yes / Partly / Not today") |

Main point: **every v1 proposal works by reading events after the fact.** Android keeps "a few days" of events, and
NANDI is opened most days. So the new mechanics add no service runtime, no battery cost and no new Play declaration.

## 5. Three ranked proposals

### #1 (ORIGINAL) · Phone ki chhutti: a planned day off for the phone, checked afterwards, never blocked

**What the user does.**
1. In the morning plan or at shutdown, NANDI asks one optional question: "When does your phone get a chhutti
   tomorrow?" It offers 3 rough labels from the person's own day ("after class", "after dinner", "Sunday morning").
   The person can set the clock bounds once per label. The first window is 30 minutes.
2. The if-then line is built for them: "After dinner, the phone goes on the shelf until 22:00." There is one tap
   to say it out loud or read it back (rehearsal, Sheeran 2025).
3. During the window nothing happens. No timer, no block, no notification. If App pause is on, a chosen app opened
   in the window shows the existing pause card with a new lead line: "This is your phone's chhutti (after dinner).
   Back to it, or go anyway?"
4. At the next open, one calm line: "After dinner: 4 min in Instagram, phone dark 41 min. The phone got its chhutti."
   Or: "After dinner: 22 min in Instagram. Same window tomorrow, or a shorter one?" Never red, never "missed".

**What grows.** A kept chhutti (chosen-app minutes ≤ grace):
- counts as a **Mor practice day** (Plan corner, `STAGE_DAYS`);
- adds **one marigold to the toran** over the courtyard gate, one per kept day, never removed (like `lanterns`);
- pays a fixed `RULES.plan.chhutti.xp` once per day (proposed 10, same size as `soft.dayXp`). It is not a Hat-trick slot.
A window that was not kept writes the same fact with `kept: false`. Nothing is lost.

**Ramp, not stakes** (John 2020: weak commitments then default). The window grows by `rampStepMin` 15 after 2 kept of
the last 3, up to `maxMin` 180. The same shape is already used for bedtime (`night.bedtimeRampEveryDays` 3,
`bedtimeRampNeedsMetOfLast3` 2). "Not today" just moves the window, with no postpone budget and no copy about it.

**Why it should work.** It plans a cue the app can check (implementation intention). It uses rough timing (Tonietto
2016). It is a soft commitment (Bryan 2010; Hoong 2021: limits "significantly reduce use"). It does not block
(GoalKeeper: blocking brings "frustration and pressure"). It reuses App pause friction (Grüning 2023: 57% fewer opens).

**Hard-rule test.**

| Rule | Pass? | How |
|---|---|---|
| No loss state | yes | A missed window writes `kept: false` and changes nothing else |
| No guilt | yes | Neutral copy, a choice for tomorrow; no "you should" (CLAUDE.md copy rule) |
| No random rewards | yes | Fixed XP, one flower, one practice day |
| No endless feed / no punishing timer | yes | No timer at all; one line at the next open |
| XP/level/Shards never go down | yes | Facts only, forward rules |
| No health promise | yes | No sleep or brain claims; behaviour words only |
| Personal data offline | yes | Usage events are read on the phone; only minutes per window are stored |

**v1 data (no migration later).**
- Settings row `plan.chhutti`: `{ windows: [{ id: ULID, label, from: '21:00', to: '22:00', weekdays?: number[] }] }`.
  A settings row restores everywhere (DECISIONS 2026-10-19, Reminders).
- Ledger fact, idempotent id `chhutti:<dayKey>:<windowId>`, `mode: 'tasks'`, `kind: 'chhutti'`, `inputs:
  { from, to, plannedMin, chosenAppMin, darkMin | null, source: 'usage' | 'self', kept, visibility: 'local' }`.
  `visibility` is online-ready step 4 (a `source` on facts other people may see).
- Rules: `plan.chhutti: { xp: 10, paidPerDay: 1, startMin: 30, rampStepMin: 15, maxMin: 180, graceMin: 5,
  rampNeedsKeptOfLast3: 2 }` with bounds in the bounds table. Windows must sit between 04:00 and shutdown
  (`night.defaultShutdown` 23:15), so they never overlap the night routine.
- Native: one new plugin method, `windowUsage({ from, to, packages })` → `{ chosenAppMs, darkMs | null }`, built from
  the same loop as `readUsedToday` plus `SCREEN_INTERACTIVE`/`NON_INTERACTIVE`. It handles a `null` result.
- Courtyard: `areaOf` returns `'plan'` for `kind === 'chhutti' && inputs.kept === true`; `deriveCourtyard` adds a
  `toran` count. This extends spec 12 §1 (Plan practice), so spec 12 needs a line.

**v2 online.** An opt-in **shared chhutti hour** for a friend circle, like the village siren. Everyone picks the
same window. Each person's growth is still their own. The circle sees one rising number ("4 phones had a chhutti
tonight"), never a list of who did not. It needs an account, consent and a privacy notice (DPDP). It sends
`{ circleId, dayKey, windowId, kept }` and never minutes or app names. The v1 fact already has these fields.

**Originality check.** Searched the web and app stores (web search; no direct store crawl). Closest:
- OffScreen ("Best Break", a passive stat, no plan, no reward);
- Lock&Stock (keys per locked minute, campus only, discounts);
- Opal, AppBlock, Digital Wellbeing (scheduled windows that block);
- Forest (a timer you must start, and the tree dies).
No app was found that plans a rough off-phone window, never blocks, and checks the window afterwards from on-device
usage events. The search was limited to web results, so this is "not found", not "proven new".

**Kill test (Jenil + 5 Android friends, 2 weeks: week 1 baseline with the mirror only, week 2 with chhutti).**
Kill or rework if any of these happens:
- chosen-app minutes inside the planned windows are not at least 20% lower than in the same clock windows in week 1;
- total chosen-app minutes per day do not fall, so scrolling just moved to another hour;
- 2 of the 6 people say it feels like being watched or judged (one exit question);
- daily time inside NANDI rises by more than 5 minutes.

### #2 · Phone-down focus block (a kind Forest on the existing timer)

**What the user does.** On `plan/focus`, a "Phone down" switch next to the 25/5 / 50/10 picker. The ring becomes a
marigold bud in Mor's corner that opens as the block runs. When the block ends, a local notification and a haptic
say "Block done." Coming back to NANDI shows "Phone dark 23 of 25 min." If the phone was picked up for another app,
the bud stopped opening and resumed when the screen went dark again. It never closes or wilts.

**What grows.** A block with ≥ `tasks.focus.downCountsAtMin` (proposed 20) dark minutes counts as a Mor practice
day. That is the same day #1 counts, so there is no double reward. It pays **no extra XP**: the task already pays
`tasks.xpBySize` and the focus minutes already show in `steadyLine`.

**Hard-rule test.** No death (the Forest and Focus Friend loss is removed). No penalty for a pickup. The timer
stays the user's (Pause, +10, Finish). "Kept" uses screen-dark time, so the bud only measures and never nags.
Pass.

**v1 data.** `FocusRow` gains optional `phoneDown?: boolean` (a non-indexed field, no Dexie version bump). The fact
`focus-down:<focusId>` stores `{ plannedMs, darkMs | null, nandiMs, chosenAppMs, source }`. The native read is the
same `windowUsage` from #1. On the web, `darkMs` is null and only "away from NANDI" time (Page Visibility) is shown.
Also add the missing spec 02 §5.5 end notice. Keep-awake stays off when "Phone down" is on, since the screen should go dark.

**Android.** No live service is needed. Optional live nudge: if App pause is on, the service could take the block
as a window reason, the way #1 does. That widens its runtime only for the block. Write that into the `specialUse`
subtype text before Play (cj2-play-store B6).

**v2 online.** "Focus rooms": friends start at the same minute (a Durable Object room, presence pings only). Each
bud is separate. At the end the room shows the summed dark minutes, a number that only rises. Forest's "the whole
forest falls" is rejected.

**Kill test.** Over 2 weeks, if dark minutes per phone-down block are not higher than in plain blocks from the same
people, or switches per block (`FocusRow.switches`, spec 02 §7) do not fall, drop the switch and keep the end notice.

### #3 · Morning mirror: yesterday's scroll hour becomes today's if-then

**What the user does.** Once each morning, inside the existing morning plan (not a new screen):
"Yesterday the longest phone-down stretch was 2 h 10 m (13:00–15:10). Most Reels time was around 21:00." One tap:
"Make 21:00 my chhutti" creates a #1 window there. The morning night question (`recordMorningBackfill`) gets its
Reels range **prefilled** from real minutes after bedtime, and the person confirms or changes it.

**Why.** People under-estimate their use (Hoong 2021: more time "than they predict and profess to desire"). A plan
tied to a real cue beats a generic one (Sheeran 2025: if-then format). It gives #1 its windows, so people do not
plan chhuttis in hours they never scroll anyway (the Lock&Stock farming risk).

**Hard-rule test.** No score, no chart, no trend arrow, no colour for "bad". Shown only with Usage Access on and a
one-time opt-in that names exactly what is read. Skippable. Pass. Risk: it can feel like surveillance. That is the kill test.

**v1 data.** Nothing new is stored except what the person confirms: the `dailyLog.reelsBucket` they already answer
(source noted as `usage-prefill`) and a #1 window if they make one. The read itself is temporary.

**v2 online.** Deliberately none. Usage data stays on the phone. With an account, sync carries only the facts the
person confirmed.

**Kill test.** If 3 of 6 testers turn it off, or the prefilled Reels range is edited on more than half the mornings
(the data does not match what people saw), drop the prefill and keep only the "make this my chhutti" line.

### Ranking

| Rank | Proposal | Mission fit | Build size | Risk | Why this rank |
|---|---|---|---|---|---|
| 1 | Phone ki chhutti | Highest: grows real time away from the scroll apps, outside NANDI too | M (plugin method, fact, courtyard toran, plan question) | Feeling watched | The only one that rewards time when NANDI is closed, and it reuses App pause |
| 2 | Phone-down focus block | Good for study hours; less for evening scrolling | S–M | Low | Adds the missing end notice and turns focus into a courtyard day |
| 3 | Morning mirror | Supports #1 | S | Surveillance feel | Strong helper, weak alone |

## 6. How it shows in the courtyard

- Mor's corner (Plan) grows on days with a task done, **or** a kept chhutti, **or** a phone-down block ≥ 20 min.
  It is still one practice day per day.
- A marigold **toran** over the gate gains one flower per kept chhutti day. Flowers are never removed, so after a
  month it is a visible record of evenings given back.
- During a chhutti window the courtyard scene is unchanged. There is nothing to check, which is the point.
- Line copy (proposal): "Mor hung a marigold. The phone had its chhutti after dinner." Never "Mor waited for you".

## 7. Bugs and gaps found (not fixed)

| # | Where | What |
|---|---|---|
| 1 | `src/ui/night/NightDeck.tsx:78` (focus summary in the night deck) | "Focused for N minutes" sums `endedAt - startedAt`, so paused time counts as focus. `steadyLine` (`src/core/tasks/complete.ts:48`) and `recap.ts:26-30` use `focusElapsedMs`. The night deck can overstate focus |
| 2 | spec 02 §5.5 vs `src/ui/screens/Today.tsx` | No end notice for a focus block, and no optional keep-awake (`keepScreenAwake` is only in `Workout.tsx:62`) |
| 3 | `android/.../NightPauseService.java` `currentForeground`, `readUsedToday` | `queryEvents` can return `null` when the user is not unlocked (docs, Android R+). Neither method checks for it. Low risk because the service starts after unlock, but an NPE would stop the watcher |
| 4 | `src/core/economy/deriveEconomy.ts:387` | Comment says "the boosted half hour"; `RULES.gamify.focusMinutes` is 15. Comment only |
| 5 | Design conflict: `gamify.ts` `focusBoost` | A 15-minute 2× XP countdown after the quests pulls the person back into the app. Suggestion for job 6: rename it ("Quest bonus") and make it a fixed bonus, or apply it to the next chhutti or phone-down block, so the reward points away from the screen |

## 8. Sources that could not be opened

- Ward et al. 2017, journals.uchicago.edu (HTTP 403). Cited only through replications and meta-analyses.
- Forest Play Store page (content truncated). forestapp.cc used instead.
- Todoist help index (the first URL had no content). The article at todoist.com/help/articles/OgWkWy was used.
- Habitica wiki pages (HTTP 402) and habitica.com FAQ (empty). The fandom wiki API was used for the text.
- francescocirillo.com (bot check). Wikipedia used for the Pomodoro steps.
- PubMed 36859717 (cookie wall). The Europe PMC API was used for the Biwer abstract.
- KAIST repository for GoalKeeper (connection reset, 503). The abstract came from Crossref.
- OffScreen App Store listing: seen only through search snippets, not opened directly.
- Opal, AppBlock, ScreenZen, StayFree: seen only in search summaries. Used only to say what came closest.
