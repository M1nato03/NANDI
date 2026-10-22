# 18 · First run: one honest screen, one choice, a win in under a minute

Status: idea engine (jenil-8c), 22 Oct 2026. Small. Evidence: the live phone QA walk of build 67
(`docs/reviews/live-qa-walk.md` on `ideas/live-qa-walk`, issues 4 and 14) and the privacy audit
(`D:\nandi-gate-logs\idea-engine\codex-dpdp-privacy-audit.md`, item 1). Needs Jenil's yes on the 18+ line and the
data line before it ships.

## What a new user meets today (measured)
- 7 taps and 4 screens before the first question: welcome → "pick two goals" → bedtime → a **second** picker
  ("What do you want to get sharp at?") whose Start button sits below the fold and is disabled until you pick.
- Only the first goal in a fixed order is used (`core/welcome.ts` ORDER: learn, mind, train, plan, sleep), so the second pick does nothing visible.
- Bedtime copy reads backwards: "**Before** this time NANDI turns calm".
- After bedtime the last button still says "Start a 2-minute drop" and then shows "Nothing to review tonight" (fixed on qa-live).
- "Everything stays on this phone" is not quite true: update checks contact our server, and backups/shares leave the phone when the user chooses.
- There is no 18+ confirmation, although 18+ is a launch rule.

## The new first run (3 screens, 4 taps to the first win)
1. **Hello** (Nandi, cheer):
   - "Hi, I'm Nandi. Swap a little scrolling for things you'll be glad you did."
   - One data line: **"Your activity is saved on this phone. It leaves only when you back it up or share it."** with a
     **Privacy** link (a plain one-page notice; Jenil + lawyer finalise the text before 13 May 2027).
   - A required tick: **"I'm 18 or older."** The button "Let's start" stays off until it is ticked.
   - "I have a backup to restore" stays.
2. **Pick one to try first** (not two): Sleep earlier · Learn something · Get fit · Sharpen my mind · Get things done.
   One tap chooses and moves on (no Next button). Copy: "Pick one to start. Everything else is one tap away later."
3. **Bedtime** (Kachhua, rest): "When do you want to be asleep?" / **"From this time, NANDI turns calm: no new lessons,
   just a gentle wind-down."** The button names what happens next, and goes straight there:
   - Learn → starts the first lesson in a starter topic (Psychology: habits, the best-taught idea today). **No topic
     picker**; topics can be changed from Learn later.
   - Sharpen my mind → today's puzzle (the daily board, not an intro board).
   - Get fit → "Try a 5-minute first workout" (easy, no rank test; spec 17 and the Train audit).
   - Get things done → Plan with the add box focused.
   - Sleep earlier → tonight's plan.
   - After bedtime, any choice → "Start my night routine".

Store the pick as `profile.goals: [pick]` (same setting, one value) and the 18+ tick as `profile.adultConfirmedAt`
(a date, in backup). No new dependency.

## Kill test
Owner panel, first 2 weeks after release: share of new installs that finish one meaningful action on day 1 (the
existing daily mark). If it does not rise against the previous build's installs, revert to the old flow.
