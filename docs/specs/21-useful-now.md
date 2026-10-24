# Spec 21 · Useful now: life-skill tracks, the Field try and Try-it hobbies

Status: APPROVED by Jenil (24 Oct 2026: "21 yes"). Each step in the build order still gets its own gate. The four decisions are settled as listed under "Decisions for Jenil" (Jenil can still change any of them). Offline-first, online-ready (Jenil, 24 Oct).

Jenil's asks (23-24 Oct):
- Teach things people can use now, not school topics, so a session is worth more than scrolling.
- Give people something real to do OFF the phone on low and normal days: a hobby or skill such as drawing, singing or videography.
- "The real-life application learning is what will make us stand out."

The research is cloud batch 4. These 7 reports on branches ideas/cj4-* hold every quote, source and draft:
- demand
- evidence
- transfer
- packaging
- pilot-outline
- hobbies
- try-it
This spec decides what to build.

## Part A · Life-skill tracks
**Order** (demand from cj4-demand, evidence from cj4-evidence):
| # | Track | Why first | Evidence |
|---|---|---|---|
| 1 | **Talk to anyone** (8 ideas, cj4-pilot-outline) | Communication is the top skill employers ask for (37%). It covers "be more fun to talk to" and the honest half of "sell anything". | 3 strong, 3 moderate, 1 mixed, 1 weak |
| 2 | **Think like a detective** (inference, base rates, other explanations) | Strong evidence that short training transfers (Morewedge 2015, Sellier 2019). Pairs with Mind cases. Drishyam and Mentalist only as inspiration; our own stories. | Strong |
| 3 | **Spot the scam, earn safely** | Seekho's #2 demand ("part-time income"), made safe: task scams, pay-to-work, fake jobs, the 1930 helpline. No income promises. | Sourced from MHA/I4C |
| 4 | **Focus without the myths** | NANDI's mission. Leads with what failed (dopamine fasting, the "willpower battery", the phone "brain drain"), ends with what works (cues, friction, if-then plans). | Tools strong; the myths are X-grade |
Later: Money you actually use (it extends Money), First job, Using AI well, Energy and rest (information only, with a medical-referral line).
Not doing: hackathons as a track (weak evidence; it becomes a "finish and show a project" lesson), photos and looks
(body-image risk), coding (it doesn't fit 2-minute steps).

**Format.** The same step format as now (spec 14): hook guess -> teach card -> Show me -> tries -> takeaway. Two
additions from the evidence:
- Every Show me compares a weak example with a good one (Loewenstein et al. 2003; Taylor et al. 2005).
- Every lesson can end with a Field try (Part B).

**Packaging.** Adopt cj4-packaging's 10-rule honest-hook checklist into the validator and editorial review:
- The hook's promise is delivered in the same lesson.
- The surprise is real and sourced, never "a secret".
- The hook names a setting, not a flaw in the reader.
- No outcome promises for health, body or money.
Also:
- Rename the 6 current topics to outcome-first names. Jenil picks from cj4-packaging §5, e.g. "Do the maths on money" and "See inside everyday things".
- Rewrite the 43 hooks that state the answer before the lesson.
- Hinglish titles for the work-and-money tracks are optional. Seekho works in Hinglish.

## Part B · The Field try (cj4-transfer §4, adopted as written)
- **Done screen:** "Try it today: ask 3 follow-up questions in one conversation." Two buttons: Add for today, or Not today.
  Then one tap on a cue ("At lunch", "On a call home", "In a group chat", or my own). That cue is the if-then plan.
- **Today:** one quiet line on Plan. It is not a Task, has no timer and sends no reminder.
- **Next day:** Did it / Partly / Didn't come up / Not this time, then an optional one-line reflection, then one fixed, sourced line.
- **Re-offers** go to a new setting after +7 and +30 days. After "Not this time", the next offer is the smaller version, then it stops.
- **Limits:** 1 offer a day, 1 open at a time. Unanswered tries expire after 3 days, silently. Not offered after bedtime or on a soft day.
- **Data:** a `PlanRow` (kind 'field') plus one ledger fact `field:<planId>` with 0 XP. Mind's plan card and the hexagon's
  Wisdom ratio skip it, so a "Not this time" never lowers a stat.
- **Content:** reuse `concept.quest`. It is already filled in 48 concepts and no screen shows it. Add `cues`,
  `smaller`, `notice` and `settings`, and check that the try is countable.
- **XP: 0 in v1** (recommended). A tick then has no reason to be inflated. A flat, announced 10 XP is the fallback if
  uptake is low. **Jenil decides.**

## Part C · Try-it hobbies (cj4-try-it + cj4-hobbies)
- **One Try-it day** = a 2-minute idea -> a 10-20 minute off-phone quest (5-minute small version) -> a one-tap self-check the next day.
- **Seven days** make a starter track. Day 3 can come a week after day 2: "Day 3 of 7" is a position, not a streak.
- **First three starters:** drawing, singing and videography, drafted in cj4-try-it §7 for editors. Then the best of the
  cj4-hobbies ranking: cost ₹0, works in a hostel, first win in 10 minutes or less, fits a low-energy day.
- **Honest hooks from the evidence:**
  - "Think you can't sing? Most people sing in tune at a slow tempo."
  - "Drawing mistakes come from seeing, not your hand."
  - No "brain-boosting" or "lowers stress" claims.
- **Discovery without a feed:**
  - a pick of 3 on Plan when no track is active
  - two new first-run interests (sing, video)
  - one line after a finished creativity side quest
  - App pause offers the day's quest
  - a soft day offers only the active track's small quest
- **Saved:** done, small or full, an optional 80-character note, the self-check tap, and an asked "time off the phone" band.
  Photos and recordings stay in the phone's own gallery. NANDI never opens the camera or microphone for this.
- **XP:** only through existing capped paths (one lesson a day, one weekly side quest). That is at most 20 XP a week
  more. **Depends on item 45:** custom side quests are capped at 3 paid a week first (built on branch custom-quests).

## Online later (v2, when there are servers)
- **Try it with a friend:** both get the same Field try or Try-it quest, and each sees whether the other did it.
  There is no ranking. Accountability is one of the few social mechanics with evidence.
- **Share one hobby piece** with friends or a small circle by choice. There is never a public feed. Report and block
  come first, and so does a moderation budget (cloud job cj5-online covers it).
- **Calibrate tries and lessons** across learners, with consent: which Field tries people actually do, and which hooks work.
- **Track content arrives without an app update** (the pack updater, Phase 4).
v1 stores everything in `plans`, `quests` and `ledger` rows that are already sync-ready.

## Kill tests (set before launch, never moved afterwards)
- **Field try** (cj4-transfer §7), over 4 weeks or 30 offers:
  - Keep if uptake is ≥ 30%, follow-through ≥ 40%, lesson finishing doesn't drop, and Jenil doesn't feel it as homework or guilt.
  - Kill if uptake is < 15%, or finishing drops 10 points.
- **Try-it** (cj4-try-it §8):
  - Do people report time off the phone? (Asked, not tracked.)
  - Do they reach day 7 within 3 weeks?
  - Kill a track if fewer than half of its starters reach day 3.
- **Tracks vs school topics** (2 weeks, Jenil and 5-10 friends): starts, finishes and a "worth my time vs Instagram" rating
  per lesson. If tracks don't beat the current topics on at least two of the three, re-rank toward the need-based tracks.

## Build order (each step needs Jenil's yes and the full gate)
1. Item 45 (custom quest cap). Already built.
2. The Field try on the existing 48 `concept.quest` entries (Part B). Small code, mostly content.
3. Pilot track "Talk to anyone": editors rewrite cj4-pilot-outline into the pack format, then fact-check.
4. Try-it: drawing starter first, then singing and videography (Part C).
5. Honest-hook checklist in the validator, topic renames, hook rewrites.
6. Tracks 2-4.

## Decisions for Jenil (settled 24 Oct with "21 yes"; the recommended option was taken where he gave no other)
1. Field try: **0 XP**. A flat 10 XP stays the fallback if uptake is low.
2. Topic renames: **the proposed titles in cj4-packaging §5** (e.g. "Do the maths on money", "See inside everyday things"). The health topic follows the sleep-health rename already on content-walk; its final title is set when content-walk merges.
3. Track order: **as written** (Talk to anyone, Detective, Scam-safe earning, Focus).
4. Hinglish titles: **not in v1.** English titles ship first. Hinglish comes with the Hinglish opt-in setting, which is still Jenil's open small decision.
