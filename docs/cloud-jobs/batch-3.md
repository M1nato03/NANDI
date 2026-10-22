# Cloud job batch 3 (idea engine, 23 Oct 2026)

How to run: one cloud session reads this file and runs EVERY job below as its own subagent, at least 3 at a time, until
all 8 are done. Each job starts from a fresh checkout of the branch it names (git fetch origin <branch>), writes ONE
report file, and pushes it on its OWN new branch named below. Never push main or any existing branch, never open a PR,
never change app code or content JSON on any shared branch. Scripts, test files and installs live in /tmp; paste the
key code into the report so it can be re-run. Network access is open: open real sources and quote them with URLs; if a
page cannot be opened, say so. Report numbers you MEASURED, and say which are estimates. Plain English, short lines,
tables where useful, no praise.

NANDI = offline learning + habits app for Indian adults 18+ (React 19 + Vite + TS + Dexie, Android via Capacitor 8).
Hard rules: no dark patterns, guilt, loss states, random rewards, endless feeds; no firearm content; offline-first;
nothing leaves the phone unless the user backs up or shares. The forward-only promise: past XP, level and Shards shown
for a finished day never drop. Newest build: origin/ship-32 (efdcb58 or later; ship-31 + economy fixes, the spec 16 §6 practice tail, a clock fix,
lesson UI fixes and perf fixes 1-5). Use origin/ship-32 wherever a job below says ship-31. Batch 2 reports are on ideas/cj2-* branches
(read the matching one before starting where a job says so). At the end, list each job's branch + commit + 3-line summary.

## Job 1 · Every lesson visual at phone width (branch ideas/cj3-visual-audit)
On origin/ship-31, build and serve (npm ci && npm run build && npx vite preview). With Playwright at 360x800 and
390x844, open EVERY step of all 6 topics (162 steps; use the owner/content review screen if one exists, or drive Learn
with page.clock as ideas/cj2-lesson-walk did) and for each teach card, example (Show me), guided try and feedback sheet:
measure document.scrollWidth vs innerWidth, text boxes that overlap (getBoundingClientRect pairs), text cut off
(scrollWidth > clientWidth on labels), tap targets < 44 px, and the y position of the first answer option. Screenshot
every flagged screen. Report docs/reviews/cj3-visual-audit.md: a table of every flagged step (topic, step id, visual
type, problem, screenshot), totals per problem, and commit the flagged screenshots under docs/reviews/cj3-visual-audit/.

## Job 2 · Guided tries that teach (branch ideas/cj3-guided-tries)
Read ideas/cj2-lesson-walk first (finding 8). On origin/ship-31, for every guided try in content/topics/*.json (one per
step, about 162): judge whether a typical 18-22 year old Indian student could answer it correctly WITHOUT the teach card
(yes / maybe / no, one-line reason). For each "yes", name the misconception the step fixes (from the step's teach card and
the concept's misconceptions field) and propose ONE replacement distractor that states that misconception plausibly, in
the same voice and length as the other options. Do not rewrite the stem unless it tests a detail instead of the idea;
then propose a new stem too. Mark everything as a PROPOSAL for the content editors. Report docs/reviews/cj3-guided-tries.md
with a summary table per topic and the full list.

## Job 3 · Fact check the rewritten Money, Health, Body and How things work (branch ideas/cj3-factcheck-four)
These four topics were rewritten after the earlier fact checks (ideas/factcheck-money-health, ideas/factcheck-body-how).
On origin/ship-31, for the four files content/topics/topic.money-markets.json, topic.health-nutrition.json,
topic.body-training.json, topic.how-things-work.json: open each cited source and check every claim, number, date and name
in hooks, teach cards, examples, guided tries, items, options, feedback and askLine (SUPPORTED / PARTLY / NOT SUPPORTED /
SOURCE DEAD, with the quoted sentence and URL). Focus on what changed since those earlier reports. Health and Body: flag
any medical or injury claim stronger than its source and anything that reads as a health promise. Money: India-specific
facts (RBI, SEBI, CPI base 2024=100 since the Jan 2026 index). Report docs/reviews/cj3-factcheck-four.md with a top table
(topic | claims | supported | problems | fix-before-release count).

## Job 4 · Real backups from older builds (branch ideas/cj3-old-backups)
Read ideas/cj2-test-gaps §3.2 first. Check out origin/ship-22, origin/ship-25 and origin/ship-27 one at a time, build
each, and with Playwright use the app for a simulated week (page.clock: tasks, a workout, Learn drops, puzzles, a shop
purchase, a soft day, settings changes), then export a backup through the real Backup screen. Then build origin/ship-31
and restore each backup into (a) a fresh install and (b) a ship-31 install that already has its own 5 days of data.
Compare before and after: XP, level, Shards, owned items, streak, tasks, Learn progress, settings, and that no shown
number dropped. Report docs/reviews/cj3-old-backups.md with a pass/fail table per pair and the exact diff for every fail.
Commit the backup files under docs/reviews/cj3-old-backups/ (synthetic data only).

## Job 5 · Clock and time-zone fuzz of the economy (branch ideas/cj3-clock-fuzz)
Read ideas/cj2-test-gaps §3.5 first (clock ahead then corrected dropped XP 25 -> 5 on ship-27). On origin/ship-31
(which has day-close), write a seeded fuzz in /tmp (vitest with fake-indexeddb, as the repo's tests do) that drives the
real repos and reconcileGamify through random sequences of: normal days, the clock jumping forward 1-30 days, jumping
back, a time-zone change (Asia/Kolkata <-> Asia/Dubai <-> America/New_York), crossing 04:00, a restore of a backup taken
earlier. After every step assert: total XP, level and Shards never drop; no owned item disappears; no finished day's
shown XP changes. Report every failing sequence minimised to the shortest repro, with the cause at file:line and a fix
sketch. Report docs/reviews/cj3-clock-fuzz.md with the fuzz code.

## Job 6 · Accessibility re-check after the fixes (branch ideas/cj3-a11y-recheck)
Read ideas/cj-a11y first (batch 1). On origin/ship-31 repeat that audit exactly (Playwright + @axe-core/playwright in
/tmp, 360x780 and 1280x800, light and dark, the same walk plus the new screens: first run with the 18+ tick, soft day,
shares, Ask someone, step lessons). For each of the 11 batch-1 problems say FIXED / PARTLY / NOT FIXED with evidence,
then list every new violation, worst first, with the fix. Report docs/reviews/cj3-a11y-recheck.md.

## Job 7 · Hinglish task-capture gold set kit (branch ideas/cj3-capture-gold)
Read spec 20 first (git fetch origin ideas/spec-20-capture; docs/specs/20-fast-capture.md, section "Accuracy").
Produce: (1) a labelling guide (what title/day/time/duration to expect for each kind of line, the planning day that
rolls at 04:00, what counts as "abstain"); (2) a one-page collection form text in English and Hinglish, the prompt
"Write 10 things you need to do this week, like you'd text a friend", with consent wording (data used only to test the
app, deleted after); (3) a SYNTHETIC hard-case list of at least 400 task lines that real Indian 18-25s might type
(English, Hinglish, typos, spelling variants like kal/kl/kall, subah/subha, shaam/sham, baje/bje, names like Shyam/Sham,
numbers that are not times, SAT/May/June, emoji, mixed scripts), each labelled with the expected output or ABSTAIN, as
CSV. Mark the list clearly as synthetic: it is for extra tests, never the release gate. Report
docs/reviews/cj3-capture-gold.md plus docs/reviews/cj3-capture-gold/synthetic-hard-cases.csv.

## Job 8 · Slow phone with a year of data, after day-close and perf fixes (branch ideas/cj3-heavy-data)
Repeat ideas/cj2-heavy-data exactly (same generator, sizes 30/180/365 days, 6x CPU, 360x780) on origin/ship-32, which
adds day-close (each close stores only its own day's purchases; reconcile is coalesced) and perf fixes 1-5 from the cj2
report (Set in chooseNowTask, board clock 1 s only during focus, EconomyFeedback early return, badge counts once, app
minutes written in fives). Say for each of cj2's causes 1-8 whether it is fixed and by how much. Report the same table side by
side with the cj2 numbers (ship-27), say what got better or worse, profile the 3 slowest steps at 365 days, and confirm
or update each of the cj2 causes with file:line on ship-31. Report docs/reviews/cj3-heavy-data.md.
