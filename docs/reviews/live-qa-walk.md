# Live QA walk: first-time user on a phone

- **Site:** https://nandi.nandi11.workers.dev (live build, 22 Oct 2026 IST)
- **Device:** Playwright Chromium, 360×780, DPR 2, `isMobile`, `hasTouch`, Asia/Kolkata, fresh persistent profiles
- **Walks:**
  - **Day walk:** clock pinned to Thu 22 Oct 10:00 IST. Onboarding, Learn, Mind, Train, Tasks, You, then offline.
  - **Night walk:** real clock, 02:45 IST. Onboarding after bedtime, then the night routine.
- **Screenshots:** `docs/reviews/live-qa/` (40 PNGs, half size). File names below refer to that folder.
- **Method:** a tap-to-visible time is measured from the tap until the next screen's key element shows. Each number includes about 50–70 ms of Playwright overhead.
- **Scope:** app code was not changed. In two places I read the source, only to confirm a cause.

---

## Top 15 issues, ranked by how much they hurt on a phone

| # | Screen | Shot | What happens | Suggested fix |
|---|---|---|---|---|
| 1 | Plan → Add a task | `43-plan-3tasks.png`, `44-add-task-field.png` | **The second and third tasks are silently dropped.** I typed "call bank 15m" and pressed Enter: it was added. I typed "buy dal and rice" and pressed Enter: nothing happened, no error, and the text stayed in the box. The same happened for the third task. Cause (read in `src/ui/tasks/TaskQuickAdd.tsx`): the input submits through `form="plan-add-form"`, but that form only exists while `open` is true. `open` is set `onFocus` and cleared after the first add. The input keeps focus, so `open` never comes back. On a phone with the keyboard still up, this is exactly how people add tasks in a row. | Keep the form mounted (or don't clear `open`) after a successful add. Or call `setOpen(true)` in `onChange` as well as `onFocus`. Add an e2e test that adds 3 tasks in a row without blurring. |
| 2 | Plan (after the first task) | `43-plan-3tasks.png` | After the first add, a large "NOW" card (ring, 3 buttons, text) is inserted above the add box. This pushes "Add a task" down under the bottom tab bar (input at y≈746, tab bar top at 716). The box you just typed in disappears below the fold. | Keep quick-add at a fixed spot above the NOW card. Or scroll the input back into view after an add. |
| 3 | Mind → Board | `34-board.png`, `36-board-solved.png`, `73-offline-mind-board-notdone.png`, `74-offline-board.png` | The "Board" tile under **Today** opens an **Intro board** (6×6), not the daily board. After I solved it, Mind still says **Board: Not done**, and the Mind ring in the header stays empty. Tapping Board again opens a different 7×7 "Daily board". A first-time user believes they did today's puzzle and then sees it marked not done. | If the intro board is required, label it ("Warm-up board, then today's board") and go straight to the daily board when it is solved. Otherwise count the intro as today's board on day 1. |
| 4 | Onboarding at night | `62-night-after-onb.png`, `63-night-learn.png` | At 02:45 the last onboarding button still says **"Start a 2-minute drop"**. Tapping it shows "That's today's drop. Nothing to review tonight." A new user gets zero content, and the button broke its promise. Then Learn shows "Today's drop: Not started · **Start**", which contradicts what they just saw. | After bedtime, change the button to "Start my night routine" and send them to `#night`. Or show one gentle night card. Never label a button with something that won't happen. |
| 5 | Learn drop / Practice | `08-lesson-1.png`, `23-lesson-hook.png` | **There is no hook, teach step or example.** Both the first drop and "Practice" on a new idea open straight onto a quiz question ("Fill the gap", "Practise, adapt, then add a small new ___."). On a never-seen idea, the first thing the user does is guess. The explanation only appears in the feedback sheet after they answer. Duolingo-style "learn by guessing" needs at least one teaching card first. | Put a 1-screen hook or teach card before question 1 for any idea at 0 strength. Keep the quiz-first flow only for review. |
| 6 | Learn feedback sheet | `10-lesson-feedback.png` | After a wrong answer, the feedback sheet covers the other options, so you never see which answer was right. Only your wrong pick (red) stays visible. The sheet's "Good try" line also comes with a ✓ icon in the accessible text. | Mark the correct option in green above the sheet, or quote it in the sheet ("Right answer: Less than one basket"). Use a different icon for wrong answers. |
| 7 | Learn feedback (every question) | `10-lesson-feedback.png` | The same 3-sentence concept paragraph ("Inflation is a rise in the broad price level… A price jump for one snack alone is not the whole index.") is repeated under **every one of the 5 answers**. Questions 2 and 5 test the same point ("one price ≠ all prices"). By question 3 it reads as copy-paste. | Show the concept paragraph once (after Q1 or on the teach card). After that, show only the one-line per-question reason. Swap Q5 for a question on a different angle. |
| 8 | Drop / lesson header | `08-lesson-1.png`, `23-lesson-hook.png` | About 300 of 780 px go on chrome before the question: the app header with a 4-item mini nav, a "‹ Back" pill, "TODAY", a big "Today's drop" title, "1 / 5", a progress bar, then the mascot bubble. The question starts at y≈390. Practice has a different header ("← Practice · Leave") with its own counter. | In lesson mode, hide the top app header. Use one compact row (close ×, progress bar, count), like Duolingo. Drop the repeated "TODAY / Today's drop" title. |
| 9 | Whole app | `05-drop-1.png`, `28-mind.png`, `36-board-solved.png` | **Two navigations.** The top header has Plan/Train/Learn/Mind with status rings, and the bottom tab bar has Plan/Train/Learn/Mind/You. The top rings look like tabs but mean "done today". They aren't labelled, and they don't match the current screen: on Mind, the filled ring is Learn. | Remove the top mini nav, or turn it into a single clearly labelled "Today 2/4" chip. One nav only. |
| 10 | Train → first visit | `37-train.png`, `40-placement-1.png`, `41-placement-record.png` | The first Train screen reads **"RANK ASSESSMENT · ABOUT 10 MINUTES"**, then a form: track dropdown, 5 equipment checkboxes, barbell dropdown, training days, 7 day chips, rest-day chips and hot-day mode. Then "Movement 1 of 7" asks for a set of **Split squat at step 3/5** ("Record test"), with no warm-up step first. For a beginner this feels like an exam. It also starts mid-ladder, and "Stop if it hurts" is the only safety line. "Record test" is below the fold under the tab bar. | Rename it to "Find your starting point (optional)". Default to Hostel Bodyweight and hide equipment behind "I have equipment". Start at step 1 or 2 with a 2-minute warm-up. Pin the action button above the tab bar. Add one pre-check line ("Skip if you have pain, dizziness or an injury"). |
| 11 | Crowns board (6×6 and 7×7) | `34-board.png`, `74-offline-board.png` | The last board row sits under the bottom tab bar. Restart and Hint are below the fold. The hint ("Look at row 1.") prints below the board, off-screen, and the page jumps. On the 7×7 daily board, a full row is hidden behind the tab bar. | Size the board to fit `100dvh − header − tab bar − controls`. Hide the tab bar in puzzle mode. Show the hint as a toast near the top or over the board. |
| 12 | Case of the day | `29-case.png`, `30-case-grid.png`, `31-case-hint.png`, `33-case-closed.png` | The page is about 2,400 px long: story, clues, 3 grids, then the accusation form. The clues scroll away while you mark (the "Show clues while marking" toggle is collapsed by default). **Hint output and the "finish a grid first" error print at the very bottom, off-screen**, so tapping Hint looks like it did nothing. The culprit is picked with 3 native `<select>`s. "Show the solution" sits right next to "Accuse". "Case closed" is only visible if you scroll. | Make the clue strip sticky by default. Show hint and error text as a toast. Use 3 rows of chips instead of selects. Put "Show the solution" behind a confirm. Scroll to "Case closed" on success. |
| 13 | Board / case / drop finish | `36-board-solved.png`, `19-lesson-result.png` | Finishes are flat. The board vanishes and is replaced by a plain card ("Time 0:20 · **1 hints**"), so you never see your solved grid. There is no "Back to Mind" or next step, only Share. The drop result says "What improved: Inflation (strong)" after 4/5 with one wrong answer, and "Next review: 22 Oct", which is **today's date**. Practice gives "strong" after 3 questions on a brand-new idea. | Keep the solved board on screen with a short success animation, and add a primary "Done" button. Fix the plural. Don't call an idea "strong" on day 1. Schedule the first review for tomorrow or later, never today. |
| 14 | Onboarding length and redundancy | `01-welcome.png`, `03-onb-goals.png`, `04-onb-3.png`, `05-drop-1.png` | It takes 7 taps and 4 screens before the first question: welcome, "pick two goals", bedtime, then a **second** picker ("What do you want to get sharp at? Pick one or a few") whose Start button is below the fold and disabled until you pick. The goal picker seems to change nothing: I picked "Learn something" and "Sleep earlier", and Plan is still home. The bedtime copy "Before this time NANDI turns calm" reads backwards: it turns calm *after* that time. A splash shows for about 2 s on a cold start. | Drop either the goal picker or the topic picker. Default to one topic and let users change it later. Fix the copy to "After this time…". Use the goal picks to choose the first screen. |
| 15 | Plan → Move / task form | `47-task-form-open.png`, `48-task-move.png` | "Add a task" opens a 9-field form (size, minutes, category, priority, place, repeat, start time). All three tasks default to the same 11:00 am slot. Planning a task into a slot is only possible through **Move**, which defaults to **tomorrow 12:00**. The Move sheet asks for a postpone reason ("avoided it", "low energy"). So planning a task for today feels like confessing a postponement. | Hide the details behind "More options" and keep Enter = add. Place new tasks back to back in the next free slot. Add a plain "Plan for…" time picker on each row, separate from Move/postpone. |

---

## Per-mode notes

### First run / onboarding
- **Day walk:** 7 taps and 4 screens to the first question. Welcome (`01`) → goals (`03`) → bedtime (`04`) → topic picker (`05`) → drop.
- **Night walk (02:45):** the night routine (`#night`, "Tonight 1 of 6") is already mounted behind the welcome dialog. Onboarding ends on an empty "Nothing to review tonight" (`62`). The welcome is dark, but Learn after it is light at 02:45 (`63`).
- **Splash:** about 2.0–2.2 s from cold navigation until "Let's start" can be tapped (3 runs). Warm reload: about 250 ms.
- **Copy:** "Pick two. You can do everything later; this is just where we start." is fine. "Before this time NANDI turns calm" is backwards.
- **Topic picker:** "Start my first drop" is disabled and below the fold (y≈628 after scrolling). Nothing tells you that you must pick a topic first.

### Learn
- **Structure:** the drop is 5 quiz items on one idea (Inflation): fill the gap, pick best, what happens next, guess the number, pick best. There is no hook, teach or example card. Practice from a topic is 3 quiz items, also with no teach card (`23`).
- **Overflow:** every new question slides in with a brief horizontal overflow. `scrollWidth` is 373 px for about 1 s, then back to 360. On a real phone this can cause a sideways wobble or a horizontal pan.
- **Slider question (`14`):** there is no Check button until you move the slider. If your guess is the default (76%), you must nudge it away and back. The +/− buttons have accessible names ("A little more") but show only "+"/"−".
- **Disabled options:** after you pick an option, all options are disabled. You can't change your pick before tapping Check, which removes the usual "tap, rethink, tap again".
- **Unclear words:** "broad price level", "index" (never explained), "purchasing power", "Concepts touched", "Shards", "Unit chest", "Checkpoint · 4 ideas".
- **Topic path (`22`):** zig-zag cards. Card 3 is clipped at the right edge of its container. The idea title isn't tappable: only the small "Practice" button is, and it covers the title's hit area.
- **Result (`19`):** reachable without scrolling (Continue at y≈628, above the tab bar). "Next review: 22 Oct" equals today.
- **After Continue:** "Night drop · Not started · In your night cards" in the middle of the day is confusing.

### Mind
- **Tiles (`28`):** "Case" and "Board" look like flat grey labels, not buttons. "Board" doesn't say which puzzle it is.
- **Case grid:** the first tap marks × ("no"), the second ✓, the third clears. Without opening "How to play" you'd expect the first tap to mean "yes". The grid auto-fills × after a ✓, which is good. Solving took 17 grid taps plus 3 selects.
- **Case hint:** "Check the marked boxes in this grid." This is generic, and it appears off-screen.
- **Accuse with a partial grid:** "Finish a grid that fits every clue before accusing." Also off-screen. Forcing the full grid when the key clue alone gives the answer feels like homework.
- **After "Case closed" (`33`):** a story fragment card ("The clock's quiet hour… outline remains on a small wooden box") with no context.
- **Crowns:** see issues 3, 11 and 13. Hint "Look at row 1" highlights one cell with a thin blue border that is easy to miss (`35`).

### Train
- Issue 10 covers the main points.
- The form defaults look fine (Hostel Bodyweight, 3 days). Hot-day mode is a good idea but adds reading.
- I didn't record the set (no heavy step done). Leaving and coming back returned to "Set your starting line", so the placement progress isn't kept.

### Tasks / Plan
- **Plan is the default home**, even though I picked "Learn something" and "Sleep earlier".
- **Home card (`43`):** the "3 friends are busy with you today." courtyard card takes the top 230 px of Plan, and the line doesn't explain itself.
- **Add task:** issues 1, 2 and 15. Parsing "15m" from the title works ("15 minutes picked up from your task").
- **Focus (`50`):**
  - The timer shows 25:00 for a 15-minute task.
  - There are two back controls ("‹ Back" pill and "← Plan").
  - Pause, +10 min and Finish are below the fold.
  - After Finish, the screen immediately loads the *next* task with its own Start and Finish buttons (`51`), so a double tap could finish a task you never started.
  - The toast "+5 XP · You can set this down. · A new badge tier" overlaps the card.
  - The focus-cycle dropdown text is clipped ("25 min work / 5 min b").
- **Side quests:** "Keep your scroll app closed after bedtime for 5 nights", "+1" and "+5" chips. The meaning of "+1"/"+5" isn't clear.

### Night routine
- **Flow:** 6 cards (`64`, `65-*`), mostly clean, dark and calm. Good.
- **Card 2 "Night drop":** "Nothing to review tonight" for a new user. It's an empty card in a 6-card flow.
- **Card 3 "Think":** offers a **medium** Number Path board at 02:45. That conflicts with the "turns calm" promise.
- **Card 4 (`65-night-card4`):** the input placeholder is cut off ("Tomorrow's first ste|"). The input is only 172 px wide next to a text-style Save.
- **Card 6 (`65-night-card6`):**
  - Says "Lights-out time: 23:30" at 02:45, with no acknowledgement that the time has passed.
  - "Lights-out check-in" wraps to 2 lines inside its button.

### You / profile
- **Layout (`52`):** a lone peacock floats between the Courtyard and Level cards with no label.
- **Level card:** "45 XP in all / 55 XP to level 2" is fine. The streak card's "4 rest days banked · 4 more arrive on the 1st" is jargon on day 1.
- **Header rings:** on You, the header shows Plan and Learn filled and Mind empty, even though the case was solved (see issue 3).
- **Settings:** buried at the bottom ("Night plan, day and night, notifications, appearance, backup and about").

### Offline
- `context.setOffline(true)` then reload: the app opened from the service worker precache (`workbox-precache-v2`) in 22 ms. All 5 tabs rendered, the daily board opened, and adding a reminder offline worked. **No failures.**

---

## Timings (tap → next screen visible)

| Action | ms |
|---|---|
| Cold load → splash gone, "Let's start" tappable (3 runs) | 2198 / 1954 / 2018 |
| Warm reload → UI | ~245 |
| Offline reload → tab bar | 22 |
| Onboarding taps (Let's start, goals, Next, Start drop) | 92–135 |
| Pick topic / Start first drop | 83 / 90 |
| Lesson Check → feedback sheet | 92–115 |
| Lesson Next → next question | 70–111 |
| Last Next → result screen | 89 |
| Result Continue → Learn | 114 |
| Open topic / Practice | 92 / 94 |
| Tab switches (Mind, Train, Plan, You) | 46–71 |
| Open Case / Open Board | 90 / 75 |
| Start placement | 175 |
| Add task (1st) | 69 |
| Add task (2nd, 3rd) | **never; failed silently (5 s timeout)** |
| Add task after blur + refocus | 56 / 102 |
| Task Move sheet / Save new time | 104 / 96 |
| Start focus / Finish focus | 110 / 177 |
| Night card → next card | 87–131 |

Taps respond quickly everywhere. Nothing feels slow except the cold-start splash. The sense of slowness comes from scrolling: primary buttons and feedback are often below the fold.

## Console errors and failed requests

- Console errors and warnings: **none** in either walk.
- Failed requests or HTTP ≥ 400: **none**, online or offline.
- Horizontal scroll at 360 px: **none at rest**. There is a transient 373 px `scrollWidth` during each lesson question's slide-in.
- Tap targets under 44 px: **none found** on Plan, Learn, Mind, Case, Board, Train, You or Focus.
- Text cut off:
  - Focus-cycle select ("25 min work / 5 min b").
  - Night card 4 placeholder ("Tomorrow's first ste").
  - Topic path card 3 clipped at the right edge (`22`).
  - "Lights-out check-in" wraps inside its button.
