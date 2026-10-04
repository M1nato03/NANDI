# Legacy: the claude.ai prototype of Prime Pocket

This is the working prototype Jenil has been using: a single-page artifact on claude.ai (version 3, published 3 Oct 2026). It's plain JavaScript with no build tool. `build.sh` concatenated the files into one HTML page, and data was saved through claude.ai's artifact database (`window.claude.use('db')`). That dependency on a Claude plan is the reason for the new app.

**Port the logic and content, not the UI code.** Generators, the mystery engine, lesson and deck content, scheduling and rating rules are tested and verified. Reuse them as-is at first (`allowJs`). The UI files show the intended *behaviour* (see `docs/specs/04-mind.md` section 6) but should be rebuilt in React.

## Files

| File | What it is | Reuse |
|---|---|---|
| `src/puzzles.js` | `PZ`: seeded generators for Mini Sudoku 6×6, Crowns, Sun & Moon, Number Path, Calcudoku. Uniqueness counters (stop at 2), human-style logic solvers (`latinLogic`, `crownLogic`, `binLogic`, `calcLogic`), rule checkers. `PZ.generate(type,{seed,diff})`, `PZ.TYPES`, `PZ.hash`, `PZ.rng` (mulberry32), `PZ._test` | **As-is** → `src/core/puzzles/`. Later: TS conversion and solver step output for hints |
| `src/cases.js` | `CaseGen`: logic-grid "case of the day" (7 Indian-setting themes). Plants a solution, generates clues, checks uniqueness, runs a propagation solver that writes step-by-step explanations. `generate({seed,diff})`, `daily(date,diff)`, `dailyDiff(date)` | **As-is** → `src/core/mysteries/` |
| `src/content.js` | Greene "read people" content: `LAWS`, `TACTICS`, `TYPES`, `ITEMS` (14 scenarios, 12 spot-the-tell chats, 5 mini-mysteries, 13 teasers) | Convert → `content/deck/deck.greene.json` (`07-content-packs.md` §2.2) |
| `src/lessons_gita.js` | 19 lessons, "Gita for a Restless Mind". Verse text checked against two open datasets (gita/gita, vedicscriptures); meanings are our own glosses | Convert → `content/lessons/lessons.gita-restless-mind.json` |
| `src/lessons_charaka.js` | 16 lessons, "Charaka: What Still Holds Up", each graded against modern research; New Edition numbering. Also defines `COURSES` | Convert → `content/lessons/lessons.charaka-holds-up.json` |
| `src/app_a.js` | Core app: state, saving, deck builder (`buildDeck`), Elo (`rate`), item and card SRS (`schedule`, `CARD_INT`, `IT_INT`), streak and freezes, case UI, Me tab | Rules only: Elo, SRS intervals, deck mix. Rebuild the UI |
| `src/learn_ui.js` | Lesson player (8 steps), diagram renderer (11 kinds), plan check-in, course cards, night-mode card | Behaviour reference; reimplement diagrams as React components |
| `src/pz_ui.js` | Puzzle hub and boards: tap cycles, number pad + notes, rule-based conflicts, drag-to-draw Number Path, hints, results, daily rotation | Behaviour reference |
| `src/app_z.js` | Navigation, keyboard handling, boot (claude.ai db subscriptions) | Discard |
| `src/shell.html`, `src/extra.css` | Markup and styles of the prototype (light/dark tokens) | Reference only; the new theme is in `06-theme.md` |
| `build/prime-pocket.html` | The built prototype. **Open it in a browser** to see the current behaviour; it runs in "preview" mode with example data | Reference |
| `tests/test_pz.js` | Generator harness: for each type × difficulty, checks uniqueness, logic-solvability and rule validity, with timings. `node tests/test_pz.js all 40` | Port to Vitest |
| `tests/test_cases.js` | Mystery harness: 300 seeds × 3 difficulties; uniqueness and solver explanation | Port to Vitest |
| `tests/test_lessons.js` | Lesson data validation (fields, answer indices, unique options) | Port into the pack validator |
| `data/legacy-export.json` | Jenil's data exported from the artifact database on 3 Oct 2026: 40 Greene law cards (front, back, law, order, box, due, reviews, last) and `progress`. **Personal: git-ignored** | Import in Phase 0 through the restore picker |
| `data/fixture-legacy-export.json` | Synthetic file with the same shape and fake values | Commit it; CI tests the importer with it |

## Verified behaviour (from the last test run)

- Every generator: 100% unique and rule-valid across the tested seeds, and logic-solvable for every type **except Number Path**, which has only a uniqueness counter (its harness sets `logic=true`). Generation in Node: medians of a few ms, p95 about 100–150 ms and worst cases up to about 200 ms for the hard Sudoku, Crowns and Number Path. Number Path is capped at 6×6 because 7×7 was too slow.
- Mysteries: 900 of 900 generated cases are uniquely solvable, with explanations.
- Lessons: 35 lessons, 0 schema errors. Answer positions skew toward option B in the source data, **so options must be shuffled at display** (the prototype does this).

## Mapping `legacy-export.json` → new schema

Import it **only through the in-app restore picker**, which detects the legacy shape (top-level `cards` + `progress`). Keep `legacy/data/` git-ignored; it's personal data and must never be bundled.

Differences to handle:
- The prototype's day boundary was **5 am**; the new app uses 4 am. Keep the stored dayKeys as they are.
- 30 of the 40 cards have no `last` field (never reviewed). Treat it as absent.
- Retired mini-mysteries use `b: 99` with `due: '9999-12-31'`. Keep that as "retired".
- Field renames: `law` (number) → `topic` (string, e.g. `'4'`); `cls` → `tint` in course metadata.
- The daily case seed isn't stored; it's derived as `CaseGen.daily(date, diff)` (seed `hash('daily:' + date)`).

| Legacy | New table | Notes |
|---|---|---|
| `cards[]` with `law` | `cards` (`deckId: 'greene'`) | Natural key `id` stays as is (e.g. `l4-1`), with `packId: 'deck.greene'` and `itemId` = the same id. Keep `box`, `due`, `reviews`, `last`. Text goes into the Greene deck pack |
| `cards[]` with `track` (lesson cards; may appear in a fresher export) | `cards` (`deckId = track`) | |
| `progress.ratings`, `progress.nAns` | `ratings` | people / detective Elo |
| `progress.items` `{id:{b,n,c,due,last}}` | `deckProg` | Item SRS state |
| `progress.cases` `daily:YYYY-MM-DD` / `x:<seed>:<diff>` | `puzzleRuns` (`type:'mystery'`, `source:'legacy'`) | `result` ('solved'/'revealed'), `secs` → `solveMs`, `hints` → `hintsUsed`, `tries` |
| `progress.learn.done/last/plans` (in fresher exports) | `lessonProg`, `plans` | |
| `progress.pzs`, `progress.pzd` (in fresher exports) | `puzzleRuns` + mastery bests | |
| `progress.hidden`, `progress.flags` | `flags` | Hidden or flagged items stay hidden |
| `progress.rhist` | not imported | Rating history (optional: `settings.legacyDays`) |
| `progress.days`, `freezes`, `frozen` | not imported | The streak starts fresh in the new economy. Optionally keep `days` as history in `settings.legacyDays` |

If Jenil keeps using the claude.ai prototype after 3 Oct, its data will be newer than this export. In that case, ask him to have Claude (on claude.ai) re-export the artifact database (collections `cards` and `progress`) into a fresh `legacy-export.json` with the same shape. The importer should tolerate both shapes.
