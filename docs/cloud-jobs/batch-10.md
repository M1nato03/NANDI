# Cloud job batch 10: fact-check the Chiku scenes and Moti's recall pieces (idea engine, 25 Oct 2026)

How to run: one cloud session runs BOTH jobs below as parallel subagents.
- Each job pushes ONE report (plus a corrected copy of its draft) on its OWN new branch, cut from the draft branch named.
- Never push main or any existing branch. Never open a PR. Never change app code or content/ files.
- Network access is open. Open the real sources the pack cites and quote them with URLs. If a page cannot be
  opened, say so. Use only legal open copies. Never use Sci-Hub or any paywall bypass.
- Plain English, short lines, tables, no praise. At the end, list each branch, its commit and a 3-line summary.

NANDI is an offline-first learning and habits app for adults 18-25. These drafts become in-app content only after
this check and the owner's sign-off. Product rules: sourced facts only; no "wrong", "should" or "your brain"; no
health, clinical or money promises; no stereotypes; plain English (about 8th-grade level).

## Job 1 · Chiku scenes (branch ideas/cj10-factcheck-chiku, from origin/ideas/cj9-chiku-scenes)
Spec: `git show origin/ideas/spec-30-chiku:docs/specs/30-teach-chiku-one-card.md`.
Draft: content-drafts/chiku/psychology.scenes.json (10 scenes). Pack: content/topics/topic.psychology.json
(claims with ids and sources, misconceptions with ids).
For each scene, verdict PASS / FIX / DROP with the reason:
1. The right card truly is the cause the cited claims support. Open the claim's source and quote it.
2. Each wrong card is a real misconception of THAT idea (the id exists, and the text matches its meaning).
3. The new day really separates them: the truth follows from the right card, and each wrong card predicts a
   different outcome. No trick wording; no outcome the source does not support.
4. Chiku's "why" lines restate the card fairly.
5. Wording rules; prop and act from the fixed lists; ages and names respectful.
Write content-drafts/chiku/psychology.scenes.checked.json with every FIX applied (keep the same shape), and
docs/reviews/cj10-factcheck-chiku.md (a table per scene, quotes with URLs, and the list of fixes).

## Job 2 · Moti's recall pieces (branch ideas/cj10-factcheck-moti, from origin/ideas/cj9-moti-pieces)
Spec: `git show origin/ideas/spec-26-moti-kachhua:docs/specs/26-moti-haveli-kachhua-kolam.md` section A1.
Draft: content-drafts/moti/recall-pieces.json (20 concepts: Psychology and Money). Packs:
content/topics/topic.psychology.json and topic.money-markets.json.
For each item, verdict PASS / FIX / DROP with the reason:
1. The takeaway is true to the cited claims (open the sources; quote them). Any "edited" takeaway keeps its meaning.
2. The 3 pieces join exactly to the takeaway and each is a meaningful chunk.
3. Each decoy is that idea's real misconception (the id exists), fits its slot grammatically, is tempting, and is
   clearly false once the idea is known. Its fix line is accurate.
4. Money items: no promise of returns, no product advice, nothing that reads as financial advice.
5. Wording rules.
Write content-drafts/moti/recall-pieces.checked.json with every FIX applied, and
docs/reviews/cj10-factcheck-moti.md.
