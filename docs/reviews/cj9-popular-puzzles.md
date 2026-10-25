# CJ9: familiar grid puzzle drafts

All four generators use a numeric seed and `easy`, `medium`, or `hard`.
Each returns a puzzle, its solution, and a rule-solver step count.
The exported solver stops after two solutions: zero, one, or more than one.
`-1` steps means simple rules stalled and a search would be needed.
Sizes by level: Star Battle 5 / 6 or 7 / 8; Binairo 4 / 6 / 6;
Sudoku 4 / 6 / 9; Nonogram 5 / 7 or 8 / 8 or 10.

## Familiarity evidence

| Genre | Why it may be familiar | Limit |
| --- | --- | --- |
| Star Battle | [LinkedIn Games](https://www.linkedin.com/help/linkedin/answer/a6863543) offers a daily one-star-per-row, column, and colour-area grid. | Indian 18–25 use of this exact genre: unsourced. |
| Binairo | [LinkedIn's two-symbol rules](https://www.linkedin.com/help/linkedin/answer/a6861672/) match the equal-count, no-three, `=` and `x` rules. | Indian 18–25 use of this exact genre: unsourced. |
| Sudoku | [The Indian Express games page](https://indianexpress.com/puzzles-and-games/) offers daily Sudoku at three levels. | Age-specific reach: unsourced. |
| Nonogram | Picture grids are available as [mobile games](https://play.google.com/store/apps/details?id=com.pegasusgames.nonogram). The original art here depicts a kite, diya, chai cup, and cricket bat. | Indian 18–25 familiarity with nonograms: unsourced. This is the least proven fit. |

These sources show availability, not that most young Indian adults have played each game.
No product name or art from those sources appears in the puzzle files.

## Seeded checks

Command: `.\node_modules\.bin\vitest.cmd run --config content-drafts/puzzles/vitest.config.ts --configLoader runner --maxWorkers 1 --no-fileParallelism --reporter verbose`

Each row covers seeds 0–199. All 2,400 puzzles had exactly one solution.
Time is generation, rule checks, and solution checks per puzzle on this machine.
Logical means the basic rule solver finished without guessing.
Mean steps counts placed cells for Binairo, Sudoku, and Nonogram; it counts candidate removals and final stars for Star Battle.

| Genre | Level | Seeds | Logical | Mean steps | Mean ms | Max ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Star Battle | easy | 200 | 200/200 | 25.0 | 1.82 | 9.91 |
| Binairo | easy | 200 | 200/200 | 10.0 | 1.74 | 8.10 |
| Sudoku | easy | 200 | 200/200 | 10.0 | 3.35 | 10.36 |
| Nonogram | easy | 200 | 200/200 | 25.0 | 0.60 | 3.08 |
| Star Battle | medium | 200 | 200/200 | 42.5 | 6.39 | 14.30 |
| Binairo | medium | 200 | 200/200 | 26.4 | 8.53 | 14.48 |
| Sudoku | medium | 200 | 200/200 | 21.0 | 18.42 | 23.98 |
| Nonogram | medium | 200 | 200/200 | 56.7 | 0.58 | 5.03 |
| Star Battle | hard | 200 | 0/200 | 0.0 | 11.47 | 23.57 |
| Binairo | hard | 200 | 200/200 | 26.5 | 5.04 | 11.47 |
| Sudoku | hard | 200 | 194/200 | 48.0 | 83.62 | 161.60 |
| Nonogram | hard | 200 | 174/200 | 75.1 | 3.81 | 27.91 |

All 14 tests passed, including tutorial structure and sample output.
The hard Star Battle set needs search with the current rule solver.
Binairo medium and hard have almost the same measured step count; this tier needs playtesting.
Star Battle colour areas start as small pockets around stars, so its large final area also needs playtesting.
Hard Sudoku and Nonogram sometimes need guesses under the measured basic rules.

## Seed 42 samples

`A`–`E` are coloured Star Battle areas; place one star in each row, column, and area.
No prefilled stars or empty marks are shown.

```text
EEEAA
BBEEA
DBECE
DDEEE
EEEEE
```

Binairo uses `S` for sun, `M` for moon, and `.` for an empty cell.

```text
.MS.
..S.
.M..
MS..
```

Sudoku is 4×4 with 2×2 boxes; `.` is empty.

```text
.214
....
.3.2
..3.
```

The kite Nonogram is 5×5 with no prefilled cells.
Row clues, top to bottom: `1 | 2 | 4 | 2,1 | 1`.
Column clues, left to right: `1 | 3 | 5 | 1 | 1`.

## First-time help

`tutorials.json` has four Star Battle steps, five Binairo steps, three Sudoku steps, and four Nonogram steps.
Every step names one rule, shows a tiny board, highlights a cell, and accepts one move.
Sudoku alone needs no tutorial beyond three steps.
