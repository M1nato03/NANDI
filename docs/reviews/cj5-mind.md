# Cloud job 5.1 · Mind and puzzles: a signature mechanic

Date: 23 Oct 2026 (batch 5, written for Jenil's 24 Oct idea). Code read on `origin/main` at `55fd409`.
Branch `ideas/cj5-mind`. Only this file changes.

Question: Matiks-style duels, Storm-style speed rounds and the mystery cases. Which of these can give Mind a mechanic
that only NANDI has, stays kind, works offline now, and goes online later without a migration?

## Short answer

1. **Same-board pace line (rank 1).** You race a quiet line that shows how your best run went, or how a friend went on
   the exact board they sent you. There is no countdown and nothing to lose. v1 needs one optional field on
   `puzzleRuns` and one extra segment in the spec 19 link. v2 adds live friend duels and a weekly contest. The server
   checks every grid with the same rule checker. It takes **under 0.25 ms per grid**, so it fits Cloudflare's 10 ms
   free CPU limit.
2. **Prove it (rank 2, original).** After you name the culprit, you can tap the fewest clues that prove the case. The
   phone checks your choice itself, with no stored answer. No app I found asks the player to pick a proof set and
   then checks it by logic. This is what can make NANDI's cases its own.
3. **Split case (rank 3, original in this form).** Two friends open the same daily case from one link. Each phone shows
   half the clues, and neither half is enough. They have to talk to solve it. It is co-op, has no loser, and needs no
   server.
- A rated **Storm-style speed round is an endless feed in disguise**: each run ends, but the next run is one tap away.
  The kind version is a **fixed set of 5 boards a day, with no clock pressure, run once**. The hard stop is the count
  of boards, not the clock.
- No "makes you smarter" copy, ever. Simons et al. 2016 and Sala & Gobet 2019 find practice effects on the trained
  task only. Matiks, Elevate and Lumosity all make claims that NANDI must not copy (quotes below).

## 1. What NANDI has today (measured)

| Area | Code | Fact |
|---|---|---|
| Daily board | `src/core/puzzles/daily.ts` `featuredSpec`, `dailyBoard` | Seed `PZ.hash("daily:<day>:<type>:<diff>")`, with up to 6 retries at `+attempt*7919`. Everyone gets the same board. |
| Weekday table | `RULES.mind.featuredByWeekday` (`rules.config.ts:85`) | Mon sudoku easy … Sat crowns hard, Sun BOSS hard from `bossRotation`. **A given type is the daily board about once a week.** |
| Friend link | `challenge.ts` `challengeRoute`, `parseChallenge`; `daily.ts:54` `friendBoard` | `#mind/challenge/<YYYYMMDD>/<type>/<diff>/<seed>`. If the day and seed match today's board, it counts as the daily. **The link carries no time and no pace.** |
| Run row | `src/data/types.ts` `PuzzleRunRow`; Dexie `puzzleRuns: 'id, type, dayKey, seed'` (`db.ts:55`) | Stores `solveMs`, `activeMs`, `hintsUsed`, `hintRungs`, `grid`, `path`, `seed`, `daily`, `afterBedtime`. **No log of moves or their times.** |
| Timer | `puzzleRuns.ts:35` `accrueActive` | Counts active time only and caps idle gaps at 60 s. The run is saved on `visibilitychange`, `pagehide` and `pageshow`. |
| Check | `rules/index.ts:95` `checkRules` | Checks the grid against the rules, never against the solution. |
| Par | `mastery.ts` `parMs` | The median of the last `parWindow: 10` solves, shown after `parMinSolves: 5`. |
| XP | `awards.ts:133`; `RULES.mind` | `dropBoardXp 10`, `sideBoardXp 10` (max 1 a day), `mysteryXp 25`, `dailyCap 80`, `freePlayXp 0`. Mind pays 0 XP after bedtime. |
| Ratings | `learn/learn.ts:38` `nextRating`; `RULES.mind.eloK {early 40, later 24, earlyAnswers 20}`, `eloClamp [400, 2400]`, `hintScore 0.6` | An Elo rating exists, but only for the people-reading deck (`people`, `detective`). **Boards have no rating.** |
| Learn target | `RULES.teachingEngine.targetSuccess [0.75, 0.85]` (`rules.config.ts:131`) | Learn already aims for 75–85% success. |
| Cases | `cases.js` `generate`; `DIFF` (`cases.js:185`) | Easy and medium cases are 3×3 and hard cases 4×4. Clues are cut to a minimal set (`cases.js:340`). Uniqueness is checked with `countSolutions`, and `holds(clue, sp, si)` checks one clue. |
| Case arc | `mysteries/arc.ts` `revealedPanels` | Each solved daily case reveals a story panel, and Sunday closes the chapter. |

## 2. The mechanics studied (required table)

The "Why it works" column quotes research only. Store pages show WHAT a mechanic is. Full sources are in §8.

| App | Mechanic | What the user does and sees | Why it works (evidence, quoted) | Dark-pattern risk | NANDI v1 (offline) | NANDI v2 (online) | Kill test |
|---|---|---|---|---|---|---|---|
| Matiks | Live 1v1 maths duels | "Live Math Duels: 1v1 battles that test how fast you can think." "Compete against friends or random players worldwide" (Play Store). | Competition helps only some players: "Winners were more intrinsically motivated than losers." Losers who got "positive feedback for meeting the standard were more intrinsically motivated" (Vansteenkiste & Deci 2003). | High. Every duel has a loser, and random opponents bring strangers and pressure. | **Rewrite:** a pace line against your own best, or against a friend's run from a link (Proposal 1). Results show two times and your par, with no "lost". | Friends-only live race on a server-issued seed. Each player sees only the other's progress. No visible rating loss. At most 3 a day. | Kill if 2 or more of 6 testers say it made them rush or feel behind. |
| Matiks | Daily workouts, adaptive level | "Daily Brain Workouts". "The app adapts to your skill level as you play". | Elo-style systems target a success rate: "The system uses a target success rate (e.g., 75 %)" (Pelánek 2016). | Medium. The copy says "makes your brain faster and sharper", a claim the evidence does not support. | Keep the shared daily board fixed. A local rating picks only the *practice* board's difficulty. | Board difficulty calibrated from all players' log solve times (consented, anonymous). | Kill if practice boards picked by rating get more hints than boards picked by hand. |
| Matiks | Global leaderboards | "Global Leaderboards: Compete with players around the world- climb the ranks". | Lichess on its own speed mode: "Where there is a leaderboard, there is cheating." | High. Pressure, cheating, and public names (personal data). | None. | Friends-only boards after accounts and consent (DPDP). Nothing public. | No public board before moderation and the job 7 checks. |
| Lichess | Puzzle Storm | "Solve as many puzzles as possible in 3 minutes." Each correct move fills a combo bar for time bonuses. "When you play a wrong move, the combo bar is depleted, and you lose 10 seconds." Unrated, no leaderboard. | Speed costs accuracy: "Faster responses entail less accumulated evidence, and hence less informed decisions" (Heitz 2014). Time pressure "generally acts as a stressor, causing suboptimal strategy selection" (Caviola et al. 2017). | High. "One more run" is open-ended, the timer punishes mistakes, and puzzles get harder until you fail. | **Rewrite:** "Five boards": 5 small boards a day, the same for everyone, timed by a count-up clock with no penalties, run once (§5.2). | The same five shared by everyone, with a server-timed result. | Kill if testers start a second session the same evening more than 1 time in 5. |
| Lichess | Puzzle Racer | "Compete with other players to solve puzzles as fast as possible", "within 90 seconds". "Puzzle Racer is unrated." | As above (Heitz 2014). | High. Strangers and pure speed. | None. | Possibly a friends-only room later. Not first. | n/a |
| Chess.com | Puzzle Rush | 3 or 5 minutes, or Survival with "no time limit"; "if you get three puzzles wrong, the game ends". "Your puzzle rating won't be affected". The site's own article: "the game is very addictive". | As above. Lives that end the game are a loss state by design. | High. Lives, a loss state and the "addictive" loop. | Reject the strikes. Keep a finite set. | Same as Five boards. | n/a |
| Chess.com | Puzzle rating | "Your rating increases when you solve a puzzle correctly and decreases when you don't." | Pelánek 2016 rates solve *time* as well as right or wrong: "time to find a correct solution of a Sudoku puzzle". Glickman: Glicko-2 "works best when the number of games in a rating period is moderate to large, say an average of at least 10-15 games per player". | Medium. A rating that falls on screen is a loss state. | A hidden board-pace Elo from log solve time picks practice difficulty. What you see is a **rise-only pace band** and your personal bests. | A Glicko-2 rating for duel matchmaking, monthly periods, hidden. | Kill if any tester can see a number go down. |
| NYT (Wordle) | One shared daily puzzle, spoiler-free share | Josh Wardle: the breakthrough was "limiting players to one game per day"; "It's something that encourages you to spend three minutes a day." | Stopping cues support agency: "autoplay and recommendations primarily undermine sense of agency, while search and playlists support it" (Lukoff et al. 2021). | Low. | Already built (spec 19 B/C/D). | Already online-ready. | Already covered by spec 19's kill test. |
| NYT | Connections colour levels | "divide a grid of sixteen terms into four groups of four". Yellow is "the most straightforward" and purple "the most difficult" (Wikipedia). | Difficulty set inside one finite puzzle (Soderstrom & Bjork 2015, quoted in §3.1). | Low. | Idea only: label the steps of a case clue by depth. Not proposed. | n/a | n/a |
| NYT | Spelling Bee ranks | Praise climbs with points, "Solid", "Amazing", "Genius". Find every word for "Queen Bee" (Wikipedia). Third-party pages say each rank is a fixed share of the day's points (Genius 70%); I could not open the NYT's own page. | Positive feedback against a standard helps motivation (Vansteenkiste & Deci 2003). | Low to medium. The hidden top rank invites completionism. | Model for the pace band and the case "Proof stamp": fixed, known thresholds. No hidden rank. | n/a | Kill if testers ask what the next rank is more than they solve. |
| Brilliant | Ask first, then teach | "We don't teach how to do something before asking questions." "Each interactive problem gives instant, custom feedback". | "self-explanation prompts are a potentially powerful intervention", g = .55 (Bisra et al. 2018). | Low. | NANDI already does this (intro board first, technique card after the solve). Prove it adds self-explanation to cases. | n/a | See Proposal 2. |
| Sudoku.com | Daily challenge trophies, seasonal events | "Complete Daily Sudoku Challenges to get unique trophies"; "Seasonal Events and win unique medals". | None found for the trophy calendar. | Medium. A monthly trophy with gaps invites fear of a missed day. | None. NANDI's courtyard already grows by days, with no decay (spec 12). | n/a | n/a |
| Elevate | Personalised program, compare with others, streak | "Measure your performance … against yourself and others." "Start a workout streak … 150+ achievements". "Over 90% of users notice improvements in … overall mental sharpness". | Against such claims: "brain-training tasks seem to improve performance on the trained tasks themselves", but there is "very little evidence that it improves … everyday cognitive performance" (Simons et al. 2016). | High in the copy. | Copy rule (§3.3). | n/a | Banned-phrase check in CI (recommended). |
| Lumosity | Fit Test, daily workouts | "Take a free, 10-minute Fit Test … see how your performance compares with others your age." | The FTC said Lumosity "simply did not have the science to back up its ads" (FTC, 2016). | High in the claims. | None. | n/a | n/a |
| Racing games and VR research | Ghost of your own past run | You race a replay of your own earlier session. | Racing ghosts of one's own sessions "improves physical performance, intrinsic motivation, and flow compared to a non-competitive exergame" (Michael & Lutteroth, CHI 2020; cycling, not puzzles). | Low if there is no countdown and no loss. | **Proposal 1.** | Live friend pace. | See Proposal 1. |
| Math Garden (research app) | Elo against items, coins for speed | "people play against items (and not other people)". Items with "an average probability of 0.75 of solving the items correctly". Coins for each second left; "an error in 5 s yields a score of −15". | The same paper says the coins add "a gamifying element … keeping the children motivated". It reports no effect on anxiety. | Medium. Coins lost for a fast error are a punishing timer. | Take the Elo against items and the 75% target. Drop the coins and the penalty. | Calibrate items from all players. | n/a |
| Daily Detective | Fewest clues | "Reveal up to five clues"; "Solve today's murder with the fewest clues to top the leaderboard." | Not studied. | Medium. A leaderboard. | Closest to Prove it, but different: there you reveal *fewer* clues, here you *pick a proof* from all clues. | n/a | n/a |
| Detective Grid | Guessing blocked | "You cannot guess." "pure logic, no guessing, every step provable." | Not studied. | Low. | NANDI's hint ladder already works from the solver. | n/a | n/a |
| The Past Within (Rusty Lake), Unsolved Case | Asymmetric co-op | "both players must solve different puzzles, and they can neither see nor interact with the other person's puzzles"; "The game does not require an internet connection." | Not studied for learning. Relatedness is an SDT need (job 6). | Low. | **Proposal 3**, on generated daily cases. | A room relay with fixed messages only. | See Proposal 3. |

## 3. Evidence

### 3.1 Ratings and desirable difficulty
- **Elo works for "player vs item".** Pelánek 2016 treats "student's answer to an item as a match between the student
  and the item", so the system can "dynamically estimate the skill of students and difficulty of items". It also covers
  time-only puzzles: "time to find a correct solution of a Sudoku puzzle". The update works on log time, with
  "E(t|s, p) = dp − θs". He notes "problem solving times are log-normally distributed".
  ([CAE-elo.pdf](https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf))
- **Target rate.** Outline Maps uses "a target success rate (e.g., 75 %)" (same paper). Math Garden uses items with "an
  average probability of 0.75" ([PMC6480732](https://pmc.ncbi.nlm.nih.gov/articles/PMC6480732/)). Wilson et al. 2019
  derive "the optimal error rate for training is around 15.87%", or about 85% accuracy, but say their assumptions "may not
  always be met" and that the result "remains to be generalized" ([PMC6831579](https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579)).
  NANDI's `teachingEngine.targetSuccess [0.75, 0.85]` already sits inside this band.
- **Why "hard but solvable".** Soderstrom & Bjork 2015: the desirable difficulties framework says "what can hurt
  performance can help learning". But "when the difficulties cannot be overcome by the learner … they become
  undesirable." They also warn that performance during practice "is often an unreliable index" of learning.
  ([hwb.gov.wales PDF of the paper](https://hwb.gov.wales/api/storage/1031b700-acaf-4eda-a4bc-758715e85ff2/Learning%20versus%20Performance%20An%20Integrative%20Review.pdf))
- **Glicko-2 needs volume.** Glickman: it "works best when … at least 10-15 games per player in a rating period"
  ([glicko2.pdf](https://www.glicko.net/glicko/glicko2.pdf)). Lichess: a rating is provisional while "the Glicko-2
  deviation is greater than 110" ([Lichess FAQ](https://lichess.org/faq)).
- **What this means for NANDI.** A type is the daily board about once a week. So one player gives a per-type rating
  about 1 data point a week, which is far below Glickman's 10–15 per period. v1 therefore uses **one Elo-style
  board-pace rating across types**, with a per-board difficulty prior. Glicko-2 waits for v2 duels, with monthly periods.
  The daily board stays the same for everyone, so a rating may only choose the *practice* board.

### 3.2 Speed vs accuracy
- Heitz 2014: "Faster responses entail less accumulated evidence, and hence less informed decisions". Lowering the
  threshold "speeds RT, but also increases the probability that an error will result"
  ([PMC4052662](https://pmc.ncbi.nlm.nih.gov/articles/PMC4052662/)).
- Caviola et al. 2017 (19 studies): time pressure "generally acts as a stressor, causing suboptimal strategy selection".
  They also say "currently there is not much evidence of clear associations" and that "time constraints can sometimes
  prove beneficial" ([PMC5585192](https://pmc.ncbi.nlm.nih.gov/articles/PMC5585192)).
- **What this means for NANDI.** Keep the count-up clock that counts active time only. No countdown, no time penalty
  and no lives. A mistake costs nothing, and the rule checker marks it in red. The rating uses only solved boards and
  their log times, and a hinted solve scores `hintScore 0.6`. The result shows the "No-hint clear" stamp and the
  hints count before the time.

### 3.3 The brain-training transfer debate (copy rule)
- Simons et al. 2016 (*Psychological Science in the Public Interest*): training improves "the trained tasks
  themselves". There is "less evidence" for "closely related" tasks, and "very little evidence" for "distantly related
  tasks or … everyday cognitive performance" ([APS summary](https://www.psychologicalscience.org/publications/brain-training.html)).
- Sala & Gobet 2019 (*Trends in Cognitive Sciences*): "minimal effect on domain-general cognitive skills". The field
  "has showed no appreciable benefits" ([LSE](https://researchonline.lse.ac.uk/id/eprint/102168)).
- FTC v. Lumosity (2016): "Lumosity simply did not have the science to back up its ads"
  ([FTC](https://www.ftc.gov/news-events/news/press-releases/2016/01/lumosity-pay-2-million-settle-ftc-deceptive-advertising-charges-its-brain-training-program)).
- **Copy rule.** Keep spec 04's line: "You get faster at what you practise; the real win is an active three minutes
  instead of a passive scroll." Never use: smarter, sharper, IQ, brain training, boost memory, "your brain thanks you".
  Matiks ("makes your brain faster and sharper") and Elevate ("Over 90% of users notice improvements … mental
  sharpness") are the copy to avoid. Recommendation (not done here): add these phrases to `npm run banned-words`.

### 3.4 Competition, ghosts and explaining
- Vansteenkiste & Deci 2003: "Winners were more intrinsically motivated than losers." Losers given a standard who got
  "positive feedback for meeting the standard were more intrinsically motivated" than losers without it. So any duel
  must show each player against **their own** standard (par, personal best) as well as the other player.
  I could not open Reeve & Deci 1996 (SAGE returned 403), so I cite only what I read.
- Michael & Lutteroth 2020 (CHI): racing ghosts of one's own sessions "improves physical performance, intrinsic
  motivation, and flow compared to a non-competitive exergame". This was cycling in VR. Whether it holds for puzzles is
  untested ([Bath](https://researchportal.bath.ac.uk/en/publications/race-yourselves-a-longitudinal-exploration-of-self-competition-be/)).
- Bisra et al. 2018 (64 reports): self-explanation is "a process by which learners generate inferences about causal
  connections". "The overall weighted mean effect size … was g = .55." ([PDF](https://www.Gwern.net/doc/psychology/spaced-repetition/2018-bisra.pdf))
- Lukoff et al. 2021 (CHI): "autoplay and recommendations primarily undermine sense of agency, while search and
  playlists support it" ([arXiv](https://ar5iv.labs.arxiv.org/html/2101.11778)). This is why every Mind loop ends on a
  stopping screen that the user chose to reach.

## 4. Duels, async and live, and how a server stops cheating

### 4.1 v1 offline (now)
- **Against your past self.** On any board, an optional pace line shows your best run of the same type and difficulty.
  The dot shows how many cells were filled after how much active time. A different board of the same type is only a
  rough guide, so the label says "your best Crowns medium pace", never "your best on this board".
- **Against a friend, async, through spec 19's link.** The friend's link adds one segment, `p<10 numbers>`: the
  friend's active seconds at 10%, 20% … 100% filled. That is about 40 characters in base 36.
  `parseChallenge` destructures only `[type, diff, seed]` (`challenge.ts:36`), so **older app versions ignore the
  extra segment**. Today's link-as-daily rule (`friendBoard`) is unchanged.
- **No punishing timer.** The pace line never ends your run, never counts down, and never says "lost". At the finish
  you see `4:12 · Riya 3:50 · your par 4:30`. When you beat your par, that is the line in bold.
- **Trust.** Nothing is verified offline. A friend could edit the link, but there are no stakes, no XP for the
  comparison and no public board, so editing gains nothing.

### 4.2 v2 online (after the job 7 stages)
- **Live 1v1 (friends only, accounts and consent first).** A Durable Object room hands out a seed at start. Each phone
  generates the board itself and sends progress (a filled fraction, never cells) every few seconds. The other side's
  pace line moves live. At most 3 duels a day, none after bedtime, and nothing beyond the existing Mind XP cap.
- **Weekly contest.** 3 boards, a 24-hour window, one attempt each. The score is the sum of log active times, with a
  hinted board scored at `hintScore`. Results show your band and your own trend, never a falling number.
- **Matchmaking.** Glicko-2, hidden, monthly periods. Duel volume can reach 10–15 games a period; the daily board
  cannot.

### 4.3 How a server verifies seeded puzzles
Measured in the scratchpad (Node 22, 20 seeds per type and difficulty, the repo's `puzzles.js` and `rules/index.ts`):

| Step | Cost measured | Fits Workers free (10 ms CPU)? |
|---|---|---|
| `checkRules(board, finalState)` on a solved grid | max **0.25 ms** (crowns), most under 0.04 ms | Yes |
| `PZ.generate` easy/medium | p50 0.2–25 ms | Sometimes no |
| `PZ.generate` hard | crowns p50 48 ms, path p50 59 ms, max **327 ms** | **No** |
| Case: all clue subsets for the shortest proof | worst **12 ms** (hard, 10 clues) | Borderline. One proof check is far cheaper. |

The server design follows from these numbers:
1. **The server keeps boards, it does not generate them per request.** CI (GitHub Actions) generates each contest's
   boards from `hash(serverSecret + contestId)` and uploads the board JSON to KV or D1. At start the server reveals the
   seed and the board.
2. **Daily boards can never be ranked.** `dailyBoard(day)` can be computed for any future day from the public bundle,
   so anyone can solve tomorrow's board tonight. Only server-revealed seeds count for anything shared.
3. **Check the final state by rules:** `checkRules(board, state).solved`. This is the same rule as on the phone, and
   never a comparison with the stored solution.
4. **Replay the move log.** An optional `moves` log `[cell, value, ms]` must rebuild the final state. Its times must
   rise and must not exceed the elapsed time the server measured between reveal and submit. The server's elapsed time
   is the upper bound, and the client's `activeMs` counts only if it is lower.
5. **Plausibility flags, not bans:** too many moves under 150 ms, no corrections at all on a hard board, or moves in
   exactly the solver's order (`availableDeductions` order). A flag hides the result from the friends board until
   someone looks at it.
6. **Small stakes.** No prizes and no money, as Lichess warns: "Where there is a leaderboard, there is cheating."
   Friends-only boards first.
7. **Rate limits** per account, and one attempt per contest board.

What this cannot stop: someone running a solver on a second device and copying moves in at a human pace. With no
prizes that is acceptable. Do not add prizes.

## 5. Is a rated speed round a kind endless feed, or one in disguise?

### 5.1 Verdict on Storm and Rush as they are: **in disguise. Reject.**
| Test | Storm / Rush | Hard rule |
|---|---|---|
| Does each run end? | Yes, after 3 or 5 minutes, or 3 strikes | ok |
| Does the *session* end? | No. The next run starts with one tap, and the best-score chase has no end | **endless feed** |
| Timer | Countdown; a wrong move costs 10 s (Storm), or three strikes end the run (Rush) | **punishing timer, loss state** |
| Difficulty | Puzzles "become more difficult as you progress through the run", so every run ends in failure | **loss state** |
| The site's own word | "the game is very addictive"; "once you start playing it is difficult to stop!" | warning |

### 5.2 The kind version: "Five boards" (optional, not one of the top 3)
- **What it is.** 5 small boards (4×4 or 5×5, one per type) are seeded `hash("five:<day>")`, the same for everyone.
  A count-up clock runs. A mistake is shown and costs nothing. There are no lives and no combo.
- **The hard stop is the count.** After board 5 comes a stopping screen ("Five done. Next set tomorrow at 04:00.") with
  one button, "Back to planner". The set cannot be replayed that day. Unlimited practice stays in Free Play at 0 XP,
  where it already is.
- **XP.** It uses the existing side-board slot (`sideBoardXp 10`, `sideBoardsMaxPerDay 1`), so the 80 cap is unchanged.
  It pays 0 XP after bedtime and is hidden in wind-down.
- **Rated?** Only the first run of the day updates the hidden pace rating. What the user sees is the rise-only band.
- **Why it is not ranked higher.** It adds a third daily item to Mind, which spec 04 wants finite and small. Build it
  only if Proposal 1's pace line shows that people want more speed.

## 6. What makes NANDI's mystery cases unique

What NANDI already has: logic-grid cases in Indian settings (garba, haveli, a night train, a wedding), generated and
checked for uniqueness on the phone, with a season story arc. The grid format itself is common: Murdle's preview has the
detective "drew a grid … so that every square represented a unique potential pairing"
([Murdle preview PDF](https://profilebooks.com/wp-content/uploads/wpallimport/files/PDFs/9781800818057_preview.pdf)).
The Indian settings help, but they are not a mechanic.

The two shows Jenil named point at reasoning you can *show*, not at more grids:
- *The Mentalist*: Jane "uses highly developed observational skills to "read" people's minds and to solve murder cases"
  ([Wikipedia](https://en.wikipedia.org/wiki/The_Mentalist)).
- *Drishyam*: the alibi rests on "restaurant bills, movie tickets, and bus receipts". He "trickily conditioned the
  witnesses' memories to inadvertently validate a false timeline" ([Wikipedia](https://en.wikipedia.org/wiki/Drishyam)).

So the signature is **Prove it** (§7.2): after the accusation, you show *why* it is true, and the phone checks the
proof by logic. A later Sunday variant takes Drishyam's idea, "receipts vs testimony": exactly one statement is false,
the receipts settle which one, and uniqueness is checked over "which statement is false". No names, characters or plots
from either show go into the app.

Measured on 100 generated cases per difficulty (scratchpad script, the repo's `cases.js`):

| Difficulty | Clues p50 (min–max) | Shortest proof p50 (min–max) | Cases where the proof needs every clue | A split where neither half proves it |
|---|---|---|---|---|
| easy (3×3) | 5 (4–6) | 4 (3–6) | 25 of 100 | 100 of 100 |
| medium (3×3) | 5 (4–6) | 4 (2–6) | 30 of 100 | 100 of 100 |
| hard (4×4) | 8 (5–10) | 6 (2–10) | 23 of 100 | 100 of 100 |

In about a quarter of cases every clue is needed, so "Prove it" would be trivial there. **Offer it only when the
shortest proof is smaller than the clue list.** A split case was possible in every sample.

## 7. Three ranked proposals

Score: 1–5 each (fit, kindness, evidence, build cost; higher is better).

| Rank | Proposal | Original? | Fit | Kind | Evidence | Build | Size |
|---|---|---|---|---|---|---|---|
| 1 | Same-board pace line | No (racing-game ghost) | 5 | 4 | 3 | 5 | S |
| 2 | Prove it | **Yes** (closest: Daily Detective, Detective Grid) | 5 | 5 | 4 | 3 | M |
| 3 | Split case | **Yes in this form** (closest: The Past Within, Unsolved Case) | 4 | 5 | 2 | 3 | M |

### 7.1 Rank 1 · Same-board pace line
- **What the user does.** On the board screen, tap "Show my pace" once (the choice is remembered). A thin line above the
  board carries two dots: you and your best, or you and the friend whose link you opened. At the finish:
  `4:12 · Riya 3:50 · your par 4:30`. Nothing happens when the other dot arrives first.
- **v1 data (no migration).**
  - `PuzzleRunRow.pace?: number[]`: 10 active-ms marks at 10%…100% filled. Not indexed, so no Dexie version bump.
  - Backup rows are `v.record(v.string(), v.unknown())` (`backup/index.ts:36`), so old and new backups restore both ways.
  - Per CLAUDE.md, still add a backup round-trip test with a run that has `pace`.
- **v1 link.** `.../<seed>/p<base36 marks>`. Old parsers ignore it (`challenge.ts:36`).
- **v1 rules.** Hidden after bedtime and in wind-down, like shares. 0 extra XP. Off under the motion toggle (a static
  "best 3:50" label instead).
- **v2.** Live friend pace through a Durable Object, weekly contest, hidden Glicko-2 matchmaking (§4.2). The `pace` marks
  and an optional `moves` log become the server's replay input (§4.3).
- **Hard-rule test.**
  - Loss state? No "lost" and no falling number. Pass.
  - Punishing timer? It counts up and never ends a run. Pass.
  - Feed? It works on existing finite boards. Pass.
  - Pressure? It is opt-in, and the user's own par is shown in bold. Pass, but the kill test must watch for rushing.
- **Kill test (Jenil + 5 friends, 2 weeks).** Kill or change it if any of these happen:
  - 2 or more of 6 answer yes to "did the line make you rush or feel behind?";
  - the no-hint clear rate drops by 10 points or more against their previous 2 weeks;
  - fewer than 3 of 6 still have it on in week 2.

### 7.2 Rank 2 · Prove it (original)
- **What the user does.** After a correct accusation, one optional card asks "Which clues prove it?" Tap clues in the
  list, then "Check".
  - If the chosen clues fix the culprit, the object and the place, a **Proof stamp** goes on the case card.
  - If not, the app shows the case that still fits ("These clues still allow Meera in the canteen") and you try again.
    Tries are unlimited, nothing is lost, and Skip is always there.
  - After a pass, "Another proof" shows one shortest proof, worded neutrally.
- **Check (pure core, no stored answer).** `proves(mystery, clueIdx[])` enumerates every assignment (36 for 3×3, 576 for
  4×4). It keeps those where `CaseGen.holds` is true for each chosen clue, and passes if all give one culprit, object
  and place. Measured: the shortest-proof search takes ≤ 12 ms in Node, and a single check much less. Run it in the
  existing puzzle worker.
- **Shown only when it adds something:** when the shortest proof is smaller than the clue list (about 70–77% of cases,
  §6).
- **XP.** 0 extra. `mysteryXp 25` and the 80 cap are unchanged. The stamp is a fixed, announced result, never random.
- **v1 data (no migration).** `PuzzleRunRow.proof?: number[]` (clue indexes in the generated order) on the `mystery` run.
  No ledger fact, so `areaOf` and the economy do not change.
- **v2.**
  - The share text gains `proved in 3 clues`. This is spoiler-free: a count only, no clue text.
  - The server checks a shared proof with the same `proves`.
  - With consent, anonymous `(seed, diff, proofSize, solveMs)` from many players calibrates case difficulty
    (cases already carry `D` 950/1150/1350 in `cases.js:185`).
- **Why it should work.** Self-explanation g = .55 (Bisra et al. 2018). It turns a solved grid into a stated reason,
  which is the "showable reasoning" both shows are about.
- **Originality search.** I searched for "choose the fewest clues that prove the culprit" and for detective apps.
  - Closest: **Daily Detective**, "Solve today's murder with the fewest clues to top the leaderboard". There you reveal
    fewer clues *before* solving, ranked on a leaderboard.
  - **Detective Grid**: "You cannot guess." It blocks unprovable choices *during* solving.
  - **The Case of the Golden Idol**: fill-in-the-blank deduction. Its developers found "evaluating the whole puzzle as
    wrong or right frustrated the players" and added an indicator that "two or fewer slots are incorrect".
  - None asks the player to pick a proof set from all clues *after* solving and checks it by logic. Prove it borrows
    Golden Idol's "show what still fits" kind of feedback.
- **Hard-rule test.** Optional, unlimited tries, no loss, no timer, no new reward loop. Pass. Risk: it can feel like
  homework, so it stays one card and is skippable.
- **Kill test.** Kill it if, in week 2:
  - fewer than 1 in 4 solved cases try it;
  - 2 or more of 6 say "homework";
  - the daily case solve rate drops by 10 points or more.

### 7.3 Rank 3 · Split case (original in this form)
- **What the user does.** On the daily case, "Solve with a friend" sends a link:
  `#mind/case/<YYYYMMDD>/<diff>/<seed>/a`.
  - Your phone keeps half A. The friend's phone opens half B of the same generated case.
  - Each phone shows its own clues plus "Your friend has 3 more clues". They talk in person, by call or in WhatsApp,
    mark their own grids and each accuse.
  - Neither phone shows the other's clue text, so they must say it aloud or type it.
- **Split rule (pure core).** Split the minimal clue list into two halves of size ⌊m/2⌋ and ⌈m/2⌉ so that
  `proves(halfA)` and `proves(halfB)` are both false. The search order is seeded, so both phones get the same split.
  Feasible in 300 of 300 sampled cases (§6). The union is the full minimal set, so the solution stays unique.
- **XP and daily credit.** As spec 19 D: only today's daily case on today's day counts as the daily (`mysteryXp 25`). Any
  other split case is practice at 0 XP. There is no winner, and both phones keep their own result.
- **v1 data (no migration).** `PuzzleRunRow.split?: 'a' | 'b'` on the mystery run.
- **v2.** A friends-only room relays **fixed** messages only ("I have a clue about Meera", or tap to reveal one of your
  clues to your friend). No free text, so **no moderation is needed** (job 7). Accounts and consent come first.
- **Why it might work.** Relatedness through a shared task, without competing. There is evidence on SDT needs (job 6),
  but no study of this exact mechanic, so the evidence score is 2.
- **Originality search.** "two-player split clues logic grid", "asymmetric co-op puzzle".
  - Closest: **The Past Within**: "both players must solve different puzzles"; offline, but hand-made, one-off and paid.
  - **Unsolved Case** (Cryptic Killer series): "You'll see different items and clues than your partner" (from an
    apptopia listing summary I did not open).
  - **Parallel Experiment**: needs "Internet connection and voice communication" (App Store, via search summary).
  - None splits a *generated daily* logic case over two phones from one link, with the split checked by a solver.
- **Hard-rule test.** No loser, no timer, user-sent link only, hidden after bedtime. Pass.
- **Kill test.** Kill it if, in 2 weeks:
  - fewer than 3 of 6 testers finish one split case with someone;
  - the median split case takes more than 15 minutes (too long for the night slot);
  - testers say it needs the friend at the same time and that this is a problem.

## 8. Code findings (not fixed here)

| File / function | Finding | Severity |
|---|---|---|
| `src/ui/mind/CaseScreen.tsx:188`; `src/data/repos/learn.ts:81-87` | Spec 04 §5 says case scores (1 / 0.7 / 0) feed the Elo rating. The daily case writes `score` from `RULES.mind.caseScore` onto the run, but **nothing updates the `detective` rating from daily cases**. Only deck mini-mysteries call `nextRating`. A spec/code gap, unless this was dropped on purpose. | Low |
| `src/ui/screens/Mind.tsx:404` | The challenge board says "Same board your friend solved. Beat their time." **The link carries no time** (`challengeRoute`), so the app cannot show the friend's time. Proposal 1's `p` segment would fix this; otherwise reword it. | Low (copy) |
| `src/core/mysteries/cases.js:363` `dailyDiff` | Makes **Saturday** hard. `RULES.mind.caseDiffByWeekday` makes **Sunday** hard. Unused at runtime (callers always pass `caseDiff`), but it is a trap for v2 server code that calls `CaseGen.daily(date)` without a difficulty. | Latent |
| `RULES.mind.dropUnlockTime: '07:00'` (`rules.config.ts:84`) | Still not read anywhere in `src/` (also found by cj-puzzle-share). Boards change at 04:00. | Known |
| `src/core/puzzles/daily.ts:22` `dailyBoard` | Any future day's board can be computed from the public bundle. Fine offline; **never rank daily boards online** (§4.3). | Design note |

## 9. Build-now steps so v2 needs no migration
1. Add optional `pace?: number[]` (and later `moves?`) to `PuzzleRunRow`, with a backup round-trip test.
2. Keep every check a pure function in `src/core` (`checkRules`, the new `proves`, a split helper), so a Worker can
   import the same code.
3. Add the extra link segment only as an *appended* segment, so old parsers keep working.
4. Keep the visible pace band rise-only, and keep any rating internal, from day one.
5. Add the "no brain-training claims" phrases to the banned-words check.

## 10. Sources

Opened and quoted:
- Matiks Play Store listing (`com.matiks.app`, fetched with curl): https://play.google.com/store/apps/details?id=com.matiks.app
- Lichess Puzzle Storm: https://lichess.org/page/storm · Puzzle Racer: https://lichess.org/page/racer · FAQ: https://lichess.org/faq
- Chess.com help, "How do puzzles work": https://support.chess.com/en/articles/8608686-how-do-puzzles-work-on-chess-com
- Chess.com article "Are you addicted to Puzzle Rush?": https://www.chess.com/article/view/are-you-addicted-to-puzzle-rush
- Wordle, AP via Boston.com: https://www.boston.com/news/national-news/2022/01/04/he-made-wordle-for-his-partner-now-its-an-online-hit/
- Connections: https://en.wikipedia.org/wiki/The_New_York_Times_Connections · Spelling Bee: https://en.wikipedia.org/wiki/The_New_York_Times_Spelling_Bee
- Brilliant about page: https://brilliant.org/about/ · Brilliant, Sudoku.com, Lumosity and Elevate Play Store listings (`org.brilliant.android`, `com.easybrain.sudoku.android`, `com.lumoslabs.lumosity`, `com.wonder`)
- FTC v. Lumosity: https://www.ftc.gov/news-events/news/press-releases/2016/01/lumosity-pay-2-million-settle-ftc-deceptive-advertising-charges-its-brain-training-program
- Simons et al. 2016 (APS summary page): https://www.psychologicalscience.org/publications/brain-training.html
- Sala & Gobet 2019: https://researchonline.lse.ac.uk/id/eprint/102168
- Pelánek 2016, accepted manuscript: https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf
- Math Garden paper: https://pmc.ncbi.nlm.nih.gov/articles/PMC6480732/
- Wilson et al. 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579
- Soderstrom & Bjork 2015 (full PDF): https://hwb.gov.wales/api/storage/1031b700-acaf-4eda-a4bc-758715e85ff2/Learning%20versus%20Performance%20An%20Integrative%20Review.pdf
- Glickman, Glicko-2 example: https://www.glicko.net/glicko/glicko2.pdf
- Heitz 2014: https://pmc.ncbi.nlm.nih.gov/articles/PMC4052662/
- Caviola et al. 2017: https://pmc.ncbi.nlm.nih.gov/articles/PMC5585192
- Vansteenkiste & Deci 2003: https://www.mv.helsinki.fi/home/hotulain/Deci.pdf
- Michael & Lutteroth 2020: https://researchportal.bath.ac.uk/en/publications/race-yourselves-a-longitudinal-exploration-of-self-competition-be/
- Bisra et al. 2018: https://www.Gwern.net/doc/psychology/spaced-repetition/2018-bisra.pdf
- Lukoff et al. 2021: https://ar5iv.labs.arxiv.org/html/2101.11778
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Daily Detective: https://dailydetective.org/ · Detective Grid: https://detectivegrid.com/
- Golden Idol interview: https://www.gamedeveloper.com/design/case-of-the-golden-idol
- The Past Within: https://en.wikipedia.org/wiki/The_Past_Within · Murdle preview: https://profilebooks.com/wp-content/uploads/wpallimport/files/PDFs/9781800818057_preview.pdf
- Drishyam: https://en.wikipedia.org/wiki/Drishyam · The Mentalist: https://en.wikipedia.org/wiki/The_Mentalist

Could not be opened (nothing quoted from them):
- matiks.com (403, a Cloudflare challenge page). Matiks' rating system is therefore unknown; no official page describes it.
- No Matiks App Store page was found.
- Lichess blog "Puzzlers on the storm" (403).
- Bjork lab PDFs: Bjork & Bjork 2011 and Bjork & Bjork 2020 (503 and connection reset). Used Soderstrom & Bjork 2015 instead.
- UNH copy of the Bjork chapter (503). PubMed 25910388 (cookie wall).
- Reeve & Deci 1996 on SAGE (403). Standage et al. 2005 PDF (403). selfdeterminationtheory.org PDF (404).
- Shaw et al. 2016, PeerJ (403). nytimes.com (blocked for the fetch tool). Sportskeeda Spelling Bee guide (403).
- Grid Game Arcade (App Store): the page opened, but it does not mention a ghost, so the claim of a friend ghost is unconfirmed.
- Unsolved Case and Parallel Experiment pages were not opened; their lines in §7.3 come from search summaries and are marked so.
