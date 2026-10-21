# 13 · Feel pass: make Learn feel alive (owner feedback, 2026-10-21)

Jenil, after using build 58+ on the phone: "the design looks similar to Duolingo, but it is far less animated,
gamified or 3D. It is not nearly on its level." And: "the questions are very confusing."

Measured on main `beb423b`: the whole UI has 19 `@keyframes`, one of them in Learn (a 0.4 s flash on a right
answer). Answer options are flat rows. The result is a plain card that scrolls into view. The friend beside the
question is 40 px and only hops on a right answer. The progress bar is 5 px. Nothing presses, nothing moves
between questions, and the finish screen is a text list.

Duolingo's feel comes from a few things done everywhere: raised buttons that press down (a thick darker bottom
edge that disappears on tap), a result sheet that slides up in a colour, characters that idle, react and move to
a right or wrong state after each answer (they build these as Rive state machines, see
https://blog.duolingo.com/world-character-visemes), and a finish moment with numbers that count up.
Mechanics are free to use; their art, colours, sounds, names and shapes are not (spec 11 §0). Everything below
is our own look: warm Indian motifs, our cast, our sounds.

## Rules (from spec 11 §0 and the master plan)
- No loss states: a wrong answer never costs anything, the bar still moves, no hearts.
- No random rewards: every celebration is fixed and earned the same way each time.
- Timings inside `RULES.juice` (micro 100–200 ms, meso 400–800 ms, macro 1.2–2.5 s, at most 2 macro per day).
- Everything off under `prefers-reduced-motion` and `data-motion='reduce'`. Sound stays opt-in.
- Transform and opacity only, so it holds 60 fps on a cheap Android phone. CSS first; no new dependency is
  needed for A–H. Rive (rive-wasm, MIT, in the toolbox) is the later step for the cast, not this pass.

## A. Buttons and options that press (the "3D" look)
- Primary buttons, answer options, topic tiles and trail nodes get a raised edge:
  `box-shadow: 0 4px 0 var(--edge)` where `--edge` is the fill colour about 25% darker (light and dark themes).
- `:active` → `translateY(4px)` and the edge goes to 0, 90 ms. Light haptic on press (existing `tapHaptic`).
- A selected option keeps a 2 px area-colour ring and lifts back up; disabled options lose the edge.

## B. The answer moment
- On Check, a result sheet slides up from the bottom (300 ms, slight overshoot) instead of a card that scrolls
  into view. Teal for right, warm amber for "here is the idea". The heading pops in (scale .8 → 1).
- The right option bounces once (scale 1 → 1.05 → 1, 250 ms). A wrong pick shakes gently (±5 px, twice, 240 ms).
- The Next button lives on the sheet, full width, pressable (A).

## C. The friend reacts
- The cast beside the question grows to 72 px and sits in its own row, not inline with the label.
- Idle: a slow breathe (scale 1 → 1.02, 3 s loop) and a blink every few seconds (eyes scaleY), CSS only.
- Option selected: the friend leans toward the options (rotate 4°). Right: the existing hop plus sparkles.
  Wrong: the "think" pose with a head tilt, never sad.

## D. Progress you can feel
- Bar 12 px, round ends, a light highlight stripe on top; width grows with a spring (400 ms overshoot).
- From 3 right in a row the bar glows brighter and a small "3 in a row" label rises and fades (combo state
  already exists). A miss just ends the glow; the bar still moves forward.

## E. Finish moment (one macro)
- XP and "ideas touched" count up over 700 ms; the friends who took part hop in turn.
- A short burst of marigold petals and diya sparks (CSS particles, 1.4 s), the same every time.
- Topic chips slide in one by one (60 ms stagger).

## F. Depth everywhere else
- Cards: two-layer shadow plus a 1 px top highlight. Trail nodes become raised discs (radial fill + edge),
  the current node pulses softly, finished nodes get a gold ring. The trail path draws in on first view.

## G. Movement between questions
- Outgoing question slides left and fades, the next comes in from the right (250 ms). Use the View Transitions
  API where the WebView supports it; otherwise no animation.

## H. Sound map (own synthesized set, opt-in)
- Very quiet tick on press, a two-note chime on right, a soft low note on "here is the idea", a 1.2 s finish phrase.

## Question clarity in the UI (goes with the plain-words content pass)
- K. The label above each question shows the raw type ("Habits · true not quite", "fill the step"). Replace it with
  a plain instruction: predict → "What happens next?", scenario/choose → "Pick the best answer", why → "Why?",
  fill-the-step → "Fill the gap", true-not-quite → "Spot the mistake", explain-it-back → "Say it simply",
  order → "Put in order", match → "Match the pairs", estimate → "Guess the number".
- L. After picking an option, the user must also answer "How sure are you?" (3 chips) before Check. That is a second
  question on every question. Recommendation: hide it by default (engine gets 'fairly-sure'), keep it on gold
  review only.

## Plain words: rewrite rules for all topic questions
Why they confuse (from the psychology pack): stems ask about research ("What does habit research suggest about
that single gap?"), use words never taught ("median fitted time to near-full automaticity", "framed", "felt
value", "Cohen's d"), and the right option is the hedged one ("may", "need not") while the wrong ones say "must"
or "force". So the quiz tests spotting hedges, not the idea.
1. One situation, then one direct question. Aim for 18 words or fewer; never more than 2 sentences of setup.
2. Ask about the thing, not the study ("What sets this off?", not "What might start the action?").
3. No untaught terms in stems or options. The concept's own term only where it is the answer (fill-the-step),
   or with its meaning beside it ("Firming up after the lesson (consolidation).").
4. Options short (aim 8 words or fewer), concrete and parallel. No "may/might" in options; wrong options must
   not be the only ones with "must/always/exactly".
5. Keep each option's meaning, so the existing feedback still fits; change feedback only if it no longer does.
6. Validator rules still bind: 2 Indian settings in each concept's predict and scenario stems, estimate stems
   name the mechanism (see `estimateMechanisms`), Flesch ≥ 60, feedback never starts with the option's words.
Worked example: psychology, all 80 questions, on this branch (stem avg 18.0 → 16.4 words, option avg 6.2 → 5.1
words, hedged options 16 → 3, validate-packs green). Before → after:
- "During exam week, Tara misses one usual evening sketch. What does habit research suggest about that single
  gap?" / "One miss need not erase the learned link." → "Tara sketches every evening, but skips one day in exam
  week. What happens to the habit?" / "It is still there."
- "A review of 94 tests … average gain in goal attainment, measured as Cohen's d?" → "94 studies tested if-then
  plans. Scientists score help on a scale where 0.2 is small, 0.5 medium and 0.8 large. What did plans score?"
Tool (idea-engine scratchpad, C:\Users\JENIL\AppData\Local\Temp\claude\C--Users-JENIL\589d3564-f928-4360-b358-30ce2b3ec501\scratchpad\pw\):
`apply.mjs <topic> <patch.json>` replaces stems and option texts in place (minimal diff)
and checks the result against the intended data; `pw/metrics.mjs` prints the before/after numbers.

## Acceptance
- Each item A–H visible in a 360 px screen recording of one drop, light and dark.
- Reduced motion: no animation at all (existing e2e pattern).
- No frame longer than 50 ms during the answer moment in a Playwright trace on the e2e build.
- Jenil's phone test: he says it feels alive. That is the real gate.
