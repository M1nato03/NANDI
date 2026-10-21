# Build plan status, 21 Oct 2026 (HANDOVER §5, Phases 0–4)

Jenil's rule (21 Oct): "the phases" = the build plan in HANDOVER.md §5, which is Phase 1 ("finish own NANDI") of the
master plan. Spec 13 parts are called **feel steps**, never "phases", so the two are not confused.
Every row was checked against main 3a2e631 (file named). DECISIONS.md rows that changed the plan are cited.

## Phase 0 · Foundation — DONE
All items present: .gitignore first, Vite/React/TS scaffold, `src/core/time` 4 am dayKey, Dexie schema + repos,
backup export/import with migrators (`src/data/backup`), `navigator.storage.persist()` + result on the Backup screen
(`src/platform/storage.ts`, `Backup.tsx`), legacy import via the restore picker (`src/data/legacy-import.ts`, export kept
in D:\NANDI-private), ported generators, content packs, `rules.config.ts`, PWA on Cloudflare.

## Phase 1 · Three modes + baseline — DONE except 2 logging gaps
Done: Tasks (≤3 Musts, postpone ladder, Unplaced, Someday, focus timer, estimate vs actual, morning plan, shutdown,
weekly review, fresh start); Train (onboarding, placement, programs, logging, rest timer + wake lock, progression,
PRs, plate/warm-up, pain, heat, readiness, minimum session, 2-day target in `Dashboard.tsx`); Mind/Learn drop with a
stopping screen, Free Play 0 XP, Greene deck from packs; Reels bucket, lights-out check-in, morning back-fill;
weekly summary export. Postpone budget is set automatically from the first 7 days (`data/repos/tasks.ts` budgetState).
Changed by decision: 5 feature tabs (DECISIONS 10-17, replaced the 10-11 Now/Plan/You redesign); economy visible from
10-19 instead of a silent ledger, so the "would-be XP" debug screen is no longer needed (DECISIONS 10-19).
**Missing (both feed the baseline and the week 8–10 review):**
1. Weekly agency check (1–5): `dailyLog.agency1to5` is in the schema and read by `weeklySummary.ts`, but no screen
   writes it.
2. Foreground app minutes: `dailyLog.appMinutes` is read by the weekly summary but never written, so the summary
   always reports 0.

## Phase 2 · Native shell + economy — BUILT, exit check NOT run
Done: Capacitor Android, POST_NOTIFICATIONS + USE_EXACT_ALARM, channels tasks/rest/planning (`platform/notifier.ts`),
rest backstop, signed release APK from Actions (all 4 keystore secrets set 16 Oct), economy visible (XP, levels,
streak with rest-day bank instead of freezes — DECISIONS 10-20, Clean Week), night mode (wind-down cap, lights-out,
bedtime ramp in `core/tasks/planner.ts`), notification budget (`engagementPerDayMax`), haptics, sound (opt-in),
reduced motion + in-app toggle. Opt-in app pause (pulled forward from Phase 4).
**Open:**
3. Device test checklist (`docs/device-test-checklist.md`): 0 of 28 items ticked. Exit check needs, on the Nothing
   phone: a reminder firing with the screen off and the app closed, the rest alarm firing, no data lost. Needs Jenil.
4. Juice: the plan's three juice tiers exist in RULES, but Learn has one animation; spec 13 (feel steps) finishes it.

## Phase 3 · Season 1 (from Mon 2 Nov) — MOSTLY BUILT EARLY
Done: 500-seat ladder with rivals (`core/economy/ladder.ts`), Shards + fixed-price shop with 4 catalogues
(`core/economy/shop.ts`), share cards, technique cards and 3-rung hints, par times and no-hint stamps
(`core/puzzles/mastery.ts`), 4 mystery arcs with Sunday chapter close and the Sunday Boss bonus panel
(`core/mysteries/arc.ts`), CI pack validation.
**Missing:**
5. Number Path logic solver ("write it first"). Path hints still copy the stored solution (`core/puzzles/hint.ts`), and
   HANDOVER rule 9 says Number Path is only verified unique until this solver exists.
6. Hexagon: six stats, 28-day rolling, 0–100 (spec 05 §8, spec 06). Nothing in `src/` yet.
7. In-app pack updater (`/packs/index.json`, sha256 + schema check, keep the old pack until the new one passes;
   spec 07). Not built. Content now ships inside each app build. Needs a decision: build it, or record in DECISIONS
   that app updates replace it.
Exit check (7 Dec): Arc 2 content + a new shop catalogue (both bundled already); week 8–10 review against the
baseline. Say in that review that the economy became visible during the baseline week (10-19), as HANDOVER asks.

## Phase 4 · Optional (2027) — not started, as planned
File sync is covered by export/import; app pause covers the Instagram guard. Cloud sync, the weekly-pot experiment
and the no-XP durability week wait.

## Where the new work sits
- Audit fixes (builds 59–60) and plain words (builds 61–62): Phase 1 quality, needed for the master-plan gate
  (Jenil uses NANDI daily for 2 weeks).
- Spec 13 feel steps 1–2 (was "P3/P4"): finish Phase 2's juice item.
- Spec 14 teach first (pilot on Psychology): Phase 1 Learn quality.

## Recommended order (Season 1 starts in 12 days)
1. Finish what is in flight: feel step 1 (A–D) → teach-first pilot → feel step 2 (E–H).
2. Phase 1 gaps 1–2 (small, and the baseline needs them now).
3. Phase 2 exit check with Jenil on the phone (item 3).
4. Phase 3 items 5 and 6 before 2 Nov; item 7 is Jenil's call.
