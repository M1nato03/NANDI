# Independent fact check: body-training and how-things-work (learn-steps)

- **Scope:** `content/topics/topic.body-training.json` (8 concepts) and `content/topics/topic.how-things-work.json` (10 concepts), as on `origin/learn-steps` on 2026-10-21. This is the second check, independent of the builder's `factCheck` verdicts. The content was not modified.
- **Method:** every cited source page or PDF was opened in this session with curl, or with headless Chromium where a site blocks curl. Each claim was matched to an exact quote. Every number in the hooks, rules, teach cards, examples, guided tries, questions, options, feedback, estimate ranges, misconceptions and quests was recomputed. Steps and items were scanned for statements no source backs, for weak sources, for safety and medical wording, and (for UPI) against current NPCI circulars.
- **Access notes:**
  - PubMed returned a bot-check page, so those abstracts were read through NCBI E-utilities (same PMIDs).
  - The CDC CDN returned 403 to curl, so CDC pages were opened in Chromium.
  - npci.org.in blocks curl, so NPCI pages and circulars were opened in Chromium and through the site's circular API.
  - The FSSAI PDF needed Mozilla's CA bundle. TLS verification was never disabled.
  - NCBI Bookshelf NBK566046 (`showing-up` / `who`) served only a reCAPTCHA to both curl and Chromium, so it is **SOURCE DEAD** for this check.
  - The BIS link for IS 2347:2017 reset and then returned 404.
- **Verdict scale:** SUPPORTED means the exact quote was found this session. PARTLY means the claim goes beyond the quote. NOT SUPPORTED means no cited source says it. SOURCE DEAD means the page could not be opened.

## Summary

| Concept | Claims checked | Supported | Problems (total: High/Med/Low) |
|---|---|---|---|
| progressive-overload | 4 | 4 | 7 (0/1/6) |
| muscle-protein-rest | 4 | 4 | 9 (**1**/3/5) |
| sleep-recovery | 4 | 3 | 7 (0/1/6) |
| heat-hydration | 5 | 5 | 8 (0/4/4) |
| warmup-myths | 4 | 1 | 6 (0/1/5) |
| cardio-talk-test | 4 | 4 | 3 (0/0/3) |
| showing-up | 4 | 4 | 8 (0/1/7) |
| food-labels | 5 | 3 | 6 (0/2/4) |
| lift | 5 | 4 | 6 (0/4/2) |
| multirotor-turns | 5 | 5 | 5 (0/1/4) |
| battery-flight-time | 5 | 5 | 3 (0/0/3) |
| flight-sensors | 5 | 4 | 5 (0/1/4) |
| birds-and-planes | 6 | 6 | 7 (0/0/7) |
| ceiling-fans | 6 | 6 | 9 (0/1/8) |
| upi-path | 7 | 6 | 11 (**2**/1/8) |
| phone-camera | 7 | 6 | 8 (0/2/6) |
| sky-colours | 7 | 6 | 7 (0/3/4) |
| pressure-cooker | 7 | 7 | 8 (0/1/7) |
| **Total** | **94** | **83** | **123 (3/27/93)** |

All maths and unit conversions recompute correctly except **upi-path-12**: its feedback is wrong, and the answer is computed for a 30-day month when October has 31 days (details below).

## Fix before release (HIGH)

1. **upi-path-14 and misconception m3: P2P collect requests no longer exist.** NPCI/UPI/OC/220/2025-26 (29 July 2025): "by 1st October 2025 UPI P2P Collect shall not be allowed to be processed in UPI." A stranger can no longer send Rohan a collect request. Fix: rewrite the item as a QR-code or payment-link "refund" scam ("A stranger says he is refunding ₹2,000 and asks Rohan to scan a QR code and enter his PIN…"). The lesson stays the same: a PIN sends money out.
2. **upi-path `steps[2].teach`, item 14a feedback, item 15, rule, c4: "Money leaves your account only after you enter your UPI PIN" is no longer absolute.** NPCI/UPI/OC-226/2025-26 (7 Oct 2025): "UPI PIN for transaction authentication (except UPI Lite and mandate execution)", and "On-Device biometric authentication (fingerprint, face, etc) shall be introduced as an additional option in lieu of UPI PIN … initially … for transactions up to Rs. 5,000." Fix: "To pay, you approve on your own phone, usually with your UPI PIN (some apps let you use your fingerprint or face for small payments). Getting money never needs your PIN." Change "A PIN always approves money going out" to "Entering your PIN approves money going out."
3. **muscle-protein-rest rule, c1, `steps[1]`, item 13: ignores Indian national guidance.** ICMR-NIN *Dietary Guidelines for Indians 2024* (listed in `sources`, cited nowhere) p.58: "The recommended dietary allowance (RDA) for protein intake is 0.83g protein/kg/day for healthy men and women." For 55 kg that is ≈45.7 g, so Priya's 45 g roughly meets the Indian RDA. The ISSN 1.4–2.0 g/kg range is for exercising people, and the content should say so. Fix: frame 0.83 g/kg as the everyday baseline (NIN) and 1.4–2.0 g/kg as the range a sports body suggests for hard training (ISSN). Reword item 13a's feedback to "45 g meets the everyday RDA for her weight but sits below the 77–110 g range the ISSN suggests for athletes." Add the NIN caution on protein powders and on people with kidney disease.

## Main MED items (full list in each concept section)

- **upi-path-12:** option b's feedback says 16 million is "a thousand times too small". It is about 34× too small next to ~550 million a day. October has 31 days: 16.58 bn / 31 ≈ 535 million, still inside the 500–570 range. Fix the feedback to "about 30 times too small" and the example to "÷ 31 days".
- **heat-hydration:**
  - The content never warns against forcing down large amounts of plain water. CDC Yellow Book calls forced fluid "outdated and dangerous" because of hyponatremia.
  - Item 16's "Thirst still works" contradicts the Yellow Book: "Reliance on thirst alone is not sufficient".
  - A confused teammate should be treated as heat stroke: call an ambulance and give nothing to drink (CDC poster).
  - Step 3 should say when to get medical help: if vomiting, getting worse, or lasting over an hour.
  - The Indian emergency numbers 112 and 108 are suggested in the fixes but were **not verified** against a government page this session (112.gov.in reset the connection). Verify them before use.
- **warmup-myths:** "no clear injury effect" covers only all-cause and overuse injuries. Behm et al. still recommend stretching in a warm-up "for reducing muscle injuries". The 4.6%/1.1% figures measure performance in general, not power.
- **muscle-protein-rest:**
  - "Muscle keeps building for up to 48 h" overstates a fasted protein-synthesis measure: net muscle balance stays negative without food.
  - The `mps` journal is *Translational Sports Medicine*, not *Sports Medicine*.
- **sleep-recovery c3:** the review pooled sleep loss of up to a week, including whole nights without sleep, not "one night".
- **food-labels:**
  - Single-serve packs may show only per-pack values (Reg 5(3)(b)), so not every pack has a per-100 g column.
  - Ingredients are listed "by weight or volume" (Reg 5(2)(b)), not by weight only.
- **lift:**
  - NASA's equal-transit counter-example uses thin curved plates, not flat wings.
  - "Double speed gives 4× lift" needs "same wing tilt".
  - Item 9's dropped glider does get airflow once it falls.
  - **Safety:** item 14 and the step 2 hook have a hand out of a moving bus or train window. Swap in a card held in front of a fan.
- **flight-sensors:** items 10 and 16 say the gyroscope senses tilt. PX4: "a gyroscope for body rates, an accelerometer for attitude".
- **multirotor-turns:** two of the three sources are weak (an undergraduate report and a course lab page). Re-point m1, m2 and the quest to the Stanford paper or the PX4 docs.
- **phone-camera:** CMOS was not "first made at JPL". NASA credits JPL with "the first CMOS active pixel image sensor".
- **sky-colours:** `nasa-rayleigh` (a 1997 student page) and `nasa-light` (a lesson-plan reprint) are weak. The 400/700 nm figures and the cloud "about equally" claim are in no cited source. Stronger sources opened: NASA visible light (https://science.nasa.gov/ems/09_visiblelight/) and HyperPhysics blue sky.
- **pressure-cooker:** IS 2347:2006 has been superseded. The Quality Control Order requires IS 2347:2017, and the "Indian standard says" items (c6, c7, item 16) are not confirmed against the 2017 text. Item 13's school cooking club needs adult supervision.
- **showing-up:** the `who` source is SOURCE DEAD (reCAPTCHA). Re-cite the hook, quest and m1 to `who2020`.
- **ceiling-fans:** the `fan` DOE page only defines a ceiling fan. Cite `cooling` or `doe-guide` for "fans make no cold air". Change "only by drying sweat" to "mainly".
- **progressive-overload:** the weekly-jump rule rests on a jogging example for inactive people (guide p.89). Add the general p.33 line.

---

# Per-concept detail

## progressive-overload — Progressive overload

Sources opened:
- `acsm` → https://pubmed.ncbi.nlm.nih.gov/41843416/ → PubMed web page returned HTTP 203 with a cookie/bot interstitial (5.6 KB). Opened the same record via NCBI E-utilities efetch (HTTP 200, full abstract). Strong (ACSM position stand, overview of 137 systematic reviews, Med Sci Sports Exerc 2026;58(4):851-872). Metadata: title is missing the subtitle ": An Overview of Reviews"; year/publisher OK (journal is *Medicine & Science in Sports & Exercise*). Abstract only, so only abstract-level claims can be checked.
- `guide` → https://odphp.health.gov/sites/default/files/2019-09/Physical_Activity_Guidelines_2nd_edition.pdf → HTTP 200, PDF, pdftotext. Strong (US HHS). Metadata OK. Page numbers below are printed page numbers (PDF page = printed + 1).

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Resistance work builds strength; rising challenge supports progress | acsm | "Compared with no exercise (control), RT significantly improved muscle strength, size (hypertrophy), power…" and "Healthy adults should perform progressive RT … to improve muscle function, size, and physical performance." | SUPPORTED |
| c2 | Strength work asks muscles to do more than used to = overload | guide | p.60: "Muscle-strengthening activities make muscles do more work than they are accustomed to doing. That is, they overload the muscles." | SUPPORTED |
| c3 | Strength grows when weight or training days go up | guide | p.60: "Increases in the amount of weight or the days a week of exercising will result in stronger muscles." p.71: "gradual increases in the amount of weight, number of sets or repetitions, or the number of days a week of exercise will result in stronger muscles." | SUPPORTED |
| c3 | (same) | acsm | "voluntary strength was enhanced by lifting heavier loads (≥80% one-repetition maximum) … and ≥2 sessions/wk." | SUPPORTED |
| c4 | Size of each week's rise, relative to usual, linked to injury risk | guide | p.89: "Pay attention to the relative size of the increase in physical activity each week, as this is related to injury risk. For example, a 20-minute increase each week is safer for a person who already does 200 minutes a week of jogging (a 10% increase) than in a person who does 40 minutes a week (a 50% increase)." | SUPPORTED |

Also checked: rule "add weight, clean reps or training days" is backed by guide p.71 (weight, sets or repetitions, days). Item 11 body-weight claim backed by p.60: "doing calisthenics that use body weight for resistance (such as push-ups, pull-ups, and planks)". Item 11 option c feedback backed by p.33: "Push-ups primarily benefit the muscles of the chest, shoulders, and upper arms." Item 13 option c feedback ("heavier loads tend to help more") backed by acsm "≥80% one-repetition maximum".

### Numbers and maths
- item 12 → 8 kg to 9 kg = +12.5%; 20 kg = +150%. Both labels fair. OK.
- item 14 → 10 kg + 6 × 1 kg = 16 kg; answer 16, min 15.5, max 16.5 contains 16. "60 kg = 10 × 6" and "11 kg = one month" feedback correct. OK.
- item 15 → 30/60 = 50%, 30/300 = 10%. Correct option a. OK.
- steps[2].hook → 20/40 = 50%, 20/200 = 10%. Matches guide p.89 example. OK.
- steps[2].visual scale 0–50% → marks at 20 (10/50 = 20%) and 100 (50/50). Consistent. OK.
- steps[2].example → 10/100 = 10%. OK.
- steps[2].guided[0] → 55: 5/50 = 10%; 75: 25/50 = 50%; 100: 50/50 = 100%. OK.
- steps[0].example → 8 to 10 squats = +25% in one session. Not wrong, but bigger than the 10% "small step" the concept teaches later (see Problem 4). OK numerically.
- steps[1].guided[0] → water bottles (no number). OK.

### Problems
1. **[MED] c4, rule, steps[2], items 15, m2** — The only sourced injury-risk example is weekly **jogging minutes** for **inactive / low-activity people**, but the concept applies "keep each weekly jump small" to weights and reps as a universal rule. Source scope: p.89 "Here is general guidance for inactive people and those with low levels of physical activity on how to increase physical activity: … Pay attention to the relative size of the increase in physical activity each week". The general principle is stated more broadly on p.33: "Small, progressive changes in overload help the body adapt to the additional stresses while minimizing the risk of injury." — Fix: cite p.33 as well and keep the jogging example labelled as such. steps[2].teach: "Grow the work in small steps. The guide's example uses jogging: how big each weekly jump is, next to what you already do, is linked to injury risk."
2. **[LOW] item 10 (stem/feedback), m3, steps[0].guided[1]** — "Two months of the same work gives the body time to adapt, so it feels easier" / "When the same work starts to feel easier, the body has adapted to it." No source equates perceived ease with adaptation, and no source gives a timescale. Closest: p.33 "The body's structures and functions respond and adapt to these stresses." — Fix m3 correction: "When the same work starts to feel easier, that is often a sign the body has adapted." Item 10 option c feedback: "Two months of the same work gives the body time to adapt, so it likely feels easier."
3. **[LOW] m1** — "every visit need not be harder" — no source says this. p.71 "gradual increases" is the closest. — Fix: "A gradual rise can use clean reps, load or days; it does not have to mean more weight each session."
4. **[LOW] steps[0].example vs steps[2]** — Meera jumps 8 → 10 squats (25%) in one go while steps[2] teaches 10% as "a small step". Not wrong (2 reps is trivial) but a careful learner could see a contradiction. — Fix: "Meera usually does 8 squats … today she does 9 with the same good form" (12.5%), or leave and accept.
5. **[LOW] steps[2].guided[1] option a** — "When you do little, any jump is a big share" / "even a few extra minutes is a large rise." "any" overstates (5 min on 60 min is 8%). — Fix: "When you do little, even a small jump can be a big share."
6. **[LOW] acsm metadata** — title missing ": An Overview of Reviews"; publisher should read "Medicine & Science in Sports & Exercise (ACSM)". Fix the `title` field.
7. **[LOW] item 9 options b/c feedback** — definitions of warm-up and cool-down ("easy start before the main work", "easy end of a session") are not cited in this concept's sources. Common knowledge; acceptable, or add a guide page reference if the guide defines them.

### Safety / medical wording
- None dangerous. Optional: the guide (p.89) says inactive adults should "start with relatively moderate-intensity activity" and "Youth and young adults probably can safely increase activity by small amounts every week or two." Consider adding to steps[2].takeaway: "Keep each weekly jump small next to what you already do, and stop if a movement causes sharp pain." (The pain line is common-sense wording, not sourced.)

### Summary row
`| progressive-overload | 5 (4 claims, c3 double-sourced) | 5 | 7 (0/1/6) |`


## muscle-protein-rest — Muscle, protein and rest

Sources opened:
- `issn` → https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/ → HTTP 200, full text. Strong (ISSN position stand, Jäger et al., J Int Soc Sports Nutr 2017;14:20, PMID 28642676). Metadata OK.
- `acsm` → https://pubmed.ncbi.nlm.nih.gov/41843416/ → PubMed page HTTP 203 bot interstitial; opened via NCBI E-utilities efetch (HTTP 200). Strong. Cited only in hook, rule, m1 and quest, not in any claim. Title is missing ": An Overview of Reviews".
- `nin` → https://nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf → HTTP 200, PDF, pdftotext. Strong and the most relevant source for an Indian audience, **but it is listed in `sources` and cited nowhere**, and parts of it conflict with the concept (see Problem 1).
- `mps` → https://pubmed.ncbi.nlm.nih.gov/38716482/ → PubMed page HTTP 203 bot interstitial; opened via E-utilities efetch (HTTP 200). **Metadata wrong:** the journal is *Translational Sports Medicine* (2024:3184356, Hindawi/Wiley), not *Sports Medicine*. The full title adds ": A Systematic Review and Exploratory Meta-Analysis". Moderate strength: an "exploratory" meta-analysis, 237 participants, I² = 92%.
- Extra, opened for corroboration: Phillips et al. 1997, Am J Physiol, PMID 9252485 → E-utilities efetch HTTP 200.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | ISSN: ~1.4–2.0 g/kg/day for most exercising people | issn | Position statement pt 2: "an overall daily protein intake in the range of 1.4–2.0 g protein/kg body weight/day (g/kg/d) is sufficient for most exercising individuals" | SUPPORTED |
| c2 | Strength work and protein both switch on building; together more | issn | pt 1: "An acute exercise stimulus, particularly resistance exercise, and protein ingestion both stimulate muscle protein synthesis (MPS) and are synergistic when protein consumption occurs before or after resistance exercise." | SUPPORTED |
| c3 | 20–40 g protein per meal, every 3–4 h | issn | pt 5: "General recommendations are 0.25 g of a high-quality protein per kg of body weight, or an absolute dose of 20–40 g." pt 7: "These protein doses should ideally be evenly distributed, every 3–4 h, across the day." | SUPPORTED (ISSN says "per serving"; it also says "Recommendations … are mixed and are dependent upon age") |
| c4 | After one session, building can stay raised up to 48 h | mps | Conclusion: "A single bout of RE can sustain measurable increases in postabsorptive MPS soon after RE cessation and up to 48 h post-RE." | SUPPORTED for MPS. See Problem 2: MPS is not the same as net muscle building |

### Numbers and maths
- steps[1].hook → 60 × 1.4 = 84, 60 × 2.0 = 120. OK. 10 g and 600 g distractors are clearly wrong. OK.
- steps[1].visual scale 0–2.5 g → 1.4/2.5 = 56, 2.0/2.5 = 80. OK.
- steps[1].example → 50 × 1.4 = 70, 50 × 2.0 = 100. OK.
- steps[1].guided[0] → 70 × 1.4 = 98, 70 × 1.0 = 70, 70 × 2.0 = 140. OK.
- steps[1].guided[1] → 4 × 25 = 100 g/day, each 25 g within 20–40. 10 × 5 g below 20. 1 × 100 g above 40. OK.
- item 12 → value 30, min 20, max 40, unit "grams per meal". Contains 30. 5 g and 100 g correctly outside. OK.
- item 13 → 55 × 1.4 = 77, 55 × 2.0 = 110. 45 < 77. Maths OK, but see Problem 1: 45 g ≈ the ICMR-NIN RDA for 55 kg (55 × 0.83 = 45.65 g).
- steps[2].guided[0] → 6 pm + 48 h = 6 pm two days later. OK.
- item 16 → ">50 y" vs "<35 y" matches abstract ("older adults (>50 y …) compared to younger adults (<35 y …)"). OK.
- ISSN 0.25 g/kg per meal → 55 kg = 13.75 g, 70 kg = 17.5 g, below the 20 g floor taught. The app teaches only the 20–40 g absolute figure. Not wrong, but the per-kilo option is omitted.

### Problems
1. **[HIGH] rule, c1, steps[1] (teach, takeaway), item 13** — Indian national guidance conflicts with the framing, and the `nin` source is listed but never cited. ICMR-NIN DGI 2024 p.58: "The recommended dietary allowance (RDA) for protein intake is 0.83g protein/kg/day for healthy men and women." p.59: "protein intake levels greater than ~1.6g/kg/day do not contribute any further to RET-induced gains in muscle mass." p.59: "Most athletes can get the recommended amount of protein through food alone, without the use of supplements." Item 13 tells a 55 kg student that 45 g is "well under the low end". 45 g is the Indian RDA for her weight (55 × 0.83 = 45.65 g), so she meets national guidance for a healthy adult. The 2.0 g upper end also goes beyond NIN's ~1.6 g/kg plateau. — Fix: present both figures. steps[1].teach: "India's guideline (ICMR-NIN 2024) sets 0.83 g of protein per kilo a day for healthy adults. A sports nutrition society suggests 1.4 to 2.0 g per kilo for people building muscle, and NIN notes gains level off above about 1.6 g." Item 13 option a: "Under the sports range of about 77 to 110 grams, though close to India's general adult advice of about 46 grams." Feedback: "55 times 1.4 is 77, so 45 grams is under the sports range. It roughly meets the general adult figure (55 × 0.83 ≈ 46 g)." Add `nin` to sourceRefs.
2. **[MED] c4, rule, steps[2] (teach, example, guided, takeaway), items 15, m3** — "muscle building" is used for **muscle protein synthesis (MPS)**. The mps review measured **postabsorptive** (fasted) MPS, and in the fasted state net balance stays negative. Phillips 1997 (PMID 9252485): "Muscle net balance … rest = -0.0573 … 48 h = -0.0440 … and was significantly different from zero at all time points". ISSN: "MPS rates are lower in a fasted state and muscle protein balance is negative. Protein accretion only occurs in the fed state." So "Muscle keeps building for up to two days" (item 15 a) and "her muscles keep building through Tuesday" (steps[2].example) overstate the source. — Fix: use "muscle repair and building work" or "the body's muscle-building process". Item 15 option a: "The muscle-building process can stay switched on for up to two days after a session." steps[2].teach: "The body's muscle-building process stays switched on after a session, for up to two days. Meals in that time give it material, so rest days count."
3. **[MED] mps source metadata** — `publisher: "Systematic review and meta-analysis, Sports Medicine"` is wrong. PubMed: "Transl Sports Med. 2024 Apr 30;2024:3184356". Fix: `title: "Characterisation of the Muscle Protein Synthetic Response to Resistance Exercise in Healthy Adults: A Systematic Review and Exploratory Meta-Analysis"`, `publisher: "Translational Sports Medicine"`. It is exploratory with high heterogeneity (I² = 92%). Suggest adding Phillips 1997 as a stronger primary corroboration (URL https://pubmed.ncbi.nlm.nih.gov/9252485/; quote: "Exercise resulted in significant increases above rest in muscle FSR at all times: 3 h = 112%, 24 h = 65%, 48 h = 34%"). ISSN pt 8 also corroborates: "the anabolic effect of exercise is long-lasting (at least 24 h), but likely diminishes with increasing time post-exercise."
4. **[MED] item 14 (stem + option a), m2, steps[1].guided[1] option b feedback** — "A friend says eating a whole day's protein in one dinner works just as well. What is missing?" treats single-meal intake as clearly inferior. ISSN pt 7 says doses "should ideally be evenly distributed", and its own text notes the training-study evidence is limited: "The logical next step for researchers is to extend these findings into longitudinal training studies". — Fix item 14 option a feedback: "The stand suggests spreading 20 to 40 gram doses every 3 to 4 hours, though long-term studies are still limited." m2 correction: "The stand suggests spreading protein: 20 to 40 grams per meal, every 3 to 4 hours."
5. **[LOW] item 16 option a feedback** — "The review found age and the session's load both changed how big the rise was." Source hedges: "appears to be influenced by participants' age and/or the loading parameters", and load effects came from "Individual studies have reported…". Fix: "The review found a smaller rise in older adults and noted that the session's load seemed to matter too."
6. **[LOW] item 16 option c feedback** — "measured before any meal" is a garbled paraphrase of "postabsorptive". Fix: "The review looked at strength sessions themselves, done in people who had not eaten for some hours."
7. **[LOW] item 9 option c feedback, steps[0].example, steps[0].hook** — Indian foods (dal, curd, eggs, paneer, rajma) are named as protein sources with no citation. NIN supports this, p.59: "Pulses such as lentils, green gram … are all rich sources of proteins" and "Flesh foods, eggs and milk are good sources of quality proteins." Add `nin` to sourceRefs.
8. **[LOW] item 9 (match)** — The answer pairs are symmetric duplicates (a↔b, b↔a, c↔d, d↔c) and all four options have `correct: true`. Check that the match renderer expects this shape. Otherwise use left = {a, c} and right = {b, d}.
9. **[LOW] item 15 stem** — "why rest days are part of training": the mps review says nothing about rest days. Keep it as an inference and soften the stem to "Which line best explains why time after training matters?"

### Safety / medical wording
- **Protein amounts read as personal dietary advice** (rule, steps[1], item 13). NIN p.59: "Kidney damage, or worsening renal function with high protein intake, may occur in those who already have some renal disease; therefore high protein diets should be taken with care in such persons." Add to steps[1].teach or as a footer: "If you have kidney disease or another health condition, check with a doctor before raising protein. Educational, not medical advice."
- **Protein shakes** (item 10, steps[0].guided[0]) are shown neutrally. NIN p.58 guideline: "avoid protein supplements to build muscle mass", and p.60: "Protein powders are unnecessary for normal healthy life." Suggest adding a line in steps[0] (e.g. guided[0] option b feedback): "Food like dal, curd, eggs or paneer can cover protein for most people; India's guideline says powders are not needed."

### Summary row
`| muscle-protein-rest | 4 | 4 | 9 (1/3/5) |`


## sleep-recovery — Sleep and recovery

Sources opened:
- `sleep` → https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects → HTTP 200. Strong (NIH/NHLBI). Page reads "Last updated on June 15, 2022". Metadata OK.
- `sport` → https://pubmed.ncbi.nlm.nih.gov/39006249/ → PubMed page HTTP 203 bot interstitial. Opened the abstract via NCBI E-utilities efetch (HTTP 200) and the full text at https://pmc.ncbi.nlm.nih.gov/articles/PMC11246080/ (HTTP 200). Peer-reviewed meta-analysis of moderate strength: 27 studies, 369 participants, 360 of them male, aged 15–33. **Metadata:** the title is missing "Comprehensive" (full title: "…A Comprehensive Systematic Review and Meta-Analysis"). The publisher field "PubMed indexed peer-reviewed review" is vague; it should be "Nature and Science of Sleep (Dove Medical Press)". Year 2024 OK.
- `hours` → https://www.nhlbi.nih.gov/health/sleep/how-much-sleep → HTTP 200. Strong. Page reads "Last updated on March 24, 2022". Metadata OK.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Adults 7–9 h; sleep loss harms exercise output and hunger cues | hours, sleep, sport | hours: "Experts recommend that adults sleep between 7 and 9 hours a night." sleep: "When you don't get enough sleep, your level of ghrelin goes up and your level of leptin goes down. This makes you feel hungrier than when you're well-rested." sport: "Acute sleep deprivation significantly impairs the overall athletic performance of athletes" | SUPPORTED |
| c2 | Adults 7–9 h a night; teens 13–18: 8–10 h | hours | "Experts recommend that adults sleep between 7 and 9 hours a night." "Teens 13 to 18 years old should sleep 8 to 10 hours per day." | SUPPORTED |
| c3 | Review of athletes: **one night** of short sleep lowered performance; losing the last part of the night hurt most | sport | "The effect size of acute sleep deprivation on overall athletic performance was −0.56 (P<0.05) … −1.17 (P<0.05) for partial sleep deprivation at the end of the night". Full text, exclusion criteria: studies were excluded where "the sleep deprivation duration for athletes extends for 1 week or more" | PARTLY: "acute" means under one week, not specifically one night, and it includes whole nights with no sleep. The end-of-night part is SUPPORTED |
| c4 | Short sleep: ghrelin up, leptin down, hungrier | sleep | "When you don't get enough sleep, your level of ghrelin goes up and your level of leptin goes down. This makes you feel hungrier than when you're well-rested." | SUPPORTED |

Also checked: item 13 order matches the abstract: "high intensity intermittent exercise, skill control, speed, aerobic endurance, and explosive power indicators were -1.57, -1.06, -0.67, -0.54, and -0.39". Item 14 matches: "overall athletic performance in the morning and afternoon were -0.30, and -1.11". steps[1] visual "Late to bed … No clear drop found" matches "-0.25 (P>0.05) for partial sleep deprivation in the beginning of the night". Item 11 "sleep helps the body recover" is backed by the sleep page: "Deep sleep triggers the body to release the hormone that promotes normal growth … This hormone also boosts muscle mass and helps repair cells and tissues in children, teens, and adults."

### Numbers and maths
- item 9 → 7 − 6 = 1 h. answer 1, min 0.5, max 1.5 contains 1. "3 more = 9" is correct. OK.
- item 10 → teens 8–10 matches source ("per day"). OK.
- item 13 → −1.57 > −0.67 > −0.39 in magnitude, so a, b, c order is correct. Feedback b ("less than stop-start but more than explosive") is correct. OK.
- item 14 → PM −1.11 vs AM −0.30, so the afternoon drop is bigger. OK.
- steps[0].visual scale 0–12 h → 7/12 = 58.3 (58), 9/12 = 75, 10/12 = 83.3 (83). OK.
- steps[0].guided[0] → 7 < 8, so below the teen range. OK.
- steps[0].guided[1] → 1 am to 7 am = 6 h, 1 short of 7. OK.
- steps[0].example → 5 h < 7. OK.
- item 16 → 5 h < 7. OK.
- item 12, steps[1].example → 4 am wake = end-of-night loss (PSDE, d = −1.17). OK.

### Problems
1. **[MED] c3, steps[1].hook option a feedback, steps[1].guided[1] (option a feedback, option b feedback), item 12 option c feedback, item 14 option c feedback, m3** — The content repeatedly says the review studied "one night" or "a single night". The review pooled **acute** sleep loss protocols. Inclusion: "at least one acute sleep deprivation protocol, such as overnight sleep deprivation (SD), partial sleep deprivation at the beginning of the night (PSDB), and partial sleep deprivation at the end of the night (PSDE)". Exclusion covered only protocols lasting "1 week or more". So "The review looked at a single night of short sleep and still found a drop" is not accurate. — Fix c3: "In a review of athletes, short-term sleep loss (from one night up to a few nights) lowered sports performance. Losing the last part of the night hurt most." Item 12 option c / steps[1].guided[1] option b feedback: "The review looked at short-term sleep loss, often a single night, and still found a drop." m3: "In a review of athletes, short-term sleep loss tended to lower sports performance."
2. **[LOW] sport metadata** — the title is missing "Comprehensive" and the publisher is vague. Fix: `title: "Effects of Acute Sleep Deprivation on Sporting Performance in Athletes: A Comprehensive Systematic Review and Meta-Analysis"`, `publisher: "Nature and Science of Sleep"`.
3. **[LOW] steps[1].guided[1] option c feedback / item 13** — the "whole night with no sleep" subgroup was smaller (d = −0.23) than the end-of-night subgroup (d = −1.17). The content never claims otherwise, but item 13's order mixes all protocol types. Fine as is. Optionally add a scope note: "Most people in the review were young male athletes" (full text: "369 participants (360 male athletes and 9 female athletes)").
4. **[LOW] item 14 option a feedback** — the morning/afternoon split compares subgroups across studies, and the authors flag thin data ("Some subgroups … have limited data"). "Likely" in the stem is OK. Feedback could say "tended to be bigger".
5. **[LOW] item 16 option a feedback, steps[2].example feedback** — "Her short sleep is pushing ghrelin up and leptin down" states the mechanism as certain for one person. NHLBI speaks generally ("When you don't get enough sleep…"). Fix: "Short sleep tends to push ghrelin up and leptin down, so more sleep goes after a likely cause."
6. **[LOW] rule** — "The size of the effect differs between people." No cited source says this about individuals. The review reports variation between protocols, abilities and time of day. Fix: "The size of the effect varies, for example with when in the night sleep is lost."
7. **[LOW] steps[0].teach** — "Sleep is part of training, not a break from it." This is framing with no source. Acceptable as coach copy, or soften to "Sleep is part of recovery from training."

### Safety / medical wording
- None dangerous. item 16 option b ("Skipping lunch to make up for snacks") is correctly marked wrong. Optional: soften its feedback to avoid any food-restriction cue: "Skipping meals does not fix the cause and can leave you hungrier. Sleep is the lever here." (The "hungrier" part is common sense, not sourced.)
- Teen sleep figures are fine. The audience is adults, so items aimed at teens (16-year-old) are acceptable.

### Summary row
`| sleep-recovery | 4 | 3 | 7 (0/1/6) |`


## heat-hydration — Heat and hydration
Sources opened:
- heat → https://www.cdc.gov/heat-health/risk-factors/heat-and-athletes.html → curl 403 (Akamai "Access Denied"); opened 200 with headless Chromium → strong (CDC). Page dated June 25, 2024; metadata OK.
- signs → https://www.cdc.gov/extreme-heat/media/pdf/Heat_Related_Illness.pdf → curl 403; downloaded via Chromium download event, pdftotext → strong (CDC consumer poster, CS280226). PDF CreationDate 21 Jul 2017; title "Heat Related Illnesses"; metadata OK.
- cdc-heat-rate → https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/heat-and-cold-illness-in-travelers.html → curl 403; Chromium 200 → strong (CDC Yellow Book 2026 ed., Backer & Freer, dated Apr 23, 2025); metadata OK.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Hot exercise raises heat risk and fluid loss; dizzy/sick/headachy = warning | heat; signs | heat: "People who exercise on hot days are more likely to become dehydrated and get heat-related illness." signs (Heat exhaustion list): "• Nausea or vomiting … • Dizziness • Headache" | SUPPORTED |
| c2 | CDC: train early/late, start slow, drink more than usual | heat | "Schedule workouts and practices earlier or later in the day when the temperature is cooler." "Pace activity. Start activities slow and pick up the pace gradually." "Drink more water than usual, and don't wait until you're thirsty to drink more." | SUPPORTED |
| c3 | Sweat can reach about 1 L/h, taking fluid and salt | cdc-heat-rate | "Sweat is a fluid containing sodium and chloride. … sweat rates may reach 1 liter per hour, resulting in substantial fluid and sodium loss." | SUPPORTED |
| c4 | Daily heat exercise: most changes within ~10 days | cdc-heat-rate | "Full acclimatization, especially cardiovascular, requires 1–2 hours of exercise in the heat each day. With a suitable amount of daily exercise, most acclimatization changes occur within 10 days." | SUPPORTED |
| c5 | Dizziness, nausea, headache, cramps, faint = warning; stop and get cool | signs; heat | heat: "If you feel faint or weak, STOP all activity and get to a cool place." "Muscle cramping may be an early sign of heat-related illness." signs (Heat cramps): "Stop physical activity and move to a cool place"; (Heat exhaustion: dizziness, headache, nausea): "Move to a cool place" | SUPPORTED (the literal "STOP" is for faint/weak and cramps; for dizziness/nausea/headache the poster says "Move to a cool place", which implies stopping) |

### Numbers and maths
- rule / c3 / s2 teach / s2 hook → 1 L per hour → source "may reach 1 liter per hour" (a top rate) → OK for "can reach"/"up to"; rule's "about 1 litre an hour" reads as typical → PROBLEM (LOW, see 5).
- item heat-hydration-10 → 10 days, min 8 max 12 → source "within 10 days" → OK; distractors 1 day / 100 days clearly wrong → OK.
- item heat-hydration-12 → 90 min × 1 L/h = 1.5 L → OK; 150 ml = 1/10 of that → "far too low" OK; 9 L = 6 × 1.5 → "six times too much" OK.
- s2 example → 2 h × 1 L/h = up to 2 L → OK. s2 guided[1] option b feedback "up to 2 litres" → OK.
- s2 hook option c → 10 L "far too much" → OK.
- s2 visual scale 0–2 L, mark at 50% = 1 L → OK.
- s1 example "6 am" in Chennai summer → cooler hours → OK (no number claim).
- Hook/item 9 "7 am vs 1 pm" → source: "middle of the day when the sun is hottest" → OK.

### Problems
1. **[MED] rule, s1 guided[1], s2 guided[1], item heat-hydration-12, item heat-hydration-16, m2** — Hydration is taught only as "drink more / don't wait for thirst / replace up to 1–2 L". Nothing warns against forcing large volumes of plain water, and nothing mentions salt replacement. The cited Yellow Book says forcing fluid is dangerous. Quotes (cdc-heat-rate): "Excessive water ingestion is also a major contributor to exercise-associated hyponatremia; the recommendation to force fluid intake during prolonged exercise and the attitude that \"you can't drink too much\" is outdated and dangerous." "Reliance on thirst alone is not sufficient to prevent mild dehydration, but forcing a person who is not thirsty to drink water increases the risk of hyponatremia." "A person exercising for many hours in the heat should replace salt by eating salty snacks or by lightly salting mealtime food or fluids." Fix: s2 teach → "In hot weather, sweat can reach about 1 litre an hour, and it takes salt with it. Sip water through the session, but don't force down big amounts. On long, sweaty days, get some salt from food or an ORS drink." Add to s1 guided[1] option a feedback: "…Sip regularly; don't force down large amounts at once." Item 12 option a feedback: "At up to about 1 litre an hour, 90 minutes can mean up to about 1.5 litres. Sip through the run and eat something salty after; don't gulp it all back at once."
2. **[MED] item heat-hydration-16 option c feedback** — "Thirst still works." Not in any source, and the Yellow Book says the opposite: "Reliance on thirst alone is not sufficient to prevent mild dehydration". Fix: "Thirst can lag behind sweat in the heat. CDC advises drinking more than usual and not waiting until you feel thirsty."
3. **[MED] s3 guided[1] option a (confused teammate)** — "Get help right away and move them somewhere cool." The CDC poster lists confusion under heat stroke: "Call 911 right away-heat stroke is a medical emergency", "Move the person to a cooler place", "Do not give the person anything to drink". "Get help" is too vague for a medical emergency. Fix option a: "Call an ambulance now and move them somewhere cool." Feedback: "Yes. Confusion in the heat can mean heat stroke, an emergency. Call for an ambulance, move them somewhere cool, cool them with wet cloths, and don't make them drink." (Use India's emergency number, 112 or 108. I did not verify these numbers this session, so check them before shipping.)
4. **[MED] s3 teach, m1/m3 corrections, takeaway** — Says stop, get cool and "tell someone", but never says when to get medical help. Sources: heat "Seek medical care immediately if you or a teammate has symptoms of heat-related illness."; signs: "Get medical help right away if: • You are throwing up • Your symptoms get worse • Your symptoms last longer than 1 hour". Fix s3 teach: "Dizziness, nausea, headache, cramps or feeling faint in the heat are warning signs. Stop, get somewhere cool and sip water. If you throw up, feel worse, or it lasts over an hour, get medical help now. Confusion or passing out means call an ambulance."
5. **[LOW] rule** — "sweat can take about 1 litre an hour" turns the source's ceiling ("may reach 1 liter per hour") into a typical rate. Fix: "sweat can reach about 1 litre an hour".
6. **[LOW] hook, s1 teach ("Heat makes the same work harder"), s1 visual "More strain"** — These cite `heat`, which does not say this. The closest support is in cdc-heat-rate: "Dehydration reduces exercise performance, decreases time to exhaustion, and increases internal heat load. Temperature and heart rate increase in direct proportion to the level of dehydration." Fix: add `cdc-heat-rate` to hookSourceRefs and s1 sourceRefs, or soften to "Heat and lost fluid push your heart rate and body temperature up."
7. **[LOW] item heat-hydration-10 feedback** — The 10-day figure omits the source's conditions ("requires 1–2 hours of exercise in the heat each day") and its caution ("limit exercise intensity and duration during their first week"). Fix option a feedback: "CDC notes most changes come within about 10 days of daily exercise in the heat. Keep the first week shorter and easier."
8. **[LOW] s1 guided[0] option b feedback "Dark, tight layers hold heat in"; item 13 option b "Heat does not destroy salt"** — Neither is in a cited source, though both are uncontroversial. Fix option b feedback: "CDC advises loose, lightweight, light-coloured clothing instead."

### Safety / medical wording
- See problems 1–4: hyponatremia caution, the thirst statement, calling emergency help for confusion (and not giving drinks), and when to get medical help. All are MED and should be fixed before release.
- Optional addition (Yellow Book): "Many chronic illnesses limit tolerance to heat … most importantly, cardiovascular disease, diabetes, renal disease, certain medications". Suggested line in s1 teach or quest detail: "If you have a heart, kidney or sugar condition or take regular medicine, ask your doctor about hot-day exercise."
- The heat-cramp definition differs between the sources (poster: during exercise; Yellow Book: "begin ≥1 hours after stopping exercise"). The content follows the poster, which is fine.

### Summary row
`| heat-hydration | 5 | 5 | 8 (0/4/4) |`


## warmup-myths — Warm-up and injury myths
Sources opened:
- guide → https://www.cdc.gov/physical-activity/media/pdfs/Physical_Activity_Guidelines_2nd_edition.pdf → curl 403 (Akamai); downloaded via headless Chromium download event (PDF 1.6, title "Physical Activity Guidelines for Americans, 2nd edition", author HHS), pdftotext → strong; metadata OK. The warm-up text is in Chapter 4, p. 61.
- review → https://pubmed.ncbi.nlm.nih.gov/26642915/ → curl 203 bot-check, Chromium 403. Opened the same PubMed record through NCBI E-utilities efetch (db=pubmed&id=26642915, HTTP 200) → strong (systematic review, Appl Physiol Nutr Metab 2016;41(1):1-11, doi 10.1139/apnm-2015-0235, Behm, Blazevich, Kay, McHugh). PMID matches. The title in the JSON drops the ending ": a systematic review" (minor).

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Gradual warm-up raises HR and breathing; long static holds can slightly reduce later power | guide; review | guide p.61: "A warm-up before moderate- or vigorous-intensity aerobic activity allows a gradual increase in heart rate and breathing at the start of the episode of activity." review: "greater performance deficits with ≥60 s (-4.6%) than with <60 s (-1.1%) SS per muscle group" | SUPPORTED (review says "performance", not "power") |
| c2 | Warm-up = same activity at slower speed or lighter load | guide | p.61: "Commonly, the warm-up and cool-down involve doing an activity at a slower speed or lower intensity. … (for example, walking briskly as a warm-up before jogging). A warm-up for muscle-strengthening activity commonly involves doing exercises with lighter weight." | PARTLY: the guide says "commonly" and "an activity", not "the same activity", and its own example is a different activity (walk before jog) |
| c3 | Holds ≥60 s cut later power ~4.6%, vs ~1.1% for shorter | review | "A dose-response relationship illustrated greater performance deficits with ≥60 s (-4.6%) than with <60 s (-1.1%) SS per muscle group." "Testing was performed on average 3-5 min after stretching, and most studies did not include poststretching dynamic activities" | PARTLY: the figures are for "performance" (all test types), not power; they are "per muscle group"; and they come from testing 3–5 min after with no active moves |
| c4 | Static stretching: no clear effect on injuries; range gains usually <30 min | review | "SS and PNF stretching had no clear effect on all-cause or overuse injuries" "All forms of training induced ROM improvements, typically lasting <30 min." BUT also: "stretching within a warm-up that includes additional poststretching dynamic activity is recommended for reducing muscle injuries and increasing joint ROM" | PARTLY: the range part is supported. The injury part drops "all-cause or overuse" and leaves out the authors' recommendation to stretch for reducing muscle injuries |

### Numbers and maths
- c3 / item warmup-myths-13 → 4.6%, min 4 max 5 → abstract −4.6% → OK. Distractors 46% (10×) and 0.46% (÷10) → correctly called "ten times too big/small" → OK.
- item warmup-myths-14, s2 visual → 1.1% vs 4.6% → matches abstract → OK.
- s2 guided[0] → 4.6% × 50 cm = 2.3 cm → "about 2 cm" OK; 20 cm / 50 cm = 40% → OK. (Applying a pooled "performance" figure to jump height is an approximation. Acceptable, because jump tests are among the measures.)
- s2 guided[1] → 45 s < 60 s → smaller-drop group → OK. s2 example 90 s ≥ 60 s → OK. s2 hook two minutes = 120 s ≥ 60 s → OK.
- c4 / item 16 / s3 → <30 min → OK. s3 example 40 min > 30 → "back to usual" consistent → OK. s3 guided[0] 60 min later → "most has likely faded" → OK. s3 visual scale 0–60 min, mark at 50% = 30 min → OK.
- item 12 "5 minutes of jogs and drills" → the abstract gives no duration, but "when these activities were included, no clear performance effect was observed" → OK (5 min is just scenario detail).
- item 11 order (brisk walk, easy jog, hard run, slow walk) → consistent with guide p.61 → OK.

### Problems
1. **[MED] c4, rule ("stretching showed no clear injury effect"), s3 title "Stretching is no proven injury shield", s3 hook option a feedback, s3 teach, item warmup-myths-15 option a, s3 guided[1] option b, takeaway** — These overgeneralise. The review found no clear effect on "all-cause or overuse injuries", and its conclusion still recommends stretching inside a warm-up "for reducing muscle injuries". Learners could read the current text as "stretching is pointless for injuries". Quote: "SS and PNF stretching had no clear effect on all-cause or overuse injuries; no data are available for DS. … stretching within a warm-up that includes additional poststretching dynamic activity is recommended for reducing muscle injuries and increasing joint ROM". Fixes: rule → "…Long still holds just before power work can dull it a little. Stretching showed no clear effect on overall injury rates, so it is no guarantee." s3 teach → "Stretching helps you move further, but the gain often fades within 30 minutes. A big review found no clear effect on overall injury rates. Its authors still suggest stretching inside a warm-up that ends with active moves." Item 15 option a → "A big review found no clear effect on overall injuries." s3 title → "Stretching is no injury guarantee".
2. **[LOW] c1, c3, item warmup-myths-13 stem, item 14 option a feedback, s2 hook feedback, s2 visual "less power", s2 takeaway** — Says "power". The source figures are for "performance" across tests, measured 3–5 min after stretching. Fix c3: "In a review, holding a stretch for 60 seconds or more per muscle cut performance in tests a few minutes later by about 4.6%, against about 1.1% for shorter holds." In items, "power" → "performance" or "jump and sprint results".
3. **[LOW] c2, m2 correction, s1 teach, hook, item warmup-myths-10 option a feedback** — "The same move" and "The guide says a warm-up for strength work often uses the same lifts with less weight" go beyond the guide, which says "commonly … doing an activity at a slower speed or lower intensity" and "commonly involves doing exercises with lighter weight" (no "same lifts"). Fix item 10 feedback: "The guide says a warm-up for strength work commonly uses exercises with lighter weight." Fix c2/teach: "A warm-up is usually an easier version of the activity: slower or lighter."
4. **[LOW] s3 guided[1] stem "What does stretching give for sure, per the review?"** — "For sure" is stronger than the source ("typically lasting <30 min", short-term). Fix: "What does stretching most clearly give, per the review?"
5. **[LOW] item warmup-myths-16 option c feedback "It lasts longer than that"** — The abstract gives only an upper bound ("typically lasting <30 min"), so no source says the gain lasts more than 30 s. Fix: replace the distractor with "About 3 hours." and feedback "Much shorter. Range gains usually fade within 30 minutes."
6. **[LOW] item warmup-myths-9 option c feedback "A still hold does not raise heart rate"; s1 hook option c** — Not in a cited source, but physiologically uncontroversial. Optional fix: "A still hold is not the gradual, easy movement the guide describes as a warm-up."

### Safety / medical wording
- None found that risks injury directly. Problem 1 matters for safety framing: without the fix, "no injury effect" can read as "warm-ups and stretching don't matter". The review recommends stretching within a dynamic warm-up.

### Summary row
`| warmup-myths | 4 | 1 | 6 (0/1/5) |`


## cardio-talk-test — Cardio zones and talk test
Sources opened:
- cdc → https://www.cdc.gov/physical-activity-basics/measuring/ → curl 403 (Akamai); Chromium 200 → strong (CDC, page dated Dec. 4, 2025); metadata OK (year 2025).
- guide → https://odphp.health.gov/sites/default/files/2019-09/Physical_Activity_Guidelines_2nd_edition.pdf → curl 200 (PDF), pdftotext → strong (HHS 2018); metadata OK. The relevant text is in Chapter 4, pp. 57–59.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Talk not sing = moderate; few words = vigorous | cdc | "Talk Test. As a rule of thumb, a person doing moderate-intensity aerobic activity can talk, but not sing, during the activity. A person doing vigorous-intensity activity cannot say more than a few words without pausing for a breath." | SUPPORTED |
| c2 | 0–10 scale, sitting 0; moderate 5–6; vigorous starts 7–8 | guide | "Relative intensity can be estimated using a scale of 0 to 10, where sitting is 0 and the highest level of effort possible is 10. Moderate-intensity activity is a 5 or 6. Vigorous-intensity activity begins at a level of 7 or 8." (p.58) | SUPPORTED |
| c3 | Less fit people need more effort for same activity | guide | "Less fit people generally require a higher level of effort than more fit people to do the same activity." (p.58) | SUPPORTED |
| c4 | 1 vigorous min ≈ 2 moderate min | guide | "A general rule of thumb is that 2 minutes of moderate-intensity activity counts the same as 1 minute of vigorous-intensity activity. For example, 30 minutes of moderate-intensity activity is roughly the same as 15 minutes of vigorous-intensity activity." | SUPPORTED |

### Numbers and maths
- c2 / s2 hook / s2 teach / item 12 → moderate 5–6, vigorous ≥7–8 → matches → OK. Item 12 answer 7.5, min 7 max 8 → OK; distractors 3 (below moderate) and 10 (max) → OK.
- s2 visual marks at 55% and 75% of a 0–10 scale → 5.5 and 7.5 → OK.
- s2 example: walk 4, football 8, stretch 2 → 8 ≥ 7–8 → vigorous → OK. s2 guided: 6 → moderate OK; 3 → below moderate OK.
- s3 hook: 30 min moderate ≈ 15 min vigorous → exact guide example → OK; 60 and 30 min distractors → OK.
- s3 example: 10 vigorous × 2 = 20 moderate → OK. s3 guided[0]: 60 / 2 = 30 → OK; 120 is doubling → OK.
- item 15: 20 vigorous × 2 = 40 moderate → OK; 20 brisk = 20 moderate (half of 40) → OK.
- item 16: 150 / 2 = 75 → OK. The guide says "75 minutes (1 hour and 15 minutes) to 150 minutes (2 hours and 30 minutes) a week of vigorous-intensity" → feedback OK; 300 (doubling) and 150 → OK.
- item 13: ratings 4 vs 7 for the same hill → explained by c3 → OK.

### Problems
1. **[LOW] item cardio-talk-test-15 option a ("Run hard for the 20 minutes"), s3 guided[0] (30 min hard running)** — The app's audience is beginners, and these present hard running as the default fix with no build-up caveat. Guide p.59: "Older or less fit adults may find that activities in Table 4-1 labeled as moderate intensity are experienced as vigorous intensity. These adults will gain health benefits from starting with activities that would be considered light intensity and, as they are able, to gradually build up to moderate- or vigorous-intensity activities." Fix item 15 option a feedback: "At 2 moderate minutes for each vigorous one, 20 hard minutes count like 40, once he is used to running. New to it? Build up first."
2. **[LOW] item cardio-talk-test-10 option c feedback** — "Easy talk means moderate" contradicts the talk test, where easy chat or singing means lighter effort. Fix: "Vigorous effort leaves breath for just a few words. Talking, but not singing, means moderate."
3. **[LOW] s1 guided[0] (Om jogging, full sentences → "Moderate")** — This is right under relative intensity, but the cited CDC page lists "Jogging or running" as vigorous, so learners may be confused. Fix the feedback: "Yes. For Om, at his fitness, full sentences without singing point to moderate effort. The talk test reads your effort, not the activity's name."

### Safety / medical wording
- None found beyond problem 1 (the beginner build-up caveat).

### Summary row
`| cardio-talk-test | 4 | 4 | 3 (0/0/3) |`


## showing-up — Habit of showing up

Sources opened:
- who → https://www.ncbi.nlm.nih.gov/books/NBK566046/ → curl HTTP 200 but body is a Google reCAPTCHA challenge page ("Checking your browser - reCAPTCHA"); headless Chromium (15 s wait) got the same challenge (status 200, 131 chars). Content not reachable → **SOURCE DEAD (bot-blocked)**. Metadata (WHO 2020 guideline on NCBI Bookshelf) looks plausible but could not be confirmed. As a check I opened the WHO physical-activity fact sheet https://www.who.int/news-room/fact-sheets/detail/physical-activity (HTTP 200), which carries the same messages.
- who2020 → https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/ → curl got reCAPTCHA; headless Chromium HTTP 200, full text (78 k chars), title "World Health Organization 2020 guidelines on physical activity and sedentary behaviour - PMC". Strong (peer-reviewed BJSM summary of the WHO guideline). Metadata OK.
- guide → https://odphp.health.gov/sites/default/files/2019-09/Physical_Activity_Guidelines_2nd_edition.pdf → HTTP 200, application/pdf 15.4 MB, pdftotext OK. Strong (US HHS official guideline). Metadata OK (2nd ed., 2018). Page numbers below are the printed page numbers.
- acsm → https://pubmed.ncbi.nlm.nih.gov/41843416/ → checked via NCBI E-utilities esummary: "American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews", Med Sci Sports Exerc 2026 Apr 1, Currier BS. Metadata OK. **Not cited anywhere** in claims/items/steps (unused source).

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| showing-up-c1 | Some activity better than none; adult muscle work 2+ days | who2020 (who dead) | Results: "For all populations, doing some physical activity is better than doing none." Adults box: "Adults should also do muscle-strengthening activities at moderate or greater intensity that involve all major muscle groups on 2 or more days a week, as these provide additional health benefits." | SUPPORTED (who2020 only; `who` dead) |
| showing-up-c2 | Bouts of any length count; 10-min rule dropped; stairs count | guide p.23; guide p.6; who2020 | guide p.23: "Bouts, or episodes, of moderate-to-vigorous physical activity of any duration may be included in the daily accumulated total volume of physical activity. ... Even a brief episode of physical activity like climbing up a few flights of stairs counts." p.6: "Elimination of the requirement for physical activity of adults to occur in bouts of at least 10 minutes". who2020: "MVPA bouts of any duration now count towards these recommendations ... This recommendation differs from the requirement of bouts of at least 10 min in the previous WHO 2010 guidelines." | SUPPORTED (note: sources say *moderate-to-vigorous* bouts; see Problem 3) |
| showing-up-c3 | 150–300 moderate min/week, best spread out | who2020; guide p.8 | who2020: "Adults should do at least 150–300 min of moderate-intensity aerobic physical activity ... throughout the week". guide p.8: "at least 150 minutes (2 hours and 30 minutes) to 300 minutes (5 hours) a week of moderate-intensity ... Preferably, aerobic activity should be spread throughout the week." | SUPPORTED |
| showing-up-c4 | Start small, raise frequency/intensity/duration slowly | who2020 | "Individuals should start with small amounts of physical activity and gradually increase frequency, intensity and duration over time." | SUPPORTED |

Other item-level quotes used:
- item 12: guide p.8 "Adults should move more and sit less throughout the day. Some physical activity is better than none. Adults who sit less and do any amount of moderate-to-vigorous physical activity gain some health benefits." who2020: "Replacing sedentary time with physical activity of any intensity (including light intensity) provides health benefits".
- item 15: guide p.89: "First, increase the number of minutes per session (duration) and the number of days a week (frequency) of moderate-intensity activity. Later, if desired, increase the intensity." p.62: "The initial amount of activity should be at a light or moderate intensity, for short periods of time, with the sessions spread throughout the week."
- item 16: guide p.90: "Slower rates of increase over time may reduce injury risk. This guidance applies particularly to adults with overweight or obesity". p.23: "The risk of injury to bones, muscles, and joints is directly related to the gap between a person's usual level of activity and a new level of activity."
- item 14 "30 minutes on 5 days": guide p.64 (Madison): "Walking provides at least 30 minutes of moderate-intensity activity each day (150 minutes a week)."

### Numbers and maths
- rule / c3 / s2 → 150–300 min/week → matches who2020 & guide → OK.
- rule / c1 / s2 guided 2 → muscle work "2 days" / "2 or more days" → sources "2 or more days" → OK (rule says "on 2 days"; see Problem 5).
- item showing-up-13 → 300/6 = 50 → OK; option b 30×6 = 180 → OK; answer 50, min 48, max 52 contains 50 → OK.
- item showing-up-9 → three 5-min walks = 15 min → OK (no arithmetic claim).
- s2 hook → 1,500 = 10 × 150 → OK; 15 "far under" → OK.
- s2 visual scale 0–400: mark at 37.5 → 150/400 = 37.5 % → OK; 75 → 300/400 = 75 % → OK.
- s2 example → 30 × 5 = 150 → OK.
- s2 guided 1 → 25 × 6 = 150 → OK; distractor 31 = 25 + 6 → OK.
- item showing-up-14 → 30 × 5 = 150 → OK.
- s3 example → 10-min walk start → consistent with guide p.62 example (5 → 10 min sessions) → OK.

### Problems
1. **[MED] sources.who; hook, quest, misconception showing-up-m1 (sole source); c1, item 10, item 11 (co-source)** — The NCBI Bookshelf link is bot-blocked (reCAPTCHA via curl and Chromium), so the hook, quest and m1 rest on a source that cannot be verified. — Fix: cite `who2020` instead (opened, contains the same messages) or replace the URL with the WHO fact sheet https://www.who.int/news-room/fact-sheets/detail/physical-activity, which says: "The guidelines highlight that any amount of physical activity is better than none; all physical activity counts; all age groups should limit the amount of time being sedentary; and muscle strengthening benefits everyone."
2. **[LOW] misconception showing-up-m1 correction** — "Weekly work helps when it keeps coming back." is vague and no opened source says it. — Fix: "A short session still counts. Some activity is better than none." (who2020: "For all populations, doing some physical activity is better than doing none.")
3. **[LOW] rule, c2, steps[0].teach, item showing-up-9 (stem + option a), steps[0].takeaway** — "Bouts of any length count" drops the intensity qualifier; both sources say *moderate-to-vigorous* bouts ("MVPA bouts of any duration now count"). Item 9's stem says only "5-minute walks" (not brisk), so an easy stroll would not strictly count toward the 150-minute target. — Fix item 9 stem: "...can only fit three brisk 5-minute walks."; rule: "Some activity is better than none, and brisk bouts of any length count."
4. **[LOW] item showing-up-12 option a feedback** — "any amount of activity brings some benefit" is broader than guide p.8 ("any amount of moderate-to-vigorous physical activity"). who2020 does say light activity replacing sitting helps. — Fix: "The guide says adults should move more and sit less. Swapping sitting for any activity, even light, brings some benefit." (matches who2020 "Replacing sedentary time with physical activity of any intensity (including light intensity) provides health benefits").
5. **[LOW] rule** — "muscle work on 2 days" understates "2 or more days". — Fix: "plus muscle work on 2 or more days".
6. **[LOW] item showing-up-14 option a feedback** — "The guide says to spread it out over the week, like 30 minutes on 5 days." The guide says "Preferably, aerobic activity should be spread throughout the week"; the 30-min × 5 split is an example, not the guide's wording. — Fix: "The guide says to spread it through the week. For example, 30 minutes on 5 days makes 150."
7. **[LOW] steps[2].teach** — "Add a bit more time, more days, or a bit more effort" lists effort as an equal choice, while item 15 (correctly) teaches time and days first (guide p.89 "First, increase ... duration and ... frequency ... Later, if desired, increase the intensity."). — Fix: "Start small, then build up slowly. Add a bit more time or more days first; add effort later."
8. **[LOW] sources.acsm** — listed but never cited; remove or use.

### Safety / medical wording
- None harmful. Optional: add to steps[2] (start-small step) the who2020 line on new symptoms: "If anything new or worrying shows up as you build up, check with a doctor." (who2020: "Those who develop new symptoms when increasing their levels of activity should consult a healthcare provider.")

### Summary row
`| showing-up | 4 | 4 | 8 (H0/M1/L7) |`


## food-labels — Food labels in India

Sources opened:
- fssai → https://www.fssai.gov.in/upload/uploadfiles/files/Comp_Labelling%20Display_Version%20VII_03042025.pdf → HTTP 200, application/pdf, 1,359,094 bytes, 38 pages; pdftotext OK. (The default curl failed because the site's root, "emSign Root CA - G1", is not in the container trust store; downloaded with TLS verification against the Mozilla CA bundle from curl.se, which contains that root. Verification was not disabled.) Strong (primary regulator text). Metadata OK: title "Food Safety and Standards (Labelling and Display) Regulations, 2020", footer "Version-VII (03.04.2025)", so year 2025 is right. Page numbers below are the footer page numbers.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| food-labels-c1 | Serve size listed; protein and sugars given per set amount (100 g or one pack) | fssai Reg 5(3)(b), p.10–11 | p.10: "(b) Nutritional Information per 100g or 100ml or per single consumption pack of the product and per serve percentage (%) contribution to Recommended Dietary Allowance ... shall be given on the label containing the following: ... (A) Protein (g); (B) Carbohydrate (g) and Total Sugars (g), added sugars (g)". p.11 (iv): "Nutrition information panel shall include the amount of food in gram (g) or millilitre (ml) for reference beside the serving measure and the number of servings in the package." | SUPPORTED |
| food-labels-c2 | Ingredients listed most to least by weight | fssai Reg 5(2)(b), p.5 | "The name of ingredients used in the product shall be listed in descending order of their composition by weight or volume, as the case may be at the time of its manufacture;" | PARTLY (source says "by weight **or volume**", at time of manufacture) |
| food-labels-c3 | Total sugars and added sugars on separate lines; added = put in | fssai Reg 5(3)(a)(i)-(ii) p.9; 5(3)(b)(ii)(B) p.10 | p.9: "(i) 'sugars' means all monosaccharides (glucose, fructose, etc.) and disaccharides (maltose, sucrose, lactose, etc.). (ii) 'added sugars' means monosaccharides and disaccharides added to foods and beverages". p.10: "(B) Carbohydrate (g) and Total Sugars (g), added sugars (g);" | SUPPORTED |
| food-labels-c4 | Per serve %RDA based on 2,000 kcal and 50 g added sugar adult day | fssai Reg 5(3)(b), p.10 | "per serve percentage (%) contribution to Recommended Dietary Allowance calculated on the basis of 2000kcal energy, 67 g total fat, 22 g saturated fat, 2 g trans fat, 50 g added sugar and 2000 mg of sodium (5 g salt) requirement for average adult per day" | SUPPORTED |
| food-labels-c5 | Ingredient stressed in words/pictures must show its % | fssai Reg 5(2)(g), p.8–9 | "The ingoing percentage of an ingredient ... shall be disclosed for foods sold as a mixture or combination where the ingredient: (i) is emphasized as present on the label through words or pictures or graphics; ... Provided that such disclosures are not required where - (i) the ingredients are used as flavouring agents ... (v) a pictorial representation of a serving suggestion is made" | PARTLY (true in scope of "foods sold as a mixture or combination", but there are exemptions the claim omits) |

Other quotes used:
- item 11 feedback "the amount usually eaten at one time, as set on the label": p.11 Explanation: "'serving or serve size' means an amount of food customarily consumed per eating occasion or as defined on the label which is expressed in metric unit." → matches.

### Numbers and maths
- item food-labels-9 → 15 g / 30 g × 100 = 50 g per 100 g → OK; option c 15 × 30 = 450 → OK; answer 50, min 49, max 51 → OK.
- item food-labels-10 → 8 g vs 6 g per 100 g → A higher → OK.
- item food-labels-13 → 60/30/10 % → order corn, oil, salt; sums to 100 % → OK.
- item food-labels-16 → 10/50 = 20 % → OK; option c "50 % would be 25 g" → 0.5 × 50 = 25 → OK; option b explanation OK.
- c4 / item 16 → 50 g added sugar, 2,000 kcal → matches source → OK.
- steps[0].hook → A: 6/25 × 100 = 24 g; B: 10/50 × 100 = 20 g → A more sugary; "B's serve is twice as big" 50 = 2 × 25 → OK.
- steps[0].guided[1] → 200 g / 4 = 50 g → OK.
- steps[2].example → 14 − 8 = 6 g from milk → OK.
- steps[2].guided[0] → 12 − 5 = 7 g; distractor 17 = 12 + 5 → OK.

### Problems
1. **[MED] rule, hook, steps[0].teach, steps[0].guided[0] option a feedback, steps[0].takeaway, quest** — Content says every pack has a per 100 g column ("It puts every pack on the same base", "Every pack uses the same 100 g base there"). The regulation allows nutrition info "per 100g or 100ml or per single consumption pack". Small single-serve packs may show only per-pack values, and drinks use 100 ml. — Fix steps[0].teach: "Serve sizes differ from pack to pack. To compare, use the per 100 g (or 100 ml) column. Small single-serve packs may show per pack instead, so scale those to 100 g." Fix guided[0] a feedback: "Yes. The per 100 g column puts packs on the same base."
2. **[MED] c2, rule, misconception m3, steps[1].hook a feedback, steps[1].teach, steps[1].example feedback, items 12 & 13 feedback** — "by weight" only; Reg 5(2)(b) says "descending order of their composition by weight or volume, as the case may be at the time of its manufacture". The steps[1] juice example (water first) is exactly the case where volume may apply. — Fix c2: "Ingredients on an Indian pack are listed from most to least by weight or volume, as at the time of making." Fix steps[1].example feedback: "Ingredients run from most to least, so water is the biggest part."
3. **[LOW] c5, item food-labels-14 options a/b feedback** — "must give that ingredient's percentage" omits scope and exemptions (applies to "foods sold as a mixture or combination"; not required for flavouring agents, spices, serving-suggestion pictures, etc.). — Fix c5: "When a mixed food stresses an ingredient in words or pictures, the label must usually give that ingredient's percentage (flavourings and serving-suggestion pictures are exempt)." Item 14 b feedback: "Usually it is required. An ingredient stressed on a mixed food's pack must show its percentage."
4. **[LOW] item food-labels-14 option c feedback** — "In many drinks, water still comes first." No source says this. — Fix: "The % shows how much there is, not that it is the biggest part."
5. **[LOW] steps[2].hook ("no added sugar" claim)** — The rules for a "no added sugar" claim are in the FSSAI Advertising and Claims Regulations, not the cited labelling regulation; the cited text only defines sugars/added sugars. The teaching point (fruit sugars still count in total sugars) follows from Reg 5(3)(a)(i) listing fructose and lactose as sugars, so it is acceptable, but the claim wording is unbacked by the cited source. — Fix: optional; cite the Advertising and Claims Regulations 2018 if kept, or rephrase the stem: "A mango drink lists 0 g added sugars. Could it still have sugar?"
6. **[LOW] steps[1].teach** — "Sugar near the top means a lot of sugar." Order shows rank, not amount. — Fix: "Sugar near the top means sugar is one of the main ingredients."

### Safety / medical wording
None found. (No health claims; the 50 g figure is correctly framed as the label's reference value, not a health target.)

### Summary row
`| food-labels | 5 | 3 | 6 (H0/M2/L4) |`


## lift — Lift

Sources opened:
- lift → https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-3/ → HTTP 200 (curl), title "Lift | Glenn Research Center | NASA". Strong (NASA educational page). Metadata OK: dateModified 2024-07-11.
- velocity → https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/velocity-effects/ → HTTP 200, title "Velocity Effects | Glenn Research Center | NASA". Strong. Metadata: year given as 2024, page dateModified is 2023-11-22 (published 2022-07-13); minor.
- cruise → https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/range-summary/ → HTTP 200, title "Range Summary | Glenn Research Center | NASA". Strong. Metadata: year given as 2024, page dateModified is 2025-07-07; minor.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| lift-c1 | Lift needs air moving past; no air or no motion → no lift | lift | "For lift to be generated, the solid body must be in contact with the fluid: no fluid, no lift." / "There must be motion between the object and the fluid: no motion, no lift. It makes no difference whether the object moves through a static fluid, or the fluid moves past a static solid object." | SUPPORTED |
| lift-c2 | Wing turns air; air pushes back; that push is lift | lift | "Lift occurs when a flow of gas is turned by a solid object. The flow is turned in one direction, and the lift is generated in the opposite direction, according to Newton's Third Law of action and reaction." | SUPPORTED |
| lift-c3 | Equal-transit idea wrong; flat wings lift too | lift | "One of the most popular incorrect theories states that the upper surface of an airfoil is shaped longer than the lower surface so that the flow over the top travels faster to reach the trailing edge at the same time. ... the airfoil shapes used by the Wright brothers ... are thin curved plates. ... The distance on the upper and lower surface is exactly the same, yet these airfoils create plenty of lift. So the 'equal transit' theory must be incorrect" | PARTLY (first half supported; NASA's evidence is *thin curved plates with equal surface lengths*, not "flat wings") |
| lift-c4 | Lift ∝ speed²; 2× speed → 4× lift | velocity | "Since the aerodynamic force depends on the square of the velocity, doubling the velocity will quadruple the lift and drag." | SUPPORTED |
| lift-c5 | In steady cruise lift = weight | cruise | "In cruise, the lift L is equal to the weight W and the thrust F is equal to the drag D." | SUPPORTED |

Other quotes used:
- item 10 / steps[0].guided[0] (no air → no lift): lift: "Space is (nearly) a vacuum. Without air, there is no lift generated by the wings."
- item 11 (kite): lift: "For a kite, the lift force is generated by the wind blowing over a surface that is fixed in space."
- item 14 option a ("pushed up and back"): lift: "Lift acts perpendicular to the fluid motion while drag acts in the direction opposed to the motion."
- item 16 option b ("thrust balances drag"): cruise quote above.
- steps[2].teach "must go fast before its wings can carry its weight": cruise: "Using the lift equation, we can solve for the velocity necessary to create enough lift to equal the weight."

### Numbers and maths
- c4 / steps[2].hook / takeaway → 2² = 4 → OK.
- item lift-15 → 100 N × 2² = 400 N → OK; option b 200 (linear) wrong → OK; answer 400, min 350, max 450 contains 400 → OK.
- steps[2].guided[0] → 3² = 9 → OK; distractors 3 (linear) and 6 (3×2) → OK.
- steps[2].visual → marks at 25 ("1x lift" = 1/4 of max 4x) and 100 ("4x") → OK.
- steps[2].example → 2× speed → 4× lift → OK (holds only at the same wing tilt; see Problem 2).
- item lift-13 option c feedback "Paper is much heavier than air" → paper ≈ 700–1,200 kg/m³ vs air ≈ 1.2 kg/m³ → OK.
- item lift-10 option b feedback "The Moon's pull is weaker than Earth's" → ~1/6 g → OK (not in a cited source, but standard fact).

### Problems
1. **[MED] c3, misconception lift-m3 correction, item lift-13 (stem + option a/b feedback), steps[1].guided[1] (options a, b feedback)** — "Flat wings lift too" / "flat paper wing, the same shape on top and bottom" / "NASA calls this idea wrong. Flat wings with equal sides lift too." NASA's disproof uses the Wright brothers' "thin curved plates" where "The distance on the upper and lower surface is exactly the same". NASA does not say flat wings; it says "any solid surface can deflect a flow". (Flat plates at an angle do lift in reality, but the cited page does not say so, and the "NASA calls ..." feedback attributes it to NASA.) — Fix c3: "The idea that air over the top must meet the air below at the back edge is wrong. Thin wings with the same length on top and bottom still lift." Fix steps[1].guided[1] b feedback: "NASA calls this idea wrong. Thin wings with equal top and bottom lengths still lift." m3: "Air on top does not have to meet the air below. Wings with equal top and bottom lengths lift too." Item 13 can keep the flat paper wing if feedback cites the general rule: "Any surface that turns air makes lift. A tilted paper wing does that."
2. **[MED] steps[2].hook (stem), rule** — "A glider doubles its speed. Guess how its lift changes. → About four times." Without "at the same tilt" this conflicts with c5/item 16: a glider or plane in steady flight at double speed lowers its nose so lift still equals weight. Velocity page frames it as all-else-equal ("aerodynamic force depends on the square of the velocity"). — Fix stem: "A glider doubles its speed with its wings tilted the same. Guess how its lift changes." Rule: "...Lift grows with speed squared if nothing else changes, and in steady level flight it equals weight."
3. **[MED] item lift-9 option a + feedback** — "It drops, since no air flows past" / "no air moves past the wings, so there is no lift." Once released, the glider falls through the air, so air does flow past and lift builds; a real paper glider dropped from rest usually noses down and starts to glide. The NASA quote ("no motion, no lift") supports only the instant of release. — Fix option a: "It starts to drop, since no air flows past yet." Feedback: "At release nothing moves past the wings, so there is no lift. It falls until it is moving fast enough through the air to glide."
4. **[LOW] steps[0].guided[1] option a** — "Almost none." for a parked plane in *calm* air: by the NASA rule ("no motion, no lift") it is none; "almost" is fine only for slight breeze. OK as is; optional "None, or almost none."
5. **[LOW] sources.velocity / sources.cruise metadata** — year "2024" does not match page dates (velocity modified 2023-11-22; range-summary modified 2025-07-07). — Fix: velocity year 2023, cruise year 2025 (or use asOf only).

### Safety / medical wording
- **[MED] item lift-14 stem** ("On a train, Om puts his flat palm out of the window") and **steps[1].hook stem** ("Your hand is out of a bus window") — both describe putting a hand out of a moving train/bus window, which is a real injury risk in India (poles, passing vehicles/trains, platform edges), and the quest invites trying things. — Proposed safer wording: item 14: "Om holds a flat piece of card in front of a table fan and tips its front edge up. What does he feel?" (keep options; change "His hand" → "The card"). steps[1].hook: "You hold a flat card in front of a fan, tipped up a little. Where does the air go after it hits the card?" If the hand-out-of-window picture is kept, frame it as a thought experiment: "Picture a hand out of a car window (don't try it on a moving bus or train)."

### Summary row
`| lift | 5 | 4 | 6 (H0/M4/L2) |` (includes the 1 MED safety item)


## multirotor-turns — How a multirotor turns
Sources opened:
- stan → https://ai.stanford.edu/~gabeh/papers/Quadrotor_Dynamics_GNC07.pdf → HTTPS failed TLS verification through the proxy (curl error 60, also with the proxy CA bundle); opened the identical PDF over http:// (HTTP 200, 6-page PDF, pdftotext) → strong (peer-reviewed AIAA GNC 2007 paper, Hoffmann/Huang/Waslander/Tomlin). Metadata ok. Suggest storing the http URL or a DOI landing page so the link works for readers whose clients reject the cert chain.
- mit → https://vnav.mit.edu/labs_2023/lab3/exercises.html → HTTP 200 → WEAK (course lab exercise page, "Exercises | VNAV"). Title in JSON ("VNAV Lab 3: Modelling and control of UAVs") is a paraphrase; page title is "Exercises | VNAV". Content does support CW/CCW and drag torque.
- quad → https://scholar.rose-hulman.edu/undergrad_research_pubs/11/ → HTTP 200 (abstract page only) → WEAK (undergraduate research publication). Metadata ok (Huang, Rose-Hulman, 2016).

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Thrust gap between opposite rotors tilts in pitch/roll | stan p.7 Fig. 4 caption; quad abstract | stan: "Differential thrust between opposite motors provides roll and pitch torques." quad: "By controlling the speed of the four propellers, a quadcopter can roll, change pitch, change yaw, and accelerate." | SUPPORTED |
| c2 | Yaw from thrust gap between the two counter-rotating pairs | stan p.7–8 | "Differential thrust between the two pairs of counter-rotating motors provides yaw torque." | SUPPORTED |
| c3 | Two CW, two CCW, so twists cancel | mit; stan p.8 | mit: "on real quadrotors the motors are configured to rotate in different directions: two counter-clockwise (CCW), and two clockwise (CW). This configuration is necessary so that our quadrotor will be stable in its yaw direction." and "propeller 1 spins clockwise ... which in turn produces a counter-clockwise drag torque". stan: "motors 1 and 3 rotate in the opposite direction of rotors 2 and 4." | SUPPORTED |
| c4 | Each rotor carries about a quarter of the weight in hover | stan p.7 eq. (5) text | "For a quadrotor helicopter, this is equal to 1/4 Tnom, where the nominal weight Tnom is equal to the weight of the vehicle." | SUPPORTED |
| c5 | Moves sideways by tilting, pointing part of total thrust | stan p.7 | "Position control ... is accomplished by controlling the magnitude and direction of the total thrust." and "The thrust produced by the ith rotor acts perpendicularly to the rotor plane" | SUPPORTED (tilt follows from thrust being perpendicular to the rotor plane) |

### Numbers and maths
- item multirotor-turns-9 → 20 N / 4 = 5 N; min 4.5, max 5.5 contain 5 → OK. Distractors 20 (whole weight) and 80 (×4) correctly wrong → OK.
- steps[0].hook → 2 N / 4 = 0.5 N; distractors 2 and 8 → OK.
- steps[0].guided[0] → 12 N / 4 = 3 N; distractors 12 and 48 → OK.
- Direction checks: steps[1].hook (back rotors harder → nose down) OK; steps[1].visual (left harder → rolls right) OK; steps[1].example (right rotors harder → leans left → slides left) OK; steps[1].guided[0] (roll right → left rotors harder) OK; item 12 (breeze to right → lean left, right rotors harder) OK; item 10 option c (front two speed up → nose up) OK; item 14 pairs (roll right ↔ left harder; nose down ↔ back harder) OK.

### Problems
1. **[MED] sources quad, mit; misconceptions m1, m2; quest** — Two of three sources are weak (an undergraduate research report seen only as an abstract, and a course lab exercise page). m1, m2 and the quest cite only `quad`, and m1's "GPS can aid position" is not in the quad abstract (no source says this). Fix: re-point m1 to stan + PX4 and m2/quest to stan. Opened this session: stan p.7 "Position control ... is accomplished by controlling the magnitude and direction of the total thrust"; PX4 Multicopter Configuration (https://docs.px4.io/main/en/config_mc/index): "PX4 most commonly relies on ... a GPS/GNSS for global position." Keep `mit` only as a secondary ref for c3 (stan already covers counter-rotation and yaw torque).
2. **[LOW] steps[2].example** — "A hovering drone keeps its height, / but its clockwise pair spins a bit faster" — speeding up one pair alone also raises total thrust, so it would climb; this contradicts steps[2].guided[1], which teaches that the other pair must slow. stan only speaks of "differential thrust between the two pairs". Fix: "but its clockwise pair speeds up while the other pair slows," (and spot text to match).
3. **[LOW] steps[2].teach** — "Speed up one pair and the drone turns." Same issue. Fix: "Speed up one pair and slow the other, and the drone turns on the spot."
4. **[LOW] misconception m3 / item multirotor-turns-15** — "A drone turns its nose by changing the twist balance, not by tilting." This is right for heading (yaw), but a drone that changes its path while flying forward does tilt its thrust sideways (stan: position is controlled through "magnitude and direction of the total thrust"). Fix m3 correction: "A drone turns its nose on the spot by changing the twist balance. Tilting is what moves it sideways." Item 15 stem: "...turns its nose on the spot by leaning, like a bike..."
5. **[LOW] stan URL** — the https link fails TLS verification via the proxy (curl 60); http works. Check it in a normal browser; if it fails there, switch to the http URL or a publisher landing page.

### Safety / medical wording
None found.

### Summary row
`| multirotor-turns | 5 | 5 | 5 (0/1/4) |`


## battery-flight-time — Batteries and flight time
Sources opened:
- battery → https://hiperlab.berkeley.edu/wp-content/uploads/2020/06/2020_FlyingBatteries.pdf → HTTP 200, PDF (pdftotext) → strong-ish (authors' copy of a peer-reviewed robotics conference paper by Jain and Mueller, HiPeRLab UC Berkeley). Title and authors OK. Publisher field says only "University of California Berkeley"; the PDF does not name the venue. I believe it is IEEE ICRA 2020 but did not confirm that this session, so check before adding it.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Flight time depends on stored energy and rate of use | battery §II eq. (3) | "The available flight time Tflight can then be related to ..." Tflight = Ebatt / pelec | SUPPORTED |
| c2 | Heavy battery adds weight, so more lift needed | battery §II | "For a hovering multirotor, the individual propeller thrusts scale proportionally with the vehicle's total mass." | SUPPORTED |
| c3 | Hover power ∝ thrust^1.5, climbs faster than weight | battery §II | "We model the aerodynamic power consumption pi of an individual propeller i to be related to its thrust fi as pi ∝ fi^(3/2)" | SUPPORTED |
| c4 | Time peaks at battery ≈ 2/3 of mass, then falls | battery §II, Fig. 2 | "a strong improvement in total flight time with increasing battery mass, until a peak where the battery takes up two-thirds of the vehicle's mass." Fig. 2: "After the peak at φ = 2/3, a larger battery reduces flight time." | SUPPORTED (it is a model result: "Assuming constant energy density γ"; kp "constant for a given vehicle") |
| c5 | 57 min hover vs 12 min solo | battery §IV-B | "the main quadcopter hovered for a total time of 57 min. Hovering time of the main quadcopter flying alone without the dock-switch-undock-repeat process is 12 min." | SUPPORTED |

### Numbers and maths
- There are no mAh or voltage figures in this concept. All energy is given in Wh, so there is no V×Ah conversion to check.
- steps[0].hook → 50 Wh / 100 W = 0.5 h = 30 min; distractors 2 h (inverted) and 50 min → OK.
- steps[0].example → 60 Wh / 120 W = 0.5 h → OK.
- steps[0].guided[0] → 100 Wh / 200 W = 0.5 h = 30 min → OK.
- steps[0].guided[1] → 2× power gives ½ time → OK.
- item battery-flight-time-9 → 50 / 200 = 0.25 h = 15 min; range 13–17 contains 15 → OK. Distractor "4 minutes" = 200/50 (inverted, 4 h⁻¹) and "250" = sum → correctly wrong.
- item 10 → 80 W vs 160 W with the same energy → A lasts 2× → OK.
- steps[1].hook, steps[1].teach, m3, item 13 → 2^1.5 = 2.83, so "nearly three times" → OK. steps[1].visual "about x2.8" → OK.
- item 12 → same energy and power ×2.83 give time ×1/2.83 = 0.354, "roughly a third" → OK. Distractor "half" (assumes linear) is wrong → OK.
- steps[1].guided[0] → 4^1.5 = 4×√4 = 8 → OK.
- c4 / steps[2] → T ∝ φ(1−φ)^0.5 (from eq. 3). dT/dφ = 0 gives 1 − φ − φ/2 = 0, so φ = 2/3. The paper's peak is confirmed → OK. steps[2].visual marks at 30 / 67 / 90 % → consistent.
- steps[2].guided[0] → 1 kg / 3 kg = 33% < 67% → below peak → OK.
- steps[2].guided[1] → 80% > 67% → past peak → OK.
- item 16 feedback → 57 vs 12 min; 57/12 = 4.75, paper says "4.7-fold" → OK.

### Problems
1. **[LOW] steps[2].teach, steps[2].example, steps[2].guided[*], item 15, rule** — The two-thirds peak comes from a model that assumes the same motors and propellers ("kp ... constant for a given vehicle") and fixed energy per kg. The teach card states it as a plain fact. The paper also warns about this: "This large fraction makes structural design difficult and may lead to potential safety concerns." Fix steps[2].teach: "More battery adds energy but also weight. In the simple model, flight time rises at first, then peaks when the battery is about two thirds of the mass. After that, more battery cuts time."
2. **[LOW] steps[0], item 9, item 10** — Flight time is computed as full stored Wh ÷ W. Real packs are not run to empty, so real hover time is shorter. No cited source says this, and the "About" wording softens it. Optional fix for steps[0].teach: add "Real drones land with some charge left, so real times are a bit shorter."
3. **[LOW] source metadata** — Publisher shows only the lab and university. Add the conference venue once it is confirmed (the PDF itself does not state it).

### Safety / medical wording
None found. Optional: problem 2 above. Battery safety is not discussed anywhere in this concept.

### Summary row
`| battery-flight-time | 5 | 5 | 3 (0/0/3) |`


## flight-sensors — Flight sensors
Sources opened:
- gps → https://www.gps.gov/trilateration → HTTP 200 → strong (US government). Title "Trilateration | GPS.gov" OK.
- gpsaccuracy → https://www.gps.gov/gps-accuracy → HTTP 200 → strong. Title "GPS Accuracy | GPS.gov" OK.
- barometer → https://www.weather.gov/asos/BarometricPressureSensor.html → HTTP 200 → strong (NWS ASOS page). Title OK.
- px4 → https://docs.px4.io/main/en/config_mc/index → HTTP 200 → medium (open-source autopilot docs; authoritative for PX4). Title "Multicopter Configuration | PX4 Guide (main)" OK.
- px4-sensors → https://docs.px4.io/main/en/sensor/ → HTTP 200 → medium. Title "Sensor Hardware & Setup | PX4 Guide (main)" OK.
- noaa-pressure → https://www.noaa.gov/jetstream/atmosphere/air-pressure → HTTP 200 → strong. Title "Air Pressure" OK.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Gyro senses turn rate; accelerometer senses changes in motion | px4; px4-sensors | px4: "PX4 most commonly relies on a magnetometer (compass) for direction information, a barometer for altitude, a gyroscope for body rates, an accelerometer for attitude and a GPS/GNSS for global position." px4-sensors: "PX4 minimally requires a gyroscope, accelerometer, magnetometer (compass), and barometer to measure the above states." | PARTLY. The gyroscope half is supported ("body rates"). Neither page says the accelerometer senses "changes in motion"; PX4 says it is used "for attitude". |
| c2 | GPS uses signal travel time from satellites | gps | "GPS satellites are always sending out radio signals ... Time is determined by how long it takes for a signal to travel from the GPS satellite to a GPS receiver on earth. With a known rate and a known time we can solve for the distance between satellite and receiver." | SUPPORTED |
| c3 | Phones within 4.9 m in open sky; worse near buildings, trees, indoors | gpsaccuracy | "GPS-enabled smartphones are typically accurate to within a 4.9 m (16 ft.) radius under open sky ... However, their accuracy worsens near buildings, bridges, and trees." and "Satellite signal blockage due to buildings, bridges, trees, etc. Indoor or underground use" | SUPPORTED |
| c4 | Pressure falls with height, so barometer tracks height | noaa-pressure; px4-sensors; barometer | noaa: "as elevation increases, the number of molecules decreases and the density of air therefore is less, which means there is a decrease in air pressure." NWS: "Atmospheric pressure ... provides the means of establishing an aircraft's height above the ground." (Also px4: "a barometer for altitude".) | SUPPORTED |
| c5 | Standard sea-level pressure ≈ 1013 hPa | noaa-pressure | "The standard pressure at sea-level is 1013.25 in both millibars (mb) and hectopascal (hPa)." | SUPPORTED |

### Numbers and maths
- c3, steps[1].guided[0] → 4.9 m ≈ "about 5 metres" → OK. Distractors 1 mm / 5 km → OK.
- item flight-sensors-13 → the source gives 4.9 m as a radius, so the width is 2 × 4.9 = 9.8 m. Answer 9.8 sits inside min 9 / max 10.6 → OK. Option "About 10 metres across" → OK. Feedback "4.9 metres is the radius" matches the source's word "radius" → OK.
- c5, steps[2].guided[1], steps[2].visual → 1013.25 hPa → OK. Distractor 100,000 hPa: 100,000 Pa = 1000 hPa, so 100,000 hPa is 100× too high → correctly wrong. Distractor 13 hPa → correctly wrong.
- Direction checks: steps[2].hook (pressure goes down when climbing) OK; steps[2].guided[0] (rise in pressure → went lower) OK.

### Problems
1. **[MED] items flight-sensors-10 (option a), flight-sensors-16 (option a), c1** — Item 10 says "Its gyroscope senses tilting" and item 16 says "Gyroscope for tilt". PX4 splits the jobs differently: "a gyroscope for body rates, an accelerometer for attitude". The gyro senses how fast the drone turns; the tilt angle (attitude) comes from the accelerometer, fused with the gyro. Fixes:
   - item 10 option a: "Its gyroscope and accelerometer sense tilting, with no signal needed."
   - item 16 option a: "Gyroscope and accelerometer for tilt, GPS for place, barometer for height."
   - c1: "A gyroscope senses how fast the drone turns. An accelerometer senses speed-ups and which way is down, which gives its tilt."
   (Items 9 and 15 and the s1 hook ask about *turning*, so they are fine.)
2. **[LOW] c1, steps[0].teach, steps[0].guided[0], item 11** — "An accelerometer senses changes in its motion." No cited source says this; PX4 only says "accelerometer for attitude". It is true physics, but it is unsourced. Either add the PX4 attitude wording above, or cite a source that defines an accelerometer.
3. **[LOW] hook** — "A roof can block a drone's map signal." GPS gives position, not a map, and every other card says "GPS signal". Fix: "A roof can block a drone's GPS signal. Yet the drone still feels a quick tilt."
4. **[LOW] rule "Each clue has limits" / quest "Add one limit for each"** — The concept never teaches a limit for the barometer, so the quest asks for something the learner has not been given. NOAA supports one: "Although the changes are usually too slow to observe directly, air pressure is almost always changing." Fix: add to steps[2].teach: "Weather also shifts air pressure a little, so barometer height can drift."
5. **[LOW] item flight-sensors-12 option c feedback** — "GPS works day and night." Neither GPS page I opened says this (no source says this). It is harmless and true, but unsourced. Either cut it ("The roof is blocking the signals, not the time of day.") or cite a source that says it.

### Safety / medical wording
None found.

### Summary row
`| flight-sensors | 5 | 4 | 5 (0/1/4) |`


## birds-and-planes — Why birds flap but planes do not

Sources opened:
- bird → https://www.nature.com/articles/s41467-019-13347-3.pdf → 200, PDF via curl, pdftotext → strong (peer-reviewed, Nature Communications 2019, 10:5354). Metadata OK (title, authors Chin & Lentink, year).
- nasa → https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/four-forces-on-an-airplane/ → 200, curl → acceptable (NASA Glenn educational page). Metadata: JSON says year 2024; page footer says "Page Last Updated: July 21, 2022" (LOW).
- cruise → https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/range-summary/ → 200 on second curl (first attempt connection reset) → acceptable. Metadata: JSON year 2024; page says "Page Last Updated: July 7, 2025" (LOW).

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Bird wing flaps can provide lift and thrust | bird | p.2: "birds sustain level flight by generating net aerodynamic forces with their flapping wings that balance gravity and body drag"; p.3: "most of the bird's acceleration during takeoff is provided by downstroke lift" | SUPPORTED |
| c2 | Wings make most lift; engines make thrust | nasa | "Most of the lift is generated by the wings." / "To overcome drag, airplanes use a propulsion system to generate a force called thrust." | SUPPORTED |
| c3 | Engine only beats drag; gliders fly with no engine | nasa | "Note that the job of the engine is just to overcome the drag of the airplane, not to lift the airplane." / "there are some aircraft, called gliders that have no engines at all, but fly just fine." | SUPPORTED |
| c4 | Parrotlets tilt strokes at takeoff: lift forward, drag up holds nearly half weight | bird | Abstract: "At takeoff they incline their wing stroke plane, which orients lift forward to accelerate and drag upward to support nearly half of their bodyweight." | SUPPORTED |
| c5 | Downstroke uses most power; upstroke almost none | bird | Abstract: "Wingbeat power requirements are dominated by downstrokes, while relatively inactive upstrokes cost almost no aerodynamic power." | SUPPORTED |
| c6 | Steady cruise: thrust = drag, lift = weight | cruise | "In cruise, the lift L is equal to the weight W and the thrust F is equal to the drag D." | SUPPORTED |

### Numbers and maths
- item birds-and-planes-9 → thrust 20,000 N, drag ≈ 20,000 N (thrust = drag in cruise); answer 20000, min 19000, max 21000 → contains value. OK. Distractors 40,000 N and 0 correctly wrong; feedback matches.
- steps[2].guided[0] → "nearly half" of weight held by drag → abstract "nearly half of their bodyweight". OK.
- steps[2].guided[1] feedback → "about a quarter of the braking force" → abstract "lift is oriented backward to contribute a quarter of the braking force"; p.3 says this is "of the total braking force during the final wingbeat". OK (see Problem 2 on claim coverage).
- item birds-and-planes-15 option d feedback → "Nearly all the work of each wingbeat is done on the way down" → p.3 "the downstroke is responsible for nearly all of the aerodynamic power". OK.
- No unit conversions in this concept.

### Problems
1. **[LOW] sources nasa, cruise** — `year: 2024` does not match the pages. "Page Last Updated: July 21, 2022" (Four Forces); "Page Last Updated: July 7, 2025" (Range Summary). Fix: set year 2022 and 2025 (or drop year and keep asOf).
2. **[LOW] steps[2].guided[1]** — landing fact (lift aimed backward, "about a quarter of the braking force") is not covered by any claim; c4 covers takeoff only. The bird source backs it: "Upon landing, lift is oriented backward to contribute a quarter of the braking force". Fix: add claim c7 "When landing, parrotlets aim lift backward, giving about a quarter of the braking force." sourceRefs [bird].
3. **[LOW] steps[2].teach, hook, rule, item 16** — generalises parrotlet takeoff/landing findings to "a bird's wing" in general. The paper studies "Pacific parrotlets (Forpus coelestis) during short, foraging flights" and slow flight. The generic statement "flapping wings can make both lift and forward push" is fine (paper p.2 on level flight), but the tilt/drag-holds-weight detail should stay tied to small birds at takeoff, which steps[2].teach already does ("small parrots"). Item 15 option c/d ("A parrotlet's downstroke" ↔ "Most of the flight power") is correctly scoped. No change needed beyond keeping "parrotlet/small parrots" wording in any new copy.
4. **[LOW] item birds-and-planes-15 options a–d, item 16** — sourceRefs list both nasa and bird on every option; option c/d (parrotlet downstroke) is backed only by bird, option a/b (engine thrust) only by nasa. Fix: a,b → [nasa]; c,d → [bird].
5. **[LOW] item birds-and-planes-14 option b feedback** — "Gliders are far heavier than air." No cited source says this (true, trivial). Optional: rephrase to "A glider is not a balloon. Its wings lift it as air flows past." to stay within the source.
6. **[LOW] steps[1].guided[0] option c feedback** — "Drones use motors and rotors." Not in any cited source (true, trivial). Acceptable; or cite NASA Four Forces only for the glider half.
7. **[LOW] item birds-and-planes-13 / steps[1].guided[1]** — accurate, but NASA adds that a glider needs a starting push and in flight "the weight is opposed by both lift and drag"; the content's "glides down" wording in steps[1].guided[1] is consistent. No fix needed.

### Safety / medical wording
None found.

### Summary row
`| birds-and-planes | 6 | 6 | 7 (0/0/7) |`


## ceiling-fans — How a ceiling fan moves air

Sources opened:
- fan → https://www.energy.gov/cmei/buildings/ceiling-fans → 200, curl → weak for this use: an appliance-standards regulatory page; it only gives the CFR definition. Metadata: JSON year 2024; page `article:modified_time` 2025-03-21 (LOW).
- cooling → https://www.energy.gov/indianenergy/articles/energy-saving-hacks-beat-summer-heat → 200, curl → acceptable (DOE Office of Indian Energy blog post, dated "July 1, 2021"). Metadata OK. Note: "Indian" here means Native American tribes, US context.
- doe-guide → https://www.energy.gov/sites/default/files/2022-08/energy-saver-guide-2022.pdf → 200, PDF via curl, pdftotext → strong (DOE Energy Saver Guide 2022). Fan text on p.17 ("Home Cooling"). Metadata OK.
- doe-summer → https://www.energy.gov/articles/top-11-things-you-didnt-know-about-saving-energy-home-summer-edition → 200, curl → acceptable but old (dated "June 8, 2012"). Metadata OK.
- (tried, not cited by the JSON) CDC heat-and-fans page https://www.cdc.gov/heat-health/risk-factors/heat-and-fans.html → 403 via curl and timeout via headless Chromium; not used.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Ceiling fan moves room air with rotating blades | fan | "ceiling fan means a nonportable device that is suspended from a ceiling for circulating air via the rotation of fan blades. 10 CFR 430.2." | SUPPORTED |
| c2 | Breeze aids skin cooling; fan makes no cold air | fan, cooling | cooling: "fans do not generate cool air; they only move existing air, making humans feel cooler by evaporating moisture from your skin." (fan page says nothing on this) | SUPPORTED (by cooling only) |
| c3 | Moving air dries sweat, you feel cooler | cooling, doe-guide | cooling: "making humans feel cooler by evaporating moisture from your skin"; doe-guide p.17: "Ceiling fans cool by creating a wind chill effect" (not sweat-specific) | SUPPORTED (by cooling) |
| c4 | AC about 4°F (~2°C) warmer, same comfort | doe-guide, doe-summer | doe-guide p.17: "Using a ceiling fan allows you to turn up the thermostat about 4°F without any loss in comfort."; doe-summer #5: "a ceiling fan will allow you to raise the thermostat setting about 4°F with no reduction in comfort." (°C is a correct conversion, not in source) | SUPPORTED |
| c5 | Fans cool people, not rooms; empty-room fan does no good | doe-summer, doe-guide | doe-summer #5: "Just make sure to turn it off when you leave the room (fans cool people, not rooms)."; doe-guide p.17: "turn off the fan when you aren't in the room." | SUPPORTED |
| c6 | Summer counterclockwise for breeze; winter clockwise brings warm air down | doe-guide | p.17: "In summer, use the ceiling fan in a counterclockwise direction to create a wind chill effect" / "In winter, reverse the fan to run clockwise and force warm air down from the ceiling." | SUPPORTED |

### Numbers and maths
- c4, item ceiling-fans-14 → 4°F difference × 5/9 = 2.22°C. Answer 2.2, min 1.8, max 2.6 → contains value. OK.
- item 14 option b "About 4°C" → wrong (would be 7.2°F). Feedback "Fahrenheit degrees are smaller" correct. OK.
- item 14 option c "About 7°C" → 4 × 9/5 = 7.2, i.e. the reverse conversion; feedback "converts the wrong way" correct. OK.
- steps[2].teach / visual "About 2°C warmer" → 2.2°C. OK.
- steps[2].guided[0] → AC 24°C → 26°C = 2°C = 3.6°F, within "about 4°F". OK.
- item ceiling-fans-11 → room 32°C stays ~32°C; 25°C and 20°C distractors wrong. OK (a running fan motor adds a small amount of heat, so "about the same" is the right wording).
- No other numbers.

### Problems
1. **[MED] source fan used for c2, item 9, item 11, item 13 (via m1), misconception m1** — the regulatory page only defines a ceiling fan; it does not say fans make no cold air or that the breeze is room air pushed by blades beyond "circulating air via the rotation of fan blades". Fix: keep `fan` only on c1; for c2/m1/items 9 and 11 cite `cooling` (quote above) and `doe-guide` p.17 ("Ceiling fans cool by creating a wind chill effect").
2. **[LOW] steps[1] hook option b feedback, item 13 option c feedback, item 16 option c feedback, steps[1].takeaway** — say a fan cools you *only/just* by drying sweat ("The breeze cools you by drying sweat", "They cool people by drying sweat", "A breeze cools skin by drying sweat, not by chilling air"). DOE guide calls it a "wind chill effect", which also includes moving warm air off the skin. Fix: "mainly by helping sweat dry" in those four places; e.g. takeaway → "A breeze cools skin mainly by drying sweat, not by chilling air."
3. **[LOW] item ceiling-fans-12 option a + feedback** — "More water dries off, carrying more heat away." The source says only that fans cool "by evaporating moisture from your skin"; it does not say more moisture means more cooling. Physically sound. Fix: soften to "There is more water to dry, so more heat leaves your skin." and accept as reasoning from the source, or leave and note as unsourced.
4. **[LOW] steps[1].guided[0] (dry steel spoon)** — "With no sweat to dry, the breeze cannot cool it below the air." No cited source says this (physically correct). Fix: keep, or attach to c2/c3 with the cooling quote "they only move existing air".
5. **[LOW] item ceiling-fans-9 option c feedback, steps[0].guided[1] option b feedback** — "A ceiling fan has no inlet / no air inlet." Not in any source. Fix: "A ceiling fan only stirs the air already in the room." (matches cooling: "they only move existing air").
6. **[LOW] c6, steps[0] hook/visual/example** — clockwise/counterclockwise has meaning only from a viewpoint; the DOE guide does not state it, and blade pitch decides the airflow. Many Indian ceiling fans cannot reverse. Fix: steps[0].hook stem "Look up at a fan that can reverse. Seen from below, which way should it spin in summer?"; already says "a fan that can reverse", keep.
7. **[LOW] source metadata fan** — year 2024 vs page modified 2025-03-21. Fix: year 2025 or drop.
8. **[LOW] source doe-summer** — 2012 blog post; claim c4/c5 are also in the stronger 2022 doe-guide p.17. Fix: lead with doe-guide, keep doe-summer only for the phrase "fans cool people, not rooms".

### Safety / medical wording
- **[LOW] quest** — "With the fan on, hold a light ribbon safely away from the blades." Fine, but add: "Stay on the floor; never climb up to a moving fan." 
- No heat-illness claims made. Optional (not required by any claim): if the pack ever adds heat-wave advice, note that a fan is not enough in extreme heat; I could not open the CDC page to cite (403), so no wording proposed from it.

### Summary row
`| ceiling-fans | 6 | 6 | 9 (0/1/8) |`


## upi-path — How UPI moves money

Sources opened:
- rbi-booklet → https://www.rbi.org.in/scripts/PublicationsView.aspx?Id=20315 → 200, curl → strong (RBI). Page dated "Jan 25, 2021"; heading "Payment Systems in India - Booklet" / "Booklet on Payment Systems". JSON title "Booklet on Payment Systems: Digital Payments" is not the page's title (LOW). Content is 2021, so it predates UPI Lite, biometric auth and the P2P-collect shutdown.
- pib-upi → https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/dec/doc2024121462101.pdf → 200, PDF via curl → acceptable (PIB backgrounder, "December 1, 2024", Ministry of Finance). Metadata OK.
- rbi-upi123 → https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=53385 → 200, curl → strong but mostly off-topic for the claims it is cited for (UPI123Pay launch and DigiSaathi, "Mar 08, 2022"). Metadata OK.
- rbi-fraud → https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=53185 → 200, curl → strong (RBI, "Jan 28, 2022"). Metadata OK. Its collect-request warning is now outdated (see Problem 1).
- NPCI pages, all opened this session with headless Chromium (curl gets an Akamai 403 on npci.org.in; old `/what-we-do/...` URLs now 404):
  - npci-overview → https://www.npci.org.in/product/upi → 200.
  - npci-roles → https://www.npci.org.in/product/upi/roles-responsibilities → 200.
  - npci-fraud → https://www.npci.org.in/fraud-awareness → 200.
  - npci-stats → https://www.npci.org.in/product/upi/product-statistics → 200.
  - npci-digisaathi → https://www.npci.org.in/digisaathi → 200.
  - NPCI OC 220 → https://www.npci.org.in/uploads/UPI_OC_No_220_FY_2025_26_Discontinuing_the_service_of_UPI_Collect_Request_for_Person_to_Person_P2_P_transactions_3fb30c60d7.pdf → 200. Scanned PDF, read as an image. Found through the site API `/api/circulars/upi?year=2025`.
  - NPCI OC 226 → https://www.npci.org.in/uploads/UPI_OC_No_226_FY_2025_26_Introduction_of_Additional_Authentication_methods_in_UPI_42c3693399.pdf → 200. Scanned PDF, read as an image.
  - Not readable: `/product/upi/upi-lite` and `/product/upi/user-onboarding-on-upi` rendered empty; `/product/upi/about-upi` was WAF-rejected; `/product/upi-123pay` redirects to the UPI overview, so there is no separate 123Pay page. None of these is needed: the concept states no UPI Lite, UPI123Pay or limit figures.

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | UPI ID is a payment address you set, pointing to your bank account | rbi-booklet, pib-upi | booklet 7.31: "send and receive money instantly using a Virtual Payment Address (VPA) set by the user itself"; PIB: "Uses a virtual address for transactions" | SUPPORTED |
| c2 | UPI moves money between bank accounts; NPCI runs the network linking banks | rbi-booklet, pib-upi (+NPCI) | booklet 7.33: "The framework of UPI comprises of NPCI as network and settlement service provider, banks as Payment System Providers (PSPs), and as issuer banks and beneficiary banks"; NPCI roles: "NPCI owns and operates the Unified Payments Interface (UPI) platform" / "NPCI provides online transaction routing, processing and settlement services to members participating in UPI" | SUPPORTED. Scope note: UPI also covers PPI wallets and credit lines. NPCI roles: "NPCI approves the participation of Issuer Banks, PSP Banks, Third Party Application Providers (TPAP) and Prepaid Payment Instrument issuers (PPIs)". |
| c3 | Works 24x7x365; money moves at once | rbi-booklet, pib-upi (+NPCI) | booklet 7.31: "UPI is a mobile based, 365x24x7 'fast payment' system wherein users can send and receive money instantly"; PIB: "Enables immediate money transfers 24/7, 365 days a year"; NPCI overview: "pay effortlessly 24/7, directly from your bank account" | SUPPORTED |
| c4 | Payment checked two ways: your phone + UPI PIN | rbi-booklet, rbi-upi123 (+NPCI) | booklet 7.34: "two factor authentication using device binding and a UPI PIN"; NPCI overview: "The first factor is the mobile number linked to the user's bank, and the second is the UPI PIN". But NPCI OC 226 (7 Oct 2025): "one of the factors of authentication is implemented through the UPI PIN for transaction authentication (except UPI Lite and mandate execution)" and "On-Device biometric authentication (fingerprint, face, etc) shall be introduced as an additional option in lieu of UPI PIN ... initially ... for transactions up to Rs. 5,000." rbi-upi123 supports PIN only for missed-call mode: "The customer will receive an incoming call to authenticate the transaction by entering UPI PIN." | PARTLY (true as the default; no longer the only way) |
| c5 | Getting money never needs a QR scan or PIN | rbi-fraud (+NPCI) | RBI: "Transactions involving receipt of money do not require scanning barcodes / QR codes or entering MPIN."; NPCI fraud page: "scanning a QR code and entering a UPI PIN is only meant for making payments, not receiving them." | SUPPORTED |
| c6 | With a UPI ID you don't need account number/IFSC | pib-upi, rbi-booklet | PIB: "Uses a virtual address for transactions, eliminating the need to share sensitive details like account numbers or IFSC codes."; booklet 7.31: "obviates the need for sharing account or bank details to the remitter" | SUPPORTED |
| c7 | 16.58 billion payments in one month, late 2024 | pib-upi (+NPCI) | PIB: "In October 2024, Unified Payments Interface (UPI) achieved a historic milestone by processing 16.58 billion financial transactions in a single month". NPCI stats now: "September-2026 756 24,068.38" (volume in Mn) | SUPPORTED (dated; see Problem 6) |

### Numbers and maths
- item upi-path-12 → 16.58 billion ÷ 31 days (October 2024 has 31 days) = 534.8 million/day. The feedback divides by "about 30 days" to get "roughly 550 million". Answer value 550 (min 500, max 570) contains 535, but the stated value and working are slightly off. PROBLEM (LOW).
- item 12 option b feedback → "That is a thousand times too small." 16 million vs ≈535 million is about 33× too small, not 1,000×. The 1,000× gap is billion vs million before dividing by days. PROBLEM (MED: wrong maths in feedback).
- item 12 option c → 5 billion/day ≈ 9× too big; feedback "Too big" OK.
- c7 / PIB cross-check: ₹23.49 lakh crore, 45% YoY from 11.40 billion. 16.58/11.40 = 1.454, so +45%. Consistent (not used in the concept).
- ₹ amounts in scenarios (₹2,000, ₹800, ₹50, ₹40, ₹30, ₹500) are illustrative and have no maths issues. Under the old rules the ₹2,000 collect amount was exactly the P2P collect cap; the feature is now gone (Problem 1).
- No limit, UPI Lite, UPI123Pay or helpline figures appear in the concept. Helpline cross-check, in case one is added: NPCI DigiSaathi page "(a) toll-free number (1800-891-3333), (b) a short code (14431)" matches RBI prid=53385.

### Problems
1. **[HIGH] item upi-path-14 (stem, all options), misconception m3 context, source rbi-fraud bullet** — the scenario "A stranger sends Rohan a 'collect request' for ₹2,000" is out of date. NPCI OC 220 (29 July 2025): "by 1st October 2025 UPI P2P Collect shall not be allowed to be processed in UPI" and "ensure that no P2P Collect transaction is initiated, routed, or processed on UPI beyond 1st October 2025." A stranger (a person) can no longer send a collect request. Fix it as a QR/link scam, which NPCI describes now: "users may receive links or QR codes from unknown individuals, who promise rewards in exchange for entering their UPI PIN." Replacement stem: "A stranger sends Rohan a QR code and says, 'Scan it and enter your PIN to get your ₹2,000 refund.' Predict what happens if he does." Keep options. Option a feedback: "Scanning and entering a PIN always sends money out. A real refund needs no scan and no PIN." Add NPCI fraud page and OC 220 as sources.
2. **[HIGH] steps[2].teach, item 14 option a feedback ("A PIN always approves money going out"), item 15 stem, rule, c4** — "Money leaves your account only after you enter your UPI PIN on your own phone" is no longer true as an absolute. NPCI OC 226: "UPI PIN for transaction authentication (except UPI Lite and mandate execution)" and biometric "in lieu of UPI PIN ... up to Rs. 5,000". Fixes:
   - steps[2].teach → "To pay, you approve on your own phone, usually with your UPI PIN. Some apps also let you use fingerprint or face for small payments. Getting money never needs your PIN."
   - c4 → "A UPI payment is checked two ways: your registered phone, and an approval such as your UPI PIN." Sources: rbi-booklet plus the NPCI overview and OC 226. Drop rbi-upi123.
   - rule → "...You approve a payment on your phone, usually with your UPI PIN..."
   - item 15 stem → "To pay by UPI, you usually approve on your own phone by entering your UPI ___." (answer PIN still correct).
   - item 14 option a feedback → "Entering your PIN approves money going out. Getting a real refund needs no PIN."
   - The visual "Paying: Enter your UPI PIN" can stay; add "(or fingerprint/face, if set up)" if there is room.
3. **[MED] item upi-path-12 option b feedback** — wrong ratio (see Numbers). Fix: "That mixes up millions and billions. 16.58 billion is 16,580 million; over October's 31 days that is about 535 million a day."
4. **[LOW] item upi-path-12 answer + option a feedback** — fix: value 535; feedback "16.58 billion over October's 31 days is about 535 million payments a day." Option a text "About 535 million" (or keep "About 550 million" as the closest choice; range 500–570 is fine).
5. **[LOW] steps[0].hook stem "Your UPI ID looks like name@bank"** — the part after @ is the app/PSP handle, not always the bank. The booklet calls it a VPA "set by the user itself". NPCI also has numeric UPI IDs (OC 115F "Numeric UPI ID"). Fix: "Your UPI ID looks like name@handle. What is it really?"
6. **[LOW] c7, item 12** — dated figure. Fine as history, but say when. NPCI now reports far higher: "September-2026 ... 24,068.38" million. Fix stem: "In October 2024, UPI handled about 16.58 billion payments in one month..." Optional: switch to the latest NPCI month (24,068.38 million in Sept 2026 ÷ 30 = 802 million/day) and cite https://www.npci.org.in/product/upi/product-statistics.
7. **[LOW] steps[0].guided[1] option c feedback "You need a UPI app to pay."** — UPI123Pay lets feature-phone users pay without a smartphone app. RBI prid=53385: "UPI payment through pre-defined IVR numbers..." / "Missed Call ... The customer will receive an incoming call to authenticate the transaction by entering UPI PIN." Fix: "You still need a way to pay, like a UPI app. You skip her account number and IFSC."
8. **[LOW] c2 / steps[1] / item 9 option b** — "UPI moves money between bank accounts" is the main case, but UPI also carries PPI-wallet and credit-line payments (NPCI roles: PPIs are participants; PIB: "RuPay credit cards with UPI"). No change needed for a beginner card. Optional: in c2, say "usually between bank accounts".
9. **[LOW] item upi-path-11 / steps[1].teach "Your bank takes the money out, and the other bank puts it in"** — fine for customers. The booklet adds that interbank settlement happens later: "funds are credited to the beneficiary customer immediately, the inter-bank settlement is done later according to a pre-defined settlement cycle". No change needed.
10. **[LOW] sources** — (a) rbi-upi123 is cited for c4, the rule, item 11 and item 15, but only its missed-call line mentions a PIN. Replace it with NPCI overview https://www.npci.org.in/product/upi ("The first factor is the mobile number linked to the user's bank, and the second is the UPI PIN"). (b) Add NPCI fraud page https://www.npci.org.in/fraud-awareness to c5/m3/item 16. (c) Add NPCI OC 220 and OC 226. (d) Fix the rbi-booklet title to "Payment Systems in India – Booklet" (RBI, 25 Jan 2021).
11. **[LOW] item 16 option d feedback "The RBI says getting money never needs a PIN or a scan."** — the RBI text says "MPIN", not UPI PIN. Fix: "RBI and NPCI both say receiving money never needs a QR scan or your PIN." This rests on the NPCI fraud-page quote.

### Safety / medical wording
None medical. Money-safety: Problems 1 and 2 above (an outdated fraud pattern, and an overstated "only the PIN lets money leave"). With the fixes, the copy stays accurate and protective.

### Summary row
`| upi-path | 7 | 6 | 11 (2/1/8) |`


## phone-camera — How a phone camera takes a photo
Sources opened:
- nasa-camera → https://science.nasa.gov/science-research/science-enabling-technology/technology-highlights/technology-originally-developed-for-space-missions-now-integral-to-everyday-life/ → 200 (curl) → strong (NASA). Metadata ok (dated "Feb 24, 2026", "Last Updated Mar 03, 2026").
- nasa-phone → https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/Astrophotography_Guide.pdf → 200 (curl, pdftotext) → NASA education guide by Dr. Sten Odenwald (NASA Space Science Education Consortium); informal hobby guide but technically sound; moderate. Metadata ok (title "A Guide to Smartphone Astrophotography"; data "as of March 2020", URL path 2023/09).

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Each spot turns light into a signal; more light, bigger signal | nasa-phone §2.3 p.16 | "Photodiodes are semiconductor devices that can absorb photons and generate a current of electrons ... The voltage is directly proportional to the number of photons striking the device." | SUPPORTED |
| c2 | 1 red, 2 green, 1 blue per 2x2 patch | nasa-phone p.17 | "a filter that presents the array of pixels with a 2x2 patch containing 1 red, 2 green and 1 blue-sensitive filters called a Bayer mask" | SUPPORTED |
| c3 | Software works out full colour for every pixel | nasa-phone p.17-18 | "software running in the camera's CPU can actually use the Bayer color grid information to figure out or 'de-mosaic' the data and estimate the full color value for each pixel in the sensor array!" | SUPPORTED |
| c4 | Bigger opening, more light; light grows with area | nasa-phone §2.4.1 | "The area of the aperture is directly related to the number of photons of light that can be captured." / "the amount of light that can be gathered per unit time varies as the area of the aperture" | SUPPORTED |
| c5 | Higher ISO in dim light: brighter but grainy | nasa-phone §2.1, p.18, §2.4.4 | "it is this gain factor that you change when you vary the ISO value"; "If the ISO value is set too high, you will see the smooth sky and features of the object under low-light conditions break up into a grainy patina" | SUPPORTED |
| c6 | Almost all cameras use a CMOS sensor first made at JPL | nasa-camera | "Fossum ... develop[ed] the first CMOS active pixel image sensor." / "Although CMOS sensors existed in the 1990s, they produced too much noise..." / "Virtually all digital still and video cameras, including those on cell phones, employ them." | PARTLY — source says the CMOS *active-pixel* sensor was first made at JPL and that CMOS sensors already existed; "almost all cameras" should be "digital cameras" |
| c7 | Most phone cameras have a fixed opening | nasa-phone §2.1 | "Because the f/number of a smartphone is generally fixed at f/2" | SUPPORTED (f-number fixed on a fixed-focal-length lens = fixed opening) |

### Numbers and maths
- item phone-camera-9: quarter of the light → about a quarter of the signal (voltage ∝ photons). Correct only for the same exposure time; see Problem 2.
- item phone-camera-12: 12 M spots × 2/4 green = 6 M. OK. Answer 6, min 5.5, max 6.5 OK. Distractor b 12/3 = 4 M ("splits evenly in three") OK; c 12/4 = 3 M (red or blue share) OK.
- steps[1].guided[0]: 2 of 4 = half OK; red/blue each a quarter OK.
- steps[0].guided[0]: twice the light → about twice the signal (∝) OK.
- steps[2].guided[0]: twice the width → 2² = 4× area → 4× light OK (source: light ∝ area).
- steps[2].visual marks 20/85 qualitative, OK.

### Problems
1. **[MED] c6, item phone-camera-10 (stem, option a feedback, b and c feedback), hook** — "The CMOS image sensor was first made at NASA's JPL" overstates the source, which says "Although CMOS sensors existed in the 1990s" and credits JPL with "the first CMOS active pixel image sensor." Fix c6: "Almost all digital cameras, phone ones too, use a CMOS active-pixel sensor, a design first made at NASA's JPL." Item 10 stem: "Where was the CMOS active-pixel sensor, now in almost every phone camera, first developed?"; option a feedback: "The CMOS active-pixel sensor was developed at NASA's JPL in the 1990s and is now in virtually all digital cameras." b/c feedback: replace "The CMOS sensor came from/NASA's JPL did" with "This sensor design came from NASA's JPL."
2. **[MED] item phone-camera-9 option a** — "a quarter of the light gives about a quarter" is only true for the same exposure time; a phone in dim light normally lengthens exposure and raises ISO (source: "the exposure relation only involves ISO and exposure speed"). Fix stem: "…gets a quarter of the light it gets outdoors in the same exposure time. Predict each spot's signal." Option b feedback: "Most phone lenses have a fixed opening, so in the same time less light reaches each spot."
3. **[LOW] steps[2].guided[1] option a feedback** "so they boost ISO instead" — source gives two levers: "the exposure relation only involves ISO and exposure speed". Fix: "Right. Most phone cameras have a fixed opening, so they raise ISO or keep the shutter open longer instead."
4. **[LOW] steps[2].guided[1] hint** "Phone cameras are built thin." — no source says this is why the aperture is fixed. Fix: "Phone lenses are usually set at one f-number."
5. **[LOW] item phone-camera-15 option b feedback** "The lens opening is fixed." and steps[2] wording — absolute; source says "generally fixed". Fix: "On most phones the lens opening is fixed. Less light at night is the real change."
6. **[LOW] steps[2].hook option c feedback** "The pixel count stays the same." — no source; and many phones do combine (bin) neighbouring spots in low light, so this can be false. Fix: "Grain comes from boosting a weak signal, not from losing pixels."
7. **[LOW] phone-camera-16 (match)** — answer pairs a↔b and c↔d both ways; content fine, but no source quote for "A higher ISO → brighter but grainier" beyond c5 (supported). OK; just note the duplicated symmetric pairs may double-score.
8. **[LOW] item phone-camera-14 option c (misconception m2 "Lens stores the image")** — tagged m2 but the option is "The lens adds the colour"; tag mismatch. Fix: drop m2 tag or rename m2 "Lens makes the image/colour".

### Safety / medical wording
None found.

### Summary row
`| phone-camera | 7 | 6 | 8 (0/2/6) |`


## sky-colours — Blue sky and red sunsets
Sources opened:
- nasa-sky → https://science.nasa.gov/moon/eclipses/ → 200 (curl) → strong (NASA). Page title is "Eclipses and the Moon - NASA Science"; section "'Blood Moon': How It Works" exists. Metadata ok.
- nasa-light → https://assets.science.nasa.gov/content/dam/science/hpd/heat/Electromagnetic__Spectrum_Lesson_Helio%20Teachers.pdf → 200 (curl, pdftotext) → WEAK-ish: a middle-school lesson plan ("The Electromagnetic (EM) Spectrum, By Raphael Lucas", NASA HEAT); the "Why is the sky blue?" text sits in a reprinted "Visible Light Science Lesson" handout credited to `learning-center.homesciencetools.com` (a science-kit retailer). Metadata: JSON title "Visible Light Science Lesson" is the reprinted handout, not the document title; year 2023 not shown.
- nasa-rayleigh → https://www.giss.nasa.gov/edu/icp/research/ppa/1997/reyes/ → 200 (curl) → WEAK: "Written: August 1997: Maricela Reyes (student at Queens College)"; banner "This page's content is no longer actively maintained". Metadata should name the student author. Contains errors (e.g. "Mie scattering occurs when the size of the particle is on the order of the wavelength. Mie scattering works only for spherical particles").
- Stronger replacements opened this session:
  - nasa-vis → https://science.nasa.gov/ems/09_visiblelight/ → 200: "Violet has the shortest wavelength, at around 380 nanometers, and red has the longest wavelength, at around 700 nanometers."
  - hp-blusky → http://hyperphysics.phy-astr.gsu.edu/hbase/atmos/blusky.html → 200: "The water droplets that make up the cloud are much larger than the molecules of the air and the scattering from them is almost independent of wavelength in the visible range." Also: "Lord Rayleigh calculated the scattered intensity from dipole scatterers much smaller than the wavelength".
  - (tried https://spaceplace.nasa.gov/blue-sky/en/ → TLS error; https://scijinks.gov/clouds/ → proxy 502; not used.)

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Blue scatters more than red in air | nasa-light | "Shorter wavelengths, like blue, bump into the gas molecules and scatter in different directions." | SUPPORTED |
| c1 | | nasa-rayleigh | "Light in the blue part of the spectrum is more intensely scattered than in the red part by atmospheric molecules, hence we see a blue sky." | SUPPORTED (weak source) |
| c2 | Sunset light crosses more air, looks red/orange | nasa-light | "its light has to travel through a lot more atmosphere to reach us ... leaving us to see the beautiful reds and oranges" | SUPPORTED |
| c2 | | nasa-rayleigh | "sunsets and sunrises appear reddish because the shorter (blue) wavelengths in direct light are removed by scattering through the long path in the atmosphere" | SUPPORTED |
| c3 | Sunlight is a mix, violet to red, each with own wavelength | nasa-light | "Visible light consists of violet, indigo, blue, green, yellow, orange and red." / "Each of the colors that light is made of has its own wavelength" | SUPPORTED |
| c4 | Scattering ∝ 1/λ⁴ | nasa-rayleigh | "the amount of scattering is inversely proportional to the fourth power of the wavelength (λ -4 )" | SUPPORTED (weak source; scope: particles much smaller than λ) |
| c5 | Moon has no air, black sky in sunshine | nasa-light | "the sky above them was black as night even in bright sunshine ... Unlike the Moon, the Earth is surrounded by an atmosphere." | SUPPORTED |
| c6 | Cloud droplets scatter all colours about equally → white | nasa-rayleigh | "cloud droplets scatter all wavelengths of visible light in all directions" | PARTLY — "about equally" not stated; source's physics of size is wrong. Use hp-blusky: "scattering from them is almost independent of wavelength in the visible range" |
| c7 | Lunar eclipse: light filtered through Earth's air turns Moon red | nasa-sky | "the Moon appears red or orange because any sunlight that's not blocked by our planet is filtered through a thick slice of Earth's atmosphere on its way to the lunar surface." | SUPPORTED |

### Numbers and maths
- item sky-colours-11: (700/400)⁴ = 1.75⁴ = 9.38 → "about 9", feedback "about 9.4" OK. Answer 9.4, min 8.5, max 10.3 contains 9.38 OK. Option b 1.75 = plain ratio OK. Option c "about 3" = 1.75² = 3.06 ("squares the ratio") OK. Note: 400 nm and 700 nm are in no cited source (see Problem 2). With NASA's 380 nm violet the ratio would be 11.5×.
- steps[1].guided[0]: half the wavelength → 2⁴ = 16× OK; b 2×, c 4× (square) correctly wrong.
- steps[0].visual marks (15/55/90) qualitative ordering OK.
- item sky-colours-9: violet < blue < green < red OK (nasa-vis 380–700 nm).

### Problems
1. **[MED] sources nasa-rayleigh, nasa-light** — weak: 1997 student paper on an unmaintained page, and a lesson plan reprinting a retailer's handout. Fix: back c1, c2, c3 with nasa-sky (already cited; strong): "Sunlight appears white, but it actually contains a rainbow of components ... Blue light scatters relatively easily as it passes through Earth's atmosphere. Reddish light, on the other hand, travels more directly through the air." and "At sunrise and sunset ... incoming sunlight travels a longer, low-angle path through Earth's atmosphere ... only the yellow-to-red part of the spectrum reaches our eyes." Back c4 and c6 with hp-blusky (http://hyperphysics.phy-astr.gsu.edu/hbase/atmos/blusky.html). Correct nasa-rayleigh metadata to "M. Reyes (student paper), NASA GISS ICP, 1997" if kept.
2. **[MED] item sky-colours-11 stem; item sky-colours-9** — the figures "400 nm violet" and "700 nm red" and the ordering "violet shortest" are in no cited source. Add nasa-vis (https://science.nasa.gov/ems/09_visiblelight/): "Violet has the shortest wavelength, at around 380 nanometers, and red has the longest wavelength, at around 700 nanometers." Optional stem tweak: "…does 400 nm violet-blue light scatter than 700 nm red light?" (keeps the 9.4 answer while staying in range).
3. **[MED] c6, item sky-colours-12 (option a feedback "Cloud droplets are big")** — the cited GISS page says Mie scattering is for particles "on the order of the wavelength" and never says "about equally"; claim and "big" both rely on physics the source doesn't state. Fix sourceRefs to hp-blusky; feedback: "Cloud droplets are much bigger than air molecules, so they scatter every colour about the same, which looks white."
4. **[LOW] item sky-colours-16 option c feedback** "It bends through the air around Earth." — nasa-sky says "filtered through a thick slice of Earth's atmosphere"; bending not in source. Fix: "Light cannot pass through Earth's core. It passes through the air at Earth's edge."
5. **[LOW] steps[2].hook option c feedback** "Its distance barely changes." — true but unsourced; acceptable. Optional: "The Sun is the same distance away. Its light just crosses more air."
6. **[LOW] steps[0].example (prism)** — prism splitting is not in the cited lesson's sky text; nasa-vis supports it: "As the full spectrum of visible light travels through a prism, the wavelengths separate into the colors of the rainbow". Add nasa-vis to steps[0].sourceRefs.
7. **[LOW] concept gap** — items teach violet scatters ~9× more than red but never say why the sky isn't violet; a sharp learner will ask. Optional teach line (needs a source, e.g. HyperPhysics blusky page discusses sky colour) — or avoid by using blue (450 nm): (700/450)⁴ = 5.9×.

### Safety / medical wording
None found. (Optional: no item tells learners to look at the Sun; s3 "watch the evening Sun" from a train is fine, but avoid adding any "look directly at the Sun" tasks.)

### Summary row
`| sky-colours | 7 | 6 | 7 (0/3/4) |`


## pressure-cooker — Pressure cooker
Sources opened:
- gsu-pressure → http://hyperphysics.phy-astr.gsu.edu/hbase/thermo/precook.html → 200 (curl) → HyperPhysics (R. Nave, GSU), university teaching site; acceptable, moderate strength. Year "2025" not shown on page (no date); harmless.
- ncert-thermal → https://ncert.nic.in/textbook/pdf/keph203.pdf → 200 (curl, pdftotext) → strong. Metadata ok: "CHAPTER TEN THERMAL PROPERTIES OF MATTER", footer "Reprint 2026-27".
- csu-altitude → https://extension.colostate.edu/resource/high-elevation-food-preparation/ → 301 redirect to `.../high-elevation-food-preparation-guide/` → 200 → strong (university extension). Metadata ok ("Reviewed: October 2025", "Patricia Kendall"). Update URL to the redirect target.
- bis-cooker → https://archive.org/download/gov.in.is.2347.2006/is.2347.2006.pdf → 200 (redirects to archive.org mirror; pdftotext + page 5 rendered as image to confirm "½") → primary standard, but **superseded**: the Domestic Pressure Cooker (Quality Control) Order 2020 requires IS 2347:2017 (opened https://alephindia.in/pdf/new-qco/qco-domestic-pressure-cooker.pdf → 200, Gazette text: "Domestic Pressure Cooker   IS 2347 : 2017   Domestic Pressure Cooker-Specification"; also https://www.tuv.com/regulations-and-standards/en/india-domestic-pressure-cooker-quality-control-order-2020.html → 200: "Domestic pressure cookers shall comply with Indian Standard IS 2347:2017"). The 2017 text itself could not be fetched (services.bis.gov.in/tmp/1733907058.pdf → connection reset, then 404).

### Claims
| Claim | Text (short) | Source | Exact quote | Verdict |
|---|---|---|---|---|
| c1 | Water boils hotter when "the air above it has more push" | ncert-thermal | "Thus boiling point increases with increase in pressure." / "boiling point decreases with decrease in pressure." | SUPPORTED (wording: in a cooker it is steam pressure, not "air", see Problem 5) |
| c1 | | gsu-pressure | "the boiling point of water increases with pressure" | SUPPORTED |
| c2 | Cooker cooks faster because liquid/steam go above open-pot boil | ncert-thermal | "boiling point is increased inside a pressure cooker by increasing the pressure. Hence cooking is faster." | SUPPORTED |
| c2 | | gsu-pressure | "Food can be cooked faster in a pressure cooker since the boiling point of water increases with pressure." | SUPPORTED |
| c3 | Vents ~15 psi above air pressure, ~double, boils near 121°C | gsu-pressure | "It is typical for the pressure of venting to be about 15 pounds per square inch above atmospheric pressure. That raises the boiling point to about 121°C or 257 °F." / "a gauge pressure of 15 lb/in2 amounts to about a doubling of absolute pressure" | SUPPORTED |
| c4 | Lower pressure on hills; ~193°F ≈ 89°C at 10,000 ft | csu-altitude | Table 1 "10,000 ft. 193 °F"; "at 10,000 feet only 10.2 psi"; "The temperature at which water boils declines as elevation rises" | SUPPORTED (89°C is a correct conversion, not in source) |
| c4 | | ncert-thermal | "At high altitudes, atmospheric pressure is lower, reducing the boiling point of water as compared to that at sea level." | SUPPORTED |
| c5 | Temperature stays the same while boiling | ncert-thermal | "the temperature remains constant until the entire amount of the liquid is converted into vapour" / "Adding more heat to boiling water causes vaporisation, without increase in temperature." | SUPPORTED |
| c6 | Indian standard: free dead weight on vent + separate safety device | bis-cooker (2006) | 6.1 "Pressure regulation shall be effected by a free dead weight valve." 6.2 "In addition to a pressure regulating device, an independent safety relief device with separate and direct connection with the interior of the vessel shall be fitted." | SUPPORTED for IS 2347:2006 (superseded; 2017 not verified) |
| c7 | Fill ≤ 2/3, ≤ 1/2 for swelling foods like rice | bis-cooker (2006) | 10.5.1 (k) "Do not fill the unit over 2/3 full. When cooking foods that expand during cooking such as rice or dried vegetable, do not fill the unit over ½ full." (p. 5; "½" confirmed from page image, OCR shows "M") | SUPPORTED for 2006 edition (note: it is text the standard requires in the instruction manual) |

### Numbers and maths
- c3 / item 12: 15 psi gauge + 14.7 psi atm = 29.7 psi absolute; 29.7/14.7 = 2.02 → "about double" OK. 29.7 psi = 204.8 kPa; steam tables give saturation ≈ 120.9°C → "about 121°C" OK. 121°C = 249.8°F; HyperPhysics says 257°F (that is 125°C) — source's own °F is off, but the pack does not use it. OK.
- BIS nominal 1.0 kgf/cm² gauge = 98.07 kPa = 14.2 psi gauge (≈0.98 bar); absolute 199.4 kPa → ≈120.1°C. Consistent with "about 121°C"/"near 121°C". OK.
- item 12 answer value 29.7, min 29, max 30.5 → contains 29.7. OK. Option c "220 psi" = 15×14.7 = 220.5 ("That multiplies the numbers") OK. Option b 15 psi = gauge only, OK.
- c4 / s1 guided 1: 193°F → (193−32)×5/9 = 89.4°C → "about 89°C" OK. Hint "about 11 degrees below 100°C": 100−89.4 = 10.6 OK. Cross-check: CSU 10.2 psi = 70.3 kPa → saturation ≈ 90.0°C, consistent.
- s1 visual scale 89–121: 100°C at (100−89)/(121−89) = 34.4% → mark at 34 OK; 0 and 100 marks OK.
- s1 hook/teach "below 100°C" up high, "100°C: sea level" OK (CSU "Sea Level 212 °F").
- s2 hook c "About 200°C. Too high." OK.
- s1 guided 2 b "rises past 120°C" in open pot — wrong option, correctly wrong. OK.
- item 13 b feedback "keeps an open pot at 100°C" — true at sea level only. LOW (see Problem 6).
- item 16 / c7: ½ for rice, 2/3 general. Answer a correct; c correctly identified as general limit. OK.
- BIS lid release: 8.6 "shall not be able to release the lid ... unless the pressure inside has fallen below 0.18 kgf/cm² (18 kN/m² approximately) gauge" — consistent with s3 guided 2 hint. OK.

### Problems
1. **[MED] bis-cooker, c6, c7, item pressure-cooker-16, rule, s3** — Source is IS 2347:2006, which has been replaced; the mandatory standard under the 2020 Quality Control Order is IS 2347:2017 ("Domestic Pressure Cooker IS 2347 : 2017", Gazette, 22 Jan 2020). Items say "the Indian standard says…" as if current. 2017 text could not be opened to confirm the clauses still read the same. Fix: obtain and cite IS 2347:2017 (BIS / archive), or reword to "The 2006 Indian standard (IS 2347:2006) says…" and set source title to "IS 2347:2006 (superseded by IS 2347:2017)". Item 16 stem: "By the Indian standard's safety notes, how full may the cooker be?" only after re-verifying against 2017.
2. **[LOW] csu-altitude url** — redirects. Fix url to `https://extension.colostate.edu/resource/high-elevation-food-preparation-guide/`.
3. **[LOW] steps[2].guided[0] (vent must stay clear)** — fine and BIS-backed ("n) Always check the pressure release devices for clogging before use."), but item lacks the most relevant Indian-kitchen hazard. BIS 10.5.1(m): "Food items which tend to foam, froth, sputter are likely to block the pressure release device." Suggested feedback for option a: "Right. A clear vent lets the weight do its job. Frothy foods like dal can block it, so check it before cooking."
4. **[LOW] steps[2].guided[1] hint** "The lid is built to stay shut until pressure is low." — BIS 8.6 is a type test and lids "fastened by screw clamps or similar device ... are exempt from this requirement"; do not imply every lid is locked. Fix hint: "Open the lid only after the pressure has dropped." (BIS (p): "Do not open the pressure cooker until the unit has cooled and internal pressure has been reduced.")
5. **[LOW] c1 text / misconception m1 correction** — "when the air above it has more push": inside a cooker the extra pressure is from trapped steam, not air. Fix c1: "Water boils at a higher temperature when the pressure on it is higher."
6. **[LOW] item pressure-cooker-13 option b feedback** "Escaping steam keeps an open pot at 100°C" — only at sea level (CSU table). Fix: "An open pot can't boil above about 100°C, so it cooks more slowly."
7. **[LOW] steps[2].hook option c feedback** "The whistle is a side effect." — no source; fine physics. Optional: "The whistle is steam escaping. Its job is to hold the pressure steady."
8. **[LOW] gsu-pressure** — HyperPhysics is a teaching site (moderate). For c3, NCERT does not give 121°C; acceptable. BIS gives a stronger number for India: "The greatest nominal cooking pressure at which the cookers generally work is 1.0 kgf/cm² (100 kN/m² approximately) gauge" (8.5 note). Optional addition to s2 teach: "Indian cookers work at about 1 kgf/cm² (about 100 kPa) above outside pressure."

### Safety / medical wording
- item pressure-cooker-13 sets a pressure cooker in a "school cooking club". BIS 10.5.1(e): "Close supervision is necessary when the pressure cooker is used near children." Suggest "For a college cooking club…" or add "with an adult watching".
- Add a steam-burn note somewhere in s3 (NCERT: "This is why burns from steam are usually more serious than those from boiling water."): e.g. s3 teach end "Keep hands and face away from the vent when it whistles."
- Otherwise lid/forcing/shaking wording is safe.

### Summary row
`| pressure-cooker | 7 | 7 | 8 (0/1/7) |`


