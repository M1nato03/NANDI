# NANDI continuation plan — 8 October 2026

Status: proposed delivery plan, grounded in the current code and Jenil's existing decisions.
Working branch: codex/continuation-plan.
Baseline: main at 53461e1425e57423168a50e504749f6107044ece.
Dates below use Asia/Kolkata. Saturday means 10 October 2026.

## 1. Goal and boundaries

Continue the existing personal NANDI app: Tasks, Train and Mind, with Today and Ground around them. Success remains less unwanted scrolling, better task follow-through and earlier sleep. Preserve offline operation, local data, finite learning sessions, original Proving Ground styling, and a reward economy that never removes earned progress.

The broader public app and creator marketplace discussed in ChatGPT are a future product direction. They are not a replacement for this personal build and are outside the immediate implementation.

This change contains planning documents only. It does not alter app behaviour, database schemas, rewards, dependencies or deployment configuration. A draft pull request does not deploy to the phone; the existing workflow deploys successful pushes to main.

## 2. Evidence and precedence

Reviewed:
- Repository HANDOVER.md, CLAUDE.md, DECISIONS.md, CHANGELOG.md, the Phase 0 plan and Phase 1 inputs.
- Tasks, Train and Mind specifications and the research brief's overview.
- Current screen implementations, app registration, service worker, workflow and hosting configuration.
- D:/Downloads/NANDI-HANDOFF.md and the new learning-track specification inside nandi-handoff.zip.

Use the current repository and working code for implementation status. The downloaded handoff explicitly says its author could not inspect NANDI.
- Side quests ARE an existing request in docs/plans/phase-1-inputs.md, despite the downloaded handoff saying otherwise.
- Clutch is a stamp plus a small FLAT XP bonus, capped so postponing never beats zero-postpone completion. Old percentage-based text is superseded.
- The corrected bodyweight placement band is 5–11; 12 or more moves up.
- One implementation agent at a time; keep a concise handback for Claude. An independent review occurs at a phase-closing gate, per the project agreement.
- Drone learning is requested. The proposed track limits and pass thresholds have not been approved as fixed product rules.

## 3. Verified starting point

Present in source:
- Vite/React/TypeScript PWA shell with five tabs, appearance settings and an error boundary.
- Dexie schema/repositories, validated backup/restore and legacy import.
- Puzzle and mystery generators, a worker and generator-check screen.
- Bundled Gita, Charaka and Greene packs.
- Time helpers, central rule configuration and some economy calculations.
- Unit tests, browser tests and Cloudflare deployment workflow.

Not yet complete:
- Today, Tasks and Train are placeholder screens.
- Mind currently exposes the generator check; it is not the playable Daily Drop.
- The complete task engine, workout experience, lesson/card player and visible economy remain to be implemented.
- There is no native Android project in the current tree.
- Learning tracks, side quests and a live content updater are not implemented.

Build evidence:
- Current-head CI: https://github.com/M1nato03/NANDI/actions/runs/37591831249
  Typecheck, lint, banned words, unit tests, pack validation, production build and deployment succeeded. Browser tests were skipped for this documentation-only commit.
- Latest source-change CI: https://github.com/M1nato03/NANDI/actions/runs/37589666096
  Check, browser tests and deployment succeeded.
- Deployment logs identify https://nandi.nandi11.workers.dev as the hosted app.

These checks establish the repository baseline, not the state of the installed phone or completion of device checks.

## 4. First milestone: finish the foundation and make updates predictable

Deliver before starting a large feature:
1. Display an app/build identifier in Ground so phone and source versions can be compared.
2. Implement an Update available / Later flow. The configuration uses prompt mode, but main.tsx currently supplies no onNeedRefresh handler, and sw.ts has no user-triggered activation-message handling.
3. Ensure reload follows user action and completion of pending writes. Respect active focus/workout sessions when those features arrive.
4. Test a real old-build → new-build upgrade in a persistent browser context. Existing data must survive and the app must still cold-start offline.
5. Make production deployment wait for applicable browser tests. Today deploy depends only on check, so a failing e2e job does not itself prevent deployment. Handle the intentional docs-only skip explicitly.
6. Complete outstanding Phase 0 device checks: installed PWA, airplane-mode restart, exported backup and restore preview/round-trip. Avoid wiping the only copy of real progress; use a verified exported backup and a disposable browser profile for destructive test steps.
7. Record the phone results and retain the original source checkout and private exports.

Exit: a traceable build, a tested upgrade path, a gated deployment and recorded backup/offline checks. The Phase 0 label stays open until the required device evidence exists.

## 5. Next milestone: one complete Tasks workflow

Build a usable vertical slice before the rest of the planner:
- Quick add: title, estimate/size, Must/Could and optional schedule.
- Today: one Now card and the next scheduled tasks.
- Start/pause/resume/finish a focus session; one live timer, based on absolute timestamps.
- Complete a task and show planned versus actual time.
- Persist everything across closing/reopening and include it in backup/restore.
- Record facts idempotently, with XP presentation hidden during baseline.

Then finish the planner:
- Day-boundary handling, Unplaced and Someday.
- Postpone ladder, first-step prompt, splitting and reason-based moves.
- Morning plan, shutdown and weekly review.
- Baseline logging and weekly export.

Write pure-core tests from spec 02 before implementation. Cover midnight/04:00, repeated taps, timer resume, missing tasks, split accounting and no duplicate rewards.

Clutch reconciliation is part of this milestone: update the old spec/config wording, choose the small flat amount in the phase plan, and test that a postponed completion cannot pay more than the same task completed without postponing. Do not activate a new reward amount silently.

## 6. Complete Phase 1: Mind, Train and side quests

### Mind
Port the existing prototype behaviour and generators:
- Playable boards, daily mystery and saved in-progress state.
- Existing eight-screen lesson flow, diagrams and shuffled answer options.
- Due-card reviews with preserved schedules.
- A finite Daily Drop with a clear stopping screen, optional zero-XP practice and night behaviour.
- Keep Number Path's documented uniqueness-only limitation until a logic solver exists.
- Fix known shaming/imperative lesson-copy exceptions during the content pass.

Exit: complete a daily activity, close the app, reopen offline, and retain both progress and correct completion facts.

### Train
- Equipment/day selection; gym and bodyweight tracks.
- Simple exercise guidance and one-tap set logging.
- Rest timer and workout history.
- Tested progression engine and existing safety stops.
- Keep advanced art/calculators separate from the first complete session.
- Recheck current authoritative guidance before implementing health-related advice or exact-alarm permission assumptions.

Exit: a complete logged workout survives backgrounding and restore; actual closed-app reminders remain an Android-shell/device-test milestone.

### Side quests
Use the request already recorded in phase-1-inputs.md:
- A small editable weekly set plus custom quests.
- Check-off and accumulated progress, such as distance or repetitions.
- Optional links from a lesson to an outside activity.
- Archive unfinished quests without deleting history or penalising the user.
- Propose placement under Tasks with a Today summary.
- Decide weekly count/reset, overlap with workout logging and XP treatment before activating rewards. No random prizes and no double payment for the same action.

These are separate increments with their own acceptance checks, not one large replacement of all screens.

## 7. Learning Tracks: drone technology first, after the core is stable

Preserve the new proposal in docs/specs/08-learning-tracks.md, labelled as a draft from the handoff.

Initial implementation:
- A reusable validated track/unit content format.
- One chosen track with parked topics; an editable scheduled learning task.
- Key points, diagrams/text, a short check, recall cards and an application quest.
- Hand-picked video links opened only by explicit user action.
- Offline explanations/checks/cards must remain usable without a video connection.
- Track progress participates in existing data, backup and reward systems.

Decisions to resolve before shipping:
- Suggested 25-minute budget, four new-unit days/week, five new cards/day and a 30-review backlog brake are starting proposals, not scientific constants.
- Do not increase session length automatically after one week.
- Reconcile the proposed module-test XP with the single daily lesson reward and Mind cap.
- Review the proposal to reset weak units' cards on a failed module test; avoid erasing mastered-card scheduling without an agreed rule.
- Clarify video completion as self-reported; opening YouTube alone must not claim that learning happened.
- Verify current India drone rules when authoring that module.

Pilot one complete module before commissioning the full seven-module track. Add other requested interests through the same structure once the first module works.

## 8. Baseline, Android and economy

Keep the existing order:
1. Make the relevant Tasks, Train, Mind and logging flows usable.
2. Record seven actual days with reward presentation hidden.
3. Calibrate the postpone budget from the baseline.
4. Turn the economy on only after the baseline and agreed rules are ready.
5. Add the Capacitor shell and device-tested notification behaviour, moving data through a verified export/import.
6. Add ladder, Shards, mastery and story packs after the daily loops are reliable.

The original dates (Phase 1 on 12–18 Oct, baseline 19–25 Oct, economy around 26 Oct) remain targets. Move them if prerequisites are not met; do not shorten the baseline just to match a date.

For Android, retain a stable signing identity, application ID and storage origin. Never require an uninstall to apply a normal update.

## 9. Scope through Saturday, 10 October

Primary target:
- This reconciled plan and a passing baseline build.
- Foundation update/version/deployment improvements.
- One complete Tasks path, if foundation checks are complete.

Stretch target:
- One playable Mind activity using an existing generator, with saved state.

Not promised by Saturday:
- All three feature areas, a finished Android APK, full drone curriculum, creator marketplace or final economy.

Work proceeds in active Codex sessions, one bounded increment at a time. At handback, provide the branch/commit, shipped changes, checks and remaining blockers so Claude can resume directly.

## 10. Validation and release workflow

For each behaviour change:
1. Read the relevant spec and latest decision overrides.
2. Add meaningful core acceptance tests; implement in a small branch.
3. Run typecheck, lint, banned words, unit tests, pack validation and production build.
4. For affected flows, run Playwright at 390×844 and 360×800, light/dark and offline; inspect screenshots.
5. For data/schema changes, require backup round-trip tests before release.
6. Summarise the change, evidence, user-visible result and limitations in the PR.
7. Merge/release only through the agreed release checkpoint. A successful main push triggers Cloudflare deployment.
8. Verify the new phone build identifier and the affected feature.

No functional changes or production deployment are part of this planning PR.

## 11. How the phone receives changes

Hosted NANDI installed through Chrome:
- Same hosted origin receives new web builds after successful main deployment.
- The phone needs internet to fetch the new version; downloaded functionality remains available offline.
- The intended prompt lets Jenil choose when to reload. Until it is implemented, browser service-worker activation can require closing existing NANDI windows/tabs and reopening after the update has downloaded.
- Keep the same origin and browser profile to preserve local data; a code update is not a request to clear storage or reinstall.

Old Claude Prime Pocket artifact:
- Independent app/storage. A NANDI deployment does not update it.
- Export its latest data before importing; the handoff reports that the 3 Oct export is stale.

Future Capacitor APK:
- Web deployment alone does not replace bundled application code.
- Install a newer compatibly signed APK over the existing one. A separate live-update system is not part of the current plan.

Confirm which installation Jenil is using before describing a release as received on his phone.
