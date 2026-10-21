# Brief: teach one Learn topic in steps (spec 14), every question a different angle

Repo: D:\NANDI-feel, branch learn-steps. Work only in this folder. Do NOT commit, push or run Playwright/e2e.
Never open D:\NANDI-private or any legacy-export.json.

## Why
The owner used Learn and said: "the questions in learn for inflation all feel the same and exact repetition."
Old concepts taught 1-2 ideas and asked them 8 times in different words. The fix, already done for `inflation`
in content/topics/topic.money-markets.json, is the model. Read that concept in full before writing anything.

## Your topic
TOPIC_FILE = content/topics/topic.{TOPIC}.json. Concepts to convert: {CONCEPTS}.
(Psychology concepts already have steps; for those, see "Psychology fix-up" below.)

## What each concept must end up with (copy the inflation shape exactly)
1. `claims`: at least 3, each one short, true, sourced (sourceRefs into the concept's `sources`). Prefer the
   concept's existing sources; add a new source only if it is an official or primary page (RBI, SEBI, NPCI,
   MoSPI, WHO, NHS, NIH, CDC, ICMR-NIN, NCERT, UNESCO, Britannica, a university, a peer-reviewed paper) and you
   actually opened it and saw the fact. Give each new source `asOf: "2026-10-21"`.
2. `steps`: exactly 3. Each step teaches ONE small idea that is different from the other two steps
   (e.g. inflation: what it measures / prices outrunning pay / idle cash and the 4% target). Each step names its
   own `claimId` (3 steps → 3 different claims). Shape per step: id `{concept}-s1..s3`, title, claimId,
   sourceRefs, hook {stem, 3 options, exactly one correct, each with feedback}, teach (≤30 words, Flesch ≥70),
   visual (kind flow | compare | scale, see schema in src/data/packs/schemas.ts), example {ask "Tap the …"
   ≤60 chars, 3 parts, spot = exactly one of the parts, feedback}, guided (2 tries, each stem + hint + 3
   options, one correct, each with feedback), takeaway (≤15 words).
3. `items`: exactly 8, ALL NEW ids continuing the concept's numbering (if the last is `x-8`, use `x-9`..`x-16`) so
   old ratings do not carry over. Tag each with `step`. Split 3/3/2 across the steps (never more than 3 on a step).
   THE KEY RULE: no two items may test the same fact in different words. Each item asks a different angle:
   apply it to a new case, calculate, spot the mistake, predict, explain why, order a process, fill the term,
   estimate a number, compare two cases. Before you finish, list the 8 items' angles to yourself and fix any repeat.
   Keep the item rules the validator enforces: ≤2 items per type, at least one `estimate` (with `answer`
   {value,min,max,unit}), at least 2 `scenario`/`predict` items set in an Indian student's life, every item type
   still appearing somewhere in the module, no date in a stem, feedback 8–30 words with Flesch ≥60 and not
   repeating the option text, distinct stem openings. Wrong options must be believable mistakes, never silly.
4. Update the concept `hook` and `rule` if they no longer fit, `misconceptions` (each used tag must exist),
   and `factCheck.verdicts` (one per claim id and per item id, all "supported") with
   `checker: "builder content agent source check 2026-10-21 (<sources>)"`.
5. Plain words (docs/specs/13-feel-pass.md rewrite rules): short sentences, everyday words, one idea per
   sentence, Indian everyday examples (₹, chai, metro, exams, UPI), no jargon without saying what it means.
6. Vary how teach cards, hooks and examples open across the whole topic (the validator counts openers).

## How to edit
The JSON files are 2-space `json.dumps(..., ensure_ascii=False, indent=2)` + trailing newline. Edit with a Python
script that loads, changes and writes back in exactly that format (write scripts to
D:\nandi-gate-logs\tmp\, not the repo). Do not touch other topics or code.

## Check
`npm.cmd run validate-packs` in D:\NANDI-feel must show NO error for your topic (other topics may still have
errors; ignore them). Also run `npx.cmd tsx scripts/copy-lint.ts` and `npm.cmd run banned-words`.

## Psychology fix-up (only when TOPIC is psychology)
Concepts already have steps. Make each have exactly 3 steps, ≥3 claims, each step its own claim, 8 items split
3/3/2, and remove any repeated angle (replace repeats with new-angle items with new ids; keep good items).
Keep existing steps unless a third is needed.

## Report back (short)
Per concept: the 3 step titles, the 3 claims, and the 8 item angles in one line. Then the list of sources you
added, and any fact you were unsure about. Facts must be right; if you cannot verify a number, do not use it.
