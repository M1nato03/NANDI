# Code review: `review/ship-22` (second opinion)

**Verdict: SHIP AFTER FIXES.** No data loss, no crash and no rule break in the economy core. Every check passes. Fix findings 1 to 3 before the push to `main`. They are small, and two of them would give wrong kill-test numbers in exactly the 2 weeks the spec uses those numbers to decide.

- Reviewed: `git diff origin/main...origin/review/ship-22`, 9 commits, head `1214422`, 35 files, +1436 / −179.
- Reviewer: Claude Code, scheduled run, 21 Oct 2026. No app code was changed. This file is the only change on branch `ideas/review-ship-22`.
- Method: I read the whole diff. Then I proved each suspected bug with a throwaway Vitest file (not committed) run under `TZ=Asia/Kolkata`. Findings marked **VERIFIED** were reproduced by running code. Findings marked **PLAUSIBLE** come from reading the code only.

## 1. Checks run

| Check | Result |
|---|---|
| `npm ci` | OK |
| `npm run typecheck` (app, node, sw) | PASS, 0 errors |
| `npm run lint` | PASS, 0 problems |
| `npm test` (Vitest) | PASS: 117 files, **504 passed, 12 skipped**, 0 failed |
| `tsx scripts/validate-packs.ts` | PASS ("Packs valid.") |
| `tsx scripts/copy-lint.ts` | PASS (no hits) |
| `tsx scripts/banned-words.ts` (extra) | PASS |
| `playwright test` (e2e, 222 tests, 2 viewports) | **210 passed, 4 failed, 8 skipped**. The 4 failures also fail on `origin/main` (see note) |

E2E note: the repo's Playwright 1.63 expects Chromium build 1243. This container only has build 1194 at `/opt/pw-browsers`, so `npx playwright test` failed at browser launch on every test. I re-ran it with an untracked config, not committed, that only sets `launchOptions.executablePath` to the preinstalled Chromium 1194. The result above comes from that run, on port 4199. The 4 failures are `backup.spec.ts:20` and `shell.spec.ts:71`, at both viewports. In both, the restore preview prints dates as "Fri, 2 Oct" (with a comma) where the test expects "Fri 2 Oct". That is a locale-format difference in the older Chromium. I ran the same 4 tests on `origin/main` with the same setup and they fail the same way, so this branch did not cause them. The new `soft-days.spec.ts` passed at both viewports. Before the push, run the e2e suite once on the usual Windows setup to confirm.

## 2. Findings, most severe first

### F1. "I feel okay now" overwrites the day's mood fact, so the kill-test finish rate is inflated and low days go missing (VERIFIED, medium)
- `src/data/repos/soft.ts:8-12`: `setSoftState` does `db.ledger.put({ id: 'soft-start:<day>' … })`. Each tap overwrites the same ledger row. CLAUDE.md says "Never mutate or delete ledger rows". `softToday` (`src/core/soft/soft.ts:42-47`) and its test were written for several rows where the latest one wins. The repo stores only one.
- Scenario (run): tap Feeling low at 20:00 → `soft-start:2026-11-03 {state:'low'}`. Tap "I feel okay now" one minute later → the same row becomes `{state:'okay'}`. The next day, tap Tired, then Breathe. `softNumbers` returns `started: 1, finished: 1, finishRate: 1` (100%). The true figure is 1 of 2 days started, so 50%.
- Why it matters: the people who bail with "I feel okay now" are the people who did not finish. They drop out of the denominator. So the spec §6.1 "keep if ≥ 70%" test reads too high exactly when the feature is failing. The same overwrite also deletes that low day from the care-card count in `careCardDue` (`soft.ts:61-66`). A person who says "low" and then backs out four times in 14 days never sees the care card.
- Fix: append, never overwrite. Use `id: soft-start:<day>:<ulid>` with `db.ledger.add`, and record `okay` as its own row. The core already picks the latest row. `softNumbers` should count a day as started if *any* tired or low row exists that day. Add a repo test for tired → okay → tired.

### F2. On Android, cancelling the kind-word share sheet still counts as sent (VERIFIED by reading, medium)
- `src/platform/files.ts:20-21`: on native, a share error whose message contains "cancel" returns `'downloaded'`, not `'cancelled'`. `KindWord.send` (`src/ui/soft/SoftDay.tsx:83-84`) calls `done()` whenever `result !== 'cancelled'`.
- Scenario: low day → "Send someone a kind word" → Send it → the Android share sheet opens → press Back. A `soft {choice:'kind-word'}` fact is written. The day is marked, 10 XP is given, a lantern is lit, and the screen says "That counts", but nothing was sent. The kind-word card also lands in Documents as `kind-word.png`.
- Why it matters: any count of cards sent (spec §6.6, "fewer than 2 cards … drop E") reads too high. It also goes against the spirit of E: the lantern should come from the kind act, not from opening a sheet. The native sheet also shows the title "NANDI Mind" and the dialog title "Share my solve" for this card (`files.ts:18`), because every image with text gets those.
- Fix: return `'cancelled'` on native cancel (the backup and recap callers should treat cancel the same way), or give `shareOrDownload` a `{ title, dialogTitle }` option and treat cancel as not done in `KindWord`. Use "Send a kind word" as the dialog title.

### F3. No welcome-back gift after a long miss that ends on the chosen rest weekday (VERIFIED, low-medium)
- `src/core/economy/deriveEconomy.ts:118-128` looks only at the day just before (`before`). If that day is the chosen weekly rest day, there is no gift.
- Scenario (run): rest weekday = Sunday. Walk on Monday 2 Nov, miss Tuesday to Sunday, walk on Monday 9 Nov. Result: `welcome: 0`, while `restDaysUsed: 4`. Four rest days were spent, so spec D says the gift is due.
- Fix: walk back over chosen rest weekdays to the last day that was not a rest weekday. Give the gift if that day is unmarked (and `everMarked`). Add this case to `softDays.test.ts`.

### F4. Storybook says "you were tired" on a Feeling-low day (VERIFIED, low)
- `src/core/courtyard/storybook.ts:43,72`: `SOFT_ONE[0]` is chosen by week, whatever the state was. A week whose only soft day was a low "Step outside" prints "On Wednesday you were tired and still lit a lantern."
- Fix: pick the line from `inputs.state`, or make both lines state-neutral (the second line already is).

### F5. The care card keeps coming back until it is tapped (VERIFIED, low)
- `src/ui/soft/SoftDay.tsx:111-112,127`: `soft.careShownAt` is saved only on "Call 14416" or "Not now". If the person just does a gentle thing or leaves, the card shows again on every low day (run: `careCardDue(…, '2026-11-13', undefined) === true` the day after it first showed). Spec F says "show this once, then at most once every 14 days". It never becomes a pop-up, but it can repeat for days on a run of low days.
- Fix: save `soft.careShownAt = today` when the card first renders (a `useEffect` on `care`), not on tap.

### F6. Soft and welcome-back XP raise Season SP (PLAUSIBLE spec gap, low; owner call)
- `deriveEconomy.ts:139` sums `day.total` into season SP, and `day.total` now includes `soft` (10) and `welcome` (15). Run: one walk plus one soft day after a miss gives SP 40 → 65.
- Spec B says "Season, Clean Week and quests need the real slots as today". Clean Week and quests are unaffected (they use `hatTrick`, and `soft` never sets it). Whether soft XP should count toward Season is a product question: you could take it as "season needs real slots", or as "XP is XP".
- If it should not count: add `soft + welcome` to a separate field and leave it out of `seasonSp`.

### F7. An in-progress drop that still holds a removed inflation question gets stuck on update day (PLAUSIBLE, low)
- The inflation rebuild removes item ids `inflation-1` to `inflation-8` (now `inflation-9..16`, `c3..c5`, `m3..m4`, `s1..s3`, `rbi`), and the pack `version` stays `1.0.0`. If a saved daily drop points at an old id, `LearnDrop.tsx:244` shows "This item is unavailable" with no way forward for that drop, so today's 5-answer slot may not be reachable. Old `learnItems` memory rows for those ids are orphaned. That is harmless, but Jenil's review history on them is gone.
- Fix: bump the pack version to `1.1.0`. When a resumed drop has unknown item ids, filter them out, or rebuild the drop if none are left.

### F8. Smaller points (all low)
- **Breathing circle under reduced motion** (`src/ui/soft/soft.css:42-43`): the circle still scales 1 → 2.1, just over 20 s instead of 10 s. CLAUDE.md asks to respect `prefers-reduced-motion` and the in-app toggle. Suggest no scaling under reduce, with the text alone guiding the breath, or a static ring plus a fading opacity.
- **"Sounds are quieter"** on a soft day (spec B) is not built. Doing the smallest real task through "Do one tiny task" plays the normal finish sound through `EconomyFeedback`.
- **Next-morning line** (`src/ui/screens/Plan.tsx:93`) shows all day on Plan, not only on the first open (spec C). It is hidden if today is also a soft day.
- **Welcome-back toast after bedtime** (`src/ui/shell/EconomyFeedback.tsx:380-382`) fires a haptic and a notice with no `afterBedtime` check. The existing finish path is no stricter, so this is in line with current behaviour, but it is a celebration after bedtime.
- **Retroactive gift window** (`src/core/rules.config.ts:135`): `soft.from: '2026-10-22'`. If the push lands later than 22 Oct, days between 22 Oct and the push date get the +15 on replay. That only adds XP, which is allowed, but rules are meant to apply forward. Set `from` to the real ship date.
- **Lanterns** (`src/ui/courtyard/Scene.tsx:222-224`): only 12 are drawn. The title text still gives the true count. That is fine, but "lanterns never go away" is only true in text after 12.
- **Chip after bedtime** (`Plan.tsx:91`) uses the base bedtime, not the adaptive one. On a busy day, between the base and the shifted bedtime, the chip opens the night routine early. DECISIONS keeps the base bedtime for Learn on purpose, so it is probably fine. Noting it for consistency.
- **Tests missing for**: the welcome gift under replay with a rest weekday, F1's repo behaviour, a backup round trip that includes `soft`/`soft-start` rows, and the streak nudge being dropped by a soft day. I checked the last two by hand and both work (see section 4).

## 3. Spec conformance (spec 15, §3 A-F and §4)

| Item | Status | Evidence |
|---|---|---|
| A. Chip "Low on energy today?" on Home before bedtime, never by notification | MET | `SoftDay.tsx:26-35`, `Plan.tsx:93` (hidden on away days). No soft text in `nudges.ts` |
| A. Sheet: Tired · Feeling low · Not now | MET | `SoftDay.tsx:31-33` |
| A. `soft-start {state}` one per day; "I feel okay now" switches back | PARTLY | Works, but by overwriting a ledger row (F1) |
| A. After bedtime the chip opens the night routine | MET | `SoftDay.tsx:30` → `go('night')`; `isAfterBedtime` handles 00:00-04:00 (`nightTimeline.ts:24-30`). Uses base bedtime (F8) |
| B. One card only; season, ladder, quests, shop hidden | MET | `Plan.tsx:92` early return; `You.tsx:32-37` hides `YourSeason` (which holds the Shop button) and `DailyQuests` |
| B. Kachhua in `rest` pose; the two host lines | MET | `SoftDay.tsx:129`, `soft.ts:12-15` |
| B. Sounds quieter | NOT MET | Nothing found (F8) |
| B. Tired: Breathe 1 min (CSS), Stretch 2 min (3 Train drawings), Tiny task | MET | `SoftDay.tsx:38-59`, `ExerciseFigure.tsx:+4` |
| B. Low: Step outside 5 min, Kind word, One good thing (story only if allowed) | MET | `SoftDay.tsx:60-70`; `storyGoodThings` needs `inStory === true` (`soft.ts:69-73`, tested) |
| B. Fixed list, never random, ≤ 3 | MET | `SOFT_OPTIONS` constant, tested `soft.test.ts:15-18` |
| B. `soft {choice}` marks the day, spends no rest day, keeps gold | MET | `deriveEconomy.ts:112-115`; tests `softDays.test.ts:14-27` |
| B. Not a Hat-trick slot; flat 10 XP; Clean Week and quests unchanged | MET | `hatTrick` uses only real slots (`deriveEconomy.ts:98`); `rules.soft.dayXp` = 10. Season SP does include it (F6) |
| B. No cap | MET | `soft` is a boolean per day; nothing limits the number of soft days |
| C. Calm finish copy, "You can stop here.", Close for today, "I feel better, show me more", nothing auto-continues | MET | `SoftDay.tsx:118-124`; soft haptic `tapHaptic(true, 15)` |
| C. One lantern per soft day, derived from `soft` facts, never removed | MET | `courtyard.ts:+lanterns`, `Scene.tsx:222-229`; tested. Only 12 drawn (F8) |
| C. Next-morning line | PARTLY | Shown all day, not first open only (F8) |
| C. Sunday storybook soft page | PARTLY | `storybook.ts:63-75`. "Tired" copy on low days (F4) |
| D. +15 on the first marked day after an unmarked day, soft included; never day 1; once | PARTLY | `deriveEconomy.ts:117-128` is pure and derived, so replay and re-render give the same result. `EconomyFeedback.tsx:380` announces only on the 0 → >0 change, so once. Day 1 is guarded by `everMarked`. Misses a long gap that ends on the rest weekday (F3) |
| D. Repair unchanged | MET | Streak loop untouched |
| E. Starter lines, own words, canvas card with friend, line, "sent with NANDI" and link | MET | `soft.ts:30-36`, `kindCard.ts` |
| E. System share sheet, no contacts, nothing uploaded | MET | `shareOrDownload` → `@capacitor/share` / `navigator.share`; no contacts API anywhere in the diff |
| E. No XP for sharing, no share count | PARTLY | No share counter. The gentle choice gives the normal soft-day XP, as the spec allows, but a cancelled share still earns it on Android (F2) |
| F. ≥ 4 low days in 14 → care card, then at most every 14 days | PARTLY | `careCardDue` is correct and tested. Shown-once is only saved on tap (F5). Low days can be erased by F1 |
| F. Copy, Call 14416 (`tel:`), Not now; no diagnosis words; never a notification | MET | `SoftDay.tsx:99-102`. I could not re-check the number on telemanas.mohfw.gov.in (no internet here) |
| §4 New kinds `soft-start`, `soft` | MET | `repos/soft.ts` |
| §4 Kept on the phone, in backup | MET | Run: export → import into an empty DB kept both rows with all inputs (backup is a full-table dump, `backup/index.ts:154-163,202-226`) |
| §4 Deleted with account data | N/A | I found no delete-account flow in the app. Rows carry the standard `deleted` flag |
| §4 Privacy-notice line before DPDP (13 May 2027) | NOT MET | No privacy text changed. Not urgent (deadline May 2027) |
| §4 Notifications never mention soft days or mood | MET | Streak copy is "A task, movement, or a Mind moment is enough today." (`nudges.ts:64-65`) |
| §4 Today's streak reminder is cancelled once a soft day marks today | MET | Run: `wantedNudges` streak nudge for today 1 → 0 after a `soft` fact. Live re-sync happens through the ledger `liveQuery` (`reminderSync.ts:64`) |
| §4 Copy passes copy-lint | MET | copy-lint and banned-words both pass |
| §4 No new dependency; CSS/SVG only | MET | `package.json` unchanged |

## 4. Areas checked and found correct
- **Idempotent ledger ids**: `soft:<day>` is created once in a transaction (`repos/soft.ts:17-25`), and later gentle things add nothing. `deriveEconomy` de-duplicates by id. The only id problem is the `soft-start` overwrite (F1).
- **The 04:00 boundary**: run with `TZ=Asia/Kolkata`, a gentle thing at 02:30 on 4 Nov lands on dayKey `2026-11-03`, as it should.
- **Night rule**: soft facts are `mode: 'soft'`, not Mind, so the 0-XP-after-bedtime rule does not apply to them. The chip cannot start a soft day after bedtime.
- **Welcome-back is never doubled**: it is derived from facts on every call, so re-render, replay or restore give the same number. The toast is tied to the 0 → 15 change between two snapshots, and the first snapshot after load never announces.
- **Backup round trip** with soft rows: verified as above.
- **Inflation content**: the pack validates; the Gold review change (`flow.ts:44-47`) correctly draws from the full catalogue.
