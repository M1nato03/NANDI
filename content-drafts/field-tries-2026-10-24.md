# Field try drafts: one real-life try for every concept (spec 21 Part B)

Draft for editors. Written by the idea engine on 24 Oct 2026, based on origin/content-walk. Not yet reviewed by an editor.
The data is in `field-tries-2026-10-24.json`, next to this file. It has 54 rows, one per concept.

## Why the draft exists
Spec 21 builds the Field try on top of the existing `concept.quest` entries. On content-walk:
- 48 of the 54 concepts have a quest.
- About half of those quests are paper exercises on made-up cases, for example "In a made-up training log, mark...".
- None of the 6 money concepts from inflation to shares has a quest.

A Field try has to be something the person really does today, off the app (cj4-transfer §2.5, §4.1). So this draft
gives every concept a new try. Where the old quest was already a real try (the drain walk, food labels, the fan), the
draft keeps its idea.

## The fields in each row
These are the optional fields that cj4-transfer §4.2 proposes for the schema:
- `detail`: the try itself, at most 90 characters. It is countable and done today.
- `smaller`: the easier version. It is offered after "Not this time".
- `cues`: 2 one-tap "When?" chips. "My own" is added by the UI.
- `settings`: 2 settings to use when the try is offered again at +7 and +30 days.
- `notice`: the fixed feedback line shown after the try. Each one restates one claim of that concept, and `sourceRefs`
  are copied from that claim. The claim's text is in `noticeClaim`, so editors can check the line against it.

## Rules followed (checked by the generator script, or by hand where marked)
- Every `detail` is at most 90 characters, and every chip and `smaller` is at most 60. All 54 pass.
- Every notice cites a claim that exists in the concept. All 54 pass.
- By hand:
  - Health and body tries ask the person to notice, count or read, never to eat, drink or train more.
  - Money tries ask the person to read or work out, never to buy, invest or borrow.
  - None of the tries uses "you should".
- Safety lines are kept by hand:
  - sky: "away from the Sun"
  - pressure cooker: "from a safe distance", and "when it is cold" for the vent weight
- No targets and no scores ("There is no target" on the drinks and app-check tries). No guilt wording.

## Review applied (24 Oct)
Codex B flagged 24 of 54 rows (field-tries-review-codexB.md). The fixes are applied by `tools/field_tries_fix1.py`:
- no try now asks for extra walking or stairs, or for a payment
- the spotlight, home-reading and relative-warning tries became observation-only
- notices stay closer to their claims

The list below was written before that review. The spotlight, showing-up and sleep-memory notes have since been
addressed by it.

## What editors should check first
- `spotlight-effect`: "Ask a friend if they remember what you wore yesterday." It is gentle, but it is still social.
- `sleep-memory`: "sit quietly for 5 minutes". This is the claim's own finding (quiet rest after learning), not a health promise.
- `showing-up`: the only try that asks for movement (2 minutes of walking or stairs). The concept's claim says bouts
  of any length count. If editors still read it as exercise advice, use the smaller version as the main try.
- `diversification` and `index-funds` need a browser and a fund fact sheet. They may be the least likely to be done.
- `company-trade-rule` and `mughal-revenue` are the weakest links between the try and the history.
