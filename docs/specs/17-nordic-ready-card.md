# 17 · Nordic ready card (small spec)

Status: idea engine (jenil-8c), 22 Oct 2026, answering the builder's d037b36 (Nordic steps gated by `nordic-setup`;
new progressions stop at SL-RDL until `nordicReady`).

## Problem
Since d037b36 nobody is moved onto a Nordic curl without a check. That is safe. But a user who masters the single-leg
RDL now hits a ceiling with no next step and no explanation. A ceiling with no path feels like a stall, and a stall feels
like failing.

## Build
1. **Harder SL-RDL before any Nordic (no equipment needed).** When SL-RDL 3x8 is met, the next session asks for the same
   move with a slow 3-second lowering and a 1-second pause at the bottom ("slow SL-RDL"). This is a variant of the same
   step, not a new ladder rank, so nothing else changes. Cues: "Lower for a slow count of 3." / "Pause for 1 at the
   bottom, hips level." / "Stand up smoothly; hold the wall if you wobble."
2. **The ready card, shown once** after slow SL-RDL 3x8 is met (and again only if the user taps "Ask me later" and
   meets it again after 14 days). Copy:
   - Title: **"Ready for a harder hamstring move?"**
   - Body: "The next step is a Nordic curl. You kneel, someone or something holds your ankles, and you lower your body
     forward slowly. It is hard, so we start with a band to help and only a small range."
   - Checklist the user ticks (all three needed): **"I have a resistance band"** · **"I have a secure ankle hold (a
     partner, or a heavy sofa that will not move)"** · **"I have a mat or folded towel for my knees"**.
   - Buttons: **"I'm ready"** (only active when all three are ticked) → sets `nordicReady` (settings row, in backup),
     and **"Not now"** → stays on slow SL-RDL, no repeat for 14 days.
3. **The first Nordic session is small:** 2 sets of 3, lower only part of the way, catch with the hands, then push
   back up with the hands. Rest a full day before the next hinge session. Show the existing banded-nordic cues plus:
   "Stop if you feel a sharp pull at the back of the thigh or pain behind the knee."
4. A setting under Train lets the user turn `nordicReady` off again at any time (back to slow SL-RDL).

## Rules
- Never shown on a soft day, after bedtime, or in heat mode.
- No XP or badge for tapping "I'm ready". Only real sessions earn XP.
- Copy passes copy-lint. No "fail", no "you should".

## Test
Unit: the card is due only after slow SL-RDL 3x8; "Not now" hides it for 14 days; `nordicReady` false → no Nordic in
placement or progression (d037b36 already covers this). e2e: tick all three → the next hinge session is banded Nordic
with 2x3.

## Kill test
If, after 4 weeks, more than 1 in 5 users who reach the card report pain in the hinge session (the existing effort and
pain answers), remove Nordics from the default ladder and keep the slow SL-RDL as the top step.
