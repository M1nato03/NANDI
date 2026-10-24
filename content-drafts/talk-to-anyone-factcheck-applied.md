# "Talk to anyone" draft: the cj6 fact-check is applied

This note is for editors. The idea engine applied the fact-check on 24 Oct 2026. The pack is still a draft, and it is
still marked as not fact-checked in its own `factCheck` fields. An editor has to sign it off.

## How it was applied
1. **Codex B rewrote the pack** from `docs/reviews/cj6-factcheck-talk.md` (branch `ideas/cj6-factcheck-talk`):
   - It applied every P, W and R rewrite.
   - It fixed the 6 main problems in the fact-check's summary: the Brooks misread, the two Show me examples with two
     right answers, internal text leaking into learner copy, "because" reasons the papers do not give, filler in the
     -s3 steps, and untested advice labelled as research.
   - It added the setting line ("the studies were run in the US, UK or Israel").
2. **The idea engine fixed what the validator still flagged** (`tools/talk_fix2.py`):
   - 3 Show me `ask` lines were over 60 characters.
   - 10 teach cards had lost their reason link. Each now joins the finding to the move with "so", "since" or "which
     means". None of them gives a mechanism the paper does not state.
   - One teach card used "said", which the authority rule flags.
   - 3 claims scored below 60 on reading ease.
   - 4 feedback lines were under 8 words.
   - One estimate stem did not name its concept.
   - The right answer was the longest option too often (42%, over the 40% limit). Two wrong options were lengthened to fix it.

## Validator: 1 error left, on purpose
`reach-out: needs an estimate item`. Every concept must have an estimate item. The reach-out sources were read as
abstracts only (Brooks 2015, Liu 2023, Fischer 2011), and the claims carry no number, so an honest estimate cannot be
written yet. The fact-check removed the old one, which only counted friends in a scene.

Two ways to fix it:
- An editor finds a number in the full text of one of these papers and adds a claim for it.
- The validator lets a concept skip the estimate when its sources give no number. That is the same rule-fit problem
  cj6-drawing-starter §5 found for hobby tracks.

## Still to check
- The new copy restates the fact-check's quotes, but an editor must read it against those quotes.
- Kardas 2022 and Weger 2010 were read as abstracts only.
