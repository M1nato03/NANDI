# 29. Kapi's familiar puzzles, each with a do-it-yourself tutorial

Status: APPROVED by Jenil, 25 Oct 2026 ("29 30 can go to builder").
Idea engine, 25 Oct 2026. Generators and tutorials: origin/ideas/cj9-popular-puzzles f766c02
(content-drafts/puzzles/, docs/reviews/cj9-popular-puzzles.md). Logged as cloud-sessions item 86.

## AMENDMENT, 25 Oct (idea engine, after the builder's questions): use the boards the app already has

The app already ships familiar boards in Mind's daily Board: Crowns (the Star Battle type), Sun & Moon (the
Binairo / Tango type), Mini Sudoku, Number Path and Calcudoku, with generators, hints, techniques, share links
and the pace line. I missed this when writing the spec. **Do not add duplicate Star Battle or Sudoku
generators.** Jenil's complaint is that the puzzles are confusing and have no tutorial, so the work is:

1. **Kapi's shelf = today's existing boards**, on top of Mind, each with its familiar plain-English one-line
   description ("Crowns: one crown in every row, column and colour").
2. **A first-time do-it-yourself tutorial for every board type** (3-5 steps, one rule per step, one move per
   step, Kapi pointing). Reuse the cj9 tutorials.json steps for Crowns (starBattle), Sun & Moon (binairo) and
   Mini Sudoku (sudoku), adapted to the app's symbols. Write new ones in the same format for Number Path and
   Calcudoku. Kapi's case gets one too.
3. **Check names the broken rule, and hints fill at most one cell**, using the existing hint.ts and deduction,
   with no red (a brief test of the existing behaviour first; change only what breaks this rule).
4. Kapi's case moves under the shelf. The old Practice boards, best times, technique cards and challenge links
   go into a closed "More boards" fold. Nothing is removed.
5. **XP:** no economy change. The first shelf daily solve writes the existing daily 'board' fact; further solves
   use the existing side-board cap. Hints never change XP; after bedtime 0.
6. The cj9 generators stay as reference only. Use them only if an existing board type fails a unique-solution
   or logic-step test.

Everything below this amendment still applies where it fits the existing boards: no timer while playing (the
pace line stays opt-in where it already is), the daily stop screen, the animation table and the tests (the
grid-fit test uses the largest existing board sizes).

## Why

Jenil, 25 Oct, on Mind's puzzles: "first of all confusing, and also not a likeable experience, and most of them
are ones people have never heard of, so for them first there should be a tutorial, and try more popular
puzzles."

## What changes

Kapi gets a puzzle shelf with two familiar puzzles first:

| Puzzle | What people know it as | Sizes and levels |
|---|---|---|
| **Star Battle** (one star) | The puzzle type behind LinkedIn's daily "Queens". Never call it Queens. | 5×5 to 8×8; easy and medium only (hard always needs guessing, per cj9) |
| **Sudoku** | Daily newspaper Sudoku | 4×4 easy, 6×6 medium, 9×9 hard |

Binairo (the type behind "Tango") and Nonograms are ready in the drafts. They come later, one at a time, only
if Jenil wants them after playing the first two.

The existing daily case stays, but moves under the shelf as "Kapi's case". It gets the same first-time
tutorial treatment: a 4-step walkthrough of the grid, written to the same rules as below.

## First-time tutorial (the key change)

- The first time a puzzle is opened, it starts with its tutorial (from `tutorials.json`): 3-5 steps, one rule
  per step, on a tiny board. Each step highlights one cell, and the learner makes that one move to continue.
  There is no "read this wall of rules" screen.
- Kapi demonstrates each step first: Kapi hops to the highlighted cell and points. Then it's your turn.
- A tutorial can be replayed any time from a "How to play" link. It can be skipped, but it is never skipped
  by default.
- After the tutorial, the first real puzzle is always the smallest, easiest size.

## Play

- One daily puzzle per type, seeded by the local date (04:00 boundary), the same for everyone. "Another
  puzzle" offers up to 2 more a day, then a stop screen: "That's today's puzzles. Kapi's off to nap." No
  endless feed.
- No countdown and no timer shown while playing. A finished puzzle may show "Solved" and nothing else.
  (Pace from pace-proof stays only on Kapi's case, where it already shipped as opt-in.)
- Input: tap to cycle (empty → cross → star, or a number pad for Sudoku). Long-press clears. Undo is
  unlimited within the puzzle.
- **Mistakes:** never shown as red while you play. "Check" (any time) marks only the cells that break a rule,
  in the friend's accent colour with an icon, never red, and says which rule ("Two stars in this row").
- **Hints**, 3 steps, from the rule solver's next logical step:
  1. Points to the row, column or area where something can be decided.
  2. Names the rule that decides it.
  3. Makes that one move.
  A hint never solves more than one cell.
- XP: flat per solved puzzle, the same with or without hints. After bedtime: 0 XP and the gentle end screen
  (CLAUDE.md night rule).

## Kapi's animations (standing rule)

| Moment | Size | Animation |
|---|---|---|
| Shelf opens | minor | Kapi swings onto the shelf. |
| Tutorial step | minor | Kapi hops to the highlighted cell and points. |
| Correct tutorial move | minor | Kapi claps once. |
| Check finds a broken rule | minor | Kapi scratches its head beside the row. No red, no shake. |
| Hint | minor | Kapi leans in and whispers (the hint text appears from Kapi). |
| Puzzle solved | major | Kapi does a cartwheel across the grid. |
| Daily stop | minor | Kapi curls up for a nap (rest pose). |

All honour reduced motion (pose changes only), play once, and never block taps.

## Data and online-ready

- Generators run on the phone (all under 25 ms per puzzle at easy and medium; 9×9 hard Sudoku up to about
  160 ms, so pre-generate it in the puzzle worker that Mind already uses).
- Rows: `puzzle` (type, date seed, size, solved at, hints used), `tutorialSeen` per type. All on the phone.
- v2: the daily seed already matches for everyone, so a share link can say "I solved today's Star Battle"
  with no account.

## Tests

- First open → tutorial; each step accepts only its one move; replay works; skipping works.
- The daily seed is stable across reloads and the 04:00 boundary.
- Every generated puzzle has exactly one solution (reuse the cj9 tests in the app's suite).
- Check marks only rule-breaking cells, with no red colour and the right rule name.
- A hint never fills more than one cell.
- The stop screen after 3 puzzles a day; after bedtime 0 XP.
- 360 px with root font-size 20 px: the 8×8 and 9×9 grids fit with no sideways scroll, cells at least 36 px,
  numbers readable.
- Reduced motion.

## Out of scope

Exam-style cases (seating, family, route, lock: origin/ideas/cj9-kapi-cases) are on hold after Jenil found
them confusing. Kapi's prank (one-lie case) also waits.
