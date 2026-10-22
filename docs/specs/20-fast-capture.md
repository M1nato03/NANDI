# 20 · Fast capture: type it the way you'd say it

Status: idea engine (jenil-8c), 22 Oct 2026; revised after a Codex review against ship-27. Medium (about 1–2 days). Evidence: cloud job 8 of batch 1
(`docs/reviews/cj-planner-speed.md` on `ideas/cj-planner-speed`, which holds the full parser rules, a 23-row table of
real prototype outputs and the competitor quotes). The dropped-task bug it found is already fixed in ship-27
(`tests/e2e/quick-add.spec.ts`). Jenil (22 Oct): "a good idea, but it needs insane accuracy; learn from how Hinglish
understanding systems work". The accuracy section below answers that and is now the core of the spec. Build starts
only after the gold test set exists and Jenil says yes to this version.

## Today (measured)
- Capturing 6 ordinary tasks ("gym 6pm", "kal subah call mom", "physics assignment fri 11pm", …) took about
  **40–55 touches** on the live build (main 78d1a28; ship-27's capture code is the same apart from the drop fix). TickTick and Todoist take about **12**, because they read dates and times from the text.
- NANDI reads only a trailing `15m`/`2h`. Every time needs a picker; size, category, Must/Could and repeat sit in the
  open form; a task with no time lands at "today, next hour", so 6 quick lines all pile onto one hour; after a save
  only the title and repeat reset, so the last task's size, category and slot carry into the next one.
- Upcoming rows show a time with no day.
- No competitor documents Hindi or Hinglish dates. "kal subah", "6 baje", "shaam ko" would be ours alone.

## The change
1. **One always-open line** at the top of Plan. Placeholder: `gym 6pm · kal subah call mom`.
2. **A chip shows what NANDI understood** while you type: `Fri 8:00 am · 30 min`. Tapping its ✕ keeps the words as
   plain title text (TickTick's pattern). The chip is the safety net: nothing is guessed silently.
3. **Enter saves, the line clears, focus and keyboard stay.** A polite live region says `Added: call mom · Fri 8:00 am`,
   replaced on every save, never stale.
4. **Paste several lines** → one sheet "Add 6 tasks?" (Add / Cancel); each line goes through the same parser.
5. **Size, category, Must/Could, repeat, exact time** move behind a "More" link and reset after every save.
   Defaults: Could, 30 min, general. A parsed Must still obeys `maxMustsPerDay`.
6. **Upcoming rows show the day** ("Fri 8:00 am") with the existing `formatDayKey`.
7. **A line with no time or day goes to Unplaced** (the existing status), not to the next hour. Morning planning places
   it. Plan shows "Unplaced (n)" as a visible row, not folded under Later. A quick-captured task that was **never
   placed** is exempt from the 14-day move to Someday (`task-machine.ts`, `tasks.ts` reconcile), so the inbox never
   quietly recedes. (Open question for Jenil, below.)
8. **Every per-task field resets after each save** (estimate, size, category, priority, slot, repeat).

## The parser: `src/core/tasks/capture.ts`
`parseCapture(text, now) → { title, dayKey?, startAt?, estimateMin? }`. Pure TypeScript, offline, no dependency, no
React or Dexie, tests written first. All word lists and hours live in `rules.config.ts` under `tasks.capture`, logged
in `DECISIONS.md`. The rules (full table in the cloud report):
- Days: `aaj/today/tonight` +0, `kal/tomorrow/tmrw` +1, `parso` +2, counted from the **planning day** (`dayKey`, rolls
  at 04:00), so "kal" typed at 1:30 am means the coming morning. English and Hindi weekdays (`fri`, `shukravar`…).
- Parts of day: `subah/morning` 8, `dopahar/afternoon` 14, `shaam/evening` 18, `raat/night` 21; `ko` dropped.
- Clock: `6pm`, `6:30`, `at 9`, `6 baje`, `saade 6 baje`. A bare number is a time **only** with am/pm, `baje`, `:mm`,
  `at` or a part-of-day word, so `read 50 pages`, `chapter 5`, `room 101` stay as typed.
- A time already past today with no day word moves to tomorrow (the chip shows it). Hours 0–3 belong to the planning
  day before. A day with no time starts at 09:00 (matches the existing Shutdown copy).
- Durations: `15m`, `45 min`, `1.5h`, `2 ghante`; over 90 minutes still opens the split preview automatically.
- Ambiguity keeps words in the title: when two date words conflict ("call mom at 9 tonight about fri trip"), the first
  wins and the other stays as text; uppercase `SAT` is never Saturday; no month names in v1 ("may meeting" stays text).
- The chip shows the **calendar** date for a start between 00:00 and 03:59 ("Sat 1:00 am"), and says "9:00 am (default)"
  when a day had no time. Starts after bedtime are allowed but the chip says "after your bedtime".
- Repeat stays available under "More" and still needs a scheduled time. The Must cap (3) is enforced by the repository
  for single and pasted adds alike.
- `kal` meaning "yesterday" is ignored: tasks are never in the past, and the chip shows the reading.

## Accuracy: how Hinglish systems do it, and what we take
What exists (checked 22 Oct 2026):
- **No off-the-shelf parser reads romanized Hinglish dates with a licence we can use.** Python `dateparser`'s Hindi data
  is Devanagari only (`कल`, `आज`; no `kal`, `subah`, `baje`). Duckling has a Hindi locale for numbers and durations,
  but no clear Hindi time rules. Microsoft Recognizers-Text lists Hindi for numbers, not DateTime.
- **Haptik's chatbot_ner** (an Indian chatbot company's production entity finder) does handle `kal subah 5 baje` and
  `agle somvar`. Its method is plain: per-language word lists in CSV files with every spelling variant, plus small
  patterns. It is GPL-3.0, so we copy the method only, never its code or data.
- **Amazon Alexa (Hindi/Hinglish):** 60% of requests from Hindi-setting users mix languages; Amazon credits much of a
  30% understanding gain to adding "hundreds of new words" and mapping many spellings/pronunciations of one word.
  Coverage of real variants matters more than clever models.
- **Research on spelling variation** (Yadav et al., ICON 2022; the `dhvani` tool): map variants through a phonetic key
  so `subah/subha/subh/subeh` or `bahut/bohot/boht` become one form before matching.
- **Big models** (Google MuRIL, about 238M parameters, trained on transliterated text) understand Hinglish well, but
  are far too large for an offline phone app, and dates and times are a small closed vocabulary that rules cover.
- **Todoist** highlights each recognised piece in the text as you type and removes it from the title; TickTick lets
  you tap the recognised time to cancel it. Users trust what they can see.

So NANDI's parser is **rules + a variant lexicon + a phonetic key + abstain when unsure + show the reading**:
1. **Normalise each word lightly, then look it up in explicit variant lists.** Light key: lowercase and collapse
   repeated letters (`kall`→`kal`, `shaaam`→`sham`, `aaj`→`aj`). Every lexicon word then lists its real spellings
   explicitly (`subah, subha, subh, subeh, subhe`; `shaam, sham, shām`; `dopahar, dopehar, dophar, dupahar`;
   `baje, bje, baj`), collected from the gold set. A clever general phonetic rule is not used for matching, because
   it merges real words (`bh` in `subha` vs a dropped `h`); explicit lists are predictable and testable.
2. **Tag words from the lexicon**, kept in `rules.config.ts` with every real variant we collect: DAY (`aj`,
   `kal`, `parso`, `today`, `tmrw`, `tmr`, `kl` only next to a time word), PART (`suba`, `dopahar/dophar`, `sam`,
   `rat`), WEEKDAY (English + Hindi), CLOCK (`6pm`, `6:30`, `6.30`), NUM, BAJE (`baje/bje/baj`), HALF (`sade/saade`,
   `dhai`, `sava`, `pone/paune`), DUR (`15m`, `45 min`, `2 ghante/ghanta/hr`), KO, AT.
3. **Match a small set of slot patterns over the tags** (for example `DAY? PART? (KO)? NUM BAJE`, `WEEKDAY CLOCK`,
   `CLOCK DUR`), never free regex over the raw text. Whatever the pattern did not use stays in the title, word for word.
4. **Abstain when unsure (precision first).** No chip, words kept as text, when: two date words conflict; a time word
   could be a name (a capitalised `Sham`/`Shyam` mid-line, or `sham` with no number or `ko` next to it); a bare number
   has no time cue; the result would be in the past with an explicit day; a word is all caps (`SAT`). A missing chip
   costs one tap on the picker; a wrong chip costs trust.
5. **Show the reading where it was found.** The recognised words are highlighted in the line (Todoist's pattern) and the
   chip says the result in plain words (`Fri 23 Oct · 8:00 am`). ✕ or tapping the highlight undoes it.
6. **Learn on the phone, only from the user.** When someone ✕'s a reading, that word-in-context is saved in a local
   "don't read this" list (Settings → Typing, visible and clearable; in backup). Nothing is sent anywhere.

**The gold test set comes before the code.** Collect at least **500 real task lines** typed by Jenil and 15–20 friends
(18–25, mixed cities), the way they would type them, through a simple form with the prompt "Write 10 things you need to
do this week, like you'd text a friend." Two people label the expected title/day/time/duration for each line and agree
on disagreements. Split 70/30: rules are written against the 70%; the 30% is locked and never read while building.
A larger set of made-up hard cases (generated, then checked by hand) is allowed for extra tests, never as the gate.

**Release gate (on the locked 30%):**
- **Wrong reading rate under 1%** of lines where a chip appears (a wrong day, time or duration that the user would have
  to fix). This is the "insane accuracy" number.
- **At least 85%** of lines that contain a time or day get a chip (the rest abstain safely).
- Zero cases where a title word disappears without being shown in the chip.
If the gate fails, cut the vocabulary back (fewer words, higher precision) rather than loosen the rules.

## Not doing
No AI or server parsing (offline rule). No reminders added automatically. No points, streaks or randomness for
capturing. No logging of typed text anywhere. No copying of GPL code or data (chatbot_ner). New words get into the
lexicon only through the gold-set process, not by guessing.

## Open questions for Jenil
1. A task with no time: **Unplaced** (my recommendation) or today at the next hour, as now?
2. "kal" typed after midnight: the coming morning (planning day, my recommendation) or the calendar day after?

## Kill test
- Before release: Jenil types the 6 test tasks on his phone. Target ≤ 10 touches and every chip right.
- Release gate above, on the locked gold set, before any phone test.
- Test group, 2 weeks: each person reports any wrong chip (asked, not logged) and how many ✕ they used. If more than
  1 in 50 chips was wrong, cut the vocabulary back and re-run the gate. If people still use the old pickers
  more than the line, revert to the form.

## Tests
Unit: every row of the cloud report's table, plus `kal` at 03:59 and 04:00, "tonight" typed after midnight, the
conflict and `SAT` cases above, `12 baje` vs `raat 12 baje`, `saade 12`,
`fri` typed on a Friday, a title that is only date words, and one DST time zone. E2E at 360×800: type 6 lines with
Enter only → 6 rows with the right days, estimates and placements (no field carried over); paste 6 lines → sheet → 6 rows; ✕ on the chip keeps the words in the title. Update `repeat-tasks.spec.ts` and the split test in `tasks.spec.ts` for
the controls behind "More".
