# Quiet mode inventory (cloud job 2, job 7)

Base: `origin/ship-27` at `b17ec403a85f871b4cb315a5d6da4d2676409767` (22 Oct 2026).
Every file:line below is from that commit.
Method: I read the code and grepped it (script in §7). I did not run the app.
So every count here is a count of code sites, not a runtime measurement.
The four behaviour findings in §3 come from reading the code, not from running it.

## 1. Do people actually ask for this? (outside sources)

The premise was "users of Imprint, NYT Games, Headway and Brilliant ask to switch
game layers off". I could not find a published, quotable request from users of
those four apps. Here is what I found:

| App / source | What it says | URL |
|---|---|---|
| Brilliant help: streaks | "Your streak is the number of consecutive days you've learned on Brilliant." "If no protection applies, your streak resets to 0." The page has no setting to hide or turn off streaks. | https://brilliant.org/help/features/what-is-a-streak |
| Brilliant help: leagues | Section headings are only "What are Leagues and leaderboards?" and "League levels". It has no text on opting out. | https://brilliant.org/help/features/what-are-leagues-and-leaderboards |
| Brilliant help: leagues FAQ | Redirects to `brilliant.org/help-redirect/...`. I did not follow it. A search snippet says you join a League automatically when you first earn XP in a week. | https://help.brilliant.org/en/articles/6399120-leagues-faq |
| Uxcel feedback board (learning app with leagues) | Post titled "League completion is unsatisfying - should be able to opt out". It says the mobile leaderboard opt-out "doesn't seem to work". 2 votes. | https://feedback.uxcel.com/p/league-completion-is-unsatisfying-should-be-able-to-opt-out |
| Calm users (Substack, 2 Jan 2025) | "They turn the streak feature off because seeing it stresses them out." The source is the author's Facebook group for Calm users. | https://caitlinmccoll.substack.com/p/streaks-yay-or-nay |
| Google Play Games (official) | "You can turn off streaks at any time in your settings." … "Toggle off Game streaks enabled." | https://support.google.com/googleplay/answer/16562031 |
| Elevate (official) | The page "How do I turn off Leagues" exists but returned HTTP 403 to me. I have not quoted it. | https://support.elevateapp.com/hc/en-us/articles/45864890332699-How-do-I-turn-off-Leagues |
| NYT Games | I found no NYT page about hiding streaks. The Connections help page says archive play changes your stats but not your streak. A research note on GitHub cites two Reddit threads about "the anxiety caused by mandatory daily streaks" and marks them "qualitative/anecdotal". | https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/28525912587924-Connections , https://github.com/Squackle/deep-cuts-edh/issues/37 |
| Imprint | Reviews describe XP, badges and streaks as motivating. I found no request to turn them off. | https://nibble-app.com/blog/imprint-review |
| Headway | I found no help page or review about switching streaks off. | (none found) |
| Reddit | WebFetch is blocked for reddit.com, so I could not read any Reddit threads. | — |

What this means: there is demand for switching off streaks and leagues, and
large products ship such a switch (Google Play Games, Elevate). But for the four
named apps I found no first-hand evidence. Treat "users ask for it" as a
plausible reason, not a proven one.

## 2. Inventory: every game-layer surface

The "Hidden today by" column covers these existing controls only:
- **Motion**: Settings → Appearance → Motion = Reduced (`Ground.tsx:100`, stored as `motion`, applied as `html[data-motion]` by `useAppearance.ts:33`), or the OS reduced-motion setting.
- **Sound**: "Soft check-off sounds", key `economy.soundOn`, default **off** (`Ground.tsx:101`). It is checked in `sound.ts:20`.
- **Night**: after bedtime or shutdown, or on the night deck.
- **Soft day**: a tired or low day (`You.tsx:36`, `Plan.tsx:92`).
- **Reveal**: a meter stays hidden until it means something (`core/economy/reveal.ts:13-24`).

There is **no** setting that hides points, levels, seasons, badges or Shards.
There is **no** haptics setting.

"Quiet" is my recommendation for Quiet mode: **Hide**, **Keep**, or **Plain** (keep it, but drop the game words or the motion).

### A. Pop-ups, toasts and overlays

`EconomyFeedback` is always mounted (`AppShell.tsx:190`).

| # | Surface | File:line | When it shows | Hidden today by | Quiet |
|---|---|---|---|---|---|
| 1 | Finish toast "+N XP · warm line" with a cast figure | `FinishMoment.tsx:7`; triggered at `EconomyFeedback.tsx:110-151` | A task is done, a workout is logged, a case is solved, the daily board is solved or the daily drop is finished | Motion removes only the bloom (`economy.css:67-68`). Not hidden after bedtime (see F1). | Hide. Each screen already confirms in place ("Task done." `Plan.tsx:84`, the puzzle result card, the Learn stop screen). |
| 2 | XP count-up inside the toast | `EconomyFeedback.tsx:153-163` | With #1 | Nothing. It ignores reduced motion (F2). | Hide (goes with #1) |
| 3 | Night-deck finish toast | `EconomyFeedback.tsx:52-61`; fired by `NightDeck.tsx:31` | When the night deck finishes | After bedtime it returns early (`:54`) | Hide |
| 4 | Level-up / tier promotion, full-screen ("Level N · X XP", Mor cheering, Skip) | `EconomyFeedback.tsx:123,136,176` | Real-world action, before bedtime, at most `RULES.juice.macroPerDayMax` a day | Motion turns it into a fade (`economy.css:56-57`) | Hide |
| 5 | Season-end reveal on first open ("Season N · tier", "+N Shards") | `EconomyFeedback.tsx:81-92,176` | First open of a new season, before shutdown | Nothing | Hide. Do not set its `seen` key while quiet. |
| 6 | Rest-bank notice "Your rest bank covered yesterday…" | `EconomyFeedback.tsx:72-78` | First load after a rest day was used | Nothing | Hide |
| 7 | Badge / "Monthly challenge complete" suffix on the toast | `EconomyFeedback.tsx:39,100-108` | A `badge-tier` or `monthly-challenge` fact lands | Nothing | Hide |
| 8 | Welcome-back gift "Here is a small gift…" (+XP count) | `EconomyFeedback.tsx:127-134` | First marked day after a miss | Nothing | Plain: "Welcome back." with no gift or XP |
| 9 | "Done for today" card | `FinishMoment.tsx:10-12`; `EconomyFeedback.tsx:126,138-142,174` | All four Today dots are done, before bedtime, once a day | Motion removes the bloom | **Keep**. This is the stopping screen the product wants. Show it static. |
| 10 | Opening splash (Nandi + wordmark, 1.1 s) | `OpenMoment.tsx:10-21`; `AppShell.tsx:190` | Cold start | Motion, night and the app-pause card (`OpenMoment.tsx:8`, `cast.css:23-24`) | Hide |

### B. Learn

| # | Surface | File:line | When it shows | Hidden today by | Quiet |
|---|---|---|---|---|---|
| 11 | Combo pill "N in a row" | `LearnDrop.tsx:251,259` | 3+ right answers in a row | Motion stops only the rise (`learn.css:155`) | Hide |
| 12 | Glowing "hot" progress bar | `LearnDrop.tsx:259`; `learn.css:153-154` | Combo of 3 or more, not at night | Night | Hide |
| 13 | Correct / combo / "idea" / tick sounds | `LearnDrop.tsx:147,164` | Each answer and each press | Sound (off by default), motion, night deck (`sound.ts:20`) | Hide |
| 14 | Buzz on a right answer | `LearnDrop.tsx:150` | Right answer, not at night | Motion and night | Hide |
| 15 | Press buzz (8 ms) | `LearnDrop.tsx:165`, `StepLesson.tsx:49` | Every option press | Motion | Keep. It is input feedback, not a reward. |
| 16 | Right-answer flash, bounce, shake | `learn.css:24,179-182` | Each answer | Motion and night (`learn.css:226-236`) | Keep under Motion. It is answer feedback. |
| 17 | Finish burst (marigold petals and diya sparks) | `LearnDrop.tsx:233,297-305` | Drop finished on this screen, not at night | Motion (`learn.css:231,236`) | Hide |
| 18 | Friends hopping on the stop screen | `LearnDrop.tsx:234`; `learn.css:198-200` | Same as #17 | Motion stops the hop, but the figures stay | Hide |
| 19 | Count-up stats (questions / right / ideas) | `LearnDrop.tsx:237,288-295`; `useCountUp.ts:6-21` | Same as #17 | Motion shows the final number at once | Plain: static numbers. These are learning results. |
| 20 | "Perfect drop · +N XP" | `LearnDrop.tsx:238` | Every answer right in the daily drop | Nothing | Hide |
| 21 | Gold review copy ("Gold review complete", "Gold is yours") | `LearnDrop.tsx:233,235` | Finishing a gold review | Nothing | Plain: "Review complete. That idea is holding well." Keep the review itself, because it is spaced retrieval. |
| 22 | "Gold" state and "Gold review" button on the mastery map | `Learn.tsx:96` | A concept is Mastered | Nothing | Plain: "Check it holds" |
| 23 | "Unit chest · Opened · N Shards" and a cheering checkpoint cast on the mastery map | `Learn.tsx:96` | Always, on an expanded topic | Nothing | Hide the chest row and the Shards. Keep the checkpoint text. |
| 24 | "Unit complete" scene with all six friends, plus the chest sound | `Learn.tsx:43-52`; `UnitScene.tsx:7-16` | First visit to Learn after a unit's ideas are learned | Motion (JS check `Learn.tsx:47` and `cast.css:30-31`) | Hide |
| 25 | Cast figure reacting (cheer / think) on each question | `LearnDrop.tsx:258,261`; `StepLesson.tsx:61,68` | Every question | Motion stops the animation (`cast.css:11-12`) | Keep the figure, always in idle pose (decision for Jenil, §6) |
| 26 | Mastery map, "N of M ideas strong", 30-day recall | `Learn.tsx:86-104` | Always | — | **Keep** (the person asked for this progress) |

### C. You tab and economy screens

| # | Surface | File:line | When it shows | Hidden today by | Quiet |
|---|---|---|---|---|---|
| 27 | Level badge, "Level N", XP total, XP bar, "N XP to level" | `EconomyScreens.tsx:70` | Always on You | Soft day (`You.tsx:37`) | Hide |
| 28 | Season card: "#rank of 500", tier, "+N places this week", rival "N SP away", "View the ladder" | `EconomyScreens.tsx:71-75` | Season active, or 7 days before it starts | Reveal (`reveal.ts:19`) and soft day | Hide |
| 29 | Ladder screen "500 seats" | `EconomyScreens.tsx:82-88`; route `AppShell.tsx:158` | `#you/season` | — | Hide the links. The route keeps working. |
| 30 | Streak card: "N day streak", rest days banked, gold stripe, paused / Hat-trick repair text | `EconomyScreens.tsx:76` | Always on You | Soft day | Hide. Move "Plan days away" (`EconomyScreens.tsx:27-53`) to Settings → Day and night. |
| 31 | Clean Week "N of 4 Hat-tricks" with dots | `EconomyScreens.tsx:77` | 7 or more days after the first fact | Reveal and soft day | Hide |
| 32 | Shards balance and Shop button | `EconomyScreens.tsx:78` | Shards above 0 or any purchase | Reveal and soft day | Hide |
| 33 | Shop screen | `EconomyScreens.tsx:90-110`; route `AppShell.tsx:159` | `#you/shop` | — | Hide the links. Owned themes stay applied (`useAppearance.ts:26`). Owned puzzle packs stay in Mind practice (`Mind.tsx:426`). |
| 34 | Daily quests "Three small invitations · N Shards each", "Focus boost · 2× XP" timer | `GamifyScreens.tsx:10-20`; `You.tsx:38` | After the first fact | Reveal and soft day | Hide |
| 35 | Badges link and Badges screen (Bronze / Silver / Gold, monthly challenge) | `You.tsx:38`; `GamifyScreens.tsx:22-31`; route `AppShell.tsx:160` | After the first badge | Reveal | Hide |
| 36 | Mor or Kachhua figure on the season block | `EconomyScreens.tsx:69` | With #27 | Soft day | Hide (goes with the block) |
| 37 | "This week in words", six-stat hexagon, recap share | `You.tsx:39-40`; `HexagonCard.tsx` | Always / after 7 days | — | **Keep** (no points in either) |

### D. Courtyard and storybooks

| # | Surface | File:line | When it shows | Hidden today by | Quiet |
|---|---|---|---|---|---|
| 38 | Courtyard banner at the top of Plan | `Plan.tsx:93`; `Courtyard.tsx:57-64` | Always on Plan (not on a soft day) | Motion stops the ambient animation (`courtyard.css:46-47`) | Hide |
| 39 | Courtyard screen: stages "N of 5", "N more days adds X", neem tree | `Courtyard.tsx:77-93`; link `You.tsx:37` | Always | — | Hide the links. The route keeps working. |
| 40 | Storybook card on Plan, Sunday and Monday ("Six friends tell you…") | `Storybook.tsx:60-66`; `Plan.tsx:93` | Sunday and Monday | — | Hide |
| 41 | Storybook list and pages | `Storybook.tsx:31-57`; `You.tsx:37`; `Courtyard.tsx:91` | After the first partial week | Reveal (`reveal.ts:23`) | Hide |
| 42 | Soft-day lantern ("Kachhua lit a lantern for today") and "+N XP" gift line | `SoftDay.tsx:132-133` | Soft-day finish | — | Plain: "That counts. You can stop here." Keep "Welcome back." but drop the XP. |
| 43 | Soft-day finish buzz (15 ms) | `SoftDay.tsx:127` | Soft-day finish | Nothing (F3) | Hide |

### E. Train and Mind

| # | Surface | File:line | When it shows | Hidden today by | Quiet |
|---|---|---|---|---|---|
| 44 | Exercise-complete pulse and ✓ | `Workout.tsx:88,99,111`; `train.css:66-70` | Last set of an exercise | Motion (pulse only) | Keep the ✓, because it shows state |
| 45 | Exercise-complete buzz | `Workout.tsx:89` | Same as #44 | Nothing (F3) | Hide |
| 46 | "New best" plus a gold "PR" pill | `Workout.tsx:98`; `train.css:72` | A rep or load record | — | **Keep** (real strength progress the person asked for) |
| 47 | Puzzle result: time, hints, best, par | `Mind.tsx:397` | Board solved | — | **Keep** |
| 48 | "No-hint clear" stamp | `Mind.tsx:397`; `mind.css:149` | Solved with no hints | — | Hide |
| 49 | "New technique card" | `Mind.tsx:397`; `CaseScreen.tsx:190` | First time a technique is used | — | **Keep** (learning content) |
| 50 | "Best times" list and friend challenge "Beat their time." | `Mind.tsx:394,424` | Any solve / a shared challenge link | — | **Keep** (the person opened the challenge) |
| 51 | "0 XP" copy: "After bedtime, Mind earns 0 XP.", "Practice boards · 0 XP", "It earns 0 XP." | `economyVisibility.ts:9` (used at `Reviews.tsx:54`, `LessonPlayer.tsx:46`); `Mind.tsx:426`; `MorningBackfill.tsx:22` | Night Mind, practice list, morning check-in | — | Plain. `nightMindNote(false)` already returns "Mind is resting for the night." |

### F. Sounds, haptics and notifications (cross-cutting)

| # | Surface | File:line | When it shows | Hidden today by | Quiet |
|---|---|---|---|---|---|
| 52 | Finish / level-up sound | `EconomyFeedback.tsx:144-145` | With #1 and #4 | Sound (off by default), motion, bedtime | Hide |
| 53 | Finish buzzes (20 ms; [30,50,30] for "Done for today") | `EconomyFeedback.tsx:59,133,143` | With #1, #3, #8 and #9 | Only `:59` checks bedtime. None check motion (F1, F3). | Hide the reward buzzes |
| 54 | "Streak reminder" notification (title "A small step still counts") | `core/nudges.ts:59-66`; toggle `Ground.tsx:120` | Opt-in, default off, before wind-down | Night window rules | Keep the behaviour, because the person chose it. Rename the toggle to "Evening small-step reminder". |
| 55 | Today dots in the top bar | `TodayDots.tsx:20-30` | Always | — | **Keep** (plan progress, and they feed "Done for today") |
| 56 | Side quests on Plan and Tasks | `Plan.tsx:102`; `Tasks.tsx:36` | Always | — | **Keep**. They earn quest XP silently (`deriveEconomy.ts:113`) but show no points, only offline suggestions. |
| 57 | The person's own focus reward ("chai or a short walk") | `Today.tsx:48`; `Ground.tsx:97` | After a focus block, if enabled | Its own toggle | **Keep** (the person asked for it) |

Not found:
- There is **no Hat-trick pop-up**. "Hat-trick" appears only as text in the streak and Clean Week cards (`EconomyScreens.tsx:76-77`). It also adds +30 XP inside day totals (`rules.config.ts:133`).
- The only "combo pop-up" is the pill in #11.

### Counts (from the table)

| Recommendation | Rows |
|---|---|
| Hide | 36 |
| Plain (keep, drop game words or motion) | 6 |
| Keep | 15 |
| Total surfaces | 57 |

The scan script (§7) finds 64 matching code lines across `src/ui`. Some rows above cover several lines.

What existing controls already hide:
- Motion fully hides 3 surfaces: #10, #17 and #24.
- The sound setting hides 3: #13, #24's chest sound and #52.
- Soft day and reveal hide parts of the You tab (#27-#36).
- The night rule covers Learn juice and the macro reveal.

Nothing today hides #1, #4, #5, #7, #20, #23, #27 (outside soft days), #38, #40 or #48.

## 3. Findings on the way (behaviour, not Quiet mode)

**F1: after bedtime a finished task or workout still buzzes and shows "+N XP".**
- `EconomyFeedback.tsx:120` computes `afterBedtime`. It is used only to block the macro reveal (`:136`) and the sound (`:145`).
- The buzz at `:143` and the toast at `:151` still fire.
- The comment at `:53` says "After bedtime nothing celebrates: no buzz, no toast". `CLAUDE.md` says Tasks and Train still count after bedtime but go uncelebrated.
- The night route makes this rare: after shutdown the app opens `#night`. It is still reachable, for example by ticking a task from the Plan tab after bedtime.
- Fix sketch: after the bookkeeping at `:137-142`, add `if (afterBedtime) return;` before `:143`.
- Found by reading; I did not reproduce it.

**F2: the XP count-up ignores reduced motion.**
- `EconomyFeedback.tsx:153-163` always runs the `requestAnimationFrame` count from 0.
- `useCountUp.ts:9` shows how to do it right.
- Fix: `if (reduced()) { setShownXp(notice.gain); return; }`.

**F3: haptics have no off switch, and 5 of the 8 call sites ignore Motion.**
- The ones that ignore it: `EconomyFeedback.tsx:59,133,143`, `Workout.tsx:89`, `SoftDay.tsx:127`.
- The Learn ones respect Motion: `LearnDrop.tsx:150,165` and `StepLesson.tsx:49`.
- `tapHaptic(enabled, …)` in `platform/haptics.ts:4` already takes a flag, but every caller passes `true`.

**F4: `economyVisibleFrom` cannot be reused as the Quiet switch.**
- Spec 05 §1 says the UI hides the economy until that date.
- In practice `AppShell.tsx:108-114` sets it to today on first run, and only `Mind.tsx:101` reads `economyVisible()`.
- `deriveEconomy.ts:69-71` uses the date to pick the first scored day, so changing it would change derived numbers.
- Quiet mode needs its own key.

**F5: `reconcileGamify` lives inside the celebration component.**
- It is the only writer of these facts: `perfect-drop`, `learn-drop`, `daily-quest`, `focus-boost`, `unit-chest`, `badge-tier`, `monthly-challenge`, `welcome-back` and `tomorrow-plan`.
- It runs at `EconomyFeedback.tsx:67`, and the facts are written in `data/repos/gamify.ts:13-48`.
- If Quiet mode unmounts `EconomyFeedback`, those facts stop being written.
- That would quietly lose XP and Shards.
- The welcome-back fact is recorded "once shown, so a later sync can never take it away" (`gamify.ts:36`), so losing it would let a later sync take the gift away.
- So Quiet mode must suppress only what `EconomyFeedback` renders, never mount it conditionally. A cleaner long-term fix is to move `reconcileGamify` into an always-on hook in `AppShell`.

## 4. Quiet mode: the outline

### The switch
- **Key:** `ui.quiet`, a boolean, default `false`.
  - It is a state row with a natural key, written through `createSettingsRepos(...).settings.put`, so it carries `updatedAt`, `deleted` and `deviceId`.
  - It is not in `deviceLocalKeys` (`data/backup/index.ts:198`), so it travels in backups like `theme` does.
  - No schema change and no migration.
  - It is a preference, not a tunable number, so `rules.config.ts` is not involved.
  - **Never read it in `src/core/economy`.**
- **Where:** Settings → Appearance card (`Ground.tsx:98-102`), under Motion and sounds:
  - Label: **Quiet mode**
  - Help line: "Hides points, levels, seasons, badges and celebrations. Your learning, plan and progress stay. Everything keeps counting, so turning it off shows all you've earned."
- **Second entry point:** a text button at the foot of the You progress block, "Hide points and levels", which sets the same key. Settings shows the way back.
- **How screens read it:** a `useQuiet()` live hook, plus `document.documentElement.dataset.quiet = 'on'`, set in `useAppearance` next to `data-motion`. CSS-only hides and non-React code (`sound.ts`) can then check it the same way they check motion.

### What it hides
- All pop-ups and toasts: #1-#8 and #10.
- "Done for today" (#9) stays, shown static with no buzz.
- XP, Level, Season, ladder, Streak, Clean Week, Shards, Shop, Daily quests, Focus boost and Badges on You: #27-#36.
- The courtyard banner, storybook card, courtyard and storybook links: #38-#41.
- Learn juice: #11-#14, #17, #18, #20, #23, #24.
- The puzzle "No-hint clear" stamp (#48).
- Reward sounds (#13, #52, the chest sound) and reward buzzes (#14, #43, #45, #53).
- XP words in copy: #8, #21, #22, #42, #51. Use the plain variants listed above.

### What stays
- Learning:
  - every lesson, drop, review and gold review (renamed);
  - right/wrong feedback text and the "See the idea" panel;
  - the mastery map, "N of M ideas strong" and 30-day recall;
  - technique cards.
- Plan:
  - tasks, the Now card, the focus timer and the person's own focus reward;
  - side quests, rituals, reminders and nudges;
  - Today dots and the "Done for today" stopping card.
- Progress the person asked for:
  - workout history, "New best" and PR;
  - puzzle time, best and par, and friend challenges;
  - "This week in words", the hexagon and the recap share.
- Night rules, the soft-day flow (minus lantern and XP words), backups.
- Owned cosmetic themes stay applied. Owned puzzle packs stay playable.
- Routes `#you/season`, `#you/shop`, `#you/badges`, `#you/courtyard` and `#you/stories` still open if someone deep-links. Only the links into them are hidden. No route throws.

### What must not break
1. **The ledger keeps recording.** Quiet mode never touches `src/data/repos/*` writes or `deriveEconomy`.
   - `reconcileGamify` keeps running (F5).
   - Perfect drop, daily quests, Focus boost 2× XP, badges, unit chests and the welcome-back gift still earn, silently.
   - Season SP and rank keep moving.
2. **Turning it off shows everything earned.** Level, XP, Shards, badges, rank and owned items read straight from `deriveEconomy`, which never changed.
   - No retroactive pop-ups beyond the normal rules.
   - The season-end reveal (#5) did not mark its `localStorage` key while quiet, so it may show once on the next open. It still obeys `macroPerDayMax` and the shutdown check.
3. **Streak honesty.** The rest bank auto-covers missed days (`deriveEconomy.ts:215`), so a quiet person is not penalised for not seeing it.
   - A streak can still pause while quiet. On turning quiet off, the existing copy ("A new run starts with one small action.") must stay neutral.
   - Do not add any "you lost" line.
4. **Days away must stay reachable.** Move `AwayPlanner` to Settings → Day and night. Otherwise a quiet person cannot plan a trip.
5. **Backup round-trip.** Add a test: set `ui.quiet`, export, wipe, import, and check that the value is back and the ledger row count is unchanged.
6. **Night rule unchanged.** Quiet mode only removes things. It never adds a buzz or sound at night.
7. **Banned words and theme.** New copy must pass `npm run banned-words`. No shaming: "Quiet mode" is never framed as "missing out".

### Smallest build (estimate, not measured)
- About 12 files touched:
  - `useAppearance.ts`, `Ground.tsx`, `EconomyFeedback.tsx`, `FinishMoment.tsx`, `sound.ts`
  - `You.tsx`, `EconomyScreens.tsx`, `Plan.tsx`, `Learn.tsx`, `LearnDrop.tsx`
  - `SoftDay.tsx`, `Workout.tsx`, `Mind.tsx`
- Roughly 100-150 lines.
- Plus one unit test for a pure `quietCopy()` helper and one Playwright test (below).
- F1-F3 are separate one-to-three-line fixes and should land first.

### Test sketch (Playwright, 390×844)
```ts
test('quiet mode hides the game layer but keeps counting', async ({ page }) => {
  await page.goto('/#you/settings');
  await page.getByLabel('Quiet mode').check();
  await page.goto('/#plan');
  await expect(page.locator('.courtyard-banner')).toHaveCount(0);
  await addAndCompleteTask(page, 'Buy milk');            // helper from tests/e2e
  await expect(page.locator('.economy-toast')).toHaveCount(0);
  const xp = await page.evaluate(async () => (await window.__nandiDebug.economy()).totalXp); // or read via Dexie
  expect(xp).toBeGreaterThan(0);                          // still earned
  await page.goto('/#you');
  await expect(page.getByText(/Level \d+/)).toHaveCount(0);
  await page.goto('/#you/settings');
  await page.getByLabel('Quiet mode').uncheck();
  await page.goto('/#you');
  await expect(page.getByText(`${xp.toLocaleString()} XP in all`)).toBeVisible();
});
```
`__nandiDebug` does not exist. Read the ledger through `indexedDB` in `page.evaluate`, or check the You text after unquieting.

## 5. Should the scheduled-nudge copy change? (no)
- The streak reminder body is "A task, movement, or a Mind moment is enough today." (`nudges.ts:65`). It has no game words.
- Only the toggle label in Settings says "Streak reminder". Rename it in Quiet mode, or everywhere.

## 6. Questions for Jenil (product trade-offs)
1. Default off, with the switch in Settings? Or ask once in Welcome ("Points and levels: show / keep it quiet")? I suggest Settings only, plus the one You link, so Welcome stays short.
2. Are the Courtyard and Storybooks a game layer (hide them) or calm progress (keep them)? I listed them as Hide because they grow with practice days and add objects.
3. Should the cast figures stay in Learn as illustration (idle pose only), or go too?
4. Should Quiet mode also set "Soft check-off sounds" off, or just ignore it while on? I suggest ignoring it, so the person's sound choice survives turning quiet off.

## 7. Re-run the scan
Script kept at `/tmp/cj2/job7-tools/scan.sh` (not in the repo):
```bash
#!/usr/bin/env bash
# Usage: scan.sh <repo root>. Lists game-layer call sites in src/ui (tests excluded).
cd "$1" || exit 1
echo "commit: $(git rev-parse HEAD)"
q() { echo "== $1"; grep -rnE "$2" src/ui --include=*.ts --include=*.tsx | grep -v '\.test\.' | cut -d: -f1,2 | sort -u; }
q "haptics (tapHaptic calls)" "tapHaptic\("
q "sounds (playCastSound calls)" "playCastSound\("
q "XP / Shards / SP shown in copy" "XP\b|Shards|\bSP\b"
q "level / season / ladder / shop / badges routes" "go\('you/(season|shop|badges|courtyard|stories)'\)"
q "unit chest / gold labels" "Unit chest|Gold review|Gold is yours"
q "count-up / burst / scenes" "useCountUp\(|FinishBurst|UnitScene|OpenMoment|FinishMoment|DoneForToday"
```
Output at `b17ec40`: 64 lines in total.
- 8 `tapHaptic` calls.
- 5 `playCastSound` lines: 4 calls plus the definition.
- 18 lines with XP, Shards or SP. Two are false positives: a comment at `Mind.tsx:108`, and `Learn.tsx:96` is the unit chest.
- 7 `go('you/…')` links.
- 5 unit chest or gold lines.
- 21 count-up, burst or scene lines (imports included).
