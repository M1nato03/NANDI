# Prime Pocket: handover to Claude Code

**Owner:** Jenil Shah · **Written:** 3 October 2026 · **From:** Claude (claude.ai), after two research rounds and a working prototype

This pack hands the build of **Prime Pocket**, a standalone offline Android app, to Claude Code. It contains everything needed to start without asking Jenil to repeat himself: who he is, what to build, the decisions already made and why, the build order with exit checks, detailed specs, the evidence behind them, and the working prototype code to port.

---

## 0. For Claude Code: read this first

1. Read this file end to end.
2. Read `CLAUDE.md` (it becomes the repo's root `CLAUDE.md`).
3. Skim `docs/research-brief.md`, the evidence behind every decision. You don't need to re-research anything in it. Cite it when you change a decision.
4. Read the spec for whatever phase you're starting, in `docs/specs/`.
5. Look at `legacy/` before writing any puzzle, mystery, lesson or deck code. Most of it already exists, works and is tested.
6. Ask Jenil the **kickoff questions in section 6** in one message, then start Phase 0.

**Decisions vs judgement:** everything in this pack marked as a decision is settled. **Where a spec differs from the research brief, the spec wins** (for example: 500 ladder seats instead of 300, 8 lesson screens instead of 12, Train XP for the finished plan instead of per minute). Every number marked "starting value" is a hypothesis to tune from his data. All tunable numbers live in one file, `src/core/rules.config.ts`. If reality contradicts a spec (an API doesn't exist, a permission behaves differently), write it in `DECISIONS.md`, pick the simplest option that keeps the non-negotiables, and tell Jenil in your phase summary.

---

## 1. The person and the problem

- **Who:** Jenil, 20, second-year mechanical engineering student at IITRAM, Ahmedabad. Lives in a hostel; family in Rajkot. Does hackathons (backend and integration), algorithmic trading, a trading club. Comfortable with GitHub and code.
- **Phone:** Nothing Phone 3a Pro (Android 16, Nothing OS 4, Chrome). Android-first; there's no iPhone in scope.
- **The problem he's solving:** about 6 hours a day on Instagram, mostly at night. Usually asleep at 1–2 am. He multitasks and postpones tasks. He's a visual learner: picture first, then the full explanation alongside it.
- **What he's used so far:** a claude.ai artifact version of Prime Pocket with:
  - Greene "read people" decks;
  - daily logic-grid mysteries;
  - five puzzle types;
  - Gita and Charaka micro-lessons;
  - flashcards.
  He likes it. It depends on a Claude plan for saving, and he won't always have one.
- **What he asked for (his words, paraphrased):**
  - a task and schedule app that allots time, maintains schedules, and handles adding and postponing tasks, strict enough to stop him just postponing, with rewards, but **"not too strict"**;
  - a workout app that gives exercises and tracks progress, game-like and UI-heavy, like a friend's Blue Lock-themed app he loved (ours must be **original**);
  - the puzzles app made "way more interesting", with a theme, fun to use;
  - **independent of Claude**, though Claude can sync with it.
- **What success means:** fewer night-time Reels minutes, earlier lights-out, and more tasks started on time. Time spent inside Prime Pocket is a **guard metric that must not rise**. The app replaces a feed, so it must never become one.

---

## 2. Non-negotiables

1. **Runs fully offline with no AI and no subscription.** Claude is only an *author* of content packs (JSON in the repo) and a *reader* of exported summaries. The app never calls an AI API.
2. **His data lives on his phone and is never lost.** Backup export and restore ship in Phase 0, before any feature.
3. **One app, three modes, one reward economy.** Tasks, Train and Mind all pay into one append-only XP ledger.
4. **Postponing costs a decision, never points.** No punishment mechanics, no money stakes, no shame copy. **XP is never removed, and level and Shards never go down** (rule changes apply forward only). Streaks bend instead of snapping.
5. **Humane by design.** No variable-ratio rewards (no loot boxes, spins or random chests). No infinite feed, no autoplay. Daily content ends on a stopping screen, and night mode turns the app down on purpose.
6. **Every tunable number lives in `src/core/rules.config.ts`.** No magic numbers in UI or logic.
7. **Original theme only.** Never use:
   - the words "Blue Lock", "Ego" or "Egoist";
   - franchise characters, names, logos, screenshots or look-alike silhouettes;
   - trademarked puzzle names. Use Crowns, Sun & Moon, Number Path, Calcudoku, never Queens, Tango, Zip or KenKen.
8. **No medical claims.** Charaka lessons keep their evidence grades and an "educational, not medical advice" footer. Train shows safety guardrails and says "general fitness information, not medical advice".
9. **Puzzles are fair.** Every generated board has exactly one solution reachable by logic without guessing. Number Path has its logic solver (`pathLogic` in `core/puzzles/puzzles.js`, 21 Oct): every generated board is finished by logic, and that also proves it has one answer. The player's grid is checked against the **rules**, never against the stored solution.
10. **Measure before rewarding.** A one-week baseline logs behaviour with XP computed silently before the economy is shown.

---

## 3. What we're building

Five tabs. The theme fiction ("The Proving Ground") is in `docs/specs/06-theme.md`.

| Tab | What it is | Spec |
|---|---|---|
| **Today** | Home: the **Now card** (one task, a ring countdown, its first-step line, overtime counter), a **Next strip** (next 1–2 blocks), the Daily Drop status, today's training, and the shutdown or wind-down entry point. | `02-tasks.md`, `04-mind.md` |
| **Tasks** | Planner with time slots, sizes, Must/Could, the **postpone ladder**, focus timer, morning plan (≤3 min), shutdown (≤3 min), weekly review (≤10 min), Someday list. | `02-tasks.md` |
| **Train** | Beginner full-body programs (gym or hostel bodyweight), one-tap set logging, rest timer, progression engine, placement tests, pain button, heat mode, PRs. | `03-train.md` |
| **Mind** | Daily Drop: logic-grid mystery, featured puzzle by weekday, today's lesson, due cards. Also the Greene "read people" deck, five puzzle types, technique cards, mastery tracks, Free Play at 0 XP. | `04-mind.md` |
| **Ground** | Profile and ladder: level, season rank (#500 → #1), six-stat hexagon, streak and Clean Week, Shards shop, settings, backup. | `05-economy.md`, `06-theme.md` |

**A day in Prime Pocket (defaults; all changeable):**

```
07:00    Daily Drop unlocks: mystery + featured board + lesson + due cards (≈10–15 min, any time before wind-down)
~09:00   Morning plan ≤3 min: ≤3 Musts, each with a start time; capacity bar against free hours
day      Focus blocks 25/5 or 50/10, one live timer; Now card + Next strip; exact alarms from the APK
evening  Train 35–45 min Mon/Wed/Fri (screen kept awake, rest-alarm backstop) · rest days: 10-min walk check
23:00    Learning session with Claude on the laptop (optional; the app doesn't depend on it)
23:15    Shutdown ≤3 min: close today, set tomorrow's first task with time + place, bedtime if-then
23:20→   Wind-down: leftovers + reviews only, 10-min cap, no new lessons, no sharing, no engagement pushes
bedtime  Lights-out check-in (+15 XP) → after this: Mind earns 0 XP (Tasks/Train still count, uncelebrated), no sound, no animation
04:00    Day boundary (dayKey rolls over)
```

The intended attention inside the app, excluding workout and focus timers, is about 20–30 minutes a day.

---

## 4. Architecture decisions

The full detail is in `docs/specs/01-architecture.md`.

| Area | Decision | Why |
|---|---|---|
| App code | **Vite + React 19 + TypeScript (strict)**, `allowJs` so legacy generators run unchanged at first | Most reliable for an AI coding agent; bundle size is irrelevant for an installed app |
| Local data | **IndexedDB through Dexie**. Entity rows use ULID keys, state rows natural keys. Every row has `updatedAt`, `deleted`, `deviceId`. `dayKey` = local date of (time − 4 h) | Offline, sync-ready later without a migration |
| Rewards | **Append-only ledger of facts** with idempotent IDs (`kind:refId`). XP, level, rank, Shards and streaks are all derived. Rule changes apply forward from an `effectiveFrom` dayKey | Replays and merges never double-pay; progress never goes backwards |
| Backup | **dexie-export-import**, Share and Download buttons, a validated restore with preview, a `formatVersion` with migrators, and a nag after 7 days without a backup | Clearing Chrome's storage plausibly wipes a web app's data |
| Shell | **Capacitor Android APK** is the daily driver from Phase 2. The PWA URL stays as the preview/dev channel | A PWA cannot fire a reminder at a set time while closed. Capacitor Local Notifications + `USE_EXACT_ALARM` can |
| Reminders | `Notifier` interface: `WebNotifier` (best effort) and `CapacitorNotifier` (exact). Reschedule everything on every launch and after every edit | The UI never knows which shell it's in |
| PWA | vite-plugin-pwa, `injectManifest`, `registerType: 'prompt'` | Updates never reload mid-workout |
| Validation | **Valibot** schemas shared by the app and CI | One schema for packs, backups and imports |
| Tests | **Vitest** for `src/core` (aim for 100% of rules logic); **Playwright** with a mobile profile (390×844, light and dark, offline) for flows | Core rules are where bugs cost trust |
| Hosting | **Private GitHub repo + Cloudflare** (Workers static assets or Pages; free). GitHub Pages is the fallback if he prefers it, but needs a public repo | Free, custom headers, works with a private repo |
| Content packs | `content/*.json` → CI validates → deployed to `/packs/v/` with `/packs/index.json` (id, kind, version, schema, minAppVersion, sha256). Bundled seed for offline first run. The APK fetches from an absolute `PACKS_ORIGIN`, and `/packs/*` sends CORS `*` | Claude authors packs; the app pulls them without a login |
| Heavy work | Puzzle generation in a **Web Worker** | Keeps the UI at 60 fps on the phone |
| Sync | Not now. Later: "sync by file" (export → import with merge by `updatedAt`), then optionally Cloudflare Worker + D1 or Dexie Cloud | One user, one phone |

---

## 5. Build plan

Target: Season 1 of the economy starts **Monday 2 November 2026**. Dates can slip; the order shouldn't. Each phase ends with a build on Jenil's phone and a short summary to him: what shipped, what's next, any decision changes.

### Phase 0 · Foundation (5–11 Oct)

- [ ] **First commit:** copy the pack's `.gitignore` (it ignores `legacy/data/legacy-export.json`, backups, keystores and `.env`) *before* anything else is committed.
- [ ] Repo scaffold: Vite + React 19 + TS strict + `allowJs`, ESLint and Prettier, Vitest, Playwright, vite-plugin-pwa. Folder layout per `01-architecture.md`.
- [ ] `src/core/time`: `dayKey()` with the 4 am boundary, timer maths using absolute timestamps. Unit tested, including the 00:30 and 03:59 cases.
- [ ] Dexie schema v1, all tables from `01-architecture.md`. Repositories for each table.
- [ ] Backup export and import with envelope migrators, validation, preview and `ppFormatVersion` (`01-architecture.md` §5). Round-trip test in Vitest and on the phone.
- [ ] `navigator.storage.persist()` requested; the result is shown on the backup screen.
- [ ] Legacy import **through the restore file picker**, which auto-detects the legacy shape: 40 Greene law cards with SRS state, ratings, item schedules, case history. **Never bundle or statically import it**; `legacy/data/` is git-ignored personal data.
- [ ] Port legacy generators into `src/core/puzzles` and `src/core/mysteries` unchanged (`allowJs`), appending only `export default PZ;` / `export default CaseGen;`. Convert their test harnesses to Vitest; all existing checks still pass. Number Path is verified unique only (see `04-mind.md`).
- [ ] Convert `lessons_gita.js`, `lessons_charaka.js` and `content.js` into JSON content packs in `content/`, validated by Valibot schemas.
- [ ] `rules.config.ts` holds every constant from `05-economy.md` and `02-tasks.md`.
- [ ] App shell with the 5 tabs, dark theme tokens, and an installable PWA on Cloudflare.

**Exit check:**
- Backup round-trip passes on the phone.
- Legacy cards and decks load.
- All generator and lesson tests are green in CI.
- The PWA installs on the Nothing phone.

### Phase 1 · Build the three modes (12–18 Oct), then log the baseline (19–25 Oct)

- [ ] **Tasks:**
  - quick add, sizes S/M/L, categories, Must/Could (≤3 Musts), time slots, checkpoints;
  - the **full postpone ladder** (budget counted but not enforced during the baseline);
  - Unplaced tray, Someday;
  - Now card + Next strip, focus timer (one live timer, switches counted, overtime);
  - estimate-vs-actual display;
  - morning plan, shutdown, weekly review, fresh-start screen.
- [ ] **Train:**
  - onboarding (equipment, gym or bodyweight, days);
  - placement tests, both default programs;
  - one-tap logging, rest timer with wake lock;
  - progression engine (unit tested), PR badges, plate and warm-up calculators, pain button, heat mode, readiness check, minimum session and two-day mode.
- [ ] **Mind:**
  - the Daily Drop (mystery, featured board, lesson, cards) with a stopping screen;
  - Free Play at 0 XP;
  - the Greene deck and lessons running from packs.
- [ ] **Nightly log:** Reels-minutes bucket, lights-out check-in, morning back-fill card, weekly agency check, foreground app minutes.
- [ ] The ledger is written **silently**: facts are stored and XP is derived but hidden. A debug screen shows what XP per day would have been.
- [ ] Weekly summary export (JSON) per `07-content-packs.md`.

**Exit check:** features shipped by 18 Oct. Then **19–25 Oct is the baseline week**: he uses the PWA normally while Phase 2 native work starts in parallel. That gives 7 days of real data: postpones, estimate ratios, Reels buckets, lights-out times and would-be XP per day. On ~26 Oct, set the postpone budget from the baseline (`02-tasks.md` §3) and turn the economy on.

### Phase 2 · Native shell + economy on (19 Oct–1 Nov)

- [ ] Capacitor Android project:
  - `POST_NOTIFICATIONS` requested at runtime, `USE_EXACT_ALARM` declared;
  - notification channels (Task blocks, Rest timer, Planning);
  - rest-timer backstop notification.
- [ ] Debug APK built by GitHub Actions and downloadable, so he doesn't need Android Studio. Local build documented too.
- [ ] Data moved from the PWA to the APK through export and import, **after the baseline week ends (~26 Oct)**. The PWA then becomes read-only ("retired"). Shared signing keystore (also kept in his password manager), pinned `androidScheme`/`hostname`, and "back up before every APK update".
- [ ] Economy visible:
  - XP, levels, streak with freezes and earn-back, Clean Week, Hat-trick, lights-out XP;
  - night mode (wind-down cap, lights-out, bedtime ramp);
  - the notification budget.
- [ ] Proving Ground theme, the three juice tiers, haptics, an optional sound pack, and reduced motion (`prefers-reduced-motion` plus an in-app toggle).
- [ ] Run the **device test checklist** (`docs/device-test-checklist.md`) on the Nothing phone.

**Exit check:**
- Reminders fire with the screen off and the app closed on Nothing OS.
- The rest alarm fires.
- No data was lost in the migration.
- The postpone budget is set from the baseline.

Note: exact reminders and the visible economy arrive together, so the week 8–10 review can't separate their effects. Say so in the review.

### Phase 3 · Season 1 (from 2 Nov)

- [ ] Season ladder: 500 seats, starting seed, original ghost rivals, one named rival just above him, tiers.
- [ ] Shards and a fixed-price shop: freezes, cosmetics, handcrafted puzzle packs, themes. Nothing random.
- [ ] Share cards for puzzles (spoiler-free; WhatsApp or plain text by default; off during wind-down).
- [x] Technique cards and the three-rung hint ladder driven by the logic solvers. Write the Number Path logic solver first. (Number Path solver done 21 Oct.)
- [ ] Hexagon stats and mastery tracks. (Hexagon done 21 Oct: You → Your six stats.)
- [ ] Mystery meta-arc: daily cases reveal story panels and **Sunday's case closes the chapter**; the Sunday Boss board adds a bonus panel. **Four Arcs and four shop catalogues ship bundled** and cycle if no new pack arrives.
- [ ] Content-pack pipeline live: CI validation, `/packs/index.json`, the app's pack updater (keeps the old version until the new one passes). (Pack updater moved to Phase 4 by the owner, 21 Oct; app updates carry new content until then.)

**Exit check:** Arc 2 content and a new shop catalogue on Monday 7 December. A week 8–10 review against the baseline metrics.

### Phase 4 · Optional (2027)

File sync, then Worker + D1 or Dexie Cloud. An opt-in Instagram guard through a native Usage Access plugin. An opt-in weekly-pot season experiment with lifelines. A no-XP durability week around early February. Change one variable per season.

---

## 6. Ask Jenil at kickoff (one message, then start)

1. **Repo and hosting:** what should the GitHub repo be called (default `prime-pocket`, private)? Is a free Cloudflare account OK for hosting? If not, use GitHub Pages: that needs a public repo (strip personal docs first) or GitHub Pro, which is free with the GitHub Student Developer Pack.
2. **Building the APK:** is Android Studio installed on his laptop, or should the debug APK come only from GitHub Actions?
3. **Training:** does he have gym access, and with what equipment? Ask about dumbbells, barbell (15 or 20 kg), resistance band, pull-up bar, and a sturdy table for rows. Three days a week or two-day mode? Which days?
4. **Schedule:** roughly how many free hours does he have on class days and on weekends (defaults 4 h and 6 h)? Does he have a timetable to enter?
5. **Night:** what's his real bedtime now (default 1:30 am), and what's his goal bedtime (default 23:30; the app ramps toward it 15 min at a time)? When should the Daily Drop unlock (default 7:00)? When should the shutdown nudge come (default 23:15)?
6. **Import:** should we import the old Prime Pocket cards and history (default yes)?

Don't ask anything else up front. Everything else has a default in this pack.

---

## 7. Working agreement (how to give this your best)

- **Plan per phase:**
  - Plan each phase in plan mode, then leave plan mode and write `docs/plans/phase-N.md` with tasks, risks and test plan.
  - Show Jenil the scope in 5–8 lines and continue unless he objects. Don't ask permission step by step.
- **Core first, tests first:**
  - `src/core` is pure TypeScript with no React and no Dexie.
  - Write the Vitest cases from the specs' acceptance tests before the code: dayKey, postpone ladder, budget auto-raise, progression engine, award rules, caps, level curve, rank formula, streak and Clean Week.
- **UI checks:**
  - Every screen is tested with Playwright at 390×844 and 360×800, in light and dark, and once offline.
  - Take screenshots and look at them before calling a screen done.
  - No horizontal scroll; tap targets ≥ 44 px.
- **Use subagents** for parallel, independent work: porting generators, converting packs, writing tests, building the exercise library. Before closing each phase, use a **separate review subagent** that hasn't seen the work, so the work isn't grading itself.
- **Boring dependencies:** add a library only when it removes real work. Note each new dependency in `DECISIONS.md`.
- **Repo hygiene:**
  - Small commits with conventional messages.
  - Never commit secrets, keystores, `.env` files or backup files.
  - Keep `CHANGELOG.md`, and keep `DECISIONS.md` as an ADR-style log.
- **Weekly build on his phone,** even if small. A working app every week beats a perfect app in a month.
- **Copy and tone:**
  - Short and plain, Indian context, coach-like.
  - Never shaming, never "you should".
  - Failure copy puts the cause outside him ("Yesterday didn't go to plan. That's data, not a verdict.").
- **Stop and ask Jenil only for product trade-offs:** dropping a feature, changing an economy rule's meaning, adding a paid service, or anything that could lose data.

---

## 8. What to measure

Log a one-week baseline before XP is shown, and judge the system at weeks 8–10, not week 2. Change one variable per season.

| Metric | Captured how | Healthy direction |
|---|---|---|
| Night-time Reels minutes | Nightly one-tap bucket (0, <15, 15–30, 30–60, 60–120, 120+); weekly Digital Wellbeing figure typed in | Down from ~6 h/day |
| Lights-out time | Check-in; share of nights before his chosen bedtime | Earlier |
| Start adherence | Focus blocks started within ±15 min of plan | Up (the primary planner metric) |
| Tasks done on their first scheduled day | % per week | Up |
| Postpones | Per week; share needing a 3rd postpone; mix of reasons | Down; budget auto-raises if exceeded in >50% of weeks |
| Estimate ratio | Median actual ÷ estimate per category | Toward 1.0–1.2 |
| Workouts and Clean Weeks | Sessions per week; weekly streak | ≥2 strength sessions every week |
| **Guard:** time in Prime Pocket | Automatic, excluding workout and focus timers | Flat or falling |
| Agency check (weekly) | "Did time in the app feel well spent?" (1–5); "Did you open it when you meant to do something else?" (Y/N) | Up / No |
| Streak recovery | Broken streaks repaired or restarted within 7 days | High (low means too strict) |

After about three months, run one no-XP week to test whether the habits hold without rewards.

---

## 9. Known unknowns: test on the phone, don't assume

These are listed in `docs/device-test-checklist.md`:

- Do exact alarms survive a reboot? If not, reschedule on boot or on the next launch.
- Nothing OS background behaviour. Set the app's battery use to Unrestricted.
- Whether Chrome on Android shares a `.json` file. Fall back to `.txt` or Download.
- Full-screen "do this now" alarms (Android full-screen intent rules).
- Usage Access for an Instagram guard (Phase 4, opt-in).
- The upstream image licence of free-exercise-db; check it before bundling images.
- Android sideloading rules tighten in some countries from late 2026 and globally "in 2027 and beyond". Installs over adb are exempt.
- **Data-loss traps in the APK:**
  - a changed signing key forces an uninstall, which wipes data;
  - a changed `androidScheme`/`hostname` orphans IndexedDB.
  - Both are covered in `01-architecture.md` §8. Back up before every APK update.

---

## 10. What's in this pack

```
HANDOVER.md                       ← this file
CLAUDE.md                         ← copy to the repo root
.gitignore                        ← copy to the repo root BEFORE the first commit (keeps personal data and keys out)
docs/
  research-brief.md               ← evidence behind every decision (≈12k words, cited)
  specs/01-architecture.md        ← stack, schema, backup, notifier, packs, hosting, CI
  specs/02-tasks.md               ← planner, postpone ladder, focus, rituals
  specs/03-train.md               ← programs, progression engine, logging, safety
  specs/04-mind.md                ← Daily Drop, puzzles, mysteries, lessons, deck, port plan
  specs/05-economy.md             ← rules.config.ts values, ledger, levels, ladder, streaks, Shards, night mode
  specs/06-theme.md               ← The Proving Ground: visual, motion, sound, haptics, copy, IP guardrails
  specs/07-content-packs.md       ← pack schemas, CI validation, Claude authoring, weekly summary export
  kickoff-prompt.md               ← paste into Claude Code to start
  device-test-checklist.md        ← run on the Nothing phone in Phase 2
reference/
  puzzles-and-lessons-research.md ← earlier research: puzzle generators, Gita, Charaka, lesson design
legacy/
  README.md                       ← what each file is and how to port it
  src/                            ← the working claude.ai prototype (plain JS)
  tests/                          ← generator and lesson test harnesses (node)
  build/prime-pocket.html         ← the built prototype; open it in a browser to see current behaviour
  data/legacy-export.json         ← Jenil's real cards and progress (personal; git-ignored; import via the restore picker)
  data/fixture-legacy-export.json ← synthetic file with the same shape, for CI tests
```
