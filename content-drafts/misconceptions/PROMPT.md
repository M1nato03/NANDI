# Task: tag every wrong option with the misconception it states (NANDI Learn, spec 23 §4)

You are helping editors of NANDI, a learning app for Indian adults aged 18-25. Read-only: do not change any file.

Input files in this folder: `<topic>.input.json`. Each concept lists its rule, claims, sources, its existing
`misconceptions` (id, name, correction) and `untaggedWrongOptions` (a practice question's stem, the right answer,
one wrong option and that option's feedback).

Also read `cj3-guided-tries.md`. It names 18 misconceptions marked "Not listed" that an earlier review found missing.
Where one of them fits a concept you are tagging, reuse its wording for the new misconception.

## For EVERY untagged wrong option, give exactly one verdict
1. `existing`: the wrong option states (or is a direct case of) one of the concept's existing misconceptions.
   Give 1 id (2 only if both clearly apply). Prefer this whenever it honestly fits.
2. `new`: the wrong option states a real, common mistaken belief that no existing misconception covers.
   Propose ONE new misconception for the concept (several options may share it). Reuse a new one across options of the same concept rather than inventing near-duplicates.
3. `weak`: the wrong option is not a belief anyone holds (absurd, joke, plain filler, or a slip that teaches nothing).
   Do not invent a misconception for it. Give a one-line reason. Editors will rewrite these distractors.

## Rules for a new misconception
- id: `<conceptId>-m<N>`, N continuing after the concept's highest existing number.
- name: 2-7 words, states the wrong belief itself, e.g. "One price is the index".
- correction: ONE sentence, at most 25 words, plain English (Flesch 60+), no "studies show", no numbers the claims
  do not contain, no health/body/money outcome promises, no guilt, nothing aimed at the reader's flaws.
- The correction must be supported by the concept's own claims. Give `sourceRefs` = source ids of the claims that
  support it, and `claimIds` = those claim ids. If no claim supports it, do not propose it: use `weak` instead and
  say "no claim supports a correction".

## Output: ONLY one JSON object, nothing else
{
  "topics": [
    {
      "topic": "topic.psychology",
      "newMisconceptions": [
        {"conceptId": "...", "id": "...", "name": "...", "correction": "...", "sourceRefs": ["..."], "claimIds": ["..."], "fromCj3": true|false}
      ],
      "tags": [
        {"itemId": "...", "optionId": "b", "verdict": "existing"|"new"|"weak", "misconceptionIds": ["..."], "why": "<= 15 words"}
      ]
    }
  ]
}
Every untagged wrong option in your topics must appear exactly once in `tags`. For `weak`, misconceptionIds is [].
