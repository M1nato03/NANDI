# Hinglish task-capture gold set kit (cloud job 7, batch 3, 23 Oct 2026)

For spec 20 (fast capture), on `ideas/spec-20-capture`, section "Accuracy".
The kit has 3 parts:

1. A **labelling guide**, so two labellers write the same answer for each line.
2. A **one-page collection form** in English and Hinglish, with consent wording.
3. A **SYNTHETIC hard-case list**: 586 lines, each with a label.
   It is in `docs/reviews/cj3-capture-gold/synthetic-hard-cases.csv`.

> **SYNTHETIC. This list is not the release gate and must never be used as one.**
> I wrote every line myself. Nobody typed them on a phone. Use them only as extra unit tests and to
> stress the lexicon. Spec 20's gate still needs **500+ real lines** from Jenil and 15–20 friends,
> labelled by two people, split 70/30, with the 30% locked away.
> Every CSV row says `SYNTHETIC - extra tests only, never the release gate` in its `source` column,
> and every id starts with `SYN-`.

Base: `origin/ship-32` (dab36b3). The spec was read from `origin/ideas/spec-20-capture`, and the parser rules
and the 23-row table from `origin/ideas/cj-planner-speed`.
Nothing here changes app code or content.

---

## 1. Labelling guide

### 1.1 What a label is

Each line gets **one** outcome:

| Outcome | Meaning | Fields to fill |
|---|---|---|
| `CHIP` | The app should show a chip. The line clearly says a day, a time or a duration. | `title`, plus `day_key` and/or `minutes`. Add `start_local` when there is a start time. |
| `ABSTAIN` | The app should show **no chip** and keep the whole line as the title. | Nothing. `title` = the line exactly as typed. |

`ABSTAIN` covers two cases:

- **Nothing to read.** The line has no day, time or duration (`buy notebook`, `read 50 pages`).
- **Not safe to read.** Something looks like a time, but you cannot be sure what the person meant
  (`Sham ko call karna`, `SAT 4pm`, `kal ya parso gym`, `5 ya 6 baje`).

**Label what the person means, not what you think the parser will do.**
The gate compares the parser's output against your label:

| Your label | Parser output | Counts as |
|---|---|---|
| CHIP | the same chip | correct |
| CHIP | no chip | **miss**. It costs coverage (the 85% target), not trust. |
| CHIP | a different chip (wrong day, time or minutes) | **wrong reading**. This is the "under 1%" number. |
| ABSTAIN | no chip | correct |
| ABSTAIN | any chip | **wrong reading** |
| any | a title word gone but not shown in the chip | **lost word**. The target is zero. |

Two more columns help when the results are scored:

- `has_time_or_day`: `y` if a person reading the line sees a real day or time in it, even when the label
  is ABSTAIN (`SAT 4pm`: y; `SAT prep`: n). This gives the denominator for "85% of lines that contain a
  time or day get a chip". A line with only a duration gets `n`.
- `v1_scope`: `out` when the meaning is clear but v1's word list does not plan to cover it: month names,
  `25 oct`, `2/11`, Devanagari, Gujarati or Marathi words, `in 30 min`, `3 din baad`, ranges like `6-7pm`.
  Report coverage with and without these rows.

### 1.2 The planning day (04:00 roll)

- Every line is labelled **against the moment it was typed** (the `typed_at` column, with its time zone).
- The **planning day** is the calendar date of (typed time − 4 hours), the same as `dayKey()` in
  `src/core/time/dayKey.ts`. Typed Fri 01:30 or Fri 03:59 → planning day **Thu**. Typed Fri 04:00 → **Fri**.
- `aaj/today` = planning day. `kal/tomorrow` = planning day + 1. `parso` = + 2.
  So `kal` typed at Fri 01:30 means Fri (spec 20, open question 2, my recommendation). Those rows carry the
  tag `after_midnight`, so they are easy to relabel if Jenil picks the calendar day instead.
- `day_key` is the planning day the task belongs to. A start between 00:00 and 03:59 belongs to the planning
  day **before** it. So `raat 1 baje` typed Thu has `day_key` Thu and `start_local` Fri 01:00.
  The chip shows the calendar date ("Fri 23 Oct · 1:00 am").

### 1.3 What to expect for each kind of line

| Kind of line | Example | Label |
|---|---|---|
| Day word, no time | `kal gym` | day + 1, start **09:00 (default)** |
| Day word = today, no time, and 09:00 has passed | `aaj laundry` at 15:20 | day = today, **no start** (tag `day_only_past_default`). See gap G2. |
| Part of day | `subah` 08:00 · `dopahar` 14:00 · `shaam` 18:00 · `raat` / `tonight` 21:00 | that hour |
| Part + hour | `shaam 4 baje` → 16:00 · `raat 10` → 22:00 · `raat 12` → 00:00 (next date) · `raat 1–3` → 01–03 (next date) · `subah 6` → 06:00 · `dopahar 12` → 12:00, `dopahar 1–4` → 13–16 | as shown |
| Clock with am/pm, or 24-hour | `6pm`, `6 PM`, `6p.m.`, `6:30pm`, `18:00`, `8.15pm` | that time |
| Hour with a cue (`baje`, `at`, `@`, `:mm`, `.mm`, a half word, a part word) but no am/pm, **no day word** | `7 baje gym` at 15:20 → 19:00 | the next future reading today, from {h am, h pm}. `12` means noon. Never 00:00–03:59 (that needs `raat` or `am`). If both readings have passed → tomorrow, using the next row. |
| The same, **with a day word or weekday** (not today) | `kal 6 baje` → 18:00 · `kal 9 baje` → 09:00 | **1–6 = pm, 7–11 = am, 12 = noon** (the spec convention). **But** if the words make am/pm obvious (`movie`, `dinner`, `party` → pm; `breakfast`, `sunrise`, `uthna` → am), label the meaning and tag `ampm_by_meaning`. If it could be either (`kal 5 baje run`), ABSTAIN. |
| Half words | `saade 6` 6:30 · `sava 5` 5:15 · `paune 6` 5:45 · `dhai` 2:30 · `dedh` 1:30 | then apply the rows above |
| Weekday | `fri`, `friday`, `shukravar`, `itwar` … | the next one **on or after** the planning day (today included). No time → 09:00 default. |
| Time already passed, **no day word** | `gym 6pm` at 19:10 | tomorrow 18:00 |
| Time already passed, **explicit day** | `aaj subah 7 baje gym` at 15:20 | **ABSTAIN** (spec rule 4) |
| Duration | `15m`, `45 min`, `1.5h`, `1h30`, `2 ghante`, `aadha ghanta` 30, `dedh ghanta` 90, `half an hour` 30 | `minutes`. Over 90 still gets the number; the app opens the split preview. |
| Duration only | `call bank 15m` | `minutes` only. No day, no start (the task goes to Unplaced). |
| Bare number, no cue | `read 50 pages`, `room 101`, `call 9`, `do ex 5.30 maths` | no time. The number stays in the title. |
| Number right after a day word | `tmrw 10 class` | label the meaning (10:00). Tag `bare_after_day`. See gap G3. |
| Count after a day word | `kal 2 assignments submit` | day + 1 at 09:00; `2` stays in the title |
| Name that looks like a time word | `call Sham`, `call Subha`, `call Ravi`, `Kal Ho Naa Ho`, `Aaj Tak` | no reading from the name; it stays in the title |
| ALL-CAPS word | `SAT prep` | not a weekday. If the rest of the line is clear (`SAT mock 4pm`), CHIP the rest. |
| Month or numeric date | `25 oct`, `5 may ko`, `2/11` (DD/MM) | the meaning, `v1_scope=out` |
| Deadline | `by fri`, `kal tak`, `5 baje se pehle`, `due mon`, `till 10pm` | **ABSTAIN**. A deadline is not a start, and tasks have no due field (`TaskRow` in `src/data/types.ts`). |
| Repeat | `roz`, `daily`, `har somvar`, `every sat`, `mon wed fri` | **ABSTAIN**. Repeat stays under "More". |
| Two days, two times or two tasks in one line | `kal ya parso`, `6 ya 7 baje`, `gym 6pm, then dinner 8pm` | **ABSTAIN** |
| Vague | `next week`, `weekend`, `month end`, `jaldi`, `asap`, `later` | **ABSTAIN** |
| `next <weekday>` | `next mon` | **ABSTAIN** (people disagree about which Monday). `agle somvar` = the coming Monday, `v1_scope=out`. |
| `kal` meaning yesterday | `kal wala homework submit`, `kal ka bacha khana` | **ABSTAIN** |
| Part word inside a noun | `evening class fees`, `night cream`, `movie night` | not a time. `fri 9 baje movie night` → Fri 21:00, title keeps "movie night". |
| Emoji | `gym 💪 6pm` | emoji stay in the title. Never read an emoji (🕕, 🌙) as a time. |

### 1.4 The title

- **The title is the line minus the words that made the reading. Nothing else changes.** Keep the case,
  emoji and order. Collapse double spaces.
- Remove these small connector words **only when they touch a recognised piece**:
  `at`, `@`, `on`, `this`, `is` (Hindi "this"), `in the`, `for` (before a duration), `ke liye` (after a duration),
  `ko`, `me`/`mein` (after a day or part word), and `ka`/`ki`/`ke` right after a time (`6 baje ki train` → `train`).
  `at Kabir's` keeps its `at`, because it is not next to a time.
- Words like `bhai`, `yaar`, `pls`, `note to self:` stay in the title.
- If only date words are left (`kal`), keep the whole line as the title and still show the chip.

### 1.5 Variants: write them down, do not merge them by guesswork

When a labeller meets a new spelling (`subhe`, `bajr`, `itvaar`, `veervar`), add it to a shared **variant
sheet**: `word, standard form, example line id`. Spec 20 says new words enter the lexicon only through the
gold set, so this sheet is the input for `rules.config.ts`. A spelling that only one person ever typed still
goes on the sheet, marked `seen once`.

### 1.6 How two labellers agree

1. Each labels alone in a copy of the sheet (same columns as the CSV).
2. A script lists every row where outcome, `day_key`, `start_local`, `minutes` or `title` differ.
3. They talk through each one. If they still disagree after one talk, the row becomes **ABSTAIN**
   (if two careful people disagree, the parser must not guess) and both readings go in `note`.
4. Report the agreement rate before the talk (Cohen's kappa on the outcome, and exact match on fields).

---

## 2. Collection form (one page)

Use it as a Google Form, or on paper and then typed in **exactly** as written (keep the typos). One person
fills it once. It takes about 5 minutes.

### English

> **Help test a to-do app (5 minutes)**
>
> I'm building a phone app that turns a quick line like "kal 6 baje gym" into a task with the right day and time.
> To check it reads people correctly, I need real lines typed the way people really type.
>
> **Write 10 things you need to do this week, like you'd text a friend.**
> One per box. Any language or mix (English, Hindi, Hinglish, your own language). Short forms, typos and emoji
> are fine; please don't tidy them up. Times and days are welcome but not needed.
>
> 1. ______ 2. ______ … 10. ______
>
> About you (optional): age band 18–21 / 22–25 · city · languages you text in · phone keyboard (Gboard,
> Samsung, SwiftKey, other)
>
> **What happens to your answers**
> - They are used **only to test this app's date and time reading**. Nothing else, no ads, never sold or shared.
> - Two people read and label them. Your name is never stored with them. Please don't write phone numbers,
>   addresses or anything private; I will remove any I find.
> - They are **deleted** when testing is finished, by 31 March 2027 at the latest.
> - You can ask for your answers to be removed at any time before then: message ______.
>
> ☐ I am 18 or older, and I agree that my answers can be used as described above.

### Hinglish

> **Ek to-do app test karne mein help karo (5 min)**
>
> Main ek phone app bana raha hoon jo "kal 6 baje gym" jaisi line ko sahi din aur time wale task mein badal deta hai.
> Ye check karne ke liye ki app sahi samajhta hai, mujhe asli lines chahiye, jaise log sach mein type karte hain.
>
> **Is hafte ke 10 kaam likho, jaise dost ko text karte ho.**
> Har box mein ek. Koi bhi language ya mix chalega (English, Hindi, Hinglish, apni bhasha). Short forms, typos,
> emoji sab chalega; please theek mat karna. Din aur time likh sakte ho, zaroori nahi.
>
> 1. ______ 2. ______ … 10. ______
>
> Apne baare mein (optional): umar 18–21 / 22–25 · shehar · kin languages mein text karte ho · keyboard
> (Gboard, Samsung, SwiftKey, aur koi)
>
> **Tumhare answers ka kya hoga**
> - Sirf **is app ki date aur time samajh test karne** ke liye use honge. Aur kuch nahi, koi ad nahi, kabhi
>   becha ya share nahi hoga.
> - Do log inhe padh ke label karenge. Tumhara naam inke saath kabhi save nahi hoga. Phone number, address ya
>   koi private baat mat likhna; mile to main hata dunga.
> - Testing khatam hone par sab **delete** ho jayega, zyada se zyada 31 March 2027 tak.
> - Usse pehle kabhi bhi apne answers hatwa sakte ho: message karo ______.
>
> ☐ Main 18 saal ya usse bada hoon, aur upar likhe tarike se apne answers use karne ki permission deta/deti hoon.

Notes on the form:
- The consent follows India's DPDP Act as summarised by PRS
  (https://prsindia.org/billtrack/digital-personal-data-protection-bill-2023): "Personal data may be processed
  only for a lawful purpose after obtaining the consent of the individual", "A notice must be given before
  seeking consent", and "Consent may be withdrawn at any point in time." I could not open the Act's PDF on
  meity.gov.in (HTTP 403, and the old link returned an HTML page), so this is from the PRS summary, not the
  Act's own text. This is not legal advice.
- Keep the 18+ tick. NANDI is 18+.
- Do not show example lines on the form. Examples prime people to copy their spelling ("kal 6 baje").
  The prompt line is the only example.
- Collect from a mix of cities and keyboards. Gboard's Hindi transliteration can put Devanagari (`कल`) in a
  line, and these rows matter.
- Store the sheet outside the repo (CLAUDE.md: personal data never goes in git). Only aggregate results and
  the lexicon go in the repo.

---

## 3. The SYNTHETIC hard-case list

File: `docs/reviews/cj3-capture-gold/synthetic-hard-cases.csv`. UTF-8, comma-separated, one header row.

Columns: `id, source, tz, typed_at, input, outcome, title, day_key, start_local, minutes, chip,
has_time_or_day, v1_scope, rule, note`.

- `typed_at` is ISO with its offset. Most rows use **Thu 22 Oct 2026 15:20 IST**. Others use Thu 07:30,
  Thu 19:10, Fri 01:30, Fri 03:59, Fri 04:00 and Fri 15:20 (IST), Sat 31 Oct 15:20 New York (the night US
  DST ends), and Thu 15:20 Dubai.
- `start_local` is the wall-clock time in `tz`.
- `chip` is what the chip should say, in spec 20's format (`Fri 23 Oct · 8:00 am`, `9:00 am (default)`,
  `120 min (split preview)`).
- `rule` = group, then tags. Tags let you filter or relabel a whole decision at once (for example
  `after_midnight`, `ampm_by_meaning`, `conflict`).

### What is in it (measured from the file)

| | Rows |
|---|---|
| Total | **586** |
| CHIP | 411 |
| ABSTAIN | 175 |
| A person sees a day or time (`has_time_or_day=y`) | 438 |
| Out of v1's planned words (`v1_scope=out`) | 30 |
| CHIP with minutes | 47 |
| CHIP with the 09:00 default | 68 |
| Typed outside IST | 6 |

| Group | Rows | Covers |
|---|---|---|
| spec_table | 26 | the 23 rows from the planner report, plus the 6 scenario lines (3 overlap) |
| day_word | 35 | aaj/aj/tdy/2day, kal/kall/kaal/kalll, tmrw/tmr/tmw/2mrw/2moro, tomoro/tommorow, parso/parson, `tom` vs Tom |
| kl | 9 | kl next to a time word, kl alone, KL Rahul, KL (Kuala Lumpur) |
| part_of_day | 51 | subah/subha/subh/subeh/subhe, dopahar/dopehar/dophar/dupahar, shaam/sham/shaaam/shām, raat/rat/raath, nite/tonite/2nite, ko/me/mein/in the, `rat trap` |
| baje | 15 | baje/bje/baj/bajey/baaje/bajay/bjey, joined `7baje`, `6 baje k baad` |
| half_word | 16 | saade/sade/saadhe/sadhe, sava/sawa, paune/pone/paone, dhai/dhaai, dedh/derh |
| clock | 33 | 6 pm/6PM/6p.m./6p, 6:30, 6.30, 18:00, @6, noon, midnight, 12am/12pm, `12 baje` vs `raat 12 baje`, 0930 vs 1800 |
| bare_hour | 10 | the same words typed at 07:30 and 19:10 |
| weekday_en | 29 | every English form, "today included", `fri` typed on a Friday, `sun` = listen |
| weekday_hi | 30 | somvar…ravivar with -war/-vaar spellings, itwar/etwar/aitvaar, veervar; names Ravi, Guru, Mangal, Shani, Som, Budh |
| duration | 31 | m/min/mins/mnt/h/hr/hrs/1.5h/1h30/ghanta/ghante/ghnte/aadha/dedh/dhai/half an hour; `25 min timer` |
| combo | 17 | day + part + time + duration together |
| number_not_time | 39 | pages, rooms, phone numbers, ₹, kg, sem, PS5, `ex 5.30`, `psalm 6:30`, counts after a day word |
| name | 21 | Sham/Shyam/Subha, `sham ko Sham se milna`, Kal Ho Naa Ho, Raat Akeli Hai, Aaj Tak, June |
| caps_month | 18 | SAT/sat, all-caps lines, may/May, `college may jana`, dates |
| emoji | 15 | emoji in titles, ZWJ sequences, 🕕, `gym💪6pm` |
| script_language | 16 | Devanagari words and digits, Gujarati (kale/savare/vage), Marathi (udya/sakali/vajta) |
| typo | 19 | 6pmm, 6om, 6:3o, bajr, tomorroe, evenig, wendesday, thrusday, sbah |
| joined | 7 | kal6baje, kalsubah, raat10baje, sat4pm, kal-subah |
| past | 11 | explicit past day → abstain; no day → tomorrow; 5 minutes either side of now |
| boundary | 18 | Fri 01:30, 03:59 and 04:00; tonight/aaj after midnight |
| conflict | 13 | two days, two times, two tasks, negation |
| deadline | 12 | by / tak / se pehle / due / till / 2 din me |
| recurrence | 8 | roz, daily, har somvar, mon wed fri |
| relative_vague | 19 | in 30 min, 2 ghante baad, 3 din baad, next mon, agle somvar, weekend, asap |
| kal_yesterday | 5 | kal wala, kal ka bacha, parso wala |
| bare_after_day | 5 | tmrw 10 class, kal 9 gym, fri 7 dinner |
| ampm_meaning | 15 | kal 8 baje movie, breakfast at 6, uthna at 4, part words inside nouns |
| timezone | 6 | US DST end (01:30 happens twice), Dubai |
| no_cue | 28 | plain Hinglish/English tasks, including the words `time`, `alarm`, `deadline` |
| chatty | 9 | `bhai…`, `pls remind me…`, `acha sun, …` |

How it was built: I wrote every input and its label by hand in a Python list. A small script then turned
each label (for example `('+1', '08:00')`) into `day_key`, `start_local` and the chip text, and checked it.
It is **not** a parser: it reads only my labels, never the input text. While writing, the script checked that:
the start is after `typed_at`; the planning day of the start equals `day_key`; the title is the input's own
words in order, with at least one word removed (except the `joined` and `only_date_words` rows); and no
input/time pair repeats. The first run stopped on `gym@6` (a single token). The check had not yet exempted the `joined` group, so I fixed the check, not the label.
The script is in /tmp only. Its core is pasted in §5.

Limits: these lines are what I *think* 18–25 year olds type. Real lines will have spellings and habits I did
not guess. So a high score on this list says nothing about the gate.

### Validation (requested check)

The checker is separate from the generator and reads only the CSV. It checks: ≥ 400 rows; every row has
15 columns; outcome is CHIP or ABSTAIN; every CHIP row has an expected output (a title and a day or minutes,
plus chip text); every ABSTAIN row keeps the input as the title and has no parsed fields; the start is after
`typed_at`; `day_key` is the start's planning day; ids and (tz, typed_at, input) are unique; and every row is
marked SYNTHETIC.

```python
#!/usr/bin/env python3
"""Check the synthetic hard-case CSV: shape, labels, and internal consistency."""
import csv, sys, collections
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

path = sys.argv[1]
COLS = ['id', 'source', 'tz', 'typed_at', 'input', 'outcome', 'title', 'day_key', 'start_local', 'minutes', 'chip',
        'has_time_or_day', 'v1_scope', 'rule', 'note']
problems = []
with open(path, newline='', encoding='utf-8') as f:
    raw = list(csv.reader(f))
header, rows = raw[0], raw[1:]
if header != COLS:
    problems.append(f'header mismatch: {header}')
bad_width = [i + 2 for i, r in enumerate(rows) if len(r) != len(COLS)]
if bad_width:
    problems.append(f'rows with wrong column count (line numbers): {bad_width[:10]}')
recs = [dict(zip(COLS, r)) for r in rows if len(r) == len(COLS)]
ids, keys = set(), set()
for r in recs:
    rid = r['id']
    if rid in ids: problems.append(f'{rid}: duplicate id')
    ids.add(rid)
    k = (r['tz'], r['typed_at'], r['input'])
    if k in keys: problems.append(f'{rid}: duplicate input+typed_at')
    keys.add(k)
    if not r['source'].startswith('SYNTHETIC'): problems.append(f'{rid}: not marked SYNTHETIC')
    if not r['input'].strip(): problems.append(f'{rid}: empty input')
    if r['has_time_or_day'] not in ('y', 'n'): problems.append(f'{rid}: has_time_or_day')
    if r['v1_scope'] not in ('in', 'out'): problems.append(f'{rid}: v1_scope')
    if r['outcome'] == 'ABSTAIN':
        if r['title'] != r['input']: problems.append(f'{rid}: ABSTAIN title must equal input')
        if any(r[c] for c in ('day_key', 'start_local', 'minutes', 'chip')):
            problems.append(f'{rid}: ABSTAIN row has parsed fields')
    elif r['outcome'] == 'CHIP':
        if not r['title'].strip(): problems.append(f'{rid}: CHIP without title')
        if not (r['day_key'] or r['minutes']): problems.append(f'{rid}: CHIP without day or minutes (no expected output)')
        if not r['chip']: problems.append(f'{rid}: CHIP without chip text')
        if r['minutes'] and not (r['minutes'].isdigit() and int(r['minutes']) > 0): problems.append(f'{rid}: minutes')
        if r['start_local']:
            tz = ZoneInfo(r['tz'])
            typed = datetime.fromisoformat(r['typed_at'])
            start = datetime.fromisoformat(r['start_local']).replace(tzinfo=tz)
            if start <= typed: problems.append(f'{rid}: start not after typed_at')
            planning = (start.replace(tzinfo=None) - timedelta(hours=4)).date().isoformat()
            if planning != r['day_key']: problems.append(f'{rid}: day_key {r["day_key"]} != planning day of start {planning}')
        if r['day_key']:
            typed = datetime.fromisoformat(r['typed_at']).replace(tzinfo=None)
            if r['day_key'] < (typed - timedelta(hours=4)).date().isoformat():
                problems.append(f'{rid}: day_key before the planning day it was typed on')
    else:
        problems.append(f'{rid}: outcome must be CHIP or ABSTAIN, got {r["outcome"]!r}')

c = collections.Counter(r['outcome'] for r in recs)
print(f'file: {path}')
print(f'rows: {len(rows)} (need >= 400)  columns: {len(header)}  all rows {len(COLS)} wide: {not bad_width}')
print(f'outcome: CHIP {c["CHIP"]}, ABSTAIN {c["ABSTAIN"]}; rows with neither: {len(recs) - c["CHIP"] - c["ABSTAIN"]}')
print('has_time_or_day=y:', sum(r['has_time_or_day'] == 'y' for r in recs),
      '| v1_scope=out:', sum(r['v1_scope'] == 'out' for r in recs),
      '| typed in other zones:', sum(r['tz'] != 'Asia/Kolkata' for r in recs))
print('CHIP with minutes:', sum(bool(r['minutes']) for r in recs if r['outcome'] == 'CHIP'),
      '| CHIP day only (no start):', sum(bool(r['day_key']) and not r['start_local'] for r in recs),
      '| CHIP 09:00 default:', sum('(default)' in r['chip'] for r in recs))
groups = collections.Counter(r['rule'].split(';')[0] for r in recs)
print('groups:', ', '.join(f'{g} {n}' for g, n in groups.items()))
if len(rows) < 400: problems.append('fewer than 400 rows')
print('problems:', len(problems))
for p in problems[:50]: print('  ', p)
sys.exit(1 if problems else 0)
```

Run (Python 3, standard library only; `uptime` load average 2.97 at the time, shared machine):

```
$ python3 -I check_csv.py docs/reviews/cj3-capture-gold/synthetic-hard-cases.csv; echo "exit=$?"
file: docs/reviews/cj3-capture-gold/synthetic-hard-cases.csv
rows: 586 (need >= 400)  columns: 15  all rows 15 wide: True
outcome: CHIP 411, ABSTAIN 175; rows with neither: 0
has_time_or_day=y: 438 | v1_scope=out: 30 | typed in other zones: 6
CHIP with minutes: 47 | CHIP day only (no start): 7 | CHIP 09:00 default: 68
groups: spec_table 26, day_word 35, kl 9, part_of_day 51, baje 15, half_word 16, clock 33, bare_hour 10, weekday_en 29, weekday_hi 30, duration 31, combo 17, number_not_time 39, name 21, caps_month 18, emoji 15, script_language 16, typo 19, joined 7, past 11, boundary 18, conflict 13, deadline 12, recurrence 8, relative_vague 19, kal_yesterday 5, bare_after_day 5, ampm_meaning 15, timezone 6, no_cue 28, chatty 9
problems: 0
exit=0
```

To prove the checker catches errors, I broke copies of the file on purpose. All five planted errors were
reported, with exit code 1:

```
rows with wrong column count (line numbers): [3]
SYN-0001: outcome must be CHIP or ABSTAIN, got 'MAYBE'
SYN-0020: CHIP without day or minutes (no expected output)
SYN-0029: start not after typed_at
SYN-0021: ABSTAIN title must equal input
```

---

## 4. Spec gaps found while labelling (for Jenil)

Labelling 586 lines exposed decisions that spec 20 does not make yet, or makes twice. Each one is tagged in the
CSV, so it can be relabelled in one pass.

| # | Gap | Example (CSV tag) | Kit's label now | Needs |
|---|---|---|---|---|
| G1 | **The spec contradicts itself on conflicts.** "The parser" says "the first wins and the other stays as text". "Accuracy" rule 4 says abstain when two date words conflict. | `call mom at 9 tonight about fri trip` (`conflict`, 5 rows) | CHIP with the meaning. An abstaining parser scores a miss, not a wrong reading. | Pick one rule. Precision first suggests abstain. |
| G2 | **Day with no time, typed after 09:00 today.** The default 09:00 is already past. Very common: `aaj laundry` in the afternoon. | `day_only_past_default`, 7 rows | day = today, no start ("Thu 22 Oct · no time") | Decide: no start, next free hour, or Unplaced with the day kept. |
| G3 | **A bare number right after a day word is read wrongly.** "A bare number is a time only with a cue" means `tmrw 10 class` becomes tomorrow at the 09:00 default, with "10 class" as the title. That is a **wrong reading**, not a miss. | `bare_after_day`, 5 rows | the meaning (10:00) | Either treat DAY+NUM(1–12) as a time, or abstain the whole line. |
| G4 | **The later-day am/pm convention (7–11 = am) fails on evening words.** `kal 8 baje movie` becomes 08:00. The same goes for 1–6 = pm with `breakfast`, `sunrise`, `uthna`. | `ampm_by_meaning`, 8 rows | the meaning | Abstain the time for bare 7–11 on later days, or show an am/pm toggle on the chip. A small evening/morning noun list is another option, but it is guesswork until the real set exists. |
| G5 | **`aaj` / `tonight` after midnight.** At 01:30 people mean the coming calendar day. The planning-day rule gives yesterday evening, which is past, so v1 abstains. | `after_midnight_tonight`, 2 rows; `after_midnight_weekday` | the meaning (Fri) | Open question 2 should cover `aaj` and `tonight`, not only `kal`. |
| G6 | **Deadlines.** `by fri`, `kal tak`, `5 baje se pehle`. Tasks have no due field (`TaskRow`). | `deadline`, 12 rows | ABSTAIN | Confirm abstain, or add a deadline idea later. |
| G7 | **Repeats.** `roz subah 6 baje yoga` would become a one-off chip and hide the repeat. `TaskRow.repeat` exists (daily, weekdays, weekly). | `recurrence`, 8 rows | ABSTAIN | Confirm. A later version could map `roz`/`daily` → `repeat: 'daily'`. |
| G8 | **Hindi weekday short forms are common names.** Ravi, Guru, Mangal, Shani, Som, Budh. **`sun` means "listen"**, **`may`/`mai` means "in"/"I"**, `rat` is an English word, `tom` is a name. | `name`, `hinglish_sun`, `hinglish_may` | no reading | Only full forms (`ravivar`, `guruvar`) in the lexicon. `sun`, `tom` and `kl` only next to a time word. |
| G9 | **`Sham ko call karna` cannot be decided.** It means "call Sham" or "call in the evening". The keyboard capitalises the first word, so a capital at the start of a line says nothing. | `name_or_part` | ABSTAIN | The spec's "capitalised mid-line" rule is right. Add "or line-first + `ko` + a verb, with no number". |
| G10 | **Movie and show titles hold day words.** `Kal Ho Naa Ho`, `Raat Akeli Hai`, `Aaj Tak`, `Tonight Show`. | `title_of_movie`, `name_kept` | no reading from the title | The real set will show how often this happens. A capitalised run of 3+ words could make the parser abstain. |
| G11 | **Numbers that look like clocks.** `ex 5.30`, `page 7.45`, `psalm 6:30`. | `number_like_clock` | ABSTAIN | Do not read `N.NN` after `ex`, `page`, `ch`, `q`. Or require `baje`/`pm`/`at` for the dot form. |
| G12 | **Other scripts and languages.** Gboard transliteration puts `कल`, `बजे` and `७` in lines. Gujarati speakers write `kale savare 7 vage` (and `kale` means both tomorrow and yesterday). Marathi speakers write `udya sakali`. | `devanagari`, `gujarati_roman`, `marathi_roman` | the meaning, `v1_scope=out` | Count them in the real set. Add only what shows up. |
| G13 | **`12 baje` with no hint.** The spec lists it as a test but gives no rule. | `12_is_noon` | noon, never midnight without `raat`/`am` | Confirm. |
| G14 | **Wall times that happen twice (DST).** Only matters for users abroad. | `dst` | the first occurrence | Confirm (spec test list already asks for one DST zone). |

The biggest risk to the "under 1% wrong" target is **G3 and G4**. These are not misses. The rules as written
produce a confident wrong chip there. Run the real gold set before choosing between "read it" and "abstain".

---

## 5. Re-running

```sh
# scratch dir, outside the repo
python3 -I gen.py   docs/reviews/cj3-capture-gold/synthetic-hard-cases.csv   # rebuild from the hand labels
python3 -I check_csv.py docs/reviews/cj3-capture-gold/synthetic-hard-cases.csv
```

The core of `gen.py`. The labels themselves are 586 calls like
`C('kal subah call mom', 'call mom', '+1', '08:00')` and `A('SAT prep', 'all_caps')`:

```python
def planning_day(local):
    return (local - timedelta(hours=4)).date()

def resolve_day(spec, p):                       # '+1', 'fri', or an ISO date
    if spec.startswith('+'):
        return p + timedelta(days=int(spec[1:]))
    if spec in WD:                              # next one on/after the planning day
        return p + timedelta(days=(WD.index(spec) - p.weekday()) % 7)
    return date.fromisoformat(spec)

# inside C(): time 'DEF' = 09:00 default; hours 0-3 land on the next calendar date
h, m = map(int, time.split(':'))
cal = dk + timedelta(days=1) if h < 4 else dk
s = datetime(cal.year, cal.month, cal.day, h, m)
assert s.replace(tzinfo=tz) > typed_aware        # never in the past
assert planning_day(s) == dk                     # dayKey matches the 04:00 rule
# title must be the input's own words, in order, with something removed
```

Suggested use in the app repo, when `capture.ts` is built: a Vitest table test that loads this CSV, runs
`parseCapture(input, typed_at)` with the `tz` set, and prints the four numbers from §1.1 (correct, miss,
wrong reading, lost word), split by `v1_scope`. It should **report**, not fail CI, because the list is
synthetic. Only the locked real 30% decides release.
