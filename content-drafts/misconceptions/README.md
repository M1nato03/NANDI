# Mistake help content (spec 23 §4 and step 2) on top of content-walk

Branch `ideas/learn-misconceptions`, cut from origin/content-walk eb4d352. Written by the idea engine on 24 Oct 2026.
It changes only `content/topics/*.json`. It is meant to merge after content-walk, once Jenil's lesson week is over.
Every line is a draft for editors.

## What changed

| | content-walk | this branch |
|---|---|---|
| Practice wrong options with a `misconceptionIds` link | 218 of 600 | **442 of 600** |
| New concept misconceptions | 0 | **51** |
| Items with no `misconceptionTags` | 123 of 324 | **58** |
| Guided-try distractor swaps from cj3-guided-tries | 0 | **60** |

1. **Tags.** Codex A and B tagged all 382 untagged wrong options (`PROMPT.md`). I reviewed the 72 new misconceptions
   they proposed. I kept 51, merged 5 and dropped 19. Most dropped ones were near-copies of a claim, not beliefs people
   hold. One (heat-hydration-m4) was unsafe: its correction said to drink during play, which goes past claim c3.
   117 options got a tag this way.
2. **Weak options.** 265 options stated no belief at all. A second pass sorted them (`PROMPT2.md`):
   - 83 are slips: likely maths or reading mistakes. They are kept as they are, because their feedback explains the slip.
   - 32 are "fine": reasonable wrong ideas.
   - 150 are filler, so a rewrite was proposed for each. I read all 150 and rejected 43:
     - 22 failed the house checks: too long, a banned absolute word, or the same opening as another option
     - 21 more by hand: two options saying the same thing, an answer to the wrong question, too close to the right
       answer, or grammar that broke the blank
   - The other **107 rewrites are applied**. Each now states one listed misconception, and its feedback says why.
3. **Item tags.** Each newly tagged option's id is added to its item's `misconceptionTags`. That way the engine's
   `activeMisconceptions` (model.ts:110) follows the same misconception the option names.
4. **cj3 swaps.** Of cj3's 111 guided-try swaps:
   - 51 were already replaced by content-walk's own guided-try rewrite
   - the other 60 still had cj3's old weak distractor, so they are applied
   - 41 of those 60 tries are otherwise unchanged since cj3 checked them; 19 had a sibling or stem changed by
     content-walk, and those were re-checked for length only

## Checks run
- `npx tsx scripts/validate-packs.ts`: Packs valid. Five reading-ease misses were rewritten by hand first.
- `npx vitest run scripts/ src/data/packs`: 11 files, 77 passed.
- Full `npx vitest run`: 670 tests pass. 2 failed under full-suite load (gamify-copy, pathLogic), and both pass when run
  alone. Neither reads topic content.

## Still open
- 158 wrong options stay untagged: 83 slips, 32 fine and 43 rejected rewrites. They are listed in `left-for-editors.md`.
- Spec 23 §4 says to make the field required. With slips in the mix, the rule needs one of two things: a schema
  marker (for example `slip: true` on an option), or "a misconception id OR feedback that names the slip". That is
  the builder's call when step 2 is built. The schema is strict, so this branch adds no new field.
- Guided-try options (`lessonOption`) have no misconception field, so the 60 swaps are text-only.
- Pack versions are not bumped here. The builder bumps them when this merges after content-walk.
- Nothing here has been fact-checked beyond restating the concept's own claims.
