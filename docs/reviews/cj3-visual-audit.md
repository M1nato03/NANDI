# Cloud job 3.1 · Every lesson screen at phone width

Branch `ideas/cj3-visual-audit`. Batch 3, job 1. Date: 23 Oct 2026.
Build: `origin/ship-32` at `dab36b3` (the batch says ship-32 wherever the job says ship-31).

## Short answer
- **No layout breaks in the lesson visuals.** At both 360×800 and 390×844, across 2,868 measured screens:
  no sideways scroll, nothing past the screen edge, no overlapping text, no cut-off labels,
  no scale dots on top of each other, no tap target under 44 px.
  The cj2 problems with scale diagrams (labels overprinting, page widening) are gone on ship-32.
- **One real layout problem: the feedback sheet hides answers.** After you tap an answer on a hook or a guided try,
  the sticky feedback sheet sits on top of the last option. On **20 steps at 360×800** that option is the
  **right answer with its ✓**, so the learner reads "Good try. Here is the idea." and cannot see which answer was right
  unless they think to scroll. 46 flagged screens in all, 45 of them at 360×800 (table below).
- **One content/data bug found on the way (not visual): duplicate ids.** Health and nutrition and Body and training both
  have a concept `sleep-recovery` with steps `sleep-recovery-s1..s3` and items `sleep-recovery-9..14`.
  The app looks steps up across all topics and takes the first match, so the three Health and nutrition sleep lessons
  **never show**. The Body and training lessons show in their place. See "Duplicate ids" below.

## Coverage
- **162 steps in content** (6 topics: psychology 30, money-markets 30, how-things-work 30, health-nutrition 24,
  body-training 24, history-civilisations 24). Every step has 1 guided try. Visuals: 54 flow, 73 compare, 35 scale.
- **159 steps measured** at each viewport. The 3 not measured are the Health and nutrition `sleep-recovery-s1..s3`:
  the app cannot show them (duplicate ids). Their Body and training twins were measured.
- 9 screens per step, each measured and screenshotted:

| # | Screen | What was tapped to get there |
|---|---|---|
| 1 | hook | nothing |
| 2 | hook sheet | the hook option with the **longest feedback** (worst case for sheet height); ties go to a wrong option |
| 3 | teach card (title, text, visual) | Continue |
| 4 | show me | Continue |
| 5 | show me sheet | a wrong part (same feedback text as the right part) |
| 6 | guided try | Continue |
| 7 | guided try with hint open | Show hint |
| 8 | guided sheet | the guided option with the longest feedback |
| 9 | finish screen, "Today's idea" card (takeaway + the same visual) | Done |

- 159 × 9 × 2 = 2,862 screens, plus 6 hook screens of the duplicate-id steps = **2,868 measured**.
  All 2,868 screenshots are in `/tmp/cj3/job1-scratch/shots-*` (116 MB, not committed); the 46 flagged ones and 2 extra are committed.

## Method
- Production build (`npm ci && npm run build`), served with `npx vite preview --port 5401 --strictPort`. Playwright 1.63, its own Chromium
  from `/opt/pw-browsers`. Context: `isMobile`, `hasTouch`, `Asia/Kolkata`, `en-IN`, light theme, motion on.
  Clock fixed with `page.clock.setFixedTime` at Thu 5 Nov 2026, 7:30 pm IST (before bedtime).
- **No owner or content review screen exists on ship-32.** `#you/owner` (`src/ui/screens/OwnerPanel.tsx`) shows lesson
  metrics only. So I drove Learn, but not the way `ideas/cj2-lesson-walk` did (one drop per simulated day would need
  27+ days per topic):
  1. Real first run: 18+ tick, "Learn something", "Start your first lesson". This makes the real daily drop row.
  2. For each step, rewrite that row in IndexedDB (`learnDrops`, id `drop:daily:2026-11-05`) to a lesson-only drop for the step:
     `{ items: [{ itemId: 'lesson:<step>', conceptId, optionOrder: [], mode: 'new', lesson: '<step>' }], cursor: 0 }`.
     This is exactly what `makeDrop` (`src/ui/learn/flow.ts:47-50`) gives a new learner with nothing earlier, so the last
     guided button reads "Done", as on day 1. Mid-course drops say "Your turn" instead; same size.
  3. Reload `#learn/drop`, wait for the launch splash (`.cast-open`, about 1.5 s) to go, then play the real `StepLesson` by tapping.
- Each measurement waits 650 ms for the slide and sheet animations. What is measured on every screen (code at the end):

| Check | How |
|---|---|
| Sideways scroll | `documentElement.scrollWidth` and `body.scrollWidth` vs `innerWidth` |
| Past the edge | any visible element inside `.learn-drop` with `left < 0` or `right > innerWidth`. Needed because the app clips overflow: an injected 68-character no-wrap line did **not** raise `scrollWidth`, but this check caught it |
| Overlapping text | every text line box (`Range.getClientRects`) against every other; flagged when two from different text nodes overlap > 2 px each way |
| Covered text | `elementFromPoint` at the middle of each on-screen line; flagged when something else is on top. A bottom tab bar over text you can scroll up is not counted |
| Scale dots | the numbered dots on a scale bar overlapping > 4 px |
| Cut-off text | any block with its own text where `scrollWidth > clientWidth`, or `scrollHeight > clientHeight` when overflow is not visible or line-clamped |
| Tap targets | every enabled visible `button`, `a[href]`, `input`, `select`, `[role=button]`, `summary`, in the lesson and the app chrome, under 44 px either way (each line box for inline buttons) |
| First answer | top of the first `.learn-options` button (hook, guided) or `.step-part` (show me), in page pixels; plus the bottom of the last one |

- **Self-test.** Injecting a no-wrap line, a clipped box, two overlapping labels and a 30 px button into a real hook screen
  fired the past-edge, cut-off, overlap, covered and tap-target checks (`selftest.cjs`). The clean screen fired none.
- Load: shared 4-CPU machine, load average 3.5 to 6.4 during the runs (`uptime`). Geometry does not depend on load. No timings are reported.

## Totals per problem

| Problem | 360×800 | 390×844 | Distinct steps |
|---|---|---|---|
| Sideways scroll / past the edge | 0 | 0 | 0 |
| Overlapping text | 0 | 0 | 0 |
| Cut-off text | 0 | 0 | 0 |
| Scale dots overlapping | 0 | 0 | 0 |
| Tap target < 44 px (lesson or chrome) | 0 | 0 | 0 |
| **Right answer (✓) hidden under the feedback sheet** | **22** | 0 | **20** |
| Tapped option hidden under the feedback sheet | 8 | 0 | 8 |
| A wrong option hidden under the feedback sheet | 15 | 1 | 15 |
| **All flagged screens** | **45** | **1** | 39 |

- By screen: hook sheet 22, guided sheet 24 (23 + 1). The show-me sheet, teach cards, hints and finish cards: 0.
- By topic (360×800): psychology 13 (+1 at 390), money-markets 4, how-things-work 5, health-nutrition 2, body-training 13, history-civilisations 8.
- By visual on the flagged steps: compare 20, flow 17, scale 9. The visual is not the cause; the sheet is.
- "Hidden" means the middle of a text line is under the sheet. An option that is only partly covered (its ✓ or its bottom line) is not counted,
  so these are lower bounds. On 45 of 318 answer sheets at 360×800, some option text is under the sheet; at 390×844, 1 of 318.

## Where the first answer sits
Page pixels from the top. Nothing needs scrolling to reach the first option, and on every hook and guided screen the last option ends above the fold.

| Screen | Viewport | First option top: min / median / max | Last option bottom: min / median / max | Last option below fold |
|---|---|---|---|---|
| hook | 360×800 | 348 / 400 / 452 | 548 / 600 / 675 | 0 of 162 |
| hook | 390×844 | 350 / 404 / 448 | 550 / 604 / 664 | 0 of 162 |
| guided | 360×800 | 406 / 458 / 510 | 606 / 658 / 732 | 0 of 159 |
| guided | 390×844 | 408 / 462 / 517 | 608 / 662 / 717 | 0 of 159 |
| show me (first tappable part) | 360×800 | 298 / 321 / 344 | 390 / 496 / 572 | 0 of 159 |
| show me | 390×844 | 298 / 298 / 344 | 390 / 473 / 557 | 0 of 159 |

- The first answer starts at about half the screen height. Above it: the app header (72 px), "Back", "New idea",
  the progress bar and the friend's speech bubble take about 300 px before the question even starts.
- That stack is why the sheet covers options: on a guided try the options end at y ≈ 660-730 of 800,
  and the sheet (150-220 px tall, sticky at the bottom) starts at y ≈ 570-650.

## Other observations (not flagged by the checks)
- **Teach card Continue below the fold.** At 360×800 the teach page is taller than the screen on 34 of 159 steps, all long flows
  or long compare cards (worst: `upi-path-s2`, `phone-camera-s1`, `shares-s1`; visual ends at y = 791 of 800, Continue at ≈ 800-850).
  On 44 teach cards the page also opens already scrolled down by up to 52 px, so the header is half cut
  ([example](cj3-visual-audit/how-things-work--upi-path-s2--3-teach--360x800.png)). At 390×844: 2 of 159.
  Not a defect (it scrolls), but the Continue button is out of sight on 1 in 5 teach cards on a small phone.
- **Finish card under the tab bar.** On 15 of 159 finish screens at 360×800 (7 at 390×844) the "Today's idea" visual runs under the bottom
  tab bar on first view. It scrolls clear, so it is not counted.
- **Blank page after reload.** 7 of about 330 reloads showed a blank page (no splash, no text) for 15 s; a second reload worked every time.
  Probably the harness (fixed clock plus repeated reloads on a loaded machine), but worth a look if anyone sees a blank start on a phone.
- **Preview server restart.** My first preview server hit the tool's 30-minute limit mid-run and was restarted 3-4 minutes later.
  The app kept rendering from its cache in that window; the only effect was 2 page errors at 360×800
  ("Failed to fetch dynamically imported module" for `track.drone-tech` and `topic.history-civilisations` chunks). No step failed or was skipped because of it.
- Not covered: dark mode, offline, the motion toggle, practice questions and their sheets, Gold review. Geometry is the same in dark mode;
  contrast was not checked. The practice-question sheet uses the same sticky rule, so it probably hides answers too (not measured).

## The sheet problem: cause and fix sketch
- Cause: `src/ui/learn/learn.css:286`
  `.learn-drop.learn-active:not(.learn-night) .learn-sheet { position: sticky; bottom: calc(8px + env(safe-area-inset-bottom)); z-index: 5; }`.
  The sheet comes after the options in the DOM. When the page is taller than the screen, sticky pins it over the lowest options.
  `StepLesson.tsx` never scrolls when the sheet opens. `LearnDrop.tsx:98-103` does call `scrollIntoView({ block: 'end' })` on the sheet button
  for practice questions, but a sticky element is already "in view", so that call does nothing either.
- Fix options (pick one):
  1. When a sheet opens, scroll the page to the end (`document.scrollingElement.scrollTo({ top: scrollHeight })`), so the sheet sits in its
     normal place under the options. One line in `StepLesson` `pick()` and in `LearnDrop` `answer()`.
  2. Keep it sticky but add bottom padding to `.learn-q` equal to the sheet height while a sheet is open, then scroll to the end.
  3. Shrink the stack above the question during a lesson (header + Back + "New idea" + bar + bubble ≈ 300 px at 360 px wide);
     this alone gets most 360×800 cases off the list.
- Check after the fix: re-run `audit.cjs 360x800`; the three "hidden under the sheet" counts should be 0.

## Duplicate ids (found while driving Learn)
- `content/topics/topic.health-nutrition.json:2215` and `content/topics/topic.body-training.json:1422` both define concept `sleep-recovery`.
  Shared ids: concept `sleep-recovery`, steps `sleep-recovery-s1`, `-s2`, `-s3`, items `sleep-recovery-9` to `-14`.
  - Health and nutrition steps: "What sleep does for you" (scale), "Sleep comes in cycles" (flow), "What makes falling asleep easier" (compare).
  - Body and training steps: "Sleep is when the body repairs" (flow), "Short sleep drags down your game" (compare), "Short sleep turns up hunger" (flow).
- `LearnDrop.tsx:69` builds one catalog from all topics; `findStep` (`src/core/learn/steps.ts:13`) and `findItem` (`src/ui/learn/flow.ts:19`)
  return the first match, which is Body and training. A Health and nutrition learner who reaches sleep gets the Body and training lesson
  ([screenshot](cj3-visual-audit/health-nutrition--sleep-recovery-s1--ERROR--360x800.png): the hook asks "Why might a coach call sleep part of training?").
- Side effects to expect (not tested): one `learnConcepts` row (`id: sleep-recovery`) holds mastery for both topics; a `learn-lesson` fact
  for `sleep-recovery-s1` marks it taught in both; item answers for `sleep-recovery-9..14` mix.
- `scripts/validate-packs.ts:13` checks duplicate pack ids only, not concept, step or item ids across packs.
- Fix: rename one topic's ids (for example `sleep-health` in Health and nutrition). That is a content and possibly migration change
  (learners may already have rows keyed `sleep-recovery`), so it needs a backup round-trip test. Add a cross-pack uniqueness check to `validate-packs`.

## Every flagged screen
The hidden text is the start of the option that sits under the sheet. All links are in `docs/reviews/cj3-visual-audit/` (PNG8, 128 colours, 48 files, 0.99 MB).

| # | Topic | Step | Visual | Screen | Viewport | Problem | Hidden text | Screenshot |
|---|---|---|---|---|---|---|---|---|
| 1 | psychology | anchoring-s1 | flow | guided sheet | 360x800 | A wrong option hidden under the feedback sheet | Its shoes must be better made.… | [png](cj3-visual-audit/psychology--anchoring-s1--8-guided-sheet-right--360x800.png) |
| 2 | psychology | anchoring-s1 | flow | guided sheet | 390x844 | A wrong option hidden under the feedback sheet | Its shoes must be better made.… | [png](cj3-visual-audit/psychology--anchoring-s1--8-guided-sheet-right--390x844.png) |
| 3 | psychology | anchoring-s2 | scale | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | The random figure pulled her guess up.… | [png](cj3-visual-audit/psychology--anchoring-s2--8-guided-sheet-wrong--360x800.png) |
| 4 | psychology | anchoring-s2 | scale | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Yes, guesses drift toward it.… | [png](cj3-visual-audit/psychology--anchoring-s2--2-hook-sheet-wrong--360x800.png) |
| 5 | psychology | anchoring-s3 | flow | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | It cuts the pull but does not erase it.… | [png](cj3-visual-audit/psychology--anchoring-s3--8-guided-sheet-wrong--360x800.png) |
| 6 | psychology | confirmation-bias-s2 | flow | guided sheet | 360x800 | A wrong option hidden under the feedback sheet | His numbers were too large.… | [png](cj3-visual-audit/psychology--confirmation-bias-s2--8-guided-sheet-right--360x800.png) |
| 7 | psychology | habits-s2 | scale | guided sheet | 360x800 | A wrong option hidden under the feedback sheet | Yes, once she has one habit, new ones st… | [png](cj3-visual-audit/psychology--habits-s2--8-guided-sheet-right--360x800.png) |
| 8 | psychology | loss-aversion-s1 | compare | guided sheet | 360x800 | A wrong option hidden under the feedback sheet | Yes, since the bet is fair.… | [png](cj3-visual-audit/psychology--loss-aversion-s1--8-guided-sheet-right--360x800.png) |
| 9 | psychology | loss-aversion-s2 | compare | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Just the start point in the wording.… | [png](cj3-visual-audit/psychology--loss-aversion-s2--8-guided-sheet-wrong--360x800.png) |
| 10 | psychology | planning-fallacy-s1 | compare | hook sheet | 360x800 | Tapped option hidden under the feedback sheet | They were about right.… | [png](cj3-visual-audit/psychology--planning-fallacy-s1--2-hook-sheet-wrong--360x800.png) |
| 11 | psychology | sleep-memory-s2 | compare | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Sara.… | [png](cj3-visual-audit/psychology--sleep-memory-s2--8-guided-sheet-wrong--360x800.png) |
| 12 | psychology | sleep-memory-s2 | compare | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | The group that slept.… | [png](cj3-visual-audit/psychology--sleep-memory-s2--2-hook-sheet-wrong--360x800.png) |
| 13 | psychology | social-proof-s2 | scale | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | No, some stay with what they hear.… | [png](cj3-visual-audit/psychology--social-proof-s2--8-guided-sheet-right--360x800.png) |
| 14 | psychology | spotlight-effect-s1 | compare | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | She guesses more noticed than really did… | [png](cj3-visual-audit/psychology--spotlight-effect-s1--8-guided-sheet-right--360x800.png) |
| 15 | money-markets | compounding-s3 | compare | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | The ₹500 and the date.… | [png](cj3-visual-audit/money-markets--compounding-s3--8-guided-sheet-right--360x800.png) |
| 16 | money-markets | diversification-s1 | compare | guided sheet | 360x800 | Tapped option hidden under the feedback sheet | Meera, since one firm is easier to watch… | [png](cj3-visual-audit/money-markets--diversification-s1--8-guided-sheet-wrong--360x800.png) |
| 17 | money-markets | shares-s3 | flow | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | No set payout; it may pay less, or nothi… | [png](cj3-visual-audit/money-markets--shares-s3--8-guided-sheet-wrong--360x800.png) |
| 18 | money-markets | upi-scams-s2 | compare | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Refuse, since no one needs your PIN.… | [png](cj3-visual-audit/money-markets--upi-scams-s2--2-hook-sheet-right--360x800.png) |
| 19 | how-things-work | battery-flight-time-s1 | flow | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Double the energy, or halve the power.… | [png](cj3-visual-audit/how-things-work--battery-flight-time-s1--8-guided-sheet-right--360x800.png) |
| 20 | how-things-work | battery-flight-time-s2 | compare | guided sheet | 360x800 | Tapped option hidden under the feedback sheet | About 4 times.… | [png](cj3-visual-audit/how-things-work--battery-flight-time-s2--8-guided-sheet-wrong--360x800.png) |
| 21 | how-things-work | ceiling-fans-s1 | flow | hook sheet | 360x800 | A wrong option hidden under the feedback sheet | Cool air made inside the motor.… | [png](cj3-visual-audit/how-things-work--ceiling-fans-s1--2-hook-sheet-right--360x800.png) |
| 22 | how-things-work | ceiling-fans-s2 | flow | hook sheet | 360x800 | A wrong option hidden under the feedback sheet | The spinning blades block the warm sunli… | [png](cj3-visual-audit/how-things-work--ceiling-fans-s2--2-hook-sheet-wrong--360x800.png) |
| 23 | how-things-work | phone-camera-s3 | scale | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | The phone boosted a weak signal.… | [png](cj3-visual-audit/how-things-work--phone-camera-s3--2-hook-sheet-right--360x800.png) |
| 24 | health-nutrition | hydration-cues-s1 | scale | guided sheet | 360x800 | Tapped option hidden under the feedback sheet | She is right; plain water is the one dri… | [png](cj3-visual-audit/health-nutrition--hydration-cues-s1--8-guided-sheet-wrong--360x800.png) |
| 25 | health-nutrition | protein-foods-s2 | compare | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Each covers the other's gap.… | [png](cj3-visual-audit/health-nutrition--protein-foods-s2--2-hook-sheet-right--360x800.png) |
| 26 | body-training | cardio-talk-test-s3 | flow | hook sheet | 360x800 | Tapped option hidden under the feedback sheet | Vigorous, to catch up on the missed week… | [png](cj3-visual-audit/body-training--cardio-talk-test-s3--2-hook-sheet-wrong--360x800.png) |
| 27 | body-training | food-labels-s2 | compare | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | How much mango pulp is inside, as a %.… | [png](cj3-visual-audit/body-training--food-labels-s2--2-hook-sheet-right--360x800.png) |
| 28 | body-training | food-labels-s3 | scale | hook sheet | 360x800 | Tapped option hidden under the feedback sheet | The weight of the whole biscuit serving.… | [png](cj3-visual-audit/body-training--food-labels-s3--2-hook-sheet-wrong--360x800.png) |
| 29 | body-training | heat-hydration-s3 | flow | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Call an ambulance and move them somewher… | [png](cj3-visual-audit/body-training--heat-hydration-s3--8-guided-sheet-right--360x800.png) |
| 30 | body-training | muscle-protein-rest-s1 | compare | hook sheet | 360x800 | A wrong option hidden under the feedback sheet | Both the same, since the food is the sam… | [png](cj3-visual-audit/body-training--muscle-protein-rest-s1--2-hook-sheet-wrong--360x800.png) |
| 31 | body-training | muscle-protein-rest-s2 | scale | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | About 112 g.… | [png](cj3-visual-audit/body-training--muscle-protein-rest-s2--8-guided-sheet-wrong--360x800.png) |
| 32 | body-training | muscle-protein-rest-s3 | flow | guided sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Better to rest them while the building g… | [png](cj3-visual-audit/body-training--muscle-protein-rest-s3--8-guided-sheet-right--360x800.png) |
| 33 | body-training | progressive-overload-s1 | flow | guided sheet | 360x800 | A wrong option hidden under the feedback sheet | He needs a few months of full rest to gr… | [png](cj3-visual-audit/body-training--progressive-overload-s1--8-guided-sheet-right--360x800.png) |
| 34 | body-training | progressive-overload-s1 | flow | hook sheet | 360x800 | Tapped option hidden under the feedback sheet | You are doing them faster and sloppier.… | [png](cj3-visual-audit/body-training--progressive-overload-s1--2-hook-sheet-wrong--360x800.png) |
| 35 | body-training | progressive-overload-s2 | compare | hook sheet | 360x800 | A wrong option hidden under the feedback sheet | Do them faster, even if your form slips.… | [png](cj3-visual-audit/body-training--progressive-overload-s2--2-hook-sheet-wrong--360x800.png) |
| 36 | body-training | showing-up-s2 | flow | hook sheet | 360x800 | A wrong option hidden under the feedback sheet | A workout whenever you happen to feel in… | [png](cj3-visual-audit/body-training--showing-up-s2--2-hook-sheet-right--360x800.png) |
| 37 | body-training | showing-up-s3 | compare | guided sheet | 360x800 | Tapped option hidden under the feedback sheet | A double-length session to catch up.… | [png](cj3-visual-audit/body-training--showing-up-s3--8-guided-sheet-wrong--360x800.png) |
| 38 | body-training | warmup-myths-s3 | scale | hook sheet | 360x800 | A wrong option hidden under the feedback sheet | Yes, it prevents most injuries in sport … | [png](cj3-visual-audit/body-training--warmup-myths-s3--2-hook-sheet-right--360x800.png) |
| 39 | history-civilisations | ashoka-edicts-s1 | flow | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Carve them on stone near busy routes.… | [png](cj3-visual-audit/history-civilisations--ashoka-edicts-s1--2-hook-sheet-right--360x800.png) |
| 40 | history-civilisations | ashoka-edicts-s2 | compare | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | No, the script changed with the region.… | [png](cj3-visual-audit/history-civilisations--ashoka-edicts-s2--2-hook-sheet-right--360x800.png) |
| 41 | history-civilisations | independence-constitution-s1 | compare | hook sheet | 360x800 | A wrong option hidden under the feedback sheet | One leader, working alone at a desk for … | [png](cj3-visual-audit/history-civilisations--independence-constitution-s1--2-hook-sheet-right--360x800.png) |
| 42 | history-civilisations | indian-place-value-s3 | flow | hook sheet | 360x800 | A wrong option hidden under the feedback sheet | Both names mean one place.… | [png](cj3-visual-audit/history-civilisations--indian-place-value-s3--2-hook-sheet-right--360x800.png) |
| 43 | history-civilisations | indus-cities-s2 | flow | guided sheet | 360x800 | A wrong option hidden under the feedback sheet | A well, since lanes held water, not drai… | [png](cj3-visual-audit/history-civilisations--indus-cities-s2--8-guided-sheet-right--360x800.png) |
| 44 | history-civilisations | mughal-revenue-s2 | compare | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | With rights to the revenue of an area.… | [png](cj3-visual-audit/history-civilisations--mughal-revenue-s2--2-hook-sheet-right--360x800.png) |
| 45 | history-civilisations | printing-and-reading-s1 | compare | guided sheet | 360x800 | A wrong option hidden under the feedback sheet | One woodblock for all 20 pages.… | [png](cj3-visual-audit/history-civilisations--printing-and-reading-s1--8-guided-sheet-right--360x800.png) |
| 46 | history-civilisations | silk-road-ideas-s2 | compare | hook sheet | 360x800 | Right answer (✓) hidden under the feedback sheet | Trade through the mountain passes.… | [png](cj3-visual-audit/history-civilisations--silk-road-ideas-s2--2-hook-sheet-wrong--360x800.png) |

## Scripts (in /tmp/cj3/job1-scratch, not in the repo)
- Build and serve from a worktree of `origin/ship-32`: `npm ci && npm run build`, then `npx vite preview --port 5401 --strictPort`.
- Run: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node audit.cjs 360x800` and `... 390x844` (both at once, about 25 min each).
  It writes `results-<vp>.json` and one PNG per screen. `analyse.cjs` prints the totals and the first-answer table from the JSON.
- Compressing: `convert in.png -strip -colors 128 -define png:compression-level=9 PNG8:out.png`.

### audit.cjs
```js
// Job 1 (batch 3): every lesson screen at phone width.
// Run: node audit.cjs <width>x<height> [stepId ...]   (vite preview of origin/ship-32 on :5401)
// Real first run (18+ tick, "Learn something"), then for each of the 162 steps the day's drop row is
// rewritten to a lesson-only drop for that step (the same shape a brand-new learner's first drop has),
// the page is reloaded, and the real StepLesson is played: hook, hook sheet, teach, show, show sheet,
// guided, guided hint, guided sheet, and the finish screen's "Today's idea" card.
const { chromium } = require('/tmp/cj3/job1/node_modules/playwright');
const fs = require('fs');
const ROOT = '/tmp/cj3/job1';
const BASE = 'http://localhost:5401/';
const [vw, vh] = (process.argv[2] || '360x800').split('x').map(Number);
const only = process.argv.slice(3);
const VP = `${vw}x${vh}`;
const OUT = `/tmp/cj3/job1-scratch/shots-${VP}`;
fs.mkdirSync(OUT, { recursive: true });
const TOPICS = ['psychology', 'money-markets', 'how-things-work', 'health-nutrition', 'body-training', 'history-civilisations'];
const steps = TOPICS.flatMap(topic => {
  const p = JSON.parse(fs.readFileSync(`${ROOT}/content/topics/topic.${topic}.json`, 'utf8'));
  return p.body.modules.flatMap(m => m.concepts).flatMap(c => (c.steps || []).map(s => ({ ...s, topic, conceptId: c.id })));
}).filter(s => !only.length || only.includes(s.id));
const DAY = new Date('2026-11-05T19:30:00+05:30'); // Thu, 7:30 pm IST: before bedtime, inside the share window

// Runs in the page. Returns geometry facts for the current screen.
function measure() {
  const vwid = innerWidth, vhgt = innerHeight;
  const root = document.querySelector('.learn-drop');
  const name = el => (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''));
  const visible = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; } return true; };
  const out = { scrollY: Math.round(scrollY), docSW: document.documentElement.scrollWidth, bodySW: document.body.scrollWidth, vw: vwid, vh: vhgt, docSH: document.documentElement.scrollHeight };
  // 1. horizontal overflow: page scroll width, and any element poking past the screen edge
  out.hScroll = out.docSW > vwid || out.bodySW > vwid;
  out.offscreen = [];
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('.learn-burst')) continue; // finish-screen petals are decoration and fly off on purpose
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || !visible(el)) continue;
    if (r.right > vwid + 0.5 || r.left < -0.5) out.offscreen.push({ el: name(el), left: Math.round(r.left), right: Math.round(r.right), text: (el.innerText || '').slice(0, 60) });
  }
  // 2. overlapping text: line boxes of different text nodes that intersect by more than 2 px each way
  const texts = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim() || !visible(n.parentElement) || n.parentElement.closest('[aria-hidden=true]:not(.step-scale-mark)')) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) texts.push({ node: n, el: n.parentElement, r, text: n.textContent.trim().slice(0, 40) });
  }
  out.overlaps = [];
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]; if (a.node === b.node) continue;
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ox > 2 && oy > 2) out.overlaps.push({ sheet: !!(a.el.closest('.learn-sheet')) !== !!(b.el.closest('.learn-sheet')), a: `${name(a.el)} "${a.text}"`, b: `${name(b.el)} "${b.text}"`, ox: Math.round(ox), oy: Math.round(oy), top: Math.round(Math.min(a.r.top, b.r.top)) });
  }
  // 2b. text that something else is painted over (sticky sheet, tab bar, header): hit-test the middle of each on-screen line box
  out.covered = [];
  const nav = document.querySelector('nav.tabbar'); const navTop = nav ? nav.getBoundingClientRect().top : vhgt;
  out.navTop = Math.round(navTop);
  for (const t of texts) {
    const cx = (t.r.left + t.r.right) / 2, cy = (t.r.top + t.r.bottom) / 2;
    if (cy < 0 || cy > vhgt || cx < 0 || cx > vwid) continue;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || t.el.contains(hit) || hit.contains(t.el)) continue;
    // the same button (inline step-part) or a decorative cast/burst layer is fine
    if (hit.closest('.learn-burst')) continue;
    const by = hit.closest('.learn-sheet, nav, header, .learn-drop-head, .learn-progress') || hit;
    // A bottom tab bar over text you can still scroll up into view is normal; only count it when the page cannot scroll that far.
    if (by.tagName === 'NAV' && navTop > vhgt / 2 && t.r.bottom - navTop <= out.docSH - vhgt - scrollY) continue;
    const answer = t.el.closest('.learn-options button');
    out.covered.push({ text: `${name(t.el)} "${t.text}"`, by: name(by), y: Math.round(cy), sheet: !!by.classList?.contains('learn-sheet'), answer: answer ? (answer.classList.contains('right-option') ? 'right' : answer.classList.contains('selected') ? 'picked' : 'other') : null });
  }
  // 2c. scale dots that sit on each other
  out.markOverlaps = [];
  const marks = [...root.querySelectorAll('.step-scale-mark')].map(m => ({ t: m.textContent, r: m.getBoundingClientRect() }));
  for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) {
    const ox = Math.min(marks[i].r.right, marks[j].r.right) - Math.max(marks[i].r.left, marks[j].r.left);
    if (ox > 4 && Math.abs(marks[i].r.top - marks[j].r.top) < 10) out.markOverlaps.push({ a: marks[i].t, b: marks[j].t, ox: Math.round(ox) });
  }
  // 3. text cut off: content wider/taller than its box
  out.cut = [];
  for (const el of root.querySelectorAll('*')) {
    if (!visible(el) || el.closest('.learn-burst')) continue;
    const cs = getComputedStyle(el); if (cs.display === 'inline' || !el.clientWidth) continue;
    if (![...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) continue;
    const w = el.scrollWidth - el.clientWidth, h = (cs.overflowY !== 'visible' || cs.webkitLineClamp !== 'none') ? el.scrollHeight - el.clientHeight : 0;
    if (w > 1 || h > 1) out.cut.push({ el: name(el), w, h, overflow: cs.overflowX, ellipsis: cs.textOverflow, text: el.textContent.trim().slice(0, 60) });
  }
  // 4. tap targets under 44 px (enabled, visible). Lesson ones and app chrome are kept apart.
  out.small = [];
  for (const el of document.querySelectorAll('button, a[href], input, select, [role=button], summary')) {
    if (el.disabled || !visible(el)) continue;
    const rects = el.tagName === 'BUTTON' && getComputedStyle(el).display === 'inline' ? [...el.getClientRects()] : [el.getBoundingClientRect()];
    for (const r of rects) {
      if (!r.width || !r.height) continue;
      if (r.width < 44 || r.height < 44) out.small.push({ el: name(el), w: Math.round(r.width), h: Math.round(r.height), inLesson: root.contains(el), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40) });
    }
  }
  // 5. where the first answer sits
  const opts = [...root.querySelectorAll('.learn-options button, .step-part')].map(e => e.getBoundingClientRect());
  if (opts.length) {
    out.firstOptionTop = Math.round(Math.min(...opts.map(r => r.top)) + scrollY);
    out.firstOptionBottom = Math.round(Math.min(...opts.map(r => r.bottom)) + scrollY);
    out.lastOptionBottom = Math.round(Math.max(...opts.map(r => r.bottom)) + scrollY);
  }
  const fb = root.querySelector('.learn-sheet');
  if (fb) { const r = fb.getBoundingClientRect(); out.sheet = { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) }; const b = fb.querySelector('button'); if (b) out.sheetBtnBottom = Math.round(b.getBoundingClientRect().bottom); }
  const vis = root.querySelector('.step-visual'); if (vis) { const r = vis.getBoundingClientRect(); out.visual = { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), w: Math.round(r.width) }; }
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: true, hasTouch: true, timezoneId: 'Asia/Kolkata', locale: 'en-IN' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.clock.setFixedTime(DAY);
  await page.goto(BASE);
  const w = page.getByRole('dialog', { name: 'Welcome to NANDI' });
  await w.getByLabel("I'm 18 or older.").check();
  await w.getByRole('button', { name: "Let's start" }).click();
  await w.getByRole('button', { name: 'Learn something' }).click();
  await w.getByRole('button', { name: /first lesson|Start/ }).first().click();
  await page.locator('.step-lesson').waitFor({ timeout: 20000 });
  const dbName = await page.evaluate(async () => (await indexedDB.databases()).map(d => d.name).find(n => /nandi/i.test(n)));
  const results = [];
  const prevFile = `/tmp/cj3/job1-scratch/results-${VP}.progress.json`;
  try { results.push(...JSON.parse(fs.readFileSync(prevFile)).results.filter(r => !r.error)); } catch {}
  const done = new Set(results.map(r => r.step));
  const lessonPhase = () => page.evaluate(() => document.querySelector('.step-lesson')?.getAttribute('data-lesson-phase') ?? (document.querySelector('.learn-stop') ? 'stop' : 'none'));
  const settle = () => page.waitForTimeout(650);
  for (const s of steps) {
    const resultsFile = `/tmp/cj3/job1-scratch/results-${VP}${only.length ? '-partial' : ''}.json`;
    if (done.has(s.id)) continue;
    const prepare = async () => {
    // Seed: the day's drop becomes a lesson-only drop for this step (what makeDrop gives a learner with nothing earlier).
      await page.evaluate(async ({ dbName, s }) => {
        const db = await new Promise((res, rej) => { const o = indexedDB.open(dbName); o.onsuccess = () => res(o.result); o.onerror = rej; });
        const id = `drop:daily:2026-11-05`;
        const store = db.transaction('learnDrops', 'readwrite').objectStore('learnDrops');
        const row = await new Promise(r => { const q = store.get(id); q.onsuccess = () => r(q.result); });
        row.drop = { id, items: [{ itemId: `lesson:${s.id}`, conceptId: s.conceptId, optionOrder: [], mode: 'new', lesson: s.id }], cursor: 0, ending: { kind: 'stopping-screen' } };
        row.updatedAt = Date.now();
        await new Promise(r => { const tx = db.transaction('learnDrops', 'readwrite'); tx.objectStore('learnDrops').put(row); tx.oncomplete = r; });
        db.close();
      }, { dbName, s: { id: s.id, conceptId: s.conceptId } });
      await page.goto(BASE + '#learn/drop'); await page.reload();
      await page.waitForTimeout(300); // the launch splash (.cast-open) mounts after load and stays ~1.5 s
      await page.waitForFunction(() => document.querySelector('.step-lesson') && !document.querySelector('.cast-open'), null, { timeout: 15000 });
  
    };
    let prepared = false;
    for (let attempt = 1; attempt <= 3 && !prepared; attempt++) {
      try { await prepare(); prepared = true; } catch (e) {
        await page.screenshot({ path: `${OUT}/${s.topic}--${s.id}--PREPARE-FAIL-${attempt}.png` });
        console.log('PREPARE RETRY', s.id, attempt, e.message.split('\n')[0], JSON.stringify(await page.evaluate(() => ({ hash: location.hash, dialogs: [...document.querySelectorAll('[role=dialog]')].map(d => d.getAttribute('aria-label') || d.className), text: document.body.innerText.slice(0, 200) }))));
      }
    }
    if (!prepared) { console.log('SKIP', s.id); continue; }
    const rec = { topic: s.topic, step: s.id, visual: s.visual.kind, screens: [] };
    results.push(rec);
    const grab = async label => {
      await settle();
      const m = await page.evaluate(measure);
      m.label = label;
      const smallLesson = m.small.filter(x => x.inLesson);
      m.flags = [];
      if (m.hScroll) m.flags.push('h-scroll');
      if (m.offscreen.length) m.flags.push('past-edge');
      if (m.overlaps.some(o => !o.sheet)) m.flags.push('text-overlap');
      if (m.covered.some(c => c.answer === 'right')) m.flags.push('right-answer-under-sheet');
      if (m.covered.some(c => c.answer === 'picked')) m.flags.push('picked-answer-under-sheet');
      if (m.covered.some(c => c.answer !== 'right' && c.answer !== 'picked')) m.flags.push('text-covered');
      if (m.markOverlaps.length) m.flags.push('scale-dots-overlap');
      if (m.cut.length) m.flags.push('text-cut');
      if (smallLesson.length) m.flags.push('small-target');
      m.shot = `${s.topic}--${s.id}--${label}.png`;
      await page.screenshot({ path: `${OUT}/${m.shot}` });
      rec.screens.push(m);
      return m;
    };
    const continueIn = async (scope, name) => { const before = await lessonPhase(); await scope.getByRole('button', { name, exact: true }).click(); await page.waitForFunction(b => (document.querySelector('.step-lesson')?.getAttribute('data-lesson-phase') ?? (document.querySelector('.learn-stop') ? 'stop' : 'none')) !== b, before, { timeout: 15000 }); };
    const longestFeedback = q => [...q.options].sort((a, b) => b.feedback.length - a.feedback.length || Number(a.correct) - Number(b.correct))[0];
    try {
      await page.locator('[data-lesson-phase=hook]').waitFor({ timeout: 15000 });
      await grab('1-hook');
      const h = longestFeedback(s.hook);
      await page.locator('.learn-options').getByRole('button', { name: h.text, exact: true }).click();
      await grab(`2-hook-sheet-${h.correct ? 'right' : 'wrong'}`);
      await continueIn(page.locator('.learn-feedback'), 'Continue');
      await grab('3-teach');
      await continueIn(page.locator('.step-lesson'), 'Continue');
      await grab('4-show');
      const wrongPart = s.example.parts.find(x => x !== s.example.spot);
      await page.locator('.step-part', { hasText: (wrongPart ?? s.example.spot).trim() }).first().click();
      await grab('5-show-sheet');
      await continueIn(page.locator('.learn-feedback'), 'Continue');
      await grab('6-guided');
      await page.getByRole('button', { name: 'Show hint' }).click();
      await grab('7-guided-hint');
      const g = longestFeedback(s.guided[0]);
      await page.locator('.learn-options').getByRole('button', { name: g.text, exact: true }).click();
      await grab(`8-guided-sheet-${g.correct ? 'right' : 'wrong'}`);
      await continueIn(page.locator('.learn-feedback'), 'Done');
      await page.locator('.learn-stop .step-today').waitFor({ timeout: 15000 });
      await page.waitForTimeout(900); // count-up and petals
      await grab('9-finish-card');
    } catch (e) {
      rec.error = e.message.split('\n')[0];
      await page.screenshot({ path: `${OUT}/${s.topic}--${s.id}--ERROR.png` });
      console.log('ERROR', s.id, rec.error);
    }
    // keep only flagged screenshots
    for (const m of rec.screens) if (!m.flags.length) m.shotUnflagged = true; // all shots kept in scratch; only flagged ones are committed
    fs.writeFileSync(prevFile, JSON.stringify({ vp: VP, errors, results }));
    console.log(VP, s.topic, s.id, rec.screens.map(m => `${m.label.split('-')[0]}:${m.flags.join('+') || 'ok'}`).join(' '));
  }
  fs.writeFileSync(`/tmp/cj3/job1-scratch/results-${VP}${only.length ? '-partial' : ''}.json`, JSON.stringify({ vp: VP, errors, results }, null, 1));
  console.log('page errors', errors.length, errors.slice(0, 5));
  await browser.close();
})();
```
