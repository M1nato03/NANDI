# 26. Moti's haveli and matka; Kachhua's kolam by the clock

Status: APPROVED. Games approved by Jenil on 25 Oct 2026 (Moti: "excellent, it cannot get better than this";
Kachhua: "excellent, try to add different patterns based on time"). The written spec was approved on 26 Oct 2026
("okay go ahead").
Idea engine, 25 Oct 2026. Demo: https://claude.ai/artifact/LVWKWGavbn6VpE6uxRvWEA (Moti and Kachhua tabs).
Inputs: cloud jobs cj8-check, cj8-matka-tarazu, cj8-kolam, cj9-kolam-clock (branches named below).
Spec 25 applies: each friend's game sits on that friend's own stage colour (Moti rose, Kachhua indigo).

## Part A · Moti (Memory): the haveli and the matka

### A1. The haveli (daily review)

- Every idea the learner has finished lives in a room of Moti's haveli: one room per topic, one diya per idea.
- **Review = rebuild.** To light an idea's diya, the learner puts its one-line takeaway back together from
  3 big word pieces, in order. 2 decoy pieces sit among them; each decoy is one of that idea's real
  `misconceptions` from the pack. Tapping a decoy shows the misconception's fix line, and the piece goes back.
- Rebuilt correctly = the diya is lit for today. Nothing ever dims, fades or goes dark. An unvisited room just
  stays as it was.
- **Daily cap:** at most 5 ideas a day (`rules.config.ts` `mind.haveli.dailyCap`, bounds 3-8). Then a stop
  screen: "The haveli is quiet for today." No "more" button.
- Which ideas: due ideas from the existing spacing data first, then the oldest unvisited. Deterministic, no
  random picks.
- Content: each idea needs `takeaway` split into 3 pieces (`concept.recall.pieces: [string, string, string]`).
  Draft them from the existing takeaway lines; editors sign off. Ideas without pieces are skipped, never
  faked.
- XP: flat per rebuilt idea, same as today's review XP. A decoy tap costs nothing.

### A2. The matka (weekly)

Use cj8-matka-tarazu exactly (origin/ideas/cj8-matka-tarazu, docs/reviews/cj8-matka-tarazu.md, sections
"Store from now", "Two levels", "Rules", "Shift" and "Reveal copy (exact)"). In short:
- **Store first guesses from now on (M1-M2).** Today only `hookCorrect` is kept; the hook pick and the
  estimate number are lost. Save `hookPick` and `guess` plus `answerValue` at answer time, frozen: never
  editable afterwards. (The cj8 check found `estimateMin` can be edited after the fact; first guesses must not
  be.)
- Weekly, Sunday, 3 items from facts 5-21 days old, chosen deterministically. Moti asks "What was your first
  guess?", then cracks the matka and shows Sealed / You remembered / Answer.
- The copy blames "the mind" in general and never the user. Use the exact lines from the cj8 report. No
  "wrong", "should", "your brain" or "everyone".
- Flat XP for answering, whatever the result. "Not sure" is a full answer. Not offered after bedtime.
- Footer once: "Hindsight bias: Fischhoff 1975; Fischhoff & Beyth 1975." No training claims.

### A3. Moti's animations (standing rule: every friend animates)

| Moment | Size | Animation |
|---|---|---|
| Haveli opens | minor | Moti looks up and the nearest room's diya flickers on. |
| Right piece placed | minor | Moti nods. |
| Decoy tapped | minor | Moti tilts its head, "hmm", and the piece floats back. No red, no shake. |
| Idea rebuilt | major | Moti carries the diya into the room; the room glows warm. |
| Daily cap reached | minor | Moti sits in the courtyard (rest pose). |
| Matka cracked | major | Moti taps the matka; it opens in two halves and the sealed card rises. |

All honour prefers-reduced-motion (a pose change only), play once, and never block taps.

## Part B · Kachhua (Night): the kolam by the clock

### B1. The game

- One kolam a night. Trace it with one finger in one unbroken line. The line only grows while the finger moves
  slowly (cj8-kolam tracing rule: sample the path every 3 px, about 0.25 px/ms limit on a 360 px phone).
  Going fast is never an error: Kachhua tucks into its shell until you slow down, and the line waits.
- **"Draw it for me"** is always offered (accessibility). It draws the line slowly while you watch.
- There is no countdown, speed score, error state or reset.

### B2. Patterns by time, date, moon and season

Use `content-drafts/kolam/kolam.ts` and `clock.ts` from origin/ideas/cj9-kolam-clock (42e26f8).

| Local time (04:00 night boundary) | Size | Margazhi (16 Dec-14 Jan) |
|---|---|---|
| 04:00-20:59 | 5×5 | 5×5 |
| 21:00-22:59 | 4×4 | 5×5 |
| 23:00-03:59 | 3×3 (quick, so the game helps you stop) | 4×4 |

- The night's date (YYYY-MM-DD, local, 04:00 boundary) seeds the pattern, so it is the same for everyone that
  night. The seed also picks one of three families: base, rim-turns, inner-turns.
- **3×3 variety fix (required).** The cj9 count found the base 3×3 gives only 2 layouts in a year. At 3×3 the
  selector draws from all three families together, and the app keeps the hashes of the last 30 nights'
  layouts on the phone. If tonight's layout matches one of them, it steps the seed until it finds an unseen
  one, trying at most 50 seeds before it allows a repeat. Test: across 366 nights at 3×3, no layout repeats
  within 30 days unless all candidates are used up.
- **Full moon** (computed offline from the synodic month) draws the line in silver instead of chalk white.
- Margazhi adds one size, up to 5×5, as in the table. The label "one size bigger" shows only when the size
  really grew.
- There is no Breath kolam on main (cj9 checked), so this is the app's only kolam.

### B3. After bedtime

As in cj9-kolam-clock, using the effective bedtime (including any shifted night):
- After bedtime: 0 XP, and no collectible, badge, gallery entry, unlock, streak change or new-content prompt.
- The kolam stays available for quiet tracing.
- The completed pattern is the end screen, with exactly these two lines:
  "The line is complete." / "That's enough for tonight. Put the phone down."

### B4. Respect

- Present kolam as a living everyday art from Tamil Nadu and South India. Make no religious or "calm" or
  "sleep" claims.
- The two new families are layout studies, not traditional named designs; do not call them lotus or star.
- Before launch, ask one Tamil kolam practitioner to look at the patterns and the wording.

### B5. Kachhua's animations

| Moment | Size | Animation |
|---|---|---|
| Night opens | minor | Kachhua blinks at the dots. |
| Tracing slowly | minor | Kachhua walks along beside the line. |
| Too fast | minor | Kachhua tucks into its shell and peeks out when you slow down. |
| Line complete | major | Kachhua yawns and curls up beside the finished kolam (rest pose); the line glows briefly. |
| Full moon night | minor | A small moon rises behind Kachhua. |

Reduced motion: pose changes only. Nothing loops except a slow breathing loop on the final rest pose.

## Data and online-ready

- Moti: `concept.recall.pieces` in packs (content), a `haveli` visit row per idea per day, and ledger kinds per
  cj8 (M1-M4). All of it stays on the phone in v1. v2 sync uses the same rows.
- Kachhua: a local list of the last 30 layout hashes, plus a `kolam` completion row (date, size, family, after
  bedtime yes/no). Patterns are generated on the phone, so nothing is downloaded.

## Tests

- Haveli: a decoy shows its fix and costs nothing; a correct rebuild lights the diya; nothing ever dims; the
  daily cap stop screen; ideas without pieces are skipped.
- Matka: first guesses are saved and frozen (an edit attempt changes nothing); the weekly pick is deterministic;
  every reveal variant uses the exact copy; flat XP; not offered after bedtime.
- Kolam: the size table at 20:59 / 21:00 / 22:59 / 23:00 / 03:59 / 04:00; the Margazhi edges (15 Dec,
  16 Dec, 14 Jan, 15 Jan); the full-moon colour; the 3×3 no-repeat-within-30 rule; after-bedtime 0 XP and the
  exact end screen; "Draw it for me"; slow tracing at 360 px with root font-size 20 px.
- Every animation is off under reduced motion.

## Out of scope

Bol sets, the steady diya and the shadow play (all rejected for Nandi). Nandi's game, Kapi's familiar
puzzles and Chiku's animated answer come in their own specs.
