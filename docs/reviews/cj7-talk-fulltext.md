# cj7 Job 8: full-text check of the "Talk to anyone" sources that were read as abstracts

Draft for editors, 24 Oct 2026. Branch `ideas/cj7-talk-fulltext`, cut from `ideas/spec-21-useful-now`.
Pack: `content-drafts/topic.talk-to-anyone.json`. Patch: `content-drafts/talk-fulltext.patch.json`.
Script that applies the patch: `content-drafts/tools/talk_fulltext.py`.

Nothing here is signed off. The pack is still marked as not fact-checked.

## 1. Summary

- 3 of 5 papers have a legal full text, and I read all 3: Brooks 2015, Liu 2023, Kardas 2022.
- 2 do not have one I could open: Fischer 2011 (no legal open copy exists) and Weger 2010 (free on the publisher
  site, but the site blocked automated access). I stopped there for both papers. Their lines still rest on the abstract.
- Every pack line that cites Brooks, Liu or Kardas is supported, with 3 exceptions. All 3 are fixed in the patch:
  - "held most for hard tasks" overstated what the study found for easy tasks.
  - One Liu wrong option was true as written.
  - One Liu correction left out a key point.
- **Reach-out estimate: done.** Liu et al. Experiment 2 gives a fair number. Senders guessed 5.57 out of 7, and the
  classmates who got the note rated it 6.17. A new claim `reach-out-c8` and an estimate item `reach-out-5` are in the pack.
- Validator (`validatePack`, `{ allowUnchecked: true, editorial: true }`): **0 errors**. Before this branch there was
  1 error, `reach-out: needs an estimate item`. No validator rule change is needed.

## 2. Where each full text came from

| Paper | Legal full text | What it is | Result |
|---|---|---|---|
| Brooks, Gino and Schweitzer 2015, *Management Science* 61(6), 1421-1435 | https://www.hbs.edu/ris/Publication%20Files/Advice%20Seeking_59ad2c42-54d6-4b32-8517-a99eeae0a45c.pdf | Published version, on the authors' school's server (Harvard Business School). Unpaywall/Semantic Scholar list it as green open access | Read in full |
| Liu, Rim, Min and Min 2023, *JPSP* 124(4), 754-771 | https://www.apa.org/pubs/journals/releases/psp-pspi0000402.pdf | The APA's own free copy of the advance online version (pages 1-19). An accepted version is also on SSRN: https://doi.org/10.2139/ssrn.4115683 | Read in full. Page numbers below are pages of the advance online PDF |
| Kardas, Kumar and Epley 2022, *JPSP* 122(3), 367-398 | https://michaelkardas.com/assets/pdfs/Kardas,%20Kumar,%20&%20Epley%20(2022)%20Overly%20shallow%20Miscalibrated%20expectations%20create%20a%20barrier%20to%20deeper%20conversation.pdf | Published version, on the first author's own site | Read in full |
| Fischer et al. 2011, *Psychological Bulletin* 137(4), 517-537 | **None found** | Unpaywall: not open access. Regensburg repository (https://epub.uni-regensburg.de/64801/): no file, only "request a copy". No author page, PubMed Central or preprint copy. The copies on Academia.edu, Scribd and Scinapse are third-party uploads, so I did not use them | **Stopped.** Abstract only (PubMed 21534650) |
| Weger, Castle and Emmett 2010, *Int. J. of Listening* 24(1), 34-49 | Free to read on the publisher site (Unpaywall marks it "bronze"): https://www.tandfonline.com/doi/pdf/10.1080/10904010903466311 | The site returned a bot challenge (HTTP 403, `cf-mitigated: challenge`) to both tools I tried. UCF STARS (https://stars.library.ucf.edu/scopus2010/1477) says "This document is currently not available here." The SlideShare copy is a third-party upload | **Stopped.** Abstract only. A person with a browser can likely open the publisher PDF |

## 3. Line-by-line check

"Supported" means the full text says it. Quotes are short. Page numbers are journal pages for Brooks and Kardas, and
pages of the advance online PDF for Liu.

### 3.1 Brooks, Gino and Schweitzer 2015 (reach-out)

| Pack line | Verdict | Passage |
|---|---|---|
| `reach-out` hook, rule ("Ask someone with expertise about a hard task") | Supported | p. 1421 abstract: seekers are seen "as more competent when the task is difficult rather than when it is easy ... and when people seek advice from experts" |
| `reach-out-c1` (people avoid asking for fear of looking incompetent; the fear is misplaced) | Supported | p. 1421: "people are reticent to seek advice for fear of appearing incompetent. This fear, however, is misplaced." Pilot B, p. 1424-25: 73.5% asked for advice when paid for performance, versus 32.7% when paid for how competent they looked |
| `reach-out-c2` (advice-seekers seen as more competent) | Supported | p. 1426, Study 1: partners who asked for advice were rated higher on competence. Study 2a, p. 1426: this held against a neutral greeting, a non-advice question and a "we're in this together" message |
| `reach-out-c3` (bigger boost: hard task, expert adviser, rater is the one asked) | Supported | p. 1431, General Discussion: the effect is moderated by task difficulty (Study 3), being asked personally (Study 4) and adviser expertise (Study 5) |
| `reach-out-m1` correction, old: "It held most for hard tasks, not easy ones." | **Not quite. Fixed** | p. 1431: "when the task is easy, asking for advice confers no benefit. Interestingly, even when the task was easy, seeking advice did not harm perceptions of competence." Study 3, p. 1428: on the easy task, ratings "did not differ" (p = .72). "Held most" implies a smaller effect on easy tasks; the study found no effect |
| `reach-out-s1` guided, option a feedback (same old line) | **Not quite. Fixed** | Same passage |
| `reach-out-m2` ("Asking means I'm weak": the fear was misplaced) | Supported | p. 1421, as for c1 |
| `reach-out-s1` hook, option b and its feedback ("These were lab studies, not offices") | Supported, **wording sharpened** | Pilot A and Study 5 were online with US adults on Mechanical Turk (pp. 1424, 1430). Pilot B and Studies 1-4 used US university students (pp. 1424-29). New: "lab and online studies, not offices" |
| `reach-out-s1` hook, option c feedback ("did not test how many times you ask") | Supported | No study varied repeat asking |
| `reach-out-s1` teach, example, takeaway | Supported | p. 1428 (difficult task) and p. 1431 (expert adviser). One caution, from p. 1431: asking a clear *non*-expert made the seeker look *less* competent than not asking. The example (asking the lead who built the pipeline) fits |
| `reach-out-1`, `reach-out-2` (all options and feedback) | Supported | As above. `reach-out-2` b ("ask the whole office"): p. 1430 Study 4 found no boost when the rater only watched someone else being asked |
| Quest ("Ask one experienced person about a hard task") | Supported | As for the rule |

### 3.2 Liu, Rim, Min and Min 2023 (reach-out)

| Pack line | Verdict | Passage |
|---|---|---|
| `reach-out` hook, rule ("A short personal check-in may be valued more than you expect") | Supported | p. 1 abstract: "we document a robust underestimation of how much other people appreciate being reached out to" |
| `reach-out-c4` (people underrate how much others value a short check-in or small gesture) | Supported | p. 1, and p. 14 General Discussion: the effect held "across both brief message and small gift reach-outs" |
| `reach-out-c5` (gap bigger with less-close people, and when it is a surprise) | Supported | p. 1: the gap "is magnified when the reach-out context is more surprising ... and when it occurs between more socially distant (vs. socially close) others". Experiment 6, p. 13: no gap when the check-in was expected as part of a program. Experiment 7, p. 14: gap of 0.67 for weak ties versus 0.30 for strong ties, on a 1-7 scale |
| `reach-out-m3` correction, old: "The gap was larger with less-close people." | Supported, **made fuller** | Experiment 7, p. 14: weak-tie ratings were 5.24 (senders) and 5.92 (receivers), so a check-in to a less-close person was still valued. New: "Less-close people still valued it, and senders underrated them even more." |
| `reach-out-s2` hook | Supported | Experiments 1-7: senders' guesses were below receivers' ratings in every main study (Table 1, p. 5) |
| `reach-out-s2` teach ("the gap can grow when the two people are less close, since the note may come as a nice surprise") | Supported | p. 13: "We surmised that a reach-out from a weak tie would be more surprising for a responder". A pretest confirmed it (p. 13). The "since" is the authors' own account |
| `reach-out-s2` guided, option a feedback ("people who got a check-in focused on the surprise, and that went with valuing it more") | Supported | Experiments 5a/5b, p. 11: "responders ... were more focused on their pleasant surprise at the reach-out than initiators were", and the gap was mediated by this |
| `reach-out-s2` guided, option b, old: "Skip it. Close friends value messages more." | **Problem. Fixed** | Experiment 7, p. 14: strong-tie receivers did rate a check-in higher in absolute terms (6.65 against 5.92 for weak ties). So the second half of the option is true, and the old feedback ("The gap was larger between less-close people") did not answer it. New option: "Skip it. A friend from months ago won't care." New feedback: "In the studies, even less-close people valued a check-in more than senders guessed." |
| `reach-out-s2` guided, option c feedback ("Group posts were not tested") | Supported | Every study used one-to-one messages, notes or gifts. Experiment 1, p. 6: text 70%, phone 16%, email 6% |
| `reach-out-s3` hook, teach, example, guided | Supported | p. 14, Experiment 7. **Note for editors:** Experiment 7 asked people to imagine a small gift, not a note. Notes to a weak tie were tested in Experiment 4a (p. 9), which found the gap but had no strong-tie group to compare. The pack's "gestures" wording in c4 covers this, but s3 says "note" throughout |
| `reach-out-3` | Supported | As for c4 and c5 |
| `reach-out-4` a, c | Supported | As for c4 and c5. "Did not test WhatsApp group replies" is correct |
| `reach-out-5` (old predict item: who focused more on the surprise) | Supported, but **replaced** by the estimate (§4) | p. 11. The same point is still taught in the s2 guided feedback and in the match item `reach-out-6` |
| `reach-out-6` (match) | Supported | pp. 11, 13, 14 |
| Quest ("send one short check-in to someone you haven't talked to in a while") | Supported | Experiment 2, p. 7: notes "to check in and say hello" to a classmate they had "not interacted ... in a while" |
| Topic setting line ("the studies were run in the US, UK or Israel") | Supported for Liu | US and UK participants (Experiment 7, p. 13); US campuses (Experiments 2, 3, 5a) |

### 3.3 Kardas, Kumar and Epley 2022 (follow-ups)

| Pack line | Verdict | Passage |
|---|---|---|
| `follow-ups-c4` (chats with strangers felt less awkward and more connecting than expected) | Supported | p. 367 abstract: "conversations between strangers felt less awkward, and created more connectedness and happiness, than the participants themselves expected (Experiments 1a-5)" |
| `follow-ups-c5` (people most overrate the awkwardness of deep talk) | Supported | p. 367: "Participants were especially prone to overestimate how awkward deep conversations would be compared with shallow conversations (Experiments 2-5)". Experiment 2, p. 374: overestimation d = 2.23 for deep talk versus d = .55 for shallow talk |
| `follow-ups-c6` (they expected partners to care less than the partners did) | Supported | p. 367: "participants expected others to care less about their disclosures in conversation than others actually did" |
| `follow-ups-m2` correction ("partners cared more than people expected") | Supported | p. 367, as above |
| `follow-ups-s2` hook, teach, takeaway | Supported | p. 367, and p. 391: participants "consistently overestimated how awkward deep conversations would be" |
| `follow-ups-3` (all options) | Supported | p. 367. Option c ("deep talk meant personal and meaningful talk"): p. 368 defines deep conversations as "revealing personally intimate information about their thoughts, feelings, or experiences" |
| `follow-ups-4` and the s2 guided item ("What does your family earn?" is a private fact, not deep talk) | Partly supported | The definition (p. 368) and the questions used (p. 371: what you feel most grateful for, a time you cried in front of someone) support "deep = what matters to them". The paper does not discuss money questions; that contrast is our own |
| `follow-ups` rule and quest ("Sharing back is a good habit, though the studies did not test it" / "Share your own answer too") | Accurate, with a nuance | In these studies both people answered the same questions (p. 370: "would answer and discuss four questions with the other person"). So mutual sharing was built into the design, but it was never tested against not sharing. **Suggested editor wording** (not in the patch): "In the deep-talk studies both people answered, but sharing back was not tested on its own." |
| Setting | Note for editors | p. 391, Limitations: in every experiment "both people in the conversation knew they were going to have a conversation as part of an experiment". The samples were US executives, students and online adults, plus one online session of international MBA students (p. 370) |

### 3.4 Fischer et al. 2011 (reach-out): no legal full text, stopped

The lines still rest on the PubMed abstract (https://pubmed.ncbi.nlm.nih.gov/21534650/). The abstract does support them:

| Pack line | Abstract passage |
|---|---|
| `reach-out-c6` (in a crisis, a person is less apt to help when more people are near) | "the presence of other people in a critical situation reduces the likelihood that an individual will help" |
| `reach-out-c7` (weaker when the others are people you know) | the effect was reduced "when the bystanders were not strangers" |
| `reach-out-4` b feedback ("The review was about a crisis with others near, not about a chat group") | Fits the abstract's scope: "critical situation", "dangerous and non-dangerous emergencies" |

An editor with library access should check the moderator table behind c7 before sign-off.

### 3.5 Weger, Castle and Emmett 2010 (listening): full text not opened, stopped

| Pack line | Status |
|---|---|
| `listening-c4` ("A paraphrase alone did not make people feel understood in an earlier study") | Fits the abstract on UCF STARS: paraphrases "were not associated with participants' conversational satisfaction or perceptions of feeling understood". The abstract also says they were associated with how socially attractive the listener seemed. The pack does not mention that |
| `listening-2` c feedback | As for c4 |
| `listening-s1` lists `weger-2010` as a source, but its teach card restates the 2014 finding | The 2010 abstract supports only the "paraphrase alone" contrast, so an editor may drop `weger-2010` from s1 |

## 4. The reach-out estimate

**Number used.** Liu et al. 2023, Experiment 2. This was a field experiment on a US campus. Students wrote a short note
"to check in and say hello" to a classmate they had not talked to in a while, and guessed how much it would be appreciated
(1 = not at all, 7 = a great extent). The classmates who got the note rated it on the same scale. There were 54 matched pairs.

> "Initiators (M = 5.57, SD = 1.35) significantly underestimated how much their reach-outs were appreciated compared to
> how much responders (M = 6.17, SD = 1.24) appreciated them" (advance online PDF, p. 8)
> https://www.apa.org/pubs/journals/releases/psp-pspi0000402.pdf

**Why this number.** It is the plainest test of the step: a real, one-to-one, note-only check-in with no gift. Experiments 3
and 5a added a snack voucher, and Experiments 4-7 used imagined scenarios. A learner who took in s2 and s3 can reason to it:
the stem gives the senders' guess, so the task is to place the receivers above it and judge by how much. The scale tops out
at 7, so the range stays narrow.

**New claim** (`reach-out-c8`, source `liu-2023`):
"In one US campus study, students sent a check-in note to a classmate. On a 1 to 7 scale, senders guessed about 5.6.
The classmates gave about 6.2."

**New item** (replaces the predict item `reach-out-5`; same id, step `reach-out-s3`, job `combine`, level 2):

```json
{
  "id": "reach-out-5", "type": "estimate", "conceptId": "reach-out", "step": "reach-out-s3", "job": "combine",
  "difficultySeed": 2, "misconceptionTags": [], "sourceRefs": ["liu-2023"],
  "stem": "Students sent a reach-out note to a classmate they hadn't talked to in a while. Senders guessed about 5.6 out of 7. How did the classmates rate it?",
  "options": [
    { "id": "a", "text": "About 6.2 out of 7.", "correct": true,
      "feedback": "Higher than the senders guessed. The classmates valued the note more, by about 0.6 of a point." },
    { "id": "b", "text": "About 4.5 out of 7.", "correct": false,
      "feedback": "That would be lower than the guess. In the study, the classmates rated the note higher than senders expected." }
  ],
  "answer": { "value": 6.17, "min": 5.8, "max": 6.6, "unit": "points out of 7" }
}
```

(The pack copy also has `sourceRefs` on each option.)

**Range.** 5.8 to 6.6. The low end sits above the senders' 5.57, so a guess counts only if it puts the receivers clearly above
the senders. The high end leaves room for the 95% interval of the difference (0.12 to 1.07 points above 5.57, p. 8)
without accepting "7, a perfect score".

**Why it replaces an item.** The validator needs exactly 2 practice items per step and 6 jobs once each per idea (spec 16 §5).
A 7th item would break both rules. Other ideas in this pack also use one of their six slots for the estimate (for example,
`follow-ups-5`). The dropped item asked who focused more on the surprise. That point is still taught in the s2 guided
feedback and in `reach-out-6`.

**Other numbers I considered:**

| Option | Why not chosen |
|---|---|
| Brooks Pilot B: 73.5% versus 32.7% asked for advice | A share a learner could guess, but it tests why people avoid asking, which is c1 and not a step's own claim. A good second estimate if editors want one for s1 |
| Liu Experiment 7: gap of 0.67 (weak tie) versus 0.30 (strong tie) | It is about imagined small gifts, and two gaps in one stem are hard to guess |
| Liu: 13 preregistered studies | A count of studies tests memory of the paper, not the idea |
| Fischer abstract: 105 effect sizes, over 7,700 people | Full text not read, and the bystander claims are side notes in this idea |

## 5. Every change in the patch

`content-drafts/talk-fulltext.patch.json` has 9 rows, each `{id, field, old, new, quote, url}`. All of them are already
applied to the pack on this branch.

| # | Field | Change | Source |
|---|---|---|---|
| 1 | `reach-out.misconceptions[reach-out-m1].correction` | "It held most for hard tasks, not easy ones." → "On easy tasks, asking gave no boost, but it did no harm either." | Brooks pp. 1428, 1431 |
| 2 | `reach-out.steps[reach-out-s1].guided[0].options[a].feedback` | Same old line → "On easy tasks, asking gave no boost in the studies, though it did no harm." | Brooks pp. 1428, 1431 |
| 3 | `reach-out.steps[reach-out-s1].hook.options[b].feedback` | "lab studies" → "lab and online studies" | Brooks pp. 1424, 1430 |
| 4 | `reach-out.misconceptions[reach-out-m3].correction` | → "Less-close people still valued it, and senders underrated them even more." | Liu p. 14 |
| 5 | `reach-out.steps[reach-out-s2].guided[0].options[b].text` | "Skip it. Close friends value messages more." → "Skip it. A friend from months ago won't care." | Liu p. 14 |
| 6 | `reach-out.steps[reach-out-s2].guided[0].options[b].feedback` | → "In the studies, even less-close people valued a check-in more than senders guessed." | Liu p. 14 |
| 7 | `reach-out.claims[reach-out-c8]` | New claim (§4) | Liu p. 8 |
| 8 | `reach-out.items[reach-out-5]` | Predict item → estimate item (§4) | Liu p. 8 |
| 9 | `reach-out.items[reach-out-1].options[a].text` | "Ask an expert about a hard fix." → "Ask an expert about a tricky data fix." Length balance only: after row 8, the right answer was the longest option in just over 40% of questions | Meaning unchanged |

## 6. Validator output

Command (from the worktree, after `npm ci`), calling `validatePack` from `src/data/packs/validate.ts` with
`{ allowUnchecked: true, editorial: true }`:

```
before:  reach-out: needs an estimate item
after:   OK: 0 errors
```

## 7. Left for editors

1. Fischer 2011: check the moderator analysis behind c7 ("not strangers") in a library copy.
2. Weger 2010: open the free publisher PDF in a browser and confirm `listening-c4`. Consider dropping `weger-2010` from `listening-s1`.
3. `reach-out-s3`: the closeness comparison used imagined small gifts, not notes. Keep "note", or say "a note or small gift".
4. Follow-ups rule and quest: consider the suggested wording in §3.3 on sharing back.
5. Update the Liu source URL in the pack from PubMed to https://doi.org/10.1037/pspi0000402, so the claim's numbers can be traced.
6. The fact-check note `content-drafts/talk-to-anyone-factcheck-applied.md` still lists the estimate as an open error.
   This branch closes that error. Update the note when this branch is merged.
