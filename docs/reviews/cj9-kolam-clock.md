# cj9 · Kolam by the clock

Spec input from the cj8 prototype. No app code changed.

## What was measured

I ran `generateKolam(n, seed, { strict: true })` for integer seeds 1–366.
I used sorted wall coordinates as the pattern identity.
This counts a different starting point on the same line as the same pattern.
It does not collapse rotations or reflections.
Every result passed `checkKolam`: one closed line, every dot enclosed alone, zero empty regions.

| Dot grid | Distinct layouts | Repeat days (`366 - distinct`) | Most uses of one layout |
|---|---:|---:|---:|
| 3×3 | 2 | 364 | 186 |
| 4×4 | 364 | 2 | 2 |
| 5×5 | 60 | 306 | 12 |

The cj8 generator favors quarter-turn symmetry on odd grids.
That makes 3×3 repeat heavily.
A date-specific seed makes selection stable; it does not promise a new shape every night.

## Two added pattern families

Both are original layout studies on the existing square dot lattice.
They are not traditional kolam names or copies of a named design.
Each takes 16 deterministic strict candidates without required rotational symmetry.
`rim-turns` keeps the candidate with the most turns beside the outer dot row.
`inner-turns` keeps the one with the fewest such turns.
The checker validates the chosen point list.

| Family | Source quote and scope | 3×3 distinct / repeats | 4×4 distinct / repeats | 5×5 distinct / repeats |
|---|---|---:|---:|---:|
| Rim turns | Waring describes square loop kolams: “Loop kolams have lines that bend around the dots, forming continuous loops.” This supports the square-dot loop form, not this turn selection. [Waring, *Forma*](https://forma.katachi-jp.com/pdf/2701/27010083.pdf) | 46 / 320 | 356 / 10 | 366 / 0 |
| Inner turns | Demaine et al. describe “one surrounding continuous loop, which crosses itself repeatedly.” This supports the one-line rule, not this turn selection. [Demaine et al., *Sand Drawings and Gaussian Graphs*](https://erikdemaine.org/papers/Sona_JMA/paper.pdf) | 66 / 300 | 362 / 4 | 366 / 0 |

These rows also use seeds 1–366.
All 2,196 new-family outputs passed the strict checker.
The family sets can overlap, so their distinct counts must not be added.
No claim that a variant resembles a lotus or a traditional named motif is made without a practitioner review.
Two 5×5 SVG samples are saved beside the generator for visual review.

## Clock rule for one nightly kolam

`clock.ts` is a pure draft selector.
It uses the device's local clock and a 04:00 night boundary.
It hashes the night date (`YYYY-MM-DD`) for a stable offline seed.
The seed chooses one of base, rim turns, or inner turns.

| Local time | Base size | Margazhi size |
|---|---:|---:|
| 04:00–20:59 | 5×5 | 5×5 |
| 21:00–22:59 | 4×4 | 5×5 |
| 23:00–03:59 | 3×3 | 4×4 |

Margazhi is the requested fixed window, 16 December through 14 January inclusive.
Krithivasan writes of Marghazhi: “Different large designs are drawn everyday.”
The paper gives approximate dates; the exact cutoff above is a product rule.
[Krithivasan, *A View of India Through Kolam*](https://www.inae.in/wp-content/uploads/2018/12/A-VIEW-OF-INDIA-THROUGH-KOLAM-Prof-K-Krithivasan-Dec-2014-.pdf)

For the full moon, make only the line silver; keep dots and controls at accessible contrast.
The draft accepts a set of local full-moon night dates; it does not guess lunar phases.
For app use, bundle a phase table derived from published UTC instants, convert each instant to the device's local calendar date, and refresh that table in app updates.
The [US Naval Observatory phase data](https://aa.usno.navy.mil/data/MoonPhases) gives full-moon instants in UTC and documents local-time conversion.
If the table lacks a date, use the usual line color.
Silver changes no reward or pattern validity.

Freeze the selected size, seed, family, and color when tracing starts.
A clock boundary must never replace a line in progress.
Opening again that night resumes the same partial line.
The next night's pattern uses its new date seed.
At a crossing, use cj8's forward-only tip rule; lifting the finger keeps progress.
Keep “Draw it for me” and reduced-motion step controls with the same finish.

## One kolam in the app

`git grep -i 'kolam' origin/main` returned no matches.
`git grep -i 'breath.*kolam\|kolam.*breath' origin/main` also returned no matches.
There is no Breath kolam on `origin/main` to inspect or merge now.
The nearest breath feature is the night pause card's “Take a breath and choose on purpose.”
The current `NightDeck` has a separate `Think` puzzle card and a stopping card.

Use one Kolam card in the night deck in place of the `Think` card.
If a Breath kolam prototype lands later, fold its pacing and accessible tracing controls into this card.
Keep one generator (`kolam.ts`), one saved nightly trace, and one completion event.
Do not create a second kolam route, catalogue, or finish screen.
Check the actual Breath prototype before adopting any of its geometry or claims.

## After bedtime and finish

Use the app's effective bedtime, including any day-specific shift, to set the after-bedtime flag.
After bedtime: 0 XP, no collectible, badge, gallery entry, unlock, streak change, or new content prompt.
The kolam remains available for quiet tracing, with no countdown, speed score, error state, or reset.
The completed pattern is the end screen; its exact two lines are:

```text
The line is complete.
That’s enough for tonight. Put the phone down.
```

Offer a plain Close action only.
Do not start another kolam from this screen.
No sleep, health, or brain benefit is claimed.

## Verification

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run --config content-drafts/kolam/vitest.config.ts --configLoader runner` | 2 test files passed; 33 tests passed. |
| `node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --module esnext --moduleResolution bundler --target es2022 content-drafts/kolam/kolam.ts content-drafts/kolam/clock.ts` | Passed. |
| `node node_modules/eslint/bin/eslint.js content-drafts/kolam/kolam.ts content-drafts/kolam/clock.ts content-drafts/kolam/clock.test.ts content-drafts/kolam/kolam.test.ts content-drafts/kolam/vitest.config.ts` | Passed. |

The default Vitest config excludes `content-drafts`.
The local config uses `--configLoader runner` because the default config loader tried to write inside the read-only `node_modules` path in this worktree.
