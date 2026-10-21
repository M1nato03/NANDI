# Variety review: Health and nutrition

Topic file: `content/topics/topic.health-nutrition.json` (origin/main, 78d1a28).
Date: 2026-10-21. Report only; no app code or content JSON was changed.

Why this review: a learner said the questions for one idea "all feel the same".
The cause is the same here. Every concept in this topic has **2 claims and 8 items**.
So the 8 items keep re-asking 1-2 facts in new formats.
Spec 14 (teach first) needs 3 steps per concept, each on a different claim,
with at most 3 questions per step (3/3/2).

## Read this first: sources were NOT opened

This run's network policy blocked every health source host. Tried on 2026-10-21:
who.int, nhs.uk, health.nih.gov, ods.od.nih.gov, cdc.gov, heart.org,
nin.res.in, fssai.gov.in, pubmed.ncbi.nlm.nih.gov, doi.org, wikipedia.org.
curl got "CONNECT tunnel failed, response 403"; the fetch tool got "ENOTFOUND".

So, by the rule "fact accuracy over speed":
- **Part 1 (items, repeats, unbacked items)** is complete. It only needs the JSON.
- **Dead-link check** could not be done. No URL in the file was confirmed live or dead.
- **Proposed claims** are given as *candidates*. Each has a lead URL found by web
  search and the figure the search summary reported. **None is verified.**
  Status for each is "no source opened". Treat them as "no source found" until
  someone opens the page and copies the exact sentence.
- **Ready for 3 steps** is therefore "no" for every concept, even where the
  candidate claims look solid. Flip to "yes" after the quotes are checked.

To finish: allow these hosts in the environment's Network access settings
(or run from a machine that can reach them) and re-run this review's source step.

## Summary

| concept id | claims now | repeats found | claims proposed | ready for 3 steps? |
|---|---|---|---|---|
| protein-foods | 2 | 4 | 2 (c3, c4) candidates | no (sources not opened) |
| free-sugars | 2 | 5 | 2 (c3, c4) candidates | no (sources not opened) |
| hydration-cues | 2 | 5 | 2 (c3, c4) candidates | no (sources not opened) |
| sleep-recovery | 2 | 4 | 2 (c3, c4) candidates | no (sources not opened) |
| exercise-heart | 2 | 3 | 2 (c3, c4) candidates | no (sources not opened) |
| iron-and-anaemia | 2 | 3 | 2 (c3, c4) candidates | no (sources not opened) |
| food-label-reading | 2 | 4 | 2 (c3, c4) candidates | no (sources not opened) |
| fad-diet-claims | 2 | 4 | 2 (c3 split from c2, c4) candidates | no (sources not opened) |

"Repeats found" = items that test the same idea as an earlier item in the same concept.
No concept is ready today: all 8 have only 2 claims.
With the candidate claims checked, all 8 would reach 4 claims.

How to read each section:
- **Items**: one line per item, the idea it really tests.
- **Repeats**: groups of items that test the same idea.
- **No claim backs it**: items whose fact is in no claim (often only in the rule).
- **Proposed claims**: plain sentence, lead URL, figure reported by search. Not opened.
- **Steps**: title, claim taught, what the learner can do after, diagram, and which
  existing items fit (3/3/2). Items left over are the repeats to drop or rewrite.

Readability: candidate claims are written in short words and short sentences
(aim: Flesch 60+). Re-run the app's validator on the final wording.

---

## 1. protein-foods (Protein in everyday food)

Claims now: 2. c1 pulses are protein-rich plant foods. c2 cereals and pulses fill gaps in each other's amino acids.
Source: one source (`protein`, ICMR-NIN DGI 2024 PDF) for everything.

Items:
- protein-foods-1 predict: dal adds protein to rice (pulses = protein).
- protein-foods-2 scenario: millet + chana fill each other's gaps (pairing).
- protein-foods-3 choose: the guide's pair is cereal + pulse (pairing).
- protein-foods-4 why: a meal with no meat still has protein (pulses = protein).
- protein-foods-5 estimate: 1 g protein gives about 4 kcal (energy per gram).
- protein-foods-6 true-not-quite: dal adds protein and other amino acids (pulses = protein + pairing).
- protein-foods-7 order: cereal, then pulse, then see the mix (pairing).
- protein-foods-8 match: chana = pulse, rice = cereal (naming food groups).

Repeats:
- protein-foods-1 = protein-foods-4 = protein-foods-6 (pulses give protein).
- protein-foods-2 = protein-foods-3 = protein-foods-7 (cereal + pulse pair).

No claim backs it:
- protein-foods-5 (4 kcal per gram). No claim says this. Proposed c3 fixes that.
- protein-foods-8 (food group names) is only loosely backed by c1/c2.

Proposed claims (candidates, not opened):
- **protein-foods-c3**: "One gram of protein gives about 4 kcal of energy, the same as one gram of carbohydrate."
  - Lead: ICMR-NIN Dietary Guidelines for Indians 2024, https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf
  - Status: no source opened. The 4 kcal/g figure is a standard value; copy the exact line from the PDF.
- **protein-foods-c4**: "A healthy adult needs about 0.8 g of protein a day for each kilo of body weight. A 60 kg adult needs about 50 g."
  - Lead: ICMR-NIN, Nutrient Requirements for Indians 2020, brief note, https://www.nin.res.in/rdabook/brief_note.pdf
  - Search summary reported: "the RDA for protein is 0.83g/kg/day instead of 1g/kg/day (RDA 2010)".
  - Status: no source opened. Note: the same note reportedly says 1 g/kg for low-quality cereal-based diets. 60 x 0.83 = 49.8 g.
  - Not medical advice; keep it as a population average.

Steps:
1. **Pulses are a plant source of protein** (c1).
   Can do: name dal, chana and rajma as protein foods.
   Diagram: compare (rice: less protein / dal: more protein).
   Items: protein-foods-1, protein-foods-4, protein-foods-8.
2. **Cereal plus pulse fills the gaps** (c2).
   Can do: explain why dal-rice or millet-chana work as a pair.
   Diagram: flow (cereal + pulse -> fuller amino acid mix).
   Items: protein-foods-2, protein-foods-3, protein-foods-7.
3. **How much protein, and what it gives** (c4, with c3).
   Can do: estimate a day's protein need from body weight.
   Diagram: scale (0 -> 50 g a day for a 60 kg adult).
   Items: protein-foods-5, plus one new item on the 0.8 g/kg figure.
- Left over: protein-foods-6 (repeat of -1/-4). Drop it.

---

## 2. free-sugars (Free sugars)

Claims now: 2. c1 honey, syrups and juice sugars count as free sugars; whole fruit does not. c2 under 10% of energy, 5% may help more.

Items:
- free-sugars-1 predict: honey counts (definition).
- free-sugars-2 scenario: juice counts, whole orange does not (juice vs fruit).
- free-sugars-3 choose: syrup counts (definition).
- free-sugars-4 why: "no added sugar" with juice concentrate still has free sugars (definition).
- free-sugars-5 estimate: 10% of 2,000 kcal is about 50 g (limit in grams).
- free-sugars-6 true-not-quite: 10% is the limit, 5% a further aim (10% vs 5%).
- free-sugars-7 order: find the source, check the list, keep fruit apart (definition).
- free-sugars-8 match: juice = free sugar, orange = intrinsic (juice vs fruit).

Repeats:
- free-sugars-1 = free-sugars-3 = free-sugars-4 = free-sugars-7 (what counts as free sugar).
- free-sugars-2 = free-sugars-8 (juice yes, whole fruit no).

No claim backs it:
- free-sugars-5 (50 g) follows from c2 by arithmetic (2,000 x 10% / 4 kcal per g).
  The "4 kcal per gram" step is not in any claim. Fine if the rule's "about 50 g" is kept.

Proposed claims (candidates, not opened):
- **free-sugars-c3**: "Eating more free sugar raises the risk of tooth decay. WHO found more decay when free sugar went above 10% of energy."
  - Lead: WHO, Guideline: Sugars intake for adults and children (2015), https://www.who.int/publications/i/item/9789241549028
  - Search summary reported (from reprints of the WHO release): "higher rates of dental caries ... when free sugar intake is above 10% of total energy".
  - Status: no source opened.
- **free-sugars-c4**: "One can of sweet soft drink can hold about 40 g of sugar. That is around 10 teaspoons, close to a full day's limit."
  - Lead: WHO news release, 4 March 2015, "WHO calls on countries to reduce sugars intake among adults and children", https://www.who.int/news/item/04-03-2015-who-calls-on-countries-to-reduce-sugars-intake-among-adults-and-children
  - Search summary reported: "a single can of sugar-sweetened soda contains up to 40 g (around 10 teaspoons) of free sugars".
  - Status: no source opened (only reprints were seen). Say "up to" as WHO does.

Steps:
1. **Honey and juice count as free sugar** (c1).
   Can do: sort foods into free sugar or not.
   Diagram: compare (counts: sugar, honey, syrup, juice / does not: whole fruit, milk).
   Items: free-sugars-1, free-sugars-2, free-sugars-4.
2. **Keep it under 10% of the day** (c2, with c4 as the example).
   Can do: turn 10% into about 50 g, and see that one soft drink nearly fills it.
   Diagram: scale (0 g -> 25 g (5%) -> 50 g (10%); one can about 40 g).
   Items: free-sugars-5, free-sugars-6, plus one new item on the soft-drink can.
3. **Why the limit: teeth and more** (c3).
   Can do: say what the 10% limit protects against.
   Diagram: flow (free sugar -> mouth bacteria -> acid -> tooth decay).
   Items: one new item; reuse free-sugars-8 as review.
- Left over: free-sugars-3, free-sugars-7 (repeats of step 1). Drop or rewrite one for step 3.
- Note on the c3 diagram: the bacteria-acid chain is textbook dentistry but not in the WHO lead. Source it too, or use a compare diagram instead.

---

## 3. hydration-cues (Hydration cues)

Claims now: 2. c1 NHS: 6-8 cups a day is a guide, not a water-only rule. c2 tea, milk and food add fluid; heat and long activity raise needs.

Items:
- hydration-cues-1 predict: milk counts (other drinks count).
- hydration-cues-2 scenario: heat and long walks raise needs (needs change).
- hydration-cues-3 choose: tea and water-rich food add fluid (other drinks count).
- hydration-cues-4 why: "exactly 8 glasses of water" is too strict (guide not rule).
- hydration-cues-5 estimate: low end is 6 cups (the number).
- hydration-cues-6 true-not-quite: coffee counts (other drinks count).
- hydration-cues-7 order: start with range, count drinks and food, adjust for heat (all of c1+c2).
- hydration-cues-8 match: tea = adds fluid, heat = raises needs (restates c2).

Repeats:
- hydration-cues-1 = hydration-cues-3 = hydration-cues-6 (other drinks count).
- hydration-cues-2 = hydration-cues-8 (heat raises needs; -8 also repeats "tea counts").
- hydration-cues-4 = hydration-cues-5 in part (the 6-8 guide).

No claim backs it: none. All items rest on c1 or c2.

Proposed claims (candidates, not opened):
- **hydration-cues-c3**: "Pee colour is a simple check. Pale yellow is fine; dark yellow, strong-smelling pee can mean you need more to drink."
  - Lead: NHS, Dehydration, https://www.nhs.uk/conditions/dehydration/
  - Search summary reported (from NHS trust leaflets, not nhs.uk itself): "dark, strong-smelling urine" listed as a sign of dehydration; urine chart "Healthy pee" vs "Drink more".
  - Status: no source opened.
- **hydration-cues-c4**: "Fruit juice and smoothies count as fluid, but they are high in free sugar. NHS suggests no more than 150 ml a day."
  - Lead: NHS, Water, drinks and your health (the file's own `water` source), https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/
  - Status: no source found. The search did not confirm the 150 ml figure. Do not use until someone reads it on the page.
  - Bonus: links this concept to free-sugars (good interleaving).

Steps:
1. **Six to eight cups is a guide** (c1).
   Can do: use the range as a start, not a strict target.
   Diagram: scale (6 cups -> 8 cups, "more on hot or busy days").
   Items: hydration-cues-4, hydration-cues-5, hydration-cues-2.
2. **Many drinks and foods add fluid** (c2).
   Can do: count tea, milk, coffee and water-rich food.
   Diagram: compare (counts: water, tea, milk, coffee, curd, fruit / extra care: juice, sugary drinks).
   Items: hydration-cues-1, hydration-cues-3, hydration-cues-6.
3. **Check your pee colour** (c3; c4 as a bonus line if sourced).
   Can do: read pale vs dark pee as a sign to drink more.
   Diagram: scale (pale yellow -> dark yellow).
   Items: hydration-cues-7 (fits as recap); one new item on pee colour.
- Left over: hydration-cues-8 (repeat). Drop it.

---

## 4. sleep-recovery (Sleep and recovery)

Claims now: 2. c1 CDC: 7+ hours for adults 18-60. c2 NIH: stages cycle; more deep sleep early in the night.

Items:
- sleep-recovery-1 predict: the chart shows sleep changes through the night (stages).
- sleep-recovery-2 scenario: adults need 7+ hours, not 5 (hours).
- sleep-recovery-3 choose: deep sleep is longer in the first half (deep sleep early).
- sleep-recovery-4 why: several patterns because stages repeat (stages cycle).
- sleep-recovery-5 estimate: CDC's low end is 7 hours (hours).
- sleep-recovery-6 true-not-quite: a night has deep and REM sleep (stages).
- sleep-recovery-7 order: light, then deep, then REM (cycle order).
- sleep-recovery-8 match: CDC = 7+ hours, NIH = repeating stages (restates c1 + c2).

Repeats:
- sleep-recovery-1 = sleep-recovery-4 = sleep-recovery-6 (sleep has repeating stages).
- sleep-recovery-2 = sleep-recovery-5 (7+ hours).
- sleep-recovery-8 restates c1 and c2.

No claim backs it:
- sleep-recovery-7 (light -> deep -> REM order). c2 says stages cycle but not the order.
- Each claim cites both `sleep` and `cdc-sleep`. c1 is a CDC fact and c2 an NIH fact; split the refs.

Proposed claims (candidates, not opened):
- **sleep-recovery-c3**: "Teens aged 13 to 18 need more sleep than adults: 8 to 10 hours a night."
  - Lead: CDC, About Sleep (the file's own `cdc-sleep` source), https://www.cdc.gov/sleep/about/index.html
  - Status: no source opened. This age table is CDC's standard table; copy the row exactly.
  - Fits the app owner's age and the "earlier sleep" goal.
- **sleep-recovery-c4**: "One sleep cycle takes about 90 minutes. A night has four to six of them, and REM sleep gets longer near morning."
  - Lead: NIH NINDS, Brain Basics: Understanding Sleep, https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-understanding-sleep
  - Search summary reported (from older copies of the page): "The first REM sleep period usually occurs about 70 to 90 minutes after we fall asleep" and "a complete sleep cycle takes 90 to 110 minutes".
  - Status: no source opened. Wording may need "about 90 to 110 minutes". Also backs sleep-recovery-7.
- Considered and left out: "screens before bed delay sleep". Likely true, and on topic for this app,
  but I could not open a source. No source found.

Steps:
1. **How much sleep you need** (c1, with c3 for teens).
   Can do: name the hours for adults and teens.
   Diagram: scale (teens 8-10 h / adults 7+ h).
   Items: sleep-recovery-2, sleep-recovery-5, plus one new item on teen hours.
2. **Sleep runs in cycles** (c4).
   Can do: put light, deep and REM sleep in order, and see that a cycle repeats.
   Diagram: flow (light -> deep -> REM -> repeat, about 90 min).
   Items: sleep-recovery-7, sleep-recovery-4, sleep-recovery-6.
3. **Deep sleep comes early in the night** (c2).
   Can do: explain why the first hours of sleep matter, so a late bedtime costs deep sleep.
   Diagram: compare (first half: more deep sleep / second half: more REM).
   Items: sleep-recovery-3, sleep-recovery-1.
- Left over: sleep-recovery-8 (restates c1 + c2). Drop it.
- Copy check for step 3: say "costs some deep sleep", not a health warning.

---

## 5. exercise-heart (Exercise and the heart)

Claims now: 2. c1 WHO: 150-300 minutes of moderate activity a week. c2 regular movement helps the heart; some is better than none.

Items:
- exercise-heart-1 predict: a brisk walk is moderate activity (what counts).
- exercise-heart-2 scenario: below the range still helps (some > none).
- exercise-heart-3 choose: 150-300 minutes (the range).
- exercise-heart-4 why: repeated movement works the heart (regular movement).
- exercise-heart-5 estimate: low end is 150 minutes (the range).
- exercise-heart-6 true-not-quite: gentle 75 min is not vigorous 75 min (moderate vs vigorous).
- exercise-heart-7 order: muscles work, heart pumps, health gains (movement -> heart).
- exercise-heart-8 match: moderate 150-300, vigorous 75-150 (moderate vs vigorous).

Repeats:
- exercise-heart-3 = exercise-heart-5 (150-300 minutes).
- exercise-heart-4 = exercise-heart-7 (movement works the heart).
- exercise-heart-6 = exercise-heart-8 (vigorous counts double).

No claim backs it:
- exercise-heart-6 and exercise-heart-8 test the vigorous 75-150 figure. No claim has it. Proposed c3 fixes that.
- `who-activity` points at a WHO Europe publication landing page, not the text. Consider the WHO fact sheet instead (lead below).

Proposed claims (candidates, not opened):
- **exercise-heart-c3**: "Hard exercise counts double. WHO says 75 to 150 minutes of vigorous activity a week matches 150 to 300 of moderate."
  - Lead: WHO, Physical activity fact sheet, https://www.who.int/news-room/fact-sheets/detail/physical-activity
  - Also: WHO 2020 guidelines summary, Bull et al., Br J Sports Med 2020, https://bjsm.bmj.com/content/54/24/1451
  - Search summary reported: "150–300 min of moderate-intensity, or 75–150 min of vigorous-intensity physical activity per week".
  - Status: no source opened.
- **exercise-heart-c4**: "WHO also suggests muscle-strengthening work, like squats or push-ups, on 2 or more days a week."
  - Lead: same WHO fact sheet.
  - Search summary reported: "Muscle-strengthening activities should be done involving major muscle groups on 2 or more days a week."
  - Status: no source opened. Ties to the app's Train tab.
- Possible c5 (no source opened): "If you can talk but not sing, the effort is moderate." The CDC "talk test" is the usual lead.

Steps:
1. **Brisk walking counts; some beats none** (c2).
   Can do: spot moderate activity, and see that any amount helps.
   Diagram: flow (muscles work -> heart pumps harder -> regular habit -> fitter heart).
   Items: exercise-heart-1, exercise-heart-2, exercise-heart-7.
2. **Aim for 150 to 300 minutes a week** (c1, with c3).
   Can do: plan a week's minutes, and know hard effort counts double.
   Diagram: compare (moderate: 150-300 min / vigorous: 75-150 min).
   Items: exercise-heart-3, exercise-heart-6, exercise-heart-8.
3. **Add strength work twice a week** (c4).
   Can do: name a strength move and how often to do it.
   Diagram: scale (Mon ... Sun, 2 strength days marked).
   Items: two new items. None of the 8 test this.
- Left over: exercise-heart-4 (repeat of -7), exercise-heart-5 (repeat of -3). Rewrite one for step 3.

---

## 6. iron-and-anaemia (Iron and anaemia)

Claims now: 2. c1 vitamin C helps the body absorb plant (non-haem) iron. c2 low iron can cause anaemia; so can other diet gaps and infections.

Items:
- iron-and-anaemia-1 predict: lentils give non-haem iron (haem vs non-haem).
- iron-and-anaemia-2 scenario: vitamin C fruit helps absorb plant iron (vitamin C).
- iron-and-anaemia-3 choose: low iron is one cause of anaemia (many causes).
- iron-and-anaemia-4 why: haem and non-haem are absorbed differently (haem vs non-haem).
- iron-and-anaemia-5 estimate: mixed diet absorbs about 14% at the low end (absorption %).
- iron-and-anaemia-6 true-not-quite: beans alone will not fix all anaemia (many causes).
- iron-and-anaemia-7 order: plant iron -> vitamin C helps -> makes blood cells (whole chain).
- iron-and-anaemia-8 match: non-haem = plant iron, vitamin C = helps absorption (restates c1).

Repeats:
- iron-and-anaemia-2 = iron-and-anaemia-8 (vitamin C helps absorb).
- iron-and-anaemia-3 = iron-and-anaemia-6 (anaemia has many causes).
- iron-and-anaemia-1 = iron-and-anaemia-4 (haem vs non-haem).

No claim backs it:
- iron-and-anaemia-1, -4 (haem vs non-haem) and -5 (14%). No claim states the haem/non-haem split or the figure. Proposed c3 fixes that.
- iron-and-anaemia-7 step 3 ("iron helps make oxygen-carrying blood cells") is only in the rule.
- Every claim and item cites all 4 sources. Narrow each to the one that backs it.

Proposed claims (candidates, not opened):
- **iron-and-anaemia-c3**: "Iron from meat and fish (haem iron) is taken in more easily than iron from plants. From a mixed diet, the body absorbs about 14 to 18% of iron; from a plant-only diet, about 5 to 12%."
  - Lead: NIH ODS, Iron fact sheet (the file's own `nih-iron` source), https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/
  - Status: no source opened. These are the figures the existing item -5 already uses; confirm the exact line.
- **iron-and-anaemia-c4**: "Anaemia is common in India. About 57 in 100 women aged 15 to 49 had it in the 2019-21 national survey."
  - Lead: Lok Sabha answer citing NFHS-5, https://eparlib.nic.in/bitstream/123456789/1932251/1/AU5023.pdf
  - Search summary reported: "The prevalence of anaemia in women (15-49 years) across the country is 57.0 percent as per ... NFHS-5 (2019-21)".
  - Better lead to open: NFHS-5 India fact sheet, https://rchiips.org/nfhs/NFHS-5_FCTS/India.pdf
  - Status: no source opened.
- Considered: "tea or coffee with meals cuts iron absorption". Likely in NHS and ICMR-NIN, but no source opened. No source found.

Steps:
1. **Two kinds of iron** (c3).
   Can do: say which foods give haem and non-haem iron, and which is easier to absorb.
   Diagram: compare (haem: meat, fish, about 14-18% mixed diet / non-haem: dal, greens, about 5-12% plant diet).
   Items: iron-and-anaemia-1, iron-and-anaemia-4, iron-and-anaemia-5.
2. **Vitamin C helps plant iron in** (c1).
   Can do: pair dal or greens with lemon, amla or guava.
   Diagram: flow (plant iron + vitamin C -> more iron taken in -> red blood cells).
   Items: iron-and-anaemia-2, iron-and-anaemia-7, iron-and-anaemia-8.
3. **Anaemia is common and has many causes** (c2, with c4).
   Can do: explain why anaemia needs a test, not a guess from food.
   Diagram: flow (low iron / other diet gaps / infection -> anaemia).
   Items: iron-and-anaemia-3, iron-and-anaemia-6.
- No item left over. Keep the "not medical advice" line on step 3.

---

## 7. food-label-reading (Reading food labels)

Claims now: 2. c1 NHS: values per 100 g/100 ml, maybe per portion too. c2 ingredients go from most to least by weight.

Items:
- food-label-reading-1 predict: compare biscuits per 100 g (per-100 base).
- food-label-reading-2 scenario: sugar listed first is the biggest part (ingredient order).
- food-label-reading-3 fill-the-step: compare drinks per 100 ml (per-100 base).
- food-label-reading-4 why: less salt per serving but more per 100 g, because the serving is small (serving vs per 100).
- food-label-reading-5 estimate: high salt is above 1.5 g per 100 g (traffic-light cut-off).
- food-label-reading-6 true-not-quite: eat two servings, double the numbers (portion maths).
- food-label-reading-7 order: same nutrient, same base, then how much you eat (per-100 base).
- food-label-reading-8 match: per 100 g = comparison base, first ingredient = most (restates c1 + c2).

Repeats:
- food-label-reading-1 = food-label-reading-3 = food-label-reading-7 (compare on per-100).
- food-label-reading-4 = food-label-reading-6 (serving size changes the numbers).
- food-label-reading-8 restates c1 and c2.

No claim backs it:
- food-label-reading-5 (1.5 g salt per 100 g). Not in any claim. Proposed c3 fixes that.
- The concept is all UK (NHS). Indian packs follow FSSAI rules. Proposed c4 adds that.

Proposed claims (candidates, not opened):
- **food-label-reading-c3**: "A food is high in salt if it has more than 1.5 g per 100 g, and low if it has 0.3 g or less."
  - Lead: NHS, How to read food labels (the file's own `label` source), https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/how-to-read-food-labels/
  - Search summary reported (NHS Grampian and UK council copies of the same UK scheme): "High: more than 1.5g of salt per 100g. Low: 0.3g of salt or less per 100g."
  - Status: no source opened.
- **food-label-reading-c4**: "In India, packed foods must show energy, protein, carbs, sugar and fat per 100 g or 100 ml, and per serving."
  - Lead: FSSAI, Food Safety and Standards (Labelling and Display) Regulations, 2020, https://www.fssai.gov.in/upload/uploadfiles/files/Compendium_Labelling_Display_23_09_2021.pdf
  - Status: no source found. I could not open FSSAI or confirm the exact list of nutrients. Check before use.

Steps:
1. **Compare foods per 100 g** (c1).
   Can do: pick the fair line when two packs use different servings.
   Diagram: compare (pack A per 100 g / pack B per 100 g).
   Items: food-label-reading-1, food-label-reading-3, food-label-reading-4.
2. **First ingredient is the biggest** (c2).
   Can do: read an ingredient list and spot what the food is mostly made of.
   Diagram: scale (first = most ... last = least).
   Items: food-label-reading-2, plus one new item (e.g. a namkeen pack list).
3. **Spot high salt on a label** (c3; c4 for Indian packs).
   Can do: call a food high or low in salt from its per-100 g number.
   Diagram: scale (0.3 g low -> 1.5 g high, per 100 g).
   Items: food-label-reading-5, food-label-reading-6.
- Left over: food-label-reading-7 (repeat), food-label-reading-8 (restates). Drop one; rewrite one for step 2.

---

## 8. fad-diet-claims (Fad diet claims)

Claims now: 2. c1 ICMR-NIN: eat many food groups; no one food has it all. c2 two facts in one: the liver needs no detox diet, and WHO's 400 g fruit and veg.

Items:
- fad-diet-claims-1 predict: one food cannot give every nutrient (variety).
- fad-diet-claims-2 scenario: the liver does not need a detox diet (detox).
- fad-diet-claims-3 choose: variety of food groups over time (variety).
- fad-diet-claims-4 explain-it-back: "all carbs bad" bans useful cereals and pulses (variety).
- fad-diet-claims-5 estimate: 400 g fruit and veg a day (WHO figure).
- fad-diet-claims-6 true-not-quite: one vegetable cannot replace all groups (variety).
- fad-diet-claims-7 order: read the promise, look for missing groups, compare with a guide (checking a claim).
- fad-diet-claims-8 match: one food = no, detox = no (restates c1 + c2).

Repeats:
- fad-diet-claims-1 = fad-diet-claims-3 = fad-diet-claims-4 = fad-diet-claims-6 (variety).
- fad-diet-claims-8 restates fad-diet-claims-1 and fad-diet-claims-2.

No claim backs it:
- fad-diet-claims-7 (how to check a claim) is a method, not a fact. Fine as practice.
- Source note: `nhs-detox` is an NHS Devon page on *abnormal liver blood tests*. I could not open it to check it says the liver needs no detox diet. Check this; a general NHS page may fit better.

Proposed claims (candidates, not opened):
- **fad-diet-claims-c3** (split out of c2): "WHO advises at least 400 g of fruit and vegetables a day, about five portions."
  - Lead: WHO, Healthy diet fact sheet (the file's own `who-diet` source), https://www.who.int/news-room/fact-sheets/detail/healthy-diet
  - Status: no source opened. Item -5 already uses the figure. Leave c2 as the liver line only.
- **fad-diet-claims-c4**: "India's food guide draws a plate for the day: about half of it is vegetables and fruit, with cereals, pulses and milk filling the rest."
  - Lead: ICMR-NIN Dietary Guidelines for Indians 2024 ("My Plate for the Day"), https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf
  - Status: no source opened. The exact shares are in the PDF; copy them before use.

Steps:
1. **No one food has it all** (c1).
   Can do: spot a "one food does everything" claim.
   Diagram: compare (one food: gaps / many groups: gaps filled).
   Items: fad-diet-claims-1, fad-diet-claims-6, fad-diet-claims-4.
2. **Your liver needs no detox diet** (c2).
   Can do: answer a juice-cleanse poster calmly.
   Diagram: flow (normal food -> liver works every day -> no special menu needed).
   Items: fad-diet-claims-2, fad-diet-claims-7, fad-diet-claims-8.
3. **What a balanced plate looks like** (c4, with c3).
   Can do: sketch a day's plate with 400 g of fruit and vegetables.
   Diagram: compare (plate halves: veg and fruit / cereals, pulses, milk).
   Items: fad-diet-claims-5, fad-diet-claims-3.
- No item left over.

---

## Other things found while checking

- **Network blocked.** No source URL in this file could be opened, so none was checked for dead links.
  URLs to re-check: the 13 in `sources` across the 8 concepts (WHO healthy diet, WHO anaemia,
  WHO Europe activity publication, NHS water, NHS iron, NHS labels, NHS Devon liver, NIH healthy sleep,
  NIH ODS iron and vitamin C, CDC sleep, AHA activity, ICMR-NIN DGI 2024 PDF).
- **Blanket source refs.** sleep-recovery, exercise-heart, iron-and-anaemia and fad-diet-claims cite every
  source on every claim and item. A fact-check reader cannot tell which page backs which fact. Narrow them.
- **Double claim.** fad-diet-claims-c2 joins two unrelated facts (liver, 400 g). Split it (see c3 above).
- **WHO URL form.** free-sugars and fad-diet-claims use `who.int/en/news-room/...`. WHO's usual path has no `/en/`.
  It may redirect; check when the network is open.
- **Cross-concept link.** free-sugars c4 (soft drink) and hydration-cues c4 (juice limit) both teach that
  sweet drinks carry free sugar. Good for interleaving; keep the wording the same in both.
- **Questions with no matching claim today:** protein-foods-5 (4 kcal/g), sleep-recovery-7 (cycle order),
  exercise-heart-6/-8 (vigorous minutes), iron-and-anaemia-1/-4/-5 (haem vs non-haem, 14%),
  food-label-reading-5 (1.5 g salt). The candidate claims give each a home once their sources are opened.
