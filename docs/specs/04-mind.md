# 04 · Mind: Daily Drop, puzzles, mysteries, lessons, people-reading deck

Evidence: `docs/research-brief.md`, section "Puzzles get a story, a weekday arc and a hard stop", plus `reference/puzzles-and-lessons-research.md` for generator and lesson design.

**Principle:** Mind needs structure that makes each 3-minute board matter, not more content. A finite daily set, a weekday difficulty arc, a season-long mystery, collectible technique cards, and a hard stopping screen. **Puzzles are capped at 80 XP a day**, because paying for something already fun can undermine it. Honest line in the app: "You get faster at what you practise; the real win is an active three minutes instead of a passive scroll."

## 1. What already exists (port it, don't rewrite it)

The legacy files are in `legacy/src/`, and their test harnesses in `legacy/tests/`. They run in Node; see `legacy/README.md`.

| Legacy file | What it is | Port target |
|---|---|---|
| `puzzles.js` → `PZ` | Five seeded generators: Mini Sudoku 6×6, Crowns (N=6/7/8), Sun & Moon 6×6, Number Path (5×5/6×6), Calcudoku (4×4/5×5/6×6). Each has easy/medium/hard (Sun & Moon's medium uses the same logic level as hard, so the UI offers only easy/hard for it), a uniqueness counter (stops at 2) and a rule checker. Four of the five also have a human-style logic solver; **Number Path has only the uniqueness counter** (see the gap below). API: `PZ.generate(type,{seed,diff})`, `PZ.TYPES[type].{name,rule,check}`, `PZ.hash`, `PZ._test.*` | `src/core/puzzles/` (keep as JS under `allowJs` first; convert to TS later with the same tests) |
| `cases.js` → `CaseGen` | Logic-grid "case of the day" generator (7 Indian-setting themes: trophy, garba, haveli, leak, wedding, train, fest). Plants a solution, derives clues, verifies uniqueness, and runs a human-style propagation solver that also produces the step-by-step explanation. API: `generate({seed,diff})`, `daily(date,diff)`, `dailyDiff(date)` | `src/core/mysteries/` |
| `content.js` | Greene "read people" items. `LAWS` (4, 12, 14, 19, 40); `ITEMS`: 14 scenarios, 12 spot-the-tell chats, 5 mini-mysteries, 13 teasers, each with exactly one defensible answer and a `why` | Convert to a `deck` content pack |
| `lessons_gita.js`, `lessons_charaka.js` | 19 Gita lessons ("Gita for a Restless Mind") and 16 Charaka lessons ("What Still Holds Up"). Verified verses (simple romanisation + IAST + own-words meaning), Charaka evidence grades, diagrams, transfer checks, if-then plans, 2 recall cards each | Convert to two `lessons` content packs |
| `legacy-export.json` | 40 Greene law cards (front/back + SRS state), ratings (people/detective Elo), item schedules, case history | `src/data/legacy-import.ts` |
| `app_a.js`, `learn_ui.js`, `pz_ui.js`, `app_z.js` | The prototype UI (vanilla JS). **Don't port the code; port the behaviour** listed in section 6 | `src/ui/` (React) |

**Importing the legacy files:** `puzzles.js` and `cases.js` end with a CommonJS line (`if (typeof module !== "undefined") module.exports = …`), which Vite and module Web Workers won't import. Append one line, `export default PZ;` / `export default CaseGen;`, and change nothing else. `content.js` and the lesson files declare bare `const` globals. `scripts/convert-legacy.ts` may evaluate them with Node's `vm` module to emit JSON packs. This one-off build step is the only place legacy code is evaluated; content packs are never `eval`'d at runtime.

**Known gap: Number Path has no logic solver.** Its boards are verified *unique* (`pathCount`), and the legacy test harness skips the logic check for it (`logic=true`). Until a path logic solver exists, Number Path is the documented exception to non-negotiable 9's "solvable by logic" check:
- Phase 0: uniqueness only.
- Phase 3: write a path solver (forced moves: a cell with only one free neighbour must be next; dead-end and parity pruning; waypoint-order constraints), then require logic-solvability in CI. Its hints and technique cards are enabled once the solver exists.
- Until then, Path hints use the legacy behaviour (extend the correct line to the next number).

Generator facts to preserve (verified):

- **Uniqueness and fairness:** every board has exactly one solution. For Sudoku, Crowns, Sun & Moon, Calcudoku and the mysteries, the logic solver finishes it without guessing at the requested level.
- **Speed:** in Node, p95 is about 100–150 ms for the hardest types, with worst cases up to about 200 ms. **Run generation in a Web Worker** and measure p95 on the phone.
- **Checking:** the player's grid is checked with `check()` (rules), never against the stored solution.

## 2. The Daily Drop (the core of Mind)

The drop **unlocks at his chosen hour (default 07:00)** and resets with `dayKey`. Boards are seeded from the date and the weekday table (`RULES.mind.featuredByWeekday`, `bossRotation`, `caseDiffByWeekday`). So **anyone past onboarding gets the same daily boards** as a friend with the app. Onboarding exceptions: his first 3 daily cases are easy, and a type's first-ever appearance is preceded by a small easy **intro board**. The intro board is extra (0 XP, doesn't count as the Mind slot); the daily board itself stays the shared one.

| Item | XP | Notes |
|---|---|---|
| Case of the day (logic-grid mystery) | 25 | Difficulty by weekday from `RULES.mind.caseDiffByWeekday` (Mon–Tue easy, Wed–Sat medium, **Sunday hard = the Arc chapter finale**); easy for his first 3 solved cases |
| Featured board (rotates by weekday) | 10 | Mon Sudoku easy · Tue Sun & Moon easy · Wed Number Path medium · Thu Crowns medium · Fri Calcudoku medium · Sat Crowns hard · **Sun Boss**: `bossRotation[isoWeek % 5]` at hard |
| Today's lesson | 15 | One new lesson per course per day is allowed, but **only the first lesson of the day pays XP**; a second course's lesson earns 0 |
| Due cards (Greene + lesson cards) | 1 per card, max 20 | Spaced repetition |
| Optional side board (another type) | 10 | Max 1 a day, within the Mind cap |

- **Total:** about 70–80 XP and 10–15 minutes.
- **Stopping screen:** after the drop: "Today's drop complete. Next drop: 7:00". The one primary button leaves Mind ("Back to planner").
- **Free Play** (unlimited practice of any type and difficulty) sits in a secondary menu at **0 XP and 0 Shards**.
- **Night:** wind-down allows only leftover drop items and reviews, with a 10-minute cap. After bedtime, Mind earns 0 XP with no sound or animation (see `05-economy.md`).

## 3. New features

1. **Three-rung hint ladder, driven by the logic solvers:**
   - The rungs: (1) a nudge ("look at row 3"), (2) the named technique shown on a 4×4 mini example, (3) one move.
   - Extend each legacy solver (`latinLogic`, `crownLogic`, `binLogic`, `calcLogic`, the path solver, `CaseGen.propagate`) to **emit its next deduction** as `{technique, cells, value}` from the player's current grid.
   - If the player's grid contains an error, hint #1 points to the conflicting area first.
   - Hints are logged per run (`hintRungs[]`).
   - Number Path waits for its solver (see the gap above).
2. **Technique cards (collectible, unannounced):**
   - The first correct use of a technique (detected by comparing the player's move to the solver's available deductions) unlocks a card with a 20-second explainer. Unlocks are stored in the `unlocks` table.
   - **Sudoku:** naked single, hidden single, pointing/locked candidates.
   - **Crowns:** one-cell region, region confined to a row/column, adjacency elimination, two regions sharing two rows.
   - **Sun & Moon:** no three in a row, balance (3 each), = / × sign propagation, line pattern elimination.
   - **Number Path:** forced move, dead-end avoidance, waypoint order.
   - **Calcudoku:** single-cell cage, cage arithmetic (e.g. 2-cell 3÷), Latin elimination, naked pair.
   - **Mystery:** direct clue, elimination ("only one left"), linking two grids.
3. **Mastery tracks (Phase 3):** personal bests and par times per type and difficulty (par = his median of the last 10, shown after 5 solves), "no-hint clear" stamps, and a per-type mini streak, all **derived from `puzzleRuns`** (no separate table). These feed the **Mind** stat on the hexagon.
4. **Mystery meta-arc (season story):**
   - Each season ("Arc") has an original 4–5-chapter story inside The Proving Ground.
   - Each daily case solved reveals a story panel or clue.
   - **Sunday's case** (hard) closes the chapter. The Sunday Boss board adds a bonus panel.
   - Story text comes from `mystery-arc` content packs. **Four Arcs ship bundled** and cycle if no new pack arrives; Claude can add more. Case generation stays procedural; the arc adds framing only.
5. **Spoiler-free share cards:**
   - A themed tile: rank badge, puzzle type, solve time, hint count. Never the solution.
   - Plain text too: `Prime Pocket · Crowns (Hard) · 1:47 · no hints`.
   - Default target: WhatsApp or the system share sheet, **not** Instagram.
   - **Sharing is off during wind-down and after bedtime.**
6. **New-type onboarding:** the first board of a type is small and intuitive, with no tutorial. The technique card appears after he solves it (productive failure before instruction).

## 4. Lessons (two courses ship; more arrive as packs)

**Flow (keep the prototype's 8 screens; this supersedes the brief's "12-screen" description, which splits the same content more finely):**

1. **Guess:** scene, question, options **shuffled per attempt**, then a confidence tap (Sure / Think so / Guessing). The reveal comes on the very next screen.
2. **Reveal + one diagram:** verdict; "Answer: …" if wrong; the line "Surprised? Confident misses are the ones you remember best" when wrong and sure. Diagram kinds: split, chain, three, thirds, stairs, meter, ring, cycle, curves, wave, balance. Reimplement them as React components; the prototype renders them in `learn_ui.js` `diagram()`.
3. **Name it + source:**
   - **Gita:** each verse shows the simple romanisation, our own-words meaning and an optional note, with an IAST toggle ("Exact pronunciation"). Also the "Modern parallel" box with the line "Ancient insight, modern parallel: not the same thing, but pointing the same way."
   - **Charaka:** the New Edition reference, a paraphrase, the evidence grade with its note, "What research says", and the "Educational, not medical advice" footer.
4. **Story:** two beats plus "The rule".
5. **Transfer check:** a new situation, multiple choice, feedback.
6. **Why:** pick the explanation, feedback.
7. **If-then plan builder:** preset cues and actions, or write his own. Saved to `plans`.
8. **Done:** "2 cards added to your deck", course progress, tomorrow's teaser. No auto-advance.

**Rules:**

- **One new lesson per course per day.** No new lessons after his bedtime (night mode). Past lessons can be reviewed any time (no XP, no new cards).
- **"Did your plan fire yesterday?"** check-in: for plans made 1–3 days ago, answers Yes / Partly / No / Didn't come up. This reason to return isn't a streak.
- **Lesson cards:** SRS state goes into `cards` with `id = '<courseId>-<lessonId>-<n>'` (the prototype's pattern), `deckId = courseId`, `packId` and `itemId`. First due the next day. **Card text is read from the pack**, not stored in the row.
- **Content sensitivities (keep):**
  - Gita: caste verses 4.13 and 18.41–48 are never lesson content; 18.66 is omitted; klaibya is rendered as "cowardly weakness"; 4.40 is paired with 4.34 and 18.63; devotional verses get a secular reading.
  - Charaka: no herbs or formulations, no disease claims; unsafe items (kajal/surma, herbal smoking) omitted; the "half capacity" exercise line is attributed to Sushruta.

## 5. People-reading deck (Greene)

- **Deck sessions** mix recall cards and items, as the prototype's `buildDeck()` does:
  - up to 3–4 due recall cards (4 if more than 12 are due);
  - 2 scenarios, 2 spot-the-tell chats, 1 mini-mystery, 1–2 teasers;
  - items picked near his Elo rating (people / detective), unseen first, then due ones;
  - same type never twice in a row.
- **Elo:** K = 40 for the first 20 answers, then 24; a hint gives score 0.6.
- **Item SRS intervals:** `[0, 21, 45, 90, 180]` days after a correct answer. After a miss, the item returns in 2 days (teasers: 3). Mini-mysteries retire after one answer. Card box intervals: `[0, 1, 3, 7, 14, 30, 60]`. A missed card is re-asked once in the same session.
- **Elo:** clamped to 400–2400. Case scores are 1 (clean solve), 0.7 (with grid checks or a second try) and 0 (revealed). All of these live in `RULES.mind`.
- **Flagging:** any card or item can be hidden ("Confusing or wrong? Hide it"). Stored in the `flags` table and listed in the weekly summary for Claude to fix.
- **XP:** deck items count as cards (1 XP each) within the 20-card daily maximum.

## 6. Behaviours to keep from the prototype UI

Jenil tested these and liked them.

- **Case of the day:**
  - Suspects, objects and places listed up front; clue list with tap-to-strike-through.
  - Grid taps cycle: ✗, then ✓, then clear. A ✓ auto-greys the rest of its row and column.
  - "Check my grid" outlines wrong marks in red and counts as a hint.
  - Accusation: who, object, where, with 2 tries.
  - The solution screen shows the step-by-step deduction from the solver.
  - A floating "show clues while marking" sheet.
- **Sudoku / Calcudoku:**
  - Tap a cell, then the number pad.
  - Notes mode; peers highlighted; same digits highlighted.
  - Conflicts in red by rule; cage labels; a cage whose target fails is shown red once filled.
- **Crowns:** tap cycles × → crown → clear. Conflicting crowns (row, column, region, touching) outlined red. Region colours work in light and dark.
- **Sun & Moon:**
  - Tap cycles sun → moon → clear; givens locked.
  - = and × badges on edges.
  - Red for: more than 3 of a kind in a line, three in a row, or a broken sign.
- **Number Path:**
  - Drag from 1 through every cell; dragging back over the previous cell retracts.
  - You can't enter a number out of order, and can't end on the last number before every cell is covered.
  - A live status line: "Covered 10 of 36 · next number: 4".
- **All boards:** a quiet timer (active time only, idle gaps capped at 60 s), Restart, Hint, and a result card with time, hints and best time. **Rule-based win check.**

## 7. Acceptance tests

1. Every generator × difficulty: 40 seeds per type × difficulty (`test_pz.js` default) and 300 seeds per difficulty for mysteries (`test_cases.js`). All unique; logic-solvable for every type except Number Path (uniqueness only until its solver exists). CI runs these counts; a nightly job may run more.
2. Same date + same onboarding state gives the same daily boards on two devices. The weekday table and Boss rotation are respected. A first-ever type appearance adds an easy intro board without changing the shared daily board.
3. Mind XP for the day never exceeds 80. Free Play runs earn 0 XP. Runs after bedtime earn 0 XP. A second lesson in a day earns 0.
4. The hint engine's next deduction is always valid: applying it keeps the grid consistent with the unique solution.
5. A correct alternative grid (if one ever existed) is accepted by `check()`. Test with hand-made grids that satisfy the rules.
6. The lesson option order is shuffled per attempt, and the verdict is computed against the original index.
7. One lesson per course per `dayKey`. Review mode writes no cards and no XP.
8. Plan check-ins appear only for plans 1–3 days old without an answer.
9. Legacy import, run in CI against the committed **synthetic fixture** `legacy/data/fixture-legacy-export.json` (same shape, fake data): cards with `box`/`due` state, ratings, item schedules, flags and cases map as described in `legacy/README.md`. The real export stays git-ignored and is checked once by hand on the phone (40 cards).
