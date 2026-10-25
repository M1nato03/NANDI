# cj9 digest of batch 7

I checked branch file counts and saved blind-check artifacts. Validator results below are **as printed in the reports**; I did not rerun `npm ci` or validation in this read-only worktree.

## `cj7-tries-a`

- Delivered: 60 steps, 120 new tries, 155 misconception links; all merged steps have three guided slots.
- Brief: **PARTLY** — the report says the card-needed rule is not met.
- Check: validator 0 errors for both packs. Saved blind answers confirm **360/360 right** without cards; 61 later rewrites have no blind retest (`docs/reviews/cj7-tries-a.md:72-125`).
- 1. Rework answerable-by-common-sense options across the set, then retest.
- 2. Replace the SIP-to-gold-plan transfer, which applies a SIP claim to a different product (`content-drafts/tries/money-markets.json:301`).
- Verdict: **REDO**.

## `cj7-tries-b`

- Delivered: 54 steps, 108 new tries, 124 misconception links; merged counts and option shapes check out.
- Brief: **PARTLY** — card dependence remains unshown, and final wording was changed after the reported blind round.
- Check: validator 0 errors for both merged packs; report gives **310/324 right (96%)** in round 2. The branch saves quiz input and key, but no blind answers; one later edit has no score (`docs/reviews/cj7-tries-b.md:57-80,122-126`).
- 1. Restore the study’s qualification in “one night lowered play”; its own feedback says “tended to” (`content-drafts/tries/body-training.json:387-406`).
- 2. Review transfers that remain in the same activity, especially pressure-cooker work (`docs/reviews/cj7-tries-b.md:133-145`).
- Verdict: **NEEDS A FIX FIRST**.

## `cj7-tries-c`

- Delivered: 48 steps, 96 new tries, 111 misconception links; merged counts and option shapes check out.
- Brief: **PARTLY** — final blind check ran, but a health answer is ambiguous and one try uses a fact absent from its teach card.
- Check: validator 0 errors for both merged packs. Saved final answers confirm **273/288 right (94.8%)**; no final 3/3 give-away is reported (`docs/reviews/cj7-tries-c.md:51-103`).
- 1. Name the WHO 10% limit in the sugar transfer: “at the limit” conflicts with the stricter Indian limit noted in the report (`content-drafts/tries/health-nutrition.json:252-260`; report:113-116).
- 2. Put the “even one hour” sleep fact on its card or change that try (`docs/reviews/cj7-tries-c.md:298`).
- Verdict: **NEEDS A FIX FIRST**.

## `cj7-detective-outline`

- Delivered: 8 ideas, 24 steps, 8 Field tries, with quoted sources and evidence grades.
- Brief: **PARTLY** — the requested outline exists, but a central counting example needs correction.
- Check: no validator or blind check reported. Its “95% accurate” checker example assumes a 5% false-positive rate and about two true flags; overall accuracy establishes neither (`docs/reviews/cj7-detective-outline.md:217-237`).
- 1. Specify sensitivity and false-positive rate, then recalculate the example.
- 2. Keep the report’s limits on short lessons and base-rate stereotypes in the editor draft (`docs/reviews/cj7-detective-outline.md:18-28,1039-1042`).
- Verdict: **NEEDS A FIX FIRST**.

## `cj7-scam-outline`

- Delivered: 8 ideas, 24 steps, 8 Field tries, plus a reporting directory.
- Brief: **PARTLY** — the brief required current checks for every reporting URL; several could not be opened.
- Check: no validator or blind check reported. The report explicitly leaves the cybercrime portal, Sachet and RBI complaints portal untested directly (`docs/reviews/cj7-scam-outline.md:1029-1047`).
- 1. Remove or source the account of how a real legal case starts; the report calls that column unsourced (`docs/reviews/cj7-scam-outline.md:687-699`).
- 2. Open the reporting portals and RBI **BE(A)WARE** booklet before pack release (`docs/reviews/cj7-scam-outline.md:26-28,1122-1127`).
- Verdict: **NEEDS A FIX FIRST**.

## `cj7-sing-video`

- Delivered: 2 packs, each with 3 concepts, 9 steps, 18 items and 3 quests.
- Brief: **PARTLY** — the seven-day starters need clearer treatment of two extra steps per pack; a singing quest still stretches short-note evidence to a song (`docs/reviews/cj7-sing-video.md:185-193,239-244`).
- Check: both packs report **0 errors** with `allowUnchecked`; each has **3 missing fact-check verdicts** without it (`docs/reviews/cj7-sing-video.md:129-168`).
- 1. Fact-check the day-5 singing quest and correct the undated Reading guide’s invented 2026 publication year (`docs/reviews/cj7-sing-video.md:191,228`).
- 2. Both pack descriptions say “Seven” while each contains nine steps (`content-drafts/topic.try-singing.json:7`; `content-drafts/topic.try-video.json:7`).
- Verdict: **NEEDS A FIX FIRST**.

## `cj7-factcheck-drawing`

- Delivered: **229 verdicts**: 138 supported, 86 past-source, 4 wrong, 1 wording risk; numbers and quests are reviewed.
- Brief: **MET** — it supplies source quotes, exact rewrites and a ranked fix list.
- Check: no validator or blind check reported. The drawing pack is unchanged, so the flagged “30 ticks” quest and “Seven” description remain in it (`content-drafts/topic.try-drawing.json:717,7`).
- 1. Apply the Day 2 tick rewrite first; the current target points toward less frequent looking (`docs/reviews/cj7-factcheck-drawing.md:14-18,158`).
- 2. Fix the upside-down finding and the Show me with two fair answers (`docs/reviews/cj7-factcheck-drawing.md:19-34`).
- Verdict: **READY FOR EDITORS**.

## `cj7-talk-fulltext`

- Delivered: full-text checks for **3 of 5** papers, nine patch rows, and a reach-out estimate item. Two papers remain at abstract level.
- Brief: **PARTLY** — the report records the unavailable texts, but the full-text check remains incomplete.
- Check: validator reports **0 errors**, down from one. The claim and estimate are in the pack (`content-drafts/topic.talk-to-anyone.json:1964,2451`); the adjacent fact-check note still says the estimate is missing (`content-drafts/talk-to-anyone-factcheck-applied.md:23-31`).
- 1. Reconcile that note and update the Liu source URL (`docs/reviews/cj7-talk-fulltext.md:193-201`).
- 2. Check Fischer in a library copy and Weger in a browser; review the note-versus-imagined-gift comparison (`docs/reviews/cj7-talk-fulltext.md:90-108,193-198`).
- Verdict: **NEEDS A FIX FIRST**.

## Across the branches

| Branch | Delivered | Brief | Reported check | Verdict |
|---|---:|---|---|---|
| tries-a | 120 tries | PARTLY | 0 errors; blind 100% on earlier text | REDO |
| tries-b | 108 tries | PARTLY | 0 errors; blind 96% before last edit | NEEDS A FIX FIRST |
| tries-c | 96 tries | PARTLY | 0 errors; final blind 94.8% | NEEDS A FIX FIRST |
| detective | 8 ideas / 24 steps | PARTLY | None reported | NEEDS A FIX FIRST |
| scam | 8 ideas / 24 steps | PARTLY | None reported | NEEDS A FIX FIRST |
| sing-video | 2 packs / 18 steps | PARTLY | 0 errors with unchecked verdicts allowed | NEEDS A FIX FIRST |
| drawing fact-check | 229 verdicts | MET | No validator reported | READY FOR EDITORS |
| talk full-text | 3 of 5 texts / 9 patch rows | PARTLY | 0 errors reported | NEEDS A FIX FIRST |

The tries branches contain the **same** `src/data/packs/schemas.ts:38` change. Merge it once. They also use the **same blind-check input and key paths with different contents**, so preserve each branch’s artifacts under distinct names. The drawing JSON carried by `cj7-sing-video` and `cj7-factcheck-drawing` is identical to the cj6 source; the latter branch supplies a review, not applied fixes. Diffs against `origin/main` include inherited base-branch files, especially for the tries branches.

## Five next actions

1. Redo tries A’s answer design; run human no-card checks on the final tries across A, B and C.
2. Correct the detective accuracy example, sugar-limit answer, sleep qualifier and scam legal-procedure column.
3. Verify the scam reporting endpoints and booklet; finish the Fischer and Weger source checks where access permits.
4. Implement three-try playback and hidden transfer hints in `src/ui/learn/StepLesson.tsx:37`; merge the schema change once and rename overlapping blind artifacts.
5. Apply the drawing fact-check rewrites, settle seven versus nine steps in both hobby packs, and reconcile the Talk fact-check note with its pack.