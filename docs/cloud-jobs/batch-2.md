# Cloud job batch 2 (idea engine, 22 Oct 2026)

How to run: one cloud session reads this file and runs EVERY job below as its own subagent, at least 3 at a time, until
all 11 are done. Each job starts from a fresh checkout of the branch it names (git fetch origin <branch>), writes ONE
report file, and pushes it on its OWN new branch named below. Never push main or any existing branch, never open a PR,
never change app code or content JSON on any shared branch. Scripts, test files and installs live in /tmp; paste the
key code into the report so it can be re-run. Network access is open: open real sources and quote them with URLs; if a
page cannot be opened, say so instead of guessing. Report numbers you MEASURED, and say which are estimates. Plain
English, short lines, tables where useful, no praise.

NANDI = offline learning + habits app for Indian adults 18+ (React 19 + Vite + TS + Dexie, Android via Capacitor 8);
live web build https://nandi.nandi11.workers.dev . Hard rules: no dark patterns, guilt, loss states, random rewards,
endless feeds; no firearm content; offline-first; nothing leaves the phone unless the user backs up or shares; DPDP
compliance before 13 May 2027. The economy is an append-only ledger of facts; src/core/economy/deriveEconomy.ts derives
XP, level, streak, rest days, Shards and Season SP from it; rules live in src/core/rules.config.ts.
Release candidate branch: origin/ship-27. At the end, the main session lists each job's branch + commit + 3-line summary.

## Job 1 · 365-day economy simulation (branch ideas/cj2-economy-sim)
On origin/ship-27 (npm ci). Write a /tmp script (tsx or vitest) that builds synthetic ledgers for 6 personas over 365
days starting 2026-11-05 and runs deriveEconomy on each prefix day: (a) keen daily user, (b) weekdays only, (c) tired
often: soft days 2-3x a week, (d) 3-week lapse in month 2 then returns, (e) night owl: most activity after bedtime,
(f) buys every shop item as soon as affordable. Use the real fact kinds the app writes (read src/data/repos/* to copy
them exactly). Report per persona: XP and level at day 7/30/90/180/365, days to each level, streak and rest-bank
behaviour, Shards balance curve, Season SP and rank, and every ANOMALY: a number that drops (the forward-only promise
says past XP, level and Shards never drop), a reward that is unreachable, pace that stalls or explodes, a persona that
gains more by gaming a rule. Report docs/reviews/cj2-economy-sim.md.

## Job 2 · Day-close: reproduce the Shard bug and measure cost (branch ideas/cj2-dayclose)
On origin/day-close (npm ci; tests run with fake-indexeddb as the repo's vitest setup does). (1) Write a vitest test
in /tmp (copy the repo to /tmp/dc) for this suspected bug: a day closes with 100 Shards and no purchase; a 100-Shard
purchase dated that day arrives later; reconcileGamify runs; is the item owned AND the 100 Shards back? (mergeClose in
src/core/economy/deriveEconomy.ts takes max(shards) while it unions purchase ids, and shardFloor then skips "known"
purchases.) Report PASS/FAIL with output, and test the fix shards = max(x.shards - price(y-only purchases),
y.shards - price(x-only purchases)). (2) Restore/reconcile race: try to make a running reconcile write closes from the
old ledger during an import (src/data/backup/index.ts). (3) Cost: build a 365-day ledger (about 15 facts a day, 40
purchases spread over the year), then time deriveEconomy and reconcileGamify (median of 20 runs) on day-close vs
origin/ship-27. Run Node with 4x slowdown-equivalent noted. Report docs/reviews/cj2-dayclose.md with the test code.

## Job 3 · Season 1 late entry (branch ideas/cj2-season-late-entry)
On origin/ship-27. Read the season rules (rules.config.ts season block, deriveEconomy season view, any Season screen).
Answer with numbers: someone who installs on 5 Nov, 20 Nov, 15 Dec or 1 Feb: what rank and tier do they start at, how
many weeks to reach each tier at a normal and a keen pace, and can they reach the top before the season ends? Is
there any message that would read as "you are behind" (a loss state)? Compare with how Duolingo leagues, Clash Royale
seasons and Fortnite battle passes treat late joiners (official pages). Recommend the smallest rule that is fair to a
late joiner without punishing early ones. Report docs/reviews/cj2-season-late-entry.md.

## Job 4 · Google Play readiness (branch ideas/cj2-play-store)
On origin/ship-27 read android/ (AndroidManifest.xml, build.gradle, variables.gradle, capacitor.config.*) and every
network call in src (grep fetch, XMLHttpRequest, navigator.sendBeacon, WebSocket). From Google's own pages (Play Console
Help, Developer Policy Center, 2026 target API requirement), write the exact answers NANDI should give for: Data safety
form (each data type: collected? shared? why?), content rating questionnaire (IARC), target audience (18+ only, not
Families), app access, ads declaration, permissions declarations (POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM /
USE_EXACT_ALARM, any others found), and the target SDK level needed. List every blocker that would get the app
rejected, with the file:line to change. Report docs/reviews/cj2-play-store.md.

## Job 5 · DPDP privacy notice draft (branch ideas/cj2-privacy-notice)
Read the Digital Personal Data Protection Act 2023 and the DPDP Rules 2025 (official text on meity.gov.in /
egazette.gov.in; quote section and rule numbers). On origin/ship-27 list what personal data NANDI actually processes:
what is stored on the device (Dexie tables in src/data/db.ts), what can leave (backup export, share sheet, any network
call), the 18+ confirmation (profile.adultConfirmedAt). Then (1) list every notice requirement and whether NANDI meets
it, (2) draft a plain-English notice for public/privacy.html (short lines, Indian English, no legalese where avoidable),
(3) list the questions a lawyer must answer (is NANDI a Data Fiduciary when data never leaves the phone? consent
manager? grievance officer? children?). Mark the draft "for lawyer review, not final". Report
docs/reviews/cj2-privacy-notice.md.

## Job 6 · Android notifications that actually arrive in India (branch ideas/cj2-android-notifications)
Research how Xiaomi/Redmi/POCO (HyperOS), Realme/Oppo (ColorOS), Vivo (Funtouch/OriginOS), Samsung (One UI) and
OnePlus kill background work and delay scheduled notifications in 2025-2026 (dontkillmyapp.com, OEM docs, Android
developer docs on Doze, exact alarms, POST_NOTIFICATIONS, Android 14-16 changes). Read NANDI's notification code on
origin/ship-27 (grep LocalNotifications, schedule, notification) and the Capacitor local-notifications docs. Report:
what will fail on each OEM, what NANDI can do without new permissions (inexact windows, rescheduling on app open, a
one-time "keep reminders working" help card), a 10-phone manual test matrix Jenil can run with friends, and file:line
fixes. Remember the night rule: nothing buzzes in lights-out. Report docs/reviews/cj2-android-notifications.md.

## Job 7 · Quiet mode inventory (branch ideas/cj2-quiet-mode)
Users of Imprint, NYT Games, Headway and Brilliant ask to switch game layers off. On origin/ship-27 list EVERY surface
that shows a game layer: XP toasts, combo/Hat-trick pop-ups, level-up, badges, season rank/ladder, Shards, shop, finish
animations, sounds, haptics, storybook rewards. For each: file:line, when it shows, and whether an existing setting
(motion, sound, etc.) already hides it. Then outline a "Quiet mode" switch: what it hides, what stays (learning, plan,
progress the user asked for), where the switch lives, and what must not break (the ledger keeps recording; turning it
off shows everything earned). Report docs/reviews/cj2-quiet-mode.md.

## Job 8 · Test gaps (branch ideas/cj2-test-gaps)
On origin/ship-27 run npm ci, the unit tests with coverage (vitest --coverage, install the coverage package in /tmp
if needed) and list the 20 least-covered files under src/core and src/data. Then audit the e2e suite (tests/e2e) for
user paths with NO test: keyboard-only use, restoring a backup made by an older build, after-bedtime screens, the 4 am
day boundary, a phone clock moved back or forward, first load offline, two tabs open at once, very long titles,
low-storage / quota errors. For each gap give the risk and a test sketch. Do not push test code to the repo; put the
sketches in the report. Report docs/reviews/cj2-test-gaps.md.

## Job 9 · A year of data on a slow phone (branch ideas/cj2-heavy-data)
On origin/ship-27 build and serve dist (npm ci && npm run build && npx vite preview). With Playwright at 360x780 and
6x CPU throttle, seed IndexedDB through the app's own repos (page.evaluate calling the same writes the app uses, or a
restore of a generated backup file) with 30, 180 and 365 days of realistic use (tasks, focus sessions, learn answers,
puzzle runs, ledger facts). Measure: cold open to Today interactive, tap latency for completing a task, finishing a
learn answer, opening You/progress, and the size of the DB. Find which screens get slower with data and why (profile;
src/ui/shell/EconomyFeedback.tsx reads whole tables on every write). Report docs/reviews/cj2-heavy-data.md with the
numbers per data size and file:line causes.

## Job 10 · Hindi and Hinglish (branch ideas/cj2-hinglish)
Research which language Indian 18-25s want in apps (KPMG/Google Indian languages reports, Duolingo India, ShareChat,
Seekho, any 2024-2026 survey; quote them). On origin/ship-27 count user-facing strings in src/ui and content/ (are they
hard-coded? is there any i18n layer?). Estimate the cost of (a) Hinglish only for short UI copy, (b) full Hindi UI,
(c) Hindi Learn content. Recommend one, with a kill test. Also write 10 candidate Hinglish lines for the low-day kind-word
card (warm, short, no guilt, no religious or gendered assumptions) next to the existing English ones: "Thinking of you
today." / "Hope today is gentle with you." / "No reply needed. Just sending a little warmth." / "You make things better.
Just saying." / "Drink some water and take a breath. You've got this." Report docs/reviews/cj2-hinglish.md.

## Job 11 · Walk the new lessons as a learner (branch ideas/cj2-lesson-walk)
On origin/ship-27 (if it lacks the step-lesson engine, use origin/learn-steps and say so) run the app locally and use
Playwright with the clock mocked (page.clock) to play days 1, 2, 3 and 8 of Learn for each of the 6 topics as a brand-new
learner, answering some items right and some wrong. Screenshot every screen. Judge each lesson as an 18-22 year old
Indian student would: is the hook clear, is the teach card short enough for a phone, does the guided try teach, do the
items test what was taught, is anything confusing, too easy, too long, repeated, or culturally off? Count taps and time
per lesson. Report docs/reviews/cj2-lesson-walk.md with the worst 15 moments first (topic, day, screen, screenshot name,
fix) and commit the screenshots under docs/reviews/cj2-lesson-walk/ on the same branch.
